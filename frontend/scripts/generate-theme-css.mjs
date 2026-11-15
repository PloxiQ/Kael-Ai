/**
 * Generates app/theme-light.css from the Tailwind classes actually used in the
 * app. The UI was built with explicit dark hex tokens, so the light theme is a
 * generated override layer keyed on those exact class names. Run:
 *
 *   npm run theme:light
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputFile = join(root, "app", "theme-light.css");
const scanRoots = ["app", "components", "lib"].map((dir) => join(root, dir));

const LIGHT_HEX = {
  "052E1C": "ECFDF5",
  "09090B": "F5F7F3",
  "0A0A0A": "F5F7F3",
  "10B981": "047857",
  "161616": "FFFFFF",
  "1A070B": "FEF2F2",
  "1C1C1C": "EEF2EA",
  "262626": "D9DFD5",
  "333333": "AEB9AC",
  "34D399": "065F46",
  "3A3A3A": "AEB9AC",
  "4A4A4A": "8C998F",
  "8E8E8A": "5E6B62",
  "D4D4D8": "26302A",
  "E4E4E7": "26302A",
  "F5F5F0": "0F1512",
  "F7C6A6": "B45309",
  "FAFAFA": "0F1512",
};

/**
 * Palette utilities need explicit light values: zinc text becomes green-black,
 * while red error surfaces become pale red with dark red type.
 */
const PALETTE_LIGHT = {
  "text-zinc-50": "#0F1512",
  "text-zinc-100": "#141C17",
  "text-zinc-200": "#1F2A24",
  "text-zinc-300": "#2C3831",
  "text-zinc-400": "#46544C",
  "text-zinc-500": "#5E6B62",
  "text-zinc-600": "#7A877E",
  "text-white": "#0F1512",
  "hover:text-white": "#0F1512",
  "hover:text-zinc-100": "#141C17",
  "hover:text-zinc-300": "#2C3831",
  "group-hover:text-zinc-300": "#2C3831",
  "disabled:text-zinc-600": "#7A877E",
  "marker:text-zinc-600": "#7A877E",
  "placeholder:text-zinc-600": "#7A877E",
  "bg-zinc-700": "#AEB9AC",
  "text-red-100/90": "rgb(127 29 29 / 0.9)",
  "text-red-200": "#991B1B",
  "text-red-200/70": "rgb(153 27 27 / 0.7)",
  "text-red-200/75": "rgb(153 27 27 / 0.75)",
  "text-red-200/90": "rgb(153 27 27 / 0.9)",
  "text-red-300": "#B91C1C",
  "text-red-300/70": "rgb(185 28 28 / 0.7)",
  "text-red-300/90": "rgb(185 28 28 / 0.9)",
  "text-red-400": "#DC2626",
  "hover:text-red-100": "#7F1D1D",
  "border-red-500/25": "rgb(185 28 28 / 0.35)",
  "border-red-900/40": "rgb(185 28 28 / 0.35)",
  "border-red-900/50": "rgb(185 28 28 / 0.45)",
  "hover:border-red-800": "#B91C1C",
  "hover:border-red-900/60": "rgb(185 28 28 / 0.55)",
  "focus-visible:ring-red-500/30": "rgb(185 28 28 / 0.35)",
  "bg-red-950/15": "#FEF2F2",
  "bg-red-950/20": "#FEE2E2",
  "hover:bg-red-950/20": "#FEE2E2",
  "hover:bg-red-950/35": "#FECACA",
  "text-emerald-300/90": "rgb(4 120 87 / 0.9)",
  "text-amber-200/90": "rgb(146 64 14 / 0.9)",
};

const UTILITY_RE =
  /^(bg|text|border(?:-[xytrbl])?|ring|ring-offset|from|via|to|divide|placeholder|marker|fill|stroke|decoration|caret|accent|outline|shadow|drop-shadow)$/;
const COLOR_UTILITIES = new Set([
  "bg",
  "text",
  "border",
  "border-x",
  "border-y",
  "border-t",
  "border-r",
  "border-b",
  "border-l",
  "ring",
  "ring-offset",
  "from",
  "via",
  "to",
  "divide",
  "placeholder",
  "marker",
  "fill",
  "stroke",
  "decoration",
  "caret",
  "accent",
  "outline",
]);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function collectTokens() {
  const tokens = new Set();
  const tokenRe =
    /(?:[a-z0-9-]+:)*(?:bg|text|border|border-[xytrbl]|ring|ring-offset|from|via|to|divide|placeholder|marker|fill|stroke|decoration|caret|accent|outline|shadow|drop-shadow)-\[[^\]\s]+\](?:\/\[?[0-9.]+\]?)?/g;
  const paletteRe =
    /(?:[a-z0-9-]+:)*(?:bg|text|border|border-[xytrbl]|ring|ring-offset|from|via|to|divide|placeholder|marker|fill|stroke|decoration|caret|accent|outline)-(?:white|black|zinc-[0-9]{2,3}|red-[0-9]{2,3}|emerald-[0-9]{2,3}|amber-[0-9]{2,3})(?:\/[0-9]{1,3})?/g;

  for (const file of scanRoots.flatMap((dir) => walk(dir))) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(tokenRe)) tokens.add(match[0]);
    for (const match of text.matchAll(paletteRe)) tokens.add(match[0]);
  }

  return [...tokens].sort();
}

