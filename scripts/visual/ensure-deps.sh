#!/usr/bin/env bash
# Chromium needs a handful of system libs that WSL images ship without.
# With sudo, `npx playwright install-deps chromium` is the normal fix.
# This script is the no-sudo path: download the .debs and unpack them into a
# cache dir that capture.mjs adds to LD_LIBRARY_PATH.
set -euo pipefail

DEST="${HOME}/.cache/claude-visual/libs"

if [ -d "${DEST}/usr/lib/x86_64-linux-gnu" ] && [ "${1:-}" != "--force" ]; then
  echo "deps already vendored at ${DEST} (use --force to refetch)"
  exit 0
fi

mkdir -p "${DEST}"
cd "${DEST}"

apt-get download \
  libnspr4 libnss3 libasound2t64 libatk1.0-0t64 libatk-bridge2.0-0t64 \
  libcups2t64 libxkbcommon0 libatspi2.0-0t64 libxcomposite1 libxdamage1 \
  libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2

for deb in *.deb; do dpkg-deb -x "${deb}" .; done
rm -f ./*.deb

echo "vendored Chromium libs -> ${DEST}"
