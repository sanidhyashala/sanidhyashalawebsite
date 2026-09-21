"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "@clerk/nextjs";

import { useLearningSupabaseBrowser } from "@/lib/learning/supabase-learning-browser";

import {
  ensureSubjectiveSubmission,
} from "@/app/lib/learning/subjective/subjective-submission.actions";

import {
  deleteSubjectiveSubmissionFile,
  reorderSubjectiveSubmissionFiles,
} from "@/app/lib/learning/subjective/subjective-submission-file.actions";

type ExistingFile = {
  id: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number | null;
  page_number: number | null;
};

type Props = {
  attemptId: string;
  attemptQuestionId: string;
  submissionId: string | null;
  attemptStatus: string;
  existingFiles?: ExistingFile[];

  /**
   * Keeps the parent Workspace synchronized with
   * the uploader's current uploaded-file state.
   */
  onFilesChange?: (files: ExistingFile[]) => void;
};

/*
 * ---------------------------------------------------------
 * Upload limits
 * ---------------------------------------------------------
 */

const MAX_IMAGE_INPUT_SIZE =
  8 * 1024 * 1024;

const MAX_FILE_SIZE =
  20 * 1024 * 1024;

/*
 * ---------------------------------------------------------
 * Image optimization settings
 * ---------------------------------------------------------
 */

const MAX_IMAGE_DIMENSION = 2200;

const TARGET_IMAGE_SIZE =
  3 * 1024 * 1024;

const MIN_IMAGE_QUALITY = 0.68;

const INITIAL_IMAGE_QUALITY = 0.84;

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
];

const ACCEPTED_PDF_TYPE =
  "application/pdf";

/*
 * ---------------------------------------------------------
 * Preview settings
 * ---------------------------------------------------------
 */

const PREVIEW_URL_EXPIRY_SECONDS =
  10 * 60;

/*
 * ---------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------
 */

function getFileExtension(file: File) {
  const name =
    file.name.toLowerCase();

  const lastDot =
    name.lastIndexOf(".");

  if (lastDot === -1) {
    return "bin";
  }

  return name.slice(lastDot + 1);
}

/*
 * ---------------------------------------------------------
 * Browser-safe random storage token
 * ---------------------------------------------------------
 */

function createRandomStorageToken() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const bytes =
      new Uint8Array(16);

    crypto.getRandomValues(bytes);

    /*
     * Set UUID v4 bits.
     */
    bytes[6] =
      (bytes[6] & 0x0f) | 0x40;

    bytes[8] =
      (bytes[8] & 0x3f) | 0x80;

    const hex =
      Array.from(bytes)
        .map((byte) =>
          byte
            .toString(16)
            .padStart(2, "0")
        )
        .join("");

    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20),
    ].join("-");
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function createStorageFileName(
  file: File
) {
  /*
   * Images are optimized and stored as JPEG.
   * PDFs retain their PDF extension.
   */
  if (
    ACCEPTED_IMAGE_TYPES.includes(
      file.type
    )
  ) {
    return `${createRandomStorageToken()}.jpg`;
  }

  const extension =
    getFileExtension(file);

  return `${createRandomStorageToken()}.${extension}`;
}

