#!/bin/bash
# Exit on error
set -e
# Debugging option
set -x

start_docker_compose() {
    echo "Starting Docker Compose services..."
    docker-compose up --build -d
}

check_services() {
    echo "Checking service status..."
    docker-compose ps
}

echo "Starting application..."
start_docker_compose
check_services
echo "Application started successfully."
