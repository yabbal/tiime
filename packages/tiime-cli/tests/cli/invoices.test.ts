import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClient = {
	companyId: 42,
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

	for (const method of Object.values(mockClient.invoices)) {
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
	const { invoicesCommand } = await import("../../src/cli/commands/invoices");
	const cmd = (invoicesCommand.subCommands as Record<string, any>)?.[subName];
	await cmd.run?.({ args, rawArgs: [], cmd });
};

describe("invoices list", () => {
	it("calls client.invoices.list with default params", async () => {
		mockClient.invoices.list.mockResolvedValue([]);

		await runSubCommand("list", {
			format: "json",
			sort: "invoice_number:desc",
			page: "1",
			"page-size": "25",
			all: false,
		});

		expect(mockClient.invoices.list).toHaveBeenCalledWith({
			sorts: "invoice_number:desc",
			status: undefined,
			page: 1,
			pageSize: 25,
		});
	});

	it("passes status filter when provided", async () => {
		mockClient.invoices.list.mockResolvedValue([]);

		await runSubCommand("list", {
			format: "json",
			sort: "invoice_number:desc",
			status: "paid",
			page: "1",
			"page-size": "25",
			all: false,
		});

		expect(mockClient.invoices.list).toHaveBeenCalledWith(
			expect.objectContaining({ status: "paid" }),
		);
	});

	it("calls listAll when --all is true", async () => {
		mockClient.invoices.listAll.mockResolvedValue([
			{ id: 1 },
			{ id: 2 },
			{ id: 3 },
		]);

		await runSubCommand("list", {
			format: "json",
			sort: "invoice_number:desc",
			status: "draft",
			page: "1",
			"page-size": "25",
			all: true,
		});

		expect(mockClient.invoices.listAll).toHaveBeenCalledWith({
			sorts: "invoice_number:desc",
			status: "draft",
		});
		expect(mockClient.invoices.list).not.toHaveBeenCalled();
		expect(parseStdout()).toHaveLength(3);
	});

	it("outputs error to stderr on failure", async () => {
		mockClient.invoices.list.mockRejectedValue(new Error("API down"));

		await runSubCommand("list", {
			format: "json",
			sort: "invoice_number:desc",
			page: "1",
			"page-size": "25",
			all: false,
		});

		const err = JSON.parse(stderrData.trim());
		expect(err.error).toBe("API down");
	});
});

describe("invoices get", () => {
	it("calls client.invoices.get with parsed id", async () => {
		mockClient.invoices.get.mockResolvedValue({
			id: 42,
			compiled_number: "F-042",
		});

		await runSubCommand("get", { id: "42" });

		expect(mockClient.invoices.get).toHaveBeenCalledWith(42);
		expect(parseStdout().compiled_number).toBe("F-042");
	});

	it("outputs error on failure", async () => {
		mockClient.invoices.get.mockRejectedValue(new Error("Not found"));

		await runSubCommand("get", { id: "999" });

		const err = JSON.parse(stderrData.trim());
		expect(err.error).toBe("Not found");
	});
});

describe("invoices create", () => {
	it("creates invoice with simple line", async () => {
		mockClient.invoices.create.mockResolvedValue({
			id: 1,
			status: "draft",
		});

		await runSubCommand("create", {
			description: "Développement",
			"unit-price": "500",
			quantity: "10",
			vat: "normal",
			status: "draft",
			"dry-run": false,
		});

		expect(mockClient.invoices.create).toHaveBeenCalledWith(
			expect.objectContaining({
				status: "draft",
				lines: [
					expect.objectContaining({
						description: "Développement",
						quantity: 10,
						unit_amount: 500,
						vat_type: { code: "normal" },
					}),
				],
			}),
		);
	});

	it("creates invoice with multi-lines JSON", async () => {
		mockClient.invoices.create.mockResolvedValue({ id: 2 });

		const lines = JSON.stringify([
			{ description: "Dev", quantity: 5, unit_price: 500 },
			{ description: "Design", quantity: 2, unit_price: 300, vat: "reduced" },
		]);

		await runSubCommand("create", {
			lines,
			vat: "normal",
			status: "draft",
			"dry-run": false,
		});

		const call = mockClient.invoices.create.mock.calls[0][0];
		expect(call.lines).toHaveLength(2);
		expect(call.lines[0].description).toBe("Dev");
		expect(call.lines[1].vat_type.code).toBe("reduced");
	});

	it("outputs dry-run payload without calling API", async () => {
		await runSubCommand("create", {
			description: "Test",
			"unit-price": "100",
			quantity: "1",
			vat: "normal",
			status: "draft",
			"dry-run": true,
		});

		expect(mockClient.invoices.create).not.toHaveBeenCalled();
		const result = parseStdout();
		expect(result.dry_run).toBe(true);
		expect(result.payload.lines[0].description).toBe("Test");
	});

	it("errors when missing required args for simple line", async () => {
		await runSubCommand("create", {
			vat: "normal",
			status: "draft",
			"dry-run": false,
		});

		const err = JSON.parse(stderrData.trim());
		expect(err.error).toContain("--description");
		expect(err.error).toContain("--unit-price");
	});

	it("sets client when --client-id is provided", async () => {
		mockClient.invoices.create.mockResolvedValue({ id: 3 });

		await runSubCommand("create", {
			description: "Dev",
			"unit-price": "100",
			quantity: "1",
			vat: "normal",
			status: "draft",
			"client-id": "55",
			"dry-run": false,
		});

		const call = mockClient.invoices.create.mock.calls[0][0];
		expect(call.client).toEqual({ id: 55 });
	});

	it("sets client_name when --client-name is provided", async () => {
		mockClient.invoices.create.mockResolvedValue({ id: 4 });

		await runSubCommand("create", {
			description: "Dev",
			"unit-price": "100",
			quantity: "1",
			vat: "normal",
			status: "draft",
			"client-name": "Acme Corp",
			"dry-run": false,
		});

		const call = mockClient.invoices.create.mock.calls[0][0];
		expect(call.client_name).toBe("Acme Corp");
	});

	it("enables free-field when provided", async () => {
		mockClient.invoices.create.mockResolvedValue({ id: 5 });

		await runSubCommand("create", {
			description: "Dev",
			"unit-price": "100",
			quantity: "1",
			vat: "normal",
			status: "draft",
			"free-field": "REF-2026",
			"dry-run": false,
		});

		const call = mockClient.invoices.create.mock.calls[0][0];
		expect(call.free_field).toBe("REF-2026");
		expect(call.free_field_enabled).toBe(true);
	});
});

describe("invoices duplicate", () => {
	it("calls duplicate with id and optional date", async () => {
		mockClient.invoices.duplicate.mockResolvedValue({
			id: 10,
			status: "draft",
		});

		await runSubCommand("duplicate", {
			id: "5",
			date: "2026-04-01",
		});

		expect(mockClient.invoices.duplicate).toHaveBeenCalledWith(5, {
			emission_date: "2026-04-01",
			quantity: undefined,
		});
		expect(parseStdout().id).toBe(10);
	});

	it("passes quantity override when provided", async () => {
		mockClient.invoices.duplicate.mockResolvedValue({ id: 11 });

		await runSubCommand("duplicate", {
			id: "5",
			quantity: "20",
		});

		expect(mockClient.invoices.duplicate).toHaveBeenCalledWith(5, {
			emission_date: undefined,
			quantity: 20,
		});
	});
});

describe("invoices update", () => {
	it("updates invoice with provided fields", async () => {
		mockClient.invoices.update.mockResolvedValue({ id: 7, title: "Updated" });

		await runSubCommand("update", {
			id: "7",
			title: "Updated",
			status: "saved",
			date: "2026-05-01",
		});

		expect(mockClient.invoices.update).toHaveBeenCalledWith(7, {
			title: "Updated",
			status: "saved",
			emission_date: "2026-05-01",
		});
	});

	it("updates free-field and enables it", async () => {
		mockClient.invoices.update.mockResolvedValue({ id: 8 });

		await runSubCommand("update", {
			id: "8",
			"free-field": "New ref",
		});

		expect(mockClient.invoices.update).toHaveBeenCalledWith(8, {
			free_field: "New ref",
			free_field_enabled: true,
		});
	});
});

describe("invoices send", () => {
	it("sends invoice by email", async () => {
		mockClient.invoices.send.mockResolvedValue(undefined);

		await runSubCommand("send", {
			id: "10",
			email: "client@test.com",
			subject: "Votre facture",
			message: "Bonjour",
		});

		expect(mockClient.invoices.send).toHaveBeenCalledWith(10, {
			recipients: [{ email: "client@test.com" }],
			subject: "Votre facture",
			message: "Bonjour",
		});

		const result = parseStdout();
		expect(result.status).toBe("sent");
		expect(result.email).toBe("client@test.com");
	});
});

describe("invoices pdf", () => {
	it("downloads PDF and writes to file", async () => {
		const fakeBuffer = new ArrayBuffer(8);
		mockClient.invoices.downloadPdf.mockResolvedValue(fakeBuffer);

		await runSubCommand("pdf", { id: "15" });

		expect(mockClient.invoices.downloadPdf).toHaveBeenCalledWith(15);
		expect(writeFileSync).toHaveBeenCalledWith(
			"facture-15.pdf",
			expect.any(Buffer),
		);
		expect(parseStdout().status).toBe("downloaded");
	});

	it("uses custom output path when provided", async () => {
		const fakeBuffer = new ArrayBuffer(8);
		mockClient.invoices.downloadPdf.mockResolvedValue(fakeBuffer);

		await runSubCommand("pdf", { id: "15", output: "/tmp/custom.pdf" });

		expect(writeFileSync).toHaveBeenCalledWith(
			"/tmp/custom.pdf",
			expect.any(Buffer),
		);
	});
});

describe("invoices delete", () => {
	it("deletes invoice and outputs status", async () => {
		mockClient.invoices.delete.mockResolvedValue(undefined);

		await runSubCommand("delete", { id: "20" });

		expect(mockClient.invoices.delete).toHaveBeenCalledWith(20);
		const result = parseStdout();
		expect(result.status).toBe("deleted");
		expect(result.id).toBe(20);
	});
});
