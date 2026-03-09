import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integration tests: CLI commands → SDK client → output
 * Mocks the config module to inject a fake TiimeClient.
 * Verifies that commands call the right SDK methods and produce correct stdout.
 */

// Mock config to inject our fake client
const mockClient = {
	companyId: 42,
	listCompanies: vi.fn(),
	invoices: {
		list: vi.fn(),
		listAll: vi.fn(),
		get: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		send: vi.fn(),
		downloadPdf: vi.fn(),
		delete: vi.fn(),
		duplicate: vi.fn(),
	},
	clients: {
		list: vi.fn(),
		get: vi.fn(),
		create: vi.fn(),
		search: vi.fn(),
	},
	bankAccounts: {
		list: vi.fn(),
		balance: vi.fn(),
		get: vi.fn(),
	},
	bankTransactions: {
		list: vi.fn(),
		listAll: vi.fn(),
		unimputed: vi.fn(),
		get: vi.fn(),
		labelSuggestions: vi.fn(),
		impute: vi.fn(),
	},
	documents: {
		list: vi.fn(),
		categories: vi.fn(),
		download: vi.fn(),
		upload: vi.fn(),
	},
	expenseReports: {
		list: vi.fn(),
		get: vi.fn(),
		create: vi.fn(),
	},
	labels: {
		list: vi.fn(),
		standard: vi.fn(),
		tags: vi.fn(),
	},
	quotations: {
		list: vi.fn(),
	},
	company: {
		get: vi.fn(),
	},
	users: {
		me: vi.fn(),
	},
};

vi.mock("../../src/cli/config", () => ({
	createClient: () => mockClient,
	getCompanyId: () => 42,
	loadConfig: () => ({ companyId: 42 }),
	saveConfig: vi.fn(),
	createTokenManager: () => ({
		isAuthenticated: vi.fn(() => true),
		getTokenInfo: vi.fn(() => ({
			email: "test@test.com",
			expiresAt: new Date("2026-12-31"),
		})),
		login: vi.fn(),
		logout: vi.fn(),
	}),
}));

// Capture stdout and prevent process.exit
let stdoutData: string;
let stderrData: string;

beforeEach(() => {
	stdoutData = "";
	stderrData = "";

	// Reset all mock functions
	for (const resource of Object.values(mockClient)) {
		if (typeof resource === "function") {
			(resource as ReturnType<typeof vi.fn>).mockReset();
		} else if (typeof resource === "object" && resource !== null) {
			for (const method of Object.values(resource)) {
				if (typeof method === "function") {
					(method as ReturnType<typeof vi.fn>).mockReset();
				}
			}
		}
	}

	vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
		stdoutData += String(chunk);
		return true;
	});
	vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
		stderrData += String(chunk);
		return true;
	});
	vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
});

const parseStdout = () => JSON.parse(stdoutData.trim());

