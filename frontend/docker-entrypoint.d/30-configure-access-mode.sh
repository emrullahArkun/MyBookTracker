#!/bin/sh
set -eu

ACCESS_MODE="${FRONTEND_ACCESS_MODE:-live}"
AUTH_REALM="${FRONTEND_BASIC_AUTH_REALM:-ChapterFlow Beta}"
SNIPPETS_DIR="/etc/nginx/snippets"
HTPASSWD_FILE="/etc/nginx/ops/.htpasswd"

mkdir -p "$SNIPPETS_DIR"

case "$ACCESS_MODE" in
  beta)
    if [ ! -s "$HTPASSWD_FILE" ]; then
      echo "FRONTEND_ACCESS_MODE=beta requires a non-empty $HTPASSWD_FILE file." >&2
      exit 1
    fi

    cat > "$SNIPPETS_DIR/access-protection.conf" <<EOF
auth_basic "${AUTH_REALM}";
auth_basic_user_file ${HTPASSWD_FILE};
EOF

    cat > "$SNIPPETS_DIR/indexing.conf" <<'EOF'
add_header X-Robots-Tag "noindex, nofollow, noarchive" always;
EOF
    ;;
  live)
    : > "$SNIPPETS_DIR/access-protection.conf"
    : > "$SNIPPETS_DIR/indexing.conf"
    ;;
  *)
    echo "Unsupported FRONTEND_ACCESS_MODE: $ACCESS_MODE. Use 'beta' or 'live'." >&2
    exit 1
    ;;
esac
