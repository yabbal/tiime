#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/release.sh [major|minor|patch]
# Default: patch

BUMP=${1:-patch}

echo "Bumping version: $BUMP"

# Bump version in package.json
NEW_VERSION=$(node -e "
const pkg = require('./package.json');
const [major, minor, patch] = pkg.version.split('.').map(Number);
const v = { major: \`\${major+1}.0.0\`, minor: \`\${major}.\${minor+1}.0\`, patch: \`\${major}.\${minor}.\${patch+1}\` };
console.log(v['$BUMP']);
")

echo "New version: $NEW_VERSION"

# Update package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Update version in CLI index
sed -i.bak "s/version: \"[0-9]*\.[0-9]*\.[0-9]*\"/version: \"$NEW_VERSION\"/" src/cli/index.ts
rm -f src/cli/index.ts.bak

# Update version in version command
sed -i.bak "s/version: \"[0-9]*\.[0-9]*\.[0-9]*\"/version: \"$NEW_VERSION\"/" src/cli/commands/version.ts
rm -f src/cli/commands/version.ts.bak

# Build and test
pnpm build
pnpm test

# Commit, tag, push
git add package.json src/cli/index.ts src/cli/commands/version.ts
git commit -m "chore: release v$NEW_VERSION"
git tag "v$NEW_VERSION"
git push origin main
git push origin "v$NEW_VERSION"

echo "Released v$NEW_VERSION — GitHub Actions will publish to npm"