describe("invoices commands", () => {
	it("list calls client.invoices.list and outputs JSON", async () => {
		const fakeInvoices = [
			{ id: 1, compiled_number: "F-001", status: "draft" },
			{ id: 2, compiled_number: "F-002", status: "sent" },
		];
		mockClient.invoices.list.mockResolvedValue(fakeInvoices);

		const { invoicesCommand } = await import("../../src/cli/commands/invoices");
		const listCmd = invoicesCommand.subCommands?.list;
		await listCmd.run?.({
			args: {
				format: "json",
				sort: "invoice_number:desc",
				page: "1",
				"page-size": "25",
				all: false,
			},
			rawArgs: [],
			cmd: listCmd,
		});

		expect(mockClient.invoices.list).toHaveBeenCalledWith({
			sorts: "invoice_number:desc",
			status: undefined,
			page: 1,
			pageSize: 25,
		});
		const output = parseStdout();
		expect(output).toHaveLength(2);
		expect(output[0].compiled_number).toBe("F-001");
	});

	it("list --all calls listAll", async () => {
		mockClient.invoices.listAll.mockResolvedValue([]);

		const { invoicesCommand } = await import("../../src/cli/commands/invoices");
		const listCmd = invoicesCommand.subCommands?.list;
		await listCmd.run?.({
			args: {
				format: "json",
				sort: "invoice_number:desc",
				page: "1",
				"page-size": "25",
				all: true,
				status: "draft",
			},
			rawArgs: [],
			cmd: listCmd,
		});

		expect(mockClient.invoices.listAll).toHaveBeenCalledWith({
			sorts: "invoice_number:desc",
			status: "draft",
		});
	});

	it("get calls client.invoices.get with correct id", async () => {
		mockClient.invoices.get.mockResolvedValue({
			id: 99,
			compiled_number: "F-099",
		});

		const { invoicesCommand } = await import("../../src/cli/commands/invoices");
		const getCmd = invoicesCommand.subCommands?.get;
		await getCmd.run?.({
			args: { id: "99" },
			rawArgs: [],
			cmd: getCmd,
		});

		expect(mockClient.invoices.get).toHaveBeenCalledWith(99);
		const output = parseStdout();
		expect(output.id).toBe(99);
	});

	it("delete calls client.invoices.delete and outputs status", async () => {
		mockClient.invoices.delete.mockResolvedValue(undefined);

		const { invoicesCommand } = await import("../../src/cli/commands/invoices");
		const deleteCmd = invoicesCommand.subCommands?.delete;
		await deleteCmd.run?.({
			args: { id: "55" },
			rawArgs: [],
			cmd: deleteCmd,
		});

		expect(mockClient.invoices.delete).toHaveBeenCalledWith(55);
		const output = parseStdout();
		expect(output.status).toBe("deleted");
		expect(output.id).toBe(55);
	});

	it("create --dry-run outputs payload without calling API", async () => {
		const { invoicesCommand } = await import("../../src/cli/commands/invoices");
		const createCmd = invoicesCommand.subCommands?.create;
		await createCmd.run?.({
			args: {
				description: "Dev",
				"unit-price": "500",
				quantity: "5",
				vat: "normal",
				"dry-run": true,
				format: "json",
				status: "draft",
			},
			rawArgs: [],
			cmd: createCmd,
		});

		expect(mockClient.invoices.create).not.toHaveBeenCalled();
		const output = parseStdout();
		expect(output.dry_run).toBe(true);
		expect(output.payload.lines[0].description).toBe("Dev");
		expect(output.payload.lines[0].unit_amount).toBe(500);
	});
});

