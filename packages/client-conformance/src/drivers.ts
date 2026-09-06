import { exec } from 'child_process'
import { promises as fs } from 'fs'
import * as path from 'path'

/**
 * How the suite runs one family of generated clients.
 *
 * A generated client exposes a different API in each language, and even between
 * two generators for one language. A driver holds the code that calls one such
 * API, and knows how to build and run it.
 *
 * Register a driver in {@link DRIVERS}, then name it from a generator package.
 */
export interface ConformanceDriver {
	/**
	 * Put the driver sources into the generated project.
	 *
	 * The project compiles the driver with its own compiler, so the driver also
	 * proves that a caller can write these calls against the generated types.
	 */
	install(basePath: string): Promise<void>

	/**
	 * Build the project, run the driver, and leave the results at `resultsPath`.
	 *
	 * The driver announces each case to the server at `baseUrl` before it calls.
	 */
	run(basePath: string, baseUrl: string, resultsPath: string): Promise<void>
}

/** The directory that holds the driver sources of each family. */
const DRIVERS_PATH = path.join(__dirname, '..', 'drivers')

/**
 * A driver for a generated TypeScript project.
 *
 * The project declares a `prepare` script, so `pnpm install` also builds it. The
 * build compiles `src/driver.ts` along with the generated code.
 */
function typeScriptDriver(name: string): ConformanceDriver {
	return {
		async install(basePath) {
			const source = path.join(DRIVERS_PATH, name, 'driver.ts')
			await fs.copyFile(source, path.join(basePath, 'src', 'driver.ts'))
		},
		async run(basePath, baseUrl, resultsPath) {
			await run('pnpm install', basePath)
			await run(`node dist/driver.js ${JSON.stringify(baseUrl)} ${JSON.stringify(resultsPath)}`, basePath)
		},
	}
}

/** Where `dependency:build-classpath` leaves the project's runtime classpath. */
const CLASSPATH_FILE = 'conformance-classpath.txt'

/**
 * A driver for a generated Maven project.
 *
 * The driver is a plain main class in the project's own sources, so `mvn compile`
 * checks it against the generated API. The suite then runs it with the project's
 * runtime classpath.
 *
 * The driver holds no JUnit code on purpose. A generated pom pins its own JUnit
 * version, and that version does not always run under the current Surefire.
 */
function mavenDriver(name: string, driverClass: string): ConformanceDriver {
	return {
		async install(basePath) {
			const source = path.join(DRIVERS_PATH, name, `${driverClass}.java`)
			const target = path.join(basePath, 'src', 'main', 'java', 'com', 'example')
			await fs.mkdir(target, { recursive: true })
			await fs.copyFile(source, path.join(target, `${driverClass}.java`))
		},
		async run(basePath, baseUrl, resultsPath) {
			await run(`mvn -B -q compile dependency:build-classpath -Dmdep.outputFile=${CLASSPATH_FILE} -DincludeScope=runtime`, basePath)

			const dependencies = (await fs.readFile(path.join(basePath, CLASSPATH_FILE), 'utf-8')).trim()
			const classpath = `target/classes${path.delimiter}${dependencies}`
			await run(`java -cp ${JSON.stringify(classpath)} com.example.${driverClass} ${JSON.stringify(baseUrl)} ${JSON.stringify(resultsPath)}`, basePath)
		},
	}
}

/** Every driver, by name. A generator package names one of these. */
export const DRIVERS: Record<string, ConformanceDriver> = {
	'fetch-client': typeScriptDriver('fetch-client'),
	'fetch-client2': typeScriptDriver('fetch-client2'),
	'java-cxf': mavenDriver('java-cxf', 'ConformanceDriver'),
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
