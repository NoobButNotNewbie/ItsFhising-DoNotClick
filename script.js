// script.js
const SUPABASE_URL = 'https://your-project.supabase.co'; // <-- thay bằng của bạn
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z2VlZnV0aG5taWtxYnNvc3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NzAzNjQsImV4cCI6MjA3NTE0NjM2NH0.aS4kFcs67veQXQnYhBJIS2fXFup1klDhaesyu6yHrD4'; // <-- thay bằng anon key của bạn

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM
const loginBox = document.getElementById('loginBox');
const signupBox = document.getElementById('signupBox');
const showSignup = document.getElementById('showSignup');
const showLogin = document.getElementById('showLogin');

const loginBtn = document.getElementById('login-btn');
const msgLogin = document.getElementById('msgLogin');

const signupBtn = document.getElementById('signup-btn');
const msgSignup = document.getElementById('msgSignup');

// toggles
showSignup.addEventListener('click', (e) => { e.preventDefault(); loginBox.style.display = 'none'; signupBox.style.display = 'block'; clearMessages(); });
showLogin.addEventListener('click', (e) => { e.preventDefault(); signupBox.style.display = 'none'; loginBox.style.display = 'block'; clearMessages(); });

function clearMessages(){
  msgLogin.textContent = '';
  msgSignup.textContent = '';
}

// Password policy (same as bạn yêu cầu trước)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const usernameRegex = /^[A-Za-z0-9_.-]{3,50}$/;

// LOGIN (dùng Supabase Auth)
loginBtn.addEventListener('click', async () => {
  clearMessages();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    msgLogin.textContent = 'Nhập email và mật khẩu.';
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password }); // v2 API
  if (error) {
    msgLogin.textContent = 'Đăng nhập thất bại: ' + error.message;
    return;
  }
  // thành công
  msgLogin.textContent = 'Đăng nhập thành công!';
  // redirect hoặc lưu session tuỳ bạn
  console.log('user session:', data);
});

// SIGNUP (Supabase Auth) + insert profile vào bảng profiles
signupBtn.addEventListener('click', async () => {
  clearMessages();
  const username = document.getElementById('signup_username').value.trim();
  const email = document.getElementById('signup_email').value.trim();
  const password = document.getElementById('signup_password').value;
  const password2 = document.getElementById('signup_password2').value;

  // validation cơ bản
  if (!usernameRegex.test(username)) {
    msgSignup.textContent = 'Username không hợp lệ (3-50 ký tự, chỉ chữ/số/_.-)';
    return;
  }
  if (!passwordRegex.test(password)) {
    msgSignup.textContent = 'Mật khẩu phải >=8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.';
    return;
  }
  if (password !== password2) {
    msgSignup.textContent = 'Mật khẩu nhập lại không khớp.';
    return;
  }

  // 1) Tạo account bằng Supabase Auth (Supabase sẽ hash mật khẩu)
  const { data: signData, error: signError } = await supabase.auth.signUp({ email, password });

  if (signError) {
    msgSignup.textContent = 'Tạo tài khoản thất bại: ' + signError.message;
    return;
  }

  // Nếu cần email xác thực, Supabase sẽ gửi mail tự động tùy cấu hình.
  // Lấy auth user id (nếu có ngay lập tức); có thể null nếu require email confirm first
  const user = signData.user || null;
  const auth_id = user ? user.id : null;

  // 2) Lưu profile vào bảng profiles (không lưu password!)
  // Chú ý: bảng profiles nên có column auth_id (uuid) hoặc email
  const profile = {
    auth_id,
    username,
    email,
    created_at: new Date().toISOString()
  };

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .insert([profile]);

  if (profileError) {
    // Nếu insert profile fail (ví dụ username trùng), bạn có thể rollback hoặc báo user
    msgSignup.textContent = 'Tạo profile thất bại: ' + profileError.message;
    console.error(profileError);
    return;
  }

  msgSignup.textContent = 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực (nếu bật).';
  // option: chuyển về login box
  signupBox.style.display = 'none';
  loginBox.style.display = 'block';
});

// helper: listen to auth changes (optional)
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event', event, session);
});
