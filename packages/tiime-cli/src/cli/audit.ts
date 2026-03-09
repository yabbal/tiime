import type { ImputationLabel, ImputationParams, TiimeClient } from "tiime-sdk";

const log = (...args: unknown[]) => console.error(...args);

export interface UnimputedFinding {
	transaction_id: number;
	wording: string;
	amount: number;
	currency: string;
	transaction_date: string;
	suggested_label_id: number | null;
	suggested_label_name: string | null;
}

export interface MissingDocumentFinding {
	transaction_id: number;
	wording: string;
	amount: number;
	currency: string;
	transaction_date: string;
	operation_type: string;
	label_name: string;
}

export interface AppliedImputation {
	transaction_id: number;
	wording: string;
	amount: number;
	label_name: string;
	status: "applied" | "error";
}

export interface CompanyAuditReport {
	company_id: number;
	company_name: string;
	error: string | null;
	unimputed_transactions: UnimputedFinding[];
	missing_documents: MissingDocumentFinding[];
	applied_imputations: AppliedImputation[];
	summary: {
		total_unimputed: number;
		total_unimputed_amount: number;
		with_suggestions: number;
		without_suggestions: number;
		total_missing_documents: number;
		total_missing_documents_amount: number;
		applied_count: number;
	};
}

export interface AuditReport {
	date: string;
	companies: CompanyAuditReport[];
	apply_mode: boolean;
}

const batchAsync = async <T, R>(
	items: T[],
	batchSize: number,
	fn: (item: T) => Promise<R>,
): Promise<R[]> => {
	const results: R[] = [];
	for (let i = 0; i < items.length; i += batchSize) {
		const batch = items.slice(i, i + batchSize);
		const batchResults = await Promise.all(batch.map(fn));
		results.push(...batchResults);
	}
	return results;
};

export async function auditForCompany(
	client: TiimeClient,
	companyId: number,
	companyName: string,
	options: { apply: boolean },
): Promise<CompanyAuditReport> {
	const unimputedFindings: UnimputedFinding[] = [];
	const appliedImputations: AppliedImputation[] = [];

	// Step 1 — Unimputed transactions + label suggestions
	log(`[${companyName}] Récupération des transactions non imputées...`);
	const unimputedTxs = await client.bankTransactions.unimputed();

	log(
		`[${companyName}] ${unimputedTxs.length} non imputées, récupération des suggestions...`,
	);
	const suggestions = await batchAsync(unimputedTxs, 5, async (tx) => {
		try {
			// unimputed() may return only { id } — fetch full details if needed
			const fullTx =
				tx.wording !== undefined
					? tx
					: await client.bankTransactions.get(tx.id);
			const sug = await client.bankTransactions.labelSuggestions(tx.id);
			return { tx: fullTx, suggestion: sug[0] ?? null };
		} catch (e) {
			log(
				`[${companyName}] Erreur pour tx #${tx.id}: ${e instanceof Error ? e.message : e}`,
			);
			return { tx, suggestion: null };
		}
	});

	for (const { tx, suggestion } of suggestions) {
		unimputedFindings.push({
			transaction_id: tx.id,
			wording: tx.wording,
			amount: tx.amount,
			currency: tx.currency,
			transaction_date: tx.transaction_date,
			suggested_label_id: suggestion?.id ?? null,
			suggested_label_name: suggestion
				? (suggestion.name ?? suggestion.label)
				: null,
		});

		if (options.apply && suggestion) {
			const imputationLabel: ImputationLabel = {
				...suggestion,
				disabled: false,
			};
			const imputationParams: ImputationParams[] = [
				{
					label: imputationLabel,
					amount: tx.amount,
					documents: [],
					accountant_detail_requests: [],
				},
			];

			try {
				await client.bankTransactions.impute(tx.id, imputationParams);
				appliedImputations.push({
					transaction_id: tx.id,
					wording: tx.wording,
					amount: tx.amount,
					label_name: suggestion.name ?? suggestion.label,
					status: "applied",
				});
			} catch {
				appliedImputations.push({
					transaction_id: tx.id,
					wording: tx.wording,
					amount: tx.amount,
					label_name: suggestion.name ?? suggestion.label,
					status: "error",
				});
			}
		}
	}

	// Step 1.5 — Determine accounting period
	let from: string;
	let to: string;
	try {
		const period = await client.company.accountingPeriod();
		from = period.start_date;
		to = period.end_date;
	} catch {
		const now = new Date();
		from = `${now.getFullYear()}-01-01`;
		to = now.toISOString().slice(0, 10);
	}

	// Step 2 — Missing documents
	const missingDocuments: MissingDocumentFinding[] = [];
	const appliedIds = new Set(
		appliedImputations
			.filter((a) => a.status === "applied")
			.map((a) => a.transaction_id),
	);
	log(
		`[${companyName}] Vérification des documents manquants (${from} → ${to})...`,
	);
	const allTransactions = await client.bankTransactions.listAll({ from, to });

	for (const tx of allTransactions) {
		if (tx.imputations.length === 0) continue;
		if (appliedIds.has(tx.id)) continue;
		const hasNoDocuments = tx.count_documents === 0 && tx.count_invoices === 0;
		if (hasNoDocuments) {
			missingDocuments.push({
				transaction_id: tx.id,
				wording: tx.wording,
				amount: tx.amount,
				currency: tx.currency,
				transaction_date: tx.transaction_date,
				operation_type: tx.operation_type,
				label_name:
					tx.imputations[0].label.name ?? tx.imputations[0].label.label,
			});
		}
	}

	// Step 3 — Summary
	const withSuggestions = unimputedFindings.filter(
		(f) => f.suggested_label_id !== null,
	).length;

	return {
		company_id: companyId,
		company_name: companyName,
		error: null,
		unimputed_transactions: unimputedFindings,
		missing_documents: missingDocuments,
		applied_imputations: appliedImputations,
		summary: {
			total_unimputed: unimputedFindings.length,
			total_unimputed_amount: unimputedFindings.reduce(
				(sum, f) => sum + Math.abs(f.amount),
				0,
			),
			with_suggestions: withSuggestions,
			without_suggestions: unimputedFindings.length - withSuggestions,
			total_missing_documents: missingDocuments.length,
			total_missing_documents_amount: missingDocuments.reduce(
				(sum, f) => sum + Math.abs(f.amount),
				0,
			),
			applied_count: appliedImputations.filter((a) => a.status === "applied")
				.length,
		},
	};
}

export function emptyReport(
	companyId: number,
	companyName: string,
	error: string,
): CompanyAuditReport {
	return {
		company_id: companyId,
		company_name: companyName,
		error,
		unimputed_transactions: [],
		missing_documents: [],
		applied_imputations: [],
		summary: {
			total_unimputed: 0,
			total_unimputed_amount: 0,
			with_suggestions: 0,
			without_suggestions: 0,
			total_missing_documents: 0,
			total_missing_documents_amount: 0,
			applied_count: 0,
		},
	};
}
