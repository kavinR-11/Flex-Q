---
name: Predictive Logistics Tower
colors:
  surface: '#f8f9ff'
  surface-dim: '#cfdbec'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e4efff'
  surface-container-high: '#dde9fb'
  surface-container-highest: '#d7e4f5'
  on-surface: '#101c29'
  on-surface-variant: '#424751'
  inverse-surface: '#26313f'
  inverse-on-surface: '#e9f1ff'
  outline: '#727782'
  outline-variant: '#c2c6d3'
  surface-tint: '#1b5eab'
  primary: '#003c76'
  on-primary: '#ffffff'
  primary-container: '#00539f'
  on-primary-container: '#a9c9ff'
  inverse-primary: '#a7c8ff'
  secondary: '#005eb5'
  on-secondary: '#ffffff'
  secondary-container: '#559cff'
  on-secondary-container: '#003267'
  tertiary: '#4f1896'
  on-tertiary: '#ffffff'
  tertiary-container: '#6737af'
  on-tertiary-container: '#d7bcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a7c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#004689'
  secondary-fixed: '#d6e3ff'
  secondary-fixed-dim: '#a8c8ff'
  on-secondary-fixed: '#001b3d'
  on-secondary-fixed-variant: '#00468a'
  tertiary-fixed: '#ecdcff'
  tertiary-fixed-dim: '#d6baff'
  on-tertiary-fixed: '#280057'
  on-tertiary-fixed-variant: '#5a27a1'
  background: '#f8f9ff'
  on-background: '#101c29'
  surface-variant: '#d7e4f5'
typography:
  display-lg:
    fontFamily: Roboto Flex
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Roboto Flex
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Roboto Flex
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Roboto Flex
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Roboto Flex
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Roboto Flex
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: '0'
  body-md:
    fontFamily: Roboto Flex
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: '0'
  body-sm:
    fontFamily: Roboto Flex
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Roboto Flex
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Roboto Flex
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
  label-xs:
    fontFamily: Roboto Flex
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.04em
  code-md:
    fontFamily: Roboto Flex
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-desktop: 1rem
  margin: 1rem
  margin-desktop: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system is engineered for mission-critical supply chain operations, global freight orchestration, and predictive disruption management. It embodies a restrained, high-density **Corporate / Modern** aesthetic calibrated specifically for logistics directors, procurement controllers, and transportation analysts who monitor global nodes simultaneously.

The emotional signature is cool-headed authority, operational precision, and frictionless cognitive throughput:
- **Restraint Over Decoration:** Zero decorative fluff. Every pixel, badge, and grid line provides actionable operational clarity.
- **Predictive Intelligence Cueing:** Automated heuristics and machine intelligence insights are systematically set apart via targeted tonal shifts, establishing explicit boundaries between hard telemetry and algorithmic forecasts.
- **High-Density Legibility:** Optimized for multi-monitor command dashboards, dense tabular ledgers, and live geospatial tracking overlays without visual fatigue during 12-hour shifts.

## Colors

The palette leverages a cool-tinted daylight base `#EAF2FB` paired with high-contrast structural blues, a predictive violet tier, and an operational triage spectrum.

### Surface & Textures
- **Canvas Base:** `#EAF2FB` provides low-glare ergonomic scanning across multi-panel control tower setups.
- **Card & Surface Background:** Pure White `#FFFFFF`.
- **Card & Structural Border:** `#DDE5EE`.
- **Subtle Surface Tint:** `#F4F8FD` for zebra rows, sticky column headers, and docked filter bars.

### Typography & Content Tokens
- **Text Primary:** `#1F2933` (WCAG AAA compliant against white surfaces).
- **Text Secondary / Muted:** `#5F6B7A` for timestamps, metadata tags, and column sorting anchors.
- **Text Disabled:** `#9AA5B1`.

### Brand & Interactive Colors
- **Primary Application Blue (`#00539F`):** Used for platform navigation, primary drawer headers, active tabs, and structural anchors.
- **Primary Action Blue (`#0B6BCB`):** Reserved strictly for interactive elements: primary buttons, active links, focused input borders, and primary interactive toggles.
- **AI Accent Purple (`#5E2CA5`):** Reserved exclusively for predictive models, ML confidence bands, automated routing recommendations, and simulation dry-runs.

