// Supabase Configuration
// Thay thế các giá trị này bằng thông tin từ Supabase project của bạn

// Import Supabase library (available globally from CDN)
const { createClient } = supabase;

const SUPABASE_CONFIG = {
    url: 'https://hwthkhdwpmgvysngruti.supabase.co', // Ví dụ: https://your-project.supabase.co
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3dGhraGR3cG1ndnlzbmdydXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMzM3MzAsImV4cCI6MjA2NzYwOTczMH0.-UndAjNjkyiOPaSSvBP19MB67ae0aajHpYQClGbmZ-Q', // Public anon key
    serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3dGhraGR3cG1ndnlzbmdydXRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAzMzczMCwiZXhwIjoyMDY3NjA5NzMwfQ.6B_DJoUKGaIvDFSr5bPAyl-JyylMX2_CVj7q-TjY2_k' // Service role key (chỉ dùng cho admin)
};

// Khởi tạo Supabase client
const supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

export { supabaseClient, SUPABASE_CONFIG }; 