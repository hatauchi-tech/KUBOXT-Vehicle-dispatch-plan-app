import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import type { ConnectDropTarget, ConnectDragSource } from 'react-dnd';
import { startOfDay, differenceInCalendarDays, isSameDay } from 'date-fns';
import type { Vehicle, Order, Customer } from '../../types';
import { DND_ITEM_TYPE_ORDER } from './DraggableOrderCard';
import type { DraggedOrderItem } from './DraggableOrderCard';

/**
 * Bridge react-dnd connector ref with React 19 ref callback (drop target).
 */
function useDropRef<T extends HTMLElement>(connector: ConnectDropTarget) {
  return useCallback(
    (node: T | null) => {
      connector(node);
    },
    [connector],
  );
}

/**
 * Bridge react-dnd connector ref with React 19 ref callback (drag source).
 */
function useDragRef<T extends HTMLElement>(connector: ConnectDragSource) {
  return useCallback(
    (node: T | null) => {
      connector(node);
    },
    [connector],
  );
}

/** Pixels per hour column (constant) */
const HOUR_WIDTH = 80;

/** Default timeline range */
const DEFAULT_HOUR_START = 0;
const DEFAULT_HOUR_END = 24;

/** Map from requestVehicleType to a Tailwind-friendly color set */
const VEHICLE_TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  '4t': { bg: 'bg-blue-200', border: 'border-blue-400', text: 'text-blue-900' },
  '10t': { bg: 'bg-emerald-200', border: 'border-emerald-400', text: 'text-emerald-900' },
  'トレーラー': { bg: 'bg-purple-200', border: 'border-purple-400', text: 'text-purple-900' },
  'ユニック': { bg: 'bg-amber-200', border: 'border-amber-400', text: 'text-amber-900' },
  '平ボディ': { bg: 'bg-rose-200', border: 'border-rose-400', text: 'text-rose-900' },
  'ウイング': { bg: 'bg-cyan-200', border: 'border-cyan-400', text: 'text-cyan-900' },
  'ダンプ': { bg: 'bg-orange-200', border: 'border-orange-400', text: 'text-orange-900' },
};

const DEFAULT_COLOR = { bg: 'bg-indigo-200', border: 'border-indigo-400', text: 'text-indigo-900' };

function getColorForType(vehicleType: string) {
  return VEHICLE_TYPE_COLORS[vehicleType] ?? DEFAULT_COLOR;
}

/** Parse "HH:mm" string to fractional hours (e.g. "09:30" => 9.5) */
function parseTimeToHours(time: string | undefined, fallback: number): number {
  if (!time) return fallback;
  const parts = time.split(':');
  if (parts.length < 2) return fallback;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return fallback;
  return hours + minutes / 60;
}

/** Convert fractional hours to pixel offset within the timeline */
function hoursToPixelOffset(hours: number, hourStart: number, hourEnd: number): number {
  const clamped = Math.max(hourStart, Math.min(hours, hourEnd));
  return (clamped - hourStart) * HOUR_WIDTH;
}

