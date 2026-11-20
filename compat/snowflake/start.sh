#!/bin/sh
set -eu
# Apply the compatibility changes to a private copy of the pinned source.
runtime=/tmp/wand-snowflake
mkdir -p "$runtime"
cp -R app main.py config.py "$runtime/"
ln -sf "$PWD/.env" "$runtime/.env"
cd "$runtime"
# Windows checkouts can have CRLF Python sources.
find app -name '*.py' -exec sed -i 's/\r$//' {} +
patch -p1 < /opt/wand/snowflake/combat.patch
exec python main.py
