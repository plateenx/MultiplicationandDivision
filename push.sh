#!/usr/bin/env bash
echo "==================================================="
echo "  Math Mastery App - Auto Push to GitHub"
echo "==================================================="
echo ""

echo "[1/3] Adding all updated files..."
git add -A

echo "[2/3] Committing changes..."
git commit -m "Update Supabase database connection and remove legacy GAS files"

echo "[3/3] Pushing to GitHub (origin main)...
git push -u origin main

echo ""
echo "==================================================="
echo "  Finished! Check: https://github.com/plateenx/MultiplicationandDivision"
echo "==================================================="
