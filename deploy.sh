#!/usr/bin/env bash
set -e

MSG="${1:-Deploy $(date +'%Y-%m-%d %H:%M')}"

echo "Running local build check..."
npm run build

if git diff --quiet && git diff --cached --quiet; then
  echo "No local changes to commit — pushing existing commits only."
else
  git add -A
  git commit -m "$MSG"
fi

git push origin main

echo ""
echo "Pushed to main — Vercel will build and deploy automatically."
echo "Dashboard: https://vercel.com/dashboard"
echo "Live: https://mad-athletics.com"
