import hashlib
import json
from pathlib import Path
from collections import defaultdict

REPO_ROOT = Path(__file__).resolve().parents[1]
REPORTS_DIR = REPO_ROOT / "reports"
REPORTS_DIR.mkdir(exist_ok=True)

HTML_EXTENSIONS = {".html", ".htm", ".htnl"}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def hyperlink(path: Path) -> str:
    rel = path.relative_to(REPO_ROOT).as_posix()
    return f"[{rel}]({rel})"


def gather_html_files():
    return sorted(
        [p for p in REPO_ROOT.glob("**/*") if p.suffix.lower() in HTML_EXTENSIONS and p.is_file()]
    )


def build_duplicates_map(html_files):
    hash_map = defaultdict(list)
    for path in html_files:
        digest = sha256(path)
        hash_map[digest].append(path)
    duplicates = {}
    for files in hash_map.values():
        if len(files) > 1:
            sorted_files = sorted(files)
            primary = sorted_files[0]
            duplicates[primary] = sorted_files[1:]
    return duplicates


def group_lineages(html_files):
    lineages = defaultdict(list)
    for path in html_files:
        stem = path.stem
        token = stem.split('+')[0]
        token = token.replace('performance-v1 (1)', 'performance-v1')
        # normalize mobile releases as release-M, release-N, etc.
        token = token.replace('release', 'release')
        base = token
        for delimiter in ['-', '_']:
            if delimiter in base:
                base = base.split(delimiter)[0]
                break
        lineages[base].append(path)
    for files in lineages.values():
        files.sort()
    return dict(sorted(lineages.items(), key=lambda item: item[0]))


def write_duplicates_report(duplicates):
    report_path = REPORTS_DIR / "duplicates-log.md"
    lines = [
        "# Duplicate HTML Variants",
        "",
        "This log lists byte-identical HTML files and references the chosen primary variant.",
        "",
    ]
    if not duplicates:
        lines.append("No duplicate HTML files were detected.")
    else:
        for primary, dupes in sorted(duplicates.items(), key=lambda item: item[0]):
            lines.append(f"- Primary {hyperlink(primary)}")
            for dup in dupes:
                lines.append(f"  - Duplicate {hyperlink(dup)}")
            lines.append("")
    report_path.write_text("\n".join(lines))
    return report_path


def write_coverage_report(html_files, duplicates):
    coverage_path = REPORTS_DIR / "coverage-log.md"
    lines = [
        "# HTML Coverage Log",
        "",
        "Tracks each HTML/HTNL artifact, its lineage, and whether it is a duplicate of another file.",
        "",
    ]
    header = "| File | Lineage | Status | Notes |"
    lines.extend([header, "| --- | --- | --- | --- |"])

    lineages = group_lineages(html_files)
    duplicate_lookup = {dup: primary for primary, dupes in duplicates.items() for dup in dupes}

    for lineage, files in lineages.items():
        for path in files:
            status = "duplicate" if path in duplicate_lookup else "primary"
            notes = (
                f"Duplicate of {hyperlink(duplicate_lookup[path])}"
                if path in duplicate_lookup
                else "Needs evaluation"
            )
            lines.append(
                f"| {hyperlink(path)} | {lineage} | {status} | {notes} |"
            )
    coverage_path.write_text("\n".join(lines))
    return coverage_path


def main():
    html_files = gather_html_files()
    duplicates = build_duplicates_map(html_files)
    duplicates_report = write_duplicates_report(duplicates)
    coverage_report = write_coverage_report(html_files, duplicates)
    summary = {
        "html_count": len(html_files),
        "duplicate_groups": len(duplicates),
        "reports": {
            "duplicates": duplicates_report.relative_to(REPO_ROOT).as_posix(),
            "coverage": coverage_report.relative_to(REPO_ROOT).as_posix(),
        },
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
