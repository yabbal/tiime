import { defineCommand } from "citty";
import { createClient, getCompanyId, loadConfig, saveConfig } from "../config";
import { formatArg, type OutputFormat, output, outputError } from "../output";

export const companyCommand = defineCommand({
	meta: { name: "company", description: "Gestion de l'entreprise" },
	subCommands: {
		list: defineCommand({
			meta: { name: "list", description: "Lister toutes les entreprises" },
			args: { ...formatArg },
			async run({ args }) {
				try {
					const client = createClient(0);
					const companies = await client.listCompanies();
					output(
						companies.map((c) => ({
							id: c.id,
							name: c.name,
							legal_form: c.legal_form,
							siret: c.siret,
							city: c.city,
						})),
						{ format: args.format as OutputFormat },
					);
				} catch (e) {
					outputError(e);
				}
			},
		}),

		get: defineCommand({
			meta: { name: "get", description: "Détails de l'entreprise active" },
			async run() {
				try {
					const client = createClient(getCompanyId());
					const company = await client.company.get();
					output(company);
				} catch (e) {
					outputError(e);
				}
			},
		}),

		use: defineCommand({
			meta: { name: "use", description: "Définir l'entreprise active" },
			args: {
				id: {
					type: "string",
					description: "ID de l'entreprise",
					required: true,
				},
			},
			run({ args }) {
				const config = loadConfig();
				config.companyId = Number(args.id);
				saveConfig(config);
				output({ status: "ok", companyId: config.companyId });
			},
		}),

		me: defineCommand({
			meta: {
				name: "me",
				description: "Info utilisateur courant (inclut active_company)",
			},
			async run() {
				try {
					const client = createClient(0);
					const user = await client.users.me();
					output(user);
				} catch (e) {
					outputError(e);
				}
			},
		}),
	},
});
