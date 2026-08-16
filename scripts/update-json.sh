#!/bin/bash

set -u # forbid undefined variables
set -e # forbid command failure

topdir="$(dirname "$0")/.."
karabiner_cli="${topdir}/bin/karabiner_cli"
tmpfile=""

cleanup() {
  if [[ -n "$tmpfile" ]]; then
    rm -f "$tmpfile"
  fi
}

trap cleanup EXIT

for srcfile in ../src/json/*.json.*; do
  extension="${srcfile##*.}"

  dstfile="../public/json/$(basename "$srcfile" ".$extension")"
  if [[ "$srcfile" -nt "$dstfile" ]]; then
    succeeded=0

    if [[ $extension = 'js' ]]; then
      echo "$karabiner_cli --eval-js $srcfile"
      tmpfile="$(mktemp "${dstfile}.tmp.XXXXXX")"

      if "$karabiner_cli" --eval-js "$srcfile" >"$tmpfile"; then
        if "${topdir}/scripts/apply-lint.sh" "$tmpfile"; then
          chmod 644 "$tmpfile"
          mv "$tmpfile" "$dstfile"
          tmpfile=""
          echo "Updated: $dstfile"
          succeeded=1
        fi
      fi
    fi

    if [[ $succeeded -eq 0 ]]; then
      cleanup
      tmpfile=""
      if [[ -e "$dstfile" ]]; then
        # Make sure $srcfile remains newer than $dstfile.
        touch -t 0001010000 "$dstfile"
      fi
      exit 1
    fi
  fi
done

trap - EXIT
