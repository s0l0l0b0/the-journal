"""
prompts/git_prompts.py
Prompt templates for git work note generation
"""

from mcp.server.fastmcp import FastMCP
from mcp.server.fastmcp.prompts import base


def register_git_prompts(mcp: FastMCP):
    """Register git-related prompts with the MCP server."""
    
    @mcp.prompt()
    def daily_work_summary() -> list[base.Message]:
        """Generate a prompt for creating a daily work summary."""
        return [
            base.UserMessage(
                "Please generate a work note for today's commits. "
                "I want to see all my commits with their messages, diffs, and statistics."
            ),
            base.AssistantMessage(
                "I'll generate a comprehensive work note for you. Let me fetch today's commits..."
            )
        ]
    
    @mcp.prompt()
    def review_todays_work(focus_area: str = "general") -> str:
        """
        Generate a prompt for reviewing today's work with specific focus.
        
        Args:
            focus_area: What to focus on (general, bugs, features, refactoring)
        """
        focus_prompts = {
            "general": "Please review all my commits from today and summarize what I accomplished.",
            "bugs": "Please review today's commits and highlight any bug fixes or error handling improvements.",
            "features": "Please review today's commits and list the new features or functionality added.",
            "refactoring": "Please review today's commits and identify any code refactoring or improvements made."
        }
        
        return focus_prompts.get(
            focus_area,
            "Please review today's commits and provide a summary."
        )
    
    @mcp.prompt(title="Commit Message Helper")
    def suggest_commit_message(changes_summary: str) -> list[base.Message]:
        """
        Generate a prompt for creating better commit messages based on changes.
        
        Args:
            changes_summary: Brief summary of what changed
        """
        return [
            base.UserMessage(f"I made these changes: {changes_summary}"),
            base.UserMessage(
                "Please suggest a clear, descriptive commit message that follows best practices. "
                "It should be concise but informative enough that I'll understand it later."
            ),
            base.AssistantMessage(
                "I'll suggest a commit message following the conventional commits format:"
            )
        ]
    
    @mcp.prompt(title="Work Note with Context")
    def work_note_with_context(context: str = "") -> str:
        """
        Generate a work note with additional context.
        
        Args:
            context: Additional context about the work (sprint goals, ticket numbers, etc.)
        """
        base_prompt = "Generate a detailed work note for today including all commits, diffs, and statistics."
        
        if context:
            return f"{base_prompt}\n\nAdditional context: {context}"
        
        return base_prompt
    
    @mcp.prompt(title="Weekly Summary")
    def weekly_work_summary(week_start_date: str = "") -> list[base.Message]:
        """
        Generate a prompt for creating a weekly work summary.
        
        Args:
            week_start_date: Start date of the week (YYYY-MM-DD format)
        """
        return [
            base.UserMessage(
                f"Please generate a work summary for the week starting {week_start_date if week_start_date else 'this week'}. "
                "Include all commits grouped by day, major changes, and overall progress."
            ),
            base.AssistantMessage(
                "I'll compile a comprehensive weekly summary of your work, organizing commits by day "
                "and highlighting key changes and achievements."
            )
        ]
    
    @mcp.prompt(title="Compare Changes")
    def compare_commits(commit1: str, commit2: str) -> str:
        """
        Generate a prompt for comparing two commits.
        
        Args:
            commit1: First commit hash
            commit2: Second commit hash
        """
        return f"""Please compare these two commits and explain:
1. What changed between them
2. What was the purpose of these changes
3. Any potential issues or improvements

Commit 1: {commit1}
Commit 2: {commit2}
"""
    
    @mcp.prompt(title="Explain My Changes")
    def explain_todays_changes(audience: str = "technical") -> str:
        """
        Generate a prompt for explaining today's changes to different audiences.
        
        Args:
            audience: Target audience (technical, management, client)
        """
        explanations = {
            "technical": (
                "Generate a technical summary of today's commits for code review. "
                "Include implementation details, design decisions, and technical trade-offs."
            ),
            "management": (
                "Generate a high-level summary of today's work for management. "
                "Focus on features delivered, progress made, and business value. "
                "Avoid technical jargon."
            ),
            "client": (
                "Generate a user-friendly summary of today's work for the client. "
                "Explain what new features or improvements they can expect, "
                "and how it benefits them. Use simple, non-technical language."
            )
        }
        
        return explanations.get(
            audience,
            "Generate a summary of today's commits."
        )
    
    @mcp.prompt(title="Standup Notes")
    def standup_notes() -> list[base.Message]:
        """Generate a prompt for creating standup meeting notes from commits."""
        return [
            base.UserMessage(
                "Generate standup notes based on my commits from today. Format it as:\n"
                "**Yesterday:** (if applicable)\n"
                "**Today:** (what I accomplished)\n"
                "**Blockers:** (any issues or dependencies)\n"
                "**Next:** (what I plan to work on)"
            ),
            base.AssistantMessage(
                "I'll generate structured standup notes based on your commits:"
            )
        ]