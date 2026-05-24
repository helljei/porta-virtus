#!/usr/bin/env bash
# Wrapper para Mac/Linux. La lógica vive en init.mjs (multiplataforma).
exec node "$(dirname "$0")/init.mjs" "$@"
