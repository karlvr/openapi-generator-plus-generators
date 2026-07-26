import { ts } from '@openapi-generator-plus/template-utils'
import { RootContext } from '../types'
import { generatedAnnotation } from '../generatedAnnotation'

/** A `java.util.Set`-backed container for the `explode: false` parameter encoding. */
export function noExplodeSet(root: RootContext): string {
	return ts`
package ${root.supportPackage};

/**
 * A container for a set of parameters that uses {@code explode: false} encoding.
 */
${generatedAnnotation(root)}
public class NoExplodeSet<T> extends ${root.supportPackage}.NoExplodeCollection<T> {

	private java.util.Set<T> contents;

	public NoExplodeSet() {
		this.contents = new java.util.HashSet<>();
	}

	public NoExplodeSet(java.util.Collection<T> source) {
		this();
		this.addAll(source);
	}

	@java.lang.Override
	public java.util.stream.Stream<T> stream() {
		return this.contents.stream();
	}

	public java.util.Set<?> getContents() {
		return this.contents;
	}

	public void setContents(java.util.Set<T> contents) {
		this.contents = contents;
	}

	@java.lang.Override
	public void add(T ob) {
		this.contents.add(ob);
	}

	@java.lang.Override
	public void addAll(java.util.Collection<T> collection) {
		this.contents.addAll(collection);
	}

}
`
}
