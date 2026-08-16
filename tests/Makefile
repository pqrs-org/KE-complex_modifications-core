all:
	make -C lint_groups
	make -C lint_public_json
	make -C lint_src_json
	python3 -m unittest discover -s . -p 'test_*.py'
