#!/bin/bash

set -u # forbid undefined variables
set -e # forbid command failure

cd $(dirname "$0")/../..

#
# Update dist.json
#

rm -fr dist
mkdir -p dist/build
/usr/bin/python3 core/scripts/make_distjson.py

#
# Copy json
#

cp -R public/json dist

#
# Update extra_descriptions
#

cp -R public/extra_descriptions dist/build

for f in $(find dist/build/extra_descriptions -name '*.html'); do
  echo '<script src="../../vendor/js/iframeResizer.contentWindow.min.js"></script>' >"$f.tmp"
  cat "$f" >>"$f.tmp"
  mv "$f.tmp" "$f"
done

#
# Copy react files
#

cp -R core/react/dist/* dist
