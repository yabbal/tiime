import { Resource } from "../resource";
import type { ExpenseReport, ExpenseReportCreateParams } from "../types";

export class ExpenseReportsResource extends Resource {
	list(sorts = "metadata.date:desc") {
		return this.fetch<ExpenseReport[]>(this.url("/expense_reports"), {
			query: { expand: "total_amount", sorts },
			headers: { Range: "items=0-25" },
		});
	}

	get(expenseReportId: number) {
		return this.fetch<ExpenseReport>(
			this.url(`/expense_reports/${expenseReportId}`),
		);
	}

	create(params: ExpenseReportCreateParams) {
		return this.fetch<ExpenseReport>(this.url("/expense_reports"), {
			method: "POST",
			body: params,
		});
	}
}
