"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { FormState } from "@/lib/forms";
import type { SupabaseServerClient } from "@/lib/supabase/types";
import {
  certificateSchema,
  checkUpload,
  membershipSchema,
} from "@/lib/validation/documents";
import { actionCtx, dbError, zodErrors } from "./_helpers";

const BUCKET = "private-documents";

type DocKind = "identity" | "medical" | "membership" | "consent" | "payment" | "other";

/**
 * Carica un file nel bucket privato e crea la riga `private_documents`.
 * Va invocata solo dopo `actionCtx("documents.manage")`.
 */
async function uploadPrivateDocument(
  supabase: SupabaseServerClient,
  orgId: string,
  file: File,
  kind: DocKind,
  link: { athlete_id?: string; guardian_id?: string; coach_id?: string },
): Promise<{ documentId: string } | { error: string }> {
  const bad = checkUpload(file);
  if (bad) return { error: bad };

  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const year = new Date().getFullYear();
  const path = `${orgId}/${year}/${crypto.randomUUID()}.${ext || "bin"}`;

  const up = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) return { error: "Caricamento del file non riuscito." };

  const { data, error } = await supabase
    .from("private_documents")
    .insert({
      organization_id: orgId,
      kind,
      storage_bucket: BUCKET,
      object_path: path,
      original_filename: file.name.slice(0, 200),
      content_type: file.type || "application/octet-stream",
      byte_size: file.size,
      ...link,
    })
    .select("id")
    .single();

  if (error || !data) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: dbError(error ?? { message: "" }) };
  }
  return { documentId: data.id };
}

