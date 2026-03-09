import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

const { version } = JSON.parse(readFileSync("./package.json", "utf-8"));

export default defineConfig({
	entry: { cli: "src/cli/index.ts" },
	format: ["esm"],
	banner: { js: "#!/usr/bin/env node" },
	define: { __VERSION__: JSON.stringify(version) },
	clean: true,
});
