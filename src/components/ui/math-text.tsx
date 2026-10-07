"use client";

import { useMemo } from "react";
import katex from "katex";

interface MathTextProps {
  children: string;
  className?: string;
}

function renderSegment(segment: string, displayMode: boolean, key: number) {
  try {
    const html = katex.renderToString(segment, {
      displayMode,
      throwOnError: false,
      strict: "ignore",
    });
    return <span key={key} dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <span key={key}>{segment}</span>;
  }
}

export function MathText({ children, className }: MathTextProps) {
  const parts = useMemo(() => {
    const text = children || "";
    return text.split(/(\$\$[^$]+?\$\$|\$[^$]+?\$)/g).filter((p) => p !== "");
  }, [children]);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) {
          return (
            <span key={i} className="block my-2 text-center">
              {renderSegment(part.slice(2, -2), true, i)}
            </span>
          );
        }
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          return renderSegment(part.slice(1, -1), false, i);
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
