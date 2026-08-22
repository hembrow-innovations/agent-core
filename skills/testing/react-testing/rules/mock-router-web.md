---
title: Mock the project router, do not boot it
impact: HIGH
impactDescription: booting the router pulls the app shell
tags: [mock, web, router]
---

## Mock the project router, do not boot it

Web feature tests stub navigation hooks. They do not create a `RouterProvider` or import the route tree. Mock the package the file actually imports.

**Incorrect:**
```tsx
render(
  <RouterProvider router={createRouter({ routeTree })}>
    <TasksPage />
  </RouterProvider>,
);
```

**Correct:** Discover the import (`react-router`, `@tanstack/react-router`, `next/navigation`, …) and stub that module:

```ts
const navigate = vi.fn();
vi.mock("react-router", () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: "/tasks" }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));
```

Notes: Do not import a router the repo does not use. Multi-route proof is Playwright if the repo has it.
