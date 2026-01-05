function RecycleBinActions({ onRestore, onPermanentDelete }) {
    return (
        <div id="recycle-bin-actions-container">
            <h3>Recycle Bin</h3>
            <p>This note is in the recycle bin.</p>
            <div className="action-buttons">
                <button
                    id="restore-note-btn"
                    className="action-btn restore"
                    onClick={onRestore}
                >
                    Restore Note
                </button>
                <button
                    id="perm-delete-note-btn"
                    className="action-btn permanent-delete"
                    onClick={onPermanentDelete}
                >
                    Permanently Delete
                </button>
            </div>
        </div>
    );
}

export default RecycleBinActions;
