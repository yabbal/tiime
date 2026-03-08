import { describe, expect, it, vi } from "vitest";
import { TokenManager } from "../../src/sdk/auth";

// Mock fs and os modules to prevent reading real disk files
vi.mock("node:fs", () => ({
	existsSync: vi.fn(() => false),
	readFileSync: vi.fn(),
	writeFileSync: vi.fn(),
	mkdirSync: vi.fn(),
}));

vi.mock("node:os", () => ({
	homedir: vi.fn(() => "/tmp/test-home"),
}));

vi.mock("node:child_process", () => ({
	execSync: vi.fn(() => {
		throw new Error("no keychain");
	}),
}));

const createJwt = (payload: Record<string, unknown>): string => {
	const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString(
		"base64url",
	);
	const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
	return `${header}.${body}.fake-signature`;
};

describe("TokenManager", () => {
	describe("isExpired (via isAuthenticated)", () => {
		it("should return false when no tokens are set", () => {
			const manager = new TokenManager();
			expect(manager.isAuthenticated()).toBe(false);
		});

		it("should return true when token is still valid", () => {
			const manager = new TokenManager();
			// Set tokens via internal state by using Object.assign trick
			// Since tokens is private, we access it through any
			const m = manager as unknown as {
				tokens: { access_token: string; expires_at: number } | null;
			};
			m.tokens = {
				access_token: createJwt({ "tiime/userEmail": "test@test.com" }),
				expires_at: Date.now() + 3_600_000, // 1 hour from now
			};

			expect(manager.isAuthenticated()).toBe(true);
		});

		it("should return false when token is expired", () => {
			const manager = new TokenManager();
			const m = manager as unknown as {
				tokens: { access_token: string; expires_at: number } | null;
			};
			m.tokens = {
				access_token: createJwt({ "tiime/userEmail": "test@test.com" }),
				expires_at: Date.now() - 1000, // expired 1 second ago
			};

			expect(manager.isAuthenticated()).toBe(false);
		});

		it("should consider token expired within the 60s buffer", () => {
			const manager = new TokenManager();
			const m = manager as unknown as {
				tokens: { access_token: string; expires_at: number } | null;
			};
			m.tokens = {
				access_token: createJwt({}),
				expires_at: Date.now() + 30_000, // 30 seconds from now (within 60s buffer)
			};

			expect(manager.isAuthenticated()).toBe(false);
		});
	});

	describe("getTokenInfo()", () => {
		it("should return nulls when no tokens are set", () => {
			const manager = new TokenManager();
			const info = manager.getTokenInfo();

			expect(info.email).toBeNull();
			expect(info.expiresAt).toBeNull();
		});

		it("should decode JWT payload and extract email", () => {
			const manager = new TokenManager();
			const m = manager as unknown as {
				tokens: { access_token: string; expires_at: number } | null;
			};
			const expiresAt = Date.now() + 3_600_000;
			m.tokens = {
				access_token: createJwt({
					"tiime/userEmail": "user@tiime.fr",
					sub: "auth0|123",
				}),
				expires_at: expiresAt,
			};

			const info = manager.getTokenInfo();

			expect(info.email).toBe("user@tiime.fr");
			expect(info.expiresAt).toEqual(new Date(expiresAt));
		});

		it("should return null email when JWT has no email claim", () => {
			const manager = new TokenManager();
			const m = manager as unknown as {
				tokens: { access_token: string; expires_at: number } | null;
			};
			m.tokens = {
				access_token: createJwt({ sub: "auth0|123" }),
				expires_at: Date.now() + 3_600_000,
			};

			const info = manager.getTokenInfo();
			expect(info.email).toBeNull();
		});

		it("should handle malformed JWT gracefully", () => {
			const manager = new TokenManager();
			const m = manager as unknown as {
				tokens: { access_token: string; expires_at: number } | null;
			};
			const expiresAt = Date.now() + 3_600_000;
			m.tokens = {
				access_token: "not.a.valid.jwt",
				expires_at: expiresAt,
			};

			const info = manager.getTokenInfo();
			expect(info.email).toBeNull();
			expect(info.expiresAt).toEqual(new Date(expiresAt));
		});
	});
});