### Operational Status & Telemetry Spectrum
- **Approval Teal (`#00897B`):** Confirmed customs releases, validated bill of ladings, executed handoffs.
- **Healthy Green (`#7CB342`):** Normal transit cadence, on-time arrivals, nominal cold-chain temperatures.
- **Minor-Risk Yellow (`#FDD835`):** Low-grade carrier drift, mild weather alerts with high ETA buffers.
- **Warning Amber (`#F5A623`):** Critical dwell threshold reached, unconfirmed transshipment, carrier re-routing required.
- **Critical Red (`#D32F2F`):** Demurrage incurred, vessel breakdown, port strike, temperature excursion breach.

Status colors must pair tinted background badges (8–12% opacity) with dark, legible foreground text matching or exceeding 4.5:1 contrast ratios.

## Typography

The type scale relies entirely on **Roboto Flex** for its industrial legibility, mechanical precision, and comprehensive numeric clarity.

### Numerical Data & Telemetry Rules
- **Tabular Figures:** All tabular figures, tracking numbers (e.g., container IDs, IMO numbers, airway bill IDs), and quantitative metrics must enforce `font-feature-settings: "tnum" 1` to ensure vertical alignment down dense ledger columns.
- **Dense Hierarchy:** Body default sits at `13px` (`body-md`) with an 18px line height to allow high scan rates without visual collision.
- **Labels & Overlines:** Category headers, status chips, and table sort headers use compact bolded caps (`label-xs` and `label-sm`) with positive letter spacing (`0.02em` to `0.04em`) to prevent optical crowding.

## Layout & Spacing

A compact, fluid layout rhythm enables real-time supply chain monitoring. It balances maximum information density with clear visual hierarchy across split-screen operational panes.

### Layout Philosophy
- **Fluid Structural Grid:** 12-column adaptive grid on desktop and multi-monitor displays, collapsible to 8 columns on tablet, and single-column stacked view on mobile.
- **Gutter & Margins:** Standard 16px (`1rem`) gutters on desktop layouts, tightening to 12px (`0.75rem`) within docked sub-panels and detail inspectors to maximize spatial utility.
- **Zonal Distribution:**
  - **Left Rail (System Navigation):** Fixed collapsed width (56px) expanding to (240px) on hover or toggle.
  - **Main Telemetry Canvas:** Fluid center partition housing maps, live route cards, and node graphs.
  - **Right Inspector Drawer:** Collapsible 360px–420px drawer for root-cause drill-downs, carrier telematics, and predictive ML scenario analysis.

## Elevation & Depth

Visual separation is primarily achieved using **crisp structural borders (`#DDE5EE`)** reinforced with ultra-restrained, cool-tinted ambient drop shadows. Floating heavy drop shadows are intentionally omitted to avoid visual noise and mimic physical flight/control tower console surfaces.

### Surface Tiers
- **Tier 0 (Canvas):** `#EAF2FB` flat base.
- **Tier 1 (Cards, Modules, Tables):** Solid `#FFFFFF`, bordered with 1px `#DDE5EE`, shadow: `0 1px 2px 0 rgba(31, 41, 51, 0.04)`.
- **Tier 2 (Sticky Headers, Floating Action Toolbars):** `#FFFFFF`, 1px border `#DDE5EE`, shadow: `0 2px 6px -1px rgba(31, 41, 51, 0.08), 0 1px 3px -1px rgba(31, 41, 51, 0.04)`.
- **Tier 3 (Modals, Slide-over Incident Drawers, Overlays):** `#FFFFFF`, 1px border `#DDE5EE`, shadow: `0 12px 24px -4px rgba(31, 41, 51, 0.12), 0 4px 8px -2px rgba(31, 41, 51, 0.04)`.
- **Predictive Focus Overlay:** Purple ambient ring `0 0 0 1px #5E2CA5, 0 4px 12px rgba(94, 44, 165, 0.12)` applied strictly when highlighting an AI-recommended route or intervention.

