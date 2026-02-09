const fs = require('node:fs');
const path = require('node:path');
const { createBrowserContext, gotoHomepage } = require('./browser-utils');
const { ensureOutputDir } = require('./fs-utils');

function sanitizeName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalize(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const INJECTABLE_TOKENS = [
  'injetavel',
  'injectavel',
  'injecao',
  'perfusao',
  'infusao',
  'intravenosa',
];
const ADMINISTRATION_FILTER_LABELS = [
  'EC - Via intravenosa (perfusão)',
  'EC - Via intravenosa (bólus)',
  'Via intravenosa',
];
const MAX_RESULTS_BEFORE_FILTER = 10;
const PREFERRED_HOLDERS = {
  voriconazol: ['Laboratórios Normon, S.A.'],
};
const PREFERRED_INDEXES = {
  tigeciclina: 2,
};

function isInjectable(form) {
  if (!form) return false;
  const normalized = normalize(form);
  return INJECTABLE_TOKENS.some((token) => normalized.includes(token));
}

async function applyAdministrationFilter(page, label) {
  await page.click('#mainForm\\:vias-admin_label');
  await page.waitForTimeout(300);

  await page.evaluate((filterLabel) => {
    const items = document.querySelectorAll('#mainForm\\:vias-admin_items li');
    const match = Array.from(items).find((item) => item.textContent?.trim() === filterLabel);
    if (match) {
      match.click();
      return;
    }

    const input = document.getElementById('mainForm:vias-admin_input');
    const hiddenInput = document.querySelector('input[id="mainForm:vias-admin_hinput"]');
    if (!input || !hiddenInput) return;

    input.value = filterLabel;
    hiddenInput.value = filterLabel;

    const event = new Event('change', { bubbles: true });
    input.dispatchEvent(event);
  }, label);
}

function buildSearchTerms(medName) {
  const base = medName.replace(/-/g, ' ').trim();
  const tokens = base.split(/\s+/).filter(Boolean);
  const terms = [base];
  const saltTokens = new Set([
    'sodico',
    'sodica',
    'cloridrato',
    'bitartrato',
    'acetato',
    'succinato',
    'hemisuccinato',
    'hemi',
    'lactobionato',
    'mesilato',
    'besilato',
    'fosfato',
    'brometo',
    'sulfato',
    'magnesico',
    'potassico',
    'disodico',
    'decanoato',
    'tartrato',
  ]);

  if (tokens.length > 1) {
    terms.push(tokens[0]);
  }

  if (tokens.length > 2) {
    terms.push(tokens.slice(0, 2).join(' '));
  }

  if (tokens.length > 1) {
    terms.push(tokens.slice().reverse().join(' '));
  }

  if (tokens.length > 1) {
    const withoutSalts = tokens.filter((token) => !saltTokens.has(token));
    if (withoutSalts.length && withoutSalts.length !== tokens.length) {
      terms.push(withoutSalts.join(' '));
      terms.push(withoutSalts[0]);
      if (withoutSalts.length > 1) {
        terms.push(withoutSalts.slice(0, 2).join(' '));
      }
    }
  }

  return Array.from(new Set(terms));
}

async function downloadDocument(page, docId, outputPath) {
  console.log(`Downloading ${docId} to ${outputPath}...`);
  ensureOutputDir(outputPath);

  try {
    let responseInfo = null;
    let data = null;

    try {
      const fetchResult = await page.evaluate(async (downloadId) => {
        const form = document.querySelector('form#mainForm');
        if (!form) throw new Error('Form not found');

        const formData = new FormData(form);
        formData.set(downloadId, downloadId);

        const response = await fetch('pesquisa-avancada.xhtml', {
          method: 'POST',
          body: formData,
        });

        if (response.status === 503) {
          const text = await response.text();
          return {
            responseInfo: {
              status: response.status,
              contentType: response.headers.get('content-type'),
            },
            data: Array.from(new TextEncoder().encode(text)),
            shouldRetry: true,
          };
        }

        const arrayBuffer = await response.arrayBuffer();
        return {
          responseInfo: {
            status: response.status,
            contentType: response.headers.get('content-type'),
          },
          data: Array.from(new Uint8Array(arrayBuffer)),
        };
      }, docId);

      responseInfo = fetchResult?.responseInfo ?? null;
      data = fetchResult?.data ?? null;
    } catch (error) {
      console.error(`Fetch download failed for ${docId}:`, error.message);
    }

    if (responseInfo?.status === 200 && Array.isArray(data)) {
      const buffer = Buffer.from(data);
      const isPdf = buffer.slice(0, 4).toString('latin1') === '%PDF'
        || responseInfo.contentType?.includes('application/pdf');

      if (isPdf) {
        fs.writeFileSync(outputPath, buffer);
        console.log(`Successfully saved to ${outputPath}`);
        return {
          status: responseInfo.status,
          contentType: responseInfo.contentType,
          size: data.length,
        };
      }
    }

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const downloadPromise = page.waitForEvent('download', { timeout: 60000 })
        .then((download) => ({ type: 'download', download }))
        .catch(() => null);
      const responsePromise = page.waitForResponse(
        (resp) => resp.headers()['content-type']?.includes('application/pdf'),
        { timeout: 60000 }
      )
        .then((response) => ({ type: 'response', response }))
        .catch(() => null);

      await page.click(`[id="${docId}"]`);
      const winner = await Promise.race([
        downloadPromise,
        responsePromise,
      ]);

      if (winner?.type === 'download') {
        await winner.download.saveAs(outputPath);
        console.log(`Successfully saved to ${outputPath}`);
        return {
          status: 200,
          contentType: 'application/pdf',
          size: fs.statSync(outputPath).size,
        };
      }

      if (winner?.type === 'response') {
        const fallbackBuffer = await winner.response.body();
        const isFallbackPdf = fallbackBuffer.slice(0, 4).toString('latin1') === '%PDF';
        if (isFallbackPdf) {
          fs.writeFileSync(outputPath, fallbackBuffer);
          console.log(`Successfully saved to ${outputPath}`);
          return {
            status: winner.response.status(),
            contentType: winner.response.headers()['content-type'],
            size: fallbackBuffer.length,
          };
        }
      }

      if (attempt === 0) {
        await page.waitForTimeout(1500);
      }
    }

    throw new Error(`Non-PDF response for ${docId}`);
  } catch (error) {
    console.error(`Failed to download ${docId}:`, error.message);
    return {
      status: 'failed',
      contentType: null,
      size: 0,
    };
  }
}

