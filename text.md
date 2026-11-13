# React Native Expo Conversion

I'll convert your web app to React Native Expo. Since you want plain CSS logic (no frameworks), I'll use React Native's `StyleSheet` API which is the native way of styling in React Native. I'll structure this as a complete mobile app.

## Project Structure

```
library-app/
├── App.js
├── app.json
├── package.json
├── src/
│   ├── context/
│   │   └── AuthContext.js
│   ├── services/
│   │   └── api.js
│   ├── components/
│   │   ├── Navbar.js
│   │   ├── Loading.js
│   │   ├── Auth/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── ForgotPassword.js
│   │   │   └── VerifyEmail.js
│   │   ├── Books/
│   │   │   ├── BookList.js
│   │   │   └── BookDetails.js
│   │   ├── Borrowings/
│   │   │   └── MyBorrowings.js
│   │   ├── Reservations/
│   │   │   └── ReservationList.js
│   │   └── Admin/
│   │       ├── Dashboard.js
│   │       ├── BookManagement.js
│   │       ├── UserManagement.js
│   │       ├── FineManagement.js
│   │       ├── ReservationManagement.js
│   │       └── AllBorrowings.js
│   └── screens/
│       ├── UserDashboard.js
│       └── UserProfile.js
└── navigation/
    └── AppNavigator.js
```

## 1. `package.json`

```json
{
  "name": "library-app",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~51.0.0",
    "expo-status-bar": "~1.12.1",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "@react-navigation/native": "^6.1.17",
    "@react-navigation/native-stack": "^6.9.26",
    "@react-navigation/bottom-tabs": "^6.5.20",
    "@react-native-async-storage/async-storage": "1.23.1",
    "axios": "^1.7.2",
    "react-native-safe-area-context": "4.10.5",
    "react-native-screens": "3.31.1",
    "react-native-gesture-handler": "~2.16.1",
    "react-native-vector-icons": "^10.1.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0"
  },
  "private": true
}
```

## 2. `app.json`

```json
{
  "expo": {
    "name": "University Library",
    "slug": "university-library",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "assetBundlePatterns": ["**/*"],
    "ios": { "supportsTablet": true },
    "android": { "adaptiveIcon": { "backgroundColor": "#4f46e5" } }
  }
}
```

## 3. `src/services/api.js`

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: On Android emulator use http://10.0.2.2:5000/api
// On iOS simulator use http://localhost:5000/api
// On physical device use your computer's LAN IP e.g. http://192.168.1.10:5000/api
const API_URL = 'http://10.0.2.2:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        const { accessToken } = response.data;
        await AsyncStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
};

export const booksAPI = {
  getAll: (params) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
  add: (bookData) => api.post('/books', bookData),
  update: (id, bookData) => api.put(`/books/${id}`, bookData),
  delete: (id) => api.delete(`/books/${id}`),
  getCategories: () => api.get('/books/categories/all'),
};

export const borrowingsAPI = {
  borrow: (bookId) => api.post('/borrowings/borrow', { bookId }),
  return: (borrowingId) => api.post(`/borrowings/return/${borrowingId}`),
  renew: (borrowingId) => api.post(`/borrowings/renew/${borrowingId}`),
  getMyBorrowings: (params) => api.get('/borrowings/my-borrowings', { params }),
  getAll: (params) => api.get('/borrowings/all', { params }),
};

export const reservationsAPI = {
  create: (bookId) => api.post('/reservations', { bookId }),
  getMyReservations: (params) => api.get('/reservations/my-reservations', { params }),
  cancel: (id) => api.put(`/reservations/${id}/cancel`),
  getAll: (params) => api.get('/reservations/all', { params }),
  fulfill: (id) => api.put(`/reservations/${id}/fulfill`),
  checkExpired: () => api.post('/reservations/check-expired'),
  getStats: () => api.get('/reservations/stats'),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  sendOverdueReminders: () => api.post('/admin/send-overdue-reminders'),
  getFines: (params) => api.get('/admin/fines', { params }),
  payFine: (id) => api.put(`/admin/fines/${id}/pay`),
};

export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  getBorrowingHistory: (params) => api.get('/users/borrowing-history', { params }),
  getFines: (params) => api.get('/users/fines', { params }),
  getDashboard: () => api.get('/users/dashboard'),
  deleteAccount: () => api.delete('/users/account'),
};

