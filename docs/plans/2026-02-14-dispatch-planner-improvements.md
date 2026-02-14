# KUBOXT 配車プランナー 改修計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 運用効率を改善するためにフィルター機能・配車状況確認画面を追加し、インフラ改善として設定管理をスクリプトプロパティに移行する。

**Architecture:** 既存のGAS Web App構成（DataManager/GanttManager/UIManager IIFE Module Pattern + Observer）を活かし、フィルター状態管理をDataManagerに統合。新規画面はindex.html内のタブ切替で実現し、データ共有とSPA的なUXを維持。

**Tech Stack:** Google Apps Script, Google Sheets, Bootstrap 5 (CDN), Frappe Gantt (CDN), Vanilla JS (ES6+)

---

## 運用フロー（理解の確認）

```
電話受注(~100件/日) → スプレッドシート入力 → CSV出力
    → アプリにインポート → 未配車リスト追加
    → 配車担当がドラッグ&ドロップで車両割当
    → ドライバーがスマホで配車状況確認
    → 実績をスマホで登録 → 日報としてスプレッドシートに記録
```

## 改修一覧

| # | 改修内容 | 優先度 | 影響ファイル |
|---|---------|--------|------------|
| 1 | スプレッドシートIDをスクリプトプロパティに移行 | 高 | Config.gs |
| 2 | 未配車一覧のフィルター機能（依頼車種・積込日） | 高 | index.html, JavaScript.html, Stylesheet.html |
| 3 | ガントチャートのフィルター機能（車種・日付・荷主） | 高 | index.html, JavaScript.html, Stylesheet.html |
| 4 | 配車状況確認画面（日付別一覧・グルーピング・アコーディオン） | 高 | index.html, JavaScript.html, Stylesheet.html |

---

## Phase 1: インフラ改善

### Task 1: スプレッドシートIDをスクリプトプロパティに移行

**Files:**
- Modify: `Config.gs:5`

**Step 1: Config.gs を修正**

現在のハードコードされた `SPREADSHEET_ID` を `PropertiesService.getScriptProperties()` から取得する形に変更する。

```javascript
// 変更前
SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',

// 変更後
SPREADSHEET_ID: PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '',
```

**注意:** GASのグローバル変数(`var CONFIG = {...}`)ではトップレベルでPropertiesServiceを呼ぶとファイルの読み込み順序で問題が発生する可能性がある。そのためgetterパターンか遅延初期化にすることを検討。安全な実装は以下：

```javascript
// Config.gs の SPREADSHEET_ID 行を空文字にし、getSpreadsheet() 内で動的取得
SPREADSHEET_ID: '',

// DataService.gs の getSpreadsheet() を修正
function getSpreadsheet() {
  var id = CONFIG.SPREADSHEET_ID || PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('SPREADSHEET_IDが設定されていません。スクリプトプロパティを確認してください。');
  return SpreadsheetApp.openById(id);
}
```

**Step 2: コミット**

```bash
git add Config.gs DataService.gs
git commit -m "feat: スプレッドシートIDをスクリプトプロパティから取得するように変更"
```

---

## Phase 2: フィルター機能

### Task 2: 未配車一覧のフィルターUI追加

**Files:**
- Modify: `index.html:56-62` (サイドバー部分)
- Modify: `Stylesheet.html` (フィルターCSS追加)

**Step 1: index.html のサイドバーにフィルターUIを追加**

`<div id="unassignedPool"></div>` の前にフィルターパネルを追加する。

```html
<!-- サイドバーフィルター -->
<div class="filter-panel mb-3">
  <div class="mb-2">
    <label class="form-label small text-muted mb-1">依頼車種</label>
    <select class="form-select form-select-sm" id="filterRequestedType">
      <option value="">すべて</option>
      <!-- JavaScript で動的に生成 -->
    </select>
  </div>
  <div class="mb-2">
    <label class="form-label small text-muted mb-1">積込日</label>
    <input type="date" class="form-control form-control-sm" id="filterLoadDate">
  </div>
  <button class="btn btn-outline-secondary btn-sm w-100" id="clearSidebarFilter">
    フィルターをクリア
  </button>
</div>
```

**Step 2: Stylesheet.html にフィルター用CSSを追加**

```css
/* ===== Filter Panel ===== */
.filter-panel {
  padding: 0.75rem;
  background-color: #fff;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
}
```

**Step 3: コミット**

```bash
git add index.html Stylesheet.html
git commit -m "feat: 未配車一覧にフィルターUIを追加"
```

---

### Task 3: 未配車一覧のフィルターロジック実装

**Files:**
- Modify: `JavaScript.html` (UIManager内に追加)

**Step 1: UIManager にフィルター状態管理と適用ロジックを追加**

