import type { FetchFn } from "../fetch";
import type { User } from "../types";

export class UsersResource {
	constructor(protected fetch: FetchFn) {}

	me() {
		return this.fetch<User>("/users/me");
	}

	legalInformations(): Promise<unknown> {
		return this.fetch("/users/me/legal_informations");
	}

	settings(companyId: number): Promise<unknown> {
		return this.fetch(`/users/me/companies/${companyId}/settings`);
	}
}
