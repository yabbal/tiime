import { BankAccountsResource } from "../../src/sdk/resources/bank-accounts";
import { BankTransactionsResource } from "../../src/sdk/resources/bank-transactions";

describe("BankAccountsResource", () => {
	const mockFetch = vi.fn();
	const resource = new BankAccountsResource(mockFetch as any, 123);

	beforeEach(() => mockFetch.mockReset());

	it("list() calls correct endpoint with no filter", async () => {
		mockFetch.mockResolvedValue([]);
		await resource.list();
		expect(mockFetch).toHaveBeenCalledWith(
			"/companies/123/bank_accounts",
			{ query: undefined },
		);
	});

	it("list(true) passes enabled filter", async () => {
		mockFetch.mockResolvedValue([]);
		await resource.list(true);
		expect(mockFetch).toHaveBeenCalledWith(
			"/companies/123/bank_accounts",
			{ query: { enabled: true } },
		);
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
		expect(mockFetch).toHaveBeenCalledWith(
			"/companies/123/bank_accounts",
			{ query: { enabled: true } },
		);
	});

	it("get() calls correct endpoint", async () => {
		mockFetch.mockResolvedValue({ id: 42 });
		await resource.get(42);
		expect(mockFetch).toHaveBeenCalledWith(
			"/companies/123/bank_accounts/42",
		);
	});
});

describe("BankTransactionsResource", () => {
	const mockFetch = vi.fn();
	const resource = new BankTransactionsResource(mockFetch as any, 123);

	beforeEach(() => mockFetch.mockReset());

	it("list() calls correct endpoint with default pagination", async () => {
		mockFetch.mockResolvedValue({ transactions: [], metadata: {} });
		await resource.list();
		expect(mockFetch).toHaveBeenCalledWith(
			"/companies/123/bank_transactions",
			{
				query: { hide_refused: false },
				headers: {
					Accept: "application/vnd.tiime.bank_transactions.v2+json,application/vnd.tiime.bank_transactions.without_documents+json",
					Range: "items=0-100",
				},
			},
		);
	});

	it("list() passes date filters as transaction_date_start/end", async () => {
		mockFetch.mockResolvedValue({ transactions: [], metadata: {} });
		await resource.list({ from: "2025-01-01", to: "2025-12-31" });
		expect(mockFetch).toHaveBeenCalledWith(
			"/companies/123/bank_transactions",
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
			"/companies/123/bank_transactions",
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
			"/companies/123/bank_transactions/unimputed",
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
});
