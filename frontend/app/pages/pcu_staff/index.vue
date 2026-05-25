<template>
  <NuxtLayout name="dashboard">
    <div class="p-4 sm:p-6 md:px-8 md:pt-6 md:pb-8">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start md:items-end gap-4 mb-8">
          <div>
            <h1 class="text-xl md:text-2xl font-bold text-[#1a2b3c] mb-1">รายชื่อผู้ป่วยที่ต้องเยี่ยมบ้าน</h1>
            <p class="text-slate-500 text-sm">ประจำเขตพื้นที่รับผิดชอบ - หมู่ที่ 4 ต.เมือง</p>
          </div>
        </div>

        <!-- นัดที่ตกหล่น (Overdue) -->
        <div v-if="missedAppointments.length > 0" class="mb-6 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 via-white to-rose-50 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-rose-100 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <span class="material-symbols-outlined">event_busy</span>
              </div>
              <div>
                <h2 class="text-base font-bold text-rose-800">นัดที่ตกหล่น (ขาดนัด)</h2>
                <p class="text-sm text-rose-500">ผู้ป่วยที่ไม่มาตามนัดหมายในอดีต (กรุณาติดตามด่วน)</p>
              </div>
            </div>
            <div class="text-sm text-rose-500">
              <span class="font-semibold text-rose-700">{{ missedAppointments.length }}</span> รายการ
            </div>
          </div>

          <div class="divide-y divide-rose-100">
            <div
              v-for="appointment in missedAppointments"
              :key="appointment.id"
              class="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold">
                    <span class="material-symbols-outlined text-[14px]">calendar_today</span>
                    {{ formatDate(appointment.appointment_date) }}
                  </span>
                  <span class="font-mono text-rose-600 font-bold underline">ขาดนัด</span>
                  <span class="font-mono ml-2">HN: {{ appointment.hn }}</span>
                </div>
                <div class="text-sm font-bold text-slate-800">{{ appointment.nameTh }}</div>
                <div class="text-sm text-slate-500 line-clamp-1">{{ appointment.reason || 'ไม่มีรายละเอียดเพิ่มเติม' }}</div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <button
                  @click="openFollowUpModalFromAppointment(appointment)"
                  class="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors shadow-sm"
                >
                  ติดตามผู้ป่วย
                </button>
                <button
                  @click="openAppointmentModalFromToday(appointment)"
                  class="px-4 py-2 rounded-lg border border-rose-300 text-rose-700 text-sm font-medium hover:bg-rose-50 transition-colors"
                >
                  เลื่อนนัด
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="mb-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-amber-100 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <span class="material-symbols-outlined">calendar_clock</span>
              </div>
              <div>
                <h2 class="text-base font-bold text-slate-800">นัดวันนี้</h2>
                <p class="text-sm text-slate-500">ผู้ป่วยที่ถึงวันนัดและพร้อมบันทึกผลการติดตาม</p>
              </div>
            </div>
            <div class="text-sm text-slate-500">
              <span class="font-semibold text-slate-700">{{ todayAppointments.length }}</span> รายการ
            </div>
          </div>

          <div v-if="loadingTodayAppointments" class="px-5 py-8 text-sm text-slate-500 flex items-center gap-3">
            <div class="w-5 h-5 rounded-full border-2 border-amber-200 border-t-amber-500 animate-spin"></div>
            กำลังโหลดนัดวันนี้...
          </div>

          <div v-else-if="todayAppointments.length === 0" class="px-5 py-8 text-sm text-slate-500">
            วันนี้ยังไม่มีนัดหมายที่รอดำเนินการ
          </div>

          <div v-else class="divide-y divide-amber-100">
            <div
              v-for="appointment in todayAppointments"
              :key="appointment.id"
              class="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-amber-200 text-amber-700 text-xs font-semibold">
                    <span class="material-symbols-outlined text-[14px]">schedule</span>
                    {{ formatTimeOnly(appointment.appointment_time) || '08:00' }} น.
                  </span>
                  <span class="font-mono">HN: {{ appointment.hn }}</span>
                </div>
                <div class="text-sm font-bold text-slate-800">{{ appointment.nameTh }}</div>
                <div class="text-sm text-slate-500 line-clamp-1">{{ appointment.reason || 'ไม่มีรายละเอียดเพิ่มเติม' }}</div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <button
                  @click="openFollowUpModalFromAppointment(appointment)"
                  class="px-4 py-2 rounded-lg bg-[#00685f] text-white text-sm font-medium hover:bg-[#005049] transition-colors"
                >
                  บันทึกผลการติดตาม
                </button>
                <button
                  @click="openAppointmentModalFromToday(appointment)"
                  class="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-white transition-colors"
                >
                  ดู/แก้นัด
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white p-4 rounded-t-xl border border-slate-200 flex flex-wrap justify-between items-center gap-4 border-b-0">
          <div class="flex gap-4 flex-wrap">
            <div class="relative min-w-[180px]">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">event_note</span>
              <select v-model="appointmentDueFilter" class="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#00685f] text-sm text-slate-700">
                <option value="">กำหนดการนัดหมาย (ทั้งหมด)</option>
                <option value="1day">นัดใน 1 วัน</option>
                <option value="1week">นัดใน 1 สัปดาห์</option>
                <option value="1month">นัดใน 1 เดือน</option>
              </select>
              <span class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
            </div>

            <div class="relative min-w-[180px]">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">coronavirus</span>
              <select v-model="selectedDisease" class="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#00685f] text-sm text-slate-700">
                <option value="">กลุ่มโรค (ทั้งหมด)</option>
                <option v-for="d in diseases" :key="d.id" :value="d.name">{{ d.name }}</option>
              </select>
              <span class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
            </div>
            
            <div class="relative min-w-[180px]">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">info</span>
              <select v-model="selectedStatus" class="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#00685f] text-sm text-slate-700">
                <option value="">สถานะความเสี่ยง (ทั้งหมด)</option>
                <option value="ปกติ">ปกติ</option>
                <option value="ต้องติดตาม">ต้องติดตาม</option>
                <option value="วิกฤต">วิกฤต</option>
                <option value="รอการบันทึก">รอการบันทึก</option>
              </select>
              <span class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
            </div>
          </div>
          
          <div class="flex gap-2">
            <button 
              @click="triggerManualCheck"
              class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-slate-200"
              title="ตรวจสอบนัดหมายขาดส่งทันที"
            >
              <span class="material-symbols-outlined text-[20px]">sync</span>
              ตรวจสอบขาดนัด
            </button>
            <button class="w-10 h-10 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
              <span class="material-symbols-outlined">filter_list</span>
            </button>
            <button class="w-10 h-10 flex items-center justify-center rounded-md bg-[#00685f] text-white shadow-sm hover:bg-[#005049] transition-colors">
              <span class="material-symbols-outlined">view_list</span>
            </button>
            <button class="w-10 h-10 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
              <span class="material-symbols-outlined">grid_view</span>
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-b-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm whitespace-nowrap">
              <thead class="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th class="py-3 px-4 pl-6">HN</th>
                  <th class="py-3 px-4">ชื่อ - นามสกุล (อายุ)</th>
                  <th class="py-3 px-4">กลุ่มโรค</th>
                  <th class="py-3 px-4">กำหนดการเยี่ยม</th>
                  <th class="py-3 px-4 text-center">ความเสี่ยง</th>
                  <th class="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr v-for="(patient, index) in filteredPatients" :key="index" class="hover:bg-slate-50/50 transition-colors group bg-white">
                  <td class="py-4 px-4 pl-6 font-mono font-medium text-slate-600">
                    <div class="flex items-center gap-2">
                      <span v-if="patient.isNew" class="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" title="เคสใหม่"></span>
                      {{ patient.hn }}
                    </div>
                  </td>
                  <td class="py-4 px-4">
                    <div class="font-medium text-slate-800">{{ patient.nameTh }} ({{ patient.age }})</div>
                    <div v-if="patient.isNew && patient.referralReason" class="text-[10px] text-blue-600 mt-0.5 italic line-clamp-1" :title="patient.referralReason">
                      หมายเหตุส่งตัว: {{ patient.referralReason }}
                    </div>
                  </td>
                  <td class="py-4 px-4">
                    <div class="flex flex-col gap-1">
                      <span class="font-medium text-slate-700">{{ patient.diseaseTh }}</span>
                    </div>
                  </td>
                  <td class="py-4 px-4">
                    <span :class="patient.isNew ? 'text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100' : 'text-slate-600'">
                      {{ patient.visitDate }}
                    </span>
                  </td>
                  <td class="py-4 px-4 text-center">
                    <span 
                      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      :class="patient.riskColor"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" :class="patient.riskDot"></span>
                      {{ patient.riskStatus }}
                    </span>
                  </td>
                  <td class="py-4 px-4 text-center">
                    <div class="flex items-center justify-center gap-2 text-sm font-medium">
                      <button @click="openFollowUpModal(patient)" class="text-[#00685f] hover:text-[#005049] transition-colors" title="บันทึกผล">
                        บันทึกผล
                      </button>
                      <span class="text-slate-300">|</span>
                      <button @click="openHistoryModal(patient)" class="text-slate-500 hover:text-slate-700 transition-colors" title="ดูประวัติ">
                        ประวัติ
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div class="text-sm text-slate-500">
              Showing 1 to {{ filteredPatients.length }} of {{ filteredPatients.length }} entries
            </div>
            <div class="flex items-center gap-1 font-medium">
              <button class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 transition-colors disabled:opacity-50" disabled>
                <span class="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button class="w-8 h-8 flex items-center justify-center rounded bg-[#00685f] text-white">1</button>
              <button class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 transition-colors">2</button>
              <button class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 transition-colors">3</button>
              <span class="px-1 text-slate-400">...</span>
              <button class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 transition-colors">
                <span class="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Floating Action Button (+) -->
        <button 
          @click="showAddPatientModal = true" 
          class="fixed bottom-10 right-10 w-14 h-14 bg-[#60a5fa] hover:bg-blue-500 text-white rounded-2xl shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-40"
        >
          <span class="material-symbols-outlined text-[32px]">add</span>
        </button>



    <!-- Modal เพิ่มผู้ป่วยใหม่ -->
    <div v-if="showAddPatientModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-[#00685f]/10 rounded-lg flex items-center justify-center">
              <span class="material-symbols-outlined text-[#00685f] text-[22px]">person_add</span>
            </div>
            <h2 class="text-xl font-bold text-slate-800">ลงทะเบียนผู้ป่วยใหม่ (รพ.สต.)</h2>
          </div>
          <button @click="showAddPatientModal = false" class="text-slate-400 hover:text-slate-600 transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-8 bg-slate-50/50">
          
          <!-- Section 1: ข้อมูลส่วนตัว -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-[#00685f] border-b border-slate-200 pb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">badge</span>
              ข้อมูลส่วนบุคคล
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">เลขประจำตัวประชาชน <span class="text-rose-500">*</span></label>
                <input v-model="form.idCard" type="text" placeholder="x-xxxx-xxxxx-xx-x" class="input-style" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">HN (ออกโดยระบบอัตโนมัติ)</label>
                <input type="text" placeholder="ระบบจะออกเลขให้หลังบันทึก" class="input-style bg-slate-100 cursor-not-allowed" disabled />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div class="md:col-span-3 space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">คำนำหน้า</label>
                <select v-model="form.prefix" class="input-style">
                  <option value="">เลือก</option>
                  <option>ด.ช.</option>
                  <option>ด.ญ.</option>
                  <option>นาย</option>
                  <option>นาง</option>
                  <option>นางสาว</option>
                </select>
              </div>
              <div class="md:col-span-4 space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">ชื่อ <span class="text-rose-500">*</span></label>
                <input v-model="form.firstName" type="text" placeholder="ชื่อจริง" class="input-style" />
              </div>
              <div class="md:col-span-5 space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">นามสกุล <span class="text-rose-500">*</span></label>
                <input v-model="form.lastName" type="text" placeholder="นามสกุล" class="input-style" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">เพศ</label>
                <select v-model="form.gender" class="input-style">
                  <option value="">เลือกเพศ</option>
                  <option>ชาย</option>
                  <option>หญิง</option>
                  <option>อื่นๆ</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">วันเกิด</label>
                <input v-model="form.birthDate" type="date" class="input-style" />
              </div>
            </div>
          </div>

          <!-- Section 2: ข้อมูลการติดต่อ -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-[#00685f] border-b border-slate-200 pb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">contact_phone</span>
              ข้อมูลการติดต่อและที่อยู่
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">เบอร์โทรศัพท์ <span class="text-rose-500">*</span></label>
                <input v-model="form.phone" type="text" placeholder="08x-xxx-xxxx" class="input-style" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">อีเมล (สำหรับแจ้งเตือน) <span class="text-xs text-slate-400 font-normal">(ถ้ามี)</span></label>
                <input v-model="form.email" type="email" placeholder="example@email.com" class="input-style" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">ที่อยู่ปัจจุบัน</label>
              <textarea v-model="form.address" rows="2" placeholder="บ้านเลขที่, หมู่, ซอย, ถนน" class="input-style"></textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">จังหวัด</label>
                <select v-model="form.province" class="input-style">
                  <option value="">เลือกจังหวัด</option>
                  <option>กรุงเทพมหานคร</option>
                  <option>เชียงใหม่</option>
                  <option>ขอนแก่น</option>
                  <option>สงขลา</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">อำเภอ/เขต</label>
                <select v-model="form.district" class="input-style">
                  <option value="">เลือกอำเภอ/เขต</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">ตำบล/แขวง</label>
                <select v-model="form.subDistrict" class="input-style">
                  <option value="">เลือกตำบล/แขวง</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">รหัสไปรษณีย์</label>
                <input v-model="form.zipcode" type="text" placeholder="รหัสไปรษณีย์" class="input-style" />
              </div>
            </div>
          </div>

          <!-- Section 3: ข้อมูลฉุกเฉินและการเข้ารับบริการ -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-[#00685f] border-b border-slate-200 pb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">emergency</span>
              ข้อมูลฉุกเฉินและการเข้ารับบริการ
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">ชื่อผู้ติดต่อฉุกเฉิน</label>
                <input v-model="form.emergencyName" type="text" placeholder="ชื่อ-นามสกุล" class="input-style" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">เบอร์โทรศัพท์ฉุกเฉิน</label>
                <input v-model="form.emergencyPhone" type="text" placeholder="เบอร์โทรศัพท์" class="input-style" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">หน่วยงานที่เข้ารับบริการ</label>
                <select v-model="form.unit" class="input-style">
                  <option value="">เลือกหน่วยบริการ</option>
                  <option>แผนกอายุรกรรม</option>
                  <option>แผนกศัลยกรรม</option>
                  <option>แผนกกุมารเวชกรรม</option>
                </select>
              </div>
              <div class="space-y-3">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider block">สถานะผู้ป่วย</label>
                <div class="flex flex-wrap gap-3">
                  <label class="flex items-center gap-1.5 cursor-pointer bg-white px-3 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-sm">
                    <input type="radio" v-model="form.status" value="Active" class="w-3.5 h-3.5 text-[#00685f] focus:ring-[#00685f]" />
                    <span class="text-xs font-medium text-slate-700 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active</span>
                  </label>
                  <label class="flex items-center gap-1.5 cursor-pointer bg-white px-3 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-sm">
                    <input type="radio" v-model="form.status" value="Inactive" class="w-3.5 h-3.5 text-[#00685f] focus:ring-[#00685f]" />
                    <span class="text-xs font-medium text-slate-700 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Inactive</span>
                  </label>
                  <label class="flex items-center gap-1.5 cursor-pointer bg-white px-3 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-sm">
                    <input type="radio" v-model="form.status" value="Deceased" class="w-3.5 h-3.5 text-[#00685f] focus:ring-[#00685f]" />
                    <span class="text-xs font-medium text-slate-700 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Deceased</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button @click="showAddPatientModal = false" class="px-6 py-2 rounded-lg border border-slate-300 text-slate-600 font-medium hover:bg-slate-100 transition-colors">
            ยกเลิก
          </button>
          <button @click="handleSave" class="px-6 py-2 rounded-lg bg-[#00685f] text-white font-medium hover:bg-[#005049] transition-colors shadow-sm">
            บันทึกข้อมูล
          </button>
        </div>
      </div>
    </div>

    <!-- Modal สร้างการนัดหมาย -->
    <div v-if="showAppointmentModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        
        <div class="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-[#00685f]/10 rounded-lg flex items-center justify-center text-[#00685f] shrink-0">
              <span class="material-symbols-outlined text-[22px]">calendar_add_on</span>
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-800">สร้างการนัดหมาย</h2>
              <p class="text-sm text-slate-500 mt-0.5">บันทึกข้อมูลการนัดหมายผู้ป่วยเข้าสู่ระบบ</p>
            </div>
          </div>
          <button @click="showAppointmentModal = false" class="text-slate-400 hover:text-slate-600 transition-colors mt-1">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-6">
          
          <div class="flex items-center gap-4 p-4 border border-slate-200 rounded-lg bg-slate-50/50">
            <div class="w-12 h-12 bg-blue-100/50 rounded-full flex items-center justify-center text-[#006399] shrink-0">
              <span class="material-symbols-outlined text-[24px]">patient_list</span>
            </div>
            <div>
              <p class="text-xs text-slate-500 font-medium">ผู้ป่วย</p>
              <p class="text-sm font-bold text-slate-800 mt-0.5">
                {{ appointmentPatientInfo.name }} <span class="text-slate-500 font-normal ml-1 text-xs">(HN: {{ appointmentPatientInfo.hn }})</span>
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-700">วันที่นัด <span class="text-rose-500">*</span></label>
              <input v-model="appointmentForm.date" type="date" class="input-style" />
            </div>
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-700">เวลาเริ่ม <span class="text-rose-500">*</span></label>
              <input v-model="appointmentForm.startTime" type="time" class="input-style" />
            </div>
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-700">เวลาจบ</label>
              <input v-model="appointmentForm.endTime" type="time" class="input-style" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-700">ประเภทการนัด <span class="text-rose-500">*</span></label>
              <select v-model="appointmentForm.type" class="input-style">
                <option value="">เลือกประเภท...</option>
                <option value="followup">ติดตามอาการ</option>
                <option value="consult">ปรึกษาแพทย์</option>
                <option value="checkup">ตรวจสุขภาพ</option>
              </select>
            </div>
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-slate-700">หน่วยบริการที่รับผิดชอบ <span class="text-rose-500">*</span></label>
              <select v-model="appointmentForm.unit" class="input-style">
                <option value="">เลือกหน่วยบริการ...</option>
                <option value="med">อายุรกรรม</option>
                <option value="surg">ศัลยกรรม</option>
              </select>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-700">เจ้าหน้าที่ผู้นัดหมาย</label>
            <input 
              type="text" 
              :value="officerName" 
              readonly 
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none cursor-not-allowed"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium text-slate-700">รายละเอียดเพิ่มเติม</label>
            <textarea 
              v-model="appointmentForm.notes" 
              rows="3" 
              placeholder="ระบุอาการเบื้องต้น หรือสิ่งที่ต้องเตรียมมา..." 
              class="input-style resize-none"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-lg">
            <div>
              <p class="text-xs text-slate-500 mb-1.5">สถานะการนัดหมาย</p>
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-100 text-xs font-medium">
                <span class="material-symbols-outlined text-[14px]">pending_actions</span>
                Pending
              </span>
            </div>
            <div>
              <p class="text-xs text-slate-500 mb-1">วันที่สร้างรายการ</p>
              <p class="text-sm text-slate-700 font-medium">{{ currentDate }}</p>
            </div>
          </div>

        </div>

        <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
          <button 
            @click="showAppointmentModal = false" 
            class="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            ยกเลิก
          </button>
            <button 
              @click="saveAppointment" 
            class="px-5 py-2.5 rounded-lg bg-[#00685f] text-white text-sm font-medium hover:bg-[#005049] transition-colors flex items-center gap-2 shadow-sm"
          >
            <span class="material-symbols-outlined text-[18px]">save</span>
            บันทึก
          </button>
        </div>

      </div>
    </div>

    <!-- Modal บันทึกผลการติดตาม -->
    <div v-if="showFollowUpModal" class="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#0b1c30]/40 backdrop-blur-sm">
      <!-- Follow-up Form Modal -->
      <div class="bg-surface-container-lowest w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-outline-variant flex flex-col">
        <!-- Modal Header -->
        <div class="p-6 md:p-8 border-b border-outline-variant flex justify-between items-center sticky top-0 bg-surface-container-lowest z-10">
          <div class="flex items-center gap-4">
            <span class="material-symbols-outlined text-primary text-4xl">history_edu</span>
            <h3 class="font-headline-md text-headline-md text-on-surface">บันทึกผลการติดตาม</h3>
          </div>
          <button @click="showFollowUpModal = false" class="text-on-surface-variant hover:bg-surface-container-high rounded-full p-2 transition-all">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <!-- Modal Body Form -->
        <div class="p-6 md:p-8 space-y-8">
          <!-- Header Information Section -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-2">
              <label class="font-label-md text-on-surface-variant">ผู้ป่วย :</label>
              <div class="bg-surface-container-low px-4 py-2 rounded-lg font-body-md text-on-surface border border-outline-variant">{{ followUpForm.patientName }}</div>
            </div>
            <div class="space-y-2">
              <label class="font-label-md text-on-surface-variant">วันที่ติดตามจริง :</label>
              <input v-model="followUpForm.followUpDate" class="w-full bg-surface-container-lowest border border-outline rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none" type="date"/>
            </div>
            <div class="space-y-2">
              <label class="font-label-md text-on-surface-variant">เจ้าหน้าที่ผู้บันทึก :</label>
              <div class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2 font-body-md text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[20px]">person_check</span>
                {{ officerName }}
              </div>
              <p class="text-[10px] text-on-surface-variant italic mt-1">* ระบบบันทึกชื่อคุณเป็นผู้ติดตามให้อัตโนมัติ</p>
            </div>
            <div class="space-y-2">
              <label class="font-label-md text-on-surface-variant">สถานที่ติดตาม :</label>
              <div class="flex flex-wrap gap-6 py-2">
                <label class="flex items-center gap-2 cursor-pointer group">
                  <input v-model="followUpForm.location" value="บ้านผู้ป่วย" class="text-primary focus:ring-primary w-5 h-5" type="radio"/>
                  <span class="font-body-md group-hover:text-primary transition-colors">บ้านผู้ป่วย</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer group">
                  <input v-model="followUpForm.location" value="รพ.สต." class="text-primary focus:ring-primary w-5 h-5" type="radio"/>
                  <span class="font-body-md group-hover:text-primary transition-colors">รพ.สต.</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer group">
                  <input v-model="followUpForm.location" value="โทรศัพท์" class="text-primary focus:ring-primary w-5 h-5" type="radio"/>
                  <span class="font-body-md group-hover:text-primary transition-colors">โทรศัพท์</span>
                </label>
              </div>
            </div>
          </div>
          <!-- Vital Signs Card Section -->
          <div class="bg-surface-container-low p-6 md:p-8 rounded-xl border border-outline-variant space-y-6">
            <div class="flex items-center gap-2 border-b border-outline-variant pb-2">
              <span class="material-symbols-outlined text-primary">vital_signs</span>
              <h4 class="font-title-lg text-title-lg text-primary">สัญญาณชีพ (Vital Signs)</h4>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div class="space-y-2">
                <label class="font-label-md text-on-surface-variant">ความดันโลหิต (BP):</label>
                <div class="flex items-center gap-2">
                  <input v-model="followUpForm.bpSys" class="w-20 bg-white border border-outline rounded-lg px-2 py-2 text-center focus:ring-primary focus:outline-none" placeholder="SYS" type="text"/>
                  <span class="text-outline">/</span>
                  <input v-model="followUpForm.bpDia" class="w-20 bg-white border border-outline rounded-lg px-2 py-2 text-center focus:ring-primary focus:outline-none" placeholder="DIA" type="text"/>
                  <span class="text-label-sm text-outline ml-1">mmHg</span>
                </div>
              </div>
              <div class="space-y-2">
                <label class="font-label-md text-on-surface-variant">ระดับน้ำตาล (Sugar):</label>
                <div class="flex items-center gap-2">
                  <input v-model="followUpForm.sugar" class="w-full bg-white border border-outline rounded-lg px-4 py-2 focus:ring-primary focus:outline-none" type="text"/>
                  <span class="text-label-sm text-outline ml-1 shrink-0">mg/dL</span>
                </div>
              </div>
              <div class="space-y-2">
                <label class="font-label-md text-on-surface-variant">น้ำหนัก:</label>
                <div class="flex items-center gap-2">
                  <input v-model="followUpForm.weight" class="w-full bg-white border border-outline rounded-lg px-4 py-2 focus:ring-primary focus:outline-none" type="text"/>
                  <span class="text-label-sm text-outline ml-1 shrink-0">kg</span>
                </div>
              </div>
            </div>
          </div>
          <!-- Clinical Notes -->
          <div class="space-y-8">
            <div class="space-y-2">
              <label class="font-label-md text-on-surface-variant">อาการโดยรวม:</label>
              <textarea v-model="followUpForm.symptoms" class="w-full bg-surface-container-lowest border border-outline rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none resize-none" placeholder="ระบุอาการปัจจุบันของผู้ป่วย" rows="2"></textarea>
            </div>
            <div class="space-y-2">
              <label class="font-label-md text-on-surface-variant">ปัญหาที่พบ:</label>
              <textarea v-model="followUpForm.problems" class="w-full bg-surface-container-lowest border border-outline rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none resize-none" placeholder="ระบุอุปสรรคหรือปัญหาในการรักษา" rows="2"></textarea>
            </div>
            <div class="space-y-2">
              <label class="font-label-md text-on-surface-variant">คำแนะนำที่ให้:</label>
              <textarea v-model="followUpForm.advice" class="w-full bg-surface-container-lowest border border-outline rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none resize-none" placeholder="คำแนะนำการปฏิบัติตัว" rows="2"></textarea>
            </div>
          </div>
          <div class="space-y-4 bg-surface-container-low p-6 rounded-xl border border-outline-variant">
            <div class="flex items-center gap-2 border-b border-outline-variant pb-2">
              <span class="material-symbols-outlined text-primary">assessment</span>
              <h4 class="font-title-lg text-title-lg text-primary">การประเมินความเสี่ยง (Risk Assessment)</h4>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label class="relative flex flex-col p-4 bg-white border rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors group" :class="followUpForm.health_status === 'normal' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-outline-variant'">
                <input type="radio" v-model="followUpForm.health_status" value="normal" class="sr-only" />
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-bold text-emerald-700">ปกติ (Normal)</span>
                  <span v-if="followUpForm.health_status === 'normal'" class="material-symbols-outlined text-emerald-600 text-sm">check_circle</span>
                </div>
                <p class="text-[10px] text-slate-500">อาการคงที่ หรือทุเลาลง</p>
              </label>

              <label class="relative flex flex-col p-4 bg-white border rounded-xl cursor-pointer hover:bg-amber-50 transition-colors group" :class="followUpForm.health_status === 'warning' ? 'border-amber-500 ring-1 ring-amber-500' : 'border-outline-variant'">
                <input type="radio" v-model="followUpForm.health_status" value="warning" class="sr-only" />
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-bold text-amber-700">ต้องติดตาม (Warning)</span>
                  <span v-if="followUpForm.health_status === 'warning'" class="material-symbols-outlined text-amber-600 text-sm">priority_high</span>
                </div>
                <p class="text-[10px] text-slate-500">ควรติดตามอย่างใกล้ชิด</p>
              </label>

              <label class="relative flex flex-col p-4 bg-white border rounded-xl cursor-pointer hover:bg-rose-50 transition-colors group" :class="followUpForm.health_status === 'critical' ? 'border-rose-500 ring-1 ring-rose-500' : 'border-outline-variant'">
                <input type="radio" v-model="followUpForm.health_status" value="critical" class="sr-only" />
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-bold text-rose-700">วิกฤต (Critical)</span>
                  <span v-if="followUpForm.health_status === 'critical'" class="material-symbols-outlined text-rose-600 text-sm">emergency</span>
                </div>
                <p class="text-[10px] text-slate-500 font-medium">ส่งตัวต่อโรงพยาบาลใหญ่</p>
              </label>
            </div>
            <div v-if="followUpForm.health_status !== suggestHealthStatus" class="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs italic">
              <span class="material-symbols-outlined text-sm">info</span>
              ค่าสัญญาณชีพบ่งชี้ว่าควรเป็นสถานะ: {{ suggestHealthStatus === 'critical' ? 'วิกฤต' : suggestHealthStatus === 'warning' ? 'ต้องติดตาม' : 'ปกติ' }}
            </div>
          </div>

          <!-- Attachments and Scheduling -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div class="space-y-2">
              <label class="font-label-md text-on-surface-variant flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">photo_camera</span> แนบรูปภาพประกอบ :
              </label>
              <!-- Hidden File Input -->
              <input 
                type="file" 
                ref="fileInput" 
                class="hidden" 
                @change="handleFileChange" 
                accept="image/*" 
                multiple 
              />
              <!-- Upload Dropzone Box -->
              <div 
                @click="triggerFileInput"
                @dragover.prevent="dragOver = true"
                @dragleave="dragOver = false"
                @drop.prevent="handleFileDrop"
                class="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer group"
                :class="dragOver ? 'border-[#00685f] bg-[#00685f]/5' : 'border-outline-variant hover:bg-surface-container hover:border-primary'"
              >
                <span class="material-symbols-outlined text-outline group-hover:text-primary mb-2 text-4xl" :class="dragOver ? 'text-[#00685f]' : ''">cloud_upload</span>
                <p class="text-sm font-semibold text-on-surface-variant group-hover:text-primary" :class="dragOver ? 'text-[#00685f]' : ''">คลิกหรือลากไฟล์รูปภาพมาที่นี่</p>
                <p class="text-[11px] text-outline mt-1">รองรับไฟล์ .JPG, .PNG ขนาดไม่เกิน 5MB (สูงสุด 5 รูป)</p>
              </div>

              <!-- File Previews Grid -->
              <div v-if="filePreviews.length > 0" class="grid grid-cols-3 gap-3 mt-3 animate-fade-in">
                <div 
                  v-for="(url, index) in filePreviews" 
                  :key="index"
                  class="relative aspect-square rounded-lg border border-slate-200 overflow-hidden group shadow-sm"
                >
                  <img :src="url" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  <button 
                    type="button" 
                    @click.stop="removeSelectedFile(index)"
                    class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors flex items-center justify-center cursor-pointer shadow"
                  >
                    <span class="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              </div>
            </div>
            <div class="space-y-6">
              <div class="space-y-2">
                <label class="font-label-md text-on-surface-variant">ต้องติดตามซ้ำหรือไม่:</label>
                <label class="flex items-center gap-2 cursor-pointer group py-1">
                  <input v-model="followUpForm.needFollowUp" class="text-primary focus:ring-primary rounded w-6 h-6 border-outline" type="checkbox"/>
                  <span class="font-body-md font-bold text-on-surface group-hover:text-primary">ต้องการนัดติดตามซ้ำ</span>
                </label>
              </div>
              <div v-if="followUpForm.needFollowUp" class="space-y-2 animate-fade-in">
                <label class="font-label-md text-on-surface-variant flex items-center gap-2">
                  <span class="material-symbols-outlined text-sm">event</span> วันที่นัดหมายครั้งถัดไป :
                </label>
                <input v-model="followUpForm.nextAppointment" class="w-full bg-surface-container-lowest border border-outline rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none" type="date"/>
              </div>
            </div>
          </div>
        </div>
        <!-- Modal Footer Actions -->
        <div class="p-6 md:p-8 bg-surface-container-low flex justify-end gap-4 border-t border-outline-variant">
          <button @click="showFollowUpModal = false" class="px-8 py-2 rounded-lg font-label-md font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors border border-outline-variant bg-white">
            ยกเลิก
          </button>
          <button @click="submitFollowUpForm" class="px-8 py-2 rounded-lg font-label-md font-bold bg-primary text-on-primary hover:bg-primary-container shadow-md active:scale-95 transition-all flex items-center gap-2">
            <span class="material-symbols-outlined">save</span> บันทึกข้อมูล
          </button>
        </div>
      </div>
    </div>

    <!-- Modal ประวัติการนัดหมาย -->
    <div v-if="showHistoryModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-purple-100/50 rounded-lg flex items-center justify-center text-purple-600 shrink-0">
              <span class="material-symbols-outlined text-[22px]">history_edu</span>
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-800">ประวัติการติดตามผล / เยี่ยมบ้าน</h2>
              <p class="text-sm text-slate-500 mt-0.5">ผู้ป่วย: {{ historyPatientInfo.name }} <span class="text-xs ml-1">(HN: {{ historyPatientInfo.hn }})</span></p>
            </div>
          </div>
          <button @click="showHistoryModal = false" class="text-slate-400 hover:text-slate-600 transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1 bg-white">
          
          <div v-if="loadingHistory" class="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <div class="w-10 h-10 border-4 border-slate-200 border-t-purple-500 rounded-full animate-spin"></div>
            <p>กำลังโหลดประวัติ...</p>
          </div>

          <div v-else-if="appointments.length === 0" class="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
            <span class="material-symbols-outlined text-6xl">history_toggle_off</span>
            <p>ยังไม่มีประวัติการบันทึกผล</p>
            <button 
              @click="openAppointmentFromHistory" 
              class="px-6 py-2 bg-[#00685f] text-white rounded-lg text-sm font-medium hover:bg-[#005049] transition-all"
            >
              สร้างการนัดหมายใหม่
            </button>
          </div>

          <div v-else class="space-y-4">
            <div class="flex justify-end mb-4">
              <button 
                @click="openAppointmentFromHistory" 
                class="px-4 py-2 bg-[#00685f] text-white rounded-lg text-sm font-medium hover:bg-[#005049] transition-colors flex items-center gap-2 shadow-sm"
              >
                <span class="material-symbols-outlined text-[18px]">add</span>
                สร้างการนัดหมาย
              </button>
            </div>

            <div class="border border-slate-200 rounded-lg overflow-hidden">
              <table class="w-full text-left border-collapse">
                <thead class="bg-slate-50 text-slate-600 text-sm font-medium border-b border-slate-200">
                  <tr>
                    <th class="px-4 py-3 w-32 text-center">วันที่บันทึก</th>
                    <th class="px-4 py-3">ประเภท / สถานที่ / อาการ</th>
                    <th class="px-4 py-3 text-center w-32">นัดครั้งถัดไป</th>
                    <th class="px-4 py-3 text-center">สัญญาณชีพ</th>
                    <th class="px-4 py-3 text-center w-36">สถานะสุขภาพ</th>
                    <th class="px-4 py-3 text-center w-24">จัดการ</th>
                  </tr>
                </thead>
                <tbody class="text-sm divide-y divide-slate-100 text-slate-700">
                  <tr v-for="item in appointments" :key="item.id" class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 py-4 text-center font-medium text-slate-800">
                      {{ item.date }}
                    </td>
                    <td class="px-4 py-4">
                      <div class="flex items-center gap-1.5 mb-1">
                        <span v-if="item.type === 'tracking'" class="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">ติดตามผล</span>
                        <span v-else-if="item.type === 'referral'" class="px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 text-[10px] font-bold border border-purple-100">ส่งตัว</span>
                        <span v-else class="px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 text-[10px] font-bold border border-orange-100">นัดหมาย</span>
                        <span class="text-xs font-bold text-slate-600">{{ item.location }}</span>
                      </div>
                      <div class="text-xs text-slate-500 line-clamp-1 italic">{{ item.symptoms_detail || '-' }}</div>
                    </td>
                    <td class="px-4 py-4 text-center">
                      <div v-if="item.next_appointment_date" class="flex flex-col items-center">
                        <span class="text-[10px] text-primary font-bold">นัดติดตาม</span>
                        <span class="text-xs font-medium text-slate-700">{{ item.next_appointment_date }}</span>
                      </div>
                      <span v-else class="text-xs text-slate-400">-</span>
                    </td>
                    <td class="px-4 py-4">
                      <div class="flex items-center justify-center gap-3 text-[11px]">
                        <div v-if="item.bp_sys && item.bp_dia" class="flex flex-col items-center">
                          <span class="text-slate-400">BP</span>
                          <span class="font-bold text-slate-700">{{ item.bp_sys }}/{{ item.bp_dia }}</span>
                        </div>
                        <div v-if="item.sugar" class="flex flex-col items-center">
                          <span class="text-slate-400">Sugar</span>
                          <span class="font-bold text-slate-700">{{ item.sugar }}</span>
                        </div>
                        <div v-if="item.weight" class="flex flex-col items-center">
                          <span class="text-slate-400">Weight</span>
                          <span class="font-bold text-slate-700">{{ item.weight }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-4 text-center">
                      <span 
                        class="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold w-full max-w-[100px]"
                        :class="item.statusColor"
                      >
                        <span class="w-1.5 h-1.5 rounded-full" :class="item.statusDot"></span>
                        {{ item.status }}
                      </span>
                    </td>
                    <td class="px-4 py-4">
                      <div class="flex items-center justify-center gap-3">
                        <button @click="openDetailModal(item)" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-[#00685f] transition-all" title="ดูรายละเอียด">
                          <span class="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal แก้ไขผู้ป่วย -->
    <div v-if="showEditPatientModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-[#006399]/10 rounded-lg flex items-center justify-center">
              <span class="material-symbols-outlined text-[#006399] text-[22px]">edit</span>
            </div>
            <h2 class="text-xl font-bold text-slate-800">แก้ไขข้อมูลผู้ป่วย</h2>
          </div>
          <button @click="showEditPatientModal = false" class="text-slate-400 hover:text-slate-600 transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-8 bg-slate-50/50">
          
          <!-- Section 1: ข้อมูลส่วนตัว -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-[#006399] border-b border-slate-200 pb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">badge</span>
              ข้อมูลส่วนบุคคล
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">เลขประจำตัวประชาชน <span class="text-rose-500">*</span></label>
                <input v-model="editForm.idCard" type="text" placeholder="x-xxxx-xxxxx-xx-x" class="input-style" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">HN (หมายเลขผู้ป่วย) <span class="text-rose-500">*</span></label>
                <input v-model="editForm.hn" type="text" placeholder="HN Number" class="input-style" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div class="md:col-span-3 space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">คำนำหน้า</label>
                <select v-model="editForm.prefix" class="input-style">
                  <option value="">เลือก</option>
                  <option>ด.ช.</option>
                  <option>ด.ญ.</option>
                  <option>นาย</option>
                  <option>นาง</option>
                  <option>นางสาว</option>
                </select>
              </div>
              <div class="md:col-span-4 space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">ชื่อ <span class="text-rose-500">*</span></label>
                <input v-model="editForm.firstName" type="text" placeholder="ชื่อจริง" class="input-style" />
              </div>
              <div class="md:col-span-5 space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">นามสกุล <span class="text-rose-500">*</span></label>
                <input v-model="editForm.lastName" type="text" placeholder="นามสกุล" class="input-style" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">เพศ</label>
                <select v-model="editForm.gender" class="input-style">
                  <option value="">เลือกเพศ</option>
                  <option>ชาย</option>
                  <option>หญิง</option>
                  <option>อื่นๆ</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">วันเกิด</label>
                <input v-model="editForm.birthDate" type="date" class="input-style" />
              </div>
            </div>
          </div>

          <!-- Section 2: ข้อมูลการติดต่อ -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-[#006399] border-b border-slate-200 pb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">contact_phone</span>
              ข้อมูลการติดต่อและที่อยู่
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">เบอร์โทรศัพท์ <span class="text-rose-500">*</span></label>
                <input v-model="editForm.phone" type="text" placeholder="08x-xxx-xxxx" class="input-style" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">อีเมล (สำหรับแจ้งเตือน) <span class="text-xs text-slate-400 font-normal">(ถ้ามี)</span></label>
                <input v-model="editForm.email" type="email" placeholder="example@email.com" class="input-style" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">ที่อยู่ปัจจุบัน</label>
              <textarea v-model="editForm.address" rows="2" placeholder="บ้านเลขที่, หมู่, ซอย, ถนน" class="input-style"></textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">จังหวัด</label>
                <select v-model="editForm.province" class="input-style">
                  <option value="">เลือกจังหวัด</option>
                  <option>กรุงเทพมหานคร</option>
                  <option>เชียงใหม่</option>
                  <option>ขอนแก่น</option>
                  <option>สงขลา</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">อำเภอ/เขต</label>
                <select v-model="editForm.district" class="input-style">
                  <option value="">เลือกอำเภอ/เขต</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">ตำบล/แขวง</label>
                <select v-model="editForm.subDistrict" class="input-style">
                  <option value="">เลือกตำบล/แขวง</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">รหัสไปรษณีย์</label>
                <input v-model="editForm.zipcode" type="text" placeholder="รหัสไปรษณีย์" class="input-style" />
              </div>
            </div>
          </div>

          <!-- Section 3: ข้อมูลฉุกเฉินและการเข้ารับบริการ -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-[#006399] border-b border-slate-200 pb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">emergency</span>
              ข้อมูลฉุกเฉินและการเข้ารับบริการ
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">ชื่อผู้ติดต่อฉุกเฉิน</label>
                <input v-model="editForm.emergencyName" type="text" placeholder="ชื่อ-นามสกุล" class="input-style" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">เบอร์โทรศัพท์ฉุกเฉิน</label>
                <input v-model="editForm.emergencyPhone" type="text" placeholder="เบอร์โทรศัพท์" class="input-style" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">หน่วยงานที่เข้ารับบริการ</label>
                <select v-model="editForm.unit" class="input-style">
                  <option value="">เลือกหน่วยบริการ</option>
                  <option>แผนกอายุรกรรม</option>
                  <option>แผนกศัลยกรรม</option>
                  <option>แผนกกุมารเวชกรรม</option>
                </select>
              </div>
              <div class="space-y-3">
                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider block">สถานะผู้ป่วย</label>
                <div class="flex flex-wrap gap-3">
                  <label class="flex items-center gap-1.5 cursor-pointer bg-white px-3 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-sm">
                    <input type="radio" v-model="editForm.status" value="Active" class="w-3.5 h-3.5 text-[#006399] focus:ring-[#006399]" />
                    <span class="text-xs font-medium text-slate-700 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active</span>
                  </label>
                  <label class="flex items-center gap-1.5 cursor-pointer bg-white px-3 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-sm">
                    <input type="radio" v-model="editForm.status" value="Inactive" class="w-3.5 h-3.5 text-[#006399] focus:ring-[#006399]" />
                    <span class="text-xs font-medium text-slate-700 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Inactive</span>
                  </label>
                  <label class="flex items-center gap-1.5 cursor-pointer bg-white px-3 py-2 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-sm">
                    <input type="radio" v-model="editForm.status" value="Deceased" class="w-3.5 h-3.5 text-[#006399] focus:ring-[#006399]" />
                    <span class="text-xs font-medium text-slate-700 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Deceased</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
          <button @click="showEditPatientModal = false" class="px-6 py-2 rounded-lg border border-slate-300 text-slate-600 font-medium hover:bg-slate-100 transition-colors">
            ยกเลิก
          </button>
          <button @click="handleUpdatePatient" class="px-6 py-2 rounded-lg bg-[#006399] text-white font-medium hover:bg-blue-800 transition-colors shadow-sm">
            บันทึกการแก้ไข
          </button>
        </div>
      </div>
    </div>

    <!-- Modal ดูรายละเอียด/ผลประเมิน -->
    <div v-if="showDetailModal" class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-teal-100/50 rounded-lg flex items-center justify-center text-[#00685f] shrink-0">
              <span class="material-symbols-outlined text-[22px]">visibility</span>
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-800">รายละเอียดผลประเมิน</h2>
              <p class="text-sm text-slate-500 mt-0.5">วันที่: {{ detailInfo.date }} | HN: {{ historyPatientInfo.hn }}</p>
            </div>
          </div>
          <button @click="showDetailModal = false" class="text-slate-400 hover:text-slate-600 transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-6">
          <div class="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <h3 class="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px] text-[#00685f]">assignment</span>
              ข้อมูลการติดตามพื้นฐาน
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <p class="text-xs text-slate-500 font-medium mb-1">สถานที่ติดตาม</p>
                <p class="text-slate-800 font-semibold">{{ detailInfo.location || '-' }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 font-medium mb-1">เจ้าหน้าที่ผู้บันทึก</p>
                <p class="text-slate-800 font-semibold">{{ detailInfo.officer || '-' }}</p>
              </div>
              <div v-if="detailInfo.bp_sys">
                <p class="text-xs text-slate-500 font-medium mb-1">ความดันโลหิต (BP)</p>
                <p class="text-slate-800 font-semibold text-rose-600">{{ detailInfo.bp_sys }}/{{ detailInfo.bp_dia }} <span class="text-[10px] text-slate-400 font-normal ml-1">mmHg</span></p>
              </div>
              <div v-if="detailInfo.sugar">
                <p class="text-xs text-slate-500 font-medium mb-1">ระดับน้ำตาล</p>
                <p class="text-slate-800 font-semibold text-blue-600">{{ detailInfo.sugar }} <span class="text-[10px] text-slate-400 font-normal ml-1">mg/dL</span></p>
              </div>
              <div v-if="detailInfo.weight">
                <p class="text-xs text-slate-500 font-medium mb-1">น้ำหนัก</p>
                <p class="text-slate-800 font-semibold">{{ detailInfo.weight }} <span class="text-[10px] text-slate-400 font-normal ml-1">kg</span></p>
              </div>
              <div>
                <p class="text-xs text-slate-500 font-medium mb-1">ผลประเมินสุขภาพ</p>
                <span class="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" :class="detailInfo.statusColor">
                  <span class="w-1.5 h-1.5 rounded-full" :class="detailInfo.statusDot"></span>
                  {{ detailInfo.status }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 class="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#00685f]">medical_information</span>
                อาการที่พบ
              </h3>
              <div class="p-3 bg-slate-50 rounded-md text-sm text-slate-700 leading-relaxed border border-slate-100">
                {{ detailInfo.symptoms_detail || 'ไม่มีข้อมูลบันทึก' }}
              </div>
            </div>
            
            <div v-if="detailInfo.problems">
              <h3 class="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#00685f]">error_outline</span>
                ปัญหาที่พบ
              </h3>
              <div class="p-3 bg-red-50/50 rounded-md text-sm text-slate-600 leading-relaxed border border-red-100">
                {{ detailInfo.problems }}
              </div>
            </div>

            <div v-if="detailInfo.advice">
              <h3 class="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#00685f]">psychology_alt</span>
                คำแนะนำที่ให้
              </h3>
              <div class="p-3 bg-blue-50/50 rounded-md text-sm text-slate-600 leading-relaxed border border-blue-100">
                {{ detailInfo.advice }}
              </div>
            </div>

            <!-- รูปภาพแนบประกอบ -->
            <div v-if="detailInfo.type === 'tracking'">
              <h3 class="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#00685f]">photo_library</span>
                รูปภาพประกอบการติดตาม
              </h3>
              
              <div v-if="loadingAttachments" class="flex items-center gap-2 text-xs text-slate-400 py-2">
                <div class="w-4 h-4 border-2 border-slate-200 border-t-[#00685f] rounded-full animate-spin"></div>
                กำลังโหลดรูปภาพแนบ...
              </div>
              
              <div v-else-if="trackingAttachments.length === 0" class="text-xs text-slate-400 italic py-2">
                ไม่มีรูปภาพแนบประกอบสำหรับเคสการติดตามนี้
              </div>
              
              <div v-else class="grid grid-cols-3 gap-3">
                <div 
                  v-for="img in trackingAttachments" 
                  :key="img.id"
                  @click="viewFullscreenImage(img.file_path)"
                  class="relative aspect-square rounded-lg border border-slate-200 overflow-hidden cursor-pointer group shadow-sm hover:border-[#00685f] transition-all duration-200"
                  title="คลิกเพื่อขยายดูรูปภาพ"
                >
                  <img :src="config.public.apiBase + '/' + img.file_path.replace(/\\/g, '/')" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                    <span class="material-symbols-outlined text-white text-xl opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all">zoom_in</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
          <button @click="showDetailModal = false" class="px-6 py-2 rounded-lg border border-slate-300 text-slate-600 font-medium hover:bg-slate-100 transition-colors">
            ปิด
          </button>
        </div>
      </div>
    </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import Swal from 'sweetalert2'

const config = useRuntimeConfig()
const API_BASE = `${config.public.apiBase}/api`
const currentUserId = ref(null)
const currentUnitId = ref(null)
const officerName = ref('')

// Filters
const selectedDisease = ref('')
const selectedStatus = ref('')
const appointmentDueFilter = ref('') // '', '1day', '1week', '1month'
const diseases = ref([])

const fetchDiseases = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/patients/diseases`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      diseases.value = await res.json()
    }
  } catch (err) {
    console.error('Error fetching diseases:', err)
  }
}

const fetchPatients = async () => {
  if (!currentUnitId.value) return
  isLoading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/tracking/pcu/${currentUnitId.value}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (res.ok) {
      patients.value = await res.json()
    }
  } catch (err) {
    console.error('Error fetching patients:', err)
  } finally {
    isLoading.value = false
  }
}

const fetchTodayAppointments = async () => {
  if (!currentUnitId.value) return
  loadingTodayAppointments.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/tracking/pcu/${currentUnitId.value}/today-appointments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (res.ok) {
      todayAppointments.value = await res.json()
    }
  } catch (err) {
    console.error('Error fetching today appointments:', err)
  } finally {
    loadingTodayAppointments.value = false
  }
}

const fetchMissedAppointments = async () => {
  if (!currentUnitId.value) return
  loadingMissedAppointments.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/tracking/pcu/${currentUnitId.value}/missed-appointments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (res.ok) {
      missedAppointments.value = await res.json()
    }
  } catch (err) {
    console.error('Error fetching missed appointments:', err)
  } finally {
    loadingMissedAppointments.value = false
  }
}

onMounted(async () => {
  // ดึงข้อมูลผู้ใช้จาก localStorage
  try {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      currentUserId.value = user.id
      currentUnitId.value = user.service_unit_id
      officerName.value = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    }
  } catch (e) { console.error(e) }

  await fetchPatients()
  await fetchTodayAppointments()
  await fetchMissedAppointments()
  await fetchDiseases()
})

const triggerManualCheck = async () => {
  try {
    const result = await Swal.fire({
      title: 'ตรวจสอบนัดหมาย?',
      text: 'ระบบจะทำการค้นหาและส่งแจ้งเตือนเคสที่ขาดนัดและนัดพรุ่งนี้ทันที',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ตกลง',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#00685f'
    })

    if (result.isConfirmed) {
      Swal.fire({
        title: 'กำลังดำเนินการ...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/notifications/trigger-check`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        await fetchMissedAppointments() // รีเฟรชรายการที่หน้าจอด้วย
        Swal.fire({
          title: 'สำเร็จ!',
          text: `ประมวลผลเสร็จสิ้น: พบเคสขาดนัด ${data.processed_missed} ราย และนัดพรุ่งนี้ ${data.processed_upcoming} ราย`,
          icon: 'success',
          confirmButtonText: 'ตกลง'
        })
      } else {
        throw new Error('ไม่สามารถรันระบบตรวจสอบได้')
      }
    }
  } catch (err) {
    console.error(err)
    Swal.fire('ผิดพลาด', err.message, 'error')
  }
}

const showAppointmentModal = ref(false)
const todayAppointments = ref([])
const missedAppointments = ref([])
const loadingTodayAppointments = ref(false)
const loadingMissedAppointments = ref(false)

const appointmentForm = reactive({
  date: '',
  startTime: '',
  endTime: '',
  type: '',
  unit: '',
  notes: ''
})

const appointmentPatientInfo = ref({
  id: null,
  name: '',
  hn: ''
})

const currentDate = ref(new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()))

const showAddPatientModal = ref(false)

const form = reactive({
  idCard: '',
  hn: '',
  prefix: '',
  firstName: '',
  lastName: '',
  gender: '',
  birthDate: '',
  phone: '',
  email: '',
  address: '',
  province: '',
  district: '',
  subDistrict: '',
  zipcode: '',
  emergencyName: '',
  emergencyPhone: '',
  unit: '',
  status: 'Active'
})

const handleSave = async () => {
  if (!form.firstName || !form.lastName || !form.idCard || !form.phone) {
    return Swal.fire({
      title: 'ข้อมูลไม่ครบถ้วน',
      text: 'กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน',
      icon: 'warning',
      confirmButtonText: 'ตกลง'
    })
  }
  isSubmitting.value = true
  try {
    const token = localStorage.getItem('token')
    const payload = {
      cid: form.idCard,
      first_name: form.firstName,
      last_name: form.lastName,
      date_of_birth: form.birthDate,
      gender: form.gender === 'ชาย' ? 'male' : form.gender === 'หญิง' ? 'female' : 'other',
      phone: form.phone,
      email: form.email,
      address: form.address,
      service_unit_id: null // จะถูก override โดย backend ตามสิทธิ์ผู้ใช้
    }

    const res = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    if (res.ok) {
      if (followUpForm.needFollowUp) {
        await createFollowUpAppointment(token)
      }
      Swal.fire({
        title: 'สำเร็จ!',
        text: `ลงทะเบียนผู้ป่วยสำเร็จ! HN: ${data.hn_number}`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      })
      showAddPatientModal.value = false
      fetchPatients()
    } else {
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: data.message,
        icon: 'error',
        confirmButtonText: 'ตกลง'
      })
    }
  } catch (err) {
    console.error(err)
    Swal.fire({
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถบันทึกข้อมูลได้',
      icon: 'error',
      confirmButtonText: 'ตกลง'
    })
  } finally {
    isSubmitting.value = false
  }
}

const patients = ref([])
const isLoading = ref(false)

const filteredPatients = computed(() => {
  let list = patients.value
  
  if (selectedDisease.value) {
    list = list.filter(p => p.diseaseTh.includes(selectedDisease.value))
  }
  
  if (selectedStatus.value) {
    list = list.filter(p => p.riskStatus === selectedStatus.value)
  }
  
  if (appointmentDueFilter.value) {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    list = list.filter(p => {
      if (!p.nextVisitDate) return false
      const nextDate = new Date(p.nextVisitDate)
      nextDate.setHours(0, 0, 0, 0)
      
      const diffTime = nextDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (appointmentDueFilter.value === '1day') return diffDays >= 0 && diffDays <= 1
      if (appointmentDueFilter.value === '1week') return diffDays >= 0 && diffDays <= 7
      if (appointmentDueFilter.value === '1month') return diffDays >= 0 && diffDays <= 30
      return true
    })
  }
  
  return list
})

const openAppointmentModal = (patient) => {
  appointmentPatientInfo.value = {
    id: patient.id,
    name: patient.nameTh,
    hn: patient.hn
  }
  // Reset form
  appointmentForm.date = ''
  appointmentForm.startTime = ''
  appointmentForm.endTime = ''
  appointmentForm.type = ''
  appointmentForm.unit = ''
  appointmentForm.notes = ''
  showAppointmentModal.value = true
}

const handleSaveAppointment = () => {
  console.log('Saving appointment:', appointmentForm)
  Swal.fire({
    title: 'สำเร็จ!',
    text: 'บันทึกการนัดหมายสำเร็จ!',
    icon: 'success',
    timer: 1500,
    showConfirmButton: false
  })
  showAppointmentModal.value = false
}

const buildAppointmentReason = () => {
  const parts = []
  if (appointmentForm.type) parts.push(`ประเภท: ${appointmentForm.type}`)
  if (appointmentForm.unit) parts.push(`หน่วยงาน: ${appointmentForm.unit}`)
  if (appointmentForm.notes) parts.push(appointmentForm.notes)
  return parts.join(' | ')
}

const saveAppointment = async () => {
  if (!appointmentPatientInfo.value.id) {
    return Swal.fire({
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่พบข้อมูลผู้ป่วยสำหรับการนัดหมาย',
      icon: 'error',
      confirmButtonText: 'ตกลง'
    })
  }

  if (!appointmentForm.date) {
    return Swal.fire({
      title: 'ข้อมูลไม่ครบ',
      text: 'กรุณาระบุวันที่นัดหมาย',
      icon: 'warning',
      confirmButtonText: 'ตกลง'
    })
  }

  if (false && followUpForm.needFollowUp && !followUpForm.nextAppointment) {
    return Swal.fire({
      title: 'ข้อมูลไม่ครบ',
      text: 'กรุณาระบุวันที่นัดหมายครั้งถัดไป',
      icon: 'warning',
      confirmButtonText: 'ตกลง'
    })
  }
  isSubmitting.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/patients/${appointmentPatientInfo.value.id}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        appointment_date: appointmentForm.date,
        appointment_time: appointmentForm.startTime || '08:00',
        reason: buildAppointmentReason(),
        doctor_id: currentUserId.value
      })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'ไม่สามารถบันทึกการนัดหมายได้')

    Swal.fire({
      title: 'สำเร็จ!',
      text: 'บันทึกการนัดหมายสำเร็จ!',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    })
    showAppointmentModal.value = false
    await fetchTodayAppointments()
  } catch (err) {
    console.error(err)
    Swal.fire({
      title: 'เกิดข้อผิดพลาด',
      text: err.message || 'ไม่สามารถบันทึกการนัดหมายได้',
      icon: 'error',
      confirmButtonText: 'ตกลง'
    })
  } finally {
    isSubmitting.value = false
  }
}

// Follow Up Modal
const showFollowUpModal = ref(false)
const followUpForm = reactive({
  patient_id: null,
  appointment_id: null,
  patientName: '',
  followUpDate: '',
  officerName: '',
  location: 'บ้านผู้ป่วย',
  bpSys: '',
  bpDia: '',
  sugar: '',
  weight: '',
  symptoms: '',
  problems: '',
  advice: '',
  health_status: 'normal',
  needFollowUp: false,
  nextAppointment: ''
})

// File handling states & logic
const fileInput = ref(null)
const selectedFiles = ref([])
const filePreviews = ref([])
const dragOver = ref(false)

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileChange = (e) => {
  const files = Array.from(e.target.files || [])
  processFiles(files)
}

const handleFileDrop = (e) => {
  dragOver.value = false
  const files = Array.from(e.dataTransfer.files || [])
  processFiles(files)
}

const processFiles = (files) => {
  if (selectedFiles.value.length + files.length > 5) {
    Swal.fire({
      icon: 'warning',
      title: 'จำนวนรูปภาพเกินกำหนด',
      text: 'คุณสามารถแนบรูปภาพประกอบได้สูงสุด 5 รูปต่อครั้ง',
      confirmButtonColor: '#00685f'
    })
    return
  }

  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'ไฟล์ไม่ถูกต้อง',
        text: `ไฟล์ "${file.name}" ไม่ใช่รูปภาพ`,
        confirmButtonColor: '#00685f'
      })
      continue
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'ไฟล์ขนาดใหญ่เกินกำหนด',
        text: `รูปภาพ "${file.name}" มีขนาดเกิน 5MB`,
        confirmButtonColor: '#00685f'
      })
      continue
    }

    selectedFiles.value.push(file)
    const previewUrl = URL.createObjectURL(file)
    filePreviews.value.push(previewUrl)
  }
}

