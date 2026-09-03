import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { api, safeStorage, DEFAULT_API_URL } from './src/api';

type Tab = 'dashboard' | 'orders' | 'products' | 'customers' | 'payments' | 'settings';

function formatPkr(amount?: number | string): string {
  const num = Number(amount || 0);
  return `PKR ${num.toLocaleString('en-PK')}`;
}

function AdminMain() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [showApiConfig, setShowApiConfig] = useState(false);

  // Initialize and check session
  useEffect(() => {
    async function boot() {
      await api.init();
      setApiUrl(api.getBaseUrl());
      const token = api.getToken();
      if (token) {
        try {
          const res = await api.get('/auth/session');
          if (res?.data?.user && res.data.user.role === 'ADMIN') {
            setUser(res.data.user);
          } else {
            await api.setToken(null);
          }
        } catch {
          await api.setToken(null);
        }
      }
      setLoading(false);
    }
    boot();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please provide both email and password.');
      return;
    }
    setLoginLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: email.trim(),
        password: password.trim(),
      });
      const userData = res?.data?.user;
      const token = res?.data?.token;
      if (userData?.role !== 'ADMIN') {
        Alert.alert('Access Denied', 'Your account does not have administrator privileges.');
        return;
      }
      if (token) {
        await api.setToken(token);
      }
      setUser(userData);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed. Check your credentials.';
      Alert.alert('Sign In Failed', msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post('/auth/logout');
          } catch {}
          await api.setToken(null);
          setUser(null);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0F1F3D" />
        <Text style={styles.loadingText}>Connecting to Top Threadz...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ScrollView contentContainerStyle={styles.authScroll}>
          <View style={styles.authCard}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>TOP THREADZ</Text>
              <View style={styles.adminChip}>
                <Text style={styles.adminChipText}>ADMIN</Text>
              </View>
            </View>
            <Text style={styles.authTitle}>Operations Hub</Text>
            <Text style={styles.authSubtitle}>Sign in to manage orders, catalog & finances</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Admin Email</Text>
              <TextInput
                style={styles.textInput}
                placeholder="admin@topthreadz.pk"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loginLoading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In as Admin</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.configToggle}
              onPress={() => setShowApiConfig(!showApiConfig)}
            >
              <Text style={styles.configToggleText}>
                {showApiConfig ? 'Hide Server Settings' : 'Configure Backend URL'}
              </Text>
            </TouchableOpacity>

            {showApiConfig && (
              <View style={styles.configBox}>
                <Text style={styles.configLabel}>Backend API Endpoint</Text>
                <TextInput
                  style={styles.configInput}
                  value={apiUrl}
                  onChangeText={setApiUrl}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.configSaveBtn}
                  onPress={async () => {
                    await api.setBaseUrl(apiUrl);
                    Alert.alert('Saved', `API URL updated to: ${apiUrl}`);
                  }}
                >
                  <Text style={styles.configSaveText}>Update URL</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0F1F3D" />

      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View>
          <View style={styles.brandRow}>
            <Text style={styles.brandTitle}>TOP THREADZ</Text>
            <View style={styles.brandTag}>
              <Text style={styles.brandTagText}>ADMIN</Text>
            </View>
          </View>
          <Text style={styles.adminName}>
            {user.name || 'Admin'} • {user.email}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutIconButton} onPress={handleLogout}>
          <Text style={styles.logoutIconText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Active Tab Content */}
      <View style={styles.mainContent}>
        {activeTab === 'dashboard' && <DashboardView onNavigate={(t) => setActiveTab(t)} />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'products' && <ProductsView />}
        {activeTab === 'customers' && <CustomersView />}
        {activeTab === 'payments' && <PaymentsView />}
        {activeTab === 'settings' && <SettingsView onLogout={handleLogout} />}
      </View>

      {/* Modern Bottom Navigation Bar */}
      <View style={styles.bottomTabBar}>
        <TabButton
          icon="📊"
          label="Home"
          active={activeTab === 'dashboard'}
          onPress={() => setActiveTab('dashboard')}
        />
        <TabButton
          icon="📦"
          label="Orders"
          active={activeTab === 'orders'}
          onPress={() => setActiveTab('orders')}
        />
        <TabButton
          icon="👔"
          label="Products"
          active={activeTab === 'products'}
          onPress={() => setActiveTab('products')}
        />
        <TabButton
          icon="👥"
          label="Customers"
          active={activeTab === 'customers'}
          onPress={() => setActiveTab('customers')}
        />
        <TabButton
          icon="💳"
          label="Payments"
          active={activeTab === 'payments'}
          onPress={() => setActiveTab('payments')}
        />
        <TabButton
          icon="⚙️"
          label="Settings"
          active={activeTab === 'settings'}
          onPress={() => setActiveTab('settings')}
        />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AdminMain />
    </SafeAreaProvider>
  );
}

function TabButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.tabItem, active && styles.tabItemActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
      {active && <View style={styles.tabIndicator} />}
    </TouchableOpacity>
  );
}

// ----------------------------------------------------
// 1. DASHBOARD VIEW
// ----------------------------------------------------
function DashboardView({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setData(res?.data || null);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.tabLoader}>
        <ActivityIndicator size="small" color="#0F1F3D" />
        <Text style={styles.tabLoaderText}>Loading Dashboard metrics...</Text>
      </View>
    );
  }

  const s = data || {};

  return (
    <ScrollView
      style={styles.tabScrollView}
      contentContainerStyle={styles.tabScrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        <Text style={styles.sectionSubtitle}>Real-time store metrics & sales activity</Text>
      </View>

      {/* Revenue Highlights */}
      <View style={styles.metricGrid}>
        <View style={[styles.metricCard, { borderLeftColor: '#10B981', borderLeftWidth: 4 }]}>
          <Text style={styles.metricLabel}>Total Revenue</Text>
          <Text style={styles.metricValueLarge}>{formatPkr(s.totalRevenue)}</Text>
          <Text style={styles.metricHint}>All completed sales</Text>
        </View>
        <View style={[styles.metricCard, { borderLeftColor: '#3B82F6', borderLeftWidth: 4 }]}>
          <Text style={styles.metricLabel}>Today Revenue</Text>
          <Text style={styles.metricValueLarge}>{formatPkr(s.dailyRevenue)}</Text>
          <Text style={styles.metricHint}>Today's captured payments</Text>
        </View>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.miniCard}>
          <Text style={styles.miniCardValue}>{s.totalOrders || 0}</Text>
          <Text style={styles.miniCardLabel}>Total Orders</Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={[styles.miniCardValue, { color: '#D97706' }]}>{s.pendingOrders || 0}</Text>
          <Text style={styles.miniCardLabel}>Pending</Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={styles.miniCardValue}>{s.totalProducts || 0}</Text>
          <Text style={styles.miniCardLabel}>Products</Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={styles.miniCardValue}>{s.totalUsers || 0}</Text>
          <Text style={styles.miniCardLabel}>Customers</Text>
        </View>
      </View>

      {/* Quick Action Shortcuts */}
      <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Quick Management</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => onNavigate('orders')}>
          <Text style={styles.quickActionIcon}>📦</Text>
          <Text style={styles.quickActionTitle}>Manage Orders</Text>
          <Text style={styles.quickActionSub}>Inspect & update statuses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => onNavigate('products')}>
          <Text style={styles.quickActionIcon}>👔</Text>
          <Text style={styles.quickActionTitle}>Add Product</Text>
          <Text style={styles.quickActionSub}>Update catalog & stock</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => onNavigate('payments')}>
          <Text style={styles.quickActionIcon}>💳</Text>
          <Text style={styles.quickActionTitle}>Review Payments</Text>
          <Text style={styles.quickActionSub}>Approve or reject queue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => onNavigate('settings')}>
          <Text style={styles.quickActionIcon}>⚙️</Text>
          <Text style={styles.quickActionTitle}>Store Settings</Text>
          <Text style={styles.quickActionSub}>Delivery fee, policies & contact</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ----------------------------------------------------
