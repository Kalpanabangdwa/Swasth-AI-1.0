"""Error handling utilities including circuit breaker and retry logic."""
import time
import asyncio
from typing import Callable, Any, Optional
from functools import wraps


class CircuitBreakerOpenError(Exception):
    """Exception raised when circuit breaker is open."""
    pass


class CircuitBreaker:
    """
    Circuit breaker pattern implementation for API calls.
    
    States:
    - closed: Normal operation, requests pass through
    - open: Too many failures, requests are blocked
    - half_open: Testing if service recovered
    """
    
    def __init__(self, failure_threshold: int = 3, timeout: int = 60):
        """
        Initialize circuit breaker.
        
        Args:
            failure_threshold: Number of failures before opening circuit
            timeout: Seconds to wait before attempting recovery
        """
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half_open
    
    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function with circuit breaker protection.
        
        Args:
            func: Function to execute
            *args: Positional arguments
            **kwargs: Keyword arguments
            
        Returns:
            Function result
            
        Raises:
            CircuitBreakerOpenError: If circuit is open
        """
        # Check if circuit is open
        if self.state == "open":
            if time.time() - self.last_failure_time > self.timeout:
                # Try to recover
                self.state = "half_open"
            else:
                raise CircuitBreakerOpenError(
                    f"Circuit breaker is open. Retry after {self.timeout} seconds."
                )
        
        try:
            result = func(*args, **kwargs)
            
            # Success - reset if we were in half_open state
            if self.state == "half_open":
                self.state = "closed"
                self.failure_count = 0
            
            return result
            
        except Exception as e:
            # Record failure
            self.failure_count += 1
            self.last_failure_time = time.time()
            
            # Open circuit if threshold exceeded
            if self.failure_count >= self.failure_threshold:
                self.state = "open"
            
            raise e
    
    async def call_async(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute async function with circuit breaker protection.
        
        Args:
            func: Async function to execute
            *args: Positional arguments
            **kwargs: Keyword arguments
            
        Returns:
            Function result
            
        Raises:
            CircuitBreakerOpenError: If circuit is open
        """
        # Check if circuit is open
        if self.state == "open":
            if time.time() - self.last_failure_time > self.timeout:
                self.state = "half_open"
            else:
                raise CircuitBreakerOpenError(
                    f"Circuit breaker is open. Retry after {self.timeout} seconds."
                )
        
        try:
            result = await func(*args, **kwargs)
            
            if self.state == "half_open":
                self.state = "closed"
                self.failure_count = 0
            
            return result
            
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            
            if self.failure_count >= self.failure_threshold:
                self.state = "open"
            
            raise e
    
    def reset(self):
        """Reset circuit breaker to closed state."""
        self.state = "closed"
        self.failure_count = 0
        self.last_failure_time = None


async def retry_with_backoff(
    func: Callable,
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    *args,
    **kwargs
) -> Any:
    """
    Retry function with exponential backoff.
    
    Delay formula: min(base_delay * (2 ** attempt), max_delay)
    
    Args:
        func: Function to retry (can be sync or async)
        max_retries: Maximum number of retry attempts
        base_delay: Initial delay in seconds
        max_delay: Maximum delay in seconds
        *args: Function arguments
        **kwargs: Function keyword arguments
        
    Returns:
        Function result
        
    Raises:
        Last exception if all retries fail
    """
    last_exception = None
    
    for attempt in range(max_retries):
        try:
            # Check if function is async
            if asyncio.iscoroutinefunction(func):
                return await func(*args, **kwargs)
            else:
                return func(*args, **kwargs)
                
        except Exception as e:
            last_exception = e
            
            # Don't sleep on last attempt
            if attempt < max_retries - 1:
                delay = min(base_delay * (2 ** attempt), max_delay)
                await asyncio.sleep(delay)
    
    # All retries failed
    raise last_exception


def with_retry(max_retries: int = 3, base_delay: float = 1.0):
    """
    Decorator for automatic retry with exponential backoff.
    
    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Initial delay in seconds
        
    Returns:
        Decorated function
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await retry_with_backoff(
                func, max_retries, base_delay, *args, **kwargs
            )
        return wrapper
    return decorator


class APIError(Exception):
    """Base exception for API errors."""
    
    def __init__(self, message: str, status_code: Optional[int] = None, details: Optional[dict] = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class HuggingFaceAPIError(APIError):
    """Exception for HuggingFace API errors."""
    pass


class ValidationError(APIError):
    """Exception for validation errors."""
    pass


class DatabaseError(APIError):
    """Exception for database errors."""
    pass


def create_error_response(error: Exception) -> dict:
    """
    Create standardized error response.
    
    Args:
        error: Exception object
        
    Returns:
        Error response dictionary
    """
    if isinstance(error, APIError):
        return {
            "error": error.__class__.__name__,
            "message": error.message,
            "details": error.details,
            "status_code": error.status_code
        }
    
    return {
        "error": "InternalError",
        "message": str(error),
        "details": {},
        "status_code": 500
    }
