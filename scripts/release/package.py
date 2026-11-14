"""Assemble only explicitly selected public release files, then checksum them."""
import hashlib
import json
from pathlib import Path
import re
import tarfile
import zipfile

root = Path(__file__).resolve().parents[2]
version = re.search(r'VERSION = "([^"]+)"', (root / "src/release/version.ts").read_text())[1]
output = root / "tmp/release/dist"
output.mkdir(parents=True, exist_ok=True)
targets = {
    "x86_64-unknown-linux-gnu": "linux-x64",
    "aarch64-unknown-linux-gnu": "linux-arm64",
    "x86_64-apple-darwin": "macos-x64",
    "aarch64-apple-darwin": "macos-arm64",
    "x86_64-pc-windows-msvc": "windows-x64",
}
legal = ["LICENSE", "THIRD_PARTY_NOTICES.md", ".agents/skills/LICENSE.denoland", "licenses/runtime.txt"]
artifacts = []
for target, platform in targets.items():
    windows = platform.startswith("windows")
    binary_name = "fanpo.exe" if windows else "fanpo"
    binary = root / "tmp/release/bin" / target / binary_name
    if not binary.is_file():
        raise RuntimeError(f"Missing verified build: {target}")
    files = [(binary, binary_name)] + [(root / p, p) for p in legal]
    archive = output / f"fanpo-v{version}-{platform}{'.zip' if windows else '.tar.gz'}"
    if windows:
        with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as z:
            for source, name in files:
                z.write(source, name)
    else:
        with tarfile.open(archive, "w:gz") as t:
            for source, name in files:
                info = t.gettarinfo(str(source), name)
                info.mode = 0o755 if name == binary_name else 0o644
                info.uid = info.gid = 0
                info.uname = info.gname = ""
                with source.open("rb") as data:
                    t.addfile(info, data)
    artifacts.append(archive)

kit = root / "tmp/release/agent-kit"
if json.loads((kit / "manifest.json").read_text())["version"] != version:
    raise RuntimeError("Agent kit version mismatch")
archive = output / f"fanpo-agent-kit-v{version}.zip"
with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as z:
    for path in sorted(kit.rglob("*")):
        if path.is_file():
            z.write(path, path.relative_to(kit))
artifacts.append(archive)
checksums = "".join(f"{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.name}\n" for path in artifacts)
(output / "SHA256SUMS").write_text(checksums)
print(checksums, end="")
