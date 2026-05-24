<template>
  <NuxtLayout name="dashboard">
    <div class="p-4 sm:p-6 md:p-8">

        <!-- Page Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-[#1a2b3c] mb-1">รายงานทั้งหมด</h1>
            <p class="text-slate-500 text-sm">Patient Tracking &amp; Healthcare Referral System Reports</p>
          </div>
          <div class="flex gap-3 w-full sm:w-auto">
            <button @click="exportExcel" :disabled="currentData.length === 0"
              class="flex-1 sm:flex-none justify-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-md text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <span class="material-symbols-outlined text-[18px] text-green-600">grid_on</span>
              Excel
            </button>
            <button @click="exportCSV" :disabled="currentData.length === 0"
              class="flex-1 sm:flex-none justify-center bg-[#00685f] hover:bg-[#005049] text-white px-4 py-2.5 rounded-md text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <span class="material-symbols-outlined text-[18px]">download</span>
              CSV
            </button>
          </div>
        </div>

        <!-- Tab Bar -->
        <div class="flex gap-2 mb-6 bg-white p-1.5 rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
          <button v-for="(tab, i) in reportTabs" :key="i" @click="switchTab(i)"
            :class="['px-5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              activeTab === i ? 'bg-[#e0efff] text-[#006399]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700']">
            {{ tab.name }}
          </button>
        </div>

        <!-- Filter Panel -->
        <div class="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
          <h3 class="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-[#00685f] text-[18px]">filter_list</span>
            ตัวกรองข้อมูล
          </h3>

          <!-- Report 1 Filters -->
          <div v-if="activeTab === 0" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">จังหวัด</label>
              <input v-model="f1.province" type="text" placeholder="ระบุจังหวัด" class="filter-input" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">อำเภอ</label>
              <input v-model="f1.district" type="text" placeholder="ระบุอำเภอ" class="filter-input" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">หน่วยบริการ</label>
              <input v-model="f1.unit" type="text" placeholder="ชื่อหน่วยบริการ" class="filter-input" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">กลุ่มโรค</label>
              <input v-model="f1.disease" type="text" placeholder="เช่น เบาหวาน" class="filter-input" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">สถานะผู้ป่วย</label>
              <div class="relative">
                <select v-model="f1.status" class="filter-select">
                  <option value="">ทั้งหมด</option>
                  <option value="normal">ปกติ</option>
                  <option value="warning">ต้องติดตาม</option>
                  <option value="critical">วิกฤต</option>
                </select>
                <span class="material-symbols-outlined abs-icon">expand_more</span>
              </div>
            </div>
          </div>

          <!-- Report 2 Filters -->
          <div v-if="activeTab === 1" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">วันที่เริ่มต้น</label>
              <input v-model="f2.startDate" type="date" class="filter-input" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">วันที่สิ้นสุด</label>
              <input v-model="f2.endDate" type="date" class="filter-input" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">หน่วยบริการ</label>
              <input v-model="f2.unit" type="text" placeholder="ชื่อหน่วยบริการ" class="filter-input" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">ประเภทนัดหมาย</label>
              <div class="relative">
                <select v-model="f2.appointmentType" class="filter-select">
                  <option value="">ทั้งหมด</option>
                  <option value="ตรวจทั่วไป">ตรวจทั่วไป</option>
                  <option value="รับยา">รับยา</option>
                  <option value="ตรวจเลือด">ตรวจเลือด</option>
                  <option value="ติดตามอาการ">ติดตามอาการ</option>
                </select>
                <span class="material-symbols-outlined abs-icon">expand_more</span>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">สถานะนัดหมาย</label>
              <div class="relative">
                <select v-model="f2.appointmentStatus" class="filter-select">
                  <option value="">ทั้งหมด</option>
                  <option value="pending">รอดำเนินการ</option>
                  <option value="confirmed">ยืนยันแล้ว</option>
                  <option value="completed">เสร็จสิ้น</option>
                  <option value="cancelled">ยกเลิก</option>
                </select>
                <span class="material-symbols-outlined abs-icon">expand_more</span>
              </div>
            </div>
          </div>

          <!-- Report 3 Filters -->
          <div v-if="activeTab === 2" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">วันที่เริ่มต้น</label>
              <input v-model="f3.startDate" type="date" class="filter-input" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">วันที่สิ้นสุด</label>
              <input v-model="f3.endDate" type="date" class="filter-input" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">หน่วยบริการ</label>
              <input v-model="f3.unit" type="text" placeholder="ชื่อหน่วยบริการ" class="filter-input" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">กลุ่มโรค</label>
              <input v-model="f3.disease" type="text" placeholder="เช่น เบาหวาน" class="filter-input" />
            </div>
            <div class="space-y-1 md:col-span-2 lg:col-span-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">เจ้าหน้าที่รับผิดชอบ</label>
              <input v-model="f3.staff" type="text" placeholder="ชื่อเจ้าหน้าที่" class="filter-input" />
            </div>
          </div>

          <!-- Report 4 Filters -->
          <div v-if="activeTab === 3" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">วันที่ส่งต่อ</label>
              <input v-model="f4.transferDate" type="date" class="filter-input" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">หน่วยบริการต้นทาง</label>
              <input v-model="f4.fromUnit" type="text" placeholder="ต้นทาง" class="filter-input" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">หน่วยบริการปลายทาง</label>
              <input v-model="f4.toUnit" type="text" placeholder="ปลายทาง" class="filter-input" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">ระดับความเร่งด่วน</label>
              <div class="relative">
                <select v-model="f4.urgency" class="filter-select">
                  <option value="">ทั้งหมด</option>
                  <option value="ฉุกเฉิน">ฉุกเฉิน</option>
                  <option value="ปกติ">ปกติ</option>
                </select>
                <span class="material-symbols-outlined abs-icon">expand_more</span>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">สถานะการส่งต่อ</label>
              <div class="relative">
                <select v-model="f4.transferStatus" class="filter-select">
                  <option value="">ทั้งหมด</option>
                  <option value="pending">รอรับ</option>
                  <option value="accepted">รับแล้ว</option>
                  <option value="completed">เสร็จสิ้น</option>
                  <option value="rejected">ปฏิเสธ</option>
                </select>
                <span class="material-symbols-outlined abs-icon">expand_more</span>
              </div>
            </div>
          </div>

          <!-- Report 5 Filters -->
          <div v-if="activeTab === 4" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">วันที่ติดตาม</label>
              <input v-model="f5.followUpDate" type="date" class="filter-input" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">หน่วยบริการ</label>
              <input v-model="f5.unit" type="text" placeholder="ชื่อหน่วยบริการ" class="filter-input" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">เจ้าหน้าที่</label>
              <input v-model="f5.staff" type="text" placeholder="ชื่อเจ้าหน้าที่" class="filter-input" />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase">ต้องติดตามซ้ำ</label>
              <div class="relative">
                <select v-model="f5.needsFollowUp" class="filter-select">
                  <option value="">ทั้งหมด</option>
                  <option value="ใช่">ใช่</option>
                  <option value="ไม่">ไม่</option>
                </select>
                <span class="material-symbols-outlined abs-icon">expand_more</span>
              </div>
            </div>
          </div>

          <div class="mt-5 flex justify-end gap-3">
            <button @click="resetFilters" class="border border-slate-200 text-slate-600 text-sm font-medium px-5 py-2 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px]">refresh</span>รีเซ็ต
            </button>
            <button @click="fetchData" :disabled="isLoading" class="bg-[#00685f] text-white text-sm font-medium px-6 py-2 rounded-md hover:bg-[#005049] transition-colors flex items-center gap-2 disabled:opacity-60">
              <span class="material-symbols-outlined text-[16px]">search</span>ค้นหา
            </button>
          </div>
        </div>

        <!-- Result Table -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <h3 class="font-bold text-slate-800">ผลการค้นหา — {{ reportTabs[activeTab].name }}</h3>
            <span class="text-sm text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full">
              พบ <span class="font-bold text-slate-700">{{ currentData.length }}</span> รายการ
            </span>
          </div>

          <div class="overflow-x-auto">
            <div v-if="isLoading" class="flex items-center justify-center py-16">
              <div class="flex flex-col items-center gap-3 text-slate-400">
                <div class="w-8 h-8 border-4 border-slate-200 border-t-[#00685f] rounded-full animate-spin"></div>
                <span class="text-sm">กำลังโหลดข้อมูล...</span>
              </div>
            </div>
            <div v-else-if="loadError" class="flex items-center justify-center py-16">
              <div class="flex flex-col items-center gap-3 text-red-400">
                <span class="material-symbols-outlined text-4xl">error</span>
                <span class="text-sm">{{ loadError }}</span>
                <button @click="fetchData" class="text-xs text-[#00685f] underline">ลองใหม่</button>
              </div>
            </div>
            <div v-else-if="currentData.length === 0" class="flex items-center justify-center py-16">
              <div class="flex flex-col items-center gap-3 text-slate-400">
                <span class="material-symbols-outlined text-4xl">search_off</span>
                <span class="text-sm">ไม่พบข้อมูล</span>
              </div>
            </div>

            <table v-else class="w-full text-left text-sm whitespace-nowrap">
              <thead class="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">

                <tr v-if="activeTab === 0">
                  <th class="py-3 px-4 text-center">ลำดับ</th>
                  <th class="py-3 px-4">HN</th>
                  <th class="py-3 px-4">ชื่อ-นามสกุล</th>
                  <th class="py-3 px-4 text-center">เพศ</th>
                  <th class="py-3 px-4 text-center">อายุ</th>
                  <th class="py-3 px-4">เบอร์โทร</th>
                  <th class="py-3 px-4">หน่วยบริการหลัก</th>
                  <th class="py-3 px-4">กลุ่มโรค</th>
                  <th class="py-3 px-4 text-center">สถานะผู้ป่วย</th>
                </tr>
                <tr v-if="activeTab === 1">
                  <th class="py-3 px-4">วันที่นัด</th>
                  <th class="py-3 px-4">เวลา</th>
                  <th class="py-3 px-4">HN</th>
                  <th class="py-3 px-4">ชื่อผู้ป่วย</th>
                  <th class="py-3 px-4">ประเภทนัดหมาย</th>
                  <th class="py-3 px-4">เจ้าหน้าที่รับผิดชอบ</th>
                  <th class="py-3 px-4">หน่วยบริการ</th>
                  <th class="py-3 px-4 text-center">สถานะ</th>
                </tr>
                <tr v-if="activeTab === 2">
                  <th class="py-3 px-4 text-center">ลำดับ</th>
                  <th class="py-3 px-4">วันที่นัด</th>
                  <th class="py-3 px-4">HN</th>
                  <th class="py-3 px-4">ชื่อผู้ป่วย</th>
                  <th class="py-3 px-4">เบอร์โทร</th>
                  <th class="py-3 px-4">กลุ่มโรค</th>
                  <th class="py-3 px-4">เจ้าหน้าที่รับผิดชอบ</th>
                  <th class="py-3 px-4">หมายเหตุ</th>
                  <th class="py-3 px-4 text-center">ครั้งที่ไม่มาสะสม</th>
                </tr>
                <tr v-if="activeTab === 3">
                  <th class="py-3 px-4">วันที่ส่งต่อ</th>
                  <th class="py-3 px-4">HN</th>
                  <th class="py-3 px-4">ชื่อผู้ป่วย</th>
                  <th class="py-3 px-4">หน่วยต้นทาง</th>
                  <th class="py-3 px-4">หน่วยปลายทาง</th>
                  <th class="py-3 px-4">เหตุผล</th>
                  <th class="py-3 px-4 text-center">ความเร่งด่วน</th>
                  <th class="py-3 px-4 text-center">สถานะ</th>
                  <th class="py-3 px-4">ผู้ส่งต่อ</th>
                </tr>
                <tr v-if="activeTab === 4">
                  <th class="py-3 px-4 text-center">ลำดับ</th>
                  <th class="py-3 px-4">วันที่ติดตาม</th>
                  <th class="py-3 px-4">HN</th>
                  <th class="py-3 px-4">ชื่อผู้ป่วย</th>
                  <th class="py-3 px-4">เจ้าหน้าที่ผู้ติดตาม</th>
                  <th class="py-3 px-4">หน่วยบริการ</th>
                  <th class="py-3 px-4">อาการ/สรุป</th>
                  <th class="py-3 px-4 text-center">สุขภาพ</th>
                  <th class="py-3 px-4 text-center">ต้องติดตามซ้ำ</th>
                  <th class="py-3 px-4">วันติดตามครั้งถัดไป</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-slate-100 text-slate-700">

                <!-- Report 1 -->
                <template v-if="activeTab === 0">
                  <tr v-for="(r, i) in currentData" :key="r.id" class="hover:bg-slate-50/60 transition-colors">
                    <td class="py-3 px-4 text-center text-slate-400 text-xs">{{ i + 1 }}</td>
                    <td class="py-3 px-4 font-mono font-medium text-slate-600 text-xs">{{ r.hn_number }}</td>
                    <td class="py-3 px-4 font-semibold">{{ r.full_name }}</td>
                    <td class="py-3 px-4 text-center">
                      <span :class="r.gender === 'male' ? 'bg-blue-100 text-blue-700' : r.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-600'"
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                        {{ r.gender === 'male' ? 'ชาย' : r.gender === 'female' ? 'หญิง' : 'อื่นๆ' }}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-center">{{ r.age }} ปี</td>
                    <td class="py-3 px-4 font-mono text-xs">{{ r.phone }}</td>
                    <td class="py-3 px-4">{{ r.service_unit_name || '-' }}</td>
                    <td class="py-3 px-4">
                      <span class="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-xs font-medium text-slate-700">{{ r.disease_groups || '-' }}</span>
                    </td>
                    <td class="py-3 px-4 text-center">
                      <span :class="healthClass(r.health_status)" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                        {{ healthLabel(r.health_status) }}
                      </span>
                    </td>
                  </tr>
                </template>

                <!-- Report 2 -->
                <template v-if="activeTab === 1">
                  <tr v-for="(r, i) in currentData" :key="i" class="hover:bg-slate-50/60 transition-colors">
                    <td class="py-3 px-4">{{ formatDate(r.appointment_date) }}</td>
                    <td class="py-3 px-4 text-slate-500 font-mono text-xs">{{ r.appointment_time ? r.appointment_time.slice(0,5) : '-' }}</td>
                    <td class="py-3 px-4 font-mono font-medium text-slate-600 text-xs">{{ r.hn_number }}</td>
                    <td class="py-3 px-4 font-semibold">{{ r.patient_name }}</td>
                    <td class="py-3 px-4">{{ r.appointment_type }}</td>
                    <td class="py-3 px-4">{{ r.staff_name || '-' }}</td>
                    <td class="py-3 px-4">{{ r.service_unit_name || '-' }}</td>
                    <td class="py-3 px-4 text-center">
                      <span :class="apptStatusClass(r.status)" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                        {{ apptStatusLabel(r.status) }}
                      </span>
                    </td>
                  </tr>
                </template>

                <!-- Report 3 -->
                <template v-if="activeTab === 2">
                  <tr v-for="(r, i) in currentData" :key="i" class="hover:bg-slate-50/60 transition-colors">
                    <td class="py-3 px-4 text-center text-slate-400 text-xs">{{ i + 1 }}</td>
                    <td class="py-3 px-4">{{ formatDate(r.appointment_date) }}</td>
                    <td class="py-3 px-4 font-mono font-medium text-slate-600 text-xs">{{ r.hn_number }}</td>
                    <td class="py-3 px-4 font-semibold">{{ r.patient_name }}</td>
                    <td class="py-3 px-4 font-mono text-xs">{{ r.phone }}</td>
                    <td class="py-3 px-4">
                      <span class="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-xs font-medium text-slate-700">{{ r.disease_groups || '-' }}</span>
                    </td>
                    <td class="py-3 px-4">{{ r.staff_name || '-' }}</td>
                    <td class="py-3 px-4 text-slate-500 text-xs">{{ r.note || '-' }}</td>
                    <td class="py-3 px-4 text-center font-bold text-red-600">{{ r.missed_count }}</td>
                  </tr>
                </template>

                <!-- Report 4 -->
                <template v-if="activeTab === 3">
                  <tr v-for="(r, i) in currentData" :key="i" class="hover:bg-slate-50/60 transition-colors">
                    <td class="py-3 px-4">{{ formatDate(r.referral_date) }}</td>
                    <td class="py-3 px-4 font-mono font-medium text-slate-600 text-xs">{{ r.hn_number }}</td>
                    <td class="py-3 px-4 font-semibold">{{ r.patient_name }}</td>
                    <td class="py-3 px-4">{{ r.from_unit_name || '-' }}</td>
                    <td class="py-3 px-4 font-semibold text-[#006399]">{{ r.to_unit_name || '-' }}</td>
                    <td class="py-3 px-4 text-slate-500 max-w-[180px] truncate text-xs">{{ r.reason }}</td>
                    <td class="py-3 px-4 text-center">
                      <span :class="r.urgency_level === 'ฉุกเฉิน' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'"
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                        {{ r.urgency_level }}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-center">
                      <span :class="referralStatusClass(r.status)" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                        {{ referralStatusLabel(r.status) }}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-slate-500">{{ r.referred_by_name || '-' }}</td>
                  </tr>
                </template>

                <!-- Report 5 -->
                <template v-if="activeTab === 4">
                  <tr v-for="(r, i) in currentData" :key="i" class="hover:bg-slate-50/60 transition-colors">
                    <td class="py-3 px-4 text-center text-slate-400 text-xs">{{ i + 1 }}</td>
                    <td class="py-3 px-4">{{ formatDate(r.tracking_date) }}</td>
                    <td class="py-3 px-4 font-mono font-medium text-slate-600 text-xs">{{ r.hn_number }}</td>
                    <td class="py-3 px-4 font-semibold">{{ r.patient_name }}</td>
                    <td class="py-3 px-4">{{ r.staff_name || '-' }}</td>
                    <td class="py-3 px-4">{{ r.service_unit_name || '-' }}</td>
                    <td class="py-3 px-4 text-slate-500 max-w-[200px] truncate text-xs">{{ r.symptoms_detail || '-' }}</td>
                    <td class="py-3 px-4 text-center">
                      <span :class="healthClass(r.health_status)" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                        {{ healthLabel(r.health_status) }}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-center">
                      <span :class="r.needs_follow_up === 'ใช่' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'"
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                        {{ r.needs_follow_up }}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-[#00685f] font-medium text-xs">{{ formatDate(r.next_tracking_date) }}</td>
                  </tr>
                </template>

              </tbody>
            </table>
          </div>

          <div v-if="!isLoading && currentData.length > 0" class="px-6 py-3 border-t border-slate-200 bg-slate-50/50 flex justify-between items-center text-sm text-slate-500">
            <span>แสดง <span class="font-semibold text-slate-700">{{ currentData.length }}</span> รายการ</span>
            <span class="text-xs">อัปเดต: {{ lastUpdated }}</span>
          </div>
        </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'

const config = useRuntimeConfig()
const API_BASE = `${config.public.apiBase}/api`

const activeTab = ref(0)
const isLoading = ref(false)
const loadError = ref('')
const lastUpdated = ref('')

const reportTabs = [
  { name: 'รายงานที่ 1: ผู้ป่วยตามกลุ่มโรค' },
  { name: 'รายงานที่ 2: นัดหมายผู้ป่วย' },
  { name: 'รายงานที่ 3: ไม่มาตามนัด' },
  { name: 'รายงานที่ 4: การส่งต่อ' },
  { name: 'รายงานที่ 5: ผลการติดตาม' },
]

const reportData = ref([[], [], [], [], []])
const currentData = computed(() => reportData.value[activeTab.value] || [])

// Per-tab filters
const f1 = reactive({ province: '', district: '', unit: '', disease: '', status: '' })
const f2 = reactive({ startDate: '', endDate: '', unit: '', appointmentType: '', appointmentStatus: '' })
const f3 = reactive({ startDate: '', endDate: '', unit: '', disease: '', staff: '' })
const f4 = reactive({ transferDate: '', fromUnit: '', toUnit: '', urgency: '', transferStatus: '' })
const f5 = reactive({ followUpDate: '', unit: '', staff: '', needsFollowUp: '' })

// ============= Helpers =============
const formatDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
}

const healthClass = (s) => ({
  normal: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
}[s] || 'bg-slate-100 text-slate-600')

const healthLabel = (s) => ({ normal: 'ปกติ', warning: 'ต้องติดตาม', critical: 'วิกฤต' }[s] || s || '-')

const apptStatusClass = (s) => ({
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}[s] || 'bg-slate-100 text-slate-600')

const apptStatusLabel = (s) => ({
  pending: 'รอดำเนินการ', confirmed: 'ยืนยันแล้ว', completed: 'เสร็จสิ้น', cancelled: 'ยกเลิก'
}[s] || s || '-')

const referralStatusClass = (s) => ({
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}[s] || 'bg-slate-100 text-slate-600')

const referralStatusLabel = (s) => ({
  pending: 'รอรับ', accepted: 'รับแล้ว', completed: 'เสร็จสิ้น', rejected: 'ปฏิเสธ'
}[s] || s || '-')

// ============= Fetch =============
const buildParams = () => {
  const tab = activeTab.value
  const p = new URLSearchParams()
  if (tab === 0) {
    if (f1.province) p.set('province', f1.province)
    if (f1.district) p.set('district', f1.district)
    if (f1.unit) p.set('unit', f1.unit)
    if (f1.disease) p.set('disease', f1.disease)
    if (f1.status) p.set('status', f1.status)
  } else if (tab === 1) {
    if (f2.startDate) p.set('startDate', f2.startDate)
    if (f2.endDate) p.set('endDate', f2.endDate)
    if (f2.unit) p.set('unit', f2.unit)
    if (f2.appointmentType) p.set('appointmentType', f2.appointmentType)
    if (f2.appointmentStatus) p.set('appointmentStatus', f2.appointmentStatus)
  } else if (tab === 2) {
    if (f3.startDate) p.set('startDate', f3.startDate)
    if (f3.endDate) p.set('endDate', f3.endDate)
    if (f3.unit) p.set('unit', f3.unit)
    if (f3.disease) p.set('disease', f3.disease)
    if (f3.staff) p.set('staff', f3.staff)
  } else if (tab === 3) {
    if (f4.transferDate) p.set('transferDate', f4.transferDate)
    if (f4.fromUnit) p.set('fromUnit', f4.fromUnit)
    if (f4.toUnit) p.set('toUnit', f4.toUnit)
    if (f4.urgency) p.set('urgency', f4.urgency)
    if (f4.transferStatus) p.set('transferStatus', f4.transferStatus)
  } else if (tab === 4) {
    if (f5.followUpDate) p.set('followUpDate', f5.followUpDate)
    if (f5.unit) p.set('unit', f5.unit)
    if (f5.staff) p.set('staff', f5.staff)
    if (f5.needsFollowUp) p.set('needsFollowUp', f5.needsFollowUp)
  }
  return p.toString()
}

const fetchData = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/reports/${activeTab.value + 1}?${buildParams()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ')
    reportData.value[activeTab.value] = await res.json()
    lastUpdated.value = new Date().toLocaleTimeString('th-TH')
  } catch (err) {
    loadError.value = err.message
  } finally {
    isLoading.value = false
  }
}

