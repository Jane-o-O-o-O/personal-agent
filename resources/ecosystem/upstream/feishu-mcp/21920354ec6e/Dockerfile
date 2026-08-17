# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim

ENV NODE_ENV=production \
    # Runtime directory required by gnome-keyring/DBus
    XDG_RUNTIME_DIR=/home/node/.xdg/runtime

# Runtime deps: libsecret + gnome-keyring + dbus (provides org.freedesktop.secrets) + build deps for keytar
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    libsecret-1-0 \
    libsecret-tools \
    libglib2.0-bin \
    gnome-keyring \
    dbus \
    dbus-x11 \
    ca-certificates \
    # build deps (in case keytar needs to compile)
    python3 \
    make \
    g++ \
    pkg-config \
    libsecret-1-dev \
  && rm -rf /var/lib/apt/lists/*

## Install lark-mcp globally (will install keytar as dependency)
RUN npm install -g @larksuiteoapi/lark-mcp@latest \
  && npm cache clean --force

## Prepare XDG and user-writable dirs before dropping privileges
RUN mkdir -p ${XDG_RUNTIME_DIR} \
  && mkdir -p /home/node/.local/state /home/node/.local/share/lark-mcp \
  && chown -R node:node ${XDG_RUNTIME_DIR} /home/node/.local

## Dev dependencies were pruned in the build stage; no need to prune again here

# Initialize DBus and gnome-keyring (secrets) so keytar can operate
RUN <<'EOF'
cat >/usr/local/bin/docker-entrypoint.sh <<'SCRIPT'
#!/usr/bin/env bash
set -e

# Prepare DBus session; address uses XDG_RUNTIME_DIR
if [[ -z "${DBUS_SESSION_BUS_ADDRESS:-}" ]]; then
  mkdir -p "${XDG_RUNTIME_DIR}"
  dbus-daemon --session --address="unix:path=${XDG_RUNTIME_DIR}/bus" --fork
  export DBUS_SESSION_BUS_ADDRESS="unix:path=${XDG_RUNTIME_DIR}/bus"
fi

# Create required directories with correct permissions
mkdir -p "${XDG_RUNTIME_DIR}/keyring"
mkdir -p "${HOME}/.local/share/keyrings"
chmod 0700 "${XDG_RUNTIME_DIR}/keyring"
chmod 0700 "${HOME}/.local/share/keyrings"

# Start gnome-keyring daemon properly
if command -v gnome-keyring-daemon >/dev/null 2>&1; then
  # Kill any existing keyring processes
  pkill -f gnome-keyring 2>/dev/null || true
  sleep 0.5
  
  # Create an initial login keyring file
  current_ts="$(date +%s)"
  cat > "${HOME}/.local/share/keyrings/login.keyring" <<KEYRING_EOF
[keyring]
display-name=Login
ctime=${current_ts}
mtime=${current_ts}
lock-on-idle=false
lock-after=false
KEYRING_EOF
  chmod 0600 "${HOME}/.local/share/keyrings/login.keyring"
  
  # Start gnome-keyring daemon with control directory (suppress stderr warnings)
  eval $(gnome-keyring-daemon --start --daemonize --components=secrets --control-directory="${XDG_RUNTIME_DIR}/keyring" 2>/dev/null)
  
  # Wait for the daemon to be available and control socket to exist
  for i in {1..50}; do
    if [[ -S "${XDG_RUNTIME_DIR}/keyring/control" ]] && gdbus introspect --session --dest org.freedesktop.secrets --object-path /org/freedesktop/secrets >/dev/null 2>&1; then
      break
    fi
    sleep 0.1
  done
  
  # Export control directory for the session
  export GNOME_KEYRING_CONTROL="${XDG_RUNTIME_DIR}/keyring"
  
  # Create login collection via D-Bus
  if gdbus introspect --session --dest org.freedesktop.secrets --object-path /org/freedesktop/secrets >/dev/null 2>&1; then
    # Try to create login collection
    printf "" | gdbus call --session \
      --dest org.freedesktop.secrets \
      --object-path /org/freedesktop/secrets \
      --method org.freedesktop.secrets.Service.CreateCollection \
      "{'org.freedesktop.Secret.Collection.Label': <'login'>}" \
      "login" >/dev/null 2>&1 || true
    
    # Set login as the default alias
    gdbus call --session \
      --dest org.freedesktop.secrets \
      --object-path /org/freedesktop/secrets \
      --method org.freedesktop.secrets.Service.SetAlias \
      "login" "/org/freedesktop/secrets/collection/login" >/dev/null 2>&1 || true
  fi
fi

# Suppress gnome-keyring warnings by redirecting stderr for the main process
exec "$@" 2> >(grep -v "couldn't access control socket\|discover_other_daemon" >&2)
SCRIPT
chmod +x /usr/local/bin/docker-entrypoint.sh
EOF

USER node

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh", "lark-mcp"]

# Show help by default; override CMD to pass CLI arguments
CMD ["--help"]


