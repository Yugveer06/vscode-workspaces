# VS Code Workspaces for Raycast

Browse and open your Visual Studio Code workspaces directly from Raycast.  
The extension reads VS Code’s workspace history and presents it in a searchable list with useful actions.

## Features

### Workspace listing
- Fast search across all known workspaces
- Displays recently opened time
- Sort by name, recent activity, favorites, or project type
- Supports pinned (favorite) workspaces

### Actions
- Open workspace in VS Code
- Mark or unmark workspace as favorite
- Open workspace directory in terminal
- Reveal workspace folder in Finder / Explorer
- Copy workspace path
- Copy workspace name
- Remove workspace from VS Code history

### Editor support
- Visual Studio Code
- VS Code Insiders
- VSCodium
- Cursor

### Platform support
- macOS
- Windows

## Project type detection

The extension attempts to detect the project type based on files in the workspace and shows a matching icon.

Detected ecosystems include:

**JavaScript / TypeScript**
- Raycast Extensions
- Next.js
- React
- Vue / Nuxt
- Angular
- Svelte
- Node.js

**Backend frameworks**
- Django
- Flask
- FastAPI
- Spring
- Ruby on Rails

**Languages**
- Python
- Go
- Rust
- Java
- Kotlin
- Ruby
- PHP
- C#
- Swift
- Dart / Flutter
- Elixir
- Scala
- Haskell

## Installation

Install from the Raycast Store:  
https://raycast.com/yugveer28/vscode-workspaces

Or build from source:

```bash
git clone https://github.com/yugveer06/vscode-workspace-finder.git
cd vscode-workspace-finder
npm install
npm run dev
