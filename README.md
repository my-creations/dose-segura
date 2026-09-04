# Dose Segura 💊

Uma aplicação de referência rápida para enfermeiros, desenhada para facilitar o acesso a informações essenciais sobre medicamentos injetáveis.

[**🌐 Ver Demo Online (PWA)**](https://my-creations.github.io/dose-segura/)

![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)

## 📱 Plataformas Suportadas

- ✅ iOS
- ✅ Android
- ✅ Web (PWA)

## ✨ Funcionalidades

- 🔍 **Pesquisa rápida** - Encontre medicamentos por nome ou alias
- ❤️ **Favoritos** - Guarde os medicamentos mais utilizados
- ⚖️ **Cálculos guiados** - Ajuda para regra de três, volume a aspirar e mg/kg (não substitui o cálculo independente)
- 📋 **Informação completa** - Classificação, compatibilidade, preparação, administração e mais
- ⚠️ **Alertas de alto risco** - Identificação clara de medicamentos de alto risco
- 🌐 **Offline-first** - Funciona sem ligação à internet
- 🎨 **Design moderno** - Interface limpa com cores pastel
- 📄 **Fontes oficiais** - Suporte a extração de RCM/FI do Infarmed para enriquecer dados

## 📋 Informações Disponíveis por Medicamento

- Classificação farmacológica
- Compatibilidade com soluções
- Apresentação e armazenamento
- Preparação e reconstituição
- Vias e métodos de administração
- Estabilidade após preparação
- Contraindicações e precauções
- Cuidados de enfermagem

## 🧾 Atualização de Dados (Infarmed)

Este projeto inclui scripts para descarregar e extrair PDFs (RCM/FI) do Infarmed e gerar textos para revisão manual

### Pré-requisitos do Infarmed

- Poppler (`pdftotext`)

```bash
brew install poppler
```

### Fluxo recomendado

```bash
# Descarregar, extrair e parsear RCM/FI (não abrir INFOMED no browser)
bun run infarmed:fetch -- <medId>

# Após revisão clínica, editar apenas a fonte canónica
$EDITOR data/meds.json

# Gerar o índice e o artefacto web lazy
bun run generate:meds

# Validar schema e impedir drift dos artefactos
bun run validate:meds
```

Os PDFs e artefactos de revisão ficam em `infarmed/<medId>/`. `data/meds.json` é a única fonte editável; `data/meds-index.json` e `public/meds-full.json` são gerados deterministicamente e não devem ser editados à mão.

## 🚀 Como Executar

### Pré-requisitos da App

- Node.js 18+
- bun
- [Expo Go](https://expo.dev/client) (para testar no telemóvel)

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/PedroRobalo1994/dose-segura.git

# Entrar na pasta
cd dose-segura

# Instalar dependências
bun install
```

### Executar em Desenvolvimento

```bash
# Iniciar o servidor de desenvolvimento
bunx expo start

# Ou especificamente para cada plataforma:
bunx expo start --ios     # iOS Simulator
bunx expo start --android # Android Emulator
bunx expo start --web     # Browser
```

### Testar no Telemóvel

1. Instala a app [Expo Go](https://expo.dev/client) no teu telemóvel
2. Executa `bunx expo start`
3. Lê o código QR com a app Expo Go

## 🧪 Testes

### Unitários e Integração (Jest)

```bash
bun run test
```

### End-to-End (Playwright)

```bash
# Executar testes E2E
bun run e2e

# Executar com interface gráfica
bun run e2e:ui
```

A suite percorre os 120 Medication Details em Desktop Chrome, compara todas as secções renderizadas com a fonte canónica, confirma a omissão de secções vazias e testa tabs, pesquisa, Favoritos, back navigation, deep links e estados not-found em perfis desktop/mobile. O GitHub Actions executa Playwright num job separado e publica automaticamente o PWA em GitHub Pages após quality e E2E passarem num push para `master`.

## 🏗️ Estrutura do Projeto

```text
dose-segura/
├── app/                    # Ecrãs da aplicação
│   ├── (tabs)/             # Navegação por tabs
│   │   ├── index.tsx       # Lista de medicamentos
│   │   ├── favorites.tsx   # Favoritos
│   │   └── settings.tsx    # Definições
│   ├── medication/
│   │   └── [id].tsx        # Detalhes do medicamento
│   └── _layout.tsx         # Layout principal
├── components/             # Componentes reutilizáveis
├── constants/              # Cores e constantes
├── context/                # React Context (estado global)
├── data/                   # Dados JSON dos medicamentos
├── e2e/                    # Testes End-to-End (Playwright)
├── hooks/                  # Custom hooks
├── infarmed/               # PDFs e extrações (RCM/FI) por medicamento
├── scripts/                # Scripts de extração e parsing
└── types/                  # Tipos TypeScript
```

## 🛠️ Tecnologias Utilizadas

- **[Expo](https://expo.dev/)** - Framework de desenvolvimento
- **[React Native](https://reactnative.dev/)** - UI nativa
- **[Expo Router](https://docs.expo.dev/router/introduction/)** - Navegação file-based
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[AsyncStorage](https://react-native-async-storage.github.io/async-storage/)** - Persistência de dados

## 📦 Build para Produção

### Web

```bash
bunx expo export --platform web
```

### Deploy para GitHub Pages

```bash
bun run deploy
```

### Mobile (requer EAS)

```bash
# Instalar EAS CLI
bun install -g eas-cli

# Login
eas login

# Build iOS
eas build --platform ios

# Build Android
eas build --platform android
```

## ⚠️ Aviso Importante

Esta aplicação é apenas uma ferramenta de apoio e referência. **Verifique sempre** as informações com a farmácia hospitalar e siga os protocolos da sua instituição antes de administrar qualquer medicamento

## 📄 Licença

Este projeto é privado e destinado a uso educacional.

## 👩‍💻 Desenvolvimento

Desenvolvido com ❤️ para a comunidade de enfermagem portuguesa.

---

**Versão:** 1.0.0  
**Última atualização:** Fevereiro 2026
