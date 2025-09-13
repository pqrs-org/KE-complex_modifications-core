.PHONY: build

dev:
	make -C .. update-dist
	npm run dev

build: install
	npm run build

install:
	npm ci

update:
	npm update

audit:
	npm audit

format:
	npm run format
