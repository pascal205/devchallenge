import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import SubmitForm from "../components/SubmitForm.jsx";
import ReviewForm from "../components/ReviewForm.jsx";
import Leaderboard from "../components/Leaderboard.jsx";
import AdminBanner from "../components/AdminBanner.jsx";

const SUIVANT = { draft: "open", open: "locked", locked: "review", review: "results" };
const LABEL_ACTION = {
  draft: "Ouvrir les dépôts", open: "Verrouiller les dépôts",
  locked: "Attribuer les évaluations", review: "Publier les résultats",
};

export default function ChallengeDetail({ profile }) {
  const { id } = useParams();
  const [challenge, setChallenge] = useState(null);
  const [userId, setUserId] = useState(null);
  const [maSoumission, setMaSoumission] = useState(null);
  const [aEvaluer, setAEvaluer] = useState([]);
  const [rows, setRows] = useState(null);
  const [tab, setTab] = useState("depot");

  const charger = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user.id);

    const { data: c } = await supabase.from("challenges").select("*").eq("id", id).single();
    setChallenge(c);

    const { data: mine } = await supabase.from("submissions").select("*")
      .eq("challenge_id", id).eq("user_id", user.id).maybeSingle();
    setMaSoumission(mine);

    const { data: assigns } = await supabase.from("review_assignments")
      .select("submission_id, submissions(*)").eq("challenge_id", id).eq("reviewer_id", user.id);
    if (assigns) {
      const { data: dejaFaits } = await supabase.from("reviews").select("submission_id").eq("reviewer_id", user.id);
      const faits = new Set((dejaFaits || []).map((r) => r.submission_id));
      setAEvaluer(assigns.filter((a) => !faits.has(a.submission_id)).map((a) => a.submissions));
    }

    if (c && (c.status === "review" || c.status === "results")) {
      const { data: lb } = await supabase.rpc("leaderboard", { p_challenge: id });
      setRows(lb);
    }
  }, [id]);

  useEffect(() => { charger(); }, [charger]);

  async function actionProf() {
    const next = SUIVANT[challenge.status];
    if (challenge.status === "locked") await supabase.rpc("assign_reviews", { p_challenge: id, p_par_eleve: 4 });
    await supabase.from("challenges").update({ status: next }).eq("id", id);
    charger();
  }

  if (!challenge) return <p className="mut">Chargement…</p>;

  return (
    <>
      <p><Link to="/challenges" className="mut">← Tous les challenges</Link></p>

      {profile?.role === "prof" && <AdminBanner challenge={challenge} onChange={charger} />}

      <div className="card">
        <div className="row">
          <h2>{challenge.title}</h2>
          <span className="chip">{challenge.status}</span>
        </div>
        <p className="mut" style={{ marginBottom: profile?.role === "prof" ? 12 : 0 }}>{challenge.description}</p>
        {profile?.role === "prof" && challenge.status !== "results" && (
          <button className="btn" onClick={actionProf}>{LABEL_ACTION[challenge.status]}</button>
        )}
      </div>

      <nav>
        {[["depot", "Déposer"], ["eval", "Évaluer"], ["res", "Résultats"]].map(([k, l]) => (
          <button key={k} aria-current={tab === k} onClick={() => setTab(k)}>{l}</button>
        ))}
      </nav>

      {tab === "depot" && (
        <SubmitForm challenge={challenge} maSoumission={maSoumission} userId={userId} onDone={charger} />
      )}

      {tab === "eval" && (
        aEvaluer.length
          ? aEvaluer.map((s) => (
              <ReviewForm key={s.id} submission={s} criteria={challenge.criteria} onDone={charger}
                hideRepo={challenge.hide_repo_links && profile?.role !== "prof"} />
            ))
          : <div className="card"><p className="empty">Rien à évaluer pour l'instant.</p></div>
      )}

      {tab === "res" && (
        challenge.status === "review" || challenge.status === "results"
          ? <Leaderboard rows={rows} />
          : <div className="card"><p className="empty">Les résultats arrivent une fois le challenge en phase d'évaluation.</p></div>
      )}
    </>
  );
}
