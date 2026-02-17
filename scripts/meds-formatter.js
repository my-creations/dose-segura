#!/usr/bin/env node
/**
 * Meds Formatter Script
 * Formats medication data according to SKILL.md rules
 * Usage: node scripts/meds-formatter.js [check|fix]
 */

const fs = require('fs');
const path = require('path');

const MEDS_PATH = path.join(__dirname, '..', 'data', 'meds.json');

// Formatting rules from SKILL.md
const FORMATTING_RULES = {
  // Acronyms to expand
  acronyms: {
    'AINEs': 'Anti-inflamatórios não esteroides',
    'UCI': 'Unidade de Cuidados Intensivos',
    'SU': 'Serviço de Urgência',
    'ECG': 'Eletrocardiograma',
    'TA': 'Tensão Arterial',
    'SNC': 'Sistema Nervoso Central',
    'AV': 'Auriculoventricular',
    // Note: IV, IM, SC are handled separately to avoid replacing in English words
    // 'IV': 'Endovenosa',
    // 'IM': 'Intramuscular', 
    // 'SC': 'Subcutânea',
    'TCA': 'Tempo de Coagulação Ativado',
    'TTPA': 'Tempo de Tromboplastina Parcial Ativada',
    'SpO2': 'Saturação de Oxigénio',
    'ClCr': 'Depuração da Creatinina',
    'SDR': 'Síndrome de Dificuldade Respiratória',
    'TPSV': 'Taquicardia Paroxística Supraventricular',
    'INR': 'Rácio Normalizado Internacional',
    'SSJ': 'Síndrome de Stevens-Johnson',
    'NET': 'Necrólise Epidérmica Tóxica',
    'DRESS': 'Reação a Fármaco com Eosinofilia e Sintomas Sistémicos',
    'RCM': 'Resumo das Características do Medicamento',
    'FI': 'Folheto Informativo',
    'CPK': 'Creatina-fosfoquinase',
    'HIT': 'Trombocitopenia Induzida por Heparina',
    'IMAO': 'Inibidor da Monoamino Oxidase',
    'NVPO': 'Náuseas e Vómitos Pós-Operatórios',
    'PEGA': 'Pustulose Exantemática Generalizada Aguda',
    'PVC': 'Policloreto de vinilo',
    'CID': 'Coagulação Intravascular Disseminada',
  },
  
  // Terminology standardization
  terminology: {
    'soro fisiológico': 'Cloreto de sódio 0,9%',
    'Soro fisiológico': 'Cloreto de sódio 0,9%',
    'águia p\\.p\\.i\\.': 'Água para Preparação de Injetáveis',
    'água ppi': 'Água para Preparação de Injetáveis',
    'água p\\.p\\.i': 'Água para Preparação de Injetáveis',
    'NaCl 0,9%': 'Cloreto de sódio 0,9%',
    'soro glicosado': 'Glicose a 5%',
    'Soro glicosado': 'Glicose a 5%',
    'Glicose 5%': 'Glicose a 5%',
    'bólus': 'Bólus',
    'q12h': 'cada 12 horas',
    'q8h': 'cada 8 horas',
    'q6h': 'cada 6 horas',
    'q24h': 'cada 24 horas',
    'q4h': 'cada 4 horas',
    'µg': 'mcg',
    'M\\.U\\.I\\.': 'Milhões de Unidades Internacionais',
  },
  
  // Mathematical symbols
  symbols: {
    '>=': 'maior ou igual a',
    '<=': 'menor ou igual a',
    '≥': 'maior ou igual a',
    '≤': 'menor ou igual a',
    '>': 'maior que',
    '<': 'menor que',
  }
};

// Content that should be added back (missing from HEAD)
const MISSING_CONTENT = {
  'dexametasona': {
    administration: [
      'Dose Covid-19: 6 mg Endovenosa uma vez por dia (até 10 dias)'
    ]
  },
  'haloperidol': {
    administration: [
      'Agitação psicomotora aguda: 5 mg Intramuscular; pode ser repetido a cada hora (máx 20 mg/dia)'
    ]
  },
  'alfentanil': {
    administration: [
      'Adultos (Procedimentos Curtos menor que 10 min): 7-15 mcg/kg Bólus'
    ]
  }
};

