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

export class TokenManager {
	private tokens: AuthTokens | null = null;

	constructor() {
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

		this.saveToDisk();
		saveCredentials(email, password);
		return this.tokens;
	}

	async getValidToken(): Promise<string> {
		if (!this.tokens || this.isExpired()) {
			const creds = loadCredentials();
			if (creds) {
				const tokens = await this.login(creds.email, creds.password);
				return tokens.access_token;
			}
			throw new Error(
				this.tokens
					? "Token expired. Run `tiime auth login` to re-authenticate."
					: "Not authenticated. Run `tiime auth login` first.",
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
