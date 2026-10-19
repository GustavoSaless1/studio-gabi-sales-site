'use strict';

// Categoria e expansão progressiva: todas as fotos continuam no documento.
const galleryGroups = [...document.querySelectorAll('.gallery-group')];
const galleryFilters = document.querySelector('.gallery-filters');
const allImages = [...document.querySelectorAll('.lb-img')];
const videos = [...document.querySelectorAll('video')];
const categoryLabels = {cabelo:'Cabelo · Gabrielle',unhas:'Unhas · Gabriela',cilios:'Cílios · Gabriela'};
let activeCategory = 'todos';

document.querySelectorAll('[data-expand-gallery]').forEach(button => {
  const items = [...button.closest('.gallery-group').querySelectorAll('.lb-item')];
  let expanded = false;
  function setExpanded(value){
    expanded = value;
    items.forEach((item,index) => item.hidden = !expanded && index >= 8);
    button.setAttribute('aria-expanded',String(expanded));
    button.textContent = expanded ? 'Mostrar menos fotos' : `Ver as ${items.length} fotos de ${button.dataset.categoryName}`;
  }
  setExpanded(false);
  button.hidden = items.length <= 8;
  button.addEventListener('click',() => {
    setExpanded(!expanded);
    if (expanded) items[8]?.querySelector('img').focus({preventScroll:true});
  });
});
galleryFilters.hidden = false;
galleryFilters.addEventListener('click', event => {
  const button = event.target.closest('button[data-filter]');
  if (!button) return;
  activeCategory = button.dataset.filter;
  galleryFilters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed',String(item === button)));
  galleryGroups.forEach(group => group.hidden = activeCategory !== 'todos' && group.dataset.category !== activeCategory);
  videos.forEach(video => video.pause());
  const count = allImages.filter(img => activeCategory === 'todos' || img.closest('.gallery-group').dataset.category === activeCategory).length;
  document.getElementById('galleryStatus').textContent = activeCategory === 'videos'
    ? '5 vídeos. Abra um vídeo e use as setas para passar ao próximo.'
    : `${count} fotos${activeCategory === 'todos' ? ' e 5 vídeos' : ''}. Toque em uma foto para ampliar e passar para a próxima.`;
});

// Modal nativo: mantém o teclado dentro da galeria e bloqueia o fundo.
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCounter = document.getElementById('lightboxCounter');
const closeButton = document.getElementById('lightboxClose');
let visibleImages = allImages;
let currentIndex = 0;
let lastImage = null;
let touchStart = null;
let ignoreClickUntil = 0;

