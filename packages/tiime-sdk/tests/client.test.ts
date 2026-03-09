import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchInstance = vi.fn();

vi.mock("ofetch", () => ({
	ofetch: {
		create: vi.fn(() => mockFetchInstance),
	},
}));

vi.mock("../src/auth", () => {
	return {
		TokenManager: class {
			getValidToken = vi.fn().mockResolvedValue("fake-token");
		},
	};
});

import { TiimeClient } from "../src/client";
import { BankAccountsResource } from "../src/resources/bank-accounts";
import { BankTransactionsResource } from "../src/resources/bank-transactions";
import { ClientsResource } from "../src/resources/clients";
import { CompanyResource } from "../src/resources/company";
import { DocumentsResource } from "../src/resources/documents";
import { ExpenseReportsResource } from "../src/resources/expense-reports";
import { InvoicesResource } from "../src/resources/invoices";
import { LabelsResource } from "../src/resources/labels";
import { QuotationsResource } from "../src/resources/quotations";
import { UsersResource } from "../src/resources/users";

const COMPANY_ID = 42;

describe("TiimeClient", () => {
	let client: TiimeClient;

	beforeEach(() => {
		mockFetchInstance.mockReset();
		client = new TiimeClient({ companyId: COMPANY_ID });
	});

	describe("getters", () => {
		it("users should return UsersResource", () => {
			expect(client.users).toBeInstanceOf(UsersResource);
		});

		it("company should return CompanyResource", () => {
			expect(client.company).toBeInstanceOf(CompanyResource);
		});

		it("clients should return ClientsResource", () => {
			expect(client.clients).toBeInstanceOf(ClientsResource);
		});

		it("invoices should return InvoicesResource", () => {
			expect(client.invoices).toBeInstanceOf(InvoicesResource);
		});

		it("quotations should return QuotationsResource", () => {
			expect(client.quotations).toBeInstanceOf(QuotationsResource);
		});

		it("bankAccounts should return BankAccountsResource", () => {
			expect(client.bankAccounts).toBeInstanceOf(BankAccountsResource);
		});

		it("bankTransactions should return BankTransactionsResource", () => {
			expect(client.bankTransactions).toBeInstanceOf(
				BankTransactionsResource,
			);
		});

		it("documents should return DocumentsResource", () => {
			expect(client.documents).toBeInstanceOf(DocumentsResource);
		});

		it("expenseReports should return ExpenseReportsResource", () => {
			expect(client.expenseReports).toBeInstanceOf(ExpenseReportsResource);
		});

		it("labels should return LabelsResource", () => {
			expect(client.labels).toBeInstanceOf(LabelsResource);
		});

		it("should return a new instance on each access", () => {
			const a = client.invoices;
			const b = client.invoices;
			expect(a).not.toBe(b);
		});
	});

	describe("listCompanies()", () => {
		it("should call fetch with correct URL and headers", async () => {
			mockFetchInstance.mockResolvedValueOnce([]);
			await client.listCompanies();
			expect(mockFetchInstance).toHaveBeenCalledWith("/companies", {
				headers: {
					Accept: "application/vnd.tiime.companies.v2+json",
					Range: "items=0-101",
				},
			});
		});
	});
});
