all:
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
	python3 scripts/lint_groups.py '../public/groups.json'
	bash scripts/update-public-build.sh

rebuild:
	touch ../src/json/*
	$(MAKE) all

update-public-build:
	bash scripts/update-public-build.sh

server:
	/usr/bin/python3 scripts/dev_server.py
