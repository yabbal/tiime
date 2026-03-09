import type { $Fetch } from "ofetch";
import type {
	BankTransaction,
	BankTransactionsResponse,
	DocumentMatching,
	ImputationParams,
	LabelSuggestion,
} from "../types";

export interface BankTransactionsListParams {
	hide_refused?: boolean;
	bank_account?: number;
	amount_type?: "positive" | "negative";
	operation_type?: string;
	sorts?: string;
	page?: number;
	pageSize?: number;
	from?: string;
	to?: string;
	search?: string;
}

export class BankTransactionsResource {
	constructor(
		private fetch: $Fetch,
		private companyId: number,
	) {}

	list(params?: BankTransactionsListParams) {
		const start = ((params?.page ?? 1) - 1) * (params?.pageSize ?? 100);
		const end = start + (params?.pageSize ?? 100);
		const { page: _, pageSize: __, from, to, search, ...query } = params ?? {};

		if (from) (query as Record<string, unknown>).transaction_date_start = from;
		if (to) (query as Record<string, unknown>).transaction_date_end = to;
		if (search) (query as Record<string, unknown>).wording = search;

		return this.fetch<BankTransactionsResponse>(
			`/companies/${this.companyId}/bank_transactions`,
			{
				query: { hide_refused: false, ...query },
				headers: {
					Accept: "application/vnd.tiime.bank_transactions.v2+json",
					Range: `items=${start}-${end}`,
				},
			},
		);
	}

	async listAll(
		params?: Omit<BankTransactionsListParams, "page">,
	): Promise<BankTransaction[]> {
		const pageSize = params?.pageSize ?? 200;
		const all: BankTransaction[] = [];
		let page = 1;
		let hasMore = true;

		while (hasMore) {
			const response = await this.list({ ...params, page, pageSize });
			all.push(...response.transactions);
			hasMore = response.transactions.length === pageSize;
			page++;
		}

		return all;
	}

	unimputed() {
		return this.fetch<BankTransaction[]>(
			`/companies/${this.companyId}/bank_transactions/unimputed`,
		);
	}

	get(transactionId: number) {
		return this.fetch<BankTransaction>(
			`/companies/${this.companyId}/bank_transactions/${transactionId}`,
		);
	}

	labelSuggestions(transactionId: number) {
		return this.fetch<LabelSuggestion[]>(
			`/companies/${this.companyId}/bank_transactions/${transactionId}/label_suggestions`,
			{
				headers: {
					Accept:
						"application/vnd.tiime.bank_transactions.label_suggestions.v2+json",
				},
			},
		);
	}

	impute(transactionId: number, imputations: ImputationParams[]) {
		return this.fetch<BankTransaction>(
			`/companies/${this.companyId}/bank_transactions/${transactionId}`,
			{
				method: "PATCH",
				body: { imputations },
			},
		);
	}

	matchDocuments(transactionId: number, documentIds: number[]) {
		return this.fetch<DocumentMatching[]>(
			`/companies/${this.companyId}/bank_transactions/${transactionId}/document_matchings`,
			{
				method: "PUT",
				body: { documents: documentIds.map((id) => ({ id })) },
			},
		);
	}

	getMatchings(transactionId: number) {
		return this.fetch<{ matchings: DocumentMatching[] }>(
			`/companies/${this.companyId}/bank_transactions/${transactionId}/matchings`,
		);
	}
}
