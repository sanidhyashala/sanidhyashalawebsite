"use client";

import { useState } from "react";
import Link from "next/link";

type Language = "en" | "hi";

const content = {
  en: {
    title: "A Place to Learn, Think, and Reflect",

    opening: [
      "Today, education is easier to access than it has ever been. Lessons, notes, questions, tests, explanations, and answers are available almost everywhere. Yet, with all this abundance, one question can still remain surprisingly difficult to answer: What does it actually mean to learn?",
      "SanidhyaShala began with this question. Not with the intention of creating just another place for lessons or practice, but with the feeling that learning can be something wider and deeper than completing a syllabus, preparing for an examination, or collecting marks."
    ],

    whyExistsTitle: "Why SanidhyaShala Exists",

    whyExists: [
      "Learning is often imagined as a straight line: study something, practise it, get the answer right, move ahead. There is value in that discipline, and practice matters deeply. But learning does not always move in such a straight line. Sometimes learning means seeing an idea clearly for the first time. Sometimes it means realizing that something we thought we understood was incomplete. Sometimes two ideas connect after a long time. And sometimes learning ends not with a better answer, but with a better question.",
      "SanidhyaShala exists to make room for all of this. It is a space where learning, teaching, reflection, and curiosity can exist together—where knowledge is not treated only as something to collect, but also as something to understand, examine, and live with."
    ],

    learningTitle: "Learning",

    learning: [
      "Learning at SanidhyaShala begins with understanding. It includes practice through MCQs, learning through Notes, and deeper engagement through Subjective Practice. Each has a different purpose, but the intention behind them is connected: to help a learner move from simply knowing an answer towards understanding the thinking that produces it.",
      "Subjective practice is especially important in this journey because an answer can tell us whether something is right or wrong, while a solution can reveal how we arrived there. The purpose was never to collect marks. It is to understand how you think."
    ],

    learningCta: "Explore Learning →",

    reflectionTitle: "Reflection",

    reflection: [
      "Some questions cannot be understood by answering them quickly. They need time, attention, and sometimes even silence. In a world that constantly moves from one thing to the next, there are questions we rarely stop long enough to sit with.",
      "Reflection is an attempt to create that pause. Here, there may be no model answer waiting at the end. You are not expected to agree with what you read. You are simply invited to slow down, pay attention, and notice what a question does within you. Some questions do not change what we know; they change the way we see."
    ],

    reflectionQuote:
      "Read slowly. Observe honestly. Notice what stays with you.",

    reflectionCta: "Enter Reflection →",

    journalTitle: "Journal",

    journal: [
      "Some ideas need more space than a lesson or a short explanation can provide. The Journal is that space—a place for longer explorations into mathematics, learning, education, philosophy, thought, patterns, and reality.",
      "A question about mathematics may lead towards a question about reality. A question about learning may lead towards the mind. A question about education may eventually lead towards the person we are becoming. The Journal is not meant only to inform. It is an invitation to think carefully, follow an idea beyond its obvious boundary, and perhaps leave with something worth carrying forward."
    ],

    journalCta: "Explore the Journal →",

    beyondMathTitle: "Beyond Mathematics",

    beyondMath: [
      "Mathematics has a special place in SanidhyaShala because it teaches habits of mind that extend far beyond mathematics itself. It teaches us to distinguish what appears true from what can actually be shown. It teaches patience, attention, the importance of questioning assumptions, and the discipline of following reasoning wherever it leads. It also teaches us that mistakes are not always failures; sometimes they are part of the path towards understanding.",
      "There is a particular kind of quiet moment in mathematics when something that seemed impossible suddenly becomes clear. That moment is not only about solving a problem. It is about seeing differently.",
      "Mathematics is a doorway. Learning is the larger journey."
    ],

    connectedTitle: "Learning, Teaching, Reflection, and the Journal",

    connected: [
      "These parts of SanidhyaShala are not meant to exist as separate destinations. They are different expressions of the same larger process. Learning is about understanding. Teaching is about making understanding possible for someone else. Reflection gives us a chance to pause and notice what learning is doing within us. The Journal provides room to explore questions that may not have immediate answers.",
      "Together, they form a space where education can be approached not only as preparation for what comes next, but also as an opportunity to understand what is happening now."
    ],

    differentTitle: "A Different Kind of Educational Space",

    different: [
      "People come to a learning space for different reasons. Someone may come to practise before an examination. Someone may want to strengthen a concept they never fully understood. Someone may want to understand a mistake. Someone may come to read, question, or simply follow a curiosity.",
      "SanidhyaShala does not try to impose a single definition of learning on everyone. Instead, it tries to create a space where each person can approach learning with a little more attention, honesty, and curiosity."
    ],

    believeTitle: "What We Believe",

    believe: [
      "We believe that understanding is deeper than memorisation, that clarity matters more than complexity for its own sake, and that practice and reflection are not opposites but companions. We believe that questions have value even before they have answers, that mistakes can become part of understanding, and that curiosity deserves a place in education.",
      "Education should not only help us know more. It should also help us see more clearly."
    ],

    nameTitle: "Why the Name SanidhyaShala?",

    name: [
      "The word “Shala” points naturally towards a place of learning. “Sanidhya” means nearness, presence, or being close. Together, SanidhyaShala can be understood as a place of learning through nearness—not merely physical nearness, but intellectual and inner nearness.",
      "To learn deeply, we sometimes have to come close to an idea rather than pass over it. To understand a question, we may have to stay with it for a while. To notice a mistake, we have to look at it without immediately turning away. Attention creates a kind of nearness, and that nearness can change what we see.",
      "Perhaps, then, SanidhyaShala is about learning to come closer: closer to an idea, closer to a question, closer to understanding, and sometimes, closer to ourselves.",
      "It is not meant as a grand claim. It is simply the direction the name points towards."
    ],

    nameEnding:
      "Learning, close to what we are trying to understand.",

    purposeTitle: "Our Purpose",

    purpose: [
      "The purpose of SanidhyaShala is to create a space where learning is not reduced to information, practice is not reduced to marks, teaching is not reduced to giving answers, and reflection does not feel out of place.",
      "We want this to be a place where you can learn with understanding, practise with purpose, teach thoughtfully, read with curiosity, and reflect honestly.",
      "Education does not always have to be loud. Sometimes learning begins quietly."
    ],

    beginTitle: "Begin Anywhere",

    begin: [
      "There is no single correct place to begin. You can start by learning something, practising a question, reading an idea, entering a reflection, or simply following a question that has stayed with you.",
      "You can begin wherever you are."
    ],

    exploreTitle: "Explore SanidhyaShala",

    explore: [
      "Explore Learning, Teaching, Reflection, or the Journal. There is no required order. Follow what feels meaningful to you, and allow one part to lead naturally towards another."
    ],

    finalTitle: "A Final Thought",

    final: [
      "Perhaps education is not only about finding the next answer. Perhaps it is also about becoming capable of asking better questions.",
      "Meaningful learning can give us clarity about what we know, but it can also give us clarity about what deserves to be questioned next."
    ],

    finalLine:
      "SanidhyaShala — Learning deeply. Teaching thoughtfully. Reflecting honestly."
  },

  hi: {
    title: "सीखने, सोचने और चिंतन करने का एक स्थान",

    opening: [
      "आज शिक्षा तक पहुँचना पहले की तुलना में कहीं आसान हो गया है। पाठ, नोट्स, प्रश्न, टेस्ट, व्याख्याएँ और उत्तर लगभग हर जगह उपलब्ध हैं। फिर भी, इस इतनी अधिक उपलब्धता के बीच एक प्रश्न का उत्तर देना आज भी उतना ही कठिन हो सकता है—आख़िर वास्तव में सीखना है क्या?",
      "सानिध्यशाला की शुरुआत इसी प्रश्न से हुई। इसका उद्देश्य केवल एक और ऐसी जगह बनाना नहीं था जहाँ पाठ पढ़े जाएँ या प्रश्नों का अभ्यास किया जाए, बल्कि इस विचार से हुआ कि सीखना केवल पाठ्यक्रम पूरा करने, परीक्षा की तैयारी करने या अंक प्राप्त करने से कहीं अधिक व्यापक और गहरी प्रक्रिया हो सकती है।"
    ],

    whyExistsTitle: "सानिध्यशाला क्यों है?",

    whyExists: [
      "हम अक्सर सीखने की कल्पना एक सीधी रेखा की तरह करते हैं—कुछ पढ़ो, उसका अभ्यास करो, उत्तर सही करो और आगे बढ़ जाओ। इस अनुशासन का अपना महत्व है और अभ्यास सीखने का एक बहुत महत्वपूर्ण हिस्सा है। लेकिन सीखना हमेशा इतनी सीधी रेखा में नहीं चलता। कभी सीखने का अर्थ किसी विचार को पहली बार वास्तव में स्पष्ट रूप से देख पाना होता है। कभी इसका अर्थ यह समझना होता है कि जिसे हम समझते थे, वह अभी अधूरा था। कभी दो अलग-अलग विचार बहुत समय बाद आपस में जुड़ते हैं। और कभी-कभी सीखना किसी बेहतर उत्तर पर नहीं, बल्कि किसी बेहतर प्रश्न पर जाकर समाप्त होता है।",
      "सानिध्यशाला इन सभी अनुभवों के लिए थोड़ी जगह बनाने का प्रयास है। यहाँ सीखना, अध्यापन, चिंतन और जिज्ञासा एक-दूसरे से अलग नहीं हैं। ज्ञान को केवल इकट्ठा करने की वस्तु के रूप में नहीं, बल्कि समझने, देखने, परखने और अपने भीतर जगह देने वाली चीज़ के रूप में देखा जाता है।"
    ],

    learningTitle: "अध्ययन",

    learning: [
      "सानिध्यशाला में अध्ययन की शुरुआत समझ से होती है। इसमें MCQs के माध्यम से अभ्यास, Notes के माध्यम से सीखना और Subjective Practice के माध्यम से किसी विचार के साथ थोड़ा अधिक गहराई से जुड़ना शामिल है। इन सभी के उद्देश्य अलग हो सकते हैं, लेकिन इनके पीछे की दिशा एक ही है—सिर्फ उत्तर जानने से आगे बढ़कर उस सोच को समझना जिसके कारण वह उत्तर सामने आया।",
      "Subjective Practice इस यात्रा में विशेष रूप से महत्वपूर्ण है, क्योंकि कोई उत्तर हमें यह बता सकता है कि परिणाम सही है या गलत, लेकिन किसी समाधान को देखने से यह समझ में आता है कि हम वहाँ तक पहुँचे कैसे। उद्देश्य कभी केवल अंक इकट्ठा करना नहीं था। उद्देश्य यह समझना था कि आप सोचते कैसे हैं।"
    ],

    learningCta: "Explore Learning →",

    reflectionTitle: "चिंतन",

    reflection: [
      "कुछ प्रश्न ऐसे होते हैं जिन्हें जल्दी से उत्तर देकर समझा नहीं जा सकता। उन्हें समय चाहिए, ध्यान चाहिए और कभी-कभी मौन भी चाहिए। एक ऐसी दुनिया में जो लगातार हमें एक चीज़ से दूसरी चीज़ की ओर आगे बढ़ाती रहती है, कुछ प्रश्नों के साथ बैठने के लिए हम बहुत कम रुकते हैं।",
      "चिंतन उस ठहराव के लिए एक छोटी-सी जगह बनाने का प्रयास है। यहाँ अंत में कोई निश्चित या आदर्श उत्तर आपका इंतज़ार नहीं कर रहा। आपसे यह अपेक्षा नहीं है कि आप जो पढ़ें उससे सहमत ही हों। केवल इतना निमंत्रण है कि थोड़ा धीरे हों, ध्यान से देखें और महसूस करें कि कोई प्रश्न आपके भीतर क्या कर रहा है। कुछ प्रश्न हमारे ज्ञान को नहीं बदलते; वे हमारे देखने के तरीके को बदल देते हैं।"
    ],

    reflectionQuote:
      "धीरे पढ़िए। ईमानदारी से देखिए। और ध्यान दीजिए कि आपके भीतर क्या ठहर जाता है।",

    reflectionCta: "Enter Reflection →",

    journalTitle: "जर्नल",

    journal: [
      "कुछ विचारों को उतनी जगह चाहिए होती है जितनी किसी पाठ या छोटे-से स्पष्टीकरण में नहीं मिल सकती। जर्नल वही जगह है—गणित, सीखने, शिक्षा, दर्शन, विचार, पैटर्न और वास्तविकता जैसे विषयों पर थोड़ी लंबी और गहरी खोज के लिए एक स्थान।",
      "गणित के बारे में पूछा गया कोई प्रश्न कभी वास्तविकता के प्रश्न तक पहुँच सकता है। सीखने के बारे में सोचा गया कोई प्रश्न मन तक पहुँच सकता है। शिक्षा के बारे में विचार करते-करते प्रश्न उस व्यक्ति तक पहुँच सकता है जो हम बन रहे हैं। जर्नल का उद्देश्य केवल जानकारी देना नहीं है। यह किसी विचार के साथ सावधानी से चलने, उसकी स्पष्ट सीमा से थोड़ा आगे जाने और शायद अपने साथ कुछ ऐसा लेकर लौटने का निमंत्रण है जो आगे भी हमारे भीतर बना रहे।"
    ],

    journalCta: "Explore the Journal →",

    beyondMathTitle: "गणित से आगे",

    beyondMath: [
      "सानिध्यशाला में गणित का एक विशेष स्थान है, क्योंकि गणित हमें ऐसी सोच की आदतें सिखाता है जो गणित की सीमा से बहुत आगे जाती हैं। यह हमें दिखाई देने वाली सच्चाई और वास्तव में सिद्ध की जा सकने वाली बात के बीच अंतर करना सिखाता है। यह धैर्य, ध्यान, अपनी धारणाओं पर प्रश्न करने और तर्क को जहाँ तक वह ले जाए वहाँ तक उसका अनुसरण करने की आदत देता है। यह हमें यह भी सिखाता है कि गलती हमेशा असफलता नहीं होती; कभी-कभी वह समझ तक पहुँचने की यात्रा का हिस्सा होती है।",
      "गणित में एक ऐसा शांत क्षण आता है जब कोई बात जो कुछ देर पहले असंभव लग रही थी, अचानक स्पष्ट हो जाती है। वह क्षण केवल किसी प्रश्न को हल करने का नहीं होता। वह अलग ढंग से देखने का क्षण होता है।",
      "गणित एक महत्वपूर्ण द्वार है। लेकिन सीखने की यात्रा उससे कहीं बड़ी है।"
    ],

    connectedTitle: "अध्ययन, अध्यापन, चिंतन और जर्नल",

    connected: [
      "सानिध्यशाला के ये हिस्से अलग-अलग मंज़िलों की तरह नहीं हैं। ये एक ही बड़ी प्रक्रिया के अलग-अलग रूप हैं। अध्ययन समझने की प्रक्रिया है। अध्यापन किसी दूसरे व्यक्ति के लिए समझ को संभव बनाने का प्रयास है। चिंतन हमें रुककर यह देखने का अवसर देता है कि सीखना हमारे भीतर क्या कर रहा है। और जर्नल उन प्रश्नों को जगह देता है जिनके उत्तर तुरंत मिलना आवश्यक नहीं है।",
      "ये सभी मिलकर शिक्षा को केवल आने वाली किसी परीक्षा या अगले चरण की तैयारी के रूप में देखने के बजाय, इस समय हमारे भीतर और हमारे आसपास क्या घट रहा है उसे समझने का अवसर बनाते हैं।"
    ],

    differentTitle: "एक अलग तरह का शैक्षिक स्थान",

    different: [
      "लोग किसी सीखने की जगह पर अलग-अलग कारणों से आते हैं। कोई परीक्षा से पहले अभ्यास करने आता है। कोई उस अवधारणा को मजबूत करना चाहता है जिसे वह कभी पूरी तरह समझ नहीं पाया। कोई अपनी गलती को समझना चाहता है। कोई पढ़ने, प्रश्न करने या केवल अपनी जिज्ञासा का अनुसरण करने आता है।",
      "सानिध्यशाला सबके लिए सीखने की एक ही परिभाषा तय करने की कोशिश नहीं करता। इसका प्रयास केवल इतना है कि ऐसी जगह बनाई जा सके जहाँ हर व्यक्ति थोड़े अधिक ध्यान, ईमानदारी और जिज्ञासा के साथ सीखने के पास आ सके।"
    ],

    believeTitle: "हम क्या मानते हैं?",

    believe: [
      "हम मानते हैं कि समझ, केवल याद कर लेने से कहीं गहरी होती है। हम मानते हैं कि केवल जटिल होने की कोशिश करने से अधिक महत्वपूर्ण स्पष्टता है और अभ्यास तथा चिंतन एक-दूसरे के विरोधी नहीं, बल्कि साथी हैं। हम मानते हैं कि किसी प्रश्न का उत्तर मिलना ही उसका मूल्य नहीं है; प्रश्न स्वयं भी मूल्यवान हो सकता है। हम यह भी मानते हैं कि गलतियाँ समझ का हिस्सा बन सकती हैं और जिज्ञासा को शिक्षा में अपनी जगह मिलनी चाहिए।",
      "शिक्षा का उद्देश्य केवल यह नहीं होना चाहिए कि हम अधिक जानें। उसका एक उद्देश्य यह भी होना चाहिए कि हम अधिक स्पष्टता से देख सकें।"
    ],

    nameTitle: "सानिध्यशाला नाम क्यों?",

    name: [
      "“शाला” शब्द स्वाभाविक रूप से सीखने के एक स्थान की ओर संकेत करता है। “सानिध्य” का अर्थ है निकटता, उपस्थिति या पास होना। इन दोनों को साथ रखें तो सानिध्यशाला को सीखने के ऐसे स्थान के रूप में समझा जा सकता है जहाँ सीखना निकटता के माध्यम से होता है—सिर्फ भौतिक निकटता नहीं, बल्कि बौद्धिक और आंतरिक निकटता।",
      "गहराई से सीखने के लिए कभी-कभी किसी विचार के ऊपर से निकल जाने के बजाय उसके पास जाना पड़ता है। किसी प्रश्न को समझने के लिए उसके साथ कुछ समय रहना पड़ सकता है। किसी गलती को देखने के लिए हमें उससे तुरंत मुँह मोड़ने के बजाय उसे ध्यान से देखना पड़ता है। ध्यान एक तरह की निकटता पैदा करता है और यही निकटता हमारे देखने के तरीके को बदल सकती है।",
      "शायद सानिध्यशाला का अर्थ इसी तरह पास आना सीखना है—किसी विचार के पास, किसी प्रश्न के पास, समझ के पास और कभी-कभी स्वयं अपने पास।",
      "यह कोई बहुत बड़ा दावा नहीं है। बस उस दिशा की ओर एक संकेत है जिसकी ओर यह नाम हमें ले जाता है।"
    ],

    nameEnding:
      "सीखने के पास। प्रश्नों के पास। समझ के पास। और शायद—स्वयं के पास।",

    purposeTitle: "हमारा उद्देश्य",

    purpose: [
      "सानिध्यशाला का उद्देश्य ऐसी जगह बनाना है जहाँ सीखना केवल जानकारी तक सीमित न हो, अभ्यास केवल अंकों तक सीमित न हो, अध्यापन केवल उत्तर देने तक सीमित न हो और चिंतन शिक्षा से अलग या अस्वाभाविक न लगे।",
      "हम चाहते हैं कि यह ऐसी जगह हो जहाँ आप समझ के साथ सीख सकें, उद्देश्य के साथ अभ्यास कर सकें, विचारशीलता के साथ पढ़ा सकें, जिज्ञासा के साथ पढ़ सकें और ईमानदारी से चिंतन कर सकें।",
      "शिक्षा को हमेशा शोरपूर्ण होने की आवश्यकता नहीं है। कभी-कभी सीखना बहुत शांत ढंग से शुरू होता है।"
    ],

    beginTitle: "कहीं से भी शुरुआत कीजिए",

    begin: [
      "शुरुआत करने की कोई एक सही जगह नहीं है। आप किसी चीज़ को सीखने से शुरुआत कर सकते हैं, किसी प्रश्न का अभ्यास कर सकते हैं, किसी विचार को पढ़ सकते हैं, किसी चिंतन में प्रवेश कर सकते हैं या केवल उस प्रश्न का अनुसरण कर सकते हैं जो लंबे समय से आपके भीतर बना हुआ है।",
      "आप जहाँ हैं, वहीं से शुरुआत कर सकते हैं।"
    ],

    exploreTitle: "सानिध्यशाला को देखिए",

    explore: [
      "Learning, Teaching, Reflection या Journal में से किसी भी जगह से शुरुआत कीजिए। कोई निश्चित क्रम आवश्यक नहीं है। जो आपके लिए इस समय अर्थपूर्ण है, उसका अनुसरण कीजिए और देखिए कि कैसे एक हिस्सा स्वाभाविक रूप से दूसरे हिस्से तक ले जाता है।"
    ],

    finalTitle: "एक अंतिम विचार",

    final: [
      "शायद शिक्षा केवल अगला उत्तर खोजने का नाम नहीं है। शायद यह बेहतर प्रश्न पूछने की क्षमता विकसित करने का नाम भी है।",
      "अर्थपूर्ण सीख हमें यह स्पष्टता दे सकती है कि हम क्या जानते हैं, लेकिन वह यह स्पष्टता भी दे सकती है कि अब अगला कौन-सा प्रश्न ऐसा है जिसके सामने हमें थोड़ी देर रुकना चाहिए।"
    ],

    finalLine:
      "सानिध्यशाला — गहराई से सीखना। विचारशीलता से पढ़ाना। ईमानदारी से चिंतन करना।"
  }
};

