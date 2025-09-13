dev:
	make -C .. update-dist
	npm run dev

build:
	rm -fr dist
	cp node_modules/bootstrap/dist/css/bootstrap.min.css public/vendor
	npm run build

install:
	npm ci

update:
	npm update

audit:
	npm audit

format:
	npm run format
