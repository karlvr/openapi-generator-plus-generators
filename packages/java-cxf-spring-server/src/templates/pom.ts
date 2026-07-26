import { ts, when, SKIP } from '@openapi-generator-plus/template-utils'
import { JavaModelContext, MavenOptions } from '@openapi-generator-plus/java-jaxrs-generator-common'

/** The configured Maven dependency version for `key`, or `fallback` if none was configured. */
function mavenVersion(maven: MavenOptions, key: string, fallback: string): string {
	const value = maven.versions[key]
	return value !== undefined ? String(value) : fallback
}

/** This generator's `pom.xml`: CXF, Spring, Jackson and Swagger dependencies for a Spring-based server. */
export function pom(ctx: JavaModelContext): string {
	const maven = ctx.root.maven
	if (!maven) {
		throw new Error('pom requires maven options to be set')
	}
	const useJakarta = ctx.root.useJakarta
	const useBeanValidation = ctx.root.useBeanValidation
	const useLombok = ctx.root.useLombok
	const includeTests = ctx.root.includeTests
	const junitVersion = ctx.root.junitVersion

	/* Each supported JUnit version names its version property differently, and an
	 * unrecognised version contributes no property at all. */
	const testVersionProperties = !includeTests
		? SKIP
		: junitVersion === 4
			? `<junit.version>${mavenVersion(maven, 'junit', '4.13')}</junit.version>`
			: junitVersion === 5
				? `<junit-jupiter.version>${mavenVersion(maven, 'junit', '5.7.1')}</junit-jupiter.version>`
				: SKIP

	const jakartaDependencies = when(useJakarta, () => ts`
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

	const jaxrsApiDependency = when(useJakarta, () => ts`
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

	const validationDependency = when(useBeanValidation, () => ts`

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

	/* Only meaningful nested inside `testDependencies`, which is itself gated on `includeTests`. */
	const junitDependency = junitVersion === 4
		? ts`
<dependency>
	<groupId>junit</groupId>
	<artifactId>junit</artifactId>
	<version>\${junit.version}</version>
	<scope>test</scope>
</dependency>`
		: junitVersion === 5
			? ts`
<dependency>
	<groupId>org.junit.jupiter</groupId>
	<artifactId>junit-jupiter</artifactId>
	<scope>test</scope>
</dependency>`
			: SKIP

	const testDependencies = when(includeTests, () => ts`

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
${junitDependency}
<dependency>
	<groupId>org.springframework</groupId>
	<artifactId>spring-test</artifactId>
	<version>\${spring.version}</version>
	<scope>test</scope>
</dependency>`)

	const lombokDependency = when(useLombok, () => ts`

<dependency>
	<groupId>org.projectlombok</groupId>
	<artifactId>lombok</artifactId>
	<version>\${lombok.version}</version>
	<scope>provided</scope>
</dependency>`)

	/* Gated on `includeTests` as well as the JUnit version, since it references the
	 * `junit-jupiter.version` property that only the `includeTests` properties block defines. */
	const junitBomDependency = when(includeTests && junitVersion === 5, () => ts`
<dependency>
	<groupId>org.junit</groupId>
	<artifactId>junit-bom</artifactId>
	<version>\${junit-jupiter.version}</version>
	<type>pom</type>
	<scope>import</scope>
</dependency>`)

	const lombokAnnotationProcessor = when(useLombok, () => ts`
<annotationProcessorPaths>
	<path>
		<groupId>org.projectlombok</groupId>
		<artifactId>lombok</artifactId>
		<version>\${lombok.version}</version>
	</path>
</annotationProcessorPaths>`)

	const surefirePluginManagement = when(includeTests, () => ts`
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
		<spring.version>${mavenVersion(maven, 'spring', '5.2.5.RELEASE')}</spring.version>
		<swagger.version>${mavenVersion(maven, 'swagger', '2.2.5')}</swagger.version>
		<cxf.version>${mavenVersion(maven, 'cxf', useJakarta ? '4.1.4' : '3.6.9')}</cxf.version>
		${when(useJakarta, () => `<jakarta.ws.version>${mavenVersion(maven, 'jakarta_ws', '3.1.0')}</jakarta.ws.version>`)}
		<jaxrs.version>${mavenVersion(maven, 'jaxrs', '2.1.1')}</jaxrs.version>
		<jackson.version>${mavenVersion(maven, 'jackson', '2.14.2')}</jackson.version>
		${when(useJakarta, () => ts`
<jakarta.annotation.version>${mavenVersion(maven, 'jakarta_annotation', '2.1.0')}</jakarta.annotation.version>
<jakarta.xml.bind.version>${mavenVersion(maven, 'jakarta_xml_bind', '3.0.1')}</jakarta.xml.bind.version>`)}
		${when(useBeanValidation, () => useJakarta
			? `<jakarta.validation.version>${mavenVersion(maven, 'jakarta_validation', '3.0.1')}</jakarta.validation.version>`
			: `<javax.validation.version>${mavenVersion(maven, 'javax_validation', '2.0.0.Final')}</javax.validation.version>`)}
		${testVersionProperties}
		${when(useLombok, () => `<lombok.version>${mavenVersion(maven, 'lombok', '1.18.46')}</lombok.version>`)}
		${ctx.templates.pomProperties(ctx)}
	</properties>

	<dependencies>
		${jakartaDependencies}
		<dependency>
			<groupId>org.springframework</groupId>
			<artifactId>spring-context</artifactId>
			<version>\${spring.version}</version>
		</dependency>

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
