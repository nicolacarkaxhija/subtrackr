import { CATALOG } from './data';
import type { CatalogEntry } from './catalog-entry';

const DEFAULT_LIMIT = 8;

/**
 * Rank catalog entries against a query. Scoring, best to worst: exact name/alias,
 * prefix, substring, then fuzzy subsequence. Ties keep catalog (popularity) order
 * because the sort is stable. Case-insensitive; an empty query returns nothing.
 */
export function searchCatalog(query: string, limit: number = DEFAULT_LIMIT): CatalogEntry[] {
  const normalized = query.trim().toLowerCase();
  if (normalized === '') {
    return [];
  }
  const matches: { entry: CatalogEntry; score: number }[] = [];
  for (const entry of CATALOG) {
    const score = scoreEntry(entry, normalized);
    if (score > 0) {
      matches.push({ entry, score });
    }
  }
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit).map((match) => match.entry);
}

function scoreEntry(entry: CatalogEntry, query: string): number {
  const candidates = [
    entry.name.toLowerCase(),
    ...entry.aliases.map((alias) => alias.toLowerCase()),
  ];
  let best = 0;
  for (const candidate of candidates) {
    const score = scoreCandidate(candidate, query);
    if (score > best) {
      best = score;
    }
  }
  return best;
}

function scoreCandidate(candidate: string, query: string): number {
  if (candidate === query) {
    return 100;
  }
  if (candidate.startsWith(query)) {
    return 80;
  }
  if (candidate.includes(query)) {
    return 60;
  }
  if (isSubsequence(query, candidate)) {
    return 40;
  }
  return 0;
}

function isSubsequence(query: string, candidate: string): boolean {
  let index = 0;
  for (const char of candidate) {
    if (char === query[index]) {
      index += 1;
      if (index === query.length) {
        return true;
      }
    }
  }
  return false;
}
