
const apiKey = 'AIzaSyDAg6F4kJTVgaiWKSTM5q8kwbWqqMdTOo8';
const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function testGemini2() {
    console.log(`Testing: ${url}`);
    try {
        const response = await fetch(`${url}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Explain how AI works in one sentence." }] }]
            })
        });

        console.log(`Status: ${response.status}`);
        if (response.ok) {
            const data = await response.json();
            console.log("SUCCESS! Response:");
            console.log(data.candidates[0].content.parts[0].text);
        } else {
            const txt = await response.text();
            console.log(`Error: ${txt}`);
        }
    } catch (e) {
        console.log("Exception:", e.message);
    }
}

testGemini2();
