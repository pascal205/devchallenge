import { useState } from "react";
import { useLang } from "../context/LangContext.jsx";

const CONTACT_EMAIL = "devchallenge@lycee-exemple.fr"; // à remplacer par la vraie adresse de la classe

export default function Contact() {
  const { t } = useLang();
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");

  function envoyer(e) {
    e.preventDefault();
    const corps = encodeURIComponent(message);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(sujet)}&body=${corps}`;
  }

  return (
    <div className="card">
      <h2>{t("contact_title")}</h2>
      <p className="mut">
        Une question, un bug à signaler, une idée d'amélioration ? Écris-nous, ou ouvre directement
        une issue sur le dépôt GitHub du projet.
      </p>
      <form onSubmit={envoyer}>
        <label htmlFor="sujet">Sujet</label>
        <input id="sujet" value={sujet} onChange={(e) => setSujet(e.target.value)} required />
        <label htmlFor="message">Message</label>
        <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} required />
        <p style={{ marginBottom: 0, marginTop: 12 }}>
          <button className="btn" type="submit">Envoyer par email</button>
        </p>
      </form>
    </div>
  );
}
