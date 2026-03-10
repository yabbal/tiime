import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({
	exec: vi.fn(),
}));

vi.mock("../../src/cli/config", () => ({
	getCompanyId: () => 42,
}));

import { exec } from "node:child_process";

let stdoutData: string;
let stderrData: string;

beforeEach(() => {
	stdoutData = "";
	stderrData = "";

	vi.mocked(exec).mockReset();

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

describe("open command", () => {
	it("opens base URL when no section provided", async () => {
		const { openCommand } = await import("../../src/cli/commands/open");
		await openCommand.run?.({
			args: { _: [] } as any,
			rawArgs: [],
			cmd: openCommand,
		});

		expect(exec).toHaveBeenCalledWith('open "https://apps.tiime.fr"');
		expect(parseStdout().opened).toBe("https://apps.tiime.fr");
	});

	it("opens invoices section with company id", async () => {
		const { openCommand } = await import("../../src/cli/commands/open");
		await openCommand.run?.({
			args: { section: "invoices", _: [] },
			rawArgs: [],
			cmd: openCommand,
		});

		expect(exec).toHaveBeenCalledWith(
			'open "https://apps.tiime.fr/companies/42/invoicing/invoices"',
		);
	});

	it("opens bank section", async () => {
		const { openCommand } = await import("../../src/cli/commands/open");
		await openCommand.run?.({
			args: { section: "bank", _: [] },
			rawArgs: [],
			cmd: openCommand,
		});

		expect(exec).toHaveBeenCalledWith(
			'open "https://apps.tiime.fr/companies/42/bank"',
		);
	});

	it("opens documents section", async () => {
		const { openCommand } = await import("../../src/cli/commands/open");
		await openCommand.run?.({
			args: { section: "documents", _: [] },
			rawArgs: [],
			cmd: openCommand,
		});

		expect(exec).toHaveBeenCalledWith(
			'open "https://apps.tiime.fr/companies/42/documents"',
		);
	});

	it("outputs error for unknown section", async () => {
		const { openCommand } = await import("../../src/cli/commands/open");
		await openCommand.run?.({
			args: { section: "unknown", _: [] },
			rawArgs: [],
			cmd: openCommand,
		});

		const err = JSON.parse(stderrData.trim());
		expect(err.error).toContain("Section inconnue");
		expect(err.error).toContain("unknown");
	});

	it("supports all valid sections", async () => {
		const validSections = [
			"invoices",
			"quotations",
			"clients",
			"bank",
			"documents",
			"expenses",
		];

		for (const section of validSections) {
			stdoutData = "";
			vi.mocked(exec).mockReset();

			const { openCommand } = await import("../../src/cli/commands/open");
			await openCommand.run?.({
				args: { section, _: [] },
				rawArgs: [],
				cmd: openCommand,
			});

			expect(exec).toHaveBeenCalled();
			const result = parseStdout();
			expect(result.opened).toContain("apps.tiime.fr");
		}
	});
});
