import { describe, expect, it } from 'vitest';
import { searchCatalog } from './search';

const ids = (query: string, limit?: number): string[] =>
  searchCatalog(query, limit).map((entry) => entry.id);

describe('searchCatalog', () => {
  it('returns nothing for an empty or whitespace query', () => {
    expect(searchCatalog('')).toEqual([]);
    expect(searchCatalog('   ')).toEqual([]);
  });

  it('finds an exact name match first', () => {
    expect(ids('Netflix')[0]).toBe('netflix');
  });

  it('is case-insensitive', () => {
    expect(ids('NETFLIX')[0]).toBe('netflix');
  });

  it('matches a name prefix', () => {
    expect(ids('net')).toContain('netflix');
  });

  it('matches an alias', () => {
    expect(ids('disney plus')[0]).toBe('disney-plus');
  });

  it('matches a substring inside the name', () => {
    expect(ids('tube')).toContain('youtube-premium');
  });

  it('matches a fuzzy subsequence', () => {
    // s-p-t-f-y is a subsequence of "spotify"
    expect(ids('sptfy')).toContain('spotify');
  });

  it('ranks a prefix match above a mere substring match', () => {
    // "prime" is the alias/prefix of Amazon Prime; it is a substring of nothing else here.
    const results = ids('prime');
    expect(results[0]).toBe('amazon-prime');
  });

  it('ranks an exact match above a prefix match', () => {
    // "max" is exact for HBO Max alias, and a prefix of nothing else.
    expect(ids('max')[0]).toBe('hbo-max');
  });

  it('orders by score, not catalog position', () => {
    // "st" is a prefix of Strava (listed last) but only a subsequence of Spotify (near
    // the top). Score must win over position, so Strava ranks first.
    expect(ids('st')[0]).toBe('strava');
  });

  it('ranks a substring match above a subsequence match', () => {
    // For "st": PlayStation contains "st" (substring) while Spotify only has it as a
    // subsequence, so PlayStation must rank ahead of Spotify.
    const results = ids('st');
    expect(results.indexOf('playstation-plus')).toBeGreaterThanOrEqual(0);
    expect(results.indexOf('spotify')).toBeGreaterThanOrEqual(0);
    expect(results.indexOf('playstation-plus')).toBeLessThan(results.indexOf('spotify'));
  });

  it('breaks ties by catalog order (popularity)', () => {
    // Both Spotify and (via subsequence) others may match "s"; the earliest listed wins.
    expect(ids('s')[0]).toBe('spotify');
  });

  it('respects the result limit', () => {
    expect(searchCatalog('e', 3)).toHaveLength(3);
  });

  it('defaults to at most 8 results', () => {
    expect(searchCatalog('e').length).toBeLessThanOrEqual(8);
  });

  it('returns an empty list when nothing matches', () => {
    expect(searchCatalog('zzzzzzzz')).toEqual([]);
  });

  it('trims the query', () => {
    expect(ids('  netflix  ')[0]).toBe('netflix');
  });
});
