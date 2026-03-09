import { defineCommand } from "citty";
import { createClient, getCompanyId } from "../config";
import { formatArg, type OutputFormat, output, outputError } from "../output";

export const expensesCommand = defineCommand({
	meta: { name: "expenses", description: "Gestion des notes de frais" },
	subCommands: {
		list: defineCommand({
			meta: { name: "list", description: "Lister les notes de frais" },
			args: {
				...formatArg,
				sort: {
					type: "string",
					description: "Tri champ:direction",
					default: "metadata.date:desc",
				},
			},
			async run({ args }) {
				try {
					const client = createClient(getCompanyId());
					const expenses = await client.expenseReports.list(args.sort);
					output(expenses, { format: args.format as OutputFormat });
				} catch (e) {
					outputError(e);
				}
			},
		}),

		get: defineCommand({
			meta: { name: "get", description: "Détails d'une note de frais" },
			args: {
				id: {
					type: "string",
					description: "ID de la note de frais",
					required: true,
				},
			},
			async run({ args }) {
				try {
					const client = createClient(getCompanyId());
					const expense = await client.expenseReports.get(Number(args.id));
					output(expense);
				} catch (e) {
					outputError(e);
				}
			},
		}),

		create: defineCommand({
			meta: { name: "create", description: "Créer une note de frais" },
			args: {
				name: {
					type: "string",
					description: "Nom de la note de frais",
					required: true,
				},
				date: {
					type: "string",
					description: "Date (YYYY-MM-DD)",
				},
			},
			async run({ args }) {
				try {
					const client = createClient(getCompanyId());
					const expense = await client.expenseReports.create({
						name: args.name,
						metadata: args.date ? { date: args.date } : undefined,
					});
					output(expense);
				} catch (e) {
					outputError(e);
				}
			},
		}),
	},
});
