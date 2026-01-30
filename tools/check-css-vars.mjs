import fs from 'node:fs/promises';
import path from 'node:path';

const workspaceRoot = process.cwd();

const DEFAULT_DEFINE_DIRS = ['src/app/themes', 'src/styles'];
const DEFAULT_SCAN_DIRS = ['src'];

const IGNORE_PREFIXES = ['--ag-', '--mat-'];

function isIgnoredVar(varName) {
  return IGNORE_PREFIXES.some((prefix) => varName.startsWith(prefix));
}

async function listFilesRecursive(dirPath) {
  /** @type {string[]} */
  const results = [];

  async function walk(current) {
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
          return;
        }

        if (entry.isFile()) {
          results.push(fullPath);
        }
      })
    );
  }

  await walk(dirPath);
  return results;
}

function collectDefinedVarsFromText(text) {
  const set = new Set();
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const match = /^\s*(--[A-Za-z0-9_-]+)\s*:/.exec(line);
    if (match) set.add(match[1]);
  }

  return set;
}

function buildLineStarts(text) {
  /** @type {number[]} */
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

function indexToLineCol(lineStarts, index) {
  // Binary search the last start <= index
  let low = 0;
  let high = lineStarts.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (lineStarts[mid] <= index) low = mid + 1;
    else high = mid - 1;
  }

  const lineIndex = Math.max(0, high);
  const line = lineIndex + 1;
  const col = index - lineStarts[lineIndex] + 1;
  return { line, col };
}

function toPosixRelative(filePath) {
  const rel = path.relative(workspaceRoot, filePath);
  return rel.split(path.sep).join('/');
}

async function loadGlobalDefinitions() {
  const defs = new Set();

  for (const dir of DEFAULT_DEFINE_DIRS) {
    const absDir = path.join(workspaceRoot, dir);
    const files = (await listFilesRecursive(absDir)).filter((f) => f.endsWith('.scss'));

    await Promise.all(
      files.map(async (filePath) => {
        const text = await fs.readFile(filePath, 'utf8');
        for (const v of collectDefinedVarsFromText(text)) defs.add(v);
      })
    );
  }

  return defs;
}

async function main() {
  const globalDefs = await loadGlobalDefinitions();

  /** @type {{file: string; line: number; col: number; varName: string}[]} */
  const issues = [];

  for (const dir of DEFAULT_SCAN_DIRS) {
    const absDir = path.join(workspaceRoot, dir);
    const files = (await listFilesRecursive(absDir)).filter((f) => f.endsWith('.scss'));

    for (const filePath of files) {
      const text = await fs.readFile(filePath, 'utf8');
      const localDefs = collectDefinedVarsFromText(text);
      const lineStarts = buildLineStarts(text);

      const regex = /var\(\s*(--[A-Za-z0-9_-]+)/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const varName = match[1];
        if (isIgnoredVar(varName)) continue;
        if (globalDefs.has(varName)) continue;
        if (localDefs.has(varName)) continue;

        const { line, col } = indexToLineCol(lineStarts, match.index);
        issues.push({ file: toPosixRelative(filePath), line, col, varName });
      }
    }
  }

  // De-dupe repeated hits on the same var/line (can happen with overlapping regex runs in weird content)
  const seen = new Set();
  const unique = issues.filter((i) => {
    const key = `${i.file}:${i.line}:${i.col}:${i.varName}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  for (const issue of unique) {
    // Format that VS Code problem matchers can parse.
    process.stdout.write(
      `${issue.file}:${issue.line}:${issue.col} - Unknown CSS custom property ${issue.varName}\n`
    );
  }

  if (unique.length > 0) {
    process.stderr.write(`\nFound ${unique.length} unknown CSS custom property reference(s).\n`);
    process.exitCode = 1;
  }
}

await main();
