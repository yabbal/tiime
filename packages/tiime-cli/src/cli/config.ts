import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_DIR = join(homedir(), ".config", "tiime");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export interface CliConfig {
	companyId?: number;
}

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
	if (!existsSync(CONFIG_DIR)) {
		mkdirSync(CONFIG_DIR, { recursive: true });
	}
	writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
};

export const getCompanyId = (): number => {
	const config = loadConfig();
	if (!config.companyId) {
		throw new Error(
			"Aucune entreprise configurée. Exécutez `tiime company use <id>` d'abord.",
		);
	}
	return config.companyId;
};
