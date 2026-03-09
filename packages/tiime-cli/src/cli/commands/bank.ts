import { defineCommand } from "citty";
import type {
	ImputationLabel,
	ImputationParams,
	LabelSuggestion,
} from "tiime-sdk";
import { autoImputeForCompany, resolveCompanyIds } from "../auto-impute";
import { createClient, getCompanyId } from "../config";
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
					const client = createClient(getCompanyId());
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
					const client = createClient(getCompanyId());
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
					const client = createClient(getCompanyId());
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
					const client = createClient(getCompanyId());
					const transactions = await client.bankTransactions.unimputed();
					output(transactions, { format: args.format as OutputFormat });
				} catch (e) {
					outputError(e);
				}
			},
		}),

		impute: defineCommand({
			meta: {
				name: "impute",
				description: "Imputer manuellement une transaction",
			},
			args: {
				id: {
					type: "string",
					description: "ID de la transaction (requis)",
					required: true,
				},
				"label-id": {
					type: "string",
					description: "ID du label à assigner (requis)",
					required: true,
				},
				"label-name": {
					type: "string",
					description: "Nom du label (optionnel, pour affichage)",
				},
				"dry-run": {
					type: "boolean",
					description: "Prévisualiser sans appliquer",
					default: false,
				},
				...formatArg,
			},
			async run({ args }) {
				try {
					const client = createClient(getCompanyId());
					const transactionId = Number(args.id);
					const labelId = Number(args["label-id"]);

					const [transaction, suggestions] = await Promise.all([
						client.bankTransactions.get(transactionId),
						client.bankTransactions.labelSuggestions(transactionId),
					]);

					let matchedLabel: LabelSuggestion | undefined = suggestions.find(
						(s) => s.id === labelId,
					);

					if (!matchedLabel) {
						const [labels, standardLabels] = await Promise.all([
							client.labels.list(),
							client.labels.standard(),
						]);
						const allLabels = [...labels, ...standardLabels];
						const found = allLabels.find((l) => l.id === labelId);
						if (found) {
							matchedLabel = {
								id: found.id,
								label: found.name,
								name: found.name,
								acronym: "",
								color: found.color,
								client: null,
							};
						}
					}

					if (!matchedLabel) {
						outputError(
							new Error(
								`Label #${labelId} introuvable dans les suggestions ni dans les labels disponibles`,
							),
						);
						return;
					}

					const imputationLabel: ImputationLabel = {
						...matchedLabel,
						disabled: false,
					};

					const imputationParams: ImputationParams[] = [
						{
							label: imputationLabel,
							amount: transaction.amount,
							documents: [],
							accountant_detail_requests: [],
						},
					];

					const displayName =
						args["label-name"] ?? matchedLabel.name ?? matchedLabel.label;

					if (args["dry-run"]) {
						output(
							{
								dry_run: true,
								transaction_id: transactionId,
								wording: transaction.wording,
								amount: transaction.amount,
								currency: transaction.currency,
								label_id: labelId,
								label_name: displayName,
							},
							{ format: args.format as OutputFormat },
						);
						return;
					}

					const result = await client.bankTransactions.impute(
						transactionId,
						imputationParams,
					);
					output(result, { format: args.format as OutputFormat });
				} catch (e) {
					outputError(e);
				}
			},
		}),

		"auto-impute": defineCommand({
			meta: {
				name: "auto-impute",
				description:
					"Auto-imputer les transactions non imputées via les suggestions",
			},
			args: {
				"dry-run": {
					type: "boolean",
					description: "Mode prévisualisation (par défaut)",
					default: true,
				},
				apply: {
					type: "boolean",
					description: "Appliquer les imputations (désactive dry-run)",
					default: false,
				},
				"all-companies": {
					type: "boolean",
					description:
						"Traiter toutes les entreprises du compte (sinon entreprise active)",
					default: false,
				},
				company: {
					type: "string",
					description:
						"ID ou nom de l'entreprise cible (peut être répété avec virgule : 50824,117954)",
				},
				...formatArg,
			},
			async run({ args }) {
				try {
					let companyIds: number[];

					if (args["all-companies"]) {
						const rootClient = createClient(0);
						const companies = await rootClient.listCompanies();
						companyIds = companies.map((c) => c.id);
					} else if (args.company) {
						const parts = args.company.split(",").map((s) => s.trim());
						const allNumeric = parts.every((p) => /^\d+$/.test(p));
						if (allNumeric) {
							companyIds = parts.map(Number);
						} else {
							const rootClient = createClient(0);
							const companies = await rootClient.listCompanies();
							companyIds = resolveCompanyIds(parts, companies);
						}
					} else {
						companyIds = [getCompanyId()];
					}

					const allProposals = [];

					for (const companyId of companyIds) {
						const client = createClient(companyId);
						let companyName = String(companyId);
						try {
							const info = await client.company.get();
							companyName = info.name ?? String(companyId);
						} catch {
							/* use id as fallback */
						}

						const proposals = await autoImputeForCompany(
							client,
							companyId,
							companyName,
							{ apply: args.apply },
						);
						allProposals.push(...proposals);
					}

					output(allProposals, { format: args.format as OutputFormat });
				} catch (e) {
					outputError(e);
				}
			},
		}),
	},
});
