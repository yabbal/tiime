import { Resource } from "../resource";
import type { Document, DocumentCategory, MatchableDocument } from "../types";

export interface DocumentsListParams {
	types?: string;
	source?: string;
	sorts?: string;
	accountable?: boolean;
	page?: number;
	pageSize?: number;
}

export class DocumentsResource extends Resource {
	list(params?: DocumentsListParams) {
		const start = ((params?.page ?? 1) - 1) * (params?.pageSize ?? 25);
		const end = start + (params?.pageSize ?? 25);
		const { page: _, pageSize: __, ...query } = params ?? {};

		return this.fetch<Document[]>(this.url("/documents"), {
			query: {
				sorts: "created_at:desc",
				expand: "file_family,preview_available",
				...query,
			},
			headers: {
				Accept:
					"application/vnd.tiime.documents.v2+json,application/vnd.tiime.docs.query+json,application/vnd.tiime.docs.imputation+json",
				Range: `items=${start}-${end}`,
			},
		});
	}

	categories() {
		return this.fetch<DocumentCategory[]>(this.url("/document_categories"), {
			headers: {
				Accept: "application/vnd.tiime.documents.v3+json",
			},
		});
	}

	preview(documentId: number): Promise<unknown> {
		return this.fetch(this.url(`/documents/${documentId}/preview`));
	}

	upload(file: Uint8Array, filename: string, type?: string) {
		const formData = new FormData();
		formData.append("file", new Blob([file as unknown as BlobPart]), filename);
		if (type) {
			formData.append("type", type);
		}
		return this.fetch<Document>(this.url("/documents"), {
			method: "POST",
			body: formData,
		});
	}

	searchMatchable(query: string) {
		return this.fetch<MatchableDocument[]>(this.url("/documents"), {
			query: { matchable: true, q: query },
			headers: {
				Accept:
					"application/vnd.tiime.documents.v3+json,application/vnd.tiime.docs.imputation+json",
				Range: "items=0-25",
			},
		});
	}

	async download(documentId: number): Promise<ArrayBuffer> {
		return this.fetch(this.url(`/documents/${documentId}/download`), {
			headers: { Accept: "application/octet-stream" },
		}) as Promise<ArrayBuffer>;
	}
}
