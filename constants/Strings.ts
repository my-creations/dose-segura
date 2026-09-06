export const Strings = {
  pt: {
    common: {
      loading: 'A carregar...',
      version: 'Versão {{version}} • Atualizado em {{date}}',
      disclaimer: 'Para referência apenas. Verificar sempre com a farmácia',
      back: 'Voltar',
      highRisk: 'Alto Risco',
      medicationNotFound: 'Medicamento não encontrado',
      medicationLoadError: 'Não foi possível carregar os detalhes do medicamento',
    },
    navigation: {
      medications: 'Medicamentos',
      favorites: 'Favoritos',
      calculations: 'Cálculos',
      settings: 'Definições',
      medication: 'Medicamento',
    },
    notFound: {
      title: 'Ups!',
      message: 'Este ecrã não existe.',
      goHome: 'Ir para o ecrã inicial',
    },
    accessibility: {
      favoriteMedication: 'Favoritar medicamento',
      favoriteMedicationHint: 'Alterna este medicamento como favorito',
      openMedication: 'Abrir medicamento {{name}}',
    },
    home: {
      searchPlaceholder: 'Pesquisar medicamento...',
      noResults: 'Nenhum medicamento encontrado',
      noData: 'Nenhum medicamento disponível',
    },
    favorites: {
      emptyTitle: 'Sem favoritos',
      emptyMessage: 'Toque no coração ao lado de um medicamento para o adicionar aos favoritos',
    },
    calculations: {
      intro: 'Ajuda para a regra de três — não é uma calculadora de prescrição',
      next: 'Seguinte',
      optional: 'opcional',
      modes: {
        doseByWeight: 'Dose por peso',
        volume: 'Volume a aspirar',
        mgPerKg: 'mg/kg',
      },
      units: {
        mg: 'mg',
        kg: 'kg',
        mL: 'mL',
        mgPerKg: 'mg/kg',
        mgPerMl: 'mg/mL',
      },
      doseByWeight: {
        doseRefQuestion: 'Qual é a dose de referência?',
        doseRefHint: 'Dose conhecida, em mg (ex.: 100 mg para 70 kg)',
        weightRefQuestion: 'Qual é o peso de referência?',
        weightRefHint: 'Peso para o qual a dose de referência foi calculada, em kg',
        patientWeightQuestion: 'Qual é o peso do doente?',
        patientWeightHint: 'Peso atual do doente, em kg',
        resultLabel: 'Dose do doente',
      },
      volume: {
        prescribedDoseQuestion: 'Qual é a dose prescrita?',
        prescribedDoseHint: 'Dose a administrar, em mg',
        concentrationQuestion: 'Qual é a concentração?',
        concentrationHint: 'Concentração da preparação, em mg/mL',
        resultLabel: 'Volume a aspirar',
      },
      mgPerKg: {
        dosePerKgQuestion: 'Qual é a dose por quilograma?',
        dosePerKgHint: 'Dose em mg por kg de peso',
        patientWeightQuestion: 'Qual é o peso do doente?',
        patientWeightHint: 'Peso atual do doente, em kg',
        concentrationQuestion: 'Qual é a concentração?',
        concentrationHint: 'Se preencher, calculamos também o volume a aspirar, em mg/mL',
        resultLabel: 'Dose',
        volumeLabel: 'Volume a aspirar',
      },
      errors: {
        invalid: 'Introduza um número válido',
        zeroOrNegative: 'Os valores têm de ser maiores do que zero',
      },
      disclaimer:
        'Confirmar sempre com o protocolo/RCM. Esta ajuda não substitui o cálculo independente. Erros de unidade são da responsabilidade de quem administra.',
    },
    settings: {
      appearance: 'Aparência',
      databaseInfo: 'Informações da Base de Dados',
      about: 'Sobre',
      application: 'Aplicação',
      themes: {
        system: 'Sistema',
        light: 'Claro',
        dark: 'Escuro',
      },
      labels: {
        version: 'Versão',
        lastUpdated: 'Última atualização',
        totalMedications: 'Total de medicamentos',
        appVersion: 'Versão da app',
        mode: 'Modo',
        offlineMode: '100% Offline',
      },
      install: {
        sectionTitle: 'Instalação',
        button: 'Instalar Aplicação',
        iosTitle: 'Instalar no iPhone/iPad',
        iosInstructions:
          'Para instalar o Dose Segura no seu iPhone ou iPad:\n\n1. Toque no botão Partilhar\n2. Escolha "Adicionar ao Ecrã Principal"\n3. Toque em "Adicionar"',
        steps: {
          share: 'Toque no botão Partilhar',
          add: 'Escolha "Adicionar ao Ecrã Principal"',
          confirm: 'Toque em "Adicionar"',
        },
        alreadyInstalled: 'A aplicação já está instalada',
        success: 'Abertura do prompt de instalação com sucesso',
        error: 'Não foi possível iniciar a instalação',
        dismiss: 'Entendi',
      },
      aboutText:
        'Dose Segura é uma aplicação de referência para auxiliar profissionais de saúde na administração de medicamentos',
      warningText:
        'Esta aplicação é apenas para referência. Verifique sempre a informação com fontes oficiais e a farmácia antes de administrar qualquer medicamento',
    },
    medication: {
      disclaimer:
        '⚠️ Esta informação é apenas para referência. Verifique sempre com a farmácia antes de administrar',
      sections: {
        classification: 'Classificação',
        compatibility: 'Compatibilidade',
        presentationAndStorage: 'Apresentação e Armazenamento',
        preparation: 'Preparação',
        administration: 'Administração',
        stability: 'Estabilidade',
        contraindicationsAndPrecautions: 'Contraindicações e Precauções',
        nursingCare: 'Cuidados de Enfermagem',
      },
    },
  },
};
