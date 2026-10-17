"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
    if (error) { setError("Correo o contraseña incorrectos."); setLoading(false); return; }
    window.location.href = "/admin";
  }
  return <form className="stack" onSubmit={login}>
    <input className="field" type="email" name="email" autoComplete="email" required placeholder="Correo electrónico"/>
    <input className="field" type="password" name="password" autoComplete="current-password" required placeholder="Contraseña"/>
    <button className="btn" disabled={loading}>{loading?"Ingresando...":"Ingresar"}</button>
    {error&&<div className="error">{error}</div>}
  </form>;
}
