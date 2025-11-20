import cv2
import numpy as np
import base64
from PIL import Image
import io
import os

class ImageProcessor:
    """
    Image processing utilities for face recognition
    """
    
    def __init__(self):
        self.max_image_size = int(os.getenv('MAX_IMAGE_SIZE', 2048))
        self.allowed_formats = ['jpg', 'jpeg', 'png']
    
    def decode_base64(self, base64_string):
        """
        Decode base64 string to image
        
        Args:
            base64_string: str, base64 encoded image
            
        Returns:
            numpy array: decoded image in BGR format
        """
        try:
            # Remove data URL prefix if present
            if 'base64,' in base64_string:
                base64_string = base64_string.split('base64,')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(base64_string)
            
            # Convert to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            
            # Decode image
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            return image
            
        except Exception as e:
            print(f"Error decoding base64 image: {str(e)}")
            return None
    
    def encode_base64(self, image):
        """
        Encode image to base64 string
        
        Args:
            image: numpy array (BGR format)
            
        Returns:
            str: base64 encoded string
        """
        try:
            # Encode image to jpg
            _, buffer = cv2.imencode('.jpg', image)
            
            # Convert to base64
            base64_string = base64.b64encode(buffer).decode('utf-8')
            
            return base64_string
            
        except Exception as e:
            print(f"Error encoding image to base64: {str(e)}")
            return None
    
    def is_valid_image(self, image):
        """
        Check if image is valid
        
        Args:
            image: numpy array
            
        Returns:
            bool: True if valid, False otherwise
        """
        if image is None:
            print("❌ Image is None")
            return False
        
        if not isinstance(image, np.ndarray):
            print(f"❌ Image is not numpy array, got {type(image)}")
            return False
        
        if len(image.shape) != 3:
            print(f"❌ Image shape invalid: {image.shape}, expected 3 dimensions")
            return False
        
        if image.shape[2] != 3:
            print(f"❌ Image channels invalid: {image.shape[2]}, expected 3 (BGR)")
            return False
        
        print(f"✅ Valid image: {image.shape}")
        return True
    
    def resize_image(self, image, max_size=None):
        """
        Resize image maintaining aspect ratio
        
        Args:
            image: numpy array
            max_size: int, maximum dimension
            
        Returns:
            numpy array: resized image
        """
        try:
            if max_size is None:
                max_size = self.max_image_size
            
            height, width = image.shape[:2]
            
            # Check if resize needed
            if max(height, width) <= max_size:
                return image
            
            # Calculate new dimensions
            if height > width:
                new_height = max_size
                new_width = int(width * (max_size / height))
            else:
                new_width = max_size
                new_height = int(height * (max_size / width))
            
            # Resize
            resized = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
            
            return resized
            
        except Exception as e:
            print(f"Error resizing image: {str(e)}")
            return image
    
    def enhance_image(self, image):
        """
        Apply image enhancement (brightness, contrast, sharpness)
        
        Args:
            image: numpy array
            
        Returns:
            numpy array: enhanced image
        """
        try:
            # Convert to LAB color space
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            
            # Split channels
            l, a, b = cv2.split(lab)
            
            # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            l = clahe.apply(l)
            
            # Merge channels
            enhanced_lab = cv2.merge([l, a, b])
            
            # Convert back to BGR
            enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
            
            return enhanced
            
        except Exception as e:
            print(f"Error enhancing image: {str(e)}")
            return image
    
    def normalize_lighting(self, image):
        """
        Normalize lighting conditions
        
        Args:
            image: numpy array
            
        Returns:
            numpy array: normalized image
        """
        try:
            # Convert to YCrCb
            ycrcb = cv2.cvtColor(image, cv2.COLOR_BGR2YCrCb)
            
            # Equalize the histogram of the Y channel
            ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])
            
            # Convert back to BGR
            normalized = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)
            
            return normalized
            
        except Exception as e:
            print(f"Error normalizing lighting: {str(e)}")
            return image
    
    def crop_face(self, image, face_box, margin=0.2):
        """
        Crop face from image with margin
        
        Args:
            image: numpy array
            face_box: tuple (x1, y1, x2, y2)
            margin: float, margin around face (0-1)
            
        Returns:
            numpy array: cropped face image
        """
        try:
            x1, y1, x2, y2 = face_box
            
            # Calculate margin
            width = x2 - x1
            height = y2 - y1
            
            margin_x = int(width * margin)
            margin_y = int(height * margin)
            
            # Add margin
            x1 = max(0, x1 - margin_x)
            y1 = max(0, y1 - margin_y)
            x2 = min(image.shape[1], x2 + margin_x)
            y2 = min(image.shape[0], y2 + margin_y)
            
            # Crop
            cropped = image[y1:y2, x1:x2]
            
            return cropped
            
        except Exception as e:
            print(f"Error cropping face: {str(e)}")
            return image

import os