export default api;
```

## 4. `src/context/AuthContext.js`

```javascript
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        await fetchUser();
      } else {
        setLoading(false);
      }
    })();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.data.success) {
        const u = response.data.user;
        setUser({
          id: u.id,
          email: u.email,
          firstName: u.first_name,
          lastName: u.last_name,
          role: u.role,
          studentId: u.student_id,
          department: u.department,
          isVerified: u.is_verified,
        });
      }
    } catch (error) {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { accessToken, refreshToken, user: userData } = response.data;
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    return response.data;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user,
    refreshUser: fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

## 5. `src/components/Loading.js`

```javascript
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const Loading = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#4f46e5" />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
});

export default Loading;
```

## 6. `src/components/Navbar.js`

```javascript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ navigation, currentRoute }) => {
  const { user, logout, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const go = (route) => {
    setMenuOpen(false);
    navigation.navigate(route);
  };

  const menuItems = isAdmin
    ? [
        { label: 'Dashboard', route: 'AdminDashboard' },
        { label: 'Books', route: 'BookManagement' },
        { label: 'Users', route: 'UserManagement' },
        { label: 'Borrowings', route: 'AllBorrowings' },
        { label: 'Reservations', route: 'ReservationManagement' },
        { label: 'Fines', route: 'FineManagement' },
      ]
    : [
        { label: 'Dashboard', route: 'UserDashboard' },
        { label: 'Browse Books', route: 'BookList' },
        { label: 'My Borrowings', route: 'MyBorrowings' },
        { label: 'My Reservations', route: 'ReservationList' },
      ];

  return (
    <>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => go(isAdmin ? 'AdminDashboard' : 'UserDashboard')}>
          <Text style={styles.brand}>📚 Library</Text>
        </TouchableOpacity>
        <View style={styles.right}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.firstName?.charAt(0) || 'U'}</Text>
          </View>
          <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuBtn}>
            <Text style={styles.menuBtnText}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={menuOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBg}
            activeOpacity={1}
            onPress={() => setMenuOpen(false)}
          />
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.menuEmail}>{user?.email}</Text>
              <View style={[styles.roleBadge, isAdmin ? styles.roleAdmin : styles.roleUser]}>
                <Text style={styles.roleText}>{user?.role}</Text>
              </View>
            </View>
            <ScrollView>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.route}
                  style={[
                    styles.menuItem,
                    currentRoute === item.route && styles.menuItemActive,
                  ]}
                  onPress={() => go(item.route)}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      currentRoute === item.route && styles.menuItemTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.menuItem} onPress={() => go('UserProfile')}>
                <Text style={styles.menuItemText}>My Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
  },
  brand: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  right: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#818cf8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: { color: '#fff', fontWeight: 'bold' },
  menuBtn: { padding: 4 },
  menuBtnText: { color: '#fff', fontSize: 24 },
  modalOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalBg: { flex: 1 },
  menuContainer: {
    width: '75%',
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  menuHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 12,
    marginBottom: 12,
  },
  menuName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  menuEmail: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 6,
  },
  roleAdmin: { backgroundColor: '#ede9fe' },
  roleUser: { backgroundColor: '#dcfce7' },
  roleText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  menuItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuItemActive: { backgroundColor: '#eef2ff' },
  menuItemText: { fontSize: 15, color: '#374151' },
  menuItemTextActive: { color: '#4f46e5', fontWeight: '600' },
  logoutText: { fontSize: 15, color: '#dc2626', fontWeight: '600' },
});

export default Navbar;
```

## 7. `src/components/Auth/Login.js`

```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) return setError('Enter a valid email');
    if (!password || password.length < 6) return setError('Password must be at least 6 characters');
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigation.reset({
        index: 0,
        routes: [{ name: user.role === 'admin' ? 'AdminDashboard' : 'UserDashboard' }],
      });
    } catch (e) {
      setError(e.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Text style={styles.logo}>📚</Text>
        <Text style={styles.title}>University Library</Text>
        <Text style={styles.subtitle}>Sign in to access your library account</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@university.edu"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.link}>Forgot your password?</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkBold}>Create one</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.demo}>
          <Text style={styles.demoTitle}>Demo Credentials</Text>
          <Text style={styles.demoText}>Admin: admin@university.edu / Admin123!</Text>
          <Text style={styles.demoText}>Student: student@university.edu / Student123!</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: '#eef2ff' },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 64, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: '#111827', marginTop: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#6b7280', marginTop: 6, marginBottom: 20 },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  errorText: { color: '#991b1b', fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  link: { color: '#4f46e5', textAlign: 'center', marginTop: 12, fontSize: 13, fontWeight: '500' },
  linkBold: { color: '#4f46e5', fontWeight: '600', fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { color: '#6b7280', fontSize: 13 },
  demo: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  demoTitle: { fontWeight: '600', color: '#1e40af', marginBottom: 4, fontSize: 13 },
  demoText: { color: '#1e40af', fontSize: 11, marginTop: 2 },
});

export default Login;
```

## 8. `src/components/Auth/Register.js`

```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../context/AuthContext';

const Register = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'student',
    studentId: '',
    department: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const update = (k, v) => {
    setFormData({ ...formData, [k]: v });
    if (error) setError('');
  };

  const validateStep1 = () => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.email.includes('@') || !formData.email.includes('.'))
      return 'Enter a valid email';
    return null;
  };

  const validateStep2 = () => {
    if (formData.password.length < 8) return 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password))
      return 'Must include uppercase, lowercase, and number';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const next = () => {
    const err = validateStep1();
    if (err) return setError(err);
    setStep(2);
  };

  const handleSubmit = async () => {
    const err = validateStep2();
    if (err) return setError(err);
    setLoading(true);
    try {
      const { confirmPassword, ...rest } = formData;
      const res = await register(rest);
      setSuccess(res.message || 'Registration successful! Check your email.');
      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }, 2500);
    } catch (e) {
      setError(e.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join the University Library</Text>

        <View style={styles.steps}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
            <Text style={styles.stepText}>1</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
            <Text style={styles.stepText}>2</Text>
          </View>
        </View>

        {success ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          {step === 1 && (
            <>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(v) => update('firstName', v)}
                placeholder="John"
              />
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(v) => update('lastName', v)}
                placeholder="Doe"
              />
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(v) => update('email', v)}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="john@university.edu"
              />
              <Text style={styles.label}>Role</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue={formData.role} onValueChange={(v) => update('role', v)}>
                  <Picker.Item label="Student" value="student" />
                  <Picker.Item label="Staff" value="staff" />
                </Picker>
              </View>
              <Text style={styles.label}>
                {formData.role === 'student' ? 'Student ID' : 'Staff ID'}
              </Text>
              <TextInput
                style={styles.input}
                value={formData.studentId}
                onChangeText={(v) => update('studentId', v)}
                placeholder="Enter your ID"
              />
              <Text style={styles.label}>Department</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={formData.department}
                  onValueChange={(v) => update('department', v)}
                >
                  <Picker.Item label="Select Department" value="" />
                  <Picker.Item label="Computer Science" value="Computer Science" />
                  <Picker.Item label="Engineering" value="Engineering" />
                  <Picker.Item label="Business" value="Business" />
                  <Picker.Item label="Arts" value="Arts" />
                  <Picker.Item label="Sciences" value="Sciences" />
                  <Picker.Item label="Medicine" value="Medicine" />
                  <Picker.Item label="Law" value="Law" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              </View>

              <TouchableOpacity style={styles.button} onPress={next}>
                <Text style={styles.buttonText}>Next Step</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(v) => update('password', v)}
                secureTextEntry
                placeholder="Min. 8 characters"
              />
              <View style={styles.requirements}>
                <Text
                  style={[styles.req, formData.password.length >= 8 && styles.reqOk]}
                >
                  ✓ At least 8 characters
                </Text>
                <Text
                  style={[styles.req, /[A-Z]/.test(formData.password) && styles.reqOk]}
                >
                  ✓ One uppercase letter
                </Text>
                <Text
                  style={[styles.req, /[a-z]/.test(formData.password) && styles.reqOk]}
                >
                  ✓ One lowercase letter
                </Text>
                <Text style={[styles.req, /\d/.test(formData.password) && styles.reqOk]}>
                  ✓ One number
                </Text>
              </View>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={formData.confirmPassword}
                onChangeText={(v) => update('confirmPassword', v)}
                secureTextEntry
                placeholder="Re-enter password"
              />
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <Text style={styles.mismatch}>Passwords do not match</Text>
                )}

              <View style={styles.row}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                  <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.flex1, loading && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Create Account</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkBold}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: '#eef2ff' },
  container: { padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginTop: 20 },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: { backgroundColor: '#4f46e5' },
  stepText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  stepLine: { width: 60, height: 2, backgroundColor: '#e5e7eb', marginHorizontal: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  requirements: { marginTop: 8, marginBottom: 4 },
  req: { fontSize: 11, color: '#6b7280', marginBottom: 2 },
  reqOk: { color: '#16a34a', fontWeight: '600' },
  mismatch: { color: '#dc2626', fontSize: 11, marginTop: 4 },
  row: { flexDirection: 'row', gap: 10 },
  backBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  backBtnText: { color: '#374151', fontWeight: '600' },
  flex1: { flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { color: '#6b7280', fontSize: 13 },
  linkBold: { color: '#4f46e5', fontWeight: '600', fontSize: 13 },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  errorText: { color: '#991b1b', fontSize: 13 },
  successBox: {
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  successText: { color: '#166534', fontSize: 13 },
});

export default Register;
```

> **Note:** Add `@react-native-picker/picker` to package.json dependencies:
> `"@react-native-picker/picker": "2.7.5"`

## 9. `src/components/Auth/ForgotPassword.js`

```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { authAPI } from '../../services/api';

const ForgotPassword = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const submitEmail = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email);
      setSuccess(res.data.message || 'Reset link sent to email');
      setStep(2);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async () => {
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    if (newPassword.length < 8) return setError('Password must be at least 8 characters');
    setError('');
    setLoading(true);
    try {
      await authAPI.resetPassword(resetToken, newPassword);
      setSuccess('Password reset successful!');
      setTimeout(() => navigation.navigate('Login'), 2000);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.title}>
          {step === 1 ? 'Forgot Password?' : 'Reset Password'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 1
            ? 'Enter your email and we will send you a reset link'
            : 'Enter your reset token and new password'}
        </Text>

        {success ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          {step === 1 ? (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@university.edu"
              />
              <TouchableOpacity
                style={styles.button}
                onPress={submitEmail}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>← Back to login</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Reset Token</Text>
              <TextInput
                style={styles.input}
                value={resetToken}
                onChangeText={setResetToken}
                placeholder="Paste the token from email"
              />
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Min. 8 characters"
              />
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Re-enter new password"
              />
              <TouchableOpacity
                style={styles.button}
                onPress={submitReset}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep(1)}>
                <Text style={styles.link}>← Try a different email</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: '#eef2ff' },
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: '#111827' },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 6,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { color: '#4f46e5', textAlign: 'center', marginTop: 12, fontWeight: '500', fontSize: 13 },
  errorBox: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 6, marginBottom: 12 },
  errorText: { color: '#991b1b', fontSize: 13 },
  successBox: { backgroundColor: '#dcfce7', padding: 12, borderRadius: 6, marginBottom: 12 },
  successText: { color: '#166534', fontSize: 13 },
});

export default ForgotPassword;
```

## 10. `src/components/Auth/VerifyEmail.js`

```javascript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { authAPI } from '../../services/api';

const VerifyEmail = ({ route, navigation }) => {
  const { token } = route.params || {};
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await authAPI.verifyEmail(token);
        if (res.data.success) {
          setStatus('success');
          setMessage(res.data.message || 'Email verified!');
          setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }), 2500);
        } else {
          setStatus('error');
          setMessage(res.data.message || 'Verification failed');
        }
      } catch (e) {
        setStatus('error');
        setMessage('The link may be invalid or expired.');
      }
    })();
  }, [token]);

  return (
    <View style={styles.container}>
      {status === 'verifying' && (
        <>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.title}>Verifying Your Email</Text>
          <Text style={styles.subtitle}>Please wait...</Text>
        </>
      )}
      {status === 'success' && (
        <>
          <Text style={styles.bigIcon}>✅</Text>
          <Text style={styles.title}>Email Verified!</Text>
          <Text style={styles.subtitle}>{message}</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </>
      )}
      {status === 'error' && (
        <>
          <Text style={styles.bigIcon}>❌</Text>
          <Text style={styles.title}>Verification Failed</Text>
          <Text style={styles.subtitle}>{message}</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#eef2ff',
  },
  bigIcon: { fontSize: 64 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginTop: 12 },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 6, textAlign: 'center' },
  button: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});

export default VerifyEmail;
```

## 11. `src/components/Books/BookList.js`

```javascript
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { booksAPI, borrowingsAPI, reservationsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const BookList = ({ navigation }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { isAdmin } = useAuth();

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getAll({ page, limit: 12, search });
      setBooks(response.data.books);
      setTotalPages(response.data.pagination.totalPages);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchBooks();
  }, [page]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBooks();
  };

  const handleBorrow = async (bookId) => {
    try {
      const res = await borrowingsAPI.borrow(bookId);
      if (res.data.success) {
        Alert.alert('Success', 'Book borrowed successfully!');
        fetchBooks();
      } else {
        Alert.alert('Notice', res.data.message || 'Could not borrow');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Error borrowing book');
    }
  };

  const handleReserve = async (bookId) => {
    try {
      const res = await reservationsAPI.create(bookId);
      if (res.data.success) {
        Alert.alert('Success', 'Book reserved successfully!');
      } else {
        Alert.alert('Notice', res.data.message || 'Could not reserve');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Error reserving book');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cover}>
        <Text style={styles.coverIcon}>📖</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.bookAuthor}>by {item.author}</Text>
        <Text style={styles.bookIsbn}>ISBN: {item.isbn}</Text>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.badge,
              item.available_copies > 0 ? styles.badgeOk : styles.badgeNo,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                item.available_copies > 0 ? styles.badgeTextOk : styles.badgeTextNo,
              ]}
            >
              {item.available_copies > 0
                ? `${item.available_copies} Available`
                : 'Unavailable'}
            </Text>
          </View>
          {item.category ? <Text style={styles.category}>{item.category}</Text> : null}
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() => navigation.navigate('BookDetails', { id: item.id })}
          >
            <Text style={styles.detailBtnText}>Details</Text>
          </TouchableOpacity>
          {item.available_copies > 0 ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => handleBorrow(item.id)}
            >
              <Text style={styles.primaryBtnText}>Borrow</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.warnBtn}
              onPress={() => handleReserve(item.id)}
            >
              <Text style={styles.primaryBtnText}>Reserve</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Library Books</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search title, author, ISBN..."
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => {
              setPage(1);
              fetchBooks();
            }}
          />
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => {
              setPage(1);
              fetchBooks();
            }}
          >
            <Text style={styles.searchBtnText}>Go</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : books.length === 0 ? (
        <View style={styles.loader}>
          <Text style={styles.emptyText}>No books found</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  disabled={page === 1}
                  style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                  onPress={() => setPage(page - 1)}
                >
                  <Text style={styles.pageBtnText}>Previous</Text>
                </TouchableOpacity>
                <Text style={styles.pageText}>
                  {page} / {totalPages}
                </Text>
                <TouchableOpacity
                  disabled={page >= totalPages}
                  style={[
                    styles.pageBtn,
                    page >= totalPages && styles.pageBtnDisabled,
                  ]}
                  onPress={() => setPage(page + 1)}
                >
                  <Text style={styles.pageBtnText}>Next</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  searchBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  searchBtnText: { color: '#fff', fontWeight: '600' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#6b7280', fontSize: 14 },
  list: { padding: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cover: {
    backgroundColor: '#818cf8',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverIcon: { fontSize: 40 },
  cardBody: { padding: 12 },
  bookTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  bookAuthor: { fontSize: 13, color: '#4b5563', marginTop: 2 },
  bookIsbn: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeOk: { backgroundColor: '#dcfce7' },
  badgeNo: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextOk: { color: '#166534' },
  badgeTextNo: { color: '#991b1b' },
  category: { fontSize: 11, color: '#6b7280' },
  btnRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  detailBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  detailBtnText: { color: '#374151', fontSize: 13, fontWeight: '500' },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#4f46e5',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  warnBtn: {
    flex: 1,
    backgroundColor: '#f59e0b',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  pageBtn: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  pageBtnDisabled: { opacity: 0.5 },
  pageBtnText: { color: '#374151', fontSize: 13 },
  pageText: { color: '#6b7280', fontSize: 13 },
});

export default BookList;
```

## 12. `src/components/Books/BookDetails.js`

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { booksAPI, borrowingsAPI, reservationsAPI } from '../../services/api';

const BookDetails = ({ route, navigation }) => {
  const { id } = route.params;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);

  const fetchBook = async () => {
    try {
      const res = await booksAPI.getById(id);
      setBook(res.data.book);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBook();
  }, [id]);

  const handleBorrow = async () => {
    setBorrowing(true);
    try {
      const res = await borrowingsAPI.borrow(id);
      if (res.data.success) {
        Alert.alert(
          'Success',
          `Book borrowed! Due: ${new Date(res.data.dueDate).toLocaleDateString()}`
        );
        fetchBook();
      } else {
        Alert.alert('Notice', res.data.message);
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Error borrowing book');
    } finally {
      setBorrowing(false);
    }
  };

  const handleReserve = async () => {
    try {
      const res = await reservationsAPI.create(id);
      if (res.data.success) Alert.alert('Success', 'Book reserved successfully!');
      else Alert.alert('Notice', res.data.message);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Error reserving book');
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.loader}>
        <Text>Book not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const DetailRow = ({ label, value }) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || 'N/A'}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
        <Text style={styles.linkText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.cover}>
        <Text style={styles.coverIcon}>📖</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{book.title}</Text>

        <View
          style={[
            styles.availBadge,
            book.available_copies > 0 ? styles.availOk : styles.availNo,
          ]}
        >
          <Text
            style={[
              styles.availText,
              book.available_copies > 0 ? styles.availTextOk : styles.availTextNo,
            ]}
          >
            {book.available_copies > 0
              ? `${book.available_copies} of ${book.total_copies} available`
              : 'Currently unavailable'}
          </Text>
        </View>

        <DetailRow label="Author" value={book.author} />
        <DetailRow label="ISBN" value={book.isbn} />
        <DetailRow label="Publisher" value={book.publisher} />
        <DetailRow label="Publication Year" value={book.publication_year} />
        <DetailRow label="Edition" value={book.edition} />
        <DetailRow label="Category" value={book.category} />
        <DetailRow label="Shelf Location" value={book.shelf_location} />

        {book.description ? (
          <View style={styles.descBox}>
            <Text style={styles.rowLabel}>Description</Text>
            <Text style={styles.descText}>{book.description}</Text>
          </View>
        ) : null}

        {book.available_copies > 0 ? (
          <TouchableOpacity
            style={[styles.btn, borrowing && { opacity: 0.6 }]}
            onPress={handleBorrow}
            disabled={borrowing}
          >
            <Text style={styles.btnText}>
              {borrowing ? 'Processing...' : 'Borrow This Book'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.btn, styles.btnWarn]} onPress={handleReserve}>
            <Text style={styles.btnText}>Reserve This Book</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backLink: { padding: 16 },
  linkText: { color: '#4f46e5', fontSize: 14, fontWeight: '500' },
  cover: {
    backgroundColor: '#818cf8',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverIcon: { fontSize: 80 },
  body: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  availBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  availOk: { backgroundColor: '#dcfce7' },
  availNo: { backgroundColor: '#fee2e2' },
  availText: { fontSize: 12, fontWeight: '600' },
  availTextOk: { color: '#166534' },
  availTextNo: { color: '#991b1b' },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  rowLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  rowValue: { fontSize: 14, color: '#111827', marginTop: 2 },
  descBox: { marginTop: 12, paddingVertical: 8 },
  descText: { fontSize: 13, color: '#374151', marginTop: 4, lineHeight: 20 },
  btn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  btnWarn: { backgroundColor: '#f59e0b' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});

export default BookDetails;
```

## 13. `src/components/Borrowings/MyBorrowings.js`

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { borrowingsAPI } from '../../services/api';

const MyBorrowings = () => {
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchBorrowings = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await borrowingsAPI.getMyBorrowings(params);
      setBorrowings(res.data.borrowings);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBorrowings();
  }, [filter]);

  const handleReturn = (id) => {
    Alert.alert('Return Book', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Return',
        onPress: async () => {
          try {
            const res = await borrowingsAPI.return(id);
            Alert.alert('Success', res.data.message);
            fetchBorrowings();
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Error returning book');
          }
        },
      },
    ]);
  };

  const handleRenew = (id) => {
    Alert.alert('Renew Book', 'Renew this book for another 14 days?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Renew',
        onPress: async () => {
          try {
            const res = await borrowingsAPI.renew(id);
            Alert.alert('Success', res.data.message);
            fetchBorrowings();
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Error renewing book');
          }
        },
      },
    ]);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
        return { bg: '#dcfce7', text: '#166534' };
      case 'overdue':
        return { bg: '#fee2e2', text: '#991b1b' };
      case 'returned':
        return { bg: '#dbeafe', text: '#1e40af' };
      default:
        return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const renderItem = ({ item }) => {
    const badge = getStatusStyle(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.author}>by {item.author}</Text>
        <Text style={styles.isbn}>ISBN: {item.isbn}</Text>

        <View style={styles.datesRow}>
          <View>
            <Text style={styles.dateLabel}>Borrowed</Text>
            <Text style={styles.dateValue}>
              {new Date(item.borrow_date).toLocaleDateString()}
            </Text>
          </View>
          <View>
            <Text style={styles.dateLabel}>Due</Text>
            <Text
              style={[
                styles.dateValue,
                item.status === 'overdue' && styles.dateOverdue,
              ]}
            >
              {new Date(item.due_date).toLocaleDateString()}
            </Text>
          </View>
          {item.return_date && (
            <View>
              <Text style={styles.dateLabel}>Returned</Text>
              <Text style={styles.dateValue}>
                {new Date(item.return_date).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {item.fine_amount > 0 && (
          <Text style={styles.fine}>
            Fine: ${parseFloat(item.fine_amount).toFixed(2)}{' '}
            {item.fine_paid ? '(Paid)' : '(Unpaid)'}
          </Text>
        )}

        {(item.status === 'active' || item.status === 'overdue') && (
          <View style={styles.actions}>
            <TouchableOpacity
              disabled={item.renewed}
              style={[styles.secondaryBtn, item.renewed && { opacity: 0.5 }]}
              onPress={() => handleRenew(item.id)}
            >
              <Text style={styles.secondaryBtnText}>
                {item.renewed ? 'Renewed' : 'Renew'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => handleReturn(item.id)}>
              <Text style={styles.primaryBtnText}>Return</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Borrowings</Text>
      <View style={styles.filters}>
        {['all', 'active', 'overdue', 'returned'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterBtn, filter === s && styles.filterBtnActive]}
            onPress={() => setFilter(s)}
          >
            <Text
              style={[styles.filterText, filter === s && styles.filterTextActive]}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : borrowings.length === 0 ? (
        <View style={styles.loader}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyTitle}>No borrowings</Text>
          <Text style={styles.emptyText}>You haven't borrowed any books yet.</Text>
        </View>
      ) : (
        <FlatList
          data={borrowings}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchBorrowings();
              }}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    padding: 16,
    paddingBottom: 8,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterBtnActive: { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' },
  filterText: { fontSize: 12, color: '#6b7280' },
  filterTextActive: { color: '#4f46e5', fontWeight: '600' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginTop: 8 },
  emptyText: { color: '#6b7280', fontSize: 13 },
  list: { padding: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 },
  author: { fontSize: 13, color: '#4b5563', marginTop: 2 },
  isbn: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  datesRow: { flexDirection: 'row', gap: 20, marginTop: 10 },
  dateLabel: { fontSize: 10, color: '#6b7280', fontWeight: '600' },
  dateValue: { fontSize: 13, color: '#111827', marginTop: 2 },
  dateOverdue: { color: '#dc2626', fontWeight: '700' },
  fine: { fontSize: 12, color: '#ca8a04', fontWeight: '600', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#374151', fontSize: 13, fontWeight: '500' },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#4f46e5',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '500' },
});

export default MyBorrowings;
```

## 14. `src/components/Reservations/ReservationList.js`

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { reservationsAPI, borrowingsAPI } from '../../services/api';

const ReservationList = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReservations = async () => {
    try {
      const res = await reservationsAPI.getMyReservations();
      setReservations(res.data.reservations);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancel = (id) => {
    Alert.alert('Cancel Reservation', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            await reservationsAPI.cancel(id);
            Alert.alert('Cancelled', 'Reservation cancelled');
            fetchReservations();
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Error cancelling');
          }
        },
      },
    ]);
  };

  const handleBorrow = async (bookId) => {
    try {
      await borrowingsAPI.borrow(bookId);
      Alert.alert('Success', 'Book borrowed!');
      fetchReservations();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Error borrowing');
    }
  };

  const getBadge = (status) => {
    if (status === 'pending') return { bg: '#fef3c7', text: '#92400e' };
    if (status === 'fulfilled') return { bg: '#dcfce7', text: '#166534' };
    return { bg: '#fee2e2', text: '#991b1b' };
  };

  const renderItem = ({ item }) => {
    const badge = getBadge(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
          <Text style={styles.date}>
            Reserved: {new Date(item.reservation_date).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.author}>by {item.author}</Text>
        <Text style={styles.isbn}>ISBN: {item.isbn}</Text>

        {item.status === 'pending' && (
          <>
            {item.expiry_date && (
              <Text style={styles.expiry}>
                Expires: {new Date(item.expiry_date).toLocaleString()}
              </Text>
            )}
            <View style={styles.actions}>
              {item.available_copies > 0 && (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => handleBorrow(item.book_id)}
                >
                  <Text style={styles.primaryBtnText}>Borrow Now</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.dangerBtn}
                onPress={() => handleCancel(item.id)}
              >
                <Text style={styles.dangerBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        {item.status === 'fulfilled' && (
          <Text style={styles.fulfilledMsg}>
            Book is available! Visit the library to pick it up.
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Reservations</Text>
      {loading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : reservations.length === 0 ? (
        <View style={styles.loader}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={styles.emptyTitle}>No reservations</Text>
          <Text style={styles.emptyText}>You haven't made any book reservations yet.</Text>
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchReservations();
              }}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    padding: 16,
    paddingBottom: 8,
  },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginTop: 8 },
  emptyText: { color: '#6b7280', fontSize: 13 },
  list: { padding: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  date: { fontSize: 11, color: '#6b7280' },
  title: { fontSize: 16, fontWeight: '600', color: '#111827' },
  author: { fontSize: 13, color: '#4b5563', marginTop: 2 },
  isbn: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  expiry: { fontSize: 12, color: '#6b7280', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#4f46e5',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  dangerBtn: {
    flex: 1,
    backgroundColor: '#fee2e2',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  dangerBtnText: { color: '#991b1b', fontSize: 13, fontWeight: '600' },
  fulfilledMsg: { color: '#16a34a', fontSize: 12, marginTop: 10, fontWeight: '600' },
});

export default ReservationList;
```

## 15. `src/screens/UserDashboard.js`

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';

const UserDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await usersAPI.getDashboard();
      if (res.data.success) setDashboard(res.data.dashboard);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const StatCard = ({ label, value, color }) => (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchDashboard();
          }}
        />
      }
    >
      <View style={styles.hero}>
        <Text style={styles.welcome}>Welcome back, {user?.firstName}!</Text>
        <Text style={styles.subWelcome}>Here's an overview of your library activity.</Text>
      </View>

      {dashboard?.stats && (
        <View style={styles.statsGrid}>
          <StatCard
            label="Active Borrowings"
            value={dashboard.stats.active_count}
            color="#4f46e5"
          />
          <StatCard
            label="Overdue Books"
            value={dashboard.stats.overdue_count}
            color="#dc2626"
          />
          <StatCard
            label="Total Fines"
            value={`$${parseFloat(dashboard.stats.total_fines || 0).toFixed(2)}`}
            color="#ca8a04"
          />
          <StatCard
            label="Pending Reservations"
            value={dashboard.stats.pending_reservations}
            color="#7c3aed"
          />
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Current Borrowings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyBorrowings')}>
            <Text style={styles.link}>View All →</Text>
          </TouchableOpacity>
        </View>
        {dashboard?.activeBorrowings?.length > 0 ? (
          dashboard.activeBorrowings.map((b) => (
            <View key={b.id} style={styles.listItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{b.title}</Text>
                <Text style={styles.listSub}>by {b.author}</Text>
                <Text style={styles.listSub}>
                  Due: {new Date(b.due_date).toLocaleDateString()}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  b.status === 'overdue' ? styles.badgeDanger : styles.badgeOk,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    b.status === 'overdue' ? styles.badgeTextDanger : styles.badgeTextOk,
                  ]}
                >
                  {b.status === 'overdue' ? 'Overdue' : 'Active'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No active borrowings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('BookList')}>
              <Text style={styles.link}>Browse Books →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Pending Reservations</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ReservationList')}>
            <Text style={styles.link}>View All →</Text>
          </TouchableOpacity>
        </View>
        {dashboard?.pendingReservations?.length > 0 ? (
          dashboard.pendingReservations.map((r) => (
            <View key={r.id} style={styles.listItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{r.title}</Text>
                <Text style={styles.listSub}>by {r.author}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No pending reservations</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Returns</Text>
        {dashboard?.recentReturns?.length > 0 ? (
          dashboard.recentReturns.map((b) => (
            <View key={b.id} style={styles.listItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{b.title}</Text>
                <Text style={styles.listSub}>
                  Returned: {new Date(b.return_date).toLocaleDateString()}
                </Text>
              </View>
              {b.fine_amount > 0 && (
                <View style={[styles.badge, styles.badgeWarning]}>
                  <Text style={[styles.badgeText, styles.badgeTextWarning]}>
                    ${b.fine_amount}
                  </Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No recent returns</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { padding: 16 },
  welcome: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  subWelcome: { color: '#6b7280', marginTop: 4, fontSize: 13 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 8,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: '#6b7280' },
  statValue: { fontSize: 22, fontWeight: 'bold', marginTop: 6 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  link: { color: '#4f46e5', fontSize: 13, fontWeight: '500' },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  listTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  listSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  emptySection: { paddingVertical: 16, alignItems: 'center' },
  emptyText: { color: '#6b7280', fontSize: 13 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
  badgeOk: { backgroundColor: '#dcfce7' },
  badgeDanger: { backgroundColor: '#fee2e2' },
  badgeWarning: { backgroundColor: '#fef3c7' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextOk: { color: '#166534' },
  badgeTextDanger: { color: '#991b1b' },
  badgeTextWarning: { color: '#92400e' },
});

export default UserDashboard;
```

## 16. `src/screens/UserProfile.js`

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';

const UserProfile = ({ navigation }) => {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    department: '',
    studentId: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await usersAPI.getProfile();
      if (res.data.success) {
        setProfile(res.data.user);
        setFormData({
          firstName: res.data.user.first_name || '',
          lastName: res.data.user.last_name || '',
          department: res.data.user.department || '',
          studentId: res.data.user.student_id || '',
        });
      }
    } catch (e) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const updateProfile = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await usersAPI.updateProfile(formData);
      if (res.data.success) {
        setSuccess('Profile updated');
        setEditing(false);
        fetchProfile();
      } else setError(res.data.message);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update');
    }
  };

  const submitPassword = async () => {
    setError('');
    setSuccess('');
    if (passwordData.newPassword !== passwordData.confirmPassword)
      return setError('Passwords do not match');
    try {
      const res = await usersAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (res.data.success) {
        setSuccess('Password changed');
        setChangePassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else setError(res.data.message);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to change password');
    }
  };

  const deleteAccount = () => {
    Alert.alert('Delete Account', 'This cannot be undone. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await usersAPI.deleteAccount();
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } catch (e) {
            setError(e.response?.data?.message || 'Failed to delete account');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>My Profile</Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      {success ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{success}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>

        {editing ? (
          <>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(v) => setFormData({ ...formData, firstName: v })}
            />
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(v) => setFormData({ ...formData, lastName: v })}
            />
            <Text style={styles.label}>Department</Text>
            <TextInput
              style={styles.input}
              value={formData.department}
              onChangeText={(v) => setFormData({ ...formData, department: v })}
            />
            <Text style={styles.label}>Student/Staff ID</Text>
            <TextInput
              style={styles.input}
              value={formData.studentId}
              onChangeText={(v) => setFormData({ ...formData, studentId: v })}
            />
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setEditing(false)}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={updateProfile}>
                <Text style={styles.primaryBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <InfoRow label="Full Name" value={`${profile?.first_name} ${profile?.last_name}`} />
            <InfoRow label="Email" value={profile?.email} />
            <InfoRow label="Role" value={profile?.role} />
            <InfoRow label="Department" value={profile?.department || 'Not set'} />
            <InfoRow
              label="Member Since"
              value={new Date(profile?.created_at).toLocaleDateString()}
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setEditing(true)}>
              <Text style={styles.primaryBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Security</Text>
        {changePassword ? (
          <>
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={passwordData.currentPassword}
              onChangeText={(v) => setPasswordData({ ...passwordData, currentPassword: v })}
            />
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={passwordData.newPassword}
              onChangeText={(v) => setPasswordData({ ...passwordData, newPassword: v })}
            />
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={passwordData.confirmPassword}
              onChangeText={(v) => setPasswordData({ ...passwordData, confirmPassword: v })}
            />
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setChangePassword(false)}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={submitPassword}>
                <Text style={styles.primaryBtnText}>Change Password</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setChangePassword(true)}
          >
            <Text style={styles.secondaryBtnText}>Change Password</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <Text style={[styles.cardTitle, { color: '#dc2626' }]}>Danger Zone</Text>
        <Text style={styles.dangerText}>
          Once you delete your account, there is no going back.
        </Text>
        <TouchableOpacity style={styles.dangerBtn} onPress={deleteAccount}>
          <Text style={styles.dangerBtnText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 12 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: '#374151', marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryBtnText: { color: '#374151', fontWeight: '600' },
  infoRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#111827', marginTop: 2 },
  dangerText: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  dangerBtn: {
    backgroundColor: '#dc2626',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerBtnText: { color: '#fff', fontWeight: '600' },
  errorBox: { backgroundColor: '#fee2e2', padding: 10, borderRadius: 6, marginBottom: 8 },
  errorText: { color: '#991b1b', fontSize: 12 },
  successBox: { backgroundColor: '#dcfce7', padding: 10, borderRadius: 6, marginBottom: 8 },
  successText: { color: '#166534', fontSize: 12 },
});

export default UserProfile;
```

## 17. `src/components/Admin/Dashboard.js`

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { adminAPI } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try {
      const res = await adminAPI.getDashboard();
      setStats(res.data.stats);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const sendReminders = async () => {
    try {
      await adminAPI.sendOverdueReminders();
      Alert.alert('Success', 'Overdue reminders sent');
      fetch();
    } catch (e) {
      Alert.alert('Error', 'Error sending reminders');
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.loader}>
        <Text>Error loading dashboard</Text>
      </View>
    );
  }

  const StatCard = ({ label, value, color }) => (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetch();
          }}
        />
      }
    >
      <Text style={styles.headerTitle}>Admin Dashboard</Text>

      <View style={styles.grid}>
        <StatCard label="Total Books" value={stats.totalBooks} color="#111827" />
        <StatCard label="Available Books" value={stats.availableBooks} color="#16a34a" />
        <StatCard label="Active Borrowings" value={stats.activeBorrowings} color="#2563eb" />
        <StatCard label="Overdue Books" value={stats.overdueBooks} color="#dc2626" />
        <StatCard label="Total Users" value={stats.totalUsers} color="#7c3aed" />
        <StatCard
          label="Unpaid Fines"
          value={`$${stats.totalUnpaidFines.toFixed(2)}`}
          color="#ea580c"
        />
      </View>

      <TouchableOpacity style={styles.dangerBtn} onPress={sendReminders}>
        <Text style={styles.dangerBtnText}>Send Overdue Reminders</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Most Popular Books</Text>
        {stats.popularBooks?.slice(0, 5).map((b) => (
          <View key={b.id} style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>
              {b.title}
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.min(
                      100,
                      (b.borrow_count / Math.max(...stats.popularBooks.map((x) => x.borrow_count))) * 100
                    )}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.barValue}>{b.borrow_count}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        {stats.recentActivities?.map((a) => (
          <View key={a.id} style={styles.activityRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.activityUser}>
                {a.first_name} {a.last_name}
              </Text>
              <Text style={styles.activityBook}>{a.book_title}</Text>
              <Text style={styles.activityDate}>
                {new Date(a.borrow_date).toLocaleDateString()}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                a.status === 'active'
                  ? styles.badgeOk
                  : a.status === 'overdue'
                  ? styles.badgeDanger
                  : styles.badgeNeutral,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  a.status === 'active'
                    ? styles.textOk
                    : a.status === 'overdue'
                    ? styles.textDanger
                    : styles.textNeutral,
                ]}
              >
                {a.status}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', padding: 16 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  statLabel: { fontSize: 12, color: '#6b7280' },
  statValue: { fontSize: 22, fontWeight: 'bold', marginTop: 6 },
  dangerBtn: {
    backgroundColor: '#dc2626',
    marginHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerBtnText: { color: '#fff', fontWeight: '600' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 10 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  barLabel: { fontSize: 12, color: '#374151', width: 100 },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: '#818cf8' },
  barValue: { fontSize: 12, color: '#6b7280', width: 24, textAlign: 'right' },
  activityRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  activityUser: { fontSize: 13, fontWeight: '600', color: '#111827' },
  activityBook: { fontSize: 12, color: '#4b5563', marginTop: 2 },
  activityDate: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeOk: { backgroundColor: '#dcfce7' },
  badgeDanger: { backgroundColor: '#fee2e2' },
  badgeNeutral: { backgroundColor: '#f3f4f6' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  textOk: { color: '#166534' },
  textDanger: { color: '#991b1b' },
  textNeutral: { color: '#374151' },
});

export default AdminDashboard;
```

## 18. `src/components/Admin/BookManagement.js`

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { booksAPI } from '../../services/api';

const BookManagement = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    publicationYear: '',
    edition: '',
    category: '',
    totalCopies: 1,
    shelfLocation: '',
    description: '',
    coverImageUrl: '',
  });

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await booksAPI.getAll({ page, limit: 20 });
      setBooks(res.data.books);
      setTotalPages(res.data.pagination.totalPages);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [page]);

  const reset = () =>
    setFormData({
      isbn: '',
      title: '',
      author: '',
      publisher: '',
      publicationYear: '',
      edition: '',
      category: '',
      totalCopies: 1,
      shelfLocation: '',
      description: '',
      coverImageUrl: '',
    });

  const handleSubmit = async () => {
    try {
      if (editingBook) await booksAPI.update(editingBook.id, formData);
      else await booksAPI.add(formData);
      Alert.alert('Success', editingBook ? 'Book updated' : 'Book added');
      setShowForm(false);
      setEditingBook(null);
      reset();
      fetchBooks();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Error saving');
    }
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    setFormData({
      isbn: book.isbn || '',
      title: book.title || '',
      author: book.author || '',
      publisher: book.publisher || '',
      publicationYear: book.publication_year || '',
      edition: book.edition || '',
      category: book.category || '',
      totalCopies: book.total_copies || 1,
      shelfLocation: book.shelf_location || '',
      description: book.description || '',
      coverImageUrl: book.cover_image_url || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Delete this book?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await booksAPI.delete(id);
            fetchBooks();
          } catch (e) {
            Alert.alert('Error', 'Error deleting');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.bookRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        <Text style={styles.bookMeta}>{item.author}</Text>
        <Text style={styles.bookMeta}>ISBN: {item.isbn}</Text>
        <Text style={styles.bookMeta}>
          Available: {item.available_copies}/{item.total_copies}
        </Text>
      </View>
      <View style={styles.rowBtns}>
        <TouchableOpacity onPress={() => handleEdit(item)}>
          <Text style={styles.editBtn}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteBtn}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const Input = ({ label, field, ...props }) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={String(formData[field])}
        onChangeText={(v) => setFormData({ ...formData, [field]: v })}
        {...props}
      />
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>Book Management</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            reset();
            setEditingBook(null);
            setShowForm(!showForm);
          }}
        >
          <Text style={styles.addBtnText}>{showForm ? 'Cancel' : 'Add New'}</Text>
        </TouchableOpacity>
      </View>

      {showForm ? (
        <ScrollView style={styles.formCard}>
          <Text style={styles.formTitle}>{editingBook ? 'Edit Book' : 'Add New Book'}</Text>
          <Input label="ISBN *" field="isbn" />
          <Input label="Title *" field="title" />
          <Input label="Author *" field="author" />
          <Input label="Publisher" field="publisher" />
          <Input label="Publication Year" field="publicationYear" keyboardType="numeric" />
          <Input label="Edition" field="edition" />
          <Input label="Category" field="category" />
          <Input label="Total Copies" field="totalCopies" keyboardType="numeric" />
          <Input label="Shelf Location" field="shelfLocation" />
          <Input label="Description" field="description" multiline />
          <Input label="Cover Image URL" field="coverImageUrl" />
          <View style={styles.formBtnRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                setShowForm(false);
                setEditingBook(null);
                reset();
              }}
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
              <Text style={styles.primaryBtnText}>
                {editingBook ? 'Update' : 'Add Book'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  disabled={page === 1}
                  style={[styles.pageBtn, page === 1 && { opacity: 0.5 }]}
                  onPress={() => setPage(page - 1)}
                >
                  <Text style={styles.pageBtnText}>Prev</Text>
                </TouchableOpacity>
                <Text style={styles.pageText}>
                  {page} / {totalPages}
                </Text>
                <TouchableOpacity
                  disabled={page >= totalPages}
                  style={[styles.pageBtn, page >= totalPages && { opacity: 0.5 }]}
                  onPress={() => setPage(page + 1)}
                >
                  <Text style={styles.pageBtnText}>Next</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  addBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12 },
  bookRow: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  bookTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  bookMeta: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  rowBtns: { gap: 6 },
  editBtn: { color: '#4f46e5', fontWeight: '600', fontSize: 12, paddingVertical: 4 },
  deleteBtn: { color: '#dc2626', fontWeight: '600', fontSize: 12, paddingVertical: 4 },
  formCard: { padding: 16, backgroundColor: '#fff', flex: 1 },
  formTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: '#374151', marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#fff',
  },
  formBtnRow: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 24 },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#374151', fontWeight: '600' },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  pageBtn: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  pageBtnText: { fontSize: 12, color: '#374151' },
  pageText: { fontSize: 12, color: '#6b7280' },
});

export default BookManagement;
```

## 19. `src/components/Admin/UserManagement.js`

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { adminAPI } from '../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20, search, role: roleFilter || undefined };
      const res = await adminAPI.getUsers(params);
      setUsers(res.data.users);
      setTotalUsers(res.data.total);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const changeRole = (userId, role) => {
    Alert.alert('Change Role', `Change role to ${role}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Change',
        onPress: async () => {
          try {
            await adminAPI.updateUserRole(userId, role);
            Alert.alert('Success', 'Role updated');
            fetchUsers();
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Error updating role');
          }
        },
      },
    ]);
  };

  const getRoleStyle = (role) => {
    if (role === 'admin') return { bg: '#ede9fe', text: '#5b21b6' };
    if (role === 'staff') return { bg: '#dbeafe', text: '#1e40af' };
    return { bg: '#dcfce7', text: '#166534' };
  };

  const renderItem = ({ item }) => {
    const badge = getRoleStyle(item.role);
    return (
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {item.first_name} {item.last_name}
            </Text>
            <Text style={styles.email}>{item.email}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{item.role}</Text>
          </View>
        </View>
        <Text style={styles.meta}>Student ID: {item.student_id || 'N/A'}</Text>
        <Text style={styles.meta}>Department: {item.department || 'N/A'}</Text>
        <Text style={styles.meta}>
          Verified: {item.is_verified ? '✅' : '❌'}
        </Text>

        <Text style={styles.changeLabel}>Change Role:</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={item.role}
            onValueChange={(v) => changeRole(item.id, v)}
          >
            <Picker.Item label="Student" value="student" />
            <Picker.Item label="Staff" value="staff" />
            <Picker.Item label="Admin" value="admin" />
          </Picker>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>User Management</Text>

      <View style={styles.filterCard}>
        <TextInput
          style={styles.input}
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, email, ID..."
          onSubmitEditing={() => {
            setPage(1);
            fetchUsers();
          }}
        />
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v);
              setPage(1);
            }}
          >
            <Picker.Item label="All Roles" value="" />
            <Picker.Item label="Admin" value="admin" />
            <Picker.Item label="Student" value="student" />
            <Picker.Item label="Staff" value="staff" />
          </Picker>
        </View>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => {
            setPage(1);
            fetchUsers();
          }}
        >
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            <View style={styles.pagination}>
              <TouchableOpacity
                disabled={page === 1}
                style={[styles.pageBtn, page === 1 && { opacity: 0.5 }]}
                onPress={() => setPage(page - 1)}
              >
                <Text style={styles.pageBtnText}>Prev</Text>
              </TouchableOpacity>
              <Text style={styles.pageText}>
                Showing {Math.min(page * 20, totalUsers)} of {totalUsers}
              </Text>
              <TouchableOpacity
                disabled={page * 20 >= totalUsers}
                style={[styles.pageBtn, page * 20 >= totalUsers && { opacity: 0.5 }]}
                onPress={() => setPage(page + 1)}
              >
                <Text style={styles.pageBtnText}>Next</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', padding: 16 },
  filterCard: { backgroundColor: '#fff', marginHorizontal: 12, borderRadius: 10, padding: 12, gap: 8, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  searchBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '600' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { fontSize: 14, fontWeight: '600', color: '#111827' },
  email: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  meta: { fontSize: 12, color: '#4b5563', marginTop: 4 },
  changeLabel: { fontSize: 11, color: '#6b7280', marginTop: 8, fontWeight: '600' },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  pageBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff' },
  pageBtnText: { fontSize: 12, color: '#374151' },
  pageText: { fontSize: 11, color: '#6b7280' },
});

