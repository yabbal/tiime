import { writeFileSync } from "node:fs";
import { defineCommand } from "citty";
import type { InvoiceCreateParams, InvoiceLine } from "tiime-sdk";
import { createClient, getCompanyId } from "../config";
import { formatArg, type OutputFormat, output, outputError } from "../output";

const DEFAULT_INVOICE_TEMPLATE: Partial<InvoiceCreateParams> = {
	template: "advanced",
	status: "draft",
	due_date_mode: "thirty_days",
	title_enabled: true,
	free_field_enabled: false,
	free_field: "",
	discount_enabled: false,
	bank_detail_enabled: true,
	payment_condition_enabled: true,
	payment_condition:
		"En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée, à laquelle s'ajoutera une indemnité forfaitaire pour frais de recouvrement de 40€.",
	text_lines: [],
};

export const invoicesCommand = defineCommand({
	meta: { name: "invoices", description: "Gestion des factures" },
	subCommands: {
		list: defineCommand({
			meta: { name: "list", description: "Lister les factures" },
			args: {
				...formatArg,
				sort: {
					type: "string",
					description: "Tri champ:direction (ex: invoice_number:desc)",
					default: "invoice_number:desc",
				},
				status: {
					type: "string",
					description: "Filtrer par statut (draft, saved, sent, paid)",
				},
				page: { type: "string", description: "Numéro de page", default: "1" },
				"page-size": {
					type: "string",
					description: "Éléments par page",
					default: "25",
				},
				all: {
					type: "boolean",
					description: "Récupérer toutes les pages",
					default: false,
				},
			},
			async run({ args }) {
				try {
					const fmt = { format: args.format as OutputFormat };
					const client = createClient(getCompanyId());
					if (args.all) {
						const invoices = await client.invoices.listAll({
							sorts: args.sort,
							status: args.status,
						});
						output(invoices, fmt);
					} else {
						const invoices = await client.invoices.list({
							sorts: args.sort,
							status: args.status,
							page: Number(args.page),
							pageSize: Number(args["page-size"]),
						});
						output(invoices, fmt);
					}
				} catch (e) {
					outputError(e);
				}
			},
		}),

		get: defineCommand({
			meta: { name: "get", description: "Détails d'une facture" },
			args: {
				id: { type: "string", description: "ID de la facture", required: true },
			},
			async run({ args }) {
				try {
					const client = createClient(getCompanyId());
					const invoice = await client.invoices.get(Number(args.id));
					output(invoice);
				} catch (e) {
					outputError(e);
				}
			},
		}),

		create: defineCommand({
			meta: {
				name: "create",
				description: "Créer une facture (brouillon par défaut)",
			},
			args: {
				"client-id": {
					type: "string",
					description: "ID du client",
				},
				"client-name": {
					type: "string",
					description: "Nom du client (si pas de client-id)",
				},
				date: {
					type: "string",
					description: "Date d'émission (YYYY-MM-DD, défaut : aujourd'hui)",
				},
				title: {
					type: "string",
					description: "Titre de la facture",
				},
				description: {
					type: "string",
					description: "Description de la ligne (ligne simple)",
				},
				quantity: {
					type: "string",
					description: "Quantité (ligne simple)",
					default: "1",
				},
				"unit-price": {
					type: "string",
					description: "Prix unitaire HT (ligne simple)",
				},
				unit: {
					type: "string",
					description: "Code unité (day, hour, unit, etc.)",
				},
				vat: {
					type: "string",
					description:
						"Code TVA (normal=20%, reduced=10%, super_reduced=5.5%, none=0%)",
					default: "normal",
				},
				lines: {
					type: "string",
					description:
						'Multi-lignes en JSON : \'[{"description":"Dev","quantity":20,"unit_price":540,"unit":"day"}]\'',
				},
				"free-field": {
					type: "string",
					description: "Champ libre (ex : référence contrat)",
				},
				status: {
					type: "string",
					description: "Statut : draft (défaut) ou saved (numérotée)",
					default: "draft",
				},
				"dry-run": {
					type: "boolean",
					description: "Prévisualiser le payload sans créer la facture",
					default: false,
				},
			},
			async run({ args }) {
				try {
					const today = new Date().toISOString().split("T")[0];
					const unitMap: Record<string, number> = {
						day: 3,
						hour: 2,
						unit: 1,
						package: 4,
						word: 5,
						character: 6,
						page: 7,
					};

					let invoiceLines: InvoiceLine[];

					if (args.lines) {
						const parsed = JSON.parse(args.lines) as {
							description: string;
							quantity: number;
							unit_price: number;
							unit?: string;
							vat?: string;
						}[];
						invoiceLines = parsed.map((l) => ({
							description: l.description,
							quantity: l.quantity,
							unit_amount: l.unit_price,
							vat_type: { code: l.vat ?? args.vat },
							invoicing_unit: l.unit
								? { id: unitMap[l.unit] ?? 1, code: l.unit }
								: null,
						}));
					} else {
						if (!args.description || !args["unit-price"]) {
							outputError(
								"--description et --unit-price sont requis pour une ligne simple (ou utilisez --lines pour du multi-lignes)",
							);
							return;
						}
						invoiceLines = [
							{
								description: args.description,
								quantity: Number(args.quantity),
								unit_amount: Number(args["unit-price"]),
								vat_type: { code: args.vat },
								invoicing_unit: args.unit
									? { id: unitMap[args.unit] ?? 1, code: args.unit }
									: null,
							},
						];
					}

					const params: InvoiceCreateParams = {
						...DEFAULT_INVOICE_TEMPLATE,
						emission_date: args.date ?? today,
						title: args.title ?? null,
						lines: invoiceLines,
						status: args.status as "draft" | "saved",
					};

					if (args["client-id"]) {
						params.client = { id: Number(args["client-id"]) };
					} else if (args["client-name"]) {
						params.client_name = args["client-name"];
					}

					if (args["free-field"]) {
						params.free_field = args["free-field"];
						params.free_field_enabled = true;
					}

					if (args["dry-run"]) {
						output({ dry_run: true, payload: params });
						return;
					}

					const client = createClient(getCompanyId());
					const invoice = await client.invoices.create(params);
					output(invoice);
				} catch (e) {
					outputError(e);
				}
			},
		}),

		duplicate: defineCommand({
			meta: {
				name: "duplicate",
				description: "Dupliquer une facture existante en brouillon",
			},
			args: {
				id: {
					type: "string",
					description: "ID de la facture source",
					required: true,
				},
				date: {
					type: "string",
					description:
						"Date d'émission de la copie (YYYY-MM-DD, défaut : aujourd'hui)",
				},
				quantity: {
					type: "string",
					description: "Remplacer la quantité pour toutes les lignes",
				},
			},
			async run({ args }) {
				try {
					const client = createClient(getCompanyId());
					const invoice = await client.invoices.duplicate(Number(args.id), {
						emission_date: args.date,
						quantity: args.quantity ? Number(args.quantity) : undefined,
					});
					output(invoice);
				} catch (e) {
					outputError(e);
				}
			},
		}),

		update: defineCommand({
			meta: { name: "update", description: "Mettre à jour une facture" },
			args: {
				id: {
					type: "string",
					description: "ID de la facture",
					required: true,
				},
				title: {
					type: "string",
					description: "Nouveau titre de la facture",
				},
				status: {
					type: "string",
					description: "Nouveau statut (draft, saved)",
				},
				date: {
					type: "string",
					description: "Nouvelle date d'émission (YYYY-MM-DD)",
				},
				"free-field": {
					type: "string",
					description: "Nouveau champ libre",
				},
			},
			async run({ args }) {
				try {
					const updates: Record<string, unknown> = {};
					if (args.title !== undefined) updates.title = args.title;
					if (args.status !== undefined) updates.status = args.status;
					if (args.date !== undefined) updates.emission_date = args.date;
					if (args["free-field"] !== undefined) {
						updates.free_field = args["free-field"];
						updates.free_field_enabled = true;
					}

					const client = createClient(getCompanyId());
					const invoice = await client.invoices.update(
						Number(args.id),
						updates,
					);
					output(invoice);
				} catch (e) {
					outputError(e);
				}
			},
		}),

		send: defineCommand({
			meta: { name: "send", description: "Envoyer une facture par email" },
			args: {
				id: {
					type: "string",
					description: "ID de la facture",
					required: true,
				},
				email: {
					type: "string",
					description: "Adresse email du destinataire",
					required: true,
				},
				subject: {
					type: "string",
					description: "Objet de l'email",
				},
				message: {
					type: "string",
					description: "Corps du message",
				},
			},
			async run({ args }) {
				try {
					const client = createClient(getCompanyId());
					await client.invoices.send(Number(args.id), {
						recipients: [{ email: args.email }],
						subject: args.subject,
						message: args.message,
					});
					output({
						status: "sent",
						id: Number(args.id),
						email: args.email,
					});
				} catch (e) {
					outputError(e);
				}
			},
		}),

		pdf: defineCommand({
			meta: {
				name: "pdf",
				description: "Télécharger le PDF d'une facture",
			},
			args: {
				id: {
					type: "string",
					description: "ID de la facture",
					required: true,
				},
				output: {
					type: "string",
					description:
						"Chemin de sortie du fichier (défaut : facture-{id}.pdf)",
				},
			},
			async run({ args }) {
				try {
					const client = createClient(getCompanyId());
					const buffer = await client.invoices.downloadPdf(Number(args.id));
					const filePath = args.output ?? `facture-${args.id}.pdf`;
					writeFileSync(filePath, Buffer.from(buffer));
					output({ status: "downloaded", path: filePath });
				} catch (e) {
					outputError(e);
				}
			},
		}),

		delete: defineCommand({
			meta: { name: "delete", description: "Supprimer une facture brouillon" },
			args: {
				id: {
					type: "string",
					description: "ID de la facture à supprimer",
					required: true,
				},
			},
			async run({ args }) {
				try {
					const client = createClient(getCompanyId());
					await client.invoices.delete(Number(args.id));
					output({ status: "deleted", id: Number(args.id) });
				} catch (e) {
					outputError(e);
				}
			},
		}),
	},
});
