import { defineCommand, renderUsage, runMain } from "citty";
import { auditCommand } from "./commands/audit";
import { authCommand } from "./commands/auth";
import { bankCommand } from "./commands/bank";
import { clientsCommand } from "./commands/clients";
import { companyCommand } from "./commands/company";
import { completionCommand } from "./commands/completion";
import { documentsCommand } from "./commands/documents";
import { expensesCommand } from "./commands/expenses";
import { invoicesCommand } from "./commands/invoices";
import { labelsCommand } from "./commands/labels";
import { openCommand } from "./commands/open";
import { quotationsCommand } from "./commands/quotations";
import { statusCommand } from "./commands/status";
import { versionCommand } from "./commands/version";
import { translateHelp } from "./i18n";

const main = defineCommand({
	meta: {
		name: "tiime",
		version: "1.0.0",
		description: "CLI pour la comptabilité Tiime — sortie JSON pour agents IA",
	},
	subCommands: {
		audit: auditCommand,
		auth: authCommand,
		company: companyCommand,
		invoices: invoicesCommand,
		clients: clientsCommand,
		bank: bankCommand,
		quotations: quotationsCommand,
		expenses: expensesCommand,
		documents: documentsCommand,
		labels: labelsCommand,
		status: statusCommand,
		open: openCommand,
		version: versionCommand,
		completion: completionCommand,
	},
});

const showTranslatedUsage = async (
	cmd: Parameters<typeof renderUsage>[0],
	parent?: Parameters<typeof renderUsage>[1],
) => {
	const usage = await renderUsage(cmd, parent);
	console.log(`${translateHelp(usage)}\n`);
};

runMain(main, { showUsage: showTranslatedUsage });
