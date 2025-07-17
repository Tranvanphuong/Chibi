# Hướng dẫn Setup Supabase cho Chibi App

## Bước 1: Tạo Supabase Project

1. Truy cập [supabase.com](https://supabase.com)
2. Đăng ký tài khoản miễn phí
3. Tạo project mới với tên "chibi-app"
4. Chọn region gần nhất (ví dụ: Singapore)

## Bước 2: Cấu hình Authentication

### 2.1. Setup Google OAuth
1. Vào **Authentication** > **Providers**
2. Enable **Google**
3. Tạo Google OAuth credentials:
   - Truy cập [Google Cloud Console](https://console.cloud.google.com/)
   - Tạo project mới hoặc chọn project có sẵn
   - Enable Google+ API
   - Tạo OAuth 2.0 Client ID cho Web application
   - Thêm domain: `localhost:3000` (cho development)
   - Thêm domain production của bạn khi deploy

### 2.2. Cấu hình Redirect URLs
Trong Supabase Dashboard > Authentication > URL Configuration:
- Site URL: `http://localhost:3000` (development)
- Redirect URLs: 
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/login.html`

## Bước 3: Tạo Database Schema

### 3.1. Tạo bảng user_profiles
Vào **SQL Editor** và chạy:

```sql
-- Tạo bảng user_profiles để lưu thông tin bổ sung
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
  reason TEXT -- lý do đăng ký
);

-- Tạo RLS (Row Level Security) policies
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
```

### 3.2. Tạo function để tự động tạo profile
```sql
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

## Bước 4: Lấy API Keys

1. Vào **Settings** > **API**
2. Copy các thông tin:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public**: Public anon key
   - **service_role secret**: Service role key (chỉ dùng cho admin)

## Bước 5: Cập nhật Config

Thay thế các giá trị trong `supabase-config.js`:
```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key',
    serviceKey: 'your-service-key'
};
```

## Bước 6: Test

1. Chạy ứng dụng local
2. Test đăng ký với Google
3. Kiểm tra database có user mới không
4. Test admin dashboard

## Lưu ý quan trọng:

- **Development**: Sử dụng `localhost:3000`
- **Production**: Thay đổi domain trong Google OAuth và Supabase settings
- **Security**: Không commit service key vào git
- **Backup**: Export database định kỳ 