function Paragraphs({
  paragraphs,
}: {
  paragraphs: string[];
}) {
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          className="
            mb-6
            text-justify
            text-[17px]
            leading-8
            text-slate-800
            dark:text-slate-300
            md:text-lg
          "
        >
          {paragraph}
        </p>
      ))}
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className="
          mt-16
          mb-6
          text-3xl
          font-bold
          leading-tight
          tracking-tight
          text-blue-900
          dark:text-blue-400
          md:text-4xl
        "
      >
        {title}
      </h2>

      {children}
    </section>
  );
}

export default function AboutContent() {
  const [language, setLanguage] =
    useState<Language>("en");

  const active = content[language];

  return (
    <>
      {/* Language Switcher */}
      <div className="mb-10 flex">
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              language === "en"
                ? "bg-blue-600 text-white"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            English
          </button>

          <button
            type="button"
            onClick={() => setLanguage("hi")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              language === "hi"
                ? "bg-blue-600 text-white"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            हिन्दी
          </button>
        </div>
      </div>

      {/* Hero */}
      <h1
        className="
          mb-8
          text-4xl
          font-bold
          leading-[1.15]
          tracking-tight
          text-blue-900
          dark:text-blue-400
          md:text-5xl
        "
      >
        {active.title}
      </h1>

      <Paragraphs paragraphs={active.opening} />

      {/* Why */}
      <Section title={active.whyExistsTitle}>
        <Paragraphs paragraphs={active.whyExists} />
      </Section>

      {/* Learning */}
      <Section title={active.learningTitle}>
        <Paragraphs paragraphs={active.learning} />

        <Link
          href="/learning"
          className="
            mt-2
            inline-flex
            font-medium
            text-blue-700
            transition
            hover:text-blue-900
            dark:text-blue-400
            dark:hover:text-blue-300
          "
        >
          {active.learningCta}
        </Link>
      </Section>

      {/* Reflection */}
      <Section title={active.reflectionTitle}>
        <Paragraphs paragraphs={active.reflection} />

        <blockquote
          className="
            my-8
            border-l-4
            border-blue-600
            pl-6
            text-lg
            italic
            leading-8
            text-slate-600
            dark:text-slate-400
          "
        >
          {active.reflectionQuote}
        </blockquote>

        <Link
          href="/reflection"
          className="
            mt-2
            inline-flex
            font-medium
            text-blue-700
            transition
            hover:text-blue-900
            dark:text-blue-400
            dark:hover:text-blue-300
          "
        >
          {active.reflectionCta}
        </Link>
      </Section>

      {/* Journal */}
      <Section title={active.journalTitle}>
        <Paragraphs paragraphs={active.journal} />

        <Link
          href="/journal"
          className="
            mt-2
            inline-flex
            font-medium
            text-blue-700
            transition
            hover:text-blue-900
            dark:text-blue-400
            dark:hover:text-blue-300
          "
        >
          {active.journalCta}
        </Link>
      </Section>

      {/* Beyond Mathematics */}
      <Section title={active.beyondMathTitle}>
        <Paragraphs paragraphs={active.beyondMath} />
      </Section>

      {/* Connected */}
      <Section title={active.connectedTitle}>
        <Paragraphs paragraphs={active.connected} />
      </Section>

      {/* Different Space */}
      <Section title={active.differentTitle}>
        <Paragraphs paragraphs={active.different} />
      </Section>

      {/* Beliefs */}
      <Section title={active.believeTitle}>
        <Paragraphs paragraphs={active.believe} />
      </Section>

      {/* Name */}
      <Section title={active.nameTitle}>
        <Paragraphs paragraphs={active.name} />

        <p
          className="
            my-10
            text-lg
            font-medium
            leading-9
            text-blue-900
            dark:text-blue-400
            md:text-xl
          "
        >
          {active.nameEnding}
        </p>
      </Section>

      {/* Purpose */}
      <Section title={active.purposeTitle}>
        <Paragraphs paragraphs={active.purpose} />
      </Section>

      {/* Begin */}
      <Section title={active.beginTitle}>
        <Paragraphs paragraphs={active.begin} />
      </Section>

      {/* Explore */}
      <Section title={active.exploreTitle}>
        <Paragraphs paragraphs={active.explore} />

        <div
          className="
            mt-8
            flex
            flex-wrap
            gap-4
          "
        >
          <Link
            href="/learning"
            className="
              rounded-lg
              border
              border-slate-200
              px-5
              py-3
              font-medium
              text-slate-700
              transition
              hover:border-blue-300
              hover:text-blue-700
              dark:border-slate-700
              dark:text-slate-300
              dark:hover:border-blue-500
              dark:hover:text-blue-400
            "
          >
            Learning
          </Link>

          <Link
            href="/teaching"
            className="
              rounded-lg
              border
              border-slate-200
              px-5
              py-3
              font-medium
              text-slate-700
              transition
              hover:border-blue-300
              hover:text-blue-700
              dark:border-slate-700
              dark:text-slate-300
              dark:hover:border-blue-500
              dark:hover:text-blue-400
            "
          >
            Teaching
          </Link>

          <Link
            href="/reflection"
            className="
              rounded-lg
              border
              border-slate-200
              px-5
              py-3
              font-medium
              text-slate-700
              transition
              hover:border-blue-300
              hover:text-blue-700
              dark:border-slate-700
              dark:text-slate-300
              dark:hover:border-blue-500
              dark:hover:text-blue-400
            "
          >
            Reflection
          </Link>

          <Link
            href="/journal"
            className="
              rounded-lg
              border
              border-slate-200
              px-5
              py-3
              font-medium
              text-slate-700
              transition
              hover:border-blue-300
              hover:text-blue-700
              dark:border-slate-700
              dark:text-slate-300
              dark:hover:border-blue-500
              dark:hover:text-blue-400
            "
          >
            Journal
          </Link>
        </div>
      </Section>

      {/* Final Thought */}
      <Section title={active.finalTitle}>
        <Paragraphs paragraphs={active.final} />

        <p
          className="
            mt-12
            mb-4
            text-lg
            font-medium
            leading-8
            text-blue-900
            dark:text-blue-400
            md:text-xl
          "
        >
          {active.finalLine}
        </p>
      </Section>
    </>
  );
}