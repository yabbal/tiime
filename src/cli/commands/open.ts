import { exec } from "node:child_process";
import { defineCommand } from "citty";
import { getCompanyId } from "../config";
import { output, outputError } from "../output";

const APP_BASE_URL = "https://apps.tiime.fr";

const sections: Record<string, string> = {
	invoices: "/invoicing/invoices",
	quotations: "/invoicing/quotations",
	clients: "/invoicing/clients",
	bank: "/bank",
	documents: "/documents",
	expenses: "/expense-reports",
};

const buildUrl = (section?: string): string => {
	if (!section) {
		return APP_BASE_URL;
	}

	const path = sections[section];
	if (!path) {
		throw new Error(
			`Section inconnue : ${section}. Sections disponibles : ${Object.keys(sections).join(", ")}`,
		);
	}

	const companyId = getCompanyId();
	return `${APP_BASE_URL}/companies/${companyId}${path}`;
};

export const openCommand = defineCommand({
	meta: {
		name: "open",
		description: "Ouvrir Tiime dans le navigateur",
	},
	args: {
		section: {
			type: "positional",
			description: `Section à ouvrir (${Object.keys(sections).join(", ")})`,
			required: false,
		},
	},
	run({ args }) {
		try {
			const url = buildUrl(args.section);
			exec(`open "${url}"`);
			output({ opened: url });
		} catch (e) {
			outputError(e);
		}
	},
});
