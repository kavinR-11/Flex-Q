# YOLO × FluxQ: QUBO Formulation & Quantum-Hybrid QAOA Specification

## 1. Problem Formulation: Residual Carrier Slot Allocation

In Layer 4 of **YOLO × FluxQ**, quantum-hybrid optimization is evaluated as a research extension (Priority 2) on a small, discrete residual combinatorial subproblem derived from Layer 3's classical triage. When an arterial disruption forces multiple critical shipments to re-allocate among a scarce pool of expedited carrier slots, we model the allocation as a **Quadratic Unconstrained Binary Optimization (QUBO)** problem.

Let:
- $N$ be the number of disrupted shipments requiring reassignment ($i \in \{1, \dots, N\}$).
- $K$ be the number of available discrete alternative carrier slots ($k \in \{1, \dots, K\}$).
- $C_{i, k}$ be the financial/operational cost matrix (in INR) of assigning shipment $i$ to slot $k$.

---

## 2. Decision Variables and QUBO Construction

Define binary decision variables:
$$x_{i, k} \in \{0, 1\}$$
where $x_{i, k} = 1$ if shipment $i$ is assigned to slot $k$, and $0$ otherwise.

The total number of binary decision variables (and therefore qubits in the quantum circuit) is:
$$n = N \times K$$

### 2.1 Operational Cost Objective
$$\min \sum_{i=1}^N \sum_{k=1}^K C_{i, k} x_{i, k}$$

### 2.2 Hard Assignment Constraint (Unicast)
Every shipment $i$ must be assigned to exactly one slot:
$$\sum_{k=1}^K x_{i, k} = 1, \quad \forall i \in \{1, \dots, N\}$$

To formulate as an unconstrained quadratic objective, we introduce penalty parameter $\lambda > 0$:
$$P_{\text{penalty}}(x) = \lambda \sum_{i=1}^N \left( \sum_{k=1}^K x_{i, k} - 1 \right)^2$$

Expanding the quadratic penalty:
$$\left( \sum_{k=1}^K x_{i, k} - 1 \right)^2 = \sum_{k=1}^K x_{i, k}^2 + 2 \sum_{k < l} x_{i, k} x_{i, l} - 2 \sum_{k=1}^K x_{i, k} + 1$$

Since $x_{i, k} \in \{0, 1\}$, $x_{i, k}^2 = x_{i, k}$:
$$\left( \sum_{k=1}^K x_{i, k} - 1 \right)^2 = -\sum_{k=1}^K x_{i, k} + 2 \sum_{k < l} x_{i, k} x_{i, l} + 1$$

### 2.3 Full QUBO Matrix Form
Combining cost and penalty into standard upper-triangular or symmetric matrix form:
$$\min_x x^T Q x$$
where:
- Diagonal elements ($x_{i, k}$):
  $$Q_{(ik), (ik)} = C_{i, k} - \lambda$$
- Off-diagonal elements ($x_{i, k} x_{i, l}$ for $k \ne l$):
  $$Q_{(ik), (il)} = 2 \lambda$$

---

## 3. QUBO to Ising Spin Hamiltonian Mapping

To execute on quantum hardware or simulators, binary variables $x \in \{0, 1\}$ are transformed into Pauli-Z spin operators $s \in \{+1, -1\}$ via:
$$x_m = \frac{I - Z_m}{2}$$

Substituting into the QUBO objective yields the problem Hamiltonian:
$$H_C = \sum_{m} h_m Z_m + \sum_{m < p} J_{m, p} Z_m Z_p + \text{offset}$$
where:
- $h_m = -\frac{Q_{m, m}}{2} - \sum_{p > m} \frac{Q_{m, p} + Q_{p, m}}{4}$
- $J_{m, p} = \frac{Q_{m, p} + Q_{p, m}}{4}$

---

## 4. Quantum Approximate Optimization Algorithm (QAOA) Circuit

The QAOA circuit implements a variational quantum ansatz of depth $p = 1$:

1. **Initialization:**
   Equal superposition over all $2^n$ basis states:
   $$|\psi_0\rangle = H^{\otimes n} |0\rangle^{\otimes n} = \frac{1}{\sqrt{2^n}} \sum_{z \in \{0, 1\}^n} |z\rangle$$

2. **Cost Unitary $U(H_C, \gamma)$:**
   $$U(H_C, \gamma) = e^{-i \gamma H_C}$$
   Implemented via single-qubit $R_Z(2 \gamma h_m)$ gates and two-qubit CNOT–$R_Z(2 \gamma J_{m, p})$–CNOT interaction pairs.

3. **Mixer Unitary $U(H_M, \beta)$:**
   Standard transverse-field driver:
   $$H_M = \sum_{m=1}^n X_m \implies U(H_M, \beta) = \prod_{m=1}^n R_X(2 \beta)_m$$

4. **Measurement & Classical Verification:**
   The output state $|\psi(\gamma, \beta)\rangle = U(H_M, \beta) U(H_C, \gamma) |\psi_0\rangle$ is sampled. The decoded bitstring $x^*$ is submitted to an independent classical feasibility checker before being accepted.

---

## 5. Quantum Contribution Ratio (QCR) Metric

To quantitatively measure whether quantum candidate plans offer operational utility over the Google OR-Tools classical baseline, we define:

$$\text{QCR} = \frac{J_{\text{classical}} - J_{\text{hybrid}}}{J_{\text{classical}}} \times 100\%$$

If candidate $x^*$ violates feasibility constraints ($\sum_k x_{i, k} \ne 1$), $J_{\text{hybrid}}$ defaults to $J_{\text{classical}}$, ensuring $\text{QCR} = 0\%$ and triggering classical fallback.
