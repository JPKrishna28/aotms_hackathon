# Deployment Guide - Aurora.ai

Complete instructions for deploying Aurora.ai to production.

## Architecture Overview

```
Internet → Load Balancer → Backend (Node.js) ← → Frontend (React)
                                  ↓
                           Gemini API
                                  ↑
                           File Storage
```

## Environment Variables

Create `backend/.env.production`:
```env
GEMINI_API_KEY=your_production_key_here
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Option 1: Deploy to Heroku (Recommended for beginners)

### Backend Deployment

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create Heroku app
heroku create aurora-ai-backend

# Set environment variables
heroku config:set GEMINI_API_KEY=your_key

# Deploy
git push heroku main

# View logs
heroku logs --tail

# Backend URL: https://aurora-ai-backend.herokuapp.com
```

### Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Create vercel.json in frontend/
cat > vercel.json << EOF
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "@api_url"
  }
}
EOF

# Deploy
cd frontend
vercel

# During deployment, set VITE_API_URL to your backend URL
# Frontend URL: https://aurora-ai.vercel.app
```

## Option 2: Deploy to AWS

### Backend (EC2)

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone your-repo
cd aotms_hackathon/backend

# Install dependencies
npm install --production

# Create .env file
nano .env
# Add GEMINI_API_KEY and other vars

# Install PM2 (process manager)
sudo npm install -g pm2

# Start application
pm2 start server.js --name "aurora-backend"
pm2 startup
pm2 save

# Setup Nginx reverse proxy
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/default

# Add:
# server {
#   listen 80;
#   server_name your-domain.com;
#   location / {
#     proxy_pass http://localhost:5000;
#     proxy_http_version 1.1;
#     proxy_set_header Upgrade $http_upgrade;
#     proxy_set_header Connection 'upgrade';
#   }
# }

sudo systemctl restart nginx
```

### Frontend (S3 + CloudFront)

```bash
# Build frontend
cd frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## Option 3: Deploy with Docker

### Dockerfile for Backend

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      NODE_ENV: production
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_URL: http://backend:5000
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped
```

Deploy:
```bash
docker-compose up -d
```

## Option 4: Kubernetes (Advanced)

Create `k8s/deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aurora-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: aurora-backend
  template:
    metadata:
      labels:
        app: aurora-backend
    spec:
      containers:
      - name: backend
        image: your-registry/aurora-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: gemini-secret
              key: api-key
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

Deploy:
```bash
kubectl apply -f k8s/
```

## Monitoring & Logging

### Application Monitoring

```bash
# Install New Relic (recommended)
npm install newrelic

# Add to server.js (first line):
# require('newrelic');

# Configure newrelic.js with your license key
```

### Log Aggregation

```bash
# Option 1: Papertrail
# Add to package.json:
# "dependencies": { "winston": "^3.8.0" }

# Option 2: Datadog
# Collect logs from application
```

### Uptime Monitoring

- Use UptimeRobot (free)
- Monitor: `https://your-api.com/api/health`
- Alert on failures

## Performance Optimization

### Backend Optimization

```javascript
// server.js - Enable compression
const compression = require('compression');
app.use(compression());

// Enable caching
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=3600');
  }
  next();
});
```

### Frontend Optimization

```bash
# Build optimization
cd frontend
npm run build

# Enable gzip compression in Vite
# vite.config.js: compression plugin

# Use CDN for static assets
```

## Security Checklist

- ✅ Use HTTPS/WSS only
- ✅ Set secure environment variables
- ✅ Enable CORS only for your domain
- ✅ Use strong rate limiting
- ✅ Add security headers (Helmet.js)
- ✅ Validate all inputs
- ✅ Sanitize file uploads
- ✅ Use secure session cookies
- ✅ Enable CSRF protection
- ✅ Regular security audits

## SSL/TLS Certificate

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d your-domain.com

# Auto-renew
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Update Nginx

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}
```

## Database Integration (Optional)

For production, add PostgreSQL:

```bash
# Install postgres client
npm install pg

# Create .env variable
DATABASE_URL=postgresql://user:pass@localhost/aurora

# Run migrations
npm run migrate
```

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Aurora.ai

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: |
          curl -X POST ${{ secrets.DEPLOY_WEBHOOK }} \
            -H "Authorization: Bearer ${{ secrets.DEPLOY_TOKEN }}"
```

## Backup & Disaster Recovery

```bash
# Daily backups
0 2 * * * tar -czf /backups/aurora-$(date +%Y%m%d).tar.gz /app

# Test restore
tar -xzf /backups/aurora-20231213.tar.gz -C /tmp/test
```

## Post-Deployment Checklist

- [ ] Verify all endpoints accessible
- [ ] Test file upload workflow
- [ ] Verify WebSocket connections
- [ ] Test with real Gemini API
- [ ] Check response times
- [ ] Monitor error logs
- [ ] Test on mobile devices
- [ ] Verify rate limiting works
- [ ] Check security headers
- [ ] Set up monitoring alerts

## Rollback Procedure

```bash
# If deployment fails
git revert HEAD
git push

# Or with Docker
docker pull aurora-backend:previous
docker-compose down
docker-compose up -d
```

## Scaling Considerations

- Use load balancer for multiple backend instances
- Implement caching (Redis) for frequent queries
- Use CDN for frontend assets
- Database replication for high availability
- Queue jobs for heavy processing (Bull, RabbitMQ)

---

For questions or issues, refer to the main README.md or check deployment logs.
