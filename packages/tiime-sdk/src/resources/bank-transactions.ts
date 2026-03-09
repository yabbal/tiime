import { Resource } from "../resource";
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

export class BankTransactionsResource extends Resource {
	list(params?: BankTransactionsListParams) {
		const start = ((params?.page ?? 1) - 1) * (params?.pageSize ?? 100);
		const end = start + (params?.pageSize ?? 100);
		const { page: _, pageSize: __, from, to, search, ...rest } = params ?? {};
		const query: Record<string, unknown> = { ...rest };

		if (from) query.transaction_date_start = from;
		if (to) query.transaction_date_end = to;
		if (search) query.wording = search;

		return this.fetch<BankTransactionsResponse>(
			this.url("/bank_transactions"),
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
			this.url("/bank_transactions/unimputed"),
		);
	}

	get(transactionId: number) {
		return this.fetch<BankTransaction>(
			this.url(`/bank_transactions/${transactionId}`),
		);
	}

	labelSuggestions(transactionId: number) {
		return this.fetch<LabelSuggestion[]>(
			this.url(`/bank_transactions/${transactionId}/label_suggestions`),
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
			this.url(`/bank_transactions/${transactionId}`),
			{
				method: "PATCH",
				body: { imputations },
			},
		);
	}

	matchDocuments(transactionId: number, documentIds: number[]) {
		return this.fetch<DocumentMatching[]>(
			this.url(`/bank_transactions/${transactionId}/document_matchings`),
			{
				method: "PUT",
				body: { documents: documentIds.map((id) => ({ id })) },
			},
		);
	}

	getMatchings(transactionId: number) {
		return this.fetch<{ matchings: DocumentMatching[] }>(
			this.url(`/bank_transactions/${transactionId}/matchings`),
		);
	}
}
