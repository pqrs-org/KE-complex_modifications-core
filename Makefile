.PHONY: format format-react format-python

all: build_rules
	python3 scripts/sort_groups.py '../public/groups.json'
	python3 scripts/lint_groups.py '../public/groups.json'
	python3 scripts/build_dist.py

build_rules:
# There are cases where only public rule sources need to be updated, so it is separated into `build_rules`.
# https://github.com/pqrs-org/KE-complex_modifications-core/pull/2
	@echo
	@echo "============================================================"
	@echo "Using a pre-built binary for lint."
	@echo "The code signature of the binary is as follows:"
	@echo
	@codesign -dvv bin/karabiner_cli
	@echo "============================================================"
	@echo

	sandbox-exec -f files/generator.sb bash scripts/update-json.sh
	python3 scripts/lint_src_json.py ../src/json
	python3 scripts/lint_extra_descriptions.py ../public
	@set -e; \
	tmpdir="$$(mktemp -d)"; \
	trap 'rm -rf "$$tmpdir"' EXIT; \
	python3 scripts/build_dist.py --output-directory "$$tmpdir"

rebuild:
	touch ../src/json/*
	$(MAKE) all

update-dist:
	python3 scripts/build_dist.py

preview-server:
	/usr/bin/python3 scripts/preview_server.py

format: format-react format-python

format-react:
	$(MAKE) -C react format

format-python:
	@command -v ruff >/dev/null || { \
	  echo "ruff is required. Run: brew install ruff"; \
	  exit 1; \
	}
	ruff format scripts tests
