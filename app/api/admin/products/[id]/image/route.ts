import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);

function storagePath(photoUrl: string | null) {
  if (!photoUrl) return null;
  const marker = "/storage/v1/object/public/perfume-images/";
  const index = photoUrl.indexOf(marker);
  return index < 0 ? null : decodeURIComponent(photoUrl.slice(index + marker.length));
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const productId = Number(id);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !allowed.has(file.type) || file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Usá JPG, PNG o WebP de hasta 5 MB." }, { status: 400 });
  }
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${productId}/${crypto.randomUUID()}.${extension}`;
  const { data: current } = await auth.supabase.from("products").select("photo_url").eq("id", productId).single();
  const { error: uploadError } = await auth.supabase.storage.from("perfume-images").upload(path, file, { contentType: file.type });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });
  const { data: publicUrl } = auth.supabase.storage.from("perfume-images").getPublicUrl(path);
  const { error } = await auth.supabase.from("products").update({ photo_url: publicUrl.publicUrl, data_status: "foto_validada" }).eq("id", productId);
  if (error) {
    await auth.supabase.storage.from("perfume-images").remove([path]);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  const previousPath = storagePath(current?.photo_url ?? null);
  if (previousPath) await auth.supabase.storage.from("perfume-images").remove([previousPath]);
  return NextResponse.json({ photo_url: publicUrl.publicUrl });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const productId = Number(id);
  const { data: current } = await auth.supabase.from("products").select("photo_url").eq("id", productId).single();
  const { error } = await auth.supabase.from("products").update({ photo_url: null, data_status: "revisar" }).eq("id", productId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const previousPath = storagePath(current?.photo_url ?? null);
  if (previousPath) await auth.supabase.storage.from("perfume-images").remove([previousPath]);
  return NextResponse.json({ ok: true });
}
