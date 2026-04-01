#!/usr/bin/env node

import { parseSetupArgs, runSetup } from "./setup.js";

const command = process.argv[2];

if (command === "setup") {
  const options = parseSetupArgs(process.argv);
  process.stderr.write("OpenForge MCP -- Setup\n\n");
  const results = runSetup(options);
  if (results.length > 0) {
    process.stderr.write(`\nDone. ${results.filter((r) => r.action === "written").length} client(s) configured.\n`);
  }
} else {
  // Delegate to the main MCP server entry point
  import("../index.js");
}
