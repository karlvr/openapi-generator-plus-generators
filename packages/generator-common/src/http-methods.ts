import { HttpMethods } from '@openapi-generator-plus/types'

export function compareHttpMethods(a: string, b: string): number {
	const aa = httpMethodToNumber(a)
	const bb = httpMethodToNumber(b)
	if (aa < bb) {
		return -1
	} else if (aa > bb) {
		return 1
	} else {
		return 0
	}
}

function httpMethodToNumber(method: string): number {
	let i = 0
	for (const aMethod in HttpMethods) {
		if (method === aMethod) {
			return i
		}
		i += 1
	}

	return i
}
