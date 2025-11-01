from mcp.server.fastmcp import FastMCP

def register_calculator_tools(mcp: FastMCP):
    
    @mcp.tool("calculator.add", "Adds two numbers together.")
    def add(a: float, b: float) -> float:
        return a + b