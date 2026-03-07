import { defineCommand, runMain } from "citty";
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
import { suppliersCommand } from "./commands/suppliers";
import { versionCommand } from "./commands/version";

const main = defineCommand({
	meta: {
		name: "tiime",
		version: "1.0.0",
		description: "CLI pour la comptabilité Tiime — sortie JSON pour agents IA",
	},
	subCommands: {
		auth: authCommand,
		company: companyCommand,
		invoices: invoicesCommand,
		clients: clientsCommand,
		suppliers: suppliersCommand,
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

runMain(main);
