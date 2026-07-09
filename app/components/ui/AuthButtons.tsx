"use client";

import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export default function AuthButtons() {
  return (
    <div className="flex items-center gap-3">
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button
            className="
              rounded-xl
              border border-slate-300
              bg-white/70
              px-4 py-2.5
              text-sm font-medium
              text-slate-700
              backdrop-blur-md
              transition-all duration-300

              hover:border-blue-400
              hover:text-blue-700
              hover:shadow-sm

              dark:border-slate-700
              dark:bg-slate-900/70
              dark:text-slate-200
              dark:hover:border-blue-500
              dark:hover:text-blue-400
            "
          >
            Sign In
          </button>
        </SignInButton>

        <SignUpButton mode="modal">
          <button
            className="
              rounded-xl
              bg-blue-900
              px-4 py-2.5
              text-sm font-medium
              text-white
              transition-all duration-300

              hover:bg-blue-800
              hover:shadow-md

              dark:bg-blue-700
              dark:hover:bg-blue-600
            "
          >
            Sign Up
          </button>
        </SignUpButton>
      </Show>

      <Show when="signed-in">
        <UserButton />
      </Show>
    </div>
  );
}