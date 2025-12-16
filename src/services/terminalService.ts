import { exec as execCb } from "child_process";
import { promisify } from "util";

const exec = promisify(execCb);

// ----------------------------------------------
// TERMINAL DETECTION & OPENING
// ----------------------------------------------

export async function openInTerminal(workspacePath: string): Promise<void> {
  if (process.platform === "darwin") {
    // macOS - try iTerm2 first, fallback to Terminal.app
    try {
      await exec(
        `osascript -e 'tell application "iTerm" to create window with default profile' -e 'tell application "iTerm" to tell current session of current window to write text "cd \\"${workspacePath}\\""'`,
      );
      return;
    } catch {
      // Fallback to Terminal.app
      await exec(
        `osascript -e 'tell application "Terminal" to do script "cd \\"${workspacePath}\\""' -e 'tell application "Terminal" to activate'`,
      );
      return;
    }
  } else if (process.platform === "win32") {
    // Windows - try Windows Terminal first, fallback to cmd
    try {
      // Try Windows Terminal (wt.exe)
      await exec(`wt.exe -d "${workspacePath}"`);
      return;
    } catch {
      // Fallback to cmd
      await exec(`start cmd.exe /K "cd /d \\"${workspacePath}\\""`);
      return;
    }
  } else {
    throw new Error("Platform not supported for terminal opening");
  }
}

// ----------------------------------------------
// REVEAL IN FINDER/EXPLORER
// ----------------------------------------------

export async function revealInFinder(workspacePath: string): Promise<void> {
  if (process.platform === "darwin") {
    await exec(`open "${workspacePath}"`);
  } else if (process.platform === "win32") {
    // Use explorer without throwing errors - normalize path for Windows
    const normalizedPath = workspacePath.replace(/\//g, "\\");
    await exec(`explorer "${normalizedPath}"`);
  } else {
    throw new Error("Platform not supported for reveal in finder");
  }
}
