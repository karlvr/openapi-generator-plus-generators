package com.example;

/**
 * The discriminator conformance driver for the java-retrofit-client generator.
 *
 * The suite copies this file into the generated project, so the project's own
 * compiler checks it against the generated types. A base schema that lost its
 * discriminator property then fails the build here, because the driver sets it.
 *
 * Run it as: java -cp ... com.example.DiscriminatorsDriver <baseUrl> <resultsPath>
 */
public class DiscriminatorsDriver extends ConformanceHarness {

	public static void main(String[] args) throws Exception {
		new DiscriminatorsDriver(args[0], args[1]).drive();
	}

	private DiscriminatorsDriver(String baseUrl, String resultsPath) {
		super(baseUrl, resultsPath);
	}

	@Override
	protected void run() throws Exception {
		DiscriminatorApi discriminator = retrofit().create(DiscriminatorApi.class);

		/* SubObject2 takes thisProperty from IndependentObject, and the value for it is false */
		startCase("discriminator-boolean-request");
		call(() -> discriminator.discriminatorBooleanSend(new com.example.model.SubObject2()
			.thisProperty(false)
			.otherProperty2("y")).execute());

		startCase("discriminator-boolean-response");
		call(() -> discriminator.discriminatorBooleanReceive().execute());

		/* The base schema on its own. It declares thisProperty, so a caller can set it and read it. */
		startCase("discriminator-base-standalone");
		call(() -> discriminator.discriminatorBase(new com.example.model.IndependentObject()
			.thisProperty(true)
			.otherProperty2("z")).execute());

		startCase("discriminator-string-request");
		call(() -> discriminator.discriminatorPet(new com.example.model.Cat()
			.petType("Cat")
			.name("mog")).execute());

		startCase("discriminator-enum-request");
		call(() -> discriminator.discriminatorShape(new com.example.model.Circle()
			.kind(com.example.model.ShapeKind.CIRCLE)
			.label("round")
			.radius(new java.math.BigDecimal("1.5"))).execute());

		/* A caller who wrote against the old client could not set petType. The pojo must carry it anyway. */
		startCase("discriminator-default-value");
		call(() -> discriminator.discriminatorPet(new com.example.model.Cat().name("mog")).execute());

		/* Lion is a member of two discriminators that disagree on its value, so the caller sets it */
		startCase("discriminator-conflicting-values");
		call(() -> discriminator.discriminatorFeline(new com.example.model.Lion()
			.species("lion")
			.name("leo")).execute());

		startCase("discriminator-conflicting-values-other");
		call(() -> discriminator.discriminatorLegacyFeline(new com.example.model.Lion()
			.species("LION")
			.name("leo")).execute());
	}

}