UIManager モジュール内部に以下を追加：

```javascript
var sidebarFilters = {
  requestedType: '',
  loadDate: ''
};

function getFilteredUnassignedOrders() {
  var unassigned = DataManager.getUnassignedOrders();
  return unassigned.filter(function(o) {
    if (sidebarFilters.requestedType && o.requestedType !== sidebarFilters.requestedType) {
      return false;
    }
    if (sidebarFilters.loadDate && o.loadDate !== sidebarFilters.loadDate) {
      return false;
    }
    return true;
  });
}
```

**Step 2: renderUnassignedPool() をフィルター対応に修正**

既存の `var unassigned = DataManager.getUnassignedOrders();` を `var unassigned = getFilteredUnassignedOrders();` に置き換え。

**Step 3: フィルター選択肢の動的生成関数を追加**

```javascript
function populateSidebarFilterOptions() {
  var select = document.getElementById('filterRequestedType');
  var types = {};
  DataManager.getUnassignedOrders().forEach(function(o) {
    if (o.requestedType) types[o.requestedType] = true;
  });
  // 既存のoptionを「すべて」以外削除
  while (select.options.length > 1) select.remove(1);
  Object.keys(types).sort().forEach(function(t) {
    select.add(new Option(t, t));
  });
}
```

**Step 4: setupSidebarFilters() 関数を追加**

フィルターUIのイベントリスナーを設定する関数を追加し、アプリ初期化時に呼び出す。

```javascript
function setupSidebarFilters() {
  document.getElementById('filterRequestedType').addEventListener('change', function() {
    sidebarFilters.requestedType = this.value;
    renderUnassignedPool();
  });
  document.getElementById('filterLoadDate').addEventListener('change', function() {
    sidebarFilters.loadDate = this.value;
    renderUnassignedPool();
  });
  document.getElementById('clearSidebarFilter').addEventListener('click', function() {
    sidebarFilters.requestedType = '';
    sidebarFilters.loadDate = '';
    document.getElementById('filterRequestedType').value = '';
    document.getElementById('filterLoadDate').value = '';
    renderUnassignedPool();
  });
}
```

**Step 5: renderUnassignedPool() 内で populateSidebarFilterOptions() を呼出し**

データが更新されたときにフィルター選択肢も更新されるようにする。

**Step 6: アプリ初期化セクションで setupSidebarFilters() を呼出す**

DOMContentLoaded 内の `UIManager.setupDragDrop()` の後に `UIManager.setupSidebarFilters()` を追加。

**Step 7: UIManager の return オブジェクトに新関数を公開**

```javascript
return {
  // 既存
  renderUnassignedPool: renderUnassignedPool,
  setupDragDrop: setupDragDrop,
  showTaskDetailsModal: showTaskDetailsModal,
  showToast: showToast,
  setupCSVImport: setupCSVImport,
  showVehicleSelectModal: showVehicleSelectModal,
  // 追加
  setupSidebarFilters: setupSidebarFilters
};
```

**Step 8: コミット**

```bash
git add JavaScript.html
git commit -m "feat: 未配車一覧のフィルターロジック実装（依頼車種・積込日）"
```

---

### Task 4: ガントチャートのフィルターUI追加

**Files:**
- Modify: `index.html:64-71` (ガントコンテナ部分)

**Step 1: ガントコンテナの上部にフィルターバーを追加**

`<div class="col-md-9 gantt-container" id="ganttDropZone">` の直後にフィルターバーを追加する。

```html
<!-- ガントフィルターバー -->
<div class="gantt-filter-bar d-flex align-items-center gap-2 mb-2 flex-wrap">
  <div>
    <label class="form-label small text-muted mb-0">車種</label>
    <select class="form-select form-select-sm" id="ganttFilterVehicleType" style="width:auto;min-width:120px;">
      <option value="">すべて</option>
    </select>
  </div>
  <div>
    <label class="form-label small text-muted mb-0">日付</label>
    <input type="date" class="form-control form-control-sm" id="ganttFilterDate" style="width:auto;">
  </div>
  <div>
    <label class="form-label small text-muted mb-0">荷主</label>
    <select class="form-select form-select-sm" id="ganttFilterShipper" style="width:auto;min-width:150px;">
      <option value="">すべて</option>
    </select>
  </div>
  <div class="ms-auto">
    <button class="btn btn-outline-secondary btn-sm" id="clearGanttFilter">クリア</button>
  </div>
</div>
```

**Step 2: Stylesheet.html にガントフィルターバーのCSSを追加**

```css
/* ===== Gantt Filter Bar ===== */
.gantt-filter-bar {
  padding: 0.5rem 0;
  border-bottom: 1px solid #dee2e6;
}
```

