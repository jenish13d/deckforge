#!/usr/bin/env bash
# Installs Agent Reach (https://github.com/Panniantong/Agent-Reach): a command line tool that lets an AI
# agent READ public web pages, YouTube, RSS, V2EX, Bilibili search and public GitHub, for research.
#
# The project's own install guide installs the unpinned `main` branch and can change your system. This script
# instead installs one commit that was read through (no eval/exec, no uploads, system installs only behind an
# explicit --system flag we never use), into its own virtual environment, and then only checks the setup.
#
# Slidezza rules for it (also in AGENTS.md): public pages only; never log in; never give it cookies or
# accounts; never post, comment, message or follow anything.
set -euo pipefail

COMMIT="f65526cbaaad3879473acc1ba6dbefd195caf2be" # v1.5.0
DIR="${AGENT_REACH_DIR:-$HOME/.agent-reach-venv}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

git clone -q https://github.com/Panniantong/Agent-Reach "$WORK/src"
git -C "$WORK/src" checkout -q "$COMMIT"

python3 -m venv "$DIR"
"$DIR/bin/pip" install -q -c "$WORK/src/constraints.txt" "$WORK/src"

echo "Installed: $("$DIR/bin/agent-reach" --version)"
echo "Status (read-only check, nothing else is installed):"
"$DIR/bin/agent-reach" doctor
echo
echo "Run it with: $DIR/bin/agent-reach <command>  (add $DIR/bin to PATH to type just agent-reach)"
