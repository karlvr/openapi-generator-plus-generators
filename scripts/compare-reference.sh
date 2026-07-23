#!/bin/bash
# Compare generated test output against a reference generated from the
# Handlebars templates, to verify that the TypeScript templates produce
# byte-identical output. Temporary tooling for the template-migration branch.
#
# Usage:
#   scripts/compare-reference.sh [package-dir ...]
#
# Runs each package's test suite with TMPDIR pointed at a scratch directory
# (testGenerate writes its output under $TMPDIR), then diffs that output
# against the reference. Defaults to the packages migrated so far.
#
# Trailing whitespace is normalized on both sides before diffing: the ts
# tagged template deliberately trims it, and we accept that as a deviation
# from the Handlebars output. All other whitespace must match exactly.
#
# Environment:
#   REFERENCE  path to the reference output
#              (default: ~/Desktop/openapi-generator-plus-generators-reference)
#   SKIP_TESTS set to 1 to diff existing output without re-running tests

set -e

cd "$(dirname "$0")/.."

REFERENCE="${REFERENCE:-$HOME/Desktop/openapi-generator-plus-generators-reference}"
OUTPUT="${OUTPUT:-/tmp/openapi-generator-plus-generators-compare}"
# Normalized copy of the reference, built on first run. Delete it if the
# reference is regenerated.
REFERENCE_NORMALIZED="${REFERENCE_NORMALIZED:-/tmp/openapi-generator-plus-generators-reference-normalized}"

if [ ! -d "$REFERENCE" ]; then
	echo "Reference directory not found: $REFERENCE" >&2
	exit 1
fi

# Copy just the generated sources (build artifacts are excluded from the
# diff anyway) and strip trailing whitespace from every line.
normalize() {
	local src="$1" dst="$2"
	rsync -a --delete \
		--exclude node_modules --exclude dist \
		--exclude pnpm-lock.yaml --exclude package-lock.json \
		"$src/" "$dst/"
	find "$dst" -type f -exec sed -i '' -E 's/[[:space:]]+$//' {} +
}

PACKAGES=("$@")
if [ ${#PACKAGES[@]} -eq 0 ]; then
	PACKAGES=(typescript-fetch-client2 typescript-fetch-node-client2)
fi

if [ "$SKIP_TESTS" != "1" ]; then
	for pkg in "${PACKAGES[@]}"; do
		echo "Running tests for $pkg..."
		(cd "packages/$pkg" && TMPDIR="$OUTPUT" ../../node_modules/.bin/jest >/dev/null 2>&1) || echo "WARNING: tests failed for $pkg; diffing whatever was generated" >&2
	done
fi

status=0
for pkg in "${PACKAGES[@]}"; do
	if [ ! -d "$REFERENCE_NORMALIZED/$pkg" ]; then
		echo "Normalizing reference for $pkg..."
		normalize "$REFERENCE/$pkg" "$REFERENCE_NORMALIZED/$pkg"
	fi
	normalize "$OUTPUT/openapi-generator-plus-generators/$pkg" "$OUTPUT/normalized/$pkg"

	echo
	echo "=== $pkg ==="
	if diff -ru "$REFERENCE_NORMALIZED/$pkg" "$OUTPUT/normalized/$pkg"; then
		echo "identical"
	else
		status=1
	fi
done
exit $status
