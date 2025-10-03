#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const i18nDir = join(process.cwd(), 'public', 'i18n');
const files = readdirSync(i18nDir).filter(f => f.endsWith('.json'));

// Load locale JSONs
const localeMaps = {};
for (const file of files) {
  try {
    const raw = readFileSync(join(i18nDir, file), 'utf-8');
    localeMaps[file.replace('.json','')] = JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to parse ${file}:`, e.message);
    process.exitCode = 1;
  }
}

// Flatten keys helper
function flatten(obj, prefix = '') {
  const out = {};
  for (const [k,v] of Object.entries(obj || {})) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, full));
    } else {
      out[full] = true;
    }
  }
  return out;
}

const flattened = Object.fromEntries(Object.entries(localeMaps).map(([lang,json]) => [lang, flatten(json)]));

// Build master key set (union)
const allKeys = new Set();
for (const map of Object.values(flattened)) Object.keys(map).forEach(k => allKeys.add(k));

// Detect missing keys per locale
const missing = {};
for (const [lang,map] of Object.entries(flattened)) {
  const miss = [];
  for (const k of allKeys) if (!map[k]) miss.push(k);
  if (miss.length) missing[lang] = miss.sort();
}

// Detect extra keys (not in every locale)
const extra = {};
for (const [lang,map] of Object.entries(flattened)) {
  const extras = Object.keys(map).filter(k => Object.values(flattened).some(m2 => !m2[k]));
  if (extras.length) extra[lang] = [...new Set(extras)].sort();
}

const hasMissing = Object.keys(missing).length > 0;
if (hasMissing) {
  console.error('\n❌ Missing translation keys detected:');
  for (const [lang, list] of Object.entries(missing)) {
    console.error(`  - ${lang}: ${list.length} missing`);
    list.slice(0,20).forEach(k => console.error(`      • ${k}`));
    if (list.length > 20) console.error(`      … (+${list.length-20} more)`);
  }
}

// Provide a summary matrix (counts)
console.log('\nTranslation key summary:');
for (const lang of Object.keys(localeMaps).sort()) {
  const count = Object.keys(flattened[lang]).length;
  console.log(`  ${lang}: ${count} keys`);
}

if (!hasMissing) {
  console.log('\n✅ All locales have a value for every key in the union.');
} else {
  console.log('\nRun: npm run check:i18n:details for a full diff (not implemented yet).');
}

process.exit(hasMissing ? 1 : 0);
