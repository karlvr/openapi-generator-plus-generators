import { CodegenModel, CodegenProperties, CodegenProperty } from '@openapi-generator-plus/types'
import { idx } from '@openapi-generator-plus/core'

/**
 * Return an object containing all of the unique properties, including inherited properties, for a model, where properties
 * in submodels override any same-named properties in parent models.
 * @param model 
 * @param result 
 */
export function uniquePropertiesIncludingInherited(model: CodegenModel, result: CodegenProperties = idx.create()): CodegenProperty[] {
	if (model.parent) {
		uniquePropertiesIncludingInherited(model.parent, result)
	}
	if (model.properties) {
		idx.merge(result, model.properties)
	}

	return idx.allValues(result)
}
