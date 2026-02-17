# Infinite Timeline Gantt Chart Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ganttチャートのタイムラインを2日間固定から無制限スクロールに変更し、左右に無限にスクロールできるようにする。

**Architecture:** 動的な日付範囲（rangeStartDate〜rangeEndDate）を状態管理し、スクロール位置に応じて±1日ずつ範囲を拡張する。`useLayoutEffect` でプリペンド時のスクロール補正を行い、視覚的なジャンプを防止する。日付ラベルと時間ヘッダーを統合して1つのスクロール同期対象にまとめる。

**Tech Stack:** React 19, date-fns, react-dnd, Tailwind CSS 4.x, TypeScript 5.9

---

## 現在の問題点（スクリーンショットより）

1. **表示崩れ**: 前日/今日/翌日ボタン周辺のレイアウト崩れ
2. **日付がない**: タイムラインヘッダーに日付ラベルが表示されない（スクロール同期バグ）
3. **2日制限**: 48時間固定のタイムライン → 無制限にしたい
4. **右端の日付表示**: 日付ラベルが正しい位置に表示されていない

## 設計方針

- **動的範囲**: 初期表示 = 今日 ± 3日（7日間）
- **拡張閾値**: スクロール端から6時間分（480px）以内で±1日追加
- **プリペンド補正**: `useLayoutEffect` で scrollLeft を1日分（1920px）加算し、ジャンプ防止
- **日付ラベル**: ヘッダーに統合し、スクロール同期は1箇所のみ
- **ナビゲーション**: 前日/今日/翌日ボタンを削除 → 「今日」フローティングボタンに置き換え
- **車両列**: 既存のsticky実装を維持

---

### Task 1: GanttChart.tsx — 動的日付範囲とヘッダー統合

**Files:**
- Modify: `src/components/gantt/GanttChart.tsx`

**概要:** 固定2日タイムラインを動的範囲に変更。日付ラベルと時間ヘッダーを統合。

**Step 1: props と state を変更**

`multiDayMode` prop を削除し、`scrollToNowTrigger` prop を追加。
動的範囲用の state を追加。

```typescript
interface GanttChartProps {
  vehicles: Vehicle[];
  orders: Order[];
  customers: Customer[];
  onAssignVehicle: (...) => Promise<void>;
  onUnassignVehicle: (orderId: string) => Promise<void>;
  onUpdateOrderTime?: (orderId: string, loadTime: string, unloadTime: string) => Promise<void>;
  scrollToNowTrigger?: number; // 「今日」ボタン押下時にインクリメント
}

// コンポーネント内:
const today = useMemo(() => startOfDay(new Date()), []);
const [rangeStartDate, setRangeStartDate] = useState(() => addDays(today, -3));
const [rangeEndDate, setRangeEndDate] = useState(() => addDays(today, 4));

const totalDays = differenceInCalendarDays(rangeEndDate, rangeStartDate);
const totalHours = totalDays * 24;
const DAY_WIDTH = HOUR_WIDTH * 24; // 1920px
const timelineWidth = totalHours * HOUR_WIDTH;
```

**Step 2: スクロールエッジ検出と範囲拡張**

```typescript
const pendingScrollAdjustRef = useRef(0);
const isExtendingRef = useRef(false);
const EXTEND_THRESHOLD = HOUR_WIDTH * 6; // 480px

// スクロールイベントハンドラ
useEffect(() => {
  const scrollEl = scrollContainerRef.current;
  if (!scrollEl) return;

  const handleScroll = () => {
    // ヘッダー同期
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = scrollEl.scrollLeft;
    }

    if (isExtendingRef.current) return;

    // 左端に近い → 過去を追加
    if (scrollEl.scrollLeft < EXTEND_THRESHOLD) {
      isExtendingRef.current = true;
      pendingScrollAdjustRef.current += DAY_WIDTH;
      setRangeStartDate(prev => addDays(prev, -1));
    }

    // 右端に近い → 未来を追加
    const scrollRight = scrollEl.scrollWidth - scrollEl.scrollLeft - scrollEl.clientWidth;
    if (scrollRight < EXTEND_THRESHOLD) {
      isExtendingRef.current = true;
      setRangeEndDate(prev => addDays(prev, 1));
    }
  };

  scrollEl.addEventListener('scroll', handleScroll);
  return () => scrollEl.removeEventListener('scroll', handleScroll);
}, []);
```

**Step 3: useLayoutEffect でスクロール補正**

