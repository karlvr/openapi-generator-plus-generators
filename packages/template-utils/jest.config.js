module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testPathIgnorePatterns: [
		'/node_modules/',
		'/dist/',
	],
	testRegex: '(\\.|/)(test|spec)\\.[jt]sx?$',
	testTimeout: 60000,
}
