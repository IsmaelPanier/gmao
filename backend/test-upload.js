import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

async function testUpload() {
  try {
    const api = axios.create({ baseURL: "http://localhost:4000/api" });

    // 1. Login
    console.log("Logging in...");
    const loginRes = await api.post("/auth/login", {
      email: "admin@gmao.fr",
      password: "Admin1234!",
    });
    const token = loginRes.data.data.accessToken;
    console.log("Logged in successfully. Token acquired.");

    // 2. Get an intervention
    console.log("Fetching interventions...");
    const interventionsRes = await api.get("/interventions?limit=1", {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(interventionsRes.data);
    const interventionId = interventionsRes.data.data.data[0].id;
    console.log(`Found intervention ID: ${interventionId}`);

    // 3. Create a dummy image
    const dummyImagePath = path.join(process.cwd(), "..", "dummy.jpg");
    fs.writeFileSync(dummyImagePath, "fake image content");

    // 4. Upload photo
    console.log("Uploading photo...");
    const form = new FormData();
    form.append("file", fs.createReadStream(dummyImagePath));
    form.append("type", "PHOTO");

    const uploadRes = await api.post(`/files/interventions/${interventionId}`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    console.log("Upload successful!");
    console.log(uploadRes.data);

    // Cleanup
    fs.unlinkSync(dummyImagePath);
  } catch (err) {
    console.error("Test failed:", err.response ? err.response.data : err.message);
  }
}

testUpload();
