"""
tools/git_tracker.py
Async Git tracking tools for generating work notes
"""

import asyncio
import httpx
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
from mcp.server.fastmcp import FastMCP, Context


async def run_git_command(command: list[str], cwd: str) -> tuple[str, str, int]:
    """
    Run a git command asynchronously.
    
    Returns:
        tuple: (stdout, stderr, return_code)
    """
    process = await asyncio.create_subprocess_exec(
        *command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=cwd
    )
    
    stdout, stderr = await process.communicate()
    return (
        stdout.decode('utf-8', errors='replace'),
        stderr.decode('utf-8', errors='replace'),
        process.returncode or 0
    )


async def get_git_root(path: str) -> Optional[str]:
    """Get the git repository root directory."""
    stdout, stderr, code = await run_git_command(
        ["git", "rev-parse", "--show-toplevel"],
        cwd=path
    )
    
    if code == 0:
        return stdout.strip()
    return None


async def get_commits_today(repo_path: str, author: Optional[str] = None) -> list[dict]:
    """Get all commits made today."""
    # Get commits from today (00:00:00)
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    since_date = today.strftime("%Y-%m-%d")
    
    # Build git log command
    cmd = [
        "git", "log",
        f"--since={since_date}",
        "--pretty=format:%H|%an|%ae|%ad|%s",
        "--date=iso"
    ]
    
    if author:
        cmd.append(f"--author={author}")
    
    stdout, stderr, code = await run_git_command(cmd, repo_path)
    
    if code != 0:
        return []
    
    commits = []
    for line in stdout.strip().split('\n'):
        if not line:
            continue
        
        parts = line.split('|', 4)
        if len(parts) == 5:
            commits.append({
                "hash": parts[0],
                "author": parts[1],
                "email": parts[2],
                "date": parts[3],
                "message": parts[4]
            })
    
    return commits


async def get_commit_diff(repo_path: str, commit_hash: str, skip_new_files: bool = True) -> tuple[str, list[str]]:
    """
    Get the full diff for a specific commit.
    
    Returns:
        tuple: (diff_text, list_of_new_files)
    """
    # First, get list of new files (added files)
    new_files = []
    if skip_new_files:
        stdout, stderr, code = await run_git_command(
            ["git", "show", commit_hash, "--name-status", "--format="],
            repo_path
        )
        
        if code == 0:
            for line in stdout.strip().split('\n'):
                if line.startswith('A\t'):
                    # This is a newly added file
                    new_files.append(line[2:].strip())
    
    # Get the full diff
    stdout, stderr, code = await run_git_command(
        ["git", "show", commit_hash, "--format=", "--patch"],
        repo_path
    )
    
    if code != 0:
        return f"Error getting diff: {stderr}", new_files
    
    # If we're skipping new files, filter them out from the diff
    if skip_new_files and new_files:
        diff_lines = []
        current_file = None
        skip_current = False
        
        for line in stdout.split('\n'):
            # Detect file headers
            if line.startswith('diff --git'):
                # Extract filename from "diff --git a/file b/file"
                parts = line.split()
                if len(parts) >= 4:
                    current_file = parts[2][2:]  # Remove "a/" prefix
                    skip_current = current_file in new_files
            
            # Skip lines if we're in a new file
            if not skip_current:
                diff_lines.append(line)
        
        return '\n'.join(diff_lines), new_files
    
    return stdout, new_files


async def get_commit_stats(repo_path: str, commit_hash: str) -> dict:
    """Get statistics for a commit (files changed, insertions, deletions)."""
    stdout, stderr, code = await run_git_command(
        ["git", "show", commit_hash, "--stat", "--format="],
        repo_path
    )
    
    if code != 0:
        return {"error": stderr}
    
    # Parse the stats
    lines = stdout.strip().split('\n')
    stats = {
        "files_changed": [],
        "total_insertions": 0,
        "total_deletions": 0
    }
    
    for line in lines:
        if '|' in line:
            # File change line
            parts = line.split('|')
            if len(parts) == 2:
                filename = parts[0].strip()
                changes = parts[1].strip()
                stats["files_changed"].append({
                    "file": filename,
                    "changes": changes
                })
        elif 'changed' in line:
            # Summary line
            if 'insertion' in line:
                try:
                    stats["total_insertions"] = int(line.split()[3])
                except (IndexError, ValueError):
                    pass
            if 'deletion' in line:
                try:
                    stats["total_deletions"] = int(line.split()[5])
                except (IndexError, ValueError):
                    pass
    
    return stats


