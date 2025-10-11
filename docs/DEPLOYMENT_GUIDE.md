# Deployment Guide - Sovereign Financial Cockpit

## Overview

This guide covers deploying the Sovereign Financial Cockpit application from development to production environments.

## Prerequisites

### System Requirements

- **Python**: 3.8 or higher
- **Node.js**: 16.0 or higher
- **npm**: 8.0 or higher
- **System Memory**: Minimum 2GB RAM
- **Storage**: Minimum 10GB available space
- **OS**: Windows, macOS, or Linux

### Production Requirements

- **Web Server**: Nginx or Apache (recommended)
- **WSGI Server**: Gunicorn, uWSGI, or Waitress
- **Database**: PostgreSQL (recommended) or MySQL
- **SSL Certificate**: Required for HTTPS
- **Firewall**: Configure appropriate ports

## Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/kdmartin1116-boop/sovereign--financial-cockpit.git
cd sovereign--financial-cockpit
```

### 2. Backend Setup

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

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Initialize database
python -c "from app import create_app; app = create_app(); app.app_context().push(); from modules.database import init_db; init_db(app)"

# Run development server
python app.py
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file (optional)
cp .env.example .env.local
# Edit .env.local if needed

# Start development server
npm run dev
```

## Production Deployment

### Option 1: Docker Deployment (Recommended)

Create `Dockerfile` for backend:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 8001

