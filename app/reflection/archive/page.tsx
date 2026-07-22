import Link from "next/link";

import {
  getAllPrompts,
} from "@/app/lib/prompt/prompt-service";

export default async function ReflectionArchivePage() {

  const prompts =
    await getAllPrompts();

  return (
    <main
      className="
        px-6
        py-24

        bg-slate-50
        dark:bg-slate-950
      "
    >

      <div className="mx-auto max-w-6xl">


        <Link
          href="/reflection"
          className="
            inline-flex
            text-sm
            font-medium

            text-slate-500

            transition-colors

            hover:text-blue-700

            dark:text-slate-400
            dark:hover:text-blue-300
          "
        >
          ← Back to Reflection
        </Link>


        <div className="mt-12">


          <p
            className="
              text-sm
              font-semibold
              uppercase
              tracking-[0.25em]

              text-blue-600

              dark:text-blue-400
            "
          >
            Reflection Archive
          </p>


          <h1
            className="
              mt-5

              text-5xl
              font-bold
              tracking-tight

              text-blue-900

              dark:text-blue-200
            "
          >
            Every question leaves
            behind a conversation.
          </h1>


          <p
            className="
              mt-8
              max-w-3xl

              text-lg
              leading-9

              text-slate-600

              dark:text-slate-300
            "
          >
            Every reflection belongs to a
            moment in time. Explore previous
            questions and revisit the thoughts
            shared by the SanidhyaShala
            community.
          </p>



          <div
            className="
              mt-20
              space-y-6
            "
          >

            {prompts.map((prompt) => (

              <div
                key={prompt.id}
                className="
                  rounded-3xl

                  border

                  border-blue-100

                  bg-white

                  p-8

                  transition-all

                  hover:border-blue-200
                  hover:shadow-lg

                  dark:border-slate-700
                  dark:bg-slate-900

                  dark:hover:border-blue-900
                "
              >


                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.25em]

                    text-blue-600

                    dark:text-blue-400
                  "
                >
                  Reflection Prompt
                </p>



                <h2
                  className="
                    mt-4

                    text-2xl
                    font-semibold

                    text-slate-900

                    dark:text-white
                  "
                >
                  {prompt.title}
                </h2>



                <p
                  className="
                    mt-4

                    leading-8

                    text-slate-600

                    dark:text-slate-300
                  "
                >
                  {prompt.description}
                </p>



                <div className="mt-8">


                  <Link
                    href={`/reflection/archive/${prompt.id}`}
                    className="
                      inline-flex
                      items-center

                      rounded-full

                      bg-blue-900

                      px-6
                      py-3

                      text-sm
                      font-medium

                      text-white

                      transition

                      hover:bg-blue-700


                      dark:bg-blue-500
                      dark:text-white
                      dark:hover:bg-blue-400
                    "
                  >
                    Open Archive →
                  </Link>


                </div>


              </div>

            ))}


          </div>


        </div>


      </div>


    </main>
  );
}