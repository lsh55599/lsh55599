/* ===============================================
   Design Youth — script.js
   Edit mode + Smart Download (no toolbar in output)
   =============================================== */
"use strict";

// ── Navbar scroll ─────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
});

// ── Hamburger ─────────────────────────────────
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileClose= document.getElementById('mobileClose');

hamburger.addEventListener('click', () => {
  mobileMenu.classList.add('open');
  document.body.style.overflow = 'hidden';
});
mobileClose.addEventListener('click', closeMobile);
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobile));
function closeMobile() {
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
}

// ── Smooth scroll ─────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ── Scroll reveal ─────────────────────────────
const revealTargets = document.querySelectorAll(
  '.portfolio__item, .credential-card, .hero__stat, .contact__info-card, .credentials__intro'
);
revealTargets.forEach(el => el.classList.add('reveal'));
new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 60);
    }
  });
}, { threshold: 0.12 }).observe(document.documentElement);

// Better reveal observer
const ro = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      ro.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
revealTargets.forEach((el, i) => {
  el.style.transitionDelay = `${i * 0.05}s`;
  ro.observe(el);
});

// ── Contact form ──────────────────────────────
document.getElementById('contactForm').addEventListener('submit', e => {
  e.preventDefault();
  showToast('✅ 메시지가 전송되었습니다. 24시간 내에 답변드리겠습니다.');
  e.target.reset();
});

// ── Toast ─────────────────────────────────────
const toastEl = document.getElementById('toast');
let toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
}

// ── Edit Mode ─────────────────────────────────
const toggleBtn  = document.getElementById('toggleEdit');
const downloadBtn= document.getElementById('downloadBtn');
let isEditing = false;

toggleBtn.addEventListener('click', () => {
  isEditing = !isEditing;
  document.body.classList.toggle('edit-mode', isEditing);
  toggleBtn.classList.toggle('active', isEditing);
  toggleBtn.textContent = isEditing ? '✅ 편집 완료' : '✏️ 편집 모드';

  if (isEditing) {
    activateEdit();
    showToast('편집 모드 활성화 — 텍스트를 클릭하여 직접 수정하세요.');
  } else {
    deactivateEdit();
    showToast('편집 내용이 적용되었습니다.');
  }
});

function activateEdit() {
  // contenteditable on text nodes
  document.querySelectorAll('[data-editable]').forEach(el => {
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'false');
  });

  // Delete buttons on blocks
  document.querySelectorAll('[data-editable-block]').forEach(block => {
    if (block.querySelector('.del-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'del-btn';
    btn.textContent = '✕';
    btn.title = '블록 삭제';
    btn.onclick = (e) => {
      e.stopPropagation();
      block.style.transition = 'opacity .25s, transform .25s';
      block.style.opacity = '0';
      block.style.transform = 'scale(0.97)';
      setTimeout(() => { block.remove(); showToast('🗑️ 삭제되었습니다.'); }, 260);
    };
    block.appendChild(btn);
  });
}

function deactivateEdit() {
  document.querySelectorAll('[data-editable]').forEach(el => {
    el.removeAttribute('contenteditable');
  });
  document.querySelectorAll('.del-btn').forEach(b => b.remove());
}

// Prevent link navigation in edit mode
document.addEventListener('click', e => {
  if (!isEditing) return;
  const a = e.target.closest('a');
  if (a && !a.getAttribute('href').startsWith('#')) e.preventDefault();
});

// ESC exits edit mode
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && isEditing) toggleBtn.click();
});

