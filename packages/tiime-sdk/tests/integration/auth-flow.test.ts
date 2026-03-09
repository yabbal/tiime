import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TokenManager } from "../../src/auth";
import type { AuthTokens, TokenStorage } from "../../src/types";

/**
 * Integration tests: TokenManager full auth flow
 * Tests login → token storage → getValidToken → expiration → auto-refresh
 * Only global fetch is mocked — no module-level mocks.
 */

const mockFetch =
	vi.fn<
		(input: string | URL | Request, init?: RequestInit) => Promise<Response>
	>();

const createJwt = (payload: Record<string, unknown>): string => {
	const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString(
		"base64url",
	);
	const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
	return `${header}.${body}.fake-signature`;
};

const authResponse = (accessToken: string, expiresIn = 3600) =>
	new Response(
		JSON.stringify({
			access_token: accessToken,
			expires_in: expiresIn,
			token_type: "Bearer",
		}),
		{
			status: 200,
			headers: { "content-type": "application/json" },
		},
	);

beforeEach(() => {
	mockFetch.mockReset();
	vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
	delete process.env.TIIME_ACCESS_TOKEN;
	delete process.env.TIIME_EMAIL;
	delete process.env.TIIME_PASSWORD;
});

describe("TokenManager auth flow", () => {
	describe("login → getValidToken", () => {
		it("login stores token and getValidToken returns it", async () => {
			const jwt = createJwt({ "tiime/userEmail": "user@test.com" });
			mockFetch.mockResolvedValueOnce(authResponse(jwt));

			const tm = new TokenManager();
			await tm.login("user@test.com", "password123");

			expect(tm.isAuthenticated()).toBe(true);
			const token = await tm.getValidToken();
			expect(token).toBe(jwt);

			// Verify login called Auth0 with correct params
			const init = mockFetch.mock.calls[0][1]!;
			const body = JSON.parse(init.body as string);
			expect(body.grant_type).toBe("password");
			expect(body.username).toBe("user@test.com");
			expect(body.password).toBe("password123");
			expect(body.client_id).toBe("iEbsbe3o66gcTBfGRa012kj1Rb6vjAND");
			expect(body.audience).toBe("https://chronos/");
		});

		it("login calls Auth0 domain endpoint", async () => {
			const jwt = createJwt({});
			mockFetch.mockResolvedValueOnce(authResponse(jwt));

			const tm = new TokenManager();
			await tm.login("a@b.com", "pass");

			const url = mockFetch.mock.calls[0][0] as string;
			expect(url).toBe("https://auth0.tiime.fr/oauth/token");
		});
	});

	describe("token storage integration", () => {
		it("saves tokens to storage after login", async () => {
			const jwt = createJwt({});
			mockFetch.mockResolvedValueOnce(authResponse(jwt, 7200));

			const saved: AuthTokens[] = [];
			const storage: TokenStorage = {
				load: () => null,
				save: (tokens) => saved.push(tokens),
				clear: () => {},
			};

			const tm = new TokenManager({ tokenStorage: storage });
			await tm.login("a@b.com", "pass");

			expect(saved).toHaveLength(1);
			expect(saved[0].access_token).toBe(jwt);
			expect(saved[0].expires_at).toBeGreaterThan(Date.now());
		});

		it("loads tokens from storage on construction", async () => {
			const jwt = createJwt({ "tiime/userEmail": "stored@test.com" });
			const storage: TokenStorage = {
				load: () => ({
					access_token: jwt,
					expires_at: Date.now() + 3_600_000,
				}),
				save: () => {},
				clear: () => {},
			};

			const tm = new TokenManager({ tokenStorage: storage });

			expect(tm.isAuthenticated()).toBe(true);
			const token = await tm.getValidToken();
			expect(token).toBe(jwt);
			// No fetch calls — token loaded from storage
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("clears storage on logout", () => {
			let cleared = false;
			const jwt = createJwt({});
			const storage: TokenStorage = {
				load: () => ({
					access_token: jwt,
					expires_at: Date.now() + 3_600_000,
				}),
				save: () => {},
				clear: () => {
					cleared = true;
				},
			};

			const tm = new TokenManager({ tokenStorage: storage });
			expect(tm.isAuthenticated()).toBe(true);

			tm.logout();

			expect(tm.isAuthenticated()).toBe(false);
			expect(cleared).toBe(true);
		});
	});

	describe("auto-refresh with credentials", () => {
		it("auto-refreshes expired token using stored credentials", async () => {
			const expiredJwt = createJwt({ "tiime/userEmail": "user@test.com" });
			const freshJwt = createJwt({ "tiime/userEmail": "user@test.com" });

			// First login
			mockFetch.mockResolvedValueOnce(authResponse(expiredJwt, 0));
			const tm = new TokenManager({
				email: "user@test.com",
				password: "pass",
			});
			await tm.login("user@test.com", "pass");

			// Token is now expired (expires_in = 0)
			expect(tm.isAuthenticated()).toBe(false);

			// getValidToken should auto-refresh
			mockFetch.mockResolvedValueOnce(authResponse(freshJwt, 3600));
			const token = await tm.getValidToken();

			expect(token).toBe(freshJwt);
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});

		it("auto-refreshes using credential storage fallback", async () => {
			const freshJwt = createJwt({});
			mockFetch.mockResolvedValueOnce(authResponse(freshJwt, 3600));

			const credStorage = {
				load: () => ({ email: "cred@test.com", password: "credpass" }),
				save: vi.fn(),
			};

			const tm = new TokenManager({ credentialStorage: credStorage });
			// No tokens set — getValidToken should use credential storage
			const token = await tm.getValidToken();

			expect(token).toBe(freshJwt);
			const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
			expect(body.username).toBe("cred@test.com");
			expect(body.password).toBe("credpass");
		});

		it("throws when token expired and no credentials available", async () => {
			const tm = new TokenManager();

			await expect(tm.getValidToken()).rejects.toThrow("Not authenticated");
		});

		it("throws descriptive error when token exists but is expired", async () => {
			const expiredJwt = createJwt({});
			const storage: TokenStorage = {
				load: () => ({
					access_token: expiredJwt,
					expires_at: Date.now() - 120_000, // expired 2 min ago
				}),
				save: () => {},
				clear: () => {},
			};

			const tm = new TokenManager({ tokenStorage: storage });

			await expect(tm.getValidToken()).rejects.toThrow("Token expired");
		});
	});

	describe("env var integration", () => {
		it("uses TIIME_ACCESS_TOKEN env var", async () => {
			process.env.TIIME_ACCESS_TOKEN = "env-token-123";

			const tm = new TokenManager();

			expect(tm.isAuthenticated()).toBe(true);
			const token = await tm.getValidToken();
			expect(token).toBe("env-token-123");
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("uses TIIME_EMAIL + TIIME_PASSWORD env vars for auto-login", async () => {
			process.env.TIIME_EMAIL = "env@test.com";
			process.env.TIIME_PASSWORD = "envpass";

			const freshJwt = createJwt({});
			mockFetch.mockResolvedValueOnce(authResponse(freshJwt));

			const tm = new TokenManager();
			const token = await tm.getValidToken();

			expect(token).toBe(freshJwt);
			const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
			expect(body.username).toBe("env@test.com");
		});
	});

	describe("getTokenInfo integration", () => {
		it("extracts email from JWT after login", async () => {
			const jwt = createJwt({ "tiime/userEmail": "info@tiime.fr" });
			mockFetch.mockResolvedValueOnce(authResponse(jwt));

			const tm = new TokenManager();
			await tm.login("info@tiime.fr", "pass");

			const info = tm.getTokenInfo();
			expect(info.email).toBe("info@tiime.fr");
			expect(info.expiresAt).toBeInstanceOf(Date);
			expect(info.expiresAt?.getTime()).toBeGreaterThan(Date.now());
		});
	});

	describe("credential storage integration", () => {
		it("saves credentials after login", async () => {
			const jwt = createJwt({});
			mockFetch.mockResolvedValueOnce(authResponse(jwt));

			const savedCreds: Array<{ email: string; password: string }> = [];
			const credStorage = {
				load: () => null,
				save: (email: string, password: string) =>
					savedCreds.push({ email, password }),
			};

			const tm = new TokenManager({ credentialStorage: credStorage });
			await tm.login("save@test.com", "savepass");

			expect(savedCreds).toEqual([
				{ email: "save@test.com", password: "savepass" },
			]);
		});
	});

	describe("priority order", () => {
		it("direct tokens take priority over env vars", async () => {
			process.env.TIIME_ACCESS_TOKEN = "env-token";

			const tm = new TokenManager({
				tokens: {
					access_token: "direct-token",
					expires_at: Date.now() + 3_600_000,
				},
			});

			const token = await tm.getValidToken();
			expect(token).toBe("direct-token");
		});

		it("direct credentials take priority over env credentials", async () => {
			process.env.TIIME_EMAIL = "env@test.com";
			process.env.TIIME_PASSWORD = "envpass";

			const jwt = createJwt({});
			mockFetch.mockResolvedValueOnce(authResponse(jwt));

			const tm = new TokenManager({
				email: "direct@test.com",
				password: "directpass",
			});
			await tm.getValidToken();

			const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
			expect(body.username).toBe("direct@test.com");
		});
	});
});
