---
name: meds-formatter
description: Style enforcement and formatting for data/meds.json. Use when modifying or adding medication entries to ensure consistency in punctuation, acronyms, and structure.
---

# meds-formatter

Follow these rules when formatting or validating entries in `data/meds.json`.

## Style Rules

- **No Trailing Periods:** Avoid trailing periods at the end of strings in all list items.
- **Individual Routes:** Administration routes must be separated into individual list items (e.g., separate "Via Intramuscular" and "Via Endovenosa"). Do NOT use "Via X / Via Y".
- **Sentence Case for Emphasis:** Words like "Nunca", "Não", "Sempre", "Obrigatório" should be in sentence case (only first letter capitalized) unless they are acronyms.
- **Prefer Technical Names:** Avoid acronyms when possible; use the full technical name instead.
  - Examples to expand:
    - `Unidade de Cuidados Intensivos` (instead of UCI)
    - `American Society of Anesthesiologists` (instead of ASA)
    - `Milhões de Unidades Internacionais` (instead of MUI)
    - `Unidades Internacionais` (instead of UI) - *Exception: Use UI/MUI when defining a specific quantity like "10 UI", but expand in text descriptions.*
    - `Eletrocardiograma` (instead of ECG)
    - `Sistema Nervoso Central` (instead of SNC)
    - `Auriculoventricular` (instead of AV)
    - `Endovenosa` (instead of IV)
    - `Intramuscular` (instead of IM)
    - `Tempo de Coagulação Ativado` (instead of TCA)
    - `Tempo de Tromboplastina Parcial Ativada` (instead of TTPA)
    - `Tensão Arterial` (instead of TA)
    - `Frequência Cardíaca` (instead of FC)
    - `Saturação de Oxigénio` (instead of SpO2)
    - `Resumo das Características do Medicamento` (instead of RCM)
    - `Folheto Informativo` (instead of FI)
    - `Cloreto de Sódio` (instead of NaCl)
    - `Depuração da Creatinina` (instead of ClCr)
    - `Síndrome de Dificuldade Respiratória` (instead of SDR)
    - `Taquicardia Paroxística Supraventricular` (instead of TPSV)
    - `Rácio Normalizado Internacional` (instead of INR)
    - `Síndrome de Stevens-Johnson` (instead of SSJ)
    - `Necrólise Epidérmica Tóxica` (instead of NET)
    - `Reação a Fármaco com Eosinofilia e Sintomas Sistémicos` (instead of DRESS)
    - `Pustulose Exantemática Generalizada Aguda` (instead of PEGA)
    - `Náuseas e Vómitos Pós-Operatórios` (instead of NVPO)
    - `Trombocitopenia Induzida por Heparina` (instead of HIT)
    - `Inibidor da Monoamino Oxidase` (instead of IMAO)
    - `Água para Preparação de Injetáveis` (instead of água p.p.i. or ppi)
- **Standardized Units:**
  - Prefer `mcg` over `µg` or `microgramas` for safety/readability.
  - Prefer `g` over `gr` or `gramas`.
- **Deduplication:** Before adding information, scan ALL existing fields for the medication. If the information is already present (even if worded differently), do not add it again. Prefer the clearest wording.

## Consistency & Conflicts

- **Conflict Format:** If information from a new source (like Infarmed) conflicts with existing data in `meds.json` regarding dosage, stability, preparation, or storage, prefix the entry with:
  `[CONFLITO]: <Source> indica X (v. meds.json Y)`
- **Standard Terminology:**
  - Use "Água para Preparação de Injetáveis" consistently.
  - Use "Cloreto de sódio 0,9%" instead of "Soro fisiológico" or "NaCl".
  - Use "Glicose a 5%" instead of "Soro glicosado".
  - Use "Lactato de Ringer" consistently.
  - Use "Bólus" (with accent).
  - Prefer "cada X horas" over `qXh`.
- **Age Groups:** Use standardized labels: `Adultos:`, `Crianças:`, `Recém-nascidos:` (or `Neonatos:`).
- **Mathematical Symbols:** ALWAYS expand comparison symbols to text for clarity:
  - `>`  -> "maior que"
  - `<`  -> "menor que"
  - `≥` or `>=` -> "maior ou igual a"
  - `≤` or `<=` -> "menor ou igual a"

## Safety & False Positives

- **IV Expansion:** Be extremely careful when expanding `IV` to `Endovenosa`. Check if `IV` refers to a Roman numeral (e.g., "Estádio IV", "Classe IV", "Nervo Craniano IV", "Risco ASA IV"). In these cases, KEEP `IV`.
- **IM Expansion:** Be careful when expanding `IM` to `Intramuscular`. Ensure it's not part of a word like "IMEDIATAMENTE", "IMERSÃO", "IMUNE". Use word boundaries or manual review.
- **Typos:** If you spot obvious typos in the source text (e.g., "Idage", "IntramuscularAO"), fix them.

## JSON Structure

- Ensure the file remains valid JSON.
- Maintain alphabetical order of medication keys if possible.
- Keep `id` consistent with the key name (kebab-case).
- Ensure no English text remains (translate to PT-PT).
