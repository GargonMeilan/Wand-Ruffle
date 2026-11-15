"""Compile the small AVM1 extension into a copy of Vanilla rooms_common.swf.

Requires the official portable FFDec 26.3.0 release and Java. Only the root
frame script is replaced; original classes, graphics and media stay intact.
"""
import argparse
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE_SHA256 = "054298cc3fb6c65ee1ca7c5f04efafc49988b350eb61d78a03d8aa9f7a5c66d7"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffdec", required=True, type=Path, help="Path to ffdec.jar")
    parser.add_argument("--java", default="java", help="Java executable")
    args = parser.parse_args()
    original = ROOT / "vanilla-media/media/play/v2/client/rooms_common.swf"
    if hashlib.sha256(original.read_bytes()).hexdigest() != BASE_SHA256:
        raise SystemExit("Vanilla rooms_common.swf changed; review its startup script before rebuilding the extension.")
    source = ROOT / "world_manager/client/costume-effects.as"
    output = source.with_name("rooms_common.swf")
    source_text = source.read_text(encoding="utf-8")
    with tempfile.TemporaryDirectory() as directory:
        scripts = Path(directory)
        frame = scripts / "frame_1"
        frame.mkdir()
        (frame / "DoAction.as").write_text(
            "com.clubpenguin.world.rooms.common.RoomClasses.init();\n" + source_text, encoding="utf-8")
        subprocess.run([args.java, "-Djava.awt.headless=true", "-jar", str(args.ffdec.resolve()),
                        "-onerror", "abort", "-importScript", str(original), str(output), str(scripts)], check=True)
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    source.with_name("build.json").write_text(json.dumps({
        "compiler": "FFDec 26.3.0", "compiler_sha256": hashlib.sha256(args.ffdec.read_bytes()).hexdigest(),
        "original_sha256": hashlib.sha256(original.read_bytes()).hexdigest(),
        "source_sha256": hashlib.sha256(source_text.encode()).hexdigest(), "output_sha256": digest
    }, indent=2) + "\n", encoding="utf-8")
    print("Built", output.relative_to(ROOT), digest)


if __name__ == "__main__":
    main()
