import { exec } from 'child_process'
import { promises as fs } from 'fs'
import * as path from 'path'
import { ConformanceSuite } from './types'

/**
 * How the suite runs one family of generated clients.
 *
 * A generated client exposes a different API in each language, and even between
 * two generators for one language. A driver holds the code that calls one such
 * API, and knows how to build and run it.
 *
 * Register a driver in {@link DRIVERS}, then name it from a generator package. A
 * generator outside this repository passes its own driver to the suite instead.
 */
export interface ConformanceDriver {
	/**
	 * The name of the driver. A case names a driver by it, in its known defects and
	 * its skipped drivers, and the suite shows it in the name of each test.
	 */
	name: string

	/**
	 * Put the driver sources for `suite` into the generated project.
	 *
	 * The project compiles the driver with its own compiler, so the driver also
	 * proves that a caller can write these calls against the generated types.
	 */
	install(basePath: string, suite: ConformanceSuite): Promise<void>

	/**
	 * Build the project, run the driver for `suite`, and leave the results at
	 * `resultsPath`.
	 *
	 * The driver announces each case to the server at `baseUrl` before it calls.
	 */
	run(basePath: string, suite: ConformanceSuite, baseUrl: string, resultsPath: string): Promise<void>
}

/**
 * `value` as one argument of a POSIX shell command.
 *
 * A shell splits a command on whitespace, and expands several characters inside
 * it. Single quotes stop both, so the shell passes the text through unchanged.
 *
 * Use this for every value that a command line carries, because a path or a URL
 * may hold a space or a character that the shell reads.
 */
export function shellArgument(value: string): string {
	/*
	 * A single quote inside the text ends the quoting. So each one leaves the
	 * quoting, escapes itself, then starts the quoting again.
	 */
	return `'${value.split('\'').join('\'\\\'\'')}'`
}

/** The directory that holds the driver sources of each family. */
const DRIVERS_PATH = path.join(__dirname, '..', 'drivers')

/**
 * The name of the shared scaffold of a family's drivers, without its extension.
 *
 * Each family keeps the code that announces a case, makes a call and writes the
 * report in one file. The entry file of each suite builds on it, so a new suite
 * only adds its calls.
 */
const HARNESS = 'harness'

/**
 * A driver for a generated TypeScript project.
 *
 * The project declares a `prepare` script, so `pnpm install` also builds it. The
 * build compiles `src/harness.ts` and the suite's `src/<suite id>.ts` along with
 * the generated code.
 */
function typeScriptDriver(name: string): ConformanceDriver {
	return {
		name,
		async install(basePath, suite) {
			const source = path.join(DRIVERS_PATH, name)
			const target = path.join(basePath, 'src')
			await fs.copyFile(path.join(source, `${HARNESS}.ts`), path.join(target, `${HARNESS}.ts`))
			await fs.copyFile(path.join(source, `${suite.id}.ts`), path.join(target, `${suite.id}.ts`))
		},
		async run(basePath, suite, baseUrl, resultsPath) {
			await run('pnpm install', basePath)
			await run(`node dist/${suite.id}.js ${shellArgument(baseUrl)} ${shellArgument(resultsPath)}`, basePath)
		},
	}
}

/**
 * The class that drives `suite` in a Maven project: the suite id in upper camel
 * case, then `Driver`. So the `conformance` suite runs `ConformanceDriver`.
 */
function javaDriverClass(suite: ConformanceSuite): string {
	const upperCamel = suite.id.replace(/(^|-)([a-z])/g, (_match, _separator, letter: string) => letter.toUpperCase())
	return `${upperCamel}Driver`
}

/** The class that holds the shared scaffold of a family's Maven drivers. */
const JAVA_HARNESS_CLASS = 'ConformanceHarness'

/** Where `dependency:build-classpath` leaves the project's runtime classpath. */
const CLASSPATH_FILE = 'conformance-classpath.txt'

/**
 * A driver for a generated Maven project.
 *
 * The driver is a plain main class in the project's own sources, which extends
 * the family's `ConformanceHarness`, so `mvn compile` checks it against the
 * generated API. The suite then runs it with the project's runtime classpath.
 *
 * The driver holds no JUnit code on purpose. A generated pom pins its own JUnit
 * version, and that version does not always run under the current Surefire.
 */
function mavenDriver(name: string): ConformanceDriver {
	return {
		name,
		async install(basePath, suite) {
			const source = path.join(DRIVERS_PATH, name)
			const target = path.join(basePath, 'src', 'main', 'java', 'com', 'example')
			await fs.mkdir(target, { recursive: true })
			const driverClass = javaDriverClass(suite)
			await fs.copyFile(path.join(source, `${JAVA_HARNESS_CLASS}.java`), path.join(target, `${JAVA_HARNESS_CLASS}.java`))
			await fs.copyFile(path.join(source, `${driverClass}.java`), path.join(target, `${driverClass}.java`))
		},
		async run(basePath, suite, baseUrl, resultsPath) {
			await run(`mvn -B -q compile dependency:build-classpath -Dmdep.outputFile=${shellArgument(CLASSPATH_FILE)} -DincludeScope=runtime`, basePath)

			const dependencies = (await fs.readFile(path.join(basePath, CLASSPATH_FILE), 'utf-8')).trim()
			const classpath = `target/classes${path.delimiter}${dependencies}`
			await run(`java -cp ${shellArgument(classpath)} com.example.${javaDriverClass(suite)} ${shellArgument(baseUrl)} ${shellArgument(resultsPath)}`, basePath)
		},
	}
}

/** Every driver, by name. A generator package names one of these. */
export const DRIVERS: Record<string, ConformanceDriver> = {
	'fetch-client': typeScriptDriver('fetch-client'),
	'fetch-client2': typeScriptDriver('fetch-client2'),
	'java-cxf': mavenDriver('java-cxf'),
	'java-retrofit': mavenDriver('java-retrofit'),
}

/** Run a command, and fail with its output when it exits with an error. */
export function run(command: string, cwd: string, env?: Record<string, string>): Promise<string> {
	return new Promise((resolve, reject) => {
		exec(command, { cwd, maxBuffer: 16 * 1024 * 1024, env: { ...process.env, ...env } }, (error, stdout, stderr) => {
			if (error) {
				reject(new Error(`${command} exited with code ${error.code || 'unknown'} in ${cwd}:\n${stdout}\n${stderr}`))
			} else {
				resolve(stdout)
			}
		})
	})
}
