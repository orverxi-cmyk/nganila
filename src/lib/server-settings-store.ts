import fs from "fs";
import path from "path";
import { initializeFirebase } from "@/firebase/init";
import { doc, getDoc, setDoc } from "firebase/firestore";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "settings-store.json");

let memoryCache: Record<string, any> = {};
let isInitialized = false;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDiskCache() {
  try {
    ensureDataDir();
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      memoryCache = JSON.parse(raw);
    }
  } catch (err) {
    console.warn("[server-settings-store] Failed to load disk cache:", err);
  }
}

function saveDiskCache() {
  try {
    ensureDataDir();
    fs.writeFileSync(STORE_FILE, JSON.stringify(memoryCache, null, 2), "utf-8");
  } catch (err) {
    console.warn("[server-settings-store] Failed to write disk cache:", err);
  }
}

export async function getServerSetting(sectionId: string): Promise<any> {
  if (!isInitialized) {
    loadDiskCache();
    isInitialized = true;
  }

  // 1. Return from server memory/disk cache if present
  if (memoryCache[sectionId]) {
    return memoryCache[sectionId];
  }

  // 2. Fetch from Firestore if not cached locally
  try {
    const { firestore } = initializeFirebase();
    const snap = await getDoc(doc(firestore, "settings", sectionId));
    if (snap.exists()) {
      const data = snap.data();
      memoryCache[sectionId] = data;
      saveDiskCache();
      return data;
    }
  } catch (err: any) {
    console.warn(`[server-settings-store] Firestore read failed for ${sectionId}:`, err.message);
  }

  return null;
}

export async function saveServerSetting(sectionId: string, content: any): Promise<boolean> {
  if (!isInitialized) {
    loadDiskCache();
    isInitialized = true;
  }

  const payload = {
    ...content,
    updatedAt: Date.now()
  };

  // 1. Immediately persist to server disk store
  memoryCache[sectionId] = payload;
  saveDiskCache();

  // 2. Persist to Firestore
  try {
    const { firestore } = initializeFirebase();
    await setDoc(doc(firestore, "settings", sectionId), payload);
    return true;
  } catch (err: any) {
    console.warn(`[server-settings-store] Firestore save failed for ${sectionId}:`, err.message);
    // Even if remote Firestore has issues, the local server cache is persistent
    return true;
  }
}

