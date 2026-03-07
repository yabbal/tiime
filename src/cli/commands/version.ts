import { defineCommand } from "citty";
import { output } from "../output";

declare const __VERSION__: string;

export const versionCommand = defineCommand({
	meta: { name: "version", description: "Afficher la version" },
	run() {
		output({ version: __VERSION__, node: process.version });
	},
});
