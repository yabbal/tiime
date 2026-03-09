import type { FetchFn } from "./fetch";

export class Resource {
	constructor(
		protected fetch: FetchFn,
		protected companyId: number,
	) {}

	protected url(path: string) {
		return `/companies/${this.companyId}${path}`;
	}
}
