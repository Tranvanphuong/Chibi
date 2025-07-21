document.addEventListener('DOMContentLoaded', function() {
    // Lấy các elements
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    const clearBtn = document.getElementById('clear-btn');
    const undoBtn = document.getElementById('undo-btn');
    const penWidth = document.getElementById('pen-width');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const lessonCounter = document.getElementById('lesson-counter');
    const classTitle = document.getElementById('class-title');
    // const lessonTitle = document.getElementById('lesson-title');
    const characterImage = document.getElementById('character-image');
    const lessonDescription = document.getElementById('lesson-description');
    
    // Biến quản lý trạng thái
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let drawingHistory = [];
    let currentPath = [];
    
    // Biến quản lý bài học
    let currentClass = new URLSearchParams(window.location.search).get('class') || 'class1';
    let currentLessonIndex = 0;
    let totalLessons = 0;

    // Lấy số lớp từ URL (class1 -> 1)
    const classNumber = currentClass.replace('class', '');
    classTitle.textContent = `Lớp ${classNumber}`;

    // Tải và kiểm tra ảnh
    function checkImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }

    // Tải danh sách bài học
    async function loadLessons() {
        let index = 1;
        let foundImages = [];

        // Kiểm tra từng ảnh theo số thứ tự
        while (true) {
            const imagePath = `images/writing/class${classNumber}/${index}.png`;
            const exists = await checkImage(imagePath);
            
            if (!exists) {
                break;
            }

            foundImages.push({
                id: index,
                path: imagePath
            });
            index++;
        }

        // Cập nhật tổng số bài học
        totalLessons = foundImages.length;

        if (totalLessons > 0) {
            updateLesson();
        } else {
            // lessonTitle.textContent = 'Chưa có bài học';
            lessonDescription.textContent = 'Chưa có dữ liệu bài học cho lớp này';
            characterImage.style.display = 'none';
            prevBtn.disabled = true;
            nextBtn.disabled = true;
        }
    }

    // Cập nhật UI bài học
    function updateLesson() {
        const currentId = currentLessonIndex + 1;
        const imagePath = `images/writing/class${classNumber}/${currentId}.png`;

        // lessonTitle.textContent = `Bài ${currentId}`;
        // lessonDescription.textContent = `Tập viết bài ${currentId}`;
        
        // Tải ảnh mới
        const img = new Image();
        img.onload = function() {
            characterImage.src = this.src;
            characterImage.style.display = 'block';
        };
        img.onerror = function() {
            console.error('Không thể tải ảnh:', imagePath);
            characterImage.style.display = 'none';
            lessonDescription.textContent = 'Không thể tải ảnh bài học';
        };
        img.src = imagePath;

        lessonCounter.textContent = `${currentLessonIndex + 1}/${totalLessons}`;
        
        // Cập nhật trạng thái nút
        prevBtn.disabled = currentLessonIndex === 0;
        nextBtn.disabled = currentLessonIndex === totalLessons - 1;

        // Xóa canvas khi chuyển bài
        clearCanvas();
    }

    // Xử lý sự kiện chuyển bài
    prevBtn.addEventListener('click', function() {
        if (currentLessonIndex > 0) {
            currentLessonIndex--;
            updateLesson();
        }
    });

    nextBtn.addEventListener('click', function() {
        if (currentLessonIndex < totalLessons - 1) {
            currentLessonIndex++;
            updateLesson();
        }
    });

    // Thiết lập kích thước canvas
    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth - 32;
        canvas.height = container.clientHeight - 32;
        
        // Vẽ lại nội dung sau khi resize
        if (drawingHistory.length > 0) {
            const img = new Image();
            img.src = drawingHistory[drawingHistory.length - 1];
            img.onload = function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
        }
    }

    // Xóa canvas
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawingHistory = [];
        undoBtn.disabled = true;
    }

    // Khởi tạo canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Thiết lập style mặc định
    ctx.strokeStyle = '#000';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = penWidth.value;

    // Cập nhật độ dày bút
    penWidth.addEventListener('input', function() {
        ctx.lineWidth = this.value;
    });

    // Xử lý sự kiện vẽ
    function startDrawing(e) {
        isDrawing = true;
        [lastX, lastY] = getCoordinates(e);
        currentPath = [[lastX, lastY]];
    }

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();

        const [x, y] = getCoordinates(e);
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();

        currentPath.push([x, y]);
        [lastX, lastY] = [x, y];
    }

    function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;
        
        if (currentPath.length > 1) {
            drawingHistory.push(canvas.toDataURL());
            undoBtn.disabled = false;
        }
    }

    // Lấy tọa độ chuột/touch
    function getCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if (e.touches && e.touches[0]) {
            return [
                (e.touches[0].clientX - rect.left) * scaleX,
                (e.touches[0].clientY - rect.top) * scaleY
            ];
        }
        return [
            (e.clientX - rect.left) * scaleX,
            (e.clientY - rect.top) * scaleY
        ];
    }

    // Xử lý sự kiện xóa
    clearBtn.addEventListener('click', clearCanvas);

    // Xử lý sự kiện hoàn tác
    undoBtn.addEventListener('click', function() {
        if (drawingHistory.length === 0) return;
        
        drawingHistory.pop();
        
        if (drawingHistory.length === 0) {
            clearCanvas();
            return;
        }

        const img = new Image();
        img.src = drawingHistory[drawingHistory.length - 1];
        img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    });

    // Đăng ký các sự kiện mouse
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Đăng ký các sự kiện touch
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);

    // Tải dữ liệu bài học và khởi tạo
    loadLessons();
}); 