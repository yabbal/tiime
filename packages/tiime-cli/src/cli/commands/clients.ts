import { defineCommand } from "citty";
import { createClient, getCompanyId } from "../config";
import { formatArg, type OutputFormat, output, outputError } from "../output";

export const clientsCommand = defineCommand({
	meta: { name: "clients", description: "Gestion des clients" },
	subCommands: {
		list: defineCommand({
			meta: { name: "list", description: "Lister les clients" },
			args: {
				...formatArg,
				archived: {
					type: "boolean",
					description: "Inclure les clients archivés",
					default: false,
				},
			},
			async run({ args }) {
				try {
					const client = createClient(getCompanyId());
					const clients = await client.clients.list({
						archived: args.archived,
					});
					output(clients, { format: args.format as OutputFormat });
				} catch (e) {
					outputError(e);
				}
			},
		}),

		get: defineCommand({
			meta: { name: "get", description: "Détails d'un client" },
			args: {
				id: { type: "string", description: "ID du client", required: true },
			},
			async run({ args }) {
				try {
					const client = createClient(getCompanyId());
					const result = await client.clients.get(Number(args.id));
					output(result);
				} catch (e) {
					outputError(e);
				}
			},
		}),

		create: defineCommand({
			meta: { name: "create", description: "Créer un client" },
			args: {
				name: {
					type: "string",
					description: "Nom du client",
					required: true,
				},
				address: {
					type: "string",
					description: "Adresse du client",
				},
				"postal-code": {
					type: "string",
					description: "Code postal",
				},
				city: {
					type: "string",
					description: "Ville",
				},
				email: {
					type: "string",
					description: "Adresse email",
				},
				phone: {
					type: "string",
					description: "Numéro de téléphone",
				},
				siret: {
					type: "string",
					description: "SIREN ou SIRET",
				},
				professional: {
					type: "boolean",
					description: "Client professionnel",
					default: true,
				},
			},
			async run({ args }) {
				try {
					const client = createClient(getCompanyId());
					const result = await client.clients.create({
						name: args.name,
						address: args.address,
						postal_code: args["postal-code"],
						city: args.city,
						email: args.email,
						phone: args.phone,
						siren_or_siret: args.siret,
						professional: args.professional,
					});
					output(result);
				} catch (e) {
					outputError(e);
				}
			},
		}),

		search: defineCommand({
			meta: { name: "search", description: "Rechercher un client" },
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
					const client = createClient(getCompanyId());
					const results = await client.clients.search(args.query);
					output(results, { format: args.format as OutputFormat });
				} catch (e) {
					outputError(e);
				}
			},
		}),
	},
});
