//  gen random Id
export function generateProfileId() {
	return Math.random().toString(36).substring(2, 11);
}
