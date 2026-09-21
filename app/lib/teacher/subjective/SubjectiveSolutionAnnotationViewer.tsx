"use client";

import {
  ArrowRight,
  Check,
  Circle,
  Eraser,
  FileImage,
  FileText,
  Loader2,
  MousePointer2,
  Redo2,
  Save,
  Type,
  Undo2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  getSubjectiveSolutionFilePreviewUrl,
} from "@/app/lib/teacher/subjective/subjective-solution-preview.actions";
import {
  getSubjectiveEvaluationAnnotations,
  saveSubjectiveEvaluationAnnotations,
  type SubjectiveAnnotation,
  type SubjectiveAnnotationType,
} from "@/app/lib/teacher/subjective/subjective-annotation.actions";

type SolutionFile = {
  id: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  page_number: number | null;
};

type Props = {
  evaluationId: string;
  files: SolutionFile[];
  evaluationStatus: string;
  forceReadOnly?: boolean;
  initialAnnotations?: SubjectiveAnnotation[];
  initialFileUrls?: Record<string, string>;
};

type Point = { x: number; y: number };

type AnnotationPayload = {
  page_number: number | null;
  x_position: number | null;
  y_position: number | null;
  annotation_type: SubjectiveAnnotationType;
  content: string;
};

type PdfPage = {
  pageNumber: number;
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
};

type Tool =
  | "SELECT"
  | "PEN"
  | "CIRCLE"
  | "TICK"
  | "CROSS"
  | "ARROW"
  | "TEXT"
  | "ERASER";

const BUCKET = "subjective-answers";
const SIGNED_URL_SECONDS = 10 * 60;
const RED = "#dc2626";
const MAX_POINTS = 800;
const MAX_TEXT_LENGTH = 240;