describe("bank commands", () => {
	it("balance calls client.bankAccounts.balance", async () => {
		mockClient.bankAccounts.balance.mockResolvedValue([
			{ name: "Compte Pro", balance_amount: 5000, currency: "EUR" },
		]);

		const { bankCommand } = await import("../../src/cli/commands/bank");
		const balanceCmd = bankCommand.subCommands?.balance;
		await balanceCmd.run?.({
			args: { format: "json" },
			rawArgs: [],
			cmd: balanceCmd,
		});

		expect(mockClient.bankAccounts.balance).toHaveBeenCalled();
		const output = parseStdout();
		expect(output[0].name).toBe("Compte Pro");
	});

	it("unimputed calls client.bankTransactions.unimputed", async () => {
		mockClient.bankTransactions.unimputed.mockResolvedValue([
			{ id: 1, wording: "AMAZON", amount: -49.99 },
		]);

		const { bankCommand } = await import("../../src/cli/commands/bank");
		const unimputedCmd = bankCommand.subCommands?.unimputed;
		await unimputedCmd.run?.({
			args: { format: "json" },
			rawArgs: [],
			cmd: unimputedCmd,
		});

		expect(mockClient.bankTransactions.unimputed).toHaveBeenCalled();
		const output = parseStdout();
		expect(output[0].wording).toBe("AMAZON");
	});

	it("transactions passes date and search filters", async () => {
		mockClient.bankTransactions.list.mockResolvedValue({
			transactions: [],
			metadata: {},
		});

		const { bankCommand } = await import("../../src/cli/commands/bank");
		const txCmd = bankCommand.subCommands?.transactions;
		await txCmd.run?.({
			args: {
				format: "json",
				"hide-refused": false,
				page: "1",
				"page-size": "100",
				from: "2026-01-01",
				to: "2026-03-31",
				search: "amazon",
				all: false,
			},
			rawArgs: [],
			cmd: txCmd,
		});

		expect(mockClient.bankTransactions.list).toHaveBeenCalledWith(
			expect.objectContaining({
				from: "2026-01-01",
				to: "2026-03-31",
				search: "amazon",
				page: 1,
				pageSize: 100,
			}),
		);
	});

	it("transactions --all calls listAll", async () => {
		mockClient.bankTransactions.listAll.mockResolvedValue([]);

		const { bankCommand } = await import("../../src/cli/commands/bank");
		const txCmd = bankCommand.subCommands?.transactions;
		await txCmd.run?.({
			args: {
				format: "json",
				"hide-refused": false,
				page: "1",
				"page-size": "100",
				all: true,
			},
			rawArgs: [],
			cmd: txCmd,
		});

		expect(mockClient.bankTransactions.listAll).toHaveBeenCalled();
	});
});

describe("clients commands", () => {
	it("list calls client.clients.list", async () => {
		mockClient.clients.list.mockResolvedValue([{ id: 1, name: "Acme Corp" }]);

		const { clientsCommand } = await import("../../src/cli/commands/clients");
		const listCmd = clientsCommand.subCommands?.list;
		await listCmd.run?.({
			args: { format: "json", archived: false },
			rawArgs: [],
			cmd: listCmd,
		});

		expect(mockClient.clients.list).toHaveBeenCalledWith({ archived: false });
		const output = parseStdout();
		expect(output[0].name).toBe("Acme Corp");
	});

	it("get calls client.clients.get with correct id", async () => {
		mockClient.clients.get.mockResolvedValue({
			id: 10,
			name: "Test Client",
		});

		const { clientsCommand } = await import("../../src/cli/commands/clients");
		const getCmd = clientsCommand.subCommands?.get;
		await getCmd.run?.({
			args: { id: "10" },
			rawArgs: [],
			cmd: getCmd,
		});

		expect(mockClient.clients.get).toHaveBeenCalledWith(10);
	});

	it("create calls client.clients.create with mapped args", async () => {
		mockClient.clients.create.mockResolvedValue({ id: 99, name: "New Co" });

		const { clientsCommand } = await import("../../src/cli/commands/clients");
		const createCmd = clientsCommand.subCommands?.create;
		await createCmd.run?.({
			args: {
				name: "New Co",
				address: "1 rue Test",
				"postal-code": "75001",
				city: "Paris",
				email: "new@co.com",
				professional: true,
			},
			rawArgs: [],
			cmd: createCmd,
		});

		expect(mockClient.clients.create).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "New Co",
				address: "1 rue Test",
				postal_code: "75001",
				city: "Paris",
				email: "new@co.com",
				professional: true,
			}),
		);
	});
});

