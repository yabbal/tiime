import { defineCommand } from "citty";
import { createClient, getCompanyId } from "../config";
import { formatArg, type OutputFormat, output, outputError } from "../output";

export const labelsCommand = defineCommand({
	meta: { name: "labels", description: "Gestion des labels et tags" },
	subCommands: {
		list: defineCommand({
			meta: { name: "list", description: "Lister les labels personnalisés" },
			args: { ...formatArg },
			async run({ args }) {
				try {
					const client = createClient(getCompanyId());
					const labels = await client.labels.list();
					output(labels, { format: args.format as OutputFormat });
				} catch (e) {
					outputError(e);
				}
			},
		}),

		standard: defineCommand({
			meta: { name: "standard", description: "Lister les labels standards" },
			args: { ...formatArg },
			async run({ args }) {
				try {
					const client = createClient(getCompanyId());
					const labels = await client.labels.standard();
					output(labels, { format: args.format as OutputFormat });
				} catch (e) {
					outputError(e);
				}
			},
		}),

		tags: defineCommand({
			meta: { name: "tags", description: "Lister les tags" },
			args: { ...formatArg },
			async run({ args }) {
				try {
					const client = createClient(getCompanyId());
					const tags = await client.labels.tags();
					output(tags, { format: args.format as OutputFormat });
				} catch (e) {
					outputError(e);
				}
			},
		}),
	},
});
