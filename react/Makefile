.PHONY: build

dev:
	npm run dev

build: install
	npm run build

install:
	npm ci --no-audit
	$(MAKE) audit

update:
	npm update --no-audit
	$(MAKE) audit

audit:
	npm audit --omit=dev

format:
	npm run format
