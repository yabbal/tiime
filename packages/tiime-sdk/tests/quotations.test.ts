import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuotationsResource } from "../src/resources/quotations";
import type { QuotationCreateParams } from "../src/types";

const COMPANY_ID = 42;

describe("QuotationsResource", () => {
	const mockFetch = vi.fn();
	let resource: QuotationsResource;

	beforeEach(() => {
		mockFetch.mockReset();
		resource = new QuotationsResource(mockFetch as never, COMPANY_ID);
	});

	describe("list()", () => {
		it("should call correct endpoint with default expand", async () => {
			mockFetch.mockResolvedValueOnce([]);
			await resource.list();
			expect(mockFetch).toHaveBeenCalledWith(
				`companies/${COMPANY_ID}/quotations`,
				{
					query: { expand: "invoices" },
					headers: { Range: "items=0-25" },
				},
			);
		});

		it("should use provided expand", async () => {
			mockFetch.mockResolvedValueOnce([]);
			await resource.list("clients");
			expect(mockFetch).toHaveBeenCalledWith(
				`companies/${COMPANY_ID}/quotations`,
				{
					query: { expand: "clients" },
					headers: { Range: "items=0-25" },
				},
			);
		});
	});

	describe("get()", () => {
		it("should call correct endpoint", async () => {
			mockFetch.mockResolvedValueOnce({});
			await resource.get(42);
			expect(mockFetch).toHaveBeenCalledWith(
				`companies/${COMPANY_ID}/quotations/42`,
			);
		});
	});

	describe("create()", () => {
		it("should compute line_amount = quantity * unit_amount", async () => {
			mockFetch.mockResolvedValueOnce({});
			const params: QuotationCreateParams = {
				date: "2024-01-01",
				lines: [
					{
						description: "Dev",
						quantity: 3,
						unit_amount: 100,
						vat_type: { code: "20" },
					},
				],
			};

			await resource.create(params);

			const body = mockFetch.mock.calls[0][1].body;
			expect(body.lines[0].line_amount).toBe(300);
		});

		it("should apply default values for missing fields", async () => {
			mockFetch.mockResolvedValueOnce({});
			const params: QuotationCreateParams = {
				date: "2024-01-01",
				lines: [
					{
						description: "Dev",
						quantity: 1,
						unit_amount: 500,
						vat_type: { code: "20" },
					},
				],
			};

			await resource.create(params);

			const line = mockFetch.mock.calls[0][1].body.lines[0];
			expect(line.sequence).toBe(1);
			expect(line.invoicing_category_type).toBe("benefit");
			expect(line.discount_description).toBe("");
			expect(line.discount_amount).toBeNull();
			expect(line.discount_percentage).toBeNull();
		});

		it("should not override existing values", async () => {
			mockFetch.mockResolvedValueOnce({});
			const params: QuotationCreateParams = {
				date: "2024-01-01",
				lines: [
					{
						description: "Dev",
						quantity: 2,
						unit_amount: 200,
						vat_type: { code: "20" },
						sequence: 5,
						invoicing_category_type: "purchase",
					},
				],
			};

			await resource.create(params);

			const line = mockFetch.mock.calls[0][1].body.lines[0];
			expect(line.sequence).toBe(5);
			expect(line.invoicing_category_type).toBe("purchase");
		});

		it("should handle undefined lines without error", async () => {
			mockFetch.mockResolvedValueOnce({});
			// lines is optional at runtime even if typed — test the ?? [] guard
			const params: QuotationCreateParams = {
				date: "2024-01-01",
				lines: undefined as never,
			};

			await resource.create(params);

			expect(mockFetch).toHaveBeenCalledWith(
				`companies/${COMPANY_ID}/quotations`,
				expect.objectContaining({ method: "POST" }),
			);
		});

		it("should not mutate input params", async () => {
			mockFetch.mockResolvedValueOnce({});
			const line = {
				description: "Dev",
				quantity: 2,
				unit_amount: 150,
				vat_type: { code: "20" },
			};
			const params: QuotationCreateParams = {
				date: "2024-01-01",
				lines: [line],
			};

			await resource.create(params);

			// create() should NOT mutate the original line objects
			expect(line).not.toHaveProperty("line_amount");
			expect(line).not.toHaveProperty("sequence");
		});

		it("should POST to correct endpoint", async () => {
			mockFetch.mockResolvedValueOnce({});
			await resource.create({ date: "2024-01-01", lines: [] });

			expect(mockFetch).toHaveBeenCalledWith(
				`companies/${COMPANY_ID}/quotations`,
				expect.objectContaining({ method: "POST" }),
			);
		});
	});

	describe("downloadPdf()", () => {
		it("should call correct endpoint with Accept header", async () => {
			mockFetch.mockResolvedValueOnce(new ArrayBuffer(0));
			await resource.downloadPdf(42);
			expect(mockFetch).toHaveBeenCalledWith(
				`companies/${COMPANY_ID}/quotations/42/pdf`,
				{ headers: { Accept: "application/pdf" } },
			);
		});
	});

	describe("send()", () => {
		it("should POST to correct endpoint with body", async () => {
			mockFetch.mockResolvedValueOnce(undefined);
			await resource.send(42, {
				recipients: [{ email: "a@b.com" }],
			});
			expect(mockFetch).toHaveBeenCalledWith(
				`companies/${COMPANY_ID}/quotations/42/send`,
				{
					method: "POST",
					body: { recipients: [{ email: "a@b.com" }] },
				},
			);
		});
	});
});
