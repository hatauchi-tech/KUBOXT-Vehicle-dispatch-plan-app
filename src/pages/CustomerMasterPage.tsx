import React, { useState } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { CustomerList } from '../components/customers/CustomerList';
import { CustomerForm } from '../components/customers/CustomerForm';
import { Customer } from '../types';

export const CustomerMasterPage: React.FC = () => {
  const { customers, loading, error, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const handleAdd = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleSubmit = async (customer: Omit<Customer, 'createdAt' | 'updatedAt'>) => {
    if (editingCustomer) {
      await updateCustomer(editingCustomer.customerId, customer);
    } else {
      await createCustomer(customer);
    }
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">荷主マスタ</h1>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          荷主追加
        </button>
      </div>
      <CustomerList customers={customers} onEdit={handleEdit} onDelete={deleteCustomer} />
      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};
