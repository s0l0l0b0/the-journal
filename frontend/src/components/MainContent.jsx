import Editor from './Editor.jsx';
import RecycleBinActions from './RecycleBinActions.jsx';
import WelcomeMessage from './WelcomeMessage.jsx';

function MainContent({
    activeNote,
    isRecycleBinView,
    onNoteUpdate,
    onDeleteNote,
    onRestoreNote,
    onPermanentDelete,
    editorRef
}) {
    // Recycle bin view with active note
    if (isRecycleBinView && activeNote) {
        return (
            <RecycleBinActions
                onRestore={onRestoreNote}
                onPermanentDelete={onPermanentDelete}
            />
        );
    }

    // Normal editor view with active note
    if (activeNote && !isRecycleBinView) {
        return (
            <Editor
                note={activeNote}
                onNoteUpdate={onNoteUpdate}
                onDeleteNote={onDeleteNote}
                editorRef={editorRef}
            />
        );
    }

    // No active note - show welcome message
    return <WelcomeMessage />;
}

export default MainContent;
