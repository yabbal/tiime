import { beforeEach, describe, expect, it, vi } from "vitest";

// Define __VERSION__ global before importing the command
vi.stubGlobal("__VERSION__", "1.2.3");

let stdoutData: string;

beforeEach(() => {
	stdoutData = "";

	vi.spyOn(process.stdout, "write").mockImplementation(
		(chunk: string | Uint8Array) => {
			stdoutData += String(chunk);
			return true;
		},
	);
});

const parseStdout = () => JSON.parse(stdoutData.trim());

describe("version command", () => {
	it("outputs version and node version", async () => {
		const { versionCommand } = await import("../../src/cli/commands/version");
		await versionCommand.run?.({
			args: {} as any,
			rawArgs: [],
			cmd: versionCommand,
		});

		const result = parseStdout();
		expect(result.version).toBe("1.2.3");
		expect(result.node).toBe(process.version);
	});
});
