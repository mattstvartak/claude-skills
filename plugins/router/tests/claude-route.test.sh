#!/usr/bin/env bash
# Runs claude-route against fake logins in a temp home. Never touches the real ~/.claude.
set -euo pipefail

route="$(cd "$(dirname "$0")/../bin" && pwd)/claude-route"
sandbox="$(mktemp -d)"
trap 'rm -rf "$sandbox"' EXIT
export CLAUDE_ROUTE_HOME="$sandbox/home" CLAUDE_ROUTE_CONF="$sandbox/conf"
unset CLAUDE_CONFIG_DIR

fail() { echo "FAIL: $*" >&2; exit 1; }

# A config dir holding one signed-in account: <dir> <name>
login() {
  mkdir -p "$1"
  echo "{\"claudeAiOauth\":{\"accessToken\":\"a-$2\",\"refreshToken\":\"r-$2\"},\"mcpOAuth\":{\"keep\":true}}" > "$1/.credentials.json"
  echo "{\"oauthAccount\":{\"emailAddress\":\"$2@example.com\",\"accountUuid\":\"u-$2\"},\"keep\":true}" > "$1/.claude.json"
}

login "$sandbox/home/.claude" one
mv "$sandbox/home/.claude/.claude.json" "$sandbox/home/.claude.json"
login "$sandbox/two" two
creds="$sandbox/home/.claude/.credentials.json"

"$route" save one
"$route" next 2> "$sandbox/err" && fail "next switched with one account stored"
grep -q "only stored account" "$sandbox/err" || fail "next with one account: $(cat "$sandbox/err")"
"$route" import two "$sandbox/two" > /dev/null

"$route" use two | grep -q "Switched from one to two" || fail "use two"
[ "$(jq -r .claudeAiOauth.refreshToken "$creds")" = r-two ] || fail "credentials not swapped"
[ "$(jq -r .mcpOAuth.keep "$creds")" = true ] || fail "other credentials lost"
[ "$(jq -r .oauthAccount.emailAddress "$sandbox/home/.claude.json")" = two@example.com ] || fail "account not swapped"
[ "$(jq -r .keep "$sandbox/home/.claude.json")" = true ] || fail "config lost"

# A token refreshed while two was active must be what gets stored for two.
jq '.claudeAiOauth.refreshToken = "r-two-refreshed"' "$creds" > "$creds.tmp" && mv "$creds.tmp" "$creds"
"$route" next | grep -q "Switched from two to one" || fail "next"
[ "$(jq -r .claudeAiOauth.refreshToken "$CLAUDE_ROUTE_CONF/logins/two.json")" = r-two-refreshed ] || fail "refreshed token not kept"
"$route" next | grep -q "Already switched" || fail "second next inside 60s swapped again"
"$route" status | grep -q "^  two  two@example.com (resting until" || fail "status: $("$route" status)"

ls -A "$sandbox/home/.claude" | grep -q '\.lock$' && fail "a lock was left behind"

# add signs in under a throwaway CLAUDE_CONFIG_DIR, stores it, then deletes that folder.
mkdir -p "$sandbox/bin"
cat > "$sandbox/bin/claude" <<FAKE
#!/usr/bin/env bash
echo "\$CLAUDE_CONFIG_DIR" > "$sandbox/signin-dir"
$(declare -f login)
login "\$CLAUDE_CONFIG_DIR" four
FAKE
chmod +x "$sandbox/bin/claude"
PATH="$sandbox/bin:$PATH" "$route" add four | grep -q "Stored four (four@example.com)" || fail "add"
[ ! -e "$(cat "$sandbox/signin-dir")" ] || fail "add left its sign-in folder"
"$route" status | grep -q "^  four  four@example.com" || fail "add didn't list four"

"$route" use ../one 2> /dev/null && fail "took a name with a path in it"

echo one@example.com > "$CLAUDE_ROUTE_CONF/allowed"
login "$sandbox/three" three
"$route" import three "$sandbox/three" 2> /dev/null && fail "stored an account not in allowed"

CLAUDE_CONFIG_DIR="$sandbox/elsewhere" "$route" status 2> /dev/null && fail "ran under another CLAUDE_CONFIG_DIR"

echo "claude-route: all checks passed"
