// static/script.js
// Synaptic cinematic script: parallax, Unsplash fetch, draggable assistant, chat

const unsplashKey = "YOUR_UNSPLASH_KEY"; // <-- replace with your Unsplash API key or leave blank to use fallbacks
const galleryGrid = document.getElementById('galleryGrid');
const heroPreview = document.getElementById('heroPreview');
const assistant = document.getElementById('assistant');
const chatPanel = document.getElementById('chatPanel');
const chatBody = document.getElementById('chatBody');
const chatInput = document.getElementById('chatInput');

// Smooth anchor scroll
function scrollToAnchor(id){
  const el = document.getElementById(id);
  if(el) el.scrollIntoView({behavior:'smooth'});
}

/* ---------- Parallax layers ---------- */
const layers = document.querySelectorAll('.layer[data-speed]');
window.addEventListener('scroll', () => {
  const sc = window.scrollY;
  layers.forEach(layer => {
    const speed = parseFloat(layer.getAttribute('data-speed') || 0.2);
    layer.style.transform = `translateY(${sc * speed}px)`;
  });
});

/* ---------- Unsplash dynamic loader ---------- */
async function loadImages(){
  const count = 7;
  if (!unsplashKey) {
    loadFallback();
    return;
  }
  try {
    const res = await fetch(`https://api.unsplash.com/photos/random?count=${count}&client_id=${unsplashKey}`);
    if (!res.ok) throw new Error('Unsplash fetch failed');
    const data = await res.json();
    // hero preview from first image
    const heroUrl = data[0]?.urls?.regular;
    if (heroUrl) heroPreview.innerHTML = `<img src="${heroUrl}" alt="hero">`;
    // build gallery
    galleryGrid.innerHTML = "";
    data.forEach((p) => {
      const img = document.createElement('img');
      img.src = p.urls.regular;
      img.alt = p.alt_description || "Photo";
      img.loading = 'lazy';
      img.addEventListener('click', ()=> openLightbox(img.src));
      galleryGrid.appendChild(img);
    });
  } catch (e) {
    console.warn("Unsplash failed:", e);
    loadFallback();
  }
}

function loadFallback(){
  const defaults = [
    '/static/images/fallback-star.jpg',
    '/static/images/fallback1.jpg',
    '/static/images/fallback2.jpg',
    '/static/images/fallback3.jpg',
    '/static/images/fallback4.jpg',
    '/static/images/fallback5.jpg',
    '/static/images/fallback6.jpg'
  ];
  heroPreview.innerHTML = `<img src="${defaults[0]}" alt="hero">`;
  galleryGrid.innerHTML = "";
  defaults.slice(1).forEach(src=>{
    const img = document.createElement('img');
    img.src = src;
    img.loading='lazy';
    img.addEventListener('click', ()=> openLightbox(src));
    galleryGrid.appendChild(img);
  });
}

loadImages();

/* ---------- Lightbox ---------- */
function openLightbox(src){
  const lb = document.createElement('div');
  lb.style.position='fixed'; lb.style.inset=0; lb.style.background='rgba(0,0,0,0.88)';
  lb.style.display='flex'; lb.style.alignItems='center'; lb.style.justifyContent='center'; lb.style.zIndex=9999;
  const img = document.createElement('img'); img.src=src; img.style.maxWidth='95%'; img.style.maxHeight='95%'; img.style.borderRadius='8px';
  lb.appendChild(img);
  lb.addEventListener('click', ()=> document.body.removeChild(lb));
  document.body.appendChild(lb);
}

/* ---------- Draggable assistant ---------- */
let dragging=false, dragOffsetX=0, dragOffsetY=0;
assistant.addEventListener('touchstart', startDrag, {passive:false});
assistant.addEventListener('mousedown', startDrag);
document.addEventListener('touchmove', doDrag, {passive:false});
document.addEventListener('mousemove', doDrag);
document.addEventListener('touchend', endDrag);
document.addEventListener('mouseup', endDrag);

assistant.addEventListener('click', (e)=>{
  if (!dragging) toggleChat(true);
});

function startDrag(e){
  dragging=true;
  const pt = e.touches ? e.touches[0] : e;
  const rect = assistant.getBoundingClientRect();
  dragOffsetX = pt.clientX - rect.left;
  dragOffsetY = pt.clientY - rect.top;
  assistant.style.transition = 'none';
}
function doDrag(e){
  if(!dragging) return;
  const pt = e.touches ? e.touches[0] : e;
  let nx = pt.clientX - dragOffsetX;
  let ny = pt.clientY - dragOffsetY;
  nx = Math.max(8, Math.min(window.innerWidth - assistant.offsetWidth - 8, nx));
  ny = Math.max(8, Math.min(window.innerHeight - assistant.offsetHeight - 8, ny));
  assistant.style.left = nx + 'px';
  assistant.style.top = ny + 'px';
  assistant.style.right = 'auto';
  assistant.style.bottom = 'auto';
  e.preventDefault();
}
function endDrag(e){
  if(!dragging) return;
  dragging=false;
  assistant.style.transition = '';
}

