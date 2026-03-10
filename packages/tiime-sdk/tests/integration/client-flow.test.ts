import { beforeEach, describe, expect, it, vi } from "vitest";
import { TiimeClient } from "../../src/client";
import { TiimeError } from "../../src/errors";

/**
 * Integration tests: TiimeClient → createFetch → Resources
 * No module-level mocks — only global fetch is intercepted.
 * Verifies the full stack: auth injection, URL building, headers, retry, error handling.
 */

const mockFetch =
	vi.fn<
		(input: string | URL | Request, init?: RequestInit) => Promise<Response>
	>();

const COMPANY_ID = 42;
const FAKE_TOKEN = "fake-access-token";

const jsonResponse = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), {
		status,
		statusText: status === 200 ? "OK" : "Error",
		headers: { "content-type": "application/json" },
	});

const makeClient = () =>
	new TiimeClient({
		companyId: COMPANY_ID,
		tokens: { access_token: FAKE_TOKEN, expires_at: Date.now() + 3_600_000 },
	});

beforeEach(() => {
	mockFetch.mockReset();
	vi.stubGlobal("fetch", mockFetch);
});

describe("TiimeClient integration", () => {
	describe("auth injection", () => {
		it("sets Authorization header on every request", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse([]));
			const client = makeClient();

			await client.invoices.list();

			const headers = mockFetch.mock.calls[0][1]?.headers as Headers;
			expect(headers.get("Authorization")).toBe(`Bearer ${FAKE_TOKEN}`);
		});

		it("sets custom tiime headers on every request", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse([]));
			const client = makeClient();

			await client.invoices.list();

			const headers = mockFetch.mock.calls[0][1]?.headers as Headers;
			expect(headers.get("tiime-app")).toBe("tiime");
			expect(headers.get("tiime-app-version")).toBe("4.30.3");
			expect(headers.get("tiime-app-platform")).toBe("cli");
		});
	});

	describe("URL building through resources", () => {
		it("builds correct URL for resource methods", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse([]));
			const client = makeClient();

			await client.clients.list();

			const url = mockFetch.mock.calls[0][0] as string;
			expect(url).toContain(`companies/${COMPANY_ID}/clients`);
		});

		it("builds correct URL for nested resource paths", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse({ id: 99 }));
			const client = makeClient();

			await client.invoices.get(99);

			const url = mockFetch.mock.calls[0][0] as string;
			expect(url).toContain(`companies/${COMPANY_ID}/invoices/99`);
		});

		it("builds correct URL for listCompanies (no companyId prefix)", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse([]));
			const client = makeClient();

			await client.listCompanies();

			const url = mockFetch.mock.calls[0][0] as string;
			expect(url).toContain("companies");
			expect(url).not.toContain(`companies/${COMPANY_ID}/companies`);
		});
	});

	describe("request body and method", () => {
		it("sends JSON body for POST requests", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1, status: "draft" }));
			const client = makeClient();

			await client.invoices.create({
				emission_date: "2026-03-01",
				lines: [
					{
						description: "Dev",
						quantity: 5,
						unit_amount: 500,
						vat_type: { code: "20" },
					},
				],
			});

			const init = mockFetch.mock.calls[0][1];
			expect(init?.method).toBe("POST");
			const body = JSON.parse(init?.body as string);
			expect(body.emission_date).toBe("2026-03-01");
			expect(body.lines[0].line_amount).toBe(2500);
		});

		it("sends PATCH for impute", async () => {
			mockFetch.mockResolvedValueOnce(jsonResponse({ id: 100 }));
			const client = makeClient();

			await client.bankTransactions.impute(100, [
				{
					label: {
						id: 1,
						label: "test",
						name: "test",
						acronym: "TE",
						color: "#000",
						client: null,
						disabled: false,
					},
					amount: -50,
					documents: [],
					accountant_detail_requests: [],
				},
			]);

			const init = mockFetch.mock.calls[0][1];
			expect(init?.method).toBe("PATCH");
		});

		it("sends DELETE for invoice deletion", async () => {
			mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
			const client = makeClient();

			await client.invoices.delete(99);

			const init = mockFetch.mock.calls[0][1];
			expect(init?.method).toBe("DELETE");
		});
	});

	describe("response parsing", () => {
		it("parses JSON array responses from list endpoints", async () => {
			const fakeInvoices = [
				{ id: 1, compiled_number: "F-001" },
				{ id: 2, compiled_number: "F-002" },
			];
			mockFetch.mockResolvedValueOnce(jsonResponse(fakeInvoices));
			const client = makeClient();

			const result = await client.invoices.list();

			expect(result).toEqual(fakeInvoices);
		});

		it("parses JSON object responses from get endpoints", async () => {
			const fakeInvoice = { id: 99, compiled_number: "F-099" };
			mockFetch.mockResolvedValueOnce(jsonResponse(fakeInvoice));
			const client = makeClient();

			const result = await client.invoices.get(99);

			expect(result).toEqual(fakeInvoice);
		});

		it("handles binary responses for download endpoints", async () => {
			mockFetch.mockResolvedValueOnce(
				new Response(new ArrayBuffer(128), {
					status: 200,
					headers: { "content-type": "application/pdf" },
				}),
			);
			const client = makeClient();

			const result = await client.invoices.downloadPdf(99);

			expect(result).toBeInstanceOf(ArrayBuffer);
		});
	});

	describe("error handling (onResponseError → TiimeError)", () => {
		it("throws TiimeError on 404", async () => {
			mockFetch.mockResolvedValueOnce(
				new Response(JSON.stringify({ message: "Not found" }), {
					status: 404,
					statusText: "Not Found",
					headers: { "content-type": "application/json" },
				}),
			);
			const client = makeClient();

			await expect(client.invoices.get(999)).rejects.toThrow(TiimeError);

			try {
				mockFetch.mockResolvedValueOnce(
					new Response(JSON.stringify({ message: "Not found" }), {
						status: 404,
						statusText: "Not Found",
						headers: { "content-type": "application/json" },
					}),
				);
				await client.invoices.get(999);
			} catch (err) {
				const tiimeErr = err as TiimeError;
				expect(tiimeErr.status).toBe(404);
				expect(tiimeErr.endpoint).toContain("/invoices/999");
				expect(tiimeErr.details).toEqual({ message: "Not found" });
			}
		});

		it("throws TiimeError on 401 with correct details", async () => {
			mockFetch.mockResolvedValueOnce(
				new Response(JSON.stringify({ error: "Unauthorized" }), {
					status: 401,
					statusText: "Unauthorized",
					headers: { "content-type": "application/json" },
				}),
			);
			const client = makeClient();

			await expect(client.clients.list()).rejects.toThrow(TiimeError);
		});
	});

	describe("retry behavior", () => {
		it("retries on 429 and succeeds", async () => {
			mockFetch
				.mockResolvedValueOnce(
					new Response(null, { status: 429, statusText: "Too Many Requests" }),
				)
				.mockResolvedValueOnce(jsonResponse([{ id: 1 }]));
			const client = makeClient();

			const result = await client.invoices.list();

			expect(mockFetch).toHaveBeenCalledTimes(2);
			expect(result).toEqual([{ id: 1 }]);
		});

		it("retries on 500 and succeeds", async () => {
			mockFetch
				.mockResolvedValueOnce(
					new Response(null, {
						status: 500,
						statusText: "Internal Server Error",
					}),
				)
				.mockResolvedValueOnce(jsonResponse({ id: 1 }));
			const client = makeClient();

			const result = await client.bankAccounts.get(1);

			expect(mockFetch).toHaveBeenCalledTimes(2);
			expect(result).toEqual({ id: 1 });
		});

		it("throws after max retries exhausted on 503", async () => {
			mockFetch.mockResolvedValue(
				new Response(JSON.stringify({ error: "unavailable" }), {
					status: 503,
					statusText: "Service Unavailable",
					headers: { "content-type": "application/json" },
				}),
			);
			const client = makeClient();

			// 3 attempts total (1 + 2 retries), then onResponseError throws
			await expect(client.invoices.list()).rejects.toThrow(TiimeError);
			expect(mockFetch).toHaveBeenCalledTimes(3);
		});

		it("retries on network error and succeeds", async () => {
			mockFetch
				.mockRejectedValueOnce(new TypeError("fetch failed"))
				.mockResolvedValueOnce(jsonResponse([]));
			const client = makeClient();

			const result = await client.labels.list();

			expect(mockFetch).toHaveBeenCalledTimes(2);
			expect(result).toEqual([]);
		});
	});

	describe("pagination flow", () => {
		it("listAll paginates correctly through the full stack", async () => {
			mockFetch
				.mockResolvedValueOnce(
					jsonResponse(Array(100).fill({ id: 1, compiled_number: "F-001" })),
				)
				.mockResolvedValueOnce(
					jsonResponse([{ id: 2, compiled_number: "F-002" }]),
				);
			const client = makeClient();

			const all = await client.invoices.listAll();

			expect(all).toHaveLength(101);
			expect(mockFetch).toHaveBeenCalledTimes(2);

			// Verify first call has Range header for page 1
			const firstHeaders = mockFetch.mock.calls[0][1]?.headers as Headers;
			expect(firstHeaders.get("Range")).toBe("items=0-100");

			// Verify second call has Range header for page 2
			const secondHeaders = mockFetch.mock.calls[1][1]?.headers as Headers;
			expect(secondHeaders.get("Range")).toBe("items=100-200");
		});
	});

	describe("cross-resource operations", () => {
		it("duplicate invoice calls get then create through the full stack", async () => {
			const sourceInvoice = {
				id: 50,
				client_id: 10,
				title: "Mission A",
				lines: [
					{
						id: 1,
						description: "Consulting",
						quantity: 2,
						unit_amount: 300,
						line_amount: 600,
						vat_type: { code: "20" },
						invoicing_unit: null,
						invoicing_category_type: "benefit",
						article: null,
						sequence: 1,
					},
				],
			};

			mockFetch
				.mockResolvedValueOnce(jsonResponse(sourceInvoice))
				.mockResolvedValueOnce(jsonResponse({ id: 51, status: "draft" }));

			const client = makeClient();
			const result = await client.invoices.duplicate(50);

			expect(mockFetch).toHaveBeenCalledTimes(2);

			// First call: GET source invoice
			const getUrl = mockFetch.mock.calls[0][0] as string;
			expect(getUrl).toContain("/invoices/50");
			expect(mockFetch.mock.calls[0][1]?.method ?? "GET").toBe("GET");

			// Second call: POST create new invoice
			const postUrl = mockFetch.mock.calls[1][0] as string;
			expect(postUrl).toContain("/invoices");
			expect(mockFetch.mock.calls[1][1]?.method).toBe("POST");

			const createBody = JSON.parse(mockFetch.mock.calls[1][1]?.body as string);
			expect(createBody.client).toEqual({ id: 10 });
			expect(createBody.title).toBe("Mission A");
			expect(createBody.lines[0].description).toBe("Consulting");
			expect(createBody.status).toBe("draft");

			expect(result).toEqual({ id: 51, status: "draft" });
		});
	});
});
