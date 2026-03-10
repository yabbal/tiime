import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClient = {
	companyId: 42,
	bankAccounts: {
		list: vi.fn(),
	},
	invoices: {
		list: vi.fn(),
	},
	bankTransactions: {
		unimputed: vi.fn(),
	},
	clients: {
		list: vi.fn(),
	},
	quotations: {
		list: vi.fn(),
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
		if (typeof resource === "object" && resource !== null) {
			for (const method of Object.values(resource)) {
				if (typeof method === "function") {
					(method as ReturnType<typeof vi.fn>).mockReset();
				}
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
	vi.spyOn(console, "error").mockImplementation(() => {});
});

const parseStdout = () => JSON.parse(stdoutData.trim());

describe("status command", () => {
	const setupMocks = (overrides?: {
		accounts?: unknown[];
		draftInvoices?: unknown[];
		unpaidInvoices?: unknown[];
		unimputed?: unknown[];
		clients?: unknown[];
		quotations?: unknown[];
	}) => {
		mockClient.bankAccounts.list.mockResolvedValue(
			overrides?.accounts ?? [
				{ name: "Compte Pro", balance_amount: 5000, balance_currency: "EUR" },
			],
		);
		mockClient.invoices.list
			.mockResolvedValueOnce(overrides?.draftInvoices ?? [{ id: 1 }])
			.mockResolvedValueOnce(
				overrides?.unpaidInvoices ?? [{ id: 2 }, { id: 3 }],
			);
		mockClient.bankTransactions.unimputed.mockResolvedValue(
			overrides?.unimputed ?? [],
		);
		mockClient.clients.list.mockResolvedValue(
			overrides?.clients ?? [{ id: 10 }],
		);
		mockClient.quotations.list.mockResolvedValue(overrides?.quotations ?? []);
	};

	it("aggregates data from all resources", async () => {
		setupMocks();

		const { statusCommand } = await import("../../src/cli/commands/status");
		await statusCommand.run?.({
			args: { format: "json", _: [] },
			rawArgs: [],
			cmd: statusCommand,
		});

		const result = parseStdout();
		expect(result.company_id).toBe(42);
		expect(result.bank_accounts).toHaveLength(1);
		expect(result.bank_accounts[0].name).toBe("Compte Pro");
		expect(result.invoices.drafts).toBe(1);
		expect(result.invoices.unpaid).toBe(2);
		expect(result.total_clients).toBe(1);
		expect(result.unimputed_transactions).toBe(0);
	});

	it("filters pending quotations (excludes accepted/declined)", async () => {
		setupMocks({
			quotations: [
				{ id: 1, status: "sent" },
				{ id: 2, status: "accepted" },
				{ id: 3, status: "declined" },
				{ id: 4, status: "draft" },
			],
		});

		const { statusCommand } = await import("../../src/cli/commands/status");
		await statusCommand.run?.({
			args: { format: "json", _: [] },
			rawArgs: [],
			cmd: statusCommand,
		});

		const result = parseStdout();
		expect(result.pending_quotations).toBe(2); // sent + draft
	});

	it("counts unimputed transactions", async () => {
		setupMocks({
			unimputed: [{ id: 1 }, { id: 2 }, { id: 3 }],
		});

		const { statusCommand } = await import("../../src/cli/commands/status");
		await statusCommand.run?.({
			args: { format: "json", _: [] },
			rawArgs: [],
			cmd: statusCommand,
		});

		expect(parseStdout().unimputed_transactions).toBe(3);
	});

	it("outputs error on failure", async () => {
		mockClient.bankAccounts.list.mockRejectedValue(
			new Error("Connection refused"),
		);
		// Promise.all will reject immediately
		mockClient.invoices.list.mockResolvedValue([]);
		mockClient.bankTransactions.unimputed.mockResolvedValue([]);
		mockClient.clients.list.mockResolvedValue([]);
		mockClient.quotations.list.mockResolvedValue([]);

		const { statusCommand } = await import("../../src/cli/commands/status");
		await statusCommand.run?.({
			args: { format: "json", _: [] },
			rawArgs: [],
			cmd: statusCommand,
		});

		const err = JSON.parse(stderrData.trim());
		expect(err.error).toBe("Connection refused");
	});
});
