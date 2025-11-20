import numpy as np
from scipy.spatial.distance import cosine, euclidean
import os

class FaceMatcher:
    """
    Face matching and similarity calculation
    """
    
    def __init__(self, threshold=None):
        self.distance_metric = os.getenv('DISTANCE_METRIC', 'cosine')
        self.threshold = threshold if threshold is not None else float(os.getenv('FACE_SIMILARITY_THRESHOLD', 0.70))
    
    def calculate_similarity(self, embedding1, embedding2):
        """
        Calculate similarity between two face embeddings
        
        Args:
            embedding1: numpy array or list
            embedding2: numpy array or list
            
        Returns:
            float: similarity score (0-1, higher is more similar)
        """
        try:
            # Convert to numpy arrays if needed
            if not isinstance(embedding1, np.ndarray):
                embedding1 = np.array(embedding1)
            if not isinstance(embedding2, np.ndarray):
                embedding2 = np.array(embedding2)
            
            # Ensure same dimensions
            if len(embedding1) != len(embedding2):
                raise ValueError(f"Embedding dimensions don't match: {len(embedding1)} vs {len(embedding2)}")
            
            # Calculate similarity based on chosen metric
            if self.distance_metric == 'cosine':
                # Cosine similarity (1 - cosine distance)
                distance = cosine(embedding1, embedding2)
                similarity = 1 - distance
            elif self.distance_metric == 'euclidean':
                # Convert Euclidean distance to similarity
                distance = euclidean(embedding1, embedding2)
                # Normalize to 0-1 range (assuming max distance is 4.0 for 512-D embeddings)
                similarity = max(0, 1 - (distance / 4.0))
            else:
                # Default to cosine
                distance = cosine(embedding1, embedding2)
                similarity = 1 - distance
            
            return float(similarity)
            
        except Exception as e:
            print(f"Error calculating similarity: {str(e)}")
            return 0.0
    
    def is_match(self, embedding1, embedding2, threshold=None):
        """
        Check if two embeddings match based on threshold
        
        Args:
            embedding1: numpy array or list
            embedding2: numpy array or list
            threshold: float, similarity threshold (default from env)
            
        Returns:
            bool: True if match, False otherwise
        """
        if threshold is None:
            threshold = self.threshold
        
        similarity = self.calculate_similarity(embedding1, embedding2)
        return similarity >= threshold
    
    def find_best_match(self, query_embedding, candidate_embeddings):
        """
        Find best matching embedding from a list of candidates
        
        Args:
            query_embedding: numpy array or list
            candidate_embeddings: list of numpy arrays or lists
            
        Returns:
            tuple: (best_match_index, similarity_score)
        """
        best_index = -1
        best_similarity = 0.0
        
        for i, candidate in enumerate(candidate_embeddings):
            similarity = self.calculate_similarity(query_embedding, candidate)
            
            if similarity > best_similarity:
                best_similarity = similarity
                best_index = i
        
        return best_index, best_similarity
    
    def find_all_matches(self, query_embedding, candidate_embeddings, threshold=None):
        """
        Find all matching embeddings above threshold
        
        Args:
            query_embedding: numpy array or list
            candidate_embeddings: list of numpy arrays or lists
            threshold: float, similarity threshold
            
        Returns:
            list: [(index, similarity), ...] sorted by similarity
        """
        if threshold is None:
            threshold = self.threshold
        
        matches = []
        
        for i, candidate in enumerate(candidate_embeddings):
            similarity = self.calculate_similarity(query_embedding, candidate)
            
            if similarity >= threshold:
                matches.append((i, similarity))
        
        # Sort by similarity (descending)
        matches.sort(key=lambda x: x[1], reverse=True)
        
        return matches
    
    def calculate_distance_matrix(self, embeddings):
        """
        Calculate pairwise distance matrix for a set of embeddings
        
        Args:
            embeddings: list of numpy arrays
            
        Returns:
            numpy array: distance matrix
        """
        n = len(embeddings)
        distance_matrix = np.zeros((n, n))
        
        for i in range(n):
            for j in range(i + 1, n):
                similarity = self.calculate_similarity(embeddings[i], embeddings[j])
                distance = 1 - similarity
                distance_matrix[i, j] = distance
                distance_matrix[j, i] = distance
        
        return distance_matrix
    
    def get_threshold(self):
        """Get current similarity threshold"""
        return self.threshold
    
    def set_threshold(self, threshold):
        """Set similarity threshold"""
        if 0 <= threshold <= 1:
            self.threshold = threshold
        else:
            raise ValueError("Threshold must be between 0 and 1")
