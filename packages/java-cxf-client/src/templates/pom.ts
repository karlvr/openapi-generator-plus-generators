import { ts, when, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext, MavenOptions } from '@openapi-generator-plus/java-jaxrs-generator-common'

/** The configured Maven dependency version for `key`, or `fallback` if none was configured. */
function mavenVersion(maven: MavenOptions, key: string, fallback: string): string {
	const value = maven.versions[key]
	return value !== undefined ? String(value) : fallback
}

/** This client's extra `<properties>`: the CXF client version, and (when tests are included) the JUnit version. */
export function pomProperties(ctx: JavaModelContext): string {
	const maven = ctx.root.maven
	if (!maven) {
		throw new Error('pomProperties requires maven options to be set')
	}

	/*
	 * The original template looked up `junit-jupiter.version` via `{{lookup maven.version
	 * 'junit_jupiter' '5.7.2'}}` — `maven.version` (singular) is the project's own version
	 * *string*, not the `maven.versions` lookup table, so that lookup always misses and
	 * falls back to its default. Preserved verbatim here as a literal, rather than wired up
	 * to `mavenVersion`, to keep this byte-identical with that (unconfigurable) behaviour.
	 */
	return ts`
<cxf.version>${mavenVersion(maven, 'cxf', '3.6.9')}</cxf.version>
${when(ctx.root.includeTests, () => '<junit-jupiter.version>5.7.2</junit-jupiter.version>')}`
}

/** This client's extra `<dependency>` entries: the CXF client, and (when tests are included) JUnit. */
export function pomDependencies(ctx: JavaModelContext): string {
	return ts`
<dependency>
	<groupId>org.apache.cxf</groupId>
	<artifactId>cxf-rt-rs-client</artifactId>
	<version>\${cxf.version}</version>
</dependency>
${when(ctx.root.includeTests, () => ts`

<dependency>
	<groupId>org.junit.jupiter</groupId>
	<artifactId>junit-jupiter</artifactId>
	<scope>test</scope>
</dependency>`)}`
}

/** This client's extra `<dependencyManagement>` entries: the JUnit BOM, when tests are included. */
export function pomDependencyManagement(ctx: JavaModelContext): string | Skip {
	return when(ctx.root.includeTests, () => ts`
<dependency>
	<groupId>org.junit</groupId>
	<artifactId>junit-bom</artifactId>
	<version>\${junit-jupiter.version}</version>
	<type>pom</type>
	<scope>import</scope>
</dependency>`)
}

/** This client's extra `<build>` content: Surefire's JUnit engine dependency, when tests are included. */
export function pomBuild(ctx: JavaModelContext): string | Skip {
	const maven = ctx.root.maven
	if (!maven) {
		throw new Error('pomBuild requires maven options to be set')
	}

	return when(ctx.root.includeTests, () => ts`
<pluginManagement>
	<plugins>
		<plugin>
			<groupId>org.apache.maven.plugins</groupId>
			<artifactId>maven-surefire-plugin</artifactId>
			<version>${mavenVersion(maven, 'maven-surefire-plugin', '3.5.4')}</version>
			<dependencies>
				<dependency>
					<groupId>org.junit.jupiter</groupId>
					<artifactId>junit-jupiter-engine</artifactId>
					<version>\${junit-jupiter.version}</version>
				</dependency>
			</dependencies>
		</plugin>
	</plugins>
</pluginManagement>`)
}
