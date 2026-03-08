import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExpenseReportsResource } from "../../src/sdk/resources/expense-reports";

const COMPANY_ID = 42;

describe("ExpenseReportsResource", () => {
	const mockFetch = vi.fn();
	let resource: ExpenseReportsResource;

	beforeEach(() => {
		mockFetch.mockReset();
		resource = new ExpenseReportsResource(mockFetch as never, COMPANY_ID);
	});

	describe("list()", () => {
		it("should call correct endpoint with default sorts", async () => {
			mockFetch.mockResolvedValueOnce([]);
			await resource.list();
			expect(mockFetch).toHaveBeenCalledWith(
				`/companies/${COMPANY_ID}/expense_reports`,
				{
					query: { expand: "total_amount", sorts: "metadata.date:desc" },
					headers: { Range: "items=0-25" },
				},
			);
		});

		it("should use provided sorts", async () => {
			mockFetch.mockResolvedValueOnce([]);
			await resource.list("created_at:asc");
			expect(mockFetch).toHaveBeenCalledWith(
				`/companies/${COMPANY_ID}/expense_reports`,
				{
					query: { expand: "total_amount", sorts: "created_at:asc" },
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
				`/companies/${COMPANY_ID}/expense_reports/42`,
			);
		});
	});

	describe("create()", () => {
		it("should POST to correct endpoint with body", async () => {
			const params = { name: "Mars 2026" };
			mockFetch.mockResolvedValueOnce({});
			await resource.create(params as never);
			expect(mockFetch).toHaveBeenCalledWith(
				`/companies/${COMPANY_ID}/expense_reports`,
				{
					method: "POST",
					body: params,
				},
			);
		});
	});
});
