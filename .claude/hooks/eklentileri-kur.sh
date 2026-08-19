#!/usr/bin/env bash
# Konteyner gecici oldugu icin ~/.claude altina kurulan eklentiler her yeni
# oturumda kaybolur. Bu hook onlari geri yukler.
#
# Kapsam:
#   - gstack       (garrytan/gstack)      -> ~/.claude/skills/gstack
#   - claude-mem   (thedotmack/claude-mem)-> ~/.claude/plugins + worker
#   - Playwright Chromium takmasi         -> /opt/pw-browsers (indirme bloklu)
#
# Zaten kuruluysa saniyeler icinde cikar. Hicbir kosulda oturumu dusurmez.

set -uo pipefail

GSTACK_DIR="$HOME/.claude/skills/gstack"
PW_DIR="${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}"
LOG="${TMPDIR:-/tmp}/eklentileri-kur.log"
: >"$LOG"

durum=()

# ── 1. Playwright Chromium takmasi ────────────────────────────
# Konteynerde chromium-1194 kurulu ama gstack'in playwright'i 1208 ariyor ve
# cdn.playwright.dev ag politikasi tarafindan blokli. Mevcut binary'yi
# 1208'in bekledigi Chrome-for-Testing yerlesimiyle isaretliyoruz.
pw_takla() {
  local kaynak_c kaynak_h
  kaynak_c=$(ls -d "$PW_DIR"/chromium-[0-9]* 2>/dev/null | grep -v -- '-1208$' | head -1)
  kaynak_h=$(ls -d "$PW_DIR"/chromium_headless_shell-[0-9]* 2>/dev/null | grep -v -- '-1208$' | head -1)
  [ -z "$kaynak_c" ] && return 1

  if [ ! -e "$PW_DIR/chromium-1208/chrome-linux64/chrome" ]; then
    mkdir -p "$PW_DIR/chromium-1208" || return 1
    ln -sfn "$kaynak_c/chrome-linux" "$PW_DIR/chromium-1208/chrome-linux64"
    touch "$PW_DIR/chromium-1208/INSTALLATION_COMPLETE" \
          "$PW_DIR/chromium-1208/DEPENDENCIES_VALIDATED"
  fi

  if [ -n "$kaynak_h" ] && [ ! -e "$PW_DIR/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell" ]; then
    ln -sfn headless_shell "$kaynak_h/chrome-linux/chrome-headless-shell"
    mkdir -p "$PW_DIR/chromium_headless_shell-1208"
    ln -sfn "$kaynak_h/chrome-linux" "$PW_DIR/chromium_headless_shell-1208/chrome-headless-shell-linux64"
    touch "$PW_DIR/chromium_headless_shell-1208/INSTALLATION_COMPLETE" \
          "$PW_DIR/chromium_headless_shell-1208/DEPENDENCIES_VALIDATED"
  fi
  return 0
}
pw_takla >>"$LOG" 2>&1

# ── 2. gstack ─────────────────────────────────────────────────
if [ -f "$GSTACK_DIR/SKILL.md" ] && [ -x "$GSTACK_DIR/browse/dist/browse" ]; then
  durum+=("gstack: kurulu")
elif command -v bun >/dev/null 2>&1; then
  {
    if [ ! -d "$GSTACK_DIR/.git" ]; then
      rm -rf "$GSTACK_DIR"
      git clone --single-branch --depth 1 \
        https://github.com/garrytan/gstack.git "$GSTACK_DIR"
    fi
    cd "$GSTACK_DIR" && GSTACK_SKIP_FONTS=1 \
      ./setup --host claude --prefix --no-team --no-plan-tune-hooks --quiet
  } >>"$LOG" 2>&1
  if [ -f "$GSTACK_DIR/SKILL.md" ]; then
    durum+=("gstack: kuruldu")
  else
    durum+=("gstack: KURULAMADI ($LOG)")
  fi
else
  durum+=("gstack: atlandi (bun yok)")
fi

# ── 3. claude-mem ─────────────────────────────────────────────
if command -v npx >/dev/null 2>&1; then
  if [ ! -d "$HOME/.claude/plugins/marketplaces/thedotmack" ]; then
    npx --yes claude-mem@latest install >>"$LOG" 2>&1
  fi
  if [ -d "$HOME/.claude/plugins/marketplaces/thedotmack" ]; then
    # Worker ayakta degilse baslat; zaten ayaktaysa no-op.
    npx --yes claude-mem start >>"$LOG" 2>&1
    durum+=("claude-mem: hazir")
  else
    durum+=("claude-mem: KURULAMADI ($LOG)")
  fi
