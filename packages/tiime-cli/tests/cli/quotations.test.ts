import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClient = {
	companyId: 42,
	quotations: {
		list: vi.fn(),
		get: vi.fn(),
		create: vi.fn(),
		downloadPdf: vi.fn(),
		send: vi.fn(),
	},
};

vi.mock("../../src/cli/config", () => ({
	createClient: () => mockClient,
	getCompanyId: () => 42,
}));

vi.mock("node:fs", () => ({
	writeFileSync: vi.fn(),
}));

import { writeFileSync } from "node:fs";

let stdoutData: string;
let stderrData: string;

beforeEach(() => {
	stdoutData = "";
	stderrData = "";

	for (const method of Object.values(mockClient.quotations)) {
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
	const { quotationsCommand } = await import(
		"../../src/cli/commands/quotations"
	);
	const cmd = (quotationsCommand.subCommands as Record<string, any>)?.[subName];
	await cmd.run?.({ args, rawArgs: [], cmd });
};

describe("quotations list", () => {
	it("calls quotations.list and outputs result", async () => {
		mockClient.quotations.list.mockResolvedValue([
			{ id: 1, status: "draft" },
			{ id: 2, status: "sent" },
		]);

		await runSubCommand("list", { format: "json" });

		expect(mockClient.quotations.list).toHaveBeenCalled();
		expect(parseStdout()).toHaveLength(2);
	});

	it("outputs error on failure", async () => {
		mockClient.quotations.list.mockRejectedValue(new Error("Network error"));

		await runSubCommand("list", { format: "json" });

		const err = JSON.parse(stderrData.trim());
		expect(err.error).toBe("Network error");
	});
});

describe("quotations get", () => {
	it("calls quotations.get with parsed id", async () => {
		mockClient.quotations.get.mockResolvedValue({
			id: 5,
			status: "sent",
		});

		await runSubCommand("get", { id: "5" });

		expect(mockClient.quotations.get).toHaveBeenCalledWith(5);
		expect(parseStdout().status).toBe("sent");
	});
});

describe("quotations create", () => {
	it("creates quotation with required fields", async () => {
		mockClient.quotations.create.mockResolvedValue({
			id: 10,
			status: "draft",
		});

		await runSubCommand("create", {
			description: "Prestation dev",
			"unit-price": "500",
			quantity: "10",
			vat: "normal",
			status: "draft",
		});

		expect(mockClient.quotations.create).toHaveBeenCalledWith(
			expect.objectContaining({
				status: "draft",
				lines: [
					expect.objectContaining({
						description: "Prestation dev",
						quantity: 10,
						unit_amount: 500,
						vat_type: { code: "normal" },
					}),
				],
			}),
		);
	});

	it("sets client when --client-id is provided", async () => {
		mockClient.quotations.create.mockResolvedValue({ id: 11 });

		await runSubCommand("create", {
			description: "Dev",
			"unit-price": "100",
			quantity: "1",
			vat: "normal",
			status: "draft",
			"client-id": "88",
		});

		const call = mockClient.quotations.create.mock.calls[0][0];
		expect(call.client).toEqual({ id: 88 });
	});

	it("errors when missing required args", async () => {
		await runSubCommand("create", {
			vat: "normal",
			status: "draft",
			quantity: "1",
		});

		const err = JSON.parse(stderrData.trim());
		expect(err.error).toContain("--description");
		expect(err.error).toContain("--unit-price");
		expect(mockClient.quotations.create).not.toHaveBeenCalled();
	});
});

describe("quotations pdf", () => {
	it("downloads PDF and writes to default path", async () => {
		const fakeBuffer = new ArrayBuffer(8);
		mockClient.quotations.downloadPdf.mockResolvedValue(fakeBuffer);

		await runSubCommand("pdf", { id: "7" });

		expect(mockClient.quotations.downloadPdf).toHaveBeenCalledWith(7);
		expect(writeFileSync).toHaveBeenCalledWith(
			"devis-7.pdf",
			expect.any(Buffer),
		);
		expect(parseStdout().status).toBe("downloaded");
	});

	it("uses custom output path when provided", async () => {
		const fakeBuffer = new ArrayBuffer(8);
		mockClient.quotations.downloadPdf.mockResolvedValue(fakeBuffer);

		await runSubCommand("pdf", { id: "7", output: "/tmp/devis.pdf" });

		expect(writeFileSync).toHaveBeenCalledWith(
			"/tmp/devis.pdf",
			expect.any(Buffer),
		);
	});
});

describe("quotations send", () => {
	it("sends quotation by email", async () => {
		mockClient.quotations.send.mockResolvedValue(undefined);

		await runSubCommand("send", {
			id: "15",
			email: "client@test.com",
			subject: "Votre devis",
			message: "Bonjour",
		});

		expect(mockClient.quotations.send).toHaveBeenCalledWith(15, {
			recipients: [{ email: "client@test.com" }],
			subject: "Votre devis",
			message: "Bonjour",
		});

		const result = parseStdout();
		expect(result.status).toBe("sent");
		expect(result.email).toBe("client@test.com");
		expect(result.id).toBe(15);
	});
});
