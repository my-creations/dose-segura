const fs = require('node:fs');
const path = require('node:path');
const { collectFiles } = require('./fs-utils');

function normalize(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const RCM_RULES = [
  { key: 'indications', patterns: [/^4\.1\s+indicacoes terapeuticas\b/] },
  { key: 'dosageAdministration', patterns: [/^4\.2\s+posologia e modo de administracao\b/] },
  { key: 'contraindications', patterns: [/^4\.3\s+contraindicacoes\b/] },
  { key: 'warningsPrecautions', patterns: [/^4\.4\s+advertencias e precaucoes especiais de utilizacao\b/] },
  { key: 'interactions', patterns: [/^4\.5\s+interacoes medicamentosas\b/] },
  { key: 'pregnancyLactation', patterns: [/^4\.6\s+fertilidade, gravidez e aleitamento\b/] },
  { key: 'driving', patterns: [/^4\.7\s+efeitos sobre a capacidade de conduzir\b/] },
  { key: 'adverseReactions', patterns: [/^4\.8\s+efeitos indesejaveis\b/] },
  { key: 'shelfLife', patterns: [/^6\.3\s+prazo de validade\b/] },
  { key: 'storage', patterns: [/^6\.4\s+precaucoes especiais de conservacao\b/] },
  { key: 'handling', patterns: [/^6\.6\s+precaucoes especiais de eliminacao e manuseamento\b/] },
];

const FI_RULES = [
  { key: 'whatIsIt', patterns: [/^(1\.)?\s*o que e\b/] },
  { key: 'beforeUse', patterns: [/^(2\.)?\s*o que precisa de saber antes de utilizar\b/] },
  { key: 'howToUse', patterns: [/^(3\.)?\s*como utilizar\b/] },
  { key: 'possibleEffects', patterns: [/^(4\.)?\s*efeitos indesejaveis\b/, /^(4\.)?\s*efeitos secundarios\b/] },
  { key: 'storage', patterns: [/^(5\.)?\s*como conservar\b/] },
  { key: 'contents', patterns: [/^(6\.)?\s*conteudo da embalagem\b/] },
];

function findHeading(normalizedLine, normalizedNextLine, rules) {
  const combined = normalizedNextLine ? `${normalizedLine} ${normalizedNextLine}`.trim() : normalizedLine;

  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      if (pattern.test(normalizedLine)) {
        return { key: rule.key, usedNext: false };
      }
      if (pattern.test(combined)) {
        return { key: rule.key, usedNext: true };
      }
    }
  }

  return null;
}

function parseSections(lines, rules) {
  const sections = {};
  let currentKey = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].replace(/\s+$/, '');
    const normalizedLine = normalize(line);
    const nextLine = index + 1 < lines.length ? lines[index + 1] : '';
    const normalizedNext = normalize(nextLine);

    const heading = findHeading(normalizedLine, normalizedNext, rules);
    if (heading) {
      currentKey = heading.key;
      if (!sections[currentKey]) sections[currentKey] = [];
      if (heading.usedNext) index += 1;
      continue;
    }

    if (currentKey) {
      sections[currentKey].push(line);
    }
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(sections)) {
    const trimmed = trimSection(value);
    if (trimmed.length > 0) {
      cleaned[key] = trimmed.join('\n');
    }
  }

  return cleaned;
}

function trimSection(lines) {
  let start = 0;
  let end = lines.length - 1;

  while (start <= end && !lines[start].trim()) start += 1;
  while (end >= start && !lines[end].trim()) end -= 1;

  return lines.slice(start, end + 1);
}

function detectType(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.includes(`${path.sep}rcm${path.sep}`)) return 'rcm';
  if (lower.includes(`${path.sep}fi${path.sep}`)) return 'fi';
  return 'unknown';
}

function resolveInfarmedId(medDir, options) {
  if (options.infarmedId) {
    return options.infarmedId;
  }

  if (options.bestMatch) {
    const metaPath = path.join(medDir, 'meta.json');
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      return meta?.bestMatch?.infarmedId || null;
    }
  }

  return null;
}

function filterByInfarmedId(files, infarmedId) {
  if (!infarmedId) return files;
  const token = `${path.sep}${infarmedId}-`;
  return files.filter((filePath) => filePath.includes(token));
}

function parseMed(medName, options = {}) {
  const medDir = path.resolve('infarmed', medName);

  if (!fs.existsSync(medDir)) {
    throw new Error(`Med folder not found: ${medDir}`);
  }

  const infarmedId = resolveInfarmedId(medDir, options);
  const txtFiles = filterByInfarmedId(collectFiles(medDir, '.txt'), infarmedId);

  if (txtFiles.length === 0) {
    console.log(`No .txt files found in ${medDir}. Run extract first.`);
    return;
  }

  const results = txtFiles.map((filePath) => {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const lines = raw.split(/\r?\n/);
    const type = detectType(filePath);
    const sections = type === 'rcm'
      ? parseSections(lines, RCM_RULES)
      : type === 'fi'
        ? parseSections(lines, FI_RULES)
        : {};

    return {
      file: filePath,
      type,
      sections,
    };
  });

  const output = {
    medId: medName,
    generatedAt: new Date().toISOString(),
    files: results,
  };

  if (options.out) {
    const resolved = path.resolve(options.out);
    fs.writeFileSync(resolved, JSON.stringify(output, null, 2));
    console.log(`Parsed output: ${resolved}`);
  } else {
    const defaultPath = path.join(medDir, 'parsed.json');
    fs.writeFileSync(defaultPath, JSON.stringify(output, null, 2));
    console.log(`Parsed output: ${defaultPath}`);
  }
}

module.exports = {
  parseMed
};
