export class TiimeError extends Error {
	constructor(
		message: string,
		public status: number,
		public endpoint: string,
		public details?: unknown,
	) {
		super(message);
		this.name = "TiimeError";
	}

	toJSON() {
		return {
			error: this.name,
			message: this.message,
			status: this.status,
			endpoint: this.endpoint,
			details: this.details,
		};
	}
}
