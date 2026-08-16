#!/bin/bash

set -u # forbid undefined variables
set -e # forbid command failure

cd "$(dirname "$0")/../.."

dist_directory="$(pwd)/dist"
dist_tmp="$(mktemp -d "${dist_directory}.tmp.XXXXXX")"
dist_backup=""

cleanup() {
  if [[ -n "$dist_tmp" ]]; then
    rm -rf "$dist_tmp"
  fi
  if [[ -n "$dist_backup" ]]; then
    if [[ ! -e "$dist_directory" && -e "$dist_backup/dist" ]]; then
      mv "$dist_backup/dist" "$dist_directory"
    fi
    rm -rf "$dist_backup"
  fi
}

trap cleanup EXIT

#
# Update dist.json
#

/usr/bin/python3 core/scripts/make_distjson.py "$dist_tmp/dist.json"

#
# Copy files
#

cp -R public/json "$dist_tmp"
cp -R public/extra_descriptions "$dist_tmp"

#
# Copy react files
#

cp -R core/react/dist/. "$dist_tmp"

#
# Replace dist only after all build steps have succeeded.
#

if [[ -e "$dist_directory" ]]; then
  dist_backup="$(mktemp -d "${dist_directory}.backup.XXXXXX")"
  mv "$dist_directory" "$dist_backup/dist"
fi

mv "$dist_tmp" "$dist_directory"
dist_tmp=""

if [[ -n "$dist_backup" ]]; then
  rm -rf "$dist_backup"
  dist_backup=""
fi

trap - EXIT
