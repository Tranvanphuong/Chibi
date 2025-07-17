// Admin Dashboard module với Supabase
import { supabaseClient } from './supabase-config.js';

// Global variables
let allUsers = [];
let filteredUsers = [];
let currentUser = null;

// Admin functions
export async function loadUsers() {
    try {
        const { data, error } = await supabaseClient
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Lỗi tải dữ liệu:', error);
            return;
        }

        allUsers = data || [];
        filteredUsers = [...allUsers];
        
        updateStats();
        renderUsersTable();
        setupFilters();
    } catch (error) {
        console.error('Lỗi tải dữ liệu:', error);
    }
}

export async function updateUserStatus(userId, status) {
    try {
        const { error } = await supabaseClient
            .from('user_profiles')
            .update({
                status: status,
                approved_at: status === 'approved' ? new Date().toISOString() : null,
                approved_by: currentUser?.id
            })
            .eq('id', userId);

        if (error) {
            console.error('Lỗi cập nhật trạng thái:', error);
            alert('Lỗi cập nhật trạng thái: ' + error.message);
            return false;
        }

        // Update local data
        const userIndex = allUsers.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            allUsers[userIndex].status = status;
            allUsers[userIndex].approved_at = status === 'approved' ? new Date().toISOString() : null;
            allUsers[userIndex].approved_by = currentUser?.id;
        }

        updateStats();
        renderUsersTable();
        
        alert(`Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} tài khoản thành công!`);
        return true;
    } catch (error) {
        console.error('Lỗi cập nhật trạng thái:', error);
        alert('Lỗi cập nhật trạng thái: ' + error.message);
        return false;
    }
}

// UI functions
function updateStats() {
    const total = allUsers.length;
    const pending = allUsers.filter(u => u.status === 'pending').length;
    const approved = allUsers.filter(u => u.status === 'approved').length;
    const rejected = allUsers.filter(u => u.status === 'rejected').length;

    document.getElementById('totalUsers').textContent = total;
    document.getElementById('pendingUsers').textContent = pending;
    document.getElementById('approvedUsers').textContent = approved;
    document.getElementById('rejectedUsers').textContent = rejected;
}

