"use client";

import { useMemo, useState } from "react";
import { SprayCan, Search, ShoppingBag, X } from "lucide-react";
import type { Product } from "@/lib/types";
import { BUSINESS_WHATSAPP } from "@/lib/config";

type Cart = Record<number, number>;

export function Catalog({ initialProducts, configured }: { initialProducts: Product[]; configured: boolean }) {
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState("");
  const [availability, setAvailability] = useState("");
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const visible = useMemo(() => initialProducts.filter((product) => {
    const matchesText = product.name.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es"));
    const matchesGender = !gender || product.gender === gender;
    const matchesAvailability = !availability || (availability === "available" ? product.stock > 0 : product.stock === 0);
    return matchesText && matchesGender && matchesAvailability;
  }), [initialProducts, query, gender, availability]);

  const lines = initialProducts.filter((product) => (cart[product.id] ?? 0) > 0).map((product) => ({ ...product, quantity: cart[product.id] }));
  const total = lines.reduce((sum, line) => sum + line.quantity, 0);
  const stockTotal = initialProducts.reduce((sum, product) => sum + product.stock, 0);

  function setQuantity(product: Product, value: number) {
    const next = Math.min(product.stock, Math.max(0, Math.floor(value || 0)));
    setCart((current) => {
      const updated = { ...current };
      if (next) updated[product.id] = next; else delete updated[product.id];
      return updated;
    });
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      reseller_name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      notes: String(form.get("notes") ?? ""),
      items: lines.map((line) => ({ product_id: line.id, quantity: line.quantity })),
    };
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo guardar el pedido.");
      const text = [
        `PEDIDO MAYORISTA ${result.order_number}`,
        `Revendedor: ${payload.reseller_name}`,
        `Teléfono: ${payload.phone}`,
        "",
        ...lines.map((line) => `- ${line.name}: ${line.quantity} unidades`),
        "",
        `Total: ${total} unidades`,
        `Observaciones: ${payload.notes || "Sin observaciones"}`,
        "Pedido sujeto a confirmación de stock.",
      ].join("\n");
      setCart({});
      setMessage(`Pedido ${result.order_number} guardado correctamente.`);
      window.open(`https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear el pedido.");
    } finally {
      setSubmitting(false);
    }
  }

  return <>
    <header className="topbar"><div className="shell topbar-inner">
      <a className="brand" href="#inicio"><span className="brand-mark"><SprayCan size={21}/></span><div>PERFUME <span>STOCK</span></div></a>
      <a className="btn secondary" href="/admin">Administración</a>
    </div></header>
    <main id="inicio" className="shell">
      <section className="hero">
        <div><div className="eyebrow">Catálogo mayorista · stock en tiempo real</div><h1>Elegí perfumes.<br/>Armá tu pedido.</h1><p>Consultá disponibilidad exacta y enviá tu solicitud directamente a Agustín. Sin precios publicados.</p></div>
        <div className="hero-stat"><strong>{stockTotal}</strong><span>unidades disponibles en {initialProducts.length} modelos</span></div>
      </section>
      {!configured && <div className="notice">Vista local preparada: el catálogo usa el inventario inicial. Los pedidos se habilitan cuando conectemos tu proyecto de Supabase.</div>}
      <div className="toolbar">
        <label style={{position:"relative"}}><Search size={18} style={{position:"absolute",left:13,top:13,color:"#9d8da8"}}/><input className="field" style={{paddingLeft:42}} value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Buscar perfume..."/></label>
        <select className="select" value={gender} onChange={(event)=>setGender(event.target.value)}><option value="">Todos los géneros</option><option>Masculino</option><option>Femenino</option><option>Unisex</option><option>Sin clasificar</option></select>
        <select className="select" value={availability} onChange={(event)=>setAvailability(event.target.value)}><option value="">Toda disponibilidad</option><option value="available">Disponibles</option><option value="empty">Agotados</option></select>
      </div>
      <section className="product-grid">
        {visible.map((product) => <article className="product-card" key={product.id}>
          {product.photo_url ? <img className="product-image" src={product.photo_url} alt={product.name}/> : <div className="placeholder"><div><SprayCan size={36}/><strong>Foto pendiente</strong></div></div>}
          <div className="card-body"><div className="card-name">{product.name}</div><div className="meta"><span>{product.gender}</span><StockBadge product={product}/></div>
          <div className="qty"><button aria-label="Restar" onClick={()=>setQuantity(product,(cart[product.id]??0)-1)} disabled={!cart[product.id]}>−</button><input aria-label={`Cantidad de ${product.name}`} type="number" min={0} max={product.stock} value={cart[product.id]??0} onChange={(event)=>setQuantity(product,Number(event.target.value))}/><button aria-label="Sumar" onClick={()=>setQuantity(product,(cart[product.id]??0)+1)} disabled={(cart[product.id]??0)>=product.stock}>+</button></div></div>
        </article>)}
        {!visible.length && <div className="empty">No encontramos perfumes con esos filtros.</div>}
      </section>
    </main>
    <button className="btn cart-fab" onClick={()=>setCartOpen(true)}><ShoppingBag size={19}/> Ver pedido <b>{total}</b></button>
    {cartOpen && <div className="overlay" role="dialog" aria-modal="true"><aside className="drawer">
      <div className="drawer-head"><div><div className="eyebrow">Solicitud mayorista</div><h2>Tu pedido · {total} unidades</h2></div><button className="btn ghost" aria-label="Cerrar" onClick={()=>setCartOpen(false)}><X size={18}/></button></div>
      {!lines.length ? <div className="empty">Todavía no agregaste productos.</div> : <>
        {lines.map((line)=><div className="cart-line" key={line.id}>{line.photo_url?<img src={line.photo_url} alt=""/>:<div className="thumb placeholder"><SprayCan size={20}/></div>}<div><strong>{line.name}</strong><div className="meta">{line.stock} disponibles</div></div><div className="qty" style={{gridTemplateColumns:"34px 28px 34px"}}><button onClick={()=>setQuantity(line,line.quantity-1)}>−</button><b style={{textAlign:"center"}}>{line.quantity}</b><button onClick={()=>setQuantity(line,line.quantity+1)} disabled={line.quantity>=line.stock}>+</button></div></div>)}
        <form className="checkout" onSubmit={submitOrder}><h3>Datos del revendedor</h3><input className="field" name="name" required minLength={2} placeholder="Nombre o comercio"/><input className="field" name="phone" required minLength={6} placeholder="Teléfono de contacto"/><textarea className="textarea" name="notes" rows={3} maxLength={1000} placeholder="Observaciones (opcional)"/><button className="btn" disabled={submitting||!configured}>{submitting?"Guardando...":"Guardar pedido y abrir WhatsApp"}</button>{message&&<div className={message.startsWith("Pedido")?"success":"error"}>{message}</div>}</form>
      </>}
    </aside></div>}
  </>;
}

function StockBadge({ product }: { product: Product }) {
  if (product.stock === 0) return <span className="badge none">Agotado</span>;
  if (product.stock <= product.min_stock) return <span className="badge low">Últimas {product.stock}</span>;
  return <span className="badge ok">{product.stock} disponibles</span>;
}
