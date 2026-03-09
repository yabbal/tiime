import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ofetch } from "ofetch";
import type { AuthTokens } from "./types";

const AUTH0_DOMAIN = "auth0.tiime.fr";
const AUTH0_CLIENT_ID = "iEbsbe3o66gcTBfGRa012kj1Rb6vjAND";
const AUTH0_AUDIENCE = "https://chronos/";
const CONFIG_DIR = join(homedir(), ".config", "tiime");
const AUTH_FILE = join(CONFIG_DIR, "auth.json");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

const KEYCHAIN_ACCOUNT = "tiime-cli";
const KEYCHAIN_SERVICE = "tiime-credentials";

interface Credentials {
	email: string;
	password: string;
}

const saveCredentialsToKeychain = (
	email: string,
	password: string,
): boolean => {
	try {
		const payload = JSON.stringify({ email, password });
		execSync(
			`security add-generic-password -a "${KEYCHAIN_ACCOUNT}" -s "${KEYCHAIN_SERVICE}" -w '${payload.replace(/'/g, "'\\''")}' -U`,
			{ stdio: "ignore" },
		);
		return true;
	} catch {
		return false;
	}
};

const loadCredentialsFromKeychain = (): Credentials | null => {
	try {
		const raw = execSync(
			`security find-generic-password -a "${KEYCHAIN_ACCOUNT}" -s "${KEYCHAIN_SERVICE}" -w`,
			{ encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
		).trim();
		const data: unknown = JSON.parse(raw);
		if (
			typeof data === "object" &&
			data !== null &&
			"email" in data &&
			"password" in data &&
			typeof (data as Credentials).email === "string" &&
			typeof (data as Credentials).password === "string"
		) {
			return data as Credentials;
		}
		return null;
	} catch {
		return null;
	}
};

const saveCredentialsToFile = (email: string, password: string): void => {
	if (!existsSync(CONFIG_DIR)) {
		mkdirSync(CONFIG_DIR, { recursive: true });
	}
	const filePath = join(CONFIG_DIR, "credentials.json");
	writeFileSync(filePath, JSON.stringify({ email, password }, null, 2), {
		mode: 0o600,
	});
};

const loadCredentialsFromFile = (): Credentials | null => {
	try {
		const filePath = join(CONFIG_DIR, "credentials.json");
		if (existsSync(filePath)) {
			const data: unknown = JSON.parse(readFileSync(filePath, "utf-8"));
			if (
				typeof data === "object" &&
				data !== null &&
				"email" in data &&
				"password" in data &&
				typeof (data as Credentials).email === "string" &&
				typeof (data as Credentials).password === "string"
			) {
				return data as Credentials;
			}
		}
	} catch {
		// Ignore
	}
	return null;
};

const saveCredentials = (email: string, password: string): void => {
	if (!saveCredentialsToKeychain(email, password)) {
		saveCredentialsToFile(email, password);
	}
};

const loadCredentials = (): Credentials | null => {
	return loadCredentialsFromKeychain() ?? loadCredentialsFromFile();
};

/**
 * Resolve companyId from multiple sources (in priority order):
 * 1. Explicit option
 * 2. TIIME_COMPANY_ID env var
 * 3. ~/.config/tiime/config.json
 */
export const resolveCompanyId = (explicit?: number): number => {
	if (explicit) return explicit;

	const envId = process.env.TIIME_COMPANY_ID;
	if (envId) {
		const parsed = Number.parseInt(envId, 10);
		if (!Number.isNaN(parsed)) return parsed;
	}

	try {
		if (existsSync(CONFIG_FILE)) {
			const config = JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
			if (config.companyId) return config.companyId;
		}
	} catch {
		// Ignore
	}

	throw new Error(
		"No company ID configured. Set TIIME_COMPANY_ID env var, pass companyId option, or run `tiime company use --id <ID>`.",
	);
};

export class TokenManager {
	private tokens: AuthTokens | null = null;
	private credentials: Credentials | null = null;
	private persist: boolean;

	/**
	 * @param options.tokens - Use these tokens directly (no disk I/O)
	 * @param options.email - Login with these credentials
	 * @param options.password - Login with these credentials
	 * @param options.persist - Save tokens/credentials to disk (default: true when no explicit auth)
	 */
	constructor(
		options: {
			tokens?: AuthTokens;
			email?: string;
			password?: string;
			persist?: boolean;
		} = {},
	) {
		const hasExplicitAuth =
			options.tokens || (options.email && options.password);
		this.persist = options.persist ?? !hasExplicitAuth;

		if (options.tokens) {
			this.tokens = options.tokens;
			return;
		}

		if (options.email && options.password) {
			this.credentials = { email: options.email, password: options.password };
			return;
		}

		// Check env vars: TIIME_ACCESS_TOKEN or TIIME_EMAIL + TIIME_PASSWORD
		const envToken = process.env.TIIME_ACCESS_TOKEN;
		if (envToken) {
			this.tokens = {
				access_token: envToken,
				// No expiry info from env — assume valid, never auto-refresh
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

		// Fallback: load from disk (CLI compat)
		this.loadFromDisk();
	}

	async login(email: string, password: string): Promise<AuthTokens> {
		const response = await ofetch<{
			access_token: string;
			expires_in: number;
			token_type: string;
		}>(`https://${AUTH0_DOMAIN}/oauth/token`, {
			method: "POST",
			body: {
				grant_type: "password",
				client_id: AUTH0_CLIENT_ID,
				audience: AUTH0_AUDIENCE,
				scope: "openid email",
				username: email,
				password: password,
			},
		});

		this.tokens = {
			access_token: response.access_token,
			expires_at: Date.now() + response.expires_in * 1000,
		};

		if (this.persist) {
			this.saveToDisk();
			saveCredentials(email, password);
		}
		return this.tokens;
	}

	async getValidToken(): Promise<string> {
		if (!this.tokens || this.isExpired()) {
			// Try explicit credentials first, then stored credentials
			const creds = this.credentials ?? loadCredentials();
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
		if (existsSync(AUTH_FILE)) {
			writeFileSync(AUTH_FILE, "{}");
		}
	}

	getTokenInfo(): { email: string | null; expiresAt: Date | null } {
		if (!this.tokens) {
			return { email: null, expiresAt: null };
		}

		// Decode JWT payload to get email
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
		// Add 60s buffer
		return Date.now() >= this.tokens.expires_at - 60_000;
	}

	private loadFromDisk(): void {
		try {
			if (existsSync(AUTH_FILE)) {
				const data = JSON.parse(readFileSync(AUTH_FILE, "utf-8"));
				if (data.access_token && data.expires_at) {
					this.tokens = data;
				}
			}
		} catch {
			// Ignore read errors
		}
	}

	private saveToDisk(): void {
		if (!existsSync(CONFIG_DIR)) {
			mkdirSync(CONFIG_DIR, { recursive: true });
		}
		writeFileSync(AUTH_FILE, JSON.stringify(this.tokens, null, 2));
	}
}
