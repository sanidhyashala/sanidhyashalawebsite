import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";
import { requireLearningAuth } from "@/lib/learning/learning-auth";
import { createLearningSupabaseClient } from "@/lib/learning/supabase-learning";

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
     * 2. Use the server-side admin client for resource/PDF
     *    data and the authenticated Learning client for
     *    access resolution.
     * -------------------------------------------------------
     */

    const supabase = createAdminSupabaseClient();

    const learningSupabase =
      await createLearningSupabaseClient();

    /*
     * -------------------------------------------------------
     * 3. Verify that the resource is a published Note
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
     * 4. This route is specifically for Note PDFs
     * -------------------------------------------------------
     */

    if (resource.resource_type !== "NOTE") {
      return NextResponse.json(
        {
          error:
            "PDF delivery is available only for Notes.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 5. Verify current Learning Product access
     * -------------------------------------------------------
     *
     * IMPORTANT:
     *
     * This is the actual Premium access boundary.
     *
     * FREE:
     *   resolver returns true
     *
     * PREMIUM:
     *   resolver returns true only when the authenticated
     *   student has the required Chapter or Subject
     *   entitlement.
     *
     * We intentionally resolve access through the
     * authenticated Learning Supabase client.
     */

    const {
      data: hasAccess,
      error: accessError,
    } = await learningSupabase.rpc(
      "user_has_learning_product_access",
      {
        p_resource_id: resourceId,
      }
    );

    if (accessError) {
      console.error(
        "Failed to resolve learning resource access:",
        accessError
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify access to this Note.",
        },
        {
          status: 500,
        }
      );
    }

    if (hasAccess !== true) {
      return NextResponse.json(
        {
          error:
            "You do not have access to this Note.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 6. Find the active PDF attachment
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
     * 7. Defensive resource relationship check
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
     * 8. Create a short-lived signed URL
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
     * 9. Fetch the PDF on the server
     * -------------------------------------------------------
     *
     * We intentionally do NOT redirect the browser to the
     * Supabase signed URL.
     *
     * The server fetches the PDF and returns the PDF itself.
     *
     * This keeps the browser on:
     *
     * /learning/resources/[resourceId]/pdf
     *
     * and provides predictable PDF behavior for embedded
     * viewers.
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
     * 10. Return the actual PDF
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