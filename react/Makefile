dev:
	make -C .. update-dist
	npm run dev

build:
	rm -fr dist
	npm run build
	mkdir -p dist/vendor
	cp node_modules/bootstrap/dist/css/bootstrap.min.css dist/vendor

install:
	npm ci

update:
	npm update

audit:
	npm audit

format:
	npm run format
