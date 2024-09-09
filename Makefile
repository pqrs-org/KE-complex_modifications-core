all: build_rules
	python3 scripts/lint_groups.py '../public/groups.json'
	bash scripts/update-dist.sh

build_rules:
# There are cases where only public/json needs to be updated, so it is separated into `build_rules`.
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
	python3 scripts/lint_public_json.py ../public/json
	bash scripts/apply-lint.sh '../public/json/*.json' --silent

rebuild:
	touch ../src/json/*
	$(MAKE) all

update-dist:
	bash scripts/update-dist.sh

preview-server: update-dist
	(cd ../dist && /usr/bin/python3 ../core/scripts/preview_server.py)
