import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface Props {
  onDone: () => void;
}

export default function Onboarding({ onDone }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const steps = [
    { emoji: "👋", title: t("onboarding.step1_title"), text: t("onboarding.step1_text") },
    { emoji: "📋", title: t("onboarding.step2_title"), text: t("onboarding.step2_text") },
    { emoji: "🔥", title: t("onboarding.step3_title"), text: t("onboarding.step3_text") },
  ];

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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-xl p-6 relative"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>

        <button onClick={onDone}
          className="absolute top-4 right-4 text-[12px] font-semibold text-text-tertiary hover:text-text-secondary transition-colors">
          {t("onboarding.skip")}
        </button>

        <div className="text-center py-4">
          <p className="text-5xl mb-4">{current.emoji}</p>
          <h2 className="text-[20px] font-black text-text-primary mb-2" style={{ letterSpacing: "-0.3px" }}>
            {current.title}
          </h2>
          <p className="text-[14px] text-text-secondary leading-relaxed">
            {current.text}
          </p>
        </div>

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

        <button onClick={handleNext}
          className="w-full py-3 rounded-md text-[14px] font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--color-accent)" }}>
          {isLast ? t("onboarding.start_cta") : t("onboarding.next")}
        </button>
      </div>
    </div>
  );
}
