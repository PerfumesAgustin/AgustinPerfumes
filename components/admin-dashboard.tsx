"use client";

import { useMemo, useState } from "react";
import { SprayCan, CheckCircle2, DatabaseBackup, Download, Eye, EyeOff, ImageOff, LogOut, PackagePlus, RotateCcw, Trash2, Upload, XCircle } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { activeInventorySummary } from "@/lib/catalog-utils";
import type { CatalogSection, Gender, Order, OrderItem, Product, StockMovement } from "@/lib/types";
import { formatOrderLabel } from "@/lib/order-number";
import { cleanProductOrderName, groupOrderItems, inferProductSection } from "@/lib/product-order-label";

type Tab = "inventory" | "orders" | "history";

export function AdminDashboard({ products: initialProducts, orders: initialOrders, movements, email }: { products: Product[]; orders: Order[]; movements: StockMovement[]; email: string }) {
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState(initialOrders);
  const [tab, setTab] = useState<Tab>("inventory");
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<"active" | "archived" | "all">("all");
  const [catalogSection, setCatalogSection] = useState<"all" | CatalogSection>("all");
  const [photoFilter, setPhotoFilter] = useState<"all" | "with_photo" | "without_photo">("all");
  const [busy, setBusy] = useState<string>("");
  const [message, setMessage] = useState("");
  const photoFilterBase = useMemo(()=>products.filter((product)=>(visibility === "all" || (visibility === "active" ? product.is_active : !product.is_active)) && (catalogSection === "all" || product.catalog_section === catalogSection)),[products,visibility,catalogSection]);
  const withPhotoCount = useMemo(()=>photoFilterBase.filter((product)=>Boolean(product.photo_url)).length,[photoFilterBase]);
  const withoutPhotoCount = photoFilterBase.length-withPhotoCount;
  const visible = useMemo(()=>photoFilterBase.filter((product)=>product.name.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")) && (photoFilter === "all" || (photoFilter === "with_photo" ? Boolean(product.photo_url) : !product.photo_url))),[photoFilterBase,query,photoFilter]);
  const summary = useMemo(()=>activeInventorySummary(products),[products]);
  const productSections = useMemo(()=>new Map(products.map((product)=>[product.id,product.catalog_section])),[products]);
  const pending = orders.filter((order)=>order.status==="pending").length;

  async function request(url:string, options:RequestInit) {
    setMessage("");
    const response=await fetch(url,options); const data=await response.json();
    if(!response.ok) throw new Error(data.error||"No se pudo completar la operación.");
    return data;
  }
  async function updateProduct(id:number, body:Record<string,unknown>) {
    setBusy(`p-${id}`);
    try { const data=await request(`/api/admin/products/${id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(body)}); setProducts((current)=>current.map((product)=>product.id===id?{...product,...body,...data}:product)); }
    catch(error){setMessage(error instanceof Error?error.message:"Error");} finally{setBusy("");}
  }
  async function uploadImage(id:number,file:File) {
    setBusy(`p-${id}`); const form=new FormData(); form.set("file",file);
    try { const data=await request(`/api/admin/products/${id}/image`,{method:"POST",body:form}); setProducts((current)=>current.map((product)=>product.id===id?{...product,photo_url:data.photo_url}:product)); }
    catch(error){setMessage(error instanceof Error?error.message:"Error");} finally{setBusy("");}
  }
  async function removeImage(id:number) {
    if (!window.confirm("¿Quitar la foto de este producto?")) return;
    setBusy(`p-${id}`);
    try { await request(`/api/admin/products/${id}/image`,{method:"DELETE"}); setProducts((current)=>current.map((product)=>product.id===id?{...product,photo_url:null,data_status:"revisar"}:product)); }
    catch(error){setMessage(error instanceof Error?error.message:"Error");} finally{setBusy("");}
  }
  async function deleteProduct(id:number,name:string) {
    if (!window.confirm(`¿Eliminar definitivamente “${name}” del inventario?\n\nDejará de aparecer en el panel y en el catálogo. Los pedidos anteriores conservarán su historial.`)) return;
    setBusy(`p-${id}`);
    try { await request(`/api/admin/products/${id}`,{method:"DELETE"}); setProducts((current)=>current.filter((product)=>product.id!==id)); setMessage(`${name} fue eliminado del inventario.`); }
    catch(error){setMessage(error instanceof Error?error.message:"Error");} finally{setBusy("");}
  }
  async function orderAction(id:string,action:"confirm"|"reject"|"cancel"|"reopen") {
    setBusy(`o-${id}`);
    try { await request(`/api/admin/orders/${id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({action})}); setOrders((current)=>current.map((order)=>order.id===id?{...order,status:action==="confirm"?"confirmed":action==="reject"?"rejected":action==="reopen"?"pending":"cancelled"}:order)); window.location.reload(); }
    catch(error){setMessage(error instanceof Error?error.message:"Error"); setBusy("");}
  }
  async function addProduct(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form=new FormData(event.currentTarget);
    try { const created=await request("/api/admin/products",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:String(form.get("name")),catalog_section:String(form.get("catalog_section")),gender:String(form.get("gender")),stock:Number(form.get("stock")),min_stock:Number(form.get("min_stock"))})}); setProducts((current)=>[created,...current]); event.currentTarget.reset(); }
    catch(error){setMessage(error instanceof Error?error.message:"Error");}
  }
  function exportCSV() {
    const rows=[["id","nombre","seccion","stock","genero","stock_minimo"],...products.map((p)=>[p.id,p.name,p.catalog_section,p.stock,p.gender,p.min_stock])];
    const csv="\uFEFF"+rows.map((row)=>row.map((value)=>`"${String(value).replaceAll('"','""')}"`).join(",")).join("\r\n");
    const link=document.createElement("a"); link.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})); link.download="inventario_perfumes.csv"; link.click(); URL.revokeObjectURL(link.href);
  }
  async function importCSV(file:File) {
    const text=await file.text(); const lines=text.replace(/^\uFEFF/,"").split(/\r?\n/).filter(Boolean); const header=parseLine(lines.shift()??"").map((item)=>item.toLowerCase());
    const idIndex=header.indexOf("id"),stockIndex=header.indexOf("stock"); if(idIndex<0||stockIndex<0){setMessage("El CSV necesita columnas id y stock.");return;}
    const rows=lines.map(parseLine).map((row)=>({id:Number(row[idIndex]),stock:Number(row[stockIndex])})).filter((row)=>Number.isInteger(row.id)&&Number.isInteger(row.stock)&&row.stock>=0);
    try { const data=await request("/api/admin/import",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({rows})}); setMessage(`${data.updated} productos actualizados.`); window.location.reload(); }
    catch(error){setMessage(error instanceof Error?error.message:"Error");}
  }
  async function logout(){await createClient().auth.signOut();window.location.href="/admin/login";}

  return <main className="admin-shell">
    <div className="admin-head"><div className="brand"><Image className="brand-logo" src="/ayk-logo-only.webp" alt="AYK" width={320} height={320} sizes="62px" priority/><div><div className="brand-name">Extractos de fábrica</div><div style={{fontSize:11,color:"var(--muted)",fontWeight:500}}>{email}</div></div></div><div style={{display:"flex",gap:8}}><a className="btn ghost" href="/">Ver catálogo</a><button className="btn secondary" onClick={logout}><LogOut size={16}/></button></div></div>
    <div className="stats-grid"><Stat value={summary.products} label="productos activos"/><Stat value={summary.units} label="unidades activas"/><Stat value={summary.lowStock} label="alertas de stock bajo"/><Stat value={pending} label="pedidos pendientes"/></div>
    {message&&<div className="notice" style={{marginBottom:12}}>{message}</div>}
    <div className="tabs"><button className={`btn ${tab!=="inventory"?"secondary":""}`} onClick={()=>setTab("inventory")}>Inventario</button><button className={`btn ${tab!=="orders"?"secondary":""}`} onClick={()=>setTab("orders")}>Pedidos ({pending})</button><button className={`btn ${tab!=="history"?"secondary":""}`} onClick={()=>setTab("history")}>Movimientos</button></div>
    {tab==="inventory"&&<>
      <form onSubmit={addProduct} className="toolbar admin-product-form"><input className="field" name="name" required placeholder="Nuevo producto"/><select className="select" name="catalog_section"><option value="extractos">Extractos de fábrica</option><option value="tubitos_arabes">Tubitos Árabes</option></select><select className="select" name="gender"><option>Sin clasificar</option><option>Masculino</option><option>Femenino</option><option>Unisex</option><option>Infantil</option></select><input className="field" name="stock" type="number" min="0" defaultValue="0"/><input className="field" name="min_stock" type="number" min="0" defaultValue="3"/><button className="btn"><PackagePlus size={17}/></button></form>
      <div className="admin-inventory-toolbar"><input className="field" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Buscar en inventario..."/><select className="select" value={catalogSection} onChange={(event)=>setCatalogSection(event.target.value as typeof catalogSection)}><option value="all">Todas las secciones</option><option value="extractos">Extractos de fábrica</option><option value="tubitos_arabes">Tubitos Árabes</option></select><select className="select" value={visibility} onChange={(event)=>setVisibility(event.target.value as typeof visibility)}><option value="active">Publicaciones activas</option><option value="archived">Publicaciones pausadas</option><option value="all">Todas las publicaciones</option></select><select className="select" value={photoFilter} onChange={(event)=>setPhotoFilter(event.target.value as typeof photoFilter)}><option value="all">Todas las fotos ({photoFilterBase.length})</option><option value="with_photo">Con foto ({withPhotoCount})</option><option value="without_photo">Sin foto ({withoutPhotoCount})</option></select><button className="btn secondary" onClick={exportCSV}><Download size={16}/> Exportar CSV</button><label className="btn secondary"><Upload size={16}/> Importar CSV<input hidden type="file" accept=".csv" onChange={(event)=>event.target.files?.[0]&&importCSV(event.target.files[0])}/></label><a className="btn secondary" href="/api/admin/backup"><DatabaseBackup size={16}/> Descargar respaldo</a></div>
      <div className="table-wrap"><table className="admin-table"><thead><tr><th>Foto</th><th>Producto</th><th>Sección</th><th>Género</th><th>Stock</th><th>Mínimo</th><th>Estado de stock</th><th>Publicación</th><th>Eliminar</th></tr></thead><tbody>{visible.map((product)=><tr key={product.id}><td>{product.photo_url?<Image className="thumb" src={product.photo_url} alt="" width={48} height={56} sizes="48px"/>:<div className="thumb placeholder"><SprayCan size={16}/></div>}<label style={{display:"block",fontSize:11,color:"var(--violet)",cursor:"pointer"}}>Cambiar<input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event)=>event.target.files?.[0]&&uploadImage(product.id,event.target.files[0])}/></label>{product.photo_url&&<button className="link-button" disabled={busy===`p-${product.id}`} onClick={()=>removeImage(product.id)}><ImageOff size={12}/> Quitar</button>}</td><td><input className="field" defaultValue={product.name} onBlur={(event)=>event.target.value!==product.name&&updateProduct(product.id,{name:event.target.value})}/><small style={{color:"var(--muted)"}}>ID {product.id}</small></td><td><select className="select" value={product.catalog_section} onChange={(event)=>{const value=event.target.value as CatalogSection;setProducts((current)=>current.map((p)=>p.id===product.id?{...p,catalog_section:value}:p));updateProduct(product.id,{catalog_section:value});}}><option value="extractos">Extractos</option><option value="tubitos_arabes">Tubitos</option></select></td><td><select className="select" value={product.gender} onChange={(event)=>{const value=event.target.value as Gender;setProducts((current)=>current.map((p)=>p.id===product.id?{...p,gender:value}:p));updateProduct(product.id,{gender:value});}}><option>Masculino</option><option>Femenino</option><option>Unisex</option><option>Infantil</option><option>Sin clasificar</option></select></td><td><div style={{display:"flex",gap:5,alignItems:"center"}}><button className="btn secondary" disabled={busy===`p-${product.id}`||product.stock===0} onClick={()=>updateProduct(product.id,{delta:-1})}>−</button><input className="field" style={{width:76,textAlign:"center"}} type="number" min="0" value={product.stock} onChange={(event)=>setProducts((current)=>current.map((p)=>p.id===product.id?{...p,stock:Number(event.target.value)}:p))} onBlur={(event)=>updateProduct(product.id,{stock:Number(event.target.value)})}/><button className="btn" disabled={busy===`p-${product.id}`} onClick={()=>updateProduct(product.id,{delta:1})}>+</button></div></td><td><input className="field" style={{width:72}} type="number" min="0" value={product.min_stock} onChange={(event)=>setProducts((current)=>current.map((p)=>p.id===product.id?{...p,min_stock:Number(event.target.value)}:p))} onBlur={(event)=>updateProduct(product.id,{min_stock:Number(event.target.value)})}/></td><td><span className={`badge ${product.stock===0?"none":product.stock<=product.min_stock?"low":"ok"}`}>{product.stock===0?"Agotado":product.stock<=product.min_stock?"Bajo":"Disponible"}</span></td><td><button className={`btn publication-toggle ${product.is_active?"published":"paused"}`} disabled={busy===`p-${product.id}`||product.stock===0} onClick={()=>updateProduct(product.id,{is_active:!product.is_active})} aria-pressed={product.is_active} aria-label={product.stock===0?`${product.name} se publicará automáticamente cuando tenga stock`:product.is_active?`Pausar publicación de ${product.name}`:`Publicar ${product.name}`} title={product.stock===0?"Se publicará automáticamente cuando vuelva a tener stock":undefined}>{product.is_active?<><Eye size={15}/> Publicada</>:<><EyeOff size={15}/> Pausada</>}</button></td><td><button className="btn delete-product" disabled={busy===`p-${product.id}`} onClick={()=>deleteProduct(product.id,product.name)} aria-label={`Eliminar definitivamente ${product.name}`} title="Eliminar del inventario"><Trash2 size={16}/></button></td></tr>)}{visible.length===0&&<tr><td colSpan={9}><div className="admin-empty-filter">No hay productos que coincidan con estos filtros.</div></td></tr>}</tbody></table></div>
    </>}
    {tab==="orders"&&<div className="stack">{orders.map((order)=>{const status=orderStatusPresentation(order.status);return <article className={`stat-card order-card status-${order.status}`} key={order.id}><div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><strong style={{fontSize:"1.1rem"}}>{formatOrderLabel(order.order_number)}</strong><div className="meta">{new Date(order.created_at).toLocaleString("es-AR")} · {order.reseller_name} · {order.phone}</div></div><span className={`badge ${status.className}`}>{status.label}</span></div><OrderItemsSummary items={order.order_items??[]} productSections={productSections}/>{order.notes&&<p style={{color:"var(--muted)"}}>{order.notes}</p>}{order.status==="rejected"&&<p className="reopen-hint">El pedido se conserva. Podés reabrirlo si el cliente vuelve.</p>}<div className="order-actions">{order.status==="pending"&&<><button className="btn" disabled={busy===`o-${order.id}`} onClick={()=>orderAction(order.id,"confirm")}><CheckCircle2 size={16}/> Confirmar pedido</button><button className="btn reject" disabled={busy===`o-${order.id}`} onClick={()=>orderAction(order.id,"reject")}><XCircle size={16}/> Rechazar</button></>}{order.status==="rejected"&&<button className="btn reopen" disabled={busy===`o-${order.id}`} onClick={()=>orderAction(order.id,"reopen")}><RotateCcw size={16}/> Reabrir pedido</button>}{order.status==="confirmed"&&<button className="btn danger" disabled={busy===`o-${order.id}`} onClick={()=>orderAction(order.id,"cancel")}><RotateCcw size={16}/> Cancelar y reponer stock</button>}</div></article>})}{!orders.length&&<div className="empty">Todavía no hay pedidos.</div>}</div>}
    {tab==="history"&&<div className="table-wrap"><table className="admin-table"><thead><tr><th>Fecha</th><th>Producto</th><th>Movimiento</th><th>Antes</th><th>Después</th><th>Motivo</th></tr></thead><tbody>{movements.map((movement)=><tr key={movement.id}><td>{new Date(movement.created_at).toLocaleString("es-AR")}</td><td>{movement.products?.name??`#${movement.product_id}`}</td><td>{movement.quantity>0?`+${movement.quantity}`:movement.quantity}</td><td>{movement.stock_before}</td><td>{movement.stock_after}</td><td>{movement.reason??movement.movement_type}</td></tr>)}</tbody></table></div>}
  </main>;
}

