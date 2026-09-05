import React, { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext } from 'react';
import {
  Animated,
  useColorScheme,
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
  Image,
  Switch,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { api, safeStorage, DEFAULT_API_URL } from './src/api';

const BACKEND_BASE = 'https://topthreadz-d94j.vercel.app';

// ---------------------------------------------------------------------------
// THEME SYSTEM — Light / Dark pill design language
// ---------------------------------------------------------------------------
type ThemeMode = 'light' | 'dark';

interface ThemePalette {
  mode: ThemeMode;
  isDark: boolean;
  background: string;
  container: string;
  surface: string;
  field: string;
  chip: string;
  border: string;
  borderStrong: string;
  hairline: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  // Theme-invariant brand tokens
  navy: string;
  crimson: string;
  emeraldBg: string;
  emeraldText: string;
  amberBg: string;
  amberText: string;
  crimsonBg: string;
  crimsonText: string;
  infoBg: string;
  infoText: string;
  onPill: string;
}

const LIGHT_PALETTE: ThemePalette = {
  mode: 'light',
  isDark: false,
  background: '#EEF1F6',
  container: '#F8F9FB',
  surface: '#FFFFFF',
  field: '#F9FAFB',
  chip: '#F3F4F6',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  hairline: 'rgba(0, 0, 0, 0.05)',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  textFaint: '#9CA3AF',
  navy: '#0F1F3D',
  crimson: '#B91C2B',
  emeraldBg: '#DEF7EC',
  emeraldText: '#03543F',
  amberBg: '#FEF3C7',
  amberText: '#92400E',
  crimsonBg: '#FEE2E2',
  crimsonText: '#991B1B',
  infoBg: '#EFF6FF',
  infoText: '#1D4ED8',
  onPill: '#FFFFFF',
};

const DARK_PALETTE: ThemePalette = {
  mode: 'dark',
  isDark: true,
  background: '#070E1A',
  container: '#0A1120',
  surface: '#131C30',
  field: '#0D1526',
  chip: '#1B2941',
  border: '#2A3A55',
  borderStrong: '#3B4D6B',
  hairline: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#F3F4F6',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textFaint: '#718096',
  navy: '#0F1F3D',
  crimson: '#B91C2B',
  emeraldBg: 'rgba(16, 185, 129, 0.16)',
  emeraldText: '#6EE7B7',
  amberBg: 'rgba(245, 158, 11, 0.16)',
  amberText: '#FCD34D',
  crimsonBg: 'rgba(239, 68, 68, 0.16)',
  crimsonText: '#FCA5A5',
  infoBg: 'rgba(59, 130, 246, 0.16)',
  infoText: '#93C5FD',
  onPill: '#FFFFFF',
};

const ThemeContext = createContext<{
  palette: ThemePalette;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  themed: Record<string, object>;
}>({
  palette: LIGHT_PALETTE,
  mode: 'light',
  setMode: () => {},
  themed: {},
});

const useTheme = () => useContext(ThemeContext);

function resolveImageUrl(url?: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${BACKEND_BASE}${url}`;
  return `${BACKEND_BASE}/${url}`;
}

type Tab = 'dashboard' | 'orders' | 'products' | 'customers' | 'payments' | 'settings';

function formatPkr(amount?: number | string): string {
  const num = Number(amount || 0);
  return `PKR ${num.toLocaleString('en-PK')}`;
}

// ---------------------------------------------------------------------------
// PREMIUM SPLASH SCREEN — centered Top Threadz icon, seamless hand-off
// ---------------------------------------------------------------------------
function SplashScreen({ onDone }: { onDone: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => {
      setLeaving(true);
      Animated.timing(fadeAnim, { toValue: 0, duration: 450, useNativeDriver: true }).start(() => onDone());
    }, 1400);
    return () => clearTimeout(timer);
  }, [fadeAnim, logoScale, onDone]);

  return (
    <Animated.View style={[styles.splashRoot, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor={styles.splashRoot.backgroundColor} />
      <View style={styles.splashGlowOne} />
      <View style={styles.splashGlowTwo} />

      <Animated.View style={[styles.splashLogoRing, { transform: [{ scale: logoScale }] }]}>
        <Image
          source={require('./assets/logo-round.png')}
          style={styles.splashLogoImage}
          resizeMode="cover"
        />
      </Animated.View>
      <Text style={styles.splashWordmark}>TOP THREADZ</Text>
      <View style={styles.splashBadgePill}>
        <Text style={styles.splashBadgeText}>OPERATIONS CONSOLE</Text>
      </View>

      <View style={styles.splashDotsRow}>
        <View style={[styles.splashDot, styles.splashDotActive]} />
        <View style={[styles.splashDot, leaving && styles.splashDotActive]} />
        <View style={styles.splashDot} />
      </View>
    </Animated.View>
  );
}

function AdminMain() {
  const { palette } = useTheme();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [showApiConfig, setShowApiConfig] = useState(false);

  // Login background animations — slow corporate drift + breathing glow
  const authOrbAX = useRef(new Animated.Value(0)).current;
  const authOrbAY = useRef(new Animated.Value(0)).current;
  const authOrbBX = useRef(new Animated.Value(0)).current;
  const authOrbBY = useRef(new Animated.Value(0)).current;
  const authBreath = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const makeDrift = (ax: Animated.Value, ay: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ax, { toValue: 1, duration, useNativeDriver: true }),
            Animated.timing(ay, { toValue: 1, duration, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(ax, { toValue: 0, duration, useNativeDriver: true }),
            Animated.timing(ay, { toValue: 0, duration, useNativeDriver: true }),
          ]),
        ])
      );
    const loopA = makeDrift(authOrbAX, authOrbAY, 9000);
    const loopB = makeDrift(authOrbBX, authOrbBY, 11000);
    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(authBreath, { toValue: 0.85, duration: 4200, useNativeDriver: true }),
        Animated.timing(authBreath, { toValue: 0.4, duration: 4200, useNativeDriver: true }),
      ])
    );
    loopA.start();
    loopB.start();
    breathLoop.start();
    return () => {
      loopA.stop();
      loopB.stop();
      breathLoop.stop();
    };
  }, [authOrbAX, authOrbAY, authOrbBX, authOrbBY, authBreath]);


  // Initialize and check session
  useEffect(() => {
    async function boot() {
      api.init();
      setApiUrl(api.getBaseUrl());
      const token = api.getToken();
      if (token) {
        try {
          const res = await api.get('/auth/session');
          if (res?.data?.user && res.data.user.role === 'ADMIN') {
            setUser(res.data.user);
          } else {
            api.setToken(null);
          }
        } catch {
          api.setToken(null);
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
      // Backend returns: { success: true, data: { user, token, csrfToken } }
      const userData = res?.data?.user;
      const token = res?.data?.token;
      if (!userData) {
        Alert.alert('Login Error', 'Unexpected response from server. Please try again.');
        return;
      }
      if (userData?.role !== 'ADMIN') {
        Alert.alert('Access Denied', 'Your account does not have administrator privileges.');
        return;
      }
      if (token) {
        api.setToken(token);
      }
      setUser(userData);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Login failed. Check your credentials and network connection.';
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
          } catch { }
          api.setToken(null);
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
        <StatusBar barStyle="light-content" backgroundColor="#0A1428" />

        {/* Animated ambient background — corporate, subtle motion */}
        <Animated.View
          style={[
            styles.authAmbientOrbA,
            {
              transform: [
                { translateX: authOrbAX.interpolate({ inputRange: [0, 1], outputRange: [-40, 30] }) },
                { translateY: authOrbAY.interpolate({ inputRange: [0, 1], outputRange: [-20, 40] }) },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.authAmbientOrbB,
            {
              transform: [
                { translateX: authOrbBX.interpolate({ inputRange: [0, 1], outputRange: [30, -40] }) },
                { translateY: authOrbBY.interpolate({ inputRange: [0, 1], outputRange: [40, -20] }) },
              ],
            },
          ]}
        />
        <Animated.View style={[styles.authBreathingGlow, { opacity: authBreath }]} />

        <ScrollView contentContainerStyle={styles.authScroll}>
          {/* Prominently Centered Top Threadz Logo — long-press reveals hidden server config */}
          <View style={styles.loginLogoHeader}>
            <TouchableOpacity
              activeOpacity={0.9}
              delayLongPress={600}
              onLongPress={() => setShowApiConfig(!showApiConfig)}
              style={styles.loginLogoRingTouch}
            >
              <View style={styles.loginLogoRing}>
                <Image
                  source={require('./assets/logo-round.png')}
                  style={styles.loginLogoImage}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>
            <Text style={styles.loginBrandTitle}>TOP THREADZ</Text>
            <View style={styles.loginPillBadge}>
              <Text style={styles.loginPillBadgeText}>OPERATIONS CONSOLE</Text>
            </View>
          </View>

          {/* Liquid Glass Login Card */}
          <View style={styles.liquidGlassCard}>
            <Text style={styles.liquidGlassTitleCentered}>Welcome Back</Text>
            <Text style={styles.liquidGlassSubtitleCentered}>
              Sign in to manage catalog, orders & finances
            </Text>

            <View style={styles.liquidInputGroup}>
              <Text style={styles.liquidInputLabel}>Admin Email</Text>
              <TextInput
                style={styles.liquidPillInput}
                placeholder="admin@topthreadz.pk"
                placeholderTextColor="rgba(255,255,255,0.4)"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.liquidInputGroup}>
              <Text style={styles.liquidInputLabel}>Password</Text>
              <TextInput
                style={styles.liquidPillInput}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.4)"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.liquidPrimaryButton, loginLoading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loginLoading}
              activeOpacity={0.85}
            >
              {loginLoading ? (
                <ActivityIndicator color="#0F1F3D" />
              ) : (
                <Text style={styles.liquidPrimaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Hidden server configuration — revealed by long-pressing the logo */}
            {showApiConfig && (
              <View style={styles.liquidGlassSubbox}>
                <Text style={styles.liquidInputLabel}>API Base URL</Text>
                <TextInput
                  style={styles.liquidPillInputSmall}
                  value={apiUrl}
                  onChangeText={setApiUrl}
                  autoCapitalize="none"
                  placeholderTextColor="rgba(255,255,255,0.4)"
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
                <TouchableOpacity
                  style={styles.configHideToggle}
                  onPress={() => setShowApiConfig(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.configHideToggleText}>Hide configuration</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.appContainer, { backgroundColor: palette.background }]}>
      <StatusBar
        barStyle={palette.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={palette.isDark ? '#070E1A' : '#EEF1F6'}
      />

      {/* Ambient backdrop for glassmorphism depth */}
      <View style={[styles.appAmbientGlow1, palette.isDark && styles.appAmbientGlow1Dark]} />
      <View style={[styles.appAmbientGlow2, palette.isDark && styles.appAmbientGlow2Dark]} />

      {/* Floating Liquid Glass Top Header Bar */}
      <View style={styles.topBarWrapper}>
        <View style={styles.topBarGlassPill}>
          <View style={styles.brandRow}>
            <View style={styles.topBarLogoCircle}>
              <Image source={require('./assets/logo-round.png')} style={{ width: 28, height: 28, borderRadius: 14 }} />
            </View>
            <View style={{ marginLeft: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.brandTitle}>TOP THREADZ</Text>
                <View style={styles.brandTag}>
                  <Text style={styles.brandTagText}>ADMIN</Text>
                </View>
              </View>
              <Text style={styles.adminName}>
                {user.name || 'Admin'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutIconButton} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutIconText}>Logout</Text>
          </TouchableOpacity>
        </View>
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

      {/* Floating Liquid Glass Bottom Pill Navigation Bar */}
      <View style={styles.floatingNavWrapper}>
        <View style={styles.liquidGlassNavPill}>
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
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = safeStorage.getItem('topthreadz_theme_mode');
    if (saved === 'light' || saved === 'dark') return saved;
    return systemScheme === 'dark' ? 'dark' : 'light';
  });
  const [showSplash, setShowSplash] = useState(true);

  const changeMode = useCallback((m: ThemeMode) => {
    setMode(m);
    safeStorage.setItem('topthreadz_theme_mode', m);
  }, []);

  const palette = mode === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;
  const themed = useMemo(() => createThemedStyles(palette), [palette]);
  const themeValue = useMemo(
    () => ({ palette, mode, setMode: changeMode, themed }),
    [palette, mode, changeMode, themed]
  );

  return (
    <ThemeContext.Provider value={themeValue}>
      <SafeAreaProvider>
        {showSplash ? (
          <SplashScreen onDone={() => setShowSplash(false)} />
        ) : (
          <AdminMain />
        )}
      </SafeAreaProvider>
    </ThemeContext.Provider>
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
      style={[styles.tabItem, active && styles.tabItemActivePill]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ----------------------------------------------------
// 1. DASHBOARD VIEW
// ----------------------------------------------------
// ----------------------------------------------------
// 0. HERO BANNER UPLOAD & MANAGEMENT MODAL
// ----------------------------------------------------
function HeroBannerModal({
  visible,
  onClose,
  onUpdated,
}: {
  visible: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { themed } = useTheme();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<string>('');
  const [directUrl, setDirectUrl] = useState('');
  const [bannerText, setBannerText] = useState({
    heading: 'Shop Our Newest Collection',
    subheading: 'PREMIUM WASH & WEAR � SHOP OUR COLLECTION',
    buttonText: 'Shop Now',
    buttonLink: '/products',
  });

  const loadBannerData = useCallback(async () => {
    setLoading(true);
    try {
      const [bannerRes, textRes] = await Promise.all([
        api.get('/settings/hero-banner').catch(() => null),
        api.get('/settings/hero-banner-text').catch(() => null),
      ]);
      const bannerData = bannerRes?.data || bannerRes;
      if (bannerData?.url) {
        setCurrentBanner(bannerData.url);
      } else {
        setCurrentBanner('');
      }
      const textData = textRes?.data || textRes;
      if (textData) {
        setBannerText({
          heading: textData.heading || 'Shop Our Newest Collection',
          subheading: textData.subheading || 'PREMIUM WASH & WEAR • SHOP OUR COLLECTION',
          buttonText: textData.buttonText || 'Shop Now',
          buttonLink: textData.buttonLink || '/products',
        });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadBannerData();
    }
  }, [visible, loadBannerData]);

  const pickBannerImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please allow gallery access to upload a hero banner.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (res.canceled || !res.assets?.[0]) return;

    setUploading(true);
    try {
      const asset = res.assets[0];
      const formData = new FormData();
      const filename = asset.uri.split('/').pop() || 'banner.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      formData.append('image', { uri: asset.uri, name: filename, type } as any);

      const uploadRes = await api.postFormData('/settings/hero-banner', formData);
      const url = uploadRes?.data?.url || uploadRes?.url || uploadRes?.data;
      if (url) {
        setCurrentBanner(typeof url === 'string' ? url : url.url);
        Alert.alert('Banner Uploaded', 'Banner photo uploaded to Cloudinary successfully!');
      } else {
        Alert.alert('Notice', 'Image processed successfully!');
      }
    } catch (e: any) {
      Alert.alert('Upload Failed', e?.response?.data?.message || e?.message || 'Could not upload banner.');
    } finally {
      setUploading(false);
    }
  };

  const takeBannerPhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please allow camera access.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (res.canceled || !res.assets?.[0]) return;

    setUploading(true);
    try {
      const asset = res.assets[0];
      const formData = new FormData();
      const filename = asset.uri.split('/').pop() || 'camera-banner.jpg';
      formData.append('image', { uri: asset.uri, name: filename, type: 'image/jpeg' } as any);

      const uploadRes = await api.postFormData('/settings/hero-banner', formData);
      const url = uploadRes?.data?.url || uploadRes?.url;
      if (url) {
        setCurrentBanner(typeof url === 'string' ? url : url.url);
        Alert.alert('Photo Captured', 'Banner photo uploaded successfully!');
      }
    } catch (e: any) {
      Alert.alert('Camera Upload Failed', e?.message || 'Could not upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleApplyUrl = async () => {
    const url = directUrl.trim();
    if (!url) {
      Alert.alert('URL Required', 'Please paste a valid image URL.');
      return;
    }
    setUploading(true);
    try {
      await api.post('/settings/hero-banner', { url });
      setCurrentBanner(url);
      setDirectUrl('');
      Alert.alert('URL Applied', 'Banner URL set!');
    } catch {
      setCurrentBanner(url);
      setDirectUrl('');
      Alert.alert('URL Preview', 'Banner image URL applied.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveAndPublish = async () => {
    setSaving(true);
    try {
      await api.post('/settings/hero-banner-text', bannerText);
      Alert.alert('Success', 'Storefront hero banner & promotions published!');
      onUpdated();
      onClose();
    } catch (e: any) {
      Alert.alert('Save Failed', e?.response?.data?.message || e?.message || 'Failed to update banner text.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBanner = () => {
    Alert.alert('Remove Banner', 'Are you sure you want to remove the storefront hero banner?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete('/settings/hero-banner');
            setCurrentBanner('');
            Alert.alert('Removed', 'Hero banner removed from storefront.');
            onUpdated();
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Could not remove banner.');
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.bannerModalContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0F1F3D" />

        {/* Top Header */}
        <View style={styles.bannerModalHeader}>
          <TouchableOpacity style={styles.bannerModalCloseBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.bannerModalCloseText}>✕ Close</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.bannerModalTitle}>Homepage Hero Banner</Text>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>
              Storefront promotions & hero visual
            </Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        {loading ? (
          <View style={styles.tabLoader}>
            <ActivityIndicator size="small" color="#0F1F3D" />
            <Text style={[styles.tabLoaderText, themed.tabLoaderText]}>Loading banner details...</Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Live Preview Card */}
            <View style={styles.bannerSectionCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={styles.bannerSectionCardTitle}>Interactive Store Preview</Text>
                <View style={styles.heroBannerLiveBadge}>
                  <Text style={styles.heroBannerLiveText}>
                    {currentBanner ? '● LIVE PREVIEW' : '⚪ NO IMAGE'}
                  </Text>
                </View>
              </View>

              <View style={styles.bannerPreviewBox}>
                {currentBanner ? (
                  <Image
                    source={{ uri: resolveImageUrl(currentBanner) }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1F3D' }}>
                    <Text style={{ fontSize: 36, marginBottom: 4 }}>🖼️</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>No banner image uploaded</Text>
                  </View>
                )}

                {/* Overlaid Banner Text Mockup */}
                <View style={styles.bannerPreviewOverlay}>
                  <View style={styles.bannerSubheadingPill}>
                    <Text style={styles.bannerSubheadingText}>
                      {bannerText.subheading || 'PREMIUM COLLECTION'}
                    </Text>
                  </View>
                  <Text style={styles.bannerHeadingText} numberOfLines={2}>
                    {bannerText.heading || 'Shop Our Newest Collection'}
                  </Text>
                  <View style={styles.bannerCtaPill}>
                    <Text style={styles.bannerCtaText}>{bannerText.buttonText || 'Shop Now'} →</Text>
                  </View>
                </View>
              </View>

              <Text style={{ fontSize: 11, color: '#6B7280', textAlign: 'center' }}>
                Recommended dimensions: 1920 × 800 px (or 16:9 ratio) • Full width responsive
              </Text>
            </View>

            {/* Upload / Source Section */}
            <View style={styles.bannerSectionCard}>
              <Text style={styles.bannerSectionCardTitle}>Banner Photography</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>
                Upload high-definition banner photo from your mobile device or paste an external URL.
              </Text>

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <TouchableOpacity
                  style={styles.bigPhotoUploadTile}
                  onPress={pickBannerImage}
                  disabled={uploading}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 32, marginBottom: 6 }}>🖼️</Text>
                  <Text style={styles.bigPhotoTileTitle}>Choose Gallery</Text>
                  <Text style={styles.bigPhotoTileSub}>Select 16:9 photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bigPhotoUploadTile}
                  onPress={takeBannerPhoto}
                  disabled={uploading}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 32, marginBottom: 6 }}>📸</Text>
                  <Text style={styles.bigPhotoTileTitle}>Camera Snap</Text>
                  <Text style={styles.bigPhotoTileSub}>Instant banner photo</Text>
                </TouchableOpacity>
              </View>

              {uploading && (
                <View style={styles.uploadingNoticeBox}>
                  <ActivityIndicator size="small" color="#0F1F3D" />
                  <Text style={styles.uploadingNoticeText}>Optimizing & uploading banner to Cloudinary...</Text>
                </View>
              )}

              {/* Direct URL input */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <TextInput
                  style={[styles.liquidPillInputDark, { flex: 1 }]}
                  placeholder="Or paste direct image URL (https://...)"
                  placeholderTextColor="#9CA3AF"
                  value={directUrl}
                  onChangeText={setDirectUrl}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.addPillMiniBtn} onPress={handleApplyUrl} activeOpacity={0.8}>
                  <Text style={styles.addPillMiniBtnText}>Set URL</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Customization Text Inputs */}
            <View style={styles.bannerSectionCard}>
              <Text style={styles.bannerSectionCardTitle}>Banner Text & Call-To-Action</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Main Headline</Text>
                <TextInput
                  style={styles.liquidPillInputDark}
                  placeholder="e.g. Shop Our Newest Collection"
                  placeholderTextColor="#9CA3AF"
                  value={bannerText.heading}
                  onChangeText={(v) => setBannerText((prev) => ({ ...prev, heading: v }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subheading / Eyebrow Badge</Text>
                <TextInput
                  style={styles.liquidPillInputDark}
                  placeholder="e.g. PREMIUM WASH & WEAR • SHOP OUR COLLECTION"
                  placeholderTextColor="#9CA3AF"
                  value={bannerText.subheading}
                  onChangeText={(v) => setBannerText((prev) => ({ ...prev, subheading: v }))}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Button Label</Text>
                  <TextInput
                    style={styles.liquidPillInputDark}
                    placeholder="Shop Now"
                    placeholderTextColor="#9CA3AF"
                    value={bannerText.buttonText}
                    onChangeText={(v) => setBannerText((prev) => ({ ...prev, buttonText: v }))}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Button Link</Text>
                  <TextInput
                    style={styles.liquidPillInputDark}
                    placeholder="/products"
                    placeholderTextColor="#9CA3AF"
                    value={bannerText.buttonLink}
                    onChangeText={(v) => setBannerText((prev) => ({ ...prev, buttonLink: v }))}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Sticky Bottom Actions */}
        <View style={styles.oneUiStickyBottomBar}>
          {currentBanner ? (
            <TouchableOpacity style={styles.heroBannerModalRemoveBtn} onPress={handleRemoveBanner} activeOpacity={0.8}>
              <Text style={styles.heroBannerModalRemoveText}>🗑️ Remove</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.stepperPublishBtn, saving && { opacity: 0.7 }]}
            onPress={handleSaveAndPublish}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.stepperPublishBtnText}>✓ Save & Publish Banner</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ----------------------------------------------------
// 1. DASHBOARD VIEW (Ultra-Rounded Corners & Liquid Glass)
// ----------------------------------------------------
function DashboardView({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const { themed } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [heroBanner, setHeroBanner] = useState<string | null>(null);
  const [heroText, setHeroText] = useState<any>(null);
  const [showBannerModal, setShowBannerModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [dashRes, bannerRes, textRes] = await Promise.all([
        api.get('/admin/dashboard').catch(() => null),
        api.get('/settings/hero-banner').catch(() => null),
        api.get('/settings/hero-banner-text').catch(() => null),
      ]);
      setData(dashRes?.data || null);
      const bData = bannerRes?.data || bannerRes;
      if (bData?.url) {
        setHeroBanner(bData.url);
      } else {
        setHeroBanner(null);
      }
      setHeroText(textRes?.data || textRes || null);
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
        <Text style={[styles.tabLoaderText, themed.tabLoaderText]}>Loading Dashboard metrics...</Text>
      </View>
    );
  }

  const s = data || {};

  return (
    <ScrollView
      style={styles.tabScrollView}
      contentContainerStyle={[styles.tabScrollContent, { paddingBottom: 110 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Welcome & System Pill Header */}
      <View style={[styles.dashboardWelcomeCard, themed.dashboardWelcomeCard]}>
        <View style={{ flex: 1 }}>
          <View style={styles.systemOnlinePill}>
            <Text style={styles.systemOnlineText}>● SYSTEM ONLINE</Text>
          </View>
          <Text style={[styles.dashboardWelcomeTitle, themed.dashboardWelcomeTitle]}>Overview Dashboard</Text>
          <Text style={[styles.dashboardWelcomeSub, themed.dashboardWelcomeSub]}>Real-time sales, order fulfillment & promotional banners</Text>
        </View>
      </View>

      {/* Revenue Highlights with Ultra-Rounded Corners */}
      <View style={styles.metricGrid}>
        <View style={[styles.metricCardRounded, themed.metricCardRounded]}>
          <View style={styles.metricBadgeRow}>
            <View style={styles.metricEmeraldPill}>
              <Text style={styles.metricEmeraldPillText}>● LIFETIME</Text>
            </View>
          </View>
          <Text style={[styles.metricLabel, themed.metricLabel]}>Total Revenue</Text>
          <Text style={[styles.metricValueLarge, themed.metricValueLarge]}>{formatPkr(s.totalRevenue)}</Text>
          <Text style={styles.metricHint}>All completed sales</Text>
        </View>

        <View style={[styles.metricCardRounded, themed.metricCardRounded]}>
          <View style={styles.metricBadgeRow}>
            <View style={styles.metricCrimsonPill}>
              <Text style={styles.metricCrimsonPillText}>● TODAY</Text>
            </View>
          </View>
          <Text style={[styles.metricLabel, themed.metricLabel]}>Today Revenue</Text>
          <Text style={[styles.metricValueLarge, themed.metricValueLarge]}>{formatPkr(s.dailyRevenue)}</Text>
          <Text style={styles.metricHint}>Today's captured payments</Text>
        </View>
      </View>

      {/* 4 Mini KPI Cards */}
      <View style={styles.metricRow}>
        <View style={[styles.miniCardRounded, themed.miniCardRounded]}>
          <Text style={[styles.miniCardValue, themed.miniCardValue]}>{s.totalOrders || 0}</Text>
          <Text style={[styles.miniCardLabel, themed.miniCardLabel]}>Orders</Text>
        </View>
        <View style={[styles.miniCardRounded, themed.miniCardRounded]}>
          <Text style={[styles.miniCardValue, { color: '#B91C2B' }]}>{s.pendingOrders || 0}</Text>
          <Text style={[styles.miniCardLabel, themed.miniCardLabel]}>Pending</Text>
        </View>
        <View style={[styles.miniCardRounded, themed.miniCardRounded]}>
          <Text style={[styles.miniCardValue, themed.miniCardValue]}>{s.totalProducts || 0}</Text>
          <Text style={[styles.miniCardLabel, themed.miniCardLabel]}>Products</Text>
        </View>
        <View style={[styles.miniCardRounded, themed.miniCardRounded]}>
          <Text style={[styles.miniCardValue, themed.miniCardValue]}>{s.totalUsers || 0}</Text>
          <Text style={[styles.miniCardLabel, themed.miniCardLabel]}>Customers</Text>
        </View>
      </View>

      {/* Storefront Hero Banner Widget Card (Rounded Corners & Liquid Glass) */}
      <View style={[styles.heroBannerCard, themed.heroBannerCard]}>
        <View style={styles.heroBannerHeader}>
          <View>
            <Text style={[styles.heroBannerTitle, themed.heroBannerTitle]}>Homepage Hero Banner</Text>
            <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>Storefront promotional visual & header</Text>
          </View>
          <View style={heroBanner ? styles.heroBannerLiveBadge : styles.heroBannerInactiveBadge}>
            <Text style={heroBanner ? styles.heroBannerLiveText : styles.heroBannerInactiveText}>
              {heroBanner ? '● LIVE' : '⚪ NOT SET'}
            </Text>
          </View>
        </View>

        {heroBanner ? (
          <View>
            <View style={styles.heroBannerImgWrapper}>
              <Image
                source={{ uri: resolveImageUrl(heroBanner) }}
                style={styles.heroBannerImg}
                resizeMode="cover"
              />
              <View style={styles.heroBannerOverlay}>
                <View style={styles.heroBannerHeadlinePill}>
                  <Text style={styles.heroBannerHeadlineText} numberOfLines={1}>
                    {heroText?.heading || 'Shop Our Newest Collection'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.heroBannerActionRow}>
              <TouchableOpacity
                style={styles.heroBannerChangeBtn}
                onPress={() => setShowBannerModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.heroBannerChangeBtnText}>📸 Change / Edit Banner</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heroBannerRemoveBtn}
                onPress={async () => {
                  Alert.alert('Remove Banner', 'Are you sure you want to remove the storefront banner?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await api.delete('/settings/hero-banner');
                          setHeroBanner(null);
                          Alert.alert('Removed', 'Hero banner removed from store.');
                        } catch (err: any) {
                          Alert.alert('Error', err?.message || 'Could not remove banner.');
                        }
                      },
                    },
                  ]);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.heroBannerRemoveBtnText}>🗑️ Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.heroBannerEmptyBox}>
            <Text style={{ fontSize: 32 }}>🖼️</Text>
            <Text style={styles.heroBannerEmptyTitle}>No Hero Banner Configured</Text>
            <Text style={styles.heroBannerEmptySub}>
              Attract storefront visitors with high-resolution fabric photography & seasonal announcements.
            </Text>
            <TouchableOpacity
              style={styles.heroBannerUploadBtn}
              onPress={() => setShowBannerModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.heroBannerUploadBtnText}>+ Upload Hero Banner</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Management Shortcuts with Large Rounded Corners */}
      <Text style={[styles.sectionTitle, { marginTop: 10, marginBottom: 12 }]}>Quick Management</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity style={[styles.quickActionBtnRounded, themed.quickActionBtnRounded]} onPress={() => onNavigate('orders')} activeOpacity={0.8}>
          <Text style={styles.quickActionIcon}>📦</Text>
          <Text style={[styles.quickActionTitle, themed.quickActionTitle]}>Manage Orders</Text>
          <Text style={[styles.quickActionSub, themed.quickActionSub]}>Inspect & update statuses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickActionBtnRounded, themed.quickActionBtnRounded]} onPress={() => onNavigate('products')} activeOpacity={0.8}>
          <Text style={styles.quickActionIcon}>👔</Text>
          <Text style={[styles.quickActionTitle, themed.quickActionTitle]}>Add Product</Text>
          <Text style={[styles.quickActionSub, themed.quickActionSub]}>Catalog, stock & photos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickActionBtnRounded, themed.quickActionBtnRounded]} onPress={() => setShowBannerModal(true)} activeOpacity={0.8}>
          <Text style={styles.quickActionIcon}>🎨</Text>
          <Text style={[styles.quickActionTitle, themed.quickActionTitle]}>Hero Banner</Text>
          <Text style={[styles.quickActionSub, themed.quickActionSub]}>Upload & customize visual</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickActionBtnRounded, themed.quickActionBtnRounded]} onPress={() => onNavigate('payments')} activeOpacity={0.8}>
          <Text style={styles.quickActionIcon}>💳</Text>
          <Text style={[styles.quickActionTitle, themed.quickActionTitle]}>Review Payments</Text>
          <Text style={[styles.quickActionSub, themed.quickActionSub]}>Approve or reject queue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickActionBtnRounded, themed.quickActionBtnRounded]} onPress={() => onNavigate('settings')} activeOpacity={0.8}>
          <Text style={styles.quickActionIcon}>⚙️</Text>
          <Text style={[styles.quickActionTitle, themed.quickActionTitle]}>Store Settings</Text>
          <Text style={[styles.quickActionSub, themed.quickActionSub]}>Delivery fee & support</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Banner Modal */}
      <HeroBannerModal
        visible={showBannerModal}
        onClose={() => setShowBannerModal(false)}
        onUpdated={loadData}
      />
    </ScrollView>
  );
}

// ----------------------------------------------------
// 2. ORDERS VIEW
// ----------------------------------------------------
function OrdersView() {
  const { themed } = useTheme();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const loadOrders = useCallback(async () => {
    try {
      const res = await api.get('/admin/orders');
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
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
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

  const deleteOrder = (orderId: string, orderNumber: string) => {
    Alert.alert(
      'Delete Order',
      `Permanently delete order #${orderNumber}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/orders/${orderId}`);
              setOrders((prev) => prev.filter((o) => o.id !== orderId));
              if (selectedOrder?.id === orderId) {
                setSelectedOrder(null);
              }
              Alert.alert('Order Deleted', `Order #${orderNumber} has been permanently deleted.`);
            } catch (e: any) {
              Alert.alert('Delete Failed', e?.response?.data?.message || e?.message || 'Could not delete order.');
            }
          },
        },
      ]
    );
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
          <Text style={[styles.tabLoaderText, themed.tabLoaderText]}>Fetching orders...</Text>
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
              style={[styles.orderCard, themed.orderCard]}
              onPress={() => setSelectedOrder(item)}
              activeOpacity={0.7}
            >
              <View style={styles.orderCardHeader}>
                <Text style={[styles.orderNumber, themed.orderNumber]}>{item.orderNumber}</Text>
                <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                  <Text style={styles.statusBadgeText}>{item.status}</Text>
                </View>
              </View>

              <Text style={[styles.orderCustomer, themed.orderCustomer]}>
                Customer: {item.user?.name || item.address?.fullName || 'Guest Customer'}
              </Text>
              <Text style={[styles.orderMeta, themed.orderMeta]}>
                Items: {(item.items || []).length} • {new Date(item.createdAt).toLocaleDateString()}
              </Text>

              <View style={styles.orderFooter}>
                <Text style={[styles.orderTotal, themed.orderTotal]}>{formatPkr(item.total)}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    style={styles.orderDeleteMiniPill}
                    onPress={() => deleteOrder(item.id, item.orderNumber)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.orderDeleteMiniPillText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                  <Text style={styles.viewDetailsHint}>View →</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Order Detail Modal */}
      <Modal visible={!!selectedOrder} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, themed.modalSheet]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, themed.modalTitle]}>{selectedOrder?.orderNumber}</Text>
                <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                  {selectedOrder ? new Date(selectedOrder.createdAt).toLocaleString() : ''}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  style={styles.orderDeleteMiniPill}
                  onPress={() => deleteOrder(selectedOrder.id, selectedOrder.orderNumber)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.orderDeleteMiniPillText}>🗑️ Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.modalCloseCircle}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={[styles.modalSection, themed.modalSection]}>
                <Text style={[styles.modalSectionTitle, themed.modalSectionTitle]}>Total & Payment</Text>
                <Text style={styles.modalValueHigh}>{formatPkr(selectedOrder?.total)}</Text>
                <Text style={styles.modalText}>
                  Method: {selectedOrder?.payment?.method || 'Cash on Delivery / Safepay'}
                </Text>
                <Text style={styles.modalText}>
                  Payment Status: {selectedOrder?.payment?.status || 'UNPAID'}
                </Text>
              </View>

              <View style={[styles.modalSection, themed.modalSection]}>
                <Text style={[styles.modalSectionTitle, themed.modalSectionTitle]}>Delivery Address</Text>
                <Text style={styles.modalText}>Recipient: {selectedOrder?.address?.fullName || selectedOrder?.user?.name}</Text>
                <Text style={styles.modalText}>Phone: {selectedOrder?.address?.phone || selectedOrder?.user?.phone || 'N/A'}</Text>
                <Text style={styles.modalText}>Address: {selectedOrder?.address?.address || 'N/A'}</Text>
                <Text style={styles.modalText}>City: {selectedOrder?.address?.city || ''} ({selectedOrder?.address?.province || ''})</Text>
              </View>

              <View style={[styles.modalSection, themed.modalSection]}>
                <Text style={[styles.modalSectionTitle, themed.modalSectionTitle]}>Order Items ({(selectedOrder?.items || []).length})</Text>
                {(selectedOrder?.items || []).map((it: any, i: number) => {
                  const itemImg = it.product?.images?.[0] ? resolveImageUrl(it.product.images[0]) : '';
                  return (
                    <View key={i} style={[styles.itemRow, { alignItems: 'center', gap: 10 }]}>
                      {itemImg ? (
                        <Image source={{ uri: itemImg }} style={{ width: 44, height: 50, borderRadius: 6, backgroundColor: '#E5E7EB' }} />
                      ) : (
                        <View style={{ width: 44, height: 50, borderRadius: 6, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ fontSize: 10, color: '#9CA3AF' }}>No img</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName} numberOfLines={1}>{it.product?.name || 'Fabric Item'}</Text>
                        <Text style={styles.itemSub}>
                          Qty: {it.quantity} {it.size ? `• Size: ${it.size}` : ''} {it.color ? `• Color: ${it.color}` : ''}
                        </Text>
                      </View>
                      <Text style={styles.itemPrice}>{formatPkr(it.price * it.quantity)}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={[styles.modalSection, themed.modalSection]}>
                <Text style={[styles.modalSectionTitle, themed.modalSectionTitle]}>Update Order Status</Text>
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
// 3. PRODUCTS VIEW (SAMSUNG ONE UI 8.5 + LIQUID GLASS)
const WIZARD_STEPS = [
  { key: 1, title: 'Basics & Photos', icon: '📸' },
  { key: 2, title: 'Catalog & Variants', icon: '⚙️' },
  { key: 3, title: 'Review & Merchandising', icon: '✓' },
];

const COLOR_PRESETS = [
  { label: 'White', value: 'White', hex: '#FFFFFF' },
  { label: 'Black', value: 'Black', hex: '#111111' },
  { label: 'Navy', value: 'Navy Blue', hex: '#1E3A5F' },
  { label: 'Maroon', value: 'Maroon', hex: '#800000' },
  { label: 'Beige', value: 'Beige', hex: '#F5F0E8' },
  { label: 'Green', value: 'Bottle Green', hex: '#1A4731' },
  { label: 'Gray', value: 'Charcoal', hex: '#9CA3AF' },
  { label: 'Brown', value: 'Camel Brown', hex: '#B45309' },
];

const CATEGORY_OPTIONS = ['Unstitched', 'Stitched', 'Two Piece', 'Three Piece'];

const COLLECTION_OPTIONS = ['All Season', 'Summer Collection', 'Winter Collection'];

const BRAND_OPTIONS = ['Top Threadz'];

const LETTER_SIZES: string[] = ['S', 'M', 'L', 'XL', 'XXL'];
const KIDS_SIZES: string[] = ['2-3Y', '3-4Y', '4-5Y', '5-6Y', '6-7Y', '7-8Y', '8-9Y', '9-10Y', '10-11Y', '11-12Y', '12-13Y', '13-14Y'];
const UNSTITCHED_SIZES: string[] = ['Standard'];
const STITCHED_SIZES: string[] = LETTER_SIZES;
const TWO_PIECE_SIZES: string[] = LETTER_SIZES;
const THREE_PIECE_SIZES: string[] = LETTER_SIZES;

function categorySizes(category: string): string[] {
  if (/unstitched/i.test(category)) return UNSTITCHED_SIZES;
  if (/two\s*piece|2\s*piece/i.test(category)) return TWO_PIECE_SIZES;
  if (/three\s*piece|3\s*piece/i.test(category)) return THREE_PIECE_SIZES;
  if (/kid|child|boy/i.test(category)) return KIDS_SIZES;
  return STITCHED_SIZES;
}

function ProductsView() {
  const { themed } = useTheme();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Samsung Gallery One UI 9: Detail sheet state
  const [selectedProductDetail, setSelectedProductDetail] = useState<any | null>(null);
  const [detailActivePhotoIdx, setDetailActivePhotoIdx] = useState(0);

  // Stepper State (Samsung One UI 9: 3 Pages)
  const [currentStep, setCurrentStep] = useState(1);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Unstitched');
  const [subcategory, setSubcategory] = useState('Traditional');
  const [brand, setBrand] = useState('Top Threadz');
  const [collection, setCollection] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [stock, setStock] = useState('10');
  const [stockStatus, setStockStatus] = useState('IN_STOCK');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [sizesText, setSizesText] = useState('Standard');
  const [colorsText, setColorsText] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [featured, setFeatured] = useState(false);
  const [trending, setTrending] = useState(false);
  const [productStatus, setProductStatus] = useState('PUBLISHED');
  const [images, setImages] = useState<string[]>([]);

  const [directUrl, setDirectUrl] = useState('');
  const [customColor, setCustomColor] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  // Session-only taxonomy options appended via "+ Add" pills (not persisted)
  const [extraCategories, setExtraCategories] = useState<string[]>([]);
  const [extraCollections, setExtraCollections] = useState<string[]>([]);
  const [extraBrands, setExtraBrands] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newCollection, setNewCollection] = useState('');
  const [newBrand, setNewBrand] = useState('');

  // Standalone Search Category component (filters chips across all pillars)
  const [taxonomySearch, setTaxonomySearch] = useState('');
  const taxonomyQuery = taxonomySearch.trim().toLowerCase();
  const matchTaxonomy = (label: string) => !taxonomyQuery || label.toLowerCase().includes(taxonomyQuery);

  const categoryPills = Array.from(new Set([
    ...CATEGORY_OPTIONS,
    ...extraCategories,
    ...(category && !CATEGORY_OPTIONS.includes(category) ? [category] : []),
  ]));
  const collectionPills = Array.from(new Set([
    ...COLLECTION_OPTIONS,
    ...extraCollections,
    ...(collection && !COLLECTION_OPTIONS.includes(collection) ? [collection] : []),
  ]));
  const brandPills = Array.from(new Set([
    ...BRAND_OPTIONS,
    ...extraBrands,
    ...(brand && !BRAND_OPTIONS.includes(brand) ? [brand] : []),
  ]));

  const addSessionCategory = () => {
    const value = newCategory.trim();
    if (!value) return;
    setExtraCategories((prev) => Array.from(new Set([...prev, value])));
    setCategory(value);
    setSizesText(categorySizes(value).join(', '));
    setNewCategory('');
  };

  const addSessionCollection = () => {
    const value = newCollection.trim();
    if (!value) return;
    setExtraCollections((prev) => Array.from(new Set([...prev, value])));
    setCollection(value);
    setNewCollection('');
  };

  const addSessionBrand = () => {
    const value = newBrand.trim();
    if (!value) return;
    setExtraBrands((prev) => Array.from(new Set([...prev, value])));
    setBrand(value);
    setNewBrand('');
  };

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

  const resetForm = () => {
    setEditingProduct(null);
    setCurrentStep(1);
    setName('');
    setCategory('Unstitched');
    setSubcategory('Traditional');
    setBrand('Top Threadz');
    setCollection('');
    setPrice('');
    setDiscount('0');
    setStock('10');
    setStockStatus('IN_STOCK');
    setLowStockThreshold('5');
    setSku('');
    setDescription('');
    setCareInstructions('');
    setSizesText('Standard');
    setColorsText('');
    setTagsText('');
    setFeatured(false);
    setTrending(false);
    setProductStatus('PUBLISHED');
    setImages([]);
    setDirectUrl('');
    setCustomColor('');
  };

  const openEditModal = (p: any) => {
    setEditingProduct(p);
    setCurrentStep(1);
    setName(p.name || '');
    setCategory(p.category || 'Unstitched');
    setSubcategory(p.subcategory || 'Traditional');
    setBrand(p.brand || 'Top Threadz');
    setCollection(p.collection || '');
    setPrice(String(p.price ?? ''));
    setDiscount(String(p.discount ?? 0));
    setStock(String(p.stock ?? 0));
    setStockStatus(p.stockStatus || 'IN_STOCK');
    setLowStockThreshold(String(p.lowStockThreshold ?? 5));
    setSku(p.sku || '');
    setDescription(p.description || '');
    setCareInstructions(p.careInstructions || '');
    setSizesText(Array.isArray(p.sizes) ? p.sizes.join(', ') : (p.sizes || ''));
    setColorsText(Array.isArray(p.colors) ? p.colors.join(', ') : (p.colors || ''));
    setTagsText(Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''));
    setFeatured(Boolean(p.featured));
    setTrending(Boolean(p.trending));
    setProductStatus(p.productStatus || 'PUBLISHED');
    setImages(Array.isArray(p.images) ? p.images : []);
    setShowFormModal(true);
  };

  const askAddAnotherPhoto = () => {
    Alert.alert(
      'Photo Uploaded!',
      'Want to add another photo for this fabric listing?',
      [
        { text: 'Yes, Add Another', onPress: () => promptPhotoSource() },
        { text: 'No, Continue', style: 'cancel' },
      ]
    );
  };

  const pickImagesWithFollowup = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please allow gallery access to pick images.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (res.canceled || !res.assets || res.assets.length === 0) return;

    setUploadingImage(true);
    try {
      const uploaded: string[] = [];
      for (const asset of res.assets) {
        const formData = new FormData();
        const filename = asset.uri.split('/').pop() || 'photo.jpg';
        const type = 'image/jpeg';
        formData.append('images', { uri: asset.uri, name: filename, type } as any);
        const uploadRes = await api.postFormData('/products/upload-images', formData);
        const imgs: any[] = uploadRes?.data?.images || [];
        imgs.forEach((im) => { if (im.url) uploaded.push(im.url); });
      }
      if (uploaded.length > 0) {
        setImages((prev) => [...prev, ...uploaded]);
        askAddAnotherPhoto();
      }
    } catch (e: any) {
      Alert.alert('Upload Failed', e?.response?.data?.error || e?.message || 'Failed to upload photo.');
    } finally {
      setUploadingImage(false);
    }
  };

  const takePhotoWithFollowup = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please allow camera access.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (res.canceled || !res.assets || res.assets.length === 0) return;

    setUploadingImage(true);
    try {
      const asset = res.assets[0];
      const formData = new FormData();
      const filename = asset.uri.split('/').pop() || 'camera.jpg';
      formData.append('images', { uri: asset.uri, name: filename, type: 'image/jpeg' } as any);
      const uploadRes = await api.postFormData('/products/upload-images', formData);
      const imgs: any[] = uploadRes?.data?.images || [];
      const newUrls = imgs.map((i) => i.url).filter(Boolean);
      if (newUrls.length > 0) {
        setImages((prev) => [...prev, ...newUrls]);
        askAddAnotherPhoto();
      }
    } catch (e: any) {
      Alert.alert('Camera Upload Failed', e?.message || 'Failed to upload photo.');
    } finally {
      setUploadingImage(false);
    }
  };

  const promptPhotoSource = () => {
    Alert.alert(
      'Product Photo',
      'Choose image source for fabric presentation:',
      [
        { text: '🖼️ Choose from Gallery', onPress: () => pickImagesWithFollowup() },
        { text: '📸 Take a Photo', onPress: () => takePhotoWithFollowup() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const setCoverImage = (idx: number) => {
    if (idx === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const selected = copy.splice(idx, 1)[0];
      return [selected, ...copy];
    });
  };

  const handleSaveProduct = async () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert('Missing Fields', 'Product title and price are required.');
      if (!name.trim()) setCurrentStep(1);
      else setCurrentStep(2);
      return;
    }
    if (images.length === 0) {
      Alert.alert('Photo Required', 'Please add at least one product photo.');
      setCurrentStep(1);
      return;
    }
    setSaving(true);
    try {
      const regPrice = Number(price);
      const disc = Number(discount || 0);
      const currentSizes = sizesText.split(',').map((s) => s.trim()).filter(Boolean);
      const currentColors = colorsText.split(',').map((c) => c.trim()).filter(Boolean);
      const currentTags = tagsText.split(',').map((t) => t.trim()).filter(Boolean);

      const payload = {
        name: name.trim(),
        price: regPrice,
        discount: disc,
        stock: Number(stock || 0),
        category,
        subcategory: subcategory || undefined,
        brand: brand || 'Top Threadz',
        collection: collection || undefined,
        sku: sku.trim() || undefined,
        stockStatus,
        lowStockThreshold: Number(lowStockThreshold || 5),
        description: description.trim() || 'Premium quality men unstitched collection.',
        careInstructions: careInstructions.trim() || undefined,
        sizes: currentSizes.length > 0 ? currentSizes : categorySizes(category),
        colors: currentColors,
        tags: currentTags,
        images,
        featured,
        trending,
        productStatus,
        gender: 'MALE',
        visibility: 'PUBLIC',
      };

      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, payload);
        Alert.alert('Updated', `"${name}" updated successfully!`);
      } else {
        await api.post('/products', payload);
        Alert.alert('Success', `"${name}" published to store!`);
      }
      setShowFormModal(false);
      resetForm();
      loadProducts();
    } catch (e: any) {
      Alert.alert('Save Failed', e?.response?.data?.message || e?.message || 'Could not save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = (p: any) => {
    Alert.alert('Delete Product', `Permanently remove "${p.name}" from store catalog?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/products/${p.id}`);
            setProducts((prev) => prev.filter((x) => x.id !== p.id));
            if (selectedProductDetail?.id === p.id) {
              setSelectedProductDetail(null);
            }
            Alert.alert('Deleted', 'Product removed from catalog.');
          } catch (e: any) {
            const friendly =
              e?.response?.data?.error ||
              e?.response?.data?.message ||
              e?.message ||
              'Could not delete product.';
            Alert.alert(
              Number(e?.response?.status) === 409 ? 'Cannot Delete Product' : 'Delete Failed',
              friendly
            );
          }
        },
      },
    ]);
  };

  const toggleSize = (sz: string) => {
    const list = sizesText.split(',').map((s) => s.trim()).filter(Boolean);
    const next = list.includes(sz) ? list.filter((s) => s !== sz) : [...list, sz];
    setSizesText(next.join(', '));
  };

  const activeColors = colorsText.split(',').map((c) => c.trim()).filter(Boolean);
  const addColor = (c: string) => {
    if (!c.trim()) return;
    const next = Array.from(new Set([...activeColors, c.trim()]));
    setColorsText(next.join(', '));
  };
  const removeColor = (c: string) => {
    const next = activeColors.filter((x) => x !== c);
    setColorsText(next.join(', '));
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.productStatus === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || (p.category || '').toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const activeCategorySizes = categorySizes(category);

  return (
    <View style={styles.flex1}>
      <View style={[styles.catalogHeroCard, themed.catalogHeroCard]}>
        <View style={{ flex: 1 }}>
          <View style={styles.oneUiCatalogBadgeRow}>
            <View style={[styles.catalogMetricPill, themed.catalogMetricPill]}>
              <Text style={[styles.catalogMetricPillText, themed.catalogMetricPillText]}>● {products.length} LISTINGS</Text>
            </View>
            <View style={[styles.catalogInStockPill, themed.catalogInStockPill]}>
              <Text style={[styles.catalogInStockPillText, themed.catalogInStockPillText]}>
                ● {products.filter((p) => Number(p.stock) > 0).length} IN STOCK
              </Text>
            </View>
          </View>
          <Text style={[styles.catalogHeroTitle, themed.catalogHeroTitle]}>Fabric Gallery</Text>
          <Text style={[styles.catalogHeroSub, themed.catalogHeroSub]}>Samsung Gallery One UI 9 • Tap any product photo to view details & edit</Text>
        </View>
      </View>

      <View style={styles.oneUiSearchRow}>
        <View style={[styles.oneUiSearchPillWrapper, themed.oneUiSearchPillWrapper]}>
          <Text style={styles.searchIconFine}>🔍</Text>
          <TextInput
            style={[styles.oneUiSearchInput, themed.oneUiSearchInput]}
            placeholder="Search products by title, fabric, or SKU..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.searchClearBtn} activeOpacity={0.7}>
              <Text style={styles.searchClearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.oneUiAddProductBtn}
          onPress={() => {
            resetForm();
            setShowFormModal(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.oneUiAddProductBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.oneUiFilterScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.oneUiFilterBar}>
          {['ALL', ...CATEGORY_OPTIONS].map((cat) => {
            const isActive = categoryFilter.toLowerCase() === cat.toLowerCase();
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.oneUiFilterPill, isActive && styles.oneUiFilterPillActive]}
                onPress={() => setCategoryFilter(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.oneUiFilterPillText, isActive && styles.oneUiFilterPillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.tabLoader}>
          <ActivityIndicator size="small" color="#0F1F3D" />
          <Text style={[styles.tabLoaderText, themed.tabLoaderText]}>Loading gallery catalog...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.galleryGridColumnWrapper}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProducts(); }} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: 110, paddingHorizontal: 0 }]}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Text style={styles.emptyIcon}>👕</Text>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>Tap "+ Add" to create your first fabric listing.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const firstImg = item.images?.[0] ? resolveImageUrl(item.images[0]) : '';
            const inStock = Number(item.stock) > 0;
            const isLowStock = inStock && Number(item.stock) <= Number(item.lowStockThreshold || 5);
            const effectivePrice = Number(item.discount) > 0
              ? Math.round(Number(item.price) * (1 - Number(item.discount) / 100))
              : Number(item.price);

            return (
              <TouchableOpacity
                style={[styles.galleryGridCard, themed.galleryGridCard]}
                onPress={() => {
                  setSelectedProductDetail(item);
                  setDetailActivePhotoIdx(0);
                }}
                activeOpacity={0.82}
              >
                <View style={[styles.galleryGridHeroCanvas, themed.galleryGridHeroCanvas]}>
                  {firstImg ? (
                    <Image source={{ uri: firstImg }} style={styles.galleryGridContainImg} resizeMode="contain" />
                  ) : (
                    <View style={styles.productNoImageHero}>
                      <Text style={{ fontSize: 28, color: '#9CA3AF' }}>👕</Text>
                      <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '700', marginTop: 2 }}>No Photo</Text>
                    </View>
                  )}

                  {Number(item.discount) > 0 && (
                    <View style={styles.galleryDiscountPill}>
                      <Text style={styles.galleryDiscountPillText}>-{item.discount}%</Text>
                    </View>
                  )}

                  <View style={[
                    styles.galleryStatusDotPill,
                    { backgroundColor: item.productStatus === 'PUBLISHED' ? 'rgba(16,185,129,0.92)' : 'rgba(217,119,6,0.92)' }
                  ]}>
                    <Text style={styles.galleryStatusDotText}>
                      {item.productStatus === 'PUBLISHED' ? '● Live' : '● Draft'}
                    </Text>
                  </View>

                  {Array.isArray(item.images) && item.images.length > 1 && (
                    <View style={styles.galleryPhotoCountBadge}>
                      <Text style={styles.galleryPhotoCountText}>📷 {item.images.length}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.galleryCardBody}>
                  <Text style={[styles.galleryBrandEyebrow, themed.galleryBrandEyebrow]} numberOfLines={1}>
                    {item.brand || 'TOP THREADZ'} • {item.category}
                  </Text>
                  <Text style={[styles.galleryTitle, themed.galleryTitle]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View style={styles.galleryPriceRow}>
                    <Text style={[styles.galleryPriceBold, themed.galleryPriceBold]}>{formatPkr(effectivePrice)}</Text>
                    {Number(item.discount) > 0 && (
                      <Text style={styles.galleryOrigPrice}>{formatPkr(item.price)}</Text>
                    )}
                  </View>

                  <View style={[
                    styles.galleryStockBadge,
                    { backgroundColor: !inStock ? '#FEE2E2' : isLowStock ? '#FEF3C7' : '#DEF7EC' }
                  ]}>
                    <Text style={[
                      styles.galleryStockBadgeText,
                      { color: !inStock ? '#991B1B' : isLowStock ? '#92400E' : '#03543F' }
                    ]}>
                      {!inStock ? 'Out of Stock' : isLowStock ? `Low: ${item.stock}` : `Stock: ${item.stock}`}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Modal visible={!!selectedProductDetail} animationType="slide" transparent={false} onRequestClose={() => setSelectedProductDetail(null)}>
        <SafeAreaView style={styles.productDetailModalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#0F1F3D" />

          <View style={styles.productDetailHeaderBar}>
            <TouchableOpacity
              style={styles.productDetailBackBtn}
              onPress={() => setSelectedProductDetail(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.productDetailBackBtnText}>✕ Close</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.productDetailHeaderTitle}>Product Details</Text>
              <Text style={styles.productDetailHeaderSub}>Samsung One UI 9 Gallery View</Text>
            </View>
            <TouchableOpacity
              style={styles.detailHeaderEditPill}
              onPress={() => {
                const p = selectedProductDetail;
                setSelectedProductDetail(null);
                openEditModal(p);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.detailHeaderEditPillText}>✏️ Edit</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 130 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.detailPhotoHeroWrapper}>
              {selectedProductDetail?.images && selectedProductDetail.images.length > 0 ? (
                <Image
                  source={{ uri: resolveImageUrl(selectedProductDetail.images[detailActivePhotoIdx] || selectedProductDetail.images[0]) }}
                  style={styles.detailHeroImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.detailHeroNoImage}>
                  <Text style={{ fontSize: 54 }}>👕</Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 6, fontWeight: '700' }}>No Photo Available</Text>
                </View>
              )}

              {Number(selectedProductDetail?.discount) > 0 && (
                <View style={styles.detailDiscountBadge}>
                  <Text style={styles.detailDiscountBadgeText}>-{selectedProductDetail?.discount}% OFF</Text>
                </View>
              )}

              <View style={[
                styles.detailStatusBadge,
                { backgroundColor: selectedProductDetail?.productStatus === 'PUBLISHED' ? 'rgba(16,185,129,0.95)' : 'rgba(217,119,6,0.95)' }
              ]}>
                <Text style={styles.detailStatusBadgeText}>
                  ● {selectedProductDetail?.productStatus || 'DRAFT'}
                </Text>
              </View>
            </View>

            {Array.isArray(selectedProductDetail?.images) && selectedProductDetail.images.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.detailThumbnailStrip}>
                {selectedProductDetail.images.map((img: string, idx: number) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.detailThumbWrap, detailActivePhotoIdx === idx && styles.detailThumbWrapActive]}
                    onPress={() => setDetailActivePhotoIdx(idx)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: resolveImageUrl(img) }} style={styles.detailThumbImg} resizeMode="contain" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.detailContentCard}>
              <Text style={styles.detailBrandEyebrow}>
                {selectedProductDetail?.brand || 'TOP THREADZ'} • {selectedProductDetail?.category || 'Fabric'} {selectedProductDetail?.subcategory ? `• ${selectedProductDetail.subcategory}` : ''}
              </Text>

              <Text style={styles.detailTitleText}>
                {selectedProductDetail?.name}
              </Text>

              <View style={styles.detailPriceRow}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                    <Text style={styles.detailPriceBold}>
                      {formatPkr(
                        Number(selectedProductDetail?.discount) > 0
                          ? Math.round(Number(selectedProductDetail?.price) * (1 - Number(selectedProductDetail?.discount) / 100))
                          : selectedProductDetail?.price
                      )}
                    </Text>
                    {Number(selectedProductDetail?.discount) > 0 && (
                      <Text style={styles.detailOrigPriceStrike}>
                        {formatPkr(selectedProductDetail?.price)}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.detailSkuFine}>SKU: {selectedProductDetail?.sku || 'N/A'}</Text>
                </View>

                <View style={[
                  styles.detailStockPill,
                  { backgroundColor: Number(selectedProductDetail?.stock) <= 0 ? '#FEE2E2' : '#DEF7EC' }
                ]}>
                  <Text style={[
                    styles.detailStockPillText,
                    { color: Number(selectedProductDetail?.stock) <= 0 ? '#991B1B' : '#03543F' }
                  ]}>
                    {Number(selectedProductDetail?.stock) <= 0 ? '✕ Out of Stock' : `● In Stock: ${selectedProductDetail?.stock} units`}
                  </Text>
                </View>
              </View>

              {Array.isArray(selectedProductDetail?.sizes) && selectedProductDetail.sizes.length > 0 && (
                <View style={styles.detailSectionBlock}>
                  <Text style={styles.detailSectionLabel}>Available Length / Sizes</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {selectedProductDetail.sizes.map((sz: string, idx: number) => (
                      <View key={idx} style={styles.detailSizeChip}>
                        <Text style={styles.detailSizeChipText}>{sz}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {Array.isArray(selectedProductDetail?.colors) && selectedProductDetail.colors.length > 0 && (
                <View style={styles.detailSectionBlock}>
                  <Text style={styles.detailSectionLabel}>Available Colors</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {selectedProductDetail.colors.map((c: string, idx: number) => (
                      <View key={idx} style={styles.detailColorChip}>
                        <Text style={styles.detailColorChipText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.detailSectionBlock}>
                <Text style={styles.detailSectionLabel}>Fabric Description</Text>
                <Text style={styles.detailDescriptionBody}>
                  {selectedProductDetail?.description || 'No description provided.'}
                </Text>
              </View>

              {selectedProductDetail?.careInstructions ? (
                <View style={styles.detailSectionBlock}>
                  <Text style={styles.detailSectionLabel}>Fabric Care Instructions</Text>
                  <Text style={styles.detailCareBody}>
                    🧼 {selectedProductDetail.careInstructions}
                  </Text>
                </View>
              ) : null}

              <View style={styles.detailHighlightsRow}>
                {selectedProductDetail?.featured ? (
                  <View style={styles.highlightPillGold}>
                    <Text style={styles.highlightPillGoldText}>⭐ Featured on Homepage</Text>
                  </View>
                ) : null}
                {selectedProductDetail?.trending ? (
                  <View style={styles.highlightPillCrimson}>
                    <Text style={styles.highlightPillCrimsonText}>🔥 Trending Collection</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>

          <View style={styles.oneUiStickyBottomBar}>
            <TouchableOpacity
              style={styles.detailBottomDeleteBtn}
              onPress={() => {
                const p = selectedProductDetail;
                setSelectedProductDetail(null);
                handleDeleteProduct(p);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.detailBottomDeleteText}>🗑️ Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailBottomEditBtn}
              onPress={() => {
                const p = selectedProductDetail;
                setSelectedProductDetail(null);
                openEditModal(p);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.detailBottomEditText}>✏️ Edit Product</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showFormModal} animationType="slide" transparent={false} onRequestClose={() => setShowFormModal(false)}>
        <SafeAreaView style={styles.premiumModalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#0F1F3D" />

          <View style={styles.premiumModalHeader}>
            <TouchableOpacity
              style={styles.premiumHeaderCloseBtn}
              onPress={() => setShowFormModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.premiumHeaderCloseText}>✕ Close</Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <Text style={styles.premiumHeaderTitle}>
                {editingProduct ? 'Edit Fabric Product' : 'Add New Product'}
              </Text>
              <Text style={styles.premiumHeaderSubtitle}>
                Page {currentStep} of {WIZARD_STEPS.length} • {WIZARD_STEPS.find((s) => s.key === currentStep)?.title}
              </Text>
            </View>

            {!editingProduct ? (
              <TouchableOpacity
                style={styles.quickFillHeaderBtn}
                onPress={() => {
                  Alert.alert(
                    '⚡ Quick-Fill Template',
                    'Choose a product archetype:',
                    [
                      { text: '✨ Wash & Wear', onPress: () => { setName('Executive Wash & Wear Fabric'); setCategory('Unstitched'); setPrice('3950'); setDiscount('10'); setSizesText('Standard'); setDescription('Ultra-fine summer wash and wear.'); } },
                      { text: '👑 Boski', onPress: () => { setName('Royal Pure Silk Boski'); setCategory('Unstitched'); setPrice('8500'); setSizesText('Standard'); setDescription('100% genuine Chinese spun silk.'); } },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.quickFillHeaderText}>⚡ Template</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 70 }} />
            )}
          </View>

          <View style={styles.stepperBarWrapper}>
            {WIZARD_STEPS.map((s) => {
              const isActive = currentStep === s.key;
              const isPassed = currentStep > s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.stepCapsule, isActive && styles.stepCapsuleActive, isPassed && styles.stepCapsulePassed]}
                  onPress={() => setCurrentStep(s.key)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.stepCapsuleIcon}>{isPassed ? '✓' : s.icon}</Text>
                  <Text style={[styles.stepCapsuleText, (isActive || isPassed) && styles.stepCapsuleTextActive]}>
                    {s.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView
            style={styles.premiumScrollBody}
            contentContainerStyle={{ paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
          >
            {currentStep === 1 && (
              <View style={styles.stepCardSection}>
                {/* ── Pillar Card A: Photos ─────────────────────────────────── */}
                <View style={[styles.pillarCard, themed.pillarCard]}>
                  <View style={[styles.pillarHeader, themed.pillarHeader]}>
                    <Text style={styles.pillarIcon}>📸</Text>
                    <Text style={[styles.pillarTitle, themed.pillarTitle]}>Photos</Text>
                    <View style={[styles.pillarMetaBadge, themed.pillarMetaBadge]}>
                      <Text style={[styles.pillarMetaBadgeText, themed.pillarMetaBadgeText]}>
                        {images.length > 0 ? `● ${images.length} PHOTO${images.length > 1 ? 'S' : ''}` : '● REQUIRED'}
                      </Text>
                    </View>
                  </View>

                  {/* Hero photo sub-card */}
                  <TouchableOpacity
                    style={styles.pageOnePhotoHeroCard}
                    onPress={promptPhotoSource}
                    activeOpacity={0.85}
                  >
                    {images.length > 0 ? (
                      <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <Image
                          source={{ uri: resolveImageUrl(images[0]) }}
                          style={{ width: '100%', height: '100%', borderRadius: 26 }}
                          resizeMode="contain"
                        />
                        <View style={styles.photoCardCoverBadge}>
                          <Text style={styles.photoCardCoverBadgeText}>★ COVER PHOTO</Text>
                        </View>
                        <View style={styles.photoCardTapOverlay}>
                          <Text style={styles.photoCardTapOverlayText}>Tap to Add / Change</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.pageOneEmptyPhotoPrompt}>
                        {uploadingImage ? (
                          <>
                            <ActivityIndicator size="small" color="#0F1F3D" />
                            <Text style={styles.pageOneUploadHint}>Uploading photo...</Text>
                          </>
                        ) : (
                          <>
                            <View style={styles.pageOneCameraCircle}>
                              <Text style={{ fontSize: 32 }}>📸</Text>
                            </View>
                            <Text style={styles.pageOneTapTitle}>Add Product Photo</Text>
                            <Text style={styles.pageOneTapSubtitle}>Tap to choose Gallery or Camera</Text>
                          </>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Photo strip + quick URL add sub-card */}
                  {images.length > 0 && (
                    <View style={[styles.pillSubCard, themed.pillSubCard]}>
                      <View style={styles.photoStripHeaderRow}>
                        <Text style={[styles.pillSubCardLabel, themed.pillSubCardLabel]}>Photos ({images.length})</Text>
                        <TouchableOpacity
                          style={styles.addAnotherPhotoPill}
                          onPress={promptPhotoSource}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.addAnotherPhotoPillText}>+ Add More</Text>
                        </TouchableOpacity>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                        {images.map((imgUrl, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.miniPhotoThumbWrap}
                            onPress={() => setCoverImage(idx)}
                            activeOpacity={0.8}
                          >
                            <Image
                              source={{ uri: resolveImageUrl(imgUrl) }}
                              style={styles.miniPhotoThumb}
                              resizeMode="contain"
                            />
                            <TouchableOpacity
                              style={styles.miniPhotoRemoveBtn}
                              onPress={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                            >
                              <Text style={styles.miniPhotoRemoveText}>✕</Text>
                            </TouchableOpacity>
                            {idx === 0 && <View style={styles.miniCoverDot} />}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Direct URL sub-card */}
                  <View style={[styles.pillSubCard, themed.pillSubCard]}>
                    <Text style={[styles.pillSubCardLabel, themed.pillSubCardLabel]}>Image URL</Text>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <TextInput
                        style={[styles.pillAddInput, { flex: 1 }]}
                        placeholder="Paste image URL..."
                        placeholderTextColor="#9CA3AF"
                        value={directUrl}
                        onChangeText={setDirectUrl}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        style={styles.addPillMiniBtn}
                        onPress={() => {
                          if (directUrl.trim()) {
                            setImages((prev) => [...prev, directUrl.trim()]);
                            setDirectUrl('');
                            askAddAnotherPhoto();
                          }
                        }}
                      >
                        <Text style={styles.addPillMiniBtnText}>+ Add</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.pillSubCardHelper, themed.pillSubCardHelper]}>Optional — add a photo from an external link</Text>
                  </View>
                </View>

                {/* ── Pillar Card B: Product Information ────────────────────── */}
                <View style={[styles.pillarCard, themed.pillarCard]}>
                  <View style={[styles.pillarHeader, themed.pillarHeader]}>
                    <Text style={styles.pillarIcon}>🧵</Text>
                    <Text style={[styles.pillarTitle, themed.pillarTitle]}>Product Information</Text>
                    <View style={[styles.pillarMetaBadge, themed.pillarMetaBadge]}>
                      <Text style={[styles.pillarMetaBadgeText, themed.pillarMetaBadgeText]}>
                        {name.trim() ? '● READY' : '● OPEN'}
                      </Text>
                    </View>
                  </View>

                  {/* Title sub-card */}
                  <View style={[styles.pillSubCard, themed.pillSubCard]}>
                    <Text style={[styles.pillSubCardLabel, themed.pillSubCardLabel]}>Product Title *</Text>
                    <TextInput
                      style={[styles.titleInputField, themed.titleInputField]}
                      placeholder="e.g. Royal Pure Silk Boski (6 Pound)"
                      placeholderTextColor="#9CA3AF"
                      value={name}
                      onChangeText={setName}
                      multiline
                    />
                    {name.length > 0 && (
                      <Text style={[styles.charCountHint, themed.charCountHint]}>{name.length} characters</Text>
                    )}
                  </View>

                  {/* Description sub-card */}
                  <View style={[styles.pillSubCard, themed.pillSubCard]}>
                    <Text style={[styles.pillSubCardLabel, themed.pillSubCardLabel]}>Fabric Description *</Text>
                    <TextInput
                      style={[styles.subCardPillInput, { height: 85, borderRadius: 16, paddingTop: 10, textAlignVertical: 'top' }]}
                      placeholder="Fabric weave, texture, drape, seasonality..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={4}
                      value={description}
                      onChangeText={setDescription}
                    />
                  </View>

                  {/* Colors sub-card */}
                  <View style={[styles.pillSubCard, themed.pillSubCard]}>
                    <Text style={[styles.pillSubCardLabel, themed.pillSubCardLabel]}>Color Options</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 8 }}>
                      {COLOR_PRESETS.slice(0, 8).map((col) => (
                        <TouchableOpacity
                          key={col.value}
                          style={styles.presetColorChip}
                          onPress={() => addColor(col.value)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.presetColorText}>+ {col.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TextInput
                        style={[styles.pillAddInput, { flex: 1 }]}
                        placeholder="Custom color (e.g. Royal Navy)"
                        placeholderTextColor="#9CA3AF"
                        value={customColor}
                        onChangeText={setCustomColor}
                      />
                      <TouchableOpacity
                        style={styles.addPillMiniBtn}
                        onPress={() => {
                          if (customColor.trim()) {
                            addColor(customColor.trim());
                            setCustomColor('');
                          }
                        }}
                      >
                        <Text style={styles.addPillMiniBtnText}>+ Add</Text>
                      </TouchableOpacity>
                    </View>
                    {activeColors.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {activeColors.map((c) => (
                          <TouchableOpacity key={c} style={styles.selectedColorChip} onPress={() => removeColor(c)}>
                            <Text style={styles.selectedColorText}>{c} ✕</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Care instructions sub-card */}
                  <View style={[styles.pillSubCard, themed.pillSubCard]}>
                    <Text style={[styles.pillSubCardLabel, themed.pillSubCardLabel]}>Care Instructions</Text>
                    <TextInput
                      style={[styles.subCardPillInput, { height: 75, borderRadius: 16, paddingTop: 10, textAlignVertical: 'top' }]}
                      placeholder="e.g. Hand wash cold, iron on medium heat..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={3}
                      value={careInstructions}
                      onChangeText={setCareInstructions}
                    />
                  </View>
                </View>
              </View>
            )}

            {currentStep === 2 && (
              <View style={styles.stepCardSection}>
                {/* Standalone Search Category component — detached from pillar cards */}
                <View style={[styles.taxonomySearchShell, themed.taxonomySearchShell]}>
                  <Text style={styles.taxonomySearchIcon}>🔍</Text>
                  <TextInput
                    style={[styles.taxonomySearchInput, themed.taxonomySearchInput]}
                    placeholder="Search categories, collections, brands..."
                    placeholderTextColor="#9CA3AF"
                    value={taxonomySearch}
                    onChangeText={setTaxonomySearch}
                    returnKeyType="search"
                  />
                  {taxonomySearch.length > 0 && (
                    <TouchableOpacity
                      style={styles.taxonomySearchClear}
                      onPress={() => setTaxonomySearch('')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.taxonomySearchClearText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* ── Pillar Card 1: Categories & Taxonomy ────────────────── */}
                <View style={[styles.pillarCard, taxonomyQuery ? { opacity: 0.45 } : null]}>
                  <View style={[styles.pillarHeader, themed.pillarHeader]}>
                    <Text style={styles.pillarIcon}>🏷️</Text>
                    <Text style={[styles.pillarTitle, themed.pillarTitle]}>Categories & Taxonomy</Text>
                    <View style={[styles.pillarMetaBadge, themed.pillarMetaBadge]}>
                      <Text style={[styles.pillarMetaBadgeText, themed.pillarMetaBadgeText]}>
                        {taxonomyQuery ? '● FILTERED' : '● OPEN'}
                      </Text>
                    </View>
                  </View>

                {/* Primary Category — large pill sub-card */}
                <View style={[styles.pillSubCard, themed.pillSubCard]}>
                  <Text style={[styles.pillSubCardLabel, themed.pillSubCardLabel]}>Primary Category *</Text>
                  <View style={styles.pillChipWrap}>
                    {categoryPills.filter(matchTaxonomy).map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.catChoiceBtn, category === cat && styles.catChoiceBtnActive]}
                        onPress={() => {
                          setCategory(cat);
                          setSizesText(categorySizes(cat).join(', '));
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.catChoiceText, category === cat && styles.catChoiceTextActive]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.pillAddRow}>
                    <TextInput
                      style={[styles.pillAddInput, themed.pillAddInput]}
                      placeholder="Add new category..."
                      placeholderTextColor="#9CA3AF"
                      value={newCategory}
                      onChangeText={setNewCategory}
                      onSubmitEditing={addSessionCategory}
                      returnKeyType="done"
                    />
                    <TouchableOpacity style={styles.addPillMiniBtn} onPress={addSessionCategory} activeOpacity={0.8}>
                      <Text style={styles.addPillMiniBtnText}>+ Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Collection — pill sub-card */}
                <View style={[styles.pillSubCard, themed.pillSubCard]}>
                  <Text style={[styles.pillSubCardLabel, themed.pillSubCardLabel]}>Collection</Text>
                  <View style={styles.pillChipWrap}>
                    <TouchableOpacity
                      style={[styles.catChoiceBtn, collection === '' && styles.catChoiceBtnActive]}
                      onPress={() => setCollection('')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.catChoiceText, collection === '' && styles.catChoiceTextActive]}>
                        No Collection
                      </Text>
                    </TouchableOpacity>
                    {collectionPills.filter(matchTaxonomy).map((col) => (
                      <TouchableOpacity
                        key={col}
                        style={[styles.catChoiceBtn, collection === col && styles.catChoiceBtnActive]}
                        onPress={() => setCollection(col)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.catChoiceText, collection === col && styles.catChoiceTextActive]}>
                          {col}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.pillAddRow}>
                    <TextInput
                      style={[styles.pillAddInput, themed.pillAddInput]}
                      placeholder="Add new collection..."
                      placeholderTextColor="#9CA3AF"
                      value={newCollection}
                      onChangeText={setNewCollection}
                      onSubmitEditing={addSessionCollection}
                      returnKeyType="done"
                    />
                    <TouchableOpacity style={styles.addPillMiniBtn} onPress={addSessionCollection} activeOpacity={0.8}>
                      <Text style={styles.addPillMiniBtnText}>+ Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Brand — pill sub-card */}
                <View style={[styles.pillSubCard, themed.pillSubCard]}>
                  <Text style={[styles.pillSubCardLabel, themed.pillSubCardLabel]}>Brand</Text>
                  <View style={styles.pillChipWrap}>
                    {brandPills.filter(matchTaxonomy).map((b) => (
                      <TouchableOpacity
                        key={b}
                        style={[styles.catChoiceBtn, brand === b && styles.catChoiceBtnActive]}
                        onPress={() => setBrand(b)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.catChoiceText, brand === b && styles.catChoiceTextActive]}>
                          {b}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.pillAddRow}>
                    <TextInput
                      style={[styles.pillAddInput, themed.pillAddInput]}
                      placeholder="Add new brand..."
                      placeholderTextColor="#9CA3AF"
                      value={newBrand}
                      onChangeText={setNewBrand}
                      onSubmitEditing={addSessionBrand}
                      returnKeyType="done"
                    />
                    <TouchableOpacity style={styles.addPillMiniBtn} onPress={addSessionBrand} activeOpacity={0.8}>
                      <Text style={styles.addPillMiniBtnText}>+ Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                </View>

                {/* ── Pillar Card 2: Pricing & Economics ───────────────────── */}
                <View style={[styles.pillarCard, taxonomyQuery ? { opacity: 0.45 } : null]}>
                  <View style={[styles.pillarHeader, themed.pillarHeader]}>
                    <Text style={styles.pillarIcon}>💰</Text>
                    <Text style={[styles.pillarTitle, themed.pillarTitle]}>Pricing & Economics</Text>
                    <View style={[styles.pillarMetaBadge, themed.pillarMetaBadge]}>
                      <Text style={[styles.pillarMetaBadgeText, themed.pillarMetaBadgeText]}>
                        {Number(price) > 0 ? `● ${formatPkr(Math.round(Number(price) * (1 - Number(discount) / 100)))}` : '● OPEN'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.pillarSubRow}>
                    <View style={[styles.pillSubCard, styles.pillSubCardGrow]}>
                      <Text style={[styles.pillSubCardLabel, themed.pillSubCardLabel]}>Retail Price (PKR) *</Text>
                      <TextInput
                        style={[styles.subCardPillInput, themed.subCardPillInput]}
                        placeholder="e.g. 3950"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        value={price}
                        onChangeText={setPrice}
                      />
                    </View>
                    <View style={[styles.pillSubCard, styles.pillSubCardGrow]}>
                      <Text style={[styles.pillSubCardLabel, Number(discount) > 0 && { color: '#B91C2B' }]}>
                        Discount (%)
                      </Text>
                      <TextInput
                        style={[styles.subCardPillInput, themed.subCardPillInput]}
                        placeholder="0"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        value={discount}
                        onChangeText={setDiscount}
                      />
                    </View>
                  </View>

                  {Number(price) > 0 && (
                    <View style={styles.effectivePriceBox}>
                      <Text style={styles.effectivePriceText}>
                        ✓ Effective Customer Price: {formatPkr(Math.round(Number(price) * (1 - Number(discount) / 100)))}
                      </Text>
                    </View>
                  )}

                  <View style={[styles.pillSubCard, themed.pillSubCard]}>
                    <Text style={[styles.pillSubCardLabel, themed.pillSubCardLabel]}>SKU Code</Text>
                    <TextInput
                      style={[styles.subCardPillInput, themed.subCardPillInput]}
                      placeholder="e.g. TT-WW-NAVY-45"
                      placeholderTextColor="#9CA3AF"
                      value={sku}
                      onChangeText={setSku}
                    />
                    <Text style={[styles.pillSubCardHelper, themed.pillSubCardHelper]}>Unique stock-keeping code for this listing</Text>
                  </View>
                </View>

                {/* ── Pillar Card 3: Inventory & Variants ───────────────────── */}
                <View style={[styles.pillarCard, taxonomyQuery ? { opacity: 0.45 } : null]}>
                  <View style={[styles.pillarHeader, themed.pillarHeader]}>
                    <Text style={styles.pillarIcon}>📦</Text>
                    <Text style={[styles.pillarTitle, themed.pillarTitle]}>Inventory & Variants</Text>
                    <View style={[styles.pillarMetaBadge, themed.pillarMetaBadge]}>
                      <Text style={[styles.pillarMetaBadgeText, themed.pillarMetaBadgeText]}>
                        ● {Number(stock) > 0 ? `${stock} UNITS` : 'NO STOCK'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.pillarSubRow}>
                    <View style={[styles.pillSubCard, styles.pillSubCardGrow]}>
                      <Text style={[styles.pillSubCardLabel, themed.pillSubCardLabel]}>Stock Quantity *</Text>
                      <TextInput
                        style={[styles.subCardPillInput, themed.subCardPillInput]}
                        placeholder="10"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        value={stock}
                        onChangeText={setStock}
                      />
                    </View>
                    <View style={[styles.pillSubCard, styles.pillSubCardGrow]}>
                      <Text style={[styles.pillSubCardLabel, themed.pillSubCardLabel]}>Low Stock Alert</Text>
                      <TextInput
                        style={[styles.subCardPillInput, themed.subCardPillInput]}
                        placeholder="5"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        value={lowStockThreshold}
                        onChangeText={setLowStockThreshold}
                      />
                      <Text style={[styles.pillSubCardHelper, themed.pillSubCardHelper]}>Alert when stock falls to or below this number</Text>
                    </View>
                  </View>

                  <View style={[styles.pillSubCard, themed.pillSubCard]}>
                    <Text style={[styles.pillSubCardLabel, themed.pillSubCardLabel]}>Stock Status</Text>
                    <View style={styles.pillChipWrap}>
                      {['IN_STOCK', 'OUT_OF_STOCK', 'PREORDER'].map((st) => (
                        <TouchableOpacity
                          key={st}
                          style={[styles.catChoiceBtn, stockStatus === st && styles.catChoiceBtnActive]}
                          onPress={() => setStockStatus(st)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.catChoiceText, stockStatus === st && styles.catChoiceTextActive]}>
                            {st.replace(/_/g, ' ')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={[styles.pillSubCard, themed.pillSubCard]}>
                    <Text style={[styles.pillSubCardLabel, themed.pillSubCardLabel]}>
                      Available Sizes · {sizesText.split(',').map((s) => s.trim()).filter(Boolean).length}
                    </Text>
                    <View style={styles.pillChipWrap}>
                      {activeCategorySizes.map((sz) => {
                        const isSel = sizesText.split(',').map((s) => s.trim()).includes(sz);
                        return (
                          <TouchableOpacity
                            key={sz}
                            style={[styles.chipToggle, isSel && styles.chipToggleActive]}
                            onPress={() => toggleSize(sz)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.chipToggleText, isSel && styles.chipToggleTextActive]}>
                              {isSel ? '✓ ' : '+ '}{sz}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <TextInput
                      style={[styles.subCardPillInput, themed.subCardPillInput]}
                      placeholder="Custom sizes (e.g. S, M, L, XL, Standard, 2-3Y)"
                      placeholderTextColor="#9CA3AF"
                      value={sizesText}
                      onChangeText={setSizesText}
                    />
                  </View>

                  <View style={[styles.pillSubCard, themed.pillSubCard]}>
                    <Text style={[styles.pillSubCardLabel, themed.pillSubCardLabel]}>Search Tags</Text>
                    <TextInput
                      style={[styles.subCardPillInput, themed.subCardPillInput]}
                      placeholder="e.g. summer, wash and wear, premium"
                      placeholderTextColor="#9CA3AF"
                      value={tagsText}
                      onChangeText={setTagsText}
                    />
                    <Text style={[styles.pillSubCardHelper, themed.pillSubCardHelper]}>Comma-separated keywords that help shoppers find this product</Text>
                  </View>
                </View>
              </View>
            )}

            {currentStep === 3 && (
              <View style={styles.stepCardSection}>
                {/* ── Pillar Card: Review & Merchandising ───────────────────── */}
                <View style={[styles.pillarCard, themed.pillarCard]}>
                  <View style={[styles.pillarHeader, themed.pillarHeader]}>
                    <Text style={styles.pillarIcon}>✓</Text>
                    <Text style={[styles.pillarTitle, themed.pillarTitle]}>Review & Merchandising</Text>
                    <View style={[styles.pillarMetaBadge, themed.pillarMetaBadge]}>
                      <Text style={[styles.pillarMetaBadgeText, themed.pillarMetaBadgeText]}>
                        {productStatus === 'PUBLISHED' ? '● GOES LIVE' : `● ${productStatus}`}
                      </Text>
                    </View>
                  </View>

                  {/* Listing summary sub-card */}
                  <View style={[styles.pillSubCard, themed.pillSubCard]}>
                    <Text style={[styles.pillSubCardLabel, themed.pillSubCardLabel]}>Listing Summary</Text>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                      {images[0] ? (
                        <Image
                          source={{ uri: resolveImageUrl(images[0]) }}
                          style={{ width: 68, height: 78, borderRadius: 12, backgroundColor: '#FFFFFF' }}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={{ width: 68, height: 78, borderRadius: 12, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ fontSize: 24 }}>👕</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.reviewSummaryTitle, themed.reviewSummaryTitle]}>{name || 'Untitled Product'}</Text>
                        <Text style={[styles.reviewSummaryDetails, themed.reviewSummaryDetails]}>{brand} • {category}{collection ? ` • ${collection}` : ''}</Text>
                        <Text style={[styles.reviewSummaryDetails, { fontWeight: '800', color: '#0F1F3D' }]}>
                          {formatPkr(price)} {Number(discount) > 0 ? `(-${discount}% OFF)` : ''}
                        </Text>
                        <Text style={[styles.reviewSummaryDetails, themed.reviewSummaryDetails]}>
                          Stock: {stock || 0} • {sizesText.split(',').map((s) => s.trim()).filter(Boolean).length} sizes
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Featured toggle sub-card */}
                  <View style={[styles.pillSubCard, styles.merchSwitchRow]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.switchLabel, themed.switchLabel]}>⭐ Featured Product</Text>
                      <Text style={[styles.switchSub, themed.switchSub]}>Display in the Featured Storefront Collection</Text>
                    </View>
                    <Switch
                      value={featured}
                      onValueChange={setFeatured}
                      thumbColor={featured ? '#0F1F3D' : '#9CA3AF'}
                      trackColor={{ true: '#DEF7EC', false: '#E5E7EB' }}
                    />
                  </View>

                  {/* Trending toggle sub-card */}
                  <View style={[styles.pillSubCard, styles.merchSwitchRow]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.switchLabel, themed.switchLabel]}>🔥 Trending / New Arrival</Text>
                      <Text style={[styles.switchSub, themed.switchSub]}>Highlight on homepage hero badges</Text>
                    </View>
                    <Switch
                      value={trending}
                      onValueChange={setTrending}
                      thumbColor={trending ? '#B91C2B' : '#9CA3AF'}
                      trackColor={{ true: '#FDE8E8', false: '#E5E7EB' }}
                    />
                  </View>

                  {/* Store status sub-card */}
                  <View style={[styles.pillSubCard, themed.pillSubCard]}>
                    <Text style={[styles.pillSubCardLabel, themed.pillSubCardLabel]}>Product Store Status</Text>
                    <View style={styles.pillChipWrap}>
                      {['PUBLISHED', 'DRAFT', 'HIDDEN'].map((st) => (
                        <TouchableOpacity
                          key={st}
                          style={[styles.catChoiceBtn, productStatus === st && styles.catChoiceBtnActive]}
                          onPress={() => setProductStatus(st)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.catChoiceText, productStatus === st && styles.catChoiceTextActive]}>
                            {st}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={[styles.pillSubCardHelper, themed.pillSubCardHelper]}>
                      Published listings appear on the storefront immediately; drafts and hidden ones do not
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.oneUiStickyBottomBar}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={styles.stepperBackBtn}
                onPress={() => setCurrentStep((c) => c - 1)}
                activeOpacity={0.8}
              >
                <Text style={styles.stepperBackBtnText}>← Back</Text>
              </TouchableOpacity>
            )}

            {currentStep < WIZARD_STEPS.length ? (
              <TouchableOpacity
                style={[styles.stepperNextBtn, { flex: 1 }]}
                onPress={() => {
                  if (currentStep === 1) {
                    if (images.length === 0) { Alert.alert('Photo Required', 'Please add at least 1 product photo.'); return; }
                    if (!name.trim()) { Alert.alert('Title Required', 'Please enter a product title.'); return; }
                  }
                  if (currentStep === 2) {
                    if (!price.trim()) { Alert.alert('Price Required', 'Please enter a regular price.'); return; }
                  }
                  setCurrentStep((c) => c + 1);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.stepperNextBtnText}>Continue →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.stepperPublishBtn, saving && { opacity: 0.7 }]}
                onPress={handleSaveProduct}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.stepperPublishBtnText}>
                    {editingProduct ? '✓ Save & Update Product' : '✓ Publish Product to Store'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function CustomersView() {
  const { themed } = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get('/admin/users');
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
        <Text style={[styles.sectionTitle, themed.sectionTitle]}>Customer Directory</Text>
        <Text style={[styles.sectionSubtitle, themed.sectionSubtitle]}>Registered shoppers, phone contacts & history</Text>
      </View>

      {loading ? (
        <View style={styles.tabLoader}>
          <ActivityIndicator size="small" color="#0F1F3D" />
          <Text style={[styles.tabLoaderText, themed.tabLoaderText]}>Fetching customers...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadUsers(); }} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.customerCard, themed.customerCard]}>
              <View style={styles.customerAvatar}>
                <Text style={styles.customerAvatarText}>
                  {(item.name || item.email || 'U').slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.customerName, themed.customerName]}>{item.name || 'Anonymous Guest'}</Text>
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
  const { themed } = useTheme();
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
        <Text style={[styles.sectionTitle, themed.sectionTitle]}>Pending Payments Queue</Text>
        <Text style={[styles.sectionSubtitle, themed.sectionSubtitle]}>Safepay & Bank Transfer approvals</Text>
      </View>

      {loading ? (
        <View style={styles.tabLoader}>
          <ActivityIndicator size="small" color="#0F1F3D" />
          <Text style={[styles.tabLoaderText, themed.tabLoaderText]}>Checking payments...</Text>
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
            <View style={[styles.paymentCard, themed.paymentCard]}>
              <View style={styles.paymentHeader}>
                <Text style={[styles.paymentOrder, themed.paymentOrder]}>Order #{item.order?.orderNumber}</Text>
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
  const { mode, setMode, themed } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [standardFee, setStandardFee] = useState('250');
  const [freeThreshold, setFreeThreshold] = useState('10000');
  const [showBannerModal, setShowBannerModal] = useState(false);

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
        <Text style={[styles.tabLoaderText, themed.tabLoaderText]}>Loading store configurations...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabScrollView} contentContainerStyle={[styles.tabScrollContent, { paddingBottom: 110 }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, themed.sectionTitle]}>Store Configuration</Text>
        <Text style={[styles.sectionSubtitle, themed.sectionSubtitle]}>Manage delivery rules, customer care & promotional banner</Text>
      </View>

      {/* Appearance — Theme Mode */}
      <View style={[styles.cardSection, themed.cardSection]}>
        <Text style={[styles.cardSectionTitle, themed.cardSectionTitle]}>Appearance</Text>
        <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 17 }}>
          Choose the display theme for the admin console. Applies instantly across every screen.
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['light', 'dark'] as ThemeMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.catChoiceBtn, mode === m && styles.catChoiceBtnActive]}
              onPress={() => setMode(m)}
              activeOpacity={0.8}
            >
              <Text style={[styles.catChoiceText, mode === m && styles.catChoiceTextActive]}>
                {m === 'light' ? '☀️  Light Mode' : '🌙  Dark Mode'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Hero Banner Quick Access */}
      <View style={[styles.cardSection, themed.cardSection]}>
        <Text style={[styles.cardSectionTitle, themed.cardSectionTitle]}>Storefront Hero Banner</Text>
        <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 17 }}>
          Configure top homepage visual, brand tagline, headline typography & call-to-action button.
        </Text>
        <TouchableOpacity
          style={styles.heroBannerSettingsBtn}
          onPress={() => setShowBannerModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.heroBannerSettingsBtnText}>🖼️ Upload & Customize Hero Banner</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.cardSection, themed.cardSection]}>
        <Text style={[styles.cardSectionTitle, themed.cardSectionTitle]}>Shipping Rates</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Standard Delivery Fee (PKR)</Text>
          <TextInput
            style={[styles.textInput, themed.textInput]}
            value={standardFee}
            onChangeText={setStandardFee}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Free Delivery Order Threshold (PKR)</Text>
          <TextInput
            style={[styles.textInput, themed.textInput]}
            value={freeThreshold}
            onChangeText={setFreeThreshold}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={[styles.cardSection, themed.cardSection]}>
        <Text style={[styles.cardSectionTitle, themed.cardSectionTitle]}>Customer Care Lines</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>WhatsApp Support Number</Text>
          <TextInput
            style={[styles.textInput, themed.textInput]}
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="+923001234567"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Outlet Phone Number</Text>
          <TextInput
            style={[styles.textInput, themed.textInput]}
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

      {/* Hero Banner Modal */}
      <HeroBannerModal
        visible={showBannerModal}
        onClose={() => setShowBannerModal(false)}
        onUpdated={() => {}}
      />
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
      return { backgroundColor: '#DEF7EC' };
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
    backgroundColor: '#070E1A',
  },
  // ── Premium Splash Screen ───────────────────────────────────────────
  splashRoot: {
    flex: 1,
    backgroundColor: '#070E1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashGlowOne: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  splashGlowTwo: {
    position: 'absolute',
    bottom: -140,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(185, 28, 43, 0.14)',
  },
  splashLogoRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 10,
  },
  splashLogoImage: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  splashWordmark: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  splashBadgePill: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  splashBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 1.5,
  },
  splashDotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 40,
    alignItems: 'center',
  },
  splashDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  splashDotActive: {
    backgroundColor: '#FFFFFF',
    width: 22,
  },
  authBackdropAmbient1: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  authBackdropAmbient2: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(185, 28, 43, 0.12)',
  },

  // ── Animated login background (slow corporate motion) ───────────────
  authAmbientOrbA: {
    position: 'absolute',
    top: -100,
    right: -110,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(94, 129, 172, 0.14)',
  },
  authAmbientOrbB: {
    position: 'absolute',
    bottom: -120,
    left: -110,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(185, 28, 43, 0.13)',
  },
  authBreathingGlow: {
    position: 'absolute',
    top: '18%',
    alignSelf: 'center',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.045)',
  },
  configHideToggle: {
    marginTop: 10,
    alignItems: 'center',
  },
  configHideToggleText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    fontWeight: '600',
  },
  authScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loginLogoHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  loginLogoRing: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
  loginLogoImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  loginLogoRingTouch: {
    borderRadius: 9999,
  },
  loginBrandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2.5,
  },
  loginPillBadge: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  loginPillBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 1,
  },
  liquidGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  liquidGlassTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  liquidGlassTitleCentered: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  liquidGlassSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    marginBottom: 20,
  },
  liquidGlassSubtitleCentered: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 19,
  },
  liquidInputGroup: {
    marginBottom: 14,
  },
  liquidInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  liquidPillInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 9999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
  },
  liquidPillInputSmall: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  liquidPrimaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  liquidPrimaryButtonText: {
    color: '#0F1F3D',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  liquidGlassSubbox: {
    marginTop: 14,
    padding: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  configToggle: {
    marginTop: 16,
    alignItems: 'center',
  },
  configToggleText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  configSaveBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 8,
    borderRadius: 9999,
    alignItems: 'center',
  },
  configSaveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Standard Form Inputs (used across customer, settings and legacy views)
  inputGroup: {
    marginBottom: 14,
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
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
  },
  primaryButton: {
    backgroundColor: '#0F1F3D',
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // App Layout & Floating Header
  appContainer: {
    flex: 1,
    backgroundColor: '#EEF1F6',
  },
  appAmbientGlow1: {
    position: 'absolute',
    top: -140,
    right: -120,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(15, 31, 61, 0.08)',
  },
  appAmbientGlow2: {
    position: 'absolute',
    bottom: -160,
    left: -140,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(185, 28, 43, 0.05)',
  },
  appAmbientGlow1Dark: {
    backgroundColor: 'rgba(94, 129, 172, 0.10)',
  },
  appAmbientGlow2Dark: {
    backgroundColor: 'rgba(185, 28, 43, 0.10)',
  },
  topBarWrapper: {
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'android' ? 8 : 4,
    paddingBottom: 4,
    backgroundColor: 'transparent',
  },
  topBarGlassPill: {
    backgroundColor: 'rgba(15, 31, 61, 0.55)',
    borderRadius: 9999,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  topBarLogoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  brandTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  brandTagText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  adminName: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  logoutIconButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  logoutIconText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  mainContent: {
    flex: 1,
  },

  // Floating Capsule Navigation Bar (iOS 18 Liquid Glass)
  floatingNavWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 14,
    left: 14,
    right: 14,
    alignItems: 'center',
  },
  liquidGlassNavPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 31, 61, 0.55)',
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    width: '100%',
    justifyContent: 'space-between',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 9999,
  },
  tabItemActivePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  tabIcon: {
    fontSize: 17,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
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
  // Dashboard Welcome Header (iOS Liquid Glass aesthetic)
  dashboardWelcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  systemOnlinePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: 8,
  },
  systemOnlineText: {
    color: '#03543F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  dashboardWelcomeTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  dashboardWelcomeSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },

  metricGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  metricCardRounded: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  metricBadgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metricEmeraldPill: {
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  metricEmeraldPillText: {
    color: '#03543F',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metricCrimsonPill: {
    backgroundColor: '#FDE8E8',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  metricCrimsonPillText: {
    color: '#9B1C1C',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  metricValueLarge: {
    fontSize: 18,
    fontWeight: '900',
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
    marginBottom: 16,
  },
  miniCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  miniCardRounded: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  miniCardValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  miniCardLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },

  // Storefront Hero Banner Card on Dashboard
  heroBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  heroBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroBannerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  heroBannerLiveBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: '#DEF7EC',
  },
  heroBannerLiveText: {
    color: '#03543F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroBannerInactiveBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: '#F3F4F6',
  },
  heroBannerInactiveText: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '800',
  },
  heroBannerImgWrapper: {
    width: '100%',
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0F1F3D',
    position: 'relative',
    marginBottom: 12,
  },
  heroBannerImg: {
    width: '100%',
    height: '100%',
  },
  heroBannerOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  heroBannerHeadlinePill: {
    backgroundColor: 'rgba(15, 31, 61, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  heroBannerHeadlineText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  heroBannerActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroBannerChangeBtn: {
    flex: 1,
    backgroundColor: '#0F1F3D',
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  heroBannerChangeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroBannerRemoveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 9999,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBannerRemoveBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },
  heroBannerEmptyBox: {
    width: '100%',
    paddingVertical: 26,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  heroBannerEmptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
    marginTop: 8,
  },
  heroBannerEmptySub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  heroBannerUploadBtn: {
    marginTop: 14,
    backgroundColor: '#0F1F3D',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  heroBannerUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroBannerSettingsBtn: {
    backgroundColor: '#0F1F3D',
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBannerSettingsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Quick Action Buttons (More Rounded Corners)
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  quickActionBtn: {
    width: (Dimensions.get('window').width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionBtnRounded: {
    width: (Dimensions.get('window').width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
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
    fontWeight: '800',
    color: '#111827',
  },
  quickActionSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  // Hero Banner Modal Styles
  bannerModalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  bannerModalHeader: {
    backgroundColor: '#0F1F3D',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerModalCloseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  bannerModalCloseText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bannerModalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  bannerSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  bannerSectionCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  bannerPreviewBox: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0F1F3D',
    position: 'relative',
    marginBottom: 10,
  },
  bannerPreviewOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  bannerSubheadingPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bannerSubheadingText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bannerHeadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  bannerCtaPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  bannerCtaText: {
    color: '#0F1F3D',
    fontSize: 11,
    fontWeight: '900',
  },
  heroBannerModalRemoveBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  heroBannerModalRemoveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },

  // Orders (Liquid Glass + One UI 8.5)
  filterScrollWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: '#0F1F3D',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 14,
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusBadgeText: {
    fontSize: 11,
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
  modalCloseCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderDeleteMiniPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  orderDeleteMiniPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusBtnCurrent: {
    backgroundColor: '#0F1F3D',
    borderColor: '#0F1F3D',
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
  // ── Pillar Cards (Card-based navigation & hierarchy) ────────────────
  pillarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  pillarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  pillarIcon: {
    fontSize: 18,
  },
  pillarTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    flex: 1,
  },
  pillarMetaBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  pillarMetaBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#374151',
    letterSpacing: 0.5,
  },
  pillarSubRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  pillSubCardGrow: {
    flex: 1,
    marginBottom: 0,
  },
  merchSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subCardPillInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
  },
  pillSubCardHelper: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 6,
    fontWeight: '500',
  },

  // ── Standalone Search Category component ───────────────────────────
  taxonomySearchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 18,
    height: 52,
    marginBottom: 16,
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },
  taxonomySearchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  taxonomySearchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    paddingVertical: 0,
  },
  taxonomySearchClear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taxonomySearchClearText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
  },

  pillSubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  pillSubCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  pillAddRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  pillAddInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 12,
    color: '#111827',
  },
  catChoiceBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  catChoiceBtnActive: {
    backgroundColor: '#0F1F3D',
    borderColor: '#0F1F3D',
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  catChoiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  catChoiceTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Customers
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
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
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3730A3',
  },

  // Payments
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
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
    paddingVertical: 10,
    borderRadius: 9999,
    alignItems: 'center',
  },
  paymentApproveText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  paymentRejectBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 9999,
    alignItems: 'center',
  },
  paymentRejectText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },

  // Settings
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
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
    borderRadius: 9999,
    alignItems: 'center',
  },
  logoutDangerText: {
    color: '#DC2626',
    fontWeight: '800',
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

  // Enhanced Product Styles
  productImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  productCardImage: {
    width: 68,
    height: 78,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  productNoImage: {
    width: 68,
    height: 78,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#B91C2B',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  productSkuText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  productActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  productEditBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  productEditBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  productDeleteBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  productDeleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Form helpers
  effectivePriceBox: {
    backgroundColor: '#DEF7EC',
    padding: 12,
    borderRadius: 9999,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  effectivePriceText: {
    color: '#03543F',
    fontWeight: '700',
    fontSize: 13,
  },
  chipToggle: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipToggleActive: {
    backgroundColor: '#0F1F3D',
    borderColor: '#0F1F3D',
  },
  chipToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  chipToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  presetColorChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  presetColorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  selectedColorChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#E0E7FF',
  },
  selectedColorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3730A3',
  },
  addMiniBtn: {
    backgroundColor: '#0F1F3D',
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMiniBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  uploadActionBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptyImgPlaceholder: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  imagePreviewThumb: {
    position: 'relative',
    width: 80,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewThumbImg: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  primaryImgTag: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: '#10B981',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  primaryImgTagText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  removeImgBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  switchSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },

  // ----------------------------------------------------
  // SAMSUNG ONE UI 8.5 PRODUCT CATALOG & CARD STYLES
  // ----------------------------------------------------
  catalogHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 16,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  oneUiCatalogBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  catalogMetricPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  catalogMetricPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#374151',
    letterSpacing: 0.5,
  },
  catalogInStockPill: {
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  catalogInStockPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#03543F',
    letterSpacing: 0.5,
  },
  catalogHeroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  catalogHeroSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // One UI Search Row
  oneUiSearchRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 8,
  },
  oneUiSearchPillWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 48,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  searchIconFine: {
    fontSize: 15,
    marginRight: 8,
  },
  oneUiSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: 4,
  },
  searchClearBtnText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  oneUiAddProductBtn: {
    backgroundColor: '#0F1F3D',
    borderRadius: 9999,
    paddingHorizontal: 18,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  oneUiAddProductBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // One UI Horizontal Filter Strips
  oneUiFilterScrollWrapper: {
    backgroundColor: '#F8F9FB',
    paddingVertical: 4,
  },
  oneUiFilterBar: {
    paddingHorizontal: 14,
    gap: 8,
  },
  oneUiFilterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  oneUiFilterPillActive: {
    backgroundColor: '#0F1F3D',
    borderColor: '#0F1F3D',
  },
  oneUiFilterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  oneUiFilterPillTextActive: {
    color: '#FFFFFF',
  },
  oneUiStatusChip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  oneUiStatusChipActive: {
    backgroundColor: '#0F1F3D',
  },
  oneUiStatusChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  oneUiStatusChipTextActive: {
    color: '#FFFFFF',
  },

  // One UI 8.5 Ultra-Premium Product Card
  oneUiProductCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  oneUiProductHeroCanvas: {
    width: '100%',
    height: 245,
    backgroundColor: '#F8F9FC',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  oneUiProductContainImg: {
    width: '100%',
    height: '100%',
  },
  oneUiDiscountPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#B91C2B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    shadowColor: '#B91C2B',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  oneUiDiscountPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  oneUiStatusPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    zIndex: 10,
  },
  oneUiStatusPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  oneUiPhotoCountPill: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    backgroundColor: 'rgba(15, 31, 61, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  oneUiPhotoCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  oneUiCategoryTagPill: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  oneUiCategoryTagText: {
    color: '#0F1F3D',
    fontSize: 10,
    fontWeight: '800',
  },

  // One UI Product Card Body
  oneUiProductBody: {
    padding: 18,
  },
  oneUiBrandEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  oneUiProductTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 22,
  },
  oneUiPricingStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  oneUiPriceBold: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F1F3D',
  },
  oneUiOriginalPriceStrike: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  oneUiVariantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  oneUiVariantLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  oneUiMiniVariantPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  oneUiMiniVariantText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
  },

  // One UI Card Action Buttons
  oneUiCardActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  oneUiPrimaryEditBtn: {
    flex: 1,
    backgroundColor: '#0F1F3D',
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 46,
  },
  oneUiPrimaryEditBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  oneUiDeleteActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oneUiDeleteActionBtnText: {
    fontSize: 16,
  },

  // Legacy fallback styles for compatibility
  searchBarPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    fontSize: 13,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addFabPill: {
    backgroundColor: '#0F1F3D',
    paddingHorizontal: 16,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  addFabPillText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  productGlassCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  productCardTopHero: {
    width: '100%',
    height: 230,
    backgroundColor: '#F3F4F6',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  productCardFullImage: {
    width: '100%',
    height: '100%',
  },
  productNoImageHero: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  discountPillBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#B91C2B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    zIndex: 10,
  },
  discountPillBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  statusPillFloat: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    zIndex: 10,
  },
  statusPillFloatText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  productCardContentBody: {
    padding: 16,
  },
  productTitleBold: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  productSubtextMuted: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  productCardPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  productPriceLarge: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F1F3D',
  },
  productSkuFine: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 1,
  },
  stockStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  stockStatusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  productCardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  oneUiActionBtn: {
    flex: 2,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oneUiActionBtnText: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '700',
  },
  oneUiDeleteBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oneUiDeleteBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },

  // Premium Modal Form
  premiumModalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  premiumModalHeader: {
    backgroundColor: '#0F1F3D',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  premiumHeaderCloseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  premiumHeaderCloseText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  premiumHeaderTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  premiumHeaderSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 1,
  },
  quickFillHeaderBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  quickFillHeaderText: {
    color: '#0F1F3D',
    fontSize: 11,
    fontWeight: '900',
  },
  premiumScrollBody: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  stepBannerCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },

  // Stepper Capsule Bar
  stepperBarWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 6,
  },
  stepCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  stepCapsuleActive: {
    backgroundColor: '#0F1F3D',
  },
  stepCapsulePassed: {
    backgroundColor: '#DEF7EC',
  },
  stepCapsuleIcon: {
    fontSize: 11,
  },
  stepCapsuleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  stepCapsuleTextActive: {
    color: '#FFFFFF',
  },
  stepCardSection: {
    paddingBottom: 24,
  },
  stepSectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  stepSectionHelp: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  bigPhotoUploadTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  bigPhotoTileTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
  },
  bigPhotoTileSub: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  uploadingNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 12,
    marginVertical: 8,
  },
  uploadingNoticeText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  liquidPillInputDark: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
  },
  addPillMiniBtn: {
    backgroundColor: '#0F1F3D',
    borderRadius: 9999,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPillMiniBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  photoCountHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 10,
    marginBottom: 8,
  },
  emptyPhotoState: {
    paddingVertical: 32,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyPhotoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 6,
  },
  emptyPhotoSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  photoThumbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoThumbItem: {
    width: (Dimensions.get('window').width - 60) / 3,
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoThumbItemCover: {
    borderColor: '#0F1F3D',
    borderWidth: 2.5,
  },
  photoThumbImg: {
    width: '100%',
    height: '100%',
  },
  coverPillBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: '#0F1F3D',
    paddingVertical: 2,
    borderRadius: 9999,
    alignItems: 'center',
  },
  coverPillBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  makeCoverHint: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 2,
    borderRadius: 9999,
    alignItems: 'center',
  },
  makeCoverHintText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  removePhotoCircle: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  inlineValidationWarn: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 3,
    marginLeft: 4,
  },
  reviewSummaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  reviewSummaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  reviewSummaryDetails: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
    fontWeight: '500',
  },

  // Thumb-zone Bottom Bar (Samsung One UI)
  oneUiStickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  stepperBackBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  stepperBackBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  stepperNextBtn: {
    backgroundColor: '#0F1F3D',
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  stepperNextBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  stepperPublishBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  stepperPublishBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // ── Page One Split Layout ──────────────────────────────────────────
  pageOnePhotoHeroCard: {
    height: 240,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoStripHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stackedFieldsCol: {
    gap: 4,
    marginTop: 4,
  },
  titleInputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 9999,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    minHeight: 56,
    textAlignVertical: 'center',
  },
  charCountHint: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'right',
    fontWeight: '600',
  },
  photoCardCoverBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(15,31,61,0.85)',
    paddingVertical: 3,
    borderRadius: 9999,
    alignItems: 'center',
  },
  photoCardCoverBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  photoCardTapOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 3,
    borderRadius: 9999,
    alignItems: 'center',
  },
  photoCardTapOverlayText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  pageOneEmptyPhotoPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  pageOneUploadHint: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  pageOneCameraCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageOneTapTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
  },
  pageOneTapSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // ── Additional Photos Row ──────────────────────────────────────────
  additionalPhotosWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  additionalPhotosCountText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  addAnotherPhotoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1F3D',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    gap: 4,
  },
  addAnotherPhotoPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  miniPhotoThumbWrap: {
    position: 'relative',
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  miniPhotoThumb: {
    width: '100%',
    height: '100%',
  },
  miniPhotoRemoveBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPhotoRemoveText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  miniCoverDot: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },

  // ── Direct URL Input ──────────────────────────────────────────────
  directUrlBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  directUrlInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 12,
    color: '#111827',
  },
  directUrlAddBtn: {
    backgroundColor: '#0F1F3D',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  directUrlAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Samsung Gallery One UI 9 — Products Grid
  galleryGridColumnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  galleryGridCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  galleryGridHeroCanvas: {
    width: '100%',
    height: 170,
    backgroundColor: '#F3F4F6',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryGridContainImg: {
    width: '100%',
    height: '100%',
  },
  galleryDiscountPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#B91C2B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    zIndex: 10,
  },
  galleryDiscountPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  galleryStatusDotPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    zIndex: 10,
  },
  galleryStatusDotText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  galleryPhotoCountBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    zIndex: 10,
  },
  galleryPhotoCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  galleryCardBody: {
    padding: 12,
  },
  galleryBrandEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  galleryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 18,
  },
  galleryPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 6,
  },
  galleryPriceBold: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F1F3D',
  },
  galleryOrigPrice: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  galleryStockBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    marginTop: 8,
  },
  galleryStockBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // Samsung One UI 9 — Product Detail Sheet
  productDetailModalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  productDetailHeaderBar: {
    backgroundColor: '#0F1F3D',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  productDetailBackBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  productDetailBackBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  productDetailHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  productDetailHeaderSub: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 1,
  },
  detailHeaderEditPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  detailHeaderEditPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  detailPhotoHeroWrapper: {
    width: '100%',
    height: 340,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  detailHeroImage: {
    width: '100%',
    height: '100%',
  },
  detailHeroNoImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  detailDiscountBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#B91C2B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    zIndex: 10,
  },
  detailDiscountBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  detailStatusBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    zIndex: 10,
  },
  detailStatusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  detailThumbnailStrip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  detailThumbWrap: {
    width: 64,
    height: 64,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 3,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  detailThumbWrapActive: {
    borderColor: '#0F1F3D',
  },
  detailThumbImg: {
    width: '100%',
    height: '100%',
  },
  detailContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginHorizontal: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  detailBrandEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailTitleText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    marginTop: 4,
    lineHeight: 26,
  },
  detailPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailPriceBold: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F1F3D',
  },
  detailOrigPriceStrike: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  detailSkuFine: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 3,
    fontWeight: '600',
  },
  detailStockPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  detailStockPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  detailSectionBlock: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailSizeChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailSizeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  detailColorChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailColorChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  detailDescriptionBody: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
  },
  detailCareBody: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
  },
  detailHighlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  highlightPillGold: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  highlightPillGoldText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  highlightPillCrimson: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  highlightPillCrimsonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
  },
  detailBottomDeleteBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  detailBottomDeleteText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  detailBottomEditBtn: {
    flex: 2,
    backgroundColor: '#0F1F3D',
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    shadowColor: '#0F1F3D',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  detailBottomEditText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

// ---------------------------------------------------------------------------
// DYNAMIC THEME OVERLAY — re-tints key surfaces for Dark Mode while leaving
// the static light stylesheet as the base. Light mode returns empty overrides.
// ---------------------------------------------------------------------------
function createThemedStyles(p: ThemePalette) {
  if (!p.isDark) return {} as Record<string, object>;
  return StyleSheet.create({
    // App chrome
    appContainer: { backgroundColor: p.background },
    tabLoaderText: { color: p.textMuted },

    // Pillar & sub-card system
    pillarCard: { backgroundColor: p.surface, borderColor: p.hairline, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 18 },
    pillarTitle: { color: p.textPrimary },
    pillarMetaBadge: { backgroundColor: p.chip },
    pillarMetaBadgeText: { color: p.textSecondary },
    pillSubCard: { backgroundColor: p.field, borderColor: p.border },
    pillSubCardLabel: { color: p.textMuted },
    pillSubCardHelper: { color: p.textFaint },
    subCardPillInput: { backgroundColor: p.container, borderColor: p.borderStrong, color: p.textPrimary },
    pillAddInput: { backgroundColor: p.container, borderColor: p.borderStrong, color: p.textPrimary },
    taxonomySearchShell: { backgroundColor: p.surface, borderColor: p.border, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 18 },
    taxonomySearchInput: { color: p.textPrimary },
    taxonomySearchClear: { backgroundColor: p.chip },

    // Chips & toggles
    catChoiceBtn: { backgroundColor: p.container, borderColor: p.border },
    catChoiceText: { color: p.textSecondary },
    chipToggle: { backgroundColor: p.container, borderColor: p.border },
    chipToggleText: { color: p.textSecondary },
    effectivePriceBox: { backgroundColor: p.emeraldBg },
    effectivePriceText: { color: p.emeraldText },

    // Section / banner cards & inputs
    stepBannerCard: { backgroundColor: p.surface, borderColor: p.border },
    stepSectionHeader: { color: p.textPrimary },
    stepSectionHelp: { color: p.textMuted },
    liquidPillInputDark: { backgroundColor: p.container, borderColor: p.borderStrong, color: p.textPrimary },
    titleInputField: { backgroundColor: p.container, borderColor: p.borderStrong, color: p.textPrimary },
    inputLabel: { color: p.textMuted },
    inputGroup: {},

    // List cards & headers
    catalogHeroCard: { backgroundColor: p.surface, borderColor: p.hairline, shadowColor: '#000', shadowOpacity: 0.3 },
    catalogHeroTitle: { color: p.textPrimary },
    catalogHeroSub: { color: p.textMuted },
    catalogMetricPill: { backgroundColor: p.chip },
    catalogMetricPillText: { color: p.textSecondary },
    catalogInStockPill: { backgroundColor: p.emeraldBg },
    catalogInStockPillText: { color: p.emeraldText },
    oneUiSearchPillWrapper: { backgroundColor: p.surface, borderColor: p.border },
    oneUiSearchInput: { color: p.textPrimary },
    oneUiFilterScrollWrapper: { backgroundColor: p.background },
    oneUiFilterPill: { backgroundColor: p.surface, borderColor: p.border },
    oneUiFilterPillText: { color: p.textSecondary },
    galleryGridCard: { backgroundColor: p.surface, borderColor: p.hairline, shadowColor: '#000', shadowOpacity: 0.35 },
    galleryGridHeroCanvas: { backgroundColor: p.container },
    galleryBrandEyebrow: { color: p.textFaint },
    galleryTitle: { color: p.textPrimary },
    galleryPriceBold: { color: p.textPrimary },
    galleryOrigPrice: { color: p.textFaint },
    galleryStockBadge: {},

    // Orders / payments / customers
    orderCard: { backgroundColor: p.surface, borderColor: p.hairline, shadowColor: '#000', shadowOpacity: 0.3 },
    orderNumber: { color: p.textPrimary },
    orderCustomer: { color: p.textSecondary },
    orderMeta: { color: p.textMuted },
    orderTotal: { color: p.textPrimary },
    modalSheet: { backgroundColor: p.surface },
    modalTitle: { color: p.textPrimary },
    modalSection: { backgroundColor: p.container },
    modalText: { color: p.textSecondary },
    modalSectionTitle: { color: p.textMuted },
    modalValueHigh: { color: p.textPrimary },
    itemName: { color: p.textPrimary },
    itemSub: { color: p.textMuted },
    itemPrice: { color: p.textPrimary },
    statusBtn: { backgroundColor: p.surface, borderColor: p.border },
    statusBtnText: { color: p.textSecondary },
    filterScrollWrapper: { backgroundColor: p.surface, borderBottomColor: p.border },
    filterChip: { backgroundColor: p.chip },
    filterChipText: { color: p.textSecondary },
    customerCard: { backgroundColor: p.surface },
    customerName: { color: p.textPrimary },
    customerEmail: { color: p.textMuted },
    paymentCard: { backgroundColor: p.surface, borderColor: p.hairline },
    paymentOrder: { color: p.textPrimary },

    // Settings & dashboard
    cardSection: { backgroundColor: p.surface, borderColor: p.hairline },
    cardSectionTitle: { color: p.textPrimary },
    sectionTitle: { color: p.textPrimary },
    sectionSubtitle: { color: p.textMuted },
    textInput: { backgroundColor: p.container, borderColor: p.borderStrong, color: p.textPrimary },
    dashboardWelcomeCard: { backgroundColor: p.surface, borderColor: p.hairline, shadowColor: '#000', shadowOpacity: 0.3 },
    dashboardWelcomeTitle: { color: p.textPrimary },
    dashboardWelcomeSub: { color: p.textMuted },
    metricCardRounded: { backgroundColor: p.surface, borderColor: p.hairline, shadowColor: '#000', shadowOpacity: 0.3 },
    metricLabel: { color: p.textMuted },
    metricValueLarge: { color: p.textPrimary },
    miniCardRounded: { backgroundColor: p.surface, borderColor: p.hairline },
    miniCardValue: { color: p.textPrimary },
    miniCardLabel: { color: p.textMuted },
    quickActionBtnRounded: { backgroundColor: p.surface, borderColor: p.hairline, shadowColor: '#000', shadowOpacity: 0.3 },
    quickActionTitle: { color: p.textPrimary },
    quickActionSub: { color: p.textMuted },
    heroBannerCard: { backgroundColor: p.surface, borderColor: p.hairline, shadowColor: '#000', shadowOpacity: 0.3 },
    heroBannerTitle: { color: p.textPrimary },
    bannerSectionCard: { backgroundColor: p.surface, borderColor: p.border },
    bannerSectionCardTitle: { color: p.textPrimary },

    // Detail sheet & misc chrome
    productDetailModalContainer: { backgroundColor: p.background },
    premiumModalContainer: { backgroundColor: p.background },
    detailContentCard: { backgroundColor: p.surface, borderColor: p.border },
    detailTitleText: { color: p.textPrimary },
    detailBrandEyebrow: { color: p.textFaint },
    detailSectionLabel: { color: p.textMuted },
    detailDescriptionBody: { color: p.textSecondary },
    detailCareBody: { color: p.textSecondary },
    detailThumbWrap: { backgroundColor: p.surface, borderColor: p.border },
    detailHeroNoImage: { backgroundColor: p.container },
    switchRow: { backgroundColor: p.surface, borderColor: p.border },
    switchLabel: { color: p.textPrimary },
    switchSub: { color: p.textMuted },
    reviewSummaryCard: { backgroundColor: p.surface, borderColor: p.border },
    reviewSummaryTitle: { color: p.textPrimary },
    reviewSummaryDetails: { color: p.textMuted },
    oneUiStickyBottomBar: { backgroundColor: p.surface, borderTopColor: p.border },
    stepperBackBtn: { backgroundColor: p.chip },
    stepperBackBtnText: { color: p.textSecondary },
    emptyView: {},
    emptyTitle: { color: p.textSecondary },
    emptySubtitle: { color: p.textFaint },
    charCountHint: { color: p.textFaint },
    directUrlAddBtn: { backgroundColor: p.navy },
    addPillMiniBtn: { backgroundColor: p.navy },
    addAnotherPhotoPill: { backgroundColor: p.navy },
    stepCapsule: { backgroundColor: p.chip },
    stepCapsuleText: { color: p.textMuted },
    stepperBarWrapper: { backgroundColor: p.surface, borderBottomColor: p.border },
  });
}
