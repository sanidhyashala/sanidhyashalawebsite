import { auth } from "@clerk/nextjs/server";

import {
  getReflectionsByAuthor,
} from "@/app/lib/reflection/reflection-service";

import ReflectionDashboardStats from "@/app/components/reflection/dashboard/ReflectionDashboardStats";

import MyReflectionCard from "@/app/components/reflection/dashboard/MyReflectionCard";


export default async function ReflectionDashboardPage() {

  const { userId } = await auth();


  if (!userId) {
    return (
      <main
        className="
          mx-auto
          max-w-5xl

          px-6
          py-24

          bg-slate-50
          dark:bg-slate-950
        "
      >

        <h1
          className="
            text-3xl
            font-bold

            text-blue-900

            dark:text-blue-200
          "
        >
          My Reflections
        </h1>


        <p
          className="
            mt-4

            text-slate-600

            dark:text-slate-300
          "
        >
          Please sign in to view your reflections.
        </p>


      </main>
    );
  }



  const reflections =
    await getReflectionsByAuthor(userId);



  const pending = reflections.filter(
    (item) => item.status === "pending"
  ).length;


  const published = reflections.filter(
    (item) => item.status === "published"
  ).length;


  const rejected = reflections.filter(
    (item) => item.status === "rejected"
  ).length;


  const archived = reflections.filter(
    (item) => item.status === "archived"
  ).length;



  return (
    <main
      className="
        mx-auto
        max-w-5xl

        px-6
        py-24

        bg-slate-50
        dark:bg-slate-950
      "
    >


      <h1
        className="
          text-4xl
          font-bold
          tracking-tight

          text-blue-900

          dark:text-blue-200
        "
      >
        My Reflections
      </h1>



      <p
        className="
          mt-3

          text-slate-600

          dark:text-slate-300
        "
      >
        Track every reflection you&apos;ve shared with
        SanidhyaShala.
      </p>




      <div className="mt-10">

        <ReflectionDashboardStats
          pending={pending}
          published={published}
          rejected={rejected}
          archived={archived}
        />

      </div>




      <div
        className="
          mt-12
          space-y-4
        "
      >


        {reflections.length === 0 ? (

          <div
            className="
              rounded-2xl

              border
              border-dashed

              border-blue-200

              bg-white

              p-8

              text-center

              text-slate-500

              dark:border-slate-700
              dark:bg-slate-900
              dark:text-slate-400
            "
          >
            You haven&apos;t written any reflections yet.
          </div>


        ) : (


          reflections.map((reflection) => (

            <MyReflectionCard
              key={reflection.id}
              reflection={reflection}
            />

          ))


        )}


      </div>


    </main>
  );
}