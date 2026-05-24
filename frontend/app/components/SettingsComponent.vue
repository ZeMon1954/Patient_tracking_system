<template>
  <div class="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-8 animate-fade-in">
      <h1 class="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 tracking-tight">ตั้งค่าระบบ</h1>
      <p class="text-slate-500 text-sm">จัดการข้อมูลส่วนบุคคลและการตั้งค่าความปลอดภัยของบัญชีผู้ใช้งาน</p>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Left Column: User Card Info -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transform hover:shadow-md transition-all duration-300">
          <!-- Card Header Decoration with nice gradient -->
          <div class="h-24 bg-gradient-to-r from-[#00685f] to-[#008378] relative">
            <div class="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          </div>
          
          <!-- Card Body -->
          <div class="px-6 pb-6 text-center -mt-12 relative">
            <!-- Profile Avatar with initial -->
            <div class="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-slate-900 text-white font-extrabold text-3xl border-4 border-white shadow-md mb-4 transform hover:scale-105 transition-transform duration-300 cursor-pointer overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-tr from-slate-800 to-slate-950"></div>
              <span class="relative z-10 select-none animate-pulse-slow">{{ userInitials }}</span>
            </div>

            <!-- User details -->
            <h2 class="text-xl font-bold text-slate-800 mb-1 truncate">{{ profileForm.firstName }} {{ profileForm.lastName }}</h2>
            <p class="text-sm text-slate-400 mb-3 truncate">@{{ profileForm.username }}</p>
            
            <!-- Role Badge -->
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 border" :class="getRoleClass(profileForm.role)">
              <span class="material-symbols-outlined text-[14px]">shield_person</span>
              {{ roleLabel }}
            </div>

            <hr class="border-slate-100 my-4" />

            <!-- Sub details (Service Unit & Created At) -->
            <div class="space-y-3 text-left">
              <div class="flex items-center gap-3 text-slate-600">
                <span class="material-symbols-outlined text-slate-400 text-[20px]">domain</span>
                <div>
                  <p class="text-[10px] text-slate-400 font-medium uppercase tracking-wider">หน่วยงานสังกัด</p>
                  <p class="text-sm font-semibold text-slate-700 truncate max-w-[200px]">{{ profileForm.serviceUnitName }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 text-slate-600">
                <span class="material-symbols-outlined text-slate-400 text-[20px]">mail</span>
                <div>
                  <p class="text-[10px] text-slate-400 font-medium uppercase tracking-wider">อีเมลติดต่อ</p>
                  <p class="text-sm font-semibold text-slate-700 truncate max-w-[200px]">{{ profileForm.email || 'ยังไม่ได้ระบุอีเมล' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 text-slate-600">
                <span class="material-symbols-outlined text-slate-400 text-[20px]">calendar_today</span>
                <div>
                  <p class="text-[10px] text-slate-400 font-medium uppercase tracking-wider">วันที่ลงทะเบียน</p>
                  <p class="text-sm font-semibold text-slate-700">{{ formatDate(profileForm.createdAt) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Settings Tabs and Form -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full min-h-[480px]">
          <!-- Tab Navigation -->
          <div class="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1 shrink-0">
            <button 
              @click="activeTab = 'profile'"
              class="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer"
              :class="activeTab === 'profile' ? 'bg-[#00685f] text-white shadow-sm shadow-[#00685f]/20' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'"
            >
              <span class="material-symbols-outlined text-[20px]">account_circle</span>
              <span>ข้อมูลส่วนตัว</span>
            </button>
            <button 
              @click="activeTab = 'security'"
              class="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer"
              :class="activeTab === 'security' ? 'bg-[#00685f] text-white shadow-sm shadow-[#00685f]/20' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'"
            >
              <span class="material-symbols-outlined text-[20px]">security</span>
              <span>ความปลอดภัย</span>
            </button>
          </div>

          <!-- Tab Content Bodies -->
          <div class="p-6 sm:p-8 flex-1 bg-white">
            <!-- Loading overlay -->
            <div v-if="isLoading" class="flex items-center justify-center py-20">
              <div class="flex flex-col items-center gap-3 text-slate-400">
                <div class="w-10 h-10 border-4 border-slate-100 border-t-[#00685f] rounded-full animate-spin"></div>
                <span class="text-sm font-medium animate-pulse">กำลังโหลดข้อมูลบัญชีของคุณ...</span>
              </div>
            </div>

            <!-- Form: Profile Details -->
            <div v-else-if="activeTab === 'profile'" class="animate-fade-in space-y-6">
              <div class="border-b border-slate-100 pb-3">
                <h3 class="text-lg font-bold text-slate-800 mb-1">แก้ไขข้อมูลโปรไฟล์</h3>
                <p class="text-slate-400 text-xs">ระบุข้อมูลของคุณที่นี่เพื่อให้อัปเดตในระบบ CareSync</p>
              </div>

              <form @submit.prevent="handleUpdateProfile" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-bold text-slate-600 uppercase tracking-wider">ชื่อจริง <span class="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      v-model="profileForm.firstName"
                      placeholder="กรอกชื่อจริงของคุณ"
                      class="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00685f]/20 focus:border-[#00685f] hover:border-slate-300 transition-all duration-200"
                      required
                    />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-bold text-slate-600 uppercase tracking-wider">นามสกุล <span class="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      v-model="profileForm.lastName"
                      placeholder="กรอกนามสกุลของคุณ"
                      class="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00685f]/20 focus:border-[#00685f] hover:border-slate-300 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-slate-600 uppercase tracking-wider">ที่อยู่อีเมล (Email)</label>
                  <div class="relative">
                    <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">mail</span>
                    <input 
                      type="email" 
                      v-model="profileForm.email"
                      placeholder="example@email.com"
                      class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00685f]/20 focus:border-[#00685f] hover:border-slate-300 transition-all duration-200"
                    />
                  </div>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">ชื่อผู้ใช้ (Username) - <span class="normal-case">ไม่สามารถแก้ไขได้</span></label>
                  <div class="relative">
                    <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock</span>
                    <input 
                      type="text" 
                      :value="profileForm.username"
                      class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl text-sm cursor-not-allowed"
                      disabled
                    />
                  </div>
                </div>

                <div class="pt-4 flex justify-end">
                  <button 
                    type="submit"
                    :disabled="isSubmitting"
                    class="w-full sm:w-auto bg-[#00685f] hover:bg-[#005049] text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <div v-if="isSubmitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span class="material-symbols-outlined text-[18px]">save</span>
                    <span>บันทึกข้อมูลส่วนตัว</span>
                  </button>
                </div>
              </form>
            </div>

            <!-- Form: Security / Password Change -->
            <div v-else-if="activeTab === 'security'" class="animate-fade-in space-y-6">
              <div class="border-b border-slate-100 pb-3">
                <h3 class="text-lg font-bold text-slate-800 mb-1">เปลี่ยนรหัสผ่าน</h3>
                <p class="text-slate-400 text-xs">คุณควรเปลี่ยนรหัสผ่านเพื่อความปลอดภัยอย่างน้อยทุก ๆ 3 เดือน</p>
              </div>

              <form @submit.prevent="handleChangePassword" class="space-y-4">
                <!-- Current Password -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-slate-600 uppercase tracking-wider">รหัสผ่านปัจจุบัน <span class="text-red-500">*</span></label>
                  <div class="relative">
                    <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock_open</span>
                    <input 
                      :type="showCurrentPassword ? 'text' : 'password'" 
                      v-model="securityForm.currentPassword"
                      placeholder="กรอกรหัสผ่านที่คุณใช้งานอยู่ขณะนี้"
                      class="w-full pl-10 pr-12 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00685f]/20 focus:border-[#00685f] hover:border-slate-300 transition-all duration-200"
                      required
                    />
                    <button 
                      type="button" 
                      @click="showCurrentPassword = !showCurrentPassword"
                      class="absolute inset-y-0 right-2 flex items-center px-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <span class="material-symbols-outlined text-[18px]">{{ showCurrentPassword ? 'visibility_off' : 'visibility' }}</span>
                    </button>
                  </div>
                </div>

                <!-- New Password -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-slate-600 uppercase tracking-wider">รหัสผ่านใหม่ <span class="text-red-500">*</span></label>
                  <div class="relative">
                    <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">vpn_key</span>
                    <input 
                      :type="showNewPassword ? 'text' : 'password'" 
                      v-model="securityForm.newPassword"
                      placeholder="กรอกรหัสผ่านใหม่"
                      class="w-full pl-10 pr-12 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00685f]/20 focus:border-[#00685f] hover:border-slate-300 transition-all duration-200"
                      required
                    />
                    <button 
                      type="button" 
                      @click="showNewPassword = !showNewPassword"
                      class="absolute inset-y-0 right-2 flex items-center px-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <span class="material-symbols-outlined text-[18px]">{{ showNewPassword ? 'visibility_off' : 'visibility' }}</span>
                    </button>
                  </div>
                </div>

                <!-- Confirm New Password -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-slate-600 uppercase tracking-wider">ยืนยันรหัสผ่านใหม่ <span class="text-red-500">*</span></label>
                  <div class="relative">
                    <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">key</span>
                    <input 
                      :type="showConfirmPassword ? 'text' : 'password'" 
                      v-model="securityForm.confirmPassword"
                      placeholder="ระบุรหัสผ่านใหม่อีกครั้งเพื่อยืนยัน"
                      class="w-full pl-10 pr-12 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00685f]/20 focus:border-[#00685f] hover:border-slate-300 transition-all duration-200"
                      required
                    />
                    <button 
                      type="button" 
                      @click="showConfirmPassword = !showConfirmPassword"
                      class="absolute inset-y-0 right-2 flex items-center px-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <span class="material-symbols-outlined text-[18px]">{{ showConfirmPassword ? 'visibility_off' : 'visibility' }}</span>
                    </button>
                  </div>
                </div>

                <div class="pt-4 flex justify-end">
                  <button 
                    type="submit"
                    :disabled="isSubmitting"
                    class="w-full sm:w-auto bg-[#00685f] hover:bg-[#005049] text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <div v-if="isSubmitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span class="material-symbols-outlined text-[18px]">shield</span>
                    <span>อัปเดตรหัสผ่าน</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import Swal from 'sweetalert2';

const API_BASE = 'http://localhost:3001/api';

// Tab controls
const activeTab = ref('profile');

// States
const isLoading = ref(true);
const isSubmitting = ref(false);

const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// Forms
const profileForm = reactive({
  id: null,
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  role: '',
  serviceUnitId: null,
  serviceUnitName: '',
  createdAt: ''
});

const securityForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// Computed properties
const userInitials = computed(() => {
  if (profileForm.firstName) {
    return profileForm.firstName.charAt(0).toUpperCase();
  }
  return 'U';
});

const roleLabel = computed(() => {
  const roles = {
    admin: 'ผู้ดูแลระบบ (Admin)',
    manager: 'ผู้บริหาร (Manager)',
    hospital_staff: 'เจ้าหน้าที่โรงพยาบาล (Hospital Staff)',
    pcu_staff: 'เจ้าหน้าที่ รพ.สต. (PCU Staff)'
  };
  return roles[profileForm.role] || 'เจ้าหน้าที่ (Staff)';
});

// Helpers
const getRoleClass = (role) => {
  const map = {
    admin: 'bg-[#008378]/10 text-[#008378] border-[#008378]/20',
    manager: 'bg-slate-100 text-slate-700 border-slate-200',
    hospital_staff: 'bg-blue-50 text-blue-700 border-blue-100',
    pcu_staff: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  };
  return map[role] || 'bg-slate-50 text-slate-600 border-slate-200';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

// API actions
const fetchProfile = async () => {
  isLoading.value = true;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error('ไม่สามารถเชื่อมต่อเพื่อดึงข้อมูลโปรไฟล์ได้');
    }

    const data = await res.json();
    profileForm.id = data.id;
    profileForm.firstName = data.firstName;
    profileForm.lastName = data.lastName;
    profileForm.email = data.email || '';
    profileForm.username = data.username;
    profileForm.role = data.role;
    profileForm.serviceUnitId = data.serviceUnitId;
    profileForm.serviceUnitName = data.serviceUnitName;
    profileForm.createdAt = data.createdAt;

  } catch (error) {
    console.error('Fetch profile error:', error);
    Swal.fire({
      icon: 'error',
      title: 'ข้อผิดพลาด',
      text: error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลโปรไฟล์',
      confirmButtonColor: '#00685f'
    });
  } finally {
    isLoading.value = false;
  }
};

const handleUpdateProfile = async () => {
  if (!profileForm.firstName || !profileForm.lastName) {
    Swal.fire({
      icon: 'warning',
      title: 'ข้อมูลไม่ครบถ้วน',
      text: 'กรุณากรอกชื่อและนามสกุล',
      confirmButtonColor: '#00685f'
    });
    return;
  }

  isSubmitting.value = true;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }

    // Update LocalStorage user details for visual sync (e.g. Header)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      user.first_name = profileForm.firstName;
      user.last_name = profileForm.lastName;
      user.name = `${profileForm.firstName} ${profileForm.lastName}`;
      user.email = profileForm.email;
      localStorage.setItem('user', JSON.stringify(user));
    }

    Swal.fire({
      icon: 'success',
      title: 'บันทึกสำเร็จ',
      text: 'ปรับปรุงข้อมูลโปรไฟล์ของคุณเรียบร้อยแล้ว',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true
    }).then(() => {
      // Trigger user update event or force page window refresh to sync sidebars/headers
      window.location.reload();
    });

  } catch (error) {
    console.error('Update profile error:', error);
    Swal.fire({
      icon: 'error',
      title: 'ไม่สามารถบันทึกได้',
      text: error.message || 'เกิดข้อผิดพลาดในการปรับปรุงข้อมูลส่วนตัว',
      confirmButtonColor: '#00685f'
    });
  } finally {
    isSubmitting.value = false;
  }
};

const handleChangePassword = async () => {
  if (!securityForm.currentPassword || !securityForm.newPassword || !securityForm.confirmPassword) {
    Swal.fire({
      icon: 'warning',
      title: 'กรุณากรอกรหัสผ่านให้ครบ',
      text: 'กรุณากรอกรหัสผ่านทุกช่อง',
      confirmButtonColor: '#00685f'
    });
    return;
  }

  if (securityForm.newPassword !== securityForm.confirmPassword) {
    Swal.fire({
      icon: 'error',
      title: 'รหัสผ่านไม่ตรงกัน',
      text: 'รหัสผ่านใหม่และการยืนยันรหัสผ่านใหม่ไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง',
      confirmButtonColor: '#00685f'
    });
    return;
  }

  if (securityForm.newPassword.length < 6) {
    Swal.fire({
      icon: 'warning',
      title: 'รหัสผ่านสั้นเกินไป',
      text: 'เพื่อความปลอดภัย รหัสผ่านใหม่ต้องมีความยาวไม่น้อยกว่า 6 ตัวอักษร',
      confirmButtonColor: '#00685f'
    });
    return;
  }

  isSubmitting.value = true;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    }

    // Reset Form
    securityForm.currentPassword = '';
    securityForm.newPassword = '';
    securityForm.confirmPassword = '';

    Swal.fire({
      icon: 'success',
      title: 'เปลี่ยนรหัสผ่านสำเร็จ',
      text: 'รหัสผ่านความปลอดภัยของคุณถูกเปลี่ยนแปลงเรียบร้อยแล้ว',
      showConfirmButton: false,
      timer: 1800,
      timerProgressBar: true
    });

  } catch (error) {
    console.error('Change password error:', error);
    Swal.fire({
      icon: 'error',
      title: 'เปลี่ยนรหัสผ่านล้มเหลว',
      text: error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
      confirmButtonColor: '#00685f'
    });
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  fetchProfile();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap');

.font-sans {
  font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
}

.animate-fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-pulse-slow {
  animation: pulseSlow 3s infinite ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulseSlow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}
</style>
