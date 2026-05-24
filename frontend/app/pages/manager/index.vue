<template>
  <NuxtLayout name="dashboard">
    <div class="p-4 sm:p-6 md:px-8 md:pt-6 md:pb-8">

      <!-- Stat Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 mb-1">จำนวนผู้ป่วยทั้งหมด</p>
            <div class="text-3xl font-black text-slate-800">{{ stats.totalPatients.toLocaleString() }}</div>
            <div class="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded">
              <span class="material-symbols-outlined text-[14px]">group</span>
              ผู้ป่วยในระบบ
            </div>
          </div>
          <div class="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center">
            <span class="material-symbols-outlined text-[28px] text-[#00685f]">group</span>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 mb-1">เคสส่งตัวรอดำเนินการ</p>
            <div class="text-3xl font-black text-amber-600">{{ stats.pendingReferrals.toLocaleString() }}</div>
            <div class="flex items-center gap-1 mt-2 text-xs font-medium text-rose-600 bg-rose-50 w-fit px-2 py-1 rounded">
              <span class="material-symbols-outlined text-[14px]">warning</span>
              รอการรับตัว
            </div>
          </div>
          <div class="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
            <span class="material-symbols-outlined text-[28px] text-amber-500">pending_actions</span>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 mb-1">ติดตามผู้ป่วยวันนี้</p>
            <div class="text-3xl font-black text-slate-800">{{ stats.todayVisits.toLocaleString() }}</div>
            <div class="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded">
              <span class="material-symbols-outlined text-[14px]">check_circle</span>
              บันทึกแล้ววันนี้
            </div>
          </div>
          <div class="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
            <span class="material-symbols-outlined text-[28px] text-blue-500">home_health</span>
          </div>
        </div>
      </div>

      <!-- Charts Row 1 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        <!-- Monthly Appointments Line Chart -->
        <div class="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center gap-2 mb-4">
            <span class="material-symbols-outlined text-[#00685f]">show_chart</span>
            <h3 class="text-base font-bold text-slate-800">แนวโน้มนัดหมาย 6 เดือนล่าสุด</h3>
          </div>
          <client-only>
            <apexchart
              v-if="appointmentChartReady"
              type="area"
              height="260"
              :options="appointmentChartOptions"
              :series="appointmentSeries"
            />
            <div v-else class="h-[260px] flex items-center justify-center text-slate-400 text-sm">กำลังโหลด...</div>
          </client-only>
        </div>

        <!-- Referral Status Donut -->
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center gap-2 mb-4">
            <span class="material-symbols-outlined text-amber-500">donut_large</span>
            <h3 class="text-base font-bold text-slate-800">สถานะการส่งต่อ</h3>
          </div>
          <client-only>
            <apexchart
              v-if="referralChartReady"
              type="donut"
              height="260"
              :options="referralChartOptions"
              :series="referralSeries"
            />
            <div v-else class="h-[260px] flex items-center justify-center text-slate-400 text-sm">กำลังโหลด...</div>
          </client-only>
        </div>
      </div>

      <!-- Charts Row 2 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Disease Distribution Bar -->
        <div class="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div class="flex items-center gap-2 mb-4">
            <span class="material-symbols-outlined text-blue-500">bar_chart</span>
            <h3 class="text-base font-bold text-slate-800">การกระจายกลุ่มโรค</h3>
          </div>
          <client-only>
            <apexchart
              v-if="diseaseChartReady"
              type="bar"
              height="240"
              :options="diseaseChartOptions"
              :series="diseaseSeries"
            />
            <div v-else class="h-[240px] flex items-center justify-center text-slate-400 text-sm">กำลังโหลด...</div>
          </client-only>
        </div>

        <!-- Health Status -->
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div class="flex items-center gap-2 mb-6">
            <span class="material-symbols-outlined text-rose-500">warning</span>
            <h3 class="text-base font-bold text-slate-800">สถานะสุขภาพผู้ป่วย</h3>
          </div>
          <div class="flex flex-col gap-3 flex-1 justify-center">
            <div class="flex items-center justify-between p-4 rounded-lg bg-rose-50/50 border border-rose-200">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-rose-600"></div>
                <div>
                  <p class="text-sm font-bold text-rose-700">วิกฤต</p>
                  <p class="text-xs text-rose-600/70">ต้องดูแลทันที</p>
                </div>
              </div>
              <div class="text-2xl font-black text-rose-700">{{ stats.urgency.critical }}</div>
            </div>
            <div class="flex items-center justify-between p-4 rounded-lg bg-amber-50/50 border border-amber-200">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-amber-500"></div>
                <div>
                  <p class="text-sm font-bold text-amber-700">เฝ้าระวัง</p>
                  <p class="text-xs text-amber-600/70">ติดตามใกล้ชิด</p>
                </div>
              </div>
              <div class="text-2xl font-black text-amber-700">{{ stats.urgency.warning }}</div>
            </div>
            <div class="flex items-center justify-between p-4 rounded-lg bg-emerald-50/50 border border-emerald-200">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                <div>
                  <p class="text-sm font-bold text-emerald-700">ปกติ</p>
                  <p class="text-xs text-emerald-600/70">ติดตามตามรอบ</p>
                </div>
              </div>
              <div class="text-2xl font-black text-emerald-700">{{ stats.urgency.normal }}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const config = useRuntimeConfig()
