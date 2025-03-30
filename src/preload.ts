// --- src/preload.ts ---
// Exposes specific main process functionality to the renderer process securely.
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Function the renderer can call to request diagram generation
  generateDiagram: (requirements: string): Promise<string> =>
    ipcRenderer.invoke('generate-diagram', requirements),
});
