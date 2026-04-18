import * as fs from "fs";
import * as https from "https";
import * as path from "path";
import { URL } from "url";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const appendFile = promisify(fs.appendFile);

// Types
interface FluxRequestBody {
  prompt: string;
  width: number;
  height: number;
  output_format: string;
}

interface FluxAsyncResponse {
  id: string;
  status: string;
  polling_url: string;
  result?: {
    images: Array<{ url: string }>;
  };
}

interface GenerationResult {
  id: string;
  imagePath: string;
  prompt: string;
  cost: number;
  timestamp: string;
}

// Constants
const FLUX_API_ENDPOINT = "https://api.bfl.ai/v1/flux-2-klein-9b";
const WORKSPACE_DIR = "/home/tai/.openclaw/workspace";
const MEMORY_FILE = path.join(WORKSPACE_DIR, "MEMORY.md");
const IMAGES_BASE_DIR = path.join(WORKSPACE_DIR, "images");
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 150; // 5 minutes with 2s interval
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Make HTTPS request with timeout
 */
function httpsRequest(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: string,
): Promise<{ statusCode: number; data: string }> {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        headers: {
          "User-Agent": "flux-gen-skill/1.0",
          ...headers,
        },
      };

      const req = https.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          resolve({ statusCode: res.statusCode || 500, data });
        });
      });

      req.setTimeout(REQUEST_TIMEOUT_MS, () => {
        req.destroy();
        reject(new Error(`Request timeout after ${REQUEST_TIMEOUT_MS}ms`));
      });

      req.on("error", reject);

      if (body) {
        req.write(body);
      }

      req.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Call FLUX API to initiate image generation
 */
async function initiateGeneration(prompt: string, apiKey: string): Promise<FluxAsyncResponse> {
  const requestBody: FluxRequestBody = {
    prompt,
    width: 1024,
    height: 1024,
    output_format: "png",
  };

  const headers = {
    "x-key": apiKey,
    "Content-Type": "application/json",
  };

  try {
    const response = await httpsRequest(
      "POST",
      FLUX_API_ENDPOINT,
      headers,
      JSON.stringify(requestBody),
    );

    if (response.statusCode !== 200) {
      const errorData = JSON.parse(response.data);
      throw new Error(
        `FLUX API error ${response.statusCode}: ${errorData.error?.message || response.data}`,
      );
    }

    return JSON.parse(response.data);
  } catch (error) {
    throw new Error(
      `Failed to initiate image generation: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Poll the FLUX API until generation is complete
 */
async function pollGeneration(pollingUrl: string, apiKey: string): Promise<FluxAsyncResponse> {
  let attempts = 0;

  while (attempts < MAX_POLL_ATTEMPTS) {
    const headers = {
      "x-key": apiKey,
    };

    try {
      const response = await httpsRequest("GET", pollingUrl, headers);

      if (response.statusCode !== 200) {
        throw new Error(`Poll failed with status ${response.statusCode}`);
      }

      const data: FluxAsyncResponse = JSON.parse(response.data);

      if (data.status === "Ready") {
        return data;
      }

      if (data.status === "Failed" || data.status === "Error") {
        throw new Error(`Generation failed with status: ${data.status}`);
      }

      attempts++;
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    } catch (error) {
      throw new Error(`Polling error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(
    `Generation timeout: Image not ready after ${
      (MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000
    } seconds`,
  );
}

/**
 * Download image from URL to local file
 */
async function downloadImage(imageUrl: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const file = fs.createWriteStream(filePath);

      const parsedUrl = new URL(imageUrl);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: "GET",
        headers: {
          "User-Agent": "flux-gen-skill/1.0",
        },
      };

      const req = https.request(options, (res) => {
        if (res.statusCode !== 200) {
          file.destroy();
          reject(new Error(`Download failed with status ${res.statusCode}`));
          return;
        }

        res.pipe(file);

        file.on("finish", () => {
          file.close();
          resolve();
        });
      });

      req.setTimeout(REQUEST_TIMEOUT_MS, () => {
        req.destroy();
        file.destroy();
        reject(new Error("Download timeout"));
      });

      req.on("error", () => {
        file.destroy();
        reject(
          new Error(
            `Failed to download image: ${req.socket?.destroyed ? "Connection destroyed" : "Unknown error"}`,
          ),
        );
      });

      req.end();
    } catch (error) {
      reject(
        new Error(`Download error: ${error instanceof Error ? error.message : String(error)}`),
      );
    }
  });
}

