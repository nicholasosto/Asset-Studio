// Write the 2026-07-22 Studio-pass results back into the ancient-tech sidecars:
// resolved studs-per-tile, the face-dependent band rule, and the ticked Studio check.
//
//   node tools/patch-ancient-tech-sidecars.mjs [--confirm]
//
// Dry-run by default. Idempotent: re-running after a confirm is a no-op.

import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const DIR = join(homedir(), 'Master-Managed/Assets/textures/tileable/robotic');
const CONFIRM = process.argv.includes('--confirm');

// Resolved from the Part-Texture-Testing-Lab sweep, 2026-07-22.
// Ground surfaces + field were swept at 2 / 4 / 8 / 12 studs on the authored rig;
// bands were verified at V = the face's vertical extent in the wall-assembly bays.
const RESOLVED = {
  'ancient-tech-exterior-wall-crown-01': {
    scale: '**band — U = V = the face\'s vertical extent** (verified at 10 and at 4 on the door header)',
    note: 'Crown renders exactly one tile per band part. Swept at 2/4/8/12 on a 17-stud ceiling panel it repeats as a stripe, which is the failure this rule prevents.',
  },
  'ancient-tech-exterior-wall-field-01': {
    scale: '**StudsPerTileU/V 12** (sweep: 2 / 4 / 8 / **12**)',
    note: 'At 2 and 4 the panel forms collapse into noise; 8 starts to read; 12 gives the clearest architectural panel scale and the most legible cyan traces. 12 was the top of the authored sweep — 16 is worth testing if a coarser read is wanted.',
  },
  'ancient-tech-exterior-wall-plinth-01': {
    scale: '**band — U = V = the face\'s vertical extent** (verified at 4)',
    note: 'Plinth renders exactly one tile per band part; the ledge stack sits correctly at the wall base.',
  },
  'ancient-tech-road-01': {
    scale: '**StudsPerTileU/V 12** (sweep: 2 / 4 / 8 / **12**)',
    note: 'DIRECTIONAL — confirmed in Studio that the lane channels run along the part\'s local **Z** axis on a Top face. A road running along X needs the part rotated 90 degrees about Y; Texture has no rotation property.',
  },
  'ancient-tech-sidewalk-01': {
    scale: '**StudsPerTileU/V 8** (sweep: 2 / 4 / **8** / 12)',
    note: 'At 2 the pavers vanish into flat concrete; 8 puts them at a believable pedestrian scale; 12 reads as oversized slabs and starts to compete with the plaza.',
  },
  'ancient-tech-plaza-01': {
    scale: '**StudsPerTileU/V 12** (sweep: 2 / 4 / 8 / **12**)',
    note: 'The chamfered slabs want the coarsest scale in the family — this is what separates the plaza read from the sidewalk.',
  },
};

const FACE_RULE = `
### Face-dependent V mapping

\`Texture.StudsPerTileV\` maps to a *different* part axis depending on the face, which decides what
"one tile" means for a band:

| Face | U maps to | V maps to |
|---|---|---|
| Front / Back | part X | part **Y** |
| Left / Right | part Z | part **Y** |
| Top / Bottom | part X | part **Z** |

So a crown or plinth on a wall face takes \`V = Size.Y\`; the same texture on a ceiling face would
take \`V = Size.Z\`. Getting this wrong is what turns a band into a repeating stripe.
`;

let changed = 0, skipped = 0;
for (const [slug, r] of Object.entries(RESOLVED)) {
  const path = join(DIR, `${slug}_BLK.trembus.md`);
  let src = readFileSync(path, 'utf8');
  const before = src;

  // 1. Replace the provisional declared-scale line with the resolved one.
  src = src.replace(
    /- Declared scale: \*\*.*?\*\* — provisional until the Studio pass; record the resolved\n  value back here\. The family shares one scale reference so surfaces read consistently\n  where they meet\./s,
    `- Declared scale: ${r.scale} — **resolved** in the Part-Texture-Testing-Lab sweep,\n  2026-07-22. The family shares one scale reference so surfaces read consistently where they meet.\n- Scale note: ${r.note}`
  );

  // 2. Tick the Studio material check.
  src = src.replace(
    /- \[ \] Studio material check: apply through `Texture`, verify the declared studs-per-tile\n      against a reference humanoid, and confirm the tiling constraint above\./,
    `- [x] Studio material check: applied through \`Texture\` in the Soul Steel\n      \`Workspace.Part-Texture-Testing-Lab\` package, 2026-07-22 — scale swept on the authored\n      2/4/8/12-stud rig and the winner recorded above; tiling constraint confirmed.`
  );

  // 3. Append the face rule once, after the Roblox Configuration section.
  if (!src.includes('### Face-dependent V mapping')) {
    src = src.replace(/\n## Generated Output/, `${FACE_RULE}\n## Generated Output`);
  }

  if (src === before) { skipped++; console.log(`  unchanged: ${slug}`); continue; }
  changed++;
  console.log(`  ${CONFIRM ? 'patched' : 'would patch'}: ${slug}`);
  if (CONFIRM) writeFileSync(path, src);
}
console.log(`\n${changed} to change, ${skipped} already current.`);
if (!CONFIRM) console.log('Dry run — re-run with --confirm to write.');
