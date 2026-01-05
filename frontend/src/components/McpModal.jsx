import { useState } from 'react';

function McpModal({ isOpen, onClose }) {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleClose = () => {
        if (dontShowAgain) {
            localStorage.setItem('mcp-dont-show-modal', 'true');
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            id="mcp-modal-overlay"
            className="modal-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div className="modal-container">
                <div className="modal-header">
                    <h2>MCP Server Started Successfully</h2>
                    <button
                        id="mcp-modal-close"
                        className="modal-close-btn"
                        onClick={handleClose}
                    >
                        &times;
                    </button>
                </div>

                <div className="modal-content">
                    <div className="modal-section">
                        <p><strong>Status:</strong> <span className="status-running">Running</span></p>
                        <p><strong>Server URL:</strong> <code>http://127.0.0.1:8001</code></p>
                        <p><strong>SSE Endpoint:</strong> <code>http://127.0.0.1:8001/sse</code></p>
                        <p><strong>Message Endpoint:</strong> <code>http://127.0.0.1:8001/messages/</code></p>
                    </div>

                    <div className="modal-section">
                        <h3>VS Code Integration</h3>
                        <p><strong>File:</strong> <code>~/.vscode/mcp.json</code> (Mac/Linux) or <code>%APPDATA%\Code\User\mcp.json</code> (Windows)</p>
                        <pre><code>{`{
  "mcpServers": {
    "git-tracker": {
      "url": "http://127.0.0.1:8001/sse"
    }
  }
}`}</code></pre>
                    </div>

                    <div className="modal-section">
                        <h3>Cursor Integration</h3>
                        <p><strong>File:</strong> <code>~/.cursor/mcp.json</code></p>
                        <pre><code>{`{
  "mcpServers": {
    "git-tracker": {
      "url": "http://127.0.0.1:8001/sse"
    }
  }
}`}</code></pre>
                    </div>

                    <div className="modal-section">
                        <h3>PyCharm Integration (via Continue plugin)</h3>
                        <ol>
                            <li>Install Continue plugin</li>
                            <li>Open Continue settings</li>
                            <li>Add MCP server configuration:</li>
                        </ol>
                        <pre><code>{`{
  "mcpServers": {
    "git-tracker": {
      "url": "http://127.0.0.1:8001/sse"
    }
  }
}`}</code></pre>
                    </div>

                    <div className="modal-footer">
                        <label>
                            <input
                                type="checkbox"
                                id="mcp-dont-show-again"
                                checked={dontShowAgain}
                                onChange={(e) => setDontShowAgain(e.target.checked)}
                            />
                            Don't show this again
                        </label>
                        <button
                            id="mcp-modal-ok-btn"
                            className="modal-ok-btn"
                            onClick={handleClose}
                        >
                            Got it
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default McpModal;
