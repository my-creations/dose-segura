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
# Extrair texto de todos os PDFs de um medicamento
node scripts/extract-infarmed-med.js <medId>

# Parsear secções relevantes para revisão
node scripts/parse-infarmed-text.js <medId>
```

Os PDFs e artefactos são guardados em `infarmed/<medId>/`

## 🚀 Como Executar

### Pré-requisitos da App

- Node.js 18+
- npm ou yarn
- [Expo Go](https://expo.dev/client) (para testar no telemóvel)

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/PedroRobalo1994/dose-segura.git

# Entrar na pasta
cd dose-segura

# Instalar dependências
npm install
```

### Executar em Desenvolvimento

```bash
# Iniciar o servidor de desenvolvimento
npx expo start

# Ou especificamente para cada plataforma:
npx expo start --ios     # iOS Simulator
npx expo start --android # Android Emulator
npx expo start --web     # Browser
```

### Testar no Telemóvel

1. Instala a app [Expo Go](https://expo.dev/client) no teu telemóvel
2. Executa `npx expo start`
3. Lê o código QR com a app Expo Go

## 🧪 Testes

### Unitários e Integração (Jest)

```bash
npm test
```

### End-to-End (Playwright)

```bash
# Executar testes E2E
npm run e2e

# Executar com interface gráfica
npm run e2e:ui
```

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
npx expo export --platform web
```

### Deploy para GitHub Pages

```bash
npm run deploy
```

### Mobile (requer EAS)

```bash
# Instalar EAS CLI
npm install -g eas-cli

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
