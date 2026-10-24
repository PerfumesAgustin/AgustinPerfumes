"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CircleCheck, Flame, MessageCircle, Minus, Plus, Search, ShoppingBag, SprayCan, X, Zap } from "lucide-react";
import Image from "next/image";
import type { CatalogSection, Product } from "@/lib/types";
import { ORDER_RECIPIENTS } from "@/lib/config";
import { formatOrderLabel } from "@/lib/order-number";
import { getProductKindLabel, groupOrderItems } from "@/lib/product-order-label";

type Cart = Record<number, number>;
type CompletedOrder = { orderNumber: string; whatsappText: string; groupTotals: { label: string; total: number }[] };

export function Catalog({ initialProducts, configured }: { initialProducts: Product[]; configured: boolean }) {
  const [query, setQuery] = useState("");
  const [catalogSection, setCatalogSection] = useState<CatalogSection>("extractos");
  const [gender, setGender] = useState("");
  const [availability, setAvailability] = useState("");
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null);
  const [zoomedProduct, setZoomedProduct] = useState<Product | null>(null);
  const [customer, setCustomer] = useState({ name: "", phone: "", notes: "" });

  const sectionProducts = useMemo(() => initialProducts
    .filter((product) => product.catalog_section === catalogSection)
    .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" })), [initialProducts, catalogSection]);

  const visible = useMemo(() => sectionProducts.filter((product) => {
    const matchesText = product.name.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es"));
    const matchesGender = !gender || product.gender === gender;
    const matchesAvailability = !availability || (availability === "available" ? product.stock > 0 : product.stock === 0);
    return matchesText && matchesGender && matchesAvailability;
  }), [sectionProducts, query, gender, availability]);

  const sectionCounts = useMemo(() => ({
    extractos: initialProducts.filter((product) => product.catalog_section === "extractos").length,
    tubitos_arabes: initialProducts.filter((product) => product.catalog_section === "tubitos_arabes").length,
  }), [initialProducts]);

  const lines = initialProducts.filter((product) => (cart[product.id] ?? 0) > 0).map((product) => ({ ...product, quantity: cart[product.id] }));
  const orderGroups = groupOrderItems(lines);
  const total = lines.reduce((sum, line) => sum + line.quantity, 0);

  useEffect(() => {
    if (!zoomedProduct && !cartOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (zoomedProduct) setZoomedProduct(null); else setCartOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [zoomedProduct, cartOpen]);

  function setQuantity(product: Product, value: number) {
    const next = Math.min(product.stock, Math.max(0, Math.floor(value || 0)));
    if (next > 0) setCompletedOrder(null);
    setCart((current) => {
      const updated = { ...current };
      if (next) updated[product.id] = next; else delete updated[product.id];
      return updated;
    });
  }

  function selectCatalogSection(section: CatalogSection) {
    setCatalogSection(section);
    setQuery("");
    setGender("");
    setAvailability("");
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const payload = {
      reseller_name: customer.name,
      phone: customer.phone,
      notes: customer.notes,
      items: lines.map((line) => ({ product_id: line.id, quantity: line.quantity })),
    };
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo guardar el pedido.");
      const text = [
        `PEDIDO MAYORISTA · ${formatOrderLabel(result.order_number)}`,
        `Revendedor: ${payload.reseller_name}`,
        `Teléfono: ${payload.phone}`,
        "",
        ...orderGroups.flatMap((group) => [
          `${group.label.toUpperCase()} (${group.total} unidades)`,
          ...group.items.map((line) => `- ${line.name} × ${line.quantity}`),
          "",
        ]),
        `TOTAL GENERAL: ${total} unidades`,
        `Observaciones: ${payload.notes || "Sin observaciones"}`,
        "Pedido sujeto a confirmación de stock.",
      ].join("\n");
      setCart({});
      setCustomer({ name: "", phone: "", notes: "" });
      setCompletedOrder({ orderNumber: result.order_number, whatsappText: text, groupTotals: orderGroups.map(({ label, total: groupTotal }) => ({ label, total: groupTotal })) });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear el pedido.");
    } finally {
      setSubmitting(false);
    }
  }

  return <>
    <header className="topbar"><div className="shell topbar-inner">
      <a className="brand" href="#inicio" aria-label="AYK · Extractos de fábrica"><Image className="brand-logo" src="/ayk-logo-only.webp" alt="AYK" width={320} height={320} sizes="(max-width: 680px) 52px, 62px" loading="eager" fetchPriority="high"/><span className="brand-name">Extractos de fábrica</span></a>
      <a className="btn secondary" href="/admin">Administración</a>
    </div></header>
    <main id="inicio" className="shell">
      {!configured && <div className="notice">Vista local preparada: el catálogo usa el inventario inicial. Los pedidos se habilitan cuando conectemos tu proyecto de Supabase.</div>}
      <nav className="catalog-switcher" aria-label="Secciones del catálogo">
        <button className={catalogSection === "extractos" ? "active" : ""} type="button" aria-pressed={catalogSection === "extractos"} onClick={()=>selectCatalogSection("extractos")}><span>Extractos de fábrica</span><b>{sectionCounts.extractos}</b></button>
        <button className={catalogSection === "tubitos_arabes" ? "active" : ""} type="button" aria-pressed={catalogSection === "tubitos_arabes"} onClick={()=>selectCatalogSection("tubitos_arabes")}><span>Tubitos Árabes</span><b>{sectionCounts.tubitos_arabes}</b></button>
      </nav>
      <div className="toolbar">
        <label style={{position:"relative"}}><Search size={18} style={{position:"absolute",left:13,top:13,color:"#9d8da8"}}/><input className="field" style={{paddingLeft:42}} value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Buscar perfume..."/></label>
        <select className="select" value={gender} onChange={(event)=>setGender(event.target.value)}><option value="">Todos los géneros</option><option>Masculino</option><option>Femenino</option><option>Unisex</option><option>Infantil</option><option>Sin clasificar</option></select>
        <select className="select" value={availability} onChange={(event)=>setAvailability(event.target.value)}><option value="">Toda disponibilidad</option><option value="available">Disponibles</option><option value="empty">Agotados</option></select>
      </div>
      <section className="product-grid">
        {visible.map((product,index) => <article className="product-card" key={product.id}>
          {product.photo_url ? <button className="product-image-button" type="button" onClick={()=>setZoomedProduct(product)} aria-label={`Ampliar imagen de ${product.name}`}><Image className="product-image" src={product.photo_url} alt={product.name} width={640} height={704} sizes="(max-width: 680px) 50vw, (max-width: 980px) 33vw, 25vw" loading={index<4?"eager":"lazy"} fetchPriority={index<4?"high":"auto"}/><span>{product.inspired_by ? "Ver detalles" : "Ver imagen"}</span></button> : <div className="placeholder"><div><SprayCan size={36}/><strong>Foto pendiente</strong></div></div>}
          <div className="card-body"><div className="card-name">{product.name}</div>{product.inspired_by&&<div className="inspiration">Inspirado en {product.inspired_by}</div>}<div className="meta"><span>{product.gender}</span><StockBadge product={product}/></div>
          <div className="qty"><button aria-label={`Restar ${product.name}`} onClick={()=>setQuantity(product,(cart[product.id]??0)-1)} disabled={!cart[product.id]}><Minus size={16}/></button><input aria-label={`Cantidad de ${product.name}`} type="number" min={0} max={product.stock} value={cart[product.id]??0} onChange={(event)=>setQuantity(product,Number(event.target.value))}/><button aria-label={`Sumar ${product.name}`} onClick={()=>setQuantity(product,(cart[product.id]??0)+1)} disabled={(cart[product.id]??0)>=product.stock}><Plus size={16}/></button></div></div>
        </article>)}
        {!visible.length && <div className="empty">No encontramos productos en {catalogSection === "tubitos_arabes" ? "Tubitos Árabes" : "Extractos de fábrica"} con esos filtros.</div>}
      </section>
    </main>
    <button className="btn cart-fab" onClick={()=>setCartOpen(true)}><ShoppingBag size={19}/> Ver pedido <b>{total}</b></button>
    {cartOpen && <div className="overlay" role="dialog" aria-modal="true" aria-label="Resumen del pedido" onClick={()=>setCartOpen(false)}><aside className="drawer" onClick={(event)=>event.stopPropagation()}>
      <div className="drawer-head"><div><div className="eyebrow">{completedOrder ? "Pedido confirmado" : "Solicitud mayorista"}</div><h2 className={completedOrder ? "confirmed-order-number" : ""}>{completedOrder ? formatOrderLabel(completedOrder.orderNumber) : `Tu pedido · ${lines.length} ${lines.length === 1 ? "modelo" : "modelos"} · ${total} ${total === 1 ? "unidad" : "unidades"}`}</h2></div><button className="btn ghost" aria-label="Cerrar" onClick={()=>setCartOpen(false)}><X size={18}/></button></div>
      {completedOrder ? <div className="order-complete">
        <div className="order-confirmation-card"><div className="order-complete-icon"><CircleCheck size={34}/></div><div><span className="confirmation-kicker">¡Todo listo!</span><h3>Pedido guardado en Administración</h3><p>Ya recibimos el pedido. Ahora elegí a quién enviarlo por WhatsApp.</p></div><div className="completed-group-totals">{completedOrder.groupTotals.map((group)=><div key={group.label}><span>{group.label}</span><strong>{group.total} unidades</strong></div>)}</div></div>
        <div className="recipient-actions">
          {ORDER_RECIPIENTS.map((recipient)=><a className="btn whatsapp-recipient" key={recipient.id} href={`https://wa.me/${recipient.phone}?text=${encodeURIComponent(completedOrder.whatsappText)}`} target="_blank" rel="noreferrer"><span className="recipient-avatar">{recipient.name.charAt(0)}</span><span className="recipient-copy"><strong>Enviar a {recipient.name}</strong><small>{recipient.displayPhone}</small></span><MessageCircle size={20}/></a>)}
        </div>
        <button className="btn secondary continue-shopping" type="button" onClick={()=>{setCompletedOrder(null);setMessage("");setCartOpen(false);}}><ArrowLeft size={17}/> Volver al catálogo</button>
        <p className="order-saved-note">Aunque no abras WhatsApp, el pedido ya quedó guardado.</p>
      </div> : <>
      <button className="btn secondary continue-shopping" type="button" onClick={()=>setCartOpen(false)}><ArrowLeft size={17}/> Seguir pidiendo</button>
      {!lines.length ? <div className="empty">Todavía no agregaste productos.</div> : <>
        {orderGroups.map((group)=><section className="cart-order-group" key={group.section}><div className="order-group-head"><strong>{group.label}</strong><span>{group.total} {group.total === 1 ? "unidad" : "unidades"}</span></div>{group.items.map((line)=><div className="cart-line" key={line.id}>{line.photo_url?<Image src={line.photo_url} alt="" width={54} height={62} sizes="54px"/>:<div className="thumb placeholder"><SprayCan size={20}/></div>}<div><span className="order-item-kind">{getProductKindLabel(line.catalog_section)}</span><strong>{line.name}</strong><div className="meta">{line.stock} disponibles</div></div><div className="qty" style={{gridTemplateColumns:"34px 28px 34px"}}><button aria-label={`Restar ${line.name}`} onClick={()=>setQuantity(line,line.quantity-1)}><Minus size={14}/></button><b style={{textAlign:"center"}}>{line.quantity}</b><button aria-label={`Sumar ${line.name}`} onClick={()=>setQuantity(line,line.quantity+1)} disabled={line.quantity>=line.stock}><Plus size={14}/></button></div></div>)}</section>)}
        <form className="checkout" onSubmit={submitOrder}><h3>Datos del revendedor</h3><input className="field" name="name" required minLength={2} placeholder="Nombre o comercio" value={customer.name} onChange={(event)=>setCustomer((current)=>({...current,name:event.target.value}))}/><input className="field" name="phone" required minLength={6} placeholder="Teléfono de contacto" value={customer.phone} onChange={(event)=>setCustomer((current)=>({...current,phone:event.target.value}))}/><textarea className="textarea" name="notes" rows={3} maxLength={1000} placeholder="Observaciones (opcional)" value={customer.notes} onChange={(event)=>setCustomer((current)=>({...current,notes:event.target.value}))}/><button className="btn" disabled={submitting||!configured}>{submitting?"Guardando...":"Confirmar y guardar pedido"}</button>{message&&<div className="error">{message}</div>}</form>
      </>}
      </>}
    </aside></div>}
    {zoomedProduct?.photo_url && <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={`Imagen ampliada de ${zoomedProduct.name}`} onClick={()=>setZoomedProduct(null)}>
      <button className="lightbox-close" type="button" aria-label="Cerrar imagen" onClick={()=>setZoomedProduct(null)}><X size={22}/></button>
      <figure onClick={(event)=>event.stopPropagation()}>
        <Image src={zoomedProduct.photo_url} alt={zoomedProduct.name} width={1200} height={1320} sizes="92vw" priority/>
        <figcaption><strong>{zoomedProduct.name}</strong>{zoomedProduct.inspired_by&&<span>Inspirado en {zoomedProduct.inspired_by}</span>}</figcaption>
      </figure>
    </div>}
  </>;
}

function StockBadge({ product }: { product: Product }) {
  if (product.stock === 0) return <span className="badge none"><X size={12}/> Agotado</span>;
  if (product.stock === 1) return <span className="badge low hot"><Flame size={13}/> Última unidad</span>;
  if (product.stock <= product.min_stock) return <span className="badge low"><Zap size={12}/> Últimas {product.stock}</span>;
  return <span className="badge ok"><CircleCheck size={12}/> {product.stock} disponibles</span>;
}
