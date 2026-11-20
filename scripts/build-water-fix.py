"""Rebuild Card-Jitsu Water with scoped card render handling (FFDec 26.3.0)."""
import argparse
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffdec", required=True, type=Path)
    parser.add_argument("--java", default="java")
    args = parser.parse_args()
    original = ROOT / "vanilla-media/media/play/v2/games/water/water.swf"
    target = ROOT / "web/compat"
    manifest = json.loads((target / "water-build.json").read_text())
    if digest(original) != manifest["original_sha256"]:
        raise SystemExit("water.swf changed; review the startup frame before rebuilding.")
    source = target / "water-frame.as"
    command = [args.java, "-Djava.awt.headless=true", "-jar", str(args.ffdec.resolve()), "-onerror", "abort"]
    with tempfile.TemporaryDirectory() as directory:
        temporary = Path(directory)
        subprocess.run(command + ["-export", "script", str(temporary / "export"), str(original)], check=True,
                       stdout=subprocess.DEVNULL)
        frame = temporary / "export/scripts/frame_1/DoAction.as"
        text = frame.read_text(encoding="utf-8")
        if text.strip() != 'var game;\ngame = attachMovie("waterGameEngine","game",this.getNextHighestDepth());':
            raise SystemExit("Unexpected Water startup frame; review before patching.")
        scripts = temporary / "import/frame_1"
        scripts.mkdir(parents=True)
        (scripts / "DoAction.as").write_text(source.read_text(), encoding="utf-8")
        subprocess.run(command + ["-importScript", str(original), str(target / "water.swf"),
                                  str(scripts.parent)], check=True)
    manifest.update(compiler="FFDec 26.3.0", compiler_sha256=digest(args.ffdec), source_sha256=digest(source),
                    output_sha256=digest(target / "water.swf"))
    (target / "water-build.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print("Built web/compat/water.swf", manifest["output_sha256"])


if __name__ == "__main__":
    main()
