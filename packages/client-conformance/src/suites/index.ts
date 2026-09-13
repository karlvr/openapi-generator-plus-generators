import { ConformanceSuite } from '../types'
import { CONFORMANCE } from './conformance'

/**
 * Every conformance suite, in the order that a generator package runs them.
 *
 * A generator that supports every suite runs all of these. A generator that
 * cannot express one of them runs the rest by name.
 */
export const SUITES: ConformanceSuite[] = [CONFORMANCE]

export { CONFORMANCE } from './conformance'
