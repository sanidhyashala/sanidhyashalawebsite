import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import {
  getReflection,
} from "@/app/lib/reflection/reflection-service";

import ReflectionEditForm from "@/app/components/reflection/edit/ReflectionEditForm";


interface Props {
  params: Promise<{
    id: string;
  }>;
}


export default async function EditReflectionPage({
  params,
}: Props) {


  const { userId } = await auth();


  if (!userId) {
    notFound();
  }



  const { id } = await params;



  const reflection =
    await getReflection(id);



  if (!reflection) {
    notFound();
  }



  if (reflection.authorId !== userId) {
    notFound();
  }



  if (reflection.status !== "rejected") {
    notFound();
  }



  return (
    <main
      className="
        mx-auto
        max-w-3xl

        px-6
        py-20

        bg-slate-50
        dark:bg-slate-950
      "
    >


      <div>


        <h1
          className="
            text-4xl
            font-bold
            tracking-tight

            text-blue-900

            dark:text-blue-200
          "
        >
          Edit Reflection
        </h1>



        <p
          className="
            mt-3

            leading-7

            text-slate-600

            dark:text-slate-300
          "
        >
          Improve your reflection using the feedback below,
          then resubmit it for moderation.
        </p>



        <div
          className="
            mt-10

            rounded-3xl

            border

            border-blue-100

            bg-white

            p-6

            shadow-sm

            dark:border-slate-700
            dark:bg-slate-900
          "
        >

          <ReflectionEditForm
            reflection={reflection}
          />

        </div>


      </div>


    </main>
  );
}