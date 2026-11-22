#!/usr/bin/env bash
# Siberian Wellness боти: серверга доимий хизмат (systemd) сифатида ўрнатиш ёки янгилаш.
#
# Ишлатиш (Ubuntu 22.04/24.04 ёки Debian 12, root сифатида):
#   curl -fsSL https://kudratullokh.github.io/luma-coffee/siberian/install.sh | bash -s -- БОТ_ТОКЕНИ SETUP_КОДИ
#
# Бот кейин ўзи ишлайди: сервер қайта ёқилса ёки бот тўхтаб қолса, ўзи қайта ишга тушади,
# янги версияларни каталог сайтидан ўзи олади. Қайта ўрнатилса, .env даги бошқа созламалар
# (масалан, уланган менежерлар группаси) сақланиб қолади.
set -euo pipefail

TOKEN="${1:-${BOT_TOKEN:-}}"
CODE="${2:-${SETUP_CODE:-}}"
DIR="${SIBERIAN_DIR:-/opt/siberian_bot}"
SERVICE="siberian-bot"
CATALOGS="${SIBERIAN_CATALOG:-https://kudratullokh.github.io/luma-coffee/siberian/ https://kudratullokh.github.io/siberian-catalog/}"
FILES="bot.py texts.py storage.py products.json defaults.env"
TEST="${SIBERIAN_TEST:-}"  # синов учун: apt, фойдаланувчи ва systemd қадамларисиз

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
die() { printf '\n\033[31m%s\033[0m\n' "$*" >&2; exit 1; }

[ -n "$TEST" ] || [ "$(id -u)" -eq 0 ] || die "Root сифатида ишга туширинг (ёки буйруқдаги bash олдига sudo қўшинг)."
[ -n "$TOKEN" ] || [ -s "$DIR/.env" ] || die "Бот токенини кўрсатинг: ... | bash -s -- 123456789:AA... КОД"
case "$TOKEN" in
  "" | [0-9]*:?*) ;;
  *) die "Токен нотўғри кўринишда: 123456789:AA... каби бўлиши керак (BotFather берган)." ;;
esac

if [ -z "$TEST" ]; then
  command -v apt-get >/dev/null || die "Бу скрипт Ubuntu ёки Debian учун. Серверга Ubuntu 22.04/24.04 ўрнатинг."
  say "1/5 Керакли дастурлар ўрнатиляпти..."
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq python3 python3-venv curl ca-certificates tar >/dev/null
fi
python3 -c 'import sys; sys.exit(sys.version_info < (3, 9))' \
  || die "Python 3.9 ёки янгиси керак: серверга Ubuntu 22.04/24.04 ёки Debian 12 ўрнатинг."

say "2/5 Бот коди юкланяпти..."
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
got=""
for base in $CATALOGS; do
  if curl -fsSL --max-time 60 "${base}bot.tar.gz" -o "$tmp/bot.tar.gz" 2>/dev/null \
     && tar -tzf "$tmp/bot.tar.gz" | grep -x "bot.py" >/dev/null; then
    got="$base"
    break
  fi
done
[ -n "$got" ] || die "Бот кодини юклаб бўлмади. Интернетни текшириб, қайта уриниб кўринг."
mkdir -p "$DIR"
# shellcheck disable=SC2086  # FILES — бўш жой билан ажратилган рўйхат
tar -xzf "$tmp/bot.tar.gz" -C "$DIR" --no-same-owner $FILES

say "3/5 Python кутубхонаси ўрнатиляпти (1–2 дақиқа)..."
[ -x "$DIR/venv/bin/python" ] || python3 -m venv "$DIR/venv"
"$DIR/venv/bin/pip" install -q --disable-pip-version-check --upgrade "aiogram>=3.15,<4"