```typescript
useLayoutEffect(() => {
  if (pendingScrollAdjustRef.current > 0 && scrollContainerRef.current) {
    scrollContainerRef.current.scrollLeft += pendingScrollAdjustRef.current;
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft += pendingScrollAdjustRef.current;
    }
    pendingScrollAdjustRef.current = 0;
  }
  isExtendingRef.current = false;
});
```

**Step 4: 初期スクロール位置 — 現在時刻に合わせる**

```typescript
const initialScrollDone = useRef(false);

useLayoutEffect(() => {
  if (!initialScrollDone.current && scrollContainerRef.current) {
    const now = new Date();
    const hoursSinceRangeStart =
      differenceInCalendarDays(startOfDay(now), rangeStartDate) * 24
      + now.getHours() + now.getMinutes() / 60;
    const scrollTo = Math.max(0, (hoursSinceRangeStart - 2) * HOUR_WIDTH);
    scrollContainerRef.current.scrollLeft = scrollTo;
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = scrollTo;
    }
    initialScrollDone.current = true;
  }
}, [rangeStartDate]);
```

**Step 5: 「今日」ボタンによるスクロール**

```typescript
useEffect(() => {
  if (scrollToNowTrigger === undefined || scrollToNowTrigger === 0) return;
  if (!scrollContainerRef.current) return;

  const now = new Date();
  const hoursSinceRangeStart =
    differenceInCalendarDays(startOfDay(now), rangeStartDate) * 24
    + now.getHours() + now.getMinutes() / 60;
  const scrollTo = Math.max(0, (hoursSinceRangeStart - 2) * HOUR_WIDTH);
  scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
  if (headerScrollRef.current) {
    headerScrollRef.current.scrollLeft = scrollTo;
  }
}, [scrollToNowTrigger]);
```

**Step 6: ordersForDate フィルタリングを動的範囲に変更**

```typescript
const ordersForDate = useMemo(() => {
  const rangeEnd = rangeEndDate;
  return orders.filter((o) => {
    const loadDay = startOfDay(o.loadDate);
    const unloadDay = startOfDay(o.unloadDate);
    return loadDay < rangeEnd && unloadDay >= rangeStartDate;
  });
}, [orders, rangeStartDate, rangeEndDate]);
```

**Step 7: 日付ラベルとヘッダーを統合レンダリング**

日付ラベル行を生成:
```typescript
const days = useMemo(() =>
  Array.from({ length: totalDays }, (_, i) => ({
    date: addDays(rangeStartDate, i),
    label: format(addDays(rangeStartDate, i), 'M/d(E)', { locale: ja }),
    isToday: isSameDay(addDays(rangeStartDate, i), today),
  })),
  [totalDays, rangeStartDate, today]
);

const hours = useMemo(() =>
  Array.from({ length: totalHours }, (_, i) => ({
    absHour: i,
    displayHour: i % 24,
    isMidnight: i > 0 && i % 24 === 0,
  })),
  [totalHours]
);
```

ヘッダーJSX（日付ラベル + 時間を統合）:
```jsx
{/* 統合ヘッダー */}
<div className="flex border-b border-gray-300 bg-gray-100 shrink-0">
  {/* 車両列ヘッダー - sticky */}
  <div className="w-[140px] min-w-[140px] lg:w-[200px] lg:min-w-[200px] border-r border-gray-300 sticky left-0 z-20 bg-gray-100 flex flex-col justify-center px-3">
    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">車両</span>
  </div>

  {/* タイムラインヘッダー（スクロール同期） */}
  <div className="flex-1 overflow-hidden" ref={headerScrollRef}>
    <div style={{ width: `${timelineWidth}px` }}>
      {/* 日付ラベル行 */}
      <div className="flex border-b border-gray-200">
        {days.map((day) => (
          <div
            key={day.label}
            className={`flex items-center justify-center border-r border-gray-300 py-1 ${
              day.isToday ? 'bg-blue-50' : 'bg-gray-50'
            }`}
            style={{ width: `${DAY_WIDTH}px` }}
          >
            <span className={`text-xs font-bold ${
              day.isToday ? 'text-blue-700' : 'text-gray-600'
            }`}>
              {day.label}
            </span>
          </div>
        ))}
      </div>
      {/* 時間ラベル行 */}
      <div className="flex">
        {hours.map((h) => (
          <div
            key={h.absHour}
            className={`border-r px-1 py-1.5 text-center ${
              h.isMidnight ? 'border-r-2 border-orange-400 bg-orange-50' : 'border-gray-300'
            }`}
            style={{ width: `${HOUR_WIDTH}px`, minWidth: `${HOUR_WIDTH}px` }}
          >
            <span className={`text-[11px] font-semibold ${
              h.isMidnight ? 'text-orange-600' : 'text-gray-600'
            }`}>
              {String(h.displayHour).padStart(2, '0')}:00
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
```

