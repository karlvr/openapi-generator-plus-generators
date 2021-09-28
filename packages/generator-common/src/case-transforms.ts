/** Returns the string with the first character converted to upper-case */
export function capitalize(value: string): string {
	if (value.length > 0) {
		return value.substring(0, 1).toUpperCase() + value.substring(1)
	} else {
		return value
	}
}

export function camelCase(value: string): string {
	value = value.replace(/([^a-zA-Z0-9]+)([a-zA-Z0-9])/g, (whole, sep, letter) => capitalize(letter))
	/* If the string starts with capitals, we need to lower-case that first word */
	value = value.replace(/^([A-Z]+)([A-Z][a-z])/, (whole, first, next) => first.toLocaleLowerCase() + next)
	/* Handle all upper-case words */
	value = value.replace(/^([A-Z]+)([^a-zA-Z]|$)/, (whole, first, next) => first.toLocaleLowerCase() + next)
	/* If the string starts with a capital letter, lower-case it */
	value = value.replace(/^[A-Z]/, (whole) => whole.toLocaleLowerCase())
	return value
}

export function pascalCase(value: string): string {
	value = value.replace(/([^a-zA-Z0-9]+)([a-zA-Z0-9])/g, (whole, sep, letter) => capitalize(letter))
	return capitalize(value)
}
