import { LoginForm } from "@/components/login-form";
import { hasSupabaseConfig } from "@/lib/config";
import Image from "next/image";

export default function LoginPage() {
  return <main className="login-card">
    <div className="brand"><Image className="brand-logo" src="/ayk-logo-only.webp" alt="AYK" width={320} height={320} sizes="62px" priority/></div>
    <h1 style={{marginTop:28}}>Acceso privado</h1>
    <p style={{color:"var(--muted)"}}>Panel de administración.</p>
    {hasSupabaseConfig() ? <LoginForm/> : <div className="notice">El panel quedará habilitado después de crear el proyecto de Supabase y completar <code>.env.local</code>.</div>}
    <a href="/" className="btn ghost" style={{display:"block",textAlign:"center",marginTop:16}}>Volver al catálogo</a>
  </main>;
}
