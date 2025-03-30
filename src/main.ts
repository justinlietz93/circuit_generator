 // --- src/main.ts ---
  // Load environment variables from .env file
  import dotenv from 'dotenv';
  dotenv.config();

  // Electron main process. Creates the browser window.
  import { app, BrowserWindow, ipcMain } from 'electron';
  import path from 'path';
  // Import the AI function from the renamed connector file
  import { generateDiagramCode } from './ai_connector';

  function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true, // Recommended for security
        nodeIntegration: false, // Recommended for security
      },
    });
  
    // Load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, '../index.html'));
  
    // Open the DevTools (optional)
    // mainWindow.webContents.openDevTools();
  }
  
  // This method will be called when Electron has finished initialization
  app.whenReady().then(() => {
    // --- IPC Handler ---
    // Listen for requests from the renderer process to generate diagram code
    ipcMain.handle('generate-diagram', async (event, requirements: string) => {
      console.log('Main process received requirements:', requirements);
      try {
        // Call the placeholder AI function to get the DOT code
        const dotCode = await generateDiagramCode(requirements);
        console.log('Main process generated DOT code:', dotCode);
        return dotCode; // Send the generated DOT code back to the renderer
      } catch (error) {
        console.error('Error generating diagram code:', error);
        // In a real app, provide more specific error handling
        return `// Error generating diagram:\n// ${error instanceof Error ? error.message : String(error)}`;
      }
    });
    // --- End IPC Handler ---
  
    createWindow();
  
    // Handle macOS activation
    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
  
  // Quit when all windows are closed, except on macOS.
  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
  });
  
  
  // --- src/preload.ts ---
  // Exposes specific main process functionality to the renderer process securely.
  import { contextBridge, ipcRenderer } from 'electron';
  
  contextBridge.exposeInMainWorld('electronAPI', {
    // Function the renderer can call to request diagram generation
    generateDiagram: (requirements: string): Promise<string> =>
      ipcRenderer.invoke('generate-diagram', requirements),
  });
