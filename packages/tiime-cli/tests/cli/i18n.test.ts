import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getLang, translateHelp } from "../../src/cli/i18n";

describe("getLang()", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = { ...originalEnv };
		// Clear all relevant vars
		delete process.env.TIIME_LANG;
		delete process.env.LC_ALL;
		delete process.env.LC_MESSAGES;
		delete process.env.LANG;
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("should return TIIME_LANG when set", () => {
		process.env.TIIME_LANG = "en";
		expect(getLang()).toBe("en");
	});

	it("should detect French from LC_ALL", () => {
		process.env.LC_ALL = "fr_FR.UTF-8";
		expect(getLang()).toBe("fr");
	});

	it("should detect French from LC_MESSAGES when LC_ALL is absent", () => {
		process.env.LC_MESSAGES = "fr_FR.UTF-8";
		expect(getLang()).toBe("fr");
	});

	it("should detect English from LANG", () => {
		process.env.LANG = "en_US.UTF-8";
		expect(getLang()).toBe("en");
	});

	it("should default to 'fr' when no variables are set", () => {
		expect(getLang()).toBe("fr");
	});

	it("should prioritize TIIME_LANG over LC_ALL", () => {
		process.env.TIIME_LANG = "en";
		process.env.LC_ALL = "fr_FR.UTF-8";
		expect(getLang()).toBe("en");
	});
});

describe("translateHelp()", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = { ...originalEnv };
		delete process.env.TIIME_LANG;
		delete process.env.LC_ALL;
		delete process.env.LC_MESSAGES;
		delete process.env.LANG;
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("should not translate description strings for French", () => {
		process.env.TIIME_LANG = "fr";
		const text = "Gestion des factures";
		expect(translateHelp(text)).toBe(text);
	});

	it("should translate French descriptions to English", () => {
		process.env.TIIME_LANG = "en";
		expect(translateHelp("Gestion des factures")).toBe("Invoice management");
		expect(translateHelp("Gestion des clients")).toBe("Client management");
		expect(translateHelp("Lister les factures")).toBe("List invoices");
	});

	it("should return text unchanged when no translation match", () => {
		process.env.TIIME_LANG = "en";
		const text = "Something with no translation";
		expect(translateHelp(text)).toBe(text);
	});

	it("should translate framework strings for French", () => {
		process.env.TIIME_LANG = "fr";
		expect(translateHelp("USAGE")).toBe("UTILISATION");
		expect(translateHelp("COMMANDS")).toBe("COMMANDES");
		expect(translateHelp("OPTIONS")).toBe("OPTIONS");
	});

	it("should handle a realistic multi-line help block", () => {
		process.env.TIIME_LANG = "en";
		const helpText =
			"Gestion des factures\n  Lister les factures\n  Détails d'une facture";
		const result = translateHelp(helpText);
		expect(result).toContain("Invoice management");
		expect(result).toContain("List invoices");
		expect(result).toContain("Invoice details");
	});
});
