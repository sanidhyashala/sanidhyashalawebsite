import Link from "next/link";

export default function Home() {
return ( <main> <section className="bg-slate-50 px-6 py-24 text-center"> <div className="mx-auto max-w-4xl"> <h1 className="mb-4 text-6xl font-bold text-blue-900">
सानिध्यशाला </h1>


      <p className="mb-4 text-xl font-medium text-slate-600">
        स्पष्टता से सिद्धि तक
      </p>

      <p className="mb-4 text-2xl text-slate-700">
        Learn. Teach. Reflect.
        
      </p>
      <div className="mb-8 flex flex-wrap justify-center gap-3 text-sm">
  <span className="rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm">
    Mathematics
  </span>

  <span className="rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm">
    Education
  </span>

  <span className="rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm">
    Philosophy
  </span>

  <span className="rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm">
    Reflection
  </span>
</div>

      <p className="mx-auto mb-8 max-w-3xl text-lg leading-8 text-slate-600">
        More than a mathematics website — a space where mathematics,
        education, philosophy and thoughtful reflection meet.
      </p>

      <div className="flex flex-wrap justify-center gap-4">
  <Link
    href="/journal"
    className="rounded-lg bg-blue-900 px-6 py-3 text-white transition hover:bg-blue-800"
  >
    Explore Journal
  </Link>

  <Link
    href="/about"
    className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-slate-700 transition hover:bg-slate-100"
  >
    About the Founder
  </Link>
</div>
    </div>
  </section>

  <section className="px-6 py-20">
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-6 text-4xl font-bold text-blue-900">
  What is Sanidhyashala?
</h2>

<p className="text-lg leading-8 text-slate-700">
  Sanidhyashala is more than a mathematics website. It is a space dedicated
  to learning, teaching, reflection, and the pursuit of clarity.
</p>

<p className="mt-6 text-lg leading-8 text-slate-700">
  In a world where education is often reduced to examinations, marks, and
  competition, Sanidhyashala seeks to return to a simpler question:
  <em> What does it truly mean to learn? </em>
</p>

<p className="mt-6 text-lg leading-8 text-slate-700">
  Through mathematics, education, philosophy, and thoughtful writing,
  Sanidhyashala explores ideas that help us understand the world more
  clearly and think more deeply.
</p>


    </div>
  </section>

  <section className="bg-slate-50 px-6 py-20">
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-8 text-4xl font-bold text-blue-900">
        Latest Journal Entry
      </h2>

      <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
  <div className="mb-4 flex flex-wrap gap-2">
    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-900">
      Featured
    </span>

    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
      English + हिन्दी
    </span>
  </div>

  <h3 className="mb-4 text-3xl font-bold text-blue-900">
    When the Language of the Universe Falls Silent
  </h3>

  <p className="mb-6 text-lg leading-8 text-slate-600">
    Is mathematics discovered or invented?
    A journey through Plato, the Upanishads,
    Aryabhata, Ramanujan, Einstein and the mysterious
    relationship between consciousness and truth.
  </p>

  <div className="mb-6 flex items-center gap-4 text-sm text-slate-500">
    <span>📖 18 min read</span>
    <span>🌍 Bilingual</span>
  </div>

  <Link
    href="/journal/when-the-language-of-the-universe-falls-silent"
    className="font-semibold text-blue-900 hover:underline"
  >
    Read Featured Essay →
  </Link>
</div>
    </div>
  </section>

  <section className="bg-slate-50 px-6 py-20">
    <div className="mx-auto max-w-4xl rounded-3xl bg-white p-12 text-center shadow-sm">
      <h2 className="mb-6 text-4xl font-bold text-blue-900">
  संस्थापक की ओर से
</h2>

<p className="mx-auto max-w-2xl text-lg leading-8 text-slate-700">
  सानिध्यशाला की शुरुआत एक वेबसाइट के रूप में नहीं हुई थी।
</p>

<p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-700">
  यह एक विचार के रूप में आरम्भ हुई थी — कि शिक्षा का उद्देश्य केवल
  परीक्षाओं में सफलता प्राप्त करना नहीं, बल्कि विचारों में स्पष्टता
  और जीवन में समझ विकसित करना भी है।
</p>

<p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-700">
  गणित ने मुझे केवल सूत्र और समीकरण नहीं सिखाए। उसने मुझे धैर्य,
  तर्क, ईमानदारी और गहरे प्रश्न पूछने का साहस दिया। समय के साथ
  मैंने अनुभव किया कि सीखना किसी पाठ्यक्रम, कक्षा या प्रमाणपत्र
  तक सीमित नहीं होता; यह जीवन भर चलने वाली एक यात्रा है।
</p>

<p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-700">
  सानिध्यशाला उसी विश्वास का एक छोटा सा प्रयास है — एक ऐसा स्थान
  जहाँ गणित, शिक्षा, चिंतन और जिज्ञासा एक साथ आ सकें; जहाँ प्रश्नों
  का स्वागत हो और समझ को स्मरण से अधिक महत्व दिया जाए।
</p>

<p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-700">
  यदि आप यहाँ एक विद्यार्थी, एक शिक्षक, या केवल एक जिज्ञासु पथिक
  के रूप में आए हैं, तो आपका हार्दिक स्वागत है।
</p>

<p className="mt-8 text-lg font-semibold text-blue-900">
  — मानस
</p>

    </div>
  </section>
</main>


);
}
