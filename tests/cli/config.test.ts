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

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { getCompanyId, loadConfig, saveConfig } from "../../src/cli/config";

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
});
