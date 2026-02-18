
require('dotenv').config({ path: '.env.local' });

console.log("--- Environment Diagnostic ---");
console.log("Current Directory:", process.cwd());
const key = process.env.GEMINI_API_KEY;

if (key) {
    console.log("✅ GEMINI_API_KEY found!");
    console.log("Key Length:", key.length);
    console.log("Key Start:", key.substring(0, 5) + "...");
    console.log("Key End:", "..." + key.substring(key.length - 5));

    if (key.startsWith("AIza")) {
        console.log("✅ Key format looks correct (starts with AIza)");
    } else {
        console.log("⚠️ Key format looks suspicious (should start with AIza)");
    }
} else {
    console.log("❌ GEMINI_API_KEY is MISSING or undefined.");
    console.log("Please ensure .env.local exists and contains the key.");
}
console.log("------------------------------");
