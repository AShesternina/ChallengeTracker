export type MascotEmotion =
  | "angry" | "sleepy" | "surprised" | "sad" | "cool"
  | "skeptical" | "questioning" | "excited_happy" | "nervous"
  | "confident_relaxed" | "thinking_wise" | "happy_dancing";

const EMOTION_FILE: Record<MascotEmotion, string> = {
  angry:             "01_angry.png",
  sleepy:            "02_sleepy.png",
  surprised:         "03_surprised.png",
  sad:               "04_sad.png",
  cool:              "05_cool.png",
  skeptical:         "06_skeptical.png",
  questioning:       "07_questioning.png",
  excited_happy:     "08_excited_happy.png",
  nervous:           "09_nervous.png",
  confident_relaxed: "10_confident_relaxed.png",
  thinking_wise:     "11_thinking_wise.png",
  happy_dancing:     "12_happy_dancing.png",
};

const SIZE_PX: Record<"small" | "medium" | "large", number> = {
  small:  64,
  medium: 120,
  large:  160,
};

interface MascotProps {
  emotion: MascotEmotion;
  size?: "small" | "medium" | "large";
  className?: string;
}

export default function Mascot({ emotion, size = "medium", className = "" }: MascotProps) {
  const px = SIZE_PX[size];
  const src = `/mascot/${EMOTION_FILE[emotion]}`;

  return (
    <>
      <style>{`
        @keyframes mascotEnter {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <img
        src={src}
        alt={`Trackee ${emotion}`}
        width={px}
        height={px}
        draggable={false}
        className={className}
        style={{
          objectFit: "contain",
          animation: "mascotEnter 0.3s cubic-bezier(0, 0, 0.2, 1) both",
        }}
      />
    </>
  );
}
