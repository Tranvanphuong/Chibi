// Registration module với Supabase (Đơn giản hóa)
import { supabaseClient } from './supabase-config.js';

// Registration functions
export async function handleRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const registrationData = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        phone: formData.get('phone'),
        organization: formData.get('organization'),
        userType: formData.get('userType'),
        reason: formData.get('reason')
    };

    try {
        // Validate form data
        if (!validateRegistrationData(registrationData)) {
            return false;
        }

        // Check if email already exists
        const { data: existingUser, error: checkError } = await supabaseClient
            .from('user_profiles')
            .select('email')
            .eq('email', registrationData.email)
            .single();

        if (existingUser) {
            showStatusMessage('Email này đã được đăng ký!', 'error');
            return false;
        }

        // Create user account with Supabase Auth
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: registrationData.email,
            password: registrationData.password,
            options: {
                data: {
                    full_name: registrationData.fullName
                }
            }
        });

        if (authError) {
            console.error('Lỗi tạo tài khoản:', authError);
            showStatusMessage('Lỗi đăng ký: ' + authError.message, 'error');
            return false;
        }

        if (authData.user) {
            // Create user profile
            const { error: profileError } = await supabaseClient
                .from('user_profiles')
                .insert([{
                    id: authData.user.id,
                    email: registrationData.email,
                    full_name: registrationData.fullName,
                    phone: registrationData.phone,
                    organization: registrationData.organization,
                    reason: registrationData.reason,
                    status: 'pending',
                    user_type: registrationData.userType
                }]);

            if (profileError) {
                console.error('Lỗi tạo profile:', profileError);
                showStatusMessage('Lỗi tạo profile: ' + profileError.message, 'error');
                return false;
            }

            showStatusMessage('Đăng ký thành công! Tài khoản của bạn đang chờ phê duyệt.', 'success');
            
            // Clear form
            event.target.reset();
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);

            return true;
        }

    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        showStatusMessage('Lỗi đăng ký: ' + error.message, 'error');
        return false;
    }
}

// Validation functions
function validateRegistrationData(data) {
    // Check required fields
    if (!data.fullName || !data.email || !data.password || !data.confirmPassword || !data.userType || !data.reason) {
        showStatusMessage('Vui lòng điền đầy đủ thông tin bắt buộc!', 'error');
        return false;
    }

    // Validate email
    if (!isValidEmail(data.email)) {
        showStatusMessage('Email không hợp lệ!', 'error');
        return false;
    }

    // Validate password
    if (data.password.length < 6) {
        showStatusMessage('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
        return false;
    }

    // Check password confirmation
    if (data.password !== data.confirmPassword) {
        showStatusMessage('Mật khẩu xác nhận không khớp!', 'error');
        return false;
    }

    // Validate phone number (optional)
    if (data.phone && !isValidPhone(data.phone)) {
        showStatusMessage('Số điện thoại không hợp lệ!', 'error');
        return false;
    }

    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[0-9+\-\s()]+$/;
    return phoneRegex.test(phone) && phone.length >= 10;
}

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

// Setup event listeners
function setupRegisterEventListeners() {
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Password confirmation validation
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            if (passwordInput.value !== confirmPasswordInput.value) {
                confirmPasswordInput.setCustomValidity('Mật khẩu không khớp');
            } else {
                confirmPasswordInput.setCustomValidity('');
            }
        });
    }
}

// Export for global use
window.handleRegister = handleRegister;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', setupRegisterEventListeners); 