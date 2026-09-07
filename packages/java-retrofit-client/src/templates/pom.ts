import { ts, when } from '@openapi-generator-plus/template-utils'
import { JavaModelContext, MavenOptions } from '@openapi-generator-plus/java-jaxrs-generator-common'

/** The configured Maven dependency version for `key`, or `fallback` if none was configured. */
function mavenVersion(maven: MavenOptions, key: string, fallback: string): string {
	const value = maven.versions[key]
	return value !== undefined ? String(value) : fallback
}

/**
 * This client's whole `pom.xml`: Retrofit, Jackson and (when enabled) bean-validation
 * dependencies.
 */
export function pom(ctx: JavaModelContext): string {
	const maven = ctx.root.maven
	if (!maven) {
		throw new Error('pom requires maven options to be set')
	}
	const useJakarta = ctx.root.useJakarta
	const useBeanValidation = ctx.root.useBeanValidation
	const useLombok = ctx.root.useLombok

	/*
	 * Every generated file carries a `@Generated` annotation, and a model carries the XML
	 * binding annotations. Java 11 removed both packages from the JDK, so the project has to
	 * declare them itself.
	 */
	const annotationDependencies = useJakarta
		? ts`
<dependency>
	<groupId>jakarta.annotation</groupId>
	<artifactId>jakarta.annotation-api</artifactId>
	<version>\${jakarta.annotation.version}</version>
</dependency>
<dependency>
	<groupId>jakarta.xml.bind</groupId>
	<artifactId>jakarta.xml.bind-api</artifactId>
	<version>\${jakarta.xml.bind.version}</version>
</dependency>`
		: ts`
<dependency>
	<groupId>javax.annotation</groupId>
	<artifactId>javax.annotation-api</artifactId>
	<version>\${javax.annotation.version}</version>
</dependency>
<dependency>
	<groupId>javax.xml.bind</groupId>
	<artifactId>jaxb-api</artifactId>
	<version>\${javax.xml.bind.version}</version>
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

	const lombokAnnotationProcessor = when(useLombok, () => ts`
<annotationProcessorPaths>
	<path>
		<groupId>org.projectlombok</groupId>
		<artifactId>lombok</artifactId>
		<version>\${lombok.version}</version>
	</path>
</annotationProcessorPaths>`)

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
		<retrofit.version>${mavenVersion(maven, 'retrofit', '2.9.0')}</retrofit.version>
		<retrofit.converter.version>${mavenVersion(maven, 'retrofit_converter', '2.9.0')}</retrofit.converter.version>
		<jackson.version>${mavenVersion(maven, 'jackson', '2.14.2')}</jackson.version>
		<swagger.version>${mavenVersion(maven, 'swagger', '2.2.5')}</swagger.version>
		${useJakarta
			? ts`
<jakarta.annotation.version>${mavenVersion(maven, 'jakarta_annotation', '2.1.0')}</jakarta.annotation.version>
<jakarta.xml.bind.version>${mavenVersion(maven, 'jakarta_xml_bind', '3.0.1')}</jakarta.xml.bind.version>`
			: ts`
<javax.annotation.version>${mavenVersion(maven, 'javax_annotation', '1.3.2')}</javax.annotation.version>
<javax.xml.bind.version>${mavenVersion(maven, 'javax_xml_bind', '2.3.1')}</javax.xml.bind.version>`}
		${when(useBeanValidation, () => useJakarta
			? `<jakarta.validation.version>${mavenVersion(maven, 'jakarta_validation', '3.0.1')}</jakarta.validation.version>`
			: `<javax.validation.version>${mavenVersion(maven, 'javax_validation', '2.0.0.Final')}</javax.validation.version>`)}
		${when(useLombok, () => `<lombok.version>${mavenVersion(maven, 'lombok', '1.18.46')}</lombok.version>`)}
	</properties>

	<dependencies>
		${annotationDependencies}
		<dependency>
			<groupId>com.squareup.retrofit2</groupId>
			<artifactId>retrofit</artifactId>
			<version>\${retrofit.version}</version>
		</dependency>
		<!-- Retrofit reads and writes the models with Jackson, which the models are annotated for -->
		<dependency>
			<groupId>com.squareup.retrofit2</groupId>
			<artifactId>converter-jackson</artifactId>
			<version>\${retrofit.converter.version}</version>
		</dependency>

		<dependency>
			<groupId>io.swagger.core.v3</groupId>
			<artifactId>swagger-annotations</artifactId>
			<version>\${swagger.version}</version>
		</dependency>
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
	</build>

</project>
`
}
