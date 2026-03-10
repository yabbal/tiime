import { defineCommand } from "citty";
import { beforeEach, describe, expect, it, vi } from "vitest";

let stdoutData: string;
let stderrData: string;

const fakeCommands = {
	auth: defineCommand({
		meta: { name: "auth", description: "Gestion de l'authentification" },
		subCommands: {
			login: defineCommand({
				meta: { name: "login", description: "Se connecter" },
			}),
			logout: defineCommand({
				meta: { name: "logout", description: "Se déconnecter" },
			}),
		},
	}),
	invoices: defineCommand({
		meta: { name: "invoices", description: "Gestion des factures" },
		subCommands: {
			list: defineCommand({
				meta: { name: "list", description: "Lister les factures" },
			}),
			get: defineCommand({
				meta: { name: "get", description: "Détails d'une facture" },
			}),
		},
	}),
	bank: defineCommand({
		meta: { name: "bank", description: "Comptes et transactions" },
		subCommands: {
			accounts: defineCommand({
				meta: { name: "accounts", description: "Comptes bancaires" },
			}),
		},
	}),
	status: defineCommand({
		meta: { name: "status", description: "Résumé rapide" },
	}),
	open: defineCommand({
		meta: { name: "open", description: "Ouvrir Tiime" },
	}),
	version: defineCommand({
		meta: { name: "version", description: "Afficher la version" },
	}),
};

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
		const { createCompletionCommand } = await import(
			"../../src/cli/commands/completion"
		);
		const cmd = createCompletionCommand(fakeCommands);
		await cmd.run?.({
			args: { shell: "zsh", _: [] },
			rawArgs: [],
			cmd,
		});

		expect(stdoutData).toContain("#compdef tiime");
		expect(stdoutData).toContain("_tiime");
		expect(stdoutData).toContain("compdef _tiime tiime");
	});

	it("zsh completion contains all top-level commands", async () => {
		const { createCompletionCommand } = await import(
			"../../src/cli/commands/completion"
		);
		const cmd = createCompletionCommand(fakeCommands);
		await cmd.run?.({
			args: { shell: "zsh", _: [] },
			rawArgs: [],
			cmd,
		});

		const expectedCommands = [
			"auth",
			"invoices",
			"bank",
			"status",
			"open",
			"version",
			"completion",
		];

		for (const name of expectedCommands) {
			expect(stdoutData).toContain(name);
		}
	});

	it("generates bash completion", async () => {
		const { createCompletionCommand } = await import(
			"../../src/cli/commands/completion"
		);
		const cmd = createCompletionCommand(fakeCommands);
		await cmd.run?.({
			args: { shell: "bash", _: [] },
			rawArgs: [],
			cmd,
		});

		expect(stdoutData).toContain("_tiime()");
		expect(stdoutData).toContain("complete -F _tiime tiime");
		expect(stdoutData).toContain("COMPREPLY");
	});

	it("generates fish completion", async () => {
		const { createCompletionCommand } = await import(
			"../../src/cli/commands/completion"
		);
		const cmd = createCompletionCommand(fakeCommands);
		await cmd.run?.({
			args: { shell: "fish", _: [] },
			rawArgs: [],
			cmd,
		});

		expect(stdoutData).toContain("complete -c tiime");
		expect(stdoutData).toContain("__fish_use_subcommand");
	});

	it("fish completion contains subcommands", async () => {
		const { createCompletionCommand } = await import(
			"../../src/cli/commands/completion"
		);
		const cmd = createCompletionCommand(fakeCommands);
		await cmd.run?.({
			args: { shell: "fish", _: [] },
			rawArgs: [],
			cmd,
		});

		expect(stdoutData).toContain("login");
		expect(stdoutData).toContain("logout");
		expect(stdoutData).toContain("list");
	});

	it("errors on unsupported shell", async () => {
		const { createCompletionCommand } = await import(
			"../../src/cli/commands/completion"
		);
		const cmd = createCompletionCommand(fakeCommands);
		await cmd.run?.({
			args: { shell: "powershell", _: [] },
			rawArgs: [],
			cmd,
		});

		expect(stderrData).toContain("Shell non supporté");
		expect(stderrData).toContain("powershell");
		expect(process.exit).toHaveBeenCalledWith(1);
	});

	it("zsh completion includes subcommands for commands with subs", async () => {
		const { createCompletionCommand } = await import(
			"../../src/cli/commands/completion"
		);
		const cmd = createCompletionCommand(fakeCommands);
		await cmd.run?.({
			args: { shell: "zsh", _: [] },
			rawArgs: [],
			cmd,
		});

		expect(stdoutData).toContain("invoices)");
		expect(stdoutData).toContain("bank)");
		expect(stdoutData).toContain("auth)");
	});

	it("bash completion includes subcommands for commands with subs", async () => {
		const { createCompletionCommand } = await import(
			"../../src/cli/commands/completion"
		);
		const cmd = createCompletionCommand(fakeCommands);
		await cmd.run?.({
			args: { shell: "bash", _: [] },
			rawArgs: [],
			cmd,
		});

		expect(stdoutData).toContain("invoices)");
		expect(stdoutData).toContain("list");
		expect(stdoutData).toContain("get");
	});
});
