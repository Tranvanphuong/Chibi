// Authentication module với Supabase (Đơn giản hóa)
import { supabaseClient } from './supabase-config.js';

// Global variables
let currentUser = null;
let userProfile = null;

// Authentication functions
export async function signInWithEmail(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            showStatusMessage('Lỗi đăng nhập: ' + error.message, 'error');
            return false;
        }

        if (data.user) {
            // Check user profile status
            const profile = await getUserProfile(data.user.id);
            if (profile) {
                if (profile.status === 'approved') {
                    showStatusMessage('Đăng nhập thành công!', 'success');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                    return true;
                } else if (profile.status === 'pending') {
                    showStatusMessage('Tài khoản của bạn đang chờ phê duyệt!', 'warning');
                    return false;
                } else if (profile.status === 'rejected') {
                    showStatusMessage('Tài khoản của bạn đã bị từ chối!', 'error');
                    return false;
                }
            }
        }

        return true;
    } catch (error) {
        showStatusMessage('Lỗi kết nối: ' + error.message, 'error');
        return false;
    }
}

export async function signOut() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error('Lỗi đăng xuất:', error);
            return false;
        }

        // Clear local storage
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userProfile');
        
        // Redirect to login
        window.location.href = '/login.html';
        return true;
    } catch (error) {
        console.error('Lỗi đăng xuất:', error);
        return false;
    }
}

export async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        
        if (error) {
            console.error('Lỗi lấy thông tin user:', error);
            return null;
        }

        return user;
    } catch (error) {
        console.error('Lỗi lấy thông tin user:', error);
        return null;
    }
}

export async function getUserProfile(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Lỗi lấy profile:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Lỗi lấy profile:', error);
        return null;
    }
}

export async function checkUserStatus() {
    const user = await getCurrentUser();
    if (!user) return null;

    const profile = await getUserProfile(user.id);
    if (!profile) return null;

    return {
        user: user,
        profile: profile,
        isApproved: profile.status === 'approved',
        isPending: profile.status === 'pending',
        isRejected: profile.status === 'rejected'
    };
}

// UI Helper functions
export function showStatusMessage(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage');
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    statusElement.style.display = 'block';

    // Auto hide after 5 seconds
    setTimeout(() => {
        statusElement.style.display = 'none';
    }, 5000);
}

// Login handler
export async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showStatusMessage('Vui lòng nhập đầy đủ thông tin!', 'error');
        return false;
    }

    // Try Supabase login first
    const success = await signInWithEmail(email, password);
    
    if (!success) {
        // Fallback to hardcoded users for backward compatibility
        const users = [
            { email: 'student1@local.com', password: 'pass123' },
            { email: 'student2@local.com', password: 'pass456' }
        ];

        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userProfile', JSON.stringify({
                id: 'local-user',
                email: email,
                full_name: email.split('@')[0],
                status: 'approved'
            }));
            
            showStatusMessage('Đăng nhập thành công!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            return true;
        } else {
            showStatusMessage('Email hoặc mật khẩu không đúng!', 'error');
            return false;
        }
    }

    return true;
}

// Initialize authentication
export async function initAuth() {
    // Check if user is already logged in
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        userProfile = await getUserProfile(session.user.id);
        
        // Store in localStorage for compatibility
        localStorage.setItem('isLoggedIn', 'true');
        if (userProfile) {
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
        }
    }

    // Setup event listeners
    setupAuthEventListeners();
}

// Setup event listeners
function setupAuthEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

// Export for global use
window.signInWithEmail = signInWithEmail;
window.signOut = signOut;
window.handleLogin = handleLogin;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAuth); 