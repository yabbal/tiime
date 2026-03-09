import { ClientsResource } from "../src/resources/clients";

describe("ClientsResource", () => {
	const mockFetch = vi.fn();
	const resource = new ClientsResource(mockFetch as any, 123);

	beforeEach(() => {
		mockFetch.mockReset();
	});

	it("list() calls correct endpoint with headers", async () => {
		mockFetch.mockResolvedValue([]);
		await resource.list();
		expect(mockFetch).toHaveBeenCalledWith("/companies/123/clients", {
			query: undefined,
			headers: {
				Accept: "application/vnd.tiime.timeline.v2+json",
				Range: "items=0-*",
			},
		});
	});

	it("list() passes archived param in query", async () => {
		mockFetch.mockResolvedValue([]);
		await resource.list({ archived: true });
		expect(mockFetch).toHaveBeenCalledWith("/companies/123/clients", {
			query: { archived: true },
			headers: {
				Accept: "application/vnd.tiime.timeline.v2+json",
				Range: "items=0-*",
			},
		});
	});

	it("get() calls correct endpoint with ID", async () => {
		mockFetch.mockResolvedValue({ id: 42, name: "Test" });
		await resource.get(42);
		expect(mockFetch).toHaveBeenCalledWith("/companies/123/clients/42");
	});

	it("create() sends POST with body", async () => {
		mockFetch.mockResolvedValue({ id: 1, name: "New" });
		await resource.create({ name: "New Client" });
		expect(mockFetch).toHaveBeenCalledWith("/companies/123/clients", {
			method: "POST",
			body: { name: "New Client" },
		});
	});

	it("search() passes query and headers", async () => {
		mockFetch.mockResolvedValue([]);
		await resource.search("acme");
		expect(mockFetch).toHaveBeenCalledWith("/companies/123/clients", {
			query: { search: "acme" },
			headers: {
				Accept: "application/vnd.tiime.timeline.v2+json",
				Range: "items=0-*",
			},
		});
	});
});
