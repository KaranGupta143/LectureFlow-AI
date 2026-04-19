# LectureFlow AI

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TanStack Start](https://img.shields.io/badge/TanStack-Start-FF4154)
![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?logo=tailwindcss&logoColor=white)

Turn raw lecture notes into a structured study workflow:
- key concepts
- predicted exam questions
- explain-like-a-teacher answers
- daily action plan
- doubt-mode chat

LectureFlow AI is built with TanStack Start + React and supports multiple AI providers (OpenAI, Gemini, or a custom gateway).

## Screenshots

Add your project screenshots in a `docs/screenshots` folder and update the links below.

![LectureFlow Home](docs/screenshots/home.png)
![Concepts View](docs/screenshots/concepts.png)
![Action Plan View](docs/screenshots/action-plan.png)

## Features

- Notes to insights pipeline
  - Extracts concepts with definitions and subtopics
  - Generates predicted short and long answer questions
- Concept explainer
  - Plain-language explanation
  - Real-world example
  - Solved example
- Study planning
  - Build daily revise/practice/focus plans
- Doubt Mode chat
  - Ask follow-up questions in context of your notes
- Progress tracking
  - Mark concepts as revised
  - Knowledge tracker with covered/revised/pending state
- Session persistence
  - Saves notes and analysis in browser session storage
- Provider flexibility
  - OpenAI or Gemini direct
  - Optional custom gateway support

## Tech Stack

- Framework: TanStack Start (React)
- Routing/Data: TanStack Router + server functions
- UI: React 19, Tailwind CSS, shadcn/ui components
- Validation: Zod
- Build: Vite
- Edge deploy support: Cloudflare plugin + Wrangler config

## Project Structure

```text
src/
  components/lectureflow/     # Feature UI (notes, concepts, chat, action plan)
  components/ui/              # Reusable UI primitives
  lib/lectureflow/
    ai.server.ts              # Provider selection + AI API calls
    lectureflow.functions.ts  # Server functions used by the app
    types.ts                  # Domain types
  routes/
    __root.tsx                # App shell
    index.tsx                 # Main LectureFlow page
  router.tsx                  # Router factory
```

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill values:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

#### Minimal OpenAI setup

```dotenv
LECTUREFLOW_AI_PROVIDER="openai"
OPENAI_API_KEY="your_openai_api_key"
OPENAI_MODEL="gpt-4o-mini"
LECTUREFLOW_ALLOW_LOCAL_FALLBACK="false"
```

#### Minimal Gemini setup

```dotenv
LECTUREFLOW_AI_PROVIDER="gemini"
GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="gemini-2.5-flash"
LECTUREFLOW_ALLOW_LOCAL_FALLBACK="false"
```

### 3. Run development server

```bash
npm run dev
```

Open the local URL printed in terminal.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `LECTUREFLOW_AI_PROVIDER` | Yes | `openai`, `gemini`, or `gateway` |
| `OPENAI_API_KEY` | OpenAI only | OpenAI API key |
| `OPENAI_MODEL` | Optional | Defaults to `gpt-4o-mini` |
| `OPENAI_BASE_URL` | Optional | Defaults to OpenAI chat completions endpoint |
| `GEMINI_API_KEY` | Gemini only | Gemini API key |
| `GEMINI_MODEL` | Optional | Defaults to `gemini-2.5-flash` |
| `GEMINI_BASE_URL` | Optional | Defaults to Gemini OpenAI-compatible endpoint |
| `LECTUREFLOW_AI_GATEWAY_URL` | Gateway only | Your custom gateway endpoint |
| `LECTUREFLOW_AI_API_KEY` | Gateway only | API key for your gateway |
| `LECTUREFLOW_AI_MODEL` | Optional | Defaults to `google/gemini-2.5-flash` |
| `LECTUREFLOW_ALLOW_LOCAL_FALLBACK` | Optional | `false` recommended; set `true` to allow local fallback responses on provider failure |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` | Existing project config | Supabase integration keys |
| `VITE_SUPABASE_*` | Existing project config | Client-side Supabase vars |

## Available Scripts

```bash
npm run dev        # Start local dev server
npm run build      # Production build
npm run build:dev  # Development-mode build
npm run preview    # Preview production build
npm run lint       # ESLint
npm run format     # Prettier write
```

## Deployment Notes

- Production build includes Cloudflare Vite plugin (enabled during build only).
- `wrangler.jsonc` is already configured with Node.js compatibility.
- Main server entry uses `@tanstack/react-start/server-entry`.

## Troubleshooting

- "No AI provider configured"
  - Set `LECTUREFLOW_AI_PROVIDER` and matching provider API key.
- "AI authentication failed"
  - Check API key value and account status.
- "AI request timed out"
  - Check network, firewall, and provider endpoint/base URL.
- App keeps loading during analysis
  - Ensure provider key is valid and server can reach provider endpoint.

## Security

- Never commit real `.env` secrets.
- Rotate keys immediately if exposed.
- Use provider keys with least required scope.

## Roadmap

- Add PDF and DOCX upload support
- Add spaced repetition review mode
- Add team workspaces and shared notes
- Add analytics dashboard for learning progress

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
