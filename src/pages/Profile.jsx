import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import { useLang } from "../context/LangContext.jsx";

const LABEL = { draft: "Brouillon", open: "Ouvert", locked: "Verrouillé", review: "Évaluation", results: "Résultats" };

export default function Profile() {
  const { t } = useLang();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "current";
  const [challenges, setChallenges] = useState(null);

  useEffect(() => {
    (async () => {
      setChallenges(null);
      const { data: { user } } = await supabase.auth.getUser();

      if (tab === "current") {
        const { data } = await supabase.from("challenges").select("*")
          .in("status", ["open", "locked", "review"]).order("created_at", { ascending: false });
        setChallenges(data || []);
      }

      if (tab === "history") {
        const { data } = await supabase.from("challenges").select("*")
          .eq("status", "results").order("created_at", { ascending: false });
        setChallenges(data || []);
      }

      if (tab === "participating") {
        const { data } = await supabase.from("submissions").select("challenge_id, challenges(*)")
          .eq("user_id", user.id);
        setChallenges((data || []).map((r) => r.challenges).filter(Boolean));
      }
    })();
  }, [tab]);

  const onglets = [
    ["current", t("profile_current")],
    ["participating", t("profile_participating")],
    ["history", t("profile_history")],
  ];

  return (
    <>
      <nav>
        {onglets.map(([k, l]) => (
          <button key={k} aria-current={tab === k} onClick={() => setParams({ tab: k })}>{l}</button>
        ))}
      </nav>

      {challenges === null && <p className="mut">Chargement…</p>}

      {challenges?.length === 0 && (
        <div className="card"><p className="empty">Rien à afficher ici pour l'instant.</p></div>
      )}

      {challenges?.map((c) => (
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
