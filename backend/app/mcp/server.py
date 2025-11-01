from mcp.server.fastmcp import FastMCP

# Import registration functions



# Create the FastMCP server instance
mcp = FastMCP(
    "The Journal MCP Server",
    instructions="Handles note management and synchronization for The Journal application.",
)


# Register all components


if __name__ == "__main__":
    mcp.run()