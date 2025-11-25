#!/bin/bash

# CallStack Development Bootstrap Script
# This script sets up the development environment for the CallStack platform

set -e

echo "🚀 Bootstrapping CallStack development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_status "All prerequisites are met!"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Push Prisma schema to database
    if [ -f "prisma/schema.prisma" ]; then
        npm run db:push
        print_status "Database schema updated!"
    else
        print_warning "Prisma schema not found. Skipping database setup."
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    if [ -f "package.json" ]; then
        npm install
        print_status "Root dependencies installed!"
    fi
    
    # Install web client dependencies
    if [ -d "web/react-client" ]; then
        cd web/react-client
        npm install
        cd ../..
        print_status "Web client dependencies installed!"
    fi
    
    # Install signaling server dependencies
    if [ -d "services/signaling" ]; then
        cd services/signaling
        npm install
        cd ../..
        print_status "Signaling server dependencies installed!"
    fi
}

# Create environment files
create_env_files() {
    print_status "Creating environment files..."
    
    # Create .env for signaling server
    if [ ! -f "services/signaling/.env" ]; then
        cp services/signaling/.env.example services/signaling/.env
        print_status "Created signaling server .env file"
    fi
    
    # Create .env for web client
    if [ ! -f "web/react-client/.env.local" ]; then
        cat > web/react-client/.env.local << EOF
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
        print_status "Created web client .env.local file"
    fi
}

# Start development services
start_services() {
    print_status "Starting development services..."
    
    # Start Docker services
    docker-compose -f docker-compose.dev.yml up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are running
    if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        print_status "Development services are running!"
    else
        print_error "Failed to start development services"
        exit 1
    fi
}

# Show service URLs
show_urls() {
    print_status "Development environment is ready!"
    echo ""
    echo "🌐 Service URLs:"
    echo "   Web Client:     http://localhost:3000"
    echo "   Signaling:      http://localhost:3001"
    echo "   Health Check:   http://localhost:3001/health"
    echo "   Redis:          localhost:6379"
    echo "   PostgreSQL:     localhost:5432"
    echo ""
    echo "📊 Monitoring:"
    echo "   View logs:       docker-compose -f docker-compose.dev.yml logs -f"
    echo "   Stop services:   docker-compose -f docker-compose.dev.yml down"
    echo ""
    echo "🔧 Development:"
    echo "   Web client:      cd web/react-client && npm run dev"
    echo "   Signaling:       cd services/signaling && npm run dev"
    echo ""
}

# Main execution
main() {
    print_status "Starting CallStack development bootstrap..."
    
    check_prerequisites
    install_dependencies
    create_env_files
    setup_database
    start_services
    show_urls
    
    print_status "Bootstrap completed successfully! 🎉"
}

# Handle script interruption
trap 'print_error "Bootstrap interrupted"; exit 1' INT

# Run main function
main "$@"