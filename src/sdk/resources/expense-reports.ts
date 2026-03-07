import type { $Fetch } from "ofetch";
import type { ExpenseReport, ExpenseReportCreateParams } from "../types";

export class ExpenseReportsResource {
	constructor(
		private fetch: $Fetch,
		private companyId: number,
	) {}

	list(sorts = "metadata.date:desc") {
		return this.fetch<ExpenseReport[]>(
			`/companies/${this.companyId}/expense_reports`,
			{
				query: { expand: "total_amount", sorts },
				headers: { Range: "items=0-25" },
			},
		);
	}

	get(expenseReportId: number) {
		return this.fetch<ExpenseReport>(
			`/companies/${this.companyId}/expense_reports/${expenseReportId}`,
		);
	}

	create(params: ExpenseReportCreateParams) {
		return this.fetch<ExpenseReport>(
			`/companies/${this.companyId}/expense_reports`,
			{
				method: "POST",
				body: params,
			},
		);
	}
}
