import { useState, useCallback } from 'react';
import NoteItem from './NoteItem.jsx';
import { useTheme } from '../context/ThemeContext';

function Sidebar({ notes, activeNoteId, isRecycleBinView, onNoteSelect, onNewNote, onRecycleBinClick }) {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const handleMouseEnter = useCallback(() => setIsOpen(true), []);
    const handleMouseLeave = useCallback(() => setIsOpen(false), []);

    return (
        <>
            {/* Invisible trigger zone */}
            <div
                id="sidebar-trigger-zone"
                onMouseEnter={handleMouseEnter}
            />

            <div
                id="sidebar"
                className={isOpen ? 'is-open' : ''}
                onMouseLeave={handleMouseLeave}
            >
                <div id="sidebar-header">
                    <button
                        id="new-note-btn"
                        className="sidebar-btn"
                        onClick={onNewNote}
                        disabled={isRecycleBinView}
                    >
                        New Note
                    </button>
                </div>

                <div id="notes-list-container">
                    <ul id="notes-list">
                        {notes.map(note => (
                            <NoteItem
                                key={note.id}
                                note={note}
                                isSelected={note.id === activeNoteId}
                                onClick={() => onNoteSelect(note.id)}
                            />
                        ))}
                    </ul>
                </div>

                <div id="sidebar-footer">
                    <button
                        id="theme-toggle-btn"
                        className="sidebar-btn"
                        onClick={toggleTheme}
                        style={{ marginBottom: '10px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    >
                        Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </button>
                    <button
                        id="recycle-bin-btn"
                        className="sidebar-btn"
                        onClick={onRecycleBinClick}
                    >
                        {isRecycleBinView ? 'Back to Notes' : 'Recycle Bin'}
                    </button>
                </div>
            </div>
        </>
    );
}

export default Sidebar;
