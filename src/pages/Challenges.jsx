import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient.js";

const LABEL = { draft: "Brouillon", open: "Ouvert", locked: "Verrouillé", review: "Évaluation", results: "Résultats" };

const FILTRES = [["all", "Tous"], ["open", "Ouvert"], ["locked", "Verrouillé"], ["review", "Évaluation"], ["results", "Résultats"]];

export default function Challenges({ profile }) {
  const [liste, setListe] = useState(null);
  const [creation, setCreation] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("all");

  async function charger() {
    const { data } = await supabase.from("challenges").select("*").order("created_at", { ascending: false });
    setListe(data || []);
  }
  useEffect(() => { charger(); }, []);

  if (liste === null) return <p className="mut">Chargement…</p>;

  const visibles = liste.filter((c) =>
    (filtre === "all" || c.status === filtre) &&
    c.title.toLowerCase().includes(recherche.trim().toLowerCase())
  );

  return (
    <>
      {profile?.role === "prof" && (
        creation
          ? <NouveauChallenge onDone={() => { setCreation(false); charger(); }} onCancel={() => setCreation(false)} />
          : <p><button className="btn" onClick={() => setCreation(true)}>+ Nouveau challenge</button></p>
      )}

      {liste.length > 0 && (
        <div className="card" style={{ paddingBottom: 12 }}>
          <input
            placeholder="Rechercher un challenge…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            aria-label="Rechercher un challenge"
          />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {FILTRES.map(([k, l]) => (
              <button key={k} className="opt-btn" aria-pressed={filtre === k}
                onClick={() => setFiltre(k)} style={{ padding: "6px 12px", fontSize: 13 }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {liste.length === 0 && <div className="card"><p className="empty">Aucun challenge pour l'instant.</p></div>}
      {liste.length > 0 && visibles.length === 0 && (
        <div className="card"><p className="empty">Aucun challenge ne correspond à ta recherche.</p></div>
      )}

      {visibles.map((c) => (
        <Link key={c.id} to={`/challenge/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card">
            <div className="row">
              <h3>{c.title}</h3>
              <span className="chip">{LABEL[c.status]}</span>
            </div>
            <p className="mut" style={{ marginBottom: 0 }}>{c.description}</p>
          </div>
        </Link>
      ))}
    </>
  );
}

function NouveauChallenge({ onDone, onCancel }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [criteres, setCriteres] = useState("Design, Ergonomie, Originalité, Qualité du code");
  const [poids, setPoids] = useState("Lighthouse:30, W3C:15, ESLint:15, Responsive:20, Tests:20");
  const [erreur, setErreur] = useState("");

  async function creer(e) {
    e.preventDefault();
    setErreur("");
    const criteria = criteres.split(",").map((s) => s.trim()).filter(Boolean)
      .map((label) => ({ id: label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_"), label }));
    let auto_weights;
    try {
      auto_weights = poids.split(",").map((s) => s.trim()).filter(Boolean).map((p) => {
        const [label, val] = p.split(":");
        return { id: label.trim().toLowerCase().replace(/\s+/g, "_"), label: label.trim(), poids: Number(val) };
      });
      const total = auto_weights.reduce((a, w) => a + w.poids, 0);
      if (total !== 100) throw new Error(`Les poids de la correction auto doivent totaliser 100 (actuellement ${total}).`);
    } catch (err) { setErreur(err.message); return; }

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("challenges").insert({
      title, description, criteria, auto_weights,
      deadline: deadline || null, created_by: user.id,
    });
    if (error) setErreur(error.message); else onDone();
  }

  return (
    <form className="card" onSubmit={creer}>
      <h3>Nouveau challenge</h3>
      <label htmlFor="t">Titre</label>
      <input id="t" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <label htmlFor="d">Consigne</label>
      <textarea id="d" value={description} onChange={(e) => setDescription(e.target.value)} required />
      <label htmlFor="dl">Date limite de dépôt</label>
      <input id="dl" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      <label htmlFor="c">Critères notés par les pairs (séparés par des virgules)</label>
      <input id="c" value={criteres} onChange={(e) => setCriteres(e.target.value)} />
      <label htmlFor="p">Critères de correction automatique et leur poids (total = 100)</label>
      <input id="p" value={poids} onChange={(e) => setPoids(e.target.value)} />
      {erreur && <p className="error">{erreur}</p>}
      <p style={{ marginBottom: 0, display: "flex", gap: 8 }}>
        <button className="btn" type="submit">Créer</button>
        <button className="btn ghost" type="button" onClick={onCancel}>Annuler</button>
      </p>
    </form>
  );
}