const removeSelectedFile = (index) => {
  URL.revokeObjectURL(filePreviews.value[index])
  selectedFiles.value.splice(index, 1)
  filePreviews.value.splice(index, 1)
}

const clearSelectedFiles = () => {
  filePreviews.value.forEach(url => URL.revokeObjectURL(url))
  selectedFiles.value = []
  filePreviews.value = []
}

const suggestHealthStatus = computed(() => {
  const sys = parseInt(followUpForm.bpSys)
  const dia = parseInt(followUpForm.bpDia)
  const sugar = parseInt(followUpForm.sugar)
  
  if (sys >= 160 || sys <= 80 || dia >= 100 || (sugar > 0 && (sugar >= 300 || sugar <= 60))) {
    return 'critical'
  }
  if (sys >= 140 || sys <= 90 || dia >= 90 || (sugar > 0 && (sugar >= 180 || sugar <= 70))) {
    return 'warning'
  }
  return 'normal'
})

watch(() => [followUpForm.bpSys, followUpForm.bpDia, followUpForm.sugar], () => {
  followUpForm.health_status = suggestHealthStatus.value
})

const openFollowUpModal = (patient) => {
  clearSelectedFiles()
  followUpForm.patient_id = patient.id
  followUpForm.appointment_id = null
  followUpForm.patientName = patient.nameTh + (patient.hn ? ` (HN: ${patient.hn})` : '')
  followUpForm.followUpDate = new Date().toISOString().split('T')[0]
  followUpForm.officerName = officerName.value
  followUpForm.location = 'บ้านผู้ป่วย'
  followUpForm.bpSys = ''
  followUpForm.bpDia = ''
  followUpForm.sugar = ''
  followUpForm.weight = ''
  followUpForm.symptoms = ''
  followUpForm.problems = ''
  followUpForm.advice = ''
  followUpForm.health_status = 'normal'
  followUpForm.needFollowUp = false
  followUpForm.nextAppointment = ''
  
  showFollowUpModal.value = true
}

