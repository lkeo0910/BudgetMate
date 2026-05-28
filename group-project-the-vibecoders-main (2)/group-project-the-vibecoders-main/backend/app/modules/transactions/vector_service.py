from uuid import UUID
from app.core.config import settings
from app.core.ai import embeddings
from app.core.mongodb import get_sync_mongodb_db

# For vector sync, we'll use a synchronous client to keep it simple in the service hooks
# though we could use motor if we make everything async. 
# Transactions service is currently synchronous.

def sync_transaction_to_vector(transaction_id: UUID, user_id: UUID, vendor: str, notes: str | None):
    if not settings.GOOGLE_API_KEY:
        return

    text_to_embed = f"Vendor: {vendor}. Notes: {notes or ''}"
    vector = embeddings.embed_query(text_to_embed)

    db = get_sync_mongodb_db()
    collection = db["transactions_vector"]
    collection.update_one(
        {"transaction_id": str(transaction_id)},
        {
            "$set": {
                "transaction_id": str(transaction_id),
                "user_id": str(user_id),
                "vendor": vendor,
                "notes": notes,
                "vector": vector
            }
        },
        upsert=True
    )

def delete_transaction_vector(transaction_id: UUID):
    db = get_sync_mongodb_db()
    collection = db["transactions_vector"]
    collection.delete_one({"transaction_id": str(transaction_id)})
