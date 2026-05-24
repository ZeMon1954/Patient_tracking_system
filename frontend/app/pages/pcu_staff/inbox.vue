<template>
  <NuxtLayout name="dashboard">
    <div class="px-8 pt-6 pb-8">
        
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" @click="filterStatus = ''">
            <div class="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[24px]">inbox</span>
            </div>
            <div>
              <p class="text-xs text-slate-500 font-medium mb-1">ทั้งหมด (Inbox)</p>
              <p class="text-2xl font-bold text-slate-800 leading-none">{{ inbox.length }}</p>
            </div>
          </div>
          <div class="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" @click="filterStatus = 'pending'">
            <div class="w-12 h-12 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[24px]">pending_actions</span>
            </div>
            <div>
              <p class="text-xs text-slate-500 font-medium mb-1">รอยืนยันรับตัว</p>
              <p class="text-2xl font-bold text-slate-800 leading-none">{{ pendingCount }}</p>
            </div>
          </div>
          <div class="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" @click="filterStatus = 'accepted'">
            <div class="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[24px]">task_alt</span>
            </div>
            <div>
              <p class="text-xs text-slate-500 font-medium mb-1">รับงานแล้ว</p>
              <p class="text-2xl font-bold text-slate-800 leading-none">{{ acceptedCount }}</p>
            </div>
          </div>
          <div class="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" @click="filterStatus = 'rejected'">
            <div class="w-12 h-12 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[24px]">cancel</span>
            </div>
            <div>
              <p class="text-xs text-slate-500 font-medium mb-1">ปฏิเสธ</p>
              <p class="text-2xl font-bold text-slate-800 leading-none">{{ rejectedCount }}</p>
            </div>
          </div>
        </div>

        <!-- Table Section -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div class="p-6 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-xl">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                <span class="material-symbols-outlined text-[20px]">view_list</span>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
                  รายการส่งตัวคนไข้ (Referral Worklist)
                </h3>
                <p class="text-sm text-slate-500">แสดงรายการคนไข้ส่งตัวเข้าเพื่อรับการรักษาต่อ</p>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <div v-if="isLoading" class="flex justify-center py-16">
              <div class="w-8 h-8 border-4 border-slate-200 border-t-[#00685f] rounded-full animate-spin"></div>
            </div>
            <table v-else class="w-full text-left text-sm whitespace-nowrap">
              <thead class="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th class="py-4 px-6 font-semibold">ความสำคัญ</th>
                  <th class="py-4 px-6 font-semibold">คนไข้</th>
                  <th class="py-4 px-6 font-semibold">หน่วยงานที่ส่งมา</th>
                  <th class="py-4 px-6 font-semibold">วันที่ส่ง</th>
                  <th class="py-4 px-6 font-semibold">กลุ่มโรคเรื้อรัง</th>
                  <th class="py-4 px-6 font-semibold w-1/4">เหตุผล/หมายเหตุ</th>
                  <th class="py-4 px-6 text-center font-semibold">การจัดการ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 text-slate-700">
                <tr v-if="filteredInbox.length === 0">
                  <td colspan="7" class="py-12 text-center text-slate-400">
                    <span class="material-symbols-outlined text-4xl block mb-2">inbox</span>
                    ไม่มีรายการส่งตัว
                  </td>
                </tr>
                <tr v-for="item in filteredInbox" :key="item.id" class="hover:bg-slate-50/50 transition-colors">
                  <td class="py-4 px-6">
                    <span :class="urgencyBadge(item.reason).class" class="inline-flex items-center justify-center px-2.5 py-1.5 rounded text-[11px] font-bold w-20 text-center">
                      <span v-html="urgencyBadge(item.reason).label"></span>
                    </span>
                  </td>
                  <td class="py-4 px-6">
                    <div class="font-bold text-slate-800 mb-1 text-[15px]">{{ item.first_name }} {{ item.last_name }}</div>
                    <div class="text-xs text-slate-500">{{ item.age }} ปี • {{ item.cid || '-' }}</div>
                  </td>
                  <td class="py-4 px-6 text-slate-600">{{ item.from_unit_name || '-' }}</td>
                  <td class="py-4 px-6 text-slate-600">
                    {{ formatDate(item.referral_date) }}<br/>
                    <span class="text-xs">{{ formatTime(item.referral_date) }}</span>
                  </td>
                  <td class="py-4 px-6">
                    <span v-if="item.disease_groups" class="inline-flex items-center px-2 py-1 rounded bg-slate-100 border border-slate-200 text-xs text-slate-500 font-medium">
                      {{ item.disease_groups }}
                    </span>
                    <span v-else class="text-slate-400">-</span>
                  </td>
                  <td class="py-4 px-6 text-slate-600 truncate max-w-[200px]" :title="item.reason">{{ item.reason || '-' }}</td>
                  <td class="py-4 px-6">
                    <div v-if="item.status === 'pending'" class="flex items-center justify-center gap-3">
                      <button @click="openDetail(item)" class="text-[#00685f] font-bold hover:underline text-sm">ดูข้อมูล</button>
                      <button @click="handleAccept(item)" :disabled="isSubmitting" class="px-3 py-1.5 bg-[#00685f] text-white rounded font-medium text-xs hover:bg-[#005049] transition-colors shadow-sm disabled:opacity-50">รับตัว</button>
                      <button @click="openReject(item)" :disabled="isSubmitting" class="px-3 py-1.5 bg-slate-100 text-slate-600 rounded font-medium text-xs border border-slate-200 hover:bg-slate-200 transition-colors disabled:opacity-50">ปฏิเสธ</button>
                    </div>
                    <div v-else-if="item.status === 'accepted'" class="flex flex-col items-center gap-1">
                      <button @click="openDetail(item)" class="text-slate-500 hover:underline text-sm font-medium">ดูข้อมูล</button>
                      <span class="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-100">
                        <span class="material-symbols-outlined text-[14px]">check_circle</span> รับโดย {{ item.receiver_name || 'เจ้าหน้าที่' }}
                      </span>
                    </div>
                    <div v-else-if="item.status === 'rejected'" class="flex flex-col items-center gap-1">
                      <button @click="openDetail(item)" class="text-slate-500 hover:underline text-sm font-medium">ดูข้อมูล</button>
                      <span class="inline-flex items-center gap-1 text-rose-500 bg-rose-50 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-100">
                        <span class="material-symbols-outlined text-[14px]">cancel</span> ปฏิเสธโดย {{ item.receiver_name || 'เจ้าหน้าที่' }}
                      </span>
                    </div>
                    <div v-else class="flex items-center justify-center">
                      <button @click="openDetail(item)" class="text-slate-500 hover:underline text-sm font-medium">ดูข้อมูล</button>
                      <span class="ml-3 text-xs text-slate-400 capitalize">{{ item.status }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>



    <!-- ===================== Modal รายละเอียดการส่งต่อ ===================== -->
    <div v-if="showDetailModal" class="fixed inset-0 z-[120] flex items-center justify-center bg-[#0b1c30]/40 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        <div class="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div class="flex items-center gap-4">
            <h2 class="text-xl font-bold text-slate-800 m-0 leading-none">รายละเอียดการส่งต่อ</h2>
            <span class="text-sm font-medium text-slate-500">REF-{{ detailItem?.id.toString().padStart(3, '0') }}</span>
          </div>
          <button @click="showDetailModal = false" class="text-slate-500 hover:text-slate-800 hover:bg-slate-200 p-2 rounded-full transition-colors flex items-center justify-center">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1 bg-[#f8f9ff] flex flex-col gap-6">
          <div class="flex flex-wrap items-center gap-3 bg-[#eff4ff] p-4 rounded-lg border border-[#d3e4fe]">
            <div :class="urgencyBadge(detailItem?.reason).statusClass" class="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium text-white">
              <span class="material-symbols-outlined text-[18px]">emergency</span>
              {{ urgencyBadge(detailItem?.reason).textOnly }}
            </div>
            <div v-if="detailItem?.status === 'pending'" class="flex items-center gap-2 bg-[#e5eeff] text-[#006399] px-3 py-1.5 rounded text-sm font-medium border border-[#7bc2ff]">
              <span class="material-symbols-outlined text-[18px]">pending_actions</span>รอรับงาน
            </div>
            <div v-else-if="detailItem?.status === 'accepted'" class="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded text-sm font-medium border border-emerald-200">
              <span class="material-symbols-outlined text-[18px]">check_circle</span>รับงานแล้ว
            </div>
            <div v-else-if="detailItem?.status === 'rejected'" class="flex items-center gap-2 bg-rose-100 text-rose-700 px-3 py-1.5 rounded text-sm font-medium border border-rose-200">
              <span class="material-symbols-outlined text-[18px]">cancel</span>ปฏิเสธแล้ว
            </div>
            <div class="ml-auto text-slate-500 text-xs font-medium flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">schedule</span>
              ส่งเมื่อ: {{ formatDate(detailItem?.referral_date) }}, {{ formatTime(detailItem?.referral_date) }} น.
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="flex flex-col gap-6">
              <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div class="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#00685f] text-[20px]">person</span>
                  <h3 class="text-sm font-semibold text-[#00685f] m-0">ข้อมูลผู้ป่วย</h3>
                </div>
                <div class="p-4 flex flex-col gap-4">
                  <div>
                    <div class="text-xl font-bold text-slate-800">{{ detailItem?.first_name }} {{ detailItem?.last_name }}</div>
                    <div class="text-base text-slate-500 mb-2">อายุ {{ detailItem?.age }} ปี • {{ detailItem?.gender === 'male' ? 'ชาย' : detailItem?.gender === 'female' ? 'หญิง' : 'อื่นๆ' }}</div>
                    
                    <!-- เพิ่มส่วนแสดงกลุ่มโรค -->
                    <div v-if="detailItem?.disease_groups" class="flex flex-wrap gap-1 mb-2">
                      <span v-for="d in detailItem.disease_groups.split(', ')" :key="d" class="px-2 py-0.5 bg-purple-50 text-purple-600 border border-purple-100 rounded text-[10px] font-bold">
                        {{ d }}
                      </span>
                    </div>
                    <div v-else class="text-[10px] text-slate-400 italic mb-2">ไม่มีข้อมูลโรคประจำตัว</div>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <div class="text-xs text-slate-400 mb-1">HN (Hospital Number)</div>
                      <div class="text-base text-slate-800 font-medium">{{ detailItem?.hn_number }}</div>
                    </div>
                    <div>
                      <div class="text-xs text-slate-400 mb-1">เลขประจำตัวประชาชน</div>
                      <div class="text-base text-slate-800 font-medium">{{ detailItem?.cid || '-' }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div class="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#00685f] text-[20px]">contact_phone</span>
                  <h3 class="text-sm font-semibold text-[#00685f] m-0">ข้อมูลการติดต่อ</h3>
                </div>
                <div class="p-4 flex flex-col gap-4">
                  <div class="flex items-start gap-3">
                    <span class="material-symbols-outlined text-slate-400 mt-0.5">call</span>
                    <div>
                      <div class="text-xs text-slate-400 mb-0.5">เบอร์โทรศัพท์</div>
                      <div class="text-base text-slate-800">{{ detailItem?.phone || '-' }}</div>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <span class="material-symbols-outlined text-slate-400 mt-0.5">location_on</span>
                    <div>
                      <div class="text-xs text-slate-400 mb-0.5">ที่อยู่</div>
                      <div class="text-base text-slate-800">{{ detailItem?.address || '-' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex flex-col gap-6">
              <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div class="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#00685f] text-[20px]">route</span>
                  <h3 class="text-sm font-semibold text-[#00685f] m-0">เส้นทางการส่งต่อ</h3>
                </div>
                <div class="p-4 relative">
                  <div class="absolute left-[27px] top-[40px] bottom-[40px] w-[2px] bg-slate-200"></div>
                  <div class="flex flex-col gap-6">
                    <div class="flex items-start gap-3 relative z-10">
                      <div class="w-6 h-6 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                        <div class="w-2 h-2 rounded-full bg-slate-400"></div>
                      </div>
                      <div>
                        <div class="text-xs text-slate-400 mb-0.5">ต้นทาง (Origin)</div>
                        <div class="text-base text-slate-800 font-medium">{{ detailItem?.from_unit_name || '-' }}</div>
                        <div class="text-sm text-slate-500">โดย {{ detailItem?.referred_by_name || '-' }} ({{ detailItem?.referred_by_role || '-' }})</div>
                      </div>
                    </div>
                    <div class="flex items-start gap-3 relative z-10">
                      <div class="w-6 h-6 rounded-full bg-[#008378] border-2 border-[#00685f] flex items-center justify-center shrink-0 mt-0.5">
                        <span class="material-symbols-outlined text-[14px] text-white font-bold">location_on</span>
                      </div>
                      <div>
                        <div class="text-xs text-slate-400 mb-0.5">ปลายทาง (Destination)</div>
                        <div class="text-base text-[#00685f] font-medium">{{ detailItem?.to_unit_name || 'หน่วยงานของท่าน' }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="bg-white border border-slate-200 rounded-lg overflow-hidden flex-1">
                <div class="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#00685f] text-[20px]">medical_information</span>
                  <h3 class="text-sm font-semibold text-[#00685f] m-0">เหตุผลการส่งต่อ / อาการ (Reason)</h3>
                </div>
                <div class="p-4">
                  <div class="text-sm text-slate-800 leading-relaxed p-4 bg-slate-50 rounded border border-slate-200 whitespace-pre-wrap">{{ detailItem?.reason || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="p-4 border-t border-slate-200 bg-white flex items-center justify-end gap-3">
          <button @click="showDetailModal = false" class="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors">
            ปิดหน้าต่าง
          </button>
          <template v-if="detailItem?.status === 'pending'">
            <button @click="openReject(detailItem)" :disabled="isSubmitting" class="px-6 py-2.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
              <span class="material-symbols-outlined text-[18px]">cancel</span> ปฏิเสธรับงาน
            </button>
            <button @click="handleAccept(detailItem)" :disabled="isSubmitting" class="px-6 py-2.5 rounded-lg bg-[#00685f] text-white hover:bg-[#005049] text-sm font-bold transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50">
              <span class="material-symbols-outlined text-[18px]">check_circle</span> ยืนยันรับเคส
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- ===================== Modal ปฏิเสธการส่งต่อ ===================== -->
    <div v-if="showRejectModal" class="fixed inset-0 z-[150] flex items-center justify-center bg-[#0b1c30]/60 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div class="p-6 border-b border-slate-200 bg-rose-50 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-[24px]">warning</span>
          </div>
          <div>
            <h2 class="text-lg font-bold text-rose-700 m-0">ระบุเหตุผลที่ปฏิเสธ</h2>
            <p class="text-xs text-rose-500">กรุณาระบุเหตุผลเพื่อให้หน่วยงานต้นทางทราบ</p>
          </div>
        </div>
        <div class="p-6 space-y-4">
          <textarea v-model="rejectReason" rows="4" placeholder="ระบุเหตุผล เช่น ไม่พร้อมรับ, ต้องการข้อมูลเพิ่มเติม, ผู้ป่วยไม่มาตามนัด..." 
            class="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm outline-none transition-all focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none"></textarea>
        </div>
        <div class="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button @click="showRejectModal = false" class="px-5 py-2 rounded-lg border border-slate-300 text-slate-600 font-medium hover:bg-white transition-colors">ยกเลิก</button>
          <button @click="confirmReject" :disabled="!rejectReason.trim() || isSubmitting" class="px-5 py-2 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
            <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
            ยืนยันการปฏิเสธ
          </button>
        </div>
      </div>
    </div>

    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Swal from 'sweetalert2'

const config = useRuntimeConfig()
const API_BASE = `${config.public.apiBase}/api`

// State
const inbox = ref([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const searchQuery = ref('')
const filterStatus = ref('') // '', 'pending', 'accepted', 'rejected'

const showDetailModal = ref(false)
const showRejectModal = ref(false)
const detailItem = ref(null)
const rejectReason = ref('')

// Computed
const filteredInbox = computed(() => {
  let result = inbox.value
  if (filterStatus.value) {
    result = result.filter(item => item.status === filterStatus.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(item => 
      (item.first_name + ' ' + item.last_name).toLowerCase().includes(q) ||
      (item.cid && item.cid.includes(q)) ||
      (item.hn_number && item.hn_number.toLowerCase().includes(q))
    )
  }
  return result
})

const pendingCount = computed(() => inbox.value.filter(i => i.status === 'pending').length)
const acceptedCount = computed(() => inbox.value.filter(i => i.status === 'accepted').length)
const rejectedCount = computed(() => inbox.value.filter(i => i.status === 'rejected').length)

// Helpers
const formatDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'
const formatTime = (d) => d ? new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'

const urgencyBadge = (reason) => {
  const r = (reason || '').toLowerCase()
  if (r.includes('วิกฤต') || r.includes('ฉุกเฉิน') || r.includes('urgent') || r.includes('stemi')) {
    return {
      class: 'bg-rose-600 text-white',
      statusClass: 'bg-rose-600',
      label: 'ฉุกเฉิน<br/>(High)',
      textOnly: 'ฉุกเฉิน (High)'
    }
  } else if (r.includes('ด่วน')) {
    return {
      class: 'border-2 border-rose-400 text-rose-500 bg-white',
      statusClass: 'bg-rose-500',
      label: 'เร่งด่วน<br/>(Urgent)',
      textOnly: 'เร่งด่วน (Urgent)'
    }
  } else if (r.includes('นัด') || r.includes('ติดตาม')) {
    return {
      class: 'bg-[#008378] text-white',
      statusClass: 'bg-[#008378]',
      label: 'นัดหมาย<br/>(Appt)',
      textOnly: 'นัดหมาย (Appt)'
    }
  }
  return {
    class: 'bg-blue-400 text-white',
    statusClass: 'bg-blue-400',
    label: 'ทั่วไป<br/>(Normal)',
    textOnly: 'ทั่วไป (Normal)'
  }
}

// API Calls
const fetchInbox = async () => {
  isLoading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/referrals/inbox`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    const data = await res.json()
    inbox.value = data
  } catch (err) {
    Swal.fire('เกิดข้อผิดพลาด', 'โหลดข้อมูลไม่สำเร็จ', 'error')
  } finally {
    isLoading.value = false
  }
}

const updateStatus = async (id, status, reason = '') => {
  isSubmitting.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/referrals/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status, reject_reason: reason })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    Swal.fire({ title: 'สำเร็จ!', text: status === 'accepted' ? 'ยืนยันรับงานสำเร็จ' : 'ปฏิเสธงานสำเร็จ', icon: 'success', timer: 1500, showConfirmButton: false })
    
    // Refresh
    await fetchInbox()
    
    // Update Detail modal if open
    if (showDetailModal.value && detailItem.value) {
      const updated = inbox.value.find(i => i.id === id)
      if (updated) detailItem.value = updated
    }
  } catch (err) {
    Swal.fire('เกิดข้อผิดพลาด', err.message, 'error')
  } finally {
    isSubmitting.value = false
  }
}

// Actions
const openDetail = (item) => {
  detailItem.value = item
  showDetailModal.value = true
}

const handleAccept = async (item) => {
  const result = await Swal.fire({
    title: 'ยืนยันรับงาน',
    text: `คุณต้องการรับตัวคนไข้ "${item.first_name} ${item.last_name}" ใช่หรือไม่?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'ใช่, รับงาน',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#00685f'
  })
  if (!result.isConfirmed) return
  await updateStatus(item.id, 'accepted')
}

const openReject = (item) => {
  detailItem.value = item
  rejectReason.value = ''
  showRejectModal.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) return
  await updateStatus(detailItem.value.id, 'rejected', rejectReason.value.trim())
  showRejectModal.value = false
}

const handleLogout = async () => await navigateTo('/login')

onMounted(() => {
  fetchInbox()
})
</script>
