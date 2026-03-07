import { defineCommand } from "citty";
import { TiimeClient } from "../../sdk/client";
import { getCompanyId } from "../config";
import { formatArg, type OutputFormat, output, outputError } from "../output";

export const quotationsCommand = defineCommand({
	meta: { name: "quotations", description: "Gestion des devis" },
	subCommands: {
		list: defineCommand({
			meta: { name: "list", description: "Lister les devis" },
			args: { ...formatArg },
			async run({ args }) {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const quotations = await client.quotations.list();
					output(quotations, { format: args.format as OutputFormat });
				} catch (e) {
					outputError(e);
				}
			},
		}),

		get: defineCommand({
			meta: { name: "get", description: "Détails d'un devis" },
			args: {
				id: { type: "string", description: "ID du devis", required: true },
			},
			async run({ args }) {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const quotation = await client.quotations.get(Number(args.id));
					output(quotation);
				} catch (e) {
					outputError(e);
				}
			},
		}),
	},
});
