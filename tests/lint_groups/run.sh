#!/bin/bash

set -u # forbid undefined variables
set -e # forbid command failure

for d in data/errors/*; do
  echo $d
  if python3 ../../scripts/lint_groups.py $d/gropus.json; then
    exit 1
  else
    echo "ok"
    echo
  fi
done

exit 0
