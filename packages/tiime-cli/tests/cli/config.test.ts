import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs", () => ({
	existsSync: vi.fn(),
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

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
	createClient,
	createTokenManager,
	credentialStorage,
	getCompanyId,
	loadConfig,
	saveConfig,
	tokenStorage,
} from "../../src/cli/config";

const CONFIG_DIR = "/tmp/test-home/.config/tiime";
const CONFIG_FILE = `${CONFIG_DIR}/config.json`;

describe("loadConfig()", () => {
	beforeEach(() => {
		vi.mocked(existsSync).mockReset();
		vi.mocked(readFileSync).mockReset();
	});

	it("should return parsed JSON when file exists", () => {
		vi.mocked(existsSync).mockReturnValue(true);
		vi.mocked(readFileSync).mockReturnValue('{"companyId": 123}');

		const config = loadConfig();

		expect(config).toEqual({ companyId: 123 });
		expect(readFileSync).toHaveBeenCalledWith(CONFIG_FILE, "utf-8");
	});

	it("should return {} when file does not exist", () => {
		vi.mocked(existsSync).mockReturnValue(false);

		const config = loadConfig();

		expect(config).toEqual({});
	});

	it("should return {} when file contains invalid JSON", () => {
		vi.mocked(existsSync).mockReturnValue(true);
		vi.mocked(readFileSync).mockReturnValue("not valid json{{{");

		const config = loadConfig();

		expect(config).toEqual({});
	});
});

describe("saveConfig()", () => {
	beforeEach(() => {
		vi.mocked(existsSync).mockReset();
		vi.mocked(writeFileSync).mockReset();
		vi.mocked(mkdirSync).mockReset();
	});

	it("should write JSON when directory exists", () => {
		vi.mocked(existsSync).mockReturnValue(true);

		saveConfig({ companyId: 456 });

		expect(writeFileSync).toHaveBeenCalledWith(
			CONFIG_FILE,
			JSON.stringify({ companyId: 456 }, null, 2),
		);
		expect(mkdirSync).not.toHaveBeenCalled();
	});

	it("should create directory when it does not exist", () => {
		vi.mocked(existsSync).mockReturnValue(false);

		saveConfig({ companyId: 789 });

		expect(mkdirSync).toHaveBeenCalledWith(CONFIG_DIR, { recursive: true });
		expect(writeFileSync).toHaveBeenCalled();
	});
});

describe("getCompanyId()", () => {
	beforeEach(() => {
		vi.mocked(existsSync).mockReset();
		vi.mocked(readFileSync).mockReset();
	});

	it("should return companyId when present in config", () => {
		vi.mocked(existsSync).mockReturnValue(true);
		vi.mocked(readFileSync).mockReturnValue('{"companyId": 50824}');

		expect(getCompanyId()).toBe(50824);
	});

	it("should throw when companyId is not in config", () => {
		vi.mocked(existsSync).mockReturnValue(true);
		vi.mocked(readFileSync).mockReturnValue("{}");

		expect(() => getCompanyId()).toThrow();
	});

	it("should prefer TIIME_COMPANY_ID env variable", () => {
		const original = process.env.TIIME_COMPANY_ID;
		process.env.TIIME_COMPANY_ID = "99999";

		expect(getCompanyId()).toBe(99999);

		if (original !== undefined) {
			process.env.TIIME_COMPANY_ID = original;
		} else {
			delete process.env.TIIME_COMPANY_ID;
		}
	});

	it("should ignore invalid env variable and use config", () => {
		const original = process.env.TIIME_COMPANY_ID;
		process.env.TIIME_COMPANY_ID = "not-a-number";
		vi.mocked(existsSync).mockReturnValue(true);
		vi.mocked(readFileSync).mockReturnValue('{"companyId": 42}');

		expect(getCompanyId()).toBe(42);

		if (original !== undefined) {
			process.env.TIIME_COMPANY_ID = original;
		} else {
			delete process.env.TIIME_COMPANY_ID;
		}
	});
});

