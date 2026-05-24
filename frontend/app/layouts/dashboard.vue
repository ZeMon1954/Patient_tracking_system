<template>
  <div class="flex h-screen bg-slate-50 font-sans overflow-hidden">
    <!-- Overlay for mobile when sidebar is open -->
    <div v-if="isSidebarOpen" @click="isSidebarOpen = false" class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"></div>

    <!-- Sidebar -->
    <aside 
      class="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transition-transform duration-300 transform md:relative md:translate-x-0"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
    >
      <div>
        <div class="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div class="flex items-center gap-2 text-[#00685f]">
            <span class="material-symbols-outlined text-[28px]">health_and_safety</span>
            <span class="font-bold text-lg tracking-tight">CareSync</span>
          </div>
          <!-- Close button on mobile -->
          <button @click="isSidebarOpen = false" class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 md:hidden flex items-center justify-center">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <nav class="p-4 space-y-1">
          <NuxtLink v-for="item in menuItems" :key="item.path" :to="item.path" 
            @click="isSidebarOpen = false"
            class="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors group"
            :class="isActive(item.path) ? 'bg-[#00685f]/10 text-[#00685f]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'"
          >
            <span class="material-symbols-outlined text-[20px]" 
              :class="isActive(item.path) ? 'text-[#00685f]' : 'text-slate-400 group-hover:text-slate-500'"
            >{{ item.icon }}</span>
            <span class="font-medium text-sm">{{ item.label }}</span>
          </NuxtLink>
        </nav>
      </div>

      <div class="p-4 space-y-2 border-t border-slate-100 mx-4 mb-4 pb-0">
        <NuxtLink :to="`${rolePrefix}/settings`" @click="isSidebarOpen = false" class="flex items-center gap-3 px-4 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-lg transition-colors">
          <span class="material-symbols-outlined text-[20px]">settings</span>
          <span class="font-medium text-sm">ตั้งค่าระบบ</span>
        </NuxtLink>
        <button @click="handleLogout" class="w-full flex items-center gap-3 px-4 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-lg transition-colors text-left">
          <span class="material-symbols-outlined text-[20px]">logout</span>
          <span class="font-medium text-sm">ออกจากระบบ</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
        <div class="flex items-center gap-3">
          <!-- Hamburger Toggle -->
          <button @click="isSidebarOpen = !isSidebarOpen" class="p-2 rounded-lg hover:bg-slate-100 text-slate-500 md:hidden flex items-center justify-center">
            <span class="material-symbols-outlined">{{ isSidebarOpen ? 'menu_open' : 'menu' }}</span>
          </button>
          <h2 class="text-base md:text-xl font-bold text-[#00685f] tracking-tight truncate max-w-[180px] sm:max-w-none">{{ pageTitle }}</h2>
        </div>

        <div class="flex items-center gap-2 md:gap-5">
          <!-- กระดิ่งแจ้งเตือน -->
          <NotificationBell v-if="currentUserId" :userId="currentUserId" />
          <div v-else class="text-slate-300">
            <span class="material-symbols-outlined text-[22px]">notifications</span>
          </div>
          <div class="w-px h-6 bg-slate-200"></div>
          <div class="flex items-center gap-2 md:gap-3">
            <div class="text-right hidden sm:block">
              <p class="text-sm font-bold text-slate-700">{{ userName }}</p>
              <p class="text-xs text-slate-500">{{ roleLabel }}</p>
            </div>
            <div class="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-slate-800 overflow-hidden border-2 border-white shadow-sm cursor-pointer flex items-center justify-center shrink-0">
              <span class="text-white font-bold text-sm md:text-base">{{ userName.charAt(0) || 'U' }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Content Body -->
      <main class="flex-1 overflow-y-auto bg-slate-50">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Swal from 'sweetalert2'

const isSidebarOpen = ref(false)

const route = useRoute()
const currentUserId = ref(null)
const storedUserName = ref('')
const storedRole = ref('')
const storedFullName = ref('')

const updateUserData = () => {
  try {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsed = JSON.parse(userData)
      currentUserId.value = parsed.id || null
      storedUserName.value = parsed.username || ''
      storedFullName.value = parsed.name || `${parsed.first_name || ''} ${parsed.last_name || ''}`.trim()
      storedRole.value = parsed.role || ''
    }
  } catch (e) {
    console.error('Error parsing user data:', e)
  }
}

const handleLogout = async () => {
  const result = await Swal.fire({
    title: 'ยืนยันการออกจากระบบ?',
    text: 'คุณต้องการออกจากระบบหรือไม่',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#00685f',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'ออกจากระบบ',
    cancelButtonText: 'ยกเลิก'
  })

  if (result.isConfirmed) {
    // ล้าง localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    // แจ้งเตือนสำเร็จ
    await Swal.fire({
      icon: 'success',
      title: 'ออกจากระบบสำเร็จ',
      text: 'ขอบคุณที่ใช้งานระบบ CareSync',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true
    })

    // นำทางไปหน้า login
    await navigateTo('/login')
  }
}

onMounted(() => {
  updateUserData()
})

// กำหนดเมนูตาม path ปัจจุบัน
const rolePrefix = computed(() => {
  if (route.path.startsWith('/admin')) return '/admin'
  if (route.path.startsWith('/manager')) return '/manager'
  if (route.path.startsWith('/pcu_staff')) return '/pcu_staff'
  if (route.path.startsWith('/hospital_staff')) return '/hospital_staff'
  return ''
})

const userName = computed(() => {
  return storedFullName.value || storedUserName.value || 'User'
})

const roleLabel = computed(() => {
  const roles = {
    'admin': 'ผู้ดูแลระบบ',
    'manager': 'ผู้บริหาร',
    'pcu_staff': 'เจ้าหน้าที่ รพ.สต.',
    'hospital_staff': 'เจ้าหน้าที่โรงพยาบาล'
  }
  return roles[storedRole.value] || 'เจ้าหน้าที่ระบบ'
})

const pageTitle = computed(() => {
  if (route.path === '/admin') return 'จัดการหน่วยบริการ'
  if (route.path === '/admin/Manage_users') return 'จัดการผู้ใช้งาน'
  if (route.path === '/admin/Reports_Central') return 'ศูนย์ควบคุมผู้ดูแลระบบ'
  if (route.path === '/manager') return 'ภาพรวม Dashboard'
  if (route.path === '/manager/Reports_Central') return 'ศูนย์ข้อมูลผู้บริหาร'
  if (route.path === '/pcu_staff') return 'ศูนย์ปฏิบัติการ รพ.สต.'
  if (route.path === '/pcu_staff/inbox') return 'ระบบจัดการข้อมูลคนไข้'
  if (route.path === '/hospital_staff') return 'ศูนย์ควบคุมเจ้าหน้าที่'
  return 'CareSync'
})

const menuItems = computed(() => {
  // ใช้ storedRole เป็นหลักในการแสดงเมนู เพื่อความปลอดภัยและถูกต้อง
  const role = storedRole.value

  if (role === 'admin') {
    return [
      { path: '/admin/Manage_users', label: 'จัดการผู้ใช้งาน', icon: 'manage_accounts' },
      { path: '/admin', label: 'จัดการหน่วยบริการ', icon: 'domain' },
      { path: '/admin/Reports_Central', label: 'รายงานส่วนกลาง', icon: 'monitoring' }
    ]
  }
  if (role === 'manager') {
    return [
      { path: '/manager', label: 'ภาพรวม', icon: 'dashboard' },
      { path: '/manager/Reports_Central', label: 'รายงาน', icon: 'monitoring' }
    ]
  }
  if (role === 'pcu_staff') {
    return [
      { path: '/pcu_staff', label: 'รายชื่อผู้ป่วย', icon: 'home_health' },
      { path: '/pcu_staff/inbox', label: 'กล่องข้อความ', icon: 'inbox' }
    ]
  }
  if (role === 'hospital_staff') {
    return [
      { path: '/hospital_staff', label: 'หน้าแรก', icon: 'home' }
    ]
  }
  return []
})

// ปรับ logic ให้ active menu ยืดหยุ่นขึ้น
const isActive = (path) => {
  if (path === rolePrefix.value) {
    return route.path === path || route.path === `${path}/`
  }
  return route.path.startsWith(path)
}

</script>
