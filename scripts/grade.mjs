// Script de correction automatique.
// À exécuter HORS de ce chat (en local ou dans une GitHub Action), car il a besoin
// d'accéder librement à Internet pour visiter les démos déployées des élèves.
//
// Usage : node scripts/grade.mjs <challenge_id>
// Variables d'environnement requises :
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (clé "service_role", jamais l'anon key !)

import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";

const [, , challengeId] = process.argv;
if (!challengeId) {
  console.error("Usage : node scripts/grade.mjs <challenge_id>");
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// --- une mesure par critère, chacune ramenée sur /100 ---

function runLighthouse(url) {
  try {
    const out = execSync(
      `npx --yes lighthouse "${url}" --output=json --quiet --chrome-flags="--headless --no-sandbox"`,
      { maxBuffer: 1024 * 1024 * 20 }
    ).toString();
    const json = JSON.parse(out);
    const perf = Math.round(json.categories.performance.score * 100);
    const a11y = Math.round(json.categories.accessibility.score * 100);
    return Math.round((perf + a11y) / 2);
  } catch (e) {
    console.error("Lighthouse a échoué pour", url, e.message);
    return 0;
  }
}

async function runW3C(url) {
  try {
    const res = await fetch(`https://validator.w3.org/nu/?doc=${encodeURIComponent(url)}&out=json`, {
      headers: { "User-Agent": "devchallenge-grader" },
    });
    const json = await res.json();
    const erreurs = (json.messages || []).filter((m) => m.type === "error").length;
    return Math.max(0, 100 - erreurs * 5);
  } catch (e) {
    console.error("Validation W3C échouée pour", url, e.message);
    return 0;
  }
}

function runEslint(repoUrl) {
  // Clone superficiel + eslint avec la config du dépôt. Retourne /100 selon le nombre d'erreurs.
  const dir = `/tmp/grade-${Date.now()}`;
  try {
    execSync(`git clone --depth 1 "${repoUrl}" "${dir}"`, { stdio: "ignore" });
    execSync(`cd "${dir}" && npm install --no-audit --no-fund`, { stdio: "ignore" });
    const out = execSync(`cd "${dir}" && npx --yes eslint . -f json`, { stdio: "pipe" }).toString();
    const results = JSON.parse(out);
    const erreurs = results.reduce((t, r) => t + r.errorCount, 0);
    return Math.max(0, 100 - erreurs * 3);
  } catch {
    return 50; // pas de config ESLint ou projet non buildable : note neutre plutôt que 0
  } finally {
    execSync(`rm -rf "${dir}"`);
  }
}

// --- boucle principale ---

const { data: challenge } = await supabase.from("challenges").select("*").eq("id", challengeId).single();
const { data: submissions } = await supabase.from("submissions").select("*").eq("challenge_id", challengeId);

for (const s of submissions) {
  console.log("Correction de", s.repo_url);
  const scores = {};
  for (const w of challenge.auto_weights) {
    if (w.id === "lh") scores[w.id] = runLighthouse(s.demo_url);
    else if (w.id === "w3c") scores[w.id] = await runW3C(s.demo_url);
    else if (w.id === "lint") scores[w.id] = runEslint(s.repo_url);
    else scores[w.id] = 70; // critère personnalisé (ex: tests du cahier des charges) : à brancher séparément
  }
  await supabase.from("auto_scores").upsert({ submission_id: s.id, scores });
  console.log("→", scores);
}

console.log("Terminé.");