// 2. ORDERS VIEW
// ----------------------------------------------------
function OrdersView() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const loadOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders/admin', { limit: 100 });
      setOrders(res?.data?.orders || []);
    } catch (e: any) {
      Alert.alert('Orders Error', e?.message || 'Could not fetch orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
      Alert.alert('Status Updated', `Order marked as ${newStatus}`);
    } catch (e: any) {
      Alert.alert('Update Failed', e?.response?.data?.message || e?.message);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'ALL') return true;
    return o.status === statusFilter;
  });

  return (
    <View style={styles.flex1}>
      {/* Status Filter Badges */}
      <View style={styles.filterScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
          {['ALL', 'PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
                {st}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.tabLoader}>
          <ActivityIndicator size="small" color="#0F1F3D" />
          <Text style={styles.tabLoaderText}>Fetching orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptySubtitle}>There are no orders matching this filter.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() => setSelectedOrder(item)}
              activeOpacity={0.7}
            >
              <View style={styles.orderCardHeader}>
                <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                  <Text style={styles.statusBadgeText}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.orderCustomer}>
                Customer: {item.user?.name || item.address?.fullName || 'Guest Customer'}
              </Text>
              <Text style={styles.orderMeta}>
                Items: {(item.items || []).length} • {new Date(item.createdAt).toLocaleDateString()}
              </Text>

              <View style={styles.orderFooter}>
                <Text style={styles.orderTotal}>{formatPkr(item.total)}</Text>
                <Text style={styles.viewDetailsHint}>View Details →</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Order Detail Modal */}
      <Modal visible={!!selectedOrder} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedOrder?.orderNumber}</Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Total & Payment</Text>
                <Text style={styles.modalValueHigh}>{formatPkr(selectedOrder?.total)}</Text>
                <Text style={styles.modalText}>
                  Method: {selectedOrder?.payment?.method || 'Cash on Delivery / Safepay'}
                </Text>
                <Text style={styles.modalText}>
                  Payment Status: {selectedOrder?.payment?.status || 'UNPAID'}
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Delivery Address</Text>
                <Text style={styles.modalText}>Recipient: {selectedOrder?.address?.fullName || selectedOrder?.user?.name}</Text>
                <Text style={styles.modalText}>Phone: {selectedOrder?.address?.phone || selectedOrder?.user?.phone || 'N/A'}</Text>
                <Text style={styles.modalText}>Address: {selectedOrder?.address?.address || 'N/A'}</Text>
                <Text style={styles.modalText}>City: {selectedOrder?.address?.city || ''} ({selectedOrder?.address?.province || ''})</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Order Items</Text>
                {(selectedOrder?.items || []).map((it: any, i: number) => (
                  <View key={i} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{it.product?.name || 'Fabric Item'}</Text>
                      <Text style={styles.itemSub}>
                        Qty: {it.quantity} {it.size ? `• Size: ${it.size}` : ''} {it.color ? `• Color: ${it.color}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.itemPrice}>{formatPkr(it.price * it.quantity)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Update Order Status</Text>
                <View style={styles.statusActionRow}>
                  {['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusBtn,
                        selectedOrder?.status === st && styles.statusBtnCurrent,
                      ]}
                      onPress={() => updateOrderStatus(selectedOrder.id, st)}
                    >
                      <Text
                        style={[
                          styles.statusBtnText,
                          selectedOrder?.status === st && styles.statusBtnTextCurrent,
                        ]}
                      >
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ----------------------------------------------------
// 3. PRODUCTS VIEW
// ----------------------------------------------------
function ProductsView() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New product form fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [category, setCategory] = useState('Unstitched');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get('/products', { limit: 100, sortBy: 'newest' });
      setProducts(res?.data?.products || []);
    } catch (e: any) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleCreateProduct = async () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert('Missing Fields', 'Product title and price are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        price: Number(price),
        stock: Number(stock || 0),
        category,
        description: description.trim() || 'Premium quality men fabrics collection.',
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
        stockStatus: Number(stock) > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
        productStatus: 'PUBLISHED',
      };
      await api.post('/products', payload);
      Alert.alert('Success', 'New product published successfully!');
      setShowAddModal(false);
      setName('');
      setPrice('');
      setDescription('');
      setImageUrl('');
      loadProducts();
    } catch (e: any) {
      Alert.alert('Failed', e?.response?.data?.message || e?.message || 'Could not save product.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.flex1}>
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search products by title or fabric category..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.addFab} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addFabText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.tabLoader}>
          <ActivityIndicator size="small" color="#0F1F3D" />
          <Text style={styles.tabLoaderText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProducts(); }} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <View style={styles.productInfo}>
                <Text style={styles.productTitle}>{item.name}</Text>
                <Text style={styles.productCategory}>{item.category} • {item.stockStatus}</Text>
                <Text style={styles.productPrice}>{formatPkr(item.price)}</Text>
              </View>
              <View style={styles.productStockBadge}>
                <Text style={styles.productStockText}>Stock: {item.stock ?? 'N/A'}</Text>
              </View>
            </View>
          )}
        />
      )}

      {/* Add Product Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Fabric Product</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Luxury Wash & Wear Suit"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Regular Price (PKR) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 4500"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Stock Quantity</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="10"
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={setStock}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryPickerRow}>
                  {['Unstitched', 'Stitched', 'Boski', 'Waistcoat'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catChoiceBtn,
                        category === cat && styles.catChoiceBtnActive,
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.catChoiceText,
                          category === cat && styles.catChoiceTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Image URL (Cloudinary / Direct)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="https://res.cloudinary.com/..."
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, { height: 80 }]}
                  placeholder="Fabric details, composition and styling instructions..."
                  multiline
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, saving && { opacity: 0.7 }]}
                onPress={handleCreateProduct}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Publish to Store</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ----------------------------------------------------
// 4. CUSTOMERS VIEW
// ----------------------------------------------------
function CustomersView() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get('/users/admin', { limit: 100 });
      setUsers(res?.data?.users || []);
    } catch (e: any) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <View style={styles.flex1}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Customer Directory</Text>
        <Text style={styles.sectionSubtitle}>Registered shoppers, phone contacts & history</Text>
      </View>

      {loading ? (
        <View style={styles.tabLoader}>
          <ActivityIndicator size="small" color="#0F1F3D" />
          <Text style={styles.tabLoaderText}>Fetching customers...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadUsers(); }} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.customerCard}>
              <View style={styles.customerAvatar}>
                <Text style={styles.customerAvatarText}>
                  {(item.name || item.email || 'U').slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.customerName}>{item.name || 'Anonymous Guest'}</Text>
                <Text style={styles.customerEmail}>{item.email}</Text>
                <Text style={styles.customerPhone}>Phone: {item.phone || 'None'}</Text>
              </View>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>{item.role}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

// ----------------------------------------------------
// 5. PAYMENTS VIEW
// ----------------------------------------------------
function PaymentsView() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPayments = useCallback(async () => {
    try {
      const res = await api.get('/admin/payments/pending');
      setPayments(res?.data?.payments || []);
    } catch (e: any) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const verifyPayment = async (id: string, approved: boolean) => {
    try {
      await api.post(`/admin/payments/${id}/verify`, { approved });
      Alert.alert('Decision Recorded', `Payment was ${approved ? 'approved' : 'rejected'}.`);
      loadPayments();
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not update payment.');
    }
  };

  return (
    <View style={styles.flex1}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Pending Payments Queue</Text>
        <Text style={styles.sectionSubtitle}>Safepay & Bank Transfer approvals</Text>
      </View>

      {loading ? (
        <View style={styles.tabLoader}>
          <ActivityIndicator size="small" color="#0F1F3D" />
          <Text style={styles.tabLoaderText}>Checking payments...</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPayments(); }} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyTitle}>Zero Pending Payments</Text>
              <Text style={styles.emptySubtitle}>All customer transactions have been resolved.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentOrder}>Order #{item.order?.orderNumber}</Text>
                <Text style={styles.paymentAmount}>{formatPkr(item.amount)}</Text>
              </View>
              <Text style={styles.paymentDetails}>
                Method: {item.method} • Customer: {item.order?.user?.name || 'Customer'}
              </Text>

              <View style={styles.paymentActions}>
                <TouchableOpacity
                  style={styles.paymentApproveBtn}
                  onPress={() => verifyPayment(item.id, true)}
                >
                  <Text style={styles.paymentApproveText}>✓ Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.paymentRejectBtn}
                  onPress={() => verifyPayment(item.id, false)}
                >
                  <Text style={styles.paymentRejectText}>✕ Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

// ----------------------------------------------------
// 6. STORE SETTINGS VIEW
// ----------------------------------------------------
function SettingsView({ onLogout }: { onLogout: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [standardFee, setStandardFee] = useState('250');
  const [freeThreshold, setFreeThreshold] = useState('10000');

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await api.get('/settings/store');
        const d = res?.data;
        if (d) {
          setWhatsapp(d.whatsappNumber || '');
          setPhone(d.phoneNumber || '');
          setStandardFee(String(d.standardDeliveryFee ?? 250));
          setFreeThreshold(String(d.freeDeliveryThreshold ?? 10000));
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/store', {
        whatsappNumber: whatsapp,
        phoneNumber: phone,
        standardDeliveryFee: Number(standardFee),
        freeDeliveryThreshold: Number(freeThreshold),
      });
      Alert.alert('Saved', 'Store operational policies updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update store settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.tabLoader}>
        <ActivityIndicator size="small" color="#0F1F3D" />
        <Text style={styles.tabLoaderText}>Loading store configurations...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabScrollView} contentContainerStyle={styles.tabScrollContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Store Configuration</Text>
        <Text style={styles.sectionSubtitle}>Manage delivery rules & customer communication lines</Text>
      </View>

      <View style={styles.cardSection}>
        <Text style={styles.cardSectionTitle}>Shipping Rates</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Standard Delivery Fee (PKR)</Text>
          <TextInput
            style={styles.textInput}
            value={standardFee}
            onChangeText={setStandardFee}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Free Delivery Order Threshold (PKR)</Text>
          <TextInput
            style={styles.textInput}
            value={freeThreshold}
            onChangeText={setFreeThreshold}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.cardSection}>
        <Text style={styles.cardSectionTitle}>Customer Care Lines</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>WhatsApp Support Number</Text>
          <TextInput
            style={styles.textInput}
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="+923001234567"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Outlet Phone Number</Text>
          <TextInput
            style={styles.textInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="+923001234567"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, saving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Save Configurations</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutDangerBtn} onPress={onLogout}>
        <Text style={styles.logoutDangerText}>Sign Out from Administrator Session</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'DELIVERED':
      return { backgroundColor: '#DEF7EC' };
    case 'SHIPPED':
      return { backgroundColor: '#FEF3C7' };
    case 'PAID':
      return { backgroundColor: '#E0E7FF' };
    case 'CANCELLED':
      return { backgroundColor: '#FDE8E8' };
    default:
      return { backgroundColor: '#F3F4F6' };
  }
}

// ----------------------------------------------------
// STYLES
// ----------------------------------------------------
const styles = StyleSheet.create({
  flex1: { flex: 1 },
  centerContainer: {
    flex: 1,
    backgroundColor: '#FAFAF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F1F3D',
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  authScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  authCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 3,
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoBadgeText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#0F1F3D',
  },
  adminChip: {
    backgroundColor: '#0F1F3D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  adminChipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },
  authSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  primaryButton: {
    backgroundColor: '#0F1F3D',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  configToggle: {
    marginTop: 18,
    alignItems: 'center',
  },
  configToggleText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  configBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  configLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 4,
  },
  configInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    marginBottom: 8,
  },
  configSaveBtn: {
    backgroundColor: '#374151',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  configSaveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // App Layout
  appContainer: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  topBar: {
    backgroundColor: '#0F1F3D',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  brandTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  brandTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  adminName: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  logoutIconButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutIconText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  mainContent: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.OS === 'ios' ? 14 : 6,
    paddingTop: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  tabItemActive: {
    // Active style
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#0F1F3D',
    fontWeight: '800',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 24,
    height: 3,
    backgroundColor: '#0F1F3D',
    borderRadius: 2,
  },
  tabLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLoaderText: {
    marginTop: 10,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  tabScrollView: {
    flex: 1,
  },
  tabScrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  metricValueLarge: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },
  metricHint: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  miniCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  miniCardValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  miniCardLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionBtn: {
    width: (Dimensions.get('window').width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  quickActionSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  // Orders
  filterScrollWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: '#0F1F3D',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#111827',
  },
  orderCustomer: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  orderMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F1F3D',
  },
  viewDetailsHint: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
    padding: 4,
  },
  modalScroll: {
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4B5563',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  modalValueHigh: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F1F3D',
    marginBottom: 4,
  },
  modalText: {
    fontSize: 13,
    color: '#374151',
    marginVertical: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  itemSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  statusActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  statusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  statusBtnCurrent: {
    backgroundColor: '#0F1F3D',
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  statusBtnTextCurrent: {
    color: '#FFFFFF',
  },

  // Products
  searchBarContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
  },
  addFab: {
    backgroundColor: '#0F1F3D',
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  productCategory: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F1F3D',
    marginTop: 4,
  },
  productStockBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  productStockText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChoiceBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  catChoiceBtnActive: {
    backgroundColor: '#0F1F3D',
  },
  catChoiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  catChoiceTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Customers
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F1F3D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  customerEmail: {
    fontSize: 11,
    color: '#6B7280',
  },
  customerPhone: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  roleTag: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3730A3',
  },

  // Payments
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentOrder: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#10B981',
  },
  paymentDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 12,
  },
  paymentActions: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentApproveBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  paymentApproveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  paymentRejectBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  paymentRejectText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },

  // Settings
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  logoutDangerBtn: {
    marginTop: 20,
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutDangerText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },

  // Empty view
  emptyView: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
