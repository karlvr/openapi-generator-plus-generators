import { ts } from '@openapi-generator-plus/template-utils'
import { RootContext } from '../types'

/** Marker interface grouping bean validations appropriate for requests. */
export function validationRequest(root: RootContext): string {
	return ts`
package ${root.validationPackage};

/**
 * An interface to group bean validations appropriate for requests.
 */
public interface Request {

}
`
}
