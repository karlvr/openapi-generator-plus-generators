import { testGenerate } from '@openapi-generator-plus/generator-common/dist/testing'
import { promises as fs } from 'fs'
import path from 'path'
import { createCodegenResult } from '@openapi-generator-plus/testing'
import createGenerator from '..'
import { DEFAULT_CONFIG } from './common'

/*
 * A schema that declares a discriminator property keeps it, because a caller may reach that schema
 * outside the discriminator hierarchy. A member narrows the property to its own value instead.
 * See https://github.com/karlvr/openapi-generator-plus-generators/issues/48
 */
test('discriminator properties', async() => {
	const specPath = path.join(__dirname, '..', '..', '..', '..', '__tests__', 'specs', 'issues', '48.yml')
	const result = await createCodegenResult(specPath, DEFAULT_CONFIG, createGenerator)

	let models = ''
	await testGenerate(result, {
		testName: 'discriminator',
		postProcess: async(basePath) => {
			models = await fs.readFile(path.join(basePath, 'src', 'models.ts'), 'utf-8')
		},
	})

	function model(name: string): string {
		const start = models.indexOf(`export interface ${name} `)
		expect(start).toBeGreaterThan(-1)
		const end = models.indexOf('\n\t}', start)
		return models.substring(start, end)
	}

	/*
	 * IndependentObject declares the property, and an operation uses IndependentObject as a request
	 * body and a response, so the property must stay. Without it a caller could not send a value
	 * that the API requires.
	 */
	expect(model('IndependentObject')).toContain('thisProperty: boolean;')

	/* DeepBase declares the property two levels above its members, so it keeps it as well */
	expect(model('DeepBase')).toContain('kind: Api.AnimalKind;')

	/* A member narrows the property to its own value, and declares it once */
	const subObject1 = model('SubObject1')
	expect(subObject1).toContain('thisProperty: true;')
	expect(subObject1.match(/thisProperty/g)).toHaveLength(1)

	/* A member that takes the property from a base omits the base's declaration, so it can narrow it */
	const subObject2 = model('SubObject2')
	expect(subObject2).toContain('extends Omit<Api.IndependentObject, \'thisProperty\'>')
	expect(subObject2).toContain('thisProperty: false;')
	expect(subObject2.match(/thisProperty: /g)).toHaveLength(1)

	/* Each Event member declares its own action property, so SharedBase must not gain one */
	expect(model('SharedBase')).not.toContain('action')

	const eventItemAdded = model('EventItemAdded')
	expect(eventItemAdded).toContain('extends Api.SharedBase')
	/* The generators render a single-value enum either as its own enum or as a string literal */
	expect(eventItemAdded).toMatch(/action: (Api\.EventItemAdded\.ActionEnum\.ItemAdded|'item_added');/)
	expect(eventItemAdded.match(/action: /g)).toHaveLength(1)
}, 20000)

/*
 * Cat is a member of two discriminators that disagree on the value of petType. No one value names
 * Cat, so the property admits each value, and the caller chooses the one that suits the
 * discriminator that it sends Cat through.
 */
test('discriminator values that disagree', async() => {
	const specPath = path.join(__dirname, '..', '..', '..', '..', '__tests__', 'specs', 'one-of-discriminator-conflicting-values.yml')
	const result = await createCodegenResult(specPath, DEFAULT_CONFIG, createGenerator)

	let models = ''
	await testGenerate(result, {
		testName: 'discriminator-conflicting-values',
		postProcess: async(basePath) => {
			models = await fs.readFile(path.join(basePath, 'src', 'models.ts'), 'utf-8')
		},
	})

	const start = models.indexOf('export interface Cat ')
	expect(start).toBeGreaterThan(-1)
	const cat = models.substring(start, models.indexOf('\n\t}', start))
	expect(cat).toContain('petType: \'cat\' | \'CAT\';')
	expect(cat.match(/petType: /g)).toHaveLength(1)
}, 20000)
