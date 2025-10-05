import math
import re
import subprocess
import sys

KEY_PATTERNS = [
    re.compile(r"-----BEGIN .*PRIVATE KEY-----"),
    re.compile(r"-----BEGIN RSA PRIVATE KEY-----"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"AIza[0-9A-Za-z_-]{35}"),
    re.compile(r"ssh-rsa [A-Za-z0-9+/]+=*"),
]


def shannon_entropy(s: str) -> float:
    if not s:
        return 0.0
    prob = [float(s.count(c)) / len(s) for c in set(s)]
    return -sum(p * math.log2(p) for p in prob)


def is_text_bytes(b: bytes) -> bool:
    # reject if NUL bytes or other binary indicators
    if b"\x00" in b:
        return False
    # heuristic: if many non-ASCII, consider binary
    try:
        b.decode("utf-8")
    except Exception:
        return False
    # otherwise text
    return True


def scan_blob_content(text: str):
    findings = []
    for i, line in enumerate(text.splitlines(), start=1):
        s = line.strip()
        if not s:
            continue
        for p in KEY_PATTERNS:
            if p.search(s):
                findings.append((i, "pattern", p.pattern, s[:200]))
        if re.fullmatch(r"[A-Za-z0-9+/=]{40,}", s):
            ent = shannon_entropy(s)
            if ent > 4.0:
                findings.append((i, "base64_high_entropy", f"ent={ent:.2f}", s[:200]))
        if len(s) > 200 and "private" in s.lower():
            findings.append((i, "long_private_line", "", s[:200]))
    return findings


def get_all_blob_shas():
    # list all object ids reachable from all refs
    res = subprocess.run(["git", "rev-list", "--objects", "--all"], capture_output=True, text=True)
    if res.returncode != 0:
        print("Failed to list git objects", file=sys.stderr)
        sys.exit(1)
    shas = []
    for line in res.stdout.splitlines():
        parts = line.split()
        if parts:
            shas.append(parts[0])
    return sorted(set(shas))


def scan_history(root="."):
    shas = get_all_blob_shas()
    results = {}
    for sha in shas:
        # show only blobs (skip commits/trees)
        # use git cat-file -p
        res = subprocess.run(["git", "cat-file", "-p", sha], capture_output=True)
        if res.returncode != 0:
            continue
        b = res.stdout
        if not is_text_bytes(b):
            continue
        try:
            text = b.decode("utf-8", errors="ignore")
        except Exception:
            continue
        findings = scan_blob_content(text)
        if findings:
            # fallback: we will record sha only
            results[sha] = findings
    return results


if __name__ == "__main__":
    print("Scanning git history for likely secrets (this may take a while)...")
    findings = scan_history()
    if not findings:
        print("No findings in git history blobs.")
    else:
        print(f"Found {len(findings)} blobs with potential secrets:")
        for sha, items in findings.items():
            print(sha)
            for ln, kind, info, snippet in items:
                print(f"  line {ln}: {kind} {info} -> {snippet}")
