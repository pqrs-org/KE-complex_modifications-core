#!/bin/bash

set -u # forbid undefined variables
set -e # forbid command failure

topdir="$(dirname "$0")/.."
karabiner_cli="${topdir}/bin/karabiner_cli"

"$karabiner_cli" --lint-complex-modifications "$@"
