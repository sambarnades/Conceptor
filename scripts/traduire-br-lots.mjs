#!/usr/bin/env node

/**
 * Traduction ponctuelle de la locale bretonne par lots via le proxy LLM de Caramel.
 *
 * Le script masque les marqueurs techniques avant envoi, valide chaque réponse,
 * conserve un point de reprise dans /tmp et n'écrit br.json qu'une fois tous les
 * lots terminés. Il est destiné à la traduction initiale de br.json, pas à la CI.
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const RACINE = resolve(import.meta.dirname, '..');
const SOURCE = resolve(RACINE, 'js/locales/fr.json');
const CIBLE = resolve(RACINE, 'js/locales/br.json');
const PROGRES = '/tmp/caramel-traduction-br-progress.json';
const URL_SOUMISSION = 'https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel/llm/submit-prod';
const URL_RESULTAT = 'https://n8n-caramel.osc-fr1.scalingo.io/webhook/caramel/llm/result-prod';
const MODELE = process.env.CARAMEL_BR_MODEL || 'mistral-small-4-119b';
const LIMITE_CARACTERES = 8500;
const ATTENTE_POLL_MS = 3000;
const DELAI_MAX_MS = 5 * 60 * 1000;
const MODE_ESSAI = process.argv.includes('--essai');

const fr = JSON.parse(readFileSync(SOURCE, 'utf8'));
const brInitial = JSON.parse(readFileSync(CIBLE, 'utf8'));
const empreinteSource = createHash('sha256').update(JSON.stringify(fr)).digest('hex');

const TERMES_TECHNIQUES = [
  'Caramelia', 'Caramel', 'Magistère', 'Moodle', 'Éléa', 'Sucrerie', 'H5P',
  'MathJax', 'JSZip', 'DOMPurify', 'FindTheWords', 'DragTheWords',
  'FillInTheBlanks', 'MarkTheWords', 'taskDescription', 'Markdown', 'LaTeX',
  'JSON', 'HTML', 'DOCX', 'ODT', 'PDF', 'PPTX', 'XLSX', 'JPEG', 'PNG',
  'WebP', 'AVIF', 'SVG', 'MP3', 'M4A', 'WAV', 'MP4', 'MOV', 'OCR',
  'ILaaS', 'Eduscol', 'DINUM', 'Albert', 'Tchap', 'GIFT', 'XML'
];

const CLE_DEJA_TRADUITE = new Set(['h5p_iv_endcard_table_row_answered']);
const VALEURS_TECHNIQUES_SEULES = new Set([
  '', 'H5P', 'Moodle', 'Éléa', 'Magistère', 'Caramel', 'Caramelia',
  'JSON', 'HTML', 'PDF', 'DOCX', 'ODT', 'XML', 'GIFT', 'Markdown', 'LaTeX'
]);

function doitEtreTraduite(cle, valeur) {
  if (CLE_DEJA_TRADUITE.has(cle) || VALEURS_TECHNIQUES_SEULES.has(valeur)) return false;
  if (/^https?:\/\/\S+$/.test(valeur)) return false;
  return /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(valeur);
}

function masquer(valeur) {
  const protections = [];
  const proteger = texte => {
    const jeton = `ZXQPH${String(protections.length).padStart(4, '0')}QXZ`;
    protections.push([jeton, texte]);
    return jeton;
  };
  let texte = valeur;

  const motifs = [
    /<[^>]+>/g,
    /https?:\/\/[^\s"'<>]+/g,
    /```(?:json)?|```/gi,
    /`[^`\n]+`/g,
    /"[A-Za-z_][A-Za-z0-9_-]*"\s*:/g,
    /\{\{[^{}]+\}\}/g,
    /\{[A-Za-z_][A-Za-z0-9_]*\}/g,
    /\[[A-Z][A-Z0-9_]*\]/g,
    /@[A-Za-z][A-Za-z0-9_]*/g,
    /:(?:num|total|score)\b/g,
    /\|\|/g,
    /\\\\[()[\]]/g,
    /\\\\[A-Za-z]+(?:\{[^{}]*\})*/g,
    /H5P\.[A-Za-z0-9]+(?:\s+\d+(?:\.\d+)*)?/g,
    /\b(?:[A-Za-z][A-Za-z0-9_-]*\.)+(?:js|mjs|json|md|html|css|xml)\b/g,
    /\b(?:[A-Za-z]:)?[A-Za-z0-9_.-]+\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\b/g
  ];
  for (const motif of motifs) texte = texte.replace(motif, proteger);

  const termes = [...TERMES_TECHNIQUES].sort((a, b) => b.length - a.length);
  for (const terme of termes) {
    texte = texte.replaceAll(terme, () => proteger(terme));
  }

  return { texte, protections };
}

