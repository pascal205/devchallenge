import { useLang } from "../context/LangContext.jsx";

export default function About() {
  const { t } = useLang();
  return (
    <div className="card">
      <h2>{t("about_title")}</h2>
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
  );
}
