---
title: Mock Expo Router with text markers
impact: HIGH
impactDescription: real Expo Router needs the native runtime
tags: [mock, native, router]
---

## Mock Expo Router with text markers

jest setup stubs `expo-router`. Screens that redirect render `Redirect` as text so the test can read the href.

**Incorrect:** Importing `expo-router/entry` or rendering a real `Stack` in a unit test.

**Correct:**
```ts
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => mockParams(),
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require("react-native");
    return <Text>{`redirect:${href}`}</Text>;
  },
  Stack: () => {
    const { Text } = require("react-native");
    return <Text>stack</Text>;
  },
}));

expect(screen.getByText("redirect:/sign-in")).toBeTruthy();
```

Notes: Keep this in `jest/setup.ts` when every file needs it. Override per test only when the href matters.