**Step 3: コミット**

```bash
git add index.html Stylesheet.html
git commit -m "feat: ガントチャートにフィルターバーUIを追加"
```

---

### Task 5: ガントチャートのフィルターロジック実装

**Files:**
- Modify: `JavaScript.html` (GanttManager内に追加)

**Step 1: GanttManager にフィルター状態管理を追加**

GanttManager モジュール内部に以下を追加：

```javascript
var ganttFilters = {
  vehicleType: '',
  date: '',
  shipper: ''
};

function getFilteredOrders() {
  var allOrders = DataManager.getOrders();
  return allOrders.filter(function(o) {
    if (ganttFilters.vehicleType) {
      // 割当済み車両の車種 または 依頼車種で絞り込み
      var vType = o.vehicleType || o.requestedType || '';
      if (vType !== ganttFilters.vehicleType) return false;
    }
    if (ganttFilters.date) {
      // 積込日 または 荷卸日 が指定日を含む範囲のもの
      var matchDate = ganttFilters.date;
      if (o.loadDate !== matchDate && o.unloadDate !== matchDate) {
        // 範囲チェック: 積込日 <= 指定日 <= 荷卸日
        if (!(o.loadDate <= matchDate && (o.unloadDate || o.loadDate) >= matchDate)) {
          return false;
        }
      }
    }
    if (ganttFilters.shipper && o.shipper !== ganttFilters.shipper) {
      return false;
    }
    return true;
  });
}
```

**Step 2: init() と refresh() の受注取得を getFilteredOrders() に変更**

```javascript
// init() 内
var allOrders = getFilteredOrders(); // 変更前: DataManager.getOrders()

// refresh() 内
var allOrders = getFilteredOrders(); // 変更前: DataManager.getOrders()
```

**Step 3: フィルター選択肢の動的生成関数を追加**

```javascript
function populateGanttFilterOptions() {
  var orders = DataManager.getOrders();
  var vehicles = DataManager.getVehicles();

  // 車種 (M_車両の車種 + 依頼車種)
  var types = {};
  vehicles.forEach(function(v) { if (v.vehicleType) types[v.vehicleType] = true; });
  orders.forEach(function(o) { if (o.requestedType) types[o.requestedType] = true; });
  var typeSelect = document.getElementById('ganttFilterVehicleType');
  while (typeSelect.options.length > 1) typeSelect.remove(1);
  Object.keys(types).sort().forEach(function(t) {
    typeSelect.add(new Option(t, t));
  });

  // 荷主
  var shippers = {};
  orders.forEach(function(o) { if (o.shipper) shippers[o.shipper] = true; });
  var shipperSelect = document.getElementById('ganttFilterShipper');
  while (shipperSelect.options.length > 1) shipperSelect.remove(1);
  Object.keys(shippers).sort().forEach(function(s) {
    shipperSelect.add(new Option(s, s));
  });
}
```

**Step 4: setupGanttFilters() 関数を追加**

```javascript
function setupGanttFilters() {
  document.getElementById('ganttFilterVehicleType').addEventListener('change', function() {
    ganttFilters.vehicleType = this.value;
    refresh();
  });
  document.getElementById('ganttFilterDate').addEventListener('change', function() {
    ganttFilters.date = this.value;
    refresh();
  });
  document.getElementById('ganttFilterShipper').addEventListener('change', function() {
    ganttFilters.shipper = this.value;
    refresh();
  });
  document.getElementById('clearGanttFilter').addEventListener('click', function() {
    ganttFilters.vehicleType = '';
    ganttFilters.date = '';
    ganttFilters.shipper = '';
    document.getElementById('ganttFilterVehicleType').value = '';
    document.getElementById('ganttFilterDate').value = '';
    document.getElementById('ganttFilterShipper').value = '';
    refresh();
  });
}
```

**Step 5: GanttManager の return オブジェクトに新関数を公開**

```javascript
return {
  init: init,
  refresh: refresh,
  changeViewMode: changeViewMode,
  setupGanttFilters: setupGanttFilters,
  populateGanttFilterOptions: populateGanttFilterOptions
};
```

**Step 6: アプリ初期化セクションで呼出し**

DOMContentLoaded 内の `GanttManager.init()` の後に：
```javascript
GanttManager.setupGanttFilters();
GanttManager.populateGanttFilterOptions();
```

**Step 7: DataManager.subscribe のコールバック内で選択肢を更新**

```javascript
DataManager.subscribe(function() {
  UIManager.renderUnassignedPool();
  GanttManager.refresh();
  GanttManager.populateGanttFilterOptions(); // 追加
});
```

**Step 8: コミット**

```bash
git add JavaScript.html
git commit -m "feat: ガントチャートのフィルターロジック実装（車種・日付・荷主）"
```

