import { TokenManager } from "./auth";
import { TiimeError } from "./errors";
import { createFetch, type FetchFn } from "./fetch";
import { BankAccountsResource } from "./resources/bank-accounts";
import { BankTransactionsResource } from "./resources/bank-transactions";
import { ClientsResource } from "./resources/clients";
import { CompanyResource } from "./resources/company";
import { DocumentsResource } from "./resources/documents";
import { ExpenseReportsResource } from "./resources/expense-reports";
import { InvoicesResource } from "./resources/invoices";
import { LabelsResource } from "./resources/labels";
import { QuotationsResource } from "./resources/quotations";
import { UsersResource } from "./resources/users";
import type { TiimeClientOptions } from "./types";

const BASE_URL = "https://chronos-api.tiime-apps.com/v1";

export class TiimeClient {
	readonly fetch: FetchFn;
	readonly tokenManager: TokenManager;
	readonly companyId: number;

	constructor(options: TiimeClientOptions & { tokenManager?: TokenManager }) {
		this.companyId = options.companyId;
		this.tokenManager =
			options.tokenManager ??
			new TokenManager({
				tokens: options.tokens,
				email: options.email,
				password: options.password,
			});

		this.fetch = createFetch({
			baseURL: BASE_URL,
			retry: 2,
			retryDelay: 500,
			retryStatusCodes: [408, 429, 500, 502, 503, 504],
			headers: {
				"tiime-app": "tiime",
				"tiime-app-version": "4.30.3",
				"tiime-app-platform": "cli",
			},
			onRequest: async ({ options }) => {
				const token = await this.tokenManager.getValidToken();
				options.headers.set("Authorization", `Bearer ${token}`);
			},
			onResponseError: ({ request, response }) => {
				throw new TiimeError(
					response.statusText || `HTTP ${response.status}`,
					response.status,
					String(request),
					response._data,
				);
			},
		});
	}

	listCompanies() {
		return this.fetch<import("./types").Company[]>("companies", {
			headers: {
				Accept: "application/vnd.tiime.companies.v2+json",
				Range: "items=0-101",
			},
		});
	}

	get users() {
		return new UsersResource(this.fetch);
	}

	get company() {
		return new CompanyResource(this.fetch, this.companyId);
	}

	get clients() {
		return new ClientsResource(this.fetch, this.companyId);
	}

	get invoices() {
		return new InvoicesResource(this.fetch, this.companyId);
	}

	get quotations() {
		return new QuotationsResource(this.fetch, this.companyId);
	}

	get bankAccounts() {
		return new BankAccountsResource(this.fetch, this.companyId);
	}

	get bankTransactions() {
		return new BankTransactionsResource(this.fetch, this.companyId);
	}

	get documents() {
		return new DocumentsResource(this.fetch, this.companyId);
	}

	get expenseReports() {
		return new ExpenseReportsResource(this.fetch, this.companyId);
	}

	get labels() {
		return new LabelsResource(this.fetch, this.companyId);
	}
}
