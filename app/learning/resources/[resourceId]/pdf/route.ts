import { NextResponse } from "next/server";

import { requireLearningAuth } from "@/lib/learning/learning-auth";
import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

const PDF_BUCKET = "learning-pdfs";
const SIGNED_URL_EXPIRY = 300; // 5 minutes

type PdfRouteProps = {
  params: Promise<{
    resourceId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: PdfRouteProps
) {
  try {
    /*
     * -------------------------------------------------------
     * 1. Require an authenticated Learning user
     * -------------------------------------------------------
     */

    await requireLearningAuth();

    const { resourceId } = await params;

    if (!resourceId) {
      return NextResponse.json(
        {
          error: "Resource ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 2. Use the server-side admin client
     * -------------------------------------------------------
     *
     * The bucket is private.
     *
     * The service-role client exists only on the server.
     */

    const supabase =
      createAdminSupabaseClient();

    /*
     * -------------------------------------------------------
     * 3. Verify that the resource is published
     * -------------------------------------------------------
     */

    const {
      data: resource,
      error: resourceError,
    } = await supabase
      .from("resources")
      .select(
        `
          id,
          title,
          status,
          resource_type
        `
      )
      .eq("id", resourceId)
      .eq("status", "PUBLISHED")
      .maybeSingle();

    if (resourceError) {
      console.error(
        "Failed to load learning resource:",
        resourceError
      );

      return NextResponse.json(
        {
          error:
            "Failed to load learning resource.",
        },
        {
          status: 500,
        }
      );
    }

    if (!resource) {
      return NextResponse.json(
        {
          error:
            "Published learning resource not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 4. Find the active PDF attachment
     * -------------------------------------------------------
     */

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
          mime_type,
          file_size_bytes,
          attachment_type,
          status
        `
      )
      .eq("resource_id", resourceId)
      .eq("attachment_type", "DOCUMENT")
      .eq("mime_type", "application/pdf")
      .eq("status", "ACTIVE")
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (attachmentError) {
      console.error(
        "Failed to load PDF attachment:",
        attachmentError
      );

      return NextResponse.json(
        {
          error:
            "Failed to load PDF attachment.",
        },
        {
          status: 500,
        }
      );
    }

    if (!attachment) {
      return NextResponse.json(
        {
          error:
            "No active PDF is attached to this resource.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 5. Defensive resource relationship check
     * -------------------------------------------------------
     */

    if (
      attachment.resource_id !==
      resource.id
    ) {
      return NextResponse.json(
        {
          error:
            "PDF attachment does not belong to this resource.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 6. Create a short-lived signed URL
     * -------------------------------------------------------
     */

    const {
      data: signedUrlData,
      error: signedUrlError,
    } = await supabase.storage
      .from(PDF_BUCKET)
      .createSignedUrl(
        attachment.storage_path,
        SIGNED_URL_EXPIRY
      );

    if (signedUrlError) {
      console.error(
        "Failed to create PDF signed URL:",
        signedUrlError
      );

      return NextResponse.json(
        {
          error:
            "Failed to create secure PDF access.",
        },
        {
          status: 500,
        }
      );
    }

    if (!signedUrlData?.signedUrl) {
      return NextResponse.json(
        {
          error:
            "Secure PDF URL was not created.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 7. Fetch the PDF on the server
     * -------------------------------------------------------
     *
     * IMPORTANT:
     *
     * We intentionally do NOT redirect the browser to the
     * Supabase signed URL.
     *
     * The server fetches the PDF and returns the PDF itself.
     *
     * This keeps the browser on the same-origin route:
     *
     * /learning/resources/[resourceId]/pdf
     *
     * It also gives mobile browsers a much more predictable
     * PDF response when the resource is embedded in an iframe.
     * -------------------------------------------------------
     */

    const pdfResponse =
      await fetch(
        signedUrlData.signedUrl,
        {
          cache: "no-store",
        }
      );

    if (!pdfResponse.ok) {
      console.error(
        "Failed to fetch PDF from storage:",
        pdfResponse.status,
        pdfResponse.statusText
      );

      return NextResponse.json(
        {
          error:
            "Failed to retrieve PDF from storage.",
        },
        {
          status: 502,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 8. Return the actual PDF
     * -------------------------------------------------------
     */

    const pdfBuffer =
      await pdfResponse.arrayBuffer();

    const fileName =
      attachment.file_name ||
      `${resource.title}.pdf`;

    return new NextResponse(
      pdfBuffer,
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `inline; filename="${fileName.replace(/"/g, "")}"`,

          "Content-Length":
            String(pdfBuffer.byteLength),

          "Cache-Control":
            "private, no-store, max-age=0",

          "X-Content-Type-Options":
            "nosniff",
        },
      }
    );
  } catch (error) {
    console.error(
      "Learning PDF delivery failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to access this PDF.",
      },
      {
        status: 401,
      }
    );
  }
}