import { writeFileSync } from "node:fs";
import { defineCommand } from "citty";
import { TiimeClient } from "../../sdk/client";
import type { InvoiceLine, QuotationCreateParams } from "../../sdk/types";
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

		create: defineCommand({
			meta: {
				name: "create",
				description: "Créer un devis (brouillon par défaut)",
			},
			args: {
				"client-id": {
					type: "string",
					description: "ID du client",
				},
				date: {
					type: "string",
					description: "Date du devis (YYYY-MM-DD, défaut : aujourd'hui)",
				},
				title: {
					type: "string",
					description: "Titre du devis",
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
				vat: {
					type: "string",
					description:
						"Code TVA (normal=20%, reduced=10%, super_reduced=5.5%, none=0%)",
					default: "normal",
				},
				status: {
					type: "string",
					description: "Statut : draft (défaut) ou saved",
					default: "draft",
				},
			},
			async run({ args }) {
				try {
					const today = new Date().toISOString().split("T")[0];

					if (!args.description || !args["unit-price"]) {
						outputError(
							"--description et --unit-price sont requis pour créer un devis",
						);
						return;
					}

					const lines: InvoiceLine[] = [
						{
							description: args.description,
							quantity: Number(args.quantity),
							unit_amount: Number(args["unit-price"]),
							vat_type: { code: args.vat },
						},
					];

					const params: QuotationCreateParams = {
						date: args.date ?? today,
						title: args.title ?? null,
						lines,
						status: args.status as "draft" | "saved",
					};

					if (args["client-id"]) {
						params.client = { id: Number(args["client-id"]) };
					}

					const client = new TiimeClient({ companyId: getCompanyId() });
					const quotation = await client.quotations.create(params);
					output(quotation);
				} catch (e) {
					outputError(e);
				}
			},
		}),

		pdf: defineCommand({
			meta: {
				name: "pdf",
				description: "Télécharger le PDF d'un devis",
			},
			args: {
				id: {
					type: "string",
					description: "ID du devis",
					required: true,
				},
				output: {
					type: "string",
					description: "Chemin de sortie du fichier (défaut : devis-{id}.pdf)",
				},
			},
			async run({ args }) {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const buffer = await client.quotations.downloadPdf(Number(args.id));
					const filePath = args.output ?? `devis-${args.id}.pdf`;
					writeFileSync(filePath, Buffer.from(buffer));
					output({ status: "downloaded", path: filePath });
				} catch (e) {
					outputError(e);
				}
			},
		}),

		send: defineCommand({
			meta: { name: "send", description: "Envoyer un devis par email" },
			args: {
				id: {
					type: "string",
					description: "ID du devis",
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
					const client = new TiimeClient({ companyId: getCompanyId() });
					await client.quotations.send(Number(args.id), {
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
	},
});