describe("tokenStorage", () => {
	beforeEach(() => {
		vi.mocked(existsSync).mockReset();
		vi.mocked(readFileSync).mockReset();
		vi.mocked(writeFileSync).mockReset();
		vi.mocked(mkdirSync).mockReset();
	});

	it("load() returns tokens when auth file exists and is valid", () => {
		vi.mocked(existsSync).mockReturnValue(true);
		vi.mocked(readFileSync).mockReturnValue(
			JSON.stringify({ access_token: "tok", expires_at: 999 }),
		);

		const result = tokenStorage.load();
		expect(result).toEqual({ access_token: "tok", expires_at: 999 });
	});

	it("load() returns null when file does not exist", () => {
		vi.mocked(existsSync).mockReturnValue(false);

		expect(tokenStorage.load()).toBeNull();
	});

	it("load() returns null when file has invalid JSON", () => {
		vi.mocked(existsSync).mockReturnValue(true);
		vi.mocked(readFileSync).mockReturnValue("not json");

		expect(tokenStorage.load()).toBeNull();
	});

	it("load() returns null when file has incomplete tokens", () => {
		vi.mocked(existsSync).mockReturnValue(true);
		vi.mocked(readFileSync).mockReturnValue(
			JSON.stringify({ access_token: "tok" }),
		);

		expect(tokenStorage.load()).toBeNull();
	});

	it("save() writes tokens to auth file", () => {
		vi.mocked(existsSync).mockReturnValue(true);

		const tokens = { access_token: "tok", expires_at: 999 };
		tokenStorage.save(tokens);

		expect(writeFileSync).toHaveBeenCalledWith(
			expect.stringContaining("auth.json"),
			JSON.stringify(tokens, null, 2),
		);
	});

	it("clear() writes empty object to auth file when it exists", () => {
		vi.mocked(existsSync).mockReturnValue(true);

		tokenStorage.clear();

		expect(writeFileSync).toHaveBeenCalledWith(
			expect.stringContaining("auth.json"),
			"{}",
		);
	});

	it("clear() does nothing when auth file does not exist", () => {
		vi.mocked(existsSync).mockReturnValue(false);

		tokenStorage.clear();

		expect(writeFileSync).not.toHaveBeenCalled();
	});
});

describe("credentialStorage", () => {
	beforeEach(() => {
		vi.mocked(existsSync).mockReset();
		vi.mocked(readFileSync).mockReset();
		vi.mocked(writeFileSync).mockReset();
		vi.mocked(mkdirSync).mockReset();
		vi.mocked(execSync).mockReset();
	});

	it("load() falls back to file when keychain fails", () => {
		vi.mocked(execSync).mockImplementation(() => {
			throw new Error("no keychain");
		});
		vi.mocked(existsSync).mockReturnValue(true);
		vi.mocked(readFileSync).mockReturnValue(
			JSON.stringify({ email: "a@b.com", password: "pass" }),
		);

		const result = credentialStorage.load();
		expect(result).toEqual({ email: "a@b.com", password: "pass" });
	});

	it("load() returns null when both keychain and file fail", () => {
		vi.mocked(execSync).mockImplementation(() => {
			throw new Error("no keychain");
		});
		vi.mocked(existsSync).mockReturnValue(false);

		expect(credentialStorage.load()).toBeNull();
	});

	it("save() falls back to file when keychain save fails", () => {
		vi.mocked(execSync).mockImplementation(() => {
			throw new Error("no keychain");
		});
		vi.mocked(existsSync).mockReturnValue(true);

		credentialStorage.save("a@b.com", "pass");

		expect(writeFileSync).toHaveBeenCalledWith(
			expect.stringContaining("credentials.json"),
			JSON.stringify({ email: "a@b.com", password: "pass" }, null, 2),
			{ mode: 0o600 },
		);
	});
});

describe("createTokenManager()", () => {
	it("returns a TokenManager instance", () => {
		vi.mocked(existsSync).mockReturnValue(false);
		const tm = createTokenManager();
		expect(tm).toBeDefined();
		expect(typeof tm.isAuthenticated).toBe("function");
	});
});

describe("createClient()", () => {
	it("returns a TiimeClient instance", () => {
		vi.mocked(existsSync).mockReturnValue(false);
		const client = createClient(123);
		expect(client).toBeDefined();
		expect(client.companyId).toBe(123);
	});
});
