# VS Code Workspaces for Raycast

Browse and open your Visual Studio Code workspaces directly from Raycast.  
The extension reads VS Code's workspace history and presents it in a searchable list with useful actions.

## Features

### Workspace listing
- Fast search across all known workspaces
- Displays recently opened time
- Sort by name, recent activity, favorites, or project type
- Supports pinned (favorite) workspaces
- Tag workspaces for better organization

### Tag System
- Create custom tags with optional colors (Red, Orange, Yellow, Green, Blue, Purple, Magenta)
- Add multiple tags to any workspace
- Filter workspaces by tags with AND logic (must match all selected tags)
- Filter to show only untagged workspaces
- Manage all tags from a dedicated command
- Tags are displayed as colored badges on workspaces
- Tags are included in search keywords for fuzzy finding

### Smart Grouping
The workspace list automatically groups items based on your selected sort option:

- **Recently Opened**: Groups into "Recent Workspaces" (last 7 days) and "Other Workspaces"
- **Favourites First**: Groups into "Favourite Workspaces" and "Other Workspaces"
- **Project Type**: Groups by detected project type (React, Rust, Python, etc.)
- **Alphabetical**: Single flat list

### Actions
- Open workspace in VS Code
- Mark or unmark workspace as favorite
- Edit workspace tags
- Filter by workspace tags
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

## Commands

### VS Code Workspaces
Browse and open your VS Code workspaces. Use the dropdown to sort and the filter bar to narrow down by tags.

### Manage Workspace Tags
Create, edit, rename, and delete tags. See usage counts for each tag. Deleting a tag removes it from all workspaces.

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
git clone https://github.com/Yugveer06/vscode-workspaces.git
cd vscode-workspaces
npm install
npm run dev
```

## Usage

1. Open Raycast
2. Run the command "VS Code Workspaces"
3. Search for a workspace
4. Press Enter to open or use actions for more options

### Working with Tags

**Creating tags:**
1. Run "Manage Workspace Tags" command, or
2. Press `⌘` + `⇧` + `T` from any workspace, or
3. When editing a workspace's tags, choose "Create New Tag"

**Tagging a workspace:**
1. Select a workspace and press `⌘` + `E` (Edit Tags)
2. Add tags from the available list or create new ones
3. Remove tags by selecting them in the "Assigned Tags" section

**Filtering by tags:**
1. From any workspace, open the Filter section in the action panel
2. Select "Add #tagname to Filter" to filter
3. Add multiple tags for AND filtering (workspace must have ALL selected tags)
4. A filter bar appears at the top showing active filters
5. Clear filters from the filter bar or action panel

### Default shortcuts

| Action | Shortcut (macOS) | Shortcut (Windows) |
| ------ | ---------------- | ------------------ |
| Open workspace | `Enter` | `Enter` |
| Open with | `⌘` + `⇧` + `O` | `Ctrl` + `Shift` + `O` |
| Toggle favorite | `⌘` + `⇧` + `P` | `Ctrl` + `.` |
| Edit tags | `⌘` + `E` | `Ctrl` + `E` |
| Manage all tags | `⌘` + `⇧` + `T` | `Ctrl` + `Shift` + `T` |
| Open in terminal | `⌘` + `T` | `Ctrl` + `T` |
| Reveal in file explorer | `⌘` + `E` | `Ctrl` + `E` |
| Copy path | `⌘` + `⇧` + `,` | `Alt` + `Shift` + `C` |
| Copy name | `⌘` + `⇧` + `.` | `Ctrl` + `Alt` + `C` |
| Delete workspace | `⌃` + `X` | `Ctrl` + `D` |

## Requirements

- Visual Studio Code or a supported variant
- macOS or Windows

Git is optional and only used if branch information is available.

## How it works

The extension reads VS Code's local workspace storage:

- macOS: ~/Library/Application Support/Code/User/workspaceStorage
- Windows: %APPDATA%\Code\User\workspaceStorage

No data is uploaded or synced externally.

## Privacy

All data is stored locally using Raycast's LocalStorage API.
Workspace paths, tags, and metadata never leave your machine.

## Contributing

Pull requests are welcome.
Please keep changes minimal and focused.

## License

MIT License. See the LICENSE file for details.

## Credits

Author: Yugveer Singh Wadzatia
Icons: https://devicon.dev
