import { beforeEach, describe, expect, it, vi } from "vitest";
import { CompanyResource } from "../src/resources/company";

const COMPANY_ID = 42;

describe("CompanyResource", () => {
	const mockFetch = vi.fn();
	let resource: CompanyResource;

	beforeEach(() => {
		mockFetch.mockReset();
		resource = new CompanyResource(mockFetch as never, COMPANY_ID);
	});

	describe("get()", () => {
		it("should call correct endpoint", async () => {
			mockFetch.mockResolvedValueOnce({});
			await resource.get();
			expect(mockFetch).toHaveBeenCalledWith(`/companies/${COMPANY_ID}`);
		});
	});

	describe("users()", () => {
		it("should call correct endpoint", async () => {
			mockFetch.mockResolvedValueOnce([]);
			await resource.users();
			expect(mockFetch).toHaveBeenCalledWith(
				`/companies/${COMPANY_ID}/users`,
			);
		});
	});

	describe("appConfig()", () => {
		it("should call correct endpoint", async () => {
			mockFetch.mockResolvedValueOnce({});
			await resource.appConfig();
			expect(mockFetch).toHaveBeenCalledWith(
				`/companies/${COMPANY_ID}/app_config`,
			);
		});
	});

	describe("accountingPeriod()", () => {
		it("should use default range_year of 1", async () => {
			mockFetch.mockResolvedValueOnce({});
			await resource.accountingPeriod();
			expect(mockFetch).toHaveBeenCalledWith(
				`/companies/${COMPANY_ID}/accounting_period/current`,
				{ query: { range_year: 1 } },
			);
		});

		it("should use provided range_year", async () => {
			mockFetch.mockResolvedValueOnce({});
			await resource.accountingPeriod(3);
			expect(mockFetch).toHaveBeenCalledWith(
				`/companies/${COMPANY_ID}/accounting_period/current`,
				{ query: { range_year: 3 } },
			);
		});
	});

	describe("tiles()", () => {
		it("should join keys with comma", async () => {
			mockFetch.mockResolvedValueOnce([]);
			await resource.tiles(["revenue", "expenses"]);
			expect(mockFetch).toHaveBeenCalledWith(
				`/companies/${COMPANY_ID}/tiles`,
				{ query: { keys: "revenue,expenses" } },
			);
		});

		it("should handle empty keys array", async () => {
			mockFetch.mockResolvedValueOnce([]);
			await resource.tiles([]);
			expect(mockFetch).toHaveBeenCalledWith(
				`/companies/${COMPANY_ID}/tiles`,
				{ query: { keys: "" } },
			);
		});
	});

	describe("dashboardBlocks()", () => {
		it("should use default display_group and sorts", async () => {
			mockFetch.mockResolvedValueOnce([]);
			await resource.dashboardBlocks();
			expect(mockFetch).toHaveBeenCalledWith(
				`/companies/${COMPANY_ID}/dashboard_blocks`,
				{ query: { sorts: "rank:asc", display_group: "monitoring" } },
			);
		});

		it("should use provided display_group", async () => {
			mockFetch.mockResolvedValueOnce([]);
			await resource.dashboardBlocks("custom");
			expect(mockFetch).toHaveBeenCalledWith(
				`/companies/${COMPANY_ID}/dashboard_blocks`,
				{ query: { sorts: "rank:asc", display_group: "custom" } },
			);
		});
	});
});
