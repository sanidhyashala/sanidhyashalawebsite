"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { moderateReflection } from "@/app/actions/admin.actions";

import ActionButton from "@/app/admin/components/ui/ActionButton";
import RejectReflectionDialog from "./RejectReflectionDialog";

interface Props {
  reflectionId: string;
}

export default function ReflectionModerationActions({
  reflectionId,
}: Props) {
  const router = useRouter();

  const [isPending, startTransition] =
    useTransition();

  const [rejectDialogOpen, setRejectDialogOpen] =
    useState(false);

  function handleModeration(
    status: "published" | "rejected" | "archived"
  ) {
    startTransition(async () => {
      await moderateReflection(
        reflectionId,
        status
      );

      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">

        <ActionButton
          variant="success"
          disabled={isPending}
          onClick={() =>
            handleModeration("published")
          }
        >
          {isPending
            ? "Publishing..."
            : "Publish"}
        </ActionButton>

        <ActionButton
          variant="danger"
          disabled={isPending}
          onClick={() =>
            setRejectDialogOpen(true)
          }
        >
          Reject
        </ActionButton>

        <ActionButton
          variant="secondary"
          disabled={isPending}
          onClick={() =>
            handleModeration("archived")
          }
        >
          {isPending
            ? "Archiving..."
            : "Archive"}
        </ActionButton>

      </div>

      <RejectReflectionDialog
        open={rejectDialogOpen}
        loading={isPending}
        onClose={() =>
          setRejectDialogOpen(false)
        }
        onSubmit={(
          rejectionReason,
          adminNote
        ) => {
          startTransition(async () => {
            await moderateReflection(
              reflectionId,
              "rejected",
              rejectionReason,
              adminNote
            );

            setRejectDialogOpen(false);

            router.refresh();
          });
        }}
      />
    </>
  );
}