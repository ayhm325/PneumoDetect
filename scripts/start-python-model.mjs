#!/usr/bin/env node
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const root = process.cwd();
const venvWin = path.join(root, ".venv", "Scripts", "python.exe");
const venvUnix = path.join(root, ".venv", "bin", "python");
let python = "python";

if (fs.existsSync(venvWin)) python = venvWin;
else if (fs.existsSync(venvUnix)) python = venvUnix;

const script = path.join(root, "python_model", "predict_server.py");

console.log(`Starting python model server with: ${python} ${script}`);

if (!fs.existsSync(script)) {
  console.error("Python model script not found at", script);
  process.exit(1);
}

const env = { ...process.env, PYTHONIOENCODING: "utf-8" };
const child = spawn(python, [script], { stdio: "inherit", env });

child.on("exit", (code) => process.exit(code ?? 0));
child.on("error", (err) => {
  console.error("Failed to start python server", err);
  process.exit(1);
});
