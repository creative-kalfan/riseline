/**
 * Unit tests for PDF Document Geometry Overlay logic and coordinate transformations.
 */
import { describe, it, expect } from "vitest";
import type { GeometryBlock, DocumentGeometryMap } from "@/types/geometry";

function scaleBbox(bbox: [number, number, number, number], zoom: number) {
  const [x0, y0, x1, y1] = bbox;
  return {
    left: Math.round(x0 * zoom),
    top: Math.round(y0 * zoom),
    width: Math.max(8, Math.round((x1 - x0) * zoom)),
    height: Math.max(8, Math.round((y1 - y0) * zoom)),
  };
}

describe("PDF Geometry Overlay Coordinates", () => {
  const sampleBlock: GeometryBlock = {
    id: "p0_b1",
    page: 0,
    bbox: [54, 120, 500, 180],
    text: "Senior Backend Engineer — Acme Corp",
    lines: [],
    style: {
      font_name: "helv",
      font_size: 11,
      line_height: 14,
    },
    char_limit: 120,
    section: "experience",
    item_id: "exp_1",
  };

  it("scales coordinates correctly at 100% zoom", () => {
    const coords = scaleBbox(sampleBlock.bbox, 1.0);
    expect(coords.left).toBe(54);
    expect(coords.top).toBe(120);
    expect(coords.width).toBe(446);
    expect(coords.height).toBe(60);
  });

  it("scales coordinates correctly at 150% zoom", () => {
    const coords = scaleBbox(sampleBlock.bbox, 1.5);
    expect(coords.left).toBe(81);
    expect(coords.top).toBe(180);
    expect(coords.width).toBe(669);
    expect(coords.height).toBe(90);
  });

  it("scales coordinates correctly at 75% zoom", () => {
    const coords = scaleBbox(sampleBlock.bbox, 0.75);
    expect(coords.left).toBe(41);
    expect(coords.top).toBe(90);
    expect(coords.width).toBe(335);
    expect(coords.height).toBe(45);
  });

  it("parses DocumentGeometryMap with multiple pages and blocks", () => {
    const geom: DocumentGeometryMap = {
      page_count: 2,
      pages: [
        {
          page_index: 0,
          width: 612,
          height: 792,
          blocks: [sampleBlock],
        },
        {
          page_index: 1,
          width: 612,
          height: 792,
          blocks: [
            {
              id: "p1_b0",
              page: 1,
              bbox: [54, 50, 400, 80],
              text: "Education Section",
              lines: [],
              style: { font_name: "times", font_size: 12, line_height: 15 },
              section: "education",
            },
          ],
        },
      ],
      sections_detected: ["experience", "education"],
      extractor_version: "1.0.0",
    };

    expect(geom.page_count).toBe(2);
    expect(geom.pages[0].blocks[0].section).toBe("experience");
    expect(geom.pages[1].blocks[0].section).toBe("education");
  });
});

describe("PDF Geometry Overlay Keyboard Navigation & Accessibility Contract", () => {
  it("triggers save on Ctrl+Enter and Meta+Enter (Cmd+Enter)", () => {
    let saved = false;
    const handleKeyDown = (e: {
      key: string;
      ctrlKey?: boolean;
      metaKey?: boolean;
      preventDefault: () => void;
    }) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        saved = true;
      }
    };

    let prevented = false;
    handleKeyDown({
      key: "Enter",
      ctrlKey: true,
      preventDefault: () => {
        prevented = true;
      },
    });
    expect(saved).toBe(true);
    expect(prevented).toBe(true);

    saved = false;
    prevented = false;
    handleKeyDown({
      key: "Enter",
      metaKey: true,
      preventDefault: () => {
        prevented = true;
      },
    });
    expect(saved).toBe(true);
    expect(prevented).toBe(true);
  });

  it("triggers cancel on Escape key without triggering save", () => {
    let cancelled = false;
    let saved = false;
    const handleKeyDown = (e: {
      key: string;
      ctrlKey?: boolean;
      metaKey?: boolean;
      preventDefault: () => void;
    }) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        saved = true;
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelled = true;
      }
    };

    let prevented = false;
    handleKeyDown({
      key: "Escape",
      preventDefault: () => {
        prevented = true;
      },
    });
    expect(cancelled).toBe(true);
    expect(saved).toBe(false);
    expect(prevented).toBe(true);
  });

  it("does not trigger save or cancel on regular Enter key (allows multiline edits)", () => {
    let cancelled = false;
    let saved = false;
    const handleKeyDown = (e: {
      key: string;
      ctrlKey?: boolean;
      metaKey?: boolean;
      preventDefault: () => void;
    }) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        saved = true;
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelled = true;
      }
    };

    handleKeyDown({
      key: "Enter",
      ctrlKey: false,
      metaKey: false,
      preventDefault: () => {},
    });
    expect(cancelled).toBe(false);
    expect(saved).toBe(false);
  });
});