**Step 8: トップバーを簡素化**

2日間表示の「→ X月X日」テキストを削除。代わりに日付範囲を動的表示：

```jsx
<h2 className="text-base font-bold text-gray-800">
  配車ガントチャート
  <span className="ml-2 text-sm font-normal text-gray-500">
    スクロールで日付を拡張
  </span>
</h2>
```

**Step 9: GanttVehicleRow に rangeStartDate を渡す**

```jsx
{vehicles.map((vehicle) => (
  <GanttVehicleRow
    key={vehicle.vehicleNumber}
    vehicle={vehicle}
    orders={assignedOrdersByVehicle.get(vehicle.vehicleNumber) ?? []}
    customers={customers}
    rangeStartDate={rangeStartDate}
    onAssignVehicle={onAssignVehicle}
    onUnassignVehicle={onUnassignVehicle}
    onUpdateOrderTime={onUpdateOrderTime}
    totalHours={totalHours}
  />
))}
```

**Step 10: selectedDate prop を削除し、不要な multiDayMode 関連コードを削除**

---

### Task 2: GanttVehicleRow.tsx — 動的範囲対応

**Files:**
- Modify: `src/components/gantt/GanttVehicleRow.tsx`

**概要:** `multiDayMode`/`selectedDate` props を `rangeStartDate` に変更。OrderBar の位置計算を rangeStartDate 基準に統一。

**Step 1: Props 変更**

```typescript
interface GanttVehicleRowProps {
  vehicle: Vehicle;
  orders: Order[];
  customers: Customer[];
  rangeStartDate: Date;  // 新規: 範囲の開始日
  onAssignVehicle: (...) => Promise<void>;
  onUnassignVehicle: (orderId: string) => Promise<void>;
  onUpdateOrderTime?: (orderId: string, loadTime: string, unloadTime: string) => Promise<void>;
  totalHours: number;    // 既存: 範囲の総時間数
}
```

`selectedDate` と `multiDayMode` を削除。

**Step 2: OrderBar の Props と位置計算を変更**

OrderBarProps:
```typescript
interface OrderBarProps {
  order: Order;
  customer?: Customer;
  rangeStartDate: Date;  // selectedDate → rangeStartDate
  onUnassign: (orderId: string) => Promise<void>;
  onUpdateOrderTime?: (orderId: string, loadTime: string, unloadTime: string) => Promise<void>;
  hourEnd: number;       // totalHours と同じ
}
```

位置計算を統一（multiDayMode の分岐を削除）:
```typescript
// multiDayMode の if/else を削除し、常に rangeStartDate 基準で計算
const day1Start = startOfDay(rangeStartDate);
const getAbsoluteHour = (date: Date, time: string | undefined, fallback: number): number => {
  const daysDiff = differenceInCalendarDays(startOfDay(date), day1Start);
  return daysDiff * 24 + parseTimeToHours(time, fallback);
};

const absLoad = getAbsoluteHour(order.loadDate, order.loadTime, 8);
const absUnload = getAbsoluteHour(order.unloadDate, order.unloadTime, 17);

computedLoadHours = absLoad;
computedUnloadHours = absUnload;

// 範囲外クリッピング
if (absLoad < hourStart) { leftClipped = true; computedLoadHours = hourStart; }
if (absUnload > hourEnd) { rightClipped = true; computedUnloadHours = hourEnd; }
```

**Step 3: 現在時刻インジケーターを rangeStartDate 基準に修正**

```typescript
{(() => {
  const now = new Date();
  const daysDiff = differenceInCalendarDays(startOfDay(now), startOfDay(rangeStartDate));
  const currentAbsHour = daysDiff * 24 + now.getHours() + now.getMinutes() / 60;
  if (currentAbsHour >= hourStart && currentAbsHour <= effectiveHourEnd) {
    return (
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
        style={{ left: `${hoursToPixelOffset(currentAbsHour, hourStart, effectiveHourEnd)}px` }}
      />
    );
  }
  return null;
})()}
```

**Step 4: グリッドラインの日付境界マーカーを更新**

