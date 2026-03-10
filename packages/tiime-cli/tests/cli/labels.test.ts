import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClient = {
	companyId: 42,
	labels: {
		list: vi.fn(),
		standard: vi.fn(),
		tags: vi.fn(),
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

	for (const method of Object.values(mockClient.labels)) {
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
	const { labelsCommand } = await import("../../src/cli/commands/labels");
	const cmd = (labelsCommand.subCommands as Record<string, any>)?.[subName];
	await cmd.run?.({ args, rawArgs: [], cmd });
};

describe("labels list", () => {
	it("calls labels.list and outputs result", async () => {
		mockClient.labels.list.mockResolvedValue([
			{ id: 1, name: "Restaurant" },
			{ id: 2, name: "Transport" },
		]);

		await runSubCommand("list", { format: "json" });

		expect(mockClient.labels.list).toHaveBeenCalled();
		const result = parseStdout();
		expect(result).toHaveLength(2);
		expect(result[0].name).toBe("Restaurant");
	});

	it("outputs error on failure", async () => {
		mockClient.labels.list.mockRejectedValue(new Error("API error"));

		await runSubCommand("list", { format: "json" });

		const err = JSON.parse(stderrData.trim());
		expect(err.error).toBe("API error");
	});
});

describe("labels standard", () => {
	it("calls labels.standard and outputs result", async () => {
		mockClient.labels.standard.mockResolvedValue([{ id: 10, name: "Achats" }]);

		await runSubCommand("standard", { format: "json" });

		expect(mockClient.labels.standard).toHaveBeenCalled();
		expect(parseStdout()[0].name).toBe("Achats");
	});
});

describe("labels tags", () => {
	it("calls labels.tags and outputs result", async () => {
		mockClient.labels.tags.mockResolvedValue([
			{ id: 100, name: "Pro" },
			{ id: 101, name: "Perso" },
		]);

		await runSubCommand("tags", { format: "json" });

		expect(mockClient.labels.tags).toHaveBeenCalled();
		expect(parseStdout()).toHaveLength(2);
	});

	it("outputs error on failure", async () => {
		mockClient.labels.tags.mockRejectedValue(new Error("Unauthorized"));

		await runSubCommand("tags", { format: "json" });

		const err = JSON.parse(stderrData.trim());
		expect(err.error).toBe("Unauthorized");
	});
});
