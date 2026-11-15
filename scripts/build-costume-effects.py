"""Compile the small AVM1 extension into a copy of Vanilla rooms_common.swf.

Requires the official portable FFDec 26.3.0 release and Java. Only the root
frame script is replaced; original classes, graphics and media stay intact.
"""
import argparse
import hashlib
import json
import re
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE_SHA256 = "054298cc3fb6c65ee1ca7c5f04efafc49988b350eb61d78a03d8aa9f7a5c66d7"


def as2_literal(value):
    # FFDec's AS2 parser requires identifier keys in object literals.
    if isinstance(value, dict):
        if any(not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", key) for key in value):
            raise ValueError("Invalid AS2 profile field")
        return "{" + ",".join(key + ":" + as2_literal(item) for key, item in value.items()) + "}"
    if isinstance(value, list):
        return "[" + ",".join(as2_literal(item) for item in value) + "]"
    return json.dumps(value, ensure_ascii=True)


def validate_profiles(profiles):
    media = ROOT / "vanilla-media/media/play"
    items = {item["paper_item_id"]: item for item in json.loads(
        (media / "en/web_service/game_configs/paper_items.json").read_text(encoding="utf-8"))}
    slots = {"head": 2, "face": 3, "neck": 4, "body": 5, "hand": 6, "feet": 7}
    ids = set()
    for profile in profiles:
        if profile["id"] in ids or not profile["match"]:
            raise ValueError("Duplicate or empty ability profile")
        ids.add(profile["id"])
        for slot, item_id in profile["match"].items():
            if slot not in slots or not isinstance(item_id, int) or item_id not in items:
                raise ValueError("Invalid equipment in " + profile["id"])
            if items[item_id]["type"] != slots[slot]:
                raise ValueError("Wrong equipment slot in " + profile["id"])
            if not (media / "v2/content/global/clothing/sprites" / f"{item_id}.swf").is_file():
                raise ValueError("Missing clothing sprite in " + profile["id"])


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
    source_text += "\n" + source.with_name("ability-renderers.as").read_text(encoding="utf-8")
    profiles_text = source.with_name("costume-profiles.json").read_text(encoding="utf-8")
    profiles = json.loads(profiles_text)["profiles"]
    validate_profiles(profiles)
    with tempfile.TemporaryDirectory() as directory:
        scripts = Path(directory)
        frame = scripts / "frame_1"
        frame.mkdir()
        (frame / "DoAction.as").write_text(
            "com.clubpenguin.world.rooms.common.RoomClasses.init();\n_global.wandCostumeProfiles = " +
            as2_literal(profiles) + ";\n" + source_text, encoding="utf-8")
        subprocess.run([args.java, "-Djava.awt.headless=true", "-jar", str(args.ffdec.resolve()),
                        "-onerror", "abort", "-importScript", str(original), str(output), str(scripts)], check=True)
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    source.with_name("build.json").write_text(json.dumps({
        "compiler": "FFDec 26.3.0", "compiler_sha256": hashlib.sha256(args.ffdec.read_bytes()).hexdigest(),
        "original_sha256": hashlib.sha256(original.read_bytes()).hexdigest(),
        "source_sha256": hashlib.sha256(source_text.encode()).hexdigest(),
        "profiles_sha256": hashlib.sha256(profiles_text.encode()).hexdigest(), "output_sha256": digest
    }, indent=2) + "\n", encoding="utf-8")
    print("Built", output.relative_to(ROOT), digest)


if __name__ == "__main__":
    main()