/** Convert pixel offset back to a "HH:mm" time string, snapped to 15-minute increments */
function pixelOffsetToTime(px: number, hourStart: number, _hourEnd: number): string {
  const hours = px / HOUR_WIDTH + hourStart;
  const clamped = Math.max(hourStart, hours);
  const totalMinutes = Math.round(clamped * 60 / 15) * 15;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const displayH = h % 24;
  return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ─── Props ────────────────────────────────────────────────────────────

interface GanttVehicleRowProps {
  vehicle: Vehicle;
  orders: Order[];
  customers: Customer[];
  rangeStartDate: Date;
  onAssignVehicle: (
    orderId: string,
    vehicleNumber: string,
    vehicleType: string,
    driverName: string,
  ) => Promise<void>;
  onUnassignVehicle: (orderId: string) => Promise<void>;
  onUpdateOrderTime?: (orderId: string, loadTime: string, unloadTime: string) => Promise<void>;
  totalHours: number;
}

// ─── OrderBar sub-component ───────────────────────────────────────────

interface OrderBarProps {
  order: Order;
  customer?: Customer;
  rangeStartDate: Date;
  onUnassign: (orderId: string) => Promise<void>;
  onUpdateOrderTime?: (orderId: string, loadTime: string, unloadTime: string) => Promise<void>;
  hourEnd: number;
}

const OrderBar: React.FC<OrderBarProps> = ({ order, customer, rangeStartDate, onUnassign, onUpdateOrderTime, hourEnd }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const hourStart = DEFAULT_HOUR_START;
  const totalHours = hourEnd - hourStart;
  const minBarWidth = HOUR_WIDTH / 2;

  // --- Drag support (for vehicle reassignment) ---
  const [{ isDragging }, dragConnector] = useDrag<DraggedOrderItem, unknown, { isDragging: boolean }>(() => ({
    type: DND_ITEM_TYPE_ORDER,
    item: { type: DND_ITEM_TYPE_ORDER, order },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [order]);

  const dragRef = useDragRef<HTMLDivElement>(dragConnector);

  // Resize state
  const [resizing, setResizing] = useState<'left' | 'right' | null>(null);
  const [resizeLeft, setResizeLeft] = useState<number | null>(null);
  const [resizeWidth, setResizeWidth] = useState<number | null>(null);
  const startXRef = useRef(0);
  const startLeftRef = useRef(0);
  const startWidthRef = useRef(0);

  // --- Position calculation (always relative to rangeStartDate) ---
  let computedLoadHours: number;
  let computedUnloadHours: number;
  let leftClipped = false;
  let rightClipped = false;

  const day1Start = startOfDay(rangeStartDate);
  const getAbsoluteHour = (date: Date, time: string | undefined, fallback: number): number => {
    const daysDiff = differenceInCalendarDays(startOfDay(date), day1Start);
    return daysDiff * 24 + parseTimeToHours(time, fallback);
  };

  const absLoad = getAbsoluteHour(order.loadDate, order.loadTime, 8);
  const absUnload = getAbsoluteHour(order.unloadDate, order.unloadTime, 17);

  computedLoadHours = absLoad;
  computedUnloadHours = absUnload;

  if (absLoad < hourStart) { leftClipped = true; computedLoadHours = hourStart; }
  if (absUnload > hourEnd) { rightClipped = true; computedUnloadHours = hourEnd; }

  // Ensure unload is after load (minimum 0.5h bar width)
  const effectiveUnload = Math.max(computedUnloadHours, computedLoadHours + 0.5);

  const baseLeft = hoursToPixelOffset(computedLoadHours, hourStart, hourEnd);
  const baseWidth = Math.max(
    hoursToPixelOffset(effectiveUnload, hourStart, hourEnd) - baseLeft,
    minBarWidth,
  );

  // Use resize overrides during drag, otherwise use computed values
  const left = resizeLeft ?? baseLeft;
  const width = resizeWidth ?? baseWidth;

  const isMultiDay = !isSameDay(order.loadDate, order.unloadDate);
  const color = getColorForType(order.requestVehicleType);

  const handleUnassignClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      void onUnassign(order.orderId);
    },
    [onUnassign, order.orderId],
  );

  // --- Resize logic ---

  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, side: 'left' | 'right') => {
      e.preventDefault();
      e.stopPropagation();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      startXRef.current = clientX;
      startLeftRef.current = resizeLeft ?? baseLeft;
      startWidthRef.current = resizeWidth ?? baseWidth;
      setResizing(side);
    },
    [baseLeft, baseWidth, resizeLeft, resizeWidth],
  );

  useEffect(() => {
    if (!resizing) return;

    const timelineMaxPx = totalHours * HOUR_WIDTH;

    const handleMove = (clientX: number) => {
      const delta = clientX - startXRef.current;

      if (resizing === 'left') {
        let newLeft = startLeftRef.current + delta;
        let newWidth = startWidthRef.current - delta;

        if (newLeft < 0) {
          newWidth += newLeft;
          newLeft = 0;
        }
        if (newWidth < minBarWidth) {
          newLeft = startLeftRef.current + startWidthRef.current - minBarWidth;
          newWidth = minBarWidth;
        }
        if (newLeft + newWidth > timelineMaxPx) {
          newLeft = timelineMaxPx - newWidth;
        }

        setResizeLeft(newLeft);
        setResizeWidth(newWidth);
      } else {
        let newWidth = startWidthRef.current + delta;

        if (newWidth < minBarWidth) {
          newWidth = minBarWidth;
        }
        const currentLeft = startLeftRef.current;
        if (currentLeft + newWidth > timelineMaxPx) {
          newWidth = timelineMaxPx - currentLeft;
        }

        setResizeWidth(newWidth);
      }
    };

    const handleEnd = () => {
      const finalLeft = resizeLeft ?? baseLeft;
      const finalWidth = resizeWidth ?? baseWidth;
      const finalRight = finalLeft + finalWidth;

      const newLoadTime = pixelOffsetToTime(finalLeft, hourStart, hourEnd);
      const newUnloadTime = pixelOffsetToTime(finalRight, hourStart, hourEnd);

      setResizing(null);
      setResizeLeft(null);
      setResizeWidth(null);

      if (onUpdateOrderTime) {
        void onUpdateOrderTime(order.orderId, newLoadTime, newUnloadTime);
      }
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    };
    const handleMouseUp = () => handleEnd();
    const handleTouchEnd = () => handleEnd();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [resizing, resizeLeft, resizeWidth, baseLeft, baseWidth, onUpdateOrderTime, order.orderId, totalHours, hourStart, hourEnd, minBarWidth]);

  // Compute displayed times during resize for the tooltip
  const displayLoadTime = resizing ? pixelOffsetToTime(left, hourStart, hourEnd) : order.loadTime;
  const displayUnloadTime = resizing ? pixelOffsetToTime(left + width, hourStart, hourEnd) : order.unloadTime;

  return (
    <div
      ref={dragRef}
      className={`absolute top-1 bottom-1 rounded-md border ${color.bg} ${color.border} ${color.text}
                  flex items-center overflow-visible cursor-grab
                  hover:brightness-95 transition-none group`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        zIndex: resizing ? 30 : undefined,
        opacity: isDragging ? 0.3 : undefined,
      }}
      onMouseEnter={() => { if (!resizing) setShowTooltip(true); }}
      onMouseLeave={() => { if (!resizing) setShowTooltip(false); }}
      onClick={(e) => {
        if (!resizing && !isDragging && e.detail === 1) {
          setShowTooltip((prev) => !prev);
        }
      }}
    >
      {/* Left clipped indicator */}
      {leftClipped && (
        <div className="absolute left-0 top-0 bottom-0 w-3 flex items-center justify-center bg-black/10 rounded-l-md z-[5]">
          <span className="text-[8px] text-gray-600 select-none">&laquo;</span>
        </div>
      )}

      {/* Left resize handle */}
      {!leftClipped && (
        <div
          className="absolute top-0 bottom-0 left-0 w-3 cursor-col-resize z-10
                     rounded-l-md bg-black/10 lg:bg-transparent lg:group-hover:bg-black/20
                     hover:!bg-black/30 active:!bg-black/30 transition-colors
                     flex items-center justify-center"
          onMouseDown={(e) => handleResizeStart(e, 'left')}
          onTouchStart={(e) => handleResizeStart(e, 'left')}
        >
          <div className="w-0.5 h-4 bg-black/20 rounded-full" />
        </div>
      )}

      {/* Bar label */}
      <span className="text-[10px] font-semibold px-2.5 truncate leading-tight select-none">
        {isMultiDay && <span className="mr-1 text-[9px] opacity-70">[連日]</span>}
        {order.itemName}
      </span>

      {/* Right resize handle */}
      {!rightClipped && (
        <div
          className="absolute top-0 bottom-0 right-0 w-3 cursor-col-resize z-10
                     rounded-r-md bg-black/10 lg:bg-transparent lg:group-hover:bg-black/20
                     hover:!bg-black/30 active:!bg-black/30 transition-colors
                     flex items-center justify-center"
          onMouseDown={(e) => handleResizeStart(e, 'right')}
          onTouchStart={(e) => handleResizeStart(e, 'right')}
        >
          <div className="w-0.5 h-4 bg-black/20 rounded-full" />
        </div>
      )}

      {/* Right clipped indicator */}
      {rightClipped && (
        <div className="absolute right-0 top-0 bottom-0 w-3 flex items-center justify-center bg-black/10 rounded-r-md z-[5]">
          <span className="text-[8px] text-gray-600 select-none">&raquo;</span>
        </div>
      )}

      {/* Unassign button */}
      {!resizing && !isDragging && (
        <button
          onClick={handleUnassignClick}
          className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center
                     opacity-70 lg:opacity-0 lg:group-hover:opacity-100
                     bg-white rounded-full shadow-sm border border-gray-300
                     text-gray-500 hover:text-red-600 active:text-red-600
                     transition-opacity z-20"
          title="配車解除"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Resize time indicator */}
      {resizing && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1
                     bg-gray-900 text-white rounded px-2 py-1
                     text-[11px] font-mono whitespace-nowrap pointer-events-none shadow-lg"
        >
          {displayLoadTime} - {displayUnloadTime}
          <div className="absolute top-full left-1/2 -translate-x-1/2">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4
                            border-l-transparent border-r-transparent border-t-gray-900" />
          </div>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && !resizing && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2
                     w-56 bg-white rounded-lg shadow-xl border border-gray-200 p-3
                     text-xs text-gray-700 pointer-events-none"
        >
          <div className="space-y-1">
            <p className="font-bold text-gray-900">{order.orderId}</p>
            {customer && (
              <p><span className="text-gray-500">荷主: </span>{customer.customerName}</p>
            )}
            <p><span className="text-gray-500">品名: </span>{order.itemName}</p>
            <p>
              <span className="text-gray-500">積込: </span>
              {order.loadAddress1}
              {order.loadTime ? ` (${order.loadTime})` : ''}
            </p>
            <p>
              <span className="text-gray-500">荷卸: </span>
              {order.unloadAddress1}
              {order.unloadTime ? ` (${order.unloadTime})` : ''}
            </p>
            <p><span className="text-gray-500">車種: </span>{order.requestVehicleType}</p>
            {isMultiDay && (
              <p>
                <span className="text-gray-500">期間: </span>
                {`${order.loadDate.getMonth() + 1}/${order.loadDate.getDate()}`} → {`${order.unloadDate.getMonth() + 1}/${order.unloadDate.getDate()}`}
              </p>
            )}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2.5 h-2.5 bg-white border-b border-r border-gray-200 rotate-45 -translate-y-1.5" />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Row Component ───────────────────────────────────────────────

export const GanttVehicleRow: React.FC<GanttVehicleRowProps> = ({
  vehicle,
  orders,
  customers,
  rangeStartDate,
  onAssignVehicle,
  onUnassignVehicle,
  onUpdateOrderTime,
  totalHours: totalHoursProp,
}) => {
  const hourStart = DEFAULT_HOUR_START;
  const effectiveTotalHours = totalHoursProp ?? (DEFAULT_HOUR_END - DEFAULT_HOUR_START);
  const effectiveHourEnd = hourStart + effectiveTotalHours;

  const customerMap = React.useMemo(() => {
    const map = new Map<string, Customer>();
    for (const c of customers) {
      map.set(c.customerId, c);
    }
    return map;
  }, [customers]);

  const [{ isOver, canDrop }, dropConnector] = useDrop<
    DraggedOrderItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >(() => ({
    accept: DND_ITEM_TYPE_ORDER,
    canDrop: (item) => {
      return vehicle.supportedRequestTypes.includes(item.order.requestVehicleType);
    },
    drop: (item) => {
      if (item.order.assignedVehicleNumber === vehicle.vehicleNumber) return;
      void onAssignVehicle(
        item.order.orderId,
        vehicle.vehicleNumber,
        vehicle.vehicleType,
        vehicle.driverName ?? '',
      );
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [vehicle, onAssignVehicle]);

  const dropRef = useDropRef<HTMLDivElement>(dropConnector);

  let rowBg = 'bg-white';
  if (isOver && canDrop) {
    rowBg = 'bg-green-50';
  } else if (isOver && !canDrop) {
    rowBg = 'bg-red-50';
  }

  const rowOpacity = isOver && !canDrop ? 'opacity-50' : '';
  const timelineWidth = effectiveTotalHours * HOUR_WIDTH;

  return (
    <div className={`transition-colors duration-150 ${rowBg} ${rowOpacity}`}>
      {/* Timeline drop zone (vehicle info column is rendered separately in GanttChart) */}
      <div
        ref={dropRef}
        className="relative border-b border-gray-200"
        style={{ width: `${timelineWidth}px`, height: '48px' }}
      >
        {/* Hour grid lines */}
        {Array.from({ length: effectiveTotalHours }, (_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 border-r border-gray-200"
            style={{ left: `${i * HOUR_WIDTH}px`, width: `${HOUR_WIDTH}px` }}
          />
        ))}
        {/* Midnight markers (day boundary lines) */}
        {Array.from({ length: effectiveTotalHours }, (_, i) => {
          if (i > 0 && i % 24 === 0) {
            return (
              <div
                key={`midnight-${i}`}
                className="absolute top-0 bottom-0 w-0.5 bg-orange-400 z-[5] pointer-events-none"
                style={{ left: `${i * HOUR_WIDTH}px` }}
              />
            );
          }
          return null;
        })}

        {/* Current time indicator */}
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

        {/* Order bars */}
        {orders.map((order) => (
          <OrderBar
            key={order.orderId}
            order={order}
            customer={customerMap.get(order.customerId)}
            rangeStartDate={rangeStartDate}
            onUnassign={onUnassignVehicle}
            onUpdateOrderTime={onUpdateOrderTime}
            hourEnd={effectiveHourEnd}
          />
        ))}

        {/* Drop hint */}
        {isOver && canDrop && (
          <div className="absolute inset-0 border-2 border-dashed border-green-400 rounded pointer-events-none z-20" />
        )}
        {isOver && !canDrop && (
          <div className="absolute inset-0 border-2 border-dashed border-red-400 rounded pointer-events-none z-20 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-red-500 bg-white/80 px-2 py-0.5 rounded">
              対応不可
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/** Exported constants for use by parent components */
export { HOUR_WIDTH, DEFAULT_HOUR_START, DEFAULT_HOUR_END };
