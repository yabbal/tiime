import { Resource } from "../resource";
import type {
	Quotation,
	QuotationCreateParams,
	QuotationSendParams,
} from "../types";

export class QuotationsResource extends Resource {
	list(expand = "invoices") {
		return this.fetch<Quotation[]>(this.url("/quotations"), {
			query: { expand },
			headers: { Range: "items=0-25" },
		});
	}

	get(quotationId: number) {
		return this.fetch<Quotation>(this.url(`/quotations/${quotationId}`));
	}

	create(params: QuotationCreateParams) {
		const body = {
			...params,
			lines: params.lines?.map((line) => ({ ...line })),
		};

		for (const line of body.lines ?? []) {
			line.line_amount = line.quantity * line.unit_amount;
			line.sequence ??= 1;
			line.invoicing_category_type ??= "benefit";
			line.discount_description ??= "";
			line.discount_amount ??= null;
			line.discount_percentage ??= null;
		}

		return this.fetch<Quotation>(this.url("/quotations"), {
			method: "POST",
			body,
		});
	}

	async downloadPdf(quotationId: number): Promise<ArrayBuffer> {
		return this.fetch(this.url(`/quotations/${quotationId}/pdf`), {
			headers: { Accept: "application/pdf" },
		}) as Promise<ArrayBuffer>;
	}

	send(quotationId: number, params: QuotationSendParams) {
		return this.fetch<void>(this.url(`/quotations/${quotationId}/send`), {
			method: "POST",
			body: params,
		});
	}
}
