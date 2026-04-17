# The "Handshake" MVP System Prompt

**Role:** Expert Full-stack Engineer & UI/UX Designer.

**Objective:** Build a minimalist, "vibe-coded" browser extension dashboard and overlay for "Handshake," an upward-accountability tool.

**Visual Aesthetic:**

* **Theme:** Dark mode by default, using a "Zinc" and "Slate" palette (Ref: Tailwind/Radix UI).
* **Typography:** Clean sans-serif (Inter or Geist).
* **Vibe:** Sophisticated, low-friction, high-trust. Use subtle borders, micro-interactions, and soft shadows. No loud colors except for "Urgent" states (a soft glowing amber or muted red).

**Core Components to Build:**

1. **The "Handshake Request" Modal:**
   * A small, sleek overlay that appears when triggered.
   * Fields: "Commitment Title" (pre-filled from highlighted text), "Assignee" (Senior/Lead), "Deadline" (Date picker or "Undeclared" toggle).
   * A "Send Request" button with a smooth haptic-style animation.
2. **The "Dual-Handshake" Status Cards:**
   * **State A (Pending):** A glassmorphism card showing "Waiting for Lead to Accept."
   * **State B (Active):** A countdown timer or a progress bar showing time remaining.
   * **State C (Verification Needed):** A prominent "Review Work" button for the requester once the lead marks it done.
3. **The "Snooze" Interaction (Lead's View):**
   * A minimalist dropdown for the Senior: "Snooze 4h," "Snooze 24h," or "Renegotiate."
   * If "Snooze" is picked, require a tiny text input: "Why?" (e.g., "In a fire drill").
4. **The Minimalist Ledger (The "Phase 1" Dashboard):**
   * A simple list view. Columns: *Task, Status, Time.*
   * "Stale" commitments (Undeclared time + >3 days old) should have a faint "Ghost" icon next to them.

**Logic & Interaction Rules:**

* **The "Double Lock":** The task is not "Archived" until User1 clicks "Verify."
* **The Escalation:** If a deadline is reached, the card border should pulse with a subtle red glow.
* **The Undeclared Rule:** If "Undeclared" is selected, the tool automatically adds a "Soft Deadline" tag of 72 hours, after which it prompts the user to "Hard-set a Date."

**Deliverable:** Please provide the React code using **Tailwind CSS** and **Lucide-react** icons. Focus on a high-fidelity "Slide-over" sidebar layout that simulates a browser extension UI.

---

### Pro-Tip for your Build:

When you first run this prompt, focus on the **"State Transitions."** The magic of this tool is the feeling of the "Handshake" moving from *Proposed* → *Accepted* →  *Verifying* .
