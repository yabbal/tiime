import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentsResource } from "../src/resources/documents";

describe("DocumentsResource", () => {
	const mockFetch = vi.fn();
	const resource = new DocumentsResource(mockFetch as never, 123);

	beforeEach(() => mockFetch.mockReset());

	it("list() calls correct endpoint with default params", async () => {
		mockFetch.mockResolvedValue([]);
		await resource.list();
		expect(mockFetch).toHaveBeenCalledWith("companies/123/documents", {
			query: {
				sorts: "created_at:desc",
				expand: "file_family,preview_available",
			},
			headers: {
				Accept:
					"application/vnd.tiime.documents.v2+json,application/vnd.tiime.docs.query+json,application/vnd.tiime.docs.imputation+json",
				Range: "items=0-25",
			},
		});
	});

	it("list() passes type filter", async () => {
		mockFetch.mockResolvedValue([]);
		await resource.list({ types: "receipt" });
		expect(mockFetch).toHaveBeenCalledWith(
			"companies/123/documents",
			expect.objectContaining({
				query: expect.objectContaining({
					types: "receipt",
					sorts: "created_at:desc",
					expand: "file_family,preview_available",
				}),
			}),
		);
	});

	it("list() computes Range header from page and pageSize", async () => {
		mockFetch.mockResolvedValue([]);
		await resource.list({ page: 2, pageSize: 10 });
		expect(mockFetch).toHaveBeenCalledWith(
			"companies/123/documents",
			expect.objectContaining({
				headers: expect.objectContaining({
					Range: "items=10-20",
				}),
			}),
		);
	});

	it("categories() calls correct endpoint with Accept header", async () => {
		mockFetch.mockResolvedValue([]);
		await resource.categories();
		expect(mockFetch).toHaveBeenCalledWith(
			"companies/123/document_categories",
			{
				headers: {
					Accept: "application/vnd.tiime.documents.v3+json",
				},
			},
		);
	});

	it("download() calls correct endpoint with octet-stream Accept", async () => {
		mockFetch.mockResolvedValue(new ArrayBuffer(8));
		await resource.download(42);
		expect(mockFetch).toHaveBeenCalledWith(
			"companies/123/documents/42/download",
			{
				headers: { Accept: "application/octet-stream" },
			},
		);
	});

	it("preview() calls correct endpoint", async () => {
		mockFetch.mockResolvedValue({});
		await resource.preview(42);
		expect(mockFetch).toHaveBeenCalledWith(
			"companies/123/documents/42/preview",
		);
	});

	it("upload() sends FormData with file and type", async () => {
		mockFetch.mockResolvedValue({ id: 1 });
		const file = new Uint8Array([1, 2, 3]);
		await resource.upload(file, "test.pdf", "receipt");

		expect(mockFetch).toHaveBeenCalledWith(
			"companies/123/documents",
			expect.objectContaining({
				method: "POST",
			}),
		);
		const body = mockFetch.mock.calls[0][1].body as FormData;
		expect(body).toBeInstanceOf(FormData);
		expect(body.get("file")).toBeInstanceOf(Blob);
		expect(body.get("type")).toBe("receipt");
	});

	it("upload() works without type and does not append type field", async () => {
		mockFetch.mockResolvedValue({ id: 2 });
		const file = new Uint8Array([4, 5, 6]);
		await resource.upload(file, "invoice.pdf");

		expect(mockFetch).toHaveBeenCalledWith(
			"companies/123/documents",
			expect.objectContaining({ method: "POST" }),
		);
		const body = mockFetch.mock.calls[0][1].body as FormData;
		expect(body).toBeInstanceOf(FormData);
		expect(body.get("file")).toBeInstanceOf(Blob);
		expect(body.get("type")).toBeNull();
	});

	it("searchMatchable() calls correct endpoint with matchable query", async () => {
		mockFetch.mockResolvedValue([]);
		await resource.searchMatchable("facture");

		expect(mockFetch).toHaveBeenCalledWith("companies/123/documents", {
			query: { matchable: true, q: "facture" },
			headers: {
				Accept:
					"application/vnd.tiime.documents.v3+json,application/vnd.tiime.docs.imputation+json",
				Range: "items=0-25",
			},
		});
	});
});