async def get_current_branch(repo_path: str) -> str:
    """Get the current git branch name."""
    stdout, stderr, code = await run_git_command(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"],
        repo_path
    )
    
    if code != 0:
        return "unknown"
    
    return stdout.strip()


async def get_repo_status(repo_path: str) -> str:
    """Get current repository status (uncommitted changes)."""
    stdout, stderr, code = await run_git_command(
        ["git", "status", "--short"],
        repo_path
    )
    
    if code != 0:
        return "Error getting status"
    
    return stdout


async def get_uncommitted_diff(repo_path: str, staged_only: bool = False) -> tuple[str, list[str], list[str]]:
    """
    Get diff of uncommitted changes.
    
    Args:
        repo_path: Path to git repository
        staged_only: If True, only show staged changes; if False, show all changes
    
    Returns:
        tuple: (diff_text, modified_files, new_files)
    """
    # Get list of changed files
    status_stdout, _, status_code = await run_git_command(
        ["git", "status", "--short"],
        repo_path
    )
    
    if status_code != 0:
        return "Error getting status", [], []
    
    # Parse status to identify new files and modified files
    new_files = []
    modified_files = []
    
    for line in status_stdout.strip().split('\n'):
        if not line:
            continue
        
        # Status format: XY filename
        # X = staged, Y = unstaged
        status_code = line[:2]
        filename = line[3:].strip()
        
        # Check if it's a new file (A or ??)
        if status_code.strip().startswith('A') or status_code.strip() == '??':
            new_files.append(filename)
        else:
            modified_files.append(filename)
    
    # Get the appropriate diff
    if staged_only:
        # Diff of staged changes
        cmd = ["git", "diff", "--cached"]
    else:
        # Diff of all changes (staged + unstaged)
        cmd = ["git", "diff", "HEAD"]
    
    stdout, stderr, code = await run_git_command(cmd, repo_path)
    
    if code != 0:
        # If HEAD doesn't exist (new repo), try without HEAD
        cmd = ["git", "diff"]
        stdout, stderr, code = await run_git_command(cmd, repo_path)
        
        if code != 0:
            return f"Error getting diff: {stderr}", modified_files, new_files
    
    return stdout, modified_files, new_files


async def get_staged_files(repo_path: str) -> list[dict]:
    """Get list of staged files with their status."""
    stdout, stderr, code = await run_git_command(
        ["git", "diff", "--cached", "--name-status"],
        repo_path
    )
    
    if code != 0:
        return []
    
    files = []
    for line in stdout.strip().split('\n'):
        if not line:
            continue
        
        parts = line.split('\t', 1)
        if len(parts) == 2:
            status = parts[0]
            filename = parts[1]
            files.append({
                "status": status,
                "filename": filename,
                "is_new": status == 'A'
            })
    
    return files


async def get_unstaged_files(repo_path: str) -> list[dict]:
    """Get list of unstaged files with their status."""
    stdout, stderr, code = await run_git_command(
        ["git", "status", "--short"],
        repo_path
    )
    
    if code != 0:
        return []
    
    files = []
    for line in stdout.strip().split('\n'):
        if not line:
            continue
        
        # Status format: XY filename (X=staged, Y=unstaged)
        status_codes = line[:2]
        filename = line[3:].strip()
        
        # Check unstaged status (second character)
        unstaged = status_codes[1] if len(status_codes) > 1 else ' '
        
        if unstaged != ' ' and unstaged != '?':
            files.append({
                "status": unstaged,
                "filename": filename,
                "is_modified": unstaged == 'M',
                "is_deleted": unstaged == 'D'
            })
        elif status_codes == '??':
            # Untracked file
            files.append({
                "status": '??',
                "filename": filename,
                "is_new": True
            })
    
    return files


