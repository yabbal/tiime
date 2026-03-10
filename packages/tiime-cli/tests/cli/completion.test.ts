import { beforeEach, describe, expect, it, vi } from "vitest";

let stdoutData: string;
let stderrData: string;

beforeEach(() => {
	stdoutData = "";
	stderrData = "";

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

describe("completion command", () => {
	it("generates zsh completion by default", async () => {
		const { completionCommand } = await import(
			"../../src/cli/commands/completion"
		);
		await completionCommand.run?.({
			args: { shell: "zsh", _: [] },
			rawArgs: [],
			cmd: completionCommand,
		});

		expect(stdoutData).toContain("#compdef tiime");
		expect(stdoutData).toContain("_tiime");
		expect(stdoutData).toContain("compdef _tiime tiime");
	});

	it("zsh completion contains all top-level commands", async () => {
		const { completionCommand } = await import(
			"../../src/cli/commands/completion"
		);
		await completionCommand.run?.({
			args: { shell: "zsh", _: [] },
			rawArgs: [],
			cmd: completionCommand,
		});

		const expectedCommands = [
			"auth",
			"company",
			"invoices",
			"clients",
			"bank",
			"quotations",
			"expenses",
			"documents",
			"labels",
			"status",
			"open",
			"version",
			"completion",
		];

		for (const cmd of expectedCommands) {
			expect(stdoutData).toContain(cmd);
		}
	});

	it("generates bash completion", async () => {
		const { completionCommand } = await import(
			"../../src/cli/commands/completion"
		);
		await completionCommand.run?.({
			args: { shell: "bash", _: [] },
			rawArgs: [],
			cmd: completionCommand,
		});

		expect(stdoutData).toContain("_tiime()");
		expect(stdoutData).toContain("complete -F _tiime tiime");
		expect(stdoutData).toContain("COMPREPLY");
	});

	it("generates fish completion", async () => {
		const { completionCommand } = await import(
			"../../src/cli/commands/completion"
		);
		await completionCommand.run?.({
			args: { shell: "fish", _: [] },
			rawArgs: [],
			cmd: completionCommand,
		});

		expect(stdoutData).toContain("complete -c tiime");
		expect(stdoutData).toContain("__fish_use_subcommand");
	});

	it("fish completion contains subcommands", async () => {
		const { completionCommand } = await import(
			"../../src/cli/commands/completion"
		);
		await completionCommand.run?.({
			args: { shell: "fish", _: [] },
			rawArgs: [],
			cmd: completionCommand,
		});

		expect(stdoutData).toContain("login");
		expect(stdoutData).toContain("logout");
		expect(stdoutData).toContain("list");
	});

	it("errors on unsupported shell", async () => {
		const { completionCommand } = await import(
			"../../src/cli/commands/completion"
		);
		await completionCommand.run?.({
			args: { shell: "powershell", _: [] },
			rawArgs: [],
			cmd: completionCommand,
		});

		expect(stderrData).toContain("Shell non supporté");
		expect(stderrData).toContain("powershell");
		expect(process.exit).toHaveBeenCalledWith(1);
	});

	it("zsh completion includes subcommands for commands with subs", async () => {
		const { completionCommand } = await import(
			"../../src/cli/commands/completion"
		);
		await completionCommand.run?.({
			args: { shell: "zsh", _: [] },
			rawArgs: [],
			cmd: completionCommand,
		});

		// Should have subcommand cases for invoices, bank, etc.
		expect(stdoutData).toContain("invoices)");
		expect(stdoutData).toContain("bank)");
		expect(stdoutData).toContain("auth)");
	});

	it("bash completion includes subcommands for commands with subs", async () => {
		const { completionCommand } = await import(
			"../../src/cli/commands/completion"
		);
		await completionCommand.run?.({
			args: { shell: "bash", _: [] },
			rawArgs: [],
			cmd: completionCommand,
		});

		expect(stdoutData).toContain("invoices)");
		expect(stdoutData).toContain("list");
		expect(stdoutData).toContain("get");
	});
});
