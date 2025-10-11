# API Documentation - Sovereign Financial Cockpit

## Overview

This document provides comprehensive documentation for the Sovereign Financial Cockpit API endpoints, including security features, validation rules, and usage examples.

## Base URL

```
http://127.0.0.1:8001  # Development
```

## Authentication

Currently, the application uses Flask-Login for session-based authentication. Future versions may include JWT tokens.

## Security Features

### Rate Limiting

Most endpoints are protected with rate limiting:
- General endpoints: 100 requests per hour
- File upload endpoints: 10-20 requests per hour
- Health check: Unlimited

### Input Validation

All inputs are validated for:
- File type verification (MIME type checking)
- File size limits (up to 50MB for PDFs)
- Text input sanitization (XSS prevention)
- Coordinate validation for PDF operations

### Security Headers

All responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

## Endpoints

### Health Check

#### GET /health

Check system health and service status.

**Response:**
```json
{
  "status": "healthy|degraded|error",
  "timestamp": "2025-10-10T12:00:00Z",
  "checks": {
    "database": {
      "healthy": true,
      "message": "Database OK"
    },
    "file_system": {
      "healthy": true,
      "message": "File system OK"
    }
  }
}
```

### Bill Processing

#### POST /endorse-bill

Endorse a bill with UCC-3 endorsements.

**Rate Limit:** 10 requests per hour

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `bill` (PDF file, max 50MB)

**Response:**
```json
{
  "message": "Bill endorsed successfully",
  "endorsed_files": ["endorsed_bill_PayToOrder.pdf", "endorsed_bill_AcceptedForValue.pdf"]
}
```

**Errors:**
- `400` - Invalid file or validation error
- `500` - Server configuration error or processing failure
- `429` - Rate limit exceeded

#### POST /stamp_endorsement

Add endorsement text at specific coordinates on a PDF.

**Rate Limit:** 20 requests per hour

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `bill` (PDF file)
  - `x` (X coordinate, 0-612)
  - `y` (Y coordinate, 0-792)
  - `endorsement_text` (string, max 500 chars)
  - `qualifier` (optional string, max 100 chars)

**Response:**
Binary PDF file download

#### POST /get-bill-data

Extract structured data from a bill PDF.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `bill` (PDF file)

**Response:**
```json
{
  "bill_number": "12345",
  "customer_name": "John Doe",
  "total_amount": "$1,200.00",
  "currency": "USD",
  "document_type": "Invoice",
  "issuer": "Company Name"
}
```

#### POST /scan-for-terms

Search for specific terms/clauses in documents.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `file` (PDF file)
  - `tag` (term type: "hidden_fee", "misrepresentation", "arbitration")

**Response:**
```json
{
  "found_clauses": [
    "This agreement includes a convenience fee of $25.",
    "Arbitration clause: All disputes must be resolved through binding arbitration."
  ]
}
```

### Letter Generation

#### POST /generate-tender-letter

Generate a tender letter for bill payment.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Body:
```json
{
  "userName": "John Doe",
  "userAddress": "123 Main St, City, State",
  "creditorName": "Credit Company",
  "creditorAddress": "456 Corp Blvd, City, State",
  "billFileName": "bill_12345.pdf"
}
```

**Response:**
```json
{
  "letterContent": "*** DISCLAIMER: This letter is based on pseudo-legal theories..."
}
```

#### POST /generate-ptp-letter

Generate a Promise to Pay letter.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Body:
```json
{
  "userName": "John Doe",
  "userAddress": "123 Main St, City, State",
  "creditorName": "Credit Company",
  "creditorAddress": "456 Corp Blvd, City, State",
  "accountNumber": "ACCT123",
  "promiseAmount": "500.00",
  "promiseDate": "2025-12-01"
}
```

### Other Endpoints

#### POST /scan-contract

Scan contract for specific terms.

**Request:**
```json
{
  "filepath": "/path/to/contract.pdf",
  "tag": "arbitration"
}
```

#### POST /generate-remedy

Generate legal remedy documentation.

**Request:**
- Method: `POST`
- Content-Type: `application/x-www-form-urlencoded`
- Body: `violation=FDCPA&jurisdiction=Federal`

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "status": "error",
  "timestamp": "2025-10-10T12:00:00Z",
  "error_id": "20251010120000"  // For tracking
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `405` - Method Not Allowed
- `413` - Payload Too Large
- `422` - Unprocessable Entity (file processing errors)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

## Configuration

### Environment Variables

Required:
- `SECRET_KEY` - Flask secret key
- `FLASK_ENV` - Environment (development/production)

Optional:
- `DATABASE_URL` - Database connection string
- `PRIVATE_KEY_PEM` - Path to private key for signing
- `LOG_LEVEL` - Logging level (DEBUG/INFO/WARNING/ERROR)
- `MAX_UPLOAD_SIZE` - Maximum file upload size in bytes

### File Upload Limits

- PDF files: 50MB maximum
- Image files: 10MB maximum  
- Document files: 25MB maximum

### Security Configuration

Production deployments should:

1. Use HTTPS (`PREFERRED_URL_SCHEME=https`)
2. Set secure cookie flags
3. Configure proper CORS policies
4. Use environment-based configuration
5. Enable proper logging and monitoring

## Frontend Integration

### API Service

Use the provided API service for consistent error handling:

```javascript
import api from './services/api';

// Upload and endorse bill
try {
  const result = await api.endorseBill(file);
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error.message);
}
```

### Error Handling

The API service includes:
- Automatic retry logic for transient errors
- Request/response interceptors
- Progress tracking for file uploads
- Consistent error formatting

## Development

### Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

### Logging

Logs are written to:
- Console (all environments)
- `app.log` file (configurable via LOG_FILE)

### Database

SQLite is used by default. For production, consider PostgreSQL:

```bash
DATABASE_URL=postgresql://user:pass@localhost/dbname
```