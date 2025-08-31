import axios from "axios";
import * as XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

// For ES module dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your Excel file
const filePath = path.join(__dirname, "data.xlsx");

// Load Excel
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

// Sort by event_time for proper replay
data.sort((a, b) => new Date(a.event_time) - new Date(b.event_time));

// Webhook endpoint
const WEBHOOK_URL = "http://localhost:5000/api/webhook/events"; 

// Function to send event
const sendEvent = async (event) => {
  try {
    await axios.post(WEBHOOK_URL, event);
    console.log(`✅ Sent event ${event.event_id} for driver ${event.driver_id}`);
  } catch (err) {
    console.error(`❌ Error sending event ${event.event_id}:`, err.message);
  }
};

// Replay events with near real-time simulation
const simulate = async () => {
  console.log(`🚀 Starting webhook simulation for ${data.length} events...`);

  for (let i = 0; i < data.length; i++) {
    const event = data[i];

    // Calculate delay based on timestamp difference
    if (i > 0) {
      const prev = new Date(data[i - 1].event_time).getTime();
      const curr = new Date(event.event_time).getTime();
      const delay = curr - prev;

      // Cap delay for faster simulation (e.g. max 2 sec instead of hours)
      const safeDelay = Math.min(delay, 2000);

      await new Promise((resolve) => setTimeout(resolve, safeDelay));
    }

    await sendEvent(event);
  }

  console.log("🎉 Simulation completed.");
};

simulate();
