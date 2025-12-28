// frontend/renderer.js

// --- State Management ---
let allNotes = [];
let openNoteIds = new Set();
let activeNoteId = null;
let isRecycleBinView = false;
let editor; // Global editor instance

// --- DOM Element References ---
const notesList = document.getElementById('notes-list');
const editorContainer = document.getElementById('editor-container');
const noteTitleInput = document.getElementById('note-title');
const newNoteBtn = document.getElementById('new-note-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');
const recycleBinBtn = document.getElementById('recycle-bin-btn');
const welcomeMessage = document.getElementById('welcome-message');
const recycleBinActionsContainer = document.getElementById('recycle-bin-actions-container');
const restoreNoteBtn = document.getElementById('restore-note-btn');
const permDeleteNoteBtn = document.getElementById('perm-delete-note-btn');
const tabBar = document.getElementById('tab-bar');
const sidebar = document.getElementById('sidebar');
const sidebarTriggerZone = document.getElementById('sidebar-trigger-zone');

// --- Rendering Functions ---

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
        noteItem.addEventListener('click', () => handleNoteSelect(note.id));
        notesList.appendChild(noteItem);
    });
};

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

// In frontend/renderer.js

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
                editorContainer.classList.remove('hidden');

                // UPDATED: Robust loading
                if (editor && note.content) {
                    try {
                        const data = JSON.parse(note.content);
                        // Check if it looks like valid EditorJS data
                        if (data.blocks && Array.isArray(data.blocks)) {
                            editor.render(data);
                        } else {
                            throw new Error("Invalid structure");
                        }
                    } catch (e) {
                        // Fallback: Create a VALID EditorJS object structure
                        editor.render({
                            time: Date.now(),
                            blocks: [
                                {
                                    type: "paragraph",
                                    data: { text: note.content }
                                }
                            ],
                            version: "2.29.0" // Mock version
                        });
                    }
                } else if (editor) {
                    editor.clear();
                }
            }
        }
    } else {
        welcomeMessage.classList.remove('hidden');
    }
};

function renderAll() {
    renderNotesList();
    renderTabBar();
    renderMainContent();
};

// --- Data Loading ---

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

function handleNoteSelect(id) {
    if (isRecycleBinView) {
        activeNoteId = id;
    } else {
        openNoteIds.add(id);
        activeNoteId = id;
    }
    renderAll();
};

function handleTabSelect(id) {
    activeNoteId = id;
    renderAll();
};

function handleTabClose(idToClose) {
    openNoteIds.delete(idToClose);
    if (activeNoteId === idToClose) {
        const remainingIds = Array.from(openNoteIds);
        activeNoteId = remainingIds.length > 0 ? remainingIds[remainingIds.length - 1] : null;
    }
    renderAll();
};

function handleRecycleBinClick() {
    isRecycleBinView = !isRecycleBinView;
    loadAndRenderNotes();
};

async function handleNewNote() {
    const newNote = await window.api.createNote({ title: 'New Note', content: '' });
    if (newNote) {
        allNotes.unshift(newNote);
        openNoteIds.add(newNote.id);
        activeNoteId = newNote.id;
        renderAll();
    }
};

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

async function handleRestoreNote() {
    if (!activeNoteId) return;
    await window.api.restoreNote(activeNoteId);
    isRecycleBinView = false;
    loadAndRenderNotes();
};

async function handlePermanentDelete() {
    if (!activeNoteId) return;
    await window.api.permanentlyDeleteNote(activeNoteId);
    loadAndRenderNotes();
};

// Auto-save functionality
let saveTimeout;
const handleNoteUpdate = () => {
    if (!activeNoteId || isRecycleBinView) return;

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        const outputData = await editor.save();
        const contentString = JSON.stringify(outputData);
        
        const noteData = { 
            title: noteTitleInput.value, 
            content: contentString 
        };
        
        const updatedNote = await window.api.updateNote(activeNoteId, noteData);
        if (updatedNote) {
            const index = allNotes.findIndex(n => n.id === activeNoteId);
            if (index !== -1) {
                allNotes[index] = updatedNote;
                renderNotesList();
                renderTabBar();
            }
        }
    }, 500);
};

// --- Initialization ---

async function init() {
    // FIX: Safely determine the correct global variable names for plugins
    // Different versions export different names (e.g. List vs EditorjsList)
    const HeaderTool = window.Header;
    const ListTool = window.List || window.EditorjsList; // Check both names
    const CodeTool = window.CodeTool || window.Code;     // Check both names

    if (!ListTool) console.error("List plugin not found in window object");
    if (!CodeTool) console.error("Code plugin not found in window object");

    editor = new EditorJS({
        holder: 'editorjs', // Matches the ID in index.html
        placeholder: 'Let\'s write an awesome story! Type / to open menu...',
        tools: {
            header: HeaderTool,
            list: ListTool,
            code: CodeTool
        },
        onChange: () => {
            handleNoteUpdate();
        },
    });

    try {
        await editor.isReady;
        console.log('Editor.js is ready');
    } catch (reason) {
        console.error('Editor.js initialization failed', reason);
    }

    newNoteBtn.addEventListener('click', handleNewNote);
    deleteNoteBtn.addEventListener('click', handleDeleteNote);
    recycleBinBtn.addEventListener('click', handleRecycleBinClick);
    noteTitleInput.addEventListener('input', handleNoteUpdate);
    
    restoreNoteBtn.addEventListener('click', handleRestoreNote);
    permDeleteNoteBtn.addEventListener('click', handlePermanentDelete);
    
    if (sidebar && sidebarTriggerZone) {
        sidebarTriggerZone.addEventListener('mouseenter', () => sidebar.classList.add('is-open'));
        sidebar.addEventListener('mouseleave', () => sidebar.classList.remove('is-open'));
    }

    const ready = await window.api.isBackendReady();
    if (ready) {
        loadAndRenderNotes();
    } else {
        window.api.onBackendReady(() => {
            loadAndRenderNotes();
        });
    }
};

init();