import { describe, expect, it } from 'vitest';
import { interpretSearchQuery } from './interpretSearchQuery';
import { isOnerTravelQuery } from './onerTravel';

describe('interpretSearchQuery', () => {
  it('suggests passagens for route with x and dates with direct navigation', () => {
    const result = interpretSearchQuery('Rio de Janeiro x bonito para os dia 02 a03');
    expect(result.primary.intent).toBe('passagens');
    expect(result.requiresConfirmation).toBe(false);
  });

  it('goes direct for explicit passagem keywords with high confidence', () => {
    const result = interpretSearchQuery('passagem CGR BEL ida e volta');
    expect(result.primary.intent).toBe('passagens');
    expect(result.confidence).toBe('high');
    expect(result.requiresConfirmation).toBe(false);
  });

  it('shows balanced options for a single destination word', () => {
    const result = interpretSearchQuery('Salvador');
    expect(result.balancedOptions).toBe(true);
    expect(result.requiresConfirmation).toBe(true);
    expect(result.allOptions).toHaveLength(3);
  });

  it('shows balanced options for Bonito', () => {
    const result = interpretSearchQuery('Bonito');
    expect(result.balancedOptions).toBe(true);
    expect(result.requiresConfirmation).toBe(true);
  });

  it('asks for confirmation on ambiguous non-loose queries', () => {
    const result = interpretSearchQuery('hotel em Bonito');
    expect(result.requiresConfirmation).toBe(true);
    expect(result.balancedOptions).toBe(true);
  });

  it('suggests roteiro when keywords match and query is loose', () => {
    const result = interpretSearchQuery('roteiro personalizado europa');
    expect(result.balancedOptions).toBe(true);
    expect(result.allOptions.some((o) => o.intent === 'roteiro')).toBe(true);
  });
});

describe('isOnerTravelQuery', () => {
  it('detects travel keywords with sufficient confidence', () => {
    expect(isOnerTravelQuery('passagem SP')).toBe(true);
  });

  it('does not auto-classify loose destinations as flight search', () => {
    expect(isOnerTravelQuery('Salvador')).toBe(false);
    expect(isOnerTravelQuery('Bonito')).toBe(false);
  });

  it('detects airport codes', () => {
    expect(isOnerTravelQuery('CGR BEL')).toBe(true);
  });

  it('detects city route patterns', () => {
    expect(isOnerTravelQuery('Campo Grande para Belém')).toBe(true);
  });
});
