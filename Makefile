.PHONY: all build_rules prepare_rules show-karabiner-cli update-public-json \
	lint-src-json lint-extra-descriptions rebuild update-dist preview-server \
	format format-react format-python

all: prepare_rules
	python3 scripts/sort_groups.py '../public/groups.json'
	python3 scripts/lint_groups.py '../public/groups.json'
	python3 scripts/build_dist.py

# There are cases where only public rule sources need to be updated, so it is separated into `build_rules`.
# https://github.com/pqrs-org/KE-complex_modifications-core/pull/2
build_rules: prepare_rules
# Validate the distributable output when build_rules is invoked on its own.
	@set -e; \
	tmpdir="$$(mktemp -d)"; \
	trap 'rm -rf "$$tmpdir"' EXIT; \
	python3 scripts/build_dist.py --output-directory "$$tmpdir"

# Run independent source generation and validation tasks concurrently. The
# update script also parallelizes the individual JavaScript evaluations.
prepare_rules:
	@$(MAKE) --no-print-directory -j3 \
		update-public-json lint-src-json lint-extra-descriptions

show-karabiner-cli:
	@echo
	@echo "============================================================"
	@echo "Using a pre-built binary for lint."
	@echo "The code signature of the binary is as follows:"
	@echo
	@codesign -dvv bin/karabiner_cli
	@echo "============================================================"
	@echo

update-public-json: show-karabiner-cli
	sandbox-exec -f files/generator.sb bash scripts/update-json.sh

lint-src-json:
	python3 scripts/lint_src_json.py ../src/json

lint-extra-descriptions:
	python3 scripts/lint_extra_descriptions.py ../public

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
