# GCP Deployment Guide

## Pre-deployment Checklist
- ✅ GitHub repository created
- ✅ PM2 configuration ready
- ✅ All tests passing
- ✅ Swagger documentation configured

## GCP Instance Deployment Steps

### 1. Connect to GCP Instance
```bash
# SSH into your GCP instance (use the connection details provided by employer)
ssh username@your-gcp-instance-ip

# Or if using gcloud CLI:
gcloud compute ssh instance-name --zone=your-zone
```

### 2. Install Dependencies on GCP Instance
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Git
sudo apt install -y git

# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Verify installations
git --version
node --version
npm --version
pm2 --version
```

### 3. Clone and Deploy Application
```bash
# Clone your repository
git clone https://github.com/double-o-z/url-fetcher-nestjs.git
cd url-fetcher-nestjs

# Install project dependencies
npm install

### 4. Build and Deploy with PM2
```bash
# Build the application
npm run build

# Start the service with PM2
npm run deploy

# Verify service is running
pm2 status
pm2 logs url-fetcher-service
```

### 5. Configure Firewall (if needed)
```bash
# Allow traffic on port 8080
sudo ufw allow 8080
```

### 6. Access Your Service
- Service URL: `http://YOUR_GCP_INSTANCE_IP:8080`
- Swagger UI: `http://YOUR_GCP_INSTANCE_IP:8080/api`
- Health check: `http://YOUR_GCP_INSTANCE_IP:8080/`

## Useful Commands

### PM2 Management
```bash
# Stop the service
npm run deploy:stop

# Restart the service
npm run deploy:restart

# View logs
npm run deploy:logs

# Monitor in real-time
pm2 monit
```

### Application Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
npm run build
npm run deploy:restart
```

### Troubleshooting
```bash
# Check if port 8080 is in use
sudo netstat -tlnp | grep :8080

# Check PM2 processes
pm2 list

# View detailed logs
pm2 logs url-fetcher-service --lines 50

# Restart PM2 daemon if needed
pm2 kill
pm2 resurrect
```

## Service Endpoints
- `GET /` - Overview of all submitted URL fetch jobs
- `POST /fetch` - Submit URLs for fetching
- `GET /fetch/:id` - Get job results
- `GET /fetch/:id/:index/content` - Get specific URL content
- `GET /api` - Swagger documentation

## Security Notes
- Service runs on port 8080 (ensure firewall allows this)
- PM2 runs with appropriate user permissions
- All HTTP requests are logged via PM2
