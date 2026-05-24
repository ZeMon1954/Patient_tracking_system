<template>
  <NuxtLayout name="dashboard">
    <div class="p-8">
        <div class="flex justify-between items-end mb-6">
          <div>
            <h1 class="text-3xl font-bold text-[#1a2b3c] mb-1">รายงานทั้งหมด</h1>
            <p class="text-slate-500 text-sm">Patient Tracking & Healthcare Referral System Reports</p>
          </div>
          <div class="flex gap-3">
            <button @click="handleExport('excel')" class="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all shadow-sm">
              <span class="material-symbols-outlined text-[18px]">download</span>
              Excel
            </button>
            <button @click="handleExport('csv')" class="bg-[#00685f] hover:bg-[#005049] text-white px-4 py-2.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all shadow-sm">
              <span class="material-symbols-outlined text-[18px]">download</span>
              CSV
            </button>
          </div>
        </div>

        <div class="flex gap-2 mb-6 bg-white p-1.5 rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
          <button 
            v-for="(tab, index) in reportTabs" 
            :key="index"
            @click="switchTab(index)"
            :class="[
              'px-6 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              activeTab === index 
                ? 'bg-[#e0efff] text-[#006399]' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            ]"
          >
            {{ tab.name }}
          </button>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-6 mb-8 shadow-sm">
          <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-[#00685f]">filter_list</span>
            ตัวกรองข้อมูล
          </h3>
          
          <!-- Report 1 Filters -->
          <div v-if="activeTab === 0" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">จังหวัด</label>
              <input type="text" placeholder="ระบุจังหวัด" v-model="f1.province" class="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">อำเภอ</label>
              <input type="text" placeholder="ระบุอำเภอ" v-model="f1.district" class="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">หน่วยบริการ</label>
              <div class="relative">
                <select v-model="f1.unit" class="w-full appearance-none bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]">
                  <option value="">ทั้งหมด</option>
                  <option v-for="su in serviceUnits" :key="su.id" :value="su.name">{{ su.name }}</option>
                </select>
                <span class="material-symbols-outlined absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">กลุ่มโรค</label>
              <div class="relative">
                <select v-model="f1.disease" class="w-full appearance-none bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]">
                  <option value="">ทั้งหมด</option>
                  <option v-for="d in diseases" :key="d.id" :value="d.name">{{ d.name }}</option>
                </select>
                <span class="material-symbols-outlined absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">สถานะสุขภาพ</label>
              <div class="relative">
                <select v-model="f1.status" class="w-full appearance-none bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]">
                  <option value="">ทั้งหมด</option>
                  <option value="normal">ปกติ</option>
                  <option value="warning">ต้องติดตาม</option>
                  <option value="critical">วิกฤต</option>
                </select>
                <span class="material-symbols-outlined absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>
          </div>

          <!-- Report 2 Filters -->
          <div v-if="activeTab === 1" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">วันที่เริ่มต้น</label>
              <input type="date" v-model="f2.startDate" class="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">วันที่สิ้นสุด</label>
              <input type="date" v-model="f2.endDate" class="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">หน่วยบริการ</label>
              <div class="relative">
                <select v-model="f2.unit" class="w-full appearance-none bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]">
                  <option value="">ทั้งหมด</option>
                  <option v-for="su in serviceUnits" :key="su.id" :value="su.name">{{ su.name }}</option>
                </select>
                <span class="material-symbols-outlined absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">ประเภทนัดหมาย</label>
              <select v-model="f2.appointmentType" class="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]">
                <option value="">ทั้งหมด</option>
                <option value="ตรวจทั่วไป">ตรวจทั่วไป</option>
                <option value="รับยา">รับยา</option>
                <option value="ตรวจเลือด">ตรวจเลือด</option>
                <option value="ติดตามอาการ">ติดตามอาการ</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">สถานะนัดหมาย</label>
              <select v-model="f2.appointmentStatus" class="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]">
                <option value="">ทั้งหมด</option>
                <option value="pending">รอดำเนินการ</option>
                <option value="confirmed">ยืนยันแล้ว</option>
                <option value="completed">เสร็จสิ้น</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
            </div>
          </div>

          <!-- Report 3 Filters -->
          <div v-if="activeTab === 2" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">วันที่เริ่มต้น</label>
              <input type="date" v-model="f3.startDate" class="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">วันที่สิ้นสุด</label>
              <input type="date" v-model="f3.endDate" class="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">หน่วยบริการ</label>
              <div class="relative">
                <select v-model="f3.unit" class="w-full appearance-none bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]">
                  <option value="">ทั้งหมด</option>
                  <option v-for="su in serviceUnits" :key="su.id" :value="su.name">{{ su.name }}</option>
                </select>
                <span class="material-symbols-outlined absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">กลุ่มโรค</label>
              <div class="relative">
                <select v-model="f3.disease" class="w-full appearance-none bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]">
                  <option value="">ทั้งหมด</option>
                  <option v-for="d in diseases" :key="d.id" :value="d.name">{{ d.name }}</option>
                </select>
                <span class="material-symbols-outlined absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">เจ้าหน้าที่รับผิดชอบ</label>
              <div class="relative">
                <select v-model="f3.staff" class="w-full appearance-none bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]">
                  <option value="">ทั้งหมด</option>
                  <option v-for="s in staffList" :key="s.id" :value="s.full_name">{{ s.full_name }}</option>
                </select>
                <span class="material-symbols-outlined absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>
          </div>

          <!-- Report 4 Filters -->
          <div v-if="activeTab === 3" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">วันที่ส่งต่อ</label>
              <input type="date" v-model="f4.transferDate" class="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">หน่วยบริการต้นทาง</label>
              <div class="relative">
                <select v-model="f4.fromUnit" class="w-full appearance-none bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]">
                  <option value="">ทั้งหมด</option>
                  <option v-for="su in serviceUnits" :key="su.id" :value="su.name">{{ su.name }}</option>
                </select>
                <span class="material-symbols-outlined absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">หน่วยบริการปลายทาง</label>
              <div class="relative">
                <select v-model="f4.toUnit" class="w-full appearance-none bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]">
                  <option value="">ทั้งหมด</option>
                  <option v-for="su in serviceUnits" :key="su.id" :value="su.name">{{ su.name }}</option>
                </select>
                <span class="material-symbols-outlined absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">ระดับความเร่งด่วน</label>
              <select v-model="f4.urgency" class="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]">
                <option value="">ทั้งหมด</option>
                <option value="urgent">ฉุกเฉิน</option>
                <option value="normal">ปกติ</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">สถานะการส่งต่อ</label>
              <select v-model="f4.transferStatus" class="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]">
                <option value="">ทั้งหมด</option>
                <option value="pending">รอรับ</option>
                <option value="accepted">รับแล้ว</option>
                <option value="completed">เสร็จสิ้น</option>
                <option value="rejected">ปฏิเสธ</option>
              </select>
            </div>
          </div>

          <!-- Report 5 Filters -->
          <div v-if="activeTab === 4" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">วันที่ติดตาม</label>
              <input type="date" v-model="f5.followUpDate" class="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">หน่วยบริการ</label>
              <div class="relative">
                <select v-model="f5.unit" class="w-full appearance-none bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]">
                  <option value="">ทั้งหมด</option>
                  <option v-for="su in serviceUnits" :key="su.id" :value="su.name">{{ su.name }}</option>
                </select>
                <span class="material-symbols-outlined absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">เจ้าหน้าที่</label>
              <div class="relative">
                <select v-model="f5.staff" class="w-full appearance-none bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]">
                  <option value="">ทั้งหมด</option>
                  <option v-for="s in staffList" :key="s.id" :value="s.full_name">{{ s.full_name }}</option>
                </select>
                <span class="material-symbols-outlined absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-600">ต้องติดตามซ้ำหรือไม่</label>
              <select v-model="f5.needsFollowUp" class="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00685f]">
                <option value="">ทั้งหมด</option>
                <option value="ใช่">ใช่</option>
                <option value="ไม่">ไม่</option>
              </select>
            </div>
          </div>
          
          <div class="mt-6 flex justify-end gap-3">
            <button @click="resetFilters" class="border border-slate-200 text-slate-600 text-sm font-medium px-5 py-2 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px]">refresh</span>รีเซ็ต
            </button>
            <button @click="fetchReportData" class="bg-[#00685f] text-white text-sm font-medium px-6 py-2 rounded-md hover:bg-[#005049] transition-colors flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">search</span>
              ค้นหา
            </button>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 class="font-bold text-slate-800">ผลการค้นหา</h3>
            <span class="text-sm text-slate-500">พบ {{ currentData.length }} รายการ</span>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm whitespace-nowrap">
              <thead class="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
                <!-- Report 1 Headers -->
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
                <!-- Report 2 Headers -->
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
                <!-- Report 3 Headers -->
                <tr v-if="activeTab === 2">
                  <th class="py-3 px-4">วันที่นัด</th>
                  <th class="py-3 px-4">HN</th>
                  <th class="py-3 px-4">ชื่อผู้ป่วย</th>
                  <th class="py-3 px-4">เบอร์โทร</th>
                  <th class="py-3 px-4">กลุ่มโรค</th>
                  <th class="py-3 px-4">เจ้าหน้าที่รับผิดชอบ</th>
                  <th class="py-3 px-4">หมายเหตุ</th>
                  <th class="py-3 px-4 text-center">จำนวนครั้งที่ผิดนัด</th>
                </tr>
                <!-- Report 4 Headers -->
                <tr v-if="activeTab === 3">
                  <th class="py-3 px-4">วันที่ส่งต่อ</th>
                  <th class="py-3 px-4">ชื่อผู้ป่วย</th>
                  <th class="py-3 px-4">หน่วยบริการต้นทาง</th>
                  <th class="py-3 px-4 text-[#006399]">ต้นทางจากนัดหมาย</th>
                  <th class="py-3 px-4">หน่วยบริการปลายทาง</th>
                  <th class="py-3 px-4">เหตุผลการส่งต่อ</th>
                  <th class="py-3 px-4 text-center">ความเร่งด่วน</th>
                  <th class="py-3 px-4 text-center">สถานะ</th>
                  <th class="py-3 px-4">ผู้ส่งต่อ</th>
                </tr>
                <!-- Report 5 Headers -->
                <tr v-if="activeTab === 4">
                  <th class="py-3 px-4">วันที่ติดตาม</th>
                  <th class="py-3 px-4">ชื่อผู้ป่วย</th>
                  <th class="py-3 px-4">เจ้าหน้าที่ผู้ติดตาม</th>
                  <th class="py-3 px-4">หน่วยบริการ</th>
                  <th class="py-3 px-4">อาการ/สรุป</th>
                  <th class="py-3 px-4 text-center">สถานะสุขภาพ</th>
                  <th class="py-3 px-4 text-center">ต้องติดตามซ้ำ</th>
                  <th class="py-3 px-4">วันติดตามครั้งถัดไป</th>
                </tr>
              </thead>
              
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <!-- Loading State -->
                <tr v-if="loading">
                  <td colspan="9" class="py-12 text-center">
                    <div class="flex flex-col items-center gap-3 text-slate-400">
                      <div class="w-8 h-8 border-4 border-slate-200 border-t-[#00685f] rounded-full animate-spin"></div>
                      <p>กำลังดึงข้อมูล...</p>
                    </div>
                  </td>
                </tr>

                <!-- Report 1 Data -->
                <template v-else-if="activeTab === 0">
                  <tr v-for="(item, index) in currentData" :key="item.hn_number" class="hover:bg-slate-50/50 transition-colors">
                    <td class="py-3 px-4 text-center text-slate-400">{{ index + 1 }}</td>
                    <td class="py-3 px-4 font-mono font-medium text-slate-600">{{ item.hn_number }}</td>
                    <td class="py-3 px-4 font-medium">{{ item.full_name }}</td>
                    <td class="py-3 px-4 text-center">{{ item.gender }}</td>
                    <td class="py-3 px-4 text-center">{{ item.age }}</td>
                    <td class="py-3 px-4 font-mono">{{ item.phone }}</td>
                    <td class="py-3 px-4">{{ item.service_unit_name }}</td>
                    <td class="py-3 px-4">
                      <span class="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-xs font-medium text-slate-700">{{ item.disease_groups }}</span>
                    </td>
                    <td class="py-3 px-4 text-center">
                      <span 
                        class="px-2 py-1 rounded-full text-[10px] font-bold"
                        :class="{
                          'bg-emerald-100 text-emerald-700': item.health_status === 'normal',
                          'bg-amber-100 text-amber-700': item.health_status === 'warning',
                          'bg-rose-100 text-rose-700': item.health_status === 'critical'
                        }"
                      >
                        {{ item.health_status }}
                      </span>
                    </td>
                  </tr>
                </template>

                <!-- Report 2 Data -->
                <template v-else-if="activeTab === 1">
                  <tr v-for="(item, index) in currentData" :key="index" class="hover:bg-slate-50/50 transition-colors">
                    <td class="py-3 px-4">{{ item.appointment_date }}</td>
                    <td class="py-3 px-4 font-mono">{{ item.appointment_time }}</td>
                    <td class="py-3 px-4 font-mono font-medium text-slate-600">{{ item.hn_number }}</td>
                    <td class="py-3 px-4 font-medium">{{ item.patient_name }}</td>
                    <td class="py-3 px-4">{{ item.appointment_type }}</td>
                    <td class="py-3 px-4">{{ item.staff_name }}</td>
                    <td class="py-3 px-4">{{ item.service_unit_name }}</td>
                    <td class="py-3 px-4 text-center">
                      <span class="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">{{ item.status }}</span>
                    </td>
                  </tr>
                </template>

                <!-- Report 3 Data -->
                <template v-else-if="activeTab === 2">
                  <tr v-for="(item, index) in currentData" :key="index" class="hover:bg-slate-50/50 transition-colors">
                    <td class="py-3 px-4">{{ item.appointment_date }}</td>
                    <td class="py-3 px-4 font-mono font-medium text-slate-600">{{ item.hn_number }}</td>
                    <td class="py-3 px-4 font-medium">{{ item.patient_name }}</td>
                    <td class="py-3 px-4 font-mono">{{ item.phone }}</td>
                    <td class="py-3 px-4">{{ item.disease_groups }}</td>
                    <td class="py-3 px-4">{{ item.staff_name }}</td>
                    <td class="py-3 px-4 text-red-500">{{ item.note }}</td>
                    <td class="py-3 px-4 text-center font-bold text-red-600">{{ item.missed_count }}</td>
                  </tr>
                </template>
                
                <!-- Report 4 Data -->
                <template v-else-if="activeTab === 3">
                  <tr v-for="(item, index) in currentData" :key="index" class="hover:bg-slate-50/50 transition-colors">
                    <td class="py-3 px-4">{{ item.referral_date }}</td>
                    <td class="py-3 px-4 font-medium">{{ item.patient_name }}</td>
                    <td class="py-3 px-4">{{ item.from_unit_name }}</td>
                    <td class="py-3 px-4">
                      <div v-if="item.from_appointment_date" class="flex flex-col">
                        <span class="text-xs font-bold text-[#006399]">นัดเมื่อ: {{ item.from_appointment_date }}</span>
                        <span class="text-[10px] text-slate-400 truncate max-w-[150px] italic">{{ item.from_appointment_reason || '-' }}</span>
                      </div>
                      <span v-else class="text-slate-300 text-xs italic">ไม่มีข้อมูลนัดหมาย</span>
                    </td>
                    <td class="py-3 px-4 font-semibold text-[#006399]">{{ item.to_unit_name }}</td>
                    <td class="py-3 px-4 max-w-[200px] truncate" :title="item.reason">{{ item.reason }}</td>
                    <td class="py-3 px-4 text-center">
                      <span v-if="item.urgency_level === 'urgent'" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">ฉุกเฉิน</span>
                      <span v-else class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">ปกติ</span>
                    </td>
                    <td class="py-3 px-4 text-center">
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{{ item.status }}</span>
                    </td>
                    <td class="py-3 px-4 text-slate-500">{{ item.referred_by_name }}</td>
                  </tr>
                </template>
                
                <!-- Report 5 Data -->
                <template v-else-if="activeTab === 4">
                  <tr v-for="(item, index) in currentData" :key="index" class="hover:bg-slate-50/50 transition-colors">
                    <td class="py-3 px-4">{{ item.tracking_date }}</td>
                    <td class="py-3 px-4 font-medium">{{ item.patient_name }}</td>
                    <td class="py-3 px-4">{{ item.staff_name || '-' }}</td>
                    <td class="py-3 px-4">{{ item.service_unit_name || '-' }}</td>
                    <td class="py-3 px-4 text-xs text-slate-500">{{ item.symptoms_detail || '-' }}</td>
                    <td class="py-3 px-4 text-center">
                      <span class="px-2 py-0.5 rounded-full text-xs font-bold"
                        :class="{ 'bg-emerald-100 text-emerald-700': item.health_status === 'normal', 'bg-amber-100 text-amber-700': item.health_status === 'warning', 'bg-rose-100 text-rose-700': item.health_status === 'critical' }">
                        {{ item.health_status === 'normal' ? 'ปกติ' : item.health_status === 'warning' ? 'ต้องติดตาม' : item.health_status === 'critical' ? 'วิกฤต' : item.health_status }}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-center">
                      <span :class="item.needs_follow_up === 'ใช่' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'" class="px-2 py-0.5 rounded-full text-xs font-bold">{{ item.needs_follow_up }}</span>
                    </td>
                    <td class="py-3 px-4 text-[#00685f] font-medium text-xs">{{ item.next_tracking_date }}</td>
                  </tr>
                </template>
                
                <tr v-if="!loading && currentData.length === 0" class="hover:bg-slate-50/50 transition-colors">
                  <td class="py-8 px-4 text-center text-slate-500" colspan="9">ไม่พบข้อมูล</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div class="text-sm text-slate-500">
              แสดง 1 ถึง {{ currentData.length }} จาก {{ currentData.length }} รายการ
            </div>
            <div class="flex items-center gap-1 font-medium">
              <button class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 transition-colors disabled:opacity-50" disabled>
                <span class="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button class="w-8 h-8 flex items-center justify-center rounded bg-[#00685f] text-white">1</button>
              <button class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 transition-colors disabled:opacity-50" disabled>
                <span class="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import Swal from 'sweetalert2'

const config = useRuntimeConfig()
const API_BASE = `${config.public.apiBase}/api`

const activeTab = ref(0)
const loading = ref(false)
const loadError = ref('')

const reportTabs = [
  { name: 'รายงานที่ 1: ผู้ป่วยตามกลุ่มโรค' },
  { name: 'รายงานที่ 2: นัดหมายผู้ป่วย' },
  { name: 'รายงานที่ 3: ไม่มาตามนัด' },
  { name: 'รายงานที่ 4: การส่งต่อ' },
  { name: 'รายงานที่ 5: ผลการติดตาม' }
]

// filter แยกต่อ tab เพื่อไม่ให้ค่าปนกัน
const f1 = reactive({ province: '', district: '', unit: '', disease: '', status: '' })
const f2 = reactive({ startDate: '', endDate: '', unit: '', appointmentType: '', appointmentStatus: '' })
const f3 = reactive({ startDate: '', endDate: '', unit: '', disease: '', staff: '' })
const f4 = reactive({ transferDate: '', fromUnit: '', toUnit: '', urgency: '', transferStatus: '' })
const f5 = reactive({ followUpDate: '', unit: '', staff: '', needsFollowUp: '' })

const serviceUnits = ref([])
const diseases = ref([])
const staffList = ref([])
const reportData = ref([[], [], [], [], []])
const currentData = computed(() => reportData.value[activeTab.value] || [])

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

const fetchMetadata = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/reports/metadata`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      serviceUnits.value = data.serviceUnits || []
      diseases.value = data.diseases || []
      staffList.value = data.staff || []
    }
  } catch (err) {
    console.error('fetchMetadata error:', err)
  }
}

const fetchReportData = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/reports/${activeTab.value + 1}?${buildParams()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ')
    reportData.value[activeTab.value] = await res.json()
  } catch (err) {
    loadError.value = err.message
    Swal.fire('เกิดข้อผิดพลาด', err.message, 'error')
  } finally {
    loading.value = false
  }
}

const switchTab = (i) => {
  activeTab.value = i
  fetchReportData()
}

const resetFilters = () => {
  Object.assign(f1, { province: '', district: '', unit: '', disease: '', status: '' })
  Object.assign(f2, { startDate: '', endDate: '', unit: '', appointmentType: '', appointmentStatus: '' })
  Object.assign(f3, { startDate: '', endDate: '', unit: '', disease: '', staff: '' })
  Object.assign(f4, { transferDate: '', fromUnit: '', toUnit: '', urgency: '', transferStatus: '' })
  Object.assign(f5, { followUpDate: '', unit: '', staff: '', needsFollowUp: '' })
  fetchReportData()
}

const handleExport = async (type) => {
  try {
    const token = localStorage.getItem('token')
    const exportUrl = `${API_BASE}/reports/${activeTab.value + 1}?${buildParams()}&export=true`
    const response = await fetch(exportUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report_${activeTab.value + 1}_${new Date().getTime()}.${type}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } else {
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถส่งออกข้อมูลได้', 'error')
    }
  } catch (err) {
    Swal.fire('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการส่งออกข้อมูล', 'error')
  }
}

onMounted(() => {
  fetchMetadata()
  fetchReportData()
})
</script>

<style scoped>
/* การตั้งค่า Font Icon Material Symbols */
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