function safeJsonParse(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function normalizePoints(points: Point[]) {
  if (points.length <= MAX_POINTS) return points;

  const step = Math.ceil(points.length / MAX_POINTS);
  return points.filter((_, index) => index % step === 0);
}

function annotationToPayload(annotation: SubjectiveAnnotation): AnnotationPayload {
  return {
    page_number: annotation.page_number,
    x_position: annotation.x_position,
    y_position: annotation.y_position,
    annotation_type: annotation.annotation_type,
    content: annotation.content,
  };
}

function ToolButton({
  active,
  label,
  onClick,
  children,
  disabled,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function AnnotationSvg({
  annotation,
  selected,
  onSelect,
  onDelete,
}: {
  annotation: SubjectiveAnnotation;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const x = clamp01(Number(annotation.x_position ?? 0));
  const y = clamp01(Number(annotation.y_position ?? 0));
  const data = safeJsonParse(annotation.content);
  const points = Array.isArray(data.points)
    ? (data.points as unknown[])
        .filter(
          (point): point is { x: number; y: number } =>
            !!point &&
            typeof point === "object" &&
            typeof (point as Record<string, unknown>).x === "number" &&
            typeof (point as Record<string, unknown>).y === "number",
        )
        .map((point) => ({ x: clamp01(point.x), y: clamp01(point.y) }))
    : [];

  const stop = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSelect();
  };

  if (annotation.annotation_type === "PEN" && points.length > 0) {
    return (
      <polyline
        points={points.map((point) => `${point.x * 100},${point.y * 100}`).join(" ")}
        fill="none"
        stroke={RED}
        strokeWidth={selected ? 1.35 : 1.15}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="cursor-pointer"
        onClick={stop}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
      />
    );
  }

  if (annotation.annotation_type === "CIRCLE") {
    const width = Math.abs(Number(data.width ?? 0.08));
    const height = Math.abs(Number(data.height ?? width));
    return (
      <ellipse
        cx={(x + width / 2) * 100}
        cy={(y + height / 2) * 100}
        rx={(width / 2) * 100}
        ry={(height / 2) * 100}
        fill="none"
        stroke={RED}
        strokeWidth={selected ? 1.35 : 1.15}
        vectorEffect="non-scaling-stroke"
        className="cursor-pointer"
        onClick={stop}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
      />
    );
  }

  if (annotation.annotation_type === "TICK") {
    const size = Number(data.size ?? 0.035);
    return (
      <path
        d={`M ${x * 100} ${(y + size * 0.5) * 100} L ${(x + size * 0.35) * 100} ${(y + size) * 100} L ${(x + size) * 100} ${y * 100}`}
        fill="none"
        stroke={RED}
        strokeWidth={selected ? 1.4 : 1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="cursor-pointer"
        onClick={stop}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
      />
    );
  }

  if (annotation.annotation_type === "CROSS") {
    const size = Number(data.size ?? 0.03);
    return (
      <g
        className="cursor-pointer"
        onClick={stop}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
      >
        <path
          d={`M ${x * 100} ${y * 100} L ${(x + size) * 100} ${(y + size) * 100} M ${(x + size) * 100} ${y * 100} L ${x * 100} ${(y + size) * 100}`}
          fill="none"
          stroke={RED}
          strokeWidth={selected ? 1.4 : 1.2}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </g>
    );
  }

  if (annotation.annotation_type === "ARROW") {
    const endX = clamp01(Number(data.endX ?? x + 0.08));
    const endY = clamp01(Number(data.endY ?? y));
    const angle = Math.atan2(endY - y, endX - x);
    const head = 0.018;
    const left = {
      x: endX - head * Math.cos(angle - Math.PI / 6),
      y: endY - head * Math.sin(angle - Math.PI / 6),
    };
    const right = {
      x: endX - head * Math.cos(angle + Math.PI / 6),
      y: endY - head * Math.sin(angle + Math.PI / 6),
    };
    return (
      <g
        className="cursor-pointer"
        onClick={stop}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
      >
        <path
          d={`M ${x * 100} ${y * 100} L ${endX * 100} ${endY * 100} M ${left.x * 100} ${left.y * 100} L ${endX * 100} ${endY * 100} L ${right.x * 100} ${right.y * 100}`}
          fill="none"
          stroke={RED}
          strokeWidth={selected ? 1.35 : 1.15}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </g>
    );
  }

  return null;
}

function TextAnnotation({
  annotation,
  onSelect,
  onDelete,
  onEdit,
  readOnly,
}: {
  annotation: SubjectiveAnnotation;
  onSelect: () => void;
  onDelete: () => void;
  onEdit: (text: string) => void;
  readOnly?: boolean;
}) {
  const x = clamp01(Number(annotation.x_position ?? 0));
  const y = clamp01(Number(annotation.y_position ?? 0));
  const data = safeJsonParse(annotation.content);
  const text = typeof data.text === "string" ? data.text : annotation.content;
  const width = Math.max(0.08, Math.min(0.5, Number(data.width ?? 0.22)));

  return (
    <div
      className="absolute z-20 cursor-pointer rounded-md border border-red-300 bg-white/95 px-2 py-1 text-xs font-medium text-red-700 shadow-sm dark:border-red-800 dark:bg-slate-950/95 dark:text-red-300"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: `${width * 100}%`,
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        if (readOnly) return;
        const next = window.prompt("Edit teacher annotation", text);
        if (next !== null) onEdit(next.slice(0, MAX_TEXT_LENGTH));
      }}
      title="Double-click to edit • Right-click to delete"
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!readOnly) onDelete();
      }}
    >
      {text}
    </div>
  );
}