---

## Phase 3: 配車状況確認画面

### Task 6: 配車状況確認画面のナビゲーション追加

**Files:**
- Modify: `index.html` (ナビバー + コンテンツ切替構造)

**Step 1: ナビバーにタブ切替ボタンを追加**

現在のナビバー内の表示切替ボタングループの左側に、画面切替ボタンを追加。

```html
<!-- 画面切替タブ -->
<ul class="nav nav-pills ms-3" id="mainTabs">
  <li class="nav-item">
    <button class="nav-link active" id="tabGantt" data-view="gantt">配車計画</button>
  </li>
  <li class="nav-item">
    <button class="nav-link" id="tabStatus" data-view="status">配車状況</button>
  </li>
</ul>
```

**Step 2: メインコンテンツを2つのビューに分割**

既存のdashboard-containerを `<div id="viewGantt">` で囲み、新しい `<div id="viewStatus" style="display:none;">` を追加。

```html
<!-- ===== ガントビュー (既存) ===== -->
<div id="viewGantt" class="container-fluid dashboard-container">
  <!-- 既存のrow/sidebar/gantt構造をそのまま -->
</div>

<!-- ===== 配車状況ビュー (新規) ===== -->
<div id="viewStatus" class="container-fluid py-3" style="display: none;">
  <!-- Task 7 で実装 -->
</div>
```

**Step 3: コミット**

```bash
git add index.html
git commit -m "feat: ナビバーに配車計画/配車状況のタブ切替を追加"
```

---

### Task 7: 配車状況確認画面のHTML構造

**Files:**
- Modify: `index.html` (viewStatus の中身)

**Step 1: 配車状況ビューのHTML構造を実装**

```html
<div id="viewStatus" class="container-fluid py-3" style="display: none;">
  <!-- ステータスサマリーカード -->
  <div class="row mb-3" id="statusSummaryCards">
    <div class="col-md-3">
      <div class="card text-center border-secondary">
        <div class="card-body py-2">
          <h3 class="mb-0" id="summaryTotal">0</h3>
          <small class="text-muted">全案件</small>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card text-center border-danger">
        <div class="card-body py-2">
          <h3 class="mb-0 text-danger" id="summaryUnassigned">0</h3>
          <small class="text-muted">未配車</small>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card text-center border-primary">
        <div class="card-body py-2">
          <h3 class="mb-0 text-primary" id="summaryAssigned">0</h3>
          <small class="text-muted">配車済</small>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card text-center border-success">
        <div class="card-body py-2">
          <h3 class="mb-0 text-success" id="summaryCompleted">0</h3>
          <small class="text-muted">完了</small>
        </div>
      </div>
    </div>
  </div>

  <!-- フィルター＆グルーピングバー -->
  <div class="d-flex align-items-center gap-2 mb-3 flex-wrap">
    <div>
      <label class="form-label small text-muted mb-0">表示日</label>
      <input type="date" class="form-control form-control-sm" id="statusFilterDate" style="width:auto;">
    </div>
    <div>
      <label class="form-label small text-muted mb-0">ステータス</label>
      <select class="form-select form-select-sm" id="statusFilterStatus" style="width:auto;min-width:120px;">
        <option value="">すべて</option>
        <option value="未割当">未割当</option>
        <option value="割当済">割当済</option>
        <option value="配送中">配送中</option>
        <option value="完了">完了</option>
      </select>
    </div>
    <div>
      <label class="form-label small text-muted mb-0">グループ</label>
      <select class="form-select form-select-sm" id="statusGroupBy" style="width:auto;min-width:120px;">
        <option value="date">日付別</option>
        <option value="driver">運転手別</option>
        <option value="vehicleType">車種別</option>
        <option value="shipper">荷主別</option>
      </select>
    </div>
    <button class="btn btn-outline-secondary btn-sm" id="clearStatusFilter">クリア</button>
  </div>

  <!-- アコーディオン型の案件一覧 -->
  <div class="accordion" id="statusAccordion">
    <!-- JavaScript で動的に生成 -->
  </div>

  <!-- 空状態 -->
  <div id="statusEmpty" class="text-center text-muted py-5" style="display: none;">
    <p>表示する案件がありません。</p>
  </div>
</div>
```

**Step 2: 受注編集モーダルを追加**

既存のtaskDetailsModal の近くに、編集用モーダルを追加。

