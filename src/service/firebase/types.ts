import { DocumentReference } from 'firebase/firestore';

export interface GuNumberDocument {
	asign_date?: string;
	associations_to_look?: string[];
	black_list_gu?: string[];
	bypass_bot?: boolean;
	commissions_look?: string[];
	global_associations?: boolean;
	is_active_gu?: boolean;
	my_associations?: boolean;
	owner_properties?: boolean;
	phone_number?: string;
	user_owner?: DocumentReference | string;
	user_phone_number?: string;
	zones_to_look?: string[];
	[key: string]: unknown;
}

export interface UserDocument {
	phone_number: string;
	associations?: string[];
	gu_number?: DocumentReference; // referencia al documento en `gu_numbers`
	gu_number_data?: GuNumberDocument; // datos completos desreferenciados
	[key: string]: unknown;
}

export interface PropertyDocument {
	[key: string]: unknown;
}

export interface EstadoDocument {
	estado: string;
	dataCSV: string;
}

export interface PropMonetization {
	[key: string]: unknown;
}

export interface AddDocumentParams {
	collection: string;
	document: Record<string, unknown>;
	propMonetizations?: PropMonetization[];
}

export interface GetUserByPhoneParams {
	phoneNumber: string;
}

export interface GetUserByAssociationParams {
	association: string;
}

export interface GetCsvByStateParams {
	state: string;
}