function formatFileSize(
  bytes: number | null
) {
  if (!bytes || bytes <= 0) {
    return "Unknown size";
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(2)} MB`;
}

function isImageMimeType(
  mimeType: string
) {
  return ACCEPTED_IMAGE_TYPES.includes(
    mimeType
  );
}

function isPdfMimeType(
  mimeType: string
) {
  return (
    mimeType ===
    ACCEPTED_PDF_TYPE
  );
}

/*
 * ---------------------------------------------------------
 * Load an image safely in the browser.
 * ---------------------------------------------------------
 */

function loadImage(
  file: File
): Promise<HTMLImageElement> {
  return new Promise(
    (resolve, reject) => {
      const objectUrl =
        URL.createObjectURL(file);

      const image =
        new Image();

      image.onload = () => {
        URL.revokeObjectURL(
          objectUrl
        );

        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(
          objectUrl
        );

        reject(
          new Error(
            "The selected image could not be processed."
          )
        );
      };

      image.src = objectUrl;
    }
  );
}

/*
 * ---------------------------------------------------------
 * Convert canvas to Blob.
 * ---------------------------------------------------------
 */

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise(
    (resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                "The image could not be optimized."
              )
            );

            return;
          }

          resolve(blob);
        },
        "image/jpeg",
        quality
      );
    }
  );
}

/*
 * ---------------------------------------------------------
 * Optimize image for storage.
 * ---------------------------------------------------------
 */

async function optimizeImage(
  file: File
): Promise<File> {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined"
  ) {
    return file;
  }

  const image =
    await loadImage(file);

  const originalWidth =
    image.naturalWidth ||
    image.width;

  const originalHeight =
    image.naturalHeight ||
    image.height;

  if (
    !originalWidth ||
    !originalHeight
  ) {
    throw new Error(
      "The selected image has invalid dimensions."
    );
  }

  /*
   * Do not upscale small images.
   */
  const scale =
    Math.min(
      1,
      MAX_IMAGE_DIMENSION /
        Math.max(
          originalWidth,
          originalHeight
        )
    );

  const targetWidth =
    Math.max(
      1,
      Math.round(
        originalWidth * scale
      )
    );

  const targetHeight =
    Math.max(
      1,
      Math.round(
        originalHeight * scale
      )
    );

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    targetWidth;

  canvas.height =
    targetHeight;

  const context =
    canvas.getContext(
      "2d"
    );

  if (!context) {
    throw new Error(
      "Your browser could not prepare the image for upload."
    );
  }

  context.imageSmoothingEnabled =
    true;

  context.imageSmoothingQuality =
    "high";

  /*
   * White background for PNG transparency.
   */
  context.fillStyle =
    "#ffffff";

  context.fillRect(
    0,
    0,
    targetWidth,
    targetHeight
  );

  context.drawImage(
    image,
    0,
    0,
    targetWidth,
    targetHeight
  );

  let quality =
    INITIAL_IMAGE_QUALITY;

  let blob =
    await canvasToBlob(
      canvas,
      quality
    );

  /*
   * If already reasonably small,
   * do not compress further.
   */
  if (
    blob.size <=
    TARGET_IMAGE_SIZE
  ) {
    return new File(
      [blob],
      file.name.replace(
        /\.[^/.]+$/,
        ".jpg"
      ),
      {
        type: "image/jpeg",
        lastModified:
          Date.now(),
      }
    );
  }

  /*
   * Reduce quality gradually.
   */
  while (
    blob.size >
      TARGET_IMAGE_SIZE &&
    quality >
      MIN_IMAGE_QUALITY
  ) {
    quality -= 0.05;

    if (
      quality <
      MIN_IMAGE_QUALITY
    ) {
      quality =
        MIN_IMAGE_QUALITY;
    }

    blob =
      await canvasToBlob(
        canvas,
        quality
      );
  }

  return new File(
    [blob],
    file.name.replace(
      /\.[^/.]+$/,
      ".jpg"
    ),
    {
      type: "image/jpeg",
      lastModified:
        Date.now(),
    }
  );
}

export default function SubjectiveSolutionUploader({
  attemptId,
  attemptQuestionId,
  submissionId,
  attemptStatus,
  existingFiles = [],
  onFilesChange,
}: Props) {
  const { userId } =
    useAuth();

  const supabase =
    useLearningSupabaseBrowser();

  const imageInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const cameraInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const pdfInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  /*
   * Used to prevent an older preview request
   * from updating the newly selected question.
   */
  const questionInstanceRef =
    useRef(0);

  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState<File[]>([]);

  const [
    uploadedFiles,
    setUploadedFiles,
  ] = useState<ExistingFile[]>(
    existingFiles
  );

  const [
    activeSubmissionId,
    setActiveSubmissionId,
  ] = useState<string | null>(
    submissionId
  );

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    deletingFileId,
    setDeletingFileId,
  ] = useState<string | null>(
    null
  );

  const [
    isReordering,
    setIsReordering,
  ] = useState(false);

  const [
    uploadError,
    setUploadError,
  ] = useState<string | null>(
    null
  );

  const [
    uploadSuccess,
    setUploadSuccess,
  ] = useState<string | null>(
    null
  );

  /*
   * ---------------------------------------------------------
   * Preview state
   * ---------------------------------------------------------
   */

  const [
    previewFile,
    setPreviewFile,
  ] = useState<ExistingFile | null>(
    null
  );

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState<string | null>(
    null
  );

  const [
    isPreviewLoading,
    setIsPreviewLoading,
  ] = useState(false);

  const [
    previewError,
    setPreviewError,
  ] = useState<string | null>(
    null
  );

  const isLocked =
    attemptStatus !==
    "IN_PROGRESS";

  /*
   * ---------------------------------------------------------
   * IMPORTANT:
   * Reset local uploader state whenever the student
   * moves to another question/submission.
   *
   * This prevents Q1 files from appearing on Q2/Q10,
   * and prevents uploads/deletes/reorders from using
   * stale submission state.
   * ---------------------------------------------------------
   */

  useEffect(() => {
    questionInstanceRef.current += 1;

    setUploadedFiles(
      existingFiles
    );

    setActiveSubmissionId(
      submissionId
    );

    setSelectedFiles([]);

    setUploadError(null);
    setUploadSuccess(null);

    setDeletingFileId(null);
    setIsReordering(false);

    setPreviewFile(null);
    setPreviewUrl(null);
    setPreviewError(null);
    setIsPreviewLoading(false);
  }, [
    attemptQuestionId,
    submissionId,
  ]);

  const selectedFileSummary =
    useMemo(() => {
      if (
        selectedFiles.length ===
        0
      ) {
        return null;
      }

      const totalBytes =
        selectedFiles.reduce(
          (total, file) =>
            total + file.size,
          0
        );

      return {
        count:
          selectedFiles.length,
        totalBytes,
      };
    }, [selectedFiles]);

  function resetMessages() {
    setUploadError(null);
    setUploadSuccess(null);
  }

  /*
   * ---------------------------------------------------------
   * Close preview
   * ---------------------------------------------------------
   */

  function closePreview() {
    setPreviewFile(null);
    setPreviewUrl(null);
    setPreviewError(null);
    setIsPreviewLoading(false);
  }

  /*
   * ---------------------------------------------------------
   * Open uploaded file preview
   * ---------------------------------------------------------
   */

  async function handlePreview(
    file: ExistingFile
  ) {
    if (isPreviewLoading) {
      return;
    }

    const currentQuestionInstance =
      questionInstanceRef.current;

    setPreviewFile(file);
    setPreviewUrl(null);
    setPreviewError(null);
    setIsPreviewLoading(true);

    try {
      const {
        data,
        error,
      } =
        await supabase.storage
          .from(
            "subjective-answers"
          )
          .createSignedUrl(
            file.file_path,
            PREVIEW_URL_EXPIRY_SECONDS
          );

      /*
       * Question changed while the signed URL
       * was being generated.
       */
      if (
        currentQuestionInstance !==
        questionInstanceRef.current
      ) {
        return;
      }

      if (error) {
        throw new Error(
          error.message ||
            "Unable to prepare the file preview."
        );
      }

      if (!data?.signedUrl) {
        throw new Error(
          "A preview link could not be created."
        );
      }

      setPreviewUrl(
        data.signedUrl
      );
    } catch (error) {
      if (
        currentQuestionInstance !==
        questionInstanceRef.current
      ) {
        return;
      }

      console.error(
        "Subjective solution preview error:",
        error
      );

      setPreviewError(
        error instanceof Error
          ? error.message
          : "Unable to preview this solution file."
      );
    } finally {
      if (
        currentQuestionInstance ===
        questionInstanceRef.current
      ) {
        setIsPreviewLoading(false);
      }
    }
  }

  /*
   * ---------------------------------------------------------
   * Combined validation
   * ---------------------------------------------------------
   */

  function validateFiles(
    files: File[],
    existing: ExistingFile[] = []
  ) {
    if (
      files.length === 0 &&
      existing.length === 0
    ) {
      return null;
    }

    /*
     * Validate newly selected files.
     */
    for (const file of files) {
      const isImage =
        ACCEPTED_IMAGE_TYPES.includes(
          file.type
        );

      const isPdf =
        file.type ===
        ACCEPTED_PDF_TYPE;

      if (
        !isImage &&
        !isPdf
      ) {
        return `${file.name}: only JPG/JPEG, PNG, or PDF files are supported.`;
      }

      /*
       * Original image input limit.
       */
      if (
        isImage &&
        file.size >
          MAX_IMAGE_INPUT_SIZE
      ) {
        return `${file.name}: this image is larger than 8 MB. Please choose a smaller image or reduce the camera photo size.`;
      }

      /*
       * PDF maximum.
       */
      if (
        isPdf &&
        file.size >
          MAX_FILE_SIZE
      ) {
        return `${file.name}: this PDF is larger than the allowed 20 MB limit.`;
      }

      /*
       * General safety limit.
       */
      if (
        file.size >
        MAX_FILE_SIZE
      ) {
        return `${file.name}: this file is larger than the allowed 20 MB limit.`;
      }
    }

    const existingHasPdf =
      existing.some(
        (file) =>
          isPdfMimeType(
            file.mime_type
          )
      );

    const existingHasImage =
      existing.some(
        (file) =>
          isImageMimeType(
            file.mime_type
          )
      );

    const selectedHasPdf =
      files.some(
        (file) =>
          isPdfMimeType(
            file.type
          )
      );

    const selectedHasImage =
      files.some(
        (file) =>
          isImageMimeType(
            file.type
          )
      );

    const combinedHasPdf =
      existingHasPdf ||
      selectedHasPdf;

    const combinedHasImage =
      existingHasImage ||
      selectedHasImage;

    const combinedFileCount =
      existing.length +
      files.length;

    /*
     * PDF + Image is never allowed.
     */
    if (
      combinedHasPdf &&
      combinedHasImage
    ) {
      return "Please upload either images or a PDF for a question. A PDF cannot be combined with image files.";
    }

    /*
     * More than one PDF is never allowed.
     */
    if (
      combinedHasPdf &&
      combinedFileCount > 1
    ) {
      return "Please keep only one PDF file for a question. Delete the existing PDF before adding another one.";
    }

    /*
     * Multiple images are allowed.
     */
    return null;
  }

  function handleFileSelection(
    fileList: FileList | null
  ) {
    if (isLocked) {
      return;
    }

    resetMessages();

    if (
      !fileList ||
      fileList.length === 0
    ) {
      return;
    }

    const incomingFiles =
      Array.from(fileList);

    const combinedSelectedFiles = [
      ...selectedFiles,
      ...incomingFiles,
    ];

    const validationError =
      validateFiles(
        combinedSelectedFiles,
        uploadedFiles
      );

    if (validationError) {
      setUploadError(
        validationError
      );

      return;
    }

    setSelectedFiles(
      combinedSelectedFiles
    );
  }

  function removeSelectedFile(
    index: number
  ) {
    if (
      isLocked ||
      isUploading ||
      isReordering
    ) {
      return;
    }

    setSelectedFiles(
      (previous) =>
        previous.filter(
          (_, fileIndex) =>
            fileIndex !== index
        )
    );

    resetMessages();
  }

  /*
   * ---------------------------------------------------------
   * Delete uploaded file
   * ---------------------------------------------------------
   */

  async function handleDeleteFile(
    fileId: string
  ) {
    if (
      isLocked ||
      isUploading ||
      isReordering ||
      deletingFileId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to remove this solution file?"
      );

    if (!confirmed) {
      return;
    }

    resetMessages();
    setDeletingFileId(fileId);

    try {
      /*
       * IMPORTANT:
       * Current server action requires both:
       * fileId + attemptQuestionId
       */
      const result =
        await deleteSubjectiveSubmissionFile(
          fileId,
          attemptQuestionId
        );

      if (!result.success) {
        setUploadError(
          result.error
        );

        return;
      }

      /*
       * If deleted file is currently being previewed,
       * close the preview.
       */
      if (
        previewFile?.id ===
        result.fileId
      ) {
        closePreview();
      }

      const nextFiles =
        uploadedFiles.filter(
          (file) =>
            file.id !==
            result.fileId
        );

      setUploadedFiles(
        nextFiles
      );

      onFilesChange?.(
        nextFiles
      );

      setUploadSuccess(
        "The solution file has been removed."
      );
    } catch (error) {
      console.error(
        "Subjective solution delete error:",
        error
      );

      setUploadError(
        error instanceof Error
          ? error.message
          : "Unable to remove the solution file."
      );
    } finally {
      setDeletingFileId(null);
    }
  }

  /*
   * ---------------------------------------------------------
   * Reorder uploaded solution pages
   * ---------------------------------------------------------
   */

  async function handleReorder(
    currentIndex: number,
    nextIndex: number
  ) {
    if (
      isLocked ||
      isUploading ||
      deletingFileId ||
      isReordering
    ) {
      return;
    }

    if (
      currentIndex < 0 ||
      nextIndex < 0 ||
      currentIndex >=
        uploadedFiles.length ||
      nextIndex >=
        uploadedFiles.length
    ) {
      return;
    }

    if (
      currentIndex ===
      nextIndex
    ) {
      return;
    }

    if (!activeSubmissionId) {
      setUploadError(
        "The solution submission could not be identified."
      );

      return;
    }

    resetMessages();
    setIsReordering(true);

    const previousFiles =
      [...uploadedFiles];

    const reorderedFiles =
      [...uploadedFiles];

    const [
      movedFile,
    ] = reorderedFiles.splice(
      currentIndex,
      1
    );

    if (!movedFile) {
      setIsReordering(false);
      return;
    }

    reorderedFiles.splice(
      nextIndex,
      0,
      movedFile
    );

    /*
     * Optimistic UI update.
     */
    const optimisticFiles =
      reorderedFiles.map(
        (file, index) => ({
          ...file,
          page_number:
            index + 1,
        })
      );

    setUploadedFiles(
      optimisticFiles
    );

    try {
      /*
       * IMPORTANT:
       * Current server action requires:
       * submissionId + attemptQuestionId + fileIds
       */
      const result =
        await reorderSubjectiveSubmissionFiles(
          activeSubmissionId,
          attemptQuestionId,
          reorderedFiles.map(
            (file) => file.id
          )
        );

      if (!result.success) {
        setUploadedFiles(
          previousFiles
        );

        setUploadError(
          result.error
        );

        return;
      }

      /*
       * The exact intended order is already available
       * locally, so there is no need to read result.files.
       */
      setUploadedFiles(
        optimisticFiles
      );

      onFilesChange?.(
        optimisticFiles
      );

      setUploadSuccess(
        "Solution page order saved."
      );
    } catch (error) {
      console.error(
        "Subjective solution reorder error:",
        error
      );

      setUploadedFiles(
        previousFiles
      );

      setUploadError(
        error instanceof Error
          ? error.message
          : "Unable to reorder your solution pages."
      );
    } finally {
      setIsReordering(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * Upload solution
   * ---------------------------------------------------------
   */

  async function handleUpload() {
    if (
      isLocked ||
      isUploading
    ) {
      return;
    }

    resetMessages();

    if (!userId) {
      setUploadError(
        "Your learning session could not be verified. Please sign in again."
      );

      return;
    }

    if (
      selectedFiles.length ===
      0
    ) {
      setUploadError(
        "Choose a solution file before uploading."
      );

      return;
    }

    /*
     * Validate again immediately before upload.
     */
    const validationError =
      validateFiles(
        selectedFiles,
        uploadedFiles
      );

    if (validationError) {
      setUploadError(
        validationError
      );

      return;
    }

    setIsUploading(true);

    try {
      /*
       * -------------------------------------------------------
       * Step 1: Ensure submission row exists.
       * -------------------------------------------------------
       */

      let resolvedSubmissionId =
        activeSubmissionId;

      if (
        !resolvedSubmissionId
      ) {
        const submissionResult =
          await ensureSubjectiveSubmission(
            attemptQuestionId
          );

        if (
          !submissionResult.success
        ) {
          setUploadError(
            submissionResult.error
          );

          return;
        }

        resolvedSubmissionId =
          submissionResult.submissionId;

        setActiveSubmissionId(
          resolvedSubmissionId
        );
      }

      /*
       * -------------------------------------------------------
       * Step 2: Determine next page number.
       * -------------------------------------------------------
       */

      let nextPageNumber =
        uploadedFiles.reduce(
          (maximum, file) =>
            Math.max(
              maximum,
              file.page_number ?? 0
            ),
          0
        ) + 1;

      /*
       * -------------------------------------------------------
       * Step 3: Upload and save metadata.
       * -------------------------------------------------------
       */

      const newlyUploadedFiles: ExistingFile[] =
        [];

      for (
        const originalFile of selectedFiles
      ) {
        let uploadFile =
          originalFile;

        /*
         * Image optimization.
         */
        if (
          ACCEPTED_IMAGE_TYPES.includes(
            originalFile.type
          )
        ) {
          try {
            uploadFile =
              await optimizeImage(
                originalFile
              );
          } catch (optimizationError) {
            console.error(
              "Subjective image optimization error:",
              optimizationError
            );

            throw new Error(
              `${originalFile.name}: the image could not be prepared for upload. Please try taking the photo again.`
            );
          }
        }

        /*
         * Safety check after optimization.
         */
        if (
          uploadFile.size >
          MAX_FILE_SIZE
        ) {
          throw new Error(
            `${originalFile.name}: the prepared file is larger than the allowed 20 MB limit.`
          );
        }

        /*
         * Storage filename.
         */
        const fileName =
          createStorageFileName(
            uploadFile
          );

        const filePath = [
          userId,
          attemptId,
          attemptQuestionId,
          fileName,
        ].join("/");

        /*
         * Upload to Supabase Storage.
         */
        const {
          error:
            storageUploadError,
        } =
          await supabase.storage
            .from(
              "subjective-answers"
            )
            .upload(
              filePath,
              uploadFile,
              {
                cacheControl:
                  "3600",
                contentType:
                  uploadFile.type,
                upsert: false,
              }
            );

        if (
          storageUploadError
        ) {
          throw new Error(
            storageUploadError.message ||
              `Unable to upload ${originalFile.name}.`
          );
        }

        /*
         * Save metadata.
         */
        const {
          data:
            insertedFile,
          error:
            metadataError,
        } =
          await supabase
            .from(
              "subjective_submission_files"
            )
            .insert({
              submission_id:
                resolvedSubmissionId,

              file_path:
                filePath,

              /*
               * Keep original filename.
               */
              file_name:
                originalFile.name,

              /*
               * Actual stored type.
               */
              mime_type:
                uploadFile.type,

              /*
               * Actual stored size.
               */
              file_size_bytes:
                uploadFile.size,

              page_number:
                nextPageNumber,
            })
            .select(
              `
                id,
                file_path,
                file_name,
                mime_type,
                file_size_bytes,
                page_number
              `
            )
            .single();

        if (
          metadataError ||
          !insertedFile
        ) {
          /*
           * Best-effort storage cleanup.
           */
          try {
            await supabase.storage
              .from(
                "subjective-answers"
              )
              .remove([
                filePath,
              ]);
          } catch {
            /*
             * Best-effort cleanup only.
             */
          }

          throw new Error(
            metadataError?.message ||
              "The file was uploaded, but its metadata could not be saved."
          );
        }

        newlyUploadedFiles.push(
          insertedFile
        );

        nextPageNumber += 1;
      }

      /*
       * Add newly uploaded files to UI and notify parent.
       */
      const nextFiles = [
        ...uploadedFiles,
        ...newlyUploadedFiles,
      ];

      setUploadedFiles(
        nextFiles
      );

      onFilesChange?.(
        nextFiles
      );

      setSelectedFiles([]);

      setUploadSuccess(
        newlyUploadedFiles.length ===
          1
          ? "Your solution has been added."
          : `${newlyUploadedFiles.length} solution pages have been added.`
      );
    } catch (error) {
      console.error(
        "Subjective solution upload error:",
        error
      );

      setUploadError(
        error instanceof Error
          ? error.message
          : "Unable to upload your solution."
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <div
        className="
          mt-8
          rounded-3xl
          border
          border-blue-100
          bg-blue-50/50
          p-5
          dark:border-blue-950
          dark:bg-blue-950/20
          sm:p-6
        "
      >
        {/* Introduction */}

        <div>
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-blue-700
                text-lg
                text-white
                dark:bg-blue-600
              "
            >
              ✦
            </div>

            <div>
              <p
                className="
                  text-base
                  font-semibold
                  text-slate-900
                  dark:text-slate-100
                "
              >
                Your Solution
              </p>

              <p
                className="
                  text-xs
                  text-blue-700
                  dark:text-blue-400
                "
              >
                Let your working speak for itself.
              </p>
            </div>
          </div>

          <p
            className="
              mt-4
              max-w-3xl
              text-sm
              leading-6
              text-slate-600
              dark:text-slate-300
            "
          >
            Solve this question on paper or in
            your notebook. Then share your work
            with us through a clear photograph or
            PDF. We are interested not only in the
            final answer, but in the thinking that
            led you there.
          </p>
        </div>

        {/* Upload Options */}

        {!isLocked && (
          <>
            <div
              className="
                mt-6
                grid
                grid-cols-1
                gap-3
                sm:grid-cols-3
              "
            >
              <button
                type="button"
                disabled={
                  isUploading ||
                  isReordering ||
                  Boolean(
                    deletingFileId
                  )
                }
                onClick={() =>
                  cameraInputRef.current?.click()
                }
                className="
                  rounded-2xl
                  border
                  border-blue-200
                  bg-white
                  px-4
                  py-4
                  text-sm
                  font-semibold
                  text-blue-700
                  transition
                  hover:border-blue-400
                  hover:bg-blue-50
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  dark:border-blue-900
                  dark:bg-slate-900
                  dark:text-blue-400
                  dark:hover:bg-blue-950/40
                "
              >
                <span className="text-lg">
                  📷
                </span>

                <span className="ml-2">
                  Take a Photo
                </span>
              </button>

              <button
                type="button"
                disabled={
                  isUploading ||
                  isReordering ||
                  Boolean(
                    deletingFileId
                  )
                }
                onClick={() =>
                  imageInputRef.current?.click()
                }
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-4
                  text-sm
                  font-semibold
                  text-slate-700
                  transition
                  hover:border-blue-300
                  hover:bg-blue-50
                  hover:text-blue-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  dark:border-slate-700
                  dark:bg-slate-900
                  dark:text-slate-300
                  dark:hover:bg-blue-950/40
                "
              >
                <span className="text-lg">
                  🖼️
                </span>

                <span className="ml-2">
                  Upload Image
                </span>
              </button>

              <button
                type="button"
                disabled={
                  isUploading ||
                  isReordering ||
                  Boolean(
                    deletingFileId
                  )
                }
                onClick={() =>
                  pdfInputRef.current?.click()
                }
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-4
                  text-sm
                  font-semibold
                  text-slate-700
                  transition
                  hover:border-blue-300
                  hover:bg-blue-50
                  hover:text-blue-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  dark:border-slate-700
                  dark:bg-slate-900
                  dark:text-slate-300
                  dark:hover:bg-blue-950/40
                "
              >
                <span className="text-lg">
                  📄
                </span>

                <span className="ml-2">
                  Upload PDF
                </span>
              </button>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/png"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                handleFileSelection(
                  event.target.files
                );

                event.target.value = "";
              }}
            />

            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png"
              multiple
              className="hidden"
              onChange={(event) => {
                handleFileSelection(
                  event.target.files
                );

                event.target.value = "";
              }}
            />

            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) => {
                handleFileSelection(
                  event.target.files
                );

                event.target.value = "";
              }}
            />

            <div
              className="
                mt-4
                rounded-2xl
                border
                border-blue-100
                bg-white/70
                px-4
                py-3
                dark:border-blue-950
                dark:bg-slate-900/60
              "
            >
              <p
                className="
                  text-xs
                  leading-5
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Images can be JPG/JPEG or PNG
                up to 8 MB each. Images are
                automatically optimized before
                storage. Multiple images are
                allowed. A PDF may contain
                multiple pages and can be up to
                20 MB.
              </p>
            </div>
          </>
        )}

        {/* Selected Files */}

        {selectedFiles.length > 0 && (
          <div className="mt-5">
            <p
              className="
                text-sm
                font-semibold
                text-slate-800
                dark:text-slate-200
              "
            >
              Your work is ready to be added
            </p>

            <div className="mt-3 space-y-2">
              {selectedFiles.map(
                (file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${index}`}
                    className="
                      flex
                      items-center
                      justify-between
                      gap-3
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-4
                      py-3
                      dark:border-slate-700
                      dark:bg-slate-900
                    "
                  >
                    <div className="min-w-0">
                      <p
                        className="
                          truncate
                          text-sm
                          font-medium
                          text-slate-800
                          dark:text-slate-200
                        "
                      >
                        {file.name}
                      </p>

                      <p
                        className="
                          mt-0.5
                          text-xs
                          text-slate-500
                          dark:text-slate-400
                        "
                      >
                        {formatFileSize(
                          file.size
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={
                        isUploading ||
                        isReordering
                      }
                      onClick={() =>
                        removeSelectedFile(
                          index
                        )
                      }
                      className="
                        shrink-0
                        rounded-lg
                        px-3
                        py-1.5
                        text-xs
                        font-semibold
                        text-red-600
                        hover:bg-red-50
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                        dark:text-red-400
                        dark:hover:bg-red-950/30
                      "
                    >
                      Remove
                    </button>
                  </div>
                )
              )}
            </div>

            {selectedFileSummary && (
              <p
                className="
                  mt-3
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                "
              >
                {selectedFileSummary.count} file
                {selectedFileSummary.count ===
                1
                  ? ""
                  : "s"}{" "}
                selected ·{" "}
                {formatFileSize(
                  selectedFileSummary.totalBytes
                )}
              </p>
            )}

            <button
              type="button"
              disabled={
                isUploading ||
                isReordering
              }
              onClick={
                handleUpload
              }
              className="
                mt-4
                inline-flex
                w-full
                items-center
                justify-center
                rounded-xl
                bg-blue-700
                px-5
                py-3
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-blue-800
                disabled:cursor-not-allowed
                disabled:opacity-50
                dark:bg-blue-600
                dark:hover:bg-blue-500
              "
            >
              {isUploading
                ? "Preparing and adding your solution..."
                : "Add Solution"}
            </button>
          </div>
        )}

        {/* Uploaded Files */}

        {uploadedFiles.length > 0 && (
          <div
            className="
              mt-5
              rounded-2xl
              border
              border-emerald-200
              bg-emerald-50
              p-4
              dark:border-emerald-900
              dark:bg-emerald-950/30
            "
          >
            <div
              className="
                flex
                items-start
                justify-between
                gap-3
              "
            >
              <div>
                <p
                  className="
                    text-sm
                    font-semibold
                    text-emerald-800
                    dark:text-emerald-300
                  "
                >
                  ✓ Solution Added
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-emerald-700
                    dark:text-emerald-400
                  "
                >
                  Your work is safely attached
                  to this question.
                </p>
              </div>

              <span
                className="
                  shrink-0
                  rounded-full
                  bg-white
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-emerald-700
                  dark:bg-emerald-950
                  dark:text-emerald-300
                "
              >
                {uploadedFiles.length}{" "}
                {uploadedFiles.length ===
                1
                  ? "file"
                  : "files"}
              </span>
            </div>

            {uploadedFiles.length > 1 && (
              <p
                className="
                  mt-3
                  text-xs
                  leading-5
                  text-emerald-700
                  dark:text-emerald-400
                "
              >
                Arrange your solution pages in
                the correct order using the ↑ and
                ↓ buttons.
              </p>
            )}

            <div className="mt-4 space-y-3">
              {uploadedFiles.map(
                (file, index) => (
                  <div
                    key={file.id}
                    className="
                      rounded-xl
                      border
                      border-emerald-100
                      bg-white
                      p-3
                      dark:border-emerald-900
                      dark:bg-slate-900
                    "
                  >
                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        gap-3
                      "
                    >
                      <div className="min-w-0">
                        <p
                          className="
                            truncate
                            text-sm
                            font-medium
                            text-slate-800
                            dark:text-slate-200
                          "
                        >
                          Page{" "}
                          {file.page_number ??
                            index + 1}
                          {" · "}
                          {file.file_name}
                        </p>

                        <p
                          className="
                            mt-0.5
                            text-xs
                            text-slate-500
                            dark:text-slate-400
                          "
                        >
                          {file.mime_type ===
                          ACCEPTED_PDF_TYPE
                            ? "PDF"
                            : "Image"}{" "}
                          ·{" "}
                          {formatFileSize(
                            file.file_size_bytes
                          )}
                        </p>
                      </div>

                      {!isLocked && (
                        <div
                          className="
                            flex
                            shrink-0
                            items-center
                            gap-1
                          "
                        >
                          {uploadedFiles.length >
                            1 && (
                            <>
                              <button
                                type="button"
                                aria-label={`Move page ${
                                  index + 1
                                } up`}
                                title="Move up"
                                disabled={
                                  index ===
                                    0 ||
                                  isUploading ||
                                  Boolean(
                                    deletingFileId
                                  ) ||
                                  isReordering
                                }
                                onClick={() =>
                                  handleReorder(
                                    index,
                                    index - 1
                                  )
                                }
                                className="
                                  inline-flex
                                  h-8
                                  w-8
                                  items-center
                                  justify-center
                                  rounded-lg
                                  border
                                  border-slate-200
                                  bg-white
                                  text-sm
                                  font-semibold
                                  text-slate-600
                                  transition
                                  hover:border-blue-300
                                  hover:bg-blue-50
                                  hover:text-blue-700
                                  disabled:cursor-not-allowed
                                  disabled:opacity-40
                                  dark:border-slate-700
                                  dark:bg-slate-900
                                  dark:text-slate-300
                                  dark:hover:bg-blue-950/40
                                "
                              >
                                ↑
                              </button>

                              <button
                                type="button"
                                aria-label={`Move page ${
                                  index + 1
                                } down`}
                                title="Move down"
                                disabled={
                                  index ===
                                    uploadedFiles.length -
                                      1 ||
                                  isUploading ||
                                  Boolean(
                                    deletingFileId
                                  ) ||
                                  isReordering
                                }
                                onClick={() =>
                                  handleReorder(
                                    index,
                                    index + 1
                                  )
                                }
                                className="
                                  inline-flex
                                  h-8
                                  w-8
                                  items-center
                                  justify-center
                                  rounded-lg
                                  border
                                  border-slate-200
                                  bg-white
                                  text-sm
                                  font-semibold
                                  text-slate-600
                                  transition
                                  hover:border-blue-300
                                  hover:bg-blue-50
                                  hover:text-blue-700
                                  disabled:cursor-not-allowed
                                  disabled:opacity-40
                                  dark:border-slate-700
                                  dark:bg-slate-900
                                  dark:text-slate-300
                                  dark:hover:bg-blue-950/40
                                "
                              >
                                ↓
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            disabled={
                              Boolean(
                                deletingFileId
                              ) ||
                              isUploading ||
                              isReordering
                            }
                            onClick={() =>
                              handleDeleteFile(
                                file.id
                              )
                            }
                            className="
                              rounded-lg
                              px-3
                              py-1.5
                              text-xs
                              font-semibold
                              text-red-600
                              transition
                              hover:bg-red-50
                              disabled:cursor-not-allowed
                              disabled:opacity-50
                              dark:text-red-400
                              dark:hover:bg-red-950/30
                            "
                          >
                            {deletingFileId ===
                            file.id
                              ? "Removing..."
                              : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Preview action */}

                    <div
                      className="
                        mt-3
                        flex
                        flex-col
                        gap-2
                        sm:flex-row
                      "
                    >
                      <button
                        type="button"
                        disabled={
                          isPreviewLoading ||
                          isUploading ||
                          isReordering ||
                          Boolean(
                            deletingFileId
                          )
                        }
                        onClick={() =>
                          handlePreview(
                            file
                          )
                        }
                        className="
                          inline-flex
                          flex-1
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          border
                          border-blue-200
                          bg-blue-50
                          px-4
                          py-2.5
                          text-xs
                          font-semibold
                          text-blue-700
                          transition
                          hover:border-blue-400
                          hover:bg-blue-100
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                          dark:border-blue-900
                          dark:bg-blue-950/40
                          dark:text-blue-300
                          dark:hover:bg-blue-950/70
                        "
                      >
                        <span className="text-base">
                          👁
                        </span>

                        {isPreviewLoading &&
                        previewFile?.id ===
                          file.id
                          ? "Preparing Preview..."
                          : "Preview"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {isReordering && (
              <p
                className="
                  mt-3
                  text-xs
                  font-medium
                  text-blue-700
                  dark:text-blue-400
                "
              >
                Saving page order...
              </p>
            )}
          </div>
        )}

        {/* Error */}

        {uploadError && (
          <div
            className="
              mt-4
              rounded-2xl
              border
              border-red-200
              bg-red-50
              p-4
              text-sm
              leading-6
              text-red-700
              dark:border-red-900
              dark:bg-red-950/30
              dark:text-red-300
            "
          >
            {uploadError}
          </div>
        )}

        {/* Success */}

        {uploadSuccess && (
          <div
            className="
              mt-4
              rounded-2xl
              border
              border-emerald-200
              bg-emerald-50
              p-4
              text-sm
              leading-6
              text-emerald-700
              dark:border-emerald-900
              dark:bg-emerald-950/30
              dark:text-emerald-300
            "
          >
            {uploadSuccess}
          </div>
        )}

        {/* Locked State */}

        {isLocked && (
          <p
            className="
              mt-4
              text-xs
              leading-5
              text-slate-500
              dark:text-slate-400
            "
          >
            This attempt is locked. Your submitted
            work can no longer be changed.
          </p>
        )}
      </div>

      {/* -----------------------------------------------------
          Preview Modal
          ----------------------------------------------------- */}

      {previewFile && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-slate-950/80
            p-3
            backdrop-blur-sm
            sm:p-6
          "
          role="dialog"
          aria-modal="true"
          aria-label="Solution preview"
          onClick={closePreview}
        >
          <div
            className="
              relative
              flex
              max-h-[94vh]
              w-full
              max-w-5xl
              flex-col
              overflow-hidden
              rounded-2xl
              bg-white
              shadow-2xl
              dark:bg-slate-900
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* Preview Header */}

            <div
              className="
                flex
                shrink-0
                items-center
                justify-between
                gap-3
                border-b
                border-slate-200
                bg-white
                px-4
                py-3
                dark:border-slate-700
                dark:bg-slate-900
              "
            >
              <div className="min-w-0">
                <p
                  className="
                    truncate
                    text-sm
                    font-semibold
                    text-slate-900
                    dark:text-slate-100
                  "
                >
                  Page{" "}
                  {previewFile.page_number ??
                    1}
                  {" · "}
                  {previewFile.file_name}
                </p>

                <p
                  className="
                    mt-0.5
                    text-xs
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  {previewFile.mime_type ===
                  ACCEPTED_PDF_TYPE
                    ? "PDF document"
                    : "Image"}{" "}
                  ·{" "}
                  {formatFileSize(
                    previewFile.file_size_bytes
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closePreview
                }
                aria-label="Close preview"
                className="
                  inline-flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-slate-200
                  bg-white
                  text-lg
                  text-slate-600
                  transition
                  hover:bg-slate-100
                  dark:border-slate-700
                  dark:bg-slate-800
                  dark:text-slate-300
                  dark:hover:bg-slate-700
                "
              >
                ×
              </button>
            </div>

            {/* Preview Body */}

            <div
              className="
                min-h-0
                flex-1
                overflow-auto
                bg-slate-100
                p-3
                dark:bg-slate-950
                sm:p-5
              "
            >
              {isPreviewLoading && (
                <div
                  className="
                    flex
                    min-h-[50vh]
                    items-center
                    justify-center
                  "
                >
                  <div className="text-center">
                    <div
                      className="
                        mx-auto
                        h-10
                        w-10
                        animate-spin
                        rounded-full
                        border-4
                        border-slate-300
                        border-t-blue-600
                      "
                    />

                    <p
                      className="
                        mt-4
                        text-sm
                        font-medium
                        text-slate-600
                        dark:text-slate-300
                      "
                    >
                      Preparing your preview...
                    </p>
                  </div>
                </div>
              )}

              {!isPreviewLoading &&
                previewError && (
                  <div
                    className="
                      flex
                      min-h-[50vh]
                      items-center
                      justify-center
                    "
                  >
                    <div
                      className="
                        max-w-md
                        rounded-2xl
                        border
                        border-red-200
                        bg-red-50
                        p-5
                        text-center
                        dark:border-red-900
                        dark:bg-red-950/30
                      "
                    >
                      <p
                        className="
                          text-sm
                          font-semibold
                          text-red-700
                          dark:text-red-300
                        "
                      >
                        Preview could not be loaded
                      </p>

                      <p
                        className="
                          mt-2
                          text-xs
                          leading-5
                          text-red-600
                          dark:text-red-400
                        "
                      >
                        {previewError}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          handlePreview(
                            previewFile
                          )
                        }
                        className="
                          mt-4
                          rounded-xl
                          bg-blue-700
                          px-4
                          py-2
                          text-xs
                          font-semibold
                          text-white
                          transition
                          hover:bg-blue-800
                        "
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}

              {!isPreviewLoading &&
                !previewError &&
                previewUrl &&
                isImageMimeType(
                  previewFile.mime_type
                ) && (
                  <div
                    className="
                      flex
                      min-h-full
                      items-center
                      justify-center
                    "
                  >
                    <img
                      src={previewUrl}
                      alt={`Preview of ${previewFile.file_name}`}
                      className="
                        max-h-[78vh]
                        w-auto
                        max-w-full
                        rounded-lg
                        bg-white
                        object-contain
                        shadow-lg
                      "
                    />
                  </div>
                )}

              {!isPreviewLoading &&
                !previewError &&
                previewUrl &&
                isPdfMimeType(
                  previewFile.mime_type
                ) && (
                  <div
                    className="
                      flex
                      min-h-[78vh]
                      w-full
                      flex-col
                      gap-3
                    "
                  >
                    <iframe
                      src={previewUrl}
                      title={`Preview of ${previewFile.file_name}`}
                      className="
                        min-h-[70vh]
                        w-full
                        flex-1
                        rounded-lg
                        border
                        border-slate-200
                        bg-white
                        dark:border-slate-700
                      "
                    />

                    <div
                      className="
                        flex
                        justify-center
                      "
                    >
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          inline-flex
                          items-center
                          justify-center
                          rounded-xl
                          bg-blue-700
                          px-5
                          py-2.5
                          text-xs
                          font-semibold
                          text-white
                          transition
                          hover:bg-blue-800
                        "
                      >
                        Open PDF in New Tab
                      </a>
                    </div>
                  </div>
                )}
            </div>

            {/* Preview Footer */}

            <div
              className="
                flex
                shrink-0
                items-center
                justify-between
                gap-3
                border-t
                border-slate-200
                bg-white
                px-4
                py-3
                dark:border-slate-700
                dark:bg-slate-900
              "
            >
              <p
                className="
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Check that your solution is clear
                and all required work is visible.
              </p>

              <button
                type="button"
                onClick={
                  closePreview
                }
                className="
                  shrink-0
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-2
                  text-xs
                  font-semibold
                  text-slate-700
                  transition
                  hover:bg-slate-100
                  dark:border-slate-700
                  dark:bg-slate-800
                  dark:text-slate-200
                  dark:hover:bg-slate-700
                "
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}