function restaurer(texte, protections, cle) {
  let resultat = texte;
  for (const [jeton, original] of protections) {
    const occurrences = resultat.split(jeton).length - 1;
    if (occurrences !== 1) {
      throw new Error(`${cle}: le marqueur ${jeton} apparaît ${occurrences} fois au lieu d'une`);
    }
    resultat = resultat.replace(jeton, original);
  }
  if (/ZXQPH\d{4}QXZ/.test(resultat)) {
    throw new Error(`${cle}: un marqueur inconnu subsiste`);
  }
  return resultat;
}

function construireLots(entrees) {
  const lots = [];
  let lot = [];
  let taille = 0;
  for (const entree of entrees) {
    const poids = entree[1].length + entree[0].length + 16;
    if (lot.length && taille + poids > LIMITE_CARACTERES) {
      lots.push(lot);
      lot = [];
      taille = 0;
    }
    lot.push(entree);
    taille += poids;
  }
  if (lot.length) lots.push(lot);
  return lots;
}

function promptPourLot(lot) {
  const objet = {};
  const protections = new Map();
  for (const [cle, valeur] of lot) {
    const masque = masquer(valeur);
    objet[cle] = masque.texte;
    protections.set(cle, masque.protections);
  }

  const prompt = `Tu traduis du français vers le breton (brezhoneg) des valeurs de localisation d'une application éducative destinée aux enseignants.

Registre : breton standard écrit (peurunvan). Conserve la distinction du français source : tutoiement pour l'élève, vouvoiement pour l'enseignant. Vocabulaire scolaire à privilégier : skol, skolaj, lise, skoliad/skolidi, kelenner(ez), goulenn, respont, kentel.

Règles absolues :
- Retourne UNIQUEMENT un objet JSON strict, complet et parsable.
- Conserve exactement les mêmes clés, dans le même ordre. Ne traduis jamais les clés.
- Traduis intégralement chaque valeur en breton, sans résumé ni ajout.
- Recopie chaque marqueur de forme ZXQPH0000QXZ exactement, une seule fois et au même emplacement logique. Ne le modifie, ne le traduis et ne le supprime jamais.
- Préserve les sauts de ligne, la ponctuation structurante, les majuscules d'insistance et les listes.
- Les consignes prompt_* doivent rester impératives, précises et non ambiguës.
- Les mentions legal_* doivent rester fidèles, sans reformulation ni ajout.
- Les erreurs et validations doivent rester courtes et directement actionnables.
- Dans prompt_regles_pedagogiques_communes, la règle de langue doit imposer que TOUT contenu produit soit en breton, quelle que soit la langue des sources.

Objet à traduire :
${JSON.stringify(objet, null, 2)}`;
  return { prompt, protections };
}

function extraireObjetJson(contenu) {
  const debut = contenu.indexOf('{');
  if (debut < 0) throw new Error('aucun objet JSON dans la réponse');
  let profondeur = 0;
  let chaine = false;
  let echappe = false;
  for (let i = debut; i < contenu.length; i++) {
    const caractere = contenu[i];
    if (echappe) {
      echappe = false;
      continue;
    }
    if (chaine && caractere === '\\') {
      echappe = true;
      continue;
    }
    if (caractere === '"') chaine = !chaine;
    if (chaine) continue;
    if (caractere === '{') profondeur++;
    if (caractere === '}' && --profondeur === 0) {
      return JSON.parse(contenu.slice(debut, i + 1));
    }
  }
  throw new Error('objet JSON incomplet dans la réponse');
}