function formatText(text) {
  let formatted = text;
  
  // Expand acronyms (whole words only, case-sensitive for some)
  for (const [acronym, expansion] of Object.entries(FORMATTING_RULES.acronyms)) {
    // Handle word boundaries carefully - use word boundaries for most
    // but be careful with short acronyms that might appear inside words
    if (acronym.length <= 3) {
      // For short acronyms, use stricter matching
      const regex = new RegExp(`(?<![a-zA-Zà-úÀ-Ú])${acronym}(?![a-zA-Zà-úÀ-Ú])`, 'g');
      formatted = formatted.replace(regex, expansion);
    } else {
      const regex = new RegExp(`\\b${acronym}\\b`, 'g');
      formatted = formatted.replace(regex, expansion);
    }
  }
  
  // Standardize terminology (with word boundaries for short terms)
  for (const [oldTerm, newTerm] of Object.entries(FORMATTING_RULES.terminology)) {
    let regex;
    if (oldTerm.length <= 4 && !oldTerm.includes(' ')) {
      // Short terms need word boundaries
      regex = new RegExp(`\\b${oldTerm}\\b`, 'gi');
    } else {
      regex = new RegExp(oldTerm, 'gi');
    }
    formatted = formatted.replace(regex, newTerm);
  }
  
  // Replace mathematical symbols
  for (const [symbol, word] of Object.entries(FORMATTING_RULES.symbols)) {
    // Escape special regex characters
    const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    formatted = formatted.replace(regex, word);
  }

  // Note: IV, IM, SC replacement is skipped due to ambiguity
  // (e.g., IV can be Roman numeral 4, part of English words)
  // These should be handled manually

  return formatted;
}

function formatMedication(med) {
  const formatted = { ...med };
  
  // Format all string array fields
  const arrayFields = [
    'compatibility',
    'presentationAndStorage',
    'preparation',
    'administration',
    'stability',
    'contraindicationsAndPrecautions',
    'nursingCare'
  ];
  
  for (const field of arrayFields) {
    if (formatted[field] && Array.isArray(formatted[field])) {
      formatted[field] = formatted[field].map(item => formatText(item));
    }
  }
  
  return formatted;
}

function addMissingContent(meds) {
  for (const [medId, content] of Object.entries(MISSING_CONTENT)) {
    if (meds[medId]) {
      for (const [field, items] of Object.entries(content)) {
        if (!meds[medId][field]) {
          meds[medId][field] = [];
        }
        
        // Check if content already exists (avoid duplication)
        for (const item of items) {
          const exists = meds[medId][field].some(
            existing => existing.toLowerCase().includes(item.toLowerCase().split(':')[0])
          );
          
          if (!exists) {
            console.log(`  Adding missing content to ${medId}.${field}: ${item.substring(0, 50)}...`);
            meds[medId][field].push(item);
          }
        }
      }
    }
  }
  return meds;
}

function main() {
  const command = process.argv[2] || 'check';
  
  console.log('Reading meds.json...');
  const data = JSON.parse(fs.readFileSync(MEDS_PATH, 'utf8'));
  
  if (command === 'check') {
    console.log('\nChecking formatting issues...\n');
    let issuesFound = 0;
    
    for (const [medId, med] of Object.entries(data.medications)) {
      const formatted = formatMedication(med);
      
      // Compare and report differences
      const arrayFields = ['administration', 'nursingCare', 'contraindicationsAndPrecautions', 'preparation'];
      
      for (const field of arrayFields) {
        if (med[field] && formatted[field]) {
          for (let i = 0; i < med[field].length; i++) {
            if (med[field][i] !== formatted[field][i]) {
              console.log(`\n${medId}.${field}[${i}]:`);
              console.log(`  Current: ${med[field][i]}`);
              console.log(`  Formatted: ${formatted[field][i]}`);
              issuesFound++;
            }
          }
        }
      }
    }
    
    if (issuesFound === 0) {
      console.log('✓ No formatting issues found!');
    } else {
      console.log(`\n\nFound ${issuesFound} formatting issues.`);
      console.log('Run with "fix" argument to apply changes.');
    }
    
    // Check for missing content
    console.log('\n\nChecking for missing content...');
    for (const [medId, content] of Object.entries(MISSING_CONTENT)) {
      if (data.medications[medId]) {
        for (const [field, items] of Object.entries(content)) {
          for (const item of items) {
            const exists = data.medications[medId][field]?.some(
              existing => existing.toLowerCase().includes(item.toLowerCase().split(':')[0])
            );
            if (!exists) {
              console.log(`  Missing: ${medId}.${field}: ${item}`);
            }
          }
        }
      }
    }
    
  } else if (command === 'fix') {
    console.log('\nApplying formatting fixes...\n');
    
    // Format all medications
    for (const [medId, med] of Object.entries(data.medications)) {
      data.medications[medId] = formatMedication(med);
    }
    
    // Add missing content
    console.log('\nAdding missing content...');
    data.medications = addMissingContent(data.medications);
    
    // Update version and timestamp
    data.lastUpdated = new Date().toISOString().split('T')[0];
    
    // Write back
    fs.writeFileSync(MEDS_PATH, JSON.stringify(data, null, 2));
    console.log('\n✓ Formatted and saved meds.json');
    console.log(`  Updated: ${data.lastUpdated}`);
  } else {
    console.log('Usage: node scripts/meds-formatter.js [check|fix]');
    process.exit(1);
  }
}

main();
