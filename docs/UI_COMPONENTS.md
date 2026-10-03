# UI Components Catalog: YOLO × FluxQ

**Scope:** React components, props, stateful interactions, and visual tokens for YOLO × FluxQ.

---

## 1. Components Catalog

### 1.1 `Navbar`
- **Location:** `frontend/src/components/Navbar.tsx`
- **Props:** `activeTab: string`, `setActiveTab: (tab: string) => void`, `health: SystemHealth | null`
- **Features:** Brand logo, title, animated status heartbeat pulse, tab switching with keyboard accessibility, responsive mobile collapse.

### 1.2 `ControlTowerView`
- **Location:** `frontend/src/components/ControlTowerView.tsx`
- **Props:** `shipments: Shipment[]`, `events: DisruptionEvent[]`, `onSelectShipment: (id: string) => void`, `onNavigateTab: (tab: string) => void`
- **Features:** 4 KPI stat cards, Recharts risk distribution bar chart, live disruption alerts ticker, priority flagged consignments table.

### 1.3 `ShipmentsView`
- **Location:** `frontend/src/components/ShipmentsView.tsx`
- **Props:** `shipments: Shipment[]`, `selectedShipmentId: string | null`, `onSelectShipment: (id: string | null) => void`, `onNavigateToRecovery: (id: string) => void`
- **Features:** Substring search, status and min-risk dropdowns, 1–10 risk badges, side intelligence drawer with TreeSHAP feature attributions and recovery launch button.

### 1.4 `RouteMapView`
- **Location:** `frontend/src/components/RouteMapView.tsx`
- **Props:** `shipments: Shipment[]`, `events: DisruptionEvent[]`, `selectedShipmentId: string | null`, `onSelectShipment: (id: string) => void`
- **Features:** Leaflet canvas map, CartoDB dark-matter tiles, NH48/NH717 corridor polylines, dynamic disruption impact circles, custom status-colored SVG marker pins with popup cards.

### 1.5 `RecoveryCenterView`
- **Location:** `frontend/src/components/RecoveryCenterView.tsx`
- **Props:** `shipments: Shipment[]`, `selectedShipmentId: string | null`, `onShipmentUpdated: () => void`
- **Features:** Target consignment selector, multi-objective weight sliders ($\alpha, \beta, \gamma$), budget constraint input, 4 candidate recovery strategy cards (Plan A, B, C, D), operator authorization form, Quantum-Hybrid QAOA benchmark card with QCR metric.

### 1.6 `DisruptionLabView`
- **Location:** `frontend/src/components/DisruptionLabView.tsx`
- **Props:** `events: DisruptionEvent[]`, `onDisruptionInjected: () => void`, `onNavigateToRecovery: (shipmentId: string) => void`
- **Features:** Curated scenario cards (Sriperumbudur monsoon, Walajapet bridge closure, Chennai Port surge, Bengaluru ATFM delay), custom disruption event form with severity sliders, dynamic ripple calculation displaying matched impacted shipments.

### 1.7 `AuditTrailView`
- **Location:** `frontend/src/components/AuditTrailView.tsx`
- **Props:** `selectedShipmentId: string | null`
- **Features:** Chronological audit event list, shipment ID filter, operator ID attribution, expandable JSON state diff comparison (previous vs new state).
