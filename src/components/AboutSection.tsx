import React from 'react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-28 px-6 sm:px-12 relative z-10 border-t border-cream-200/10">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Section Label */}
        <div className="flex items-center gap-3 text-amber-400 font-sans text-sm tracking-wider uppercase font-medium">
          <span>01</span>
          <span className="w-8 h-[1px] bg-amber-400/40"></span>
          <span>About Me</span>
        </div>

        {/* Big Editorial Headline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5">
            <h2 className="text-4xl sm:text-6xl font-serif text-cream-50 leading-tight">
              From the heart of Davanagere <br />
              <span className="font-editorial-italic text-amber-300">to Bangalore’s</span> <br />
              computing frontier.
            </h2>
          </div>

          <div className="lg:col-span-7 space-y-6 text-cream-200/90 font-sans text-lg leading-relaxed font-light">
            <p>
              I grew up in <strong className="text-cream-50 font-medium">Davanagere</strong>, where I completed my Pre-University education at Siddaganga PU College. That was where my curiosity for mathematics and code first took root.
            </p>
            <p>
              Today, I am based in <strong className="text-cream-50 font-medium">Bangalore</strong>, pursuing my B.Tech in Artificial Intelligence and Machine Learning at <strong className="text-cream-50 font-medium">PES University, Electronic City Campus</strong>. I spend my days developing real-time voice pipelines, computer vision systems, and responsive full-stack applications.
            </p>
            <p>
              Beyond technical builds, I write. As a Content Writer at <strong className="text-cream-50 font-medium">Kannada Koota Club</strong> (<span className="font-kannada text-amber-300">ಕನ್ನಡ ಕೂಟ</span>), I craft stories and event narratives, connecting creative expression with our cultural roots.
            </p>
            <p className="text-base text-cream-300/80 pt-2 border-t border-cream-200/10">
              I believe in learning by shipping. All my personal projects are open-source on GitHub, tested through real trials, hackathons, and relentless iteration.
            </p>
          </div>
        </div>

        {/* Three Editorial Anchors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
          <div className="p-8 rounded-2xl bg-space-900/60 border border-cream-200/10 hover:border-amber-400/30 transition-all duration-300 space-y-3">
            <div className="text-amber-400 font-serif text-3xl">01</div>
            <h3 className="text-xl font-serif text-cream-50 font-semibold">Roots & Education</h3>
            <p className="text-sm text-cream-300/80 font-sans leading-relaxed">
              Siddaganga PU College, Davanagere → B.Tech AI & ML at PES University Electronic City Campus, Bangalore.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-space-900/60 border border-cream-200/10 hover:border-amber-400/30 transition-all duration-300 space-y-3">
            <div className="text-amber-400 font-serif text-3xl">02</div>
            <h3 className="text-xl font-serif text-cream-50 font-semibold">Voice & Intelligence</h3>
            <p className="text-sm text-cream-300/80 font-sans leading-relaxed">
              Engineering speech pipelines with Whisper, Vosk, and Moonshine alongside LLMs and Computer Vision.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-space-900/60 border border-cream-200/10 hover:border-amber-400/30 transition-all duration-300 space-y-3">
            <div className="text-amber-400 font-serif text-3xl">03</div>
            <h3 className="text-xl font-serif text-cream-50 font-semibold">Story & Culture</h3>
            <p className="text-sm text-cream-300/80 font-sans leading-relaxed">
              Content Writer for Kannada Koota Club (ಕನ್ನಡ ಕೂಟ), giving voice to campus cultural identity and narrative art.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
