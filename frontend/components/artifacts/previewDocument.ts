import type { ArtifactType, KaelArtifact } from "./artifactParser";

const REACT_VERSION = "18.3.1";
const BABEL_VERSION = "7.26.4";

const COMMON_HOOKS = [
  "useState",
  "useEffect",
  "useLayoutEffect",
  "useMemo",
  "useRef",
  "useCallback",
  "useReducer",
  "useContext",
  "useId",
  "useTransition",
  "useDeferredValue",
  "useSyncExternalStore",
  "useInsertionEffect",
  "useImperativeHandle",
  "useDebugValue",
  "Fragment",
  "StrictMode",
  "createContext",
  "forwardRef",
  "memo",
  "lazy",
  "Suspense",
  "startTransition",
];

export function isPreviewable(type: ArtifactType): boolean {
  return (
    type === "html" ||
    type === "react" ||
    type === "svg" ||
    type === "markdown"
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeScriptContent(value: string): string {
  return value.replace(/<\/script/gi, "<\\/script");
}

function injectViewport(html: string): string {
  if (/<meta[^>]+name=["']viewport["']/i.test(html)) {
    return html;
  }

  const meta =
    '<meta name="viewport" content="width=device-width, initial-scale=1" />';

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${meta}`);
  }

  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html([^>]*)>/i, `<html$1><head>${meta}</head>`);
  }

  return html;
}

function stripImportStatements(source: string): string {
  const lines = source.split("\n");
  const kept: string[] = [];
  let inImport = false;
  let sawFrom = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!inImport && /^import(?=[\s{*"'])/.test(trimmed)) {
      inImport = true;
      sawFrom = false;
    }

    if (inImport) {
      if (
        /from\s+['"][^'"]+['"]/.test(trimmed) ||
        /^import\s+['"][^'"]+['"]/.test(trimmed)
      ) {
        inImport = false;
        sawFrom = false;
      } else if (/\bfrom\s*$/.test(trimmed)) {
        sawFrom = true;
      } else if (sawFrom && /['"]/.test(trimmed)) {
        inImport = false;
        sawFrom = false;
      }

      continue;
    }

    kept.push(line);
  }

  return kept.join("\n");
}

function prepareReactSource(rawSource: string): string {
  let source = rawSource.replace(
    /^\s*(['"])use (client|server)\1;?\s*/gm,
    "",
  );

  source = stripImportStatements(source);

  let defaultName = "";
  let hasDefaultExpression = false;

  source = source.replace(
    /export\s+default\s+function\s+([A-Za-z_$][\w$]*)/g,
    (_match, name: string) => {
      defaultName = name;
      return `function ${name}`;
    },
  );

  source = source.replace(
    /export\s+default\s+class\s+([A-Za-z_$][\w$]*)/g,
    (_match, name: string) => {
      defaultName = name;
      return `class ${name}`;
    },
  );

  source = source.replace(
    /export\s+default\s+([A-Za-z_$][\w$]*)\s*;?/g,
    (_match, name: string) => {
      hasDefaultExpression = true;
      return `const __KaelDefault = ${name};`;
    },
  );

  source = source.replace(/export\s+default\s+/g, () => {
    hasDefaultExpression = true;
    return "const __KaelDefault = ";
  });

  source = source.replace(
    /export\s*\{\s*([A-Za-z_$][\w$]*)\s+as\s+default\s*\}\s*;?/g,
    (_match, name: string) => {
      hasDefaultExpression = true;
      return `const __KaelDefault = ${name};`;
    },
  );

  source = source.replace(
    /^\s*export\s+(?=(?:const|let|var|function|class|async|interface|type|enum|namespace|declare)\b)/gm,
    "",
  );
  source = source.replace(
    /^\s*export\s*\{[^}]*\}\s*;?[ \t]*$/gm,
    "",
  );
  source = source.replace(
    /^\s*export\s*\*\s*from\s*['"][^'"]+['"]\s*;?[ \t]*$/gm,
    "",
  );

  if (defaultName && !hasDefaultExpression) {
    source += `\nconst __KaelDefault = ${defaultName};`;
  }

  const usedHooks = COMMON_HOOKS.filter((name) =>
    new RegExp(`\\b${name}\\b`).test(source),
  );
  const declarations: string[] = [];
  if (usedHooks.length > 0) {
    declarations.push(`const { ${usedHooks.join(", ")} } = React;`);
  }
  if (/\bcreateRoot\b/.test(source)) {
    declarations.push("const createRoot = ReactDOM.createRoot;");
  }

  const componentNames = Array.from(
    source.matchAll(
      /(?:function|class|const|let|var)\s+([A-Z][A-Za-z0-9_$]*)/g,
    ),
    (match) => match[1],
  ).filter(
    (name, index, list) =>
      list.indexOf(name) === index && name !== "__KaelDefault",
  );

  const candidates = Array.from(
    new Set(["__KaelDefault", ...componentNames, "App", "Component", "Main"]),
  );

  const candidateLines = candidates
    .map(
      (name) =>
        `typeof ${name} !== "undefined" ? ${name} : null`,
    )
    .join(",\n  ");

  const rendersItself =
    /\b(?:createRoot|ReactDOM\.(?:render|createRoot))\s*\(/.test(source);

  const renderCode = rendersItself
    ? ""
    : `
const __KaelCandidates = [
  ${candidateLines}
];
const __KaelComponent = __KaelCandidates.find(
  (candidate) =>
    candidate != null &&
    (typeof candidate === "function" ||
      typeof candidate === "object" ||
      typeof candidate === "string")
);
const __KaelRootElement = document.getElementById("root");
if (__KaelComponent && __KaelRootElement) {
  const __KaelNode = React.isValidElement(__KaelComponent)
    ? __KaelComponent
    : React.createElement(__KaelComponent);
  ReactDOM.createRoot(__KaelRootElement).render(__KaelNode);
} else if (__KaelRootElement) {
  __KaelRootElement.innerHTML =
    '<div style="padding:32px;font-family:system-ui,sans-serif;color:#d4d4d8;background:#09090b;min-height:100vh">No renderable React component was found in this artifact.</div>';
}
`;

  return `${declarations.join("\n")}\n${source}\n${renderCode}`;
}

function buildHtmlDocument(content: string): string {
  if (/<!doctype\s+html|<html[\s>]/i.test(content)) {
    return injectViewport(content);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body { margin: 0; min-height: 100%; }
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #ffffff; color: #111827; }
  </style>
</head>
<body>
${content}
</body>
</html>`;
}

function buildSvgDocument(content: string): string {
  const svg = content.replace(/^\s*<\?xml[\s\S]*?\?>\s*/i, "");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body { box-sizing: border-box; margin: 0; min-height: 100%; }
    body { display: grid; place-items: center; min-height: 100vh; padding: 24px; background: #0b0b0f; }
    svg { max-width: 100%; height: auto; }
  </style>
</head>
<body>
${svg}
</body>
</html>`;
}

function buildReactDocument(content: string): string {
  const source = escapeScriptContent(prepareReactSource(content));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    html, body, #root { min-height: 100%; }
    body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #09090b; color: #fafafa; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script crossorigin src="https://unpkg.com/react@${REACT_VERSION}/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@${REACT_VERSION}/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone@${BABEL_VERSION}/babel.min.js"></script>
  <script>
    function __kaelReport(message) {
      try {
        parent.postMessage({ type: "kael-artifact-error", message: String(message || "Preview error") }, "*");
      } catch (_error) {}
    }
    window.addEventListener("error", function (event) {
      __kaelReport(event.message);
    });
    window.addEventListener("unhandledrejection", function (event) {
      var reason = event.reason;
      __kaelReport(reason && reason.message ? reason.message : reason);
    });
  </script>
  <script type="text/babel" data-presets="react,typescript">
${source}
  </script>
</body>
</html>`;
}

function buildTextDocument(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body { margin: 0; min-height: 100%; }
    body { padding: 28px; background: #09090b; color: #e4e4e7; }
    pre { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font: 14px/1.7 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  </style>
</head>
<body>
<pre>${escapeHtml(content)}</pre>
</body>
</html>`;
}

export function buildPreviewDocument(artifact: KaelArtifact): string {
  if (artifact.type === "html") {
    return buildHtmlDocument(artifact.content);
  }
  if (artifact.type === "svg") {
    return buildSvgDocument(artifact.content);
  }
  if (artifact.type === "react") {
    return buildReactDocument(artifact.content);
  }
  return buildTextDocument(artifact.content);
}