say "4/5 Созламалар ёзиляпти..."
ENV_FILE="$DIR/.env"
touch "$ENV_FILE"
chmod 600 "$ENV_FILE"
set_key() {  # set_key КАЛИТ ҚИЙМАТ [keep]  — keep: бор бўлса тегмайди
  if grep -q "^$1=" "$ENV_FILE"; then
    [ "${3:-}" = "keep" ] && return 0
    python3 - "$ENV_FILE" "$1" "$2" <<'PY'
import sys
path, key, value = sys.argv[1:4]
lines = open(path, encoding="utf-8").read().splitlines()
lines = [f"{key}={value}" if line.startswith(key + "=") else line for line in lines]
open(path, "w", encoding="utf-8").write("\n".join(lines) + "\n")
PY
  else
    printf '%s=%s\n' "$1" "$2" >> "$ENV_FILE"
  fi
}
if [ -n "$TOKEN" ]; then set_key BOT_TOKEN "$TOKEN"; fi
if [ -n "$CODE" ]; then
  set_key SETUP_CODE "$CODE"
elif ! grep -q "^SETUP_CODE=." "$ENV_FILE"; then
  CODE="$(shuf -i 100000-999999 -n 1)"
  set_key SETUP_CODE "$CODE"
  say "Группани улаш коди: $CODE (ёзиб қўйинг)"
fi
set_key MANAGERS_CHAT_ID "" keep
set_key CONSULTANT_NAME "" keep
set_key WORK_HOURS "соат 9:00–21:00 оралиғида" keep
set_key CLIENT_REF_LINK "" keep
set_key BUSINESS_REF_LINK "" keep
set_key MINIAPP_URL "https://kudratullokh.github.io/siberian-catalog/,https://kudratullokh.github.io/luma-coffee/siberian/" keep
set_key APP_STORE_URL "https://apps.apple.com/app/id1095272878" keep
set_key GOOGLE_PLAY_URL "" keep
set_key ENABLE_ORDERS "1" keep

if [ -n "$TEST" ]; then
  say "Синов: файллар $DIR да тайёр (systemd қадами ўтказиб юборилди)."
  exit 0
fi

say "5/5 Бот доимий хизмат сифатида ишга туширилмоқда..."
id -u siberian >/dev/null 2>&1 || useradd --system --home-dir "$DIR" --shell /usr/sbin/nologin siberian
chown -R siberian:siberian "$DIR"
cat > "/etc/systemd/system/$SERVICE.service" <<UNIT
[Unit]
Description=Siberian Wellness Telegram bot
After=network-online.target
Wants=network-online.target

[Service]
User=siberian
WorkingDirectory=$DIR
ExecStart=$DIR/venv/bin/python $DIR/bot.py
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
UNIT
cat > /usr/local/bin/siberian <<'CMD'
#!/bin/sh
# siberian — бот ҳолати;  siberian log — охирги ёзувлар;  siberian restart — қайта ишга тушириш
case "$1" in
  log|logs) journalctl -u siberian-bot -n 60 --no-pager ;;
  restart) systemctl restart siberian-bot && echo "Бот қайта ишга туширилди." ;;
  *) systemctl --no-pager --lines=15 status siberian-bot ;;
esac
CMD
chmod +x /usr/local/bin/siberian
started="$(date '+%Y-%m-%d %H:%M:%S')"
systemctl daemon-reload
systemctl enable "$SERVICE" >/dev/null 2>&1
systemctl restart "$SERVICE"

ok=""
for _ in $(seq 1 30); do
  if journalctl -u "$SERVICE" --since "$started" --no-pager 2>/dev/null | grep -q "Бот ишга тушди"; then
    ok=1
    break
  fi
  sleep 2
done
if [ -n "$ok" ]; then
  printf '\n\033[32m%s\033[0m\n' "✅ Бот серверда ишлаяпти ва энди ўчмайди: сервер қайта ёқилса ҳам ўзи ишга тушади."
  echo "Colab'даги ботни бошқа ишга туширманг — иккита бот бир вақтда ишламасин."
  echo "Ҳолатини кўриш: siberian     Охирги ёзувлар: siberian log"
else
  journalctl -u "$SERVICE" --since "$started" -n 30 --no-pager || true
  die "Бот ишга тушмади. Шу экранни скриншот қилиб юборинг."
fi
