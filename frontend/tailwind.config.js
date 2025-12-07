module.exports = {
  darkMode: 'class', // <-- ENABLE DARK MODE
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: "rgba(255, 255, 255, 0.05)",
        glassBorder: "rgba(255, 255, 255, 0.1)",
        glassText: "rgba(255, 255, 255, 0.9)",
        brand: {
          100: "#dbeafe",
          500: "#3b82f6",
          900: "#1e3a8a",
        },
        accent: {
          cyan: "#06b6d4",
          fuchsia: "#d946ef",
          violet: "#8b5cf6",
          amber: "#f59e0b",
        }
      },
      animation: {
        blob: "blob 10s infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
    },
  },
  plugins: [],
}
