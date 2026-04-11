# MiniMax Token Plan Agent

![Next.js](https://img.shields.io/badge/Next.js-16.2.1-000000?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

MiniMax Token Plan Agent is a production-oriented multimodal client for MiniMax APIs. It provides a unified workspace for chat, voice, video, image, and music generation, with local task persistence, configurable model routing, prompt organization, and cross-platform packaging.

## Highlights

- Unified multimodal workspace for chat, voice, video, image, and music workflows
- Full compatibility with official minimax-multimodal-toolkit skills (including advanced voice parameters, instrumental music generation, etc.)
- Prompt asset workflow with theme filtering, Markdown preview, replace, append, and in-place editing
- Skills management with repository registration, skill registration, apply, and unapply actions
- MCP management with quick add/delete, enable toggle, and JSON import (`mcpServers` schema)
- Collapsible global workspace navigation and collapsible chat session list
- Enlarged settings center with workspace summaries, searchable prompt operations, and product-style control panels
- Token Plan status bar with live countdown, manual refresh, and automatic polling
- Shared request and polling abstractions for long-running MiniMax tasks
- Desktop packaging with Electron and mobile shell delivery with Capacitor

## Feature Set

### Core Capabilities

- Multi-session text chat with local history
- Chat workspace with session overview, timestamped messages, one-click message copy, and collapsible prompt/MCP area
- Text-to-speech generation with advanced controls (speed, volume, pitch), task polling, and playback
- Video generation with async task tracking (supports text/image/start-end/subject-ref modes), smooth local video playback using custom protocols
- Image generation with preview and download
- Music generation in instrumental and lyric modes
- Music model options include `music-2.5` and `music-2.6` (default `music-2.6`)
- Local prompt reuse across all functional modules
- Skills management with direct parsing and importing from GitHub repositories

### UX and Productivity

- Theme mode switching with persistent preference
- Airtable-inspired enterprise UI design system (Haas typography, deep navy & primary blue palette, multi-layer soft shadows)
- API key and settings persistence via explicit remember toggle (now securely stored in the system via electron-store on Desktop)
- Prompt quick access with explicit replace and append actions instead of implicit overwrite
- Long prompt support in settings: multiline Markdown editing with scrollable rendered preview
- Settings navigation split into System, Prompt Management, and Skills with summary cards and searchable lists
- Settings center includes MCP management, supporting manual entry and one-click JSON import
- Auto-resizing chat input with keyboard hints for send and newline actions
- Chat input panel supports per-conversation MCP enable switch and multi-service selection
- Additional bottom-safe spacing to avoid chat input hints overlapping the Token Plan status bar
- Refined sidebar hierarchy with larger workspace badge, smaller navigation text, and lower-layer settings entry near the status bar
- Manual refresh in the bottom quota bar for real-time Token Plan inspection

### Reliability and Architecture

- Centralized API client with timeout and error normalization
- Shared polling layer for async job orchestration
- Strict TypeScript codebase with Zustand-based state management
- Config merge strategy using default config plus local override file
- Platform-specific desktop icon mapping (Windows uses `.ico`; macOS uses native icon assets) to avoid cross-platform packaging failures

## Tech Stack

- Next.js 16
- React 19
- TypeScript 5
- Zustand
- Tailwind CSS 4
- shadcn/ui
- Electron
- Capacitor

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Configuration

Configuration is resolved from:

- Default configuration: `src/config/appConfig.ts`
- Local override: `minimax.config.json`

Key configuration areas include:

- API base URL
- Chat, voice, video, image, and music model defaults
- Model option lists
- Voice and music audio parameters
- Token Plan status model preferences

## Project Structure

```text
src/
  app/                 # Route-level pages
  components/          # Shared UI building blocks
  config/              # Runtime config merge and normalization
  lib/                 # API client, polling, token plan helpers
  store/               # Zustand stores
doc/
  需求文档.md           # Product and architecture documentation
```

## Development Commands

```bash
npm run lint
npm run typecheck
npm run build
```

## Desktop and Mobile Packaging

### Desktop

```bash
npm run desktop:dev
npm run desktop:start
npm run desktop:dist
npm run desktop:dist:win
npm run desktop:dist:mac
```

Generated desktop artifacts are written to `release/`.

### Mobile

```bash
npx cap add android
npx cap add ios
npm run mobile:sync
npm run mobile:android
npm run mobile:ios
npm run mobile:build:android
npm run mobile:build:ios
npm run mobile:open:android
npm run mobile:open:ios
```

## Release Automation

The repository includes `.github/workflows/release.yml`. Pushing a `v*` tag triggers the release workflow, which builds and publishes the cross-platform artifacts defined by the pipeline.

Example:

```bash
git tag v1.0.1
git push origin v1.0.1
```

You can also use the repository helper script:

```bash
publish-release.bat
```

## Security Notes

- Do not commit real API keys or production secrets
- Keep non-persistent API key mode as the default for shared devices
- For production deployment, place MiniMax credentials behind a backend proxy or BFF layer

## Contributing

Contributions are welcome through Issues and Pull Requests. Please ensure lint, typecheck, and build succeed before opening a PR.

## License

Licensed under [MIT](./LICENSE).
