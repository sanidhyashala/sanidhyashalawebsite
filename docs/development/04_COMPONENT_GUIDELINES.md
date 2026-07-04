# Component Guidelines

Version: 1.0

---

# Purpose

Every component in SanidhyaShala should be:

Reusable

Independent

Small

Readable

Predictable

Never create components for a single use.

Build them to be reusable.

---

# Component Rules

One component

↓

One responsibility

Do not mix unrelated logic.

---

# Naming

Good

PDFViewer

ResourceCard

SearchBar

JournalCard

ReaderToolbar

ContinueLearning

Bad

Component1

NewCard

TestComponent

MyButton

---

# Folder Structure

components/

pdf/

layout/

navigation/

resources/

journal/

reflection/

ui/

Each component belongs to its own category.

---

# Props

Always prefer props.

Never hardcode values.

Example

Good

title

description

image

pdfUrl

slug

Bad

"Probability"

"Class 12"

Hardcoded strings

---

# State

Keep state local whenever possible.

Global state only when necessary.

---

# Styling

Tailwind only.

Avoid inline styles.

Reuse utility classes.

---

# Reusability

Before creating a new component ask:

Can an existing component be extended?

If yes

Reuse.

Do not duplicate.

---

# Component Size

Ideal

Less than 200 lines.

If a component grows too much

Split it.

---

# Logic

Business logic

↓

lib/

Utility logic

↓

utils/

UI logic

↓

components/

Never mix everything together.

---

# Reader Components

Separate:

Toolbar

Viewer

Loading

Error

Progress

Continue Reading

Each should remain independent.

---

# Loading States

Every async component must have:

Loading UI

Error UI

Empty UI

Never leave blank screens.

---

# Performance

Lazy load large components.

Avoid unnecessary re-renders.

Memoize when useful.

Keep rendering predictable.

---

# Accessibility

Buttons

Need labels

Images

Need alt text

Inputs

Need labels

Interactive elements

Keyboard accessible

---

# Future Proofing

Every component should survive future redesigns.

Design should change.

Component API should remain stable.

---

# Golden Rule

A component should be understandable within 30 seconds by a new developer.

If not,

Simplify it.

---

End of Component Guidelines