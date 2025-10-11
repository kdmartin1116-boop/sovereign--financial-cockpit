# 🧠 Sovereign Financial Cockpit

A comprehensive financial document processing and management system with enhanced security features and modern architecture.

## ⚠️ **Disclaimer**

**This repository is for educational and informational purposes only. The information provided here does not constitute legal or financial advice. We strongly recommend that you consult with a qualified professional to discuss your specific situation and to ensure you are in compliance with all applicable laws and regulations.**

## 🎯 **Project Overview**

The Sovereign Financial Cockpit is a full-stack web application designed to help users process financial documents, generate legal correspondence, and manage financial information with enterprise-grade security and reliability.

### Key Features

- **📄 Document Processing**: Advanced PDF parsing and endorsement capabilities
- **🔒 Security First**: Comprehensive input validation, rate limiting, and security headers
- **⚡ Modern Architecture**: React frontend with Flask backend and robust error handling
- **🛡️ Production Ready**: Health checks, monitoring, and deployment configurations
- **📊 State Management**: Centralized application state with React Context API
- **🔄 API Layer**: Comprehensive API service with retry logic and error handling

## 🚀 **Quick Start**

### Prerequisites

- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Git** for version control

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kdmartin1116-boop/sovereign--financial-cockpit.git
   cd sovereign--financial-cockpit
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Copy environment template
   cp .env.example .env
   # Edit .env with your configuration
   
   # Initialize database
   python -c "from app import create_app; create_app()"
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   
   # Install dependencies
   npm install
   
   # Optional: Create environment file
   cp .env.example .env.local
   ```

### Running the Application

1. **Start the Backend** (Terminal 1):
   ```bash
   cd backend
   source venv/bin/activate  # Windows: venv\Scripts\activate
   python app.py
   ```
   Backend will be available at `http://127.0.0.1:8001`

2. **Start the Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173`

3. **Access the Application:**
   Open your browser to `http://localhost:5173`

## 📚 **Documentation**

- **[API Documentation](docs/API_DOCUMENTATION.md)** - Comprehensive API reference
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[Security Features](#-security-features)** - Security implementations and best practices

## 🛡️ **Security Features**

### Input Validation & Sanitization
- **File Type Verification**: MIME type checking with magic number validation
- **File Size Limits**: Configurable upload limits (PDF: 50MB, Images: 10MB)
- **Text Input Sanitization**: XSS prevention and dangerous pattern detection
- **Coordinate Validation**: Bounds checking for PDF operations

### Rate Limiting & Access Control
- **Endpoint-Specific Limits**: 10-100 requests per hour based on resource intensity
- **IP-Based Tracking**: In-memory rate limiting with exponential backoff
- **Authentication**: Flask-Login session management (JWT ready)

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

### Error Handling & Monitoring
- **Centralized Error Management**: Consistent error responses with tracking IDs
- **Health Check Endpoint**: System status monitoring at `/health`
- **Comprehensive Logging**: Request/response logging with rotation
- **Production Error Handling**: Sanitized error messages in production

## 🏗️ **Architecture**

### Backend (Flask)
- **Modular Design**: Blueprint-based route organization
- **Input Validation**: Comprehensive validation decorators
- **Error Handling**: Centralized exception management
- **File Processing**: Secure PDF manipulation and OCR capabilities
- **Database**: SQLite (development) / PostgreSQL (production)

### Frontend (React + Vite)
- **Modern React**: Hooks, Context API, and functional components
- **State Management**: Centralized app state with custom hooks
- **API Service**: Retry logic, error handling, and request interceptors
- **Error Boundaries**: Graceful error recovery with user feedback
- **Responsive Design**: Mobile-friendly interface

### Key Components

```
├── backend/
│   ├── modules/
│   │   ├── validators.py          # Input validation system
│   │   ├── error_handler.py       # Centralized error handling
│   │   ├── database.py            # Database operations
│   │   └── routes/                # API route blueprints
│   ├── app.py                     # Main Flask application
│   └── config.py                  # Configuration management
│
└── frontend/
    ├── src/
    │   ├── contexts/               # React Context providers
    │   ├── services/               # API service layer
    │   ├── components/             # React components
    │   └── App.jsx                 # Main application component
    └── vite.config.js              # Build configuration
```

## 📊 **API Endpoints**

### Core Features
- `POST /endorse-bill` - Process and endorse financial documents
- `POST /stamp_endorsement` - Add endorsements at specific coordinates
- `POST /get-bill-data` - Extract structured data from documents
- `POST /scan-for-terms` - Search for specific legal terms

### Letter Generation
- `POST /generate-tender-letter` - Create formal tender letters
- `POST /generate-ptp-letter` - Generate Promise to Pay letters

### System Management
- `GET /health` - System health and status check

See [API Documentation](docs/API_DOCUMENTATION.md) for complete endpoint details.

## 🧪 **Testing**

```bash
# Backend tests
cd backend
python -m pytest tests/ -v

# Frontend tests
cd frontend
npm test
```

## 🚀 **Deployment**

### Development
Follow the [Quick Start](#-quick-start) instructions above.

### Production
See the comprehensive [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for:
- Docker deployment
- Traditional server setup
- Nginx configuration
- SSL/TLS setup
- Database configuration
- Monitoring and logging

## 🤝 **Contributing**

We welcome contributions! Please:

1. Read our [Code of Conduct](CODE_OF_CONDUCT.md)
2. Fork the repository
3. Create a feature branch
4. Make your changes with tests
5. Submit a pull request

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint configuration for JavaScript
- Add tests for new features
- Update documentation as needed
- Ensure security best practices

## 📄 **License**

This project is provided for educational purposes. See the disclaimer above for important legal information.

## 🆘 **Support**

- **Issues**: Report bugs or request features via GitHub Issues
- **Documentation**: Check the `docs/` directory for detailed guides
- **Health Check**: Monitor application status at `/health` endpoint