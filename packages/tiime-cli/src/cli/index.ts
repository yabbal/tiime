import {
	defineCommand,
	type RunMainOptions,
	renderUsage,
	runMain,
} from "citty";
import { auditCommand } from "./commands/audit";
import { authCommand } from "./commands/auth";
import { bankCommand } from "./commands/bank";
import { clientsCommand } from "./commands/clients";
import { companyCommand } from "./commands/company";
import { createCompletionCommand } from "./commands/completion";
import { dashboardCommand } from "./commands/dashboard";
import { documentsCommand } from "./commands/documents";
import { expensesCommand } from "./commands/expenses";
import { invoicesCommand } from "./commands/invoices";
import { labelsCommand } from "./commands/labels";
import { openCommand } from "./commands/open";
import { quotationsCommand } from "./commands/quotations";
import { statusCommand } from "./commands/status";
import { versionCommand } from "./commands/version";
import { translateHelp } from "./i18n";

declare const __VERSION__: string;

const appCommands = {
	audit: auditCommand,
	auth: authCommand,
	bank: bankCommand,
	clients: clientsCommand,
	company: companyCommand,
	dashboard: dashboardCommand,
	documents: documentsCommand,
	expenses: expensesCommand,
	invoices: invoicesCommand,
	labels: labelsCommand,
	open: openCommand,
	quotations: quotationsCommand,
	status: statusCommand,
	version: versionCommand,
};

const main = defineCommand({
	meta: {
		name: "tiime",
		version: __VERSION__,
		description: "CLI pour la comptabilité Tiime — sortie JSON pour agents IA",
	},
	subCommands: {
		...appCommands,
		completion: createCompletionCommand(appCommands),
	},
});

const showTranslatedUsage = async (
	cmd: Parameters<typeof renderUsage>[0],
	parent?: Parameters<typeof renderUsage>[1],
) => {
	const usage = await renderUsage(cmd, parent);
	console.error(`${translateHelp(usage)}\n`);
};

runMain(main, {
	showUsage: showTranslatedUsage as NonNullable<RunMainOptions["showUsage"]>,
});