// ── IMAGE UPLOAD on placeholders ─────────────
document.querySelectorAll('.portfolio__img').forEach(el => {
  el.style.cursor = 'pointer';
  el.title = '클릭하여 이미지 교체';
  el.addEventListener('click', () => {
    const input = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/*' });
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        el.style.backgroundImage = `url('${ev.target.result}')`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        showToast('✅ 이미지가 교체되었습니다.');
      };
      reader.readAsDataURL(file);
    };
    input.click();
  });
});

// ── DOWNLOAD — inlined, no toolbar ───────────
downloadBtn.addEventListener('click', exportSite);

async function exportSite() {
  showToast('📦 파일을 준비하고 있습니다...');

  // 1. Deactivate edit mode first
  if (isEditing) {
    deactivateEdit();
    document.body.classList.remove('edit-mode');
    toggleBtn.classList.remove('active');
    toggleBtn.textContent = '✏️ 편집 모드';
    isEditing = false;
  }

  // 2. Fetch CSS content
  let cssText = '';
  try {
    const resp = await fetch('style.css');
    cssText = await resp.text();
  } catch {
    cssText = '/* Could not inline CSS — link style.css separately */';
  }

  // 3. Clone current document
  const clone = document.cloneNode(true);

  // 4. Remove edit toolbar and toast from clone
  const toolbar = clone.getElementById('editToolbar');
  if (toolbar) toolbar.remove();
  const toast = clone.getElementById('toast');
  if (toast) toast.remove();
  const mobileMenuEl = clone.getElementById('mobileMenu');
  // Keep mobile menu but remove edit classes

  // 5. Remove edit-mode class from body
  clone.querySelector('body').classList.remove('edit-mode');

  // 6. Remove all data-editable / data-editable-block attributes
  clone.querySelectorAll('[data-editable]').forEach(el => {
    el.removeAttribute('data-editable');
    el.removeAttribute('contenteditable');
  });
  clone.querySelectorAll('[data-editable-block]').forEach(el => {
    el.removeAttribute('data-editable-block');
  });
  clone.querySelectorAll('.del-btn').forEach(el => el.remove());

  // 7. Remove the <link> to style.css and replace with <style>
  clone.querySelectorAll('link[rel="stylesheet"]').forEach(el => {
    if (el.href && el.href.includes('style.css')) el.remove();
  });

  // 8. Remove script.js reference (no edit functionality needed)
  clone.querySelectorAll('script').forEach(el => {
    if (el.src && el.src.includes('script.js')) el.remove();
  });

  // 9. Inject inlined CSS (remove edit-mode rules to keep it clean)
  const cleanCss = cssText
    .replace(/\/\* ─+ Edit mode[\s\S]*?\/\* ─+[^─]/g, '/* ')  // rough strip
    .replace(/body\.edit-mode[\s\S]*?\}/g, '')
    .replace(/\.del-btn[\s\S]*?\}/g, '')
    .replace(/\.edit-toolbar[\s\S]*?\}/g, '')
    .replace(/\.toast[\s\S]*?\}/g, '');

  const styleEl = clone.createElement ? clone.createElement('style') : document.createElement('style');
  styleEl.textContent = cssText; // keep full css for layout; toolbar just won't show
  const head = clone.querySelector('head');
  head.appendChild(styleEl);

  // 10. Inject minimal inline script for nav scroll + smooth scroll + form
  const inlineScript = clone.createElement ? clone.createElement('script') : document.createElement('script');
  inlineScript.textContent = `
(function(){
  "use strict";
  var nb=document.getElementById('navbar');
  window.addEventListener('scroll',function(){nb&&nb.classList.toggle('scrolled',window.scrollY>30);});
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){
      var t=document.querySelector(a.getAttribute('href'));
      if(!t)return;e.preventDefault();
      var top=t.getBoundingClientRect().top+window.scrollY-72;
      window.scrollTo({top:top,behavior:'smooth'});
    });
  });
  var ham=document.getElementById('hamburger'),mm=document.getElementById('mobileMenu'),mc=document.getElementById('mobileClose');
  if(ham)ham.addEventListener('click',function(){mm&&mm.classList.add('open');document.body.style.overflow='hidden';});
  if(mc)mc.addEventListener('click',function(){mm&&mm.classList.remove('open');document.body.style.overflow='';});
  if(mm)mm.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){mm.classList.remove('open');document.body.style.overflow='';});});
  var form=document.getElementById('contactForm');
  if(form)form.addEventListener('submit',function(e){e.preventDefault();alert('메시지가 전송되었습니다. 24시간 내에 답변드리겠습니다.');form.reset();});
})();
  `;
  clone.querySelector('body').appendChild(inlineScript);

  // 11. Also remove edit-toolbar CSS from style tag output
  // Add a small style to hide toolbar in downloaded file
  const hideToolbar = clone.createElement ? clone.createElement('style') : document.createElement('style');
  hideToolbar.textContent = '.edit-toolbar{display:none!important}.toast{display:none!important}';
  head.appendChild(hideToolbar);

  // 12. Serialize and trigger download
  const serializer = new XMLSerializer();
  let html = serializer.serializeToString(clone);

  // Fix doctype
  html = '<!DOCTYPE html>\n' + html.replace(/^<html[^>]*>/, '<html lang="ko">');

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = 'design-youth.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('✅ design-youth.html 다운로드 완료!');
}
