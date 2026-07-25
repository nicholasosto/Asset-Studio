#!/usr/bin/env python3
"""Pass/fail audit for a Roblox PBR trim sheet.

Every gate here came from a defect found in the _BLK prototype round. Run it before
calling a sheet done. Requires: pillow, numpy.

    python3 audit-trim-sheet.py pbr-prototype/alpha-map-manifest.json

The manifest must provide `maps` (color/normal/roughness/metalness, paths relative to
the manifest) and `row_contract` (name, y0, y1).
"""
import json, sys, os
import numpy as np
from PIL import Image

FAIL, WARN, OK = "FAIL", "warn", "ok"
results = []


def check(gate, verdict, detail):
    results.append((gate, verdict, detail))


def boxblur(a, r):
    out = a.astype(np.float64).copy()
    for ax in (0, 1):
        pad = [(r, r) if i == ax else (0, 0) for i in range(2)]
        cs = np.cumsum(np.pad(out, pad, mode="wrap" if ax == 1 else "edge"), axis=ax)
        out = (np.take(cs, range(2 * r, cs.shape[ax]), axis=ax) -
               np.take(cs, range(0, cs.shape[ax] - 2 * r), axis=ax)) / (2 * r)
    return out


def main(manifest_path):
    base = os.path.dirname(os.path.abspath(manifest_path))
    man = json.load(open(manifest_path))
    m = man["maps"]

    def resolve(p):
        """manifests in this folder have used both manifest-relative and repo-relative paths"""
        for cand in (os.path.join(base, p), os.path.join(base, os.path.basename(p)), p):
            if os.path.exists(cand):
                return cand
        raise FileNotFoundError(p)

    L = lambda k, mode: np.asarray(Image.open(resolve(m[k])).convert(mode)).astype(np.float64)
    color, normal = L("color", "RGB"), L("normal", "RGB")
    rough, metal = L("roughness", "L"), L("metalness", "L")
    rows = [(r["name"], r["y0"], r["y1"]) for r in man["row_contract"]]
    H, W = rough.shape
    lum = color.mean(axis=2)

    # 1 -- normal map must be a real OpenGL tangent-space map
    ch = normal.reshape(-1, 3).mean(axis=0)
    flat_ok = abs(ch[0] - 127.5) < 6 and abs(ch[1] - 127.5) < 6 and ch[2] > 200
    rg = abs(np.corrcoef(normal[:, :, 0].ravel(), normal[:, :, 1].ravel())[0, 1])
    check("normal is tangent-space OpenGL", OK if flat_ok else FAIL,
          f"channel means {ch.round(1)} (flat = 127,127,255)")
    check("normal is a real bake, not greyscale-derived", OK if rg < 0.35 else FAIL,
          f"|corr(R,G)| = {rg:.3f}, want < 0.35")

    # 2 -- metal rows must sit at physically possible reflectance
    mask = metal > 200
    if mask.any():
        mm = lum[mask].mean()
        check("metal reflectance is physical", OK if 120 <= mm <= 245 else FAIL,
              f"metal-flagged albedo mean {mm:.0f} sRGB, want 130-240 (metals reflect 50-98%)")

    # 3 -- dielectric albedo must clear the PBR floor
    di = ~mask
    if di.any():
        med = np.median(lum[di])
        check("dielectric albedo clears the floor", OK if med >= 42 else (WARN if med >= 34 else FAIL),
              f"median {med:.0f} sRGB, want >= 42 (charcoal ~50 is the darkest real material)")

    # 4 -- no baked lighting in the colour map
    nx, ny = (normal[:, :, 0] - 127.5) / 127.5, (normal[:, :, 1] - 127.5) / 127.5
    cav = boxblur(np.gradient(nx, axis=1) + np.gradient(ny, axis=0), 6)
    worst, wrow = 0.0, ""
    for name, y0, y1 in rows:
        c = abs(np.corrcoef(lum[y0:y1].ravel(), cav[y0:y1].ravel())[0, 1])
        if c > worst: worst, wrow = c, name
    check("no baked AO / shading in albedo", OK if worst < 0.3 else FAIL,
          f"worst |corr(luma, cavity)| = {worst:.2f} on {wrow}, want < 0.30")

    # 5 -- material bands must line up with the artwork
    smooth = np.convolve(np.abs(nx).mean(axis=1) + np.abs(ny).mean(axis=1), np.ones(5) / 5, mode="same")
    d = np.abs(np.diff(smooth))
    cand = sorted(np.argsort(d)[-40:].tolist())
    groups, cur = [], [cand[0]]
    for v in cand[1:]:
        if v - cur[-1] <= 10: cur.append(v)
        else: groups.append(cur); cur = [v]
    groups.append(cur)
    art = [int(np.mean(g)) for g in groups]
    # one-to-one assignment, nearest pair first -- otherwise a single strong art edge gets
    # claimed by two boundaries and the loser is reported as a bogus misalignment
    WINDOW = 40
    pairs = sorted(((abs(a - y0), y0, a) for _, y0, _ in rows[1:] for a in art if abs(a - y0) <= WINDOW))
    used_b, used_a, offs = set(), set(), []
    for dist, y0, a in pairs:
        if y0 in used_b or a in used_a:
            continue
        used_b.add(y0); used_a.add(a)
        offs.append((y0, a, y0 - a))
    unmatched = [y0 for _, y0, _ in rows[1:] if y0 not in used_b]
    bad = [o for o in offs if abs(o[2]) > 16]
    check("bands align with the art", OK if not bad else FAIL,
          f"worst offset {max((abs(o[2]) for o in offs), default=0)}px over {len(offs)} matched boundaries, want <= 16" +
          (";  no art edge within %dpx of y%s (not assessed)" % (WINDOW, ", y".join(map(str, unmatched))) if unmatched else "") +
          (";  MISALIGNED: " + ", ".join(f"y{o[0]} vs art y{o[1]} ({o[2]:+d}px)" for o in bad) if bad else ""))

    # 6 -- roughness must actually carry information
    spreads = []
    for name, y0, y1 in rows:
        seg = rough[y0 + 8:y1 - 8]
        if seg.size:
            spreads.append((name, np.percentile(seg, 99) - np.percentile(seg, 1)))
    med_spread = float(np.median([s for _, s in spreads]))
    check("roughness carries detail", OK if med_spread >= 40 else (WARN if med_spread >= 25 else FAIL),
          f"median per-row p1-p99 spread {med_spread:.0f}/255 ({med_spread/2.55:.0f}% of scale), want >= 16%")

    # 7 -- metalness must be binary
    muddy = ((metal > 77) & (metal < 179)).mean() * 100
    check("metalness is binary", OK if muddy < 3 else FAIL,
          f"{muddy:.1f}% of texels in the muddy 77-178 middle, want < 3%")

    # 8 -- horizontal tiling
    worst_map, worst_pct = "", 0.0
    for nm, img in (("color", color), ("normal", normal), ("roughness", rough[:, :, None])):
        a = img if img.ndim == 3 else img[:, :, None]
        wrap = np.abs(a[:, -1] - a[:, 0]).mean(axis=-1)
        near = np.concatenate([a[:, -11:], a[:, :11]], axis=1)
        ref = np.percentile(np.abs(np.diff(near, axis=1)).mean(axis=-1), 90, axis=1)
        pct = (wrap > np.maximum(ref * 2.5, 8)).mean() * 100
        if pct > worst_pct: worst_pct, worst_map = pct, nm
    check("tiles seamlessly on X", OK if worst_pct < 5 else FAIL,
          f"{worst_pct:.1f}% of rows show a seam step on {worst_map}, want < 5%")

    # 9 -- boundaries on clean texel edges for mipping
    off16 = [y0 for _, y0, _ in rows[1:] if y0 % 16]
    check("row boundaries mip cleanly", OK if not off16 else WARN,
          "all boundaries divisible by 16" if not off16 else f"not on a 16px edge: {off16}")

    # 10 -- square, and within the Roblox size ceiling
    check("resolution", OK if (H == W and H <= 1024) else FAIL, f"{W}x{H}, want square and <= 1024")

    width = max(len(g) for g, _, _ in results)
    print(f"\n  trim sheet audit -- {os.path.basename(manifest_path)}\n")
    for gate, verdict, detail in results:
        mark = {OK: "  ok  ", WARN: " warn ", FAIL: " FAIL "}[verdict]
        print(f"  [{mark}] {gate.ljust(width)}   {detail}")
    fails = sum(1 for _, v, _ in results if v == FAIL)
    warns = sum(1 for _, v, _ in results if v == WARN)
    print(f"\n  {len(results) - fails - warns} passed, {warns} warned, {fails} failed\n")
    return 1 if fails else 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__); sys.exit(2)
    sys.exit(main(sys.argv[1]))
