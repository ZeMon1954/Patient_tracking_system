<template>
  <div class="bg-surface-container min-h-screen flex items-center justify-center antialiased text-on-surface selection:bg-primary/20 font-sans text-body-md relative">

    <div class="flex flex-col md:flex-row w-full h-screen overflow-hidden bg-surface-container-lowest">
      <!-- Left Side: Branding Section -->
      <div class="hidden md:flex md:w-1/2 medical-pattern relative flex-col items-center justify-center p-8 border-r border-outline-variant/30">
        <div class="absolute inset-0 gradient-overlay"></div>
        <!-- Branding Content -->
        <div class="relative z-10 flex flex-col items-center text-center max-w-md px-6">
          <!-- Logo -->
          <div class="mb-12 transform transition-transform hover:scale-105 duration-500">
            <div class="w-32 h-32 bg-[#00685f] rounded-[2rem] flex items-center justify-center text-white shadow-2xl mx-auto border-4 border-white">
              <span class="material-symbols-outlined text-[80px]">medical_services</span>
            </div>
          </div>
          <!-- Title Text -->
          <div class="space-y-4">
            <h1 class="text-headline-lg text-on-surface tracking-tight leading-snug font-bold">
              ระบบติดตามผู้ป่วยนัดหมาย<br/>และส่งต่อบริการสุขภาพชุมชน
            </h1>
            <div class="w-16 h-1 bg-primary mx-auto rounded-full opacity-60"></div>
            <p class="text-on-surface-variant text-body-lg">เชื่อมต่อการดูแล ยกระดับสุขภาพคนในชุมชน</p>
          </div>
        </div>
      </div>

      <!-- Right Side: Login Form Section -->
      <div class="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 bg-surface-container-lowest overflow-y-auto">
        <div class="w-full max-w-[440px] px-4">
          <!-- Header for mobile/small screens -->
          <div class="md:hidden flex flex-col items-center mb-10 text-center">
            <div class="w-20 h-20 bg-[#00685f] rounded-2xl flex items-center justify-center text-white shadow-xl mb-6 mx-auto border-2 border-white">
              <span class="material-symbols-outlined text-[48px]">medical_services</span>
            </div>
            <h2 class="text-headline-md text-on-surface font-bold">เข้าสู่ระบบ</h2>
          </div>
          <div class="hidden md:block mb-10">
            <h2 class="text-headline-md text-on-surface mb-2 font-bold">ยินดีต้อนรับกลับมา</h2>
            <p class="text-on-surface-variant text-body-md">กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ</p>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="mb-6 p-4 rounded-xl bg-error-container border border-error/20 text-on-error-container text-label-md text-center shadow-sm">
            {{ errorMessage }}
          </div>

          <form @submit.prevent="handleLogin" class="space-y-6">
            <!-- Username Input -->
            <div class="space-y-2">
              <label class="block text-label-md text-on-surface-variant" for="username">ชื่อผู้ใช้งาน</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">person</span>
                <input 
                  id="username" 
                  v-model="form.username" 
                  type="text" 
                  placeholder="กรอกชื่อผู้ใช้งาน" 
                  required 
                  class="w-full pl-10 pr-4 py-3.5 bg-surface-container-low border border-outline-variant/50 rounded-xl text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
              </div>
            </div>
            <!-- Password Input -->
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <label class="block text-label-md text-on-surface-variant" for="password">รหัสผ่าน</label>
                <a href="#" class="text-label-sm text-primary hover:underline font-medium">ลืมรหัสผ่าน?</a>
              </div>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">lock</span>
                <input 
                  id="password" 
                  v-model="form.password" 
                  :type="showPassword ? 'text' : 'password'" 
                  placeholder="••••••••" 
                  required 
                  class="w-full pl-10 pr-10 py-3.5 bg-surface-container-low border border-outline-variant/50 rounded-xl text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface-variant transition-colors"
                  @click="showPassword = !showPassword"
                >
                  <span class="material-symbols-outlined text-[20px]">{{ showPassword ? 'visibility' : 'visibility_off' }}</span>
                </button>
              </div>
            </div>
            
            <div class="flex items-center space-x-2">
              <input 
                id="remember" 
                v-model="rememberMe" 
                type="checkbox" 
                class="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20 bg-surface-container-low cursor-pointer"
              />
              <label class="text-label-sm text-on-surface-variant cursor-pointer" for="remember">จดจำการใช้งาน</label>
            </div>

            <!-- Sign In Button -->
            <div class="pt-4">
              <button 
                type="submit" 
                :disabled="loading"
                class="w-full py-3.5 flex justify-center items-center gap-2 bg-primary text-on-primary text-title-lg rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container hover:shadow-primary/30 transition-all active:scale-[0.98] focus:ring-4 focus:ring-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="!loading">เข้าสู่ระบบ</span>
                <span v-else class="flex items-center gap-2">
                  <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  กำลังเข้าสู่ระบบ...
                </span>
              </button>
            </div>
          </form>

          <!-- Divider -->
          <div class="relative my-10">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-outline-variant/30"></div>
            </div>
            <div class="relative flex justify-center text-label-sm uppercase">
              <span class="bg-surface-container-lowest px-4 text-on-surface-variant/60 font-medium">หรือใช้งานด้วย</span>
            </div>
          </div>

          <!-- Google Button -->
          <div class="flex justify-center">
            <button type="button" @click="loginWithGoogle" :disabled="loading" class="flex items-center justify-center gap-3 w-full px-6 py-3 bg-white border border-outline-variant/60 text-on-surface text-label-md rounded-xl hover:bg-surface-container-low hover:border-outline-variant transition-all active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              <svg class="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              ดำเนินการต่อด้วย Google
            </button>
          </div>

          <p class="mt-10 text-center text-label-sm text-on-surface-variant">
            ยังไม่มีบัญชี? <a href="#" class="text-primary font-semibold hover:underline">ติดต่อผู้ดูแลระบบ</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import Swal from 'sweetalert2';

