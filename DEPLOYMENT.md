# Nawy Apartment Listing - Deployment Guide

## Production Deployment Checklist

### Pre-Deployment Steps

#### 1. Update Environment Variables

Edit the `.env` file with production values:

```bash
# Generate secure password
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Generate secure JWT secret
JWT_SECRET=$(openssl rand -base64 64)

# Update API URL for production
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

#### 2. Security Hardening

**Update CORS Configuration** (`apps/api/src/server.ts`):

```typescript
await app.register(require("@fastify/cors"), {
  origin: ["https://yourdomain.com", "https://www.yourdomain.com"],
  credentials: true,
});
```

**Update Swagger Host** (`apps/api/src/server.ts`):

```typescript
swagger: {
  host: 'api.yourdomain.com',
  schemes: ['https'],
}
```

#### 3. Database Backup Strategy

Configure automated backups:

```bash
# Create backup script
cat > backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec nawy-postgres pg_dump -U nawy apartments > "$BACKUP_DIR/backup_$DATE.sql"
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x backup-db.sh

# Add to crontab (daily at 2 AM)
0 2 * * * /path/to/backup-db.sh
```

### Deployment Options

## Option 1: Single Server Deployment

### Requirements

- Ubuntu 20.04+ or similar Linux distribution
- Docker 20.10+
- Docker Compose 2.0+
- Domain name with DNS configured
- SSL certificate (Let's Encrypt recommended)

### Steps

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Create application directory
sudo mkdir -p /opt/nawy-apartment-listing
sudo chown $USER:$USER /opt/nawy-apartment-listing
cd /opt/nawy-apartment-listing
```

#### 2. Deploy Application

```bash
# Clone repository
git clone <repository-url> .

# Configure environment
cp .env.example .env
nano .env  # Update with production values

# Start services
docker compose up -d --build

# Verify services
docker compose ps
docker compose logs -f
```

#### 3. Configure Reverse Proxy (Nginx)

```bash
# Install Nginx
sudo apt install nginx certbot python3-certbot-nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/nawy-apartment-listing
```

```nginx
# Frontend (yourdomain.com)
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API (api.yourdomain.com)
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeouts for API operations
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/nawy-apartment-listing /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Obtain SSL certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com
```

#### 4. Configure Firewall

```bash
# Allow HTTP, HTTPS, SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Option 2: Docker Swarm Deployment

### Initialize Swarm

```bash
# On manager node
docker swarm init

# On worker nodes (use token from manager)
docker swarm join --token <token> <manager-ip>:2377
```

### Create Docker Stack

Create `docker-stack.yml`:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - nawy-network
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager

  api:
    image: your-registry/nawy-api:latest
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
    networks:
      - nawy-network
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure

  web:
    image: your-registry/nawy-web:latest
    environment:
      NEXT_PUBLIC_API_BASE_URL: ${NEXT_PUBLIC_API_BASE_URL}
    ports:
      - "3000:3000"
    networks:
      - nawy-network
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure

networks:
  nawy-network:
    driver: overlay

volumes:
  postgres_data:
```

### Deploy Stack

```bash
# Build and push images
docker compose build
docker tag nawy-api:latest your-registry/nawy-api:latest
docker tag nawy-web:latest your-registry/nawy-web:latest
docker push your-registry/nawy-api:latest
docker push your-registry/nawy-web:latest

# Deploy stack
docker stack deploy -c docker-stack.yml nawy

# Monitor deployment
docker stack services nawy
docker service logs nawy_api
```

## Option 3: Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (GKE, EKS, AKS, or self-hosted)
- kubectl configured
- Helm (optional but recommended)

### Create Kubernetes Manifests

```bash
# Create namespace
kubectl create namespace nawy-production

# Create secrets
kubectl create secret generic nawy-secrets \
  --from-literal=postgres-password=$POSTGRES_PASSWORD \
  --from-literal=jwt-secret=$JWT_SECRET \
  -n nawy-production
```

### Deploy Database

```yaml
# postgres-deployment.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: nawy-production
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: nawy-production
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15-alpine
          env:
            - name: POSTGRES_DB
              value: apartments
            - name: POSTGRES_USER
              value: nawy
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: nawy-secrets
                  key: postgres-password
          ports:
            - containerPort: 5432
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: postgres-storage
          persistentVolumeClaim:
            claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: nawy-production
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
```

```bash
kubectl apply -f postgres-deployment.yaml
```

## Monitoring and Maintenance

### Health Monitoring

```bash
# Check service health
curl https://api.yourdomain.com/api/health

# Monitor logs
docker compose logs -f --tail=100

# Monitor resource usage
docker stats
```

### Database Maintenance

```bash
# Vacuum database (monthly)
docker exec nawy-postgres psql -U nawy -d apartments -c "VACUUM ANALYZE;"

# Check database size
docker exec nawy-postgres psql -U nawy -d apartments -c "SELECT pg_size_pretty(pg_database_size('apartments'));"
```

### Update Deployment

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker compose up -d --build

# Zero-downtime update (if using Swarm)
docker service update --image your-registry/nawy-api:latest nawy_api
```

## Disaster Recovery

### Backup Procedures

```bash
# Full backup
docker exec nawy-postgres pg_dump -U nawy -Fc apartments > backup.dump

# Backup to cloud storage (example with AWS S3)
docker exec nawy-postgres pg_dump -U nawy apartments | gzip | \
  aws s3 cp - s3://your-bucket/backups/apartments-$(date +%Y%m%d).sql.gz
```

### Restore Procedures

```bash
# Stop services
docker compose down

# Restore database
docker compose up -d postgres
sleep 10
docker exec -i nawy-postgres psql -U nawy apartments < backup.sql

# Start all services
docker compose up -d
```

## Scaling Recommendations

### Horizontal Scaling

- **API**: Can be scaled to multiple instances behind a load balancer
- **Web**: Stateless, can be scaled horizontally
- **Database**: Consider PostgreSQL replication for read scaling

### Vertical Scaling

Update resource limits in docker-compose.yml:

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 2G
        reservations:
          cpus: "1"
          memory: 1G
```

## Performance Optimization

### Database Optimization

```sql
-- Create indexes for frequently queried fields
CREATE INDEX idx_apartments_project_id ON apartments(project_id);
CREATE INDEX idx_apartments_status ON apartments(status);
CREATE INDEX idx_apartments_price ON apartments(price_egp);

-- Enable query performance insights
EXPLAIN ANALYZE SELECT * FROM apartments WHERE status = 'ACTIVE';
```

### Caching Strategy

Consider implementing Redis for:

- API response caching
- Session management
- Rate limiting

## Security Best Practices

1. **Regular Updates**: Keep Docker images and dependencies updated
2. **Secret Management**: Use Docker secrets or environment variable encryption
3. **Network Segmentation**: Use Docker networks to isolate services
4. **Access Control**: Implement proper authentication and authorization
5. **Audit Logging**: Enable and monitor application and database logs
6. **Rate Limiting**: Implement API rate limiting to prevent abuse
7. **Input Validation**: Ensure all user inputs are validated and sanitized

## Support

For production support and issues, contact the development team or refer to the project documentation.
