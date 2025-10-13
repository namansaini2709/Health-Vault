# 🏛️ VaultOS — HealthVault Design System Documentation
**Version:** 1.0  
**Purpose:**  
VaultOS is the unified design language for HealthVault — a secure, end-to-end encrypted platform for digitizing and managing medical records.  
The system expresses **trust**, **security**, and **care** through a blend of **bank-grade precision** and **wellness-inspired calmness**.

---

## 1️⃣ Foundational Principles

| Core Pillar | Description | Visual Expression |
|--------------|--------------|-------------------|
| **Trust & Security** | Users must feel their data is as protected as in a real vault. | Dark, metallic tones, steady animations, clear affordances. |
| **Empathy & Accessibility** | Inclusive, readable, and calming for all ages. | High contrast text, large touch targets, motion control. |
| **Modern Professionalism** | Sleek yet approachable design that conveys technical competence. | Sharp typography, geometric layouts, consistent spacing. |
| **Simplicity & Control** | Every element supports clarity and empowerment. | Minimalist icons, uncluttered layouts, consistent grid system. |

---

## 2️⃣ Color System

### 🎨 Core Palette

| Role | Name | HEX | RGB | Usage |
|------|------|------|-----|-------|
| **Primary** | Vault Purple | `#6B21A8` | `107, 33, 168` | Buttons, highlights, key brand elements |
| **Primary Dark** | Deep Indigo | `#1E1B4B` | `30, 27, 75` | Background, secure contexts |
| **Accent** | Mint Glow | `#00F5C8` | `0, 245, 200` | Secondary CTA, success highlights |
| **Neutral Light** | Steel Grey | `#A7ADB7` | `167, 173, 183` | Dividers, inactive text |
| **Neutral Dark** | Midnight Black | `#0B1220` | `11, 18, 32` | Main background, dark mode base |
| **Surface Light** | Cloud White | `#FFFFFF` | `255, 255, 255` | Text and icons on dark surfaces |
| **Secondary Accent** | Soft Lavender | `#C4B5FD` | `196, 181, 253` | Hover effects, input focus rings |
| **Danger** | Crimson Signal | `#EF4444` | `239, 68, 68` | Error states, destructive actions |
| **Success** | Emerald Guard | `#10B981` | `16, 185, 129` | Confirmations, successful uploads |

---

### 🌈 Gradients
- **Primary Gradient:** `linear-gradient(135deg, #6B21A8 0%, #00F5C8 100%)`
- **Hero Gradient:** `linear-gradient(160deg, #1E1B4B 0%, #6B21A8 70%, #00F5C8 100%)`
- **Button Glow:** radial-gradient(ellipse at center, rgba(0,245,200,0.3), transparent 70%)

---

### ⚠️ Color Do’s & Don’ts
**Do:**
- Use Vault Purple + Mint Glow for primary CTAs.
- Maintain sufficient color contrast (min ratio 4.5:1).
- Use gradients sparingly for depth, not decoration.

**Don’t:**
- Use red (`#EF4444`) for passive UI (reserved for alerts only).
- Mix more than 2 accent colors per view.
- Use low-opacity white text on Mint backgrounds (fails contrast).

---

## 3️⃣ Typography System

| Category | Font Family | Weight | Size (px/rem) | Line Height | Use |
|-----------|--------------|---------|---------------|--------------|------|
| **Display / Hero (H1)** | Poppins | 700 (Bold) | 56px / 3.5rem | 1.2 | Landing headlines |
| **Section Headings (H2)** | Poppins | 600 (SemiBold) | 32px / 2rem | 1.3 | Page headers |
| **Subheading (H3)** | Poppins | 500 | 24px / 1.5rem | 1.4 | Card titles, section labels |
| **Body / Paragraph** | Inter | 400 | 16px / 1rem | 1.6 | General content |
| **Caption / Meta** | Inter | 400 | 13px / 0.8125rem | 1.4 | Descriptions, timestamps |
| **Numeric / Data** | Space Grotesk | 500 | Variable | 1.3 | Health metrics, vault codes |

---

## 4️⃣ Spacing, Grid, and Layout

- **Base Unit:** 4px  
- **Container Width:** 1280px max  
- **Grid:** 12 columns, 24px gutters  
- **Breakpoints:** Mobile ≤640px, Tablet ≤1024px, Desktop ≥1280px  

---

## 5️⃣ UI Components

Includes Buttons, Cards, Inputs, Navigation, and Modals with detailed styling, sizing, and usage rules.

---

## 6️⃣ Motion & Accessibility

- Motion durations: 150–800ms (ease-out or cubic-bezier(0.22, 1, 0.36, 1))  
- Honor prefers-reduced-motion  
- Maintain 4.5:1 color contrast and 44px min touch targets  

---

## 7️⃣ Design Token JSON

```json
{
  "colors": {
    "primary": "#6B21A8",
    "accent": "#00F5C8",
    "background": "#0B1220",
    "surface": "#1E1B4B",
    "textPrimary": "#FFFFFF",
    "textSecondary": "#A7ADB7",
    "error": "#EF4444",
    "success": "#10B981"
  },
  "typography": {
    "fontPrimary": "Poppins",
    "fontSecondary": "Inter",
    "fontNumeric": "Space Grotesk",
    "scale": { "h1": 56, "h2": 32, "h3": 24, "body": 16, "caption": 13 }
  },
  "spacing": [4, 8, 12, 16, 24, 32, 48, 64],
  "radii": { "small": 8, "medium": 12, "large": 16, "full": 9999 },
  "animation": { "vaultRotate": "12s linear infinite", "hover": "0.2s ease-out" }
}
```

---

© 2025 HealthVault — VaultOS Design Language
