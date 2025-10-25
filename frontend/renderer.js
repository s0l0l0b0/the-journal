// frontend/renderer.js

// This function will be called when the window is loaded
const testApi = async () => {
  console.log('Renderer process loaded. Calling API bridge...');
  try {
    const notes = await window.api.getNotes();
    console.log('Successfully fetched notes:', notes);
    // In the next step, we will render these notes to the screen
  } catch (error) {
    console.error('Error fetching notes:', error);
  }
};

// Run the test
testApi();