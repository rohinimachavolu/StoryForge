#!/usr/bin/env python3
"""
Local dev server for StoryForge. Reads OPENAI_API_KEY from .env and serves it
as /config.js (window.STORYFORGE_OPENAI_KEY) for local dev.

Usage (from this folder):
  python serve.py
Then open http://127.0.0.1:8000

Do not use this in production as-is (key is sent to the browser).
"""

from __future__ import annotations

import argparse
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))


def load_dotenv(path: str) -> dict[str, str]:
    env: dict[str, str] = {}
    full = os.path.join(ROOT, path)
    if not os.path.isfile(full):
        return env
    # utf-8-sig strips UTF-8 BOM (common when .env is edited on Windows)
    with open(full, encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            val = val.strip()
            if len(val) >= 2 and val[0] == val[-1] and val[0] in "\"'":
                val = val[1:-1]
            env[key] = val
    return env


_env: dict[str, str] | None = None


def openai_key_from_env() -> str:
    global _env
    if _env is None:
        _env = load_dotenv(".env")
    return _env.get("OPENAI_API_KEY", "").strip()


class StoryForgeHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self) -> None:
        path = urlparse(self.path).path.lstrip("/") or "index.html"
        if path == "config.js":
            static_cfg = os.path.join(ROOT, "config.js")
            if os.path.isfile(static_cfg):
                # Use teammate-style file on disk; do not override with .env
                return super().do_GET()
            key = openai_key_from_env()
            body = f"window.STORYFORGE_OPENAI_KEY = {json.dumps(key)};\n".encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

def main() -> None:
    parser = argparse.ArgumentParser(description="StoryForge static server; .env OPENAI_API_KEY → /config.js")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--bind", default="127.0.0.1")
    args = parser.parse_args()

    httpd = ThreadingHTTPServer((args.bind, args.port), StoryForgeHandler)
    print(f"Serving StoryForge at http://{args.bind}:{args.port}/")
    static_cfg = os.path.join(ROOT, "config.js")
    if os.path.isfile(static_cfg):
        print("Using config.js on disk for /config.js (not generated from .env).")
    else:
        print("No config.js on disk — /config.js is generated from OPENAI_API_KEY in .env (dev only).")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
