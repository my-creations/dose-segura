# Changelog

Todas as mudanças notáveis deste projeto são documentadas neste ficheiro.

O formato é inspirado em [Keep a Changelog](https://keepachangelog.com/pt-PT/1.0.0/).

## 1.1.0

Lançamento centrado em ferramentas de apoio no dia a dia: cálculos, procedimentos e uma PWA mais fiável offline.

### Cálculos

- Calculadora pediátrica guiada e ajuda para regras de três (dose por peso, volume a aspirar, mg/kg) (#9)

### Procedimentos

- Menu modular para criar e editar listas de verificação de enfermagem (#10)
- Catálogo de modelos: adicionar, remover e voltar a adicionar starters (#11)
- Modelos A-list enriquecidos: CVP e SNG, preparação de injectáveis, SC, IM, flush/remoção de CVP, medicação via SNG e IV push (#17)

### PWA

- Cache offline e service worker para arranque mais rápido e uso sem rede (#12)
- Recarregamento automático quando há uma atualização da app (#16)

### Interface

- Ícone `calculator-outline` no separador Cálculos (#15)

### Interno

- Migração de lint/format para oxlint + oxfmt (#8)
- Skill local de verificação do projeto (#13)
- CI Playwright mais resistente a falhas de `apt` (#14)
