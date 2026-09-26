// Les vrais calculs officiels sont faits côté base (fonction SQL "leaderboard"),
// ce fichier ne sert qu'à des aperçus côté client (ex: pendant la saisie d'un avis).

export function mediane(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function moyenneCriteres(scores, criteria) {
  const vals = criteria.map((c) => Number(scores[c.id] || 0));
  return vals.reduce((a, b) => a + b, 0) / (criteria.length || 1);
}
