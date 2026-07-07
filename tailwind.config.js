/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        sibareg: {
          navy: "#0F2C4C",
          blue: "#1F5CA8",
          gold: "#C9A227",
          bg: "#F4F6F9",
        },
      },
    },
  },
  plugins: [],
};
