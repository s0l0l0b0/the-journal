import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar.jsx';
import TabBar from './components/TabBar.jsx';
import MainContent from './components/MainContent.jsx';
import McpModal from './components/McpModal.jsx';

function App() {
    // State
    const [allNotes, setAllNotes] = useState([]);
    const [openNoteIds, setOpenNoteIds] = useState(new Set());
    const [activeNoteId, setActiveNoteId] = useState(null);
    const [isRecycleBinView, setIsRecycleBinView] = useState(false);
    const [isBackendReady, setIsBackendReady] = useState(false);
    const [showMcpModal, setShowMcpModal] = useState(false);

    // Ref for Editor instance
    const editorRef = useRef(null);

    // Load notes from backend
    const loadNotes = useCallback(async () => {
        if (isRecycleBinView) {
            const notes = await window.api.getDeletedNotes();
            setAllNotes(notes || []);
        } else {
            const notes = await window.api.getNotes();
            setAllNotes(notes || []);
        }
        setActiveNoteId(null);
        setOpenNoteIds(new Set());
    }, [isRecycleBinView]);

    // Check backend readiness on mount
    useEffect(() => {
        const checkBackend = async () => {
            const ready = await window.api.isBackendReady();
            if (ready) {
                setIsBackendReady(true);
            } else {
                window.api.onBackendReady(() => {
                    setIsBackendReady(true);
                });
            }
        };
        checkBackend();

        // Listen for MCP server started event
        window.api.onMcpServerStarted(() => {
            const dontShow = localStorage.getItem('mcp-dont-show-modal');
            if (dontShow !== 'true') {
                setShowMcpModal(true);
            }
        });
    }, []);

    // Load notes when backend is ready or view changes
    useEffect(() => {
        if (isBackendReady) {
            loadNotes();
        }
    }, [isBackendReady, isRecycleBinView, loadNotes]);

    // Handlers
    const handleNoteSelect = useCallback((id) => {
        if (isRecycleBinView) {
            setActiveNoteId(id);
        } else {
            setOpenNoteIds(prev => new Set([...prev, id]));
            setActiveNoteId(id);
        }
    }, [isRecycleBinView]);

    const handleTabSelect = useCallback((id) => {
        setActiveNoteId(id);
    }, []);

    const handleTabClose = useCallback((idToClose) => {
        setOpenNoteIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(idToClose);
            return newSet;
        });

        if (activeNoteId === idToClose) {
            setActiveNoteId(prev => {
                const remaining = [...openNoteIds].filter(id => id !== idToClose);
                return remaining.length > 0 ? remaining[remaining.length - 1] : null;
            });
        }
    }, [activeNoteId, openNoteIds]);

    const handleRecycleBinClick = useCallback(() => {
        setIsRecycleBinView(prev => !prev);
    }, []);

    const handleNewNote = useCallback(async () => {
        const newNote = await window.api.createNote({ title: 'New Note', content: '' });
        if (newNote) {
            setAllNotes(prev => [newNote, ...prev]);
            setOpenNoteIds(prev => new Set([...prev, newNote.id]));
            setActiveNoteId(newNote.id);
        }
    }, []);

    const handleDeleteNote = useCallback(async () => {
        if (!activeNoteId) return;
        const idToDelete = activeNoteId;
        const success = await window.api.softDeleteNote(idToDelete);
        if (success) {
            handleTabClose(idToDelete);
            setAllNotes(prev => prev.filter(n => n.id !== idToDelete));
        }
    }, [activeNoteId, handleTabClose]);

    const handleRestoreNote = useCallback(async () => {
        if (!activeNoteId) return;
        await window.api.restoreNote(activeNoteId);
        setIsRecycleBinView(false);
    }, [activeNoteId]);

    const handlePermanentDelete = useCallback(async () => {
        if (!activeNoteId) return;
        await window.api.permanentlyDeleteNote(activeNoteId);
        loadNotes();
    }, [activeNoteId, loadNotes]);

    const handleNoteUpdate = useCallback(async (noteData) => {
        if (!activeNoteId || isRecycleBinView) return;

        const updatedNote = await window.api.updateNote(activeNoteId, noteData);
        if (updatedNote) {
            setAllNotes(prev => prev.map(n => n.id === activeNoteId ? updatedNote : n));
        }
    }, [activeNoteId, isRecycleBinView]);

    const activeNote = allNotes.find(n => n.id === activeNoteId);

    return (
        <div id="app-container">
            <Sidebar
                notes={allNotes}
                activeNoteId={activeNoteId}
                isRecycleBinView={isRecycleBinView}
                onNoteSelect={handleNoteSelect}
                onNewNote={handleNewNote}
                onRecycleBinClick={handleRecycleBinClick}
            />

            <div id="main-content">
                <TabBar
                    notes={allNotes}
                    openNoteIds={openNoteIds}
                    activeNoteId={activeNoteId}
                    onTabSelect={handleTabSelect}
                    onTabClose={handleTabClose}
                />

                <MainContent
                    activeNote={activeNote}
                    isRecycleBinView={isRecycleBinView}
                    onNoteUpdate={handleNoteUpdate}
                    onDeleteNote={handleDeleteNote}
                    onRestoreNote={handleRestoreNote}
                    onPermanentDelete={handlePermanentDelete}
                    editorRef={editorRef}
                />
            </div>

            <McpModal
                isOpen={showMcpModal}
                onClose={() => setShowMcpModal(false)}
            />
        </div>
    );
}

export default App;
