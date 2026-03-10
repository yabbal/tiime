import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClient = {
	companyId: 42,
	documents: {
		list: vi.fn(),
		categories: vi.fn(),
		upload: vi.fn(),
		download: vi.fn(),
	},
};

vi.mock("../../src/cli/config", () => ({
	createClient: () => mockClient,
	getCompanyId: () => 42,
}));

vi.mock("node:fs", () => ({
	readFileSync: vi.fn(() => Buffer.from("fake-content")),
	writeFileSync: vi.fn(),
}));

vi.mock("node:path", () => ({
	basename: vi.fn((p: string) => p.split("/").pop()),
}));

import { writeFileSync } from "node:fs";

let stdoutData: string;
let stderrData: string;

beforeEach(() => {
	stdoutData = "";
	stderrData = "";

	for (const method of Object.values(mockClient.documents)) {
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
	const { documentsCommand } = await import("../../src/cli/commands/documents");
	const cmd = (documentsCommand.subCommands as Record<string, any>)?.[subName];
	await cmd.run?.({ args, rawArgs: [], cmd });
};

describe("documents list", () => {
	it("calls documents.list with filters", async () => {
		mockClient.documents.list.mockResolvedValue([{ id: 1, type: "receipt" }]);

		await runSubCommand("list", {
			format: "json",
			type: "receipt",
			source: "accountant",
			page: "2",
		});

		expect(mockClient.documents.list).toHaveBeenCalledWith({
			types: "receipt",
			source: "accountant",
			page: 2,
		});
		expect(parseStdout()[0].type).toBe("receipt");
	});

	it("handles empty result", async () => {
		mockClient.documents.list.mockResolvedValue([]);

		await runSubCommand("list", {
			format: "json",
			page: "1",
		});

		expect(parseStdout()).toEqual([]);
	});

	it("outputs error on failure", async () => {
		mockClient.documents.list.mockRejectedValue(new Error("API error"));

		await runSubCommand("list", { format: "json", page: "1" });

		const err = JSON.parse(stderrData.trim());
		expect(err.error).toBe("API error");
	});
});

describe("documents categories", () => {
	it("calls documents.categories", async () => {
		mockClient.documents.categories.mockResolvedValue([
			{ id: 1, name: "Factures" },
			{ id: 2, name: "Relevés" },
		]);

		await runSubCommand("categories", { format: "json" });

		expect(mockClient.documents.categories).toHaveBeenCalled();
		expect(parseStdout()).toHaveLength(2);
	});
});

describe("documents upload", () => {
	it("uploads file with correct params", async () => {
		mockClient.documents.upload.mockResolvedValue({
			id: 10,
			filename: "receipt.pdf",
		});

		await runSubCommand("upload", {
			file: "/tmp/receipt.pdf",
			type: "receipt",
		});

		expect(mockClient.documents.upload).toHaveBeenCalledWith(
			expect.any(Buffer),
			"receipt.pdf",
			"receipt",
		);
		expect(parseStdout().id).toBe(10);
	});
});

describe("documents download", () => {
	it("downloads document and writes to default path", async () => {
		const fakeData = new ArrayBuffer(16);
		mockClient.documents.download.mockResolvedValue(fakeData);

		await runSubCommand("download", { id: "25" });

		expect(mockClient.documents.download).toHaveBeenCalledWith(25);
		expect(writeFileSync).toHaveBeenCalledWith(
			"document-25",
			expect.any(Buffer),
		);
		expect(parseStdout().status).toBe("downloaded");
	});

	it("uses custom output path", async () => {
		const fakeData = new ArrayBuffer(16);
		mockClient.documents.download.mockResolvedValue(fakeData);

		await runSubCommand("download", {
			id: "25",
			output: "/tmp/my-doc.pdf",
		});

		expect(writeFileSync).toHaveBeenCalledWith(
			"/tmp/my-doc.pdf",
			expect.any(Buffer),
		);
	});
});
