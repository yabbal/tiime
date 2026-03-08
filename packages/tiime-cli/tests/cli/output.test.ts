import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { output } from "../../src/cli/output";

describe("output()", () => {
	let writeSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
	});

	afterEach(() => {
		writeSpy.mockRestore();
	});

	describe("json format", () => {
		it("should output pretty-printed JSON by default", () => {
			const data = { id: 1, name: "Test" };
			output(data);

			expect(writeSpy).toHaveBeenCalledWith(
				`${JSON.stringify(data, null, 2)}\n`,
			);
		});

		it("should output JSON when format is explicitly json", () => {
			const data = [1, 2, 3];
			output(data, { format: "json" });

			expect(writeSpy).toHaveBeenCalledWith(
				`${JSON.stringify(data, null, 2)}\n`,
			);
		});

		it("should handle null and undefined values", () => {
			output(null);
			expect(writeSpy).toHaveBeenCalledWith(
				`${JSON.stringify(null, null, 2)}\n`,
			);
		});
	});

	describe("table format", () => {
		it("should output a table for an array of objects", () => {
			const data = [
				{ id: 1, name: "Alice" },
				{ id: 2, name: "Bob" },
			];
			output(data, { format: "table" });

			const written = writeSpy.mock.calls[0][0] as string;
			// cli-table3 renders ASCII table with borders
			expect(written).toContain("id");
			expect(written).toContain("name");
			expect(written).toContain("Alice");
			expect(written).toContain("Bob");
		});

		it("should output a key-value table for a single object", () => {
			const data = { id: 1, status: "active" };
			output(data, { format: "table" });

			const written = writeSpy.mock.calls[0][0] as string;
			expect(written).toContain("id");
			expect(written).toContain("status");
			expect(written).toContain("active");
		});

		it("should fall back to JSON for non-object data", () => {
			output("hello", { format: "table" });
			expect(writeSpy).toHaveBeenCalledWith(
				`${JSON.stringify("hello", null, 2)}\n`,
			);
		});
	});

	describe("csv format", () => {
		it("should output CSV with header for an array of objects", () => {
			const data = [
				{ id: 1, name: "Alice" },
				{ id: 2, name: "Bob" },
			];
			output(data, { format: "csv" });

			const written = writeSpy.mock.calls[0][0] as string;
			const lines = written.trim().split("\n");
			expect(lines[0]).toBe("id,name");
			expect(lines[1]).toBe("1,Alice");
			expect(lines[2]).toBe("2,Bob");
		});

		it("should output key,value CSV for a single object", () => {
			const data = { id: 1, status: "draft" };
			output(data, { format: "csv" });

			const written = writeSpy.mock.calls[0][0] as string;
			const lines = written.trim().split("\n");
			expect(lines[0]).toBe("key,value");
			expect(lines[1]).toBe("id,1");
			expect(lines[2]).toBe("status,draft");
		});

		it("should escape fields containing commas", () => {
			const data = [{ desc: "hello, world" }];
			output(data, { format: "csv" });

			const written = writeSpy.mock.calls[0][0] as string;
			expect(written).toContain('"hello, world"');
		});

		it("should escape fields containing double quotes", () => {
			const data = [{ desc: 'say "hi"' }];
			output(data, { format: "csv" });

			const written = writeSpy.mock.calls[0][0] as string;
			expect(written).toContain('"say ""hi"""');
		});

		it("should fall back to JSON for non-object data", () => {
			output(42, { format: "csv" });
			expect(writeSpy).toHaveBeenCalledWith(`${JSON.stringify(42, null, 2)}\n`);
		});
	});
});
