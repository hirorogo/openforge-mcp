# Contributing to OpenForge MCP

Thank you for your interest in contributing.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `pnpm install`
4. Build: `pnpm build`
5. Run tests: `cd packages/mcp-server && npx vitest run`

## Structure

| Package | Language | Description |
|---------|----------|-------------|
| `packages/mcp-server` | TypeScript | MCP server, tool registry, HTTP API |
| `packages/unity-plugin` | C# | Unity Editor plugin |
| `packages/blender-addon` | Python | Blender addon |

## Adding a New Tool

### Unity tool

1. Create or edit a file in `packages/unity-plugin/Editor/Tools/`
2. Register the handler in `ToolExecutor.cs`
3. Add the tool definition in `packages/mcp-server/src/tools/unity/`
4. Add tests

### Blender tool

1. Create or edit a file in `packages/blender-addon/tools/`
2. Add the function to the module's `TOOLS` dict
3. Add the tool definition in `packages/mcp-server/src/tools/blender/`
4. Add tests

## Code Style

- TypeScript: strict mode, no `any` where avoidable
- C#: standard Unity conventions, always use Undo for modifications
- Python: type hints, snake_case, follow Blender addon conventions
- No emojis in code, comments, or UI text
- Minimal comments -- code should be self-explanatory

## Pull Requests

- One feature per PR
- Include tests for new tools
- Make sure all existing tests pass
- Write a clear description of what changed and why

## Reporting Issues

Open an issue with:
- What you expected
- What happened instead
- Steps to reproduce
- Your environment (OS, Unity/Blender version, AI client)
