#!/usr/bin/env sh
cd "$(dirname "$0")"
printf 'Site local : http://localhost:8000\n'
python3 -m http.server 8000 --bind 127.0.0.1
