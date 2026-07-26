import { JavaModelContext, RootContext } from '@openapi-generator-plus/java-jaxrs-generator-common'
import { CodegenOptionsJavaServer } from '../types'

/** This generator's root template context: the family's shared root context plus this generator's own package options. */
export type ServerRootContext = RootContext & CodegenOptionsJavaServer

/** The context bundle for this generator's own templates (the API classes, the JAX-RS provider and the invoker). */
export interface ServerContext extends JavaModelContext {
	root: ServerRootContext
}
