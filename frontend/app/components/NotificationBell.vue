<template>
  <div class="relative" ref="bellRef">
    <!-- ปุ่มกระดิ่ง -->
    <button
      @click="toggleDropdown"
      class="relative text-slate-400 hover:text-[#00685f] transition-colors focus:outline-none"
      id="notification-bell-btn"
    >
      <span class="material-symbols-outlined text-[22px]">notifications</span>
      <!-- จุดแดงแจ้งเตือน (แสดงเมื่อมีที่ยังไม่อ่าน) -->
      <transition name="badge">
        <span
          v-if="unreadCount > 0"
          class="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white leading-none px-[3px]"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </transition>
    </button>

    <!-- Dropdown Panel -->
    <transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute right-0 top-full mt-3 w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px] text-[#00685f]">notifications</span>
            <h3 class="font-bold text-slate-800 text-sm">การแจ้งเตือน</h3>
            <span v-if="unreadCount > 0" class="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {{ unreadCount }}
            </span>
          </div>
          <button
            v-if="unreadCount > 0"
            @click="markAllRead"
            class="text-xs text-[#00685f] hover:underline font-medium"
          >
            อ่านทั้งหมด
          </button>
        </div>

        <!-- รายการแจ้งเตือน -->
        <div class="max-h-[400px] overflow-y-auto">
          <!-- Loading -->
          <div v-if="loading" class="flex items-center justify-center py-10">
            <div class="w-6 h-6 border-2 border-[#00685f] border-t-transparent rounded-full animate-spin"></div>
          </div>

          <!-- ไม่มีรายการ -->
          <div v-else-if="notifications.length === 0" class="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
            <span class="material-symbols-outlined text-[40px]">notifications_none</span>
            <p class="text-sm">ไม่มีการแจ้งเตือน</p>
          </div>

          <!-- รายการ -->
          <div v-else>
            <div
              v-for="item in notifications"
              :key="item.id"
              @click="markRead(item)"
              class="flex gap-3 px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
              :class="item.is_read ? 'opacity-60' : 'bg-[#00685f]/5'"
            >
              <!-- ไอคอน -->
              <div class="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                :class="getIconBg(item.title)">
                <span class="material-symbols-outlined text-[18px]" :class="getIconColor(item.title)">
                  {{ getIcon(item.title) }}
                </span>
              </div>

              <!-- เนื้อหา -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <p class="text-sm font-semibold text-slate-800 truncate">{{ item.title }}</p>
                  <span v-if="!item.is_read" class="shrink-0 w-2 h-2 bg-rose-500 rounded-full mt-1.5"></span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5 line-clamp-2">{{ item.message }}</p>
                <p class="text-[11px] text-slate-400 mt-1">{{ formatDate(item.created_at) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  userId: { type: [Number, String], required: false, default: null }
});

const isOpen = ref(false);
const loading = ref(false);
const notifications = ref([]);
const bellRef = ref(null);
const config = useRuntimeConfig();

const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length);

// เปิด/ปิด dropdown
function toggleDropdown() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) fetchNotifications();
}

// ดึงรายการแจ้งเตือน
async function fetchNotifications() {
  if (!props.userId) return;
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${config.public.apiBase}/api/notifications?user_id=${props.userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    notifications.value = await res.json();
  } catch (e) {
    console.error('fetchNotifications:', e);
  } finally {
    loading.value = false;
  }
}

// อ่านรายการ
async function markRead(item) {
  if (item.is_read) return;
  try {
    const token = localStorage.getItem('token');
    await fetch(`${config.public.apiBase}/api/notifications/${item.id}/read`, { 
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    item.is_read = 1;
  } catch (e) { console.error(e); }
}

// อ่านทั้งหมด
async function markAllRead() {
  try {
    const token = localStorage.getItem('token');
    await fetch(`${config.public.apiBase}/api/notifications/read-all`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ user_id: props.userId })
    });
    notifications.value.forEach(n => n.is_read = 1);
  } catch (e) { console.error(e); }
}

// ไอคอนตามประเภท
function getIcon(title) {
  if (title?.includes('นัดหมาย')) return 'event';
  if (title?.includes('ส่งต่อ') || title?.includes('เคส')) return 'transfer_within_a_station';
  if (title?.includes('ไม่มา')) return 'event_busy';
  return 'notifications';
}
function getIconBg(title) {
  if (title?.includes('นัดหมาย')) return 'bg-blue-50';
  if (title?.includes('ส่งต่อ') || title?.includes('เคส')) return 'bg-teal-50';
  if (title?.includes('ไม่มา')) return 'bg-rose-50';
  return 'bg-slate-100';
}
function getIconColor(title) {
  if (title?.includes('นัดหมาย')) return 'text-blue-500';
  if (title?.includes('ส่งต่อ') || title?.includes('เคส')) return 'text-teal-600';
  if (title?.includes('ไม่มา')) return 'text-rose-500';
  return 'text-slate-500';
}

// แปลงวันที่ให้อ่านง่าย
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'เมื่อสักครู่';
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} ชั่วโมงที่แล้ว`;
  return d.toLocaleDateString('th-TH');
}

// ปิด dropdown เมื่อคลิกข้างนอก
function handleClickOutside(e) {
  if (bellRef.value && !bellRef.value.contains(e.target)) {
    isOpen.value = false;
  }
}

// Poll ทุก 30 วิ เพื่อนับใหม่ (เฉพาะ unread count ไม่ต้อง fetch ทั้งหมด)
let pollInterval = null;
async function pollUnreadCount() {
  if (!props.userId) return;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${config.public.apiBase}/api/notifications/unread-count?user_id=${props.userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    // sync ให้ตรงกับที่เรามี (ถ้า count ไม่ตรงแสดงว่ามีใหม่)
    if (data.count !== unreadCount.value) {
      fetchNotifications();
    }
  } catch (e) { /* silent */ }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  fetchNotifications();
  pollInterval = setInterval(pollUnreadCount, 30000); // ตรวจทุก 30 วินาที
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}

.badge-enter-active, .badge-leave-active {
  transition: all 0.2s;
}
.badge-enter-from, .badge-leave-to {
  opacity: 0;
  transform: scale(0);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
