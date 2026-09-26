import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient.js";

const CONTACT_EMAIL = "devchallenge@lycee-exemple.fr";

export default function Home() {
  const [stats, setStats] = useState(null);
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const [{ count: total }, { count: actifs }, { count: soumissions }] = await Promise.all([
        supabase.from("challenges").select("*", { count: "exact", head: true }),
        supabase.from("challenges").select("*", { count: "exact", head: true }).in("status", ["open", "locked", "review"]),
        supabase.from("submissions").select("*", { count: "exact", head: true }),
      ]);
      setStats({ total: total || 0, actifs: actifs || 0, soumissions: soumissions || 0 });
    })();
  }, []);

  function envoyer(e) {
    e.preventDefault();
    const corps = encodeURIComponent(message);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(sujet)}&body=${corps}`;
  }

  return (
    <>
      <section className="hero">
        <div className="hero-video-wrap" aria-hidden="true">
          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            src="https://assets.mixkit.co/videos/preview/mixkit-programming-code-typing-1206-large.mp4"
          />
        </div>

        <div className="hero-content">
          <h1>Progressez en équipe, projet après projet</h1>
          <p className="lead">
            DevChallenge organise des défis de développement entre élèves : chacun code, dépose,
            évalue les autres — et la note combine correction automatique et avis des pairs.
          </p>
          <div className="cta-row">
            <Link to="/challenges" className="btn">Voir les challenges</Link>
            <a href="#comment" className="btn ghost">Comment ça marche</a>
          </div>
        </div>

        {stats && (
          <div className="stat-row">
            <div className="stat-card"><div className="n">{stats.actifs}</div><div className="l">challenges actifs</div></div>
            <div className="stat-card"><div className="n">{stats.total}</div><div className="l">challenges créés</div></div>
            <div className="stat-card"><div className="n">{stats.soumissions}</div><div className="l">projets déposés</div></div>
          </div>
        )}
      </section>

      <section id="comment" className="section-block">
        <div className="section-head">
          <span className="chip">Démarche</span>
          <h2>Comment ça marche</h2>
        </div>
        <div className="how-grid">
          <article className="card step-card">
            <div className="step-number">01</div>
            <h3>Un défi est lancé</h3>
            <p className="mut">Un prof publie un challenge : consigne, critères, date limite.</p>
          </article>
          <article className="card step-card">
            <div className="step-number">02</div>
            <h3>Vous déposez</h3>
            <p className="mut">Chacun soumet son dépôt Git et sa démo déployée.</p>
          </article>
          <article className="card step-card">
            <div className="step-number">03</div>
            <h3>Vous évaluez</h3>
            <p className="mut">Des projets vous sont attribués au hasard, à noter et commenter.</p>
          </article>
          <article className="card step-card">
            <div className="step-number">04</div>
            <h3>Le résultat tombe</h3>
            <p className="mut">50% correction automatique, 50% médiane des pairs.</p>
          </article>
        </div>
      </section>

      <section id="about" className="section-block info-grid">
        <div className="card info-panel">
          <div className="section-head left">
            <span className="chip">Projet</span>
            <h2>À propos</h2>
          </div>
          <p className="mut">
            DevChallenge est un projet réalisé par et pour une classe de développement web et mobile
            au lycée. L'objectif : s'entraîner en conditions proches du réel — un cahier des charges,
            un dépôt Git, une démo déployée, et un retour à la fois automatisé et humain.
          </p>
          <p className="mut">
            La note finale d'un projet combine deux sources : une correction automatique (Lighthouse,
            validation W3C, ESLint, tests du cahier des charges) et une évaluation par les pairs, où
            chaque élève note quelques projets tirés au sort, jamais le sien.
          </p>
          <p className="mut" style={{ marginBottom: 0 }}>
            Le code source est ouvert et pensé pour être repris, modifié ou amélioré par la classe.
          </p>
        </div>

        <div id="contact" className="card info-panel">
          <div className="section-head left">
            <span className="chip">Contact</span>
            <h2>Écrivez-nous</h2>
          </div>
          <p className="mut">
            Une question, un bug à signaler, une idée d'amélioration ? Écris-nous, ou ouvre directement
            une issue sur le dépôt GitHub du projet.
          </p>
          <form onSubmit={envoyer} className="contact-form">
            <label htmlFor="sujet">Sujet</label>
            <input id="sujet" value={sujet} onChange={(e) => setSujet(e.target.value)} required />
            <label htmlFor="message">Message</label>
            <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} required />
            <div className="form-actions">
              <button className="btn" type="submit">Envoyer par email</button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
