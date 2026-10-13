# router

Switch a running Claude Code session between your Claude subscriptions without
running `/login` again. Sign in to each account once and router keeps the
logins. `/route` lists them and `/route <name>` moves the session over. Your
next message goes out on the new account and the conversation carries on.

`/login-add <name>` adds an account. It opens the same browser sign-in as
`/login`, but in a throwaway config folder, so the session you're in stays on
its current account. A notice says when the new one is stored.

It also watches usage. When the 5-hour window passes 80% or the weekly window
passes 90%, a band above the prompt asks whether to reroute. **Reroute**
switches to the next account that isn't resting. **Not now** hides the band
until that window resets.

## How it works

Claude Code keeps its login in `~/.claude/.credentials.json` and re-reads the
file when it changes. `claude-route` (in `bin/`) keeps one copy of each
account's login in `~/.config/claude-route/logins/` (mode 600) and swaps the
active one into place, under the same file locks Claude Code takes for its own
token refreshes. Every open session moves to the new account, not only the one
you typed in.

The first message after a switch rebuilds the prompt cache, so it costs a bit
more on the new account.

## Setup

Store the account you're signed in to now, then add the others with
`/login-add <name>`, or from a terminal:

```
claude-route save main
claude-route add second
```

The terminal version also takes a pasted code if the browser can't hand the
sign-in back on its own.

`claude-route` lives in this plugin's `bin/` folder. Run it from there, or
link it onto your PATH. It needs `jq`, `flock` and GNU `date`.

To keep some accounts out (a work account, say), list the allowed emails one
per line in `~/.config/claude-route/allowed`.

Don't `/logout` to change accounts. It can revoke the refresh token of the
account you're leaving.

## Limits

- Only the default `~/.claude` config is handled. Sessions started with a
  different `CLAUDE_CONFIG_DIR` get an error from `/route`.
- Linux only for now. On macOS the login sits in the Keychain, not a file.
- Usage figures shown are for the active account only.

## Install

```
/plugin marketplace add mattstvartak/claude-skills
/plugin install router@claude-skills
```

## Tests

```
claude plugin test plugins/router
bash plugins/router/tests/claude-route.test.sh
```
