import { JavaModelContext, RootContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { CodegenOptionsJavaClient } from '../types'

/** This generator's root template context: the family's shared root context plus this generator's own package options. */
export type ClientRootContext = RootContext & CodegenOptionsJavaClient

/** The context bundle for this generator's own templates (the API client classes, its spec/spi and the invoker). */
export interface ClientContext extends JavaModelContext {
	root: ClientRootContext
}
