import { ts } from '@openapi-generator-plus/template-utils'
import { RootContext } from '../types'

/** Marker interface grouping bean validations appropriate for responses. */
export function validationResponse(root: RootContext): string {
	return ts`
package ${root.validationPackage};

/**
 * An interface to group bean validations appropriate for responses.
 */
public interface Response {

}
`
}
