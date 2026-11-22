module.exports = {
  testEnvironment: "node",
  cacheDirectory: "<rootDir>/node_modules/.cache/jest",
  setupFiles: ["<rootDir>/__tests__/jest.setup.js"],
  transform: {
    "^.+\\.[tj]sx?$": "babel-jest",
    "^.+\\.mjs$": "babel-jest",
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["**/__tests__/**/*.test.js"],
};
