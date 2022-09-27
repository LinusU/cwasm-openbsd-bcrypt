.PHONY: test

bcrypt.wasm: Dockerfile
	docker build --platform linux/amd64 .
	sh -c 'docker run --platform linux/amd64 --rm -it $$(docker build --platform linux/amd64 -q .) | base64 -D > bcrypt.wasm'

test: bcrypt.wasm
	@node_modules/.bin/standard
	@node_modules/.bin/mocha
	@node_modules/.bin/ts-readme-generator --check
