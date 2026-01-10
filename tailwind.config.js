const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "rgb(255, 247, 145)",
        black: colors.black,
        white: colors.white,
        shade: "rgba(0, 0, 0, 0.45)",
        bgshade: "rgba(0, 0, 0, 0.05)",
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        cursive: ['Brush Script MT', 'cursive', 'Lucida Handwriting', 'Comic Sans MS'],
        script: ['Brush Script MT', 'cursive', 'Lucida Handwriting', 'Comic Sans MS'],
      },
      cursor: {
        crosshair:
          "url(https://user-images.githubusercontent.com/14149230/219877313-3eb493fa-4f48-456d-af34-e74ce854befb.png) 0 25, crosshair",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
