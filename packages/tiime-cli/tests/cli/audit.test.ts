import type { TiimeClient } from "tiime-sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auditForCompany, emptyReport } from "../../src/cli/audit";

const makeTx = (
	id: number,
	wording: string,
	amount: number,
	extra?: Record<string, unknown>,
) => ({
	id,
	wording,
	amount,
	currency: "EUR",
	transaction_date: "2026-01-15",
	operation_type: "debit",
	imputations: [],
	count_documents: 0,
	count_invoices: 0,
	...extra,
});

const makeSuggestion = (id: number, name: string) => ({
	id,
	label: name,
	name,
	acronym: name.slice(0, 2).toUpperCase(),
	color: "#000",
	client: null,
});

const createMockClient = (overrides: {
	unimputed?: unknown[];
	suggestions?: Record<number, unknown[]>;
	allTransactions?: unknown[];
	imputeError?: boolean;
	accountingPeriod?: { start_date: string; end_date: string };
	accountingPeriodError?: boolean;
	getTx?: Record<number, unknown>;
}) => {
	const client = {
		bankTransactions: {
			unimputed: vi.fn().mockResolvedValue(overrides.unimputed ?? []),
			labelSuggestions: vi
				.fn()
				.mockImplementation((txId: number) =>
					Promise.resolve(overrides.suggestions?.[txId] ?? []),
				),
			impute: overrides.imputeError
				? vi.fn().mockRejectedValue(new Error("API error"))
				: vi.fn().mockResolvedValue({}),
			get: vi
				.fn()
				.mockImplementation((txId: number) =>
					Promise.resolve(
						overrides.getTx?.[txId] ?? makeTx(txId, "fetched", -10),
					),
				),
			listAll: vi.fn().mockResolvedValue(overrides.allTransactions ?? []),
		},
		company: {
			accountingPeriod: overrides.accountingPeriodError
				? vi.fn().mockRejectedValue(new Error("no period"))
				: vi.fn().mockResolvedValue(
						overrides.accountingPeriod ?? {
							start_date: "2026-01-01",
							end_date: "2026-12-31",
						},
					),
		},
	} as unknown as TiimeClient;
	return client;
};

