import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	autoImputeForCompany,
	resolveCompanyIds,
} from "../../src/cli/auto-impute";
import type { TiimeClient } from "tiime-sdk";

const makeTx = (id: number, wording: string, amount: number) => ({
	id,
	wording,
	amount,
	currency: "EUR",
});

const makeSuggestion = (id: number, name: string) => ({
	id,
	label: name,
	name,
	acronym: name.slice(0, 2).toUpperCase(),
	color: "#000",
	client: null,
});

const mockClient = (overrides: {
	unimputed?: unknown[];
	suggestions?: Record<number, unknown[]>;
	imputeResult?: unknown;
	imputeError?: boolean;
}) => {
	const client = {
		bankTransactions: {
			unimputed: vi.fn().mockResolvedValue(overrides.unimputed ?? []),
			labelSuggestions: vi.fn().mockImplementation((txId: number) => {
				return Promise.resolve(overrides.suggestions?.[txId] ?? []);
			}),
			impute: overrides.imputeError
				? vi.fn().mockRejectedValue(new Error("API error"))
				: vi.fn().mockResolvedValue(overrides.imputeResult ?? {}),
		},
	} as unknown as TiimeClient;
	return client;
};

describe("autoImputeForCompany", () => {
	it("returns empty array when no unimputed transactions", async () => {
		const client = mockClient({ unimputed: [] });
		const result = await autoImputeForCompany(client, 1, "Test Co", {
			apply: false,
		});
		expect(result).toEqual([]);
	});

	it("returns 'skipped' when transaction has no suggestions", async () => {
		const client = mockClient({
			unimputed: [makeTx(10, "UNKNOWN MERCHANT", -50)],
			suggestions: { 10: [] },
		});

		const result = await autoImputeForCompany(client, 1, "Test Co", {
			apply: false,
		});

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			company_id: 1,
			company_name: "Test Co",
			transaction_id: 10,
			wording: "UNKNOWN MERCHANT",
			amount: -50,
			suggested_label_id: 0,
			suggested_label_name: "(aucune suggestion)",
			status: "skipped",
		});
	});

	it("returns 'proposed' in dry-run mode with first suggestion", async () => {
		const client = mockClient({
			unimputed: [makeTx(20, "RESTAURANT LE BON", -25.5)],
			suggestions: {
				20: [makeSuggestion(100, "restaurant"), makeSuggestion(200, "bar")],
			},
		});

		const result = await autoImputeForCompany(client, 1, "Test Co", {
			apply: false,
		});

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			transaction_id: 20,
			suggested_label_id: 100,
			suggested_label_name: "restaurant",
			status: "proposed",
		});
		expect(client.bankTransactions.impute).not.toHaveBeenCalled();
	});

	it("calls impute and returns 'applied' when apply=true", async () => {
		const client = mockClient({
			unimputed: [makeTx(30, "AMAZON", -99.99)],
			suggestions: { 30: [makeSuggestion(300, "ACHAT DE SERVICES")] },
			imputeResult: { id: 30 },
		});

		const result = await autoImputeForCompany(client, 1, "Test Co", {
			apply: true,
		});

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			transaction_id: 30,
			suggested_label_id: 300,
			status: "applied",
		});
		expect(client.bankTransactions.impute).toHaveBeenCalledWith(
			30,
			expect.arrayContaining([
				expect.objectContaining({
					label: expect.objectContaining({ id: 300, disabled: false }),
					amount: -99.99,
					documents: [],
					accountant_detail_requests: [],
				}),
			]),
		);
	});

	it("returns 'error' when impute fails", async () => {
		const client = mockClient({
			unimputed: [makeTx(40, "FAILED TX", -10)],
			suggestions: { 40: [makeSuggestion(400, "divers")] },
			imputeError: true,
		});

		const result = await autoImputeForCompany(client, 1, "Test Co", {
			apply: true,
		});

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			transaction_id: 40,
			status: "error",
			suggested_label_id: 400,
		});
	});

	it("processes multiple transactions with mixed results", async () => {
		const client = mockClient({
			unimputed: [
				makeTx(1, "TX WITH SUGGESTION", -10),
				makeTx(2, "TX NO SUGGESTION", -20),
				makeTx(3, "TX ANOTHER", -30),
			],
			suggestions: {
				1: [makeSuggestion(101, "label1")],
				2: [],
				3: [makeSuggestion(103, "label3")],
			},
		});

		const result = await autoImputeForCompany(client, 5, "Multi Co", {
			apply: false,
		});

		expect(result).toHaveLength(3);
		expect(result[0].status).toBe("proposed");
		expect(result[1].status).toBe("skipped");
		expect(result[2].status).toBe("proposed");
		expect(result.every((p) => p.company_id === 5)).toBe(true);
		expect(result.every((p) => p.company_name === "Multi Co")).toBe(true);
	});

	it("uses label fallback when name is null", async () => {
		const suggestion = {
			id: 500,
			label: "fallback-label",
			name: null as unknown as string,
			acronym: "FL",
			color: "#fff",
			client: null,
		};
		const client = mockClient({
			unimputed: [makeTx(50, "SOME TX", -5)],
			suggestions: { 50: [suggestion] },
		});

		const result = await autoImputeForCompany(client, 1, "Co", {
			apply: false,
		});

		expect(result[0].suggested_label_name).toBe("fallback-label");
	});
});

describe("resolveCompanyIds", () => {
	const companies = [
		{ id: 100, name: "Alpha Corp" },
		{ id: 200, name: "Beta Inc" },
		{ id: 300, name: "Gamma SAS" },
	];

	it("resolves numeric strings to numbers", () => {
		expect(resolveCompanyIds(["100", "200"], companies)).toEqual([100, 200]);
	});

	it("resolves names case-insensitively", () => {
		expect(resolveCompanyIds(["alpha corp"], companies)).toEqual([100]);
		expect(resolveCompanyIds(["BETA INC"], companies)).toEqual([200]);
	});

	it("resolves mixed numeric and name inputs", () => {
		expect(resolveCompanyIds(["100", "Beta Inc"], companies)).toEqual([
			100, 200,
		]);
	});

	it("throws for unknown company name", () => {
		expect(() => resolveCompanyIds(["Unknown Co"], companies)).toThrow(
			'Entreprise introuvable : "Unknown Co"',
		);
	});

	it("handles empty array", () => {
		expect(resolveCompanyIds([], companies)).toEqual([]);
	});
});