0時（日付境界）のグリッドラインをオレンジ色に:
```typescript
{Array.from({ length: effectiveTotalHours }, (_, i) => {
  const isMidnight = i > 0 && i % 24 === 0;
  return (
    <div
      key={i}
      className={`absolute top-0 bottom-0 border-r ${
        isMidnight ? 'border-orange-300 border-r-2' : 'border-gray-100'
      }`}
      style={{ left: `${i * HOUR_WIDTH}px`, width: `${HOUR_WIDTH}px` }}
    />
  );
})}
```

**Step 5: OrderBar に渡す props を更新**

```jsx
<OrderBar
  key={order.orderId}
  order={order}
  customer={customerMap.get(order.customerId)}
  rangeStartDate={rangeStartDate}
  onUnassign={onUnassignVehicle}
  onUpdateOrderTime={onUpdateOrderTime}
  hourEnd={effectiveHourEnd}
/>
```

`selectedDate` → `rangeStartDate`、`multiDayMode` 削除。

---

### Task 3: DispatchPlanPage.tsx — ナビゲーション変更

**Files:**
- Modify: `src/pages/DispatchPlanPage.tsx`

**概要:** 前日/今日/翌日ボタンを削除。「今日」フローティングボタンを追加。`ganttDate` state を削除。

**Step 1: 不要な state と関数を削除**

削除するもの:
- `ganttDate` state
- `navigateGanttDate` 関数

追加するもの:
```typescript
const [scrollToNowTrigger, setScrollToNowTrigger] = useState(0);
```

**Step 2: ガントチャートの日付ナビゲーション行を削除**

以下のブロックを完全に削除（268-291行目あたり）:
```jsx
{/* Gantt date navigation (only in gantt mode) */}
{viewMode === 'gantt' && (
  <div className="flex items-center gap-2 pt-1">
    {/* 前日/今日/翌日ボタン */}
  </div>
)}
```

**Step 3: GanttChart の呼び出しを更新**

```jsx
<GanttChart
  vehicles={vehicles}
  orders={filteredOrders}
  customers={customers}
  onAssignVehicle={assignVehicle}
  onUnassignVehicle={unassignVehicle}
  onUpdateOrderTime={handleUpdateOrderTime}
  scrollToNowTrigger={scrollToNowTrigger}
/>
```

`selectedDate` prop を削除。

**Step 4: 「今日」フローティングボタンを追加**

ガントモード表示時、右下にフローティング「今日」ボタン:
```jsx
{viewMode === 'gantt' && (
  <button
    onClick={() => setScrollToNowTrigger(prev => prev + 1)}
    className="fixed bottom-6 right-6 z-50
               px-4 py-2.5 bg-blue-600 text-white rounded-full shadow-lg
               hover:bg-blue-700 active:bg-blue-800 transition-colors
               text-sm font-bold flex items-center gap-2"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2" />
    </svg>
    今日
  </button>
)}
```

---

### Task 4: ビルド確認と動作テスト

**Files:**
- N/A（ビルド・動作確認のみ）

**Step 1: ビルドが通ることを確認**

Run: `cd /home/user/hatauchi/KUBOXT/Vehicle-dispatch-plan-app && npm run build`
Expected: ビルド成功（TypeScriptエラーなし）

**Step 2: 手動動作確認チェックリスト**

1. ガントチャートが現在時刻付近で初期表示される
2. 左にスクロールすると過去の日付が追加される
3. 右にスクロールすると未来の日付が追加される
4. 車両列が左端に固定されている
5. 現在時刻に赤いバーが表示される
6. 日付ラベルがヘッダーに正しく表示される
7. 「今日」ボタンで現在時刻にスムーズスクロールする
8. ドラッグ&ドロップが正常に動作する
9. オーダーバーのリサイズが正常に動作する
10. 日付境界（0時）にオレンジ色のラインが表示される

**Step 3: 問題があれば修正**

**Step 4: コミット**

```bash
git add src/components/gantt/GanttChart.tsx src/components/gantt/GanttVehicleRow.tsx src/pages/DispatchPlanPage.tsx
git commit -m "feat: replace 2-day fixed timeline with infinite scroll Gantt chart

- Dynamic date range that extends ±1 day on scroll edge detection
- useLayoutEffect scroll compensation for seamless prepend
- Merged day labels + hour headers for proper scroll sync
- Floating 'Today' button replaces prev/today/next navigation
- Current time red indicator works across any date range
- Vehicle column stays sticky on left at all times"
```
