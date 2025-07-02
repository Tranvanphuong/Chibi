// Initialize PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

// Hardcoded user accounts
const users = [
    { username: 'student1', password: 'pass123' },
    { username: 'student2', password: 'pass456' }
];

// PDF viewer state
let currentPdf = null;
let currentPage = 1;
let totalPages = 0;

// Authentication
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        localStorage.setItem('isLoggedIn', 'true');
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
    } else {
        alert('Tên đăng nhập hoặc mật khẩu không đúng!');
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// Check login status on page load
window.onload = function() {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
    }
};

// Class selection and PDF loading
async function selectClass(className) {
    const pdfPath = `images/${className}/${className}.pdf`;
    try {
        const loadingTask = pdfjsLib.getDocument(pdfPath);
        currentPdf = await loadingTask.promise;
        totalPages = currentPdf.numPages;
        currentPage = 1;
        
        document.getElementById('pageCount').textContent = totalPages;
        renderPage(currentPage);
    } catch (error) {
        console.error('Error loading PDF:', error);
        alert('Không thể tải tài liệu. Vui lòng thử lại sau.');
    }
}

// PDF rendering
async function renderPage(pageNumber) {
    try {
        const page = await currentPdf.getPage(pageNumber);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;

        const container = document.getElementById('pdfViewerContainer');
        container.innerHTML = '';
        container.appendChild(canvas);
        
        document.getElementById('pageNum').textContent = pageNumber;
    } catch (error) {
        console.error('Error rendering page:', error);
        alert('Không thể hiển thị trang. Vui lòng thử lại.');
    }
}

// Navigation
function prevPage() {
    if (currentPdf && currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
    }
}

function nextPage() {
    if (currentPdf && currentPage < totalPages) {
        currentPage++;
        renderPage(currentPage);
    }
}

// Prevent right-click on PDF viewer
document.getElementById('pdfViewerContainer').addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
});

// Prevent keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        return false;
    }
});

// Fullscreen functionality
function toggleFullscreen() {
    const container = document.getElementById('pdfViewerContainer');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const fullscreenText = fullscreenBtn.querySelector('.fullscreen-text');

    if (!container.classList.contains('fullscreen')) {
        container.classList.add('fullscreen');
        fullscreenText.textContent = 'Thoát Toàn Màn Hình';
        
        // Re-render current page to adjust to new size
        renderPage(currentPage);
    } else {
        container.classList.remove('fullscreen');
        fullscreenText.textContent = 'Toàn Màn Hình';
        
        // Re-render current page to adjust to original size
        renderPage(currentPage);
    }
}

// Add ESC key handler for fullscreen
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const container = document.getElementById('pdfViewerContainer');
        if (container.classList.contains('fullscreen')) {
            toggleFullscreen();
        }
    }
});

// Add click event for fullscreen button
document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

// Add keyboard shortcuts for navigation and fullscreen
document.addEventListener('keydown', (e) => {
    // Prevent Ctrl shortcuts
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        return false;
    }

    const container = document.getElementById('pdfViewerContainer');
    
    // Only handle navigation keys when in fullscreen mode
    if (container.classList.contains('fullscreen')) {
        switch(e.key) {
            case 'Escape':
                toggleFullscreen();
                break;
            case 'ArrowRight':
                nextPage();
                break;
            case 'ArrowLeft':
                prevPage();
                break;
        }
    }
}); 