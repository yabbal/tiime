import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSaveConfig = vi.fn();
const mockClient = {
	companyId: 42,
	listCompanies: vi.fn(),
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
	saveConfig: (...args: unknown[]) => mockSaveConfig(...args),
}));

let stdoutData: string;
let stderrData: string;

beforeEach(() => {
	stdoutData = "";
	stderrData = "";

	mockClient.listCompanies.mockReset();
	mockClient.company.get.mockReset();
	mockClient.users.me.mockReset();
	mockSaveConfig.mockReset();

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
	const { companyCommand } = await import("../../src/cli/commands/company");
	const cmd = (companyCommand.subCommands as Record<string, any>)?.[subName];
	await cmd.run?.({ args, rawArgs: [], cmd });
};

describe("company list", () => {
	it("calls listCompanies and maps fields", async () => {
		mockClient.listCompanies.mockResolvedValue([
			{
				id: 1,
				name: "Co A",
				legal_form: "SAS",
				siret: "123456789",
				city: "Paris",
				extra: "ignored",
			},
			{
				id: 2,
				name: "Co B",
				legal_form: "SARL",
				siret: "987654321",
				city: "Lyon",
			},
		]);

		await runSubCommand("list", { format: "json" });

		expect(mockClient.listCompanies).toHaveBeenCalled();
		const result = parseStdout();
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			id: 1,
			name: "Co A",
			legal_form: "SAS",
			siret: "123456789",
			city: "Paris",
		});
		expect(result[0].extra).toBeUndefined();
	});

	it("outputs error on failure", async () => {
		mockClient.listCompanies.mockRejectedValue(new Error("Unauthorized"));

		await runSubCommand("list", { format: "json" });

		const err = JSON.parse(stderrData.trim());
		expect(err.error).toBe("Unauthorized");
	});
});

describe("company get", () => {
	it("calls company.get and outputs result", async () => {
		mockClient.company.get.mockResolvedValue({
			id: 42,
			name: "Ma Boite",
			siret: "111222333",
		});

		await runSubCommand("get", {});

		expect(mockClient.company.get).toHaveBeenCalled();
		expect(parseStdout().name).toBe("Ma Boite");
	});
});

describe("company use", () => {
	it("saves companyId to config", async () => {
		await runSubCommand("use", { id: "99" });

		expect(mockSaveConfig).toHaveBeenCalledWith(
			expect.objectContaining({ companyId: 99 }),
		);
		const result = parseStdout();
		expect(result.status).toBe("ok");
		expect(result.companyId).toBe(99);
	});
});

describe("company me", () => {
	it("calls users.me and outputs result", async () => {
		mockClient.users.me.mockResolvedValue({
			id: 50272,
			email: "user@test.com",
			active_company: { id: 42 },
		});

		await runSubCommand("me", {});

		expect(mockClient.users.me).toHaveBeenCalled();
		expect(parseStdout().email).toBe("user@test.com");
	});

	it("outputs error on failure", async () => {
		mockClient.users.me.mockRejectedValue(new Error("Token expired"));

		await runSubCommand("me", {});

		const err = JSON.parse(stderrData.trim());
		expect(err.error).toBe("Token expired");
	});
});
