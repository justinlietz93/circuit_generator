/**
 * AI Placeholder replacement using Google Generative AI SDK (Gemini).
 * This module handles the generation of Graphviz DOT code based on user requirements
 * by calling the specified Gemini Large Language Model (LLM).
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Define safety settings interface
interface SafetySetting {
  category: HarmCategory;
  threshold: HarmBlockThreshold;
}

// Define block reason constants
const BlockReason = {
  BLOCK_REASON_UNSPECIFIED: "BLOCK_REASON_UNSPECIFIED",
  SAFETY: "SAFETY",
  OTHER: "OTHER"
};

/**
 * Generates Graphviz DOT code for an electrical diagram based on user requirements
 * by calling the Gemini API.
 *
 * @param requirements - A string describing the desired circuit or components.
 * @returns A Promise resolving to a string containing the generated Graphviz DOT code.
 * @throws Throws an error if the API key is missing, the API call fails, or the response is invalid.
 */
export async function generateDiagramCode(requirements: string): Promise<string> {
  console.log(`AI Connector: Processing requirements via Gemini API: "${requirements}"`);

  // --- 1. API Key Configuration ---
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const errorMsg = "API Key not configured. Please set the GEMINI_API_KEY environment variable.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // --- 2. Initialize AI Client ---
  const genAI = new GoogleGenerativeAI(apiKey);

  // --- 3. Select Model ---
  const modelName = "gemini-2-5-pro-exp-03-25"; // Verify this model name exists in the Gemini API
  const model = genAI.getGenerativeModel({ model: modelName });

  // --- 4. Configure Generation Settings ---
  const generationConfig = {
    // temperature: 0.7, // Uncomment if needed
    // maxOutputTokens: 2048, // Uncomment if needed
  };

  // --- 5. Safety Settings ---
  const safetySettings: SafetySetting[] = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
  ];

  // --- 6. Construct the Prompt ---
  const prompt = `
  You are an expert electronics engineer assistant specialized in generating circuit diagrams.
  Your task is to create a diagram based on the user's requirements using the Graphviz DOT language.

  User Requirements:
  "${requirements}"

  Instructions for generating the DOT code:
  - Output ONLY the Graphviz DOT code, starting with 'digraph G {' and ending with '}'. Do not include any other text, explanations, or markdown formatting like \`\`\`dot ... \`\`\`.
  - Use 'digraph G' as the main graph structure.
  - Set graph attributes: rankdir=LR; splines=polyline; nodesep=0.6; ranksep=1.5; label="Generated Circuit Diagram"; fontsize=12;
  - Use node attributes: shape=box; style="filled,rounded";
  - Represent standard components like Arduino Uno, Raspberry Pi, resistors, LEDs, buttons, sensors (e.g., MFRC522, DHT22), actuators, transistors (NPN/PNP), MOSFETs, and power supplies clearly. Use appropriate node shapes (e.g., box, ellipse, cylinder, rect) and descriptive labels.
  - Use subgraphs (e.g., subgraph cluster_Arduino {...}) to group related components logically (e.g., Arduino System, Power System, Sensor Circuit, Actuator Circuit). Use appropriate bgcolor (e.g., "#E6FFF9", "#FFFEE6", "#E6F7FF", "#FFE6EC") for clusters.
  - Show connections (edges) between component pins accurately based on standard electronic practices (e.g., SPI connections MOSI->MOSI, MISO<-MISO, SCK->SCK; I2C SDA<->SDA, SCL<->SCL; GPIO connections).
  - Label edges clearly with pin numbers (e.g., " D13", " A0", " SDA", " 5V", " GND") or signal names where appropriate. Use fontsize=10 for edge labels.
  - Ensure power (e.g., 5V, 3.3V) and ground (GND) connections are shown, potentially using common rail nodes (e.g., GND_RAIL, VCC_RAIL) for clarity if the circuit is complex.
  - If the requirements mention specific components from the previous cat feeder project (Arduino Hero, MFRC522, door latch actuator, resistors), try to incorporate them using the standard pin assignments discussed (e.g., SPI on D11-D13, SS on D8-D10, RST on D5-D7, Actuators on D2-D4 via drivers). Abstract the driver circuit itself as a node if needed.
  - Generate a complete and valid DOT graph structure.
  `;

  // --- 7. Call API and Handle Response ---
  try {
    console.log(`Calling Gemini model (${modelName})...`);
    // Fix: Update the API call structure according to the current SDK format
    const result = await model.generateContent(prompt);
    const response = result.response;

    // Check for blocking or lack of response
    if (!response) {
      const errorMsg = "AI response was blocked or empty.";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Check if response text exists
    const rawText = response.text();
    if (!rawText || rawText.trim() === '') {
      const errorMsg = "AI returned an empty response.";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    console.log("AI Response received (raw):", rawText.substring(0, 200) + "...");

    // Check if the response was blocked for safety reasons
    if (response.promptFeedback && response.promptFeedback.blockReason) {
      const finishReason = response.promptFeedback.blockReason || BlockReason.BLOCK_REASON_UNSPECIFIED;
      console.error("AI response was blocked:", finishReason);
      throw new Error(`Response blocked: ${finishReason}`);
    }

    // --- 8. Clean Output ---
    let dotCode = rawText.trim();
    if (dotCode.startsWith("```dot")) {
      dotCode = dotCode.substring(6);
    } else if (dotCode.startsWith("```")) {
      dotCode = dotCode.substring(3);
    }
    if (dotCode.endsWith("```")) {
      dotCode = dotCode.substring(0, dotCode.length - 3);
    }
    dotCode = dotCode.trim();

    // Basic validation
    if (!dotCode.toLowerCase().startsWith("digraph")) {
      const errorMsg = "AI response does not appear to be valid DOT code.";
      console.error(errorMsg, "Response:", dotCode.substring(0, 200));
      // Consider throwing error or returning raw text based on desired behavior
      // throw new Error(errorMsg);
    }

    console.log("Cleaned DOT code ready:", dotCode.substring(0, 200) + "...");
    return dotCode;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error(`Failed to generate diagram via AI: ${error instanceof Error ? error.message : String(error)}`);
  }
}