---
name: flux-gen
description: "Generate images using BFL FLUX.2 Klein 9B API and store them locally with metadata logging."
metadata:
  {
    "openclaw":
      {
        "emoji": "🎨",
        "requires": { "env": ["FLUX_API_KEY"], "dir": "/home/tai/.openclaw/workspace/images" },
      },
  }
---

# FLUX Image Generation (flux-gen)

Generate high-quality images using the BFL FLUX.2 Klein 9B model. Images are automatically saved to your local workspace with metadata logged for easy tracking.

## Trigger Patterns

The skill is automatically triggered by natural language patterns including:

- "generate an image"
- "create an image"
- "make an image"
- "draw [something]"
- "generate a picture"
- "flux [description]"
- And similar variations

## Features

- **Async Generation**: Polls the API until your image is ready
- **Auto-organized**: Images stored by date (`images/YYYY-MM-DD/`)
- **Metadata Logging**: All generation attempts logged to MEMORY.md with costs
- **Error Handling**: Graceful failures with detailed error messages
- **Environment**: Requires `FLUX_API_KEY` environment variable

## Configuration

### Environment Variables

Set in your `.env` file:

```bash
FLUX_API_KEY=your_flux_api_key_here
```

### Image Storage

Generated images are automatically saved to:

```
/home/tai/.openclaw/workspace/images/YYYY-MM-DD/
```

File naming follows the pattern:

```
{hash}_{truncated_prompt}.png
```

Where:

- `hash`: First 8 characters of the generation ID
- `truncated_prompt`: First 30 characters of your prompt

## Output Format

When an image is generated, you'll see:

- Local file path
- Generation ID
- Estimated cost in API credits
- Metadata logged to MEMORY.md

## Logged Metadata

Each generation is logged in `/home/tai/.openclaw/workspace/MEMORY.md`:

```markdown
## Generated Images - FLUX

- **2026-04-17 17:20:00** | Prompt: "a blue cat portrait" | Path: images/2026-04-17/a1b2c3d4_a-blue-cat-portrait.png | ID: a1b2c3d4... | Cost: 0.052 credits
```

## Example Usage

```
"Generate an image of a serene mountain landscape at sunset"
```

The skill will:

1. Send your prompt to the FLUX API
2. Poll every 2 seconds until generation completes
3. Download the image to the dated directory
4. Log everything to MEMORY.md
5. Return the local file path

## API Details

- **Model**: BFL FLUX.2 Klein 9B
- **Endpoint**: `https://api.bfl.ai/v1/flux-2-klein-9b`
- **Resolution**: 1024x1024 pixels
- **Format**: PNG
- **Status Polling**: Automatic, runs until `status=="Ready"`

## Error Handling

The skill handles:

- Network timeouts and connection errors
- API errors (with helpful error codes)
- Missing environment variables
- File system errors
- Invalid prompts

All errors are logged with details to help debug issues.

## Limitations

- Images are 1024x1024 pixels
- PNG format only
- Requires active FLUX API account with available credits
- Polling timeout: 5 minutes per generation

## See Also

- MEMORY.md: View all generated images and their metadata
- FLUX API: https://api.bfl.ai/