```html
<!-- ===== 受注編集モーダル ===== -->
<div class="modal fade" id="orderEditModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">受注編集</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="editOrderId">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">荷主</label>
            <input type="text" class="form-control" id="editShipper" readonly>
          </div>
          <div class="col-md-6">
            <label class="form-label">品名</label>
            <input type="text" class="form-control" id="editCargoName" readonly>
          </div>
          <div class="col-md-3">
            <label class="form-label">積込日</label>
            <input type="date" class="form-control" id="editLoadDate">
          </div>
          <div class="col-md-3">
            <label class="form-label">積込時間</label>
            <input type="time" class="form-control" id="editLoadTime">
          </div>
          <div class="col-md-3">
            <label class="form-label">荷卸日</label>
            <input type="date" class="form-control" id="editUnloadDate">
          </div>
          <div class="col-md-3">
            <label class="form-label">荷卸時間</label>
            <input type="time" class="form-control" id="editUnloadTime">
          </div>
          <div class="col-md-6">
            <label class="form-label">車両 (ナンバー)</label>
            <select class="form-select" id="editVehicle">
              <option value="">未割当</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">ステータス</label>
            <select class="form-select" id="editStatus">
              <option value="未割当">未割当</option>
              <option value="割当済">割当済</option>
              <option value="配送中">配送中</option>
              <option value="完了">完了</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-danger me-auto" id="editUnassignBtn">割当解除</button>
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">キャンセル</button>
        <button type="button" class="btn btn-primary" id="editSaveBtn">保存</button>
      </div>
    </div>
  </div>
</div>
```

**Step 3: コミット**

```bash
git add index.html
git commit -m "feat: 配車状況確認画面のHTML構造を追加"
```

---

### Task 8: 配車状況確認画面のCSSとレイアウト調整

**Files:**
- Modify: `Stylesheet.html`

**Step 1: 配車状況ビュー用CSSを追加**

```css
/* ===== Status View ===== */
#viewStatus {
  max-height: calc(100vh - 56px);
  overflow-y: auto;
}

.status-order-row {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.85rem;
  transition: background-color 0.15s;
}

.status-order-row:hover {
  background-color: #f8f9fa;
}

.status-order-row .status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-right: 0.75rem;
}

.status-order-row .order-actions {
  margin-left: auto;
  white-space: nowrap;
}

.accordion-header .badge {
  font-size: 0.7rem;
}

/* ナビタブ */
#mainTabs .nav-link {
  color: rgba(255,255,255,0.7);
  font-size: 0.9rem;
  padding: 0.25rem 0.75rem;
}

#mainTabs .nav-link.active {
  color: #fff;
  background-color: rgba(255,255,255,0.15);
  border-radius: 0.375rem;
}

#mainTabs .nav-link:hover {
  color: #fff;
}
```

**Step 2: dashboardContainerの高さをviewGanttに限定**

既存の `.dashboard-container` のCSSはそのままでよい（`#viewGantt` に移動するだけ）。

**Step 3: コミット**

```bash
git add Stylesheet.html
git commit -m "feat: 配車状況確認画面のCSS追加"
```

---

### Task 9: 配車状況確認画面のロジック実装 - StatusManager モジュール

**Files:**
- Modify: `JavaScript.html` (新規モジュール追加 + 初期化コード修正)

**Step 1: StatusManager モジュールを追加**

UIManager の後に新しいモジュールを追加。

