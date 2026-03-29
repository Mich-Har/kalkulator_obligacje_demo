#!/bin/bash
# Build script: concatenates all JS modules into a single index.html for production/GitHub Pages.
# Usage: bash build.sh
# Output: dist/index.html (works with double-click, no server needed)

set -e

DIST_DIR="dist"
mkdir -p "$DIST_DIR"

# Extract <head> and opening body from index.html (everything before the script tags)
sed -n '1,/<div id="root"><\/div>/p' index.html > "$DIST_DIR/index.html"

# Concatenate all JS files in correct order into one <script type="text/babel"> block
echo '  <script type="text/babel">' >> "$DIST_DIR/index.html"

for f in \
  js/constants.js \
  js/helpers.js \
  js/engine.js \
  js/ui.js \
  js/views/StartView.js \
  js/views/PortfolioView.js \
  js/views/IKEView.js \
  js/views/ResultsView.js \
  js/views/DetailsView.js \
  js/App.js
do
  echo "" >> "$DIST_DIR/index.html"
  cat "$f" >> "$DIST_DIR/index.html"
done

echo '  </script>' >> "$DIST_DIR/index.html"
echo '</body>' >> "$DIST_DIR/index.html"
echo '</html>' >> "$DIST_DIR/index.html"

echo "Build complete: $DIST_DIR/index.html"
