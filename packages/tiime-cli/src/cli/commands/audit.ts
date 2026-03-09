import { defineCommand } from "citty";
import { consola } from "consola";
import {
	type AuditReport,
	auditForCompany,
	type CompanyAuditReport,
	emptyReport,
} from "../audit";
import { resolveCompanyIds } from "../auto-impute";
import { createClient, getCompanyId } from "../config";
import { formatArg, type OutputFormat, output, outputError } from "../output";

export const auditCommand = defineCommand({
	meta: {
		name: "audit",
		description: "Audit comptable multi-entreprises",
	},
	args: {
		"all-companies": {
			type: "boolean",
			description: "Traiter toutes les entreprises",
			default: false,
		},
		company: {
			type: "string",
			description:
				"Entreprise(s) cible(s) (ID ou nom, séparés par des virgules)",
		},
		apply: {
			type: "boolean",
			description: "Appliquer les corrections automatiques (imputation auto)",
			default: false,
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

			const companyReports: CompanyAuditReport[] = [];

			for (const companyId of companyIds) {
				const client = createClient(companyId);
				let companyName = String(companyId);
				try {
					const info = await client.company.get();
					companyName = info.name ?? String(companyId);
				} catch {
					/* use id as fallback */
				}

				try {
					const report = await auditForCompany(client, companyId, companyName, {
						apply: args.apply,
					});
					companyReports.push(report);
				} catch (e) {
					const message = e instanceof Error ? e.message : String(e);
					consola.error(`Erreur audit entreprise ${companyName}: ${message}`);
					companyReports.push(emptyReport(companyId, companyName, message));
				}
			}

			const report: AuditReport = {
				date: new Date().toISOString().slice(0, 10),
				companies: companyReports,
				apply_mode: args.apply,
			};

			output(report, { format: args.format as OutputFormat });
		} catch (e) {
			outputError(e);
		}
	},
});
