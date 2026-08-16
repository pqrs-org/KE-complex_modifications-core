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
  output="$(python3 ../../scripts/lint_groups.py "$path" 2>&1)"
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

check_failure \
  data/errors/duplicated-entries/gropus.json \
  "There are some duplicated entries"
check_failure \
  data/errors/orphan-file/gropus.json \
  "There are some files in public/groups.json are not found"

echo data/success
python3 ../../scripts/lint_groups.py data/success/groups.json
echo "ok"
echo

exit 0
