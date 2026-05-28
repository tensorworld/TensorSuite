#!/usr/bin/env python3
"""
Extract tensor metadata from TensorSuite bundles and write summary JSON files.

Run this locally (not in the CI container) since it downloads from the CDN.
After running, commit assets/data/*.json to the repo.

Usage:
  python3 scripts/extract-metadata.py
"""

import io
import json
import tarfile
import urllib.request
from pathlib import Path

BASE = "https://pub-994965efd6174af39f49af9ceb79117a.r2.dev"
OUT  = Path(__file__).parent.parent / "assets" / "data"


def fetch_metadata(url: str) -> dict:
    """Download a tar.gz and return the first metadata.json found inside."""
    with urllib.request.urlopen(url) as resp:
        data = resp.read()
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as tar:
        for member in tar.getmembers():
            if member.name.endswith("metadata.json"):
                f = tar.extractfile(member)
                if f:
                    return json.loads(f.read())
    raise FileNotFoundError(f"No metadata.json found in {url}")


# ── Knowledge Graph ────────────────────────────────────────────────────────────
KG_TENSORS = [
    ("JF17K-3",      f"{BASE}/KnowledgeGraph/JF17K3.tar.gz"),
    ("JF17K-4",      f"{BASE}/KnowledgeGraph/JF17K4.tar.gz"),
    ("WikiPeople-3", f"{BASE}/KnowledgeGraph/Wiki3.tar.gz"),
    ("WikiPeople-4", f"{BASE}/KnowledgeGraph/Wiki4.tar.gz"),
]

def build_knowledge_graph():
    tensors = []
    for name, url in KG_TENSORS:
        print(f"Fetching {name} …")
        meta = fetch_metadata(url)
        tensors.append({
            "name":  name,
            "order": meta.get("order"),
            "size":  meta.get("size"),
            "nnz":   meta.get("nnz"),
        })
    out = OUT / "knowledge-graph.json"
    out.write_text(json.dumps({"tensors": tensors}, indent=2))
    print(f"Wrote {out}")


# ── Quantum Physics ────────────────────────────────────────────────────────────
SYMMETRIES = ["kysznf", "sznf", "nf", "nfparity"]
SYSTEMS    = ["E1", "E2", "S1", "S2", "S3"]
LAYOUTS    = {
    "canonical_formulation":         "Canonical",
    "block_permuted_internal_only":  "Permuted",
}

def build_quantum_physics():
    tensors = []
    for layout_key, layout_label in LAYOUTS.items():
        for sym in SYMMETRIES:
            for sys in SYSTEMS:
                for ab in ("A", "B"):
                    tname = f"{layout_key}_{sym}_{sys}_{ab}"
                    url   = f"{BASE}/quantum_physics/{tname}.tar.gz"
                    print(f"Fetching {tname} …")
                    try:
                        meta = fetch_metadata(url)
                        tensors.append({
                            "name":      tname,
                            "layout":    layout_label,
                            "symmetry":  sym,
                            "system":    sys,
                            "tensor":    ab,
                            "order":     meta.get("order"),
                            "size":      meta.get("size"),
                            "nnz":       meta.get("nnz"),
                            "nnz_block": meta.get("nnz_block"),
                        })
                    except Exception as e:
                        print(f"  WARNING: {e}")
    out = OUT / "quantum-physics.json"
    out.write_text(json.dumps({"tensors": tensors}, indent=2))
    print(f"Wrote {out}")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    build_knowledge_graph()
    build_quantum_physics()
