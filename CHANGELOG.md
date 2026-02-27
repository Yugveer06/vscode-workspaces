# VS Code Workspaces Changelog

## [Major Feature Update] - {PR_MERGE_DATE}

- Tag System
  - Create custom tags with optional colors (Red, Orange, Yellow, Green, Blue, Purple, Magenta)
  - Add multiple tags to any workspace for better organization
  - Filter workspaces by tags with AND logic (must match all selected tags)
  - Filter to show only untagged workspaces
  - Tags displayed as colored badges on workspace items
  - Tags included in search keywords for fuzzy finding
  - New "Manage Workspace Tags" command to create, rename, and delete tags
  - Deleting a tag removes it from all workspaces automatically

- Smart Grouping
  - Workspaces now automatically group based on sort option:
    - Recently Opened: "Recent Workspaces" (last 7 days) and "Other Workspaces"
    - Favourites First: "Favourite Workspaces" and "Other Workspaces"
    - Project Type: Grouped by detected type (React, Rust, Python, Next.js, etc.)
    - Alphabetical: Single flat list
  - Each group shows a count in the section subtitle

- Filter Bar
  - Visible filter indicator at the top when filters are active
  - Shows all active tag filters with colored badges
  - Quick actions to add, remove, or clear filters
  - Displays count of matching workspaces

- Improvements
  - Separated sort dropdown (cleaner UI)
  - Filter actions added to each workspace's action panel
  - Added "Edit Tags" action with ⌘+E shortcut
  - Added "Manage All Tags" action with ⌘+⇧+T shortcut

## [Bugfix & Improvements] - {PR_MERGE_DATE}

- Added OpenWith action in the action panel
- Use Raycast's safe open API to open terminal and finder
- Fixed action panel shortcuts for both platforms
- Improved toast messages

## [Bugfix & Improvements] - {PR_MERGE_DATE}

- Fixed rust devicon URL

## [Major Feature Update] - {PR_MERGE_DATE}

- Added favorites system to pin frequently-used workspaces
- Added recently opened tracking with time-ago display
- Added multiple sort options (alphabetical, recently opened, favorites first, project type)
- Added open in terminal action
- Added reveal in Finder/Explorer action
- Added copy workspace name action
- Added fuzzy search support for workspace names
- Reorganized action panel into logical sections
- Changed default sort to recently opened
- Improved UI layout with path as subtitle and accessories on the right

## [Bugfix & Improvements] - {PR_MERGE_DATE}

- Made the shortcuts for copying path and deleting workspace common as intended by Raycast

## [Bugfix & Improvements] - {PR_MERGE_DATE}

- Use Raycast's safe trash API instead of platform specific deletion
- Fixed metadata images to be correct sizes

## [Bugfix & Improvements] - {PR_MERGE_DATE}

- Fixed workspace deletion on Windows and macOS
- Improved error handling and stability
- Added project type detection and icons (Next.js, React, Node.js, Python, etc.)
- Added macOS support
- Refactored codebase into a cleaner folder structure

## [Initial Version] - {PR_MERGE_DATE}

- Added commands to browse, open, delete, and copy VS Code workspaces (Windows only)
