# Training Dataset Card: YOLO × FluxQ

**Dataset Name:** `yolo_fluxq_logistics_v1`  
**Dataset Version:** 1.0.0  
**Storage Location:** `data/training/`  
**Creation Date:** October 3, 2026

---

## 1. Dataset Summary
The dataset captures dynamic logistics operational states across India's domestic freight network (Chennai, Bengaluru, Mumbai, Hyderabad, Delhi, Pune, Coimbatore). It maps operational consignment parameters, temporal schedules, carrier baselines, and real-time environmental route exposures to actual delivery delays and contractual SLA breaches.

---

## 2. Dataset Composition

- **Total Records:** 2,500 shipments
- **Total Features:** 24 predictive features (7 categorical/identifier, 17 numerical)
- **Targets:**
  - `target_sla_breached`: Binary indicator ($1$ = SLA breached, $0$ = On-time / within SLA)
  - `target_actual_delay_minutes`: Continuous delay duration in minutes ($\ge 0$)
  - `target_delay_category`: Multiclass string (`On-Time`, `Minor (< 1h)`, `Moderate (1-3h)`, `Major (> 3h)`)

---

## 3. Split Distributions

| Partition | Record Count | Percentage | Class 0 (On-Time) | Class 1 (Breach) | Breach Prevalence |
|---|---|---|---|---|---|
| **Train** | 1,750 | 70.0% | 1,521 | 229 | 13.1% |
| **Validation** | 375 | 15.0% | 326 | 49 | 13.1% |
| **Test** | 375 | 15.0% | 321 | 54 | 14.4% |
| **Total** | 2,500 | 100.0% | 2,168 | 332 | 13.3% |

---

## 4. Feature Summary & Descriptive Statistics

| Feature | Type | Min | Median | Max | Missing % |
|---|---|---|---|---|---|
| `remaining_distance_km` | Float | 15.0 | 255.0 | 1,278.0 | 0.0% |
| `sla_buffer_minutes` | Float | -135.0 | 115.0 | 240.0 | 0.0% |
| `congestion_index` | Float | 1.5 | 3.2 | 9.5 | 0.0% |
| `traffic_delay_minutes` | Float | 0.0 | 18.5 | 145.0 | 0.0% |
| `weather_severity` | Float | 1.0 | 2.5 | 8.8 | 0.0% |
| `carrier_reliability` | Float | 0.86 | 0.92 | 0.97 | 0.0% |

---

## 5. Intended Usage & Limitations
- **Primary Use:** Supervised training of the SLA-breach classification model (Task B) and ETA regression model (Task C).
- **Transparency Notice:** Synthetically generated with physics-based delays and realistic disruptions; provides defensible mathematical demonstration of the end-to-end platform, but should be fine-tuned on real enterprise TMS feeds prior to physical commercial rollout.
