import { useEffect, useState } from "react";

const slides = [
  {
    badge: "ADVANCED REPORTING",
    title: (
      <>
        Precision
        <br />
        Intelligence.
      </>
    ),
    description:
      "Transform your reporting workflow with real-time insights, conversion visibility, and smarter performance tracking for every campaign.",
  },
  {
    badge: "SMART ANALYTICS",
    title: (
      <>
        Better
        <br />
        Decisions.
      </>
    ),
    description:
      "Understand performance faster with clear metrics, deeper client visibility, and actionable analytics built for modern teams.",
  },
  {
    badge: "GROWTH INSIGHTS",
    title: (
      <>
        Stronger
        <br />
        Outcomes.
      </>
    ),
    description:
      "Track campaigns, analyze trends, and uncover the exact signals that improve reporting accuracy and business growth.",
  },
];

export default function AuthHeroPanel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  const activeSlide = slides[activeIndex];

  return (
    <section className="hidden lg:flex lg:w-[54%] xl:w-[56%] relative h-full overflow-hidden items-center justify-center bg-[#071a3d]">
      <div className="absolute inset-0">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDj8N0UIKiaJCd7PEw2JrFSd7oNvIumCLJtFyWKCHYOnzw9Dm7W6QkVYIqgdra0GsXjjEYHs8YeV_F_rMSleK9dkU1RcZNsd3qZ-CV1RymTwkQlN-PW1TImRawneJZeWUI9Ybv_w9sgguIMfkmImf01BKixr-AvhgQAwyjsY6CiaPpLpblRjwUGMPw4lKay8PsRAJfJiV-6Fvn0qErJG3SBSEyjUrHDRWw3UUjj4ZSU5vxmhnYcRLUxRPAbbZ9an_3DkxnjBKPlHr4g"
          alt="Analytics background"
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,20,56,0.88),rgba(9,41,94,0.55),rgba(0,163,255,0.14))]"></div>
      </div>

      <div className="relative z-10 w-full max-w-[520px] px-5">
        <div className="rounded-[28px] border border-white/12 bg-[linear-gradient(135deg,rgba(47,67,103,0.88),rgba(57,96,128,0.80))] shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur-md px-8 py-8">
          <div className="inline-flex items-center rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/85">
            {activeSlide.badge}
          </div>

          <div key={activeIndex} className="slide-fade-up mt-6">
            <h2 className="text-[46px] leading-[1] font-extrabold tracking-[-0.04em] text-white">
              {activeSlide.title}
            </h2>

            <p className="mt-5 max-w-[390px] text-[15px] leading-[1.8] text-white/82 font-normal">
              {activeSlide.description}
            </p>
          </div>

          <div className="mt-7 flex items-center gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-all duration-500 ${
                  activeIndex === index
                    ? "w-14 bg-white"
                    : "w-6 bg-white/35 hover:bg-white/55"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}