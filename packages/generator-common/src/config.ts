/**
 * Extract a config string that may be explicitly set to null, but has a non-null default value.
 */
export function nullableConfigString<T extends string | null | undefined>(config: { [name: string]: unknown }, key: string, defaultValue: T, path = ''): string | null | T {
	const value = config[key]
	if (value === null) {
		return null
	}
	return configString(config, key, defaultValue, path)
}

export function configString<T extends string | null | undefined>(config: { [name: string]: unknown }, key: string, defaultValue: T, path = ''): string | T {
	const value = config[key]
	if (value === null || value === undefined) {
		return defaultValue
	}
	if (typeof value !== 'string') {
		throw new Error(`Unexpected value of type "${typeof value}" for config key "${path}${key}"`)
	}
	return value
}

export function configStringArray<T extends string[] | null | undefined>(config: { [name: string]: unknown }, key: string, defaultValue: T, path = ''): string[] | T {
	const value = config[key]
	if (value === null || value === undefined) {
		return defaultValue
	}
	if (!Array.isArray(value)) {
		throw new Error(`Unexpected value of type "${typeof value}" for config key "${path}${key}"`)
	}
	for (let i = 0; i < value.length; i++) {
		if (typeof value[i] !== 'string') {
			throw new Error(`Unexpected value of type "${typeof value}" for config key "${path}${key}[${i}]"`)
		}
	}
	return value
}

export function nullableConfigBoolean<T extends boolean | null | undefined>(config: { [name: string]: unknown }, key: string, defaultValue: T, path = ''): boolean | null | T {
	const value = config[key]
	if (value === null) {
		return null
	}
	return configBoolean(config, key, defaultValue, path)
}

export function configBoolean<T extends boolean | null | undefined>(config: { [name: string]: unknown }, key: string, defaultValue: T, path = ''): boolean | T {
	const value = config[key]
	if (value === null || value === undefined) {
		return defaultValue
	}
	if (typeof value !== 'boolean') {
		throw new Error(`Unexpected value of type "${typeof value}" for config key "${path}${key}"`)
	}
	return value
}

export function configNumber<T extends number | null | undefined>(config: { [name: string]: unknown }, key: string, defaultValue: T, path = ''): number | T {
	const value = config[key]
	if (value === null || value === undefined) {
		return defaultValue
	}
	if (typeof value !== 'number') {
		throw new Error(`Unexpected value of type "${typeof value}" for config key "${path}${key}"`)
	}
	return value
}

export function configObject<T extends Record<string, unknown> | null | undefined>(config: { [name: string]: unknown }, key: string, defaultValue: T, path = ''): Record<string, unknown> | T {
	const value = config[key]
	if (value === null || value === undefined) {
		return defaultValue
	}
	if (typeof value !== 'object') {
		throw new Error(`Unexpected value of type "${typeof value}" for config key "${path}${key}"`)
	}
	return value as Record<string, unknown>
}

/**
 * Extract a config value that must be one of a fixed set of names.
 *
 * Use this for an option that accepts a fixed set of names, such as a style or a mode. If the
 * config contains a name that is not valid, this function throws an error that names the valid
 * values.
 * @param values an object that contains the valid values, such as a string enum
 * @param aliases additional accepted names, each mapped to the value that it means. Use this to
 *   continue to accept a deprecated name.
 */
export function configEnum<T extends string, D extends T | null | undefined>(config: { [name: string]: unknown }, key: string, values: Record<string, T>, defaultValue: D, aliases: Record<string, T> = {}, path = ''): T | D {
	const value = configString(config, key, undefined, path)
	if (value === undefined) {
		return defaultValue
	}

	const validValues = Object.values(values)
	if (validValues.indexOf(value as T) !== -1) {
		return value as T
	}

	const alias = aliases[value]
	if (alias !== undefined) {
		return alias
	}

	throw new Error(`Invalid value "${value}" for config key "${path}${key}". Valid values are: ${validValues.join(', ')}`)
}
