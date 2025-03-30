
  
  // --- src/renderer.ts ---
  // Renderer process logic. Handles UI interaction and rendering.
  // Import the Viz.js library
  import { instance } from '@viz-js/viz';
  
  // Define the interface for the exposed API from preload.js
  interface ElectronAPI {
    generateDiagram: (requirements: string) => Promise<string>;
  }
  declare global {
    interface Window {
      electronAPI: ElectronAPI;
    }
  }
  
  // Get UI elements
  const requirementsInput = document.getElementById('requirementsInput') as HTMLTextAreaElement;
  const generateButton = document.getElementById('generateButton') as HTMLButtonElement;
  const dotCodeOutput = document.getElementById('dotCodeOutput') as HTMLElement;
  const diagramContainer = document.getElementById('diagramContainer') as HTMLElement;
  const loadingIndicator = document.getElementById('loadingIndicator') as HTMLElement;
  const errorIndicator = document.getElementById('errorIndicator') as HTMLElement;
  
  // Check if elements exist
  if (generateButton && requirementsInput && dotCodeOutput && diagramContainer && loadingIndicator && errorIndicator) {
    // Add event listener to the button
    generateButton.addEventListener('click', async () => {
      const requirements = requirementsInput.value.trim();
      if (!requirements) {
        alert('Please enter some requirements or components.');
        return;
      }
  
      // Clear previous output and show loading
      dotCodeOutput.textContent = '// Generating code...';
      diagramContainer.innerHTML = ''; // Clear previous diagram
      loadingIndicator.style.display = 'block';
      errorIndicator.style.display = 'none';
      errorIndicator.textContent = '';
      generateButton.disabled = true; // Disable button during processing
  
      try {
        // Call the main process function via the preload script
        console.log('Renderer: Sending requirements to main process...');
        const dotCode = await window.electronAPI.generateDiagram(requirements);
        console.log('Renderer: Received DOT code:', dotCode);
  
        // Display the generated DOT code
        dotCodeOutput.textContent = dotCode;
  
        // Render the DOT code using Viz.js
        console.log('Renderer: Rendering DOT code with Viz.js...');
        const viz = await instance();
        const svgElement = await viz.renderSVGElement(dotCode);
        console.log('Renderer: Rendering complete.');
  
        // Display the rendered SVG
        diagramContainer.innerHTML = ''; // Clear "Click generate..." message
        diagramContainer.appendChild(svgElement);
  
      } catch (error) {
        console.error('Renderer: Error during generation or rendering:', error);
        const errorMessage = `Error: ${error instanceof Error ? error.message : String(error)}`;
        dotCodeOutput.textContent = `// Error occurred\n${errorMessage}`;
        diagramContainer.innerHTML = '<p style="color: red;">Could not render diagram.</p>';
        errorIndicator.textContent = errorMessage;
        errorIndicator.style.display = 'block';
      } finally {
        // Hide loading indicator and re-enable button
        loadingIndicator.style.display = 'none';
        generateButton.disabled = false;
      }
    });
  } else {
      console.error("Could not find all required UI elements!");
  }
  