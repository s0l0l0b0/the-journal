from mcp.server.fastmcp import FastMCP
from mcp.server.fastmcp.prompts import base


def register_prompts(mcp: FastMCP):
    @mcp.prompt(
        "note_management.create_note",
        "Creates a new note with the given title and content.",
        base.TextPrompt,
    )
    def create_note_prompt(title: str, content: str) -> str:
        return f"Create a note titled '{title}' with the following content:\n{content}"

    @mcp.prompt(
        "note_management.update_note",
        "Updates an existing note identified by note_id with new content.",
        base.TextPrompt,
    )
    def update_note_prompt(note_id: str, new_content: str) -> str:
        return f"Update the note with ID '{note_id}' to have the following new content:\n{new_content}"

    @mcp.prompt(
        "note_management.delete_note",
        "Deletes the note identified by note_id.",
        base.TextPrompt,
    )
    def delete_note_prompt(note_id: str) -> str:
        return f"Delete the note with ID '{note_id}'."