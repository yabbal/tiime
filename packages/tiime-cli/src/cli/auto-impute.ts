import type { TiimeClient } from "../sdk/client";
import type { ImputationLabel, ImputationParams } from "../sdk/types";

export interface AutoImputeProposal {
	company_id: number;
	company_name: string;
	transaction_id: number;
	wording: string;
	amount: number;
	currency: string;
	suggested_label_id: number;
	suggested_label_name: string;
	status: "proposed" | "applied" | "skipped" | "error";
}

export interface AutoImputeOptions {
	apply: boolean;
}

export async function autoImputeForCompany(
	client: TiimeClient,
	companyId: number,
	companyName: string,
	options: AutoImputeOptions,
): Promise<AutoImputeProposal[]> {
	const proposals: AutoImputeProposal[] = [];
	const transactions = await client.bankTransactions.unimputed();

	for (const tx of transactions) {
		const suggestions = await client.bankTransactions.labelSuggestions(tx.id);
		const firstSuggestion = suggestions[0];

		if (!firstSuggestion) {
			proposals.push({
				company_id: companyId,
				company_name: companyName,
				transaction_id: tx.id,
				wording: tx.wording,
				amount: tx.amount,
				currency: tx.currency,
				suggested_label_id: 0,
				suggested_label_name: "(aucune suggestion)",
				status: "skipped",
			});
			continue;
		}

		if (!options.apply) {
			proposals.push({
				company_id: companyId,
				company_name: companyName,
				transaction_id: tx.id,
				wording: tx.wording,
				amount: tx.amount,
				currency: tx.currency,
				suggested_label_id: firstSuggestion.id,
				suggested_label_name: firstSuggestion.name ?? firstSuggestion.label,
				status: "proposed",
			});
		} else {
			const imputationLabel: ImputationLabel = {
				...firstSuggestion,
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
				proposals.push({
					company_id: companyId,
					company_name: companyName,
					transaction_id: tx.id,
					wording: tx.wording,
					amount: tx.amount,
					currency: tx.currency,
					suggested_label_id: firstSuggestion.id,
					suggested_label_name: firstSuggestion.name ?? firstSuggestion.label,
					status: "applied",
				});
			} catch {
				proposals.push({
					company_id: companyId,
					company_name: companyName,
					transaction_id: tx.id,
					wording: tx.wording,
					amount: tx.amount,
					currency: tx.currency,
					suggested_label_id: firstSuggestion.id,
					suggested_label_name: firstSuggestion.name ?? firstSuggestion.label,
					status: "error",
				});
			}
		}
	}

	return proposals;
}

export function resolveCompanyIds(
	parts: string[],
	companies: { id: number; name: string }[],
): number[] {
	return parts.map((p) => {
		if (/^\d+$/.test(p)) return Number(p);
		const match = companies.find(
			(c) => c.name.toLowerCase() === p.toLowerCase(),
		);
		if (!match) throw new Error(`Entreprise introuvable : "${p}"`);
		return match.id;
	});
}
