import type { $Fetch } from "ofetch";
import type { Client } from "../types";

export interface ClientsListParams {
	archived?: boolean;
}

export interface ClientCreateParams {
	name: string;
	address?: string;
	postal_code?: string;
	city?: string;
	country_id?: number;
	email?: string;
	phone?: string;
	siren_or_siret?: string;
	professional?: boolean;
}

export class ClientsResource {
	constructor(
		private fetch: $Fetch,
		private companyId: number,
	) {}

	list(params?: ClientsListParams) {
		return this.fetch<Client[]>(`/companies/${this.companyId}/clients`, {
			query: params,
			headers: {
				Accept: "application/vnd.tiime.timeline.v2+json",
				Range: "items=0-*",
			},
		});
	}

	get(clientId: number) {
		return this.fetch<Client>(
			`/companies/${this.companyId}/clients/${clientId}`,
		);
	}

	create(params: ClientCreateParams) {
		return this.fetch<Client>(`/companies/${this.companyId}/clients`, {
			method: "POST",
			body: params,
		});
	}

	search(query: string) {
		return this.fetch<Client[]>(`/companies/${this.companyId}/clients`, {
			query: { search: query },
			headers: {
				Accept: "application/vnd.tiime.timeline.v2+json",
				Range: "items=0-*",
			},
		});
	}
}