function showImage(index){
  currentIndex = (index + visibleImages.length) % visibleImages.length;
  const img = visibleImages[currentIndex];
  lightboxImg.src = img.currentSrc || img.src;
  lightboxImg.alt = img.alt;
  const name = categoryLabels[img.closest('.gallery-group').dataset.category];
  lightboxCounter.textContent = `${currentIndex + 1} / ${visibleImages.length} · ${name}`;
}
function closeGallery(){
  lightbox.close();
}
allImages.forEach((img,index) => {
  img.tabIndex = 0;
  img.setAttribute('role','button');
  img.setAttribute('aria-label',`${img.alt}. Foto ${index + 1}. Abrir na galeria.`);
  function open(){
    visibleImages = allImages.filter(item => activeCategory === 'todos' || item.closest('.gallery-group').dataset.category === activeCategory);
    lastImage = img;
    showImage(visibleImages.indexOf(img));
    lightbox.showModal();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    closeButton.focus();
    videos.forEach(video => video.pause());
  }
  img.addEventListener('click',open);
  img.addEventListener('keydown',event => {
    if (event.key === 'Enter' || event.key === ' ') {event.preventDefault();open();}
  });
});
closeButton.addEventListener('click',closeGallery);
lightbox.addEventListener('close',() => {
  lightbox.classList.remove('open');
  lightboxImg.removeAttribute('src');
  document.body.style.overflow = '';
  lastImage?.focus({preventScroll:true});
});
document.getElementById('lightboxPrev').addEventListener('click',() => showImage(currentIndex - 1));
document.getElementById('lightboxNext').addEventListener('click',() => showImage(currentIndex + 1));
lightbox.addEventListener('click',event => {if (event.target === lightbox) closeGallery();});
lightbox.addEventListener('keydown',event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();showImage(currentIndex + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
lightboxImg.addEventListener('click',() => {if (Date.now() > ignoreClickUntil) showImage(currentIndex + 1);});
lightboxImg.addEventListener('touchstart',event => {
  touchStart = event.touches.length === 1 ? {x:event.touches[0].clientX,y:event.touches[0].clientY} : null;
},{passive:true});
lightboxImg.addEventListener('touchend',event => {
  if (!touchStart) return;
  const dx = event.changedTouches[0].clientX - touchStart.x;
  const dy = event.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    ignoreClickUntil = Date.now() + 500;
    showImage(currentIndex + (dx < 0 ? 1 : -1));
  }
  touchStart = null;
},{passive:true});
lightboxImg.addEventListener('touchcancel',() => {touchStart = null;});

// O menu fechado não recebe foco. Escape e clique fora fecham o menu.
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
function setMenu(open){
  navLinks.classList.toggle('open',open);
  navToggle.setAttribute('aria-expanded',String(open));
  navToggle.setAttribute('aria-label',open ? 'Fechar menu' : 'Abrir menu');
}
navToggle.addEventListener('click',() => setMenu(!navLinks.classList.contains('open')));
navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click',() => setMenu(false)));
document.addEventListener('click',event => {if (!event.target.closest('.nav')) setMenu(false);});
document.addEventListener('keydown',event => {
  if (event.key === 'Escape' && navLinks.classList.contains('open')) {setMenu(false);navToggle.focus();}
});
matchMedia('(max-width:860px)').addEventListener('change',() => setMenu(false));

// Galeria ampliada dos vídeos: mantém as setas disponíveis no computador e no celular.
const videoDialog = document.createElement('dialog');
videoDialog.className = 'lightbox-overlay video-lightbox';
videoDialog.setAttribute('aria-label','Visualização ampliada dos vídeos');
videoDialog.innerHTML = `
  <button class="lightbox-close" type="button" aria-label="Fechar vídeo">&times;</button>
  <button class="lightbox-nav lightbox-prev" type="button" aria-label="Vídeo anterior">&#8249;</button>
  <video class="video-lightbox-player" controls playsinline preload="metadata" controlslist="nofullscreen nodownload noremoteplayback" disablepictureinpicture></video>
  <button class="lightbox-nav lightbox-next" type="button" aria-label="Próximo vídeo">&#8250;</button>
  <span class="lightbox-counter" aria-live="polite"></span>`;
document.body.append(videoDialog);

const videoPlayer = videoDialog.querySelector('.video-lightbox-player');
const videoCounter = videoDialog.querySelector('.lightbox-counter');
const videoClose = videoDialog.querySelector('.lightbox-close');
let currentVideoIndex = 0;
let lastVideoButton = null;

function showVideo(index,playNow = true){
  currentVideoIndex = (index + videos.length) % videos.length;
  const thumbnail = videos[currentVideoIndex];
  const source = thumbnail.querySelector('source');
  videoPlayer.pause();
  videoPlayer.poster = thumbnail.poster;
  videoPlayer.src = source.currentSrc || source.src;
  videoPlayer.load();
  videoCounter.textContent = `${currentVideoIndex + 1} / ${videos.length} · Cabelo · Gabrielle`;
  if (playNow) videoPlayer.play().catch(() => {});
}
function openVideo(index,button){
  videos.forEach(video => video.pause());
  lastVideoButton = button;
  videoDialog.showModal();
  videoDialog.classList.add('open');
  document.body.style.overflow = 'hidden';
  showVideo(index,true);
  videoClose.focus({preventScroll:true});
}
function closeVideo(){
  videoDialog.close();
}
videos.forEach((video,index) => {
  const label = video.getAttribute('aria-label') || `Resultado de cabelo com Gabrielle, vídeo ${index + 1}`;
  video.setAttribute('aria-hidden','true');
  video.controls = false;
  video.tabIndex = -1;
  const card = document.createElement('div');
  card.className = 'video-card';
  video.before(card);
  card.append(video);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'video-open';
  button.setAttribute('aria-label',`${label}. Abrir vídeo ${index + 1} de ${videos.length}.`);
  button.innerHTML = '<span aria-hidden="true">▶</span>';
  button.addEventListener('click',() => openVideo(index,button));
  card.append(button);
});
videoClose.addEventListener('click',closeVideo);
videoDialog.querySelector('.lightbox-prev').addEventListener('click',() => showVideo(currentVideoIndex - 1));
videoDialog.querySelector('.lightbox-next').addEventListener('click',() => showVideo(currentVideoIndex + 1));
videoDialog.addEventListener('click',event => {if (event.target === videoDialog) closeVideo();});
videoDialog.addEventListener('keydown',event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showVideo(currentVideoIndex + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
videoDialog.addEventListener('close',() => {
  videoDialog.classList.remove('open');
  videoPlayer.pause();
  videoPlayer.removeAttribute('src');
  videoPlayer.load();
  document.body.style.overflow = '';
  lastVideoButton?.focus({preventScroll:true});
});
document.addEventListener('visibilitychange',() => {
  if (document.hidden) {
    videos.forEach(video => video.pause());
    videoPlayer.pause();
  }
});

// Mantém todos os depoimentos existentes disponíveis, sem alongar a página inicial.
const testimonials = document.getElementById('testimonials');
const extraTestimonials = [...testimonials.children].slice(3);
if (extraTestimonials.length){
  const more = document.createElement('button');
  more.type = 'button';more.className = 'btn btn-ghost more-testimonials';
  more.textContent = 'Ler mais depoimentos';more.setAttribute('aria-expanded','false');
  more.setAttribute('aria-controls','testimonials');
  extraTestimonials.forEach(item => item.hidden = true);
  testimonials.after(more);
  more.addEventListener('click',() => {
    const expand = more.getAttribute('aria-expanded') !== 'true';
    extraTestimonials.forEach(item => item.hidden = !expand);
    more.setAttribute('aria-expanded',String(expand));
    more.textContent = expand ? 'Mostrar menos depoimentos' : 'Ler mais depoimentos';
  });
}

// Solicitação de agendamento: não representa uma reserva confirmada.
const form = document.getElementById('bookingForm');
const dateField = document.getElementById('f-data');
const phoneField = document.getElementById('f-telefone');
const nameField = document.getElementById('f-nome');
const professionalField = document.getElementById('f-profissional');
const serviceField = document.getElementById('f-servico');
const bookingResult = document.getElementById('bookingResult');
const bookingLink = document.getElementById('bookingLink');
function todayInSaoPaulo(){
  const parts = new Intl.DateTimeFormat('en',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const value = type => parts.find(part => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
function validateDate(){
  dateField.min = todayInSaoPaulo();
  const value = dateField.value;
  const weekday = value ? new Date(`${value}T12:00:00`).getDay() : -1;
  dateField.setCustomValidity(weekday === 0 || weekday === 1 ? 'Escolha uma data de terça a sábado.' : '');
}
function validatePhone(){
  const digits = phoneField.value.replace(/\D/g,'');
  const domestic = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;
  phoneField.setCustomValidity(domestic.length === 10 || domestic.length === 11 ? '' : 'Informe um telefone com DDD, por exemplo (11) 90000-0000.');
}
function validateName(){nameField.setCustomValidity(nameField.value.trim() ? '' : 'Informe seu nome.');}
validateDate();
dateField.addEventListener('focus',validateDate);
dateField.addEventListener('input',validateDate);
phoneField.addEventListener('input',validatePhone);
nameField.addEventListener('input',validateName);
serviceField.addEventListener('change',() => {
  const selectedProfessional = serviceField.selectedOptions[0].dataset.professional;
  if (selectedProfessional) professionalField.value = selectedProfessional;
});
professionalField.addEventListener('change',() => {
  const selectedProfessional = serviceField.selectedOptions[0].dataset.professional;
  if (selectedProfessional && selectedProfessional !== professionalField.value) serviceField.value = '';
});
form.addEventListener('input',() => {bookingResult.hidden = true;bookingLink.removeAttribute('href');});
form.addEventListener('change',() => {bookingResult.hidden = true;bookingLink.removeAttribute('href');});
form.addEventListener('submit',event => {
  event.preventDefault();
  validateDate();validatePhone();validateName();
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  const date = values.get('data').split('-').reverse().join('/');
  const message = [
    'Olá! Gostaria de solicitar um horário no Studio Gabi Sales.',
    `Nome: ${values.get('nome').trim()}`,
    `Telefone: ${values.get('telefone').trim()}`,
    `Profissional: ${values.get('profissional')}`,
    `Serviço: ${values.get('servico')}`,
    `Data desejada: ${date}`,
    `Horário desejado: ${values.get('hora')}`,
    `Observações: ${values.get('obs').trim() || '-'}`,
    'Aguardo a confirmação de disponibilidade. Obrigada!'
  ].join('\n');
  const url = `https://wa.me/5511977026143?text=${encodeURIComponent(message)}`;
  bookingLink.href = url;
  bookingResult.hidden = false;
  window.open(url,'_blank','noopener,noreferrer');
});