describe("Preview Pane Fallback Logic (storage_path absent)", () => {
  function computeCanvasMode(
    activeStoragePath: string | null | undefined,
    originalPdfUrl: string | null | undefined,
    templateSlug: string | null | undefined,
  ): boolean {
    return Boolean(activeStoragePath && originalPdfUrl && !templateSlug);
  }

  function resolvePreviewRenderer(
    activeStoragePath: string | null | undefined,
    originalPdfUrl: string | null | undefined,
    templateSlug: string | null | undefined,
  ): "PdfCanvasPreview" | "TemplatePreview" | "A4Page" {
    const isCanvasMode = computeCanvasMode(activeStoragePath, originalPdfUrl, templateSlug);
    if (isCanvasMode) return "PdfCanvasPreview";
    if (templateSlug) return "TemplatePreview";
    return "A4Page";
  }

  it("falls back to A4Page when storage_path is undefined/null and no template is selected", () => {
    expect(computeCanvasMode(undefined, "https://signed.url/doc.pdf", undefined)).toBe(false);
    expect(computeCanvasMode(null, "https://signed.url/doc.pdf", undefined)).toBe(false);
    expect(computeCanvasMode("", "https://signed.url/doc.pdf", undefined)).toBe(false);

    expect(resolvePreviewRenderer(undefined, "https://signed.url/doc.pdf", undefined)).toBe(
      "A4Page",
    );
    expect(resolvePreviewRenderer(null, null, undefined)).toBe("A4Page");
  });

  it("falls back to TemplatePreview when storage_path is missing but templateSlug is present", () => {
    expect(resolvePreviewRenderer(undefined, undefined, "modern")).toBe("TemplatePreview");
    expect(resolvePreviewRenderer(null, "https://signed.url/doc.pdf", "executive")).toBe(
      "TemplatePreview",
    );
  });

  it("uses PdfCanvasPreview only when activeStoragePath AND originalPdfUrl exist without templateSlug", () => {
    expect(
      resolvePreviewRenderer("user-1/versions/v1.pdf", "https://signed.url/doc.pdf", undefined),
    ).toBe("PdfCanvasPreview");
  });

  it("falls back to TemplatePreview even if storage_path is present if user explicitly chose templateSlug", () => {
    expect(
      resolvePreviewRenderer("user-1/versions/v1.pdf", "https://signed.url/doc.pdf", "minimal"),
    ).toBe("TemplatePreview");
  });
});

describe("PDF Geometry Block Keyboard Accessibility & ARIA", () => {
  const namedBlock: GeometryBlock = {
    id: "b1",
    page: 0,
    bbox: [10, 10, 100, 50],
    text: "Lead Software Architect",
    lines: [],
    style: { font_name: "helv", font_size: 12, line_height: 14 },
    section: "experience",
  };

  const unnamedBlock: GeometryBlock = {
    id: "b2",
    page: 0,
    bbox: [10, 60, 100, 80],
    text: "Some arbitrary note",
    lines: [],
    style: { font_name: "helv", font_size: 10, line_height: 12 },
  };

  function getBlockAriaLabel(block: GeometryBlock): string {
    return block.section ? `Select ${block.section} block` : "Select text block";
  }

  function getTextareaAriaLabel(block: GeometryBlock): string {
    return block.section ? `Edit ${block.section}` : "Edit text block";
  }

  it("formats block container ARIA labels correctly for named and unnamed sections", () => {
    expect(getBlockAriaLabel(namedBlock)).toBe("Select experience block");
    expect(getBlockAriaLabel(unnamedBlock)).toBe("Select text block");
  });

  it("formats inline Textarea ARIA labels correctly for named and unnamed sections", () => {
    expect(getTextareaAriaLabel(namedBlock)).toBe("Edit experience");
    expect(getTextareaAriaLabel(unnamedBlock)).toBe("Edit text block");
  });

  it("triggers handleStartEdit on Enter or Space key press on the block container", () => {
    let startedEditBlock: GeometryBlock | null = null;
    const handleStartEdit = (b: GeometryBlock) => {
      startedEditBlock = b;
    };

    const handleKeyDown = (
      e: { key: string; preventDefault: () => void },
      block: GeometryBlock,
    ) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleStartEdit(block);
      }
    };

    let preventedEnter = false;
    handleKeyDown(
      {
        key: "Enter",
        preventDefault: () => {
          preventedEnter = true;
        },
      },
      namedBlock,
    );
    expect(startedEditBlock).toBe(namedBlock);
    expect(preventedEnter).toBe(true);

    startedEditBlock = null;
    let preventedSpace = false;
    handleKeyDown(
      {
        key: " ",
        preventDefault: () => {
          preventedSpace = true;
        },
      },
      unnamedBlock,
    );
    expect(startedEditBlock).toBe(unnamedBlock);
    expect(preventedSpace).toBe(true);

    startedEditBlock = null;
    let preventedOther = false;
    handleKeyDown(
      {
        key: "Tab",
        preventDefault: () => {
          preventedOther = true;
        },
      },
      namedBlock,
    );
    expect(startedEditBlock).toBeNull();
    expect(preventedOther).toBe(false);
  });
});
