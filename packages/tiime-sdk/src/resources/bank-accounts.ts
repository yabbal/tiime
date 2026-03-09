import { Resource } from "../resource";
import type { BankAccount } from "../types";

export class BankAccountsResource extends Resource {
	list(enabled?: boolean) {
		return this.fetch<BankAccount[]>(this.url("/bank_accounts"), {
			query: enabled !== undefined ? { enabled } : undefined,
		});
	}

	get(bankAccountId: number) {
		return this.fetch<BankAccount>(this.url(`/bank_accounts/${bankAccountId}`));
	}

	async balance() {
		const accounts = await this.list(true);
		return accounts.map((a) => ({
			name: a.name,
			balance_amount: a.balance_amount,
			currency: a.balance_currency,
		}));
	}
}
