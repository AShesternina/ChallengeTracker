import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "./Icons";

interface Props {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
}

export default function PasswordInput({ placeholder, value, onChange, required, minLength }: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        className="w-full px-4 py-3 pr-11 rounded-md text-[14px] text-text-primary placeholder-text-tertiary outline-none transition-colors"
        style={{
          background: "var(--color-surface2)",
          border: "1.5px solid var(--color-border)",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
      </button>
    </div>
  );
}
