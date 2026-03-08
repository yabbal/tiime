import { describe, expect, it } from "vitest";
import { TiimeError } from "../../src/sdk/errors";

describe("TiimeError", () => {
	it("should be an instance of Error", () => {
		const error = new TiimeError("Not found", 404, "/invoices/1");
		expect(error).toBeInstanceOf(Error);
	});

	it("should have name set to 'TiimeError'", () => {
		const error = new TiimeError("Not found", 404, "/invoices/1");
		expect(error.name).toBe("TiimeError");
	});

	it("should expose message, status, endpoint, and details", () => {
		const error = new TiimeError("Not found", 404, "/invoices/1", {
			id: 1,
		});
		expect(error.message).toBe("Not found");
		expect(error.status).toBe(404);
		expect(error.endpoint).toBe("/invoices/1");
		expect(error.details).toEqual({ id: 1 });
	});

	it("should return correct JSON via toJSON()", () => {
		const error = new TiimeError("Not found", 404, "/invoices/1", {
			id: 1,
		});
		expect(error.toJSON()).toEqual({
			error: "TiimeError",
			message: "Not found",
			status: 404,
			endpoint: "/invoices/1",
			details: { id: 1 },
		});
	});

	it("should handle undefined details in toJSON()", () => {
		const error = new TiimeError("Server error", 500, "/companies");
		expect(error.toJSON()).toEqual({
			error: "TiimeError",
			message: "Server error",
			status: 500,
			endpoint: "/companies",
			details: undefined,
		});
	});

	it("should have accessible message via inherited Error property", () => {
		const error = new TiimeError("Bad request", 400, "/test");
		expect(error.message).toBe("Bad request");
		expect(String(error)).toContain("Bad request");
	});
});
