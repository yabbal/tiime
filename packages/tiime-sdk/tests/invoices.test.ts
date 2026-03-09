import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvoicesResource } from "../src/resources/invoices";
import type { Invoice, InvoiceCreateParams } from "../src/types";

const createMockFetch = () => vi.fn();

const COMPANY_ID = 42;

const makeFakeInvoice = (overrides?: Partial<Invoice>): Invoice => ({
	id: 1,
	client_id: 10,
	client_name: "Acme Corp",
	compiled_number: "F-2026-001",
	emission_date: "2026-03-01",
	number: 1,
	status: "draft",
	title: "Dev mars 2026",
	template: "advanced",
	total_excluding_taxes: 1000,
	total_including_taxes: 1200,
	due_date: "2026-03-31",
	lines: [
		{
			id: 1,
			description: "Développement",
			quantity: 5,
			unit_amount: 200,
			line_amount: 1000,
			vat_type: { code: "20" },
			invoicing_unit: null,
			invoicing_category_type: "benefit",
			article: null,
			sequence: 1,
		},
	],
	type: "invoice",
	color: "#000",
	tags: [],
	totals_per_vat_type: {},
	...overrides,
});

describe("InvoicesResource", () => {
	let mockFetch: ReturnType<typeof createMockFetch>;
	let invoices: InvoicesResource;

	beforeEach(() => {
		mockFetch = createMockFetch();
		invoices = new InvoicesResource(mockFetch as never, COMPANY_ID);
	});

	describe("list()", () => {
		it("should call the correct endpoint with default params", async () => {
			mockFetch.mockResolvedValueOnce([]);

			await invoices.list();

			expect(mockFetch).toHaveBeenCalledWith(
				`/companies/${COMPANY_ID}/invoices`,
				{
					query: { sorts: "invoice_number:desc" },
					headers: { Range: "items=0-25" },
				},
			);
		});

		it("should compute Range header from page and pageSize", async () => {
			mockFetch.mockResolvedValueOnce([]);

			await invoices.list({ page: 3, pageSize: 10 });

			expect(mockFetch).toHaveBeenCalledWith(
				`/companies/${COMPANY_ID}/invoices`,
				expect.objectContaining({
					headers: { Range: "items=20-30" },
				}),
			);
		});

		it("should include status in query when provided", async () => {
			mockFetch.mockResolvedValueOnce([]);

			await invoices.list({ status: "saved" });

			expect(mockFetch).toHaveBeenCalledWith(
				`/companies/${COMPANY_ID}/invoices`,
				expect.objectContaining({
					query: { sorts: "invoice_number:desc", status: "saved" },
				}),
			);
		});
	});

	describe("create()", () => {
		it("should merge DEFAULT_INVOICE_TEMPLATE with params", async () => {
			mockFetch.mockResolvedValueOnce(makeFakeInvoice());

			const params: InvoiceCreateParams = {
				emission_date: "2026-03-01",
				lines: [
					{
						description: "Prestation",
						quantity: 3,
						unit_amount: 500,
						vat_type: { code: "20" },
					},
				],
			};

			await invoices.create(params);

			const calledBody = mockFetch.mock.calls[0][1].body;

			// Template defaults should be present
			expect(calledBody.template).toBe("advanced");
			expect(calledBody.status).toBe("draft");
			expect(calledBody.due_date_mode).toBe("thirty_days");
			expect(calledBody.bank_detail_enabled).toBe(true);
			expect(calledBody.payment_condition_enabled).toBe(true);
		});

		it("should compute line_amount for each line", async () => {
			mockFetch.mockResolvedValueOnce(makeFakeInvoice());

			const params: InvoiceCreateParams = {
				emission_date: "2026-03-01",
				lines: [
					{
						description: "Dev",
						quantity: 4,
						unit_amount: 250,
						vat_type: { code: "20" },
					},
				],
			};

			await invoices.create(params);

			const calledBody = mockFetch.mock.calls[0][1].body;
			expect(calledBody.lines[0].line_amount).toBe(1000);
			expect(calledBody.lines[0].sequence).toBe(1);
			expect(calledBody.lines[0].invoicing_category_type).toBe("benefit");
		});

		it("should POST to the correct endpoint", async () => {
			mockFetch.mockResolvedValueOnce(makeFakeInvoice());

			await invoices.create({
				emission_date: "2026-03-01",
				lines: [],
			});

			expect(mockFetch).toHaveBeenCalledWith(
				`/companies/${COMPANY_ID}/invoices`,
				expect.objectContaining({ method: "POST" }),
			);
		});
	});

	describe("duplicate()", () => {
		it("should call get then create with the source invoice data", async () => {
			const source = makeFakeInvoice({
				id: 99,
				client_id: 10,
				title: "Mission A",
				lines: [
					{
						id: 1,
						description: "Consulting",
						quantity: 2,
						unit_amount: 300,
						line_amount: 600,
						vat_type: { code: "20" },
						invoicing_unit: null,
						invoicing_category_type: "benefit",
						article: null,
						sequence: 1,
					},
				],
			});

			// First call: get() returns the source
			mockFetch.mockResolvedValueOnce(source);
			// Second call: create() returns the new invoice
			mockFetch.mockResolvedValueOnce(makeFakeInvoice({ id: 100 }));

			await invoices.duplicate(99);

			// First call should be GET (no method specified = GET)
			expect(mockFetch.mock.calls[0][0]).toBe(
				`/companies/${COMPANY_ID}/invoices/99`,
			);

			// Second call should be POST (create)
			const createCall = mockFetch.mock.calls[1];
			expect(createCall[0]).toBe(`/companies/${COMPANY_ID}/invoices`);
			expect(createCall[1].method).toBe("POST");

			const createBody = createCall[1].body;
			expect(createBody.client).toEqual({ id: 10 });
			expect(createBody.title).toBe("Mission A");
			expect(createBody.lines[0].description).toBe("Consulting");
			expect(createBody.lines[0].quantity).toBe(2);
		});

		it("should apply quantity override when provided", async () => {
			const source = makeFakeInvoice();
			mockFetch.mockResolvedValueOnce(source);
			mockFetch.mockResolvedValueOnce(makeFakeInvoice({ id: 100 }));

			await invoices.duplicate(1, { quantity: 10 });

			const createBody = mockFetch.mock.calls[1][1].body;
			expect(createBody.lines[0].quantity).toBe(10);
		});

		it("should set client to null when source has no client_id", async () => {
			const source = makeFakeInvoice({ client_id: null });
			mockFetch.mockResolvedValueOnce(source);
			mockFetch.mockResolvedValueOnce(makeFakeInvoice({ id: 100 }));

			await invoices.duplicate(1);

			const createBody = mockFetch.mock.calls[1][1].body;
			expect(createBody.client).toBeNull();
		});
	});
});
