dev:
	make -C .. update-dist
	pnpm run dev

build:
	rm -fr dist
	pnpm run build
	mkdir -p dist/vendor
	cp node_modules/bootstrap/dist/css/bootstrap.min.css dist/vendor

check:
	pnpm run format:check
	pnpm run lint
	pnpm run test
	@check_dist="$$(mktemp -d)"; \
	trap 'rm -rf "$$check_dist"' EXIT; \
	pnpm run build --outDir "$$check_dist" --emptyOutDir

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
