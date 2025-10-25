// frontend/renderer.js

// --- State Management ---
let allNotes = [];
let currentNoteId = null;
let isRecycleBinView = false;

// --- DOM Element References ---
const notesList = document.getElementById('notes-list');
const editorContainer = document.getElementById('editor-container');
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');
const newNoteBtn = document.getElementById('new-note-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');
const recycleBinBtn = document.getElementById('recycle-bin-btn');
const welcomeMessage = document.getElementById('welcome-message');
const recycleBinActionsContainer = document.getElementById('recycle-bin-actions-container');
const restoreNoteBtn = document.getElementById('restore-note-btn');
const permDeleteNoteBtn = document.getElementById('perm-delete-note-btn');

// --- Rendering Functions ---

const renderNotesList = () => {
    notesList.innerHTML = ''; // Clear the list
    allNotes.forEach(note => {
        const noteItem = document.createElement('li');
        noteItem.className = 'note-item';
        if (note.id === currentNoteId) {
            noteItem.classList.add('selected');
        }
        noteItem.dataset.id = note.id;

        const date = new Date(note.updated_at);
        noteItem.innerHTML = `
            <div class="note-item-title">${note.title || 'Untitled Note'}</div>
            <div class="note-item-date">${date.toLocaleString()}</div>
        `;

        // Allow clicking notes in both views now
        noteItem.addEventListener('click', () => handleNoteClick(note.id));
        notesList.appendChild(noteItem);
    });
};

const renderMainContent = () => {
    const note = allNotes.find(n => n.id === currentNoteId);

    // Hide everything first
    editorContainer.classList.add('hidden');
    recycleBinActionsContainer.classList.add('hidden');
    welcomeMessage.classList.add('hidden');

    if (note) {
        if (isRecycleBinView) {
            recycleBinActionsContainer.classList.remove('hidden');
        } else {
            noteTitleInput.value = note.title;
            noteContentInput.value = note.content;
            editorContainer.classList.remove('hidden');
        }
    } else {
        welcomeMessage.classList.remove('hidden');
    }
};

// --- Data Loading ---

const loadAndRenderNotes = async () => {
    currentNoteId = null; // Deselect any note when switching views
    if (isRecycleBinView) {
        allNotes = await window.api.getDeletedNotes() || [];
        recycleBinBtn.textContent = 'Back to Notes';
        newNoteBtn.disabled = true;
    } else {
        allNotes = await window.api.getNotes() || [];
        recycleBinBtn.textContent = 'Recycle Bin';
        newNoteBtn.disabled = false;
    }
    renderNotesList();
    renderMainContent();
};

// --- Event Handlers ---

const handleRecycleBinClick = () => {
    isRecycleBinView = !isRecycleBinView;
    loadAndRenderNotes();
};

const handleNoteClick = (id) => {
    currentNoteId = id;
    renderNotesList(); // Re-render to show selection
    renderMainContent();
};

const handleNewNote = async () => {
    if (isRecycleBinView) {
        isRecycleBinView = false;
        await loadAndRenderNotes();
    }
    const newNote = await window.api.createNote({ title: 'New Note', content: '' });
    if (newNote) {
        allNotes.unshift(newNote);
        currentNoteId = newNote.id;
        renderNotesList();
        renderMainContent();
    }
};

const handleDeleteNote = async () => {
    if (!currentNoteId) return;
    const success = await window.api.softDeleteNote(currentNoteId);
    if (success) {
        loadAndRenderNotes();
    }
};

const handleRestoreNote = async () => {
    if (!currentNoteId) return;
    await window.api.restoreNote(currentNoteId);
    // After restoring, switch back to the main notes view to see the restored note
    isRecycleBinView = false;
    loadAndRenderNotes();
};

const handlePermanentDelete = async () => {
    if (!currentNoteId) return;
    await window.api.permanentlyDeleteNote(currentNoteId);
    // After deleting, just refresh the current (recycle bin) view
    loadAndRenderNotes();
};

// Auto-save functionality
let saveTimeout;
const handleNoteUpdate = () => {
    if (!currentNoteId || isRecycleBinView) return;

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        const noteData = { title: noteTitleInput.value, content: noteContentInput.value };
        const updatedNote = await window.api.updateNote(currentNoteId, noteData);
        if (updatedNote) {
            const index = allNotes.findIndex(n => n.id === currentNoteId);
            if (index !== -1) {
                allNotes[index] = updatedNote;
                renderNotesList();
            }
        }
    }, 500);
};

// --- Initialization ---

const init = () => {
    newNoteBtn.addEventListener('click', handleNewNote);
    deleteNoteBtn.addEventListener('click', handleDeleteNote);
    recycleBinBtn.addEventListener('click', handleRecycleBinClick);
    noteTitleInput.addEventListener('input', handleNoteUpdate);
    noteContentInput.addEventListener('input', handleNoteUpdate);
    restoreNoteBtn.addEventListener('click', handleRestoreNote); // ADDED
    permDeleteNoteBtn.addEventListener('click', handlePermanentDelete); // ADDED

    loadAndRenderNotes();
};

init();