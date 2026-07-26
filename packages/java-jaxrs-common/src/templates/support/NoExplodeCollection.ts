import { ts } from '@openapi-generator-plus/template-utils'
import { RootContext } from '../types'
import { generatedAnnotation } from '../generatedAnnotation'

/** The abstract base class for the `explode: false` parameter containers. */
export function noExplodeCollection(root: RootContext): string {
	return ts`
package ${root.supportPackage};

/**
 * A container for a list of parameters that uses {@code explode: false} encoding.
 */
${generatedAnnotation(root)}
public abstract class NoExplodeCollection<T> {

	public abstract java.util.stream.Stream<T> stream();

	public abstract void add(T ob);

	public abstract void addAll(java.util.Collection<T> collection);

}
`
}
