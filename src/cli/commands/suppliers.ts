import { defineCommand } from "citty";
import { TiimeClient } from "../../sdk/client";
import { getCompanyId } from "../config";
import { formatArg, type OutputFormat, output, outputError } from "../output";

export const suppliersCommand = defineCommand({
	meta: { name: "suppliers", description: "Gestion des fournisseurs" },
	subCommands: {
		list: defineCommand({
			meta: { name: "list", description: "Lister les fournisseurs" },
			args: {
				...formatArg,
			},
			async run({ args }) {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const suppliers = await client.suppliers.list();
					output(suppliers, { format: args.format as OutputFormat });
				} catch (e) {
					outputError(e);
				}
			},
		}),

		get: defineCommand({
			meta: { name: "get", description: "Détails d'un fournisseur" },
			args: {
				id: {
					type: "string",
					description: "ID du fournisseur",
					required: true,
				},
			},
			async run({ args }) {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const result = await client.suppliers.get(Number(args.id));
					output(result);
				} catch (e) {
					outputError(e);
				}
			},
		}),

		search: defineCommand({
			meta: { name: "search", description: "Rechercher un fournisseur" },
			args: {
				...formatArg,
				query: {
					type: "string",
					description: "Terme de recherche",
					required: true,
				},
			},
			async run({ args }) {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const results = await client.suppliers.search(args.query);
					output(results, { format: args.format as OutputFormat });
				} catch (e) {
					outputError(e);
				}
			},
		}),
	},
});