function AnnotationLayer({
  width,
  height,
  annotations,
  pageNumber,
  tool,
  onCreate,
  onDelete,
  readOnly,
}: {
  width: number;
  height: number;
  annotations: SubjectiveAnnotation[];
  pageNumber: number;
  tool: Tool;
  onCreate: (annotation: AnnotationPayload) => void;
  onDelete: (annotation: SubjectiveAnnotation) => void;
  readOnly: boolean;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draftPoints, setDraftPoints] = useState<Point[]>([]);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Point | null>(null);

  const pageAnnotations = annotations.filter(
    (annotation) => (annotation.page_number ?? 1) === pageNumber,
  );

  const getPoint = useCallback(
    (event: React.PointerEvent<SVGSVGElement>): Point => {
      const rect = event.currentTarget.getBoundingClientRect();
      return {
        x: clamp01((event.clientX - rect.left) / rect.width),
        y: clamp01((event.clientY - rect.top) / rect.height),
      };
    },
    [],
  );

  function finishPointer(point: Point) {
    if (readOnly) return;

    if (tool === "PEN" && draftPoints.length > 1) {
      onCreate({
        page_number: pageNumber,
        x_position: draftPoints[0]?.x ?? point.x,
        y_position: draftPoints[0]?.y ?? point.y,
        annotation_type: "PEN",
        content: JSON.stringify({
          points: normalizePoints([...draftPoints, point]),
        }),
      });
    }

    if (tool === "CIRCLE" && dragStart) {
      const x = Math.min(dragStart.x, point.x);
      const y = Math.min(dragStart.y, point.y);
      const widthValue = Math.max(0.01, Math.abs(point.x - dragStart.x));
      const heightValue = Math.max(0.01, Math.abs(point.y - dragStart.y));
      onCreate({
        page_number: pageNumber,
        x_position: x,
        y_position: y,
        annotation_type: "CIRCLE",
        content: JSON.stringify({
          width: widthValue,
          height: heightValue,
        }),
      });
    }

    if (tool === "ARROW" && dragStart) {
      onCreate({
        page_number: pageNumber,
        x_position: dragStart.x,
        y_position: dragStart.y,
        annotation_type: "ARROW",
        content: JSON.stringify({
          endX: point.x,
          endY: point.y,
        }),
      });
    }

    if (tool === "TICK") {
      onCreate({
        page_number: pageNumber,
        x_position: point.x,
        y_position: point.y,
        annotation_type: "TICK",
        content: JSON.stringify({ size: 0.035 }),
      });
    }

    if (tool === "CROSS") {
      onCreate({
        page_number: pageNumber,
        x_position: point.x,
        y_position: point.y,
        annotation_type: "CROSS",
        content: JSON.stringify({ size: 0.03 }),
      });
    }

    if (tool === "TEXT") {
      const text = window.prompt("Type a short note on the solution:");
      if (text?.trim()) {
        onCreate({
          page_number: pageNumber,
          x_position: point.x,
          y_position: point.y,
          annotation_type: "TEXT",
          content: JSON.stringify({
            text: text.trim().slice(0, MAX_TEXT_LENGTH),
            width: 0.22,
          }),
        });
      }
    }

    setDraftPoints([]);
    setDragStart(null);
    setDragCurrent(null);
  }

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`absolute inset-0 h-full w-full ${
        readOnly ? "pointer-events-none" : "touch-none"
      }`}
      style={{ cursor: readOnly ? "default" : tool === "SELECT" ? "default" : "crosshair" }}
      onPointerDown={(event) => {
        if (readOnly || tool === "SELECT" || tool === "ERASER") return;
        event.currentTarget.setPointerCapture(event.pointerId);
        const point = getPoint(event);
        setDragStart(point);
        setDragCurrent(point);
        if (tool === "PEN") setDraftPoints([point]);
      }}
      onPointerMove={(event) => {
        if (readOnly) return;
        if (!dragStart && tool !== "PEN") return;
        const point = getPoint(event);
        setDragCurrent(point);
        if (tool === "PEN") {
          setDraftPoints((previous) => {
            const next = [...previous, point];
            return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
          });
        }
      }}
      onPointerUp={(event) => {
        if (readOnly || tool === "SELECT" || tool === "ERASER") return;
        finishPointer(getPoint(event));
      }}
      onPointerCancel={() => {
        setDraftPoints([]);
        setDragStart(null);
        setDragCurrent(null);
      }}
    >
      {pageAnnotations
        .filter((annotation) => annotation.annotation_type !== "TEXT")
        .map((annotation) => (
          <AnnotationSvg
            key={annotation.id ?? `${annotation.annotation_type}-${annotation.created_at}`}
            annotation={annotation}
            selected={false}
            onSelect={() => {
              if (tool === "ERASER" && !readOnly) onDelete(annotation);
            }}
            onDelete={() => {
              if (!readOnly) onDelete(annotation);
            }}
          />
        ))}

      {tool === "PEN" && draftPoints.length > 1 && (
        <polyline
          points={draftPoints.map((point) => `${point.x * 100},${point.y * 100}`).join(" ")}
          fill="none"
          stroke={RED}
          strokeWidth={1.15}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      )}

      {tool === "CIRCLE" && dragStart && dragCurrent && (
        <rect
          x={Math.min(dragStart.x, dragCurrent.x) * 100}
          y={Math.min(dragStart.y, dragCurrent.y) * 100}
          width={Math.abs(dragCurrent.x - dragStart.x) * 100}
          height={Math.abs(dragCurrent.y - dragStart.y) * 100}
          fill="none"
          stroke={RED}
          strokeWidth={1.15}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      )}

      {tool === "ARROW" && dragStart && dragCurrent && (
        <line
          x1={dragStart.x * 100}
          y1={dragStart.y * 100}
          x2={dragCurrent.x * 100}
          y2={dragCurrent.y * 100}
          stroke={RED}
          strokeWidth={1.15}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      )}
    </svg>
  );
}

