from mcp.server.fastmcp import FastMCP

# Import registration functions
from git_work_tracker.tools.git_tracker import register_git_tools
from git_work_tracker.prompts.git_prompts import register_git_prompts 


# Create the FastMCP server instance
mcp = FastMCP(
    "Git Work Tracker",
    instructions="""
    This server helps you track and document your daily development work.
    
    **Main Features:**
    - Generate comprehensive work notes from today's git commits
    - View commit details with diffs and statistics
    - Check repository status and uncommitted changes
    - Get help with commit messages and work summaries
    
    **Primary Tool:**
    - `generate_work_note`: Creates a detailed markdown note of all today's commits
      with diffs, statistics, and context. Perfect for end-of-day documentation.
    
    **Usage Examples:**
    - "Make a note of today's work"
    - "Show me what I committed today"
    - "Generate a work summary with all the diffs"
    - "Create standup notes from my commits"
    """
)


# Register all components
register_git_tools(mcp)
register_git_prompts(mcp)

if __name__ == "__main__":
    mcp.run()