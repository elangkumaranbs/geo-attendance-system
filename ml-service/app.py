from fastapi import FastAPI, HTTPException, File, UploadFile, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import custom modules
from models.face_encoder import FaceEncoder
from models.face_matcher import FaceMatcher
from utils.image_processor import ImageProcessor
from utils.db_helper import DatabaseHelper

# Initialize FastAPI app
app = FastAPI(
    title="Face Recognition ML Service",
    description="Face encoding and verification service for Geo-Enabled Attendance System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
face_encoder = FaceEncoder()
threshold = float(os.getenv('FACE_SIMILARITY_THRESHOLD', '0.70'))
face_matcher = FaceMatcher(threshold=threshold)
image_processor = ImageProcessor()
db_helper = DatabaseHelper()

# Pydantic models
class ExtractEmbeddingRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image")

class VerifyFaceRequest(BaseModel):
    userId: str = Field(..., description="User ID")
    image: str = Field(..., description="Base64 encoded image")

class CompareEmbeddingsRequest(BaseModel):
    embedding1: List[float] = Field(..., description="First embedding vector")
    embedding2: List[float] = Field(..., description="Second embedding vector")

# Health check endpoint
@app.get("/")
async def root():
    return {
        "success": True,
        "message": "Face Recognition ML Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {
        "success": True,
        "status": "healthy",
        "model_loaded": face_encoder.is_loaded(),
        "embedding_size": face_encoder.get_embedding_size()
    }

# Extract face embedding from image
@app.post("/extract-embedding")
async def extract_embedding(request: ExtractEmbeddingRequest):
    """
    Extract face embedding from a base64 encoded image
    """
    try:
        # Decode base64 image
        image = image_processor.decode_base64(request.image)
        
        # Validate image
        if not image_processor.is_valid_image(image):
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Detect face
        face_detected = face_encoder.detect_face(image)
        
        if face_detected is None:
            raise HTTPException(status_code=400, detail="No face detected in image")
        
        # Extract embedding
        embedding = face_encoder.extract_embedding(image)
        
        if embedding is None:
            raise HTTPException(status_code=400, detail="Failed to extract face embedding")
        
        # Calculate quality score
        quality_score = face_encoder.calculate_quality_score(face_detected)
        
        # Get face metadata
        metadata = {
            "face_size": {
                "width": int(face_detected[2] - face_detected[0]),
                "height": int(face_detected[3] - face_detected[1])
            },
            "detection_confidence": float(quality_score),
            "face_box": {
                "x1": int(face_detected[0]),
                "y1": int(face_detected[1]),
                "x2": int(face_detected[2]),
                "y2": int(face_detected[3])
            }
        }
        
        return {
            "success": True,
            "message": "Face embedding extracted successfully",
            "data": {
                "embedding": embedding.tolist(),
                "quality_score": float(quality_score),
                "face_detected": True,
                "metadata": metadata
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error in extract_embedding: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Verify face against stored embeddings
@app.post("/verify-face")
async def verify_face(request: VerifyFaceRequest):
    """
    Verify a face image against stored embeddings for a user using CNN-based FaceNet model
    """
    try:
        print(f"\n🔍 Face verification request for user: {request.userId}")
        
        # Get stored embeddings from database
        stored_embeddings = await db_helper.get_user_embeddings(request.userId)
        
        if not stored_embeddings:
            print(f"❌ No face embeddings found for user: {request.userId}")
            raise HTTPException(status_code=404, detail="No face embeddings found for this user. Please register your face first.")
        
        print(f"✅ Found {len(stored_embeddings)} stored face embedding(s) for user")
        
        # Decode base64 image
        image = image_processor.decode_base64(request.image)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Failed to decode image")
        
        # Validate image quality
        if not image_processor.is_valid_image(image):
            raise HTTPException(status_code=400, detail="Invalid image format or quality")
        
        # Extract embedding from captured image using CNN
        print("🤖 Extracting face embedding using FaceNet CNN model...")
        captured_embedding = face_encoder.extract_embedding(image)
        
        if captured_embedding is None:
            print("❌ No face detected in captured image")
            raise HTTPException(status_code=400, detail="No face detected in captured image. Please ensure your face is clearly visible.")
        
        print("✅ Face embedding extracted successfully")
        
        # Compare with all stored embeddings using cosine similarity
        similarities = []
        best_match = None
        best_similarity = 0.0
        
        print(f"📊 Comparing with {len(stored_embeddings)} stored patterns...")
        
        for idx, stored_emb in enumerate(stored_embeddings):
            similarity = face_matcher.calculate_similarity(
                captured_embedding,
                stored_emb['embedding']
            )
            similarities.append(similarity)
            
            print(f"   Pattern {idx + 1}: Similarity = {similarity:.4f} (Quality: {stored_emb.get('quality_score', 0):.2f})")
            
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = stored_emb
        
        # Calculate average similarity across all patterns
        avg_similarity = sum(similarities) / len(similarities) if similarities else 0.0
        
        # Adaptive threshold: use best match but consider average
        threshold = float(os.getenv('SIMILARITY_THRESHOLD', '0.70'))
        
        # Match if best similarity meets threshold
        is_match = best_similarity >= threshold
        
        print(f"\n📈 Verification Results:")
        print(f"   Best Similarity: {best_similarity:.4f}")
        print(f"   Avg Similarity: {avg_similarity:.4f}")
        print(f"   Threshold: {threshold}")
        print(f"   Match: {'✅ YES' if is_match else '❌ NO'}")
        
        return {
            "success": True,
            "message": "Face verification completed using CNN-based recognition",
            "data": {
                "match": is_match,
                "similarity": float(best_similarity),
                "avg_similarity": float(avg_similarity),
                "threshold": threshold,
                "matched_embedding_id": str(best_match['_id']) if best_match and is_match else None,
                "patterns_compared": len(stored_embeddings),
                "all_similarities": [float(s) for s in similarities]
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error in verify_face: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Compare two embeddings
@app.post("/compare-embeddings")
async def compare_embeddings(request: CompareEmbeddingsRequest):
    """
    Calculate similarity between two face embeddings
    """
    try:
        import numpy as np
        
        embedding1 = np.array(request.embedding1)
        embedding2 = np.array(request.embedding2)
        
        similarity = face_matcher.calculate_similarity(embedding1, embedding2)
        
        threshold = float(os.getenv('SIMILARITY_THRESHOLD', 0.85))
        is_match = similarity >= threshold
        
        return {
            "success": True,
            "data": {
                "similarity": float(similarity),
                "threshold": threshold,
                "match": is_match
            }
        }
        
    except Exception as e:
        print(f"Error in compare_embeddings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Get model information
@app.get("/model-info")
async def model_info():
    """
    Get information about the face recognition model
    """
    return {
        "success": True,
        "data": {
            "model_type": os.getenv('MODEL_TYPE', 'facenet'),
            "embedding_size": face_encoder.get_embedding_size(),
            "detection_model": os.getenv('FACE_DETECTION_MODEL', 'mtcnn'),
            "similarity_threshold": float(os.getenv('SIMILARITY_THRESHOLD', 0.85)),
            "distance_metric": os.getenv('DISTANCE_METRIC', 'cosine')
        }
    }

# Run the application
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"🚀 Starting Face Recognition ML Service on {host}:{port}")
    
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=os.getenv("ENVIRONMENT", "development") == "development"
    )