async function removePrivateDocument(
  supabase: SupabaseServerClient,
  orgId: string,
  documentId: string,
): Promise<void> {
  const { data: doc } = await supabase
    .from("private_documents")
    .select("object_path")
    .eq("id", documentId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (doc?.object_path) {
    await supabase.storage.from(BUCKET).remove([doc.object_path]);
  }
  await supabase
    .from("private_documents")
    .delete()
    .eq("id", documentId)
    .eq("organization_id", orgId);
}

function fileFrom(fd: FormData): File | null {
  const f = fd.get("document");
  return f instanceof File && f.size > 0 ? f : null;
}

// ==================================================== Certificati medici ===
function readCertificate(fd: FormData) {
  return {
    athlete_id: String(fd.get("athlete_id") ?? ""),
    certificate_type: String(fd.get("certificate_type") ?? ""),
    issued_on: String(fd.get("issued_on") ?? ""),
    expires_on: String(fd.get("expires_on") ?? ""),
    status: String(fd.get("status") ?? "valid"),
  };
}

export async function createCertificate(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("documents.manage");
  if (!c.ok) return c.state;

  const parsed = certificateSchema.safeParse(readCertificate(fd));
  if (!parsed.success) return zodErrors(parsed.error);

  const { data: athlete } = await c.supabase
    .from("athletes")
    .select("id")
    .eq("id", parsed.data.athlete_id)
    .eq("organization_id", c.org.organizationId)
    .maybeSingle();
  if (!athlete) return { message: "Atleta non trovato." };

  let documentId: string | null = null;
  const file = fileFrom(fd);
  if (file) {
    const res = await uploadPrivateDocument(
      c.supabase,
      c.org.organizationId,
      file,
      "medical",
      { athlete_id: parsed.data.athlete_id },
    );
    if ("error" in res) return { message: res.error };
    documentId = res.documentId;
  }

  const { data, error } = await c.supabase
    .from("medical_certificates")
    .insert({
      ...parsed.data,
      organization_id: c.org.organizationId,
      document_id: documentId,
    })
    .select("id")
    .single();
  if (error || !data) {
    if (documentId)
      await removePrivateDocument(c.supabase, c.org.organizationId, documentId);
    return { message: dbError(error ?? { message: "" }) };
  }

  revalidatePath("/certificati");
  revalidatePath(`/atleti/${parsed.data.athlete_id}`);
  redirect(`/certificati/${data.id}`);
}

export async function updateCertificate(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("documents.manage");
  if (!c.ok) return c.state;
  const id = String(fd.get("id") ?? "");
  if (!id) return { message: "Identificativo mancante." };

  const parsed = certificateSchema.safeParse(readCertificate(fd));
  if (!parsed.success) return zodErrors(parsed.error);

  const { data: current } = await c.supabase
    .from("medical_certificates")
    .select("id, document_id")
    .eq("id", id)
    .eq("organization_id", c.org.organizationId)
    .maybeSingle();
  if (!current) return { message: "Certificato non trovato." };

  let documentId = current.document_id;
  const file = fileFrom(fd);
  if (file) {
    const res = await uploadPrivateDocument(
      c.supabase,
      c.org.organizationId,
      file,
      "medical",
      { athlete_id: parsed.data.athlete_id },
    );
    if ("error" in res) return { message: res.error };
    const old = documentId;
    documentId = res.documentId;
    if (old) await removePrivateDocument(c.supabase, c.org.organizationId, old);
  }

  const { error } = await c.supabase
    .from("medical_certificates")
    .update({ ...parsed.data, document_id: documentId })
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  if (error) return { message: dbError(error) };

  revalidatePath("/certificati");
  revalidatePath(`/certificati/${id}`);
  revalidatePath(`/atleti/${parsed.data.athlete_id}`);
  return { ok: true, message: "Modifiche salvate." };
}

export async function deleteCertificate(
  id: string,
  athleteId: string,
): Promise<void> {
  const c = await actionCtx("documents.manage");
  if (!c.ok) return;

  const { data: row } = await c.supabase
    .from("medical_certificates")
    .select("id, document_id")
    .eq("id", id)
    .eq("organization_id", c.org.organizationId)
    .maybeSingle();
  if (!row) return;

  await c.supabase
    .from("medical_certificates")
    .delete()
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  if (row.document_id)
    await removePrivateDocument(c.supabase, c.org.organizationId, row.document_id);

  revalidatePath("/certificati");
  revalidatePath(`/atleti/${athleteId}`);
  redirect("/certificati");
}

// ======================================================= Tesseramenti ===
function readMembership(fd: FormData) {
  const ends = String(fd.get("ends_on") ?? "").trim();
  return {
    athlete_id: String(fd.get("athlete_id") ?? ""),
    federation: String(fd.get("federation") ?? "").trim(),
    membership_number: String(fd.get("membership_number") ?? "").trim(),
    starts_on: String(fd.get("starts_on") ?? ""),
    ends_on: ends === "" ? null : ends,
    status: String(fd.get("status") ?? "active"),
  };
}

export async function createMembership(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("people.manage");
  if (!c.ok) return c.state;

  const parsed = membershipSchema.safeParse(readMembership(fd));
  if (!parsed.success) return zodErrors(parsed.error);

  const { data: athlete } = await c.supabase
    .from("athletes")
    .select("id")
    .eq("id", parsed.data.athlete_id)
    .eq("organization_id", c.org.organizationId)
    .maybeSingle();
  if (!athlete) return { message: "Atleta non trovato." };

  let documentId: string | null = null;
  const file = fileFrom(fd);
  if (file) {
    if (!(await actionCtx("documents.manage")).ok)
      return { message: "Per allegare un file serve il permesso Documenti." };
    const res = await uploadPrivateDocument(
      c.supabase,
      c.org.organizationId,
      file,
      "membership",
      { athlete_id: parsed.data.athlete_id },
    );
    if ("error" in res) return { message: res.error };
    documentId = res.documentId;
  }

  const { data, error } = await c.supabase
    .from("fita_memberships")
    .insert({
      ...parsed.data,
      organization_id: c.org.organizationId,
      document_id: documentId,
    })
    .select("id")
    .single();
  if (error || !data) {
    if (documentId)
      await removePrivateDocument(c.supabase, c.org.organizationId, documentId);
    return { message: dbError(error ?? { message: "" }) };
  }

  revalidatePath("/tesseramenti");
  revalidatePath(`/atleti/${parsed.data.athlete_id}`);
  redirect(`/tesseramenti/${data.id}`);
}

export async function updateMembership(
  _p: FormState,
  fd: FormData,
): Promise<FormState> {
  const c = await actionCtx("people.manage");
  if (!c.ok) return c.state;
  const id = String(fd.get("id") ?? "");
  if (!id) return { message: "Identificativo mancante." };

  const parsed = membershipSchema.safeParse(readMembership(fd));
  if (!parsed.success) return zodErrors(parsed.error);

  const { data: current } = await c.supabase
    .from("fita_memberships")
    .select("id, document_id")
    .eq("id", id)
    .eq("organization_id", c.org.organizationId)
    .maybeSingle();
  if (!current) return { message: "Tesseramento non trovato." };

  let documentId = current.document_id;
  const file = fileFrom(fd);
  if (file) {
    if (!(await actionCtx("documents.manage")).ok)
      return { message: "Per allegare un file serve il permesso Documenti." };
    const res = await uploadPrivateDocument(
      c.supabase,
      c.org.organizationId,
      file,
      "membership",
      { athlete_id: parsed.data.athlete_id },
    );
    if ("error" in res) return { message: res.error };
    const old = documentId;
    documentId = res.documentId;
    if (old) await removePrivateDocument(c.supabase, c.org.organizationId, old);
  }

  const { error } = await c.supabase
    .from("fita_memberships")
    .update({ ...parsed.data, document_id: documentId })
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  if (error) return { message: dbError(error) };

  revalidatePath("/tesseramenti");
  revalidatePath(`/tesseramenti/${id}`);
  revalidatePath(`/atleti/${parsed.data.athlete_id}`);
  return { ok: true, message: "Modifiche salvate." };
}

export async function deleteMembership(
  id: string,
  athleteId: string,
): Promise<void> {
  const c = await actionCtx("people.manage");
  if (!c.ok) return;

  const { data: row } = await c.supabase
    .from("fita_memberships")
    .select("id, document_id")
    .eq("id", id)
    .eq("organization_id", c.org.organizationId)
    .maybeSingle();
  if (!row) return;

  await c.supabase
    .from("fita_memberships")
    .delete()
    .eq("id", id)
    .eq("organization_id", c.org.organizationId);
  if (row.document_id)
    await removePrivateDocument(c.supabase, c.org.organizationId, row.document_id);

  revalidatePath("/tesseramenti");
  revalidatePath(`/atleti/${athleteId}`);
  redirect("/tesseramenti");
}

// ===================================================== Alert scadenze ===
export async function runExpiryScan(): Promise<void> {
  const c = await actionCtx("documents.manage");
  if (!c.ok) return;
  await c.supabase.rpc("notify_expiring_documents");
  revalidatePath("/certificati");
  revalidatePath("/tesseramenti");
  revalidatePath("/dashboard");
}
