import { defineCommand } from "citty";
import { TiimeClient } from "../../sdk/client";
import { getCompanyId } from "../config";
import { formatArg, type OutputFormat, output, outputError } from "../output";

export const statusCommand = defineCommand({
	meta: { name: "status", description: "Résumé rapide de la situation" },
	args: { ...formatArg },
	async run({ args }) {
		try {
			const client = new TiimeClient({ companyId: getCompanyId() });

			const [accounts, draftInvoices, unpaidInvoices, unimputed] =
				await Promise.all([
					client.bankAccounts.list(true),
					client.invoices.list({ status: "draft" }),
					client.invoices.list({ status: "sent" }),
					client.bankTransactions.unimputed(),
				]);

			output(
				{
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
					unimputed_transactions: unimputed.length,
				},
				{ format: args.format as OutputFormat },
			);
		} catch (e) {
			outputError(e);
		}
	},
});
