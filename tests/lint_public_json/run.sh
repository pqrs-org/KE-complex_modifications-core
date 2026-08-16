#!/bin/bash

set -u # forbid undefined variables
set -e # forbid command failure

check_failure() {
  local path="$1"
  local expected="$2"
  local output
  local status

  echo "$path"
  set +e
  output="$(python3 ../../scripts/lint_public_json.py "$path" 2>&1)"
  status=$?
  set -e

  if [[ $status -ne 1 ]]; then
    echo "Expected exit status 1, got $status"
    exit 1
  fi
  if [[ "$output" != *"$expected"* ]]; then
    echo "Expected output to contain: $expected"
    echo "$output"
    exit 1
  fi
  echo "$output"
  echo "ok"
  echo
}

check_failure data/errors/filename-check "Please rename"
check_failure data/errors/lint-json-rules 'rules` is not array'
check_failure data/errors/lint-json-title 'title` is not string'
check_failure data/errors/validate-json "error:"

echo data/success
python3 ../../scripts/lint_public_json.py data/success
echo "ok"
echo

exit 0