const openFollowUpModalFromAppointment = (appointment) => {
  clearSelectedFiles()
  followUpForm.patient_id = appointment.patient_id
  followUpForm.appointment_id = appointment.id
  followUpForm.patientName = appointment.nameTh + (appointment.hn ? ` (HN: ${appointment.hn})` : '')
  followUpForm.followUpDate = new Date().toISOString().split('T')[0]
  followUpForm.officerName = officerName.value
  followUpForm.location = 'บ้านผู้ป่วย'
  followUpForm.bpSys = ''
  followUpForm.bpDia = ''
  followUpForm.sugar = ''
  followUpForm.weight = ''
  followUpForm.symptoms = ''
  followUpForm.problems = ''
  followUpForm.advice = ''
  followUpForm.health_status = 'normal'
  followUpForm.needFollowUp = false
  followUpForm.nextAppointment = ''
  showFollowUpModal.value = true
}

const isSubmitting = ref(false)

const createFollowUpAppointment = async (token) => {
  const reason = ['ประเภท: followup', followUpForm.advice || followUpForm.symptoms || 'นัดติดตามจากการบันทึกผลการติดตาม']
    .filter(Boolean)
    .join(' | ')

  const res = await fetch(`${API_BASE}/patients/${followUpForm.patient_id}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      appointment_date: followUpForm.nextAppointment,
      appointment_time: '08:00',
      reason,
      doctor_id: currentUserId.value
    })
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'ไม่สามารถสร้างนัดหมายติดตามซ้ำได้')
}

const submitFollowUpForm = async () => {
  if (followUpForm.needFollowUp && !followUpForm.nextAppointment) {
    return Swal.fire({
      title: 'ข้อมูลไม่ครบ',
      text: 'กรุณาระบุวันที่นัดหมายครั้งถัดไป',
      icon: 'warning',
      confirmButtonText: 'ตกลง'
    })
  }
  if (!followUpForm.patient_id) {
    return Swal.fire({
      title: 'ผิดพลาด',
      text: 'ไม่พบข้อมูลผู้ป่วย',
      icon: 'error',
      confirmButtonText: 'ตกลง'
    })
  }
  isSubmitting.value = true
  try {
    const formData = new FormData()
    formData.append('patient_id', followUpForm.patient_id)
    if (followUpForm.appointment_id) {
      formData.append('appointment_id', followUpForm.appointment_id)
    }
    formData.append('tracked_by_user_id', currentUserId.value)
    formData.append('tracking_date', followUpForm.followUpDate)
    formData.append('bp_sys', followUpForm.bpSys || '')
    formData.append('bp_dia', followUpForm.bpDia || '')
    formData.append('sugar', followUpForm.sugar || '')
    formData.append('weight', followUpForm.weight || '')
    formData.append('symptoms_detail', followUpForm.symptoms || '')
    formData.append('problems', followUpForm.problems || '')
    formData.append('advice', followUpForm.advice || '')
    formData.append('location', followUpForm.location)
    formData.append('health_status', followUpForm.health_status)
    
    if (followUpForm.needFollowUp && followUpForm.nextAppointment) {
      formData.append('next_appointment_date', followUpForm.nextAppointment)
    }

    // Attach all selected image files
    for (const file of selectedFiles.value) {
      formData.append('images', file)
    }

    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/tracking`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Do NOT set Content-Type header when sending FormData!
      },
      body: formData
    })

    if (res.ok) {
      if (followUpForm.needFollowUp) {
        await createFollowUpAppointment(token)
      }
      Swal.fire({
        title: 'สำเร็จ!',
        text: 'บันทึกผลการติดตามผู้ป่วยเรียบร้อยแล้ว!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      })
      showFollowUpModal.value = false
      await fetchPatients()
      await fetchTodayAppointments()
      await fetchMissedAppointments()
    } else {
      const data = await res.json()
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: data.message,
        icon: 'error',
        confirmButtonText: 'ตกลง'
      })
    }
  } catch (err) {
    console.error(err)
    Swal.fire({
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถบันทึกข้อมูลได้',
      icon: 'error',
      confirmButtonText: 'ตกลง'
    })
  } finally {
    isSubmitting.value = false
  }
}

