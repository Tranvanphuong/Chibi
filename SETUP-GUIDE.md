# 🚀 Hướng dẫn Setup Hệ thống Authentication với Supabase (Đơn giản hóa)

## 📋 Tổng quan

Hệ thống authentication đã được đơn giản hóa với các tính năng:
- ✅ Đăng ký/đăng nhập bằng email/password
- ✅ Hệ thống duyệt tài khoản
- ✅ Admin dashboard quản lý
- ✅ Database PostgreSQL (Supabase)
- ✅ Bảo mật với Row Level Security (RLS)
- ❌ **Đã loại bỏ Google OAuth** để đơn giản hóa

## 🛠️ Bước 1: Setup Supabase Project

### 1.1. Tạo tài khoản Supabase
1. Truy cập [supabase.com](https://supabase.com)
2. Đăng ký tài khoản miễn phí
3. Tạo project mới với tên "chibi-app"
4. Chọn region gần nhất (ví dụ: Singapore)

### 1.2. Cấu hình Authentication
1. Vào **Authentication** > **Settings**
2. Enable **Email confirmations** (tùy chọn)
3. Cấu hình **Site URL**: `http://localhost:3000` (development)

## 🗄️ Bước 2: Tạo Database Schema

### 2.1. Chạy SQL Scripts
Vào **SQL Editor** và chạy các script sau:

```sql
-- Tạo bảng user_profiles
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID,
  phone TEXT,
  organization TEXT,
  reason TEXT, -- lý do đăng ký
  user_type TEXT -- student, teacher, parent, other
);

-- Tạo RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy cho user xem profile của chính mình
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy cho user cập nhật profile của chính mình
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy cho admin xem tất cả profiles
CREATE POLICY "Admin can view all profiles" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND status = 'approved'
    )
  );

-- Function để tự động tạo user_profile khi user đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger để tự động gọi function khi có user mới
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 🔑 Bước 3: Lấy API Keys

1. Vào **Settings** > **API**
2. Copy các thông tin:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public**: Public anon key
   - **service_role secret**: Service role key (chỉ dùng cho admin)

## ⚙️ Bước 4: Cập nhật Configuration

### 4.1. Cập nhật supabase-config.js
Thay thế các giá trị trong `supabase-config.js`:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key',
    serviceKey: 'your-service-key'
};
```

### 4.2. Cập nhật các file khác
Thay thế các giá trị trong:
- `auth.js`
- `register.js`
- `admin.js`

## 🚀 Bước 5: Test và Deploy

### 5.1. Test Local
1. Chạy server local:
   ```bash
   python -m http.server 3000
   ```
2. Truy cập `http://localhost:3000`
3. Test đăng ký tài khoản mới
4. Test admin dashboard

### 5.2. Deploy Production
1. Upload files lên hosting (Netlify, Vercel, etc.)
2. Cập nhật domain trong Supabase settings
3. Test lại toàn bộ flow

## 📁 Cấu trúc Files

```
Chibi/
├── login.html              # Trang đăng nhập (đơn giản)
├── register.html           # Trang đăng ký (đơn giản)
├── admin.html              # Admin dashboard
├── auth.js                 # Authentication logic (đơn giản)
├── register.js             # Registration logic (đơn giản)
├── admin.js                # Admin dashboard logic
├── supabase-config.js      # Supabase configuration
├── README-SUPABASE-SETUP.md # Hướng dẫn chi tiết
└── SETUP-GUIDE.md         # Hướng dẫn này
```

## 🔐 Bảo mật

### Security Best Practices:
1. **Không commit API keys** vào git
2. **Sử dụng environment variables** cho production
3. **Enable RLS** cho tất cả tables
4. **Validate input** ở frontend và backend
5. **Rate limiting** cho API calls

### Environment Variables (Production):
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

## 🎯 Tính năng chính

### User Flow:
1. **Đăng ký**: User đăng ký với email/password → Status: pending
2. **Duyệt**: Admin duyệt → Status: approved
3. **Đăng nhập**: User đăng nhập với email/password → Truy cập ứng dụng

### Admin Features:
- ✅ Xem danh sách tất cả users
- ✅ Filter theo status, user type
- ✅ Search theo tên, email
- ✅ Duyệt/từ chối tài khoản
- ✅ Xem chi tiết user profile
- ✅ Thống kê số lượng users

### User Features:
- ✅ Đăng ký với email/password
- ✅ Đăng nhập với email/password
- ✅ Fallback login (hardcoded users)
- ✅ Kiểm tra trạng thái tài khoản
- ✅ Validation form đầy đủ

## 🐛 Troubleshooting

### Lỗi thường gặp:

1. **"Invalid email or password"**
   - Kiểm tra email và password
   - Đảm bảo tài khoản đã được duyệt

2. **"RLS policy violation"**
   - Kiểm tra RLS policies trong database
   - Đảm bảo user có quyền truy cập

3. **"User not found"**
   - Kiểm tra trigger function
   - Kiểm tra user_profiles table

4. **"Email already exists"**
   - Kiểm tra email đã được đăng ký chưa
   - Sử dụng email khác

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra console logs
2. Kiểm tra Supabase logs
3. Kiểm tra network requests
4. Đảm bảo tất cả config đúng

## 🎉 Hoàn thành!

Sau khi setup xong, bạn sẽ có:
- ✅ Hệ thống authentication đơn giản
- ✅ Admin dashboard quản lý
- ✅ Database PostgreSQL
- ✅ Bảo mật tốt
- ✅ Scalable architecture
- ✅ Không cần Google OAuth phức tạp

Chúc bạn thành công! 🚀 