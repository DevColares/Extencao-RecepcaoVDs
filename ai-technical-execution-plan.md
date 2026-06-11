# AI Agent Technical Execution Plan: Integração Boticário SGI Script (v6.0)

> **Context:** You are an AI Coding Agent (e.g., Cursor, Claude Code, Copilot) tasked with deploying, refactoring, or extending the Boticário SGI POS UserScript.
> **Objective:** Follow this technical execution plan to understand the architecture, handle state management, and implement updates without breaking the native ASP.NET lifecycle.

---

## 1. Environment & Scope Assessment

### 1.1. Target Environment
* **Target URL:** `*://sgi.e-boticario.com.br/Paginas/Boticario/B1/PDV/RealizarPedidoPDV.aspx*`
* **Execution Sandbox:** Violentmonkey/Tampermonkey execution context.
* **DOM Paradigm:** Legacy ASP.NET WebForms (Heavy usage of `__doPostBack`, `UpdatePanels`, and synchronous/asynchronous partial page rendering).

### 1.2. Required Grants (Tampermonkey Header)
Ensure these headers are present before any code execution:
* `@grant GM_xmlhttpRequest`: Mandatory for bypassing CORS when fetching data from the Google Apps Script endpoint.
* `@grant GM_addStyle`: Mandatory for injecting encapsulated CSS that overrides or isolates from native legacy ASP.NET stylesheets.

---

## 2. Technical Architecture Blueprint

The script operates through two distinct, decoupled logic pipelines.

### Pipeline A: Barcode Interception & Combo Suggestion
* **Trigger:** Hardware Barcode Scanner (Emulates Rapid Keystrokes + `Enter`).
* **Event Listener:** `window.addEventListener('keydown', handler, true)`.
    * *AI Instruction:* **Must** use the Capture phase (`true`) to intercept the DOM event *before* native ASP.NET validators process the input.
* **Data Parsing:** Barcodes are 13 chars. Apply `.substring(7, 12)` regex/slicing to match the internal SKU index if the regex `/^\d{13}$/` evaluates to true.
* **State Management (Crucial):**
    * `ignorarInterceptacao (bool)`: Set to `true` when synthetically injecting the original barcode back into the input (e.g., when the user presses `ESC`). Prevents recursive infinite loops.
    * `bloqueandoEnterOriginal (bool)`: Traps subsequent `keypress` and `keyup` events for the `Enter` key to fully suppress form submission when the UI modal is active.

### Pipeline B: Post-Action DOM Mutation Observer (Gift Notification)
* **Trigger:** ASP.NET AJAX partial page update.
* **Target Node:** `#content_pnlBrindesConquistados` (A `div` or `panel` injected via XHR).
* **Validation Logic:**
    * Element must exist: `document.getElementById(...) !== null`.
    * Element must be visually rendered: `offsetParent !== null` (do not rely on `.style.display`, check physical layout rendering).
* **Action:** Fire OS Notification via Web `Notification API`.
* **State Management:** `brindeJaNotificado (bool)` ensures the Notification API is called exactly once per cycle, mitigating OS spam during continuous DOM repaints.

---

## 3. Data Flow & Cache Strategy

* **Endpoint:** Google Apps Script Macro (Returns JSON dictionary).
* **Cache Engine:** Browser `localStorage`.
* **Keys:** `bancoCombosBoticario_v9` (Data) and `bancoCombosBoticarioTime_v9` (Timestamp).
* **TTL:** 12 Hours (43,200,000 ms).
* **AI Instruction:** When refactoring the data fetch logic, always implement a silent fallback. If the network fails, the script must degrade gracefully (i.e., do nothing and let the native ASP.NET flow process the barcode) to avoid POS blockage.

---

## 4. Maintenance & Refactoring Guidelines (For the AI)

If instructed by the user to modify the code, adhere to these constraints:

### Constraint 1: Do Not Modify the ASP.NET Form Submission Directly
Do not attempt to rewrite the native `__doPostBack` function or the `form.submit()`. Use synthetic keyboard events (`KeyboardEvent`) to pass control back to the native system.
* *Correct synthetic dispatch:*
    ```javascript
    inputOriginal.dispatchEvent(new Event('input', { bubbles: true }));
    inputOriginal.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', keyCode: 13, bubbles: true }));
    ```

### Constraint 2: CSS Isolation
All injected CSS (`GM_addStyle`) **must** use `!important` tags for every rule to prevent the legacy SGI stylesheets from overwriting the floating modal's appearance.

### Constraint 3: Focus Stealing
When invoking OS Notifications (`Pipeline B`), attach an `onclick` event to `window.focus()`. The POS operators often have multiple tabs open; the notification click must return context to the SGI tab.

---

## 5. Deployment / Verification Checklist for the AI

Before outputting final code or declaring a task complete, verify:
1.  [ ] Did I use `addEventListener` with `capture: true` for the `Enter` key interception?
2.  [ ] Did I clear the `localStorage` key versions if modifying the JSON structure expectations?
3.  [ ] Did I check `offsetParent !== null` in the `MutationObserver`?
4.  [ ] Did I ensure the Notification API requests `permission` upon the initial script load?
5.  [ ] Are all newly added variables properly scoped within the IIFE (Immediately Invoked Function Expression) to prevent global namespace pollution?
