/**
 * Document Geometry types for CareerOS Resume Studio.
 * Matches backend PyMuPDF spatial extraction models.
 */

export interface GeometrySpan {
  text: string;
  bbox: [number, number, number, number];
  font: string;
  size: number;
  flags?: number;
  bold?: boolean;
  italic?: boolean;
  color?: number;
  origin?: [number, number] | null;
}

export interface GeometryLine {
  id: string;
  bbox: [number, number, number, number];
  baseline_y?: number | null;
  spans: GeometrySpan[];
}

export interface GeometryStyle {
  font_name: string;
  font_size: number;
  line_height: number;
  color?: number;
  bold?: boolean;
  italic?: boolean;
}

export interface GeometryBlock {
  id: string;
  page: number;
  column_id?: string | null;
  section?: string | null;
  item_id?: string | null;
  bbox: [number, number, number, number];
  text: string;
  lines: GeometryLine[];
  style: GeometryStyle;
  char_limit?: number;
}

export interface GeometryColumn {
  id: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  width: number;
}

export interface GeometryPage {
  page_index: number;
  width: number;
  height: number;
  rotation?: number;
  is_multi_column?: boolean;
  columns?: GeometryColumn[];
  blocks: GeometryBlock[];
}

export interface DocumentGeometryMap {
  document_id?: string | null;
  page_count: number;
  pages: GeometryPage[];
  sections_detected?: string[];
  extractor_version?: string;
}
