export function fromGoogleToMonumLanguage(language: string) {
	switch (language) {
		case 'en':
			return 'en_US';
		case 'es':
			return 'es_ES';
		case 'fr':
			return 'fr_FR';
		default:
			return 'en_US';
	}
}
