# Skill: frontend-patterns

## Trigger
เรียกใช้ Skill นี้เมื่อผู้ใช้ถามเกี่ยวกับ:
- การสร้างหน้าใหม่ใน Nuxt.js (page, component)
- การเรียก API จาก frontend
- การจัดการ state (Pinia / useState)
- การใช้ Tailwind CSS ใน Nuxt
- การแสดง error/success (SweetAlert2)
- การ handle JWT Token และ auth guard

## Context

### Nuxt 3 Directory Structure
```
frontend/app/
├── pages/          ← file-based routing (เช่น pages/patients/index.vue)
├── components/     ← reusable UI components
├── composables/    ← shared logic (useAuth, useApi, etc.)
├── layouts/        ← layout wrappers
├── middleware/     ← route guards (auth check)
├── stores/         ← Pinia stores (ถ้าใช้)
└── assets/         ← static assets
```

### Standard Page Pattern
```vue
<!-- frontend/app/pages/example/index.vue -->
<template>
  <div class="container mx-auto p-6">
    <h1 class="text-2xl font-bold mb-4">หัวเรื่อง</h1>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-8">
      <span class="loading loading-spinner"></span>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Content here -->
    </div>
  </div>
</template>

<script setup>
import Swal from 'sweetalert2'

// Page meta
definePageMeta({
  middleware: ['auth']  // ใช้ auth guard
})

// Composables
const config = useRuntimeConfig()
const token = useCookie('auth_token') // หรือ localStorage

// State
const loading = ref(false)
const data = ref([])

// API Call
const fetchData = async () => {
  loading.value = true
  try {
    const res = await $fetch(`${config.public.apiBase}/api/example`, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    data.value = res
  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: err.data?.message || 'ไม่สามารถโหลดข้อมูลได้'
    })
  } finally {
    loading.value = false
  }
}

// POST Example
const submitForm = async (formData) => {
  try {
    await $fetch(`${config.public.apiBase}/api/example`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body: formData
    })

    await Swal.fire({
      icon: 'success',
      title: 'สำเร็จ!',
      text: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      timer: 2000,
      showConfirmButton: false
    })

    await navigateTo('/example') // redirect หลัง submit

  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: 'ไม่สำเร็จ',
      text: err.data?.message || 'เกิดข้อผิดพลาด'
    })
  }
}

// Lifecycle
onMounted(() => fetchData())
</script>
```

### API Base URL
```javascript
// ใช้ runtime config เสมอ — ไม่ hardcode URL
const config = useRuntimeConfig()
const apiBase = config.public.apiBase  // มาจาก frontend/.env → NUXT_PUBLIC_API_BASE
```

### Auth Token
```javascript
// วิธีดึง token ที่ระบบใช้:
const token = useAuthToken()  // composable หรือ localStorage

// ส่ง header ทุก request:
headers: { Authorization: `Bearer ${token.value}` }
```

### SweetAlert2 Patterns ที่ใช้บ่อย
```javascript
import Swal from 'sweetalert2'

// ✅ Success
Swal.fire({ icon: 'success', title: 'สำเร็จ!', timer: 2000, showConfirmButton: false })

// ❌ Error
Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: errorMessage })

// ⚠️ Confirm (ก่อนลบ/ยืนยัน)
const result = await Swal.fire({
  icon: 'warning',
  title: 'ยืนยันการดำเนินการ?',
  text: 'ไม่สามารถยกเลิกได้',
  showCancelButton: true,
  confirmButtonText: 'ยืนยัน',
  cancelButtonText: 'ยกเลิก'
})
if (result.isConfirmed) { /* proceed */ }

// 🔴 Critical Risk Alert
Swal.fire({
  icon: 'error',
  title: '⚠️ ค่าสัญญาณชีพวิกฤต!',
  text: 'กรุณาประสานงานเพื่อส่งตัวผู้ป่วยกลับโรงพยาบาลทันที',
  confirmButtonColor: '#d33'
})
```

### Tailwind CSS Conventions ที่ใช้ในโปรเจกต์
- ดูสี/theme จาก `frontend/tailwind.config.js`
- ใช้ responsive prefix: `sm:`, `md:`, `lg:`
- ใช้ class ของ Tailwind แทน inline style เสมอ
- Status badges:
  - `pending` → `bg-yellow-100 text-yellow-800`
  - `accepted` → `bg-blue-100 text-blue-800`
  - `completed` → `bg-green-100 text-green-800`
  - `rejected` → `bg-red-100 text-red-800`
  - `critical` → `bg-red-600 text-white`
  - `warning` → `bg-orange-400 text-white`
  - `normal` → `bg-green-500 text-white`

### File Upload (Multipart FormData)
```javascript
// สำหรับ upload รูปภาพ tracking
const formData = new FormData()
formData.append('tracking_data', JSON.stringify(trackingFields))
files.forEach(file => formData.append('images', file))

await $fetch(`${config.public.apiBase}/api/tracking`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token.value}` },
  // !! ไม่ต้อง set Content-Type — browser จะ set boundary อัตโนมัติ
  body: formData
})
```

## Files ที่เกี่ยวข้อง
- `frontend/nuxt.config.ts` — Nuxt configuration
- `frontend/tailwind.config.js` — Tailwind theme/colors
- `frontend/app/pages/` — ดู pages เดิมเป็นตัวอย่าง
- `frontend/app/composables/` — shared composables
