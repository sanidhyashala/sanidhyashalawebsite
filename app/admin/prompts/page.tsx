import AdminPage from "../components/layout/AdminPage";

import {
  createPrompt,
  activatePromptAction,
} from "@/app/lib/prompt/prompt-actions";
import {
  getAllPrompts,
  getNotificationDashboard,
} from "@/app/lib/prompt/prompt-service";

import NotifyCommunityCard from "../components/NotifyCommunityCard";

export default async function PromptManagementPage() {
  const prompts = await getAllPrompts();
  const dashboard =
  await getNotificationDashboard();

  return (
    <AdminPage
      title="Reflection Prompts"
      description="Manage every reflection prompt from one place."
      sectionTitle="All Prompts"
    >
      {/* Create Prompt */}

      <form
        action={createPrompt}
        className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <h2 className="text-xl font-semibold">
          Create New Prompt
        </h2>

        <div className="mt-8 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Prompt Title
            </label>

            <input
              name="title"
              required
              placeholder="Can learning exist without comparison?"
              className="
                w-full
                rounded-xl
                border
                border-slate-300
                px-4
                py-3

                dark:border-slate-700
                dark:bg-slate-950
              "
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

            <textarea
              name="description"
              required
              rows={4}
              placeholder="Today's invitation..."
              className="
                w-full
                rounded-xl
                border
                border-slate-300
                px-4
                py-3

                dark:border-slate-700
                dark:bg-slate-950
              "
            />
          </div>

          <button
            type="submit"
            className="
              rounded-xl
              bg-slate-900
              px-6
              py-3
              text-white

              dark:bg-white
              dark:text-slate-900
            "
          >
            Create Prompt
          </button>
        </div>
      </form>

      <NotifyCommunityCard
  promptTitle={dashboard.prompt.title}
  promptDescription={dashboard.prompt.description}
  subscriberCount={dashboard.subscriberCount}
  notificationRecipients={
  dashboard.prompt.notificationRecipients
}
  notificationSent={dashboard.notificationSent}
  sentAt={dashboard.prompt.notificationSentAt}
  delivered={dashboard.delivered}
  failed={dashboard.failed}
/>

      {/* Prompt List */}

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">

        <h2 className="text-xl font-semibold">
          Existing Prompts
        </h2>

        <div className="mt-8 space-y-4">

          {prompts.length === 0 ? (
            <p className="text-slate-500">
              No prompts created yet.
            </p>
          ) : (
            prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="
                  flex
                  items-start
                  justify-between
                  rounded-2xl
                  border
                  border-slate-200
                  p-5

                  dark:border-slate-700
                "
              >
                <div>
                  <h3 className="font-semibold">
                    {prompt.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {prompt.description}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-3">

  <span
    className={`
      rounded-full
      px-3
      py-1
      text-xs
      font-medium

      ${
        prompt.isActive
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }
    `}
  >
    {prompt.isActive
      ? "Active"
      : "Inactive"}
  </span>

  {!prompt.isActive && (
    <form action={activatePromptAction}>

      <input
        type="hidden"
        name="id"
        value={prompt.id}
      />

      <button
        type="submit"
        className="
          rounded-xl
          bg-slate-900
          px-4
          py-2
          text-sm
          text-white
          transition

          hover:bg-slate-800

          dark:bg-white
          dark:text-slate-900
        "
      >
        Make Active
      </button>

    </form>
  )}

</div>

              </div>
            ))
          )}

        </div>

      </section>
    </AdminPage>
  );
}