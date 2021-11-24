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
