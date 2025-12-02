# app.py (simplified)
from flask import Flask, render_template, request, jsonify, send_from_directory
import os, requests, time
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder="static", template_folder="templates")
OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error":"No message provided"}), 400

    if OPENROUTER_KEY:
        try:
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role":"system","content":
                     ("You are a professional photography studio assistant for 'Studio' - a black & white cinematic photography studio. "
                      "Voice: warm, professional, helpful. Keep answers concise (1-3 sentences max), "
                      "offer booking steps and options, and use subtle emojis like 📸 ✨ when suitable. "
                      "Pricing: Portrait Session ₦30,000, Event/Wedding starts at ₦120,000. "
                      "Always encourage users to book or ask about specific packages.")}
                    ,
                    {"role":"user","content":message}
                ],
                "max_tokens": 150
            }
            r = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_KEY}", 
                    "Content-Type":"application/json",
                    "HTTP-Referer": "https://studio.example",
                    "X-Title": "Studio Photography"
                },
                json=payload,
                timeout=15
            )
            r.raise_for_status()
            jr = r.json()
            reply = jr.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            if not reply:
                reply = "Sorry — I couldn't craft a response. Could you rephrase?"
            time.sleep(0.8)
            return jsonify({"reply": reply})
        except Exception as e:
            print("OpenRouter error:", e)
            return jsonify({"reply": fallback_reply(message)})

    return jsonify({"reply": fallback_reply(message)})

def fallback_reply(user_text):
    ut = user_text.lower()
    if any(x in ut for x in ["price","cost","how much","charge","₦"]):
        return "📸 Portrait sessions: ₦30,000 | Events/Weddings: from ₦120,000. Which package interests you? Click any package to pre-fill the contact form!"
    if any(x in ut for x in ["book","available","availability","date","schedule"]):
        return "✨ I'd love to help you book! Select a package below or use our contact form. We'll open your email with a pre-filled message!"
    if any(x in ut for x in ["hello","hi","hey","hola"]):
        return "Hi there! I'm Studio's assistant 📸 I can help with pricing, booking, and answering questions. What brings you here today?"
    if any(x in ut for x in ["portfolio","gallery","work","photos"]):
        return "We specialize in cinematic black & white photography. Would you like to see portraits, weddings, or editorial work?"
    if any(x in ut for x in ["how long","delivery","turnaround","ready"]):
        return "Portraits: 3-5 days | Events: 1-2 weeks. We prioritize quality editing! ✨"
    if any(x in ut for x in ["portrait","portraits"]):
        return "Our portrait session is ₦30,000 - includes 1 hour, 10 edited images. Click the package to pre-fill the contact form!"
    if any(x in ut for x in ["wedding","event","marriage","ceremony"]):
        return "Wedding/event coverage starts at ₦120,000. Click the package to pre-fill the contact form with your inquiry! 📅"
    if any(x in ut for x in ["package","packages","service","services"]):
        return "We offer: Portrait Session (₦30,000) & Event/Wedding (from ₦120,000). Click any package to get started! ✨"
    if any(x in ut for x in ["contact","email","message","reach"]):
        return "Use our contact form below! It will open your email app with a pre-filled message. We respond within 24 hours! 📧"
    
    return "Tell me about your photography needs - date, style, and I'll help create magic! 📸 Or click a package below to get started!"

@app.route('/static/images/<path:filename>')
def static_images(filename):
    return send_from_directory(os.path.join(app.root_path, 'static', 'images'), filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)