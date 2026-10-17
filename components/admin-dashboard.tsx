"use client";

import { useMemo, useState } from "react";
import { SprayCan, Download, ImageOff, LogOut, PackagePlus, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Gender, Order, Product, StockMovement } from "@/lib/types";

type Tab = "inventory" | "orders" | "history";

export function AdminDashboard({ products: initialProducts, orders: initialOrders, movements, email }: { products: Product[]; orders: Order[]; movements: StockMovement[]; email: string }) {
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState(initialOrders);
  const [tab, setTab] = useState<Tab>("inventory");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string>("");
  const [message, setMessage] = useState("");
  const visible = useMemo(()=>products.filter((product)=>product.name.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es"))),[products,query]);
  const totalStock = products.reduce((sum,product)=>sum+product.stock,0);
  const lowStock = products.filter((product)=>product.stock>0&&product.stock<=product.min_stock).length;
  const pending = orders.filter((order)=>order.status==="pending").length;

  async function request(url:string, options:RequestInit) {
    setMessage("");
    const response=await fetch(url,options); const data=await response.json();
    if(!response.ok) throw new Error(data.error||"No se pudo completar la operación.");
    return data;
  }
  async function updateProduct(id:number, body:Record<string,unknown>) {
    setBusy(`p-${id}`);
    try { const data=await request(`/api/admin/products/${id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(body)}); setProducts((current)=>current.map((product)=>product.id===id?{...product,...body,...(data.stock!==undefined?{stock:data.stock}:{})}:product)); }
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
  async function deactivateProduct(id:number,name:string) {
    if (!window.confirm(`¿Desactivar ${name}? Ya no aparecerá en el catálogo.`)) return;
    setBusy(`p-${id}`);
    try { await request(`/api/admin/products/${id}`,{method:"DELETE"}); setProducts((current)=>current.filter((product)=>product.id!==id)); }
    catch(error){setMessage(error instanceof Error?error.message:"Error");} finally{setBusy("");}
  }
  async function orderAction(id:string,action:"confirm"|"reject"|"cancel") {
    setBusy(`o-${id}`);
    try { await request(`/api/admin/orders/${id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({action})}); setOrders((current)=>current.map((order)=>order.id===id?{...order,status:action==="confirm"?"confirmed":action==="reject"?"rejected":"cancelled"}:order)); window.location.reload(); }
    catch(error){setMessage(error instanceof Error?error.message:"Error"); setBusy("");}
  }
  async function addProduct(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form=new FormData(event.currentTarget);
    try { const created=await request("/api/admin/products",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:String(form.get("name")),gender:String(form.get("gender")),stock:Number(form.get("stock")),min_stock:Number(form.get("min_stock"))})}); setProducts((current)=>[created,...current]); event.currentTarget.reset(); }
    catch(error){setMessage(error instanceof Error?error.message:"Error");}
  }
  function exportCSV() {
    const rows=[["id","nombre","stock","genero","stock_minimo"],...products.map((p)=>[p.id,p.name,p.stock,p.gender,p.min_stock])];
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
    <div className="admin-head"><div className="brand"><span className="brand-mark"><SprayCan size={20}/></span><div>DISTRIBUIDORA <span>AYK STOCK</span><div style={{fontSize:11,color:"var(--muted)",fontWeight:500}}>{email}</div></div></div><div style={{display:"flex",gap:8}}><a className="btn ghost" href="/">Ver catálogo</a><button className="btn secondary" onClick={logout}><LogOut size={16}/></button></div></div>
    <div className="stats-grid"><Stat value={products.length} label="productos"/><Stat value={totalStock} label="unidades en stock"/><Stat value={lowStock} label="alertas de stock bajo"/><Stat value={pending} label="pedidos pendientes"/></div>
    {message&&<div className="notice" style={{marginBottom:12}}>{message}</div>}
    <div className="tabs"><button className={`btn ${tab!=="inventory"?"secondary":""}`} onClick={()=>setTab("inventory")}>Inventario</button><button className={`btn ${tab!=="orders"?"secondary":""}`} onClick={()=>setTab("orders")}>Pedidos ({pending})</button><button className={`btn ${tab!=="history"?"secondary":""}`} onClick={()=>setTab("history")}>Movimientos</button></div>
    {tab==="inventory"&&<>
      <form onSubmit={addProduct} className="toolbar" style={{gridTemplateColumns:"2fr 1fr 110px 110px auto"}}><input className="field" name="name" required placeholder="Nuevo perfume"/><select className="select" name="gender"><option>Sin clasificar</option><option>Masculino</option><option>Femenino</option><option>Unisex</option></select><input className="field" name="stock" type="number" min="0" defaultValue="0"/><input className="field" name="min_stock" type="number" min="0" defaultValue="3"/><button className="btn"><PackagePlus size={17}/></button></form>
      <div style={{display:"flex",gap:8,margin:"12px 0",flexWrap:"wrap"}}><input className="field" style={{maxWidth:360}} value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Buscar en inventario..."/><button className="btn secondary" onClick={exportCSV}><Download size={16}/> Exportar CSV</button><label className="btn secondary"><Upload size={16}/> Importar CSV<input hidden type="file" accept=".csv" onChange={(event)=>event.target.files?.[0]&&importCSV(event.target.files[0])}/></label></div>
      <div className="table-wrap"><table className="admin-table"><thead><tr><th>Foto</th><th>Producto</th><th>Género</th><th>Stock</th><th>Mínimo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{visible.map((product)=><tr key={product.id}><td>{product.photo_url?<img className="thumb" src={product.photo_url} alt=""/>:<div className="thumb placeholder"><SprayCan size={16}/></div>}<label style={{display:"block",fontSize:11,color:"var(--violet)",cursor:"pointer"}}>Cambiar<input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event)=>event.target.files?.[0]&&uploadImage(product.id,event.target.files[0])}/></label>{product.photo_url&&<button className="link-button" disabled={busy===`p-${product.id}`} onClick={()=>removeImage(product.id)}><ImageOff size={12}/> Quitar</button>}</td><td><input className="field" defaultValue={product.name} onBlur={(event)=>event.target.value!==product.name&&updateProduct(product.id,{name:event.target.value})}/><small style={{color:"var(--muted)"}}>ID {product.id}</small></td><td><select className="select" value={product.gender} onChange={(event)=>{const value=event.target.value as Gender;setProducts((current)=>current.map((p)=>p.id===product.id?{...p,gender:value}:p));updateProduct(product.id,{gender:value});}}><option>Masculino</option><option>Femenino</option><option>Unisex</option><option>Sin clasificar</option></select></td><td><div style={{display:"flex",gap:5,alignItems:"center"}}><button className="btn secondary" disabled={busy===`p-${product.id}`||product.stock===0} onClick={()=>updateProduct(product.id,{delta:-1})}>−</button><input className="field" style={{width:76,textAlign:"center"}} type="number" min="0" value={product.stock} onChange={(event)=>setProducts((current)=>current.map((p)=>p.id===product.id?{...p,stock:Number(event.target.value)}:p))} onBlur={(event)=>updateProduct(product.id,{stock:Number(event.target.value)})}/><button className="btn" disabled={busy===`p-${product.id}`} onClick={()=>updateProduct(product.id,{delta:1})}>+</button></div></td><td><input className="field" style={{width:72}} type="number" min="0" value={product.min_stock} onChange={(event)=>setProducts((current)=>current.map((p)=>p.id===product.id?{...p,min_stock:Number(event.target.value)}:p))} onBlur={(event)=>updateProduct(product.id,{min_stock:Number(event.target.value)})}/></td><td><span className={`badge ${product.stock===0?"none":product.stock<=product.min_stock?"low":"ok"}`}>{product.stock===0?"Agotado":product.stock<=product.min_stock?"Bajo":"Disponible"}</span></td><td><button className="btn danger" disabled={busy===`p-${product.id}`} onClick={()=>deactivateProduct(product.id,product.name)} aria-label={`Desactivar ${product.name}`}><Trash2 size={15}/></button></td></tr>)}</tbody></table></div>
    </>}
    {tab==="orders"&&<div className="stack">{orders.map((order)=><article className="stat-card" key={order.id}><div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><strong style={{fontSize:"1.1rem"}}>{order.order_number}</strong><div className="meta">{new Date(order.created_at).toLocaleString("es-AR")} · {order.reseller_name} · {order.phone}</div></div><span className={`badge ${order.status==="confirmed"?"ok":order.status==="pending"?"low":"none"}`}>{order.status}</span></div><div style={{margin:"10px 0"}}>{order.order_items?.map((item)=><div key={item.product_id}>{item.product_name} × {item.quantity}</div>)}</div>{order.notes&&<p style={{color:"var(--muted)"}}>{order.notes}</p>}<div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{order.status==="pending"&&<><button className="btn" disabled={busy===`o-${order.id}`} onClick={()=>orderAction(order.id,"confirm")}>Confirmar y descontar</button><button className="btn secondary" onClick={()=>orderAction(order.id,"reject")}>Rechazar</button></>}{order.status==="confirmed"&&<button className="btn danger" onClick={()=>orderAction(order.id,"cancel")}>Cancelar y reponer stock</button>}</div></article>)}{!orders.length&&<div className="empty">Todavía no hay pedidos.</div>}</div>}
    {tab==="history"&&<div className="table-wrap"><table className="admin-table"><thead><tr><th>Fecha</th><th>Producto</th><th>Movimiento</th><th>Antes</th><th>Después</th><th>Motivo</th></tr></thead><tbody>{movements.map((movement)=><tr key={movement.id}><td>{new Date(movement.created_at).toLocaleString("es-AR")}</td><td>{movement.products?.name??`#${movement.product_id}`}</td><td>{movement.quantity>0?`+${movement.quantity}`:movement.quantity}</td><td>{movement.stock_before}</td><td>{movement.stock_after}</td><td>{movement.reason??movement.movement_type}</td></tr>)}</tbody></table></div>}
  </main>;
}

function Stat({value,label}:{value:number;label:string}){return <div className="stat-card"><strong>{value}</strong><span>{label}</span></div>}
function parseLine(line:string){const values:string[]=[];let current="",quoted=false;for(let index=0;index<line.length;index++){const char=line[index];if(char==='"'){if(quoted&&line[index+1]==='"'){current+='"';index++;}else quoted=!quoted;}else if(char===","&&!quoted){values.push(current);current="";}else current+=char;}values.push(current);return values;}
