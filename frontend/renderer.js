// frontend/renderer.js

// --- State Management ---
let allNotes = [];
let openNoteIds = new Set();
let activeNoteId = null;
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
const tabBar = document.getElementById('tab-bar');
const appContainer = document.getElementById('app-container'); // NEW
const sidebar = document.getElementById('sidebar'); // NEW
const sidebarTriggerZone = document.getElementById('sidebar-trigger-zone'); // NEW

// --- Rendering Functions ---

// FIXED: Changed from 'const renderNotesList = () => {}' to 'function renderNotesList() {}'
function renderNotesList() {
    notesList.innerHTML = '';
    allNotes.forEach(note => {
        const noteItem = document.createElement('li');
        noteItem.className = 'note-item';
        if (note.id === activeNoteId) {
            noteItem.classList.add('selected');
        }
        noteItem.dataset.id = note.id;

        const date = new Date(note.updated_at);
        noteItem.innerHTML = `
            <div class="note-item-title">${note.title || 'Untitled Note'}</div>
            <div class="note-item-date">${date.toLocaleString()}</div>
        `;
        // This call will now work correctly because handleNoteSelect is hoisted.
        noteItem.addEventListener('click', () => handleNoteSelect(note.id));
        notesList.appendChild(noteItem);
    });
};

// FIXED: Changed to function declaration
function renderTabBar() {
    tabBar.innerHTML = '';
    openNoteIds.forEach(id => {
        const note = allNotes.find(n => n.id === id);
        if (!note) return;

        const tab = document.createElement('div');
        tab.className = 'tab-item';
        if (id === activeNoteId) {
            tab.classList.add('active');
        }
        tab.innerHTML = `
            <span class="tab-title">${note.title || 'Untitled Note'}</span>
            <button class="tab-close-btn">&times;</button>
        `;

        tab.querySelector('.tab-title').addEventListener('click', () => handleTabSelect(id));
        tab.querySelector('.tab-close-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            handleTabClose(id);
        });

        tabBar.appendChild(tab);
    });
};

// FIXED: Changed to function declaration
function renderMainContent() {
    editorContainer.classList.add('hidden');
    recycleBinActionsContainer.classList.add('hidden');
    welcomeMessage.classList.add('hidden');

    if (activeNoteId) {
        if (isRecycleBinView) {
            recycleBinActionsContainer.classList.remove('hidden');
        } else {
            const note = allNotes.find(n => n.id === activeNoteId);
            if (note) {
                noteTitleInput.value = note.title;
                noteContentInput.value = note.content;
                editorContainer.classList.remove('hidden');
            }
        }
    } else {
        welcomeMessage.classList.remove('hidden');
    }
};

// FIXED: Changed to function declaration
function renderAll() {
    renderNotesList();
    renderTabBar();
    renderMainContent();
};

// --- Data Loading ---

// FIXED: Changed to async function declaration
async function loadAndRenderNotes() {
    activeNoteId = null;
    openNoteIds.clear();

    if (isRecycleBinView) {
        allNotes = await window.api.getDeletedNotes() || [];
        recycleBinBtn.textContent = 'Back to Notes';
        newNoteBtn.disabled = true;
    } else {
        allNotes = await window.api.getNotes() || [];
        recycleBinBtn.textContent = 'Recycle Bin';
        newNoteBtn.disabled = false;
    }
    renderAll();
};

// --- Event Handlers ---

// FIXED: Changed to function declaration
function handleNoteSelect(id) {
    if (isRecycleBinView) {
        activeNoteId = id;
    } else {
        openNoteIds.add(id);
        activeNoteId = id;
    }
    renderAll();
};

// FIXED: Changed to function declaration
function handleTabSelect(id) {
    activeNoteId = id;
    renderAll();
};

// FIXED: Changed to function declaration
function handleTabClose(idToClose) {
    openNoteIds.delete(idToClose);

    if (activeNoteId === idToClose) {
        const remainingIds = Array.from(openNoteIds);
        activeNoteId = remainingIds.length > 0 ? remainingIds[remainingIds.length - 1] : null;
    }

    renderAll();
};

// FIXED: Changed to function declaration
function handleRecycleBinClick() {
    isRecycleBinView = !isRecycleBinView;
    loadAndRenderNotes();
};

// FIXED: Changed to async function declaration
async function handleNewNote() {
    const newNote = await window.api.createNote({ title: 'New Note', content: '' });
    if (newNote) {
        allNotes.unshift(newNote);
        openNoteIds.add(newNote.id);
        activeNoteId = newNote.id;
        renderAll();
    }
};

// FIXED: Changed to async function declaration
async function handleDeleteNote() {
    if (!activeNoteId) return;
    const idToDelete = activeNoteId;
    const success = await window.api.softDeleteNote(idToDelete);
    if (success) {
        handleTabClose(idToDelete);
        allNotes = allNotes.filter(n => n.id !== idToDelete);
        renderAll();
    }
};

// FIXED: Changed to async function declaration
async function handleRestoreNote() {
    if (!activeNoteId) return;
    await window.api.restoreNote(activeNoteId);
    isRecycleBinView = false;
    loadAndRenderNotes();
};

// FIXED: Changed to async function declaration
async function handlePermanentDelete() {
    if (!activeNoteId) return;
    await window.api.permanentlyDeleteNote(activeNoteId);
    loadAndRenderNotes();
};

// Auto-save functionality (can remain as a const as it's not called before it's defined)
let saveTimeout;
const handleNoteUpdate = () => {
    if (!activeNoteId || isRecycleBinView) return;

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        const noteData = { title: noteTitleInput.value, content: noteContentInput.value };
        const updatedNote = await window.api.updateNote(activeNoteId, noteData);
        if (updatedNote) {
            const index = allNotes.findIndex(n => n.id === activeNoteId);
            if (index !== -1) {
                allNotes[index] = updatedNote;
                renderAll();
            }
        }
    }, 500);
};

// --- Initialization ---

function init() {
    newNoteBtn.addEventListener('click', handleNewNote);
    deleteNoteBtn.addEventListener('click', handleDeleteNote);
    recycleBinBtn.addEventListener('click', handleRecycleBinClick);
    noteTitleInput.addEventListener('input', handleNoteUpdate);
    noteContentInput.addEventListener('input', handleNoteUpdate);
    restoreNoteBtn.addEventListener('click', handleRestoreNote);
    permDeleteNoteBtn.addEventListener('click', handlePermanentDelete);

    // --- NEW: Sidebar slide functionality ---
    sidebarTriggerZone.addEventListener('mouseenter', () => {sidebar.classList.add('is-open');});
    sidebar.addEventListener('mouseleave', () => {sidebar.classList.remove('is-open');});

    // UPDATED: Instead of calling loadAndRenderNotes() directly,
    // we now wait for the 'backend-ready' signal from the main process.
    window.api.onBackendReady(() => {
        console.log('Received backend-ready signal. Loading notes...');
        loadAndRenderNotes();
    });
};

init();