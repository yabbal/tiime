import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFetch, fetchJson } from "../src/fetch";

const mockFetch =
	vi.fn<
		(input: string | URL | Request, init?: RequestInit) => Promise<Response>
	>();

beforeEach(() => {
	mockFetch.mockReset();
	vi.stubGlobal("fetch", mockFetch);
});

const jsonResponse = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});

const vndJsonResponse = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/vnd.tiime.test+json" },
	});

const noContentResponse = () => new Response(null, { status: 204 });

const binaryResponse = () =>
	new Response(new ArrayBuffer(8), {
		status: 200,
		headers: { "content-type": "application/octet-stream" },
	});

describe("createFetch", () => {
	describe("URL building", () => {
		it("builds URL from baseURL and path", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
			const f = createFetch({ baseURL: "https://api.test.com/v1/" });

			await f("items");

			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.test.com/v1/items",
				expect.anything(),
			);
		});

		it("appends trailing slash to baseURL if missing", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse({}));
			const f = createFetch({ baseURL: "https://api.test.com/v1" });

			await f("items");

			const calledUrl = mockFetch.mock.calls[0][0] as string;
			expect(calledUrl).toBe("https://api.test.com/v1/items");
		});

		it("adds query parameters to URL", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse([]));
			const f = createFetch({ baseURL: "https://api.test.com/v1/" });

			await f("items", { query: { page: 1, search: "test" } });

			const calledUrl = mockFetch.mock.calls[0][0] as string;
			expect(calledUrl).toContain("page=1");
			expect(calledUrl).toContain("search=test");
		});

		it("skips null/undefined query values", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse([]));
			const f = createFetch({ baseURL: "https://api.test.com/v1/" });

			await f("items", { query: { a: "ok", b: null, c: undefined } });

			const calledUrl = mockFetch.mock.calls[0][0] as string;
			expect(calledUrl).toContain("a=ok");
			expect(calledUrl).not.toContain("b=");
			expect(calledUrl).not.toContain("c=");
		});
	});

	describe("headers", () => {
		it("merges config headers with request headers", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse({}));
			const f = createFetch({
				baseURL: "https://api.test.com/",
				headers: { Authorization: "Bearer token" },
			});

			await f("items", { headers: { Accept: "application/json" } });

			const init = mockFetch.mock.calls[0][1] as RequestInit;
			const headers = init.headers as Headers;
			expect(headers.get("Authorization")).toBe("Bearer token");
			expect(headers.get("Accept")).toBe("application/json");
		});

		it("request headers override config headers", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse({}));
			const f = createFetch({
				baseURL: "https://api.test.com/",
				headers: { Accept: "text/plain" },
			});

			await f("items", { headers: { Accept: "application/json" } });

			const init = mockFetch.mock.calls[0][1] as RequestInit;
			const headers = init.headers as Headers;
			expect(headers.get("Accept")).toBe("application/json");
		});
	});

	describe("request body", () => {
		it("JSON-serializes body and sets Content-Type", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse({}));
			const f = createFetch({ baseURL: "https://api.test.com/" });

			await f("items", { method: "POST", body: { name: "test" } });

			const init = mockFetch.mock.calls[0][1] as RequestInit;
			expect(init.body).toBe('{"name":"test"}');
			const headers = init.headers as Headers;
			expect(headers.get("Content-Type")).toBe("application/json");
		});

		it("passes FormData body directly without Content-Type", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse({}));
			const f = createFetch({ baseURL: "https://api.test.com/" });
			const formData = new FormData();
			formData.append("file", "data");

			await f("upload", { method: "POST", body: formData });

			const init = mockFetch.mock.calls[0][1] as RequestInit;
			expect(init.body).toBe(formData);
			const headers = init.headers as Headers;
			expect(headers.get("Content-Type")).toBeNull();
		});
	});

	describe("onRequest hook", () => {
		it("calls onRequest before fetch", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse({}));
			const onRequest = vi.fn();
			const f = createFetch({
				baseURL: "https://api.test.com/",
				onRequest,
			});

			await f("items");

			expect(onRequest).toHaveBeenCalledTimes(1);
			expect(onRequest).toHaveBeenCalledWith({
				options: { headers: expect.any(Headers) },
			});
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});
	});

	describe("response parsing", () => {
		it("returns parsed JSON for application/json", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1 }));
			const f = createFetch({ baseURL: "https://api.test.com/" });

			const result = await f("items/1");

			expect(result).toEqual({ id: 1 });
		});

		it("returns parsed JSON for vnd+json content types", async () => {
			mockFetch.mockResolvedValueOnce(vndJsonResponse([{ id: 1 }]));
			const f = createFetch({ baseURL: "https://api.test.com/" });

			const result = await f("items");

			expect(result).toEqual([{ id: 1 }]);
		});

		it("returns undefined for 204 No Content", async () => {
			mockFetch.mockResolvedValueOnce(noContentResponse());
			const f = createFetch({ baseURL: "https://api.test.com/" });

			const result = await f("items/1", { method: "DELETE" });

			expect(result).toBeUndefined();
		});

		it("returns ArrayBuffer for non-JSON content", async () => {
			mockFetch.mockResolvedValueOnce(binaryResponse());
			const f = createFetch({ baseURL: "https://api.test.com/" });

			const result = await f("files/1");

			expect(result).toBeInstanceOf(ArrayBuffer);
		});
	});

	describe("onResponseError hook", () => {
		it("calls onResponseError for non-ok responses and still returns parsed body", async () => {
			const errorBody = { error: "not found" };
			mockFetch.mockResolvedValueOnce(
				new Response(JSON.stringify(errorBody), {
					status: 404,
					headers: { "content-type": "application/json" },
				}),
			);
			const onResponseError = vi.fn();
			const f = createFetch({
				baseURL: "https://api.test.com/",
				onResponseError,
			});

			const result = await f("items/999");

			expect(onResponseError).toHaveBeenCalledTimes(1);
			expect(onResponseError).toHaveBeenCalledWith({
				request: expect.stringContaining("items/999"),
				response: expect.objectContaining({
					status: 404,
					_data: errorBody,
				}),
			});
			expect(result).toEqual(errorBody);
		});

		it("handles non-JSON error body gracefully", async () => {
			mockFetch.mockResolvedValueOnce(
				new Response("Internal Server Error", {
					status: 500,
					headers: { "content-type": "text/plain" },
				}),
			);
			const onResponseError = vi.fn();
			const f = createFetch({
				baseURL: "https://api.test.com/",
				onResponseError,
			});

			await f("items/fail");

			expect(onResponseError).toHaveBeenCalledTimes(1);
		});
	});

	describe("retry logic", () => {
		it("retries on matching status codes", async () => {
			mockFetch
				.mockResolvedValueOnce(new Response(null, { status: 429 }))
				.mockResolvedValueOnce(jsonResponse({ ok: true }));

			const f = createFetch({
				baseURL: "https://api.test.com/",
				retry: 1,
				retryDelay: 0,
				retryStatusCodes: [429],
			});

			const result = await f("items");

			expect(mockFetch).toHaveBeenCalledTimes(2);
			expect(result).toEqual({ ok: true });
		});

		it("retries on network errors", async () => {
			mockFetch
				.mockRejectedValueOnce(new Error("Network error"))
				.mockResolvedValueOnce(jsonResponse({ ok: true }));

			const f = createFetch({
				baseURL: "https://api.test.com/",
				retry: 1,
				retryDelay: 0,
			});

			const result = await f("items");

			expect(mockFetch).toHaveBeenCalledTimes(2);
			expect(result).toEqual({ ok: true });
		});

		it("throws after all retries exhausted on network error", async () => {
			mockFetch
				.mockRejectedValueOnce(new Error("fail"))
				.mockRejectedValueOnce(new Error("fail again"));

			const f = createFetch({
				baseURL: "https://api.test.com/",
				retry: 1,
				retryDelay: 0,
			});

			await expect(f("items")).rejects.toThrow("fail again");
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});

		it("does not retry when no retry config", async () => {
			mockFetch.mockRejectedValueOnce(new Error("fail"));

			const f = createFetch({ baseURL: "https://api.test.com/" });

			await expect(f("items")).rejects.toThrow("fail");
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it("returns parsed response when all retries exhausted on status code", async () => {
			mockFetch
				.mockResolvedValueOnce(new Response(null, { status: 429 }))
				.mockResolvedValueOnce(
					new Response(JSON.stringify({ error: "rate limited" }), {
						status: 429,
						headers: { "content-type": "application/json" },
					}),
				);

			const f = createFetch({
				baseURL: "https://api.test.com/",
				retry: 1,
				retryDelay: 0,
				retryStatusCodes: [429],
			});

			const result = await f("items");

			expect(mockFetch).toHaveBeenCalledTimes(2);
			expect(result).toEqual({ error: "rate limited" });
		});
	});

	describe("HTTP method", () => {
		it("defaults to GET", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse({}));
			const f = createFetch({ baseURL: "https://api.test.com/" });

			await f("items");

			const init = mockFetch.mock.calls[0][1] as RequestInit;
			expect(init.method).toBe("GET");
		});

		it("uses provided method", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse({}));
			const f = createFetch({ baseURL: "https://api.test.com/" });

			await f("items/1", { method: "DELETE" });

			const init = mockFetch.mock.calls[0][1] as RequestInit;
			expect(init.method).toBe("DELETE");
		});
	});
});

describe("fetchJson", () => {
	it("returns parsed JSON on success", async () => {
		mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1 }));

		const result = await fetchJson<{ id: number }>(
			"https://api.test.com/items/1",
		);

		expect(result).toEqual({ id: 1 });
	});

	it("throws on non-ok response", async () => {
		mockFetch.mockResolvedValueOnce(
			new Response(null, { status: 401, statusText: "Unauthorized" }),
		);

		await expect(fetchJson("https://api.test.com/secret")).rejects.toThrow(
			"HTTP 401: Unauthorized",
		);
	});

	it("passes RequestInit options to fetch", async () => {
		mockFetch.mockResolvedValueOnce(jsonResponse({}));

		await fetchJson("https://api.test.com/items", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "test" }),
		});

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.test.com/items",
			expect.objectContaining({ method: "POST" }),
		);
	});
});
