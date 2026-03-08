import type { $Fetch } from "ofetch";
import type { Label, Tag } from "../types";

export class LabelsResource {
	constructor(
		private fetch: $Fetch,
		private companyId: number,
	) {}

	list() {
		return this.fetch<Label[]>(`/companies/${this.companyId}/labels`, {
			headers: {
				Accept: "application/vnd.tiime.labels.v2+json",
			},
		});
	}

	standard() {
		return this.fetch<Label[]>(`/companies/${this.companyId}/standard_labels`);
	}

	tags() {
		return this.fetch<Tag[]>(`/companies/${this.companyId}/tags`, {
			query: { expand: "tag_detail" },
		});
	}
}
