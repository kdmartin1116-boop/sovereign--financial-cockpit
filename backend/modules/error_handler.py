"""
Centralized error handling system for the Sovereign Financial Cockpit.
Provides consistent error responses and logging.
"""

import logging
import traceback
from datetime import datetime
from typing import Dict, Any, Optional
from flask import jsonify, request, current_app
from functools import wraps

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class APIError(Exception):
    """Base class for API exceptions."""
    
    def __init__(self, message: str, status_code: int = 400, payload: Optional[Dict] = None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload or {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for JSON response."""
        rv = dict(self.payload)
        rv['error'] = self.message
        rv['status'] = 'error'
        rv['timestamp'] = datetime.utcnow().isoformat()
        return rv

class ValidationError(APIError):
    """Exception for input validation errors."""
    
    def __init__(self, message: str, field: Optional[str] = None):
        super().__init__(message, 400)
        if field:
            self.payload['field'] = field

class FileProcessingError(APIError):
    """Exception for file processing errors."""
    
    def __init__(self, message: str, filename: Optional[str] = None):
        super().__init__(message, 422)
        if filename:
            self.payload['filename'] = filename

class DatabaseError(APIError):
    """Exception for database operations."""
    
    def __init__(self, message: str = "Database operation failed"):
        super().__init__(message, 500)

class AuthenticationError(APIError):
    """Exception for authentication failures."""
    
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, 401)

class AuthorizationError(APIError):
    """Exception for authorization failures."""
    
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message, 403)

class ConfigurationError(APIError):
    """Exception for configuration issues."""
    
    def __init__(self, message: str = "Server configuration error"):
        super().__init__(message, 500)

def handle_api_error(error: APIError):
    """Handle API errors and return JSON response."""
    logger.error(f"API Error: {error.message} - Status: {error.status_code}")
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

def handle_generic_error(error: Exception):
    """Handle unexpected errors."""
    error_id = datetime.utcnow().strftime('%Y%m%d%H%M%S')
    
    logger.error(f"Unexpected error [{error_id}]: {str(error)}")
    logger.error(f"Traceback [{error_id}]: {traceback.format_exc()}")
    
    if current_app.debug:
        # In debug mode, return detailed error info
        response_data = {
            'error': str(error),
            'status': 'error',
            'error_id': error_id,
            'traceback': traceback.format_exc().split('\n'),
            'timestamp': datetime.utcnow().isoformat()
        }
    else:
        # In production, return generic error message
        response_data = {
            'error': 'An internal server error occurred',
            'status': 'error',
            'error_id': error_id,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    response = jsonify(response_data)
    response.status_code = 500
    return response

def error_handler(f):
    """
    Decorator to handle exceptions in route functions.
    
    Usage:
        @error_handler
        @app.route('/api/endpoint')
        def my_endpoint():
            # Your code here
            pass
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except APIError as e:
            return handle_api_error(e)
        except Exception as e:
            return handle_generic_error(e)
    
    return decorated_function

def log_request(f):
    """Decorator to log API requests."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = datetime.utcnow()
        
        # Log request
        logger.info(f"Request: {request.method} {request.path} - IP: {request.remote_addr}")
        
        try:
            result = f(*args, **kwargs)
            
            # Log successful response
            duration = (datetime.utcnow() - start_time).total_seconds()
            logger.info(f"Response: {request.method} {request.path} - Success in {duration:.3f}s")
            
            return result
        
        except Exception as e:
            # Log error
            duration = (datetime.utcnow() - start_time).total_seconds()
            logger.error(f"Response: {request.method} {request.path} - Error in {duration:.3f}s: {str(e)}")
            raise
    
    return decorated_function

def safe_file_operation(operation_name: str):
    """
    Decorator for safe file operations with proper cleanup.
    
    Args:
        operation_name: Name of the operation for logging
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            temp_files = []
            
            try:
                logger.info(f"Starting file operation: {operation_name}")
                
                # Execute the wrapped function
                result = f(*args, **kwargs)
                
                logger.info(f"Completed file operation: {operation_name}")
                return result
                
            except Exception as e:
                logger.error(f"Error in file operation '{operation_name}': {str(e)}")
                raise FileProcessingError(f"File operation failed: {operation_name}")
                
            finally:
                # Clean up temporary files
                for temp_file in temp_files:
                    try:
                        if temp_file and os.path.exists(temp_file):
                            os.remove(temp_file)
                            logger.debug(f"Cleaned up temporary file: {temp_file}")
                    except Exception as cleanup_error:
                        logger.warning(f"Failed to cleanup temp file {temp_file}: {cleanup_error}")
        
        return decorated_function
    return decorator

def validate_config_requirements():
    """
    Validate that required configuration is present.
    
    Raises:
        ConfigurationError: If required config is missing
    """
    required_env_vars = ['SECRET_KEY']
    optional_env_vars = ['DATABASE_URL', 'PRIVATE_KEY_PEM']
    
    missing_required = []
    
    for var in required_env_vars:
        if not current_app.config.get(var):
            missing_required.append(var)
    
    if missing_required:
        raise ConfigurationError(
            f"Missing required configuration: {', '.join(missing_required)}"
        )
    
    # Log warnings for missing optional config
    for var in optional_env_vars:
        if not current_app.config.get(var):
            logger.warning(f"Optional configuration missing: {var}")

def register_error_handlers(app):
    """Register error handlers with Flask app."""
    
    @app.errorhandler(APIError)
    def handle_api_error_route(error):
        return handle_api_error(error)
    
    @app.errorhandler(404)
    def handle_not_found(error):
        logger.warning(f"404 Error: {request.path} - IP: {request.remote_addr}")
        return jsonify({
            'error': 'Resource not found',
            'status': 'error',
            'timestamp': datetime.utcnow().isoformat()
        }), 404
    
    @app.errorhandler(405)
    def handle_method_not_allowed(error):
        logger.warning(f"405 Error: {request.method} {request.path} - IP: {request.remote_addr}")
        return jsonify({
            'error': 'Method not allowed',
            'status': 'error',
            'allowed_methods': error.valid_methods,
            'timestamp': datetime.utcnow().isoformat()
        }), 405
    
    @app.errorhandler(413)
    def handle_payload_too_large(error):
        logger.warning(f"413 Error: Payload too large - IP: {request.remote_addr}")
        return jsonify({
            'error': 'File too large',
            'status': 'error',
            'timestamp': datetime.utcnow().isoformat()
        }), 413
    
    @app.errorhandler(500)
    def handle_internal_error(error):
        return handle_generic_error(error)

# Health check utilities
class HealthChecker:
    """Health check utilities for monitoring application status."""
    
    @staticmethod
    def check_database(app):
        """Check database connectivity."""
        try:
            from modules.database import get_db_connection
            database_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
            conn = get_db_connection(database_path)
            conn.execute("SELECT 1")
            conn.close()
            return True, "Database OK"
        except Exception as e:
            return False, f"Database error: {str(e)}"
    
    @staticmethod
    def check_file_permissions():
        """Check file system permissions."""
        try:
            import tempfile
            with tempfile.NamedTemporaryFile(delete=True) as tmp:
                tmp.write(b"test")
            return True, "File system OK"
        except Exception as e:
            return False, f"File system error: {str(e)}"
    
    @staticmethod
    def get_system_status(app):
        """Get comprehensive system status."""
        checks = {
            'database': HealthChecker.check_database(app),
            'file_system': HealthChecker.check_file_permissions(),
        }
        
        all_healthy = all(check[0] for check in checks.values())
        
        return {
            'status': 'healthy' if all_healthy else 'degraded',
            'timestamp': datetime.utcnow().isoformat(),
            'checks': {
                name: {'healthy': result[0], 'message': result[1]}
                for name, result in checks.items()
            }
        }