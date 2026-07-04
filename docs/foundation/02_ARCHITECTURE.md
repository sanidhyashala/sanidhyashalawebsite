# SanidhyaShala Architecture

Version: 2.0

---

# Philosophy

The architecture of SanidhyaShala is designed around one principle:

"Content should drive the website, not the code."

Adding a new chapter, PDF, MCQ set, PYQ or article should never require rewriting components.

The system should scale naturally from hundreds to thousands of resources.

---

# Core Layers

The project is divided into independent layers.

Presentation Layer

↓

Component Layer

↓

Content Layer

↓

Storage Layer

↓

Assets

---

# Presentation Layer

Responsible for:

Pages

Layouts

Navigation

Routing

Reader

Journal

Reflection

No business logic should exist here.

---

# Component Layer

Reusable UI.

Examples:

PDFViewer

Toolbar

Cards

Buttons

Navigation

Search

Footer

Header

Components must remain generic.

Never hardcode class names or chapter names.

---

# Content Layer

Single source of truth.

Contains:

Registry

Resources

Metadata

Articles

All pages consume content from this layer.

---

# Storage Layer

Stores

metadata.json

resourceRegistry

reading progress

future bookmarks

future downloads

future analytics

---

# API Layer

Responsible only for:

Serving PDFs

Searching

Future Admin APIs

Future Analytics APIs

---

# Reader System

Reader consists of:

PDF Viewer

Toolbar

Reading Progress

Continue Learning

Download

Future Bookmarks

Future Notes

Future Highlights

---

# Journal System

Independent module.

Contains:

Articles

Categories

Tags

Related Articles

Future Comments

Future Likes

---

# Reflection System

Independent module.

Contains:

Thoughts

Teaching Experiences

Personal Notes

Mathematical Philosophy

---

# Admin System (Future)

Upload PDF

↓

Generate Metadata

↓

Update Registry

↓

Publish Automatically

Without changing code.

---

# Guiding Principles

Never duplicate data.

Never hardcode resources.

Keep components reusable.

Keep architecture modular.

Prefer configuration over coding.

Everything should be scalable.

---

End of Architecture