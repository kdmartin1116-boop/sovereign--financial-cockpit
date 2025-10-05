import math
import os
import re


def shannon_entropy(s: str) -> float:
    if not s:
        return 0.0
    prob = [float(s.count(c)) / len(s) for c in set(s)]
    return -sum(p * math.log2(p) for p in prob)


def is_base64_like(s: str) -> bool:
    # crude check: long, base64-safe chars
    return bool(re.fullmatch(r"[A-Za-z0-9+/=]{40,}", s.strip()))


KEY_PATTERNS = [
    re.compile(r"-----BEGIN .*PRIVATE KEY-----"),
    re.compile(r"-----BEGIN RSA PRIVATE KEY-----"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"AIza[0-9A-Za-z_-]{35}"),
    re.compile(r"ssh-rsa [A-Za-z0-9+/]+=*"),
]


def scan_file(path: str):
    findings = []
    try:
        with open(path, "r", errors="ignore") as f:
            for i, line in enumerate(f, start=1):
                s = line.strip()
                if not s:
                    continue
                for p in KEY_PATTERNS:
                    if p.search(s):
                        findings.append((i, "pattern", p.pattern, s[:200]))
                if is_base64_like(s):
                    ent = shannon_entropy(s)
                    if ent > 4.0:  # heuristic
                        findings.append((i, "base64_high_entropy", f"ent={ent:.2f}", s[:200]))
                if len(s) > 120 and "private" in s.lower():
                    findings.append((i, "long_private_line", "", s[:200]))
    except Exception:
        return findings
    return findings


def scan_repo(root: str):
    summary = {}
    for dirpath, _dirnames, filenames in os.walk(root):
        # skip .git and virtualenvs
        if ".git" in dirpath.split(os.sep) or "venv" in dirpath.split(os.sep):
            continue
        for fn in filenames:
            if fn.endswith((".png", ".jpg", ".jpeg", ".pdf", ".exe", ".dll")):
                continue
            path = os.path.join(dirpath, fn)
            rel = os.path.relpath(path, root)
            findings = scan_file(path)
            if findings:
                summary[rel] = findings
    return summary


if __name__ == "__main__":
    root = os.getcwd()
    print(f"Scanning repository at {root} for likely secrets...\n")
    summary = scan_repo(root)
    if not summary:
        print("No high-confidence secrets found by heuristic scan.")
    else:
        print("Potential findings:\n")
        for path, items in summary.items():
            print(f"{path}:")
            for ln, kind, info, snippet in items:
                print(f"  line {ln}: {kind} {info} -> {snippet}")
            print()
