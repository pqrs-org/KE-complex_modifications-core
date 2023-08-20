#!/bin/bash

set -u # forbid undefined variables
set -e # forbid command failure

[[ -z "$(git status -s)" ]] ||
  (
    echo
    echo 'ERROR: There were uncommitted changes after running `make rebuild`'
    echo "Did you forget to update 'src/json'?"
    echo
    echo "------------------------------------------------------------"
    echo "make rebuild"
    echo "git status"
    echo
    git status
    echo "------------------------------------------------------------"
    exit 1
  )
