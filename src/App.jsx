import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient.js";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { LangProvider } from "./context/LangContext.jsx";
import Header from "./components/Header.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Challenges from "./pages/Challenges.jsx";
import ChallengeDetail from "./pages/ChallengeDetail.jsx";
import Profile from "./pages/Profile.jsx";
import Settings from "./pages/Settings.jsx";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = chargement
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    supabase.from("profiles").select("*").eq("id", session.user.id).single()
      .then(({ data }) => setProfile(data));
  }, [session]);

  return (
    <ThemeProvider>
      <LangProvider>
        {session === undefined ? (
          <div className="wrap">Chargement…</div>
        ) : !session ? (
          <Login />
        ) : (
          <>
            <Header profile={profile} email={session.user.email} />
            <div className="wrap">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/challenges" element={<Challenges profile={profile} />} />
                <Route path="/challenge/:id" element={<ChallengeDetail profile={profile} />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </>
        )}
      </LangProvider>
    </ThemeProvider>
  );
}