const switchTab = (i) => {
  activeTab.value = i
  resetFilters()
  fetchData()
}

const resetFilters = () => {
  Object.assign(f1, { province: '', district: '', unit: '', disease: '', status: '' })
  Object.assign(f2, { startDate: '', endDate: '', unit: '', appointmentType: '', appointmentStatus: '' })
  Object.assign(f3, { startDate: '', endDate: '', unit: '', disease: '', staff: '' })
  Object.assign(f4, { transferDate: '', fromUnit: '', toUnit: '', urgency: '', transferStatus: '' })
  Object.assign(f5, { followUpDate: '', unit: '', staff: '', needsFollowUp: '' })
}

// ============= Export =============
const getFileName = () => {
  const names = ['ผู้ป่วยตามกลุ่มโรค', 'นัดหมายผู้ป่วย', 'ไม่มาตามนัด', 'การส่งต่อ', 'ผลการติดตาม']
  return `รายงานที่${activeTab.value + 1}_${names[activeTab.value]}_${new Date().toISOString().slice(0, 10)}`
}

const getExportRows = () => {
  const tab = activeTab.value
  const data = currentData.value
  if (tab === 0) return [
    ['ลำดับ', 'HN', 'ชื่อ-นามสกุล', 'เพศ', 'อายุ', 'เบอร์โทร', 'หน่วยบริการหลัก', 'กลุ่มโรค', 'สถานะผู้ป่วย'],
    ...data.map((r, i) => [i + 1, r.hn_number, r.full_name,
      r.gender === 'male' ? 'ชาย' : r.gender === 'female' ? 'หญิง' : 'อื่นๆ',
      r.age, r.phone, r.service_unit_name || '-', r.disease_groups || '-', healthLabel(r.health_status)])
  ]
  if (tab === 1) return [
    ['วันที่นัด', 'เวลา', 'HN', 'ชื่อผู้ป่วย', 'ประเภทนัดหมาย', 'เจ้าหน้าที่รับผิดชอบ', 'หน่วยบริการ', 'สถานะ'],
    ...data.map(r => [formatDate(r.appointment_date), r.appointment_time?.slice(0, 5) || '-',
      r.hn_number, r.patient_name, r.appointment_type, r.staff_name || '-',
      r.service_unit_name || '-', apptStatusLabel(r.status)])
  ]
  if (tab === 2) return [
    ['ลำดับ', 'วันที่นัด', 'HN', 'ชื่อผู้ป่วย', 'เบอร์โทร', 'กลุ่มโรค', 'เจ้าหน้าที่รับผิดชอบ', 'หมายเหตุ', 'ครั้งที่ไม่มาสะสม'],
    ...data.map((r, i) => [i + 1, formatDate(r.appointment_date), r.hn_number, r.patient_name,
      r.phone, r.disease_groups || '-', r.staff_name || '-', r.note || '-', r.missed_count])
  ]
  if (tab === 3) return [
    ['วันที่ส่งต่อ', 'HN', 'ชื่อผู้ป่วย', 'หน่วยต้นทาง', 'หน่วยปลายทาง', 'เหตุผล', 'ความเร่งด่วน', 'สถานะ', 'ผู้ส่งต่อ'],
    ...data.map(r => [formatDate(r.referral_date), r.hn_number, r.patient_name,
      r.from_unit_name || '-', r.to_unit_name || '-', r.reason, r.urgency_level,
      referralStatusLabel(r.status), r.referred_by_name || '-'])
  ]
  if (tab === 4) return [
    ['ลำดับ', 'วันที่ติดตาม', 'HN', 'ชื่อผู้ป่วย', 'เจ้าหน้าที่', 'หน่วยบริการ', 'อาการ/สรุป', 'สุขภาพ', 'ต้องติดตามซ้ำ', 'วันติดตามครั้งถัดไป'],
    ...data.map((r, i) => [i + 1, formatDate(r.tracking_date), r.hn_number, r.patient_name,
      r.staff_name || '-', r.service_unit_name || '-', r.symptoms_detail || '-',
      healthLabel(r.health_status), r.needs_follow_up, formatDate(r.next_tracking_date)])
  ]
  return []
}

const exportExcel = () => {
  const rows = getExportRows()
  if (!rows.length) return
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = rows[0].map((_, ci) =>
    ({ wch: Math.min(Math.max(...rows.map(r => String(r[ci] ?? '').length)) + 4, 50) })
  )
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `รายงานที่${activeTab.value + 1}`)
  XLSX.writeFile(wb, `${getFileName()}.xlsx`)
}

const exportCSV = () => {
  const rows = getExportRows()
  if (!rows.length) return
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${getFileName()}.csv`
  a.click()
}

const handleLogout = async (path) => await navigateTo(path)

onMounted(() => fetchData())
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

.filter-input {
  @apply w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f];
}

.filter-select {
  @apply w-full appearance-none bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f];
}

.abs-icon {
  @apply absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px];
}

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>