const showHistoryModal = ref(false)
const historyPatientInfo = ref({ id: null, name: '', hn: '' })
const loadingHistory = ref(false)

// ข้อมูลรายการที่บันทึกผลจริงๆแล้ว (Tracking History)
const appointments = ref([])

const openHistoryModal = async (patient) => {
  historyPatientInfo.value = {
    id: patient.id,
    name: patient.nameTh,
    hn: patient.hn
  }
  showHistoryModal.value = true
  
  loadingHistory.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/tracking/patient/${patient.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      appointments.value = await res.json()
    }
  } catch (err) {
    console.error('Error fetching history:', err)
  } finally {
    loadingHistory.value = false
  }
}

const openAppointmentFromHistory = () => {
  showHistoryModal.value = false
  // Map historyPatientInfo to appointmentPatientInfo
  appointmentPatientInfo.value = { ...historyPatientInfo.value }
  // Reset form
  appointmentForm.date = ''
  appointmentForm.startTime = ''
  appointmentForm.endTime = ''
  appointmentForm.type = ''
  appointmentForm.unit = ''
  appointmentForm.notes = ''
  showAppointmentModal.value = true
}

const openAppointmentModalFromToday = (appointment) => {
  appointmentPatientInfo.value = {
    id: appointment.patient_id,
    name: appointment.nameTh,
    hn: appointment.hn
  }
  appointmentForm.date = appointment.appointment_date
  appointmentForm.startTime = formatTimeOnly(appointment.appointment_time) || '08:00'
  appointmentForm.endTime = ''
  appointmentForm.type = ''
  appointmentForm.unit = ''
  appointmentForm.notes = appointment.reason || ''
  showAppointmentModal.value = true
}

