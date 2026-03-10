import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClient = {
	companyId: 42,
	bankAccounts: {
		list: vi.fn(),
		balance: vi.fn(),
	},
	bankTransactions: {
		list: vi.fn(),
		listAll: vi.fn(),
		unimputed: vi.fn(),
		get: vi.fn(),
		labelSuggestions: vi.fn(),
		impute: vi.fn(),
	},
	labels: {
		list: vi.fn(),
		standard: vi.fn(),
	},
};

vi.mock("../../src/cli/config", () => ({
	createClient: () => mockClient,
	getCompanyId: () => 42,
}));

let stdoutData: string;
let stderrData: string;

beforeEach(() => {
	stdoutData = "";
	stderrData = "";

	for (const resource of Object.values(mockClient)) {
		for (const method of Object.values(resource)) {
			if (typeof method === "function") {
				(method as ReturnType<typeof vi.fn>).mockReset();
			}
		}
	}

	vi.spyOn(process.stdout, "write").mockImplementation(
		(chunk: string | Uint8Array) => {
			stdoutData += String(chunk);
			return true;
		},
	);
	vi.spyOn(process.stderr, "write").mockImplementation(
		(chunk: string | Uint8Array) => {
			stderrData += String(chunk);
			return true;
		},
	);
	vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
});

const parseStdout = () => JSON.parse(stdoutData.trim());

const runSubCommand = async (
	subName: string,
	args: Record<string, unknown>,
) => {
	const { bankCommand } = await import("../../src/cli/commands/bank");
	const cmd = (bankCommand.subCommands as Record<string, any>)?.[subName];
	await cmd.run?.({ args, rawArgs: [], cmd });
};

describe("bank balance", () => {
	it("calls bankAccounts.balance and outputs result", async () => {
		mockClient.bankAccounts.balance.mockResolvedValue([
			{ name: "Compte Pro", balance_amount: 12345.67 },
		]);

		await runSubCommand("balance", { format: "json" });

		expect(mockClient.bankAccounts.balance).toHaveBeenCalled();
		expect(parseStdout()[0].name).toBe("Compte Pro");
	});

	it("outputs error on failure", async () => {
		mockClient.bankAccounts.balance.mockRejectedValue(
			new Error("Unauthorized"),
		);

		await runSubCommand("balance", { format: "json" });

		const err = JSON.parse(stderrData.trim());
		expect(err.error).toBe("Unauthorized");
	});
});

describe("bank accounts", () => {
	it("calls bankAccounts.list with enabled filter", async () => {
		mockClient.bankAccounts.list.mockResolvedValue([
			{ id: 1, name: "Compte Courant" },
		]);

		await runSubCommand("accounts", { format: "json", enabled: true });

		expect(mockClient.bankAccounts.list).toHaveBeenCalledWith(true);
		expect(parseStdout()[0].name).toBe("Compte Courant");
	});

	it("passes enabled=false when requested", async () => {
		mockClient.bankAccounts.list.mockResolvedValue([]);

		await runSubCommand("accounts", { format: "json", enabled: false });

		expect(mockClient.bankAccounts.list).toHaveBeenCalledWith(false);
	});
});

describe("bank transactions", () => {
	it("calls list with filters", async () => {
		mockClient.bankTransactions.list.mockResolvedValue([]);

		await runSubCommand("transactions", {
			format: "json",
			"bank-account": "5",
			"hide-refused": true,
			sort: "date:desc",
			page: "2",
			"page-size": "50",
			from: "2026-01-01",
			to: "2026-06-30",
			search: "restaurant",
			all: false,
		});

		expect(mockClient.bankTransactions.list).toHaveBeenCalledWith({
			bank_account: 5,
			hide_refused: true,
			sorts: "date:desc",
			from: "2026-01-01",
			to: "2026-06-30",
			search: "restaurant",
			page: 2,
			pageSize: 50,
		});
	});

	it("calls listAll when --all is true", async () => {
		mockClient.bankTransactions.listAll.mockResolvedValue([{ id: 1 }]);

		await runSubCommand("transactions", {
			format: "json",
			"hide-refused": false,
			page: "1",
			"page-size": "100",
			all: true,
		});

		expect(mockClient.bankTransactions.listAll).toHaveBeenCalled();
		expect(mockClient.bankTransactions.list).not.toHaveBeenCalled();
	});

	it("handles undefined bank-account gracefully", async () => {
		mockClient.bankTransactions.list.mockResolvedValue([]);

		await runSubCommand("transactions", {
			format: "json",
			"hide-refused": false,
			page: "1",
			"page-size": "100",
			all: false,
		});

		expect(mockClient.bankTransactions.list).toHaveBeenCalledWith(
			expect.objectContaining({ bank_account: undefined }),
		);
	});
});

