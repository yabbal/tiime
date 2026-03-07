import { defineCommand } from "citty";
import { TiimeClient } from "../../sdk/client";
import { getCompanyId } from "../config";
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
					const client = new TiimeClient({ companyId: getCompanyId() });
					const expenses = await client.expenseReports.list(args.sort);
					output(expenses, { format: args.format as OutputFormat });
				} catch (e) {
					outputError(e);
				}
			},
		}),
	},
});
