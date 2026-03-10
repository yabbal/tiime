import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClient = {
	companyId: 42,
	expenseReports: {
		list: vi.fn(),
		get: vi.fn(),
		create: vi.fn(),
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

	for (const method of Object.values(mockClient.expenseReports)) {
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
	const { expensesCommand } = await import("../../src/cli/commands/expenses");
	const cmd = (expensesCommand.subCommands as Record<string, any>)?.[subName];
	await cmd.run?.({ args, rawArgs: [], cmd });
};

describe("expenses list", () => {
	it("calls expenseReports.list with sort param", async () => {
		mockClient.expenseReports.list.mockResolvedValue([
			{ id: 1, name: "Déplacement" },
		]);

		await runSubCommand("list", {
			format: "json",
			sort: "metadata.date:desc",
		});

		expect(mockClient.expenseReports.list).toHaveBeenCalledWith(
			"metadata.date:desc",
		);
		expect(parseStdout()[0].name).toBe("Déplacement");
	});

	it("outputs error on failure", async () => {
		mockClient.expenseReports.list.mockRejectedValue(new Error("Server error"));

		await runSubCommand("list", {
			format: "json",
			sort: "metadata.date:desc",
		});

		const err = JSON.parse(stderrData.trim());
		expect(err.error).toBe("Server error");
	});
});

describe("expenses get", () => {
	it("calls expenseReports.get with parsed id", async () => {
		mockClient.expenseReports.get.mockResolvedValue({
			id: 5,
			name: "Frais mars",
			status: "pending",
		});

		await runSubCommand("get", { id: "5" });

		expect(mockClient.expenseReports.get).toHaveBeenCalledWith(5);
		expect(parseStdout().name).toBe("Frais mars");
	});

	it("outputs error when not found", async () => {
		mockClient.expenseReports.get.mockRejectedValue(new Error("Not found"));

		await runSubCommand("get", { id: "999" });

		const err = JSON.parse(stderrData.trim());
		expect(err.error).toBe("Not found");
	});
});

describe("expenses create", () => {
	it("creates expense with name and date", async () => {
		mockClient.expenseReports.create.mockResolvedValue({
			id: 10,
			name: "Déplacement mars",
		});

		await runSubCommand("create", {
			name: "Déplacement mars",
			date: "2026-03-15",
		});

		expect(mockClient.expenseReports.create).toHaveBeenCalledWith({
			name: "Déplacement mars",
			metadata: { date: "2026-03-15" },
		});
		expect(parseStdout().id).toBe(10);
	});

	it("creates expense without date", async () => {
		mockClient.expenseReports.create.mockResolvedValue({
			id: 11,
			name: "Simple",
		});

		await runSubCommand("create", { name: "Simple" });

		expect(mockClient.expenseReports.create).toHaveBeenCalledWith({
			name: "Simple",
			metadata: undefined,
		});
	});
});
