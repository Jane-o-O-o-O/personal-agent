from bocha_search_mcp.server import server
import os
import sys

def main():
    """Initialize and run the MCP server."""

    # Check for required environment variables
    if "BOCHA_API_KEY" not in os.environ:
        print(
            "Error: BOCHA_API_KEY environment variable is required",
            file=sys.stderr,
        )
        print(
            "Get a Bocha API key from: "
            "https://open.bochaai.com",
            file=sys.stderr,
        )
        sys.exit(1)

    print("Starting Bocha Search MCP server...", file=sys.stderr)

    server.run(transport="stdio")

__all__ = ["main", "server"]
