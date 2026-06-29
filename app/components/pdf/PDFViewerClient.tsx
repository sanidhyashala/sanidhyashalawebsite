"use client";

import dynamic from "next/dynamic";

const PDFViewer = dynamic(
  () => import("./PDFViewer"),
  {
    ssr: false,
  }
);

interface Props {
  title: string;
  pdfUrl: string;
}

export default function PDFViewerClient(props: Props) {
  return <PDFViewer {...props} />;
}