"""
Input validation utilities for the Sovereign Financial Cockpit application.
Provides comprehensive validation for file uploads, user inputs, and API requests.
"""

import os
import re
import magic
from werkzeug.utils import secure_filename
from flask import request
from functools import wraps
from typing import Optional, List, Dict, Any

class ValidationError(Exception):
    """Custom exception for validation errors."""
    pass

class InputValidator:
    """Comprehensive input validation class."""
    
    # File type mappings with MIME types
    ALLOWED_FILE_TYPES = {
        'pdf': ['application/pdf'],
        'image': ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'],
        'document': ['application/pdf', 'application/msword', 
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    }
    
    # Maximum file sizes (in bytes)
    MAX_FILE_SIZES = {
        'pdf': 50 * 1024 * 1024,  # 50MB
        'image': 10 * 1024 * 1024,  # 10MB
        'document': 25 * 1024 * 1024  # 25MB
    }
    
    @staticmethod
    def validate_filename(filename: str) -> str:
        """
        Validate and sanitize filename.
        
        Args:
            filename: Original filename
            
        Returns:
            Sanitized filename
            
        Raises:
            ValidationError: If filename is invalid
        """
        if not filename:
            raise ValidationError("Filename cannot be empty")
        
        # Remove path components and ensure safe filename
        safe_filename = secure_filename(filename)
        
        if not safe_filename:
            raise ValidationError("Invalid filename")
        
        # Check for valid extension
        if '.' not in safe_filename:
            raise ValidationError("File must have an extension")
        
        extension = safe_filename.rsplit('.', 1)[1].lower()
        allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'doc', 'docx']
        
        if extension not in allowed_extensions:
            raise ValidationError(f"File extension '{extension}' not allowed")
        
        return safe_filename
    
    @staticmethod
    def validate_file_content(file_obj, expected_type: str = 'pdf') -> bool:
        """
        Validate file content using magic numbers.
        
        Args:
            file_obj: File object from request
            expected_type: Expected file type category
            
        Returns:
            True if valid
            
        Raises:
            ValidationError: If file content is invalid
        """
        if not file_obj:
            raise ValidationError("No file provided")
        
        # Read first 2048 bytes for magic number detection
        file_obj.seek(0)
        file_header = file_obj.read(2048)
        file_obj.seek(0)  # Reset file pointer
        
        try:
            # Detect MIME type
            detected_mime = magic.from_buffer(file_header, mime=True)
        except:
            # Fallback to basic validation if python-magic is not available
            return InputValidator._basic_file_validation(file_obj, expected_type)
        
        allowed_mimes = InputValidator.ALLOWED_FILE_TYPES.get(expected_type, [])
        
        if detected_mime not in allowed_mimes:
            raise ValidationError(
                f"File type mismatch. Expected {expected_type}, got {detected_mime}"
            )
        
        return True
    
    @staticmethod
    def _basic_file_validation(file_obj, expected_type: str) -> bool:
        """Basic file validation fallback when python-magic is not available."""
        file_obj.seek(0)
        header = file_obj.read(8)
        file_obj.seek(0)
        
        if expected_type == 'pdf':
            return header.startswith(b'%PDF-')
        elif expected_type == 'image':
            # Check for common image headers
            return (header.startswith(b'\x89PNG') or  # PNG
                   header.startswith(b'\xff\xd8\xff') or  # JPEG
                   header.startswith(b'GIF8'))  # GIF
        
        return True  # Allow if we can't validate
    
    @staticmethod
    def validate_file_size(file_obj, file_type: str = 'pdf') -> bool:
        """
        Validate file size.
        
        Args:
            file_obj: File object from request
            file_type: Type of file for size limits
            
        Returns:
            True if valid
            
        Raises:
            ValidationError: If file is too large
        """
        file_obj.seek(0, 2)  # Seek to end
        size = file_obj.tell()
        file_obj.seek(0)  # Reset
        
        max_size = InputValidator.MAX_FILE_SIZES.get(file_type, 10 * 1024 * 1024)
        
        if size > max_size:
            raise ValidationError(
                f"File too large. Maximum size: {max_size / 1024 / 1024:.1f}MB"
            )
        
        if size == 0:
            raise ValidationError("File is empty")
        
        return True
    
    @staticmethod
    def validate_text_input(text: str, field_name: str, 
                          min_length: int = 1, max_length: int = 1000,
                          pattern: Optional[str] = None) -> str:
        """
        Validate text input.
        
        Args:
            text: Input text
            field_name: Name of the field for error messages
            min_length: Minimum length
            max_length: Maximum length
            pattern: Optional regex pattern
            
        Returns:
            Sanitized text
            
        Raises:
            ValidationError: If text is invalid
        """
        if not isinstance(text, str):
            raise ValidationError(f"{field_name} must be a string")
        
        # Strip whitespace
        text = text.strip()
        
        if len(text) < min_length:
            raise ValidationError(f"{field_name} must be at least {min_length} characters")
        
        if len(text) > max_length:
            raise ValidationError(f"{field_name} must not exceed {max_length} characters")
        
        # Check for potential XSS/injection patterns
        dangerous_patterns = [
            r'<script[^>]*>.*?</script>',
            r'javascript:',
            r'on\w+\s*=',
            r'<iframe[^>]*>',
        ]
        
        for pattern_check in dangerous_patterns:
            if re.search(pattern_check, text, re.IGNORECASE):
                raise ValidationError(f"{field_name} contains potentially dangerous content")
        
        # Apply custom pattern if provided
        if pattern and not re.match(pattern, text):
            raise ValidationError(f"{field_name} format is invalid")
        
        return text
    
    @staticmethod
    def validate_coordinates(x: Any, y: Any) -> tuple:
        """
        Validate PDF coordinates.
        
        Args:
            x: X coordinate
            y: Y coordinate
            
        Returns:
            Tuple of validated coordinates
            
        Raises:
            ValidationError: If coordinates are invalid
        """
        try:
            x_val = float(x)
            y_val = float(y)
        except (ValueError, TypeError):
            raise ValidationError("Coordinates must be numeric")
        
        # PDF coordinate constraints (typical letter size)
        if not (0 <= x_val <= 612):  # Letter width in points
            raise ValidationError("X coordinate out of bounds (0-612)")
        
        if not (0 <= y_val <= 792):  # Letter height in points
            raise ValidationError("Y coordinate out of bounds (0-792)")
        
        return (x_val, y_val)