```javascript
/* ========================================================
 * StatusManager - 配車状況確認画面
 * ======================================================== */
var StatusManager = (function() {
  var filters = {
    date: '',
    status: '',
    groupBy: 'date'
  };

  /**
   * フィルター適用
   */
  function getFilteredOrders() {
    var orders = DataManager.getOrders();
    return orders.filter(function(o) {
      if (filters.date) {
        if (o.loadDate !== filters.date && o.unloadDate !== filters.date) {
          if (!(o.loadDate <= filters.date && (o.unloadDate || o.loadDate) >= filters.date)) {
            return false;
          }
        }
      }
      if (filters.status && o.status !== filters.status) {
        return false;
      }
      return true;
    });
  }

  /**
   * グルーピング
   */
  function groupOrders(orders, groupBy) {
    var groups = {};
    orders.forEach(function(o) {
      var key;
      switch (groupBy) {
        case 'driver':
          key = o.driverName || '(未割当)';
          break;
        case 'vehicleType':
          key = o.vehicleType || o.requestedType || '(車種不明)';
          break;
        case 'shipper':
          key = o.shipper || '(荷主不明)';
          break;
        case 'date':
        default:
          key = o.loadDate || '(日付なし)';
          break;
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(o);
    });
    return groups;
  }

  /**
   * ステータスインジケーターの色
   */
  function getStatusColor(status) {
    switch (status) {
      case STATUS.ASSIGNED: return '#0d6efd';
      case STATUS.EN_ROUTE: return '#ffc107';
      case STATUS.COMPLETED: return '#198754';
      default: return '#6c757d';
    }
  }

  /**
   * サマリーカードの更新
   */
  function updateSummary() {
    var orders = DataManager.getOrders();
    var total = orders.length;
    var unassigned = 0, assigned = 0, completed = 0;
    orders.forEach(function(o) {
      if (o.status === STATUS.UNASSIGNED || !o.status) unassigned++;
      else if (o.status === STATUS.COMPLETED) completed++;
      else assigned++;
    });
    document.getElementById('summaryTotal').textContent = total;
    document.getElementById('summaryUnassigned').textContent = unassigned;
    document.getElementById('summaryAssigned').textContent = assigned;
    document.getElementById('summaryCompleted').textContent = completed;
  }

  /**
   * メインレンダリング
   */
  function render() {
    var accordion = document.getElementById('statusAccordion');
    var emptyEl = document.getElementById('statusEmpty');
    DOM.clear(accordion);

    updateSummary();

    var filtered = getFilteredOrders();
    if (filtered.length === 0) {
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';

    var groups = groupOrders(filtered, filters.groupBy);
    var sortedKeys = Object.keys(groups).sort();

    sortedKeys.forEach(function(key, index) {
      var groupOrders = groups[key];
      var collapseId = 'statusGroup' + index;

      // 未割当件数をカウント
      var unassignedCount = groupOrders.filter(function(o) {
        return o.status === STATUS.UNASSIGNED || !o.status;
      }).length;

      // アコーディオンアイテム
      var header = DOM.el('h2', { className: 'accordion-header' }, [
        DOM.el('button', {
          className: 'accordion-button' + (index > 0 ? ' collapsed' : ''),
          type: 'button',
          'data-bs-toggle': 'collapse',
          'data-bs-target': '#' + collapseId
        }, [
          DOM.el('span', { textContent: key }),
          DOM.el('span', { className: 'badge bg-secondary ms-2', textContent: groupOrders.length + '件' }),
          unassignedCount > 0
            ? DOM.el('span', { className: 'badge bg-danger ms-1', textContent: '未配車 ' + unassignedCount })
            : null
        ].filter(Boolean))
      ]);

      var body = DOM.el('div', {
        className: 'accordion-collapse collapse' + (index === 0 ? ' show' : ''),
        id: collapseId
      });

      var bodyInner = DOM.el('div', { className: 'accordion-body p-0' });

      groupOrders.forEach(function(order) {
        var loadLoc = [order.loadLocation1, order.loadLocation2].filter(Boolean).join(' ');
        var unloadLoc = [order.unloadLocation1, order.unloadLocation2].filter(Boolean).join(' ');

        var row = DOM.el('div', { className: 'status-order-row' }, [
          // ステータスインジケーター
          DOM.el('div', {
            className: 'status-indicator',
            style: { backgroundColor: getStatusColor(order.status) }
          }),
          // 受注情報
          DOM.el('div', { className: 'flex-grow-1' }, [
            DOM.el('div', { className: 'd-flex align-items-center gap-2' }, [
              DOM.el('strong', { className: 'small', textContent: order.shipper }),
              DOM.el('span', { className: 'small text-muted', textContent: order.cargoName }),
              DOM.el('span', {
                className: 'badge status-badge-' + (
                  order.status === STATUS.ASSIGNED ? 'assigned' :
                  order.status === STATUS.EN_ROUTE ? 'enroute' :
                  order.status === STATUS.COMPLETED ? 'completed' : 'unassigned'
                ),
                style: { fontSize: '0.65rem' },
                textContent: order.status || STATUS.UNASSIGNED
              })
            ]),
            DOM.el('div', { className: 'small text-muted' }, [
              DOM.el('span', { textContent: order.loadDate + ' ' + (order.loadTime || '') + ' ' + loadLoc }),
              DOM.el('span', { textContent: ' → ' }),
              DOM.el('span', { textContent: (order.unloadDate || '') + ' ' + (order.unloadTime || '') + ' ' + unloadLoc })
            ]),
            order.driverName
              ? DOM.el('div', { className: 'small' }, [
                  DOM.el('span', { className: 'text-primary', textContent: order.driverName }),
                  DOM.el('span', { className: 'text-muted ms-2', textContent: order.vehicleType || '' }),
                  DOM.el('span', { className: 'text-muted ms-1', textContent: order.number ? '[' + order.number + ']' : '' })
                ])
              : null
          ].filter(Boolean)),
          // アクションボタン
          DOM.el('div', { className: 'order-actions' }, [
            DOM.el('button', {
              className: 'btn btn-outline-primary btn-sm me-1',
              textContent: '編集',
              title: '受注を編集'
            }),
            (order.status !== STATUS.UNASSIGNED && order.status)
              ? DOM.el('button', {
                  className: 'btn btn-outline-danger btn-sm',
                  textContent: '解除',
                  title: '割当を解除'
                })
              : null
          ].filter(Boolean))
        ]);

        // 編集ボタンのイベント
        var editBtn = row.querySelector('.btn-outline-primary');
        editBtn.addEventListener('click', function() {
          showEditModal(order);
        });

        // 解除ボタンのイベント
        var unassignBtn = row.querySelector('.btn-outline-danger');
        if (unassignBtn) {
          unassignBtn.addEventListener('click', function() {
            DataManager.updateOrder(order.requestId, {
              number: '',
              status: STATUS.UNASSIGNED
            }).then(function() {
              UIManager.showToast('割当を解除しました。', 'info');
            }).catch(function(err) {
              UIManager.showToast('割当解除に失敗: ' + err.message, 'danger');
            });
          });
        }

        bodyInner.appendChild(row);
      });

      body.appendChild(bodyInner);

      var item = DOM.el('div', { className: 'accordion-item' });
      item.appendChild(header);
      item.appendChild(body);
      accordion.appendChild(item);
    });
  }

  /**
   * 受注編集モーダル表示
   */
  function showEditModal(order) {
    document.getElementById('editOrderId').value = order.requestId;
    document.getElementById('editShipper').value = order.shipper || '';
    document.getElementById('editCargoName').value = order.cargoName || '';
    document.getElementById('editLoadDate').value = order.loadDate || '';
    document.getElementById('editLoadTime').value = order.loadTime || '';
    document.getElementById('editUnloadDate').value = order.unloadDate || '';
    document.getElementById('editUnloadTime').value = order.unloadTime || '';
    document.getElementById('editStatus').value = order.status || STATUS.UNASSIGNED;

    // 車両ドロップダウンを生成
    var vehicleSelect = document.getElementById('editVehicle');
    while (vehicleSelect.options.length > 1) vehicleSelect.remove(1);
    DataManager.getVehicles().forEach(function(v) {
      var opt = new Option(v.number + ' (' + v.vehicleType + ' - ' + v.driverName + ')', v.number);
      vehicleSelect.add(opt);
    });
    vehicleSelect.value = order.number || '';

    var modal = new bootstrap.Modal(document.getElementById('orderEditModal'));
    modal.show();
  }

  /**
   * 編集保存処理
   */
  function saveEdit() {
    var orderId = document.getElementById('editOrderId').value;
    var updates = {
      loadDate: document.getElementById('editLoadDate').value,
      loadTime: document.getElementById('editLoadTime').value,
      unloadDate: document.getElementById('editUnloadDate').value,
      unloadTime: document.getElementById('editUnloadTime').value,
      number: document.getElementById('editVehicle').value,
      status: document.getElementById('editStatus').value
    };

    DataManager.updateOrder(orderId, updates)
      .then(function() {
        UIManager.showToast('受注を更新しました。', 'success');
        bootstrap.Modal.getInstance(document.getElementById('orderEditModal')).hide();
      })
      .catch(function(err) {
        UIManager.showToast('更新に失敗: ' + err.message, 'danger');
      });
  }

  /**
   * 編集モーダルから割当解除
   */
  function unassignFromEdit() {
    var orderId = document.getElementById('editOrderId').value;
    DataManager.updateOrder(orderId, {
      number: '',
      status: STATUS.UNASSIGNED
    }).then(function() {
      UIManager.showToast('割当を解除しました。', 'info');
      bootstrap.Modal.getInstance(document.getElementById('orderEditModal')).hide();
    }).catch(function(err) {
      UIManager.showToast('割当解除に失敗: ' + err.message, 'danger');
    });
  }

  /**
   * フィルターイベントリスナー設定
   */
  function setup() {
    document.getElementById('statusFilterDate').addEventListener('change', function() {
      filters.date = this.value;
      render();
    });
    document.getElementById('statusFilterStatus').addEventListener('change', function() {
      filters.status = this.value;
      render();
    });
    document.getElementById('statusGroupBy').addEventListener('change', function() {
      filters.groupBy = this.value;
      render();
    });
    document.getElementById('clearStatusFilter').addEventListener('click', function() {
      filters.date = '';
      filters.status = '';
      document.getElementById('statusFilterDate').value = '';
      document.getElementById('statusFilterStatus').value = '';
      render();
    });

    // 編集モーダルのボタン
    document.getElementById('editSaveBtn').addEventListener('click', saveEdit);
    document.getElementById('editUnassignBtn').addEventListener('click', unassignFromEdit);
  }

  return {
    render: render,
    setup: setup
  };
})();
```

