#!/usr/bin/env bash
set -euo pipefail

SOURCE_ICON="src/assets/icon.png"
OUTPUT_ICON="build/icon.icns"
TEMP_ROOT="$(mktemp -d)"
ICONSET_DIR="$TEMP_ROOT/icon.iconset"
trap 'rm -rf "$TEMP_ROOT"' EXIT

mkdir -p "$ICONSET_DIR" build

create_icon() {
  local pixels="$1"
  local name="$2"
  sips -z "$pixels" "$pixels" "$SOURCE_ICON" --out "$ICONSET_DIR/$name" >/dev/null
}

create_icon 16 icon_16x16.png
create_icon 32 icon_16x16@2x.png
create_icon 32 icon_32x32.png
create_icon 64 icon_32x32@2x.png
create_icon 128 icon_128x128.png
create_icon 256 icon_128x128@2x.png
create_icon 256 icon_256x256.png
create_icon 512 icon_256x256@2x.png
create_icon 512 icon_512x512.png
create_icon 1024 icon_512x512@2x.png

iconutil -c icns "$ICONSET_DIR" -o "$OUTPUT_ICON"
