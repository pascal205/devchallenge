import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient.js";

export default function AdminBanner({ challenge, onChange }) {
  const navigate = useNavigate();
  const [ouvert, setOuvert] = useState(false);
  const [suppression, setSuppression] = useState(false);
  const [erreur, setErreur] = useState("");

  async function toggleMasquage() {
    setErreur("");
    const { error } = await supabase
      .from("challenges")
      .update({ hide_repo_links: !challenge.hide_repo_links })
      .eq("id", challenge.id);
    if (error) setErreur(error.message); else onChange();
  }

  async function supprimer() {
    setErreur("");
    const { error } = await supabase.from("challenges").delete().eq("id", challenge.id);
    if (error) { setErreur(error.message); return; }
    navigate("/");
  }

  return (
    <div className="card" style={{ borderColor: "var(--acc)" }}>
      <div className="row" style={{ cursor: "pointer" }} onClick={() => setOuvert(!ouvert)}>
        <span className="chip" style={{ background: "var(--acc)", color: "#fff" }}>Administration</span>
        <span className="mut">{ouvert ? "Réduire ▲" : "Options du prof ▼"}</span>
      </div>

      {ouvert && (
        <div style={{ marginTop: 14 }}>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Masquer les liens de dépôt aux évaluateurs</p>
              <p className="mut" style={{ margin: "2px 0 0" }}>
                Pendant l'évaluation, les élèves ne verront plus l'URL GitHub des projets
                qu'ils notent (seule la démo reste visible), pour limiter le risque de
                reconnaître l'auteur.
              </p>
            </div>
            <button className="btn ghost" onClick={toggleMasquage}>
              {challenge.hide_repo_links ? "Désactiver" : "Activer"}
            </button>
          </div>

          <div style={{ height: 1, background: "var(--line)", margin: "14px 0" }} />

          <div className="row" style={{ alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Supprimer ce challenge</p>
              <p className="mut" style={{ margin: "2px 0 0" }}>
                Action définitive : supprime aussi tous les projets déposés, les
                évaluations reçues et les attributions liées. À utiliser en cas d'erreur
                de création, pas pour clôturer normalement un challenge.
              </p>
            </div>
            {suppression ? (
              <span style={{ display: "flex", gap: 8 }}>
                <button className="btn" style={{ background: "#c0392b" }} onClick={supprimer}>
                  Confirmer la suppression
                </button>
                <button className="btn ghost" onClick={() => setSuppression(false)}>Annuler</button>
              </span>
            ) : (
              <button className="btn ghost" onClick={() => setSuppression(true)}>Supprimer…</button>
            )}
          </div>

          {erreur && <p className="error">{erreur}</p>}
        </div>
      )}
    </div>
  );
}
