#!/bin/bash

set -u # forbid undefined variables
set -e # forbid command failure

topdir="$(dirname "$0")/.."
karabiner_cli="${topdir}/bin/karabiner_cli"

update_file() {
  local srcfile="$1"
  local extension="${srcfile##*.}"
  local dstfile="../public/json/$(basename "$srcfile" ".$extension")"
  local tmpfile=""

  cleanup() {
    if [[ -n "$tmpfile" ]]; then
      rm -f "$tmpfile"
    fi
  }

  trap cleanup EXIT

  if [[ "$srcfile" -nt "$dstfile" ]]; then
    local succeeded=0

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

  trap - EXIT
}

export topdir karabiner_cli
export -f update_file

if [[ -n ${UPDATE_JSON_JOBS:-} ]]; then
  jobs="$UPDATE_JSON_JOBS"
else
  jobs="$(sysctl -n hw.logicalcpu 2>/dev/null || getconf _NPROCESSORS_ONLN 2>/dev/null || echo 4)"
  if ((jobs > 8)); then
    jobs=8
  fi
fi

if ! [[ $jobs =~ ^[1-9][0-9]*$ ]]; then
  echo "UPDATE_JSON_JOBS must be a positive integer: $jobs" >&2
  exit 1
fi

find ../src/json -maxdepth 1 -type f -name '*.json.*' -print0 |
  xargs -0 -n1 -P "$jobs" bash -c 'update_file "$1"' _