const formatTimeOnly = (value) => {
  if (!value) return ''
  return String(value).slice(0, 5)
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('th-TH')
}

// Edit Patient Modal
const showEditPatientModal = ref(false)
const editForm = reactive({
  idCard: '',
  hn: '',
  prefix: '',
  firstName: '',
  lastName: '',
  gender: '',
  birthDate: '',
  phone: '',
  email: '',
  address: '',
  province: '',
  district: '',
  subDistrict: '',
  zipcode: '',
  emergencyName: '',
  emergencyPhone: '',
  unit: '',
  status: 'Active'
})

const openEditPatientModal = (patient) => {
  // นำข้อมูลผู้ป่วย (Mock) มาใส่ในฟอร์มเพื่อแก้ไข
  editForm.hn = patient.hn || ''
  
  // แยกชื่อ-นามสกุลออกเพื่อใส่ในฟอร์ม (จำลองจาก mock data)
  if (patient.nameTh) {
    const nameParts = patient.nameTh.split(' ')
    editForm.firstName = nameParts[0] || ''
    editForm.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''
  } else {
    editForm.firstName = ''
    editForm.lastName = ''
  }
  
  editForm.status = patient.status || 'Active'
  editForm.email = patient.email || ''
  
  showEditPatientModal.value = true
}

