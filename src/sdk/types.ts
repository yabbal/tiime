export interface AuthTokens {
	access_token: string;
	expires_at: number;
}

export interface AuthConfig {
	email: string;
	password: string;
}

export interface TiimeClientOptions {
	companyId: number;
	tokens?: AuthTokens;
}

export interface Address {
	street: string;
	additional_information1: string | null;
	additional_information2: string | null;
	postal_code: string;
	city: string;
	country: Country;
}

export interface Country {
	id?: number;
	name: string;
	code: string;
	invoicing_vat_exoneration_area?: string;
	nationality?: string;
}

export interface User {
	id: number;
	firstname: string;
	lastname: string;
	email: string;
	phone: string;
	civility: string;
	status: string;
	roles: string[];
	active_company: number;
	director: boolean;
	has_wallet_access: boolean;
	has_business_account: boolean;
	address: Address;
	created_at: string;
	acronym: string;
}

export interface ApeCode {
	id: number;
	code: string;
	label: string;
}

export interface VatSystem {
	id: number;
	code: string;
	label: string;
	type: string;
}

export interface Company {
	id: number;
	name: string;
	legal_form: string;
	siret: string;
	vat_number: string;
	intracom_vat_number: string;
	ape_code: ApeCode;
	street: string;
	address_complement: string | null;
	postal_code: string;
	city: string;
	country: string;
	share_capital: number;
	registration_date: string;
	activity_start_date: string;
	vat_system: VatSystem;
	tax_regime: string;
	receipt_email: string;
	payment_email: string;
	has_invoices: boolean;
	logo: { id: number };
	uuid: string;
	slug: string;
}

export interface Client {
	id: number;
	name: string;
	slug: string;
	address: string;
	address_complement: string | null;
	postal_code: string;
	city: string;
	country: Country;
	country_code: string;
	email: string | null;
	phone: string | null;
	siren_or_siret: string;
	siret: string | null;
	siren: string | null;
	intracom_vat_number: string | null;
	archived: boolean;
	archived_at: string | null;
	professional: boolean;
	color: string;
	acronym: string;
	note: string | null;
	bic: string | null;
	iban: string | null;
	invoicing_use_email: boolean;
}

export interface Bank {
	id: number;
	name: string;
	brand: string;
	sigle: string;
	code: string;
	logo_url: string;
}

export interface BankAccount {
	id: number;
	name: string;
	bank: Bank;
	bank_account_type: { id: number; code: string; description: string };
	iban: string;
	bic: string;
	enabled: boolean;
	balance_amount: number;
	balance_currency: string;
	balance_date: string;
	is_wallet: boolean;
	closed: boolean;
	synchronization_date: string;
}

export interface BankTransaction {
	id: number;
	wording: string;
	original_wording: string;
	amount: number;
	currency: string;
	transaction_date: string;
	realization_date: string;
	vat_application_date: string;
	bank_account: { id: number };
	operation_type: string;
	status: string;
	status_code: string;
	comment: string | null;
	tags: unknown[];
	short_bank_name: string;
	beneficiary: unknown | null;
	merchant: unknown | null;
	transfer_label: string | null;
	imputations: Imputation[];
}

export interface BankTransactionsResponse {
	metadata: {
		has_multiple_cardholder: boolean;
		accountant_detail_request_data: unknown[];
		total_amount: number;
	};
	transactions: BankTransaction[];
}

export interface InvoiceLine {
	id?: number | null;
	description: string;
	quantity: number;
	unit_amount: number;
	line_amount?: number;
	vat_type: { code: string };
	invoicing_unit?: { id: number; code: string } | null;
	invoicing_category_type?: string;
	article?: { id: number } | null;
	sequence?: number;
	discount_description?: string;
	discount_amount?: number | null;
	discount_percentage?: number | null;
}

export interface InvoiceSendParams {
	recipients: { email: string }[];
	message?: string;
	subject?: string;
}

