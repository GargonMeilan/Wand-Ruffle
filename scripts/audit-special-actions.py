"""Inspect the actual Vanilla clothing/action rules without running Flash."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SLOTS = ("head", "face", "neck", "body", "hand", "feet")


def normalize(item):
    if 10000 < item < 20000 or 30000 <= item < 40000:
        return item - 10000
    return item


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--item", type=int, help="List rules using this item ID")
    parser.add_argument("--outfit", help="Exact head,face,neck,body,hand,feet IDs; use 0 for empty slots")
    parser.add_argument("--trigger", choices=("dance", "wave"), default="dance")
    parser.add_argument("--json", action="store_true", help="Print all matching rules as JSON")
    args = parser.parse_args()
    media = ROOT / "vanilla-media/media/play"
    configs = media / "en/web_service/game_configs"
    frames = json.loads((configs / "penguin_action_frames.json").read_text(encoding="utf-8"))
    names = {i["paper_item_id"]: i["label"] for i in json.loads((configs / "paper_items.json").read_text(encoding="utf-8"))}
    outfit = None
    if args.outfit:
        try:
            outfit = tuple(normalize(int(n)) for n in args.outfit.split(","))
            if len(outfit) != 6 or any(n < 0 for n in outfit):
                raise ValueError()
        except ValueError:
            parser.error("--outfit requires six nonnegative IDs in head,face,neck,body,hand,feet order")
    trigger = 26 if args.trigger == "dance" else 25
    rows = []
    for frame, rules in frames.items():
        for rule in rules:
            ids = tuple(normalize(rule[s]) for s in SLOTS)
            if args.item is not None and normalize(args.item) not in ids:
                continue
            if outfit is not None and (int(frame) != trigger or outfit != ids):
                continue
            action = rule["secret_frame"]
            file = media / "v2/content/global/penguin/actions" / f"{action}.swf"
            rows.append({"trigger_frame": int(frame), "action_frame": action,
                         "outfit": {s: {"id": rule[s], "name": names.get(rule[s], "Empty" if not rule[s] else "Unknown")} for s in SLOTS},
                         "resource": str(file.relative_to(ROOT)) if action not in (25, 26) else "Built into player",
                         "resource_available": action in (25, 26) or file.is_file()})
    if args.json:
        print(json.dumps(rows, ensure_ascii=False, indent=2))
    elif args.item is not None or outfit is not None:
        for row in rows:
            clothes = ", ".join(f"{s}={v['id']} ({v['name']})" for s, v in row["outfit"].items() if v["id"])
            print(f"Frame {row['trigger_frame']} -> {row['action_frame']}: {clothes}; resource available: {row['resource_available']}")
        if outfit is not None and not rows:
            print(f"No special rule: ordinary {args.trigger} (frame {trigger}). Event modules can override this separately.")
        elif args.item is not None and not rows:
            print(f"No base action rule uses item {args.item}. Event modules can implement additional behavior.")
    else:
        print(f"{len(rows)} rules: {len(frames.get('26', []))} dance, {len(frames.get('25', []))} wave; all other rules: {len(rows)-len(frames.get('26', []))-len(frames.get('25', []))}.")
        missing = sorted({r["action_frame"] for r in rows if not r["resource_available"]})
        print("Missing action files: " + (", ".join(map(str, missing)) or "none"))


if __name__ == "__main__":
    main()
