import { useEffect, useRef, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import { useLang } from "../context/LangContext.jsx";

function initiales(nom) {
  if (!nom) return "?";
  return nom.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function Header({ profile, email }) {
  const { t } = useLang();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [navOuvert, setNavOuvert] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setMenuOuvert(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const liens = [
    { to: "/", label: t("nav_home"), kind: "route" },
    { to: "/challenges", label: t("nav_challenges"), kind: "route" },
    { to: "/#about", label: t("nav_about"), kind: "hash" },
    { to: "/#contact", label: t("nav_contact"), kind: "hash" },
  ];

  return (
    <header className="site-header">
      <div className="inner">
        <Link to="/" className="logo">Dev<span>Challenge</span></Link>

        <button className="burger" aria-label="Menu" onClick={() => setNavOuvert(!navOuvert)}>☰</button>

        <nav className={"main-nav" + (navOuvert ? " open" : "")} onClick={() => setNavOuvert(false)}>
          {liens.map(({ to, label, kind }) =>
            kind === "hash" ? (
              <a key={to} href={to} className="hash-link">{label}</a>
            ) : (
              <NavLink key={to} to={to} end={to === "/"}
                className={({ isActive }) => (isActive ? "active" : "")}>
                {label}
              </NavLink>
            )
          )}
        </nav>

        <div className="profile-wrap" ref={ref}>
          <button className="avatar-btn" onClick={() => setMenuOuvert(!menuOuvert)}>
            <span className="avatar-bubble">{initiales(profile?.full_name || email)}</span>
            <span className="mut" style={{ fontSize: 13 }}>{profile?.full_name || email}</span>
          </button>

          {menuOuvert && (
            <div className="dropdown">
              <NavLink to="/profile?tab=current" onClick={() => setMenuOuvert(false)}>{t("profile_current")}</NavLink>
              <NavLink to="/profile?tab=participating" onClick={() => setMenuOuvert(false)}>{t("profile_participating")}</NavLink>
              <NavLink to="/profile?tab=history" onClick={() => setMenuOuvert(false)}>{t("profile_history")}</NavLink>
              <hr />
              <NavLink to="/settings" onClick={() => setMenuOuvert(false)}>{t("profile_settings")}</NavLink>
              <hr />
              <button onClick={() => supabase.auth.signOut()}>{t("profile_logout")}</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
