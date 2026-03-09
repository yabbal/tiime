import type { $Fetch } from "ofetch";
import type { Invoice, InvoiceCreateParams, InvoiceSendParams } from "../types";

export interface InvoicesListParams {
	sorts?: string;
	status?: string;
	page?: number;
	pageSize?: number;
}

const DEFAULT_INVOICE_TEMPLATE: Partial<InvoiceCreateParams> = {
	template: "advanced",
	status: "draft",
	due_date_mode: "thirty_days",
	title_enabled: true,
	free_field_enabled: false,
	free_field: "",
	discount_enabled: false,
	bank_detail_enabled: true,
	payment_condition_enabled: true,
	payment_condition:
		"En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée, à laquelle s'ajoutera une indemnité forfaitaire pour frais de recouvrement de 40€.",
	text_lines: [],
};

export class InvoicesResource {
	constructor(
		private fetch: $Fetch,
		private companyId: number,
	) {}

	list(params?: InvoicesListParams) {
		const start = ((params?.page ?? 1) - 1) * (params?.pageSize ?? 25);
		const end = start + (params?.pageSize ?? 25);
		const query: Record<string, string> = {
			sorts: params?.sorts ?? "invoice_number:desc",
		};
		if (params?.status) query.status = params.status;

		return this.fetch<Invoice[]>(`/companies/${this.companyId}/invoices`, {
			query,
			headers: { Range: `items=${start}-${end}` },
		});
	}

	async listAll(params?: {
		sorts?: string;
		status?: string;
		pageSize?: number;
	}) {
		const pageSize = params?.pageSize ?? 100;
		const all: Invoice[] = [];
		let page = 1;
		let hasMore = true;

		while (hasMore) {
			const batch = await this.list({
				sorts: params?.sorts,
				status: params?.status,
				page,
				pageSize,
			});
			all.push(...batch);
			hasMore = batch.length === pageSize;
			page++;
		}

		return all;
	}

	get(invoiceId: number) {
		return this.fetch<Invoice>(
			`/companies/${this.companyId}/invoices/${invoiceId}`,
		);
	}

	create(params: InvoiceCreateParams) {
		const body = { ...DEFAULT_INVOICE_TEMPLATE, ...params };

		// Compute line amounts and totals
		for (const line of body.lines ?? []) {
			line.line_amount = line.quantity * line.unit_amount;
			line.sequence ??= 1;
			line.invoicing_category_type ??= "benefit";
			line.discount_description ??= "";
			line.discount_amount ??= null;
			line.discount_percentage ??= null;
		}

		return this.fetch<Invoice>(`/companies/${this.companyId}/invoices`, {
			method: "POST",
			body,
		});
	}

	update(invoiceId: number, params: Partial<InvoiceCreateParams>) {
		return this.fetch<Invoice>(
			`/companies/${this.companyId}/invoices/${invoiceId}`,
			{
				method: "PUT",
				body: params,
			},
		);
	}

	send(invoiceId: number, params: InvoiceSendParams) {
		return this.fetch<void>(
			`/companies/${this.companyId}/invoices/${invoiceId}/send`,
			{
				method: "POST",
				body: params,
			},
		);
	}

	async downloadPdf(invoiceId: number): Promise<ArrayBuffer> {
		return this.fetch(
			`/companies/${this.companyId}/invoices/${invoiceId}/pdf`,
			{
				headers: { Accept: "application/pdf" },
			},
		) as Promise<ArrayBuffer>;
	}

	delete(invoiceId: number) {
		return this.fetch<void>(
			`/companies/${this.companyId}/invoices/${invoiceId}`,
			{ method: "DELETE" },
		);
	}

	async duplicate(
		invoiceId: number,
		overrides?: { emission_date?: string; quantity?: number },
	) {
		const source = await this.get(invoiceId);
		const today = new Date().toISOString().split("T")[0];

		const lines = source.lines.map((l) => ({
			description: l.description,
			quantity: overrides?.quantity ?? l.quantity,
			unit_amount: l.unit_amount,
			vat_type: l.vat_type,
			invoicing_unit: l.invoicing_unit,
			invoicing_category_type: l.invoicing_category_type,
			article: l.article,
		}));

		return this.create({
			client: source.client_id ? { id: source.client_id } : null,
			emission_date: overrides?.emission_date ?? today,
			title: source.title,
			title_enabled: !!source.title,
			lines,
			status: "draft",
		});
	}
}
