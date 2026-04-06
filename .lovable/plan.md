

# Plano: Ajustes no Hero Section + Certificado Cadastur + Logo na Sobre

## 3 mudanças solicitadas

### 1. Certificado Cadastur maior (`src/pages/Sobre.tsx`)
- Linha 150: `max-w-4xl` → `max-w-5xl` no container
- Linha 162: `max-w-sm` → `max-w-lg` na imagem do certificado (voltar ao tamanho grande)

### 2. Logo da agência abaixo do subtítulo do hero da Sobre (`src/pages/Sobre.tsx`)
- Mover a exibição da `agencyLogo` para dentro do hero section (linhas 89-97), logo abaixo do subtítulo
- Remover a logo de dentro da seção do Cadastur (linhas 152-158)

### 3. Hero da Home: remover social proof + ajustar cores (`src/components/home/HeroSection.tsx`)
- **Remover** o badge "X pessoas visualizando agora" (linhas 126-131)
- **Remover** o bloco de avatares "+500 viajantes confiam na Guatá" (linhas 218-235)
- **Remover** imports não utilizados: `Eye`, `Avatar`, `AvatarFallback`, `Badge`, e o state `viewerCount`
- **Ajustar paleta de cores do título**: trocar `text-guata-teal-light` por `text-guata-brown-light` ou `text-amber-300` para um contraste mais quente e harmonioso contra o fundo escuro — a cor teal atual compete com o overlay esverdeado. Alternativa: usar branco puro com shadow mais forte para "aventura" e destacar "Guatá" com a cor primária do site.

## Arquivos a editar

| Arquivo | Mudanças |
|---------|----------|
| `src/components/home/HeroSection.tsx` | Remover social proof, ajustar cores do título |
| `src/pages/Sobre.tsx` | Certificado maior, logo no hero da página |

