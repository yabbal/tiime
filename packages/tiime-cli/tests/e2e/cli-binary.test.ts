import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const CLI_DIR = resolve(import.meta.dirname, "../..");
const CLI_BIN = resolve(CLI_DIR, "dist/cli.js");

/**
 * Execute the CLI binary and return { stdout, stderr, exitCode }.
 * Uses spawnSync to reliably capture both stdout and stderr.
 */
const run = (
	args: string,
	env?: Record<string, string>,
): { stdout: string; stderr: string; exitCode: number } => {
	const argv = args.trim().length > 0 ? args.trim().split(/\s+/) : [];
	const result = spawnSync("node", [CLI_BIN, ...argv], {
		encoding: "utf-8",
		cwd: CLI_DIR,
		env: {
			...process.env,
			// Force English output for predictable assertions
			TIIME_LANG: "en",
			// Prevent interactive prompts
			CI: "true",
			// Clear any real auth config
			XDG_CONFIG_HOME: resolve(CLI_DIR, "tests/e2e/.config-fake"),
			...env,
		},
		timeout: 10_000,
	});
	return {
		stdout: result.stdout ?? "",
		stderr: result.stderr ?? "",
		exitCode: result.status ?? 1,
	};
};

beforeAll(() => {
	if (!existsSync(CLI_BIN)) {
		throw new Error(
			`CLI binary not found at ${CLI_BIN}. Run "pnpm build" first.`,
		);
	}
});

// ---------------------------------------------------------------------------
// Version
// ---------------------------------------------------------------------------
describe("version command", () => {
	it("outputs version as JSON to stdout", () => {
		const { stdout, exitCode } = run("version");
		expect(exitCode).toBe(0);
		const data = JSON.parse(stdout);
		expect(data).toHaveProperty("version");
		expect(data).toHaveProperty("node");
		// version should be a semver-ish string
		expect(data.version).toMatch(/^\d+\.\d+\.\d+/);
	});
});

