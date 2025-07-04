import { loadLayout } from './js/utils.js';

// Initialize PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

// Hardcoded user accounts
const users = [
    { username: 'student1', password: 'pass123' },
    { username: 'student2', password: 'pass456' }
];

// PDF viewer state
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let currentPdfIndex = 0;

// Định nghĩa danh sách PDF cho từng lớp
const classPdfList = {
    1: [
        { name: 'Bài 1 - Hiragana', file: 'class1.pdf' }
    ],
    2: [
        { name: 'Bài 1 - Ngữ pháp cơ bản', file: 'class1.pdf' }
    ],
    3: [
        { name: 'Bài 1 - Ngữ pháp cơ bản', file: 'class1.pdf' }
    ],
    4: [
        { name: 'Bài 1 - Ngữ pháp cơ bản', file: 'class1.pdf' }
    ],
    5: [
        { name: 'Bài 1 - Ngữ pháp cơ bản', file: 'class1.pdf' }
    ],
    6: [
        { name: 'Bài 1 - Ngữ pháp cơ bản', file: 'class1.pdf' }
    ]
};

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

function logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
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

    // Initialize PDF viewer if on class page
    if (window.location.pathname.includes('class.html')) {
        initializePdfViewer();
    }
};

// PDF viewer functions
function initializePdfViewer() {
    const canvas = document.getElementById('pdfViewer');
    const ctx = canvas.getContext('2d');

    // Lấy level từ URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const level = parseInt(urlParams.get('level')) || 1;
    const pdfFiles = classPdfList[level] || [];

    document.getElementById('classLevel').textContent = level;
    document.getElementById('classDescription').textContent = `Nội dung bài học dành cho lớp ${level}`;

    // Load PDF file
    const loadPDF = async (pdfInfo) => {
        try {
            const loadingTask = pdfjsLib.getDocument(`images/class${level}/${pdfInfo.file}`);
            pdfDoc = await loadingTask.promise;
            document.getElementById('pageCount').textContent = pdfDoc.numPages;
            pageNum = 1;
            renderPage(pageNum);
            updatePdfNavigation();
        } catch (error) {
            console.error('Error loading PDF:', error);
            alert('Không thể tải tài liệu PDF. Vui lòng thử lại sau.');
        }
    };

    // Render PDF page
    const renderPage = (num) => {
        pageRendering = true;
        pdfDoc.getPage(num).then((page) => {
            let desiredWidth = 297;
            let desiredHeight = 425;
            
            // Kiểm tra nếu đang ở chế độ fullscreen
            if (document.fullscreenElement) {
                // Lấy kích thước màn hình
                const screenHeight = window.innerHeight;
                const screenWidth = window.innerWidth;
                
                // Tính toán scale để fit với chiều cao màn hình và giữ tỷ lệ
                const viewport = page.getViewport({ scale: 1.0 });
                const originalRatio = viewport.width / viewport.height;
                
                // Ưu tiên chiều cao tối đa
                desiredHeight = screenHeight;
                desiredWidth = screenHeight * originalRatio;
                
                // Nếu chiều rộng vượt quá màn hình, điều chỉnh lại
                if (desiredWidth > screenWidth) {
                    desiredWidth = screenWidth;
                    desiredHeight = screenWidth / originalRatio;
                }
            }
            
            const viewport = page.getViewport({ scale: 1.0 });
            const scaleX = desiredWidth / viewport.width;
            const scaleY = desiredHeight / viewport.height;
            const scale = Math.min(scaleX, scaleY);
            
            const scaledViewport = page.getViewport({ scale: scale });

            canvas.height = desiredHeight;
            canvas.width = desiredWidth;

            const renderContext = {
                canvasContext: ctx,
                viewport: scaledViewport
            };

            const renderTask = page.render(renderContext);
            renderTask.promise.then(() => {
                pageRendering = false;
                if (pageNumPending !== null) {
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }
            });
        });

        document.getElementById('pageNum').textContent = num;
    };

    // Previous page
    window.prevPage = () => {
        if (pageNum <= 1) {
            // Nếu đang ở trang đầu của PDF hiện tại, chuyển sang PDF trước đó
            if (currentPdfIndex > 0) {
                currentPdfIndex--;
                loadPDF(pdfFiles[currentPdfIndex]);
            }
            return;
        }
        pageNum--;
        queueRenderPage(pageNum);
    };

    // Next page
    window.nextPage = () => {
        if (pageNum >= pdfDoc.numPages) {
            // Nếu đang ở trang cuối của PDF hiện tại, chuyển sang PDF tiếp theo
            if (currentPdfIndex < pdfFiles.length - 1) {
                currentPdfIndex++;
                loadPDF(pdfFiles[currentPdfIndex]);
            }
            return;
        }
        pageNum++;
        queueRenderPage(pageNum);
    };

    // Queue rendering of the page
    const queueRenderPage = (num) => {
        if (pageRendering) {
            pageNumPending = num;
        } else {
            renderPage(num);
        }
    };

    // Toggle fullscreen
    window.toggleFullscreen = () => {
        const pdfContainer = document.querySelector('.pdf-container');
        const pdfheader = document.querySelector('.pdf-header');
        const fullscreenBtn = document.querySelector('.fullscreen-button');

        if (!document.fullscreenElement) {
            pdfContainer.requestFullscreen().then(() => {
                pdfContainer.classList.add('fullscreen');
                canvas.classList.add('fullscreen-mode');
                pdfheader.classList.add('d-none');
                fullscreenBtn.classList.add('active');
                // Re-render trang hiện tại với kích thước mới
                renderPage(pageNum);
            }).catch(err => {
                alert(`Lỗi khi chuyển sang chế độ toàn màn hình: ${err.message}`);
            });
        } else {
            document.exitFullscreen().then(() => {
                pdfContainer.classList.remove('fullscreen');
                canvas.classList.remove('fullscreen-mode');
                pdfheader.classList.remove('d-none');
                fullscreenBtn.classList.remove('active');
                // Re-render trang hiện tại với kích thước mặc định
                renderPage(pageNum);
            });
        }
    };

    // Thêm event listener cho sự kiện thay đổi kích thước màn hình
    window.addEventListener('resize', () => {
        if (document.fullscreenElement) {
            renderPage(pageNum);
        }
    });

    // Cập nhật thông tin điều hướng PDF
    const updatePdfNavigation = () => {
        const pdfTitle = document.getElementById('pdfTitle');
        const prevBtn = document.getElementById('prevPdfBtn');
        const nextBtn = document.getElementById('nextPdfBtn');

        if (pdfTitle && pdfFiles[currentPdfIndex]) {
            pdfTitle.textContent = `Tài liệu ${currentPdfIndex + 1}/${pdfFiles.length}: ${pdfFiles[currentPdfIndex].name}`;
        }

        // Cập nhật trạng thái các nút điều hướng
        if (prevBtn) {
            prevBtn.disabled = currentPdfIndex <= 0;
        }
        if (nextBtn) {
            nextBtn.disabled = currentPdfIndex >= pdfFiles.length - 1;
        }
    };

    // Chuyển đến tài liệu PDF trước
    window.prevPdf = () => {
        if (currentPdfIndex > 0) {
            currentPdfIndex--;
            loadPDF(pdfFiles[currentPdfIndex]);
        }
    };

    // Chuyển đến tài liệu PDF tiếp theo
    window.nextPdf = () => {
        if (currentPdfIndex < pdfFiles.length - 1) {
            currentPdfIndex++;
            loadPDF(pdfFiles[currentPdfIndex]);
        }
    };

    // Kiểm tra và tải PDF đầu tiên nếu có
    if (pdfFiles.length > 0) {
        loadPDF(pdfFiles[0]);
    } else {
        document.getElementById('pdfTitle').textContent = 'Không có tài liệu cho lớp này';
    }
}

// Prevent keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        return false;
    }
});

// Add keyboard shortcuts for navigation and fullscreen
document.addEventListener('keydown', (e) => {
    // Prevent Ctrl shortcuts
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        return false;
    }

    const container = document.getElementById('pdfViewerContainer');
    
    // Only handle navigation keys when in fullscreen mode
    if (container && container.classList.contains('fullscreen')) {
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