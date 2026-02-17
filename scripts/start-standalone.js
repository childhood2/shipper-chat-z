#!/usr/bin/env node
// Start script for Next.js standalone server
// Ensures PORT is set and server starts correctly

const { spawn } = require("child_process");
const path = require("path");

const serverPath = path.join(__dirname, "..", ".next", "standalone", "server.js");

// Railway sets PORT; default to 3000 for local
const port = process.env.PORT || "3000";
process.env.PORT = port;

console.log(`Starting Next.js standalone server on port ${port}...`);
console.log(`Server path: ${serverPath}`);

const server = spawn("node", [serverPath], {
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: port,
  },
});

server.on("error", (err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

server.on("exit", (code) => {
  console.error(`Server exited with code ${code}`);
  process.exit(code || 1);
});