/* ---------- Chat panel toggle ---------- */
function toggleChat(open){
  if(open){
    chatPanel.style.display = 'flex';
    chatPanel.setAttribute('aria-hidden','false');
    setTimeout(()=> chatPanel.classList.add('enter'), 40);
    chatBody.scrollTop = chatBody.scrollHeight;
  } else {
    chatPanel.classList.remove('enter');
    chatPanel.style.display = 'none';
    chatPanel.setAttribute('aria-hidden','true');
  }
}

/* ---------- Chat functions ---------- */
function appendMsg(kind, text){
  const d = document.createElement('div');
  d.className = 'msg ' + (kind === 'me' ? 'me' : 'bot');
  d.textContent = text;
  chatBody.appendChild(d);
  chatBody.scrollTop = chatBody.scrollHeight;
  return d;
}

async function sendChat(){
  const text = (chatInput.value || '').trim();
  if(!text) return;
  appendMsg('me', text);
  chatInput.value = '';
  // typing indicator
  const typing = appendMsg('bot', 'Typing… ✨');
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({message: text})
    });
    if (!res.ok) throw new Error('no backend');
    const data = await res.json();
    typing.textContent = data.reply || "Sorry, no response.";
  } catch (err) {
    typing.textContent = "Assistant unavailable. Try 'price' or 'book'.";
  }
  chatBody.scrollTop = chatBody.scrollHeight;
}

/* ---------- Contact quick-send (mailto fallback) ---------- */
/* ---------- Contact Form - Enhanced Email Template ---------- */
function submitContact(){
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subj = document.getElementById('subject').value;
    const msg = document.getElementById('message').value;
    const resEl = document.getElementById('contactResult');
    
    if(!name || !email){ 
        resEl.textContent = 'Please include name and contact.'; 
        resEl.style.color = '#e74c3c';
        return;
    }

    // Enhanced email template
    const subject = subj ? `📸 Studio: ${subj}` : '📸 Studio Photography Inquiry';
    const body = `Dear Studio Team,

I'm interested in your photography services and would like to get more information.

🔖 **Contact Details:**
• Name: ${name}
• Email: ${email}
${subj ? `• Interest: ${subj}` : ''}

💬 **My Message:**
${msg}

I'm looking forward to hearing from you!

Best regards,
${name}

---
This inquiry was sent via the Studio website.
    `.trim();

    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    
    const mailtoLink = `mailto:hello@studio.example?subject=${encodedSubject}&body=${encodedBody}`;
    
    // Open email client
    window.open(mailtoLink, '_blank');
    
    // Show success message
    resEl.innerHTML = '✅ <strong>Email app opened!</strong> Please send the pre-filled email to contact us.';
    resEl.style.color = 'var(--black)';
    
    // Clear form after a delay
    setTimeout(() => {
        document.getElementById('name').value = '';
        document.getElementById('email').value = '';
        document.getElementById('subject').value = '';
        document.getElementById('message').value = '';
        
        // Clear selected package display
        const selectedPackage = document.getElementById('selectedPackage');
        if (selectedPackage) {
            selectedPackage.style.display = 'none';
        }
    }, 3000);
}
/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', ()=> {
  // default assistant position
  assistant.style.right = '18px';
  assistant.style.bottom = '18px';
}); // <-- THIS WAS MISSING - added the closing });

/* ---------- Mobile Navbar Toggle ---------- */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
    
    // Close menu when clicking on links
    const navItems = navLinks.querySelectorAll('a');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        }
    })/* ---------- Package Selection Function ---------- */
/* ---------- Package Selection Function ---------- */
function selectPackage(packageName, packagePrice) {
    // Scroll to contact form smoothly
    scrollToAnchor('contact');
    
    // Wait a bit for scroll to complete then fill the form
    setTimeout(() => {
        // Fill the subject field with the selected package
        const subjectInput = document.getElementById('subject');
        if (subjectInput) {
            subjectInput.value = `${packageName} - ${packagePrice}`;
            subjectInput.focus();
        }
        
        // Pre-fill the message with a template (only if empty)
        const messageInput = document.getElementById('message');
        if (messageInput && !messageInput.value.trim()) {
            messageInput.value = `Hello! I'm interested in booking the ${packageName} package (${packagePrice}). Please provide me with more details about availability and booking process.`;
        }
        
        // Show the selected package in the contact section
        const selectedPackage = document.getElementById('selectedPackage');
        const packageDetails = document.getElementById('packageDetails');
        if (selectedPackage && packageDetails) {
            packageDetails.textContent = `${packageName} - ${packagePrice}`;
            selectedPackage.style.display = 'block';
        }
        
        // Show visual feedback
        const contactResult = document.getElementById('contactResult');
        if (contactResult) {
            contactResult.textContent = `✅ ${packageName} package selected! Click "Send message via Email" to contact us.`;
            contactResult.style.color = 'var(--black)';
        }
        
    }, 800);
    
    // Visual feedback on the clicked card
    const cards = document.querySelectorAll('.pricing-card, .card');
    cards.forEach(card => card.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
}

/* ---------- Enter Key for Contact Form ---------- */
// Add this to allow pressing Enter in contact form fields
document.addEventListener('DOMContentLoaded', function() {
    const contactInputs = document.querySelectorAll('.contact-form input, .contact-form textarea');
    contactInputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && e.target.type !== 'textarea') {
                e.preventDefault();
                submitContact();
            }
        });
    });
});
}