export default function SubjectiveSolutionAnnotationViewer({
  evaluationId,
  files,
  evaluationStatus,
  forceReadOnly = false,
  initialAnnotations,
  initialFileUrls,
}: Props) {
  const [annotations, setAnnotations] = useState<SubjectiveAnnotation[]>(
    initialAnnotations ?? [],
  );
  const [tool, setTool] = useState<Tool>("PEN");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [history, setHistory] = useState<SubjectiveAnnotation[][]>([]);
  const [future, setFuture] = useState<SubjectiveAnnotation[][]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [pdfPages, setPdfPages] = useState<Record<string, PdfPage[]>>({});
  const [pdfLoading, setPdfLoading] = useState<Record<string, boolean>>({});

  const readOnly = forceReadOnly || evaluationStatus === "EVALUATED";

  const sortedFiles = useMemo(
    () =>
      [...files].sort((a, b) => {
        const ap = a.page_number ?? 999999;
        const bp = b.page_number ?? 999999;
        return ap - bp;
      }),
    [files],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      if (initialAnnotations !== undefined) {
        setAnnotations(initialAnnotations);
        setDirty(false);
        setLoading(false);
        return;
      }

      const result =
        await getSubjectiveEvaluationAnnotations(
          evaluationId,
        );

      if (cancelled) return;

      if (!result.success) {
        setError(result.error);
      } else {
        setAnnotations(result.data);
        setDirty(false);
      }

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [evaluationId, initialAnnotations]);

  useEffect(() => {
    let cancelled = false;

    async function loadUrls() {
      setUrls({});

      /*
       * Student checked-copy mode receives URLs from the
       * student-authorized server action/page. Do not create
       * Storage URLs from the browser in this mode.
       */
      if (initialFileUrls !== undefined) {
        if (!cancelled) {
          setUrls(initialFileUrls);
        }
        return;
      }

      /*
       * Teacher/admin mode uses the existing secure server action.
       * This avoids browser Storage RLS/signing failures that leave
       * the UI stuck at "Preparing image preview...".
       */
      const entries = await Promise.all(
        sortedFiles.map(async (file) => {
          const result =
            await getSubjectiveSolutionFilePreviewUrl(
              evaluationId,
              file.id,
            );

          if (!result.success || !result.url) {
            console.error(
              "Failed to prepare Subjective solution preview:",
              {
                evaluationId,
                fileId: file.id,
                error:
                  "error" in result
                    ? result.error
                    : "Unknown preview error",
              },
            );
            return null;
          }

          return [file.id, result.url] as const;
        }),
      );

      if (cancelled) return;

      setUrls(
        Object.fromEntries(
          entries.filter(Boolean) as Array<
            readonly [string, string]
          >,
        ),
      );
    }

    void loadUrls();

    return () => {
      cancelled = true;
    };
  }, [
    evaluationId,
    initialFileUrls,
    sortedFiles,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function renderPdfs() {
      const pdfFiles = sortedFiles.filter((file) => file.mime_type === "application/pdf");
      if (pdfFiles.length === 0) return;

      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

      /*
       * PDF.js 4/5 does not automatically know the worker URL inside a
       * Next.js/Turbopack client bundle. Without this, getDocument()
       * throws:
       * No "GlobalWorkerOptions.workerSrc" specified.
       *
       * Keep the worker tied to the exact installed pdfjs-dist package
       * instead of using a CDN or a version-mismatched worker.
       */
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.mjs",
        import.meta.url,
      ).toString();

      for (const file of pdfFiles) {
        const url = urls[file.id];
        if (!url) continue;

        setPdfLoading((current) => ({ ...current, [file.id]: true }));

        try {
          const pdfDocument = await pdfjs.getDocument({
            url,
          }).promise;

          const pages: PdfPage[] = [];

          for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
            if (cancelled) return;
            const page = await pdfDocument.getPage(pageNumber);
            const baseViewport = page.getViewport({ scale: 1.25 });
            const scale = Math.min(1, 1100 / baseViewport.width);
            const viewport = page.getViewport({ scale: 1.25 * scale });

            const canvas = window.document.createElement("canvas");
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            const context = canvas.getContext("2d");
            if (!context) continue;

            await page.render({
              canvas,
              canvasContext: context,
              viewport,
            }).promise;
            pages.push({
              pageNumber,
              width: canvas.width,
              height: canvas.height,
              canvas,
            });
          }

          if (!cancelled) {
            setPdfPages((current) => ({ ...current, [file.id]: pages }));
          }
        } catch (renderError) {
          console.error("Subjective PDF annotation preview error:", renderError);
          if (!cancelled) setError("Unable to render this PDF for annotation.");
        } finally {
          if (!cancelled) {
            setPdfLoading((current) => ({ ...current, [file.id]: false }));
          }
        }
      }
    }

    if (Object.keys(urls).length > 0) void renderPdfs();

    return () => {
      cancelled = true;
    };
  }, [urls, sortedFiles]);

  const mutate = useCallback((next: SubjectiveAnnotation[]) => {
    setHistory((current) => [...current.slice(-39), annotations]);
    setFuture([]);
    setAnnotations(next);
    setDirty(true);
    setMessage(null);
    setError(null);
  }, [annotations]);

  function createAnnotation(payload: AnnotationPayload) {
    mutate([
      ...annotations,
      {
        ...payload,
        id: `local-${crypto.randomUUID()}`,
      },
    ]);
  }

  function deleteAnnotation(annotation: SubjectiveAnnotation) {
    mutate(annotations.filter((item) => item !== annotation && item.id !== annotation.id));
  }

  function updateText(annotation: SubjectiveAnnotation, text: string) {
    const data = safeJsonParse(annotation.content);
    mutate(
      annotations.map((item) =>
        item.id === annotation.id
          ? {
              ...item,
              content: JSON.stringify({
                ...data,
                text: text.trim().slice(0, MAX_TEXT_LENGTH),
              }),
            }
          : item,
      ),
    );
  }

  function undo() {
    const previous = history[history.length - 1];
    if (!previous) return;
    setFuture((current) => [annotations, ...current.slice(0, 39)]);
    setAnnotations(previous);
    setHistory((current) => current.slice(0, -1));
    setDirty(true);
  }

  function redo() {
    const next = future[0];
    if (!next) return;
    setHistory((current) => [...current.slice(-39), annotations]);
    setAnnotations(next);
    setFuture((current) => current.slice(1));
    setDirty(true);
  }

  async function save() {
    if (readOnly || saving) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    const result = await saveSubjectiveEvaluationAnnotations(
      evaluationId,
      annotations.map(annotationToPayload),
    );

    if (!result.success) {
      setError(result.error);
      setSaving(false);
      return;
    }

    setAnnotations(result.data);
    setDirty(false);
    setHistory([]);
    setFuture([]);
    setMessage("Teacher annotations saved.");
    setSaving(false);
  }

  if (files.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
        No solution file submitted.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-30 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <MousePointer2 className="h-3.5 w-3.5" />
            Marking tools
          </span>

          <ToolButton active={tool === "PEN"} label="Red pen" onClick={() => setTool("PEN")} disabled={readOnly}>
            <span className="text-base leading-none">✎</span>
            Pen
          </ToolButton>
          <ToolButton active={tool === "CIRCLE"} label="Circle a step" onClick={() => setTool("CIRCLE")} disabled={readOnly}>
            <Circle className="h-3.5 w-3.5" />
            Circle
          </ToolButton>
          <ToolButton active={tool === "TICK"} label="Correct tick" onClick={() => setTool("TICK")} disabled={readOnly}>
            <Check className="h-3.5 w-3.5" />
            Tick
          </ToolButton>
          <ToolButton active={tool === "CROSS"} label="Wrong cross" onClick={() => setTool("CROSS")} disabled={readOnly}>
            <X className="h-3.5 w-3.5" />
            Cross
          </ToolButton>
          <ToolButton active={tool === "ARROW"} label="Arrow" onClick={() => setTool("ARROW")} disabled={readOnly}>
            <ArrowRight className="h-3.5 w-3.5" />
            Arrow
          </ToolButton>
          <ToolButton active={tool === "TEXT"} label="Add a short text note" onClick={() => setTool("TEXT")} disabled={readOnly}>
            <Type className="h-3.5 w-3.5" />
            Text
          </ToolButton>
          <ToolButton active={tool === "ERASER"} label="Erase annotation" onClick={() => setTool("ERASER")} disabled={readOnly}>
            <Eraser className="h-3.5 w-3.5" />
            Eraser
          </ToolButton>

          <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block dark:bg-slate-700" />

          <ToolButton active={false} label="Undo" onClick={undo} disabled={readOnly || history.length === 0}>
            <Undo2 className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton active={false} label="Redo" onClick={redo} disabled={readOnly || future.length === 0}>
            <Redo2 className="h-3.5 w-3.5" />
          </ToolButton>

          <button
            type="button"
            onClick={save}
            disabled={readOnly || saving || !dirty}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving..." : "Save Marks"}
          </button>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 px-2 text-[11px] text-slate-400">
          <span>All marks are red.</span>
          <span>•</span>
          <span>Double-click a mark to remove it.</span>
          <span>•</span>
          <span>Double-click text to edit.</span>
          {readOnly && (
            <span className="font-medium text-emerald-600 dark:text-emerald-400">Finalized — annotations are read-only.</span>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading teacher annotations...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          {message}
        </div>
      )}

      {!loading &&
        sortedFiles.map((file, index) => {
          const url = urls[file.id];
          const isPdf = file.mime_type === "application/pdf";
          const pages = pdfPages[file.id] ?? [];

          return (
            <div
              key={file.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"
            >
              <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
                {isPdf ? <FileText className="h-4 w-4 text-slate-500" /> : <FileImage className="h-4 w-4 text-slate-500" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{file.file_name}</p>
                  <p className="text-[11px] text-slate-400">
                    {isPdf ? "PDF" : "Image"} • {isPdf ? `${pages.length || "…"} page${pages.length === 1 ? "" : "s"}` : `Page ${file.page_number ?? index + 1}`}
                  </p>
                </div>
              </div>

              {isPdf ? (
                pdfLoading[file.id] || !url ? (
                  <div className="flex min-h-40 items-center justify-center gap-2 p-8 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparing PDF pages...
                  </div>
                ) : pages.length === 0 ? (
                  <div className="p-6 text-sm text-red-600">This PDF could not be rendered.</div>
                ) : (
                  <div className="space-y-4 p-3">
                    {pages.map((page) => (
                      <div key={page.pageNumber} className="mx-auto w-full max-w-[1100px]">
                        <div className="mb-1 text-[11px] font-medium text-slate-400">Page {page.pageNumber}</div>
                        <div className="relative mx-auto w-fit max-w-full overflow-hidden rounded-lg bg-white shadow-sm">
                          <img
                            src={page.canvas.toDataURL("image/png")}
                            alt={`${file.file_name} page ${page.pageNumber}`}
                            className="block h-auto max-w-full select-none"
                            draggable={false}
                          />
                          <AnnotationLayer
                            width={page.width}
                            height={page.height}
                            annotations={annotations}
                            pageNumber={page.pageNumber}
                            tool={tool}
                            onCreate={createAnnotation}
                            onDelete={deleteAnnotation}
                            readOnly={readOnly}
                          />
                          {annotations
                              .filter((annotation) => annotation.annotation_type === "TEXT" && (annotation.page_number ?? 1) === page.pageNumber)
                              .map((annotation) => (
                                <TextAnnotation
                                  key={annotation.id ?? annotation.created_at}
                                  annotation={annotation}
                                  onSelect={() => setTool("SELECT")}
                                  onDelete={() => deleteAnnotation(annotation)}
                                  onEdit={(text) => updateText(annotation, text)}
                                  readOnly={readOnly}
                                />
                              ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : !url ? (
                <div className="flex min-h-40 items-center justify-center gap-2 p-8 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparing image preview...
                </div>
              ) : (
                <div className="overflow-auto p-3">
                  <div className="relative mx-auto w-fit max-w-full overflow-hidden rounded-lg bg-white shadow-sm">
                    <img
                      src={url}
                      alt={file.file_name}
                      className="block h-auto max-w-full select-none"
                      draggable={false}
                    />
                    <AnnotationLayer
                      width={1}
                      height={1}
                      annotations={annotations}
                      pageNumber={file.page_number ?? index + 1}
                      tool={tool}
                      onCreate={createAnnotation}
                      onDelete={deleteAnnotation}
                      readOnly={readOnly}
                    />
                    {annotations
                        .filter((annotation) => annotation.annotation_type === "TEXT" && (annotation.page_number ?? 1) === (file.page_number ?? index + 1))
                        .map((annotation) => (
                          <TextAnnotation
                            key={annotation.id ?? annotation.created_at}
                            annotation={annotation}
                            onSelect={() => setTool("SELECT")}
                            onDelete={() => deleteAnnotation(annotation)}
                            onEdit={(text) => updateText(annotation, text)}
                            readOnly={readOnly}
                          />
                        ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
