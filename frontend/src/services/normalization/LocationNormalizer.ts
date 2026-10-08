import { WorkMode } from "./types";

/**
 * LocationNormalizer - Normalizes location strings for job postings
 *
 * Handles:
 * - Common city name standardization (e.g., Bangalore → Bengaluru)
 * - Work mode detection from location strings
 * - Whitespace trimming and capitalization normalization
 *
 * Does NOT implement:
 * - Validation
 * - Salary normalization
 * - Persistence
 * - Deduplication
 */
export class LocationNormalizer {
  private readonly cityAliases: Record<string, string>;
  private readonly workModeAliases: Record<string, WorkMode>;

  constructor() {
    this.cityAliases = {
      bangalore: "Bengaluru",
      bengaluru: "Bengaluru",
      bombay: "Mumbai",
      mumbai: "Mumbai",
      madras: "Chennai",
      chennai: "Chennai",
      "new delhi": "Delhi",
      delhi: "Delhi",
    };

    this.workModeAliases = {
      remote: "REMOTE",
      "work from home": "REMOTE",
      wfh: "REMOTE",
      hybrid: "HYBRID",
      "on-site": "ONSITE",
      onsite: "ONSITE",
      office: "ONSITE",
    };
  }

  /**
   * Normalize a location string into structured data
   */
  normalize(location: string): {
    raw: string;
    city?: string;
    state?: string;
    country?: string;
    workMode?: "REMOTE" | "HYBRID" | "ONSITE" | "UNKNOWN";
  } {
    const raw = location.trim();
    if (!raw) {
      return { raw: "" };
    }

    const lowered = raw.toLowerCase();

    if (this.workModeAliases[lowered]) {
      return {
        raw,
        workMode: this.workModeAliases[lowered],
      };
    }

    const city = this.resolveCity(raw);

    return {
      raw,
      city,
    };
  }

  private resolveCity(location: string): string | undefined {
    const lowered = location.toLowerCase();

    if (this.cityAliases[lowered]) {
      return this.cityAliases[lowered];
    }

    return this.normalizeCapitalization(location);
  }

  private normalizeCapitalization(value: string): string {
    if (!value) return value;

    const words = value.split(/\s+/);
    const normalizedWords = words.map((word) => {
      if (!word) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });

    return normalizedWords.join(" ");
  }
}

export default LocationNormalizer;
