# **Project Requirements Document: KUBOXT Dispatch Planner (GAS/Frappe Gantt Edition)**

## **1\. Project Overview**

* **Project Name:** KUBOXT Dispatch Planner (GAS Ver.)  
* **Goal:** To digitize the manual dispatch planning process using Google Apps Script and Google Sheets, enabling low-cost operation and easy maintenance.  
* **Core Value:** Visualize vehicle availability and assign orders efficiently using a highly interactive Gantt chart.  
* **Target Users:**  
  1. **Dispatchers (Admin/PC):** Manage orders via a drag-and-drop Gantt chart dashboard.  
  2. **Drivers (Mobile):** Report status via a responsive mobile web interface.

## **2\. Technical Stack (Updated based on Research Report)**

* **Platform:** Google Apps Script (GAS) \- Web App  
* **Database:** Google Sheets  
* **Frontend Framework:** **Bootstrap 5 (CDN)**  
  * *Reason:* Native grid system for dashboard layout, pre-built components (Modals, Toasts), and no build step required (avoids FOUC).  
* **Gantt Library:** **Frappe Gantt (MIT License)**  
  * *Reason:* Lightweight SVG-based library with native drag-and-drop support, zero dependencies, and high compatibility with GAS HtmlService.  
* **Scripting:** Vanilla JavaScript (ES6+)  
* **Architecture Pattern:** **Optimistic UI** (Client-side updates reflect immediately; background sync to server).

## **3\. Scope Definition**

### **In Scope (MVP)**

1. **Data Management:**  
   * Backend: Google Sheets (Tables: T\_Orders, M\_Vehicles, M\_Shippers).  
2. **CSV** Import (Admin):  
   * Upload CSV \-\> Validate against M\_Shippers \-\> Insert into T\_Orders.  
3. **Interactive Gantt Dashboard (Admin):**  
   * **Layout:** Bootstrap 5 Grid (Sidebar: Unassigned Orders / Main: Gantt Chart).  
   * **Interaction:** Drag & Drop assignment, Resize to change duration, Context Menu for quick actions.  
   * **View Modes:** Day, Week, Month switching.  
4. **Driver Interface (Mobile Web):**  
   * Responsive Bootstrap layout showing assigned tasks.  
   * Status updates (Wait \-\> En Route \-\> Done).

## **4\. Data Models (Google Sheets Structure)**

*Same* structure *as previous definition.*

### **4.1 T\_荷主依頼データ (Request Data)**

*Sheet: T\_Orders*

| Col | Name | Type | Note |

|:---|:---|:---|:---|

| 1-13 | (CSV Data) | \- | 依頼ID, 受付日, 荷主, 積込日, 時間, 場所, 品名, etc. |

| 14 | ナンバー | Ref | **Updated by Gantt (Truck ID)** |

| 15 | 車番 | Text | Auto-filled from Master |

| 16 | 車種 | Text | Auto-filled from Master |

| 17 | 運転手 | Text | Auto-filled from Master |

| 18 | ステータス | Enum | Unassigned, Assigned, En Route, Completed |

## **5\. Functional Requirements & Logic**

### **5.1 Dashboard Layout & Navigation**

* **Framework:** Bootstrap 5  
* **Structure:**  
  * **Header:** Navigation, View Mode Switcher (Day/Week/Month).  
  * **Sidebar (col-md-3):** "Unassigned Orders" Pool. Card-based UI. draggable.  
  * **Main Content (col-md-9):** Frappe Gantt Container.

### **5.2 Gantt Chart Interaction (Frappe Gantt)**

* **Initialization:**  
  * Fetch data via google.script.run.  
  * Map T\_Orders to Frappe Gantt JSON format:  
    * id: 依頼ID  
    * name: 荷主名 \+ 品名  
    * start: 積込日 \+ 積込時間  
    * end: 荷卸日 \+ 荷卸時間  
    * custom\_class: Color code based on Status.  
* **Drag & Drop (Assignment/Reschedule):**  
  * **Event:** Listen to on\_date\_change(task, start, end).  
  * **Optimistic** UI **Logic:**  
    1. **Immediate:** Update the chart UI instantly.  
    2. **Background:** Call google.script.run.updateOrder(id, start, end, truckId).  
    3. **Failure Fallback:** If server error occurs, show Toast alert and revert UI change.  
* **Context Menu (Right-Click):**  
  * Prevent default browser menu on .gantt-bar.  
  * Show custom Bootstrap Dropdown: \[Edit Details\], \[Unassign\], \[Change Color\].  
* **Task** Details (Modal):  
  * Clicking a bar opens a Bootstrap Modal showing full order details (Cols 1-13).

### **5.3 Driver Workflow (Mobile)**

* **Authentication:** Filter by logged-in Google User email.  
* **UI:** Bootstrap "Cards" layout. Large buttons for status updates.  
* **Status Logic:**  
  * Click "Start" \-\> Update ステータス to "En Route".  
  * Click "Complete" \-\> Update ステータス to "Completed".  
  * **Concurrency:** Server-side LockService MUST be used to prevent overwrite conflicts.

## **6\. UI/UX Design Specifications (Based on Report)**

### **6.1 Visual Style**

* **Color Palette:**  
  * **Unassigned:** Gray (\#6c757d)  
  * **Assigned:** Blue (\#0d6efd)  
  * **En Route:** Warning/Orange (\#ffc107)  
  * **Completed:** Success/Green (\#198754)  
* **Typography:** System fonts (San Francisco/Segoe UI) via Bootstrap default.

### **6.2 Interaction Design**

* **Gantt Bars:**  
  * Use SVG rendering (Frappe Gantt default) for crisp edges on high-DPI displays.  
  * **Tooltip:** Custom HTML tooltip showing Driver Name, Cargo, Locations.  
* **Feedback:**  
  * Use Bootstrap **Toasts** for async operation success/error messages.  
  * Use **Spinners** only during initial load; avoid blocking UI during drag operations (Optimistic UI).

## **7\. GAS Specific Implementation Details**

* **Server-Side (Code.gs):**  
  * doGet(e): Serve index.html.  
  * getData(): Return JSON of Orders and Vehicles.  
  * updateOrder(data): Use LockService.getScriptLock() (wait up to 10s).  
  * importCSV(data): Batch process insert to avoid timeout.  
* **Client-Side (JavaScript):**  
  * Convert GAS Date objects to Strings (YYYY-MM-DD HH:mm) before passing to Frappe Gantt