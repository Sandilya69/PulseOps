// ============================================
// PulseOps CRM - Slug Generator
// ============================================

/**
 * Generate a URL-friendly slug from a string
 * "Acme Corp Engineering" → "acme-corp-engineering"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')    // Remove non-word chars (except spaces/hyphens)
    .replace(/[\s_]+/g, '-')     // Replace spaces & underscores with hyphens
    .replace(/-+/g, '-')         // Collapse multiple hyphens
    .replace(/^-|-$/g, '');      // Trim leading/trailing hyphens
}

/**
 * Generate a unique slug by appending a random suffix if needed
 */
export function generateUniqueSlug(text: string): string {
  const base = generateSlug(text);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}
