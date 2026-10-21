module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/__tests__/jest.setup.js"],
  transform: {
    "^.+\\.[tj]sx?$": "babel-jest",
    "^.+\\.mjs$": "babel-jest",
  },
  testMatch: ["**/__tests__/**/*.test.js"],
};
