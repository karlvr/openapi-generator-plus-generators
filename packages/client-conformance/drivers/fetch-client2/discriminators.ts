/*
 * The discriminator conformance driver for the typescript-fetch-client2
 * generator, and for the generators that build on it.
 *
 * The suite copies this file into the generated project, so the project's own
 * compiler checks it against the generated types. A base schema that lost its
 * discriminator property then fails the build here, because the driver sets it.
 *
 * Run it as: node dist/discriminators.js <baseUrl> <resultsPath>
 */

import { Api, Configuration, DiscriminatorApi, setDefaultConfiguration } from './index'
import { baseUrl, call, drive, startCase } from './harness'

async function main(): Promise<void> {
	setDefaultConfiguration(new Configuration({ baseUri: baseUrl }))

	/* SubObject2 takes thisProperty from IndependentObject, and narrows it to false */
	await startCase('discriminator-boolean-request')
	const subObject2: Api.SubObject2 = { thisProperty: false, otherProperty2: 'y' }
	await call(() => DiscriminatorApi.discriminatorBooleanSend(subObject2))

	await startCase('discriminator-boolean-response')
	await call(() => DiscriminatorApi.discriminatorBooleanReceive())

	/* The base schema on its own. It declares thisProperty, so a caller can set it and read it. */
	await startCase('discriminator-base-standalone')
	const independent: Api.IndependentObject = { thisProperty: true, otherProperty2: 'z' }
	await call(() => DiscriminatorApi.discriminatorBase(independent))

	await startCase('discriminator-string-request')
	const cat: Api.Cat = { petType: 'Cat', name: 'mog' }
	await call(() => DiscriminatorApi.discriminatorPet(cat))

	await startCase('discriminator-enum-request')
	const circle: Api.Circle = { kind: 'circle', label: 'round', radius: 1.5 }
	await call(() => DiscriminatorApi.discriminatorShape(circle))

	/* Lion is a member of two discriminators that disagree on its value, so its type admits both */
	await startCase('discriminator-conflicting-values')
	const lion: Api.Lion = { species: 'lion', name: 'leo' }
	await call(() => DiscriminatorApi.discriminatorFeline(lion))

	await startCase('discriminator-conflicting-values-other')
	const legacyLion: Api.Lion = { species: 'LION', name: 'leo' }
	await call(() => DiscriminatorApi.discriminatorLegacyFeline(legacyLion))
}

drive(main)
