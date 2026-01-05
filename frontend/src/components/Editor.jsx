import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import YooptaEditor, { createYooptaEditor } from '@yoopta/editor';

// Plugins
import Paragraph from '@yoopta/paragraph';
import { HeadingOne, HeadingTwo, HeadingThree } from '@yoopta/headings';
import { BulletedList, NumberedList, TodoList } from '@yoopta/lists';
import Blockquote from '@yoopta/blockquote';
import Code from '@yoopta/code';

// Marks
import { Bold, Italic, CodeMark, Underline, Strike, Highlight } from '@yoopta/marks';

// Tools
import Toolbar, { DefaultToolbarRender } from '@yoopta/toolbar';
import ActionMenu, { DefaultActionMenuRender } from '@yoopta/action-menu-list';
import LinkTool, { DefaultLinkToolRender } from '@yoopta/link-tool';

// Define plugins array
const plugins = [
    Paragraph,
    HeadingOne,
    HeadingTwo,
    HeadingThree,
    BulletedList,
    NumberedList,
    TodoList,
    Blockquote,
    Code,
];

// Define marks array
const MARKS = [Bold, Italic, CodeMark, Underline, Strike, Highlight];

// Define tools - must be outside component
const TOOLS = {
    Toolbar: {
        tool: Toolbar,
        render: DefaultToolbarRender,
    },
    ActionMenu: {
        tool: ActionMenu,
        render: DefaultActionMenuRender,
    },
    LinkTool: {
        tool: LinkTool,
        render: DefaultLinkToolRender,
    },
};

function Editor({ note, onNoteUpdate, onDeleteNote }) {
    const editor = useMemo(() => createYooptaEditor(), []);
    const [title, setTitle] = useState(note?.title || '');
    const saveTimeoutRef = useRef(null);
    const currentNoteIdRef = useRef(note?.id);
    const selectionRef = useRef(null);

    // Parse stored content or use empty state
    const getInitialValue = useCallback(() => {
        if (!note?.content) return undefined;
        try {
            const parsed = JSON.parse(note.content);
            // Check if it's Yoopta format (object with block IDs)
            if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed;
            }
            // Legacy EditorJS format - return empty for fresh start
            return undefined;
        } catch (e) {
            return undefined;
        }
    }, [note?.content]);

    const [value, setValue] = useState(getInitialValue);

    // Update when note changes
    useEffect(() => {
        if (note?.id !== currentNoteIdRef.current) {
            setTitle(note?.title || '');
            setValue(getInitialValue());
            currentNoteIdRef.current = note?.id;
        }
    }, [note?.id, note?.title, getInitialValue]);

    // Debounced save function
    const handleSave = useCallback((content) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            const contentString = JSON.stringify(content);
            onNoteUpdate({
                title: title,
                content: contentString
            });
        }, 500);
    }, [title, onNoteUpdate]);

    // Handle editor content changes
    const handleChange = useCallback((newValue) => {
        setValue(newValue);
        handleSave(newValue);
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
                content: JSON.stringify(value)
            });
        }, 500);
    };

    return (
        <div id="editor-container">
            <input
                type="text"
                id="note-title"
                placeholder="Your note title..."
                value={title}
                onChange={handleTitleChange}
            />
            <div id="editorjs" ref={selectionRef}>
                <YooptaEditor
                    editor={editor}
                    plugins={plugins}
                    marks={MARKS}
                    tools={TOOLS}
                    value={value}
                    onChange={handleChange}
                    selectionBoxRoot={selectionRef}
                    placeholder="Start writing your note..."
                    style={{ width: '100%', paddingBottom: '50px' }}
                />
            </div>
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
