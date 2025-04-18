import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: [
    "/config/",
    "/dst/",
    "/node_modules/",
    "/routes",
    "/shared/",
    "/tests/",
    "/types/",
    "/utils/",
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  verbose: true,
  setupFilesAfterEnv: ["./jest.setup.ts"],
};

export default config;