// Suppress console.error logs from audit.ts
beforeEach(() => {
	vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("auditForCompany", () => {
	it("returns empty report when no unimputed transactions", async () => {
		const client = createMockClient({ unimputed: [] });
		const report = await auditForCompany(client, 1, "Test Co", {
			apply: false,
		});

		expect(report.company_id).toBe(1);
		expect(report.company_name).toBe("Test Co");
		expect(report.error).toBeNull();
		expect(report.unimputed_transactions).toEqual([]);
		expect(report.summary.total_unimputed).toBe(0);
	});

	it("reports unimputed transactions with suggestions", async () => {
		const client = createMockClient({
			unimputed: [makeTx(10, "RESTAURANT", -25)],
			suggestions: { 10: [makeSuggestion(100, "restaurant")] },
		});

		const report = await auditForCompany(client, 1, "Co", { apply: false });

		expect(report.unimputed_transactions).toHaveLength(1);
		expect(report.unimputed_transactions[0]).toMatchObject({
			transaction_id: 10,
			wording: "RESTAURANT",
			amount: -25,
			suggested_label_id: 100,
			suggested_label_name: "restaurant",
		});
		expect(report.summary.with_suggestions).toBe(1);
		expect(report.summary.without_suggestions).toBe(0);
	});

	it("reports transactions without suggestions", async () => {
		const client = createMockClient({
			unimputed: [makeTx(20, "UNKNOWN", -50)],
			suggestions: { 20: [] },
		});

		const report = await auditForCompany(client, 1, "Co", { apply: false });

		expect(report.unimputed_transactions[0]).toMatchObject({
			suggested_label_id: null,
			suggested_label_name: null,
		});
		expect(report.summary.without_suggestions).toBe(1);
	});

	it("applies imputations when apply=true", async () => {
		const client = createMockClient({
			unimputed: [makeTx(30, "AMAZON", -99)],
			suggestions: { 30: [makeSuggestion(300, "achats")] },
		});

		const report = await auditForCompany(client, 1, "Co", { apply: true });

		expect(client.bankTransactions.impute).toHaveBeenCalledWith(
			30,
			expect.arrayContaining([
				expect.objectContaining({
					label: expect.objectContaining({ id: 300, disabled: false }),
					amount: -99,
				}),
			]),
		);
		expect(report.applied_imputations).toHaveLength(1);
		expect(report.applied_imputations[0].status).toBe("applied");
		expect(report.summary.applied_count).toBe(1);
	});

	it("records error when imputation fails", async () => {
		const client = createMockClient({
			unimputed: [makeTx(40, "FAIL TX", -10)],
			suggestions: { 40: [makeSuggestion(400, "divers")] },
			imputeError: true,
		});

		const report = await auditForCompany(client, 1, "Co", { apply: true });

		expect(report.applied_imputations).toHaveLength(1);
		expect(report.applied_imputations[0].status).toBe("error");
	});

	it("fetches full tx details when unimputed returns minimal data", async () => {
		const client = createMockClient({
			unimputed: [{ id: 50 }], // minimal — no wording
			suggestions: { 50: [] },
			getTx: {
				50: makeTx(50, "FETCHED WORDING", -15),
			},
		});

		const report = await auditForCompany(client, 1, "Co", { apply: false });

		expect(client.bankTransactions.get).toHaveBeenCalledWith(50);
		expect(report.unimputed_transactions[0].wording).toBe("FETCHED WORDING");
	});

	it("detects missing documents on imputed transactions", async () => {
		const imputedTx = makeTx(60, "IMPUTED", -100, {
			imputations: [
				{
					label: { name: "restaurant", label: "restaurant" },
					amount: -100,
				},
			],
			count_documents: 0,
			count_invoices: 0,
		});

		const client = createMockClient({
			unimputed: [],
			allTransactions: [imputedTx],
		});

		const report = await auditForCompany(client, 1, "Co", { apply: false });

		expect(report.missing_documents).toHaveLength(1);
		expect(report.missing_documents[0]).toMatchObject({
			transaction_id: 60,
			label_name: "restaurant",
		});
		expect(report.summary.total_missing_documents).toBe(1);
		expect(report.summary.total_missing_documents_amount).toBe(100);
	});

	it("skips recently applied transactions from missing documents", async () => {
		const client = createMockClient({
			unimputed: [makeTx(70, "TO APPLY", -50)],
			suggestions: { 70: [makeSuggestion(700, "divers")] },
			allTransactions: [
				makeTx(70, "TO APPLY", -50, {
					imputations: [
						{
							label: { name: "divers", label: "divers" },
							amount: -50,
						},
					],
					count_documents: 0,
					count_invoices: 0,
				}),
			],
		});

		const report = await auditForCompany(client, 1, "Co", { apply: true });

		expect(report.missing_documents).toHaveLength(0);
	});

	it("falls back to current year when accounting period fails", async () => {
		const client = createMockClient({
			unimputed: [],
			accountingPeriodError: true,
		});

		const report = await auditForCompany(client, 1, "Co", { apply: false });

		expect(report.error).toBeNull();
		const callArgs = (
			client.bankTransactions.listAll as ReturnType<typeof vi.fn>
		).mock.calls[0][0];
		const now = new Date();
		expect(callArgs).toMatchObject({
			from: `${now.getFullYear()}-01-01`,
			to: now.toISOString().slice(0, 10),
		});
	});

	it("computes total_unimputed_amount correctly", async () => {
		const client = createMockClient({
			unimputed: [makeTx(1, "TX1", -30), makeTx(2, "TX2", 50)],
			suggestions: { 1: [], 2: [] },
		});

		const report = await auditForCompany(client, 1, "Co", { apply: false });

		expect(report.summary.total_unimputed_amount).toBe(80); // abs(-30) + abs(50)
	});
});

describe("emptyReport", () => {
	it("returns a report with all zeros and error message", () => {
		const report = emptyReport(999, "Error Co", "Connection failed");

		expect(report).toEqual({
			company_id: 999,
			company_name: "Error Co",
			error: "Connection failed",
			unimputed_transactions: [],
			missing_documents: [],
			applied_imputations: [],
			summary: {
				total_unimputed: 0,
				total_unimputed_amount: 0,
				with_suggestions: 0,
				without_suggestions: 0,
				total_missing_documents: 0,
				total_missing_documents_amount: 0,
				applied_count: 0,
			},
		});
	});
});