else
  durum+=("claude-mem: atlandi (npx yok)")
fi

# ── 4. tree-sitter CLI binary'si ──────────────────────────────
# claude-mem'in smart_search / smart_outline araclari `tree-sitter query`
# komutunu calistiriyor. npm paketi (tree-sitter-cli) binary'yi postinstall'da
# GitHub releases'ten indiriyor; bu adim kurulum sirasinda atlandigi icin
# binary hic gelmiyor. Bulunamayinca kod PATH'teki "tree-sitter"a dusuyor, o da
# olmayinca hata yutuluyor ve araclar her dosya icin sessizce bos sonuc
# ("unsupported language") donduruyor. Eksikse indiriyoruz.
ts_cli_kur() {
  local kok cli
  kok=$(ls -d "$HOME"/.claude/plugins/cache/thedotmack/claude-mem/*/ 2>/dev/null | head -1)
  [ -z "$kok" ] && return 1
  cli="$kok/node_modules/tree-sitter-cli"
  [ -f "$cli/install.js" ] || return 1
  [ -x "$cli/tree-sitter" ] && return 0
  (cd "$cli" && node install.js) >>"$LOG" 2>&1
  [ -x "$cli/tree-sitter" ]
}
if ts_cli_kur; then
  durum+=("tree-sitter: hazir")
else
  durum+=("tree-sitter: KURULAMADI ($LOG)")
fi

# ── 5. gh CLI ─────────────────────────────────────────────────
# gstack becerilerinin 17'si `gh` cagiriyor ve konteynerde kurulu degil.
# GH_TOKEN ortamda hazir, yani indirmek yetiyor.
# NOT: Bu oturumun proxy'si GraphQL'i kisitliyor; `gh api repos/...` (REST)
# calisiyor, `gh pr list` / `gh pr create` gibi GraphQL komutlari 403 donuyor.
gh_kur() {
  command -v gh >/dev/null 2>&1 && return 0
  local v=2.63.2 t
  t=$(mktemp -d) || return 1
  if curl -fsSL --retry 3 -o "$t/gh.tgz" \
       "https://github.com/cli/cli/releases/download/v${v}/gh_${v}_linux_amd64.tar.gz" \
     && tar xzf "$t/gh.tgz" -C "$t"; then
    mkdir -p "$HOME/.local/bin"
    install -m755 "$t/gh_${v}_linux_amd64/bin/gh" "$HOME/.local/bin/gh"
  fi
  rm -rf "$t"
  command -v gh >/dev/null 2>&1 || [ -x "$HOME/.local/bin/gh" ]
}
if gh_kur >>"$LOG" 2>&1; then
  durum+=("gh: hazir")
else
  durum+=("gh: kurulamadi ($LOG)")
fi

# ── 6. Market eklentileri ─────────────────────────────────────
# settings.json'daki extraKnownMarketplaces/enabledPlugins tek basina yetmiyor:
# dis kaynakli eklenti gercekten kurulmadan yuklenmiyor. Eksikse kuruyoruz.
if command -v claude >/dev/null 2>&1; then
  if ! claude plugin marketplace list 2>/dev/null | grep -q "claude-code-plugins"; then
    claude plugin marketplace add anthropics/claude-code >>"$LOG" 2>&1
  fi
  eksik=()
  for p in security-guidance code-review frontend-design; do
    if ! claude plugin list 2>/dev/null | grep -q "$p@claude-code-plugins"; then
      claude plugin install "$p@claude-code-plugins" --scope project >>"$LOG" 2>&1
      eksik+=("$p")
    fi
  done
  if [ ${#eksik[@]} -eq 0 ]; then
    durum+=("market eklentileri: kurulu")
  else
    durum+=("market eklentileri: kuruldu (${eksik[*]})")
  fi
else
  durum+=("market eklentileri: atlandi (claude CLI yok)")
fi

printf 'Eklenti durumu — %s\n' "$(IFS='; '; echo "${durum[*]}")"
exit 0
