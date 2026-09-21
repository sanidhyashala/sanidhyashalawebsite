"use client";

import {
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@supabase/supabase-js";

import {
  createLearningResourcePdfUploadUrl,
  finalizeLearningResourcePdfUpload,
  deleteArchivedLearningResourcePdf,
} from "@/app/lib/admin/learning/learning-pdf.actions";

/* ---------------------------------------------------------
 * Types
 * --------------------------------------------------------- */

interface PdfVersion {
  id: string;
  resource_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number | null;
  attachment_type: string;
  status: string;
  version_number: number;
  created_at: string;
}

interface Props {
  resourceId: string;
  pdfVersions: PdfVersion[];
}

/* ---------------------------------------------------------
 * Constants
 * --------------------------------------------------------- */

const STORAGE_BUCKET =
  "learning-pdfs";

const MAX_FILE_SIZE =
  20 * 1024 * 1024;

const PDF_MIME_TYPE =
  "application/pdf";

/* ---------------------------------------------------------
 * Browser Supabase client
 * --------------------------------------------------------- */

function createBrowserSupabaseClient() {
  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey
  ) {
    throw new Error(
      "Supabase browser configuration is missing."
    );
  }

  return createClient(
    supabaseUrl,
    supabaseAnonKey
  );
}

/* ---------------------------------------------------------
 * Component
 * --------------------------------------------------------- */

