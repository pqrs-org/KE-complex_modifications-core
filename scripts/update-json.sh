#!/bin/bash

set -u # forbid undefined variables
set -e # forbid command failure

topdir="$(dirname $0)/.."
karabiner_cli="${topdir}/bin/karabiner_cli"

for srcfile in ../src/json/*.json.*; do
  extension="${srcfile##*.}"

  dstfile="../public/json/$(basename $srcfile .$extension)"
  if [[ "$srcfile" -nt "$dstfile" ]]; then
    failed=0

    if [[ $extension = 'js' ]]; then
      echo "$karabiner_cli --eval-js $srcfile"

      if $karabiner_cli --eval-js "$srcfile" >"$dstfile"; then
        if scripts/apply-lint.sh "$dstfile"; then
          echo "Updated: $dstfile"
          failed=1
        fi
      fi
    fi

    if [[ $failed -eq 0 ]]; then
      # Set mtime to 2000-01-01T00:00:00 to make $srcfile newer than $dstfile.
      touch -t 0001010000 "$dstfile"
      exit 1
    fi
  fi
done
