
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1A1233",
        inkSoft: "#2A1F4D",
        canvas: "#F3F1F8",
        surface: "#FFFFFF",
        coral: "#FF5D73",
        coralDark: "#E24460",
        mint: "#2FD4A6",
        mintDark: "#1FAE86",
        amber: "#FFB648",
        amberDark: "#E89A28",
        slate: "#6E6A85",
        line: "#E7E3F1",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(26,18,51,0.06)",
        card: "0 12px 32px -16px rgba(26,18,51,0.28)",
      },
    },
  },
  plugins: [],
};