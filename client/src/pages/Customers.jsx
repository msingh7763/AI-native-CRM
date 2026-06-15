import React, { useEffect, useState } from 'react';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from '../services/api';
import { Search, Filter, Edit2, Trash2, Plus, X, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Toast = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white font-medium ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
  >
    {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
    {message}
    <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={16} /></button>
  </motion.div>
);

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '' });
  const [filterType, setFilterType] = useState('all');
  const [editId, setEditId] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await getCustomers();
      setCustomers(res.data);
    } catch (err) {
      showToast('Unable to load customers. Is the server running?', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!form.name || !form.email || !form.phone || !form.city) {
    showToast('Please fill all required fields.', 'error');
    return;
  }

  setSubmitting(true);

  try {
    const payload = {
      ...form,
      totalSpent: Number(form.totalSpent) || 0
    };

    if (editId) {
      const res = await updateCustomer(editId, payload);
      setCustomers(prev => prev.map(c => c._id === editId ? res.data : c));
      showToast(`Customer "${res.data.name}" updated successfully!`, 'success');
    } else {
      const res = await addCustomer(payload);
      setCustomers(prev => [res.data, ...prev]);
      showToast(`Customer "${res.data.name}" added successfully!`, 'success');
    }

    setShowModal(false);
    setEditId(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      city: '',
      totalSpent: '',
      lastOrderDate: ''
    });
  } catch (err) {
    showToast(
      err.response?.data?.message ||
      `Failed to ${editId ? 'update' : 'add'} customer.`,
      'error'
    );
  } finally {
    setSubmitting(false);
  }
};

  const handleEditClick = (c) => {
    setEditId(c._id);
    setForm({
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      city: c.city || '',
      totalSpent: c.totalSpent || '',
      lastOrderDate: c.lastOrderDate ? c.lastOrderDate.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDeleteClick = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c._id !== id));
      showToast('Customer deleted successfully.', 'success');
    } catch (err) {
      showToast('Failed to delete customer.', 'error');
    }
  };

  const filtered = customers.filter(c => {
    const matchesSearch = (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (c.email || '').toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    
    if (filterType === 'high_spenders') return (c.totalSpent || 0) > 5000;
    if (filterType === 'recent') {
      if (!c.lastOrderDate) return false;
      const diffTime = Math.abs(new Date() - new Date(c.lastOrderDate));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays <= 30;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm opacity-70 mt-1 text-black-800">Manage your audience data. Total: <strong>{customers.length}</strong></p>
        </div>
        <button
          onClick={() => {
            setEditId(null);
            setForm({ name: '', email: '', phone: '', city: '', totalSpent: '', lastOrderDate: '' });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
        >
          <Plus size={18} /> Add Customer
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-red-900 rounded-xl shadow-sm border border-red-100 dark:border-red-800 overflow-hidden">
        <div className="p-4 border-b border-red-100 dark:border-red-800 flex justify-between items-center">
          <div className="flex items-center bg-red-50 dark:bg-red-800 rounded-lg px-3 py-2 w-80 border border-red-200 dark:border-red-700">
            <Search size={18} className="text-primary mr-2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="bg-transparent border-none outline-none text-sm w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-800 px-3 py-2 rounded-lg border border-red-200 dark:border-red-700 hover:bg-red-100 transition-colors text-sm font-medium">
            <Filter size={16} />
            <select
              className="bg-transparent border-none outline-none font-medium cursor-pointer"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All</option>
              <option value="high_spenders">Spenders &gt; ₹5000</option>
              <option value="recent">Recent (Last 30 Days)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-primary text-white uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4">Total Spent</th>
                <th className="px-6 py-4">Last Order</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center opacity-60">Loading customers...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center opacity-60">
                    {customers.length === 0
                      ? 'No customers yet. Click "Add Customer" or go to Dashboard → "Generate Demo Data".'
                      : 'No customers match your search.'}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <motion.tr
                    key={c._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-red-50 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold">{c.name}</td>
                    <td className="px-6 py-4">{c.email}</td>
                    <td className="px-6 py-4 opacity-70">{c.phone || '—'}</td>
                    <td className="px-6 py-4">{c.city || '—'}</td>
                    <td className="px-6 py-4 font-semibold text-primary">₹{(c.totalSpent || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 opacity-70">{c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : 'Never'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => handleEditClick(c)} className="text-gray-400 hover:text-blue-500 transition-colors">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteClick(c._id, c.name)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-red-900 rounded-2xl shadow-2xl w-full max-w-md border border-red-100 dark:border-red-800"
            >
              <div className="p-6 border-b border-red-100 dark:border-red-800 flex justify-between items-center">
                <h2 className="text-xl font-bold">{editId ? 'Edit Customer' : 'Add New Customer'}</h2>
                <button type="button" onClick={() => setShowModal(false)} className="p-1 hover:text-primary transition-colors">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">

  {/* Customer Name */}
  <div>
    <label className="block text-sm font-medium mb-2">
      Customer Name <span className="text-red-500">*</span>
    </label>

    <input
      type="text"
      required
      placeholder="Enter customer name"
      value={form.name}
      onChange={(e) =>
        setForm({ ...form, name: e.target.value })
      }
      className="w-full px-4 py-3 rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-800 outline-none focus:ring-2 focus:ring-red-500"
    />
  </div>

  {/* Email */}
  <div>
    <label className="block text-sm font-medium mb-2">
      Email Address <span className="text-red-500">*</span>
    </label>

    <input
      type="email"
      required
      placeholder="customer@example.com"
      value={form.email}
      onChange={(e) =>
        setForm({ ...form, email: e.target.value })
      }
      className="w-full px-4 py-3 rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-800 outline-none focus:ring-2 focus:ring-red-500"
    />
  </div>

  {/* Phone */}
  <div>
    <label className="block text-sm font-medium mb-2">
      Phone Number <span className="text-red-500">*</span>
    </label>

    <input
      type="tel"
      required
      placeholder="+91 9876543210"
      value={form.phone}
      onChange={(e) =>
        setForm({ ...form, phone: e.target.value })
      }
      className="w-full px-4 py-3 rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-800 outline-none focus:ring-2 focus:ring-red-500"
    />
  </div>

  {/* City */}
  <div>
    <label className="block text-sm font-medium mb-2">
      City <span className="text-red-500">*</span>
    </label>

    <input
      type="text"
      required
      placeholder="Mumbai"
      value={form.city}
      onChange={(e) =>
        setForm({ ...form, city: e.target.value })
      }
      className="w-full px-4 py-3 rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-800 outline-none focus:ring-2 focus:ring-red-500"
    />
  </div>

  {/* Total Spent */}
  <div>
    <label className="block text-sm font-medium mb-2">
      Total Spent (₹)
    </label>

    <input
      type="number"
      min="0"
      placeholder="15000"
      value={form.totalSpent}
      onChange={(e) =>
        setForm({ ...form, totalSpent: e.target.value })
      }
      className="w-full px-4 py-3 rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-800 outline-none focus:ring-2 focus:ring-red-500"
    />
  </div>

  {/* Last Order Date */}
  <div>
    <label className="block text-sm font-medium mb-2">
      Last Order Date
    </label>

    <input
      type="date"
      value={form.lastOrderDate}
      onChange={(e) =>
        setForm({
          ...form,
          lastOrderDate: e.target.value
        })
      }
      className="w-full px-4 py-3 rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-800 outline-none focus:ring-2 focus:ring-red-500"
    />
  </div>

  {/* Buttons */}
  <div className="flex gap-3 pt-4">
    <button
      type="button"
      onClick={() => setShowModal(false)}
      className="flex-1 py-3 rounded-xl border border-red-200 dark:border-red-700 font-medium hover:bg-red-50"
    >
      Cancel
    </button>

    <button
      type="submit"
      disabled={submitting}
      className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all disabled:opacity-50"
    >
      {submitting ? 'Saving...' : (editId ? 'Save Changes' : 'Add Customer')}
    </button>
  </div>

</form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default Customers;