function splitToken(token) {
  const parts = token.split(":");
  return { variants: parts.slice(0, -1), base: parts.at(-1) };
}

function normalizeHex(hex) {
  let value = hex.replace("#", "").toUpperCase();
  if (value.length === 3) {
    value = value
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (value.length !== 6 && value.length !== 8) {
    return null;
  }
  return value;
}

function hexToRgb(hex) {
  const value = normalizeHex(hex);
  if (!value) return null;
  const alpha = value.length === 8 ? parseInt(value.slice(6), 16) / 255 : null;
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
    alpha,
  };
}

function formatAlpha(value) {
  const rounded = Math.round(value * 1000) / 1000;
  return String(rounded);
}

function cssColor(rgb, alpha) {
  const finalAlpha = alpha ?? rgb.alpha;
  if (finalAlpha == null) {
    return `#${[rgb.r, rgb.g, rgb.b]
      .map((channel) => channel.toString(16).padStart(2, "0"))
      .join("")}`.toUpperCase();
  }
  return `rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${formatAlpha(finalAlpha)})`;
}

function escapeClass(token) {
  return token.replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`);
}

const PSEUDO_VARIANTS = {
  hover: ":hover",
  focus: ":focus",
  "focus-visible": ":focus-visible",
  active: ":active",
  disabled: ":disabled",
  "first-child": ":first-child",
  "last-child": ":last-child",
  checked: ":checked",
  "group-hover": null,
  "group-focus": null,
  marker: "::marker",
  placeholder: "::placeholder",
};

const MEDIA_VARIANTS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

function selectorFor(token, variants) {
  let prefix = "";
  let suffix = "";

  for (const variant of variants) {
    if (variant === "group-hover") {
      prefix += ".group:hover ";
      continue;
    }
    if (variant === "group-focus") {
      prefix += ".group:focus-within ";
      continue;
    }
    const pseudo = PSEUDO_VARIANTS[variant];
    if (pseudo === undefined) {
      return null;
    }
    if (pseudo) {
      suffix += pseudo;
    }
  }

  return `html[data-theme="light"] ${prefix}.${escapeClass(token)}${suffix}`;
}

function declarationsFor(utility, color) {
  if (utility === "bg") {
    return [`background-color: ${color};`];
  }
  if (utility === "divide") {
    return [`border-color: ${color};`];
  }
  if (utility === "text" || utility === "placeholder" || utility === "marker") {
    return [`color: ${color};`];
  }
  if (utility === "border") {
    return [`border-color: ${color};`];
  }
  if (utility === "border-x") {
    return [`border-left-color: ${color};`, `border-right-color: ${color};`];
  }
  if (utility === "border-y") {
    return [`border-top-color: ${color};`, `border-bottom-color: ${color};`];
  }
  if (utility === "border-t") return [`border-top-color: ${color};`];
  if (utility === "border-r") return [`border-right-color: ${color};`];
  if (utility === "border-b") return [`border-bottom-color: ${color};`];
  if (utility === "border-l") return [`border-left-color: ${color};`];
  if (utility === "ring") return [`--tw-ring-color: ${color};`];
  if (utility === "ring-offset") {
    return [`--tw-ring-offset-color: ${color};`];
  }
  if (utility === "decoration") return [`text-decoration-color: ${color};`];
  if (utility === "caret") return [`caret-color: ${color};`];
  if (utility === "accent") return [`accent-color: ${color};`];
  if (utility === "outline") return [`outline-color: ${color};`];
  if (utility === "fill") return [`fill: ${color};`];
  if (utility === "stroke") return [`stroke: ${color};`];
  return null;
}

function gradientDeclarations(utility, rgb, color) {
  const transparent = `rgb(${rgb.r} ${rgb.g} ${rgb.b} / 0)`;
  if (utility === "from") {
    return [
      `--tw-gradient-from: ${color} var(--tw-gradient-from-position);`,
      `--tw-gradient-to: ${transparent} var(--tw-gradient-to-position);`,
      `--tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);`,
    ];
  }
  if (utility === "via") {
    return [
      `--tw-gradient-to: ${transparent} var(--tw-gradient-to-position);`,
      `--tw-gradient-stops: var(--tw-gradient-from), ${color} var(--tw-gradient-via-position), var(--tw-gradient-to);`,
    ];
  }
  return [`--tw-gradient-to: ${color} var(--tw-gradient-to-position);`];
}

function shadowDeclaration(value) {
  if (!/rgba?\(\s*0\s*,\s*0\s*,\s*0/.test(value)) {
    return null;
  }

  const softened = value.replace(
    /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/g,
    (_match, r, g, b, alpha) => {
      if (r !== "0" || g !== "0" || b !== "0") {
        return `rgb(${r} ${g} ${b} / ${alpha})`;
      }
      const softenedAlpha = Math.min(0.18, Math.max(0.08, Number(alpha) * 0.18));
      return `rgb(15 21 18 / ${formatAlpha(softenedAlpha)})`;
    },
  );

  return `box-shadow: ${softened.replaceAll("_", " ")};`;
}

const rules = [];
const warnings = [];

for (const token of collectTokens()) {
  const { variants, base } = splitToken(token);
  const media = [];
  const remaining = [];

  for (const variant of variants) {
    if (variant in MEDIA_VARIANTS) {
      media.push(MEDIA_VARIANTS[variant]);
    } else {
      remaining.push(variant);
    }
  }

  const arbitrary = base.match(
    /^([a-z-]+)-\[(.+?)\](?:\/(\[?([0-9.]+)\]?))?$/,
  );
  if (arbitrary) {
    const [, utility, rawValue, , rawOpacity] = arbitrary;
    if (!UTILITY_RE.test(utility)) {
      continue;
    }

    if (utility === "shadow") {
      const declaration = shadowDeclaration(rawValue);
      if (!declaration) continue;
      const selector = selectorFor(token, remaining);
      if (!selector) {
        warnings.push(`unsupported variant: ${token}`);
        continue;
      }
      rules.push({ selector, declarations: [declaration], media });
      continue;
    }

    if (!COLOR_UTILITIES.has(utility)) {
      continue;
    }

    if (!rawValue.startsWith("#")) {
      continue;
    }

    const normalized = normalizeHex(rawValue);
    if (!normalized) {
      continue;
    }

    const lightHex = LIGHT_HEX[normalized.slice(0, 6)];
    if (!lightHex) {
      warnings.push(`no light mapping for ${token}`);
      continue;
    }

    const rgb = hexToRgb(lightHex);
    if (!rgb) {
      warnings.push(`invalid light mapping for ${token}`);
      continue;
    }

    let alpha = rgb.alpha;
    if (rawOpacity) {
      const parsed = Number(rawOpacity);
      alpha = parsed > 1 ? parsed / 100 : parsed;
    }

    const color = cssColor(rgb, alpha);
    const declarations =
      utility === "from" || utility === "via" || utility === "to"
        ? gradientDeclarations(utility, rgb, color)
        : declarationsFor(utility, color);
    if (!declarations) {
      warnings.push(`no declaration for ${token}`);
      continue;
    }

    const selector = selectorFor(token, remaining);
    if (!selector) {
      warnings.push(`unsupported variant: ${token}`);
      continue;
    }

    rules.push({
      selector:
        utility === "divide"
          ? `${selector} > :not([hidden]) ~ :not([hidden])`
          : selector,
      declarations,
      media,
    });
    continue;
  }

  const lightColor = PALETTE_LIGHT[token] ?? PALETTE_LIGHT[base];
  if (!lightColor) {
    if (/(?:bg|text|border|ring|from|via|to|divide|placeholder|marker)-\[/.test(base)) {
      warnings.push(`unmapped arbitrary token: ${token}`);
    }
    continue;
  }

  const utility = base.slice(0, base.indexOf("-"));
  const declarations = declarationsFor(utility, lightColor);
  if (!declarations) {
    warnings.push(`no palette declaration for ${token}`);
    continue;
  }

  const selector = selectorFor(token, remaining);
  if (!selector) {
    warnings.push(`unsupported variant: ${token}`);
    continue;
  }

  rules.push({
    selector:
      utility === "divide"
        ? `${selector} > :not([hidden]) ~ :not([hidden])`
        : selector,
    declarations,
    media,
  });
}

function renderRule(rule) {
  const body = rule.declarations.map((line) => `  ${line}`).join("\n");
  return `${rule.selector} {\n${body}\n}`;
}

const byMedia = new Map();
for (const rule of rules) {
  const key = rule.media.join(" and ") || "";
  const list = byMedia.get(key) ?? [];
  list.push(rule);
  byMedia.set(key, list);
}

const sections = [];
for (const [media, list] of [...byMedia.entries()].sort((a, b) =>
  a[0].localeCompare(b[0]),
)) {
  const body = list
    .sort((a, b) => a.selector.localeCompare(b.selector))
    .map(renderRule)
    .join("\n\n");
  sections.push(
    media ? `@media (min-width: ${media}) {\n${body}\n}` : body,
  );
}

const header = `/*
 * AUTO-GENERATED by scripts/generate-theme-css.mjs.
 * Do not edit by hand; run \`npm run theme:light\` after changing UI colors.
 *
 * The component tree uses explicit dark hex utilities, so the light palette is
 * applied as a specificity-safe override layer keyed on the exact class names.
 */
`;

writeFileSync(outputFile, `${header}\n${sections.join("\n\n")}\n`, "utf8");

console.log(
  `theme-light.css: ${rules.length} rules from ${
    new Set(rules.map((rule) => rule.selector)).size
  } selectors`,
);
if (warnings.length > 0) {
  console.warn(`\n${warnings.length} warning(s):`);
  for (const warning of [...new Set(warnings)]) {
    console.warn(`  - ${warning}`);
  }
}

