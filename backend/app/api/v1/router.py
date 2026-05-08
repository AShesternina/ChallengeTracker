from fastapi import APIRouter

from app.api.v1.endpoints import auth, challenges, daily, notifications, reports, telegram, users

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(challenges.router)
api_router.include_router(daily.router)
api_router.include_router(reports.router)
api_router.include_router(notifications.router)
api_router.include_router(telegram.router)
