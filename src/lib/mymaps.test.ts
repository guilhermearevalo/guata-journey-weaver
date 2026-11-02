import { describe, it, expect } from 'vitest';
import { toMyMapsEmbedUrl } from './mymaps';

describe('toMyMapsEmbedUrl', () => {
  it('converts an edit link to embed', () => {
    expect(toMyMapsEmbedUrl('https://www.google.com/maps/d/edit?mid=1AbC-xyz&usp=sharing'))
      .toBe('https://www.google.com/maps/d/embed?mid=1AbC-xyz');
  });
  it('accepts a pasted iframe snippet', () => {
    expect(toMyMapsEmbedUrl('<iframe src="https://www.google.com/maps/d/u/0/embed?mid=Q9_z" width="640"></iframe>'))
      .toBe('https://www.google.com/maps/d/embed?mid=Q9_z');
  });
  it('rejects non My Maps links', () => {
    expect(toMyMapsEmbedUrl('https://evil.com/maps/d/edit?mid=abc')).toBeNull();
    expect(toMyMapsEmbedUrl('https://www.google.com/maps/place/Bonito')).toBeNull();
  });
});