export default UserManagement;
```

## 20. `src/components/Admin/AllBorrowings.js`

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { borrowingsAPI } from '../../services/api';

const AllBorrowings = () => {
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetch = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (filter !== 'all') params.status = filter;
      const res = await borrowingsAPI.getAll(params);
      setBorrowings(res.data.borrowings);
      setTotal(res.data.total);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [filter, page]);

  const getBadge = (status) => {
    switch (status) {
      case 'active': return { bg: '#dcfce7', text: '#166534' };
      case 'overdue': return { bg: '#fee2e2', text: '#991b1b' };
      case 'returned': return { bg: '#dbeafe', text: '#1e40af' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const renderItem = ({ item }) => {
    const badge = getBadge(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.user}>
              {item.first_name} {item.last_name}
            </Text>
            <Text style={styles.meta}>{item.email}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.bookTitle}>{item.book_title}</Text>
        <Text style={styles.meta}>ISBN: {item.isbn}</Text>
        <View style={styles.datesRow}>
          <View>
            <Text style={styles.dateLabel}>Borrowed</Text>
            <Text style={styles.dateValue}>
              {new Date(item.borrow_date).toLocaleDateString()}
            </Text>
          </View>
          <View>
            <Text style={styles.dateLabel}>Due</Text>
            <Text style={styles.dateValue}>
              {new Date(item.due_date).toLocaleDateString()}
            </Text>
          </View>
          <View>
            <Text style={styles.dateLabel}>Returned</Text>
            <Text style={styles.dateValue}>
              {item.return_date ? new Date(item.return_date).toLocaleDateString() : '—'}
            </Text>
          </View>
        </View>
        {item.fine_amount > 0 && (
          <Text style={styles.fine}>
            Fine: ${parseFloat(item.fine_amount).toFixed(2)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Borrowing Management</Text>
      <View style={styles.filters}>
        {['all', 'active', 'overdue', 'returned', 'lost'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterBtn, filter === s && styles.filterBtnActive]}
            onPress={() => {
              setFilter(s);
              setPage(1);
            }}
          >
            <Text
              style={[styles.filterText, filter === s && styles.filterTextActive]}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={borrowings}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            <View style={styles.pagination}>
              <TouchableOpacity
                disabled={page === 1}
                style={[styles.pageBtn, page === 1 && { opacity: 0.5 }]}
                onPress={() => setPage(page - 1)}
              >
                <Text style={styles.pageBtnText}>Prev</Text>
              </TouchableOpacity>
              <Text style={styles.pageText}>
                Showing {Math.min(page * 20, total)} of {total}
              </Text>
              <TouchableOpacity
                disabled={page * 20 >= total}
                style={[styles.pageBtn, page * 20 >= total && { opacity: 0.5 }]}
                onPress={() => setPage(page + 1)}
              >
                <Text style={styles.pageBtnText}>Next</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', padding: 16, paddingBottom: 8 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  filterBtnActive: { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' },
  filterText: { fontSize: 11, color: '#6b7280' },
  filterTextActive: { color: '#4f46e5', fontWeight: '600' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  user: { fontSize: 14, fontWeight: '600', color: '#111827' },
  meta: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  bookTitle: { fontSize: 13, fontWeight: '500', color: '#1f2937', marginTop: 8 },
  datesRow: { flexDirection: 'row', gap: 20, marginTop: 8 },
  dateLabel: { fontSize: 10, color: '#6b7280', fontWeight: '600' },
  dateValue: { fontSize: 12, color: '#111827', marginTop: 2 },
  fine: { fontSize: 12, color: '#ca8a04', fontWeight: '600', marginTop: 6 },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  pageBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff' },
  pageBtnText: { fontSize: 12, color: '#374151' },
  pageText: { fontSize: 11, color: '#6b7280' },
});

export default AllBorrowings;
```

