#!/bin/bash
# vpn projesini Claude Code ile acar. Masaustune kopyalayip cift tikla.
PROJE="$HOME/Desktop/vpn"
if [ ! -d "$PROJE" ]; then
  echo "Proje klasoru bulunamadi: $PROJE"
  echo "Once su komutla klonla:"
  echo "  git clone -b claude/vpn https://github.com/ozdmrorcn16/cloud.git \"$PROJE\""
  read -r -p "Kapatmak icin Enter'a bas"
  exit 1
fi
cd "$PROJE" || exit 1
if ! command -v claude >/dev/null 2>&1; then
  echo "Claude Code kurulu degil. Kurmak icin:"
  echo "  npm install -g @anthropic-ai/claude-code"
  read -r -p "Kapatmak icin Enter'a bas"
  exit 1
fi
exec claude
