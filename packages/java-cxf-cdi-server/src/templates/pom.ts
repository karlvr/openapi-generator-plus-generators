import { ts, when, Skip } from '@openapi-generator-plus/template-utils'
import { JavaModelContext, MavenOptions } from '@openapi-generator-plus/java-jaxrs-generator-common'

/** The configured Maven dependency version for `key`, or `fallback` if none was configured. */
function mavenVersion(maven: MavenOptions, key: string, fallback: string): string {
	const value = maven.versions[key]
	return value !== undefined ? String(value) : fallback
}

/** This generator's `pom.xml`: CXF, CDI/Weld, Jackson and Swagger dependencies for a CDI-based server. */
export function pom(ctx: JavaModelContext): string {
	const maven = ctx.root.maven
	if (!maven) {
		throw new Error('pom requires maven options to be set')
	}
	const useJakarta = ctx.root.useJakarta
	const useBeanValidation = ctx.root.useBeanValidation
	const useLombok = ctx.root.useLombok
	const includeTests = ctx.root.includeTests

	const cxfVersionProperties = useJakarta
		? ts`
<cxf.version>${mavenVersion(maven, 'cxf', '4.1.4')}</cxf.version>
<jakarta.ws.version>${mavenVersion(maven, 'jakarta_ws', '3.1.0')}</jakarta.ws.version>`
		: `<cxf.version>${mavenVersion(maven, 'cxf', '3.6.9')}</cxf.version>`

	const jakartaVersionProperties: string | Skip = when(useJakarta, () => ts`
<jakarta.annotation.version>${mavenVersion(maven, 'jakarta_annotation', '2.1.0')}</jakarta.annotation.version>
<jakarta.xml.bind.version>${mavenVersion(maven, 'jakarta_xml_bind', '3.0.1')}</jakarta.xml.bind.version>`)

	const validationVersionProperty: string | Skip = when(useBeanValidation, () => useJakarta
		? `<jakarta.validation.version>${mavenVersion(maven, 'jakarta_validation', '3.0.1')}</jakarta.validation.version>`
		: `<javax.validation.version>${mavenVersion(maven, 'javax_validation', '2.0.0.Final')}</javax.validation.version>`)

	const enterpriseVersionProperty = useJakarta
		? `<jakarta.enterprise.version>${mavenVersion(maven, 'jakarta_enterprise', '3.0.1')}</jakarta.enterprise.version>`
		: `<javax.enterprise.version>${mavenVersion(maven, 'javax_enterprise', '2.0.SP1')}</javax.enterprise.version>`

	/*
	 * The original template looked up `junit-jupiter.version` via `{{lookup maven.version
	 * 'junit_jupiter' '5.7.2'}}` — `maven.version` (singular) is the project's own version
	 * *string*, not the `maven.versions` lookup table, so that lookup always misses and
	 * falls back to its default. Preserved verbatim here as a literal, rather than wired up
	 * to `mavenVersion`, to keep this byte-identical with that (unconfigurable) behaviour.
	 */
	const testVersionProperties: string | Skip = when(includeTests, () => ts`
<junit-jupiter.version>5.7.2</junit-jupiter.version>
${useJakarta ? '<weld-junit5.version>5.0.3.Final</weld-junit5.version>' : '<weld-junit5.version>2.0.2.Final</weld-junit5.version>'}`)

	const lombokVersionProperty: string | Skip = when(useLombok, () => `<lombok.version>${mavenVersion(maven, 'lombok', '1.18.46')}</lombok.version>`)

	const jakartaDependencies: string | Skip = when(useJakarta, () => ts`
<dependency>
	<groupId>jakarta.annotation</groupId>
	<artifactId>jakarta.annotation-api</artifactId>
	<version>\${jakarta.annotation.version}</version>
</dependency>
<dependency>
	<groupId>jakarta.xml.bind</groupId>
	<artifactId>jakarta.xml.bind-api</artifactId>
	<version>\${jakarta.xml.bind.version}</version>
</dependency>`)

	const enterpriseDependency = useJakarta
		? ts`
<dependency>
	<groupId>jakarta.enterprise</groupId>
	<artifactId>jakarta.enterprise.cdi-api</artifactId>
	<version>\${jakarta.enterprise.version}</version>
</dependency>`
		: ts`
<dependency>
	<groupId>javax.enterprise</groupId>
	<artifactId>cdi-api</artifactId>
	<version>\${javax.enterprise.version}</version>
</dependency>`

	const jaxrsApiDependency: string | Skip = when(useJakarta, () => ts`
<dependency>
	<groupId>jakarta.ws.rs</groupId>
	<artifactId>jakarta.ws.rs-api</artifactId>
	<version>\${jakarta.ws.version}</version>
</dependency>`)

	const jacksonProviderDependency = useJakarta
		? ts`
<dependency>
	<groupId>com.fasterxml.jackson.jakarta.rs</groupId>
	<artifactId>jackson-jakarta-rs-json-provider</artifactId>
</dependency>`
		: ts`
<dependency>
	<groupId>com.fasterxml.jackson.jaxrs</groupId>
	<artifactId>jackson-jaxrs-json-provider</artifactId>
</dependency>`

	const validationDependency: string | Skip = when(useBeanValidation, () => ts`

${useJakarta
	? ts`
<dependency>
	<groupId>jakarta.validation</groupId>
	<artifactId>jakarta.validation-api</artifactId>
	<version>\${jakarta.validation.version}</version>
</dependency>`
	: ts`
<dependency>
	<groupId>javax.validation</groupId>
	<artifactId>validation-api</artifactId>
	<version>\${javax.validation.version}</version>
</dependency>`}`)

	const testDependencies: string | Skip = when(includeTests, () => ts`

<dependency>
	<groupId>org.apache.cxf</groupId>
	<artifactId>cxf-rt-rs-client</artifactId>
	<version>\${cxf.version}</version>
	<scope>test</scope>
</dependency>
<dependency>
	<groupId>org.apache.cxf</groupId>
	<artifactId>cxf-rt-transports-local</artifactId>
	<version>\${cxf.version}</version>
	<scope>test</scope>
</dependency>
<dependency>
	<groupId>org.jboss.weld</groupId>
	<artifactId>weld-junit5</artifactId>
	<version>\${weld-junit5.version}</version>
	<scope>test</scope>
</dependency>
<dependency>
	<groupId>org.junit.jupiter</groupId>
	<artifactId>junit-jupiter</artifactId>
	<scope>test</scope>
</dependency>`)

	const lombokDependency: string | Skip = when(useLombok, () => ts`

<dependency>
	<groupId>org.projectlombok</groupId>
	<artifactId>lombok</artifactId>
	<version>\${lombok.version}</version>
	<scope>provided</scope>
</dependency>`)

	const junitBomDependency: string | Skip = when(includeTests, () => ts`
<dependency>
	<groupId>org.junit</groupId>
	<artifactId>junit-bom</artifactId>
	<version>\${junit-jupiter.version}</version>
	<type>pom</type>
	<scope>import</scope>
</dependency>`)

	const lombokAnnotationProcessor: string | Skip = when(useLombok, () => ts`
<annotationProcessorPaths>
	<path>
		<groupId>org.projectlombok</groupId>
		<artifactId>lombok</artifactId>
		<version>\${lombok.version}</version>
	</path>
</annotationProcessorPaths>`)

	const surefirePluginManagement: string | Skip = when(includeTests, () => ts`
<pluginManagement>
	<plugins>
		<plugin>
			<groupId>org.apache.maven.plugins</groupId>
			<artifactId>maven-surefire-plugin</artifactId>
			<version>${mavenVersion(maven, 'maven-surefire-plugin', '3.5.4')}</version>
		</plugin>
	</plugins>
</pluginManagement>`)

	return ts`
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<groupId>${maven.groupId}</groupId>
	<artifactId>${maven.artifactId}</artifactId>
	<packaging>jar</packaging>
	<name>${maven.artifactId}</name>
	<version>${maven.version}</version>

	<properties>
		<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
		<project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
		<java.version>${mavenVersion(maven, 'java', '1.8')}</java.version>
		<swagger.version>${mavenVersion(maven, 'swagger', '2.2.5')}</swagger.version>
		${cxfVersionProperties}
		<jaxrs.version>${mavenVersion(maven, 'jaxrs', '2.1.1')}</jaxrs.version>
		<jackson.version>${mavenVersion(maven, 'jackson', '2.14.2')}</jackson.version>
		${jakartaVersionProperties}
		${validationVersionProperty}
		${enterpriseVersionProperty}
		${testVersionProperties}
		${lombokVersionProperty}
		${ctx.templates.pomProperties(ctx)}
	</properties>

	<dependencies>
		${jakartaDependencies}
		${enterpriseDependency}

		<dependency>
			<groupId>io.swagger.core.v3</groupId>
			<artifactId>swagger-annotations</artifactId>
			<version>\${swagger.version}</version>
		</dependency>

		<dependency>
			<groupId>org.apache.cxf</groupId>
			<artifactId>cxf-rt-frontend-jaxrs</artifactId>
			<version>\${cxf.version}</version>
		</dependency>
		<dependency>
			<groupId>org.apache.cxf</groupId>
			<artifactId>cxf-integration-cdi</artifactId>
			<version>\${cxf.version}</version>
		</dependency>
		<dependency>
			<groupId>org.apache.cxf</groupId>
			<artifactId>cxf-rt-rs-extension-providers</artifactId>
			<version>\${cxf.version}</version>
		</dependency>

		${jaxrsApiDependency}
		<!-- Include javax.ws.rs-api as CXF requires it -->
		<dependency>
			<groupId>javax.ws.rs</groupId>
			<artifactId>javax.ws.rs-api</artifactId>
			<version>\${jaxrs.version}</version>
		</dependency>

		${jacksonProviderDependency}
		<dependency>
			<groupId>com.fasterxml.jackson.core</groupId>
			<artifactId>jackson-databind</artifactId>
		</dependency>
		<dependency>
			<groupId>com.fasterxml.jackson.datatype</groupId>
			<artifactId>jackson-datatype-jsr310</artifactId>
		</dependency>
		<dependency>
			<groupId>com.fasterxml.jackson.datatype</groupId>
			<artifactId>jackson-datatype-jdk8</artifactId>
		</dependency>
		${validationDependency}
		${testDependencies}
		${lombokDependency}
	</dependencies>

	<dependencyManagement>
		<dependencies>
			<dependency>
				<groupId>com.fasterxml.jackson</groupId>
				<artifactId>jackson-bom</artifactId>
				<version>\${jackson.version}</version>
				<scope>import</scope>
				<type>pom</type>
			</dependency>
			${junitBomDependency}
		</dependencies>
	</dependencyManagement>

	<build>
		<plugins>
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-compiler-plugin</artifactId>
				<version>${mavenVersion(maven, 'maven-compiler-plugin', '3.14.1')}</version>
				<configuration>
					<source>\${java.version}</source>
					<target>\${java.version}</target>
					${lombokAnnotationProcessor}
				</configuration>
			</plugin>
		</plugins>
		${surefirePluginManagement}
	</build>

</project>
`
}
