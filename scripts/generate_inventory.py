#!/usr/bin/env python3
"""Generate repository inventory report for Orbital8 assessment."""
from __future__ import annotations

import argparse
import os
from pathlib import Path
from typing import Iterable, List, Tuple

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SKIP_DIRS = {".git", "node_modules", "__pycache__", ".mypy_cache", ".pytest_cache"}

HTML_KEYWORDS = {
    "ui", "orbital", "performance", "index", "viewer", "poc", "release", "codex",
}


def iter_files(root: Path, skip_dirs: Iterable[str]) -> Iterable[Path]:
    skip = set(skip_dirs)
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in skip]
        for filename in filenames:
            yield Path(dirpath) / filename


def classify(path: Path) -> Tuple[str, str]:
    rel = path.relative_to(REPO_ROOT)
    suffix = rel.suffix.lower()
    name = rel.name.lower()
    if suffix == ".html":
        bucket = "orbital8-candidate"
        reason = "HTML application variant"
        for keyword in HTML_KEYWORDS:
            if keyword in name:
                reason = f"HTML variant contains keyword '{keyword}'"
                break
        return bucket, reason
    if suffix in {".tsx", ".ts", ".js", ".css"}:
        return "supporting-source", f"{suffix[1:].upper()} source"
    if suffix in {".md", ".txt"}:
        return "documentation", "Documentation or plan artifact"
    if suffix in {".json"}:
        return "data", "JSON dataset or metadata"
    if suffix in {".ipynb"}:
        return "notebook", "Jupyter notebook"
    if suffix in {".lock"}:
        return "dependency", "Lock file"
    if suffix == ".py":
        return "tooling", "Utility script"
    return "other", "Unclassified asset"


def build_table(rows: List[Tuple[str, str, str]]) -> str:
    lines = ["| File | Classification | Rationale |", "| --- | --- | --- |"]
    for file_path, classification, rationale in rows:
        lines.append(f"| [{file_path}]({file_path}) | {classification} | {rationale} |")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate file inventory report")
    parser.add_argument(
        "--output",
        default=REPO_ROOT / "reports" / "file-inventory.md",
        type=Path,
        help="Path to write markdown report",
    )
    parser.add_argument(
        "--skip-dir",
        action="append",
        default=[],
        help="Additional directory names to skip",
    )
    args = parser.parse_args()

    skip_dirs = DEFAULT_SKIP_DIRS.union(args.skip_dir)

    rows: List[Tuple[str, str, str]] = []
    for path in sorted(iter_files(REPO_ROOT, skip_dirs)):
        rel = path.relative_to(REPO_ROOT)
        classification, rationale = classify(path)
        rows.append((rel.as_posix(), classification, rationale))

    header = (
        "# Repository Inventory\n\n"
        "This inventory lists every tracked file outside of ignored directories and classifies "
        "artifacts to support the Orbital8 compliance review.\n\n"
    )
    table = build_table(rows)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(header + table + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
