export function isNumber(str: string) {
	return /^\d+$/.test(str);
}

export function getLargestColor(scheme: string) {
	let colorCount = 0;
	for (let i = 0; i < scheme.length; i++) {
		const char = scheme.charAt(i);
		if (isNumber(char)) {
			const number = Number.parseInt(char);
			if (number > colorCount) {
				colorCount = number;
			}
		}
	}
	return colorCount;
}
