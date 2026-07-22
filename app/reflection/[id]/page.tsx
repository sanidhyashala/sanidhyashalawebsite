import { notFound } from "next/navigation";

import ReflectionCard from "@/app/components/reflection/primitives/ReflectionCard";
import ReflectionMeta from "@/app/components/reflection/feed/ReflectionMeta";

import {
  getPublishedReflection,
} from "@/app/lib/reflection/reflection-service";


interface PageProps {
  params: Promise<{
    id: string;
  }>;
}


export default async function ReflectionDetailPage({
  params,
}: PageProps) {


  const { id } = await params;


  const reflection =
    await getPublishedReflection(id);



  if (!reflection) {
    notFound();
  }



  return (
    <main
      className="
        min-h-screen

        px-6
        py-24

        bg-slate-50
        dark:bg-slate-950
      "
    >

      <div
        className="
          mx-auto
          max-w-3xl
        "
      >


        <ReflectionCard>


          <div
            className="
              text-sm
              font-medium

              text-blue-600

              dark:text-blue-400
            "
          >
            Published Reflection
          </div>



          <h1
            className="
              mt-6

              text-4xl
              md:text-5xl

              font-bold

              leading-tight

              tracking-tight

              text-blue-900

              dark:text-blue-200
            "
          >
            {reflection.question}
          </h1>




          <div
            className="
              mt-6
            "
          >

            <ReflectionMeta
              author={reflection.authorName}
              createdAt={reflection.createdAt}
            />

          </div>




          <div
            className="
              my-10

              h-px

              bg-slate-200

              dark:bg-slate-700
            "
          />




          <article
            className="
              whitespace-pre-line

              text-lg

              leading-9

              text-slate-700

              dark:text-slate-300
            "
          >

            {reflection.content}

          </article>


        </ReflectionCard>


      </div>


    </main>
  );
}