function Stat({value,label}:{value:number;label:string}){return <div className="stat-card"><strong>{value}</strong><span>{label}</span></div>}
function orderStatusPresentation(status:Order["status"]){
  if(status==="confirmed") return {label:"Confirmado",className:"ok"};
  if(status==="pending") return {label:"Pendiente",className:"low"};
  if(status==="rejected") return {label:"Rechazado",className:"none"};
  return {label:"Cancelado",className:"none"};
}
function OrderItemsSummary({items,productSections}:{items:OrderItem[];productSections:Map<number,CatalogSection>}) {
  const groups=groupOrderItems(items.map((item)=>({...item,catalog_section:productSections.get(item.product_id)??inferProductSection(item.product_name)})));
  return <div className="admin-order-groups">{groups.map((group)=><section key={group.section}><div className="order-group-head"><strong>{group.label}</strong><span>{group.total} {group.total===1?"unidad":"unidades"}</span></div>{group.items.map((item)=><div className="admin-order-line" key={item.product_id}><span>{cleanProductOrderName(item.product_name)}</span><b>× {item.quantity}</b></div>)}</section>)}<div className="admin-order-total"><span>Total general</span><strong>{items.reduce((sum,item)=>sum+item.quantity,0)} unidades</strong></div></div>;
}
function parseLine(line:string){const values:string[]=[];let current="",quoted=false;for(let index=0;index<line.length;index++){const char=line[index];if(char==='"'){if(quoted&&line[index+1]==='"'){current+='"';index++;}else quoted=!quoted;}else if(char===","&&!quoted){values.push(current);current="";}else current+=char;}values.push(current);return values;}