async function appelerModele(prompt) {
  const soumission = await fetch(URL_SOUMISSION, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model: MODELE, stats: 'skip' })
  });
  if (!soumission.ok) throw new Error(`soumission HTTP ${soumission.status}`);
  const { taskId } = await soumission.json();
  if (!taskId) throw new Error('taskId absent de la soumission');

  const debut = Date.now();
  while (Date.now() - debut < DELAI_MAX_MS) {
    await new Promise(resolve => setTimeout(resolve, ATTENTE_POLL_MS));
    const resultat = await fetch(`${URL_RESULTAT}?taskId=${encodeURIComponent(taskId)}`);
    if (!resultat.ok) throw new Error(`poll HTTP ${resultat.status}`);
    const donnees = await resultat.json();
    if (donnees.status === 'processing') continue;
    if (donnees.status === 'error') throw new Error(donnees.message || 'erreur LLM');
    if (donnees.status === 'not_found') throw new Error('tâche LLM introuvable');
    if (donnees.status === 'done') return donnees.content || '';
    throw new Error(`statut LLM inattendu : ${donnees.status}`);
  }
  throw new Error('délai LLM dépassé');
}

async function traduireLot(lot, numero, total) {
  const clesAttendues = lot.map(([cle]) => cle);
  const { prompt, protections } = promptPourLot(lot);
  let derniereErreur;
  for (let tentative = 1; tentative <= 3; tentative++) {
    let brut = '';
    try {
      brut = await appelerModele(prompt);
      const traduit = extraireObjetJson(brut);
      const clesRecues = Object.keys(traduit);
      if (JSON.stringify(clesRecues) !== JSON.stringify(clesAttendues)) {
        throw new Error(`clés reçues différentes (${clesRecues.length}/${clesAttendues.length})`);
      }
      const restaure = {};
      for (const cle of clesAttendues) {
        if (typeof traduit[cle] !== 'string') throw new Error(`${cle}: valeur non textuelle`);
        restaure[cle] = restaurer(traduit[cle], protections.get(cle), cle);
      }
      console.log(`[${numero}/${total}] lot validé (${clesAttendues.length} clés, tentative ${tentative})`);
      return restaure;
    } catch (erreur) {
      derniereErreur = erreur;
      console.warn(`[${numero}/${total}] tentative ${tentative} refusée : ${erreur.message}`);
      if (MODE_ESSAI && brut) console.warn(brut);
    }
  }
  throw new Error(`lot ${numero} impossible après 3 tentatives : ${derniereErreur?.message}`);
}

function chargerProgression() {
  try {
    const progression = JSON.parse(readFileSync(PROGRES, 'utf8'));
    if (progression.empreinteSource === empreinteSource && progression.modele === MODELE) {
      return progression.traductions || {};
    }
  } catch {
    // Première exécution ou point de reprise périmé.
  }
  return {};
}

const clesEssai = new Set([
  'help_modal_title',
  'h5p_timeline_description',
  'error_unsupported_format',
  'validation_json_invalid',
  'prompt_regles_pedagogiques_communes',
  'legal_library_mathjax'
]);

let entrees = Object.entries(fr).filter(([cle, valeur]) => doitEtreTraduite(cle, valeur));
if (MODE_ESSAI) entrees = entrees.filter(([cle]) => clesEssai.has(cle));

const traductions = MODE_ESSAI ? {} : chargerProgression();
entrees = entrees.filter(([cle]) => !(cle in traductions));
const lots = construireLots(entrees);

console.log(`${entrees.length} valeurs à traduire en ${lots.length} lots avec ${MODELE}.`);
for (let i = 0; i < lots.length; i++) {
  const nouvelles = await traduireLot(lots[i], i + 1, lots.length);
  Object.assign(traductions, nouvelles);
  if (!MODE_ESSAI) {
    writeFileSync(PROGRES, `${JSON.stringify({ empreinteSource, modele: MODELE, traductions }, null, 2)}\n`);
  }
}

if (MODE_ESSAI) {
  console.log(JSON.stringify(traductions, null, 2));
} else {
  const final = {};
  for (const [cle, valeur] of Object.entries(fr)) {
    final[cle] = traductions[cle] ?? brInitial[cle] ?? valeur;
  }
  writeFileSync(CIBLE, `${JSON.stringify(final, null, 2)}\n`);
  console.log(`Traduction complète écrite dans ${CIBLE}.`);
}
