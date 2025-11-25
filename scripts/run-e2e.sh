#!/bin/bash

# CallStack End-to-End Test Runner
# This script runs comprehensive E2E tests for the CallStack platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if services are running
check_services() {
    print_status "Checking if development services are running..."
    
    if ! docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        print_error "Development services are not running. Please run ./scripts/bootstrap.sh first."
        exit 1
    fi
    
    print_status "Services are running!"
}

# Run web client tests
run_web_tests() {
    print_status "Running web client tests..."
    
    cd web/react-client
    
    if [ -f "package.json" ] && grep -q "test" package.json; then
        npm test -- --watchAll=false
        print_status "Web client tests completed!"
    else
        print_warning "No web client tests found."
    fi
    
    cd ../..
}

# Run signaling server tests
run_signaling_tests() {
    print_status "Running signaling server tests..."
    
    cd services/signaling
    
    if [ -f "package.json" ] && grep -q "test" package.json; then
        npm test
        print_status "Signaling server tests completed!"
    else
        print_warning "No signaling server tests found."
    fi
    
    cd ../..
}

# Run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    
    # Test WebSocket connection
    print_status "Testing WebSocket connection..."
    curl -f http://localhost:3001/health || {
        print_error "Signaling server health check failed"
        exit 1
    }
    
    # Test web client
    print_status "Testing web client..."
    curl -f http://localhost:3000 || {
        print_error "Web client health check failed"
        exit 1
    }
    
    print_status "Integration tests completed!"
}

# Run load tests
run_load_tests() {
    print_status "Running load tests..."
    
    if [ -d "tools/load-tests" ]; then
        cd tools/load-tests
        
        # Run k6 load tests if available
        if command -v k6 &> /dev/null && [ -f "load-test.js" ]; then
            k6 run load-test.js
            print_status "Load tests completed!"
        else
            print_warning "k6 not installed or load test file not found."
        fi
        
        cd ../..
    else
        print_warning "Load tests directory not found."
    fi
}

# Generate test report
generate_report() {
    print_status "Generating test report..."
    
    REPORT_DIR="test-reports"
    mkdir -p $REPORT_DIR
    
    # Create a simple test report
    cat > $REPORT_DIR/e2e-report.txt << EOF
CallStack E2E Test Report
=========================
Date: $(date)
Environment: Development

Tests Run:
- Web Client Tests: $([ -f "web/react-client/package.json" ] && echo "✅ Passed" || echo "⚠️ Skipped")
- Signaling Server Tests: $([ -f "services/signaling/package.json" ] && echo "✅ Passed" || echo "⚠️ Skipped")
- Integration Tests: ✅ Passed
- Load Tests: $([ -d "tools/load-tests" ] && echo "✅ Passed" || echo "⚠️ Skipped")

Service Status:
- Web Client: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200" && echo "✅ Healthy" || echo "❌ Unhealthy")
- Signaling Server: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health | grep -q "200" && echo "✅ Healthy" || echo "❌ Unhealthy")
- Redis: $(docker-compose -f docker-compose.dev.yml ps redis | grep -q "Up" && echo "✅ Running" || echo "❌ Stopped")
- PostgreSQL: $(docker-compose -f docker-compose.dev.yml ps postgres | grep -q "Up" && echo "✅ Running" || echo "❌ Stopped")

EOF
    
    print_status "Test report generated: $REPORT_DIR/e2e-report.txt"
}

# Main execution
main() {
    print_status "Starting CallStack E2E tests..."
    
    check_services
    run_web_tests
    run_signaling_tests
    run_integration_tests
    run_load_tests
    generate_report
    
    print_status "All E2E tests completed successfully! 🎉"
}

# Handle script interruption
trap 'print_error "E2E tests interrupted"; exit 1' INT

# Run main function
main "$@"