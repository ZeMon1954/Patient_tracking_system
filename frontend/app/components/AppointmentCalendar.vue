<template>
  <div class="appointment-calendar flex flex-col md:flex-row gap-6">
    <!-- Calendar Section -->
    <div class="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <!-- Calendar Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <button @click="prevMonth" type="button" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
          <span class="material-symbols-outlined text-sm">chevron_left</span>
        </button>
        <h3 class="font-bold text-slate-800 text-sm">
          {{ monthNames[currentMonth.getMonth()] }} {{ currentMonth.getFullYear() + 543 }}
        </h3>
        <button @click="nextMonth" type="button" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
          <span class="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>

      <!-- Calendar Grid -->
      <div class="p-4">
        <!-- Days of week -->
        <div class="grid grid-cols-7 mb-2">
          <div v-for="day in ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']" :key="day" class="text-center text-xs font-semibold text-slate-400 py-1">
            {{ day }}
          </div>
        </div>
        
        <!-- Loading State -->
        <div v-if="loading" class="h-48 flex items-center justify-center">
          <div class="w-6 h-6 border-2 border-slate-200 border-t-[#00685f] rounded-full animate-spin"></div>
        </div>

        <!-- Days -->
        <div v-else class="grid grid-cols-7 gap-1">
          <div 
            v-for="(day, index) in calendarDays" 
            :key="index"
            class="aspect-square relative flex flex-col items-center justify-center p-1 rounded-lg cursor-pointer transition-all border border-transparent"
            :class="[
              day.isCurrentMonth ? (isPastDate(day.date) ? 'text-slate-300 bg-slate-50/50 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-50 hover:border-slate-200') : 'text-transparent pointer-events-none',
              day.isToday && day.isCurrentMonth && !isSelected(day.date) ? 'text-[#00685f] font-bold bg-[#00685f]/5' : '',
              isSelected(day.date) ? 'bg-[#00685f] text-white shadow-md font-bold' : ''
            ]"
            @click="day.isCurrentMonth && !isPastDate(day.date) ? selectDate(day.date) : null"
          >
            <span class="text-sm">{{ day.date.getDate() }}</span>
            
            <!-- Appointment dots -->
            <div v-if="day.isCurrentMonth && getAppointmentsForDate(day.date).length > 0" class="absolute bottom-1.5 flex gap-0.5 justify-center w-full px-1 flex-wrap">
              <span 
                v-for="(appt, i) in getAppointmentsForDate(day.date).slice(0, 3)" 
                :key="i"
                class="w-1.5 h-1.5 rounded-full"
                :class="statusColors[appt.status] || 'bg-slate-400'"
              ></span>
              <span v-if="getAppointmentsForDate(day.date).length > 3" class="w-1 h-1.5 rounded-full bg-slate-300 self-center"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Daily Details Section -->
    <div class="w-full md:w-72 flex flex-col bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div class="px-4 py-3 border-b border-slate-200 bg-white">
        <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2">
          <span class="material-symbols-outlined text-[#00685f] text-lg">event_note</span>
          นัดหมายวันที่ {{ formatSelectedDate }}
        </h4>
        <p class="text-xs text-slate-500 mt-0.5">{{ selectedDateAppointments.length }} รายการ</p>
      </div>

      <div class="flex-1 p-3 overflow-y-auto max-h-[300px]">
        <div v-if="selectedDateAppointments.length === 0" class="h-full flex flex-col items-center justify-center text-slate-400 py-8">
          <span class="material-symbols-outlined text-4xl mb-2 opacity-50">event_busy</span>
          <p class="text-sm">ไม่มีนัดหมายในวันนี้</p>
        </div>
        
        <div v-else class="space-y-2">
          <div 
            v-for="appt in selectedDateAppointments" 
            :key="appt.id"
            class="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden"
          >
            <div class="absolute left-0 top-0 bottom-0 w-1" :class="statusBorders[appt.status] || 'bg-slate-400'"></div>
            <div class="flex justify-between items-start mb-1 pl-1">
              <span class="text-xs font-bold text-slate-700">{{ formatTime(appt.appointment_time) }}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-full" :class="statusBadges[appt.status] || 'bg-slate-100 text-slate-600'">
                {{ statusLabels[appt.status] || appt.status }}
              </span>
            </div>
            <div class="pl-1">
              <p class="text-sm font-semibold text-slate-800 truncate" :title="appt.patient_name">{{ appt.patient_name }}</p>
              <p class="text-xs text-slate-500 font-mono mb-1">{{ appt.hn_number }}</p>
              <p class="text-xs text-slate-600 line-clamp-1" :title="appt.reason">{{ appt.reason || 'ไม่ได้ระบุเหตุผล' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: String, // YYYY-MM-DD
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const config = useRuntimeConfig()
const API_BASE = `${config.public.apiBase}/api`

const monthNames = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

const statusColors = {
  pending: 'bg-amber-400',
  confirmed: 'bg-blue-400',
  completed: 'bg-green-400',
  noshow: 'bg-rose-400',
  cancelled: 'bg-slate-400'
}

const statusBorders = {
  pending: 'bg-amber-400',
  confirmed: 'bg-blue-500',
  completed: 'bg-green-500',
  noshow: 'bg-rose-500',
  cancelled: 'bg-slate-300'
}

const statusBadges = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200 border',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200 border',
  completed: 'bg-green-50 text-green-700 border-green-200 border',
  noshow: 'bg-rose-50 text-rose-700 border-rose-200 border',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200 border'
}

const statusLabels = {
  pending: 'รอดำเนินการ',
  confirmed: 'ยืนยัน',
  completed: 'มาตามนัด',
  noshow: 'ขาดนัด',
  cancelled: 'ยกเลิก'
}

const currentMonth = ref(new Date())
const appointments = ref([])
const loading = ref(false)

const initDate = () => {
  if (props.modelValue) {
    currentMonth.value = new Date(props.modelValue)
  } else {
    currentMonth.value = new Date()
  }
  fetchAppointments()
}

onMounted(() => {
  initDate()
})

const fetchAppointments = async () => {
  loading.value = true
  try {
    const year = currentMonth.value.getFullYear()
    const month = String(currentMonth.value.getMonth() + 1).padStart(2, '0')
    const token = localStorage.getItem('token')
    
    const res = await fetch(`${API_BASE}/patients/appointments/calendar?month=${year}-${month}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (res.ok) {
      appointments.value = await res.json()
    }
  } catch (error) {
    console.error('Failed to fetch calendar appointments', error)
  } finally {
    loading.value = false
  }
}

const prevMonth = () => {
  const d = new Date(currentMonth.value)
  d.setMonth(d.getMonth() - 1)
  currentMonth.value = d
  fetchAppointments()
}

const nextMonth = () => {
  const d = new Date(currentMonth.value)
  d.setMonth(d.getMonth() + 1)
  currentMonth.value = d
  fetchAppointments()
}

const selectDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  emit('update:modelValue', `${year}-${month}-${day}`)
}

const isSelected = (date) => {
  if (!props.modelValue) return false
  const [y, m, d] = props.modelValue.split('-')
  return date.getFullYear() == y && date.getMonth() + 1 == m && date.getDate() == d
}

const today = new Date()
today.setHours(0, 0, 0, 0)

const isPastDate = (date) => {
  return date < today
}

const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  
  const days = []
  
  // Fill leading empty days (0 = Sunday, 6 = Saturday)
  const startingDay = firstDayOfMonth.getDay()
  for (let i = 0; i < startingDay; i++) {
    const prevDate = new Date(year, month, 0 - (startingDay - 1 - i))
    days.push({ date: prevDate, isCurrentMonth: false })
  }
  
  // Fill actual days
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const d = new Date(year, month, i)
    const isToday = d.getTime() === today.getTime()
    days.push({ date: d, isCurrentMonth: true, isToday })
  }
  
  // Fill trailing empty days
  const remainingCells = 42 - days.length // 6 rows * 7 days
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i)
    days.push({ date: nextDate, isCurrentMonth: false })
  }
  
  return days
})

const getAppointmentsForDate = (date) => {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return appointments.value.filter(a => {
    // a.appointment_date comes as YYYY-MM-DD or full ISO
    const apptDateStr = new Date(a.appointment_date).toISOString().split('T')[0]
    return apptDateStr === dateStr
  })
}

const selectedDateAppointments = computed(() => {
  if (!props.modelValue) return []
  const [y, m, d] = props.modelValue.split('-')
  const date = new Date(y, m - 1, d)
  return getAppointmentsForDate(date)
})

const formatSelectedDate = computed(() => {
  if (!props.modelValue) return '-'
  const [y, m, d] = props.modelValue.split('-')
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
})

const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  // Assuming timeStr is "HH:mm:ss"
  return timeStr.substring(0, 5) + ' น.'
}
</script>
