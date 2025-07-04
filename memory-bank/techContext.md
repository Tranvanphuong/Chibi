# Technical Context

## Technologies Used
- HTML5
- CSS3
- Vanilla JavaScript
- PDF.js (for secure PDF rendering)

## Project Structure
```
project/
│
├── index.html         # Main interface
├── style.css         # Styling
├── script.js         # Authentication and display logic
├── images/           # Learning materials
│   ├── class1/      # Level 1 content
│   └── class2/      # Level 2 content
```

## Technical Implementation Details
1. Authentication
   - Hardcoded user accounts in JavaScript
   - Session management using localStorage

2. PDF Display
   - Using PDF.js for secure rendering
   - Implementing view-only restrictions

3. Content Organization
   - Static file structure
   - Class-based content segregation

## Development Setup
1. No build tools required
2. Can be served from any static file server
3. Modern browser compatibility required 

## Responsive Design Requirements
- Mobile-first approach là ưu tiên hàng đầu
- Sử dụng media queries để tối ưu hiển thị trên các kích thước màn hình khác nhau
- Breakpoints chính:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- Đảm bảo các thành phần UI có thể scale tốt trên mobile
- Font size và spacing phải responsive
- Touch targets phải đủ lớn (tối thiểu 44x44px) cho mobile
- Tránh horizontal scrolling trên mobile 