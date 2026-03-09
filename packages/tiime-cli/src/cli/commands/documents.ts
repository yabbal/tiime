import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { defineCommand } from "citty";
import { TiimeClient } from "tiime-sdk";
import { getCompanyId } from "../config";
import { formatArg, type OutputFormat, output, outputError } from "../output";

export const documentsCommand = defineCommand({
	meta: { name: "documents", description: "Gestion des documents" },
	subCommands: {
		list: defineCommand({
			meta: { name: "list", description: "Lister les documents" },
			args: {
				...formatArg,
				type: {
					type: "string",
					description: "Type de document (ex: receipt)",
				},
				source: {
					type: "string",
					description: "Source du document (ex: accountant)",
				},
				page: { type: "string", description: "Numéro de page", default: "1" },
			},
			async run({ args }) {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const docs = await client.documents.list({
						types: args.type,
						source: args.source,
						page: Number(args.page),
					});
					output(docs, { format: args.format as OutputFormat });
				} catch (e) {
					outputError(e);
				}
			},
		}),

		upload: defineCommand({
			meta: { name: "upload", description: "Uploader un justificatif" },
			args: {
				file: {
					type: "string",
					description: "Chemin du fichier à uploader",
					required: true,
				},
				type: {
					type: "string",
					description: "Type de document",
				},
			},
			async run({ args }) {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const fileBuffer = readFileSync(args.file);
					const filename = basename(args.file);
					const result = await client.documents.upload(
						fileBuffer,
						filename,
						args.type,
					);
					output(result);
				} catch (e) {
					outputError(e);
				}
			},
		}),

		download: defineCommand({
			meta: { name: "download", description: "Télécharger un document" },
			args: {
				id: {
					type: "string",
					description: "ID du document",
					required: true,
				},
				output: {
					type: "string",
					description: "Chemin de sortie du fichier",
				},
			},
			async run({ args }) {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const documentId = Number(args.id);
					const data = await client.documents.download(documentId);
					const outputPath = args.output ?? `document-${documentId}`;
					writeFileSync(outputPath, Buffer.from(data));
					output({ status: "downloaded", path: outputPath });
				} catch (e) {
					outputError(e);
				}
			},
		}),

		categories: defineCommand({
			meta: {
				name: "categories",
				description: "Lister les catégories de documents",
			},
			args: { ...formatArg },
			async run({ args }) {
				try {
					const client = new TiimeClient({ companyId: getCompanyId() });
					const categories = await client.documents.categories();
					output(categories, { format: args.format as OutputFormat });
				} catch (e) {
					outputError(e);
				}
			},
		}),
	},
});
