"""Build an offline Water fixture retaining the real engine's AVM1 classes.

No accounts or backend required. The AS3 wrapper preserves the mixed VM layout
of Vanilla; the engine's network-facing shell methods are replaced with stubs.
"""
import argparse
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--ffdec", required=True, type=Path)
parser.add_argument("--java", default="java")
args = parser.parse_args()
output = ROOT / ".validation/water-fixture"
output.mkdir(parents=True, exist_ok=True)
command = [args.java, "-Djava.awt.headless=true", "-jar", str(args.ffdec.resolve()), "-onerror", "abort"]
with tempfile.TemporaryDirectory() as directory:
    temporary = Path(directory)
    for original, source, relative, target in (
        ("engine.swf", "engine.as", "frame_1/DoAction.as", "harness.swf"),
        ("club_penguin.swf", "Main.as", "com/clubpenguin/main/Main.as", "as3.swf"),
    ):
        scripts = temporary / target
        script = scripts / relative
        script.parent.mkdir(parents=True)
        shutil.copyfile(ROOT / "tests/fixtures/water" / source, script)
        subprocess.run(command + ["-importScript", str(ROOT / "vanilla-media/media/play/v2/client" / original),
                                  str(output / target), str(scripts)], check=True)
