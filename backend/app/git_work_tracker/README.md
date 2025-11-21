## mcp
This directory will have mcp implementations 

## ⚡ Key Features

### 1. **Fully Async** 
All git operations run asynchronously using `asyncio.create_subprocess_exec`

### 2. **Comprehensive Work Notes**
- All commits from today with messages
- Full git diffs (exactly like GitHub)
- File change statistics
- Uncommitted changes tracking
- Formatted in beautiful Markdown
- Shows detailed uncommitted changes with diffs
"Show me my uncommitted changes"
"What am I currently working on?"
- Preview what will be in the next commit (staged only)
"Preview what I'm about to commit"
"Show me staged changes"

### 3. **Smart Tools**
- `generate_work_note` - Main tool for daily summaries
- `list_todays_commits` - Quick commit overview
- `get_commit_details` - Deep dive into specific commits
- `check_git_status` - Repository status check

### 4. **Helpful Prompts**
- Daily work summaries
- Standup notes generation
- Commit message suggestions
- Weekly summaries


#### To run the server in dev mode go to the /backend/app/git_work_tracker/ directory and run:
uv run mcp dev server.py

### 3. Configure in VS Code

**File:** `~/.vscode/mcp.json` (Mac/Linux) or `%APPDATA%\Code\User\mcp.json` (Windows)

```json
{
  "mcpServers": {
    "git-tracker": {
      "command": "python",
      "args": ["/absolute/path/to/server.py"],
      "env": {
        "PYTHONPATH": "/absolute/path/to/git_work_tracker"
      }
    }
  }
}
```

### 4. Configure in Cursor

**File:** `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "git-tracker": {
      "command": "uv",
      "args": ["run", "server.py"],
      "cwd": "/absolute/path/to/git_work_tracker"
    }
  }
}
```

### 5. Configure in PyCharm (via Continue plugin)

1. Install Continue plugin
2. Open Continue settings
3. Add MCP server:

```json
{
  "mcpServers": {
    "git-tracker": {
      "command": "python",
      "args": ["/absolute/path/to/server.py"]
    }
  }
}
```

## 🎯 Usage in IDE

Once configured, you can use natural language in your AI chat:

### Generate Daily Work Note

```
You: "Make a note of today's work"
AI: *calls generate_work_note tool*
```

Output in terminal:
```markdown
# Work Note - November 6, 2025

**Repository:** `my-project`
**Branch:** `feature/new-feature`
**Total Commits Today:** 3

---

## Commit 1: Add user authentication

**Hash:** `a1b2c3d4`
**Author:** John Doe <john@example.com>
**Date:** 2025-11-06 10:30:00

**Changes:**
- `auth.py` +45 -10
- `models.py` +20 -5

**Total:** +65 -15

### Diff

```diff
diff --git a/auth.py b/auth.py
+ def authenticate_user(username, password):
+     # Implementation
...
```
```

### Other Commands

```
"Show me what I committed today"
"List all my commits with stats"
"Create standup notes from today's work"
"Generate a work summary with diffs"
"Check git status"
"What did I change in commit a1b2c3d4?"
```

## 🔧 Tool Reference

### `generate_work_note`

The main tool for generating comprehensive work notes.

**Arguments:**
- `repo_path` (optional): Path to git repository (defaults to current dir)
- `include_diffs` (bool): Include full diffs (default: true)
- `include_stats` (bool): Include file statistics (default: true)
- `author` (optional): Filter by author name

**Returns:** Formatted markdown work note

**Example:**
```python
# In terminal test
result = await session.call_tool(
    "generate_work_note",
    arguments={
        "include_diffs": True,
        "include_stats": True
    }
)
```

### `list_todays_commits`

Quick overview of today's commits.

**Returns:** JSON with commit list and basic info

### `get_commit_details`

Detailed information about a specific commit.

**Arguments:**
- `commit_hash`: The commit hash
- `repo_path` (optional): Repository path
- `include_diff` (bool): Include diff (default: true)

### `check_git_status`

Current repository status and uncommitted changes.

## 📝 Example Work Note Output

```markdown
# Work Note - November 6, 2025

**Repository:** `awesome-app`
**Branch:** `main`
**Total Commits Today:** 2

---

## Commit 1: Fix authentication bug

**Hash:** `abc12345`
**Author:** Jane Developer <jane@dev.com>
**Date:** 2025-11-06 14:23:15 +0530

**Changes:**
- `auth/login.py` +++++++++++++++----------- (24 changes)
- `tests/test_auth.py` +++++++++ (15 changes)

**Total:** +30 -11

### Diff

```diff
diff --git a/auth/login.py b/auth/login.py
index 1234567..abcdefg 100644
--- a/auth/login.py
+++ b/auth/login.py
@@ -10,7 +10,7 @@ def validate_user(username, password):
     user = User.query.filter_by(username=username).first()
-    if user and user.password == password:
+    if user and check_password_hash(user.password_hash, password):
         return user
     return None
```

---

## Commit 2: Add user profile endpoint

**Hash:** `def67890`
**Author:** Jane Developer <jane@dev.com>
**Date:** 2025-11-06 16:45:30 +0530

**Changes:**
- `api/routes.py` ++++++++++++++++++++++ (42 changes)
- `models/user.py` ++++++ (8 changes)

**Total:** +50 -0

### Diff

```diff
diff --git a/api/routes.py b/api/routes.py
index abcd123..efgh456 100644
--- a/api/routes.py
+++ b/api/routes.py
@@ -100,6 +100,20 @@ def login():
     return jsonify(token=token)
 
+@app.route('/api/profile', methods=['GET'])
+@login_required
+def get_profile():
+    """Get user profile information."""
+    user = current_user()
+    return jsonify({
+        'username': user.username,
+        'email': user.email,
+        'created_at': user.created_at
+    })
```

---

## 🚧 Uncommitted Changes

```
M  server.py
M  tools/git_tracker.py
?? test_new_feature.py
```
```

## 🎨 Advanced Usage

### Custom Author Filter

```
"Generate work note for author 'John Doe'"
```

### Without Diffs (Quick Summary)

```
"List today's commits without diffs"
```

### Specific Repository

```
"Generate work note for /path/to/my/repo"
```

## 🐛 Troubleshooting

### "Not a git repository" error

Make sure you're running from a git repository or specify the path:
```
generate_work_note(repo_path="/path/to/repo")
```

### No commits showing

The tool looks for commits made TODAY (since 00:00:00). Make sure you have commits from today.

### Permission errors

Ensure the MCP server has permission to run git commands and read the repository.

### Testing without IDE

Run the test script:
```bash
python test_git_tools.py
```

## 🔒 Privacy & Security

- All operations are read-only (no git write operations)
- Runs locally - no data sent to external services
- Only accesses repositories you specify
- Respects git permissions

## 💡 Tips

1. **End of Day Routine**: Run `generate_work_note` before leaving to document your day
2. **Standup Prep**: Use the standup notes prompt for quick meeting prep
3. **Code Review**: Generate notes with diffs for detailed code review docs
4. **Weekly Reports**: Combine daily notes for weekly progress reports

## 🚀 Next Steps

This is just a foundation! You can extend it with:

- Store notes automatically to a database
- Compare work between team members
- Generate changelogs automatically


**Made with ❤️ for developers who forget what they did yesterday**