import { beforeEach, describe, expect, it, vi } from "vitest";
import { LabelsResource } from "../src/resources/labels";

const COMPANY_ID = 42;

describe("LabelsResource", () => {
	const mockFetch = vi.fn();
	let resource: LabelsResource;

	beforeEach(() => {
		mockFetch.mockReset();
		resource = new LabelsResource(mockFetch as never, COMPANY_ID);
	});

	describe("list()", () => {
		it("should call correct endpoint with Accept header", async () => {
			mockFetch.mockResolvedValueOnce([]);
			await resource.list();
			expect(mockFetch).toHaveBeenCalledWith(
				`/companies/${COMPANY_ID}/labels`,
				{
					headers: {
						Accept: "application/vnd.tiime.labels.v2+json",
					},
				},
			);
		});
	});

	describe("standard()", () => {
		it("should call correct endpoint", async () => {
			mockFetch.mockResolvedValueOnce([]);
			await resource.standard();
			expect(mockFetch).toHaveBeenCalledWith(
				`/companies/${COMPANY_ID}/standard_labels`,
			);
		});
	});

	describe("tags()", () => {
		it("should call correct endpoint with expand query", async () => {
			mockFetch.mockResolvedValueOnce([]);
			await resource.tags();
			expect(mockFetch).toHaveBeenCalledWith(
				`/companies/${COMPANY_ID}/tags`,
				{ query: { expand: "tag_detail" } },
			);
		});
	});
});
