"""Rebuild Catchin' Waves with deferred title initialization (FFDec 26.3.0)."""
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
    original = ROOT / "vanilla-media/media/play/v2/games/waves/CatchinWaves.swf"
    target = ROOT / "web/compat"
    manifest = json.loads((target / "waves-build.json").read_text())
    if digest(original) != manifest["original_sha256"]:
        raise SystemExit("CatchinWaves.swf changed; review launch() before rebuilding.")
    source = target / "waves-launch.as"
    command = [args.java, "-Djava.awt.headless=true", "-jar", str(args.ffdec.resolve()), "-onerror", "abort"]
    with tempfile.TemporaryDirectory() as directory:
        temporary = Path(directory)
        subprocess.run(command + ["-export", "script", str(temporary / "export"), str(original)], check=True,
                       stdout=subprocess.DEVNULL)
        frame = temporary / "export/scripts/frame_1/DoAction.as"
        text = frame.read_text(encoding="utf-8")
        start = text.index("function launch()")
        end = text.index("function getCoins()", start)
        scripts = temporary / "import/frame_1"
        scripts.mkdir(parents=True)
        (scripts / "DoAction.as").write_text(text[:start] + source.read_text() + "\n" + text[end:], encoding="utf-8")
        subprocess.run(command + ["-importScript", str(original), str(target / "CatchinWaves.swf"),
                                  str(scripts.parent)], check=True)
    manifest.update(compiler="FFDec 26.3.0", compiler_sha256=digest(args.ffdec), source_sha256=digest(source),
                    output_sha256=digest(target / "CatchinWaves.swf"))
    (target / "waves-build.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print("Built web/compat/CatchinWaves.swf", manifest["output_sha256"])


if __name__ == "__main__":
    main()
