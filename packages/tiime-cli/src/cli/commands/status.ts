import { defineCommand } from "citty";
import { createClient, getCompanyId } from "../config";
import {
	formatArg,
	type OutputFormat,
	output,
	outputColoredStatus,
	outputError,
} from "../output";

export const statusCommand = defineCommand({
	meta: { name: "status", description: "Résumé rapide de la situation" },
	args: { ...formatArg },
	async run({ args }) {
		try {
			const client = createClient(getCompanyId());

			const [
				accounts,
				draftInvoices,
				unpaidInvoices,
				unimputed,
				clients,
				quotations,
			] = await Promise.all([
				client.bankAccounts.list(true),
				client.invoices.list({ status: "draft" }),
				client.invoices.list({ status: "sent" }),
				client.bankTransactions.unimputed(),
				client.clients.list(),
				client.quotations.list(),
			]);

			const pendingQuotations = quotations.filter(
				(q) => q.status !== "accepted" && q.status !== "declined",
			);

			const data = {
				company_id: client.companyId,
				bank_accounts: accounts.map((a) => ({
					name: a.name,
					balance: a.balance_amount,
					currency: a.balance_currency,
				})),
				invoices: {
					drafts: draftInvoices.length,
					unpaid: unpaidInvoices.length,
				},
				pending_quotations: pendingQuotations.length,
				total_clients: clients.length,
				unimputed_transactions: unimputed.length,
			};

			const format = args.format as OutputFormat;
			output(data, { format });

			if (format === "json") {
				outputColoredStatus(data);
			}
		} catch (e) {
			outputError(e);
		}
	},
});
