import type { $Fetch } from "ofetch";
import type {
	Quotation,
	QuotationCreateParams,
	QuotationSendParams,
} from "../types";

export class QuotationsResource {
	constructor(
		private fetch: $Fetch,
		private companyId: number,
	) {}

	list(expand = "invoices") {
		return this.fetch<Quotation[]>(`/companies/${this.companyId}/quotations`, {
			query: { expand },
			headers: { Range: "items=0-25" },
		});
	}

	get(quotationId: number) {
		return this.fetch<Quotation>(
			`/companies/${this.companyId}/quotations/${quotationId}`,
		);
	}

	create(params: QuotationCreateParams) {
		return this.fetch<Quotation>(`/companies/${this.companyId}/quotations`, {
			method: "POST",
			body: params,
		});
	}

	async downloadPdf(quotationId: number): Promise<ArrayBuffer> {
		return this.fetch(
			`/companies/${this.companyId}/quotations/${quotationId}/pdf`,
			{
				headers: { Accept: "application/pdf" },
			},
		) as Promise<ArrayBuffer>;
	}

	send(quotationId: number, params: QuotationSendParams) {
		return this.fetch<void>(
			`/companies/${this.companyId}/quotations/${quotationId}/send`,
			{
				method: "POST",
				body: params,
			},
		);
	}
}
