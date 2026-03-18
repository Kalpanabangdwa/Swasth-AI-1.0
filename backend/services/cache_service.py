"""Caching service for analysis results."""
import hashlib
from cachetools import TTLCache
from typing import Optional, Dict


class CacheService:
    """Service for caching analysis results."""
    
    def __init__(self, maxsize: int = 100, ttl: int = 3600):
        """
        Initialize cache service.
        
        Args:
            maxsize: Maximum number of cached items
            ttl: Time to live in seconds (default 1 hour)
        """
        self.cache = TTLCache(maxsize=maxsize, ttl=ttl)
    
    def get_cache_key(self, text: str) -> str:
        """
        Generate cache key from text content.
        
        Args:
            text: Text content to hash
            
        Returns:
            SHA256 hash of the text
        """
        return hashlib.sha256(text.encode()).hexdigest()
    
    def get(self, text: str) -> Optional[Dict]:
        """
        Get cached analysis result.
        
        Args:
            text: Text content
            
        Returns:
            Cached result or None if not found
        """
        key = self.get_cache_key(text)
        return self.cache.get(key)
    
    def set(self, text: str, result: Dict) -> None:
        """
        Cache analysis result.
        
        Args:
            text: Text content
            result: Analysis result to cache
        """
        key = self.get_cache_key(text)
        self.cache[key] = result
    
    def clear(self) -> None:
        """Clear all cached items."""
        self.cache.clear()
    
    def get_stats(self) -> Dict:
        """
        Get cache statistics.
        
        Returns:
            Dictionary with cache stats
        """
        return {
            "size": len(self.cache),
            "maxsize": self.cache.maxsize,
            "ttl": self.cache.ttl,
            "currsize": self.cache.currsize
        }


# Global cache instance
analysis_cache = CacheService(maxsize=100, ttl=3600)
