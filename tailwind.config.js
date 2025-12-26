/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Playfair Display", "serif"],
        sans: ["Space Grotesk", "Inter", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#0f172a",
        accent: "#f06c4b",
        paper: "#f8fafc"
      },
      boxShadow: {
        card: "0 20px 60px -35px rgba(15, 23, 42, 0.35)",
        ring: "0 10px 30px -18px rgba(15, 23, 42, 0.55)",
        glass: "0 18px 50px -30px rgba(15, 23, 42, 0.6)"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "1.75rem"
      }
    }
  },
  plugins: [],
}
