import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';

const AdminDashboard = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('insights');
  const [stats, setStats] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchStats();
    fetchTabData();
  }, [activeTab, token]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } });
      const statsData = await res.json();
      if (res.status === 401) {
        window.location.href = '/auth';
        return;
      }
      if (res.ok) setStats(statsData);

    } catch (e) { console.error(e); }
  };

  const fetchTabData = async () => {
    setLoading(true);
    try {
      let endpoint = `/api/admin/${activeTab}`;
      if (activeTab === 'insights') endpoint = '/api/admin/bookings';
      if (activeTab === 'cities') endpoint = '/api/admin/cities/stats';

      const res = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (res.status === 401) {
        window.location.href = '/auth';
        return;
      }
      if (res.ok) {

        if (activeTab === 'insights') setData(result.bookings || []);
        else if (activeTab === 'venues') setData(result.venues || []);
        else if (activeTab === 'catering') setData(result.caterers || []);
        else if (activeTab === 'vendors') setData(result.vendors || []);
        else if (activeTab === 'deals') setData(result.deals || []);
        else if (activeTab === 'users') setData(result.users || []);
        else if (activeTab === 'cities') setData(result.cities || []);

        else if (activeTab === 'bookings') setData(result.bookings || []);
        else if (activeTab === 'quotations') setData(result.quotations || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const method = editItem ? 'PUT' : 'POST';
    const url = editItem ? `/api/admin/${activeTab}/${editItem._id}` : `/api/admin/${activeTab}`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        fetchTabData();
        fetchStats();
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete/deactivate this item?')) return;
    try {
      const res = await fetch(`/api/admin/${activeTab}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTabData();
        fetchStats();
      }
    } catch (e) { console.error(e); }
  };

  const handleStatusUpdate = async (id, type, newStatus) => {
    try {
      const res = await fetch(`/api/admin/${type}/${id}${type === 'bookings' ? '/status' : ''}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchTabData();
        fetchStats();
      }
    } catch (e) { console.error(e); }
  };

  const openModal = (item = null) => {
    setEditItem(item);
    setFormData(item || getDefaultFormData());
    setShowModal(true);
  };

  const getDefaultFormData = () => {
    switch (activeTab) {
      case 'venues': return { name: '', city: '', pricePerDay: 0, capacity: 100, isActive: true, images: [], description: '', amenities: [] };
      case 'vendors': return { name: '', category: 'decoration', city: '', price: 0, isActive: true, images: [], description: '' };
      case 'catering': return { name: '', city: '', pricingType: 'per_person', pricePerPerson: 0, isActive: true, images: [], description: '' };
      case 'deals': return { name: '', discountPercent: 0, validUntil: '', isActive: true, images: [], description: '' };

      case 'users': return { fullName: '', email: '', role: 'user', password: '' };
      default: return {};
    }
  };

  const renderContent = () => {
    if (loading && !data.length) return <div className="p-12 text-center text-on-surface/50">Synchronizing...</div>;

    switch (activeTab) {
      case 'insights':
        return (
          <div className="space-y-12">
            <header className="flex justify-between items-end mb-16 border-b border-[#2E2E2E]/30 pb-6">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-light tracking-wider serif-heading uppercase">Analytics & Control</h1>
                <p className="font-body-md text-on-surface/50 mt-2">Platform Performance Overview</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="font-label-sm text-label-sm text-on-surface/50 uppercase">Total Revenue</p>
                <p className="font-headline-md text-primary mt-1">PKR {stats?.stats?.totalRevenue?.toLocaleString() || 0}</p>
              </div>
            </header>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard title="Total Activity" value={stats?.stats?.totalBookings} />
              <MetricCard title="Confirmed" value={stats?.stats?.confirmedBookings} type="success" />
              <MetricCard title="Active Users" value={stats?.stats?.totalUsers} />
              <MetricCard title="Infrastructure" value={`${stats?.stats?.totalVenues}V / ${stats?.stats?.totalVendors}VN`} />
            </section>
            <section className="glass-panel rounded-DEFAULT overflow-hidden">
              <div className="p-8 border-b border-[#2E2E2E]/30 bg-[#131313]/60 flex justify-between items-center">
                <h2 className="font-label-sm text-label-sm text-on-surface/70 uppercase tracking-widest">Recent Transactions</h2>
              </div>
              <AdminTable columns={['ID', 'Client', 'Event', 'Capital', 'Status']} data={data} type="bookings" onStatusUpdate={handleStatusUpdate} />
            </section>
          </div>
        );
      case 'venues':
      case 'vendors':
      case 'catering':
      case 'deals':
      case 'users':
        return (
          <div className="space-y-8">
            <header className="flex justify-between items-center border-b border-[#2E2E2E]/30 pb-6">
              <h1 className="font-headline-md text-on-surface uppercase tracking-wider">{activeTab} Management</h1>
              <button onClick={() => openModal()} className="bg-primary text-on-primary px-6 py-2 rounded font-label-sm uppercase tracking-widest text-xs hover:bg-primary/90 transition-colors">
                Add New {activeTab.slice(0, -1)}
              </button>
            </header>
            <AdminTable
              columns={getTableColumns()}
              data={data}
              type={activeTab}
              onEdit={openModal}
              onDelete={handleDelete}
              onStatusUpdate={handleStatusUpdate}
            />

          </div>
        );
      case 'bookings':
      case 'quotations':
        return (
          <div className="space-y-8">
            <header className="border-b border-[#2E2E2E]/30 pb-6">
              <h1 className="font-headline-md text-on-surface uppercase tracking-wider">{activeTab} Ledger</h1>
            </header>
            <AdminTable
              columns={activeTab === 'bookings' ? ['ID', 'Client', 'Event', 'Capital', 'Status'] : ['ID', 'User', 'Event', 'Deal', 'Status']}
              data={data}
              type={activeTab}
              onStatusUpdate={handleStatusUpdate}
            />

          </div>
        );
      case 'cities':
        return (
          <div className="space-y-8">
            <header className="border-b border-[#2E2E2E]/30 pb-6">
              <h1 className="font-headline-md text-on-surface uppercase tracking-wider">Geographic Distribution</h1>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.map((c, i) => (
                <div key={i} className="glass-panel p-6">
                  <h3 className="text-xl text-primary font-light uppercase tracking-widest mb-4">{c.city || 'Unknown Location'}</h3>

                  <div className="flex flex-col gap-2 text-sm text-on-surface/50">
                    <div className="flex justify-between"><span>Venues</span><span className="text-white">{c.venues}</span></div>
                    <div className="flex justify-between"><span>Vendors</span><span className="text-white">{c.vendors}</span></div>
                    <div className="flex justify-between"><span>Caterers</span><span className="text-white">{c.caterers}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      default: return null;
    }
  };

  const getTableColumns = () => {
    if (activeTab === 'venues') return ['', 'Name', 'City', 'Capacity', 'Price', 'Status'];
    if (activeTab === 'vendors') return ['', 'Name', 'Category', 'City', 'Price', 'Status'];
    if (activeTab === 'catering') return ['', 'Name', 'City', 'Pricing', 'Status'];
    if (activeTab === 'deals') return ['', 'Name', 'Discount', 'Valid Until', 'Status'];
    if (activeTab === 'users') return ['Name', 'Email', 'Role', 'Status'];
    return [];
  };


  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-[#2E2E2E]/30 flex flex-col py-12 px-8 glass-panel z-10 hidden md:flex top-20 mt-20 h-[calc(100vh-80px)]">
        <nav className="space-y-2">
          <NavItem active={activeTab === 'insights'} icon="dashboard" label="Insights" onClick={() => setActiveTab('insights')} />
          <NavItem active={activeTab === 'venues'} icon="location_city" label="Venues" onClick={() => setActiveTab('venues')} />
          <NavItem active={activeTab === 'catering'} icon="restaurant" label="Catering" onClick={() => setActiveTab('catering')} />
          <NavItem active={activeTab === 'vendors'} icon="palette" label="Vendors" onClick={() => setActiveTab('vendors')} />
          <NavItem active={activeTab === 'deals'} icon="sell" label="Deals" onClick={() => setActiveTab('deals')} />
          <NavItem active={activeTab === 'users'} icon="group" label="Users" onClick={() => setActiveTab('users')} />
          <NavItem active={activeTab === 'cities'} icon="map" label="Cities" onClick={() => setActiveTab('cities')} />
          <NavItem active={activeTab === 'bookings'} icon="history" label="Bookings" onClick={() => setActiveTab('bookings')} />
          <NavItem active={activeTab === 'quotations'} icon="request_quote" label="Quotations" onClick={() => setActiveTab('quotations')} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative pt-32 pb-24 px-8 md:px-12">
        <div className="max-w-[1440px] mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-2xl p-8 rounded-lg border-primary/20 max-h-[85vh] overflow-y-auto">
            <h2 className="text-2xl font-light uppercase tracking-widest text-primary mb-8">{editItem ? 'Edit' : 'Create'} {activeTab.slice(0, -1)}</h2>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-6">
              {Object.keys(formData).map(key => {
                if (key === '_id' || key === 'createdAt' || key === 'updatedAt' || key === '__v' || key === 'bookedDates') return null;

                return (
                  <div key={key} className={['description', 'amenities', 'images'].includes(key) ? 'col-span-2' : ''}>
                    <label className="block text-[10px] uppercase tracking-widest text-on-surface/50 mb-2">{key.replace(/([A-Z])/g, ' $1')}</label>
                    {key === 'images' ? (
                      <div className="space-y-2">
                        <textarea
                          placeholder="Comma separated URLs"
                          value={Array.isArray(formData[key]) ? formData[key].join(', ') : formData[key] || ''}
                          onChange={e => setFormData({ ...formData, [key]: e.target.value.split(',').map(s => s.trim()) })}
                          className="w-full bg-[#1c1b1b] border border-[#2E2E2E]/50 p-3 rounded text-on-surface focus:border-primary transition-colors min-h-[100px]"
                        />
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {Array.isArray(formData[key]) && formData[key].map((img, idx) => img && (
                            <img key={idx} src={img} alt="preview" className="h-12 w-12 object-cover rounded border border-[#2E2E2E]/50" />
                          ))}
                        </div>
                      </div>
                    ) : key === 'description' ? (
                      <textarea
                        value={formData[key] || ''}
                        onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                        className="w-full bg-[#1c1b1b] border border-[#2E2E2E]/50 p-3 rounded text-on-surface focus:border-primary transition-colors min-h-[120px]"
                        placeholder="Detailed description..."
                      />
                    ) : typeof formData[key] === 'boolean' ? (

                      <select
                        value={formData[key]}
                        onChange={e => setFormData({ ...formData, [key]: e.target.value === 'true' })}
                        className="w-full bg-[#1c1b1b] border border-[#2E2E2E]/50 p-3 rounded text-on-surface focus:border-primary"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    ) : (
                      <input
                        type={typeof formData[key] === 'number' ? 'number' : 'text'}
                        value={formData[key] || ''}
                        onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                        className="w-full bg-[#1c1b1b] border border-[#2E2E2E]/50 p-3 rounded text-on-surface focus:border-primary transition-colors"
                      />
                    )}

                  </div>
                );
              })}
              <div className="col-span-2 flex justify-end gap-4 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 text-on-surface/50 uppercase tracking-widest text-xs hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="bg-primary text-on-primary px-8 py-2 rounded uppercase tracking-widest text-xs hover:shadow-[0_0_20px_rgba(197,160,89,0.3)] transition-all">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const NavItem = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-4 px-6 py-4 transition-all duration-300 group ${active ? 'text-primary bg-primary/5' : 'text-on-surface/50 hover:text-white hover:bg-white/5'}`}
  >
    <span className={`material-symbols-outlined text-[20px] ${active ? 'text-primary' : 'group-hover:text-primary transition-colors'}`}>{icon}</span>
    <span className="font-label-sm text-xs uppercase tracking-widest">{label}</span>
  </button>
);

const MetricCard = ({ title, value, type = 'default' }) => (
  <div className="glass-panel p-8 relative overflow-hidden group border border-[#2E2E2E]/30">
    <p className="font-label-sm text-xs text-on-surface/50 uppercase mb-4 tracking-widest">{title}</p>
    <p className={`text-4xl font-light ${type === 'success' ? 'text-primary' : 'text-on-surface'}`}>{value || 0}</p>
  </div>
);

const AdminTable = ({ columns, data, type, onEdit, onDelete, onStatusUpdate }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse min-w-[800px]">
      <thead>
        <tr>
          {columns.map(c => <th key={c} className="py-4 px-8 font-label-sm text-[10px] text-on-surface/30 uppercase tracking-widest border-b border-[#2E2E2E]/30 font-normal">{c}</th>)}
          {(onEdit || onDelete) && <th className="py-4 px-8 font-label-sm text-[10px] text-on-surface/30 uppercase tracking-widest border-b border-[#2E2E2E]/30 font-normal text-right">Actions</th>}
        </tr>
      </thead>
      <tbody className="font-body-md text-on-surface/80">
        {data.map((item, i) => (
          <tr key={item._id || i} className="hover:bg-[#1c1b1b]/50 transition-colors group">
            {type === 'bookings' && (
              <>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 font-mono text-xs text-on-surface/50">{item.bookingRef || item._id.slice(-6)}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10">{item.userId?.fullName}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 text-on-surface/50">{item.eventId?.eventType}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 text-primary font-mono whitespace-nowrap">PKR {item.totalPrice?.toLocaleString()}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    <select
                      value={item.status}
                      onChange={(e) => onStatusUpdate(item._id, 'bookings', e.target.value)}
                      className="bg-[#1c1b1b] text-[8px] uppercase tracking-widest text-on-surface/30 border border-[#2E2E2E]/30 rounded p-1 hover:border-primary transition-colors cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirm</option>
                      <option value="complete">Complete</option>
                      <option value="cancelled">Cancel</option>
                    </select>
                  </div>
                </td>
              </>
            )}
            {type === 'venues' && (
              <>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#2E2E2E]/30 bg-[#1c1b1b]">
                    {item.images?.[0] && <img src={item.images[0]} alt="" className="w-full h-full object-cover" />}
                  </div>
                </td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 font-light">{item.name}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 text-on-surface/50">{item.city}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 text-on-surface/50">{item.capacity}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 text-primary">PKR {item.pricePerDay?.toLocaleString()}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10"><StatusBadge status={item.isActive ? 'active' : 'inactive'} /></td>
              </>
            )}
            {type === 'vendors' && (
              <>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#2E2E2E]/30 bg-[#1c1b1b]">
                    {item.images?.[0] && <img src={item.images[0]} alt="" className="w-full h-full object-cover" />}
                  </div>
                </td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 font-light">{item.name}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 text-on-surface/50">{item.category}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 text-on-surface/50">{item.city}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 text-primary">PKR {item.price?.toLocaleString()}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10"><StatusBadge status={item.isActive ? 'active' : 'inactive'} /></td>
              </>
            )}
            {type === 'catering' && (
              <>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#2E2E2E]/30 bg-[#1c1b1b]">
                    {item.images?.[0] && <img src={item.images[0]} alt="" className="w-full h-full object-cover" />}
                  </div>
                </td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 font-light">{item.name}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 text-on-surface/50">{item.city}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 text-on-surface/50">{item.pricingType}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10"><StatusBadge status={item.isActive ? 'active' : 'inactive'} /></td>
              </>
            )}
            {type === 'deals' && (
              <>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#2E2E2E]/30 bg-[#1c1b1b]">
                    {item.images?.[0] && <img src={item.images[0]} alt="" className="w-full h-full object-cover" />}
                  </div>
                </td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 font-light">{item.name}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 text-primary">{item.discountPercent}% OFF</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 text-on-surface/50">{item.validUntil ? new Date(item.validUntil).toLocaleDateString() : 'N/A'}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10"><StatusBadge status={item.isActive ? 'active' : 'inactive'} /></td>
              </>
            )}
            {type === 'users' && (
              <>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 font-light">{item.fullName}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 text-on-surface/50">{item.email}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 text-on-surface/50">{item.role}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10"><StatusBadge status="active" /></td>
              </>
            )}
            {type === 'quotations' && (
              <>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 font-mono text-xs">{item._id.slice(-6)}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10">{item.userId?.fullName}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 text-on-surface/50">{item.eventId?.eventType}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10 text-on-surface/50">{item.dealId?.name || 'Standard'}</td>
                <td className="py-6 px-8 border-b border-[#2E2E2E]/10">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    <select
                      value={item.status}
                      onChange={(e) => onStatusUpdate(item._id, 'quotations', e.target.value)}
                      className="bg-[#1c1b1b] text-[8px] uppercase tracking-widest text-on-surface/30 border border-[#2E2E2E]/30 rounded p-1 hover:border-primary transition-colors cursor-pointer"
                    >
                      <option value="sent_to_admin">Review</option>
                      <option value="approved">Approve</option>
                      <option value="rejected">Reject</option>
                    </select>
                  </div>
                </td>
              </>
            )}

            {(onEdit || onDelete) && (
              <td className="py-6 px-8 border-b border-[#2E2E2E]/10 text-right">
                <div className="flex justify-end gap-4">
                  {onEdit && <button onClick={() => onEdit(item)} className="text-on-surface/30 hover:text-primary transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>}
                  {onDelete && <button onClick={() => onDelete(item._id)} className="text-on-surface/30 hover:text-error transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>}
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);


const StatusBadge = ({ status }) => {
  const styles = {
    confirmed: 'bg-primary/20 text-primary border-primary/30',
    complete: 'bg-green-500/20 text-green-500 border-green-500/30',
    pending: 'bg-surface-variant/20 text-surface-variant border-surface-variant/30',
    cancelled: 'bg-error/20 text-error border-error/30',
    active: 'bg-primary/20 text-primary border-primary/30',
    inactive: 'bg-on-surface/10 text-on-surface/40 border-on-surface/10',
    approved: 'bg-primary/20 text-primary border-primary/30',
    rejected: 'bg-error/20 text-error border-error/30',
    sent_to_admin: 'bg-surface-variant/20 text-surface-variant border-surface-variant/30',
  };
  return (
    <span className={`px-2 py-1 rounded-[4px] border text-[8px] uppercase tracking-widest font-bold ${styles[status] || styles.pending}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
};

export default AdminDashboard;