const API_BASE = `${config.public.apiBase}/api`

const stats = ref({
  totalPatients: 0,
  pendingReferrals: 0,
  todayVisits: 0,
  urgency: { critical: 0, warning: 0, normal: 0 }
})

const appointmentStats = ref([])
const diseaseStats = ref([])
const referralStats = ref([])

const appointmentChartReady = ref(false)
const diseaseChartReady = ref(false)
const referralChartReady = ref(false)

const thMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
const formatMonth = (m) => thMonths[parseInt(m.split('-')[1]) - 1]

// ---- Appointment Area Chart ----
const appointmentSeries = computed(() => [{
  name: 'จำนวนนัดหมาย',
  data: appointmentStats.value.map(i => i.count)
}])

const appointmentChartOptions = computed(() => ({
  chart: { toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'IBM Plex Sans Thai, sans-serif' },
  colors: ['#00685f'],
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05 } },
  stroke: { curve: 'smooth', width: 3 },
  xaxis: { categories: appointmentStats.value.map(i => formatMonth(i.month)), labels: { style: { colors: '#94a3b8', fontSize: '12px' } } },
  yaxis: { labels: { style: { colors: '#94a3b8', fontSize: '12px' } }, min: 0 },
  grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
  dataLabels: { enabled: false },
  tooltip: { theme: 'light' },
  markers: { size: 5, colors: ['#00685f'], strokeColors: '#fff', strokeWidth: 2 }
}))

// ---- Disease Bar Chart ----
const diseaseSeries = computed(() => [{
  name: 'จำนวนผู้ป่วย',
  data: diseaseStats.value.map(i => i.value)
}])

const diseaseChartOptions = computed(() => ({
  chart: { toolbar: { show: false }, fontFamily: 'IBM Plex Sans Thai, sans-serif' },
  colors: ['#006399'],
  plotOptions: { bar: { borderRadius: 6, horizontal: false, columnWidth: '55%' } },
  xaxis: { categories: diseaseStats.value.map(i => i.label), labels: { style: { colors: '#94a3b8', fontSize: '11px' }, rotate: -20 } },
  yaxis: { labels: { style: { colors: '#94a3b8', fontSize: '12px' } }, min: 0 },
  grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
  dataLabels: { enabled: false },
  tooltip: { theme: 'light' }
}))

// ---- Referral Donut Chart ----
const referralStatusMap = { pending: 'รอรับ', accepted: 'รับแล้ว', completed: 'เสร็จสิ้น', rejected: 'ปฏิเสธ' }
const referralColors = { pending: '#f59e0b', accepted: '#3b82f6', completed: '#10b981', rejected: '#ef4444' }

const referralSeries = computed(() => referralStats.value.map(i => i.count))
const referralChartOptions = computed(() => ({
  chart: { fontFamily: 'IBM Plex Sans Thai, sans-serif' },
  colors: referralStats.value.map(i => referralColors[i.status] || '#94a3b8'),
  labels: referralStats.value.map(i => referralStatusMap[i.status] || i.status),
  legend: { position: 'bottom', fontSize: '13px', fontFamily: 'IBM Plex Sans Thai, sans-serif' },
  dataLabels: { style: { fontSize: '13px', fontFamily: 'IBM Plex Sans Thai, sans-serif' } },
  plotOptions: { pie: { donut: { size: '65%', labels: { show: true, total: { show: true, label: 'ทั้งหมด', fontSize: '14px', fontFamily: 'IBM Plex Sans Thai, sans-serif', color: '#475569' } } } } },
  tooltip: { theme: 'light' }
}))

const fetchDashboardStats = async () => {
  try {
    const token = localStorage.getItem('token')
    const [summaryRes, appointRes, diseaseRes, referralRes] = await Promise.all([
      fetch(`${API_BASE}/dashboard/summary`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_BASE}/dashboard/stats/appointments`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_BASE}/dashboard/stats/disease`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_BASE}/dashboard/stats/referrals`, { headers: { 'Authorization': `Bearer ${token}` } })
    ])
    if (summaryRes.ok) stats.value = await summaryRes.json()
    if (appointRes.ok) { appointmentStats.value = await appointRes.json(); appointmentChartReady.value = true }
    if (diseaseRes.ok) { diseaseStats.value = await diseaseRes.json(); diseaseChartReady.value = true }
    if (referralRes.ok) { referralStats.value = await referralRes.json(); referralChartReady.value = true }
  } catch (err) {
    console.error('Dashboard error:', err)
  }
}

onMounted(() => fetchDashboardStats())
</script>

<style scoped>
/* Scoped styles */
</style>