**Step 2: タブ切替ロジックを初期化コードに追加**

DOMContentLoaded 内に追加：

```javascript
// タブ切替
document.querySelectorAll('#mainTabs .nav-link').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('#mainTabs .nav-link').forEach(function(t) {
      t.classList.remove('active');
    });
    this.classList.add('active');

    var view = this.getAttribute('data-view');
    document.getElementById('viewGantt').style.display = view === 'gantt' ? '' : 'none';
    document.getElementById('viewStatus').style.display = view === 'status' ? '' : 'none';

    // ガントチャートビューの表示切替コントロール (日/週/月, CSVインポート)
    var ganttControls = document.querySelector('.view-mode-switcher');
    if (ganttControls) ganttControls.style.display = view === 'gantt' ? '' : 'none';

    if (view === 'status') {
      StatusManager.render();
    }
  });
});
```

**Step 3: DataManager.subscribe にStatusManagerのrender を追加**

```javascript
DataManager.subscribe(function() {
  UIManager.renderUnassignedPool();
  GanttManager.refresh();
  GanttManager.populateGanttFilterOptions();
  // 配車状況ビューが表示中なら更新
  if (document.getElementById('viewStatus').style.display !== 'none') {
    StatusManager.render();
  }
});
```

**Step 4: 初期化コードにStatusManager.setup()を追加**

