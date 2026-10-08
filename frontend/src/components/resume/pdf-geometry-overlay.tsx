import React, { useState, useEffect, useRef } from "react";
import { Check, Edit2, Loader2, X } from "lucide-react";
import type { GeometryBlock } from "@/types/geometry";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface PdfGeometryOverlayProps {
  pageIndex: number;
  blocks: GeometryBlock[];
  zoom: number;
  selectedTargetId?: string | null;
  onSelectElement?: (id: string, section?: string) => void;
  onMutateBlock?: (pageIndex: number, block: GeometryBlock, newText: string) => Promise<void>;
}

export function PdfGeometryOverlay({
  pageIndex,
  blocks,
  zoom,
  selectedTargetId,
  onSelectElement,
  onMutateBlock,
}: PdfGeometryOverlayProps) {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);

  const activeEditingBlock = blocks.find((b) => b.id === editingBlockId);

  const handleStartEdit = (block: GeometryBlock, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingBlockId(block.id);
    setEditText(block.text || "");
  };

  const handleCancel = () => {
    if (isSaving) return;
    setEditingBlockId(null);
    setEditText("");
  };

  const handleSave = async () => {
    if (!activeEditingBlock || isSaving) return;
    setIsSaving(true);
    try {
      if (onMutateBlock) {
        await onMutateBlock(pageIndex, activeEditingBlock, editText);
      }
      setEditingBlockId(null);
      setEditText("");
    } catch (err) {
      console.error("Failed to mutate block:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-visible">
      {blocks.map((block) => {
        const [x0, y0, x1, y1] = block.bbox;
        const left = Math.round(x0 * zoom);
        const top = Math.round(y0 * zoom);
        const width = Math.max(8, Math.round((x1 - x0) * zoom));
        const height = Math.max(8, Math.round((y1 - y0) * zoom));

        const isEditing = editingBlockId === block.id;
        const isSelected =
          Boolean(selectedTargetId) &&
          (selectedTargetId === block.id || selectedTargetId === block.item_id);
        const isHovered = hoveredBlockId === block.id;

        if (isEditing) {
          const charLimit = block.char_limit || Math.max(block.text.length, 60);
          const currLen = editText.length;
          const budgetPct = Math.round((currLen / charLimit) * 100);
          const isOverBudget = currLen > charLimit;

          return (
            <div
              key={block.id}
              className="absolute z-50 flex flex-col bg-background/95 backdrop-blur-md rounded-md shadow-2xl border border-primary/50 p-2.5 gap-2 pointer-events-auto ring-2 ring-primary/20 animate-in fade-in zoom-in-95 duration-100"
              style={{
                left: Math.max(4, left - 4),
                top: Math.max(4, top - 4),
                width: Math.max(width + 12, 300),
                minHeight: Math.max(height + 12, 90),
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-1 border-b border-border/50 text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                <span>Edit {block.section || "Block"}</span>
                <span>
                  {block.style?.font_name || "Text"} • {block.style?.font_size || 10}pt
                </span>
              </div>
              <Textarea
                autoFocus
                aria-label={block.section ? `Edit ${block.section}` : "Edit text block"}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void handleSave();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    handleCancel();
                  }
                }}
                className="text-xs font-sans leading-relaxed min-h-[70px] resize-y p-2 focus-visible:ring-1 focus-visible:ring-primary"
                placeholder="Enter replacement text..."
              />
              <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                <div className="flex items-center gap-1 font-mono">
                  <span
                    className={
                      isOverBudget ? "text-amber-500 font-semibold" : "text-muted-foreground"
                    }
                  >
                    {currLen} / {charLimit} chars ({budgetPct}%)
                  </span>
                  {isOverBudget && (
                    <span
                      className="text-[10px] text-amber-500 font-sans"
                      title="Font will auto-scale dynamically to fit bounding box"
                    >
                      (auto-fits)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-6 px-2.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => void handleSave()}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={block.id}
            tabIndex={0}
            role="button"
            aria-label={block.section ? `Select ${block.section} block` : "Select text block"}
            className={`absolute pointer-events-auto rounded transition-colors duration-100 cursor-pointer ${
              isSelected
                ? "border-2 border-primary bg-primary/10 shadow-sm"
                : isHovered
                  ? "border border-primary/40 bg-primary/5"
                  : "border border-transparent hover:border-primary/40 hover:bg-primary/5"
            }`}
            style={{
              left,
              top,
              width,
              height,
            }}
            onClick={() => {
              onSelectElement?.(block.item_id || block.id, block.section || undefined);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleStartEdit(block);
              }
            }}
            onDoubleClick={(e) => handleStartEdit(block, e)}
            onMouseEnter={() => setHoveredBlockId(block.id)}
            onMouseLeave={() => setHoveredBlockId((cur) => (cur === block.id ? null : cur))}
            title={
              block.section ? `${block.section} (Double-click to edit)` : "Double-click to edit"
            }
          >
            {(isHovered || isSelected) && (
              <button
                type="button"
                className="absolute -top-3 -right-3 z-30 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-transform active:scale-95"
                onClick={(e) => handleStartEdit(block, e)}
                title="Edit in place"
                aria-label="Edit in place"
              >
                <Edit2 className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
