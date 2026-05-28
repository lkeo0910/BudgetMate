from uuid import UUID
from typing import List, Optional
from datetime import date
from sqlmodel import Session, select, or_
from fastapi import status
from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlmodel import paginate

from app.modules.transactions.models import Transaction
from app.modules.transactions.schemas import TransactionCreate, TransactionUpdate, TransactionFilters
from app.shared.exception.transaction_exception import TransactionNotFoundException
from app.modules.transactions.vector_service import sync_transaction_to_vector, delete_transaction_vector

def create_transaction(session: Session, user_id: UUID, data: TransactionCreate) -> Transaction:
    db_obj = Transaction(**data.model_dump(), user_id=user_id)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    
    # Sync to vector DB
    sync_transaction_to_vector(db_obj.id, user_id, db_obj.vendor, db_obj.notes)
    
    return db_obj

def _apply_filters(
    statement,
    filters: TransactionFilters
):
    # 1. Search Query (vendor, notes)
    if filters.search:
        search_query = f"%{filters.search}%"
        statement = statement.where(
            or_(
                Transaction.vendor.ilike(search_query),
                Transaction.notes.ilike(search_query)
            )
        )
    
    # 2. Match exact type
    if filters.type:
        statement = statement.where(Transaction.type == filters.type)

    # 3. Match category_ids
    if filters.category_ids:
        cat_ids = [UUID(cid.strip()) for cid in filters.category_ids.split(",") if cid.strip()]
        if cat_ids:
            statement = statement.where(Transaction.category_id.in_(cat_ids))

    # 4. Date ranges
    if filters.date_from:
        statement = statement.where(Transaction.date >= filters.date_from)
    if filters.date_to:
        statement = statement.where(Transaction.date <= filters.date_to)

    # 5. Amount ranges
    if filters.min_amount is not None:
        statement = statement.where(Transaction.amount >= filters.min_amount)
    if filters.max_amount is not None:
        statement = statement.where(Transaction.amount <= filters.max_amount)
    
    return statement

def get_transactions(
    session: Session,
    user_id: UUID,
    filters: TransactionFilters
):
    # Build base query
    statement = select(Transaction).where(Transaction.user_id == user_id)
    
    # Apply filters
    statement = _apply_filters(statement, filters)

    # Apply ordering
    sort_column = getattr(Transaction, filters.order_by)
    if filters.order == "desc":
        if filters.order_by == "date":
            statement = statement.order_by(Transaction.date.desc(), Transaction.created_at.desc())
        else:
            statement = statement.order_by(sort_column.desc())
    else:
        if filters.order_by == "date":
            statement = statement.order_by(Transaction.date.asc(), Transaction.created_at.asc())
        else:
            statement = statement.order_by(sort_column.asc())
    
    # If no page is provided, return all as a single page
    if filters.page is None:
        items = session.exec(statement).all()
        return Page(
            items=items,
            total=len(items),
            page=1,
            size=len(items) if items else 20,
            pages=1
        )

    # Use explicit pagination params from the filters schema
    params = Params(page=filters.page, size=filters.size or 20)
    return paginate(session, statement, params=params)

def get_transaction_by_id(session: Session, transaction_id: UUID, user_id: UUID) -> Transaction:
    statement = select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user_id)
    transaction = session.exec(statement).first()
    if not transaction:
        raise TransactionNotFoundException()
    return transaction

def update_transaction(session: Session, transaction_id: UUID, user_id: UUID, data: TransactionUpdate) -> Transaction:
    statement = select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user_id)
    transaction = session.exec(statement).first()
    
    if not transaction:
        raise TransactionNotFoundException()

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(transaction, key, value)
        
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    
    # Sync to vector DB
    sync_transaction_to_vector(transaction.id, user_id, transaction.vendor, transaction.notes)
    
    return transaction

def delete_transaction(session: Session, transaction_id: UUID, user_id: UUID):
    statement = select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user_id)
    transaction = session.exec(statement).first()
    
    if not transaction:
        raise TransactionNotFoundException()
        
    session.delete(transaction)
    session.commit()
    
    # Delete from vector DB
    delete_transaction_vector(transaction_id)
