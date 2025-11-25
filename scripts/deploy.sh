#!/bin/bash

# CallStack Production Deployment Script
# This script handles the complete deployment of the CallStack platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_DIR="/backups/callstack"
LOG_FILE="/var/log/callstack-deploy.log"

# Print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

print_header() {
    echo -e "${BLUE}[DEPLOY]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check environment variables
    if [ ! -f ".env.$ENVIRONMENT" ]; then
        print_error "Environment file .env.$ENVIRONMENT not found"
        exit 1
    fi
    
    # Load environment variables
    source ".env.$ENVIRONMENT"
    
    # Check required variables
    required_vars=("JWT_SECRET" "POSTGRES_PASSWORD" "STRIPE_SECRET_KEY" "EXTERNAL_IP")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    print_status "Prerequisites check passed"
}

# Create backup
create_backup() {
    print_header "Creating backup..."
    
    BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_DATE"
    
    mkdir -p "$BACKUP_PATH"
    
    # Backup database
    if docker ps | grep -q callstack_postgres; then
        print_status "Backing up database..."
        docker exec callstack_postgres pg_dump -U callstack callstack > "$BACKUP_PATH/database.sql"
        print_status "Database backup completed"
    fi
    
    # Backup configuration files
    print_status "Backing up configuration..."
    cp -r ./infra "$BACKUP_PATH/"
    cp .env."$ENVIRONMENT" "$BACKUP_PATH/"
    
    print_status "Backup created at $BACKUP_PATH"
}

# Run database migrations
run_migrations() {
    print_header "Running database migrations..."
    
    # Push Prisma schema
    npm run db:push
    
    print_status "Database migrations completed"
}

# Build and deploy services
deploy_services() {
    print_header "Building and deploying services..."
    
    # Set environment
    export ENVIRONMENT="$ENVIRONMENT"
    
    # Stop existing services
    print_status "Stopping existing services..."
    docker-compose -f docker-compose.prod.yml down
    
    # Pull latest images
    print_status "Pulling latest images..."
    docker-compose -f docker-compose.prod.yml pull
    
    # Build custom images
    print_status "Building custom images..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Start services
    print_status "Starting services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    print_status "Services deployed"
}

# Health check
health_check() {
    print_header "Performing health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check critical services
    services=("web-client" "signaling" "postgres" "redis")
    
    for service in "${services[@]}"; do
        if docker-compose -f docker-compose.prod.yml ps "$service" | grep -q "Up"; then
            print_status "$service is healthy"
        else
            print_error "$service is not running"
            return 1
        fi
    done
    
    # Check HTTP endpoints
    endpoints=(
        "http://localhost:3000"
        "http://localhost:3002/health"
        "http://localhost:3003/health"
        "http://localhost:3004/health"
        "http://localhost:3005/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s "$endpoint" > /dev/null; then
            print_status "$endpoint is responding"
        else
            print_warning "$endpoint is not responding"
        fi
    done
    
    print_status "Health checks completed"
}

# Run smoke tests
run_smoke_tests() {
    print_header "Running smoke tests..."
    
    # Test user registration
    print_status "Testing user registration..."
    curl -X POST http://localhost:3002/api/auth/register \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"test123","name":"Test User"}' \
        -f -s > /dev/null
    
    # Test user login
    print_status "Testing user login..."
    TOKEN=$(curl -X POST http://localhost:3002/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"test123"}' \
        -f -s | jq -r '.data.token')
    
    if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
        print_status "Authentication tests passed"
    else
        print_error "Authentication tests failed"
        return 1
    fi
    
    # Test signaling health
    print_status "Testing signaling health..."
    curl -f http://localhost:3002/health -s > /dev/null
    
    print_status "Smoke tests completed"
}

# Cleanup old images
cleanup() {
    print_header "Cleaning up old images..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove old backups (keep last 7 days)
    find "$BACKUP_DIR" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true
    
    print_status "Cleanup completed"
}

# Rollback function
rollback() {
    print_header "Rolling back deployment..."
    
    # Stop current services
    docker-compose -f docker-compose.prod.yml down
    
    # Restore from latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR" | head -1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        print_status "Restoring from backup $LATEST_BACKUP..."
        
        # Restore database
        if [ -f "$BACKUP_DIR/$LATEST_BACKUP/database.sql" ]; then
            docker-compose -f docker-compose.prod.yml up -d postgres
            sleep 10
            docker exec -i callstack_postgres psql -U callstack callstack < "$BACKUP_DIR/$LATEST_BACKUP/database.sql"
        fi
        
        # Restore configuration
        cp "$BACKUP_DIR/$LATEST_BACKUP/.env.$ENVIRONMENT" ".env.$ENVIRONMENT"
        
        print_status "Rollback completed"
    else
        print_error "No backup found for rollback"
        exit 1
    fi
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            -d "{\"text\":\"CallStack Deployment $status: $message\"}"
    fi
    
    # Send email notification if configured
    if [ -n "$NOTIFICATION_EMAIL" ]; then
        echo "$message" | mail -s "CallStack Deployment $status" "$NOTIFICATION_EMAIL"
    fi
}

# Main deployment function
main() {
    print_header "Starting CallStack deployment to $ENVIRONMENT"
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Check prerequisites
    check_prerequisites
    
    # Create backup
    create_backup
    
    # Run migrations
    run_migrations
    
    # Deploy services
    deploy_services
    
    # Health check
    if health_check; then
        # Run smoke tests
        if run_smoke_tests; then
            print_status "Deployment completed successfully!"
            send_notification "SUCCESS" "CallStack has been successfully deployed to $ENVIRONMENT"
            
            # Cleanup
            cleanup
        else
            print_error "Smoke tests failed, rolling back..."
            rollback
            send_notification "FAILED" "CallStack deployment to $ENVIRONMENT failed during smoke tests"
            exit 1
        fi
    else
        print_error "Health checks failed, rolling back..."
        rollback
        send_notification "FAILED" "CallStack deployment to $ENVIRONMENT failed during health checks"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "rollback")
        rollback
        ;;
    "health")
        health_check
        ;;
    "backup")
        create_backup
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        main
        ;;
esac