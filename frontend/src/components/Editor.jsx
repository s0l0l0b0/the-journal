import { useEffect, useRef, useState, useCallback } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Code from '@editorjs/code';

function Editor({ note, onNoteUpdate, onDeleteNote, editorRef }) {
    const editorHolderRef = useRef(null);
    const editorInstanceRef = useRef(null);
    const [title, setTitle] = useState(note?.title || '');
    const saveTimeoutRef = useRef(null);
    const currentNoteIdRef = useRef(note?.id);

    // Initialize EditorJS
    useEffect(() => {
        if (!editorHolderRef.current) return;

        // Destroy existing editor if switching notes
        if (editorInstanceRef.current) {
            editorInstanceRef.current.destroy();
            editorInstanceRef.current = null;
        }

        const editor = new EditorJS({
            holder: editorHolderRef.current,
            placeholder: "Let's write an awesome story! Type / to open menu...",
            tools: {
                header: Header,
                list: List,
                code: Code,
            },
            data: parseNoteContent(note?.content),
            onChange: () => {
                handleEditorChange();
            },
        });

        editorInstanceRef.current = editor;
        if (editorRef) {
            editorRef.current = editor;
        }

        // Cleanup on unmount
        return () => {
            if (editorInstanceRef.current) {
                editorInstanceRef.current.destroy();
                editorInstanceRef.current = null;
            }
        };
    }, [note?.id]); // Reinitialize when note changes

    // Update title when note changes
    useEffect(() => {
        setTitle(note?.title || '');
        currentNoteIdRef.current = note?.id;
    }, [note?.id, note?.title]);

    // Parse note content with fallback
    const parseNoteContent = (content) => {
        if (!content) {
            return { blocks: [] };
        }
        try {
            const data = JSON.parse(content);
            if (data.blocks && Array.isArray(data.blocks)) {
                return data;
            }
            throw new Error('Invalid structure');
        } catch (e) {
            return {
                time: Date.now(),
                blocks: [
                    {
                        type: 'paragraph',
                        data: { text: content }
                    }
                ],
                version: '2.29.0'
            };
        }
    };

    // Debounced save function
    const handleSave = useCallback(async () => {
        if (!editorInstanceRef.current) return;

        try {
            const outputData = await editorInstanceRef.current.save();
            const contentString = JSON.stringify(outputData);

            onNoteUpdate({
                title: title,
                content: contentString
            });
        } catch (error) {
            console.error('Error saving editor content:', error);
        }
    }, [title, onNoteUpdate]);

    // Handle editor content changes
    const handleEditorChange = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            handleSave();
        }, 500);
    }, [handleSave]);

    // Handle title changes
    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            onNoteUpdate({
                title: newTitle,
                content: null // Will be fetched from editor in handleSave
            });
            handleSave();
        }, 500);
    };

    // Handle Cmd+Enter for soft break
    const handleKeyDown = useCallback((e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            document.execCommand('insertLineBreak');
            handleEditorChange();
        }
    }, [handleEditorChange]);

    return (
        <div id="editor-container">
            <input
                type="text"
                id="note-title"
                placeholder="Your note title..."
                value={title}
                onChange={handleTitleChange}
            />
            <div
                id="editorjs"
                ref={editorHolderRef}
                onKeyDown={handleKeyDown}
            />
            <button
                id="delete-note-btn"
                onClick={onDeleteNote}
            >
                Delete Note
            </button>
        </div>
    );
}

export default Editor;
