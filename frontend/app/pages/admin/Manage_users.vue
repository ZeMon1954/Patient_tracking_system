<template>
  <NuxtLayout name="dashboard">
    <div class="p-4 sm:p-6 md:p-8">
        <!-- Header + Add Button -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">จัดการผู้ใช้งาน</h1>
            <p class="text-slate-500 text-sm">ระบบจัดการบัญชีผู้ใช้งาน</p>
          </div>
          <button
            @click="openAddModal"
            class="w-full sm:w-auto bg-[#00685f] hover:bg-[#005049] text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <span class="material-symbols-outlined text-[18px]">add</span>
            เพิ่มผู้ใช้งานใหม่
          </button>
        </div>

        <!-- Filter Bar -->
        <div
          class="bg-white p-4 rounded-t-xl border border-slate-200 flex flex-wrap justify-between items-center gap-4 border-b-0"
        >
          <div class="relative flex-1 min-w-[250px] max-w-md">
            <span
              class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]"
              >search</span
            >
            <input
              v-model="searchQuery"
              type="text"
              placeholder="ค้นหาชื่อ, ชื่อผู้ใช้..."
              class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00685f] focus:border-[#00685f]"
            />
          </div>

          <div class="flex items-center gap-3">
            <select
              v-model="filterRole"
              class="pl-4 pr-8 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#00685f] appearance-none cursor-pointer"
            >
              <option value="">บทบาททั้งหมด</option>
              <option value="admin">ผู้ดูแลระบบ</option>
              <option value="manager">ผู้บริหาร</option>
              <option value="hospital_staff">เจ้าหน้าที่ รพ.</option>
              <option value="pcu_staff">เจ้าหน้าที่ รพ.สต.</option>
            </select>
          </div>
        </div>

        <!-- Table -->
        <div class="bg-white border border-slate-200 rounded-b-xl overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex items-center justify-center py-16">
              <div class="flex flex-col items-center gap-3 text-slate-400">
                <div class="w-8 h-8 border-4 border-slate-200 border-t-[#00685f] rounded-full animate-spin"></div>
                <span class="text-sm">กำลังโหลดข้อมูล...</span>
              </div>
            </div>

            <!-- Error State -->
            <div v-else-if="loadError" class="flex items-center justify-center py-16">
              <div class="flex flex-col items-center gap-3 text-red-400">
                <span class="material-symbols-outlined text-4xl">error</span>
                <span class="text-sm">{{ loadError }}</span>
                <button @click="fetchUsers" class="text-xs text-[#00685f] underline">ลองใหม่</button>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredUsers.length === 0" class="flex items-center justify-center py-16">
              <div class="flex flex-col items-center gap-3 text-slate-400">
                <span class="material-symbols-outlined text-4xl">group_off</span>
                <span class="text-sm">ไม่พบข้อมูลผู้ใช้งาน</span>
              </div>
            </div>

            <!-- Data Table -->
            <table v-else class="w-full text-left text-sm whitespace-nowrap">
              <thead
                class="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider"
              >
                <tr>
                  <th class="py-4 px-6">ชื่อ-นามสกุล</th>
                  <th class="py-4 px-6">ชื่อผู้ใช้</th>
                  <th class="py-4 px-6">บทบาท</th>
                  <th class="py-4 px-6">หน่วยงาน</th>
                  <th class="py-4 px-6 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-600">
                <tr
                  v-for="user in filteredUsers"
                  :key="user.id"
                  class="hover:bg-slate-50/50 transition-colors"
                >
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        :class="getAvatarClass(user.role)"
                      >
                        {{ user.firstName?.charAt(0) || '?' }}
                      </div>
                      <span class="font-bold text-slate-800">{{ user.fullName }}</span>
                    </div>
                  </td>

                  <td class="py-4 px-6">{{ user.username }}</td>

                  <td class="py-4 px-6">
                    <span
                      :class="['inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border', getRoleClass(user.role)]"
                    >
                      {{ user.roleLabel }}
                    </span>
                  </td>

                  <td class="py-4 px-6 truncate max-w-[250px]">
                    {{ user.serviceUnitName }}
                  </td>

                  <td class="py-4 px-6 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        @click="openEditModal(user)"
                        class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-50 text-slate-400 hover:text-[#006399] transition-colors"
                        title="แก้ไขข้อมูล"
                      >
                        <span class="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        @click="confirmDelete(user)"
                        class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        title="ลบข้อมูล"
                      >
                        <span class="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer count -->
          <div
            v-if="!isLoading && !loadError && filteredUsers.length > 0"
            class="bg-white border-t border-slate-200 p-4 flex justify-between items-center text-sm text-slate-500"
          >
            <div>
              แสดง <span class="font-semibold text-slate-700">{{ filteredUsers.length }}</span> จากทั้งหมด
              <span class="font-semibold text-slate-700">{{ users.length }}</span> รายการ
            </div>
          </div>
        </div>


    <!-- =================== Modal: เพิ่มผู้ใช้งาน =================== -->
    <div
      v-if="showAddUserModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
    >
      <div
        class="bg-white rounded-xl shadow-lg w-full max-w-xl max-h-full flex flex-col border border-slate-200 overflow-hidden"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div class="flex items-center gap-3 text-[#00685f]">
            <span class="material-symbols-outlined text-2xl">person_add</span>
            <h2 class="text-xl font-bold text-slate-800">เพิ่มผู้ใช้งานใหม่</h2>
          </div>
          <button
            @click="showAddUserModal = false"
            class="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-200"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="p-4 sm:p-8 overflow-y-auto flex-1 bg-white">
          <!-- Alert Error -->
          <div v-if="addError" class="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">error</span>
            {{ addError }}
          </div>

          <form class="space-y-4" @submit.prevent="submitAddUser">
            <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
              <label class="w-full sm:w-1/3 text-left sm:text-right sm:pr-4 text-sm font-semibold text-slate-700">ชื่อ <span class="text-red-500">*</span></label>
              <input type="text" v-model="form.firstName" placeholder="ชื่อ"
                     class="w-full sm:w-2/3 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00685f] focus:border-[#00685f] text-sm" />
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
              <label class="w-full sm:w-1/3 text-left sm:text-right sm:pr-4 text-sm font-semibold text-slate-700">นามสกุล <span class="text-red-500">*</span></label>
              <input type="text" v-model="form.lastName" placeholder="นามสกุล"
                     class="w-full sm:w-2/3 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00685f] focus:border-[#00685f] text-sm" />
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
              <label class="w-full sm:w-1/3 text-left sm:text-right sm:pr-4 text-sm font-semibold text-slate-700">อีเมล</label>
              <input type="email" v-model="form.email" placeholder="example@email.com"
                     class="w-full sm:w-2/3 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00685f] focus:border-[#00685f] text-sm" />
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
              <label class="w-full sm:w-1/3 text-left sm:text-right sm:pr-4 text-sm font-semibold text-slate-700">ชื่อผู้ใช้ <span class="text-red-500">*</span></label>
              <input type="text" v-model="form.username" placeholder="username"
                     class="w-full sm:w-2/3 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00685f] focus:border-[#00685f] text-sm" />
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
              <label class="w-full sm:w-1/3 text-left sm:text-right sm:pr-4 text-sm font-semibold text-slate-700">รหัสผ่าน <span class="text-red-500">*</span></label>
              <div class="relative w-full sm:w-2/3">
                <input :type="showAddPassword ? 'text' : 'password'" v-model="form.password" placeholder="รหัสผ่าน"
                       class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00685f] focus:border-[#00685f] text-sm" />
                <button type="button" @click="showAddPassword = !showAddPassword"
                       class="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 px-2">
                  <span class="material-symbols-outlined text-[18px]">{{ showAddPassword ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
              <label class="w-full sm:w-1/3 text-left sm:text-right sm:pr-4 text-sm font-semibold text-slate-700">บทบาท <span class="text-red-500">*</span></label>
              <div class="relative w-full sm:w-2/3">
                <select v-model="form.role"
                        class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#00685f] focus:border-[#00685f] text-sm">
                  <option value="" disabled>เลือกบทบาท</option>
                  <option value="admin">ผู้ดูแลระบบ</option>
                  <option value="manager">ผู้บริหาร</option>
                  <option value="hospital_staff">เจ้าหน้าที่ รพ.</option>
                  <option value="pcu_staff">เจ้าหน้าที่ รพ.สต.</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                  <span class="material-symbols-outlined text-[18px]">expand_more</span>
                </div>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
              <label class="w-full sm:w-1/3 text-left sm:text-right sm:pr-4 text-sm font-semibold text-slate-700">หน่วยงาน</label>
              <div class="relative w-full sm:w-2/3">
                <select v-model="form.serviceUnitId"
                        class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#00685f] focus:border-[#00685f] text-sm">
                  <option value="">ไม่ระบุหน่วยงาน</option>
                  <option v-for="unit in serviceUnits" :key="unit.id" :value="unit.id">{{ unit.name }}</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                  <span class="material-symbols-outlined text-[18px]">expand_more</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-center gap-4">
          <button
            @click="showAddUserModal = false"
            type="button"
            class="px-8 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-100 transition-colors"
          >ยกเลิก</button>
          <button
            @click="submitAddUser"
            :disabled="isSubmitting"
            type="button"
            class="px-8 py-2 bg-[#00685f] text-white text-sm font-medium rounded-md hover:bg-[#005049] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <div v-if="isSubmitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            เพิ่ม
          </button>
        </div>
      </div>
    </div>

    <!-- =================== Modal: แก้ไขผู้ใช้งาน =================== -->
    <div
      v-if="showEditUserModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
    >
      <div
        class="bg-white rounded-xl shadow-lg w-full max-w-xl max-h-full flex flex-col border border-slate-200 overflow-hidden"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div class="flex items-center gap-3 text-[#006399]">
            <span class="material-symbols-outlined text-2xl">manage_accounts</span>
            <h2 class="text-xl font-bold text-slate-800">แก้ไขข้อมูลผู้ใช้งาน</h2>
          </div>
          <button
            @click="showEditUserModal = false"
            class="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-200"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="p-4 sm:p-8 overflow-y-auto flex-1 bg-white">
          <!-- Alert Error -->
          <div v-if="editError" class="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">error</span>
            {{ editError }}
          </div>

          <form class="space-y-4" @submit.prevent="submitEditUser">
            <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
              <label class="w-full sm:w-1/3 text-left sm:text-right sm:pr-4 text-sm font-semibold text-slate-700">ชื่อ <span class="text-red-500">*</span></label>
              <input type="text" v-model="editForm.firstName"
                     class="w-full sm:w-2/3 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#006399] focus:border-[#006399] text-sm" />
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
              <label class="w-full sm:w-1/3 text-left sm:text-right sm:pr-4 text-sm font-semibold text-slate-700">นามสกุล <span class="text-red-500">*</span></label>
              <input type="text" v-model="editForm.lastName"
                     class="w-full sm:w-2/3 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#006399] focus:border-[#006399] text-sm" />
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
              <label class="w-full sm:w-1/3 text-left sm:text-right sm:pr-4 text-sm font-semibold text-slate-700">อีเมล</label>
              <input type="email" v-model="editForm.email" placeholder="example@email.com"
                     class="w-full sm:w-2/3 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#006399] focus:border-[#006399] text-sm" />
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
              <label class="w-full sm:w-1/3 text-left sm:text-right sm:pr-4 text-sm font-semibold text-slate-700">ชื่อผู้ใช้ <span class="text-red-500">*</span></label>
              <input type="text" v-model="editForm.username"
                     class="w-full sm:w-2/3 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#006399] focus:border-[#006399] text-sm" />
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
              <label class="w-full sm:w-1/3 text-left sm:text-right sm:pr-4 text-sm font-semibold text-slate-700">รหัสผ่านใหม่</label>
              <div class="relative w-full sm:w-2/3">
                <input :type="showEditPassword ? 'text' : 'password'" v-model="editForm.password"
                       placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยน"
                       class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#006399] focus:border-[#006399] text-sm" />
                <button type="button" @click="showEditPassword = !showEditPassword"
                        class="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 px-2">
                  <span class="material-symbols-outlined text-[18px]">{{ showEditPassword ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
              <label class="w-full sm:w-1/3 text-left sm:text-right sm:pr-4 text-sm font-semibold text-slate-700">บทบาท <span class="text-red-500">*</span></label>
              <div class="relative w-full sm:w-2/3">
                <select v-model="editForm.role"
                        class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#006399] focus:border-[#006399] text-sm">
                  <option value="admin">ผู้ดูแลระบบ</option>
                  <option value="manager">ผู้บริหาร</option>
                  <option value="hospital_staff">เจ้าหน้าที่ รพ.</option>
                  <option value="pcu_staff">เจ้าหน้าที่ รพ.สต.</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                  <span class="material-symbols-outlined text-[18px]">expand_more</span>
                </div>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
              <label class="w-full sm:w-1/3 text-left sm:text-right sm:pr-4 text-sm font-semibold text-slate-700">หน่วยงาน</label>
              <div class="relative w-full sm:w-2/3">
                <select v-model="editForm.serviceUnitId"
                        class="w-full px-3 py-2 bg-white border border-slate-300 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-[#006399] focus:border-[#006399] text-sm">
                  <option value="">ไม่ระบุหน่วยงาน</option>
                  <option v-for="unit in serviceUnits" :key="unit.id" :value="unit.id">{{ unit.name }}</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                  <span class="material-symbols-outlined text-[18px]">expand_more</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-center gap-4">
          <button
            @click="showEditUserModal = false"
            type="button"
            class="px-8 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-100 transition-colors"
          >ยกเลิก</button>
          <button
            @click="submitEditUser"
            :disabled="isSubmitting"
            type="button"
            class="px-8 py-2 bg-[#006399] text-white text-sm font-medium rounded-md hover:bg-[#004e7a] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <div v-if="isSubmitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            บันทึก
          </button>
        </div>
      </div>
    </div>

    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import Swal from 'sweetalert2';

const config = useRuntimeConfig()
const API_BASE = `${config.public.apiBase}/api`

// ============= State =============
const users = ref([]);
const serviceUnits = ref([]);
const isLoading = ref(false);
const loadError = ref('');
const isSubmitting = ref(false);

const searchQuery = ref('');
const filterRole = ref('');

const showAddUserModal = ref(false);
const showEditUserModal = ref(false);

const addError = ref('');
const editError = ref('');
const showAddPassword = ref(false);
const showEditPassword = ref(false);

const userToDelete = ref(null);

// ============= Form State =============
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  role: '',
  serviceUnitId: '',
});

const editForm = reactive({
  id: null,
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  role: '',
  serviceUnitId: '',
});

// ============= Computed =============
const filteredUsers = computed(() => {
  let list = users.value;
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      u =>
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
    );
  }
  if (filterRole.value) {
    list = list.filter(u => u.role === filterRole.value);
  }
  return list;
});

// ============= Helpers =============
const getRoleClass = (role) => {
  const map = {
    admin: 'bg-[#008378] text-white border-transparent',
    manager: 'bg-[#1e293b] text-white border-transparent',
    hospital_staff: 'bg-blue-100 text-blue-700 border-blue-200',
    pcu_staff: 'bg-[#eef2ff] text-[#4f46e5] border-[#e0e7ff]',
  };
  return map[role] || 'bg-slate-100 text-slate-600 border-slate-200';
};

const getAvatarClass = (role) => {
  const map = {
    admin: 'bg-[#008378]',
    manager: 'bg-[#1e293b]',
    hospital_staff: 'bg-blue-500',
    pcu_staff: 'bg-indigo-500',
  };
  return map[role] || 'bg-slate-500';
};

const resetForm = () => {
  form.firstName = '';
  form.lastName = '';
  form.email = '';
  form.username = '';
  form.password = '';
  form.role = '';
  form.serviceUnitId = '';
  addError.value = '';
  showAddPassword.value = false;
};

// ============= API Calls =============
const fetchUsers = async () => {
  isLoading.value = true
  loadError.value = '';
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
    users.value = await res.json();
  } catch (err) {
    loadError.value = err.message || 'เกิดข้อผิดพลาด';
  } finally {
    isLoading.value = false;
  }
};

const fetchServiceUnits = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/users/service-units`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) return;
    const data = await res.json();
    // returns [{id, name}, ...]
    serviceUnits.value = data;
  } catch (err) {
    console.warn('fetchServiceUnits error:', err);
  }
};

// ============= Add User =============
const openAddModal = () => {
  resetForm();
  showAddUserModal.value = true;
};

const submitAddUser = async () => {
  addError.value = '';
  if (!form.firstName || !form.lastName || !form.username || !form.password || !form.role) {
    addError.value = 'กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน';
    return;
  }

  isSubmitting.value = true;
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        username: form.username,
        password: form.password,
        role: form.role,
        serviceUnitId: form.serviceUnitId || null,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      addError.value = data.message || 'เกิดข้อผิดพลาด';
      return;
    }

    showAddUserModal.value = false;
    Swal.fire({ title: 'สำเร็จ!', text: 'เพิ่มผู้ใช้งานสำเร็จ', icon: 'success', timer: 1500, showConfirmButton: false });
    await fetchUsers();
  } catch (err) {
    addError.value = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
  } finally {
    isSubmitting.value = false;
  }
};

// ============= Edit User =============
const openEditModal = (user) => {
  editError.value = '';
  showEditPassword.value = false;
  editForm.id = user.id;
  editForm.firstName = user.firstName;
  editForm.lastName = user.lastName;
  editForm.email = user.email || '';
  editForm.username = user.username;
  editForm.password = '';
  editForm.role = user.role;
  editForm.serviceUnitId = user.serviceUnitId || '';
  showEditUserModal.value = true;
};

const submitEditUser = async () => {
  editError.value = '';
  if (!editForm.firstName || !editForm.lastName || !editForm.username || !editForm.role) {
    editError.value = 'กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน';
    return;
  }

  isSubmitting.value = true;
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/users/${editForm.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        username: editForm.username,
        password: editForm.password,
        role: editForm.role,
        serviceUnitId: editForm.serviceUnitId || null,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      editError.value = data.message || 'เกิดข้อผิดพลาด';
      return;
    }

    showEditUserModal.value = false;
    Swal.fire({ title: 'สำเร็จ!', text: 'แก้ไขข้อมูลสำเร็จ', icon: 'success', timer: 1500, showConfirmButton: false });
    await fetchUsers();
  } catch (err) {
    editError.value = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
  } finally {
    isSubmitting.value = false;
  }
};

// ============= Delete User =============
const confirmDelete = async (user) => {
  const result = await Swal.fire({
    title: 'ยืนยันการลบ',
    text: `คุณต้องการลบผู้ใช้งาน "${user.fullName}" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ใช่, ลบเลย',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#ef4444'
  });

  if (result.isConfirmed) {
    userToDelete.value = user;
    await executeDelete();
  }
};

const executeDelete = async () => {
  if (!userToDelete.value) return;
  isSubmitting.value = true;
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/users/${userToDelete.value.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) {
      Swal.fire('เกิดข้อผิดพลาด', data.message || 'เกิดข้อผิดพลาด', 'error');
      return;
    }

    userToDelete.value = null;
    Swal.fire({ title: 'ลบสำเร็จ!', text: 'ลบผู้ใช้งานสำเร็จ', icon: 'success', timer: 1500, showConfirmButton: false });
    await fetchUsers();
  } catch (err) {
    Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

// ============= Logout =============
const handleLogout = async (path) => {
  await navigateTo(path);
};

// ============= Lifecycle =============
onMounted(() => {
  fetchUsers();
  fetchServiceUnits();
});
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

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>
