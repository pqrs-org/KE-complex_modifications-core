#!/bin/bash

set -u # forbid undefined variables
set -e # forbid command failure

topdir="$(dirname $0)/.."
karabiner_cli="${topdir}/bin/karabiner_cli"
lint="'$karabiner_cli' --lint-complex-modifications "

${topdir}/bin/karabiner_cli --lint-complex-modifications "$@"
echo "Checked $(echo "$output" | wc -l | sed 's| ||g') files"
