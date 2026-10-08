// i18n string scaffolding for CareerOS frontend.
//
// Centralizes key-based dictionary lookups so strings are never hardcoded
// across components without translation capability.

export type Locale = "en" | "hi";

export const translations = {
  en: {
    // Navigation & Common
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.clear": "Clear",
    "common.search": "Search",
    "common.back": "Back",
    // Campus Mode & Profile
    "campus.career_stage": "Career Stage",
    "campus.student": "College Student",
    "campus.fresher": "Fresher / Graduate",
    "campus.experienced": "Experienced Professional",
    "campus.graduating_year": "Graduating Year",
    "campus.internships_first": "Show Internships & Entry-Level First",
    // Public Profile
    "public_profile.title": "Public Career Portfolio",
    "public_profile.slug_label": "Custom URL Slug",
    "public_profile.publish": "Publish Profile",
    "public_profile.unpublish": "Unpublish Profile",
    "public_profile.noindex_notice": "Your profile is private by default and protected with noindex metadata.",
  },
  hi: {
    // Curated scaffolding only — no unchecked machine translation
    "common.loading": "लोड हो रहा है...",
    "common.save": "सहेजें",
    "common.cancel": "रद्द करें",
    "common.delete": "हटाएं",
    "common.clear": "साफ़ करें",
    "common.search": "खोजें",
    "common.back": "वापस",
    "campus.career_stage": "करियर चरण",
    "campus.student": "कॉलेज छात्र",
    "campus.fresher": "फ्रेशर / स्नातक",
    "campus.experienced": "अनुभवी पेशेवर",
    "campus.graduating_year": "स्नातक वर्ष",
    "campus.internships_first": "इंटर्नशिप और शुरुआती नौकरियां पहले दिखाएं",
    "public_profile.title": "सार्वजनिक करियर पोर्टफोलियो",
    "public_profile.slug_label": "कस्टम URL स्लग",
    "public_profile.publish": "प्रोफ़ाइल प्रकाशित करें",
    "public_profile.unpublish": "अप्रकाशित करें",
    "public_profile.noindex_notice": "आपकी प्रोफ़ाइल डिफ़ॉल्ट रूप से निजी है।",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(key: TranslationKey, locale: Locale = "en"): string {
  const dict = translations[locale] || translations.en;
  return (dict as Record<string, string>)[key] || translations.en[key] || key;
}
