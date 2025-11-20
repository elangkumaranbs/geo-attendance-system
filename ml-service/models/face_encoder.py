import cv2
import numpy as np
from facenet_pytorch import MTCNN, InceptionResnetV1
import os
import torch
from PIL import Image
import torchvision.transforms as transforms

class FaceEncoder:
    """
    Face detection and embedding extraction using FaceNet CNN (InceptionResnetV1)
    - Uses MTCNN for face detection
    - Uses FaceNet (CNN-based) for generating 512-dimensional face embeddings
    - Pre-trained on VGGFace2 dataset for high accuracy
    """
    
    def __init__(self):
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.detector = MTCNN(keep_all=False, device=self.device)
        self.model = None
        self.embedding_size = 512
        self._load_model()
        
    def _load_model(self):
        """Load FaceNet CNN model (InceptionResnetV1)"""
        try:
            # Load pre-trained FaceNet CNN model trained on VGGFace2
            self.model = InceptionResnetV1(pretrained='vggface2').eval().to(self.device)
            print("✅ FaceNet CNN model loaded successfully (InceptionResnetV1 - VGGFace2)")
            print(f"   Device: {self.device.upper()}")
            print(f"   Embedding size: {self.embedding_size}D")
        except Exception as e:
            print(f"❌ Error loading FaceNet model: {str(e)}")
            self.model = None
    
    def is_loaded(self):
        """Check if model is loaded"""
        return self.model is not None
    
    def get_embedding_size(self):
        """Get embedding vector size"""
        return self.embedding_size
    
    def detect_face(self, image):
        """
        Detect face in image using MTCNN
        
        Args:
            image: numpy array (BGR format from OpenCV)
            
        Returns:
            tuple: (x1, y1, x2, y2) face bounding box or None
        """
        try:
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            # Convert to PIL Image
            pil_image = Image.fromarray(rgb_image)
            
            # Detect faces - returns boxes, probs
            boxes, probs = self.detector.detect(pil_image)
            
            if boxes is None or len(boxes) == 0:
                print("No face detected by MTCNN")
                return None
            
            # Get first face with highest confidence
            best_idx = np.argmax(probs)
            box = boxes[best_idx]
            
            # Convert to integer coordinates
            x1, y1, x2, y2 = [int(coord) for coord in box]
            
            print(f"✅ Face detected: box=({x1}, {y1}, {x2}, {y2}), confidence={probs[best_idx]:.3f}")
            return (x1, y1, x2, y2)
            
        except Exception as e:
            print(f"❌ Error in face detection: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def extract_embedding(self, image):
        """
        Extract face embedding from image
        
        Args:
            image: numpy array (BGR format)
            
        Returns:
            numpy array: face embedding vector (512-D) or None
        """
        try:
            if self.model is None:
                raise Exception("Model not loaded")
            
            # Detect face
            face_box = self.detect_face(image)
            
            if face_box is None:
                return None
            
            # Extract face region with padding
            x1, y1, x2, y2 = face_box
            # Add 10% padding around face
            padding = int((x2 - x1) * 0.1)
            x1 = max(0, x1 - padding)
            y1 = max(0, y1 - padding)
            x2 = min(image.shape[1], x2 + padding)
            y2 = min(image.shape[0], y2 + padding)
            
            face_img = image[y1:y2, x1:x2]
            
            if face_img.size == 0:
                print("❌ Empty face region")
                return None
            
            # Convert to RGB
            face_rgb = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
            
            # Convert to PIL Image
            face_pil = Image.fromarray(face_rgb)
            
            # Resize to 160x160 (FaceNet input size)
            face_resized = face_pil.resize((160, 160), Image.BILINEAR)
            
            # Transform to tensor
            transform = transforms.Compose([
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
            ])
            
            face_tensor = transform(face_resized).unsqueeze(0).to(self.device)
            
            # Extract embedding
            with torch.no_grad():
                embedding = self.model(face_tensor)
            
            # Convert to numpy array
            embedding_np = embedding.cpu().numpy().flatten()
            
            return embedding_np
            
        except Exception as e:
            print(f"Error in embedding extraction: {str(e)}")
            return None
    
    def calculate_quality_score(self, face_box):
        """
        Calculate face quality score based on face size and detection confidence
        
        Args:
            face_box: tuple (x1, y1, x2, y2)
            
        Returns:
            float: quality score (0-1)
        """
        try:
            x1, y1, x2, y2 = face_box
            face_width = x2 - x1
            face_height = y2 - y1
            
            # Calculate face area
            face_area = face_width * face_height
            
            # Normalize score based on minimum acceptable face size
            min_face_size = 80 * 80  # 80x80 pixels
            max_score_size = 200 * 200  # 200x200 pixels
            
            if face_area < min_face_size:
                return 0.5  # Low quality
            elif face_area >= max_score_size:
                return 1.0  # High quality
            else:
                # Linear interpolation
                score = 0.5 + 0.5 * (face_area - min_face_size) / (max_score_size - min_face_size)
                return min(score, 1.0)
                
        except Exception as e:
            print(f"Error calculating quality score: {str(e)}")
            return 0.5
    
    def extract_multiple_embeddings(self, images):
        """
        Extract embeddings from multiple images (batch processing)
        
        Args:
            images: list of numpy arrays
            
        Returns:
            list: embeddings or None for failed extractions
        """
        embeddings = []
        for image in images:
            embedding = self.extract_embedding(image)
            embeddings.append(embedding)
        return embeddings