describe("company commands", () => {
	it("get calls client.company.get", async () => {
		mockClient.company.get.mockResolvedValue({
			id: 42,
			name: "Ma Boite",
		});

		const { companyCommand } = await import("../../src/cli/commands/company");
		const getCmd = companyCommand.subCommands?.get;
		await getCmd.run?.({
			args: {},
			rawArgs: [],
			cmd: getCmd,
		});

		expect(mockClient.company.get).toHaveBeenCalled();
		const output = parseStdout();
		expect(output.name).toBe("Ma Boite");
	});

	it("list calls listCompanies and maps fields", async () => {
		mockClient.listCompanies.mockResolvedValue([
			{
				id: 1,
				name: "Co A",
				legal_form: "SAS",
				siret: "123456789",
				city: "Paris",
				extra_field: "ignored",
			},
		]);

		const { companyCommand } = await import("../../src/cli/commands/company");
		const listCmd = companyCommand.subCommands?.list;
		await listCmd.run?.({
			args: { format: "json" },
			rawArgs: [],
			cmd: listCmd,
		});

		expect(mockClient.listCompanies).toHaveBeenCalled();
		const output = parseStdout();
		expect(output[0]).toEqual({
			id: 1,
			name: "Co A",
			legal_form: "SAS",
			siret: "123456789",
			city: "Paris",
		});
		// extra_field should be filtered out
		expect(output[0].extra_field).toBeUndefined();
	});
});

describe("documents commands", () => {
	it("list passes filters correctly", async () => {
		mockClient.documents.list.mockResolvedValue([]);

		const { documentsCommand } = await import(
			"../../src/cli/commands/documents"
		);
		const listCmd = documentsCommand.subCommands?.list;
		await listCmd.run?.({
			args: {
				format: "json",
				type: "receipt",
				source: "accountant",
				page: "2",
			},
			rawArgs: [],
			cmd: listCmd,
		});

		expect(mockClient.documents.list).toHaveBeenCalledWith({
			types: "receipt",
			source: "accountant",
			page: 2,
		});
	});

	it("categories calls client.documents.categories", async () => {
		mockClient.documents.categories.mockResolvedValue([
			{ id: 1, name: "Factures" },
		]);

		const { documentsCommand } = await import(
			"../../src/cli/commands/documents"
		);
		const catCmd = documentsCommand.subCommands?.categories;
		await catCmd.run?.({
			args: { format: "json" },
			rawArgs: [],
			cmd: catCmd,
		});

		expect(mockClient.documents.categories).toHaveBeenCalled();
	});
});

describe("labels commands", () => {
	it("list calls client.labels.list", async () => {
		mockClient.labels.list.mockResolvedValue([{ id: 1, name: "Restaurant" }]);

		const { labelsCommand } = await import("../../src/cli/commands/labels");
		const listCmd = labelsCommand.subCommands?.list;
		await listCmd.run?.({
			args: { format: "json" },
			rawArgs: [],
			cmd: listCmd,
		});

		expect(mockClient.labels.list).toHaveBeenCalled();
		const output = parseStdout();
		expect(output[0].name).toBe("Restaurant");
	});

	it("standard calls client.labels.standard", async () => {
		mockClient.labels.standard.mockResolvedValue([]);

		const { labelsCommand } = await import("../../src/cli/commands/labels");
		const stdCmd = labelsCommand.subCommands?.standard;
		await stdCmd.run?.({
			args: { format: "json" },
			rawArgs: [],
			cmd: stdCmd,
		});

		expect(mockClient.labels.standard).toHaveBeenCalled();
	});
});

describe("expenses commands", () => {
	it("list calls client.expenseReports.list with sort", async () => {
		mockClient.expenseReports.list.mockResolvedValue([]);

		const { expensesCommand } = await import("../../src/cli/commands/expenses");
		const listCmd = expensesCommand.subCommands?.list;
		await listCmd.run?.({
			args: { format: "json", sort: "metadata.date:desc" },
			rawArgs: [],
			cmd: listCmd,
		});

		expect(mockClient.expenseReports.list).toHaveBeenCalledWith(
			"metadata.date:desc",
		);
	});

	it("create calls client.expenseReports.create with params", async () => {
		mockClient.expenseReports.create.mockResolvedValue({ id: 1 });

		const { expensesCommand } = await import("../../src/cli/commands/expenses");
		const createCmd = expensesCommand.subCommands?.create;
		await createCmd.run?.({
			args: { name: "Déplacement mars", date: "2026-03-15" },
			rawArgs: [],
			cmd: createCmd,
		});

		expect(mockClient.expenseReports.create).toHaveBeenCalledWith({
			name: "Déplacement mars",
			metadata: { date: "2026-03-15" },
		});
	});
});

