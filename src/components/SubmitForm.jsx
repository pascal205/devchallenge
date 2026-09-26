import { useState } from "react";
import { supabase } from "../supabaseClient.js";

export default function SubmitForm({ challenge, maSoumission, userId, onDone }) {
  const [repo, setRepo] = useState("");
  const [demo, setDemo] = useState("");
  const [erreur, setErreur] = useState("");

  if (maSoumission) {
    return (
      <div className="card">
        <h3>Ton projet est déposé</h3>
        <p className="mut" style={{ marginBottom: 0 }}>
          Dépôt : {maSoumission.repo_url}<br />Démo : {maSoumission.demo_url}
        </p>
      </div>
    );
  }

  if (challenge.status !== "open") {
    return <div className="card"><p className="empty">Les dépôts ne sont pas (ou plus) ouverts pour ce challenge.</p></div>;
  }

  async function envoyer(e) {
    e.preventDefault();
    setErreur("");
    const { error } = await supabase.from("submissions").insert({
      challenge_id: challenge.id, user_id: userId, repo_url: repo, demo_url: demo,
    });
    if (error) setErreur(error.message); else onDone();
  }

  return (
    <form className="card" onSubmit={envoyer}>
      <h3>Déposer ton projet</h3>
      <p className="mut">Pas de fichier à envoyer : on note le dépôt Git et la version déployée.</p>
      <label htmlFor="r">Dépôt Git</label>
      <input id="r" value={repo} onChange={(e) => setRepo(e.target.value)}
        placeholder="https://github.com/pseudo/projet" required />
      <label htmlFor="d">URL de la démo déployée</label>
      <input id="d" value={demo} onChange={(e) => setDemo(e.target.value)}
        placeholder="https://monprojet.vercel.app" required />
      {erreur && <p className="error">{erreur}</p>}
      <p style={{ marginBottom: 0 }}><button className="btn" type="submit">Envoyer</button></p>
    </form>
  );
}
