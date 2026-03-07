import { defineCommand } from "citty";
import { TiimeClient } from "../../sdk/client";
import { getCompanyId } from "../config";
import { formatArg, type OutputFormat, output, outputError } from "../output";

export const bankCommand = defineCommand({
	meta: { name: "bank", description: "Comptes bancaires et transactions" },
	subCommands: {
		balance: defineCommand({
			meta: {
				name: "balance",
				description: "Afficher les soldes des comptes",
			},
			args: { ...formatArg },
			async run({ args }) {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const balances = await client.bankAccounts.balance();
					output(balances, { format: args.format as OutputFormat });
				} catch (e) {
					outputError(e);
				}
			},
		}),

		accounts: defineCommand({
			meta: { name: "accounts", description: "Lister les comptes bancaires" },
			args: {
				...formatArg,
				enabled: {
					type: "boolean",
					description: "Uniquement les comptes actifs",
					default: true,
				},
			},
			async run({ args }) {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const accounts = await client.bankAccounts.list(args.enabled);
					output(accounts, { format: args.format as OutputFormat });
				} catch (e) {
					outputError(e);
				}
			},
		}),

		transactions: defineCommand({
			meta: {
				name: "transactions",
				description: "Lister les transactions bancaires",
			},
			args: {
				"bank-account": {
					type: "string",
					description: "Filtrer par ID de compte bancaire",
				},
				"hide-refused": {
					type: "boolean",
					description: "Masquer les transactions refusées",
					default: false,
				},
				sort: {
					type: "string",
					description: "Tri champ:direction (ex: date:desc)",
				},
				page: { type: "string", description: "Numéro de page", default: "1" },
				"page-size": {
					type: "string",
					description: "Éléments par page",
					default: "100",
				},
				from: {
					type: "string",
					description: "Date de début (YYYY-MM-DD)",
				},
				to: {
					type: "string",
					description: "Date de fin (YYYY-MM-DD)",
				},
				search: {
					type: "string",
					description: "Rechercher par libellé",
				},
				all: {
					type: "boolean",
					description: "Récupérer toutes les pages",
					default: false,
				},
				...formatArg,
			},
			async run({ args }) {
				try {
					const fmt = { format: args.format as OutputFormat };
					const client = new TiimeClient({ companyId: getCompanyId() });
					const params = {
						bank_account: args["bank-account"]
							? Number(args["bank-account"])
							: undefined,
						hide_refused: args["hide-refused"],
						sorts: args.sort,
						from: args.from,
						to: args.to,
						search: args.search,
					};

					if (args.all) {
						const transactions = await client.bankTransactions.listAll(params);
						output(transactions, fmt);
					} else {
						const transactions = await client.bankTransactions.list({
							...params,
							page: Number(args.page),
							pageSize: Number(args["page-size"]),
						});
						output(transactions, fmt);
					}
				} catch (e) {
					outputError(e);
				}
			},
		}),

		unimputed: defineCommand({
			meta: {
				name: "unimputed",
				description: "Transactions non imputées",
			},
			args: { ...formatArg },
			async run({ args }) {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const transactions = await client.bankTransactions.unimputed();
					output(transactions, { format: args.format as OutputFormat });
				} catch (e) {
					outputError(e);
				}
			},
		}),
	},
});