export default function ResourcePdfUpload({
  resourceId,
  pdfVersions,
}: Props) {
  const router = useRouter();

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [file, setFile] =
    useState<File | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  /* -------------------------------------------------------
   * File selection
   * ------------------------------------------------------- */

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile =
      event.target.files?.[0] ?? null;

    setMessage(null);
    setError(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    /*
     * Extension validation
     */

    if (
      !selectedFile.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      setFile(null);

      setError(
        "Please select a PDF file."
      );

      event.target.value = "";

      return;
    }

    /*
     * MIME validation
     */

    if (
      selectedFile.type &&
      selectedFile.type !==
        PDF_MIME_TYPE
    ) {
      setFile(null);

      setError(
        "The selected file is not a valid PDF."
      );

      event.target.value = "";

      return;
    }

    /*
     * Empty file validation
     */

    if (
      selectedFile.size <= 0
    ) {
      setFile(null);

      setError(
        "The selected PDF is empty."
      );

      event.target.value = "";

      return;
    }

    /*
     * Maximum file size
     */

    if (
      selectedFile.size >
      MAX_FILE_SIZE
    ) {
      setFile(null);

      setError(
        "PDF file size must be 20 MB or less."
      );

      event.target.value = "";

      return;
    }

    setFile(selectedFile);
  }

  /* -------------------------------------------------------
   * Upload / Replace PDF
   * ------------------------------------------------------- */

  async function handleUpload() {
    if (
      !file ||
      uploading
    ) {
      return;
    }

    setUploading(true);
    setMessage(null);
    setError(null);

    try {
      /*
       * ---------------------------------------------------
       * 1. Ask the server for a signed upload URL.
       *
       * Only small metadata travels through the
       * Server Action.
       *
       * The actual PDF does NOT pass through Next.js.
       * ---------------------------------------------------
       */

      const signedUpload =
        await createLearningResourcePdfUploadUrl(
          resourceId,
          file.name,
          file.size,
          file.type
        );

      /*
       * ---------------------------------------------------
       * 2. Upload PDF directly from browser to
       *    Supabase Storage.
       * ---------------------------------------------------
       */

      const supabase =
        createBrowserSupabaseClient();

      const {
        error: storageError,
      } =
        await supabase.storage
          .from(
            STORAGE_BUCKET
          )
          .uploadToSignedUrl(
            signedUpload.path,
            signedUpload.token,
            file,
            {
              contentType:
                PDF_MIME_TYPE,

              cacheControl:
                "3600",
            }
          );

      if (storageError) {
        throw new Error(
          `Failed to upload PDF to Storage: ${storageError.message}`
        );
      }

      /*
       * ---------------------------------------------------
       * 3. Finalize the upload on the server.
       *
       * This performs the database-side versioning:
       *
       * old ACTIVE → ARCHIVED
       * new PDF     → ACTIVE
       * ---------------------------------------------------
       */

      const result =
        await finalizeLearningResourcePdfUpload(
          resourceId,
          file.name,
          signedUpload.path,
          file.size,
          file.type
        );

      if (!result.success) {
        throw new Error(
          "PDF finalization failed."
        );
      }

      /*
       * ---------------------------------------------------
       * 4. Reset file input
       * ---------------------------------------------------
       */

      setFile(null);

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }

      /*
       * ---------------------------------------------------
       * 5. Show success message
       * ---------------------------------------------------
       */

      if (
        result.cleanupWarning
      ) {
        setMessage(
          `${result.message} ${result.cleanupWarning}`
        );
      } else {
        setMessage(
          result.message
        );
      }

      /*
       * ---------------------------------------------------
       * 6. Refresh only the Next.js server data.
       *
       * This is cleaner than:
       *
       * window.location.reload()
       *
       * ---------------------------------------------------
       */

      router.refresh();

    } catch (uploadError) {
      console.error(
        "PDF upload failed:",
        uploadError
      );

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "PDF upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  /* -------------------------------------------------------
   * Permanently delete archived PDF
   * ------------------------------------------------------- */

  async function handleDelete(
    attachmentId: string,
    versionNumber: number
  ) {
    if (
      deletingId
    ) {
      return;
    }

    /*
     * Strong confirmation because this operation
     * cannot be undone.
     */

    const confirmed =
      window.confirm(
        `Permanently delete PDF Version ${versionNumber}?\n\n` +
        `This will remove the archived PDF from Storage ` +
        `and delete its database record.\n\n` +
        `This action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(
      attachmentId
    );

    setMessage(null);
    setError(null);

    try {
      const formData =
        new FormData();

      formData.set(
        "attachment_id",
        attachmentId
      );

      /*
       * Server verifies that the selected
       * attachment is actually ARCHIVED.
       */

      const result =
        await deleteArchivedLearningResourcePdf(
          formData
        );

      if (!result.success) {
        throw new Error(
          "PDF deletion failed."
        );
      }

      setMessage(
        `PDF Version ${versionNumber} was permanently deleted.`
      );

      /*
       * Refresh the server component so the
       * deleted version disappears from history.
       */

      router.refresh();

    } catch (deleteError) {
      console.error(
        "PDF deletion failed:",
        deleteError
      );

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "PDF deletion failed. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* -------------------------------------------------------
   * UI
   * ------------------------------------------------------- */

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

      {/* ---------------------------------------------------
       * Header
       * --------------------------------------------------- */}

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
          PDF Resource
        </p>

        <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
          Upload or replace PDF
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Upload or replace the PDF version
          of this learning resource. The
          latest uploaded PDF becomes the
          active student-facing version.
        </p>
      </div>

      {/* ---------------------------------------------------
       * File input
       * --------------------------------------------------- */}

      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950">

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          disabled={uploading}
          className="
            block
            w-full
            cursor-pointer
            text-sm
            text-slate-600

            file:mr-4
            file:rounded-xl
            file:border-0
            file:bg-slate-900
            file:px-4
            file:py-2.5
            file:text-sm
            file:font-semibold
            file:text-white

            hover:file:bg-slate-800

            disabled:cursor-not-allowed
            disabled:opacity-50

            dark:text-slate-400
            dark:file:bg-white
            dark:file:text-slate-900
          "
        />

        <p className="mt-3 text-xs text-slate-500">
          PDF only · Maximum size: 20 MB
        </p>
      </div>

      {/* ---------------------------------------------------
       * Selected file
       * --------------------------------------------------- */}

      {file && (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">

          <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
            Selected PDF
          </p>

          <p className="mt-1 break-all text-sm text-slate-700 dark:text-slate-300">
            {file.name}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {(
              file.size /
              (1024 * 1024)
            ).toFixed(2)}{" "}
            MB
          </p>

        </div>
      )}

      {/* ---------------------------------------------------
       * Success message
       * --------------------------------------------------- */}

      {message && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400">
          {message}
        </div>
      )}

      {/* ---------------------------------------------------
       * Error message
       * --------------------------------------------------- */}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ---------------------------------------------------
       * Upload button
       * --------------------------------------------------- */}

      <div className="mt-6 flex justify-end">

        <button
          type="button"
          onClick={handleUpload}
          disabled={
            !file ||
            uploading
          }
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-blue-700
            px-5
            py-3
            text-sm
            font-semibold
            text-white
            shadow-sm
            transition

            hover:bg-blue-800

            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >

          {uploading ? (
            <>
              <span
                className="
                  h-4
                  w-4
                  animate-spin
                  rounded-full
                  border-2
                  border-white
                  border-t-transparent
                "
              />

              Uploading...
            </>
          ) : (
            "Upload PDF"
          )}

        </button>

      </div>

      {/* =================================================
       * PDF VERSION HISTORY
       * ================================================= */}

      <div className="mt-10 border-t border-slate-200 pt-8 dark:border-slate-800">

        {/* -------------------------------------------------
         * History header
         * ------------------------------------------------- */}

        <div className="mb-5">

          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            PDF History
          </p>

          <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
            PDF Versions
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
            The active PDF is currently used
            as the student-facing PDF.
            Archived versions can be
            permanently removed when they
            are no longer needed.
          </p>

        </div>

        {/* -------------------------------------------------
         * No versions
         * ------------------------------------------------- */}

        {pdfVersions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            No PDF versions have been
            uploaded yet.
          </div>
        ) : (

          /* -------------------------------------------------
           * Version list
           * ------------------------------------------------- */

          <div className="space-y-3">

            {pdfVersions.map(
              (version) => {

                const isActive =
                  version.status ===
                  "ACTIVE";

                const isDeleting =
                  deletingId ===
                  version.id;

                return (
                  <div
                    key={version.id}
                    className="
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      p-5
                      dark:border-slate-800
                      dark:bg-slate-950
                    "
                  >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      {/* -----------------------------------
                       * Version information
                       * ----------------------------------- */}

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            Version{" "}
                            {version.version_number}
                          </span>

                          {isActive ? (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              ARCHIVED
                            </span>
                          )}

                        </div>

                        <p className="mt-2 break-all text-sm text-slate-700 dark:text-slate-300">
                          {version.file_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
  {version.file_size_bytes
    ? (
        version.file_size_bytes /
        (1024 * 1024)
      ).toFixed(2)
    : "—"}{" "}
  MB

  {" · "}

  {new Date(
    version.created_at
  ).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })}
</p>

                      </div>

                      {/* -----------------------------------
                       * Action
                       * ----------------------------------- */}

                      <div className="shrink-0">

                        {isActive ? (

                          /*
                           * ACTIVE PDF cannot be deleted.
                           */

                          <span className="text-xs font-medium text-green-700 dark:text-green-400">
                            Current student-facing PDF
                          </span>

                        ) : (

                          /*
                           * Only ARCHIVED versions get
                           * the destructive delete action.
                           */

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                version.id,
                                version.version_number
                              )
                            }
                            disabled={
                              isDeleting ||
                              deletingId !==
                                null
                            }
                            className="
                              rounded-xl
                              border
                              border-red-200
                              bg-red-50
                              px-4
                              py-2.5
                              text-sm
                              font-semibold
                              text-red-700
                              transition

                              hover:bg-red-100

                              disabled:cursor-not-allowed
                              disabled:opacity-50

                              dark:border-red-900/50
                              dark:bg-red-950/30
                              dark:text-red-400
                              dark:hover:bg-red-950/60
                            "
                          >

                            {isDeleting
                              ? "Deleting..."
                              : "Permanently Delete"}

                          </button>

                        )}

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

    </section>
  );
}