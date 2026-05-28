import redis
from app.core.config import settings

# Initialize Redis Client gracefully
redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
