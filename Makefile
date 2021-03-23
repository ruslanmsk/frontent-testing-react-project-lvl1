install:
	npm install

publish:
	npm publish --dry-run

test:
	npm test

test-coverage:
	npm run test -- --coverage --coverageProvider=v8

lint:
	npx eslint .

lint-fix:
	npx eslint . --fix