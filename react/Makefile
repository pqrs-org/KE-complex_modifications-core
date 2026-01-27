dev:
	make -C .. update-dist
	pnpm run dev

build:
	rm -fr dist
	pnpm run build
	mkdir -p dist/vendor
	cp node_modules/bootstrap/dist/css/bootstrap.min.css dist/vendor

install:
	pnpm install --frozen-lockfile

update:
	pnpm update

audit:
	pnpm audit

format:
	pnpm run format

lint:
	pnpm run lint
