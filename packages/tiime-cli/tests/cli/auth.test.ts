import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTokenManager = {
	isAuthenticated: vi.fn(),
	getTokenInfo: vi.fn(),
	login: vi.fn(),
	logout: vi.fn(),
};

vi.mock("../../src/cli/config", () => ({
	createTokenManager: () => mockTokenManager,
}));

vi.mock("@clack/prompts", () => ({
	intro: vi.fn(),
	text: vi.fn(),
	password: vi.fn(),
	spinner: vi.fn(() => ({
		start: vi.fn(),
		stop: vi.fn(),
	})),
	outro: vi.fn(),
	cancel: vi.fn(),
	isCancel: vi.fn(() => false),
}));

let stdoutData: string;
let stderrData: string;

beforeEach(() => {
	stdoutData = "";
	stderrData = "";

	mockTokenManager.isAuthenticated.mockReset();
	mockTokenManager.getTokenInfo.mockReset();
	mockTokenManager.login.mockReset();
	mockTokenManager.logout.mockReset();

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
	const { authCommand } = await import("../../src/cli/commands/auth");
	const cmd = (authCommand.subCommands as Record<string, any>)?.[subName];
	await cmd.run?.({ args, rawArgs: [], cmd });
};

describe("auth login", () => {
	it("logs in with email and password args (CI mode)", async () => {
		mockTokenManager.login.mockResolvedValue(undefined);
		mockTokenManager.getTokenInfo.mockReturnValue({
			email: "user@test.com",
			expiresAt: new Date("2026-12-31T00:00:00Z"),
		});

		await runSubCommand("login", {
			email: "user@test.com",
			password: "secret",
		});

		expect(mockTokenManager.login).toHaveBeenCalledWith(
			"user@test.com",
			"secret",
		);
		const result = parseStdout();
		expect(result.status).toBe("authenticated");
		expect(result.email).toBe("user@test.com");
	});

	it("outputs error on login failure in CI mode", async () => {
		mockTokenManager.login.mockRejectedValue(new Error("Invalid credentials"));

		await runSubCommand("login", {
			email: "user@test.com",
			password: "wrong",
		});

		const err = JSON.parse(stderrData.trim());
		expect(err.error).toBe("Invalid credentials");
	});

	it("enters interactive mode when no args provided", async () => {
		const p = await import("@clack/prompts");
		vi.mocked(p.text).mockResolvedValue("user@test.com");
		vi.mocked(p.password).mockResolvedValue("secret");
		mockTokenManager.login.mockResolvedValue(undefined);
		mockTokenManager.getTokenInfo.mockReturnValue({
			email: "user@test.com",
			expiresAt: new Date("2026-12-31"),
		});

		await runSubCommand("login", {});

		expect(p.intro).toHaveBeenCalled();
		expect(p.text).toHaveBeenCalled();
		expect(p.password).toHaveBeenCalled();
		expect(mockTokenManager.login).toHaveBeenCalledWith(
			"user@test.com",
			"secret",
		);
	});

	it("cancels when email prompt is cancelled", async () => {
		const p = await import("@clack/prompts");
		vi.mocked(p.text).mockResolvedValue(Symbol("cancel") as unknown as string);
		vi.mocked(p.isCancel).mockReturnValueOnce(true);

		await runSubCommand("login", {});

		expect(p.cancel).toHaveBeenCalledWith("Connexion annulée.");
		expect(mockTokenManager.login).not.toHaveBeenCalled();
	});

	it("cancels when password prompt is cancelled", async () => {
		const p = await import("@clack/prompts");
		vi.mocked(p.text).mockResolvedValue("user@test.com");
		vi.mocked(p.isCancel).mockReturnValueOnce(false).mockReturnValueOnce(true);
		vi.mocked(p.password).mockResolvedValue(
			Symbol("cancel") as unknown as string,
		);

		await runSubCommand("login", {});

		expect(p.cancel).toHaveBeenCalledWith("Connexion annulée.");
		expect(mockTokenManager.login).not.toHaveBeenCalled();
	});
});

describe("auth logout", () => {
	it("calls logout and outputs status", async () => {
		await runSubCommand("logout", {});

		expect(mockTokenManager.logout).toHaveBeenCalled();
		expect(parseStdout().status).toBe("logged_out");
	});
});

describe("auth status", () => {
	it("outputs authenticated status", async () => {
		mockTokenManager.isAuthenticated.mockReturnValue(true);
		mockTokenManager.getTokenInfo.mockReturnValue({
			email: "user@test.com",
			expiresAt: new Date("2026-12-31T00:00:00Z"),
		});

		await runSubCommand("status", {});

		const result = parseStdout();
		expect(result.authenticated).toBe(true);
		expect(result.email).toBe("user@test.com");
		expect(result.expires_at).toBe("2026-12-31T00:00:00.000Z");
	});

	it("outputs unauthenticated status", async () => {
		mockTokenManager.isAuthenticated.mockReturnValue(false);
		mockTokenManager.getTokenInfo.mockReturnValue({
			email: null,
			expiresAt: null,
		});

		await runSubCommand("status", {});

		const result = parseStdout();
		expect(result.authenticated).toBe(false);
		expect(result.email).toBeNull();
		expect(result.expires_at).toBeNull();
	});
});