`UIManager.setupCSVImport()` の後に `StatusManager.setup()` を追加。

**Step 5: コミット**

```bash
git add JavaScript.html
git commit -m "feat: 配車状況確認画面の全ロジック実装（グルーピング・フィルター・編集）"
```

---

## Phase 4: 統合テスト & プッシュ

### Task 10: 統合テスト & GitHubプッシュ

**手動テストチェックリスト:**

**インフラ:**
- [ ] スクリプトプロパティからSPREADSHEET_IDが正しく読み取られる
- [ ] プロパティ未設定時にエラーメッセージが表示される

**未配車フィルター:**
- [ ] 依頼車種ドロップダウンに選択肢が表示される
- [ ] 依頼車種で絞り込みが正しく動作する
- [ ] 積込日で絞り込みが正しく動作する
- [ ] 複合条件（依頼車種 + 積込日）で正しく動作する
- [ ] 「フィルターをクリア」で全件表示に戻る
- [ ] CSVインポート後にフィルター選択肢が更新される

**ガントフィルター:**
- [ ] 車種ドロップダウンに選択肢が表示される
- [ ] 荷主ドロップダウンに選択肢が表示される
- [ ] 車種で絞り込みが正しく動作する
- [ ] 日付で絞り込みが正しく動作する（範囲マッチ）
- [ ] 荷主で絞り込みが正しく動作する
- [ ] 「クリア」ボタンで全件表示に戻る

**配車状況確認画面:**
- [ ] タブ切替が正しく動作する
- [ ] サマリーカードの数値が正しい
- [ ] 日付別グルーピングが正しく動作する
- [ ] 運転手別グルーピングが正しく動作する
- [ ] 車種別グルーピングが正しく動作する
- [ ] 荷主別グルーピングが正しく動作する
- [ ] アコーディオン開閉が正しく動作する
- [ ] 未配車バッジが正しく表示される
- [ ] 「編集」ボタンでモーダルが開く
- [ ] 編集モーダルの保存が正しく動作する
- [ ] 「解除」ボタンで割当が解除される
- [ ] ステータスフィルターが正しく動作する
- [ ] 表示日フィルターが正しく動作する
- [ ] データ更新時にビューが自動的にリフレッシュされる

**Step 1: コミット & プッシュ**

```bash
git add -A
git push origin main
```

---

## ファイル変更サマリー

| ファイル | 変更内容 |
|---------|---------|
| `Config.gs` | SPREADSHEET_ID を空文字に変更 |
| `DataService.gs` | getSpreadsheet() にスクリプトプロパティ取得ロジック追加 |
| `index.html` | サイドバーフィルターUI、ガントフィルターバー、タブ切替、配車状況ビュー全体、受注編集モーダル |
| `Stylesheet.html` | フィルターパネル、ガントフィルターバー、配車状況ビュー、ナビタブのCSS |
| `JavaScript.html` | サイドバーフィルターロジック、ガントフィルターロジック、StatusManagerモジュール全体、タブ切替ロジック |

**新規追加なし（既存ファイルの修正のみ）**

---

## 将来的な拡張（今回のスコープ外）

1. **ドライバー実績登録機能**: DriverView.html に実績入力フォーム（到着時間、荷卸完了時間、備考等）を追加し、別シート「T_日報」に書き込む
2. **日報出力機能**: T_日報データをスプレッドシートに日次集計する仕組み
3. **通知機能**: 配車割当時にドライバーにメール/プッシュ通知
4. **配車自動提案**: 車種マッチング・空き状況からAI的に配車を提案
