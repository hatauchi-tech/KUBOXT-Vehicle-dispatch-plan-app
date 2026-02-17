import React, { useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { format, isSameDay, startOfDay, addDays, differenceInCalendarDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { Vehicle, Order, Customer } from '../../types';
import { GanttVehicleRow, HOUR_WIDTH } from './GanttVehicleRow';
import { UnassignedOrdersPanel } from './UnassignedOrdersPanel';

const DAY_WIDTH = HOUR_WIDTH * 24; // 1920px per day
const EXTEND_THRESHOLD = HOUR_WIDTH * 6; // 480px — extend when within 6 hours of edge

interface GanttChartProps {
  vehicles: Vehicle[];
  orders: Order[];
  customers: Customer[];
  onAssignVehicle: (
    orderId: string,
    vehicleNumber: string,
    vehicleType: string,
    driverName: string,
  ) => Promise<void>;
  onUnassignVehicle: (orderId: string) => Promise<void>;
  onUpdateOrderTime?: (orderId: string, loadTime: string, unloadTime: string) => Promise<void>;
  scrollToNowTrigger?: number;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  vehicles,
  orders,
  customers,
  onAssignVehicle,
  onUnassignVehicle,
  onUpdateOrderTime,
  scrollToNowTrigger,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const vehicleListRef = useRef<HTMLDivElement>(null);

  // ── Dynamic date range ────────────────────────────────────────────
  const today = useMemo(() => startOfDay(new Date()), []);
  const [rangeStartDate, setRangeStartDate] = useState(() => addDays(today, -3));
  const [rangeEndDate, setRangeEndDate] = useState(() => addDays(today, 4));

  const totalDays = differenceInCalendarDays(rangeEndDate, rangeStartDate);
  const totalHours = totalDays * 24;
  const timelineWidth = totalHours * HOUR_WIDTH;

  // ── Scroll compensation refs ──────────────────────────────────────
  const pendingScrollAdjustRef = useRef(0);
  const isExtendingRef = useRef(false);
  const initialScrollDone = useRef(false);

  // ── Scroll edge detection + header sync ───────────────────────────
  useEffect(() => {
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      // Sync header horizontal scroll
      if (headerScrollRef.current) {
        headerScrollRef.current.scrollLeft = scrollEl.scrollLeft;
      }
      // Sync vehicle list vertical scroll
      if (vehicleListRef.current) {
        vehicleListRef.current.scrollTop = scrollEl.scrollTop;
      }

      if (isExtendingRef.current) return;

      // Extend left (past)
      if (scrollEl.scrollLeft < EXTEND_THRESHOLD) {
        isExtendingRef.current = true;
        pendingScrollAdjustRef.current += DAY_WIDTH;
        setRangeStartDate(prev => addDays(prev, -1));
      }

      // Extend right (future)
      const scrollRight = scrollEl.scrollWidth - scrollEl.scrollLeft - scrollEl.clientWidth;
      if (scrollRight < EXTEND_THRESHOLD) {
        isExtendingRef.current = true;
        setRangeEndDate(prev => addDays(prev, 1));
      }
    };

    scrollEl.addEventListener('scroll', handleScroll);
    return () => scrollEl.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Scroll compensation after prepend (runs before paint) ─────────
  useLayoutEffect(() => {
    if (pendingScrollAdjustRef.current > 0 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += pendingScrollAdjustRef.current;
      if (headerScrollRef.current) {
        headerScrollRef.current.scrollLeft += pendingScrollAdjustRef.current;
      }
      pendingScrollAdjustRef.current = 0;
    }
    // Reset extension lock after any render
    requestAnimationFrame(() => {
      isExtendingRef.current = false;
    });
  });

  // ── Initial scroll to current time ────────────────────────────────
  useLayoutEffect(() => {
    if (!initialScrollDone.current && scrollContainerRef.current && timelineWidth > 0) {
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
  }, [rangeStartDate, timelineWidth]);

  // ── "Today" button scroll ─────────────────────────────────────────
  useEffect(() => {
    if (scrollToNowTrigger === undefined || scrollToNowTrigger === 0) return;
    if (!scrollContainerRef.current) return;

    const now = new Date();
    const hoursSinceRangeStart =
      differenceInCalendarDays(startOfDay(now), rangeStartDate) * 24
      + now.getHours() + now.getMinutes() / 60;
    const scrollTo = Math.max(0, (hoursSinceRangeStart - 2) * HOUR_WIDTH);
    scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
  }, [scrollToNowTrigger, rangeStartDate]);

  // ── Derived data ────────────────────────────────────────────────────

  /** Orders that overlap with the current visible range */
  const ordersForRange = useMemo(() => {
    return orders.filter((o) => {
      const loadDay = startOfDay(o.loadDate);
      const unloadDay = startOfDay(o.unloadDate);
      return loadDay < rangeEndDate && unloadDay >= rangeStartDate;
    });
  }, [orders, rangeStartDate, rangeEndDate]);

  const unassignedOrders = useMemo(() => {
    return ordersForRange.filter((o) => o.status === 'unassigned');
  }, [ordersForRange]);

  const assignedOrdersByVehicle = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const v of vehicles) {
      map.set(v.vehicleNumber, []);
    }
    for (const o of ordersForRange) {
      if (o.status === 'assigned' && o.assignedVehicleNumber) {
        const list = map.get(o.assignedVehicleNumber);
        if (list) {
          list.push(o);
        }
      }
    }
    return map;
  }, [ordersForRange, vehicles]);

  // ── Day labels and hour columns ───────────────────────────────────

  const days = useMemo(() =>
    Array.from({ length: totalDays }, (_, i) => {
      const date = addDays(rangeStartDate, i);
      return {
        date,
        label: format(date, 'M/d(E)', { locale: ja }),
        isToday: isSameDay(date, today),
      };
    }),
    [totalDays, rangeStartDate, today],
  );

  const hours = useMemo(() =>
    Array.from({ length: totalHours }, (_, i) => ({
      absHour: i,
      displayHour: i % 24,
      isMidnight: i > 0 && i % 24 === 0,
    })),
    [totalHours],
  );

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full">
        {/* Main content area */}
        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          {/* Floating toggle button for tablets */}
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="lg:hidden fixed bottom-4 left-4 z-50
                       flex items-center gap-2 px-3 py-2.5
                       bg-orange-500 text-white rounded-full shadow-lg
                       hover:bg-orange-600 active:bg-orange-700 transition-colors"
            aria-label={sidebarOpen ? '未配車パネルを閉じる' : '未配車パネルを開く'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs font-bold">未配車 ({unassignedOrders.length})</span>
          </button>

          {/* Overlay backdrop for tablet sidebar */}
          {sidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/30 z-40"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Unassigned orders sidebar - Desktop */}
          <div className="hidden lg:flex w-72 min-w-[288px] border-r border-gray-200 bg-white p-3 overflow-hidden flex-col">
            <UnassignedOrdersPanel orders={unassignedOrders} customers={customers} />
          </div>

          {/* Unassigned orders sidebar - Tablet overlay */}
          <div
            className={`lg:hidden fixed top-0 left-0 h-full w-80 max-w-[85vw] z-40
                        bg-white border-r border-gray-200 p-3 flex flex-col
                        shadow-xl transition-transform duration-300 ease-in-out
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">未配車オーダー</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors"
                aria-label="閉じる"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <UnassignedOrdersPanel orders={unassignedOrders} customers={customers} />
            </div>
          </div>

          {/* Gantt chart area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
            {/* Unified header: day labels + hour columns */}
            <div className="flex border-b border-gray-300 bg-white shrink-0">
              {/* Vehicle column header */}
              <div className="w-[140px] min-w-[140px] lg:w-[200px] lg:min-w-[200px] border-r border-gray-300 bg-white flex flex-col justify-center px-3">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  車両
                </span>
              </div>

              {/* Timeline header (scroll-synced with body) */}
              <div className="flex-1 overflow-hidden" ref={headerScrollRef}>
                <div style={{ width: `${timelineWidth}px` }}>
                  {/* Day labels row */}
                  <div className="flex border-b border-gray-200">
                    {days.map((day) => (
                      <div
                        key={day.label}
                        className={`flex items-center justify-center border-r border-gray-300 py-1 ${
                          day.isToday ? 'bg-blue-50' : 'bg-white'
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
                  {/* Hour labels row */}
                  <div className="flex">
                    {hours.map((h) => (
                      <div
                        key={h.absHour}
                        className={`border-r border-gray-300 px-1 py-1 text-center ${
                          h.isMidnight
                            ? 'border-l-2 border-l-orange-400 bg-orange-50'
                            : ''
                        }`}
                        style={{ width: `${HOUR_WIDTH}px`, minWidth: `${HOUR_WIDTH}px` }}
                      >
                        {h.isMidnight && (
                          <span className="text-[9px] font-bold text-orange-600 block leading-tight">
                            {days[Math.floor(h.absHour / 24)]?.label}
                          </span>
                        )}
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

            {/* Gantt body: vehicle list (fixed) + timeline (scrollable) */}
            <div className="flex-1 flex min-h-0">
              {/* Vehicle names column - fixed left, vertical scroll synced */}
              <div
                ref={vehicleListRef}
                className="w-[140px] min-w-[140px] lg:w-[200px] lg:min-w-[200px] shrink-0 border-r border-gray-300 overflow-hidden bg-white"
              >
                {vehicles.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                    車両なし
                  </div>
                ) : (
                  <div>
                    {vehicles.map((vehicle) => (
                      <div
                        key={vehicle.vehicleNumber}
                        className="border-b border-gray-200 px-2 lg:px-3 flex flex-col justify-center"
                        style={{ height: '48px' }}
                      >
                        <span className="text-xs font-bold text-gray-800 truncate block">
                          {vehicle.vehicleNumber}
                        </span>
                        {vehicle.driverName && (
                          <span className="text-[11px] text-gray-500 truncate block">
                            {vehicle.driverName}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 truncate block">
                          {vehicle.vehicleType}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Timeline area - scrolls both directions */}
              <div className="flex-1 overflow-auto min-w-0 bg-white" ref={scrollContainerRef}>
                {vehicles.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                    車両が登録されていません
                  </div>
                ) : (
                  <div>
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
                  </div>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-2 flex items-center gap-4 flex-wrap">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mr-2">
                車種凡例:
              </span>
              {[
                { label: '4t', bg: 'bg-blue-200', border: 'border-blue-400' },
                { label: '10t', bg: 'bg-emerald-200', border: 'border-emerald-400' },
                { label: 'トレーラー', bg: 'bg-purple-200', border: 'border-purple-400' },
                { label: 'ユニック', bg: 'bg-amber-200', border: 'border-amber-400' },
                { label: '平ボディ', bg: 'bg-rose-200', border: 'border-rose-400' },
                { label: 'ウイング', bg: 'bg-cyan-200', border: 'border-cyan-400' },
                { label: 'ダンプ', bg: 'bg-orange-200', border: 'border-orange-400' },
                { label: 'その他', bg: 'bg-indigo-200', border: 'border-indigo-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1">
                  <div className={`w-4 h-2.5 rounded-sm border ${item.bg} ${item.border}`} />
                  <span className="text-[10px] text-gray-600">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
