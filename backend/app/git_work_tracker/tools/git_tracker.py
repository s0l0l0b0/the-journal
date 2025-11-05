import asyncio
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
from mcp.server.fastmcp import FastMCP, Context


async def run_git_command(command: list[str], cwd: str) -> tuple[str, str, int]:
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
    stdout, stderr, returncode = await run_git_command(
        ['git', 'rev-parse', '--show-toplevel'],
        cwd=path)
    
    if returncode == 0:
        return stdout.strip()
    return None

async def get_commits_today(repo_path: str, author: Optional[str] = None) -> list[dict]:
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    since_date = today.strftime('%Y-%m-%d')

    # build git log command
    cmd = [
        'git', 'log',
        f'--since={since_date}',
        '--pretty=format:%H|%an|%ad|%s',
        '--date=iso'
    ]

    if author:
        cmd.append(f'--author={author}')

    stdout, stderr, code = await run_git_command(cmd, repo_path)

    if code != 0:
        return []
    
    commits = []
    for line in stdout.strip().split('\n'):
        if not line:
            continue

        parts = line.split('|', 4)
        if len(parts) < 5:
            commits.append({
                'hash': parts[0],
                'author': parts[1],
                'email': parts[2],
                'date': parts[3],
                'message': parts[4]
            })

    return commits

async def get_commit_diff(repo_path: str, commit_hash: str) -> str:
    stdout, stderr, code = await run_git_command(
        ['git', 'show', commit_hash, "--format=", "--patch"],
        repo_path
    )

    if code != 0:
        return f"Error getting diff: {stderr}"
    
    return stdout

async def get_commit_stats(repo_path: str, commit_hash: str) -> dict:
    stdout, stderr, code = await run_git_command(
        ['git', 'show', commit_hash, '--stat', "--format="],
        repo_path
    )

    if code != 0:
        return {"error": stderr}
    
    lines = stdout.strip().split('\n')
    stats = {
        'files_changed': [],
        'total_insertions': 0,
        'total_deletions': 0
    }

    for line in lines:
        if '|' in line:
            parts = line.split('|')
            if len(parts) >= 2:
                file_change = parts[0].strip()
                changes = parts[1].strip()
                insertions = changes.count('+')
                deletions = changes.count('-')
                stats['files_changed'].append({
                    'file': file_change,
                    'insertions': insertions,
                    'deletions': deletions
                })
        
        elif 'changed' in line:
            if 'insertion' in line:
                try:
                    stats['total_insertions'] = int(line.split()[3])
                except (IndexError, ValueError):
                    pass
            if 'deletion' in line:
                try:
                    stats['total_deletions'] = int(line.split()[5])
                except (IndexError, ValueError):
                    pass
    return stats

async def get_current_branch(repo_path: str) -> Optional[str]:
    stdout, stderr, code = await run_git_command(
        ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
        repo_path
    )

    if code != 0:
        return None
    
    return stdout.strip()

async def get_repo_status(repo_path: str) -> str:
    stdout, stderr, code = await run_git_command(
        ['git', 'status', '--short'],
        repo_path
    )

    if code != 0:
        return f"Error getting status: {stderr}"
    
    return stdout.strip()

async def format_work_note(repo_path: str, commits: list[dict], include_diffs: bool = True, include_stats: bool = True) -> str:

    branch = await get_current_branch(repo_path) or "unknown"
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
            
            if include_stats:
                stats = await get_commit_stats(repo_path, commit['hash'])
                if "error" not in stats:
                    note += "**Changes:**\n"
                    for file_change in stats['files_changed']:
                        note += f"- `{file_change['file']}` {file_change['changes']}\n"
                    note += f"\n**Total:** +{stats['total_insertions']} -{stats['total_deletions']}\n\n"
            
            if include_diffs:
                note += "### Diff\n\n```diff\n"
                diff = await get_commit_diff(repo_path, commit['hash'])
                note += diff
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
    async def generate_work_note(
        ctx: Context,
        repo_path: Optional[str] = None,
        include_diffs: bool = True,
        include_stats: bool = True,
        author: Optional[str] = None
    ) -> str:
        """
        Generate a comprehensive work note for today's commits.
        
        Args:
            repo_path: Path to the git repository (defaults to current directory)
            include_diffs: Include full git diffs for each commit
            include_stats: Include file change statistics
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
        note = await format_work_note(git_root, commits, include_diffs, include_stats)
        
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
        include_diff: bool = True
    ) -> dict:
        """
        Get detailed information about a specific commit.
        
        Args:
            commit_hash: The commit hash (full or abbreviated)
            repo_path: Path to the git repository
            include_diff: Include the full diff
        
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
            diff = await get_commit_diff(git_root, commit_hash)
            result["diff"] = diff
        
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
