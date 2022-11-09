export function isNumber(str: string) {
	return /^\d+$/.test(str);
}

export function getLargestColor(scheme: string) {
	const schemeNormalized = scheme.replace(/\s/g, "");
	let colorCount = 0;
	for (let i = 0; i < schemeNormalized.length; i++) {
		const char = schemeNormalized.charAt(i);
		if (isNumber(char)) {
			const number = Number.parseInt(char);
			if (number > colorCount) {
				colorCount = number;
			}
		}
	}
	return colorCount;
}
