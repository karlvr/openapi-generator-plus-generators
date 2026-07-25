import { ts } from '@openapi-generator-plus/template-utils'
import { RootContext } from '../types'
import { generatedAnnotation } from '../generatedAnnotation'

/** A `java.util.List`-backed container for the `explode: false` parameter encoding. */
export function noExplodeList(root: RootContext): string {
	return ts`
package ${root.supportPackage};

/**
 * A container for a list of parameters that uses {@code explode: false} encoding.
 */
${generatedAnnotation(root)}
public class NoExplodeList<T> extends ${root.supportPackage}.NoExplodeCollection<T> {

	private java.util.List<T> contents;

	public NoExplodeList() {
		this.contents = new java.util.ArrayList<>();
	}

	public NoExplodeList(java.util.Collection<T> source) {
		this();
		this.addAll(source);
	}

	@java.lang.Override
	public java.util.stream.Stream<T> stream() {
		return this.contents.stream();
	}

	public java.util.List<?> getContents() {
		return this.contents;
	}

	public void setContents(java.util.List<T> contents) {
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
