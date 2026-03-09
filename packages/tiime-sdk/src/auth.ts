import { fetchJson } from "./fetch";
import type { AuthTokens } from "./types";

const AUTH0_DOMAIN = "auth0.tiime.fr";
const AUTH0_CLIENT_ID = "iEbsbe3o66gcTBfGRa012kj1Rb6vjAND";
const AUTH0_AUDIENCE = "https://chronos/";

export interface TokenStorage {
	load(): AuthTokens | null;
	save(tokens: AuthTokens): void;
	clear(): void;
}

export interface CredentialStorage {
	load(): { email: string; password: string } | null;
	save(email: string, password: string): void;
}

export class TokenManager {
	private tokens: AuthTokens | null = null;
	private credentials: { email: string; password: string } | null = null;
	private tokenStorage: TokenStorage | null;
	private credentialStorage: CredentialStorage | null;

	constructor(
		options: {
			tokens?: AuthTokens;
			email?: string;
			password?: string;
			tokenStorage?: TokenStorage;
			credentialStorage?: CredentialStorage;
		} = {},
	) {
		this.tokenStorage = options.tokenStorage ?? null;
		this.credentialStorage = options.credentialStorage ?? null;

		if (options.tokens) {
			this.tokens = options.tokens;
			return;
		}

		if (options.email && options.password) {
			this.credentials = { email: options.email, password: options.password };
			return;
		}

		// Check env vars
		const envToken = process.env.TIIME_ACCESS_TOKEN;
		if (envToken) {
			this.tokens = {
				access_token: envToken,
				expires_at: Number.MAX_SAFE_INTEGER,
			};
			return;
		}

		const envEmail = process.env.TIIME_EMAIL;
		const envPassword = process.env.TIIME_PASSWORD;
		if (envEmail && envPassword) {
			this.credentials = { email: envEmail, password: envPassword };
			return;
		}

		// Fallback: load from storage
		if (this.tokenStorage) {
			this.tokens = this.tokenStorage.load();
		}
	}

	async login(email: string, password: string): Promise<AuthTokens> {
		const response = await fetchJson<{
			access_token: string;
			expires_in: number;
			token_type: string;
		}>(`https://${AUTH0_DOMAIN}/oauth/token`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				grant_type: "password",
				client_id: AUTH0_CLIENT_ID,
				audience: AUTH0_AUDIENCE,
				scope: "openid email",
				username: email,
				password: password,
			}),
		});

		this.tokens = {
			access_token: response.access_token,
			expires_at: Date.now() + response.expires_in * 1000,
		};

		this.tokenStorage?.save(this.tokens);
		this.credentialStorage?.save(email, password);

		return this.tokens;
	}

	async getValidToken(): Promise<string> {
		if (!this.tokens || this.isExpired()) {
			const creds = this.credentials ?? this.credentialStorage?.load() ?? null;
			if (creds) {
				const tokens = await this.login(creds.email, creds.password);
				return tokens.access_token;
			}
			throw new Error(
				this.tokens
					? "Token expired. Provide credentials via options, TIIME_EMAIL/TIIME_PASSWORD env vars, or run `tiime auth login`."
					: "Not authenticated. Provide credentials via options, TIIME_EMAIL/TIIME_PASSWORD env vars, or run `tiime auth login`.",
			);
		}

		return this.tokens.access_token;
	}

	isAuthenticated(): boolean {
		return this.tokens !== null && !this.isExpired();
	}

	logout(): void {
		this.tokens = null;
		this.tokenStorage?.clear();
	}

	getTokenInfo(): { email: string | null; expiresAt: Date | null } {
		if (!this.tokens) {
			return { email: null, expiresAt: null };
		}

		try {
			const payload = JSON.parse(
				Buffer.from(
					this.tokens.access_token.split(".")[1],
					"base64",
				).toString(),
			);
			return {
				email: payload["tiime/userEmail"] || null,
				expiresAt: new Date(this.tokens.expires_at),
			};
		} catch {
			return { email: null, expiresAt: new Date(this.tokens.expires_at) };
		}
	}

	private isExpired(): boolean {
		if (!this.tokens) return true;
		return Date.now() >= this.tokens.expires_at - 60_000;
	}
}
