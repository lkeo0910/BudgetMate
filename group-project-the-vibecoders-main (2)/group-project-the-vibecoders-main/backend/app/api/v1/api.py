from fastapi import APIRouter, Depends
from app.modules.auth.router import router as auth_router
from app.modules.users.user_router import router as users_me_router
from app.modules.users.category_router import router as categories_router
from app.modules.transactions.router import router as transactions_router
from app.modules.chatbot.router import router as chatbot_router
from app.modules.auth.deps import get_current_user_id

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_me_router, prefix="/users", tags=["users"], dependencies=[Depends(get_current_user_id)])
api_router.include_router(categories_router, prefix="/users/categories", tags=["categories"], dependencies=[Depends(get_current_user_id)])

# Register transactions module
api_router.include_router(
    transactions_router, 
    prefix="/transactions", 
    tags=["transactions"], 
    dependencies=[Depends(get_current_user_id)] # Protected route
)

# Register chatbot module
api_router.include_router(
    chatbot_router,
    prefix="/chatbot",
    tags=["chatbot"],
    dependencies=[Depends(get_current_user_id)]
)
