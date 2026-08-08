"use client";

import {
  useEffect,
  useState,
  useCallback,
} from "react";
import { useUser } from "@clerk/nextjs";

import CommentsForm from "./CommentsForm";
import { ADMIN_IDS } from "@/lib/admin";

interface Comment {
  id: number;
  user_id: string;
  user_name: string;
  comment: string;
  created_at: string;
}

interface Props {
  articleSlug: string;
}

export default function CommentsSection({ articleSlug }: Props) {
  const { user } = useUser();

  const [comments, setComments] = useState<Comment[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // 👇 Ye raha aapka updated aur safe loadComments function
  const loadComments =
    useCallback(async (): Promise<void> => {
      try {
        const response = await fetch(
          `/api/journal/comments?articleSlug=${articleSlug}`
        );

        if (!response.ok) {
          setComments([]);
          return;
        }

        const data = await response.json();

        setComments(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(error);

        setComments([]);
      }
    }, [articleSlug]);

  async function deleteComment(commentId: number): Promise<void> {
    const confirmed = window.confirm("Delete this reflection?");

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/journal/comments/${commentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();

        alert(error.error || "Failed to delete comment");

        return;
      }

      loadComments();
    } catch (error) {
      console.error(error);
    }
  }

  function startEditing(comment: Comment): void {
    setEditingId(comment.id);
    setEditValue(comment.comment);
  }

  function cancelEditing(): void {
    setEditingId(null);
    setEditValue("");
  }

  async function saveComment(commentId: number): Promise<void> {
    const trimmedValue = editValue.trim();

    if (!trimmedValue) {
      alert("Comment cannot be empty.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/journal/comments/${commentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ comment: trimmedValue }),
        }
      );

      if (!response.ok) {
        const error = await response.json();

        alert(error.error || "Failed to update comment");

        return;
      }

      setEditingId(null);
      setEditValue("");

      await loadComments();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  return (
    <div className="mt-20">
      <CommentsForm articleSlug={articleSlug} onCommentAdded={loadComments} />

      <div className="mt-10 space-y-4">
        <h3 className="text-2xl font-semibold dark:text-blue-400">
          Reflections ({comments.length})
        </h3>

        {comments.length === 0 && (
          <p className="text-slate-500 dark:text-slate-400">
            No reflections yet. Be the first one.
          </p>
        )}

        {comments.map((comment) => {
          const isOwner = user?.id === comment.user_id;
          const isAdmin = user?.id
            ? ADMIN_IDS.includes(user.id)
            : false;

          const canModify = isOwner || isAdmin;
          const isEditing = editingId === comment.id;

          return (
            <div
              key={comment.id}
              className="rounded-xl border border-slate-200 p-5 dark:bg-slate-900 dark:border-slate-800"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{comment.user_name}</span>

                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={editValue}
                    onChange={(event) =>
                      setEditValue(event.target.value)
                    }
                    rows={4}
                    disabled={isSaving}
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none disabled:opacity-60 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
                  />

                  <div className="flex gap-4">
                    <button
                      onClick={() => saveComment(comment.id)}
                      disabled={isSaving}
                      className="text-sm font-medium text-green-700 hover:underline disabled:opacity-60 dark:text-green-400"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>

                    <button
                      onClick={cancelEditing}
                      disabled={isSaving}
                      className="text-sm font-medium text-slate-600 hover:underline disabled:opacity-60 dark:text-slate-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-slate-800 dark:text-slate-300">{comment.comment}</p>
              )}

              {canModify && !isEditing && (
                <div className="mt-4 flex gap-4">
                  <button
                    onClick={() => startEditing(comment)}
                    className="text-sm text-blue-700 hover:underline dark:text-blue-400"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="text-sm text-red-600 hover:underline dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}