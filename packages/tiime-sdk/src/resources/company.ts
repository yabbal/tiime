import { Resource } from "../resource";
import type { AccountingPeriod, Company } from "../types";

export class CompanyResource extends Resource {
	get() {
		return this.fetch<Company>(this.url(""));
	}

	users(): Promise<unknown> {
		return this.fetch(this.url("/users"));
	}

	appConfig(): Promise<unknown> {
		return this.fetch(this.url("/app_config"));
	}

	accountingPeriod(rangeYear = 1) {
		return this.fetch<AccountingPeriod>(
			this.url("/accounting_period/current"),
			{ query: { range_year: rangeYear } },
		);
	}

	tiles(keys: string[]): Promise<unknown> {
		return this.fetch(this.url("/tiles"), {
			query: { keys: keys.join(",") },
		});
	}

	dashboardBlocks(displayGroup = "monitoring"): Promise<unknown> {
		return this.fetch(this.url("/dashboard_blocks"), {
			query: { sorts: "rank:asc", display_group: displayGroup },
		});
	}
}
