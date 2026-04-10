/**
 * Parser for Claude Code task reports.
 * Extracts structured task data from free-text reports.
 */

export interface ParsedTask {
  title: string;
  description?: string;
  subtasks: string[];
  files_changed: string[];
  detected_category?: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Pharmacology Data': ['drug', 'Ki', 'receptor', 'metabolite', 'PDSP', 'binding', 'pharmacol', 'affinity', 'ki_nM', 'agonist', 'antagonist'],
  'UX/UI Design': ['popup', 'modal', 'panel', 'button', 'layout', 'transition', 'glassmorphism', 'gradient', 'z-index', 'sidebar', 'CSS', 'styled', 'responsive', 'animation'],
  'Core Architecture': ['formula', 'indicator', 'balance', 'cascade', 'occupancy', 'tanh', 'regional', 'density', 'Hill equation', 'weight'],
  'AI Chat & Safety': ['chat', 'prompt', 'verification', 'crisis', 'jailbreak', 'mode B', 'AI', 'Claude', 'LLM'],
  'Security & Privacy': ['encryption', 'AES', 'crypto', 'PBKDF2', 'recovery', 'E2E', 'auth', 'RLS', 'session', 'password'],
  'Profile & Data Input': ['profile', 'genetic', 'lab', 'symptom', 'PHQ', 'GAD', 'PCL', 'treatment', 'upload', 'form', 'CYP', 'MTHFR'],
  'Infrastructure': ['migration', 'Supabase', 'Vercel', 'build', 'deploy', 'docker', 'CI', 'database', 'schema', 'table'],
  'Bugs & Hotfixes': ['fix', 'bug', 'hotfix', 'regression', 'broken', 'error', 'crash', 'patch'],
  'Knowledge Graph': ['RxNorm', 'IUPHAR', 'ontology', 'GraphRAG', 'NER', 'knowledge', 'graph', 'PubMed'],
  'Research & Validation': ['research', 'validation', 'verify', 'PMID', 'source', 'citation', 'evidence'],
  'Compliance & Regulatory': ['compliance', 'regulatory', 'HIPAA', 'GDPR', 'legal', 'disclaimer'],
  'Business & Billing': ['billing', 'subscription', 'payment', 'stripe', 'pricing', 'plan'],
};

/**
 * Score each category by keyword matches in the given text.
 * Returns the category name with the highest score, or null if none match.
 */
export function detectCategory(text: string): string | null {
  const lower = text.toLowerCase();
  let bestCategory: string | null = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestScore >= 1 ? bestCategory : null;
}

/**
 * Parse a Claude Code report into structured tasks.
 *
 * Recognizes patterns like:
 *   "Task N complete." / "Task N:" / "**Task N**"
 *   "Phase NX complete." / "Subphase NX"
 *   Bullet lists (- or * prefix)
 *   File paths (src/..., supabase/...)
 *   "Created:" / "Modified:" / "Files changed:" sections
 */
export function parseClaudeCodeReport(text: string): ParsedTask[] {
  const tasks: ParsedTask[] = [];

  // Split by task/phase headers
  const headerPattern = /(?:^|\n)(?:\*{0,2})(?:Task\s+\d+[A-Z]?|Phase\s+\d+[A-Z]?|Subphase\s+\d+[A-Z]?)[\s:—\-]*(?:\*{0,2})\s*(.+?)(?:\n|$)/gi;

  const headers: { index: number; title: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = headerPattern.exec(text)) !== null) {
    const rawTitle = match[1]
      .replace(/\*{1,2}/g, '')
      .replace(/complete\.?\s*$/i, '')
      .replace(/[:—\-]\s*$/, '')
      .trim();

    if (rawTitle.length > 0) {
      headers.push({ index: match.index, title: rawTitle });
    }
  }

  // If no task headers found, treat entire text as one task
  if (headers.length === 0) {
    const firstLine = text.split('\n').find(l => l.trim().length > 0)?.trim() || 'Imported task';
    const title = firstLine
      .replace(/^\*{1,2}/, '').replace(/\*{1,2}$/, '')
      .replace(/^#+\s*/, '')
      .slice(0, 200);

    tasks.push({
      title,
      description: text.slice(0, 500),
      subtasks: extractBullets(text),
      files_changed: extractFiles(text),
      detected_category: detectCategory(text) ?? undefined,
    });
    return tasks;
  }

  // Parse each header section
  for (let i = 0; i < headers.length; i++) {
    const start = headers[i].index;
    const end = i + 1 < headers.length ? headers[i + 1].index : text.length;
    const section = text.slice(start, end);

    tasks.push({
      title: headers[i].title.slice(0, 200),
      description: section.slice(0, 500),
      subtasks: extractBullets(section),
      files_changed: extractFiles(section),
      detected_category: detectCategory(section) ?? undefined,
    });
  }

  return tasks;
}

/** Extract bullet list items from text */
function extractBullets(text: string): string[] {
  const bullets: string[] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const m = line.match(/^\s*[-*]\s+(.+)/);
    if (m) {
      const item = m[1].replace(/\*{1,2}/g, '').trim();
      if (item.length > 0 && item.length < 300) {
        bullets.push(item);
      }
    }
  }
  return bullets;
}

/** Extract file paths from text */
function extractFiles(text: string): string[] {
  const files = new Set<string>();
  // Match patterns like src/..., supabase/..., or backtick-wrapped paths
  const filePattern = /(?:`([^`]+\.[a-z]{1,4})`|(?:^|\s)((?:src|supabase|public)\/[^\s,;)]+\.[a-z]{1,4}))/gi;
  let m: RegExpExecArray | null;
  while ((m = filePattern.exec(text)) !== null) {
    const path = (m[1] || m[2]).trim();
    if (path.length < 200) {
      files.add(path);
    }
  }
  return [...files];
}

/**
 * Generate a simple hash from a title for deduplication.
 */
export function titleHash(title: string): string {
  const normalized = title.toLowerCase().replace(/[^a-z0-9]/g, '');
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
