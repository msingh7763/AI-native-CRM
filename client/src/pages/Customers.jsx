import React, { useEffect, useState } from 'react';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from '../services/api';
import { Search, SlidersHorizontal, Edit2, Trash2, Plus, X, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Shared Input style ─────────────────────────────────────── */
const inputCls = `w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-colors`;
const inputStyle = { background: '#FFF8F4', borderColor: '#F1E3DA', color: '#2D2A26' };

/* ── Toast ─────────────────────────────────────────────────── */
const Toast = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 40, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 40, scale: 0.95 }}
    className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white text-sm font-medium"
    style={{ background: type === 'success' ? '#A8C3A0' : '#F28C6F' }}
  >
    {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
    {message}
    <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100"><X size={14} /></button>
  </motion.div>
);

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]         = useState(null);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState({ name:'', email:'', phone:'', city:'', totalSpent:'', lastOrderDate:'' });

  const showToast = (msg, type='success') => { setToast({ message:msg, type }); setTimeout(() => setToast(null), 4000); };

  const fetchCustomers = async () => {
    setLoading(true);
    try { const r = await getCustomers(); setCustomers(r.data); }
    catch { showToast('Unable to load customers.', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const openAdd = () => {
    setEditId(null);
    setForm({ name:'', email:'', phone:'', city:'', totalSpent:'', lastOrderDate:'' });
    setShowModal(true);
  };
  const openEdit = (c) => {
    setEditId(c._id);
    setForm({ name: c.name||'', email: c.email||'', phone: c.phone||'', city: c.city||'',
      totalSpent: c.totalSpent||'', lastOrderDate: c.lastOrderDate ? c.lastOrderDate.split('T')[0] : '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.city) {
      showToast('Please fill all required fields.', 'error'); return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, totalSpent: Number(form.totalSpent) || 0 };
      if (editId) {
        const r = await updateCustomer(editId, payload);
        setCustomers(prev => prev.map(c => c._id === editId ? r.data : c));
        showToast(`"${r.data.name}" updated!`);
      } else {
        const r = await addCustomer(payload);
        setCustomers(prev => [r.data, ...prev]);
        showToast(`"${r.data.name}" added!`);
      }
      setShowModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save.', 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    try {
      await deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c._id !== id));
      showToast('Customer deleted.');
    } catch { showToast('Failed to delete.', 'error'); }
  };

  const filtered = customers.filter(c => {
    const match = (c.name||'').toLowerCase().includes(search.toLowerCase()) ||
                  (c.email||'').toLowerCase().includes(search.toLowerCase());
    if (!match) return false;
    if (filterType === 'high_spenders') return (c.totalSpent||0) > 5000;
    if (filterType === 'recent') {
      if (!c.lastOrderDate) return false;
      return Math.ceil(Math.abs(new Date()-new Date(c.lastOrderDate))/(1000*60*60*24)) <= 30;
    }
    return true;
  });

  return (
    <div className="space-y-6 page-enter">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color:'#2D2A26' }}>Customers</h2>
          <p className="text-sm mt-0.5" style={{ color:'#7A736E' }}>
            {customers.length.toLocaleString()} total records
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all active:scale-95"
          style={{ background:'linear-gradient(135deg,#F28C6F,#E07355)', color:'#fff' }}
        >
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border overflow-hidden" style={{ background:'#fff', borderColor:'#F1E3DA' }}>

        {/* Toolbar */}
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor:'#F1E3DA' }}>
          <div className="flex items-center gap-2 flex-1 max-w-xs px-3 py-2.5 rounded-xl border text-sm" style={{ background:'#FFF8F4', borderColor:'#F1E3DA' }}>
            <Search size={15} style={{ color:'#B8AFA9' }} />
            <input className="bg-transparent border-none outline-none flex-1 text-sm" style={{ color:'#2D2A26' }}
              placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm cursor-pointer" style={{ background:'#FFF8F4', borderColor:'#F1E3DA', color:'#7A736E' }}>
            <SlidersHorizontal size={14} />
            <select className="bg-transparent border-none outline-none text-sm cursor-pointer" style={{ color:'#7A736E' }}
              value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">All Customers</option>
              <option value="high_spenders">High Spenders (&gt;₹5000)</option>
              <option value="recent">Recent (Last 30 Days)</option>
            </select>
          </div>
          <span className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background:'#FFF1E8', color:'#F28C6F' }}>
            {filtered.length} results
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background:'#FFF8F4', borderBottom:'1px solid #F1E3DA' }}>
                {['Name','Email','Phone','City','Total Spent','Last Order',''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color:'#B8AFA9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color:'#B8AFA9' }}>Loading customers…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color:'#B8AFA9' }}>
                  {customers.length === 0 ? 'No customers yet — click "Add Customer" or generate demo data.' : 'No results match your search.'}
                </td></tr>
              ) : filtered.map(c => (
                <motion.tr key={c._id} initial={{ opacity:0 }} animate={{ opacity:1 }}
                  className="border-b transition-colors cursor-default"
                  style={{ borderColor:'#F8EDE8' }}
                  onMouseEnter={e => e.currentTarget.style.background='#FFFAF7'}
                  onMouseLeave={e => e.currentTarget.style.background=''}
                >
                  <td className="px-5 py-3.5 font-semibold" style={{ color:'#2D2A26' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background:'linear-gradient(135deg,#F28C6F,#A8C3A0)' }}>
                        {c.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      {c.name}
                    </div>
                  </td>
                  <td className="px-5 py-3.5" style={{ color:'#7A736E' }}>{c.email}</td>
                  <td className="px-5 py-3.5" style={{ color:'#7A736E' }}>{c.phone || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background:'#FFF1E8', color:'#F28C6F' }}>{c.city || '—'}</span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold" style={{ color:'#2D2A26' }}>₹{(c.totalSpent||0).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-xs" style={{ color:'#7A736E' }}>
                    {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color:'#B8AFA9' }}
                        onMouseEnter={e => { e.currentTarget.style.background='#EFF6FF'; e.currentTarget.style.color='#60A5FA'; }}
                        onMouseLeave={e => { e.currentTarget.style.background=''; e.currentTarget.style.color='#B8AFA9'; }}>
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(c._id, c.name)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color:'#B8AFA9' }}
                        onMouseEnter={e => { e.currentTarget.style.background='#FEF2F2'; e.currentTarget.style.color='#F87171'; }}
                        onMouseLeave={e => { e.currentTarget.style.background=''; e.currentTarget.style.color='#B8AFA9'; }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-40 flex items-center justify-center p-4"
            style={{ background:'rgba(45,42,38,0.4)', backdropFilter:'blur(4px)' }}
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div initial={{ opacity:0, scale:0.95, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:16 }}
              className="w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden"
              style={{ background:'#fff', borderColor:'#F1E3DA' }}
            >
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor:'#F1E3DA' }}>
                <h2 className="text-base font-bold" style={{ color:'#2D2A26' }}>{editId ? 'Edit Customer' : 'Add New Customer'}</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color:'#B8AFA9' }}
                  onMouseEnter={e => e.currentTarget.style.background='#FFF1E8'}
                  onMouseLeave={e => e.currentTarget.style.background=''}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {[
                  { key:'name',  label:'Customer Name', type:'text',  placeholder:'John Doe',           required:true },
                  { key:'email', label:'Email Address',  type:'email', placeholder:'john@example.com',   required:true },
                  { key:'phone', label:'Phone Number',   type:'tel',   placeholder:'+91 9876543210',      required:true },
                  { key:'city',  label:'City',           type:'text',  placeholder:'Mumbai',              required:true },
                  { key:'totalSpent',    label:'Total Spent (₹)', type:'number', placeholder:'15000' },
                  { key:'lastOrderDate', label:'Last Order Date',  type:'date',   placeholder:'' },
                ].map(({ key, label, type, placeholder, required }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color:'#7A736E' }}>
                      {label} {required && <span style={{ color:'#F28C6F' }}>*</span>}
                    </label>
                    <input type={type} required={required} placeholder={placeholder}
                      className={inputCls} style={inputStyle}
                      value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                      onFocus={e => e.target.style.borderColor='#F28C6F'}
                      onBlur={e => e.target.style.borderColor='#F1E3DA'}
                    />
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
                    style={{ borderColor:'#F1E3DA', color:'#7A736E' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 active:scale-95"
                    style={{ background:'linear-gradient(135deg,#F28C6F,#E07355)' }}>
                    {submitting ? 'Saving…' : editId ? 'Save Changes' : 'Add Customer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default Customers;
