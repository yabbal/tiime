import { DocumentsResource } from "../src/resources/documents";

describe("DocumentsResource", () => {
	const mockFetch = vi.fn();
	const resource = new DocumentsResource(mockFetch as any, 123);

	beforeEach(() => mockFetch.mockReset());

	it("list() calls correct endpoint with default params", async () => {
		mockFetch.mockResolvedValue([]);
		await resource.list();
		expect(mockFetch).toHaveBeenCalledWith("/companies/123/documents", {
			query: {
				sorts: "created_at:desc",
				expand: "file_family,preview_available",
			},
			headers: {
				Accept: "application/vnd.tiime.documents.v2+json,application/vnd.tiime.docs.query+json,application/vnd.tiime.docs.imputation+json",
				Range: "items=0-25",
			},
		});
	});

	it("list() passes type filter", async () => {
		mockFetch.mockResolvedValue([]);
		await resource.list({ types: "receipt" });
		expect(mockFetch).toHaveBeenCalledWith(
			"/companies/123/documents",
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
			"/companies/123/documents",
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
			"/companies/123/document_categories",
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
			"/companies/123/documents/42/download",
			{
				headers: { Accept: "application/octet-stream" },
			},
		);
	});
});