## Shapes

The design system employs a **Soft (`1`)** corner geometry. This preserves the structured, high-density enterprise aesthetic while remaining visually modern.

### Corner Radius Standards
- **Buttons, Form Inputs, Standard Badges:** 4px (`rounded-sm`).
- **Cards, Control Modules, Telemetry Panels:** 6px to 8px (`rounded-md` / `rounded-lg`).
- **Interactive Modals & Floating Drawers:** 8px (`rounded-lg`).
- **Status Pills (Exception):** Pure pill contour (`rounded-full`) is reserved strictly for operational status indicators, carrier mode badges, and priority tags to clearly differentiate dynamic classification tokens from rectangular interactive buttons.

## Components

### Buttons
- **Primary Action:** Solid `#0B6BCB` background, `#FFFFFF` text, 4px border radius. Height: 32px (compact) or 36px (standard). Padding: 0 12px. Font: `label-md`. Hover: `#0956A2`. Active: `#074582`.
- **Secondary / Outline:** Background `#FFFFFF`, border 1px solid `#DDE5EE`, text `#1F2933`. Hover: background `#F4F8FD`, border `#0B6BCB`.
- **Predictive AI Action:** Background `#5E2CA5`, text `#FFFFFF`, icon slot prefixed with subtle spark/algorithmic glyph. Hover: `#4A2283`.
- **Destructive Action:** Background `#FFFFFF`, border 1px solid `#D32F2F`, text `#D32F2F`. Hover: Background `#FDE8E8`.

### Status Pills & Risk Badges
- **Dimensions:** Height 20px, horizontal padding 8px, font size 11px (`label-sm`), uppercase, bolded.
- **Palette Mapping:**
  - *Healthy:* Background `rgba(124, 179, 66, 0.12)`, text `#33691E`, border `1px solid rgba(124, 179, 66, 0.3)`.
  - *Minor-Risk:* Background `rgba(253, 216, 53, 0.18)`, text `#7F6000`, border `1px solid rgba(253, 216, 53, 0.4)`.
  - *Warning:* Background `rgba(245, 166, 35, 0.14)`, text `#8A4B00`, border `1px solid rgba(245, 166, 35, 0.35)`.
  - *Critical:* Background `rgba(211, 47, 47, 0.12)`, text `#D32F2F`, border `1px solid rgba(211, 47, 47, 0.3)`.
  - *Customs Approved:* Background `rgba(0, 137, 123, 0.12)`, text `#00695C`, border `1px solid rgba(0, 137, 123, 0.3)`.

### Dense Data Tables
- **Header:** Height 32px, background `#F4F8FD`, border-bottom 1px solid `#DDE5EE`. Text: `label-xs`, color `#5F6B7A`, uppercase.
- **Row:** Height 36px default (condensed 30px for emergency drilldowns). Background `#FFFFFF`. Row hover: `#F4F8FD`. Selected row: background `#EAF2FB`, left border indicator 3px solid `#0B6BCB`.
- **Cells:** Padding 0 8px. Text: `body-md` / `13px`, tabular digits for numerical and timestamp columns.
- **Dividers:** Horizontal border 1px solid `#DDE5EE`, no vertical interior column borders except on frozen identifier columns.

### Input Fields & Search Queries
- **Structure:** Height 32px, border 1px solid `#DDE5EE`, background `#FFFFFF`, border radius 4px, text `#1F2933`, font `body-md`.
- **States:** Focus ring `0 0 0 2px rgba(11, 107, 203, 0.2)` with border color `#0B6BCB`. Placeholder text `#9AA5B1`.

### Predictive Risk Insight Cards
- Border 1px solid `#DDE5EE`, surface `#FFFFFF`.
- Header section incorporates a 2px top accent line colored dynamically by prediction impact: `#5E2CA5` for automated AI scenarios, `#D32F2F` for bottleneck alerts.
- Metric readout uses `headline-md` paired with a baseline comparison tag (`label-xs`).