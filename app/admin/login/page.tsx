import { LoginForm } from "@/components/login-form";
import { hasSupabaseConfig } from "@/lib/config";

export default function LoginPage() {
  return <main className="login-card">
    <div className="brand"><span className="brand-mark">PS</span><div>PERFUME <span>STOCK</span></div></div>
    <h1 style={{marginTop:28}}>Acceso privado</h1>
    <p style={{color:"var(--muted)"}}>Panel exclusivo de Agustín.</p>
    {hasSupabaseConfig() ? <LoginForm/> : <div className="notice">El panel quedará habilitado después de crear el proyecto de Supabase y completar <code>.env.local</code>.</div>}
    <a href="/" className="btn ghost" style={{display:"block",textAlign:"center",marginTop:16}}>Volver al catálogo</a>
  </main>;
}
