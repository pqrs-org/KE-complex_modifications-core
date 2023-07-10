#!/bin/bash

curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"secret\":\"$GH_PAGES_UPDATER_SECRET\"}" \
  https://pqrs.org/ke-gh-pages-updater/update-gh-pages
