#!/bin/bash

set -u # forbid undefined variables
set -e # forbid command failure

cd $(dirname "$0")/../..

rm -fr dist
mkdir dist

#
# Update dist.json
#

/usr/bin/python3 core/scripts/make_distjson.py

#
# Copy files
#

cp -R public/json dist
cp -R public/extra_descriptions dist

#
# Copy react files
#

cp -R core/react/dist/* dist
