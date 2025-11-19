import { firebaseClient } from './client';

export interface OwnerSettings {
	included_properties: 'own_properties' | 'all_properties' | 'own_and_associations';
	associations_to_include_in_search?: string[];
	allowed_comission_percentages?: string[];
}

function getAllCommissionValues(): string[] {
	return ['1', '2', '3', '4', '5'];
}

function convertCommissionLabelsToNumbers(labels?: string[]): string[] {
	const conversionMap: Record<string, string> = {
		'Hasta 1%': '1',
		'Hasta 2%': '2',
		'Hasta 3%': '3',
		'Hasta 4%': '4',
		'Más de 5%': '5',
	};

	if (!labels || labels.length === 0) return getAllCommissionValues();

	return labels
		.map((label) => {
			if (!label) return '';
			const trimmed = label.trim();
			return conversionMap[trimmed] || trimmed.replace('%', '').replace(/[^0-9]/g, '');
		})
		.filter(Boolean);
}

export async function getOwnerInfoByFirebaseId(ownerFirebaseId: string) {
	let ownerSettings: OwnerSettings | null = null;

	const ownerInfo = await firebaseClient.findUserById(ownerFirebaseId);
	if (!ownerInfo) return null;

	const guSettings = ownerInfo.gu_number_data;
	if (!guSettings) return null;

	// Caso todas las propiedades (que comparten comisión)
	if (guSettings.global_associations && guSettings.owner_properties == false && guSettings.my_associations == false) {
		ownerSettings = {
			included_properties: 'all_properties',
			allowed_comission_percentages: convertCommissionLabelsToNumbers(guSettings.commissions_look),
		};
	}

	// Caso solo mis propiedades
	else if (
		guSettings.global_associations &&
		guSettings.owwner_properties == false &&
		guSettings.my_associations == false
	) {
		ownerSettings = {
			included_properties: 'own_properties',
		};
	}
	// Caso mis propiedades y asociaciones (como está bugeado, lo dejaré así)
	else {
		ownerSettings = {
			included_properties: 'own_and_associations',
			associations_to_include_in_search: guSettings.associations_to_look || [],
			allowed_comission_percentages: convertCommissionLabelsToNumbers(guSettings.commissions_look),
		};
	}

	return ownerSettings;
}
