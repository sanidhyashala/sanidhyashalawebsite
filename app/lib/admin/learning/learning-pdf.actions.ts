"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/app/lib/auth/admin";
import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

/* ---------------------------------------------------------
 * Constants
 * --------------------------------------------------------- */

const STORAGE_BUCKET = "learning-pdfs";

const MAX_FILE_SIZE =
  20 * 1024 * 1024;

const PDF_MIME_TYPE =
  "application/pdf";

/* ---------------------------------------------------------
 * Helpers
 * --------------------------------------------------------- */

function createSafeFileName(
  fileName: string
): string {
  const originalName =
    fileName
      .trim()
      .replace(
        /[<>:"/\\|?*\x00-\x1F]/g,
        ""
      )
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const withoutExtension =
    originalName
      .replace(/\.pdf$/i, "")
      .replace(/[^a-zA-Z0-9-_]/g, "");

  return (
    withoutExtension ||
    "learning-resource"
  );
}

function createStoragePath(
  resourceId: string,
  originalFileName: string
): string {
  const safeName =
    createSafeFileName(
      originalFileName
    );

  const uniqueId =
    crypto.randomUUID();

  return `${resourceId}/${safeName}-${uniqueId}.pdf`;
}

/* ---------------------------------------------------------
 * Create signed PDF upload URL
 *
 * IMPORTANT:
 * The PDF itself is NOT sent to this Server Action.
 * Only small metadata is sent.
 * --------------------------------------------------------- */

export async function createLearningResourcePdfUploadUrl(
  resourceId: string,
  fileName: string,
  fileSize: number,
  mimeType: string
) {
  const adminUserId =
    await requireAdmin();

  const supabase =
    createAdminSupabaseClient();

  const cleanResourceId =
    String(resourceId ?? "").trim();

  const cleanFileName =
    String(fileName ?? "").trim();

  const cleanMimeType =
    String(mimeType ?? "").trim();

  const cleanFileSize =
    Number(fileSize);

  if (!cleanResourceId) {
    throw new Error(
      "Resource ID is required."
    );
  }

  if (!cleanFileName) {
    throw new Error(
      "PDF file name is required."
    );
  }

  if (
    !cleanFileName
      .toLowerCase()
      .endsWith(".pdf")
  ) {
    throw new Error(
      "Only PDF files are allowed."
    );
  }

  if (
    cleanMimeType &&
    cleanMimeType !== PDF_MIME_TYPE
  ) {
    throw new Error(
      "The selected file is not a valid PDF."
    );
  }

  if (
    !Number.isFinite(cleanFileSize) ||
    cleanFileSize <= 0
  ) {
    throw new Error(
      "The selected PDF is empty."
    );
  }

  if (
    cleanFileSize >
    MAX_FILE_SIZE
  ) {
    throw new Error(
      "PDF file size must be 20 MB or less."
    );
  }

  /*
   * Verify that the resource exists.
   */

  const {
    data: resource,
    error: resourceError,
  } = await supabase
    .from("resources")
    .select("id, title")
    .eq("id", cleanResourceId)
    .maybeSingle();

  if (resourceError) {
    throw new Error(
      `Failed to validate resource: ${resourceError.message}`
    );
  }

  if (!resource) {
    throw new Error(
      "Learning resource was not found."
    );
  }

  /*
   * Create a completely new path.
   *
   * We never overwrite an existing PDF.
   */

  const storagePath =
    createStoragePath(
      cleanResourceId,
      cleanFileName
    );

  /*
   * Create a short-lived signed upload URL.
   *
   * The browser will use this token to upload
   * the actual PDF directly to Supabase Storage.
   */

  const {
    data: signedUpload,
    error: signedUploadError,
  } =
    await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUploadUrl(
        storagePath,
        {
          upsert: false,
        }
      );

  if (
    signedUploadError ||
    !signedUpload
  ) {
    throw new Error(
      `Failed to create PDF upload URL: ${
        signedUploadError?.message ??
        "Unknown storage error"
      }`
    );
  }

  /*
   * adminUserId is intentionally resolved here.
   *
   * Authentication happens before an upload token
   * can ever be created.
   */

  void adminUserId;

  return {
    success: true,
    path: signedUpload.path,
    token: signedUpload.token,
  };
}

/* ---------------------------------------------------------
 * Finalize uploaded PDF
 *
 * The PDF has already been uploaded directly from the
 * browser to Storage.
 *
 * This Server Action only receives tiny metadata.
 * --------------------------------------------------------- */

export async function finalizeLearningResourcePdfUpload(
  resourceId: string,
  fileName: string,
  storagePath: string,
  fileSize: number,
  mimeType: string
) {
  const adminUserId =
    await requireAdmin();

  const supabase =
    createAdminSupabaseClient();

  const cleanResourceId =
    String(resourceId ?? "").trim();

  const cleanFileName =
    String(fileName ?? "").trim();

  const cleanStoragePath =
    String(storagePath ?? "").trim();

  const cleanFileSize =
    Number(fileSize);

  const cleanMimeType =
    String(mimeType ?? "").trim();

  if (!cleanResourceId) {
    throw new Error(
      "Resource ID is required."
    );
  }

  if (!cleanFileName) {
    throw new Error(
      "PDF file name is required."
    );
  }

  if (!cleanStoragePath) {
    throw new Error(
      "PDF storage path is required."
    );
  }

  if (
    !cleanFileName
      .toLowerCase()
      .endsWith(".pdf")
  ) {
    throw new Error(
      "Only PDF files are allowed."
    );
  }

  if (
    cleanMimeType &&
    cleanMimeType !== PDF_MIME_TYPE
  ) {
    throw new Error(
      "The selected file is not a valid PDF."
    );
  }

  if (
    !Number.isFinite(cleanFileSize) ||
    cleanFileSize <= 0
  ) {
    throw new Error(
      "The selected PDF is empty."
    );
  }

  if (
    cleanFileSize >
    MAX_FILE_SIZE
  ) {
    throw new Error(
      "PDF file size must be 20 MB or less."
    );
  }

  /*
   * Security check:
   *
   * The generated upload path must belong to this
   * learning resource.
   */

  if (
    !cleanStoragePath.startsWith(
      `${cleanResourceId}/`
    )
  ) {
    throw new Error(
      "Invalid PDF storage path."
    );
  }

  /*
   * Finalize through the existing atomic DB function.
   */

  const {
    data: finalizedRows,
    error: finalizeError,
  } =
    await supabase.rpc(
      "finalize_learning_resource_pdf",
      {
        p_resource_id:
          cleanResourceId,

        p_file_name:
          cleanFileName,

        p_storage_path:
          cleanStoragePath,

        p_mime_type:
          PDF_MIME_TYPE,

        p_file_size_bytes:
          cleanFileSize,

        p_created_by:
          adminUserId,
      }
    );

  /*
   * If database finalization fails,
   * remove the newly uploaded Storage object.
   */

  if (
    finalizeError ||
    !finalizedRows ||
    finalizedRows.length === 0
  ) {
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([
        cleanStoragePath,
      ]);

    throw new Error(
      `Failed to finalize PDF replacement: ${
        finalizeError?.message ??
        "No attachment was created."
      }`
    );
  }

  const attachment =
    finalizedRows[0];

  /*
   * Remove previous obsolete Storage object.
   */

  let cleanupWarning:
    | string
    | null = null;

  if (
    attachment.previous_storage_path
  ) {
    const {
      error: cleanupError,
    } =
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([
          attachment.previous_storage_path,
        ]);

    if (cleanupError) {
      cleanupWarning =
        `New PDF is active, but the previous PDF could not be removed from Storage: ${cleanupError.message}`;
    }
  }

  /*
   * Refresh admin pages.
   */

  revalidatePath(
    `/admin/learning/${cleanResourceId}`
  );

  revalidatePath(
    "/admin/learning"
  );

  return {
    success: true,

    message:
      attachment.version_number === 1
        ? "PDF uploaded successfully."
        : "PDF replaced successfully.",

    attachment: {
      id:
        attachment.attachment_id,

      resourceId:
        attachment.resource_id,

      fileName:
        attachment.file_name,

      storagePath:
        attachment.storage_path,

      mimeType:
        attachment.mime_type,

      fileSizeBytes:
        attachment.file_size_bytes,

      versionNumber:
        attachment.version_number,

      status:
        attachment.status,

      attachmentType:
        attachment.attachment_type,

      createdAt:
        attachment.created_at,
    },

    cleanupWarning,
  };
}

/* ---------------------------------------------------------
 * Permanently delete an archived PDF version
 * --------------------------------------------------------- */

export async function deleteArchivedLearningResourcePdf(
  formData: FormData
) {
  await requireAdmin();

  const supabase =
    createAdminSupabaseClient();

  const attachmentId =
    String(
      formData.get(
        "attachment_id"
      ) ?? ""
    ).trim();

  if (!attachmentId) {
    throw new Error(
      "Attachment ID is required."
    );
  }

  const {
    data: attachment,
    error: attachmentError,
  } = await supabase
    .from("resource_attachments")
    .select(
      `
        id,
        resource_id,
        file_name,
        storage_path,
        status,
        attachment_type,
        version_number
      `
    )
    .eq("id", attachmentId)
    .maybeSingle();

  if (attachmentError) {
    throw new Error(
      `Failed to load PDF attachment: ${attachmentError.message}`
    );
  }

  if (!attachment) {
    throw new Error(
      "PDF attachment was not found."
    );
  }

  if (
    attachment.attachment_type !==
    "DOCUMENT"
  ) {
    throw new Error(
      "Only PDF document attachments can be deleted."
    );
  }

  if (
    attachment.status !==
    "ARCHIVED"
  ) {
    throw new Error(
      "Only archived PDF versions can be permanently deleted."
    );
  }

  const {
    error: storageError,
  } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([
      attachment.storage_path,
    ]);

  if (storageError) {
    throw new Error(
      `Failed to delete PDF from Storage: ${storageError.message}`
    );
  }

  const {
    error: deleteError,
  } = await supabase
    .from("resource_attachments")
    .delete()
    .eq("id", attachment.id)
    .eq("status", "ARCHIVED");

  if (deleteError) {
    throw new Error(
      `Failed to delete archived PDF record: ${deleteError.message}`
    );
  }

  revalidatePath(
    `/admin/learning/${attachment.resource_id}`
  );

  revalidatePath(
    "/admin/learning"
  );

  return {
    success: true,
    deletedAttachmentId:
      attachment.id,
    deletedVersion:
      attachment.version_number,
  };
}

/* ---------------------------------------------------------
 * Get PDF versions
 * --------------------------------------------------------- */

export async function getLearningResourcePdfVersions(
  resourceId: string
) {
  await requireAdmin();

  const supabase =
    createAdminSupabaseClient();

  if (!resourceId) {
    throw new Error(
      "Resource ID is required."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("resource_attachments")
    .select(
      `
        id,
        resource_id,
        file_name,
        storage_path,
        mime_type,
        file_size_bytes,
        attachment_type,
        status,
        version_number,
        created_at
      `
    )
    .eq(
      "resource_id",
      resourceId
    )
    .eq(
      "attachment_type",
      "DOCUMENT"
    )
    .order(
      "version_number",
      {
        ascending: false,
      }
    );

  if (error) {
    throw new Error(
      `Failed to load PDF versions: ${error.message}`
    );
  }

  return data ?? [];
}