import http.server
import socketserver
import urllib.request
import urllib.error
import json
import re
from pathlib import Path
from datetime import datetime
import hashlib
import base64

PORT = 8000
OPENAI_URL = "https://api.openai.com/v1/images/generations"
MAX_MODERATION_RETRIES = 2
GENERATED_DIR = Path(__file__).resolve().parent / "generated_images"
GENERATED_DIR.mkdir(exist_ok=True)
CONFIG_PATH = Path(__file__).resolve().parent / "config.js"

def load_openai_api_key():
    if not CONFIG_PATH.exists():
        return "YOUR_OPENAI_API_KEY"

    config_text = CONFIG_PATH.read_text(encoding="utf-8")
    match = re.search(r"openAiApiKey:\s*['\"]([^'\"]+)['\"]", config_text)
    if match:
        return match.group(1)
    return "YOUR_OPENAI_API_KEY"

OPENAI_API_KEY = load_openai_api_key()

def build_asset_prefix(prompt):
    digest = hashlib.sha1(prompt.encode("utf-8")).hexdigest()[:10]
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    return GENERATED_DIR / f"{stamp}-{digest}"

def extension_for_content_type(content_type):
    if "png" in content_type:
        return ".png"
    if "webp" in content_type:
        return ".webp"
    if "jpeg" in content_type or "jpg" in content_type:
        return ".jpg"
    return ".bin"

def sanitize_prompt(prompt):
    safe_prompt = re.sub(
        r"\b(Iron Man|Spider-Man|Batman|Superman|Wolverine|Captain America|Thor|Hulk|Avengers|Marvel|DC)\b",
        "original comic hero",
        prompt,
        flags=re.IGNORECASE
    )
    safe_prompt = re.sub(
        r"\b(kill|killing|murder|blood|gore|weapon|gun|knife|stab|shoot|dead|corpse|fight|punch|fist|attack|hit|battle|versus|vs\.?)\b",
        "dramatic",
        safe_prompt,
        flags=re.IGNORECASE
    )
    return re.sub(r"\s+", " ", safe_prompt).strip()

def build_payload(prompt, incoming):
    return {
        "model": "gpt-image-1",
        "prompt": prompt,
        "size": incoming.get("size", "1024x1024"),
        "quality": incoming.get("quality", "low"),
        "output_format": incoming.get("output_format", "jpeg"),
        "output_compression": incoming.get("output_compression", 70),
        "n": 1
    }

def call_openai_image(payload):
    req = urllib.request.Request(OPENAI_URL, data=json.dumps(payload).encode("utf-8"), headers={
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    })
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))

def build_retry_prompts(prompt):
    sanitized = sanitize_prompt(prompt)
    return [
        prompt,
        (
            "simple low-detail cartoony portrait of one original fictional character, "
            "head-and-shoulders framing, calm expression, minimal background, soft lighting, "
            "safe original design, no logos, no copyrighted characters, no action scene, no combat. "
            f"{sanitized}"
        ).strip(),
        (
            "simple cartoony portrait of one original fictional character, "
            "centered composition, calm or friendly expression, plain background, soft lighting, "
            "safe original design, no action, no conflict, no weapons, no brand references."
        )
    ]

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # We also add CORS headers just in case
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
        
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/generate-image':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                incoming = json.loads(post_data.decode('utf-8') or '{}')
                prompt = incoming.get("prompt", "")
                asset_prefix = build_asset_prefix(prompt or "scene")
                payload = build_payload(prompt, incoming)
                asset_prefix.with_suffix(".prompt.txt").write_text(prompt, encoding="utf-8")
                asset_prefix.with_suffix(".request.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")

                retry_prompts = build_retry_prompts(prompt)
                result = None
                last_error = None

                for attempt_index, attempt_prompt in enumerate(retry_prompts[:MAX_MODERATION_RETRIES + 1]):
                    current_payload = build_payload(attempt_prompt, incoming)
                    if attempt_index == 0:
                        asset_prefix.with_suffix(".prompt.txt").write_text(attempt_prompt, encoding="utf-8")
                        asset_prefix.with_suffix(".request.json").write_text(json.dumps(current_payload, indent=2), encoding="utf-8")
                    else:
                        asset_prefix.with_suffix(f".retry{attempt_index}.prompt.txt").write_text(attempt_prompt, encoding="utf-8")
                        asset_prefix.with_suffix(f".retry{attempt_index}.request.json").write_text(json.dumps(current_payload, indent=2), encoding="utf-8")

                    try:
                        result = call_openai_image(current_payload)
                        break
                    except urllib.error.HTTPError as e:
                        error_body = e.read()
                        is_moderation = e.code == 400 and b"moderation_blocked" in error_body
                        if not is_moderation or attempt_index >= MAX_MODERATION_RETRIES:
                            raise urllib.error.HTTPError(e.url, e.code, e.reason, e.headers, None)
                        last_error = error_body
                        continue

                if result is None and last_error is not None:
                    raise ValueError(f"Image generation failed after {MAX_MODERATION_RETRIES} retries.")

                image_data = (result.get("data") or [{}])[0]
                b64 = image_data.get("b64_json")
                if not b64:
                    raise ValueError(f"No image data in OpenAI response: {result}")

                body = base64.b64decode(b64)
                content_type = "image/jpeg"
                saved_path = asset_prefix.with_suffix(".jpg")
                saved_path.write_bytes(body)
                print(f"Saved generated image to {saved_path}")
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', str(len(body)))
                self.send_header('X-StoryForge-Image-Path', str(saved_path))
                self.end_headers()
                self.wfile.write(body)
            except urllib.error.HTTPError as e:
                error_body = e.read() if hasattr(e, "read") and e.fp is not None else str(e).encode()
                error_path = GENERATED_DIR / f"{datetime.now().strftime('%Y%m%d-%H%M%S')}-error.json"
                error_path.write_bytes(error_body)
                print(f"OpenAI HTTPError {e.code}: {error_body[:500]!r}")
                print(f"Saved OpenAI error payload to {error_path}")
                self.send_response(e.code)
                self.send_header('Content-Type', e.headers.get('Content-Type', 'application/json'))
                self.end_headers()
                self.wfile.write(error_body)
            except Exception as e:
                error_path = GENERATED_DIR / f"{datetime.now().strftime('%Y%m%d-%H%M%S')}-error.txt"
                error_path.write_text(str(e), encoding="utf-8")
                print(f"OpenAI proxy exception: {e}")
                print(f"Saved OpenAI exception details to {error_path}")
                self.send_response(500)
                self.send_header('Content-Type', 'text/plain; charset=utf-8')
                self.end_headers()
                self.wfile.write(str(e).encode())
        else:
            super().do_POST()

Handler = ProxyHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.allow_reuse_address = True
    print("Serving at port", PORT)
    httpd.serve_forever()
