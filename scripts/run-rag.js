import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const ragDir = path.join(rootDir, 'rag_service');

// Find Python in virtualenv if available
let pythonPath = 'python';
const venvWindows = path.join(rootDir, '.venv', 'Scripts', 'python.exe');
const venvUnix = path.join(rootDir, '.venv', 'bin', 'python');

if (fs.existsSync(venvWindows)) {
  pythonPath = venvWindows;
} else if (fs.existsSync(venvUnix)) {
  pythonPath = venvUnix;
}

const args = ['-m', 'uvicorn', 'main:app', '--port', '8000'];
if (process.argv.includes('--prod')) {
  args.push('--host', '0.0.0.0');
}

console.log(`[RAG Runner] Starting RAG service using: ${pythonPath}`);
const child = spawn(pythonPath, args, {
  cwd: ragDir,
  stdio: 'inherit',
  env: { ...process.env, PYTHONPATH: ragDir },
});

child.on('error', (err) => {
  console.error('[RAG Runner] Failed to start RAG service:', err);
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
