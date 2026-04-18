# FLUX Image Generation Skill

This is the TypeScript implementation of the FLUX image generation skill for Claude Code.

## Directory Structure

```
flux-gen/
├── SKILL.md          # Skill metadata and documentation
├── src/
│   └── index.ts      # Main TypeScript implementation
└── README.md         # This file
```

## Files

### SKILL.md

Contains YAML frontmatter with:

- Skill name and description
- Metadata (emoji, requirements)
- User documentation
- Configuration instructions
- API details and limitations

### src/index.ts

TypeScript implementation with:

- **Type definitions**: FluxRequestBody, FluxAsyncResponse, GenerationResult
- **API functions**:
  - `initiateGeneration()`: POST to FLUX API
  - `pollGeneration()`: Poll until status=="Ready"
  - `downloadImage()`: Download PNG to local filesystem
  - `getImageDirectory()`: Create dated directory (YYYY-MM-DD)
  - `logGeneration()`: Append metadata to MEMORY.md
- **Main export**: `fluxGen(prompt: string)`
- **Error handling**: Network timeouts, API errors, file system errors
- **CLI support**: Direct execution via `npx ts-node`

## Usage

### As a Skill

The skill triggers automatically on patterns like:

- "generate an image of..."
- "create an image..."
- "make an image..."
- "draw..."
- "flux [description]"

### Direct Invocation (CLI)

```bash
npx ts-node src/index.ts "a serene mountain landscape"
```

## Configuration

Set `FLUX_API_KEY` in your `.env` file:

```bash
FLUX_API_KEY=your_api_key_here
```

## Output

### File Location

Images are saved to: `/home/tai/.openclaw/workspace/images/YYYY-MM-DD/`

### File Naming

`{hash}_{truncated_prompt}.png`

- hash: First 8 chars of generation ID
- truncated_prompt: First 30 chars of prompt (sanitized)

### Example

```
images/2026-04-17/a1b2c3d4_a-serene-mountain-landscape.png
```

## Metadata Logging

Each generation is logged to `/home/tai/.openclaw/workspace/MEMORY.md`:

```markdown
- **2026-04-17 17:20:00** | Prompt: "a serene mountain landscape" | Path: images/2026-04-17/a1b2c3d4_a-serene-mountain-landscape.png | ID: a1b2c3d4... | Cost: 0.052 credits
```

## API Details

- **Endpoint**: `https://api.bfl.ai/v1/flux-2-klein-9b`
- **Method**: POST (initiate), GET (poll)
- **Auth**: Header `x-key: {FLUX_API_KEY}`
- **Model**: BFL FLUX.2 Klein 9B
- **Resolution**: 1024x1024 PNG
- **Polling**: Every 2 seconds, max 5 minutes

## Error Handling

Handles:

- Network timeouts (30s per request)
- API errors with helpful messages
- Missing environment variables
- Filesystem errors (permissions, disk space)
- Invalid/empty prompts (max 1000 chars)
- Generation timeouts (5 minute limit)

## Dependencies

- Node.js built-in modules: `fs`, `path`, `https`, `util`
- No external npm dependencies required
- TypeScript for type safety
