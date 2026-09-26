export default function Leaderboard({ rows }) {
  if (!rows) return <p className="mut">Chargement…</p>;
  const bloque = rows.some((r) => r.auteur === null);

  return (
    <>
      {bloque && (
        <div className="card"><p className="empty">
          Termine tes évaluations pour débloquer le classement complet.
        </p></div>
      )}
      <div className="card scroll">
        <h3 style={{ marginBottom: 12 }}>Classement</h3>
        <table>
          <thead>
            <tr><th>#</th><th>Élève</th><th>Auto</th><th>Pairs</th><th>Avis</th><th>Final /100</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.submission_id}>
                <td>{i + 1}</td>
                <td>{r.auteur ?? "—"}</td>
                <td>{r.auto_score}</td>
                <td>{r.peer_score ?? "—"}</td>
                <td>{r.nb_avis}</td>
                <td style={{ fontWeight: 700 }}>{r.auteur === null ? "—" : r.note_finale}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mut" style={{ marginBottom: 0 }}>
          Note des pairs = médiane des évaluations reçues, pour neutraliser les notes extrêmes.
        </p>
      </div>
    </>
  );
}
