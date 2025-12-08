# Frontend Architecture & Design Standards

**Scope:** UI Library, Component Strategy, Tailwind CSS, and Dashboard Logic.
**Enforcement:** Strict.

## 1. Architecture & Strategy

### Component System: shadcn/ui

We utilize **shadcn/ui** as our component base.

- **Why:** Accessible, production-ready primitives (Radix UI) without vendor lock-in.
- **Ownership:** Components live in `packages/ui/src/components`. We own the code and customize it via Tailwind.

### Server Actions Strategy

We strictly avoid `useEffect` for data fetching where possible.

- **Fetch:** Use React Server Components (RSC).
- **Mutate:** Use Server Actions (`'use server'`) to trigger `@repo/core` logic.

### Dashboard Logic

- **Batch Upload:** Uses `react-dropzone` with `getPresignedUrl` Server Action.
- **Review Mode:** Specialized layout using `Split.js`.

---

## 2. Design Standards (Strict)

### No Raw Colors (Semantic Only)

Use **Intent-based** tokens. Never use `bg-white`, `text-gray-500`, etc.

| Token                               | Context                              |
| :---------------------------------- | :----------------------------------- |
| **`bg-background`**                 | Page background                      |
| **`bg-muted`** / **`bg-secondary`** | Subtle backgrounds (cards, sidebars) |
| **`text-foreground`**               | Primary text                         |
| **`text-muted-foreground`**         | Secondary text                       |
| **`border-border`**                 | Dividers                             |
| **`border-input`**                  | Form inputs                          |
| **`bg-primary`**                    | Main actions                         |
| **`text-destructive`**              | Errors                               |

### Typography & Spacing

- **Font:** **Geist Sans** (Vercel) via `packages/ui/src/fonts.ts`.
- **Usage:** `text-sm`, `font-medium`, `font-bold`. No manual `font-sans`.
- **Spacing:** Strict 4px grid (`p-4`, `gap-2`). No magic numbers (`p-[13px]`).

### Component Usage

- **Library:** Use `shadcn/ui` primitives (`components/ui/*`) over custom HTML.
- **Merging:** Always use `cn()`: `className={cn("bg-background", className)}`.
- **Micro-interactions:** Add `active:scale-95` to buttons for tactile feel.

### Layouts

- **Glass:** `bg-background/80 backdrop-blur-md border-b`.
- **Shell:** Wrap internal pages in `<DashboardShell>`.

---

## 3. UI Package Implementation (`@repo/ui`)

### Design Tokens (`globals.css`)

- **Theme:** Semantic "Zinc" base (High Contrast).
- **Primary:** Deep Black (Professional).
- **Border Radius:** `0.5rem`.

### Utilities (`utils.ts`)

- `cn`: Class merging (clsx + tailwind-merge).
- `glass`: Pre-defined glassmorphism string.

### Core Components

- **Button:** Enhanced with loading states (`Loader2`) and `active:scale-95`.
- **DashboardShell:** Responsive sidebar layout structure.
