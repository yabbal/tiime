import { defineCommand } from "citty";
import { output } from "../output";

export const versionCommand = defineCommand({
	meta: { name: "version", description: "Afficher la version" },
	run() {
		output({ version: "1.0.0", node: process.version });
	},
});
