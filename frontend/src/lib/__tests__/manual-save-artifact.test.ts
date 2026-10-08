import { describe, it, expect, vi, beforeEach } from "vitest";
import { versionsApi } from "@/api/versions";
import { API_ENDPOINTS } from "@/constants/api";

vi.mock("@/utils/request", () => ({
  request: vi.fn(),
}));

import { request } from "@/utils/request";

describe("manual save artifact contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saveContent posts full content to the version endpoint", async () => {
    const mockVersion = {
      id: "ver-derived-1",
      meta: { storage_path: "u1/versions/ver-derived-1.pdf" },
    };
    vi.mocked(request).mockResolvedValue({ data: mockVersion });
    const content = { profile: { summary: "edited" } };

    const res = await versionsApi.saveContent("ver-derived-1", content);

    expect(request).toHaveBeenCalledWith({
      method: "POST",
      path: API_ENDPOINTS.VERSIONS.SAVE_CONTENT("ver-derived-1"),
      body: { content },
    });
    expect(res.version).toEqual(mockVersion);
  });

  it("exposes the new artifact path the Studio selects for the right pane", async () => {
    const mockVersion = {
      id: "ver-derived-2",
      meta: {
        storage_path: "u1/versions/ver-derived-2.pdf",
        docx_storage_path: "u1/versions/ver-derived-2.docx",
        geometry: { pages: [] },
      },
    };
    vi.mocked(request).mockResolvedValue({ data: mockVersion });

    const res = await versionsApi.saveContent("ver-derived-2", { profile: {} });

    // The Studio switches activeStoragePath to this value so the modified
    // PDF appears in the right pane; version switching reuses the same id.
    expect(res.version.meta?.storage_path).toBe("u1/versions/ver-derived-2.pdf");
    expect(res.version.id).toBe("ver-derived-2");
  });

  it("propagates compiler failure truthfully instead of resolving success", async () => {
    vi.mocked(request).mockRejectedValue(new Error("Document artifact regeneration failed"));
    await expect(versionsApi.saveContent("ver-x", { profile: {} })).rejects.toThrow(
      "Document artifact regeneration failed",
    );
  });
});
