import { Resource } from "../resource";
import type { Label, Tag } from "../types";

export class LabelsResource extends Resource {
	list() {
		return this.fetch<Label[]>(this.url("/labels"), {
			headers: {
				Accept: "application/vnd.tiime.labels.v2+json",
			},
		});
	}

	standard() {
		return this.fetch<Label[]>(this.url("/standard_labels"));
	}

	tags() {
		return this.fetch<Tag[]>(this.url("/tags"), {
			query: { expand: "tag_detail" },
		});
	}
}
