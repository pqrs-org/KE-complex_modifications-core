#!/bin/bash

set -u # forbid undefined variables
set -e # forbid command failure

cd $(dirname "$0")/../../public

#
# Update dist.json
#

rm -fr build
mkdir -p build
/usr/bin/python3 ../core/scripts/make_distjson.py

#
# Update extra_descriptions
#

cp -R extra_descriptions build

for f in $(find extra_descriptions -name '*.html'); do
  mkdir -p $(dirname "build/$f")
  echo '<script src="../../vendor/js/iframeResizer.contentWindow.min.js"></script>' >"build/$f"
  cat "$f" >>"build/$f"
done
