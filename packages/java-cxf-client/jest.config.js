/* https://jestjs.io/docs/en/configuration */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testPathIgnorePatterns: [
		'/node_modules/',
		'/dist/',
		'/test-output/',
	],
	/* Only run files with test or spec in their filename, so we can have support files in __tests__ */
	testRegex: '(\\.|/)(test|spec)\\.[jt]sx?$',
	testTimeout: 60000,
}
