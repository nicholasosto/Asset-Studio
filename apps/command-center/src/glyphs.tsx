// App-local SVG glyphs for the Asset Explorer's command bar — the four verbs the @trembus/icons
// 0.2.0 registry doesn't carry (copy · kebab/more · archive · re-sort). Drawn to the same
// conventions as the library's own glyphs (24px viewBox, 1em box, currentColor stroke, width 2,
// round caps/joins, aria-hidden) so they sit seamlessly beside ExternalLinkIcon/FolderOpenIcon.
import type { SVGProps } from 'react';

function Svg({ children, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Two offset rounded rects — the clipboard-copy verb. */
export function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg data-glyph="copy" {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Svg>
  );
}

/** Three vertical dots — the more-actions (kebab) trigger. */
export function KebabIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg data-glyph="kebab" {...props}>
      <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** A lidded storage box — move to `_archive/`. */
export function ArchiveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg data-glyph="archive" {...props}>
      <rect x="2" y="3" width="20" height="5" rx="1" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </Svg>
  );
}

/** Two crossing routed arrows — move to `_resort/` (re-sorting/triage). */
export function ResortIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg data-glyph="resort" {...props}>
      <path d="M2 6h4l10 12h6" />
      <path d="M2 18h4l10-12h6" />
      <path d="M19 3l3 3-3 3" />
      <path d="M19 15l3 3-3 3" />
    </Svg>
  );
}
