import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsersResource } from "../src/resources/users";

describe("UsersResource", () => {
	const mockFetch = vi.fn();
	let resource: UsersResource;

	beforeEach(() => {
		mockFetch.mockReset();
		resource = new UsersResource(mockFetch as never);
	});

	describe("me()", () => {
		it("should call /users/me without companyId", async () => {
			mockFetch.mockResolvedValueOnce({});
			await resource.me();
			expect(mockFetch).toHaveBeenCalledWith("users/me");
		});
	});

	describe("legalInformations()", () => {
		it("should call correct endpoint", async () => {
			mockFetch.mockResolvedValueOnce({});
			await resource.legalInformations();
			expect(mockFetch).toHaveBeenCalledWith("users/me/legal_informations");
		});
	});

	describe("settings()", () => {
		it("should include companyId in URL", async () => {
			mockFetch.mockResolvedValueOnce({});
			await resource.settings(50824);
			expect(mockFetch).toHaveBeenCalledWith(
				"users/me/companies/50824/settings",
			);
		});
	});
});
