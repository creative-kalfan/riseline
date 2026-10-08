import React, { useMemo } from "react";

function sanitizeAndFormatHtml(raw: string): string {
  if (!raw) return "";

  // 1. Decode HTML entities (both single and double escaped)
  let clean = raw
    .replace(/&amp;lt;/gi, "<")
    .replace(/&amp;gt;/gi, ">")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;quot;/gi, '"')
    .replace(/&quot;/gi, '"')
    .replace(/&amp;#39;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&amp;amp;/gi, "&")
    .replace(/&amp;nbsp;/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–");

  // 2. Disallow potentially dangerous tags / event handlers
  clean = clean.replace(/<(script|iframe|object|embed|style)[\s\S]*?<\/\1>/gi, "");
  clean = clean.replace(/on\w+="[^"]*"/gi, "");
  clean = clean.replace(/on\w+='[^']*'/gi, "");

  // 3. Remove empty paragraphs or redundant trailing breaks
  clean = clean.replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, "");

  return clean;
}

function isHtml(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str);
}

export function JobDescriptionRenderer({
  description,
  className = "",
}: {
  description?: string | null;
  className?: string;
}) {
  const content = description?.trim() || "";

  const parsedHtml = useMemo(() => {
    if (!content) return "";
    return sanitizeAndFormatHtml(content);
  }, [content]);

  if (!content) {
    return (
      <p className="text-xs text-muted-foreground italic">No job description details provided.</p>
    );
  }

  // If the description contains valid HTML tags, render it with safe sanitized styling
  if (isHtml(parsedHtml)) {
    return (
      <div
        className={`job-description-content text-[12.5px] leading-normal text-foreground/85 space-y-2 
          [&_h1]:text-[14px] [&_h1]:font-semibold [&_h1]:text-foreground [&_h1]:mt-3 [&_h1]:mb-1
          [&_h2]:text-[13px] [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-2.5 [&_h2]:mb-1
          [&_h3]:text-[12.5px] [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-2 [&_h3]:mb-0.5
          [&_h4]:text-[12px] [&_h4]:font-semibold [&_h4]:text-foreground [&_h4]:mt-1.5 [&_h4]:mb-0.5
          [&_p]:leading-normal [&_p]:mb-1.5
          [&_ul]:list-disc [&_ul]:pl-4.5 [&_ul]:space-y-1 [&_ul]:my-1.5
          [&_ol]:list-decimal [&_ol]:pl-4.5 [&_ol]:space-y-1 [&_ol]:my-1.5
          [&_li]:leading-normal
          [&_strong]:font-semibold [&_strong]:text-foreground
          [&_b]:font-semibold [&_b]:text-foreground
          [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-primary/80
          ${className}`}
        dangerouslySetInnerHTML={{ __html: parsedHtml }}
      />
    );
  }

  // Otherwise, render plain text / markdown paragraphs cleanly
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  return (
    <div className={`space-y-2 text-[12.5px] leading-normal text-foreground/85 ${className}`}>
      {paragraphs.map((p, idx) => {
        const lines = p.split("\n").filter((l) => l.trim().length > 0);
        const isBulletBlock = lines.every(
          (l) => l.trim().startsWith("•") || l.trim().startsWith("-") || l.trim().startsWith("*"),
        );

        if (isBulletBlock) {
          return (
            <ul key={idx} className="list-disc pl-4.5 space-y-1 my-1.5">
              {lines.map((line, lIdx) => (
                <li key={lIdx}>{line.replace(/^[•\-*]\s*/, "")}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={idx} className="leading-normal">
            {p}
          </p>
        );
      })}
    </div>
  );
}
