import React from 'react';
import { Customer } from '../../types';

interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ customers, onEdit, onDelete }) => {
  const handleDelete = (customer: Customer) => {
    if (window.confirm(`荷主 ${customer.customerName} (${customer.customerId}) を削除してもよろしいですか？`)) {
      onDelete(customer.customerId);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">荷主ID</th>
            <th className="px-4 py-2 border">荷主名</th>
            <th className="px-4 py-2 border">電話番号</th>
            <th className="px-4 py-2 border">住所</th>
            <th className="px-4 py-2 border">備考</th>
            <th className="px-4 py-2 border">操作</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(customer => (
            <tr key={customer.customerId} className="hover:bg-gray-50">
              <td className="px-4 py-2 border">{customer.customerId}</td>
              <td className="px-4 py-2 border">{customer.customerName}</td>
              <td className="px-4 py-2 border">{customer.phone}</td>
              <td className="px-4 py-2 border">{customer.address}</td>
              <td className="px-4 py-2 border">{customer.notes}</td>
              <td className="px-4 py-2 border">
                <button
                  onClick={() => onEdit(customer)}
                  className="px-2 py-1 bg-blue-500 text-white rounded mr-2 hover:bg-blue-600"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(customer)}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {customers.length === 0 && (
        <div className="text-center py-8 text-gray-500">荷主データがありません</div>
      )}
    </div>
  );
};
