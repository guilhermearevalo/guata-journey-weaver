import { describe, expect, it } from 'vitest';
import { fixUtf8Mojibake, normalizeCmsText } from './normalizeCmsText';

describe('fixUtf8Mojibake', () => {
  it('repairs UTF-8 misread as Latin-1', () => {
    expect(fixUtf8Mojibake('Tire suas dÃºvidas sobre nossos serviÃ§os')).toBe(
      'Tire suas dúvidas sobre nossos serviços',
    );
    expect(fixUtf8Mojibake('AceitaÃ§Ã£o dos Termos')).toBe('Aceitação dos Termos');
    expect(fixUtf8Mojibake('Qual a diferenÃ§a entre pacotes e excursÃµes?')).toBe(
      'Qual a diferença entre pacotes e excursões?',
    );
  });

  it('leaves correct UTF-8 unchanged', () => {
    expect(fixUtf8Mojibake('Perguntas Frequentes')).toBe('Perguntas Frequentes');
    expect(fixUtf8Mojibake('Bonito e Pantanal')).toBe('Bonito e Pantanal');
  });
});

describe('normalizeCmsText', () => {
  it('repairs mojibake in normalized output', () => {
    expect(normalizeCmsText('Tire suas dÃºvidas sobre nossos serviÃ§os')).toBe(
      'Tire suas dúvidas sobre nossos serviços',
    );
  });
});