/**
 * Get or create dated image directory
 */
async function getImageDirectory(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const dir = path.join(IMAGES_BASE_DIR, dateStr);

  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    throw new Error(
      `Failed to create image directory: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return dir;
}

/**
 * Generate filename for image
 */
function generateImageFilename(id: string, prompt: string): string {
  const hash = id.substring(0, 8);
  const truncatedPrompt = prompt
    .substring(0, 30)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${hash}_${truncatedPrompt}.png`;
}

/**
 * Log generation to MEMORY.md
 */
async function logGeneration(result: GenerationResult): Promise<void> {
  try {
    // Ensure MEMORY.md exists
    if (!fs.existsSync(MEMORY_FILE)) {
      await writeFile(MEMORY_FILE, "## Generated Images - FLUX\n\n");
    }

    const logEntry = `- **${result.timestamp}** | Prompt: "${result.prompt}" | Path: ${path.relative(
      WORKSPACE_DIR,
      result.imagePath,
    )} | ID: ${result.id.substring(0, 8)}... | Cost: ${result.cost.toFixed(3)} credits\n`;

    await appendFile(MEMORY_FILE, logEntry);
  } catch (error) {
    console.error(
      `Warning: Failed to log generation to MEMORY.md: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    // Don't throw - logging failure shouldn't fail the whole operation
  }
}

/**
 * Main skill function
 */
export async function fluxGen(prompt: string): Promise<string> {
  // Validate inputs
  if (!prompt || typeof prompt !== "string") {
    throw new Error("Prompt must be a non-empty string");
  }

  const apiKey = process.env.FLUX_API_KEY;
  if (!apiKey) {
    throw new Error(
      "FLUX_API_KEY environment variable not set. Please configure it in your .env file.",
    );
  }

  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length === 0) {
    throw new Error("Prompt cannot be empty");
  }

  if (trimmedPrompt.length > 1000) {
    throw new Error("Prompt is too long (max 1000 characters)");
  }

  try {
    // Step 1: Initiate generation
    console.log(`Initiating image generation for: "${trimmedPrompt.substring(0, 50)}..."`);
    const initResponse = await initiateGeneration(trimmedPrompt, apiKey);

    // Step 2: Poll until complete
    console.log(`Polling for generation completion (ID: ${initResponse.id.substring(0, 8)}...)`);
    const completedResponse = await pollGeneration(initResponse.polling_url, apiKey);

    if (!completedResponse.result?.images?.[0]?.url) {
      throw new Error("No image URL in completed response");
    }

    // Step 3: Get image directory
    const imageDir = await getImageDirectory();

    // Step 4: Generate filename and download
    const filename = generateImageFilename(completedResponse.id, trimmedPrompt);
    const imagePath = path.join(imageDir, filename);

    console.log(`Downloading image to: ${imagePath}`);
    await downloadImage(completedResponse.result.images[0].url, imagePath);

    // Step 5: Log to MEMORY.md
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d+Z/, "");
    const cost = 0.052; // Approximate cost for FLUX.2 Klein 9B

    const result: GenerationResult = {
      id: completedResponse.id,
      imagePath,
      prompt: trimmedPrompt,
      cost,
      timestamp,
    };

    await logGeneration(result);

    const relativeImagePath = path.relative(WORKSPACE_DIR, imagePath);
    return `✓ Image generated and saved to: ${relativeImagePath}\nGeneration ID: ${completedResponse.id}\nEstimated cost: ${cost.toFixed(3)} credits`;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Image generation failed: ${errorMsg}`);
  }
}

// CLI support for testing
if (require.main === module) {
  const prompt = process.argv[2];
  if (!prompt) {
    console.error('Usage: npx ts-node src/index.ts "<prompt>"');
    process.exit(1);
  }

  fluxGen(prompt)
    .then((result) => {
      console.log("\n✓ Success:\n" + result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n✗ Error: " + error.message);
      process.exit(1);
    });
}

export default fluxGen;
