import { useState } from "react";
import { supabase } from "../supabaseClient.js";

const DOMAINE = import.meta.env.VITE_SCHOOL_EMAIL_DOMAIN;

export default function Login() {
  const [email, setEmail] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState("");

  const valide = DOMAINE ? email.endsWith("@" + DOMAINE) : email.includes("@");

  async function envoyer(e) {
    e.preventDefault();
    setErreur("");
    if (!valide) {
      setErreur(DOMAINE ? `Utilise ton adresse @${DOMAINE}` : "Adresse email invalide");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) setErreur(error.message);
    else setEnvoye(true);
  }

  return (
    <div className="wrap" style={{ maxWidth: 380, paddingTop: "18vh" }}>
      <h1 className="logo" style={{ marginBottom: 24 }}>Dev<span style={{color:"var(--acc)"}}>Challenge</span></h1>
      {envoye ? (
        <div className="card">
          <p style={{ marginTop: 0 }}>Lien de connexion envoyé à <strong>{email}</strong>.</p>
          <p className="mut" style={{ marginBottom: 0 }}>Vérifie tes mails (et les spams).</p>
        </div>
      ) : (
        <form className="card" onSubmit={envoyer}>
          <label htmlFor="email">Adresse email {DOMAINE && `(@${DOMAINE})`}</label>
          <input id="email" type="email" value={email} placeholder="prenom.nom@lycee.fr"
            onChange={(e) => setEmail(e.target.value)} />
          {erreur && <p className="error">{erreur}</p>}
          <p style={{ marginBottom: 0 }}>
            <button className="btn" type="submit">Recevoir le lien de connexion</button>
          </p>
        </form>
      )}
    </div>
  );
}