async def format_work_note(
    repo_path: str,
    commits: list[dict],
    include_diffs: bool = True,
    include_stats: bool = True,
    skip_new_file_diffs: bool = True
) -> str:
    """Format all commit information into a readable work note."""
    
    branch = await get_current_branch(repo_path)
    status = await get_repo_status(repo_path)
    
    # Start building the note
    note = f"""
# Work Note - {datetime.now().strftime('%B %d, %Y')}

**Repository:** `{Path(repo_path).name}`
**Branch:** `{branch}`
**Total Commits Today:** {len(commits)}

---

"""
    
    if not commits:
        note += "No commits made today.\n\n"
    else:
        for idx, commit in enumerate(commits, 1):
            note += f"## Commit {idx}: {commit['message']}\n\n"
            note += f"**Hash:** `{commit['hash'][:8]}`\n"
            note += f"**Author:** {commit['author']} <{commit['email']}>\n"
            note += f"**Date:** {commit['date']}\n\n"
            
            # Get new files list first
            diff_text, new_files = await get_commit_diff(repo_path, commit['hash'], skip_new_file_diffs)
            
            if include_stats:
                stats = await get_commit_stats(repo_path, commit['hash'])
                if "error" not in stats:
                    note += "**Changes:**\n"
                    
                    # Separate new files and modified files
                    modified_files = []
                    for file_change in stats['files_changed']:
                        if file_change['file'] not in new_files:
                            modified_files.append(file_change)
                    
                    # Show new files first (without changes detail)
                    if new_files:
                        note += "\n**New Files:**\n"
                        for new_file in new_files:
                            note += f"- ✨ `{new_file}` (new file)\n"
                    
                    # Show modified files with change stats
                    if modified_files:
                        note += "\n**Modified Files:**\n"
                        for file_change in modified_files:
                            note += f"- `{file_change['file']}` {file_change['changes']}\n"
                    
                    note += f"\n**Total:** +{stats['total_insertions']} -{stats['total_deletions']}\n\n"
            
            if include_diffs:
                # Show new files summary
                if new_files and skip_new_file_diffs:
                    note += "### 📄 New Files\n\n"
                    for new_file in new_files:
                        note += f"- `{new_file}`\n"
                    note += "\n*Full content of new files omitted for brevity.*\n\n"
                
                # Show diffs only for modified files
                if diff_text.strip():
                    note += "### 📝 Changes (Modified Files)\n\n```diff\n"
                    note += diff_text
                    note += "\n```\n\n"
            
            note += "---\n\n"
    
    # Add current status if there are uncommitted changes
    if status.strip():
        note += "## 🚧 Uncommitted Changes\n\n"
        note += "```\n"
        note += status
        note += "```\n\n"
    
    return note


