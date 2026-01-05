function TabBar({ notes, openNoteIds, activeNoteId, onTabSelect, onTabClose }) {
    const openNotes = [...openNoteIds]
        .map(id => notes.find(n => n.id === id))
        .filter(Boolean);

    return (
        <div id="tab-bar">
            {openNotes.map(note => (
                <div
                    key={note.id}
                    className={`tab-item ${note.id === activeNoteId ? 'active' : ''}`}
                >
                    <span
                        className="tab-title"
                        onClick={() => onTabSelect(note.id)}
                    >
                        {note.title || 'Untitled Note'}
                    </span>
                    <button
                        className="tab-close-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onTabClose(note.id);
                        }}
                    >
                        &times;
                    </button>
                </div>
            ))}
        </div>
    );
}

export default TabBar;
