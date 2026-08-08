#!/bin/bash

# Script to start the Alibaba Cloud DevOps MCP Server locally
# Usage: mcp-server [mode] [options]
# Modes: stdio (default), sse
# Options: --build, --env-file, --port

set -e  # Exit on any error

# Get the actual directory of the script, not the symlink
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
if [[ -L "${BASH_SOURCE[0]}" ]]; then
    # If the script is a symlink, get the directory of the target
    REAL_PATH="$(readlink "${BASH_SOURCE[0]}")"
    if [[ $REAL_PATH == /* ]]; then
        # Absolute path
        SCRIPT_DIR="$(cd "$(dirname "$REAL_PATH")" &>/dev/null && pwd)"
    else
        # Relative path
        SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && cd "$(dirname "$REAL_PATH")" &>/dev/null && pwd)"
    fi
fi

# Change to the project directory
cd "$SCRIPT_DIR"

# Default values
MODE="stdio"
BUILD=false
ENV_FILE=".env"
PORT=3000

# Function to display usage
usage() {
    echo "Usage: mcp-server [OPTIONS] [MODE]"
    echo ""
    echo "Start the Alibaba Cloud DevOps MCP Server locally"
    echo ""
    echo "MODE:"
    echo "  stdio    Start in stdio mode (default)"
    echo "  sse      Start in SSE mode"
    echo ""
    echo "OPTIONS:"
    echo "  --build          Build the project before starting"
    echo "  --env-file FILE  Specify environment file (default: .env)"
    echo "  --port PORT      Specify port for SSE mode (default: 3000)"
    echo "  --help           Display this help message"
    echo ""
    echo "Examples:"
    echo "  mcp-server                    # Start in stdio mode"
    echo "  mcp-server sse               # Start in SSE mode"
    echo "  mcp-server --build sse       # Build and start in SSE mode"
    echo "  mcp-server --port 8080 sse   # Start in SSE mode on port 8080"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD=true
            shift
            ;;
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        --help)
            usage
            exit 0
            ;;
        stdio|sse)
            MODE="$1"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed or not in PATH"
    exit 1
fi

# Check if the environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Warning: Environment file '$ENV_FILE' not found"
    echo "Please create a .env file with your configuration"
fi

# Build the project if requested
if [ "$BUILD" = true ]; then
    echo "Building the project..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "Error: Build failed"
        exit 1
    fi
    echo "Build completed successfully"
fi

# Check if the dist directory exists
if [ ! -d "dist" ]; then
    echo "Error: dist directory not found. Please build the project first with --build option"
    exit 1
fi

# Check if the main entry point exists
if [ ! -f "dist/index.js" ]; then
    echo "Error: dist/index.js not found. Please build the project first with --build option"
    exit 1
fi

# Start the server based on the mode
if [ "$MODE" = "sse" ]; then
    echo "Starting Alibaba Cloud DevOps MCP Server in SSE mode..."
    echo "Port: $PORT"
    echo "Environment file: $ENV_FILE"
    echo ""
    echo "Server will be available at:"
    echo "  SSE endpoint: http://localhost:$PORT/sse"
    echo "  Messages endpoint: http://localhost:$PORT/messages?sessionId=<session-id>"
    echo ""
    echo "Starting server..."
    
    # Set the port and environment file
    PORT=$PORT ENV_FILE=$ENV_FILE npm run start:sse
else
    echo "Starting Alibaba Cloud DevOps MCP Server in stdio mode..."
    echo "Environment file: $ENV_FILE"
    echo ""
    echo "Server is ready to accept JSON-RPC messages via stdin/stdout"
    echo ""
    echo "Starting server..."
    
    # Set the environment file and start in stdio mode
    ENV_FILE=$ENV_FILE npm start
fi