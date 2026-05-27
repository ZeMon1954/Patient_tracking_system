<template>
  <NuxtLayout name="dashboard">
    <div class="p-4 sm:p-6 md:p-8">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start md:items-end gap-4 mb-6 md:mb-8">
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-[#1a2b3c] mb-1">จัดการรายชื่อผู้ป่วย</h1>
            <p class="text-slate-500 text-sm">รายชื่อผู้ป่วยในหน่วยงาน (Manage Patient List)</p>
          </div>
          <button @click="openAddModal" class="bg-[#00685f] hover:bg-[#005049] text-white px-4 py-2.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all shadow-sm self-start sm:self-auto">
            <span class="material-symbols-outlined text-[18px]">add</span>
            ลงทะเบียนผู้ป่วยใหม่
          </button>
        </div>

        <!-- Filters -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap items-center gap-4 flex-1">
            <!-- ค้นหา -->
            <div class="relative min-w-[300px] flex-1 max-w-md">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input 
                v-model="searchQuery" 
                @input="debouncedSearch"
                type="text" 
                placeholder="ค้นหาชื่อ, นามสกุล หรือ HN..." 
                class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00685f]/20 focus:border-[#00685f] transition-all"
              />
            </div>

            <!-- กรองตามสิทธิ์การดูแล -->
            <div class="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <button 
                @click="filterCareStatus = 'all'"
                :class="filterCareStatus === 'all' ? 'bg-white text-[#00685f] shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                class="px-4 py-1.5 rounded-md text-xs font-bold transition-all"
              >
                ทั้งหมด
              </button>
              <button 
                @click="filterCareStatus = 'in_unit'"
                :class="filterCareStatus === 'in_unit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                class="px-4 py-1.5 rounded-md text-xs font-bold transition-all"
              >
                ในหน่วยบริการ
              </button>
              <button 
                @click="filterCareStatus = 'referred_out'"
                :class="filterCareStatus === 'referred_out' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                class="px-4 py-1.5 rounded-md text-xs font-bold transition-all"
              >
                ส่งตัวไปแล้ว
              </button>
              <button 
                @click="filterCareStatus = 'referred_back'"
                :class="filterCareStatus === 'referred_back' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                class="px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span v-if="filterCareStatus === 'referred_back'" class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span v-else class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                ถูกส่งตัวกลับ
              </button>
            </div>
          </div>

          <div class="text-xs text-slate-400 font-medium">
            * แสดงหน่วยงานของคุณขึ้นก่อนเสมอ
          </div>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <!-- Loading -->
          <div v-if="isLoading" class="flex items-center justify-center py-16">
            <div class="flex flex-col items-center gap-3 text-slate-400">
              <div class="w-8 h-8 border-4 border-slate-200 border-t-[#00685f] rounded-full animate-spin"></div>
              <span class="text-sm">กำลังโหลดข้อมูล...</span>
            </div>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm whitespace-nowrap">
              <thead class="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th class="py-3 px-4 w-12 text-center"><input type="checkbox" class="rounded border-slate-300 text-[#00685f]" /></th>
                  <th class="py-3 px-4 pl-6">HN</th>
                  <th class="py-3 px-4">ชื่อ - นามสกุล</th>
                  <th class="py-3 px-4">กลุ่มโรค</th>
                  <th class="py-3 px-4">เยี่ยมล่าสุด</th>
                  <th class="py-3 px-4 text-center">ความเสี่ยง</th>
                  <th class="py-3 px-4 text-center">สิทธิ์การดูแล</th>
                  <th class="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr v-if="sortedFilteredPatients.length === 0">
                  <td colspan="7" class="py-12 text-center text-slate-400">
                    <span class="material-symbols-outlined text-4xl block mb-2">search_off</span>
                    ไม่พบข้อมูลผู้ป่วย
                  </td>
                </tr>
                <tr v-for="p in sortedFilteredPatients" :key="p.id" class="hover:bg-slate-50/50 transition-colors group">
                  <td class="py-4 px-4 text-center"><input type="checkbox" class="rounded border-slate-300 text-[#00685f]" /></td>
                  <td class="py-4 px-4 font-mono font-medium text-slate-600">{{ p.hn_number }}</td>
                  <td class="py-4 px-4">
                    <div class="font-medium text-slate-800">{{ p.first_name }} {{ p.last_name }}</div>
                    <div class="text-xs text-slate-400 mt-0.5">{{ genderLabel(p.gender) }} · อายุ {{ calcAge(p.date_of_birth) }} ปี</div>
                  </td>
                  <td class="py-4 px-4">
                    <span v-if="p.disease_groups" class="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-xs font-medium text-slate-700">
                      {{ p.disease_groups }}
                    </span>
                    <span v-else class="text-slate-400 text-xs">ไม่ระบุ</span>
                  </td>
                  <td class="py-4 px-4 text-slate-600 text-sm">{{ p.last_visit ? formatDate(p.last_visit) : '-' }}</td>
                  <td class="py-4 px-4 text-center">
                    <span :class="healthBadge(p.health_status)" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium">
                      {{ healthLabel(p.health_status) }}
                    </span>
                  </td>
                  <td class="py-4 px-4 text-center">
                    <span v-if="p.is_refer_back" class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-100 uppercase animate-pulse shadow-sm" title="ส่งตัวกลับจาก รพ.สต.">
                      <span class="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                      ถูกส่งตัวกลับ
                    </span>
                    <span v-else-if="p.service_unit_id === currentUserUnitId" class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100 uppercase">
                      <span class="w-1 h-1 rounded-full bg-blue-600"></span>
                      ในหน่วยบริการ
                    </span>
                    <span v-else class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-50 text-orange-600 text-[10px] font-bold border border-orange-100 uppercase">
                      <span class="w-1 h-1 rounded-full bg-orange-600"></span>
                      ส่งตัวไปแล้ว
                    </span>
                  </td>
                  <td class="py-4 px-4 text-center">
                    <div class="flex items-center justify-center gap-2 transition-all">
                      <button @click="openAppointmentModal(p)" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors" title="สร้างการนัดหมาย">
                        <span class="material-symbols-outlined text-[20px]">calendar_add_on</span>
                      </button>
                      <button @click="openFollowUpModal(p)" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-teal-50 text-slate-400 hover:text-teal-600 transition-colors" title="บันทึกผลการติดตาม/รักษา">
                        <span class="material-symbols-outlined text-[20px]">assignment_turned_in</span>
                      </button>
                      <button @click="openHistoryModal(p)" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-purple-50 text-slate-400 hover:text-purple-600 transition-colors" title="ดูประวัติ">
                        <span class="material-symbols-outlined text-[20px]">history</span>
                      </button>
                      <button @click="openEditModal(p)" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-50 text-slate-400 hover:text-[#006399] transition-colors" title="แก้ไขข้อมูล">
                        <span class="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button @click="handleDeletePatient(p)" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="ลบ">
                        <span class="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="text-sm text-slate-500 font-medium italic">พบ <span class="font-bold text-[#00685f]">{{ sortedFilteredPatients.length }}</span> รายการ</div>
            
            <!-- คำอธิบายปุ่มจัดการ -->
            <div class="flex flex-wrap items-center gap-x-6 gap-y-2 py-1 px-4 bg-white rounded-lg border border-slate-200 shadow-sm">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-r border-slate-200 pr-4 mr-2">คำอธิบายปุ่ม</span>
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px] text-emerald-500">calendar_add_on</span>
                <span class="text-[11px] text-slate-600">นัดหมาย</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px] text-teal-500">assignment_turned_in</span>
                <span class="text-[11px] text-slate-600">บันทึกผล</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px] text-purple-500">history</span>
                <span class="text-[11px] text-slate-600">ประวัติ/ส่งตัว</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px] text-blue-500">edit</span>
                <span class="text-[11px] text-slate-600">แก้ไข</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px] text-red-500">delete</span>
                <span class="text-[11px] text-slate-600">ลบ</span>
              </div>
            </div>
          </div>
        </div>


    <!-- ===================== Modal เพิ่มผู้ป่วยใหม่ ===================== -->
    <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-[#00685f]/10 rounded-lg flex items-center justify-center">
              <span class="material-symbols-outlined text-[#00685f] text-[22px]">person_add</span>
            </div>
            <h2 class="text-xl font-bold text-slate-800">ลงทะเบียนผู้ป่วยใหม่</h2>
          </div>
          <button @click="showAddModal = false" class="text-slate-400 hover:text-slate-600 transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-6 bg-slate-50/50">
          <!-- ข้อมูลส่วนตัว -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-[#00685f] border-b border-slate-200 pb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">badge</span>ข้อมูลส่วนบุคคล
            </h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="label-style">เลขบัตรประชาชน</label>
                <input v-model="form.cid" type="text" placeholder="x-xxxx-xxxxx-xx-x" class="input-style" maxlength="13" />
              </div>
              <div class="space-y-1.5">
                <label class="label-style">HN (ออกโดยระบบอัตโนมัติ)</label>
                <input type="text" placeholder="ระบบจะออกเลขให้หลังบันทึก" class="input-style bg-slate-100 cursor-not-allowed" disabled />
              </div>
            </div>
            <div class="grid grid-cols-12 gap-4">
              <div class="col-span-3 space-y-1.5">
                <label class="label-style">คำนำหน้า</label>
                <select v-model="form.prefix" class="input-style">
                  <option value="">เลือก</option>
                  <option>ด.ช.</option><option>ด.ญ.</option><option>นาย</option><option>นาง</option><option>นางสาว</option>
                </select>
              </div>
              <div class="col-span-4 space-y-1.5">
                <label class="label-style">ชื่อ <span class="text-rose-500">*</span></label>
                <input v-model="form.first_name" type="text" placeholder="ชื่อจริง" class="input-style" />
              </div>
              <div class="col-span-5 space-y-1.5">
                <label class="label-style">นามสกุล <span class="text-rose-500">*</span></label>
                <input v-model="form.last_name" type="text" placeholder="นามสกุล" class="input-style" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="label-style">เพศ</label>
                <select v-model="form.gender" class="input-style">
                  <option value="">เลือกเพศ</option>
                  <option value="male">ชาย</option><option value="female">หญิง</option><option value="other">อื่นๆ</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="label-style">วันเกิด</label>
                <input v-model="form.date_of_birth" type="date" class="input-style" />
              </div>
            </div>
          </div>

          <!-- ข้อมูลการติดต่อ -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-[#00685f] border-b border-slate-200 pb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">contact_phone</span>ข้อมูลการติดต่อ
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="label-style">เบอร์โทรศัพท์ <span class="text-rose-500">*</span></label>
                <input v-model="form.phone" type="text" placeholder="08x-xxx-xxxx" class="input-style" />
              </div>
              <div class="space-y-1.5">
                <label class="label-style">อีเมล (สำหรับแจ้งเตือน) <span class="text-xs text-slate-400 font-normal">(ถ้ามี)</span></label>
                <input v-model="form.email" type="email" placeholder="example@email.com" class="input-style" />
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="label-style">ที่อยู่</label>
              <textarea v-model="form.address" rows="2" placeholder="บ้านเลขที่, หมู่, ซอย, ถนน" class="input-style"></textarea>
            </div>
          </div>

          <!-- กลุ่มโรค / โรคประจำตัว -->
          <div class="space-y-3 font-sans">
            <div class="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 class="text-sm font-bold text-[#00685f] flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px]">medical_services</span>กลุ่มโรค / โรคประจำตัว
              </h3>
              <button type="button" @click="handleCreateDisease" class="text-[10px] font-bold text-[#00685f] hover:underline flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">add_circle</span>
                เพิ่มโรคใหม่
              </button>
            </div>
            
            <!-- แสดงโรคที่เลือกเป็นแท็ก/Badge -->
            <div class="flex flex-wrap gap-2 mb-2 min-h-[36px] p-2 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
              <div v-if="form.disease_ids.length === 0" class="text-xs text-slate-400 italic py-1 px-2">ยังไม่ได้เลือกโรคประจำตัว</div>
              <div v-for="dId in form.disease_ids" :key="dId" class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#00685f]/10 text-[#00685f] border border-[#00685f]/20 rounded-full text-xs font-semibold">
                <span>{{ getDiseaseLabel(dId) }}</span>
                <button type="button" @click="toggleDiseaseAdd(dId)" class="hover:text-red-500 font-bold ml-1 transition-colors">
                  <span class="material-symbols-outlined text-[12px] block">close</span>
                </button>
              </div>
            </div>

            <!-- ช่องค้นหาและ Dropdown สำหรับคลิกเลือก -->
            <div class="relative">
              <div v-if="isDiseaseDropdownOpen" @click="isDiseaseDropdownOpen = false" class="fixed inset-0 z-40 bg-transparent"></div>
              
              <div class="relative z-50">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                <input 
                  v-model="diseaseSearchQuery" 
                  @focus="isDiseaseDropdownOpen = true"
                  type="text" 
                  placeholder="ค้นหาโรคประจำตัว (พิมพ์ชื่อ หรือ รหัส ICD-10)..." 
                  class="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:border-[#00685f] focus:ring-1 focus:ring-[#00685f] outline-none transition-all placeholder:text-slate-400"
                />
                <button 
                  v-if="diseaseSearchQuery"
                  type="button"
                  @click="diseaseSearchQuery = ''"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span class="material-symbols-outlined text-[16px] block">close</span>
                </button>
              </div>

              <!-- Dropdown ลิสต์รายการโรค -->
              <div v-if="isDiseaseDropdownOpen" class="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg divide-y divide-slate-100">
                <div 
                  v-for="d in filteredDiseasesForAdd" 
                  :key="d.id"
                  @click="selectDiseaseAdd(d.id)"
                  class="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors"
                >
                  <span>{{ d.name }} {{ d.icd10_code ? `(${d.icd10_code})` : '' }}</span>
                  <span class="material-symbols-outlined text-[16px] text-slate-300">add</span>
                </div>
                <div v-if="filteredDiseasesForAdd.length === 0" class="px-4 py-3 text-xs text-slate-400 italic text-center">
                  ไม่พบรายการโรคประจำตัว
                </div>
              </div>
            </div>
          </div>

          <!-- หน่วยบริการ -->
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-[#00685f] border-b border-slate-200 pb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">domain</span>หน่วยบริการที่รับผิดชอบ
            </h3>
            <div class="space-y-1.5">
              <label class="label-style">หน่วยบริการ</label>
              <div class="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-semibold flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px]">check_circle</span>
                {{ userUnitName }}
              </div>
              <p class="text-[10px] text-slate-400 italic mt-1">* ระบบเลือกหน่วยงานต้นสังกัดของคุณให้อัตโนมัติ</p>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button @click="showAddModal = false" class="px-6 py-2 rounded-lg border border-slate-300 text-slate-600 font-medium hover:bg-slate-100 transition-colors">ยกเลิก</button>
          <button @click="handleCreatePatient" :disabled="isSubmitting" class="px-6 py-2 rounded-lg bg-[#00685f] text-white font-medium hover:bg-[#005049] transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2">
            <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
            บันทึกข้อมูล
          </button>
        </div>
      </div>
    </div>

    <!-- ===================== Modal แก้ไขผู้ป่วย ===================== -->
    <div v-if="showEditModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-[#006399]/10 rounded-lg flex items-center justify-center">
              <span class="material-symbols-outlined text-[#006399] text-[22px]">edit</span>
            </div>
            <h2 class="text-xl font-bold text-slate-800">แก้ไขข้อมูลผู้ป่วย</h2>
          </div>
          <button @click="showEditModal = false" class="text-slate-400 hover:text-slate-600 transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-6 bg-slate-50/50">
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-[#006399] border-b border-slate-200 pb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">badge</span>ข้อมูลส่วนบุคคล
            </h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="label-style">เลขบัตรประชาชน</label>
                <input v-model="editForm.cid" type="text" class="input-style" maxlength="13" />
              </div>
              <div class="space-y-1.5">
                <label class="label-style">HN <span class="text-rose-500">*</span></label>
                <input v-model="editForm.hn_number" type="text" class="input-style" />
              </div>
            </div>
            <div class="grid grid-cols-12 gap-4">
              <div class="col-span-3 space-y-1.5">
                <label class="label-style">คำนำหน้า</label>
                <select v-model="editForm.prefix" class="input-style">
                  <option value="">เลือก</option>
                  <option>ด.ช.</option><option>ด.ญ.</option><option>นาย</option><option>นาง</option><option>นางสาว</option>
                </select>
              </div>
              <div class="col-span-4 space-y-1.5">
                <label class="label-style">ชื่อ <span class="text-rose-500">*</span></label>
                <input v-model="editForm.first_name" type="text" class="input-style" />
              </div>
              <div class="col-span-5 space-y-1.5">
                <label class="label-style">นามสกุล <span class="text-rose-500">*</span></label>
                <input v-model="editForm.last_name" type="text" class="input-style" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="label-style">เพศ</label>
                <select v-model="editForm.gender" class="input-style">
                  <option value="male">ชาย</option><option value="female">หญิง</option><option value="other">อื่นๆ</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="label-style">วันเกิด</label>
                <input v-model="editForm.date_of_birth" type="date" class="input-style" />
              </div>
            </div>
          </div>
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-[#006399] border-b border-slate-200 pb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">contact_phone</span>ข้อมูลการติดต่อ
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="label-style">เบอร์โทรศัพท์</label>
                <input v-model="editForm.phone" type="text" class="input-style" />
              </div>
              <div class="space-y-1.5">
                <label class="label-style">อีเมล (สำหรับแจ้งเตือน) <span class="text-xs text-slate-400 font-normal">(ถ้ามี)</span></label>
                <input v-model="editForm.email" type="email" placeholder="example@email.com" class="input-style" />
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="label-style">ที่อยู่</label>
              <textarea v-model="editForm.address" rows="2" class="input-style"></textarea>
            </div>
          </div>

          <!-- กลุ่มโรค / โรคประจำตัว -->
          <div class="space-y-3 font-sans">
            <div class="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 class="text-sm font-bold text-[#006399] flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px]">medical_services</span>กลุ่มโรค / โรคประจำตัว
              </h3>
              <button type="button" @click="handleCreateDisease" class="text-[10px] font-bold text-[#006399] hover:underline flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">add_circle</span>
                เพิ่มโรคใหม่
              </button>
            </div>
            
            <!-- แสดงโรคที่เลือกเป็นแท็ก/Badge -->
            <div class="flex flex-wrap gap-2 mb-2 min-h-[36px] p-2 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
              <div v-if="editForm.disease_ids.length === 0" class="text-xs text-slate-400 italic py-1 px-2">ยังไม่ได้เลือกโรคประจำตัว</div>
              <div v-for="dId in editForm.disease_ids" :key="dId" class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#006399]/10 text-[#006399] border border-[#006399]/20 rounded-full text-xs font-semibold">
                <span>{{ getDiseaseLabel(dId) }}</span>
                <button type="button" @click="toggleDiseaseEdit(dId)" class="hover:text-red-500 font-bold ml-1 transition-colors">
                  <span class="material-symbols-outlined text-[12px] block">close</span>
                </button>
              </div>
            </div>

            <!-- ช่องค้นหาและ Dropdown สำหรับคลิกเลือก -->
            <div class="relative">
              <div v-if="isEditDiseaseDropdownOpen" @click="isEditDiseaseDropdownOpen = false" class="fixed inset-0 z-40 bg-transparent"></div>
              
              <div class="relative z-50">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                <input 
                  v-model="editDiseaseSearchQuery" 
                  @focus="isEditDiseaseDropdownOpen = true"
                  type="text" 
                  placeholder="ค้นหาโรคประจำตัว (พิมพ์ชื่อ หรือ รหัส ICD-10)..." 
                  class="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:border-[#006399] focus:ring-1 focus:ring-[#006399] outline-none transition-all placeholder:text-slate-400"
                />
                <button 
                  v-if="editDiseaseSearchQuery"
                  type="button"
                  @click="editDiseaseSearchQuery = ''"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span class="material-symbols-outlined text-[16px] block">close</span>
                </button>
              </div>

              <!-- Dropdown ลิสต์รายการโรค -->
              <div v-if="isEditDiseaseDropdownOpen" class="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg divide-y divide-slate-100">
                <div 
                  v-for="d in filteredDiseasesForEdit" 
                  :key="d.id"
                  @click="selectDiseaseEdit(d.id)"
                  class="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors"
                >
                  <span>{{ d.name }} {{ d.icd10_code ? `(${d.icd10_code})` : '' }}</span>
                  <span class="material-symbols-outlined text-[16px] text-slate-300">add</span>
                </div>
                <div v-if="filteredDiseasesForEdit.length === 0" class="px-4 py-3 text-xs text-slate-400 italic text-center">
                  ไม่พบรายการโรคประจำตัว
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="space-y-1.5">
              <label class="label-style">หน่วยบริการ</label>
              <select v-model="editForm.service_unit_id" class="input-style">
                <option value="">เลือกหน่วยบริการ</option>
                <option v-for="u in serviceUnits" :key="u.id" :value="u.id">{{ u.name }}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button @click="showEditModal = false" class="px-6 py-2 rounded-lg border border-slate-300 text-slate-600 font-medium hover:bg-slate-100 transition-colors">ยกเลิก</button>
          <button @click="handleUpdatePatient" :disabled="isSubmitting" class="px-6 py-2 rounded-lg bg-[#006399] text-white font-medium hover:bg-[#005082] transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2">
            <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
            บันทึกการแก้ไข
          </button>
        </div>
      </div>
    </div>

    <!-- ===================== Modal สร้างการนัดหมาย ===================== -->
    <div v-if="showAppointmentModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <div class="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-[#00685f]/10 rounded-lg flex items-center justify-center text-[#00685f] shrink-0">
              <span class="material-symbols-outlined text-[22px]">calendar_add_on</span>
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-800">{{ editingApptId ? 'แก้ไขการนัดหมาย' : 'สร้างการนัดหมาย' }}</h2>
              <p class="text-sm text-slate-500 mt-0.5">{{ selectedPatient?.first_name }} {{ selectedPatient?.last_name }} (HN: {{ selectedPatient?.hn_number }})</p>
            </div>
          </div>
          <button @click="closeAppointmentModal" class="text-slate-400 hover:text-slate-600 transition-colors mt-1">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-5">
          
          <div class="mb-4">
            <AppointmentCalendar v-model="apptForm.appointment_date" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- ซ่อน input date เดิมไว้ หรือลบไปเลยเพราะใช้จาก Calendar แล้ว แต่เก็บไว้ให้เผื่อแก้แบบกรอกมือ -->
            <div class="space-y-1.5 hidden">
              <label class="label-style">วันที่นัด <span class="text-rose-500">*</span></label>
              <input v-model="apptForm.appointment_date" type="date" class="input-style" />
            </div>
            <div class="space-y-1.5">
              <label class="label-style">เวลาเริ่ม</label>
              <input v-model="apptForm.appointment_time" type="time" class="input-style" />
            </div>
            <div class="space-y-1.5">
              <label class="label-style">สถานะ</label>
              <!-- ถ้าเป็นการสร้างใหม่ (!editingApptId) ให้ล็อคเป็น "รอดำเนินการ" -->
              <div v-if="!editingApptId" class="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 font-semibold flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px]">schedule</span>
                รอดำเนินการ
              </div>
              <!-- ถ้าเป็นการแก้ไขให้เลือกเปลี่ยนสถานะได้ -->
              <select v-else v-model="apptForm.status" class="input-style">
                <option value="pending">รอดำเนินการ</option>
                <option value="confirmed">ยืนยันแล้ว</option>
                <option value="completed">มาตามนัด</option>
                <option value="noshow">ขาดนัด</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="label-style">เจ้าหน้าที่ผู้นัดหมาย</label>
            <div class="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-semibold flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">person_check</span>
              {{ userName }}
            </div>
            <p class="text-[10px] text-slate-400 italic mt-1">* ระบบบันทึกชื่อคุณเป็นผู้นัดหมายให้อัตโนมัติ</p>
          </div>

          <div class="space-y-1.5">
            <label class="label-style">ประเภทการนัด / รายละเอียด</label>
            <textarea v-model="apptForm.reason" rows="3" placeholder="ระบุประเภทการนัด, อาการเบื้องต้น หรือสิ่งที่ต้องเตรียม..." class="input-style resize-none"></textarea>
          </div>

          <div class="p-4 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-600">
            <span class="font-medium">วันที่สร้าง:</span> {{ currentDate }}
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
          <button @click="closeAppointmentModal" class="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">ยกเลิก</button>
          <button @click="handleSaveAppointment" :disabled="isSubmitting" class="px-5 py-2.5 rounded-lg bg-[#00685f] text-white text-sm font-medium hover:bg-[#005049] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60">
            <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
            <span class="material-symbols-outlined text-[18px]">save</span>
            บันทึก
          </button>
        </div>
      </div>
    </div>

    <!-- ===================== Modal ประวัติการนัดหมาย ===================== -->
    <div v-if="showHistoryModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-purple-100/50 rounded-lg flex items-center justify-center text-purple-600 shrink-0">
              <span class="material-symbols-outlined text-[22px]">history</span>
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-800">ประวัติการนัดหมาย</h2>
              <p class="text-sm text-slate-500 mt-0.5">{{ selectedPatient?.first_name }} {{ selectedPatient?.last_name }} · HN: {{ selectedPatient?.hn_number }}</p>
            </div>
          </div>
          <button @click="showHistoryModal = false" class="text-slate-400 hover:text-slate-600 transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1 bg-white">
          <div class="flex justify-end mb-4">
            <button @click="openAppointmentFromHistory" class="px-4 py-2 bg-[#00685f] text-white rounded-lg text-sm font-medium hover:bg-[#005049] transition-colors flex items-center gap-2 shadow-sm">
              <span class="material-symbols-outlined text-[18px]">add</span>
              สร้างการนัดหมาย
            </button>
          </div>

          <div v-if="loadingHistory" class="flex justify-center py-8">
            <div class="w-6 h-6 border-4 border-slate-200 border-t-[#00685f] rounded-full animate-spin"></div>
          </div>

          <div v-else class="space-y-4">
            <div class="border border-slate-200 rounded-lg overflow-hidden">
              <table class="w-full text-left border-collapse text-sm">
                <thead class="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th class="px-4 py-3">วันที่นัด</th>
                  <th class="px-4 py-3">เวลา</th>
                  <th class="px-4 py-3">ประเภท / รายละเอียด</th>
                  <th class="px-4 py-3">เจ้าหน้าที่</th>
                  <th class="px-4 py-3 text-center">สถานะ</th>
                  <th class="px-4 py-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr v-if="patientAppointments.length === 0">
                  <td colspan="6" class="py-8 text-center text-slate-400">ยังไม่มีประวัติการนัดหมาย</td>
                </tr>
                <tr v-for="appt in patientAppointments" :key="appt.id" class="hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-4 font-medium" :class="appt.status === 'cancelled' ? 'text-rose-500' : 'text-slate-800'">
                    {{ formatDate(appt.appointment_date) }}
                  </td>
                  <td class="px-4 py-4 font-mono text-xs text-slate-500">{{ appt.appointment_time ? appt.appointment_time.slice(0,5) : '-' }}</td>
                  <td class="px-4 py-4 max-w-[200px] truncate">{{ appt.reason || '-' }}</td>
                  <td class="px-4 py-4">{{ appt.doctor_name || '-' }}</td>
                  <td class="px-4 py-4 text-center">
                    <span :class="apptStatusClass(appt.status)" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium">
                      {{ apptStatusLabel(appt.status) }}
                    </span>
                  </td>
                  <td class="px-4 py-4">
                    <div class="flex items-center justify-center gap-2">
                      <button v-if="appt.status === 'pending'" @click="openFollowUpModalFromAppointment(appt)" class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-teal-50 text-slate-400 hover:text-teal-600 transition-colors" title="บันทึกผลการรักษา">
                        <span class="material-symbols-outlined text-[16px]">assignment_turned_in</span>
                      </button>
                      <button @click="openReferralModal(selectedPatient, appt)" class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-orange-50 text-slate-400 hover:text-orange-600 transition-colors" title="ส่งต่อจากนัดหมายนี้">
                        <span class="material-symbols-outlined text-[16px]">send_time_extension</span>
                      </button>
                      <button @click="openEditAppointment(appt)" class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="แก้ไข">
                        <span class="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button @click="handleDeleteAppointment(appt)" class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="ลบ">
                        <span class="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- คำอธิบายปุ่มจัดการใน Modal ประวัติ -->
          <div class="flex items-center gap-x-6 gap-y-2 py-3 px-4 bg-slate-50 rounded-lg border border-slate-200 mt-4">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-r border-slate-200 pr-4 mr-2">ปุ่มจัดการ</span>
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px] text-teal-500">assignment_turned_in</span>
              <span class="text-[10px] text-slate-600">บันทึกผลการรักษา</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px] text-orange-500">send_time_extension</span>
              <span class="text-[10px] text-slate-600">ส่งตัวคนไข้</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px] text-blue-500">edit</span>
              <span class="text-[10px] text-slate-600">แก้ไขนัดหมาย</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px] text-red-500">delete</span>
              <span class="text-[10px] text-slate-600">ลบนัดหมาย</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>

    <!-- ===================== Modal ส่งตัว (Referral) ===================== -->
    <div v-if="showReferralModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        <div class="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-orange-100/50 rounded-lg flex items-center justify-center text-orange-600 shrink-0">
              <span class="material-symbols-outlined text-[22px]">send_time_extension</span>
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-800">ส่งตัวคนไข้ (Referral)</h2>
              <p class="text-sm text-slate-500 mt-0.5">{{ selectedPatient?.first_name }} {{ selectedPatient?.last_name }} (HN: {{ selectedPatient?.hn_number }})</p>
            </div>
          </div>
          <button @click="showReferralModal = false" class="text-slate-400 hover:text-slate-600 transition-colors mt-1">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="label-style">หน่วยบริการปลายทาง (รพ.สต.) <span class="text-rose-500">*</span></label>
              <select v-model="referralForm.to_service_unit_id" class="input-style">
                <option value="">เลือกหน่วยบริการ</option>
                <!-- กรองเอาตัวเองออก (สมมติว่าโรงพยาบาลคือ id=1) -->
                <option v-for="u in serviceUnits.filter(su => su.id !== 1)" :key="u.id" :value="u.id">{{ u.name }}</option>
              </select>
            </div>
            <div class="space-y-1.5">
              <label class="label-style">เจ้าหน้าที่ผู้ส่งตัว</label>
              <div class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium">
                {{ userName }}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="label-style">วันที่ส่งตัว <span class="text-rose-500">*</span></label>
              <input v-model="referralForm.referral_date" type="date" class="input-style" />
            </div>
            <div class="space-y-1.5">
              <label class="label-style">เวลา</label>
              <input v-model="referralForm.referral_time" type="time" class="input-style" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="label-style">เหตุผลการส่งตัว / อาการ <span class="text-rose-500">*</span></label>
              <textarea v-model="referralForm.reason" rows="3" placeholder="ระบุเหตุผลและอาการของผู้ป่วย..." class="input-style resize-none"></textarea>
            </div>
            <div class="space-y-1.5">
              <label class="label-style">ระดับความเร่งด่วน <span class="text-rose-500">*</span></label>
              <select v-model="referralForm.urgency_level" class="input-style">
                <option value="low">ปกติ</option>
                <option value="medium">ปานกลาง</option>
                <option value="high">สูง</option>
                <option value="critical">วิกฤต</option>
              </select>
              <p v-if="referralForm.urgency_level === 'high' || referralForm.urgency_level === 'critical'" class="text-xs text-red-500 font-medium mt-1">⚠️ การส่งต่อเร่งด่วน/วิกฤตจะแจ้งเตือนสูง</p>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
          <button @click="showReferralModal = false" class="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">ยกเลิก</button>
          <button @click="handleSaveReferral" :disabled="isSubmitting" class="px-5 py-2.5 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60">
            <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
            <span class="material-symbols-outlined text-[18px]">send</span>
            ส่งตัว
          </button>
        </div>
      </div>
    </div>

    <!-- Modal บันทึกผลการตรวจ/การรักษา -->
    <div v-if="showFollowUpModal" class="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#0b1c30]/40 backdrop-blur-sm">
      <div class="bg-surface-container-lowest w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border border-outline-variant flex flex-col">
        <!-- Modal Header -->
        <div class="p-6 md:p-8 border-b border-outline-variant flex justify-between items-center sticky top-0 bg-surface-container-lowest z-10">
          <div class="flex items-center gap-4">
            <span class="material-symbols-outlined text-primary text-4xl">history_edu</span>
            <h3 class="font-headline-md text-headline-md text-on-surface">บันทึกผลการตรวจ / ติดตามผลการรักษา</h3>
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
              <div class="bg-surface-container-low px-4 py-2 rounded-lg font-body-md text-on-surface border border-outline-variant text-slate-800">{{ followUpForm.patientName }}</div>
            </div>
            <div class="space-y-2">
              <label class="font-label-md text-on-surface-variant">วันที่ตรวจ/บันทึก :</label>
              <input v-model="followUpForm.followUpDate" class="w-full bg-surface-container-lowest border border-outline rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none text-slate-800" type="date"/>
            </div>
            <div class="space-y-2">
              <label class="font-label-md text-on-surface-variant">เจ้าหน้าที่ผู้บันทึก :</label>
              <div class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2 font-body-md text-on-surface flex items-center gap-2 text-slate-800">
                <span class="material-symbols-outlined text-primary text-[20px]">person_check</span>
                {{ userName }}
              </div>
              <p class="text-[10px] text-on-surface-variant italic mt-1">* ระบบบันทึกชื่อคุณเป็นผู้ติดตามให้อัตโนมัติ</p>
            </div>
            <div class="space-y-2">
              <label class="font-label-md text-on-surface-variant">สถานที่บันทึกผล :</label>
              <div class="flex flex-wrap gap-6 py-2">
                <label class="flex items-center gap-2 cursor-pointer group">
                  <input v-model="followUpForm.location" value="โรงพยาบาล" class="text-primary focus:ring-primary w-5 h-5" type="radio"/>
                  <span class="font-body-md group-hover:text-primary transition-colors text-slate-800">โรงพยาบาล</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer group">
                  <input v-model="followUpForm.location" value="บ้านผู้ป่วย" class="text-primary focus:ring-primary w-5 h-5" type="radio"/>
                  <span class="font-body-md group-hover:text-primary transition-colors text-slate-800">บ้านผู้ป่วย</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer group">
                  <input v-model="followUpForm.location" value="โทรศัพท์" class="text-primary focus:ring-primary w-5 h-5" type="radio"/>
                  <span class="font-body-md group-hover:text-primary transition-colors text-slate-800">โทรศัพท์</span>
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
                  <input v-model="followUpForm.bpSys" class="w-20 bg-white border border-outline rounded-lg px-2 py-2 text-center focus:ring-primary focus:outline-none text-slate-800" placeholder="SYS" type="text"/>
                  <span class="text-outline">/</span>
                  <input v-model="followUpForm.bpDia" class="w-20 bg-white border border-outline rounded-lg px-2 py-2 text-center focus:ring-primary focus:outline-none text-slate-800" placeholder="DIA" type="text"/>
                  <span class="text-label-sm text-outline ml-1">mmHg</span>
                </div>
              </div>
              <div class="space-y-2">
                <label class="font-label-md text-on-surface-variant">ระดับน้ำตาล (DTX):</label>
                <div class="flex items-center gap-2">
                  <input v-model="followUpForm.sugar" class="w-full bg-white border border-outline rounded-lg px-4 py-2 focus:ring-primary focus:outline-none text-slate-800" type="text"/>
                  <span class="text-label-sm text-outline ml-1 shrink-0">mg/dL</span>
                </div>
              </div>
              <div class="space-y-2">
                <label class="font-label-md text-on-surface-variant">น้ำหนัก:</label>
                <div class="flex items-center gap-2">
                  <input v-model="followUpForm.weight" class="w-full bg-white border border-outline rounded-lg px-4 py-2 focus:ring-primary focus:outline-none text-slate-800" type="text"/>
                  <span class="text-label-sm text-outline ml-1 shrink-0">kg</span>
                </div>
              </div>
            </div>
          </div>
          <!-- Clinical Notes -->
          <div class="space-y-8">
            <div class="space-y-2">
              <label class="font-label-md text-on-surface-variant">อาการโดยรวม / ผลการตรวจ:</label>
              <textarea v-model="followUpForm.symptoms" class="w-full bg-surface-container-lowest border border-outline rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none resize-none text-slate-800" placeholder="ระบุอาการปัจจุบันหรือผลตรวจทางคลินิก" rows="2"></textarea>
            </div>
            <div class="space-y-2">
              <label class="font-label-md text-on-surface-variant">ปัญหาที่พบ / วินิจฉัยเบื้องต้น:</label>
              <textarea v-model="followUpForm.problems" class="w-full bg-surface-container-lowest border border-outline rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none resize-none text-slate-800" placeholder="ระบุอุปสรรค ปัญหา หรือข้อวินิจฉัยเพิ่มเติม" rows="2"></textarea>
            </div>
            <div class="space-y-2">
              <label class="font-label-md text-on-surface-variant">แผนการรักษา / คำแนะนำที่ให้:</label>
              <textarea v-model="followUpForm.advice" class="w-full bg-surface-container-lowest border border-outline rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none resize-none text-slate-800" placeholder="ระบุการปรับยา การรักษา และคำแนะนำ" rows="2"></textarea>
            </div>
          </div>
          <!-- Risk Assessment -->
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
                <p class="text-[10px] text-slate-500">อาการคงที่ หรือควบคุมโรคได้ดี</p>
              </label>

              <label class="relative flex flex-col p-4 bg-white border rounded-xl cursor-pointer hover:bg-amber-50 transition-colors group" :class="followUpForm.health_status === 'warning' ? 'border-amber-500 ring-1 ring-amber-500' : 'border-outline-variant'">
                <input type="radio" v-model="followUpForm.health_status" value="warning" class="sr-only" />
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-bold text-amber-700">ต้องติดตาม (Warning)</span>
                  <span v-if="followUpForm.health_status === 'warning'" class="material-symbols-outlined text-amber-600 text-sm">priority_high</span>
                </div>
                <p class="text-[10px] text-slate-500">ควรเพิ่มความถี่ในการติดตาม/ปรับการดูแล</p>
              </label>

              <label class="relative flex flex-col p-4 bg-white border rounded-xl cursor-pointer hover:bg-rose-50 transition-colors group" :class="followUpForm.health_status === 'critical' ? 'border-rose-500 ring-1 ring-rose-500' : 'border-outline-variant'">
                <input type="radio" v-model="followUpForm.health_status" value="critical" class="sr-only" />
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-bold text-rose-700">วิกฤต (Critical)</span>
                  <span v-if="followUpForm.health_status === 'critical'" class="material-symbols-outlined text-rose-600 text-sm">emergency</span>
                </div>
                <p class="text-[10px] text-slate-500 font-medium">มีภาวะแทรกซ้อนรุนแรง หรือจำเป็นต้องดูแลรักษาเร่งด่วน</p>
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
                <span class="material-symbols-outlined text-sm">photo_camera</span> แนบผลตรวจ / ผลแล็บ / รูปภาพประกอบ (ถ้ามี) :
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
                <label class="font-label-md text-on-surface-variant">ต้องการนัดหมายติดตามซ้ำหรือไม่:</label>
                <label class="flex items-center gap-2 cursor-pointer group py-1">
                  <input v-model="followUpForm.needFollowUp" class="text-primary focus:ring-primary rounded w-6 h-6 border-outline" type="checkbox"/>
                  <span class="font-body-md font-bold text-on-surface group-hover:text-primary">ต้องการนัดหมายติดตามผลการรักษาซ้ำ</span>
                </label>
              </div>
              <div v-if="followUpForm.needFollowUp" class="space-y-2 animate-fade-in">
                <label class="font-label-md text-on-surface-variant flex items-center gap-2">
                  <span class="material-symbols-outlined text-sm">event</span> วันที่นัดครั้งถัดไป :
                </label>
                <input v-model="followUpForm.nextAppointment" class="w-full bg-surface-container-lowest border border-outline rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none text-slate-800" type="date"/>
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
            <span class="material-symbols-outlined">save</span> บันทึกผล
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

// ============= State =============
const patients = ref([])
const serviceUnits = ref([])
const doctors = ref([])
const diseases = ref([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const searchQuery = ref('')
const filterCareStatus = ref('all') // 'all', 'in_unit', 'referred_out'

const showAddModal = ref(false)
const showEditModal = ref(false)
const showAppointmentModal = ref(false)
const showHistoryModal = ref(false)
const showReferralModal = ref(false)
const loadingHistory = ref(false)

// บันทึกผลการติดตาม / เยี่ยมบ้าน / รักษา
const showFollowUpModal = ref(false)
const followUpForm = reactive({
  patient_id: null,
  appointment_id: null,
  patientName: '',
  followUpDate: '',
  officerName: '',
  location: 'โรงพยาบาล',
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

// อัปโหลดไฟล์รูปภาพแนบ
const fileInput = ref(null)
const selectedFiles = ref([])
const filePreviews = ref([])
const dragOver = ref(false)

const selectedPatient = ref(null)
const patientAppointments = ref([])
const editingApptId = ref(null)
const currentUserId = ref(null)
const currentUserUnitId = ref(null)

const userUnitName = computed(() => {
  const unit = serviceUnits.value.find(u => u.id === currentUserUnitId.value)
  return unit ? unit.name : 'กำลังโหลด...'
})

const sortedFilteredPatients = computed(() => {
  let list = [...patients.value]

  if (filterCareStatus.value === 'in_unit') {
    list = list.filter(p => p.service_unit_id === currentUserUnitId.value && !p.is_refer_back)
  } else if (filterCareStatus.value === 'referred_out') {
    list = list.filter(p => p.service_unit_id !== currentUserUnitId.value)
  } else if (filterCareStatus.value === 'referred_back') {
    list = list.filter(p => p.is_refer_back)
  }

  // 2. เรียงลำดับ: ในหน่วยงานตนเองขึ้นก่อนเสมอ
  list.sort((a, b) => {
    const aInUnit = a.service_unit_id === currentUserUnitId.value ? 1 : 0
    const bInUnit = b.service_unit_id === currentUserUnitId.value ? 1 : 0
    
    if (aInUnit !== bInUnit) {
      return bInUnit - aInUnit // 1 (in unit) มาก่อน 0 (not in unit)
    }
    // ถ้ากลุ่มเดียวกัน ให้เรียงตาม ID ใหม่ล่าสุดขึ้นก่อน
    return b.id - a.id
  })

  return list
})

const currentDate = ref(new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()))

// ============= Forms =============
const form = reactive({
  cid: '', hn_number: '', prefix: '', first_name: '', last_name: '',
  gender: '', date_of_birth: '', phone: '', email: '', address: '', service_unit_id: '',
  disease_ids: []
})
const resetForm = () => Object.assign(form, {
  cid: '', hn_number: '', prefix: '', first_name: '', last_name: '',
  gender: '', date_of_birth: '', phone: '', email: '', address: '', service_unit_id: '',
  disease_ids: []
})

const editForm = reactive({
  id: null, cid: '', hn_number: '', prefix: '', first_name: '', last_name: '',
  gender: '', date_of_birth: '', phone: '', email: '', address: '', service_unit_id: '',
  disease_ids: []
})

const apptForm = reactive({
  appointment_date: '', appointment_time: '', reason: '', doctor_id: '', status: 'pending'
})
const resetApptForm = () => Object.assign(apptForm, {
  appointment_date: '', appointment_time: '', reason: '', doctor_id: '', status: 'pending'
})

const referralForm = reactive({
  to_service_unit_id: '', referred_by_user_id: '', referral_date: '', referral_time: '', reason: '', appointment_id: null, urgency_level: 'low'
})
const resetReferralForm = () => Object.assign(referralForm, {
  to_service_unit_id: '', referred_by_user_id: '', referral_date: '', referral_time: '', reason: '', appointment_id: null, urgency_level: 'low'
})

// ============= Helpers =============
const genderLabel = (g) => ({ male: 'ชาย', female: 'หญิง', other: 'อื่นๆ' }[g] || '-')
const calcAge = (dob) => {
  if (!dob) return '-'
  return new Date().getFullYear() - new Date(dob).getFullYear()
}
const formatDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
}
const healthBadge = (s) => ({
  normal: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700'
}[s] || 'bg-slate-100 text-slate-600')
const healthLabel = (s) => ({ normal: 'ปกติ', warning: 'ต้องติดตาม', critical: 'วิกฤต' }[s] || s || '-')
const apptStatusClass = (s) => ({
  pending: 'bg-amber-100 text-amber-700', 
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700', 
  noshow: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-red-100 text-red-700'
}[s] || 'bg-slate-100 text-slate-600')
const apptStatusLabel = (s) => ({
  pending: 'รอดำเนินการ', 
  confirmed: 'ยืนยันแล้ว', 
  completed: 'มาตามนัด', 
  noshow: 'ขาดนัด',
  cancelled: 'ยกเลิก'
}[s] || s)

// ============= API =============
const fetchPatients = async (q = '') => {
  isLoading.value = true
  try {
    const token = localStorage.getItem('token')
    const params = q ? `?search=${encodeURIComponent(q)}` : ''
    const res = await fetch(`${API_BASE}/patients${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    patients.value = await res.json()
  } catch (e) { Swal.fire('เกิดข้อผิดพลาด', 'โหลดข้อมูลผู้ป่วยไม่สำเร็จ', 'error') }
  finally { isLoading.value = false }
}

const fetchLookups = async () => {
  const token = localStorage.getItem('token')
  const [su, dr, ds] = await Promise.all([
    fetch(`${API_BASE}/patients/service-units`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()),
    fetch(`${API_BASE}/patients/doctors`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()),
    fetch(`${API_BASE}/patients/diseases`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json())
  ])
  serviceUnits.value = su
  doctors.value = dr
  diseases.value = ds
}

const fetchAppointments = async (patientId) => {
  loadingHistory.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/patients/${patientId}/appointments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    patientAppointments.value = await res.json()
  } catch { Swal.fire('เกิดข้อผิดพลาด', 'โหลดประวัติไม่สำเร็จ', 'error') }
  finally { loadingHistory.value = false }
}

// ============= Patient Actions =============
const openAddModal = () => { 
  resetForm()
  form.service_unit_id = currentUserUnitId.value
  showAddModal.value = true 
}

const handleCreatePatient = async () => {
  if (!form.first_name || !form.last_name) {
    return Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อ และนามสกุล', 'warning')
  }
  isSubmitting.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/patients`, {
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    Swal.fire({ title: 'สำเร็จ!', text: `ลงทะเบียนผู้ป่วยสำเร็จ! HN: ${data.hn_number}`, icon: 'success', timer: 1500, showConfirmButton: false })
    showAddModal.value = false
    await fetchPatients()
  } catch (e) { Swal.fire('เกิดข้อผิดพลาด', e.message, 'error') }
  finally { isSubmitting.value = false }
}

const openEditModal = async (p) => {
  isLoading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/patients/${p.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    
    Object.assign(editForm, {
      id: data.id, cid: data.cid || '', hn_number: data.hn_number, prefix: data.prefix || '',
      first_name: data.first_name, last_name: data.last_name, gender: data.gender,
      date_of_birth: data.date_of_birth ? data.date_of_birth.slice(0, 10) : '',
      phone: data.phone || '', email: data.email || '', address: data.address || '',
      service_unit_id: data.service_unit_id || '',
      disease_ids: data.disease_ids || []
    })
    showEditModal.value = true
  } catch (e) {
    Swal.fire('เกิดข้อผิดพลาด', 'ดึงข้อมูลผู้ป่วยไม่สำเร็จ', 'error')
  } finally {
    isLoading.value = false
  }
}

const handleUpdatePatient = async () => {
  isSubmitting.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/patients/${editForm.id}`, {
      method: 'PUT', 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(editForm)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    Swal.fire({ title: 'สำเร็จ!', text: 'อัปเดตข้อมูลสำเร็จ!', icon: 'success', timer: 1500, showConfirmButton: false })
    showEditModal.value = false
    await fetchPatients()
  } catch (e) { Swal.fire('เกิดข้อผิดพลาด', e.message, 'error') }
  finally { isSubmitting.value = false }
}

const handleDeletePatient = async (p) => {
  const result = await Swal.fire({
    title: 'ยืนยันการลบ',
    text: `คุณต้องการลบผู้ป่วย "${p.first_name} ${p.last_name}" ใช่หรือไม่?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ใช่, ลบเลย',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#d33'
  })
  if (!result.isConfirmed) return

  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/patients/${p.id}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    Swal.fire({ title: 'ลบสำเร็จ!', text: 'ลบผู้ป่วยออกจากระบบแล้ว', icon: 'success', timer: 1500, showConfirmButton: false })
    await fetchPatients()
  } catch (e) { Swal.fire('เกิดข้อผิดพลาด', e.message, 'error') }
}

// ============= Appointment Actions =============
const openAppointmentModal = (p) => {
  selectedPatient.value = p
  editingApptId.value = null
  resetApptForm()
  // ดึง ID เจ้าหน้าที่ที่ Login อยู่มาเป็นค่าเริ่มต้น
  apptForm.doctor_id = currentUserId.value
  showAppointmentModal.value = true
}

const closeAppointmentModal = () => {
  showAppointmentModal.value = false
  editingApptId.value = null
}

const openHistoryModal = async (p) => {
  selectedPatient.value = p
  showHistoryModal.value = true
  await fetchAppointments(p.id)
}

const openAppointmentFromHistory = () => {
  showHistoryModal.value = false
  editingApptId.value = null
  resetApptForm()
  // ดึง ID เจ้าหน้าที่ที่ Login อยู่มาเป็นค่าเริ่มต้น
  apptForm.doctor_id = currentUserId.value
  showAppointmentModal.value = true
}

const openEditAppointment = (appt) => {
  editingApptId.value = appt.id
  Object.assign(apptForm, {
    appointment_date: appt.appointment_date || '',
    appointment_time: appt.appointment_time ? appt.appointment_time.slice(0, 5) : '',
    reason: appt.reason || '',
    doctor_id: appt.doctor_id || '',
    status: appt.status || 'pending'
  })
  showHistoryModal.value = false
  showAppointmentModal.value = true
}

const handleSaveAppointment = async () => {
  if (!apptForm.appointment_date) return Swal.fire('ข้อมูลไม่ครบ', 'กรุณาระบุวันที่นัดหมาย', 'warning')
  isSubmitting.value = true
  const pid = selectedPatient.value.id
  try {
    const token = localStorage.getItem('token')
    let res
    if (editingApptId.value) {
      res = await fetch(`${API_BASE}/patients/${pid}/appointments/${editingApptId.value}`, {
        method: 'PUT', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(apptForm)
      })
    } else {
      res = await fetch(`${API_BASE}/patients/${pid}/appointments`, {
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(apptForm)
      })
    }
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    Swal.fire({ title: 'สำเร็จ!', text: editingApptId.value ? 'แก้ไขการนัดหมายสำเร็จ!' : 'บันทึกการนัดหมายสำเร็จ!', icon: 'success', timer: 1500, showConfirmButton: false })
    closeAppointmentModal()
    // ถ้า history เปิดอยู่ให้ refresh
    if (showHistoryModal.value) await fetchAppointments(pid)
  } catch (e) { Swal.fire('เกิดข้อผิดพลาด', e.message, 'error') }
  finally { isSubmitting.value = false }
}

const handleDeleteAppointment = async (appt) => {
  const result = await Swal.fire({
    title: 'ยืนยันการลบ',
    text: 'คุณต้องการลบการนัดหมายนี้ใช่หรือไม่?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ใช่, ลบเลย',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#d33'
  })
  if (!result.isConfirmed) return

  try {
    const token = localStorage.getItem('token')
    const pid = selectedPatient.value.id
    const res = await fetch(`${API_BASE}/patients/${pid}/appointments/${appt.id}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    Swal.fire({ title: 'ลบสำเร็จ!', text: 'ลบการนัดหมายแล้ว', icon: 'success', timer: 1500, showConfirmButton: false })
    await fetchAppointments(pid)
  } catch (e) { Swal.fire('เกิดข้อผิดพลาด', e.message, 'error') }
}

// ============= Referral Actions =============
const openReferralModal = (p, appt = null) => {
  selectedPatient.value = p
  resetReferralForm()
  
  if (appt) {
    referralForm.appointment_id = appt.id
    referralForm.reason = `[ส่งต่อจากนัดหมายวันที่ ${formatDate(appt.appointment_date)}] ${appt.reason || ''}`
    showHistoryModal.value = false // ปิดหน้าต่างประวัติถ้าเปิดอยู่
  }
  
  showReferralModal.value = true
}

const handleSaveReferral = async () => {
  if (!referralForm.to_service_unit_id || !referralForm.referral_date || !referralForm.reason) {
    return Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน', 'warning')
  }
  isSubmitting.value = true
  const pid = selectedPatient.value.id
  try {
    const token = localStorage.getItem('token')
    const payload = {
      patient_id: pid,
      ...referralForm
    }
    const res = await fetch(`${API_BASE}/referrals`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    Swal.fire({ title: 'สำเร็จ!', text: 'สร้างการส่งตัวสำเร็จ!', icon: 'success', timer: 1500, showConfirmButton: false })
    showReferralModal.value = false
  } catch (e) {
    Swal.fire('เกิดข้อผิดพลาด', e.message, 'error')
  } finally {
    isSubmitting.value = false
  }
}

// Search & Multi-select states for diseases
const diseaseSearchQuery = ref('')
const isDiseaseDropdownOpen = ref(false)
const editDiseaseSearchQuery = ref('')
const isEditDiseaseDropdownOpen = ref(false)

const filteredDiseasesForAdd = computed(() => {
  const query = diseaseSearchQuery.value.trim().toLowerCase()
  return diseases.value.filter(d => {
    const notSelected = !form.disease_ids.includes(d.id)
    if (!query) return notSelected
    const matchName = d.name?.toLowerCase().includes(query)
    const matchIcd = d.icd10_code?.toLowerCase().includes(query)
    return notSelected && (matchName || matchIcd)
  })
})

const filteredDiseasesForEdit = computed(() => {
  const query = editDiseaseSearchQuery.value.trim().toLowerCase()
  return diseases.value.filter(d => {
    const notSelected = !editForm.disease_ids.includes(d.id)
    if (!query) return notSelected
    const matchName = d.name?.toLowerCase().includes(query)
    const matchIcd = d.icd10_code?.toLowerCase().includes(query)
    return notSelected && (matchName || matchIcd)
  })
})

const getDiseaseLabel = (id) => {
  const d = diseases.value.find(item => item.id === id)
  if (!d) return ''
  return d.icd10_code ? `[${d.icd10_code}] ${d.name}` : d.name
}

const selectDiseaseAdd = (id) => {
  form.disease_ids.push(id)
  diseaseSearchQuery.value = ''
  isDiseaseDropdownOpen.value = false
}

const toggleDiseaseAdd = (id) => {
  const idx = form.disease_ids.indexOf(id)
  if (idx !== -1) form.disease_ids.splice(idx, 1)
}

const selectDiseaseEdit = (id) => {
  editForm.disease_ids.push(id)
  editDiseaseSearchQuery.value = ''
  isEditDiseaseDropdownOpen.value = false
}

const toggleDiseaseEdit = (id) => {
  const idx = editForm.disease_ids.indexOf(id)
  if (idx !== -1) editForm.disease_ids.splice(idx, 1)
}

const handleCreateDisease = async () => {
  const { value: formValues } = await Swal.fire({
    title: 'เพิ่มโรคใหม่ / กลุ่มโรค',
    html: `
      <div class="text-left space-y-4 font-sans">
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">รหัส ICD-10 (ถ้ามี)</label>
          <input id="swal-icd10" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:border-[#00685f] focus:ring-1 focus:ring-[#00685f] outline-none transition-all placeholder:text-slate-400" placeholder="เช่น E11, I10" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">ชื่อโรค/กลุ่มโรค <span class="text-rose-500">*</span></label>
          <input id="swal-name" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:border-[#00685f] focus:ring-1 focus:ring-[#00685f] outline-none transition-all placeholder:text-slate-400" placeholder="ระบุชื่อโรคประจำตัว" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">คำอธิบายเพิ่มเติม (ถ้ามี)</label>
          <textarea id="swal-description" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:border-[#00685f] focus:ring-1 focus:ring-[#00685f] outline-none transition-all placeholder:text-slate-400 resize-none h-20" placeholder="ระบุรายละเอียดเพิ่มเติม..."></textarea>
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'บันทึก',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#00685f',
    cancelButtonColor: '#6b7280',
    preConfirm: () => {
      const name = document.getElementById('swal-name').value.trim()
      if (!name) {
        Swal.showValidationMessage('กรุณากรอกชื่อโรค/กลุ่มโรค')
        return false
      }
      return {
        icd10_code: document.getElementById('swal-icd10').value.trim() || null,
        name: name,
        description: document.getElementById('swal-description').value.trim() || null
      }
    }
  })
  
  if (!formValues) return
  
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/patients/diseases`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formValues)
    })
    const newDisease = await res.json()
    if (res.ok) {
      await fetchLookups() // Refresh disease list
      // ถ้าเปิด Modal ไหนอยู่ ให้ติ๊กโรคนั้นให้เลย
      if (showAddModal.value) form.disease_ids.push(newDisease.id)
      if (showEditModal.value) editForm.disease_ids.push(newDisease.id)
      Swal.fire({ title: 'สำเร็จ!', text: 'เพิ่มโรคใหม่สำเร็จ', icon: 'success', timer: 1500, showConfirmButton: false })
    } else {
      throw new Error(newDisease.message || 'บันทึกล้มเหลว')
    }
  } catch (e) {
    Swal.fire('เกิดข้อผิดพลาด', e.message || 'เพิ่มโรคไม่สำเร็จ', 'error')
  }
}
let searchTimer = null
const debouncedSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchPatients(searchQuery.value), 400)
}

// ============= Follow Up & File Upload Helpers =============
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
  followUpForm.patientName = `${patient.first_name} ${patient.last_name}` + (patient.hn_number ? ` (HN: ${patient.hn_number})` : '')
  followUpForm.followUpDate = new Date().toISOString().split('T')[0]
  followUpForm.officerName = userName.value
  followUpForm.location = 'โรงพยาบาล'
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
  followUpForm.patient_id = selectedPatient.value.id
  followUpForm.appointment_id = appointment.id
  followUpForm.patientName = `${selectedPatient.value.first_name} ${selectedPatient.value.last_name}` + (selectedPatient.value.hn_number ? ` (HN: ${selectedPatient.value.hn_number})` : '')
  followUpForm.followUpDate = new Date().toISOString().split('T')[0]
  followUpForm.officerName = userName.value
  followUpForm.location = 'โรงพยาบาล'
  followUpForm.bpSys = ''
  followUpForm.bpDia = ''
  followUpForm.sugar = ''
  followUpForm.weight = ''
  followUpForm.symptoms = appointment.reason || ''
  followUpForm.problems = ''
  followUpForm.advice = ''
  followUpForm.health_status = 'normal'
  followUpForm.needFollowUp = false
  followUpForm.nextAppointment = ''
  
  showHistoryModal.value = false // Close history modal if open
  showFollowUpModal.value = true
}

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
      },
      body: formData
    })

    if (res.ok) {
      if (followUpForm.needFollowUp) {
        await createFollowUpAppointment(token)
      }
      Swal.fire({
        title: 'สำเร็จ!',
        text: 'บันทึกผลการรักษาและติดตามเรียบร้อยแล้ว!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      })
      showFollowUpModal.value = false
      await fetchPatients()
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

// ============= Logout =============
const handleLogout = async () => await navigateTo('/login')

// ============= Init =============
const userName = ref('')

onMounted(async () => {
  // ดึงข้อมูลผู้ใช้จาก localStorage
  try {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      userName.value = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
      currentUserId.value = user.id
      currentUserUnitId.value = user.service_unit_id
    }
  } catch (e) { console.error(e) }

  await Promise.all([fetchPatients(), fetchLookups()])
})
</script>

<style scoped>
.input-style {
  @apply w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none transition-all focus:border-[#00685f] focus:ring-1 focus:ring-[#00685f] placeholder:text-slate-400;
}
.label-style {
  @apply text-xs font-semibold text-slate-600 uppercase tracking-wider block;
}
.overflow-y-auto::-webkit-scrollbar { width: 6px; }
.overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
.overflow-y-auto::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.overflow-y-auto::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>