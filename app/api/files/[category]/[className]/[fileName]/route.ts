import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import fs from "fs";

import { getPdfPath } from "@/lib/files";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      category: string;
      className: string;
      fileName: string;
    }>;
  }
) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", {
      status: 401,
    });
  }

  const {
    category,
    className,
    fileName,
  } = await params;

  const filePath = getPdfPath(
    category,
    className,
    fileName
  );

  if (!filePath) {
    return new NextResponse("File not found", {
      status: 404,
    });
  }

  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
    },
  });
}