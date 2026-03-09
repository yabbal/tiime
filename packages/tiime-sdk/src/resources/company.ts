import type { $Fetch } from "ofetch";
import type { AccountingPeriod, Company } from "../types";

export class CompanyResource {
	constructor(
		private fetch: $Fetch,
		private companyId: number,
	) {}

	get() {
		return this.fetch<Company>(`/companies/${this.companyId}`);
	}

	users() {
		return this.fetch(`/companies/${this.companyId}/users`);
	}

	appConfig() {
		return this.fetch(`/companies/${this.companyId}/app_config`);
	}

	accountingPeriod(rangeYear = 1) {
		return this.fetch<AccountingPeriod>(
			`/companies/${this.companyId}/accounting_period/current`,
			{ query: { range_year: rangeYear } },
		);
	}

	tiles(keys: string[]) {
		return this.fetch(`/companies/${this.companyId}/tiles`, {
			query: { keys: keys.join(",") },
		});
	}

	dashboardBlocks(displayGroup = "monitoring") {
		return this.fetch(`/companies/${this.companyId}/dashboard_blocks`, {
			query: { sorts: "rank:asc", display_group: displayGroup },
		});
	}
}
