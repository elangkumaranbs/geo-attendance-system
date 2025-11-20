from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

class DatabaseHelper:
    """
    MongoDB database helper for face embeddings
    """
    
    def __init__(self):
        self.mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/geo_attendance')
        self.client = None
        self.db = None
        self._connect()
    
    def _connect(self):
        """Connect to MongoDB"""
        try:
            self.client = AsyncIOMotorClient(self.mongodb_uri)
            self.db = self.client.get_default_database()
            print("✅ Connected to MongoDB")
        except Exception as e:
            print(f"❌ Error connecting to MongoDB: {str(e)}")
    
    async def get_user_embeddings(self, user_id):
        """
        Get all active face embeddings for a user
        
        Args:
            user_id: str, user ID
            
        Returns:
            list: list of embedding documents
        """
        try:
            if self.db is None:
                return []
            
            cursor = self.db.face_embeddings.find({
                'userId': user_id,
                'status': 'active'
            })
            
            embeddings = await cursor.to_list(length=None)
            
            return embeddings
            
        except Exception as e:
            print(f"Error getting user embeddings: {str(e)}")
            return []
    
    async def save_embedding(self, user_id, embedding, metadata=None):
        """
        Save face embedding to database
        
        Args:
            user_id: str, user ID
            embedding: list or numpy array, face embedding
            metadata: dict, additional metadata
            
        Returns:
            str: inserted document ID or None
        """
        try:
            if self.db is None:
                return None
            
            # Convert numpy array to list if needed
            if hasattr(embedding, 'tolist'):
                embedding = embedding.tolist()
            
            document = {
                'userId': user_id,
                'embedding': embedding,
                'embedding_version': 'facenet_v1',
                'status': 'active',
                'metadata': metadata or {}
            }
            
            result = await self.db.face_embeddings.insert_one(document)
            
            return str(result.inserted_id)
            
        except Exception as e:
            print(f"Error saving embedding: {str(e)}")
            return None
    
    async def delete_embedding(self, embedding_id):
        """
        Delete (mark as deleted) a face embedding
        
        Args:
            embedding_id: str, embedding document ID
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if self.db is None:
                return False
            
            from bson import ObjectId
            
            result = await self.db.face_embeddings.update_one(
                {'_id': ObjectId(embedding_id)},
                {'$set': {'status': 'deleted'}}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            print(f"Error deleting embedding: {str(e)}")
            return False
    
    async def get_embedding_by_id(self, embedding_id):
        """
        Get embedding by ID
        
        Args:
            embedding_id: str, embedding document ID
            
        Returns:
            dict: embedding document or None
        """
        try:
            if self.db is None:
                return None
            
            from bson import ObjectId
            
            embedding = await self.db.face_embeddings.find_one({
                '_id': ObjectId(embedding_id)
            })
            
            return embedding
            
        except Exception as e:
            print(f"Error getting embedding: {str(e)}")
            return None
    
    async def count_user_embeddings(self, user_id):
        """
        Count active embeddings for a user
        
        Args:
            user_id: str, user ID
            
        Returns:
            int: count of embeddings
        """
        try:
            if self.db is None:
                return 0
            
            count = await self.db.face_embeddings.count_documents({
                'userId': user_id,
                'status': 'active'
            })
            
            return count
            
        except Exception as e:
            print(f"Error counting embeddings: {str(e)}")
            return 0
    
    def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