useHead({
  title: 'เข้าสู่ระบบ - Hospitalis',
});

const form = reactive({
  username: '',
  password: '',
});

const showPassword = ref(false);
const rememberMe = ref(false);
const loading = ref(false);
const errorMessage = ref('');

let tokenClient = null;

const initializeGoogleSignIn = () => {
  const config = useRuntimeConfig();
  const clientId = config.public.googleClientId;

  if (!clientId || clientId === 'your_google_client_id_here') {
    console.warn('Google Client ID is not configured properly in environment variables.');
    return;
  }

  try {
    // Initialize the Google OAuth2 token client
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'email profile openid',
      callback: async (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          await handleGoogleLogin(tokenResponse.access_token);
        }
      },
    });
  } catch (e) {
    console.error('Error initializing Google GIS Client:', e);
  }
};

onMounted(() => {
  // Dynamically load Google Client library
  if (!window.google) {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    document.head.appendChild(script);
  } else {
    initializeGoogleSignIn();
  }
});

const loginWithGoogle = () => {
  const config = useRuntimeConfig();
  const clientId = config.public.googleClientId;

  if (!clientId || clientId === 'your_google_client_id_here') {
    errorMessage.value = 'ยังไม่ได้ตั้งค่า Google Client ID ในระบบ กรุณาตรวจสอบ .env ไฟล์';
    return;
  }

  if (!tokenClient) {
    errorMessage.value = 'ระบบ Google Sign-in ยังไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง';
    return;
  }
  
  errorMessage.value = '';
  tokenClient.requestAccessToken();
};

const handleGoogleLogin = async (accessToken) => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const res = await $fetch('http://localhost:3001/api/auth/google-login', {
      method: 'POST',
      body: {
        accessToken,
      },
    });

    // เก็บข้อมูล user และ token ไว้ใน localStorage
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));

    const displayName = res.user.name || `${res.user.firstName || res.user.first_name || ''} ${res.user.lastName || res.user.last_name || ''}`.trim() || res.user.username;

    // แสดง SweetAlert2 แจ้งเตือนสำเร็จ
    await Swal.fire({
      title: 'เข้าสู่ระบบสำเร็จ!',
      text: `ยินดีต้อนรับคุณ ${displayName}`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      timerProgressBar: true
    });

    // นำทางไปหน้า dashboard ตาม role
    if (res.user.role === 'admin') {
      navigateTo('/admin/Manage_users');
    } else if (res.user.role === 'manager') {
      navigateTo('/manager');
    } else if (res.user.role === 'pcu_staff') {
      navigateTo('/pcu_staff');
    } else if (res.user.role === 'hospital_staff') {
      navigateTo('/hospital_staff');
    } else {
      navigateTo('/');
    }
  } catch (error) {
    const errMsg = error?.data?.message || 'การเข้าสู่ระบบด้วย Google ล้มเหลว';
    errorMessage.value = errMsg;
    await Swal.fire({
      title: 'เกิดข้อผิดพลาด',
      text: errMsg,
      icon: 'error',
      confirmButtonColor: '#00685f',
      confirmButtonText: 'ตกลง'
    });
  } finally {
    loading.value = false;
  }
};

const handleLogin = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const res = await $fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      body: {
        username: form.username,
        password: form.password,
      },
    });

    // เก็บข้อมูล user และ token ไว้ใน localStorage
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));

    const displayName = res.user.name || `${res.user.firstName || res.user.first_name || ''} ${res.user.lastName || res.user.last_name || ''}`.trim() || res.user.username;

    // แสดง SweetAlert2 แจ้งเตือนสำเร็จ
    await Swal.fire({
      title: 'เข้าสู่ระบบสำเร็จ!',
      text: `ยินดีต้อนรับคุณ ${displayName}`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      timerProgressBar: true
    });

    // นำทางไปหน้า dashboard ตาม role
    if (res.user.role === 'admin') {
      navigateTo('/admin/Manage_users');
    } else if (res.user.role === 'manager') {
      navigateTo('/manager');
    } else if (res.user.role === 'pcu_staff') {
      navigateTo('/pcu_staff');
    } else if (res.user.role === 'hospital_staff') {
      navigateTo('/hospital_staff');
    } else {
      navigateTo('/');
    }
  } catch (error) {
    const errMsg = error?.data?.message || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง';
    errorMessage.value = errMsg;
    await Swal.fire({
      title: 'เกิดข้อผิดพลาด',
      text: errMsg,
      icon: 'error',
      confirmButtonColor: '#00685f',
      confirmButtonText: 'ตกลง'
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style>
.medical-pattern {
    background-color: #f8f9ff;
    background-image: radial-gradient(circle at 2px 2px, #cbdbf5 1px, transparent 0);
    background-size: 24px 24px;
}

.gradient-overlay {
    background: linear-gradient(135deg, rgba(203, 219, 245, 0.4) 0%, rgba(248, 249, 255, 0) 100%);
}
</style>