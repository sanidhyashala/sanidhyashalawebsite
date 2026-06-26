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
          <button className="rounded-lg border border-blue-900 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50 transition">
            Sign In
          </button>
        </SignInButton>

        <SignUpButton mode="modal">
          <button className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 transition">
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