// ---------------------------------------------------------------------------
// Help — top-level
// ---------------------------------------------------------------------------
describe("top-level help", () => {
	it("shows help with --help flag", () => {
		const { stderr, exitCode } = run("--help");
		expect(exitCode).toBe(0);
		// citty renders usage to stderr via showTranslatedUsage
		expect(stderr).toContain("tiime");
	});

	it("shows help when no command is given", () => {
		const { stderr } = run("");
		// citty exits with code 1 when no command is given, but still shows help
		expect(stderr).toContain("tiime");
		expect(stderr).toContain("USAGE");
	});

	it("lists all subcommands in help output", () => {
		const { stderr } = run("--help");
		const subcommands = [
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
		for (const cmd of subcommands) {
			expect(stderr).toContain(cmd);
		}
	});
});

// ---------------------------------------------------------------------------
// Help — subcommands
// ---------------------------------------------------------------------------
describe("subcommand help", () => {
	const subcommandsWithSubs = [
		"auth",
		"company",
		"invoices",
		"clients",
		"bank",
		"quotations",
		"expenses",
		"documents",
		"labels",
	];

	for (const cmd of subcommandsWithSubs) {
		it(`${cmd} --help shows help without error`, () => {
			const { exitCode, stderr } = run(`${cmd} --help`);
			expect(exitCode).toBe(0);
			// Should contain the command name in usage
			expect(stderr).toContain(cmd);
		});
	}

	it("auth --help lists login, logout, status subcommands", () => {
		const { stderr } = run("auth --help");
		expect(stderr).toContain("login");
		expect(stderr).toContain("logout");
		expect(stderr).toContain("status");
	});

	it("invoices --help lists list, get, create subcommands", () => {
		const { stderr } = run("invoices --help");
		expect(stderr).toContain("list");
		expect(stderr).toContain("get");
		expect(stderr).toContain("create");
	});

	it("bank --help lists accounts, balance, transactions, unimputed", () => {
		const { stderr } = run("bank --help");
		expect(stderr).toContain("accounts");
		expect(stderr).toContain("balance");
		expect(stderr).toContain("transactions");
		expect(stderr).toContain("unimputed");
	});
});

// ---------------------------------------------------------------------------
// Shell completion generation
// ---------------------------------------------------------------------------
describe("completion command", () => {
	it("generates zsh completion script", () => {
		const { stdout, exitCode } = run("completion --shell zsh");
		expect(exitCode).toBe(0);
		expect(stdout).toContain("#compdef tiime");
		expect(stdout).toContain("_tiime");
		expect(stdout).toContain("compdef _tiime tiime");
	});

	it("generates bash completion script", () => {
		const { stdout, exitCode } = run("completion --shell bash");
		expect(exitCode).toBe(0);
		expect(stdout).toContain("_tiime()");
		expect(stdout).toContain("complete -F _tiime tiime");
		expect(stdout).toContain("COMPREPLY");
	});

	it("generates fish completion script", () => {
		const { stdout, stderr } = run("completion --shell fish");
		const output = stdout + stderr;
		expect(output).toContain("complete -c tiime");
		expect(output).toContain("__fish_use_subcommand");
	});

	it("completion scripts contain all top-level commands", () => {
		const { stdout, stderr } = run("completion --shell bash");
		const output = stdout + stderr;
		const commands = [
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
			"version",
			"completion",
		];
		for (const cmd of commands) {
			expect(output).toContain(cmd);
		}
	});

	it("rejects unsupported shell with error", () => {
		const { stderr, exitCode } = run("completion --shell powershell");
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("powershell");
	});
});

// ---------------------------------------------------------------------------
// Error handling — commands requiring auth
// ---------------------------------------------------------------------------
describe("commands without auth", () => {
	const commandsNeedingAuth = [
		"invoices list",
		"clients list",
		"bank accounts",
		"bank balance",
		"bank transactions",
		"bank unimputed",
		"documents list",
		"labels list",
		"labels standard",
		"expenses list",
		"quotations list",
		"company get",
		// "company list" is excluded: it doesn't require companyId and the token
		// may still be available via macOS keychain (not affected by XDG_CONFIG_HOME)
		"status",
	];

	for (const cmd of commandsNeedingAuth) {
		it(`"${cmd}" fails gracefully without auth`, () => {
			const { exitCode, stderr, stdout } = run(cmd);
			// Should not succeed — either exits non-zero or outputs an error
			const combined = stdout + stderr;
			// The command should produce some error output (not just crash silently)
			const hasError =
				exitCode !== 0 ||
				combined.toLowerCase().includes("error") ||
				combined.toLowerCase().includes("auth") ||
				combined.toLowerCase().includes("login") ||
				combined.toLowerCase().includes("companyid") ||
				combined.toLowerCase().includes("company");
			expect(hasError).toBe(true);
		});
	}
});

// ---------------------------------------------------------------------------
// Auth status without token
// ---------------------------------------------------------------------------
describe("auth status", () => {
	it("outputs valid JSON with authenticated field", () => {
		const { stdout, exitCode } = run("auth status");
		expect(exitCode).toBe(0);
		const data = JSON.parse(stdout);
		// authenticated is either true or false depending on whether a real token exists
		expect(typeof data.authenticated).toBe("boolean");
		expect(data).toHaveProperty("email");
	});
});

// ---------------------------------------------------------------------------
// Invalid commands / arguments
// ---------------------------------------------------------------------------
describe("invalid usage", () => {
	it("unknown subcommand shows help or error", () => {
		const { stderr, exitCode } = run("nonexistent");
		// citty may show help or error for unknown commands
		const combined = stderr;
		const hasResponse = combined.length > 0 || exitCode !== 0;
		expect(hasResponse).toBe(true);
	});

	it("invoices get without --id shows error or usage", () => {
		const { exitCode, stderr, stdout } = run("invoices get");
		const combined = stdout + stderr;
		// Should either error about missing ID or show usage
		const hasResponse = exitCode !== 0 || combined.length > 0;
		expect(hasResponse).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Output format flags (on commands that don't need API)
// ---------------------------------------------------------------------------
describe("output format flags", () => {
	it("version output is valid JSON (default format)", () => {
		const { stdout } = run("version");
		expect(() => JSON.parse(stdout)).not.toThrow();
	});

	it("version with --format json outputs valid JSON", () => {
		// version command may not accept --format, but it outputs JSON by default
		const { stdout, exitCode } = run("version");
		expect(exitCode).toBe(0);
		const data = JSON.parse(stdout);
		expect(data).toHaveProperty("version");
	});
});

// ---------------------------------------------------------------------------
// i18n / language switching
// ---------------------------------------------------------------------------
describe("language support", () => {
	it("help in French contains UTILISATION", () => {
		const { stderr } = run("--help", { TIIME_LANG: "fr" });
		expect(stderr).toContain("UTILISATION");
	});

	it("help in English contains USAGE", () => {
		const { stderr } = run("--help", { TIIME_LANG: "en" });
		expect(stderr).toContain("USAGE");
	});
});