## 21. `src/components/Admin/FineManagement.js`

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { adminAPI } from '../../services/api';

const FineManagement = () => {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unpaid');

  const fetch = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getFines({ status: filter });
      setFines(res.data.fines);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [filter]);

  const payFine = (id) => {
    Alert.alert('Mark as Paid', 'Confirm payment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Paid',
        onPress: async () => {
          try {
            await adminAPI.payFine(id);
            Alert.alert('Success', 'Fine marked as paid');
            fetch();
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Error');
          }
        },
      },
    ]);
  };

  const getBadge = (status) => {
    if (status === 'paid') return { bg: '#dcfce7', text: '#166534' };
    if (status === 'waived') return { bg: '#f3f4f6', text: '#374151' };
    return { bg: '#fee2e2', text: '#991b1b' };
  };

  const renderItem = ({ item }) => {
    const badge = getBadge(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.user}>
              {item.first_name} {item.last_name}
            </Text>
            <Text style={styles.meta}>{item.email}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.bookTitle}>{item.book_title}</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amount}>${parseFloat(item.amount).toFixed(2)}</Text>
          <Text style={styles.meta}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        {item.status === 'unpaid' && (
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => payFine(item.id)}
          >
            <Text style={styles.payBtnText}>Mark as Paid</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Fine Management</Text>
      <View style={styles.filters}>
        {['unpaid', 'paid', 'waived'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterBtn, filter === s && styles.filterBtnActive]}
            onPress={() => setFilter(s)}
          >
            <Text
              style={[styles.filterText, filter === s && styles.filterTextActive]}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : fines.length === 0 ? (
        <View style={styles.loader}>
          <Text style={styles.emptyText}>No {filter} fines found</Text>
        </View>
      ) : (
        <FlatList
          data={fines}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', padding: 16, paddingBottom: 8 },
  filters: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  filterBtnActive: { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' },
  filterText: { fontSize: 12, color: '#6b7280' },
  filterTextActive: { color: '#4f46e5', fontWeight: '600' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#6b7280' },
  list: { padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  user: { fontSize: 14, fontWeight: '600', color: '#111827' },
  meta: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  bookTitle: { fontSize: 13, color: '#4b5563', marginTop: 8 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#ca8a04' },
  payBtn: {
    marginTop: 10,
    backgroundColor: '#4f46e5',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  payBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
});

export default FineManagement;
```

## 22. `src/components/Admin/ReservationManagement.js`

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { reservationsAPI } from '../../services/api';

const ReservationManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const fetch = async () => {
    try {
      setLoading(true);
      const res = await reservationsAPI.getAll({ status: filter, page: 1, limit: 20 });
      setReservations(res.data.reservations);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [filter]);

  const fulfill = (id) => {
    Alert.alert('Fulfill Reservation', 'Mark as fulfilled and notify user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Fulfill',
        onPress: async () => {
          try {
            await reservationsAPI.fulfill(id);
            Alert.alert('Success', 'Fulfilled');
            fetch();
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Error');
          }
        },
      },
    ]);
  };

  const checkExpired = async () => {
    try {
      const res = await reservationsAPI.checkExpired();
      Alert.alert('Info', res.data.message);
      fetch();
    } catch (e) {
      Alert.alert('Error', 'Error checking expired');
    }
  };

  const getBadge = (status) => {
    if (status === 'pending') return { bg: '#fef3c7', text: '#92400e' };
    if (status === 'fulfilled') return { bg: '#dcfce7', text: '#166534' };
    return { bg: '#fee2e2', text: '#991b1b' };
  };

  const renderItem = ({ item }) => {
    const badge = getBadge(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.user}>
              {item.first_name} {item.last_name}
            </Text>
            <Text style={styles.meta}>{item.email}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.bookTitle}>{item.book_title}</Text>
        <Text style={styles.meta}>by {item.book_author}</Text>
        {item.available_copies !== undefined && (
          <Text style={styles.meta}>Available: {item.available_copies}</Text>
        )}
        <View style={styles.dateRow}>
          <View>
            <Text style={styles.dateLabel}>Reserved</Text>
            <Text style={styles.dateValue}>
              {new Date(item.reservation_date).toLocaleDateString()}
            </Text>
          </View>
          {item.expiry_date && (
            <View>
              <Text style={styles.dateLabel}>Expires</Text>
              <Text style={styles.dateValue}>
                {new Date(item.expiry_date).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.fulfillBtn}
            onPress={() => fulfill(item.id)}
          >
            <Text style={styles.fulfillBtnText}>Fulfill</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>Reservation Mgmt</Text>
        <TouchableOpacity style={styles.expiredBtn} onPress={checkExpired}>
          <Text style={styles.expiredBtnText}>Check Expired</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        {['pending', 'fulfilled', 'cancelled'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterBtn, filter === s && styles.filterBtnActive]}
            onPress={() => setFilter(s)}
          >
            <Text
              style={[styles.filterText, filter === s && styles.filterTextActive]}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : reservations.length === 0 ? (
        <View style={styles.loader}>
          <Text style={styles.emptyText}>No {filter} reservations</Text>
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  expiredBtn: { backgroundColor: '#ea580c', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  expiredBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  filters: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  filterBtnActive: { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' },
  filterText: { fontSize: 12, color: '#6b7280' },
  filterTextActive: { color: '#4f46e5', fontWeight: '600' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#6b7280' },
  list: { padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  user: { fontSize: 14, fontWeight: '600', color: '#111827' },
  meta: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  bookTitle: { fontSize: 13, fontWeight: '500', color: '#1f2937', marginTop: 8 },
  dateRow: { flexDirection: 'row', gap: 20, marginTop: 8 },
  dateLabel: { fontSize: 10, color: '#6b7280', fontWeight: '600' },
  dateValue: { fontSize: 12, color: '#111827', marginTop: 2 },
  fulfillBtn: {
    marginTop: 10,
    backgroundColor: '#4f46e5',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  fulfillBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
});

export default ReservationManagement;
```

## 23. `navigation/AppNavigator.js`

```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../src/context/AuthContext';
import Loading from '../src/components/Loading';
import Navbar from '../src/components/Navbar';

import Login from '../src/components/Auth/Login';
import Register from '../src/components/Auth/Register';
import ForgotPassword from '../src/components/Auth/ForgotPassword';
import VerifyEmail from '../src/components/Auth/VerifyEmail';

import UserDashboard from '../src/screens/UserDashboard';
import UserProfile from '../src/screens/UserProfile';
import BookList from '../src/components/Books/BookList';
import BookDetails from '../src/components/Books/BookDetails';
import MyBorrowings from '../src/components/Borrowings/MyBorrowings';
import ReservationList from '../src/components/Reservations/ReservationList';

import AdminDashboard from '../src/components/Admin/Dashboard';
import BookManagement from '../src/components/Admin/BookManagement';
import UserManagement from '../src/components/Admin/UserManagement';
import FineManagement from '../src/components/Admin/FineManagement';
import ReservationManagement from '../src/components/Admin/ReservationManagement';
import AllBorrowings from '../src/components/Admin/AllBorrowings';

const Stack = createNativeStackNavigator();

// wrapper that shows the Navbar on authenticated screens
const withNavbar = (Component) => {
  return (props) => (
    <View style={{ flex: 1 }}>
      <Navbar navigation={props.navigation} currentRoute={props.route.name} />
      <Component {...props} />
    </View>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return <Loading />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmail} />
        </>
      ) : (
        <>
          {isAdmin ? (
            <>
              <Stack.Screen name="AdminDashboard" component={withNavbar(AdminDashboard)} />
              <Stack.Screen name="BookManagement" component={withNavbar(BookManagement)} />
              <Stack.Screen name="UserManagement" component={withNavbar(UserManagement)} />
              <Stack.Screen name="AllBorrowings" component={withNavbar(AllBorrowings)} />
              <Stack.Screen
                name="ReservationManagement"
                component={withNavbar(ReservationManagement)}
              />
              <Stack.Screen name="FineManagement" component={withNavbar(FineManagement)} />
            </>
          ) : (
            <>
              <Stack.Screen name="UserDashboard" component={withNavbar(UserDashboard)} />
              <Stack.Screen name="BookList" component={withNavbar(BookList)} />
              <Stack.Screen name="BookDetails" component={withNavbar(BookDetails)} />
              <Stack.Screen name="MyBorrowings" component={withNavbar(MyBorrowings)} />
              <Stack.Screen name="ReservationList" component={withNavbar(ReservationList)} />
            </>
          )}
          <Stack.Screen name="UserProfile" component={withNavbar(UserProfile)} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
```

## 24. `App.js`

```javascript
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

---

## ⚠️ IMPORTANT NOTES

### 1. Install extra dependency
Add `@react-native-picker/picker` to `package.json` dependencies:
```json
"@react-native-picker/picker": "2.7.5"
```

### 2. API URL — update for your environment
In `src/services/api.js`:
- **Android emulator:** `http://10.0.2.2:5000/api`
- **iOS simulator:** `http://localhost:5000/api`
- **Physical device:** `http://YOUR_COMPUTER_LAN_IP:5000/api` (e.g. `192.168.1.10`)

Your backend must **listen on `0.0.0.0`** (not just `127.0.0.1`) so the phone can reach it. If using Expo Go on a physical phone, ensure the phone and computer are on the same Wi-Fi network.

### 3. Charts
Recharts (used on web) doesn't work on React Native. In the admin dashboard I replaced the bar chart with **native horizontal bars** (simpler, no extra dependency). If you want real charts, add `react-native-svg-charts` or `victory-native`.

### 4. Email verification deep-link
The web version used `/verify-email/:token`. On mobile this is usually done with deep links (`expo-linking`). For simplicity, I've left the `VerifyEmail` screen as a route you can navigate to manually by passing `{ token }` in params. To fully support this you'd:
- Configure deep linking in `app.json`
- The verification email must contain a URL that opens your app (e.g. `library://verify-email/TOKEN`)

### 5. Storage
All `localStorage` calls are replaced with `AsyncStorage`, which is the React Native equivalent and is async (so all calls use `await`).

### 6. Running the app

```bash
# Create expo project
npx create-expo-app library-app
cd library-app

# Replace App.js with the one above
# Copy the src/ and navigation/ folders into the project root
# Install dependencies
npm install @react-navigation/native @react-navigation/native-stack @react-native-async-storage/async-storage axios @react-native-picker/picker react-native-safe-area-context react-native-screens react-native-gesture-handler

# Run
npx expo start
```

This gives you a fully functional Expo app with the same features and screens as your web version, using React Native `StyleSheet` (plain CSS-like styling) as requested.