def register_git_tools(mcp: FastMCP):
    """Register git tracking tools with the MCP server."""

    @mcp.tool()
    async def save_journal_note(
        ctx: Context,
        title: str,
        content: str,
        api_url: str = "http://127.0.0.1:8000"
    ) -> str:
        """
        Save a generated note, summary, or report to the Journal database.
        
        Use this tool when you want to persist the output of your analysis or 
        summarization into the user's permanent journal.
        
        Args:
            title: The title of the note (e.g., "Work Summary - Dec 8")
            content: The markdown content of the note
            api_url: The URL of the Journal API (defaults to local server)
        """
        await ctx.info(f"💾 Saving note '{title}' to journal...")
        
        async with httpx.AsyncClient() as client:
            try:
                # We try to hit the backend API
                response = await client.post(
                    f"{api_url}/notes",
                    json={"title": title, "content": content},
                    timeout=10.0
                )
                
                if response.status_code == 201:
                    data = response.json()
                    note_id = data.get("id", "unknown")
                    await ctx.info(f"✅ Note saved successfully (ID: {note_id})")
                    return f"Successfully saved note to journal with ID: {note_id}"
                else:
                    error_msg = f"API returned error {response.status_code}: {response.text}"
                    await ctx.error(error_msg)
                    return f"Failed to save note. {error_msg}"
                    
            except httpx.ConnectError:
                msg = "Could not connect to the Journal API. Is the main application running on port 8000?"
                await ctx.error(msg)
                return f"Error: {msg}"
            except Exception as e:
                await ctx.error(f"Unexpected error: {str(e)}")
                return f"Error saving note: {str(e)}"
    
    @mcp.tool()
    async def generate_work_note(
        ctx: Context,
        repo_path: Optional[str] = None,
        include_diffs: bool = True,
        include_stats: bool = True,
        skip_new_file_diffs: bool = True,
        author: Optional[str] = None
    ) -> str:
        """
        Generate a comprehensive work note for today's commits.
        
        Args:
            repo_path: Path to the git repository (defaults to current directory)
            include_diffs: Include git diffs for modified files
            include_stats: Include file change statistics
            skip_new_file_diffs: Skip full content of new files (recommended, default: True)
            author: Filter commits by author (defaults to all authors)
        
        Returns:
            A formatted markdown note with all commit information
        """
        await ctx.info(f"🔍 Generating work note for {datetime.now().strftime('%B %d, %Y')}...")
        
        # Use current directory if no path provided
        if not repo_path:
            repo_path = "."
        
        # Verify it's a git repository
        git_root = await get_git_root(repo_path)
        if not git_root:
            return f"❌ Error: '{repo_path}' is not a git repository"
        
        await ctx.info(f"📁 Repository: {git_root}")
        
        # Get commits
        await ctx.info("📝 Fetching commits...")
        commits = await get_commits_today(git_root, author)
        
        await ctx.info(f"✅ Found {len(commits)} commits")
        
        # Generate the note
        await ctx.info("📄 Formatting work note...")
        note = await format_work_note(git_root, commits, include_diffs, include_stats, skip_new_file_diffs)
        
        await ctx.info("✨ Work note generated successfully!")
        
        return note
    
    @mcp.tool()
    async def list_todays_commits(
        repo_path: Optional[str] = None,
        author: Optional[str] = None
    ) -> dict:
        """
        List all commits made today with basic information.
        
        Args:
            repo_path: Path to the git repository
            author: Filter by author name
        
        Returns:
            Dictionary with commit information
        """
        if not repo_path:
            repo_path = "."
        
        git_root = await get_git_root(repo_path)
        if not git_root:
            return {"error": "Not a git repository"}
        
        commits = await get_commits_today(git_root, author)
        branch = await get_current_branch(git_root)
        
        return {
            "repository": Path(git_root).name,
            "branch": branch,
            "date": datetime.now().strftime('%Y-%m-%d'),
            "commit_count": len(commits),
            "commits": [
                {
                    "hash": c["hash"][:8],
                    "message": c["message"],
                    "author": c["author"],
                    "time": c["date"]
                }
                for c in commits
            ]
        }
    
    @mcp.tool()
    async def get_commit_details(
        commit_hash: str,
        repo_path: Optional[str] = None,
        include_diff: bool = True,
        skip_new_file_diffs: bool = True
    ) -> dict:
        """
        Get detailed information about a specific commit.
        
        Args:
            commit_hash: The commit hash (full or abbreviated)
            repo_path: Path to the git repository
            include_diff: Include the full diff
            skip_new_file_diffs: Skip full content of new files (default: True)
        
        Returns:
            Detailed commit information
        """
        if not repo_path:
            repo_path = "."
        
        git_root = await get_git_root(repo_path)
        if not git_root:
            return {"error": "Not a git repository"}
        
        # Get commit info
        stdout, stderr, code = await run_git_command(
            ["git", "show", commit_hash, "--format=%H|%an|%ae|%ad|%s", "--no-patch"],
            git_root
        )
        
        if code != 0:
            return {"error": f"Commit not found: {stderr}"}
        
        parts = stdout.strip().split('|', 4)
        if len(parts) < 5:
            return {"error": "Failed to parse commit info"}
        
        result = {
            "hash": parts[0],
            "author": parts[1],
            "email": parts[2],
            "date": parts[3],
            "message": parts[4]
        }
        
        # Get stats
        stats = await get_commit_stats(git_root, commit_hash)
        result["stats"] = stats
        
        # Get diff if requested
        if include_diff:
            diff, new_files = await get_commit_diff(git_root, commit_hash, skip_new_file_diffs)
            result["diff"] = diff
            result["new_files"] = new_files
        
        return result
    
    @mcp.tool()
    async def check_git_status(repo_path: Optional[str] = None) -> dict:
        """
        Check the current status of the git repository.
        
        Args:
            repo_path: Path to the git repository
        
        Returns:
            Current repository status
        """
        if not repo_path:
            repo_path = "."
        
        git_root = await get_git_root(repo_path)
        if not git_root:
            return {"error": "Not a git repository"}
        
        branch = await get_current_branch(git_root)
        status = await get_repo_status(git_root)
        
        return {
            "repository": Path(git_root).name,
            "path": git_root,
            "branch": branch,
            "status": status,
            "has_uncommitted_changes": bool(status.strip())
        }

    


