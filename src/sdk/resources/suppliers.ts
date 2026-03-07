import type { $Fetch } from "ofetch";
import type { Supplier } from "../types";

export class SuppliersResource {
	constructor(
		private fetch: $Fetch,
		private companyId: number,
	) {}

	list() {
		return this.fetch<Supplier[]>(`/companies/${this.companyId}/suppliers`, {
			headers: {
				Accept: "application/vnd.tiime.timeline.v2+json",
				Range: "items=0-*",
			},
		});
	}

	get(supplierId: number) {
		return this.fetch<Supplier>(
			`/companies/${this.companyId}/suppliers/${supplierId}`,
		);
	}

	search(query: string) {
		return this.fetch<Supplier[]>(`/companies/${this.companyId}/suppliers`, {
			query: { search: query },
			headers: {
				Accept: "application/vnd.tiime.timeline.v2+json",
				Range: "items=0-*",
			},
		});
	}
}
