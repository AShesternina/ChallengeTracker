import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const STEPS_RU = [
  {
    emoji: "👋",
    title: "Добро пожаловать!",
    text: "ChallengeTracker помогает строить привычки. Создавай многонедельные челленджи и отслеживай прогресс каждый день.",
  },
  {
    emoji: "📋",
    title: "Один список на день",
    text: "Каждое утро ты получаешь единый список задач по всем активным челленджам. Никаких переключений между трекерами.",
  },
  {
    emoji: "🔥",
    title: "Строй серию дней",
    text: "Отмечай задачи выполненными, следи за streak и смотри прогресс в отчётах. Главное — не пропускать!",
  },
];

const STEPS_EN = [
  {
    emoji: "👋",
    title: "Welcome!",
    text: "ChallengeTracker helps you build habits. Create multi-week challenges and track your progress every day.",
  },
  {
    emoji: "📋",
    title: "One list per day",
    text: "Every morning you get a single task list across all active challenges. No switching between trackers.",
  },
  {
    emoji: "🔥",
    title: "Build your streak",
    text: "Mark tasks done, watch your streak grow and check progress in reports. The key is consistency!",
  },
];

interface Props {
  onDone: () => void;
}

export default function Onboarding({ onDone }: Props) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const steps = i18n.language === "ru" ? STEPS_RU : STEPS_EN;
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onDone();
      navigate("/challenges/new");
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-xl p-6 relative"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>

        {/* Skip */}
        <button onClick={handleSkip}
          className="absolute top-4 right-4 text-[12px] font-semibold text-text-tertiary hover:text-text-secondary transition-colors">
          {i18n.language === "ru" ? "Пропустить" : "Skip"}
        </button>

        {/* Content */}
        <div className="text-center py-4">
          <p className="text-5xl mb-4">{current.emoji}</p>
          <h2 className="text-[20px] font-black text-text-primary mb-2" style={{ letterSpacing: "-0.3px" }}>
            {current.title}
          </h2>
          <p className="text-[14px] text-text-secondary leading-relaxed">
            {current.text}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 my-4">
          {steps.map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-200"
              style={{
                width: i === step ? 20 : 6,
                height: 6,
                background: i === step ? "var(--color-accent)" : "var(--color-border-strong)",
              }} />
          ))}
        </div>

        {/* Button */}
        <button onClick={handleNext}
          className="w-full py-3 rounded-md text-[14px] font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--color-accent)" }}>
          {isLast
            ? (i18n.language === "ru" ? "Создать первый челлендж 🚀" : "Create first challenge 🚀")
            : (i18n.language === "ru" ? "Далее" : "Next")}
        </button>
      </div>
    </div>
  );
}
