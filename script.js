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
let currentImage = null;

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
    const canvas = document.getElementById('lessonCanvas');
    canvas.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', startDrag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', endDrag);

    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyPress);

    // Handle window resize
    window.addEventListener('resize', () => {
        if (currentImage) {
            drawImage();
        }
    });
}

function loadImage(level, index) {
    const imageTitle = document.getElementById('imageTitle');
    const imageNum = document.getElementById('imageNum');
    const imageCount = document.getElementById('imageCount');

    // Reset zoom and position
    resetZoom();

    // Create new image object
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Try to load image with CORS
    img.src = `images/class${level}/${index}.png`;
    
    // Update UI
    imageTitle.textContent = `Bài học ${index}`;
    imageNum.textContent = index;

    // Handle image load
    img.onload = () => {
        currentImage = img;
        currentImageIndex = index;
        drawImage();
    };

    // Handle image error
    img.onerror = () => {
        if (index === 1) {
            imageTitle.textContent = 'Không có bài học';
            const canvas = document.getElementById('lessonCanvas');
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
            totalImages = index - 1;
            imageCount.textContent = totalImages;
            loadImage(level, totalImages);
        }
    };
}

function drawImage() {
    if (!currentImage) return;

    const canvas = document.getElementById('lessonCanvas');
    const ctx = canvas.getContext('2d');
    
    // Calculate dimensions
    let width = currentImage.width;
    let height = currentImage.height;
    const maxWidth = window.innerWidth * 0.8;
    const maxHeight = window.innerHeight * 0.7;

    // Scale image to fit screen while maintaining aspect ratio
    if (width > maxWidth) {
        const ratio = maxWidth / width;
        width *= ratio;
        height *= ratio;
    }

    if (height > maxHeight) {
        const ratio = maxHeight / height;
        width *= ratio;
        height *= ratio;
    }

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(currentZoom, currentZoom);
    ctx.translate(-canvas.width / 2 + translateX / currentZoom, -canvas.height / 2 + translateY / currentZoom);

    // Draw image
    ctx.drawImage(currentImage, 0, 0, width, height);

    // Add watermark
    ctx.globalAlpha = 0.1;
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText('Chibi Japanese Learning', width / 2, height / 2);

    ctx.restore();
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
            resetZoom();
            drawImage();
        }).catch(err => {
            alert(`Lỗi khi chuyển sang chế độ toàn màn hình: ${err.message}`);
        });
    } else {
        document.exitFullscreen().then(() => {
            container.classList.remove('fullscreen');
            fullscreenBtn.classList.remove('active');
            resetZoom();
            drawImage();
        });
    }
};

// Zoom functions
window.zoomIn = () => {
    if (currentZoom < 3) {
        currentZoom += 0.25;
        drawImage();
    }
};

window.zoomOut = () => {
    if (currentZoom > 0.5) {
        currentZoom -= 0.25;
        drawImage();
    }
};

window.resetZoom = () => {
    currentZoom = 1;
    translateX = 0;
    translateY = 0;
    drawImage();
};

// Drag functionality
function startDrag(e) {
    if (currentZoom > 1) {
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
    const canvas = document.getElementById('lessonCanvas');
    const bounds = canvas.getBoundingClientRect();
    const maxX = (bounds.width * (currentZoom - 1)) / 2;
    const maxY = (bounds.height * (currentZoom - 1)) / 2;

    translateX = Math.max(-maxX, Math.min(maxX, translateX));
    translateY = Math.max(-maxY, Math.min(maxY, translateY));

    drawImage();
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