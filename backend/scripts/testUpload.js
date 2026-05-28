const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hospitalis_key';

async function testUpload() {
  try {
    const token = jwt.sign(
      { user: { id: 1, username: 'test', role: 'pcu_staff' } },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const form = new FormData();
    form.append('patient_id', '1');
    form.append('symptoms_detail', 'test symptoms');
    form.append('health_status', 'normal');
    
    // Create a dummy file
    const filePath = path.join(__dirname, 'dummy.jpg');
    fs.writeFileSync(filePath, 'fake image content');
    form.append('images', fs.createReadStream(filePath));
    
    const res = await fetch('http://localhost:3001/api/tracking', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form // node-fetch/native fetch works with form-data somewhat, but we might need to set headers
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body:", text);
  } catch (err) {
    console.error("ERROR:", err);
  }
}

testUpload();