def validate_request(validation_rules: Dict[str, Dict]) -> callable:
    """
    Decorator for request validation.
    
    Args:
        validation_rules: Dictionary of field validation rules
        
    Example:
        @validate_request({
            'userName': {'type': 'text', 'min_length': 2, 'max_length': 50},
            'file': {'type': 'file', 'file_type': 'pdf'}
        })
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                # Validate based on content type
                if request.content_type and 'application/json' in request.content_type:
                    data = request.get_json(force=True)
                    _validate_json_data(data, validation_rules)
                else:
                    _validate_form_data(request, validation_rules)
                
                return f(*args, **kwargs)
            
            except ValidationError as e:
                return {'error': str(e)}, 400
            except Exception as e:
                return {'error': f'Validation failed: {str(e)}'}, 500
        
        return decorated_function
    return decorator


def _validate_json_data(data: Dict, rules: Dict):
    """Validate JSON data against rules."""
    if not data:
        raise ValidationError("Request body cannot be empty")
    
    for field, rule_set in rules.items():
        if rule_set.get('required', True) and field not in data:
            raise ValidationError(f"Required field '{field}' is missing")
        
        if field in data:
            value = data[field]
            
            if rule_set.get('type') == 'text':
                InputValidator.validate_text_input(
                    value, field,
                    rule_set.get('min_length', 1),
                    rule_set.get('max_length', 1000),
                    rule_set.get('pattern')
                )


def _validate_form_data(request_obj, rules: Dict):
    """Validate form data against rules."""
    for field, rule_set in rules.items():
        if rule_set.get('type') == 'file':
            if field not in request_obj.files:
                if rule_set.get('required', True):
                    raise ValidationError(f"Required file '{field}' is missing")
                continue
            
            file_obj = request_obj.files[field]
            
            if file_obj.filename == '':
                raise ValidationError(f"No file selected for '{field}'")
            
            # Validate filename
            InputValidator.validate_filename(file_obj.filename)
            
            # Validate file content and size
            file_type = rule_set.get('file_type', 'pdf')
            InputValidator.validate_file_content(file_obj, file_type)
            InputValidator.validate_file_size(file_obj, file_type)
        
        elif rule_set.get('type') == 'text':
            if field not in request_obj.form:
                if rule_set.get('required', True):
                    raise ValidationError(f"Required field '{field}' is missing")
                continue
            
            value = request_obj.form[field]
            InputValidator.validate_text_input(
                value, field,
                rule_set.get('min_length', 1),
                rule_set.get('max_length', 1000),
                rule_set.get('pattern')
            )


# Rate limiting decorator
def rate_limit(max_requests: int = 100, window_seconds: int = 3600):
    """
    Simple in-memory rate limiting decorator.
    
    Args:
        max_requests: Maximum requests allowed
        window_seconds: Time window in seconds
    """
    from collections import defaultdict
    import time
    
    request_counts = defaultdict(list)
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = request.remote_addr
            now = time.time()
            
            # Clean old requests
            request_counts[client_ip] = [
                req_time for req_time in request_counts[client_ip]
                if now - req_time < window_seconds
            ]
            
            # Check rate limit
            if len(request_counts[client_ip]) >= max_requests:
                return {'error': 'Rate limit exceeded'}, 429
            
            # Add current request
            request_counts[client_ip].append(now)
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator