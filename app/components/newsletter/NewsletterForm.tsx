"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!email.trim()) return;

    try {
      setLoading(true);
      setMessage("");

      const response =
        await fetch(
          "/api/newsletter/subscribe",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error
        );
      }

      setMessage(
        data.message
      );

      setEmail("");
    } catch {
      setMessage(
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-8 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
      <h2 className="mb-3 text-3xl font-bold text-blue-900 dark:text-blue-400">
        Join the Newsletter
      </h2>

      <p className="mb-6 text-slate-600 dark:text-slate-400">
        Receive new articles,
        reflections and learning
        resources directly in
        your inbox.
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 md:flex-row"
      >
        <input
          type="email"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          placeholder="Enter your email"
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:placeholder:text-slate-500"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-900 px-6 py-3 font-medium text-white transition hover:bg-blue-800 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          {loading
            ? "Subscribing..."
            : "Subscribe"}
        </button>
      </form>

      {message && (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          {message}
        </p>
      )}
    </section>
  );
}