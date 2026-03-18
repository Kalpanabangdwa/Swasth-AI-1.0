"""Encryption utilities for sensitive health data."""
import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from dotenv import load_dotenv

load_dotenv()

# Get encryption key from environment or generate one
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    # Generate a key for development (should be set in production)
    ENCRYPTION_KEY = Fernet.generate_key().decode()
    print(f"Warning: Using generated encryption key. Set ENCRYPTION_KEY in .env for production.")

# Create Fernet cipher
cipher = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)


def encrypt_data(data: str) -> str:
    """
    Encrypt sensitive data.
    
    Args:
        data: Plain text data to encrypt
        
    Returns:
        Base64 encoded encrypted data
    """
    if not data:
        return data
    
    encrypted = cipher.encrypt(data.encode())
    return base64.b64encode(encrypted).decode()


def decrypt_data(encrypted_data: str) -> str:
    """
    Decrypt sensitive data.
    
    Args:
        encrypted_data: Base64 encoded encrypted data
        
    Returns:
        Decrypted plain text data
    """
    if not encrypted_data:
        return encrypted_data
    
    try:
        decoded = base64.b64decode(encrypted_data.encode())
        decrypted = cipher.decrypt(decoded)
        return decrypted.decode()
    except Exception as e:
        print(f"Decryption error: {e}")
        return encrypted_data  # Return as-is if decryption fails


def encrypt_file_content(content: bytes) -> str:
    """
    Encrypt file content (for storing PDFs).
    
    Args:
        content: Raw file bytes
        
    Returns:
        Base64 encoded encrypted content
    """
    encrypted = cipher.encrypt(content)
    return base64.b64encode(encrypted).decode()


def decrypt_file_content(encrypted_content: str) -> bytes:
    """
    Decrypt file content.
    
    Args:
        encrypted_content: Base64 encoded encrypted content
        
    Returns:
        Decrypted file bytes
    """
    try:
        decoded = base64.b64decode(encrypted_content.encode())
        decrypted = cipher.decrypt(decoded)
        return decrypted
    except Exception as e:
        print(f"File decryption error: {e}")
        return b""
