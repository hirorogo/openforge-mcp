import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { access, writeFile, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const execFile = promisify(execFileCb);

export interface SaveInfo {
  id: string;
  message: string;
  date: string;
  filesChanged: string[];
}

export interface ProjectStatus {
  branch: string;
  dirty: boolean;
  lastSave: SaveInfo | null;
}

const UNITY_GITIGNORE = [
  "# Unity",
  "[Ll]ibrary/",
  "[Tt]emp/",
  "[Oo]bj/",
  "[Bb]uild/",
  "[Bb]uilds/",
  "[Ll]ogs/",
  "[Uu]ser[Ss]ettings/",
  "*.csproj",
  "*.sln",
  "*.suo",
  "*.tmp",
  "*.user",
  "*.userprefs",
  "*.pidb",
  "*.booproj",
  "*.svd",
  "*.pdb",
  "*.mdb",
  "*.opendb",
  "*.VC.db",
  "",
  "# Blender",
  "*.blend1",
  "*.blend2",
  "__pycache__/",
  "",
  "# OS",
  ".DS_Store",
  "Thumbs.db",
].join("\n");

const LFS_EXTENSIONS = [
  "*.png",
  "*.jpg",
  "*.jpeg",
  "*.gif",
  "*.bmp",
  "*.tga",
  "*.psd",
  "*.fbx",
  "*.obj",
  "*.blend",
  "*.unitypackage",
  "*.asset",
  "*.wav",
  "*.mp3",
  "*.ogg",
  "*.ttf",
  "*.otf",
];

export class VersionControl {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  private async git(...args: string[]): Promise<{ stdout: string; stderr: string }> {
    try {
      const result = await execFile("git", args, {
        cwd: this.projectPath,
        maxBuffer: 10 * 1024 * 1024,
      });
      return { stdout: result.stdout, stderr: result.stderr };
    } catch (err: unknown) {
      if (err && typeof err === "object" && "stderr" in err) {
        const execErr = err as { stderr: string; stdout: string; message: string };
        throw new Error(`git ${args[0]} failed: ${execErr.stderr || execErr.message}`);
      }
      throw err;
    }
  }

  private async isGitRepo(): Promise<boolean> {
    try {
      await this.git("rev-parse", "--is-inside-work-tree");
      return true;
    } catch {
      return false;
    }
  }

  private async hasCommits(): Promise<boolean> {
    try {
      await this.git("rev-parse", "HEAD");
      return true;
    } catch {
      return false;
    }
  }

  async init(): Promise<{ initialized: boolean; lfsConfigured: boolean }> {
    let initialized = false;
    let lfsConfigured = false;

    // Ensure directory exists
    await mkdir(this.projectPath, { recursive: true });

    // Init repo if needed
    if (!(await this.isGitRepo())) {
      await this.git("init");
      initialized = true;
    }

    // Create .gitignore if it does not exist
    const gitignorePath = join(this.projectPath, ".gitignore");
    try {
      await access(gitignorePath);
    } catch {
      await writeFile(gitignorePath, UNITY_GITIGNORE + "\n", "utf-8");
    }

    // Setup Git LFS
    try {
      await this.git("lfs", "version");
      const attributesPath = join(this.projectPath, ".gitattributes");
      let existingAttributes = "";
      try {
        existingAttributes = await readFile(attributesPath, "utf-8");
      } catch {
        // File does not exist yet
      }
      const lines: string[] = [];
      for (const ext of LFS_EXTENSIONS) {
        const rule = `${ext} filter=lfs diff=lfs merge=lfs -text`;
        if (!existingAttributes.includes(rule)) {
          lines.push(rule);
        }
      }
      if (lines.length > 0) {
        const newContent = existingAttributes
          ? existingAttributes.trimEnd() + "\n" + lines.join("\n") + "\n"
          : lines.join("\n") + "\n";
        await writeFile(attributesPath, newContent, "utf-8");
      }
      await this.git("lfs", "install", "--local");
      lfsConfigured = true;
    } catch {
      // Git LFS not available, skip silently
    }

    return { initialized, lfsConfigured };
  }

  async save(message?: string): Promise<SaveInfo> {
    if (!(await this.isGitRepo())) {
      throw new Error("Not a git repository. Run init() first.");
    }

    // Stage all changes
    await this.git("add", "-A");

    // Check if there is anything to commit
    const { stdout: statusOut } = await this.git("status", "--porcelain");
    if (statusOut.trim() === "") {
      throw new Error("No changes to save.");
    }

    // Auto-generate commit message if not provided
    if (!message) {
      message = await this.generateCommitMessage();
    }

    await this.git("commit", "-m", message);

    // Return the save info
    const saves = await this.listSaves(1);
    return saves[0];
  }

  private async generateCommitMessage(): Promise<string> {
    const { stdout } = await this.git("diff", "--cached", "--stat");
    const lines = stdout.trim().split("\n");
    if (lines.length === 0) {
      return "Auto-save";
    }

    // Last line of --stat is the summary like "3 files changed, 10 insertions(+), 2 deletions(-)"
    const summary = lines[lines.length - 1].trim();
    if (summary) {
      return `Auto-save: ${summary}`;
    }
    return "Auto-save";
  }

  async listSaves(limit: number = 20): Promise<SaveInfo[]> {
    if (!(await this.isGitRepo())) {
      throw new Error("Not a git repository. Run init() first.");
    }

    if (!(await this.hasCommits())) {
      return [];
    }

    const separator = "---COMMIT-BOUNDARY---";
    const format = `${separator}%n%H%n%s%n%aI`;
    const { stdout } = await this.git(
      "log",
      `--max-count=${limit}`,
      `--format=${format}`,
      "--name-only",
    );

    if (!stdout.trim()) {
      return [];
    }

    const saves: SaveInfo[] = [];
    const blocks = stdout.split(separator).filter((b) => b.trim());

    for (const block of blocks) {
      const lines = block.split("\n").filter((l) => l !== "");
      if (lines.length < 3) continue;

      const id = lines[0].trim();
      const message = lines[1].trim();
      const date = lines[2].trim();
      const filesChanged = lines.slice(3).map((f) => f.trim()).filter((f) => f);

      saves.push({ id, message, date, filesChanged });
    }

    return saves;
  }

  async restore(saveId: string): Promise<{ reverted: boolean; newCommitId: string }> {
    if (!(await this.isGitRepo())) {
      throw new Error("Not a git repository. Run init() first.");
    }

    // Verify the commit exists
    try {
      await this.git("cat-file", "-t", saveId);
    } catch {
      throw new Error(`Save "${saveId}" not found.`);
    }

    // Use git revert (safe, does not rewrite history)
    await this.git("revert", "--no-edit", saveId);

    const { stdout } = await this.git("rev-parse", "HEAD");
    return { reverted: true, newCommitId: stdout.trim() };
  }

  async createBranch(name: string): Promise<{ created: boolean; branch: string }> {
    if (!(await this.isGitRepo())) {
      throw new Error("Not a git repository. Run init() first.");
    }

    await this.git("checkout", "-b", name);
    return { created: true, branch: name };
  }

  async mergeBranch(name: string): Promise<{ merged: boolean; branch: string }> {
    if (!(await this.isGitRepo())) {
      throw new Error("Not a git repository. Run init() first.");
    }

    await this.git("merge", name);
    return { merged: true, branch: name };
  }

  async deleteBranch(name: string): Promise<{ deleted: boolean; branch: string }> {
    if (!(await this.isGitRepo())) {
      throw new Error("Not a git repository. Run init() first.");
    }

    // Prevent deleting the current branch
    const { stdout } = await this.git("rev-parse", "--abbrev-ref", "HEAD");
    if (stdout.trim() === name) {
      throw new Error(`Cannot delete the currently checked out branch "${name}".`);
    }

    await this.git("branch", "-d", name);
    return { deleted: true, branch: name };
  }

  async getStatus(): Promise<ProjectStatus> {
    if (!(await this.isGitRepo())) {
      throw new Error("Not a git repository. Run init() first.");
    }

    const { stdout: branchOut } = await this.git("rev-parse", "--abbrev-ref", "HEAD");
    const branch = branchOut.trim();

    const { stdout: statusOut } = await this.git("status", "--porcelain");
    const dirty = statusOut.trim() !== "";

    let lastSave: SaveInfo | null = null;
    if (await this.hasCommits()) {
      const saves = await this.listSaves(1);
      if (saves.length > 0) {
        lastSave = saves[0];
      }
    }

    return { branch, dirty, lastSave };
  }
}
