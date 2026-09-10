#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REPO_NAME="${1:-job-search}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required. Install with: brew install gh"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Sign in to GitHub first:"
  echo "  gh auth login"
  exit 1
fi

if git remote get-url origin >/dev/null 2>&1; then
  echo "Remote origin already exists:"
  git remote -v
else
  echo "Creating public GitHub repo: $REPO_NAME"
  gh repo create "$REPO_NAME" \
    --public \
    --source=. \
    --remote=origin \
    --description "JOBTRAK — an opportunity dashboard for tracking opportunities, contacts, and tasks."
fi

echo "Pushing main..."
git push -u origin main

OWNER="$(gh api user --jq .login)"
echo "Enabling GitHub Pages (Actions workflow)..."
gh api "repos/${OWNER}/${REPO_NAME}/pages" -X POST -f build_type=workflow >/dev/null 2>&1 \
  || gh api "repos/${OWNER}/${REPO_NAME}/pages" -X PUT -f build_type=workflow

echo
echo "Done."
echo "Repo:  https://github.com/${OWNER}/${REPO_NAME}"
echo "Pages: https://${OWNER}.github.io/${REPO_NAME}/"
echo
echo "The deploy workflow runs on push to main. Check Actions for the first build."