describe("auth commands", () => {
	it("status outputs authentication info", async () => {
		const { authCommand } = await import("../../src/cli/commands/auth");
		const statusCmd = authCommand.subCommands?.status;
		await statusCmd.run?.({
			args: {},
			rawArgs: [],
			cmd: statusCmd,
		});

		const output = parseStdout();
		expect(output.authenticated).toBe(true);
		expect(output.email).toBe("test@test.com");
	});

	it("logout calls tokenManager.logout", async () => {
		const { authCommand } = await import("../../src/cli/commands/auth");
		const logoutCmd = authCommand.subCommands?.logout;
		await logoutCmd.run?.({
			args: {},
			rawArgs: [],
			cmd: logoutCmd,
		});

		const output = parseStdout();
		expect(output.status).toBe("logged_out");
	});
});

describe("status command", () => {
	it("aggregates data from multiple resources", async () => {
		mockClient.bankAccounts.list.mockResolvedValue([
			{ name: "Compte Pro", balance_amount: 5000, balance_currency: "EUR" },
		]);
		mockClient.invoices.list
			.mockResolvedValueOnce([{ id: 1 }]) // drafts
			.mockResolvedValueOnce([{ id: 2 }, { id: 3 }]); // unpaid
		mockClient.bankTransactions.unimputed.mockResolvedValue([
			{ id: 10 },
			{ id: 11 },
		]);
		mockClient.clients.list.mockResolvedValue([{ id: 20 }]);
		mockClient.quotations.list.mockResolvedValue([
			{ id: 30, status: "sent" },
			{ id: 31, status: "accepted" },
		]);

		// Suppress console.error from outputColoredStatus
		vi.spyOn(console, "error").mockImplementation(() => {});

		const { statusCommand } = await import("../../src/cli/commands/status");
		await statusCommand.run?.({
			args: { format: "json" },
			rawArgs: [],
			cmd: statusCommand,
		});

		const output = parseStdout();
		expect(output.company_id).toBe(42);
		expect(output.bank_accounts).toHaveLength(1);
		expect(output.invoices.drafts).toBe(1);
		expect(output.invoices.unpaid).toBe(2);
		expect(output.unimputed_transactions).toBe(2);
		expect(output.total_clients).toBe(1);
		expect(output.pending_quotations).toBe(1); // only "sent", not "accepted"
	});
});

describe("error handling", () => {
	it("outputs TiimeError as JSON to stderr", async () => {
		const { TiimeError } = await import("tiime-sdk");
		mockClient.invoices.list.mockRejectedValue(
			new TiimeError("Not Found", 404, "/invoices", { detail: "gone" }),
		);

		const { invoicesCommand } = await import("../../src/cli/commands/invoices");
		const listCmd = invoicesCommand.subCommands?.list;
		await listCmd.run?.({
			args: {
				format: "json",
				sort: "invoice_number:desc",
				page: "1",
				"page-size": "25",
				all: false,
			},
			rawArgs: [],
			cmd: listCmd,
		});

		const errorOutput = JSON.parse(stderrData.trim());
		expect(errorOutput.error).toBe("TiimeError");
		expect(errorOutput.status).toBe(404);
		expect(errorOutput.endpoint).toBe("/invoices");
	});

	it("outputs generic errors as JSON to stderr", async () => {
		mockClient.clients.list.mockRejectedValue(new Error("Network fail"));

		const { clientsCommand } = await import("../../src/cli/commands/clients");
		const listCmd = clientsCommand.subCommands?.list;
		await listCmd.run?.({
			args: { format: "json", archived: false },
			rawArgs: [],
			cmd: listCmd,
		});

		const errorOutput = JSON.parse(stderrData.trim());
		expect(errorOutput.error).toBe("Network fail");
	});
});
