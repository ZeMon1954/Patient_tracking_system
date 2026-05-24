<template>
  <NuxtLayout name="dashboard">
    <div class="p-4 sm:p-6 md:p-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-[#1a2b3c] mb-1">จัดการหน่วยบริการ</h1>
            <p class="text-slate-500 text-sm">ระบบจัดการหน่วยบริการสุขภาพ</p>
          </div>
          <button @click="showAddUnitModal = true" class="w-full sm:w-auto bg-[#00685f] hover:bg-[#005049] text-white px-4 py-2.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-sm">
            <span class="material-symbols-outlined text-[18px]">add_circle</span>
            ลงทะเบียนหน่วยบริการใหม่
          </button>
        </div>

        <div class="bg-white p-3 rounded-t-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-0 border-b-0">
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="relative w-full sm:w-auto">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">filter_list</span>
              <select class="pl-9 pr-8 py-2 border border-slate-200 rounded-md text-sm text-slate-600 appearance-none bg-slate-50 w-full sm:min-w-[160px] focus:outline-none focus:ring-1 focus:ring-[#00685f]">
                <option>ประเภททั้งหมด</option>
                <option>โรงพยาบาล</option>
                <option>คลินิก</option>
              </select>
              <span class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">expand_more</span>
            </div>
            <div class="relative w-full sm:w-auto">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">location_on</span>
              <select class="pl-9 pr-8 py-2 border border-slate-200 rounded-md text-sm text-slate-600 appearance-none bg-slate-50 w-full sm:min-w-[160px] focus:outline-none focus:ring-1 focus:ring-[#00685f]">
                <option>ทุกจังหวัด</option>
                <option>กรุงเทพฯ</option>
                <option>เชียงใหม่</option>
              </select>
              <span class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">expand_more</span>
            </div>
          </div>
          <div class="flex gap-2 justify-end">
            <button class="p-2 border border-slate-200 rounded-md text-slate-500 hover:bg-slate-50"><span class="material-symbols-outlined text-[18px] block">download</span></button>
            <button class="p-2 border border-[#84c4ff] bg-[#eff6ff] rounded-md text-[#006399]"><span class="material-symbols-outlined text-[18px] block">view_list</span></button>
            <button class="p-2 border border-slate-200 rounded-md text-slate-500 hover:bg-slate-50"><span class="material-symbols-outlined text-[18px] block">grid_view</span></button>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-b-xl overflow-hidden shadow-sm">
          <div class="overflow-x-auto w-full">
            <table class="w-full min-w-[700px] text-left text-sm">
           <thead class="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th class="py-3 px-4 w-12"><input type="checkbox" class="rounded border-slate-300 text-[#00685f] focus:ring-[#00685f]" /></th>
                <th class="py-3 px-4">รหัส</th>
                <th class="py-3 px-4">ชื่อหน่วยบริการ</th> 
                <th class="py-3 px-4">ประเภท</th>
                <th class="py-3 px-4">สถานะ</th>
                <th class="py-3 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="unit in serviceUnits" :key="unit.code" class="hover:bg-slate-50/50 transition-colors">
                <td class="py-4 px-4"><input type="checkbox" class="rounded border-slate-300 text-[#00685f] focus:ring-[#00685f]" /></td>
                <td class="py-4 px-4 font-mono text-slate-500">{{ unit.code }}</td>
                <td class="py-4 px-4">
                  <div class="text-xs text-slate-500 mt-0.5">{{ unit.nameTh }}</div>
                </td>
                <td class="py-4 px-4">
                  <div class="flex items-center gap-2 text-slate-700">
                    <span class="material-symbols-outlined text-[18px] text-[#00685f]">{{ unit.icon }}</span>
                    {{ typeLabel(unit.type) }}
                  </div>
                </td>
                
                <td class="py-4 px-4">
                  <span v-if="unit.status === 'Active'" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">ใช้งาน</span>
                  <span v-else-if="unit.status === 'Under Review'" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">อยู่ระหว่างตรวจสอบ</span>
                  <span v-else class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">หยุดใช้งาน</span>
                </td>
                <td class="py-4 px-4 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <button @click="openEditModal(unit)" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-50 text-slate-400 hover:text-[#006399] transition-colors" title="แก้ไขข้อมูล">
                      <span class="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button @click="handleDeleteUnit(unit)" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="ลบข้อมูล">
                      <span class="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          </div>

          <div class="bg-slate-50/50 border-t border-slate-200 p-4 flex justify-between items-center text-sm text-slate-500">
            <div>แสดง 1 ถึง {{ serviceUnits?.length }} รายการ</div>
            <div class="flex items-center gap-1 font-medium">
              <button class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 transition-colors"><span class="material-symbols-outlined text-[18px]">chevron_left</span></button>
              <button class="w-8 h-8 flex items-center justify-center rounded bg-[#00685f] text-white">1</button>
              <button class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 transition-colors"><span class="material-symbols-outlined text-[18px]">chevron_right</span></button>
            </div>
          </div>
        </div>

    <!-- Modal: Add New Unit -->
    <div v-if="showAddUnitModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-lg p-4 sm:p-8 md:p-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
        <header class="mb-8 text-center relative">
          <h1 class="text-2xl font-medium text-slate-900">เพิ่มหน่วยบริการ</h1>
          <button @click="closeAddModal" class="absolute right-0 top-0 text-slate-400 hover:text-slate-600 transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>
        
        <form @submit.prevent="handleAddUnit" class="space-y-4 max-w-xl mx-auto">
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2 sm:gap-4 items-start">
            <label class="text-left sm:text-right text-sm font-medium text-slate-700 pt-2">รหัสหน่วยบริการ</label>
            <div class="space-y-1">
              <input type="text" disabled 
                class="block w-full border-slate-200 rounded-md shadow-sm bg-slate-50 text-slate-500 sm:text-sm py-2 px-3 border outline-none cursor-not-allowed" 
                placeholder="ระบบจะออกรหัสให้อัตโนมัติ"
              />
              <p class="text-[10px] text-slate-400 italic">แยกตามประเภท: 1XXXX (รพ.), 2XXXX (รพ.สต./คลินิก)</p>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2 sm:gap-4 items-start sm:items-center">
            <label class="text-left sm:text-right text-sm font-medium text-slate-700">ชื่อหน่วยบริการ (TH)</label>
            <input v-model="form.nameTh" type="text" required class="block w-full border-slate-300 rounded-md shadow-sm focus:ring-[#00685f] focus:border-[#00685f] sm:text-sm py-2 px-3 border outline-none transition-all" />
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2 sm:gap-4 items-start sm:items-center">
            <label class="text-left sm:text-right text-sm font-medium text-slate-700">ประเภทหน่วยบริการ</label>
            <select v-model="form.type" class="block w-full border-slate-300 rounded-md shadow-sm focus:ring-[#00685f] focus:border-[#00685f] sm:text-sm py-2 px-3 bg-white border outline-none transition-all">
              <option disabled value="">เลือกประเภท</option>
              <option value="Hospital">โรงพยาบาล</option>
              <option value="Clinic">คลินิก</option>
              <option value="Health Center">สถานีอนามัย</option>
            </select>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2 sm:gap-4 items-start sm:items-center">
            <label class="text-left sm:text-right text-sm font-medium text-slate-700">จังหวัด</label>
            <input v-model="form.province" type="text" class="block w-full border-slate-300 rounded-md shadow-sm focus:ring-[#00685f] focus:border-[#00685f] sm:text-sm py-2 px-3 border outline-none transition-all" placeholder="ระบุจังหวัด" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2 sm:gap-4 items-start sm:items-center">
            <label class="text-left sm:text-right text-sm font-medium text-slate-700">อำเภอ</label>
            <input v-model="form.district" type="text" class="block w-full border-slate-300 rounded-md shadow-sm focus:ring-[#00685f] focus:border-[#00685f] sm:text-sm py-2 px-3 border outline-none transition-all" placeholder="ระบุอำเภอ" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2 sm:gap-4 items-start sm:items-center">
            <label class="text-left sm:text-right text-sm font-medium text-slate-700">ตำบล</label>
            <input v-model="form.subDistrict" type="text" class="block w-full border-slate-300 rounded-md shadow-sm focus:ring-[#00685f] focus:border-[#00685f] sm:text-sm py-2 px-3 border outline-none transition-all" placeholder="ระบุตำบล" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2 sm:gap-4 items-start sm:items-center">
            <label class="text-left sm:text-right text-sm font-medium text-slate-700">ที่อยู่</label>
            <input v-model="form.address" type="text" class="block w-full border-slate-300 rounded-md shadow-sm focus:ring-[#00685f] focus:border-[#00685f] sm:text-sm py-2 px-3 border outline-none transition-all" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2 sm:gap-4 items-start sm:items-center">
            <label class="text-left sm:text-right text-sm font-medium text-slate-700">เบอร์โทรศัพท์</label>
            <input v-model="form.phone" type="tel" class="block w-full border-slate-300 rounded-md shadow-sm focus:ring-[#00685f] focus:border-[#00685f] sm:text-sm py-2 px-3 border outline-none transition-all" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2 sm:gap-4 items-start pt-2">
            <span class="text-left sm:text-right text-sm font-medium text-slate-700">สถานะการใช้งาน</span>
            <div class="flex items-center space-x-6">
              <label class="inline-flex items-center cursor-pointer">
                <input v-model="form.status" value="Active" type="radio" class="form-radio h-4 w-4 text-[#00685f]" />
                <span class="ml-2 text-sm text-slate-700">กำลังใช้งาน</span>
              </label>
              <label class="inline-flex items-center cursor-pointer">
                <input v-model="form.status" value="Inactive" type="radio" class="form-radio h-4 w-4 text-[#00685f]" />
                <span class="ml-2 text-sm text-slate-700">หยุดใช้งาน</span>
              </label>
            </div>
          </div>
          
          <div class="mt-8 pt-4 flex justify-center gap-4">
            <button
              type="submit"
              :disabled="isSubmitting"
              class="min-w-[100px] inline-flex justify-center items-center gap-2 py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#00685f] hover:bg-[#005049] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="isSubmitting" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              {{ isSubmitting ? 'กำลังบันทึก...' : 'เพิ่ม' }}
            </button>
            <button @click="closeAddModal" type="button" class="min-w-[100px] inline-flex justify-center py-2.5 px-6 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors">
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Edit Unit -->
    <div v-if="showEditUnitModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-lg p-4 sm:p-8 md:p-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
        <header class="mb-8 text-center relative">
          <h1 class="text-2xl font-medium text-slate-900">แก้ไขหน่วยบริการ</h1>
          <button @click="closeEditModal" class="absolute right-0 top-0 text-slate-400 hover:text-slate-600 transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>
        <form @submit.prevent="handleEditUnit" class="space-y-4 max-w-xl mx-auto">
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2 sm:gap-4 items-start sm:items-center">
            <label class="text-left sm:text-right text-sm font-medium text-slate-700">รหัสหน่วยบริการ</label>
            <input v-model="editForm.code" type="text" readonly class="block w-full border-slate-300 rounded-md shadow-sm bg-slate-100 text-slate-500 cursor-not-allowed sm:text-sm py-2 px-3 border outline-none" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2 sm:gap-4 items-start sm:items-center">
            <label class="text-left sm:text-right text-sm font-medium text-slate-700">ชื่อหน่วยบริการ (TH)</label>
            <input v-model="editForm.nameTh" type="text" required class="block w-full border-slate-300 rounded-md shadow-sm focus:ring-[#00685f] focus:border-[#00685f] sm:text-sm py-2 px-3 border outline-none transition-all" />
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2 sm:gap-4 items-start sm:items-center">
            <label class="text-left sm:text-right text-sm font-medium text-slate-700">ประเภทหน่วยบริการ</label>
            <select v-model="editForm.type" required class="block w-full border-slate-300 rounded-md shadow-sm focus:ring-[#00685f] focus:border-[#00685f] sm:text-sm py-2 px-3 bg-white border outline-none transition-all">
              <option disabled value="">เลือกประเภท</option>
              <option value="Hospital">โรงพยาบาล</option>
              <option value="Clinic">คลินิก</option>
              <option value="Health Center">สถานีอนามัย</option>
            </select>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2 sm:gap-4 items-start sm:items-center">
            <label class="text-left sm:text-right text-sm font-medium text-slate-700">จังหวัด</label>
            <input v-model="editForm.province" type="text" class="block w-full border-slate-300 rounded-md shadow-sm focus:ring-[#00685f] focus:border-[#00685f] sm:text-sm py-2 px-3 border outline-none transition-all" placeholder="ระบุจังหวัด" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2 sm:gap-4 items-start sm:items-center">
            <label class="text-left sm:text-right text-sm font-medium text-slate-700">อำเภอ</label>
            <input v-model="editForm.district" type="text" class="block w-full border-slate-300 rounded-md shadow-sm focus:ring-[#00685f] focus:border-[#00685f] sm:text-sm py-2 px-3 border outline-none transition-all" placeholder="ระบุอำเภอ" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2 sm:gap-4 items-start sm:items-center">
            <label class="text-left sm:text-right text-sm font-medium text-slate-700">ตำบล</label>
            <input v-model="editForm.subDistrict" type="text" class="block w-full border-slate-300 rounded-md shadow-sm focus:ring-[#00685f] focus:border-[#00685f] sm:text-sm py-2 px-3 border outline-none transition-all" placeholder="ระบุตำบล" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2 sm:gap-4 items-start sm:items-center">
            <label class="text-left sm:text-right text-sm font-medium text-slate-700">ที่อยู่</label>
            <input v-model="editForm.address" type="text" class="block w-full border-slate-300 rounded-md shadow-sm focus:ring-[#00685f] focus:border-[#00685f] sm:text-sm py-2 px-3 border outline-none transition-all" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2 sm:gap-4 items-start sm:items-center">
            <label class="text-left sm:text-right text-sm font-medium text-slate-700">เบอร์โทรศัพท์</label>
            <input v-model="editForm.phone" type="tel" class="block w-full border-slate-300 rounded-md shadow-sm focus:ring-[#00685f] focus:border-[#00685f] sm:text-sm py-2 px-3 border outline-none transition-all" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2 sm:gap-4 items-start pt-2">
            <span class="text-left sm:text-right text-sm font-medium text-slate-700">สถานะการใช้งาน</span>
            <div class="flex items-center space-x-6">
              <label class="inline-flex items-center cursor-pointer">
                <input v-model="editForm.status" value="Active" type="radio" class="form-radio h-4 w-4 text-[#00685f]" />
                <span class="ml-2 text-sm text-slate-700">กำลังใช้งาน</span>
              </label>
              <label class="inline-flex items-center cursor-pointer">
                <input v-model="editForm.status" value="Inactive" type="radio" class="form-radio h-4 w-4 text-[#00685f]" />
                <span class="ml-2 text-sm text-slate-700">หยุดใช้งาน</span>
              </label>
            </div>
          </div>
          <div class="mt-8 pt-4 flex justify-center gap-4">
            <button type="submit" class="min-w-[100px] inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#006399] hover:bg-[#004b74] transition-colors">
              บันทึก
            </button>
            <button @click="closeEditModal" type="button" class="min-w-[100px] inline-flex justify-center py-2.5 px-6 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors">
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import Swal from 'sweetalert2'

const API_BASE = 'http://localhost:3001'

const showAddUnitModal = ref(false)
const showEditUnitModal = ref(false)
const isSubmitting = ref(false)
const serviceUnits = ref([])

const iconMap = {
  'Hospital': 'local_hospital',
  'Clinic': 'medical_services',
  'Health Center': 'health_and_safety'
}

const typeLabelMap = {
  'Hospital': 'โรงพยาบาล',
  'Clinic': 'คลินิก',
  'Health Center': 'สถานีอนามัย'
}

const typeLabel = (type) => typeLabelMap[type] || type || '-'

const form = reactive({
  code: '', nameTh: '', nameEn: '', type: '',
  province: '', district: '', subDistrict: '',
  address: '', phone: '', status: 'Active'
})

const editForm = reactive({
  code: '', nameTh: '', nameEn: '', type: '',
  province: '', district: '', subDistrict: '',
  address: '', phone: '', status: 'Active'
})

// ✅ ฟังก์ชัน Logout
const handleLogout = async (path) => {
  // หากมีการเก็บ Token สามารถเคลียร์ได้ที่นี่ เช่น localStorage.removeItem('token')
  await navigateTo(path)
}

// ✅ ฟังก์ชันปิด Modal และล้างค่าฟอร์ม (Add)
const closeAddModal = () => {
  showAddUnitModal.value = false
  Object.assign(form, {
    code: '', nameTh: '', nameEn: '', type: '',
    province: '', district: '', subDistrict: '',
    address: '', phone: '', status: 'Active'
  })
}

// ✅ ฟังก์ชันปิด Modal (Edit)
const closeEditModal = () => {
  showEditUnitModal.value = false
}

// ✅ SweetAlert2 สำเร็จ
const swalSuccess = (title, text) => Swal.fire({
  icon: 'success',
  title,
  text,
  confirmButtonColor: '#00685f',
  confirmButtonText: 'ตกลง',
  timer: 2500,
  timerProgressBar: true,
})

// ✅ SweetAlert2 error
const swalError = (text) => Swal.fire({
  icon: 'error',
  title: 'เกิดข้อผิดพลาด',
  text,
  confirmButtonColor: '#d33',
  confirmButtonText: 'ตกลง',
})

// ✅ SweetAlert2 ยืนยันลบ
const swalConfirmDelete = (name) => Swal.fire({
  icon: 'warning',
  title: 'ยืนยันการลบ?',
  text: `ต้องการลบ "${name}" ออกจากระบบหรือไม่`,
  showCancelButton: true,
  confirmButtonColor: '#d33',
  cancelButtonColor: '#6b7280',
  confirmButtonText: 'ลบเลย',
  cancelButtonText: 'ยกเลิก',
})

const handleAddUnit = async () => {
  isSubmitting.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE}/api/service-units`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ...form })
    })

    const result = await response.json()

    if (!response.ok) throw new Error(result.message || 'เกิดข้อผิดพลาด')

    serviceUnits.value.unshift({
      code:     result.code,
      nameEn:   result.nameEn || form.nameEn,
      nameTh:   result.nameTh,
      type:     form.type,
      icon:     iconMap[form.type] || 'domain',
      province: form.province,
      district: form.district,
      subDistrict: form.subDistrict,
      address: form.address,
      phone: form.phone,
      status:   form.status
    })

    closeAddModal() // เรียกใช้ฟังก์ชันปิดและล้างค่าฟอร์ม
    await swalSuccess('เพิ่มสำเร็จ!', `ลงทะเบียน "${result.nameTh}" เรียบร้อยแล้ว`)

  } catch (error) {
    await swalError(error.message)
  } finally {
    isSubmitting.value = false
  }
}

const openEditModal = (unit) => {
  Object.assign(editForm, {
    code: unit.code,
    nameTh: unit.nameTh,
    nameEn: unit.nameEn || '',
    type: unit.type || '',
    province: unit.province || '',
    district: unit.district || '',
    subDistrict: unit.subDistrict || '',
    address: unit.address || '',
    phone: unit.phone || '',
    status: unit.status || 'Active'
  })
  showEditUnitModal.value = true
}

const handleEditUnit = async () => {
  isSubmitting.value = true

  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE}/api/service-units/${editForm.code}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        nameTh: editForm.nameTh,
        type: editForm.type,
        province: editForm.province,
        district: editForm.district,
        subDistrict: editForm.subDistrict,
        address: editForm.address,
        phone: editForm.phone,
        status: editForm.status
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล')
    }

    // อัปเดต local array โดยหา item จาก code ไม่ใช่ index
    const idx = serviceUnits.value.findIndex(u => u.code === editForm.code)
    if (idx !== -1) {
      serviceUnits.value[idx] = {
        ...serviceUnits.value[idx],
        nameTh: editForm.nameTh,
        type: editForm.type,
        icon: iconMap[editForm.type] || 'domain',
        province: editForm.province,
        district: editForm.district,
        subDistrict: editForm.subDistrict,
        address: editForm.address,
        phone: editForm.phone,
        status: editForm.status
      }
    }

    closeEditModal()
    await swalSuccess('แก้ไขสำเร็จ!', `อัปเดตข้อมูล "${editForm.nameTh}" เรียบร้อยแล้ว`)

  } catch (error) {
    await swalError(error.message)
  } finally {
    isSubmitting.value = false
  }
}

const fetchServiceUnits = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE}/api/service-units`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('ไม่สามารถดึงข้อมูลหน่วยบริการได้')
    }

    const data = await response.json()

    serviceUnits.value = data.map(unit => ({
      ...unit,
      icon: iconMap[unit.type] || 'domain'
    }))

  } catch (error) {
    console.error('Fetch error:', error)
    await swalError('ไม่สามารถเชื่อมต่อฐานข้อมูลเพื่อดึงข้อมูลได้')
  }
}

const handleDeleteUnit = async (unit) => {
  const result = await swalConfirmDelete(unit.nameTh)
  
  if (result.isConfirmed) {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/service-units/${unit.code}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการลบข้อมูล')
      }

      // ลบโดยหาจาก code ไม่ใช่ index
      const idx = serviceUnits.value.findIndex(u => u.code === unit.code)
      if (idx !== -1) serviceUnits.value.splice(idx, 1)
      await swalSuccess('ลบสำเร็จ!', `"${unit.nameTh}" ถูกลบออกจากระบบแล้ว`)

    } catch (error) {
      console.error('Error deleting unit:', error)
      await swalError(error.message)
    }
  }
}

onMounted(() => {
  fetchServiceUnits()
})
</script>

<style scoped>
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
</style>