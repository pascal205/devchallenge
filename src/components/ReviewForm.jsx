import { useState } from "react";
import { supabase } from "../supabaseClient.js";

export default function ReviewForm({ submission, criteria, hideRepo, onDone }) {
  const [scores, setScores] = useState(Object.fromEntries(criteria.map((c) => [c.id, 12])));
  const [comment, setComment] = useState("");
  const [erreur, setErreur] = useState("");
  const court = comment.trim().length < 100;

  async function valider() {
    setErreur("");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("reviews").insert({
      submission_id: submission.id, reviewer_id: user.id, scores, comment,
    });
    if (error) setErreur(error.message); else onDone();
  }

  return (
    <div className="card">
      <div className="row">
        <h3>Projet à évaluer</h3>
        <a href={submission.demo_url} target="_blank" rel="noopener noreferrer">Voir la démo ↗</a>
      </div>
      {hideRepo
        ? <p className="mut">Dépôt : masqué par le prof pendant l'évaluation (anonymat renforcé).</p>
        : <p className="mut">Dépôt : <a href={submission.repo_url} target="_blank" rel="noopener noreferrer">{submission.repo_url}</a></p>}
      {criteria.map((c) => (
        <div className="crit" key={c.id}>
          <span className="lbl">{c.label}</span>
          <input type="range" min="0" max="20" value={scores[c.id]} aria-label={c.label}
            onChange={(e) => setScores({ ...scores, [c.id]: Number(e.target.value) })} />
          <span className="val">{scores[c.id]}</span>
        </div>
      ))}
      <label htmlFor={"c" + submission.id}>Commentaire justifiant ta note (100 caractères minimum)</label>
      <textarea id={"c" + submission.id} value={comment} onChange={(e) => setComment(e.target.value)}
        placeholder="Ce qui marche, ce qui ne marche pas, ce que tu changerais…" />
      <p className="mut" style={{ margin: "5px 0 12px" }}>
        {court ? `Encore ${100 - comment.trim().length} caractères.` : "Commentaire suffisant."}
      </p>
      {erreur && <p className="error">{erreur}</p>}
      <button className="btn" disabled={court} onClick={valider}>Valider l'évaluation</button>
    </div>
  );
}
