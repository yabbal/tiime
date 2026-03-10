import { beforeEach, describe, expect, it, vi } from "vitest";
import { BankAccountsResource } from "../src/resources/bank-accounts";
import { BankTransactionsResource } from "../src/resources/bank-transactions";

describe("BankAccountsResource", () => {
	const mockFetch = vi.fn();
	const resource = new BankAccountsResource(mockFetch as never, 123);

	beforeEach(() => mockFetch.mockReset());

	it("list() calls correct endpoint with no filter", async () => {
		mockFetch.mockResolvedValue([]);
		await resource.list();
		expect(mockFetch).toHaveBeenCalledWith("companies/123/bank_accounts", {
			query: undefined,
		});
	});

	it("list(true) passes enabled filter", async () => {
		mockFetch.mockResolvedValue([]);
		await resource.list(true);
		expect(mockFetch).toHaveBeenCalledWith("companies/123/bank_accounts", {
			query: { enabled: true },
		});
	});

	it("balance() returns formatted balances from enabled accounts", async () => {
		mockFetch.mockResolvedValue([
			{
				name: "Compte Pro",
				balance_amount: 1000,
				balance_currency: "EUR",
			},
		]);
		const result = await resource.balance();
		expect(result).toEqual([
			{ name: "Compte Pro", balance_amount: 1000, currency: "EUR" },
		]);
		// balance() should call list(true)
		expect(mockFetch).toHaveBeenCalledWith("companies/123/bank_accounts", {
			query: { enabled: true },
		});
	});

	it("get() calls correct endpoint", async () => {
		mockFetch.mockResolvedValue({ id: 42 });
		await resource.get(42);
		expect(mockFetch).toHaveBeenCalledWith("companies/123/bank_accounts/42");
	});
});

describe("BankTransactionsResource", () => {
	const mockFetch = vi.fn();
	const resource = new BankTransactionsResource(mockFetch as never, 123);

	beforeEach(() => mockFetch.mockReset());

	it("list() calls correct endpoint with default pagination", async () => {
		mockFetch.mockResolvedValue({ transactions: [], metadata: {} });
		await resource.list();
		expect(mockFetch).toHaveBeenCalledWith("companies/123/bank_transactions", {
			query: { hide_refused: false },
			headers: {
				Accept: "application/vnd.tiime.bank_transactions.v2+json",
				Range: "items=0-100",
			},
		});
	});

	it("list() passes date filters as transaction_date_start/end", async () => {
		mockFetch.mockResolvedValue({ transactions: [], metadata: {} });
		await resource.list({ from: "2025-01-01", to: "2025-12-31" });
		expect(mockFetch).toHaveBeenCalledWith(
			"companies/123/bank_transactions",
			expect.objectContaining({
				query: expect.objectContaining({
					hide_refused: false,
					transaction_date_start: "2025-01-01",
					transaction_date_end: "2025-12-31",
				}),
			}),
		);
	});

	it("list() passes search filter as wording", async () => {
		mockFetch.mockResolvedValue({ transactions: [], metadata: {} });
		await resource.list({ search: "amazon" });
		expect(mockFetch).toHaveBeenCalledWith(
			"companies/123/bank_transactions",
			expect.objectContaining({
				query: expect.objectContaining({
					hide_refused: false,
					wording: "amazon",
				}),
			}),
		);
	});

	it("unimputed() calls correct endpoint", async () => {
		mockFetch.mockResolvedValue([]);
		await resource.unimputed();
		expect(mockFetch).toHaveBeenCalledWith(
			"companies/123/bank_transactions/unimputed",
		);
	});

	it("listAll() paginates through all results", async () => {
		mockFetch
			.mockResolvedValueOnce({
				transactions: Array(200).fill({ id: 1 }),
				metadata: {},
			})
			.mockResolvedValueOnce({
				transactions: [{ id: 2 }],
				metadata: {},
			});
		const result = await resource.listAll();
		expect(result).toHaveLength(201);
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it("get() calls correct endpoint", async () => {
		mockFetch.mockResolvedValue({ id: 555 });
		await resource.get(555);
		expect(mockFetch).toHaveBeenCalledWith(
			"companies/123/bank_transactions/555",
		);
	});

	it("labelSuggestions() calls correct endpoint with custom Accept header", async () => {
		mockFetch.mockResolvedValue([]);
		await resource.labelSuggestions(555);
		expect(mockFetch).toHaveBeenCalledWith(
			"companies/123/bank_transactions/555/label_suggestions",
			{
				headers: {
					Accept:
						"application/vnd.tiime.bank_transactions.label_suggestions.v2+json",
				},
			},
		);
	});

	it("matchDocuments() sends PUT with document ids", async () => {
		mockFetch.mockResolvedValue([]);
		await resource.matchDocuments(555, [10, 20]);
		expect(mockFetch).toHaveBeenCalledWith(
			"companies/123/bank_transactions/555/document_matchings",
			{
				method: "PUT",
				body: { documents: [{ id: 10 }, { id: 20 }] },
			},
		);
	});

	it("getMatchings() calls correct endpoint", async () => {
		mockFetch.mockResolvedValue({ matchings: [] });
		await resource.getMatchings(555);
		expect(mockFetch).toHaveBeenCalledWith(
			"companies/123/bank_transactions/555/matchings",
		);
	});

	it("impute() sends PATCH with imputations body", async () => {
		const imputations = [
			{
				label: {
					id: 100,
					label: "restaurant",
					name: "restaurant",
					acronym: "RE",
					color: "#ff0000",
					client: null,
					disabled: false,
				},
				amount: -15.5,
				documents: [],
				accountant_detail_requests: [],
			},
		];

		mockFetch.mockResolvedValue({ id: 555 });
		await resource.impute(555, imputations);
		expect(mockFetch).toHaveBeenCalledWith(
			"companies/123/bank_transactions/555",
			{
				method: "PATCH",
				body: { imputations },
			},
		);
	});
});