export interface InvoiceCreateParams {
	client?: { id: number } | null;
	client_name?: string;
	client_address?: string;
	client_postal_code?: string;
	client_city?: string;
	client_country_code?: string;
	client_siren_or_siret?: string | null;
	client_siren_or_siret_enabled?: boolean;
	client_intracom_vat_number?: string | null;
	client_intracom_vat_number_enabled?: boolean;
	emission_date: string;
	due_date?: string;
	due_date_mode?: string;
	title?: string | null;
	title_enabled?: boolean;
	lines: InvoiceLine[];
	text_lines?: unknown[];
	status?: "draft" | "saved";
	template?: string;
	free_field?: string;
	free_field_enabled?: boolean;
	discount_enabled?: boolean;
	bank_detail_enabled?: boolean;
	payment_condition_enabled?: boolean;
	payment_condition?: string;
	iban?: string;
	bic?: string;
}

export interface Invoice {
	id: number;
	client_id: number | null;
	client_name: string;
	compiled_number: string;
	emission_date: string;
	number: number | null;
	status: string;
	title: string | null;
	template: string;
	total_excluding_taxes: number;
	total_including_taxes: number;
	due_date: string;
	lines: InvoiceLine[];
	type: string;
	color: string;
	tags: unknown[];
	totals_per_vat_type: Record<
		string,
		{ total_excluding_taxes: number; vat_amount: number }
	>;
}

export interface Quotation {
	id: number;
	quotation_number: string | null;
	date: string;
	status: string;
	amount_excluding_taxes: number;
	amount_including_taxes: number;
	client: { id: number; name: string } | null;
	invoices?: Invoice[];
}

export interface Document {
	id: number;
	name: string;
	type: string;
	source: string;
	created_at: string;
	metadata: {
		date: string | null;
		amount: number | null;
		supplier_name: string | null;
	};
	file_family: string | null;
	preview_available: boolean;
}

export interface DocumentCategory {
	id: number;
	name: string;
	code: string;
	count: number;
}

export interface ExpenseReport {
	id: number;
	name: string;
	status: string;
	total_amount: number | null;
	metadata: { date: string | null };
}

export interface QuotationCreateParams {
	client?: { id: number } | null;
	client_name?: string;
	date: string;
	title?: string | null;
	lines: InvoiceLine[];
	status?: "draft" | "saved";
}

export interface QuotationSendParams {
	recipients: { email: string }[];
	message?: string;
	subject?: string;
}

export interface ExpenseReportCreateParams {
	name: string;
	metadata?: { date?: string };
}

export interface Label {
	id: number;
	name: string;
	color: string;
}

export interface Tag {
	id: number;
	label: string;
	tag_detail?: {
		id: number;
		label: string;
	};
}

export interface LabelSuggestion {
	id: number;
	label: string;
	name: string;
	acronym: string;
	color: string;
	client: { id: number; name: string } | null;
}

export interface ImputationLabel extends LabelSuggestion {
	disabled: boolean;
	invoice_client?: boolean;
	type?: string;
	predictable?: boolean;
	is_standard?: boolean;
	vat_exoneration_type?: string | null;
	sales?: boolean;
	disabled_by?: string | null;
	registry_type?: string | null;
	vat_exigibility?: string | null;
	vat_area?: string | null;
	sale_type?: string | null;
	configuration_source?: string;
}

export interface Imputation {
	id: number;
	count_documents: number;
	count_invoices: number;
	accountant_detail_requests: { id: number }[];
	amount: number;
	label: ImputationLabel;
	updated_by: string;
	comment: string | null;
}

export interface ImputationParams {
	label: ImputationLabel;
	amount: number;
	documents: { id: number }[];
	accountant_detail_requests: { id: number }[];
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number | null;
	range: { start: number; end: number };
}

export interface DashboardBlock {
	id: number;
	type: string;
	rank: number;
	display_group: string;
}

export interface AccountingPeriod {
	id: number;
	start_date: string;
	end_date: string;
	status: string;
}
