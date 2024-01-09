const config = {
  locales: ["en", "es"],
  catalogs: [
    {
      path: "src/locales/{locale}",
      include: ["src"],
    },
  ],
};

export default config;
