import { RootContext } from './types'
import { javax } from './helpers'

/** The `@Generated` annotation applied to every top-level model class. */
export function generatedAnnotation(root: RootContext): string {
	return `@${javax(root.useJakarta)}.annotation.Generated(value = "${root.generatorClass}"${root.hideGenerationTimestamp ? '' : `, date = "${root.generatedDate}"`})`
}
