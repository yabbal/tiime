import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

const { version } = JSON.parse(readFileSync("./package.json", "utf-8"));

export default defineConfig([
	{
		entry: { index: "src/index.ts" },
		format: ["esm"],
		dts: true,
		clean: true,
	},
	{
		entry: { cli: "src/cli/index.ts" },
		format: ["esm"],
		banner: { js: "#!/usr/bin/env node" },
		define: { __VERSION__: JSON.stringify(version) },
	},
]);
