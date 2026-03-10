import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
	type AuthTokens,
	type CredentialStorage,
	TiimeClient,
	TokenManager,
	type TokenStorage,
} from "tiime-sdk";

const CONFIG_DIR = join(
	process.env.XDG_CONFIG_HOME || join(homedir(), ".config"),
	"tiime",
);
const AUTH_FILE = join(CONFIG_DIR, "auth.json");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");
const KEYCHAIN_ACCOUNT = "tiime-cli";
const KEYCHAIN_SERVICE = "tiime-credentials";

export interface CliConfig {
	companyId?: number;
}

const ensureConfigDir = () => {
	if (!existsSync(CONFIG_DIR)) {
		mkdirSync(CONFIG_DIR, { recursive: true });
	}
};

export const loadConfig = (): CliConfig => {
	try {
		if (existsSync(CONFIG_FILE)) {
			return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
		}
	} catch {
		// Ignore
	}
	return {};
};

export const saveConfig = (config: CliConfig): void => {
	ensureConfigDir();
	writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
};

export const getCompanyId = (): number => {
	const envId = process.env.TIIME_COMPANY_ID;
	if (envId) {
		const parsed = Number.parseInt(envId, 10);
		if (!Number.isNaN(parsed)) return parsed;
	}

	const config = loadConfig();
	if (!config.companyId) {
		throw new Error(
			"Aucune entreprise configurée. Exécutez `tiime company use <id>` d'abord.",
		);
	}
	return config.companyId;
};

// --- Token persistence ---

export const tokenStorage: TokenStorage = {
	load() {
		try {
			if (existsSync(AUTH_FILE)) {
				const data = JSON.parse(readFileSync(AUTH_FILE, "utf-8"));
				if (data.access_token && data.expires_at) return data;
			}
		} catch {
			// Ignore
		}
		return null;
	},
	save(tokens: AuthTokens) {
		ensureConfigDir();
		writeFileSync(AUTH_FILE, JSON.stringify(tokens, null, 2));
	},
	clear() {
		if (existsSync(AUTH_FILE)) {
			writeFileSync(AUTH_FILE, "{}");
		}
	},
};

// --- Credential persistence (keychain + file fallback) ---

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
	ensureConfigDir();
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

export const credentialStorage: CredentialStorage = {
	load() {
		return loadCredentialsFromKeychain() ?? loadCredentialsFromFile();
	},
	save(email: string, password: string) {
		if (!saveCredentialsToKeychain(email, password)) {
			saveCredentialsToFile(email, password);
		}
	},
};

// --- Helpers ---

export const createTokenManager = (
	options: { tokens?: AuthTokens; email?: string; password?: string } = {},
) =>
	new TokenManager({
		...options,
		tokenStorage,
		credentialStorage,
	});

export const createClient = (companyId: number) =>
	new TiimeClient({
		companyId,
		tokenManager: createTokenManager(),
	});
