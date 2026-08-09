#!/usr/bin/env bash
# Proje kapsamindaki eklentileri her oturum basinda garanti altina alir.
#
# Neden gerekli: konteyner gecici oldugu icin ~/.claude.json her seferinde
# sifirlanir ve proje dizini "guvenilir" isaretli gelmez. Guven onayi olmadan
# Claude Code, .claude/settings.json icindeki extraKnownMarketplaces ve
# enabledPlugins alanlarini yok sayar; hook'lar ise yine calisir. Bu yuzden
# market kaydini hook uzerinden yapiyoruz.
set -u

command -v claude >/dev/null 2>&1 || exit 0

if ! claude plugin marketplace list 2>/dev/null | grep -q 'claude-code-plugins'; then
  claude plugin marketplace add anthropics/claude-code >/dev/null 2>&1 || true
fi

if ! claude plugin list 2>/dev/null | grep -q 'frontend-design'; then
  claude plugin install frontend-design@claude-code-plugins >/dev/null 2>&1 || true
fi

exit 0
