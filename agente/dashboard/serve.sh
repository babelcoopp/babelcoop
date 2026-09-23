#!/bin/bash
# serve.sh — fallback do painel do Gabriel (Babel OS).
# Sobe `python3 -m http.server 8765 --bind 127.0.0.1` a partir da RAIZ do projeto, em segundo plano,
# para o navegador integrado do VS Code abrir http://127.0.0.1:8765/dashboard/ (links relativos das
# entregas resolvem). Idempotente: se já estiver de pé, só imprime a URL. `--stop` encerra.
# Caminhos derivados do próprio script (nunca literais). Sempre sai 0.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"
ROOT="$(cd "$HERE/.." 2>/dev/null && pwd)"
PORT=8765
HOST=127.0.0.1
URL="http://$HOST:$PORT/dashboard/"
CACHE="$ROOT/memoria/.cache"
PIDFILE="$CACHE/serve.pid"
LOGFILE="$CACHE/serve.log"
PY="$(command -v python3 2>/dev/null || echo /usr/bin/python3)"

# pid gravado ainda é o nosso http.server?
pid_alive() {
  local pid="$1"
  [ -n "$pid" ] || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  ps -p "$pid" -o command= 2>/dev/null | grep -q "http.server" || return 1
  return 0
}

# alguém responde na porta com o painel?
port_answers() {
  "$PY" - "$HOST" "$PORT" <<'PYEOF' 2>/dev/null
import socket, sys
s = socket.socket(); s.settimeout(0.5)
try:
    s.connect((sys.argv[1], int(sys.argv[2]))); sys.exit(0)
except Exception:
    sys.exit(1)
finally:
    s.close()
PYEOF
}

saved_pid() { [ -f "$PIDFILE" ] && tr -cd '0-9' < "$PIDFILE"; }

case "${1:-}" in
  --stop)
    PID="$(saved_pid)"
    if pid_alive "$PID"; then
      kill "$PID" 2>/dev/null
      sleep 0.3
      kill -0 "$PID" 2>/dev/null && kill -9 "$PID" 2>/dev/null
      rm -f "$PIDFILE"
      echo "painel: servidor encerrado (pid $PID)"
    else
      rm -f "$PIDFILE"
      if port_answers; then
        echo "painel: nenhum servidor meu de pé, mas algo responde em $HOST:$PORT (não é do serve.sh)"
      else
        echo "painel: nenhum servidor de pé"
      fi
    fi
    exit 0
    ;;
  --help|-h)
    echo "uso: bash dashboard/serve.sh        # sobe (ou só imprime a URL se já estiver de pé)"
    echo "     bash dashboard/serve.sh --stop # encerra"
    exit 0
    ;;
esac

if [ ! -d "$ROOT/dashboard" ]; then
  echo "painel: pasta dashboard/ não encontrada em $ROOT" >&2
  exit 0
fi
mkdir -p "$CACHE" 2>/dev/null

PID="$(saved_pid)"
if pid_alive "$PID"; then
  echo "$URL"
  exit 0
fi
rm -f "$PIDFILE"

if port_answers; then
  # porta já ocupada por outro processo (um http.server antigo sem pidfile, por exemplo): a URL provavelmente funciona
  echo "$URL"
  echo "painel: a porta $PORT já estava ocupada por outro processo; se a página não abrir, libere a porta e rode de novo" >&2
  exit 0
fi

cd "$ROOT" || exit 0
nohup "$PY" -m http.server "$PORT" --bind "$HOST" >"$LOGFILE" 2>&1 &
NEWPID=$!
echo "$NEWPID" > "$PIDFILE"

# espera até 3 s pela porta
for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if port_answers; then
    echo "$URL"
    exit 0
  fi
  sleep 0.2
done
if kill -0 "$NEWPID" 2>/dev/null; then
  echo "$URL"
  echo "painel: servidor subiu mas ainda não respondeu; tente a URL em instantes" >&2
else
  rm -f "$PIDFILE"
  echo "painel: não consegui subir o servidor na porta $PORT (veja $LOGFILE)" >&2
fi
exit 0