function renderUsersTable() {
    const container = document.getElementById('usersTableContainer');
    
    if (filteredUsers.length === 0) {
        container.innerHTML = '<div class="no-data">Không có dữ liệu</div>';
        return;
    }

    const table = `
        <table class="users-table">
            <thead>
                <tr>
                    <th>Tên</th>
                    <th>Email</th>
                    <th>Loại tài khoản</th>
                    <th>Trạng thái</th>
                    <th>Ngày đăng ký</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody>
                ${filteredUsers.map(user => `
                    <tr>
                        <td>${user.full_name || 'N/A'}</td>
                        <td>${user.email || 'N/A'}</td>
                        <td>${getUserTypeLabel(user.user_type)}</td>
                        <td>
                            <span class="status-badge status-${user.status}">
                                ${getStatusLabel(user.status)}
                            </span>
                        </td>
                        <td>${formatDate(user.created_at)}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-view" onclick="viewUserDetails('${user.id}')">
                                    Xem chi tiết
                                </button>
                                ${user.status === 'pending' ? `
                                    <button class="btn-approve" onclick="approveUser('${user.id}')">
                                        Duyệt
                                    </button>
                                    <button class="btn-reject" onclick="rejectUser('${user.id}')">
                                        Từ chối
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

function setupFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const userTypeFilter = document.getElementById('userTypeFilter');
    const searchInput = document.getElementById('searchInput');

    // Status filter
    statusFilter.addEventListener('change', filterUsers);
    
    // User type filter
    userTypeFilter.addEventListener('change', filterUsers);
    
    // Search filter
    searchInput.addEventListener('input', filterUsers);
}

function filterUsers() {
    const statusFilter = document.getElementById('statusFilter').value;
    const userTypeFilter = document.getElementById('userTypeFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    filteredUsers = allUsers.filter(user => {
        const matchesStatus = !statusFilter || user.status === statusFilter;
        const matchesType = !userTypeFilter || user.user_type === userTypeFilter;
        const matchesSearch = !searchTerm || 
            (user.full_name && user.full_name.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm));

        return matchesStatus && matchesType && matchesSearch;
    });

    renderUsersTable();
}

// Helper functions
function getUserTypeLabel(userType) {
    const labels = {
        'student': 'Học sinh/Sinh viên',
        'teacher': 'Giáo viên',
        'parent': 'Phụ huynh',
        'other': 'Khác'
    };
    return labels[userType] || userType || 'N/A';
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'Chờ duyệt',
        'approved': 'Đã duyệt',
        'rejected': 'Từ chối'
    };
    return labels[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
}

// Modal functions
export function viewUserDetails(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const modal = document.getElementById('userModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = `Chi tiết: ${user.full_name}`;

    modalBody.innerHTML = `
        <div class="user-details">
            <h4>Thông tin cá nhân</h4>
            <p><strong>Tên:</strong> ${user.full_name || 'N/A'}</p>
            <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
            <p><strong>Số điện thoại:</strong> ${user.phone || 'N/A'}</p>
            <p><strong>Tổ chức:</strong> ${user.organization || 'N/A'}</p>
            <p><strong>Loại tài khoản:</strong> ${getUserTypeLabel(user.user_type)}</p>
            <p><strong>Trạng thái:</strong> <span class="status-badge status-${user.status}">${getStatusLabel(user.status)}</span></p>
            <p><strong>Ngày đăng ký:</strong> ${formatDate(user.created_at)}</p>
            ${user.approved_at ? `<p><strong>Ngày duyệt:</strong> ${formatDate(user.approved_at)}</p>` : ''}
        </div>
        
        ${user.reason ? `
            <div class="user-details">
                <h4>Lý do đăng ký</h4>
                <div class="reason-text">${user.reason}</div>
            </div>
        ` : ''}
        
        ${user.status === 'pending' ? `
            <div style="margin-top: 2rem; text-align: center;">
                <button class="btn-approve" onclick="approveUser('${user.id}')" style="margin-right: 1rem;">
                    Duyệt tài khoản
                </button>
                <button class="btn-reject" onclick="rejectUser('${user.id}')">
                    Từ chối
                </button>
            </div>
        ` : ''}
    `;

    modal.style.display = 'block';
}

export function closeModal() {
    const modal = document.getElementById('userModal');
    modal.style.display = 'none';
}

// Global functions for buttons
window.approveUser = async function(userId) {
    if (confirm('Bạn có chắc chắn muốn duyệt tài khoản này?')) {
        await updateUserStatus(userId, 'approved');
        closeModal();
    }
};

window.rejectUser = async function(userId) {
    if (confirm('Bạn có chắc chắn muốn từ chối tài khoản này?')) {
        await updateUserStatus(userId, 'rejected');
        closeModal();
    }
};

window.viewUserDetails = viewUserDetails;
window.closeModal = closeModal;

// Initialize admin dashboard
export async function initAdmin() {
    // Check if user is admin
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    if (error || !user) {
        alert('Bạn cần đăng nhập để truy cập trang admin!');
        window.location.href = 'login.html';
        return;
    }

    currentUser = user;
    
    // Check if user is approved (simple admin check)
    const { data: profile } = await supabaseClient
        .from('user_profiles')
        .select('status')
        .eq('id', user.id)
        .single();

    if (!profile || profile.status !== 'approved') {
        alert('Bạn không có quyền truy cập trang admin!');
        window.location.href = 'index.html';
        return;
    }

    // Display admin info
    document.getElementById('adminInfo').textContent = `Admin: ${user.email}`;

    // Load users
    await loadUsers();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('userModal');
    if (event.target === modal) {
        closeModal();
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAdmin); 