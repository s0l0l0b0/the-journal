function NoteItem({ note, isSelected, onClick }) {
    const date = new Date(note.updated_at);

    return (
        <li
            className={`note-item ${isSelected ? 'selected' : ''}`}
            onClick={onClick}
        >
            <div className="note-item-title">
                {note.title || 'Untitled Note'}
            </div>
            <div className="note-item-date">
                {date.toLocaleString()}
            </div>
        </li>
    );
}

export default NoteItem;
