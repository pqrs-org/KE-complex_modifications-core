#!/bin/bash

set -u # forbid undefined variables
set -e # forbid command failure

result=$(curl -s \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"secret\":\"$GH_PAGES_UPDATER_SECRET\"}" \
  https://pqrs.org/ke-gh-pages-updater/update-gh-pages)

(echo $result | grep error) && exit 1
exit 0
