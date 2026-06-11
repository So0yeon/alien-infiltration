/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base:   "#F7F8FC",   // 배경
        ink:    "#1F2440",   // 진한 글자
        brand:  "#6C63FF",   // 메인
        brand2: "#A59BFF",   // 보조
        accent: "#FFB84D",   // 강조
        good:   "#34C759",   // 성공
        bad:    "#FF5A6E",   // 실패/방해
        panel:  "#FFFFFF",
      },
      borderRadius: {
        xl2: "1.5rem",
        xl3: "2rem",
      },
      boxShadow: {
        card: "0 10px 30px -12px rgba(108,99,255,0.25)",
        glow: "0 0 40px -8px rgba(108,99,255,0.45)",
      },
      fontFamily: {
        display: ['"Pretendard"', '"Noto Sans KR"', "system-ui", "sans-serif"],
        body: ['"Pretendard"', '"Noto Sans KR"', "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop": {
          "0%": { transform: "scale(0.92)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "drift": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "60px 80px" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        "pop": "pop 0.3s ease-out both",
        "drift": "drift 12s linear infinite",
        "pulse-ring": "pulse-ring 1.8s ease-out infinite",
      },
    },
  },
  plugins: [],
};
