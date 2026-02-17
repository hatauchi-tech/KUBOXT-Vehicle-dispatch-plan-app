import React, { useCallback } from 'react';
import { useDrag } from 'react-dnd';
import type { ConnectDragSource } from 'react-dnd';
import type { Order, Customer } from '../../types';

/** Drag-and-drop item type constant */
export const DND_ITEM_TYPE_ORDER = 'ORDER';

/** Shape of the object carried during a drag operation */
export interface DraggedOrderItem {
  type: typeof DND_ITEM_TYPE_ORDER;
  order: Order;
}

interface DraggableOrderCardProps {
  order: Order;
  customer?: Customer;
}

/**
 * Bridge react-dnd connector ref with React 19 ref callback.
 * react-dnd's ConnectDragSource/ConnectDropTarget return types
 * are not directly assignable to React 19's Ref<T>.
 */
function useDndRef<T extends HTMLElement>(connector: ConnectDragSource) {
  return useCallback(
    (node: T | null) => {
      connector(node);
    },
    [connector],
  );
}

/**
 * Compact card that represents an unassigned order.
 * It can be picked up and dropped onto a GanttVehicleRow.
 */
export const DraggableOrderCard: React.FC<DraggableOrderCardProps> = ({
  order,
  customer,
}) => {
  const [{ isDragging }, dragConnector] = useDrag<
    DraggedOrderItem,
    unknown,
    { isDragging: boolean }
  >(() => ({
    type: DND_ITEM_TYPE_ORDER,
    item: { type: DND_ITEM_TYPE_ORDER, order },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [order]);

  const dragRef = useDndRef<HTMLDivElement>(dragConnector);

  return (
    <div
      ref={dragRef}
      className={`
        border border-gray-200 rounded-lg p-3 bg-white shadow-sm cursor-grab
        hover:shadow-md hover:border-blue-300 transition-all duration-150
        ${isDragging ? 'opacity-40 shadow-lg ring-2 ring-blue-400' : ''}
      `}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-gray-800 truncate">
          {order.orderId}
        </span>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 whitespace-nowrap ml-2">
          {order.requestVehicleType}
        </span>
      </div>

      {/* Customer */}
      {customer && (
        <p className="text-xs text-gray-500 mb-1 truncate">
          {customer.customerName}
        </p>
      )}

      {/* Item */}
      <p className="text-xs text-gray-700 font-medium mb-1 truncate">
        {order.itemName}
      </p>

      {/* Route */}
      <div className="flex items-center text-[11px] text-gray-500 gap-1">
        <span className="truncate max-w-[90px]">{order.loadAddress1}</span>
        <svg
          className="w-3 h-3 text-gray-400 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
        <span className="truncate max-w-[90px]">{order.unloadAddress1}</span>
      </div>
    </div>
  );
};