# Run application
CMD ["gunicorn", "--bind", "0.0.0.0:8001", "--workers", "4", "app:app"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - FLASK_ENV=production
      - SECRET_KEY=${SECRET_KEY}
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=sovereign_db
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Option 2: Traditional Server Deployment

#### Backend Deployment

1. **Install Dependencies on Server:**

```bash
# Install Python 3.8+
sudo apt update
sudo apt install python3 python3-pip python3-venv nginx

# Create application user
sudo useradd -m -s /bin/bash sovereign
sudo usermod -aG www-data sovereign
```

2. **Deploy Application:**

```bash
# Switch to app user
sudo su - sovereign

# Clone repository
git clone https://github.com/kdmartin1116-boop/sovereign--financial-cockpit.git
cd sovereign--financial-cockpit/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn

# Create production configuration
cp .env.example .env
# Edit .env with production values
```

3. **Configure Gunicorn:**

Create `/etc/systemd/system/sovereign-backend.service`:

```ini
[Unit]
Description=Sovereign Financial Cockpit Backend
After=network.target

[Service]
User=sovereign
Group=www-data
WorkingDirectory=/home/sovereign/sovereign--financial-cockpit/backend
Environment="PATH=/home/sovereign/sovereign--financial-cockpit/backend/venv/bin"
ExecStart=/home/sovereign/sovereign--financial-cockpit/backend/venv/bin/gunicorn --workers 4 --bind unix:sovereign.sock -m 007 app:app
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
```

4. **Configure Nginx:**

Create `/etc/nginx/sites-available/sovereign`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Frontend
    location / {
        root /home/sovereign/sovereign--financial-cockpit/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        include proxy_params;
        proxy_pass http://unix:/home/sovereign/sovereign--financial-cockpit/backend/sovereign.sock;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # File upload size limit
        client_max_body_size 50M;
    }

    # Backend routes (non-API)
    location ~ ^/(endorse-bill|stamp_endorsement|generate-tender-letter|generate-ptp-letter|get-bill-data|scan-for-terms|generate-remedy|health)$ {
        include proxy_params;
        proxy_pass http://unix:/home/sovereign/sovereign--financial-cockpit/backend/sovereign.sock;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
```

5. **Enable Services:**

```bash
# Enable and start services
sudo systemctl daemon-reload
sudo systemctl enable sovereign-backend
sudo systemctl start sovereign-backend

# Enable nginx site
sudo ln -s /etc/nginx/sites-available/sovereign /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Frontend Deployment

1. **Build Frontend:**

```bash
cd frontend
npm install
npm run build
```

2. **Copy Build Files:**

```bash
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/
```

## Security Configuration

### 1. Environment Variables

Create secure `.env` file:

```bash
# Generate secure secret key
SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")

# Database configuration
DATABASE_URL=postgresql://username:password@localhost/sovereign_db

# Security settings
FLASK_ENV=production
DEBUG=False

# File paths
UPLOAD_FOLDER=/secure/path/to/uploads
LOG_FILE=/var/log/sovereign/app.log
```

### 2. File Permissions

```bash
# Set proper file permissions
sudo chmod 600 /path/to/.env
sudo chmod 755 /path/to/uploads
sudo chown -R sovereign:www-data /path/to/uploads
```

### 3. Firewall Configuration

```bash
# Ubuntu/Debian
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## Database Setup

### PostgreSQL (Recommended)

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE sovereign_db;
CREATE USER sovereign_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE sovereign_db TO sovereign_user;
\q

# Update DATABASE_URL
DATABASE_URL=postgresql://sovereign_user:secure_password@localhost/sovereign_db
```

### Database Migration

```bash
# Initialize database tables
cd backend
source venv/bin/activate
python -c "from app import create_app; app = create_app(); app.app_context().push(); from modules.database import init_db; init_db(app)"
```

## Monitoring and Logging

### 1. Log Configuration

Create log rotation:

```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/sovereign << EOF
/var/log/sovereign/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 sovereign www-data
    postrotate
        systemctl reload sovereign-backend
    endscript
}
EOF
```

### 2. Health Monitoring

Create health check script:

```bash
#!/bin/bash
# /usr/local/bin/health-check.sh

HEALTH_URL="https://your-domain.com/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$RESPONSE" != "200" ]; then
    echo "Health check failed with status: $RESPONSE"
    systemctl restart sovereign-backend
    # Send notification (email, Slack, etc.)
fi
```

Add to crontab:

```bash
# Check every 5 minutes
*/5 * * * * /usr/local/bin/health-check.sh
```

## Backup Strategy

### 1. Database Backup

```bash
#!/bin/bash
# /usr/local/bin/backup-db.sh

BACKUP_DIR="/backups/sovereign"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
pg_dump -U sovereign_user sovereign_db | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Keep only last 30 days
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +30 -delete
```

### 2. File Backup

```bash
#!/bin/bash
# Backup uploads and configuration
tar -czf "/backups/sovereign/files_backup_$(date +%Y%m%d).tar.gz" \
    /path/to/uploads \
    /path/to/.env \
    /path/to/config/
```

## Performance Optimization

### 1. Gunicorn Configuration

Create `gunicorn.conf.py`:

```python
# Gunicorn configuration
bind = "unix:sovereign.sock"
workers = 4
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
preload_app = True

# Logging
accesslog = "/var/log/sovereign/gunicorn_access.log"
errorlog = "/var/log/sovereign/gunicorn_error.log"
loglevel = "info"
```

### 2. Nginx Optimization

Add to nginx configuration:

```nginx
# Compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Connection keep-alive
keepalive_timeout 65;
keepalive_requests 100;

# Buffer sizes
client_body_buffer_size 128k;
client_header_buffer_size 1k;
large_client_header_buffers 4 4k;
```

## Troubleshooting

### Common Issues

1. **Permission Errors:**
   ```bash
   sudo chown -R sovereign:www-data /path/to/app
   sudo chmod 755 /path/to/uploads
   ```

2. **Database Connection Issues:**
   - Check DATABASE_URL format
   - Verify PostgreSQL service is running
   - Check firewall settings

3. **File Upload Issues:**
   - Check client_max_body_size in nginx
   - Verify UPLOAD_FOLDER permissions
   - Check disk space

4. **SSL Certificate Issues:**
   - Verify certificate paths
   - Check certificate expiration
   - Test SSL configuration

### Log Locations

- Application logs: `/var/log/sovereign/app.log`
- Gunicorn logs: `/var/log/sovereign/gunicorn_*.log`
- Nginx logs: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- System logs: `journalctl -u sovereign-backend`

## Maintenance

### Regular Tasks

1. **Update Dependencies:**
   ```bash
   pip list --outdated
   npm audit
   ```

2. **Security Updates:**
   ```bash
   sudo apt update && sudo apt upgrade
   ```

3. **Certificate Renewal:**
   - Set up automatic renewal for Let's Encrypt
   - Monitor certificate expiration

4. **Database Maintenance:**
   ```bash
   # PostgreSQL
   sudo -u postgres vacuumdb --all --analyze
   ```

### Monitoring Checklist

- [ ] Application health endpoint responding
- [ ] Database connectivity working
- [ ] File upload functionality working
- [ ] SSL certificate valid
- [ ] Backup processes running
- [ ] Log rotation working
- [ ] Disk space sufficient
- [ ] Security updates applied