describe("bank unimputed", () => {
	it("calls unimputed and outputs result", async () => {
		mockClient.bankTransactions.unimputed.mockResolvedValue([
			{ id: 1, wording: "AMAZON", amount: -49.99 },
		]);

		await runSubCommand("unimputed", { format: "json" });

		expect(mockClient.bankTransactions.unimputed).toHaveBeenCalled();
		expect(parseStdout()[0].wording).toBe("AMAZON");
	});
});

describe("bank impute", () => {
	it("imputes transaction with label from suggestions", async () => {
		mockClient.bankTransactions.get.mockResolvedValue({
			id: 100,
			wording: "RESTAURANT",
			amount: -25,
			currency: "EUR",
		});
		mockClient.bankTransactions.labelSuggestions.mockResolvedValue([
			{
				id: 50,
				label: "restaurant",
				name: "restaurant",
				acronym: "RE",
				color: "#000",
				client: null,
			},
		]);
		mockClient.bankTransactions.impute.mockResolvedValue({ id: 100 });

		await runSubCommand("impute", {
			id: "100",
			"label-id": "50",
			format: "json",
			"dry-run": false,
		});

		expect(mockClient.bankTransactions.impute).toHaveBeenCalledWith(
			100,
			expect.arrayContaining([
				expect.objectContaining({
					label: expect.objectContaining({ id: 50, disabled: false }),
					amount: -25,
				}),
			]),
		);
	});

	it("falls back to labels.list when suggestion not found", async () => {
		mockClient.bankTransactions.get.mockResolvedValue({
			id: 100,
			wording: "TEST",
			amount: -10,
			currency: "EUR",
		});
		mockClient.bankTransactions.labelSuggestions.mockResolvedValue([]);
		mockClient.labels.list.mockResolvedValue([
			{ id: 77, name: "divers", color: "#ccc" },
		]);
		mockClient.labels.standard.mockResolvedValue([]);
		mockClient.bankTransactions.impute.mockResolvedValue({ id: 100 });

		await runSubCommand("impute", {
			id: "100",
			"label-id": "77",
			format: "json",
			"dry-run": false,
		});

		expect(mockClient.labels.list).toHaveBeenCalled();
		expect(mockClient.bankTransactions.impute).toHaveBeenCalled();
	});

	it("errors when label not found anywhere", async () => {
		mockClient.bankTransactions.get.mockResolvedValue({
			id: 100,
			wording: "TEST",
			amount: -10,
			currency: "EUR",
		});
		mockClient.bankTransactions.labelSuggestions.mockResolvedValue([]);
		mockClient.labels.list.mockResolvedValue([]);
		mockClient.labels.standard.mockResolvedValue([]);

		await runSubCommand("impute", {
			id: "100",
			"label-id": "999",
			format: "json",
			"dry-run": false,
		});

		const err = JSON.parse(stderrData.trim());
		expect(err.error).toContain("999");
		expect(err.error).toContain("introuvable");
	});

	it("dry-run outputs preview without calling impute", async () => {
		mockClient.bankTransactions.get.mockResolvedValue({
			id: 100,
			wording: "RESTAURANT",
			amount: -25,
			currency: "EUR",
		});
		mockClient.bankTransactions.labelSuggestions.mockResolvedValue([
			{
				id: 50,
				label: "restaurant",
				name: "restaurant",
				acronym: "RE",
				color: "#000",
				client: null,
			},
		]);

		await runSubCommand("impute", {
			id: "100",
			"label-id": "50",
			format: "json",
			"dry-run": true,
		});

		expect(mockClient.bankTransactions.impute).not.toHaveBeenCalled();
		const result = parseStdout();
		expect(result.dry_run).toBe(true);
		expect(result.transaction_id).toBe(100);
		expect(result.label_id).toBe(50);
	});
});
