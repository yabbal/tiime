import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClient = {
	companyId: 42,
	clients: {
		list: vi.fn(),
		get: vi.fn(),
		create: vi.fn(),
		search: vi.fn(),
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

	for (const method of Object.values(mockClient.clients)) {
		(method as ReturnType<typeof vi.fn>).mockReset();
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
	const { clientsCommand } = await import("../../src/cli/commands/clients");
	const cmd = (clientsCommand.subCommands as Record<string, any>)?.[subName];
	await cmd.run?.({ args, rawArgs: [], cmd });
};

describe("clients list", () => {
	it("calls clients.list with archived=false", async () => {
		mockClient.clients.list.mockResolvedValue([{ id: 1, name: "Acme Corp" }]);

		await runSubCommand("list", { format: "json", archived: false });

		expect(mockClient.clients.list).toHaveBeenCalledWith({ archived: false });
		expect(parseStdout()[0].name).toBe("Acme Corp");
	});

	it("passes archived=true when requested", async () => {
		mockClient.clients.list.mockResolvedValue([]);

		await runSubCommand("list", { format: "json", archived: true });

		expect(mockClient.clients.list).toHaveBeenCalledWith({ archived: true });
	});

	it("outputs error on failure", async () => {
		mockClient.clients.list.mockRejectedValue(new Error("Forbidden"));

		await runSubCommand("list", { format: "json", archived: false });

		const err = JSON.parse(stderrData.trim());
		expect(err.error).toBe("Forbidden");
	});
});

describe("clients get", () => {
	it("calls clients.get with parsed id", async () => {
		mockClient.clients.get.mockResolvedValue({
			id: 10,
			name: "Test Client",
			email: "test@co.com",
		});

		await runSubCommand("get", { id: "10" });

		expect(mockClient.clients.get).toHaveBeenCalledWith(10);
		expect(parseStdout().name).toBe("Test Client");
	});
});

describe("clients create", () => {
	it("creates client with all fields", async () => {
		mockClient.clients.create.mockResolvedValue({ id: 99, name: "New Co" });

		await runSubCommand("create", {
			name: "New Co",
			address: "1 rue Test",
			"postal-code": "75001",
			city: "Paris",
			email: "new@co.com",
			phone: "0123456789",
			siret: "12345678901234",
			professional: true,
		});

		expect(mockClient.clients.create).toHaveBeenCalledWith({
			name: "New Co",
			address: "1 rue Test",
			postal_code: "75001",
			city: "Paris",
			email: "new@co.com",
			phone: "0123456789",
			siren_or_siret: "12345678901234",
			professional: true,
		});
		expect(parseStdout().id).toBe(99);
	});

	it("creates client with minimal fields", async () => {
		mockClient.clients.create.mockResolvedValue({ id: 100, name: "Simple" });

		await runSubCommand("create", {
			name: "Simple",
			professional: true,
		});

		expect(mockClient.clients.create).toHaveBeenCalledWith(
			expect.objectContaining({ name: "Simple" }),
		);
	});
});

describe("clients search", () => {
	it("searches clients by query", async () => {
		mockClient.clients.search.mockResolvedValue([{ id: 1, name: "Acme Corp" }]);

		await runSubCommand("search", { query: "acme", format: "json" });

		expect(mockClient.clients.search).toHaveBeenCalledWith("acme");
		expect(parseStdout()[0].name).toBe("Acme Corp");
	});

	it("returns empty array when no results", async () => {
		mockClient.clients.search.mockResolvedValue([]);

		await runSubCommand("search", { query: "xyz", format: "json" });

		expect(parseStdout()).toEqual([]);
	});
});
