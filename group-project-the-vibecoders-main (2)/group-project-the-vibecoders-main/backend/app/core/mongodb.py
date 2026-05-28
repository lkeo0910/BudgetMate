import time
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from app.core.config import settings

logger = logging.getLogger(__name__)

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None
    
    _sync_client: MongoClient = None
    _sync_db = None

    def connect(self):
        # Async client (Motor)
        self.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            uuidRepresentation='standard'
        )
        self.db = self.client[settings.MONGODB_DB_NAME]
        
    def connect_sync(self):
        # Sync client (PyMongo)
        self._sync_client = MongoClient(
            settings.MONGODB_URL,
            uuidRepresentation='standard'
        )
        self._sync_db = self._sync_client[settings.MONGODB_DB_NAME]

    def close(self):
        if self.client:
            self.client.close()
        if self._sync_client:
            self._sync_client.close()

mongodb = MongoDB()

def get_mongodb_db():
    """Returns the ASYNC MongoDB database instance."""
    if mongodb.db is None:
        mongodb.connect()
    return mongodb.db

def get_sync_mongodb_db():
    """Returns the SYNC MongoDB database instance."""
    if mongodb._sync_db is None:
        mongodb.connect_sync()
    return mongodb._sync_db

def init_vector_index():
    """
    Initializes the MongoDB Vector Search index.
    Designed to run at startup.
    """
    db = get_sync_mongodb_db()
    
    # Ensure the collection exists before creating search indexes
    if "transactions_vector" not in db.list_collection_names():
        logger.info("Creating 'transactions_vector' collection...")
        db.create_collection("transactions_vector")

    collection = db["transactions_vector"]
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Check if index already exists
            existing_indexes = list(collection.list_search_indexes())
            for idx in existing_indexes:
                if idx.get('name') == 'vector_index':
                    logger.info("Dropping existing vector_index to apply new definition...")
                    collection.drop_search_index("vector_index")
                    time.sleep(2)
            
            logger.info("Initializing MongoDB Vector Search index with user_id filter...")
            collection.create_search_index(
                model={
                    "name": "vector_index",
                    "type": "vectorSearch",
                    "definition": {
                        "fields": [
                            {
                                "type": "vector",
                                "path": "vector",
                                "numDimensions": 768,
                                "similarity": "cosine"
                            },
                            {
                                "type": "filter",
                                "path": "user_id"
                            }
                        ]
                    }
                }
            )
            logger.info("Vector index creation initiated.")
            break
        except Exception as e:
            if attempt < max_retries - 1:
                logger.warning(f"Failed to init vector index (attempt {attempt+1}/{max_retries}): {e}. Retrying in 5s...")
                time.sleep(5)
            else:
                logger.error(f"Could not initialize vector index after {max_retries} attempts: {e}")
                logger.info("Vector search might be unavailable until the Atlas Local engine is ready.")