const handleUpdatePatient = () => {
  console.log('Updating form:', editForm)
  Swal.fire({
    title: 'สำเร็จ!',
    text: 'บันทึกการแก้ไขข้อมูลผู้ป่วยเรียบร้อยแล้ว!',
    icon: 'success',
    timer: 1500,
    showConfirmButton: false
  })
  showEditPatientModal.value = false
}

// Detail Modal
const showDetailModal = ref(false)
const detailInfo = ref({})
const trackingAttachments = ref([])
const loadingAttachments = ref(false)

const openDetailModal = async (item) => {
  detailInfo.value = { ...item }
  trackingAttachments.value = []
  
  if (item.type === 'tracking') {
    loadingAttachments.value = true
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/tracking/${item.id}/attachments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        trackingAttachments.value = await res.json()
      }
    } catch (err) {
      console.error('Error fetching tracking attachments:', err)
    } finally {
      loadingAttachments.value = false
    }
  }
  showDetailModal.value = true
}

const viewFullscreenImage = (filePath) => {
  const fullUrl = config.public.apiBase + '/' + filePath.replace(/\\/g, '/')
  Swal.fire({
    imageUrl: fullUrl,
    imageAlt: 'รูปภาพประกอบการติดตาม',
    showCloseButton: true,
    showConfirmButton: false,
    width: 'auto',
    background: 'transparent',
    customClass: {
      popup: 'bg-transparent border-0 shadow-none p-0 max-w-[90vw] max-h-[90vh]'
    }
  })
}

onMounted(() => {
  // fetchPatients ถูกเรียกใน onMounted ด้านบนแล้ว
})

</script>

<style scoped>
.input-style {
  @apply w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none transition-all focus:border-[#00685f] focus:ring-1 focus:ring-[#00685f] placeholder:text-slate-400;
}

/* Custom Scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.input-field {
  @apply w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 outline-none transition-colors focus:border-[#00705a] focus:ring-1 focus:ring-[#00705a] placeholder-gray-400;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
