import { loadLayout } from './js/utils.js';

// Hardcoded user accounts
const users = [
    { username: 'student1', password: 'pass123' },
    { username: 'student2', password: 'pass456' }
];

// Image viewer state
let currentImageIndex = 1;
let totalImages = 0;
let currentZoom = 1;
let isDragging = false;
let startX;
let startY;
let translateX = 0;
let translateY = 0;

// Authentication
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        localStorage.setItem('isLoggedIn', 'true');
        window.location.href = 'index.html';
    } else {
        alert('Tên đăng nhập hoặc mật khẩu không đúng!');
    }
}

// Check login status on page load
window.onload = async function() {
    // Load layout
    await loadLayout();

    // Check login status
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginBtn = document.querySelector('.login-btn');
    
    if (isLoggedIn) {
        if (loginBtn) {
            loginBtn.textContent = 'Đăng xuất';
            loginBtn.href = '#';
            loginBtn.onclick = logout;
        }
    }

    // Initialize image viewer if on class page
    if (window.location.pathname.includes('class.html')) {
        initializeImageViewer();
    }
};

// Image viewer functions
function initializeImageViewer() {
    // Get level from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const level = parseInt(urlParams.get('level')) || 1;

    document.getElementById('classLevel').textContent = level;
    document.getElementById('classDescription').textContent = `Nội dung bài học dành cho lớp ${level}`;

    // Load first image
    loadImage(level, currentImageIndex);

    // Add event listeners for drag functionality
    const imageElement = document.getElementById('lessonImage');
    imageElement.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    
    // Touch events for mobile
    imageElement.addEventListener('touchstart', startDrag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', endDrag);

    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyPress);
}

function loadImage(level, index) {
    const imageElement = document.getElementById('lessonImage');
    const imageTitle = document.getElementById('imageTitle');
    const imageNum = document.getElementById('imageNum');
    const imageCount = document.getElementById('imageCount');

    // Reset zoom and position
    resetZoom();

    // Update image source
    imageElement.src = `images/class${level}/${index}.png`;
    imageTitle.textContent = `Bài học ${index}`;
    imageNum.textContent = index;

    // Update total images count if not set
    if (!totalImages) {
        // We'll use the onload event to check if the image exists
        imageElement.onload = () => {
            currentImageIndex = index;
        };
        imageElement.onerror = () => {
            // If image doesn't load, we've reached the end
            if (index === 1) {
                imageTitle.textContent = 'Không có bài học';
                imageElement.src = ''; // Clear image source
            } else {
                totalImages = index - 1;
                imageCount.textContent = totalImages;
                // Go back to last valid image
                loadImage(level, totalImages);
            }
        };
    }
}

window.prevImage = () => {
    if (currentImageIndex > 1) {
        currentImageIndex--;
        const level = parseInt(new URLSearchParams(window.location.search).get('level')) || 1;
        loadImage(level, currentImageIndex);
    }
};

window.nextImage = () => {
    if (!totalImages || currentImageIndex < totalImages) {
        currentImageIndex++;
        const level = parseInt(new URLSearchParams(window.location.search).get('level')) || 1;
        loadImage(level, currentImageIndex);
    }
};

window.toggleFullscreen = () => {
    const container = document.querySelector('.image-container');
    const fullscreenBtn = document.querySelector('.fullscreen-button');

    if (!document.fullscreenElement) {
        container.requestFullscreen().then(() => {
            container.classList.add('fullscreen');
            fullscreenBtn.classList.add('active');
            resetZoom(); // Reset zoom when entering fullscreen
        }).catch(err => {
            alert(`Lỗi khi chuyển sang chế độ toàn màn hình: ${err.message}`);
        });
    } else {
        document.exitFullscreen().then(() => {
            container.classList.remove('fullscreen');
            fullscreenBtn.classList.remove('active');
            resetZoom(); // Reset zoom when exiting fullscreen
        });
    }
};

// Zoom functions
window.zoomIn = () => {
    if (currentZoom < 3) { // Max zoom is 3x
        currentZoom += 0.25;
        updateZoom();
    }
};

window.zoomOut = () => {
    if (currentZoom > 0.5) { // Min zoom is 0.5x
        currentZoom -= 0.25;
        updateZoom();
    }
};

window.resetZoom = () => {
    currentZoom = 1;
    translateX = 0;
    translateY = 0;
    updateZoom();
};

function updateZoom() {
    const image = document.getElementById('lessonImage');
    image.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
}

// Drag functionality
function startDrag(e) {
    if (currentZoom > 1) { // Only allow drag when zoomed in
        isDragging = true;
        if (e.type === 'mousedown') {
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
        } else if (e.type === 'touchstart') {
            startX = e.touches[0].clientX - translateX;
            startY = e.touches[0].clientY - translateY;
        }
    }
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();

    let clientX, clientY;
    if (e.type === 'mousemove') {
        clientX = e.clientX;
        clientY = e.clientY;
    } else if (e.type === 'touchmove') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    }

    translateX = clientX - startX;
    translateY = clientY - startY;

    // Limit drag area based on zoom level
    const image = document.getElementById('lessonImage');
    const bounds = image.getBoundingClientRect();
    const maxX = (bounds.width * (currentZoom - 1)) / 2;
    const maxY = (bounds.height * (currentZoom - 1)) / 2;

    translateX = Math.max(-maxX, Math.min(maxX, translateX));
    translateY = Math.max(-maxY, Math.min(maxY, translateY));

    updateZoom();
}

function endDrag() {
    isDragging = false;
}

function handleKeyPress(e) {
    // Prevent default behavior for arrow keys
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
    }

    // Only handle navigation keys when not in an input field
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        switch(e.key) {
            case 'ArrowLeft':
                prevImage();
                break;
            case 'ArrowRight':
                nextImage();
                break;
            case 'ArrowUp':
                zoomIn();
                break;
            case 'ArrowDown':
                zoomOut();
                break;
            case 'Escape':
                if (document.fullscreenElement) {
                    toggleFullscreen();
                }
                break;
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
}

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const hamburger = document.querySelector('.hamburger');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!menuToggle.contains(event.target) && !mobileMenu.contains(event.target)) {
                mobileMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    }
}); 