async function downloadMed(searchTerm) {
  const { browser, page } = await createBrowserContext();
  const medId = sanitizeName(searchTerm);
  const searchTerms = buildSearchTerms(searchTerm);

  console.log(`Searching for ${searchTerm}...`);
  try {
    await gotoHomepage(page);
    await page.click('text=Pesquisa Avançada');
    await page.waitForSelector('#mainForm\\:dci_input', { timeout: 20000 });
    await page.waitForTimeout(1000);
    let results = [];
    let usedSearchTerm = null;

    const querySelector = '#mainForm\\:dci_input';

    for (const term of searchTerms) {
      await page.fill(querySelector, term);
      await page.click('#mainForm\\:btnDoSearch');
      await page.waitForTimeout(1500);

      try {
        await page.waitForSelector('#mainForm\\:dt-medicamentos_data tr', { timeout: 20000 });
      } catch (e) {
        continue;
      }

        results = await page.$$eval('#mainForm\\:dt-medicamentos_data tr', (rows) => {
          return rows
            .map((row) => {
              const cells = Array.from(row.querySelectorAll('td'));
              if (cells.length < 6) return null;

              const cellText = cells.map((cell) => cell.innerText.trim());
              const infarmedId = cellText[0];
              const name = cellText[1];
              const dci = cellText[2];
              const form = cellText[3];
              const dosage = cellText[4];
              const holder = cellText[5];

              const docCell = cells[cells.length - 1];
              const rcmLink = docCell?.querySelector('a[id*="RcmIcon"]');
              const fiLink = docCell?.querySelector('a[id*="FiIcon"]');
              const emaFiLink = docCell?.querySelector('a[id*="EmaFiIcon"]');

              return {
                infarmedId,
                name,
                dci,
                form,
                dosage,
                holder,
                rcmId: rcmLink?.id ?? null,
                fiId: fiLink?.id ?? emaFiLink?.id ?? null,
              };
            })
            .filter(Boolean)
            .filter((row) => row.rcmId || row.fiId);
        });

      if (results.length >= MAX_RESULTS_BEFORE_FILTER) {
        let filtered = [];

        for (const label of ADMINISTRATION_FILTER_LABELS) {
          await applyAdministrationFilter(page, label);
          await page.click('#mainForm\\:btnDoSearch');
          await page.waitForTimeout(1500);

          try {
            await page.waitForSelector('#mainForm\\:dt-medicamentos_data tr', { timeout: 20000 });
          } catch (e) {
            continue;
          }

          filtered = await page.$$eval('#mainForm\\:dt-medicamentos_data tr', (rows) => {
            return rows
              .map((row) => {
                const cells = Array.from(row.querySelectorAll('td'));
                if (cells.length < 6) return null;

                const cellText = cells.map((cell) => cell.innerText.trim());
                const infarmedId = cellText[0];
                const name = cellText[1];
                const dci = cellText[2];
                const form = cellText[3];
                const dosage = cellText[4];
                const holder = cellText[5];

                const docCell = cells[cells.length - 1];
                const rcmLink = docCell?.querySelector('a[id*="RcmIcon"]');
                const fiLink = docCell?.querySelector('a[id*="FiIcon"]');
                const emaFiLink = docCell?.querySelector('a[id*="EmaFiIcon"]');

                return {
                  infarmedId,
                  name,
                  dci,
                  form,
                  dosage,
                  holder,
                  rcmId: rcmLink?.id ?? null,
                  fiId: fiLink?.id ?? emaFiLink?.id ?? null,
                };
              })
              .filter(Boolean)
              .filter((row) => row.rcmId || row.fiId);
          });

          if (filtered.length > 0) {
            results = filtered;
            break;
          }
        }
      }

      if (results.length > 0) {
        usedSearchTerm = term;
        break;
      }
    }

    if (results.length === 0) {
      console.log('No results found.');
      return;
    }

    console.log(`Found ${results.length} medications with documents.`);

    const normalizedSearch = normalize(usedSearchTerm || searchTerm);
    const preferredHolders = PREFERRED_HOLDERS[medId] || [];
    const scored = results.map((result) => {
      const normalizedDci = normalize(result.dci || '');
      const normalizedName = normalize(result.name || '');
      let score = 0;

      if (normalizedDci === normalizedSearch) score += 100;
      else if (normalizedDci.includes(normalizedSearch)) score += 80;

      if (normalizedName.includes(normalizedSearch)) score += 40;

      if (isInjectable(result.form)) score += 30;
      else score -= 10;

      if (preferredHolders.includes(result.holder)) {
        score += 500;
      }

      return { ...result, score };
    });

    const injectableResults = scored.filter((result) => isInjectable(result.form));
    if (injectableResults.length === 0) {
      console.log('No injectable or perfusion results found. Skipping download.');
      return;
    }

    const candidates = injectableResults.sort((a, b) => b.score - a.score);
    const preferredIndex = PREFERRED_INDEXES[medId];
    if (Number.isInteger(preferredIndex) && preferredIndex >= 0 && preferredIndex < candidates.length) {
      const [preferred] = candidates.splice(preferredIndex, 1);
      candidates.unshift(preferred);
    }
    const metaDir = path.resolve('infarmed', medId);
    ensureOutputDir(path.join(metaDir, 'meta.json'));

    let finalMatch = null;
    let finalRcmResult = null;
    let finalFiResult = null;

    for (const candidate of candidates) {
      const baseDir = path.resolve('infarmed', medId);
      const rcmOut = candidate.rcmId
        ? path.join(baseDir, 'rcm', `${candidate.infarmedId}-rcm.pdf`)
        : null;
      const fiOut = candidate.fiId
        ? path.join(baseDir, 'fi', `${candidate.infarmedId}-fi.pdf`)
        : null;

      const rcmResult = candidate.rcmId
        ? await downloadDocument(page, candidate.rcmId, rcmOut)
        : { status: 'missing', contentType: null, size: 0 };
      const fiResult = candidate.fiId
        ? await downloadDocument(page, candidate.fiId, fiOut)
        : { status: 'missing', contentType: null, size: 0 };

      const hasRcm = rcmResult.status === 200 && rcmResult.size > 0;
      const hasFi = fiResult.status === 200 && fiResult.size > 0;

      if (hasRcm || hasFi) {
        finalMatch = candidate;
        finalRcmResult = rcmResult;
        finalFiResult = fiResult;
        break;
      }

      if (!finalMatch) {
        finalMatch = candidate;
        finalRcmResult = rcmResult;
        finalFiResult = fiResult;
      }
    }

    if (!finalMatch) {
      return;
    }

    fs.writeFileSync(path.join(metaDir, 'meta.json'), JSON.stringify({
      medId,
      searchTerm: usedSearchTerm || searchTerm,
      retrievedAt: new Date().toISOString(),
      bestMatch: {
        infarmedId: finalMatch.infarmedId,
        name: finalMatch.name,
        dci: finalMatch.dci,
        form: finalMatch.form,
        dosage: finalMatch.dosage,
        holder: finalMatch.holder,
        isGeneric: /\bMG\b/.test(finalMatch.name),
        score: finalMatch.score,
      },
      documents: {
        rcm: finalMatch.rcmId
          ? {
            status: finalRcmResult.status,
            contentType: finalRcmResult.contentType,
            url: 'https://extranet.infarmed.pt/INFOMED-fo/pesquisa-avancada.xhtml',
            file: `rcm/${finalMatch.infarmedId}-rcm.pdf`,
            size: finalRcmResult.size,
          }
          : { status: 'missing' },
        fi: finalMatch.fiId
          ? {
            status: finalFiResult.status,
            contentType: finalFiResult.contentType,
            url: 'https://extranet.infarmed.pt/INFOMED-fo/pesquisa-avancada.xhtml',
            file: `fi/${finalMatch.infarmedId}-fi.pdf`,
            size: finalFiResult.size,
          }
          : { status: 'missing' },
      },
    }, null, 2));

  } finally {
    await browser.close();
  }
}

module.exports = {
  downloadMed
};
