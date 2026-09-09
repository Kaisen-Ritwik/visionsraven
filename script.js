/* ─── Lenis Smooth Scroll ─── */
const lenis = (typeof Lenis !== 'undefined') ? new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 1.0,
  smoothTouch: false,
  infinite: false,
}) : null;

if (lenis) {
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

/* ─── Custom cursor ─── */
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
const cursor = document.createElement('div');

if (!isTouchDevice) {
  cursor.className = 'cursor';
  cursor.style.display = 'none';
  cursor.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 20 20" fill="currentColor"><path d="M0 0 V17 L4.5 12.5 L7.5 19.5 L9.5 18.7 L6.5 11.7 L12 11.5 Z" /></svg>`;
  document.body.append(cursor);
  document.body.classList.add('has-custom-cursor');

  let mouseX = 0, mouseY = 0;
  let isMoving = false;
  let isMouseInWindow = true;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Immediately hide cursor if it gets too close or goes outside the window boundaries
    if (mouseX <= 1 || mouseY <= 1 || mouseX >= window.innerWidth - 1 || mouseY >= window.innerHeight - 1) {
      cursor.style.display = 'none';
      return;
    }

    if (!isMoving && isMouseInWindow) {
      isMoving = true;
      requestAnimationFrame(() => {
        if (cursor.style.display === 'none') {
          cursor.style.display = 'block';
        }
        cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
        isMoving = false;
      });
    }
  });

  document.addEventListener('mouseleave', () => {
    isMouseInWindow = false;
    cursor.style.display = 'none';
    cursor.classList.remove('cursor-hover');
  });

  document.addEventListener('mouseenter', () => {
    isMouseInWindow = true;
  });

  // Event delegation for custom cursor to support dynamic and static interactive items
  document.body.addEventListener('mouseover', e => {
    const target = e.target.closest('a, button, .item-wrapper, .work-card');
    if (target) {
      cursor.classList.add('cursor-hover');
    }
  });
  document.body.addEventListener('mouseout', e => {
    const target = e.target.closest('a, button, .item-wrapper, .work-card');
    if (target) {
      cursor.classList.remove('cursor-hover');
    }
  });
} else {
  document.body.style.cursor = 'auto';
}

/* ─── Staggered Menu ─── */
const menuToggle  = document.getElementById('menu-toggle');
const menuWrapper = document.getElementById('staggered-menu-wrapper');
const menuClose   = document.getElementById('menu-close');
const menuPanel   = document.getElementById('staggered-menu-panel');
const preLayers   = Array.from(document.querySelectorAll('.sm-prelayer'));
const pillNav     = document.getElementById('pill-nav');
const smBackdrop  = document.getElementById('sm-backdrop');

let isMenuOpen = false;
let isMenuAnimating = false;
let openMenuTimeline = null;
let closeMenuTween = null;

// Initial state: hide panels offscreen to right with hardware acceleration
gsap.set([menuPanel, ...preLayers], { xPercent: 100, force3D: true });
if (smBackdrop) gsap.set(smBackdrop, { opacity: 0, force3D: true });

function openMenu() {
  if (isMenuOpen) return;
  isMenuOpen = true;
  isMenuAnimating = true;

  const itemLabels = Array.from(menuPanel.querySelectorAll('.sm-panel-itemLabel'));
  const numberItems = Array.from(menuPanel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
  const socialTitle = menuPanel.querySelector('.sm-socials-title');
  const socialLinks = Array.from(menuPanel.querySelectorAll('.sm-socials-link'));

  if (closeMenuTween) {
    closeMenuTween.kill();
    closeMenuTween = null;
  }

  // Pre-set letter-stagger, numbering, and social links styles for entrance reveal
  if (itemLabels.length) {
    gsap.set(itemLabels, { yPercent: 140, rotate: 10, force3D: true });
  }
  if (numberItems.length) {
    gsap.set(numberItems, { '--sm-num-opacity': 0 });
  }
  if (socialTitle) {
    gsap.set(socialTitle, { opacity: 0 });
  }
  if (socialLinks.length) {
    gsap.set(socialLinks, { y: 25, opacity: 0, force3D: true });
  }

  // Display wrapper panel & apply background blur class
  gsap.set(menuWrapper, { display: 'block' });
  document.body.classList.add('menu-open');
  document.body.style.overflow = 'hidden';
  if (lenis) lenis.stop();

  openMenuTimeline = gsap.timeline({
    onComplete: () => {
      isMenuAnimating = false;
    }
  });

  // 0. Fade in backdrop blur overlay (Hardware GPU accelerated opacity transition)
  if (smBackdrop) {
    openMenuTimeline.to(smBackdrop, {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out',
      force3D: true
    }, 0);
  }

  // 1. Underlay layers slide in
  preLayers.forEach((layer, i) => {
    openMenuTimeline.fromTo(layer, 
      { xPercent: 100 }, 
      { xPercent: 0, duration: 0.45, ease: 'power3.out', force3D: true }, 
      i * 0.06
    );
  });

  const lastTime = preLayers.length ? (preLayers.length - 1) * 0.06 : 0;
  const panelInsertTime = lastTime + (preLayers.length ? 0.06 : 0);
  const panelDuration = 0.55;

  // 2. Main panel slides in
  openMenuTimeline.fromTo(menuPanel,
    { xPercent: 100 },
    { xPercent: 0, duration: panelDuration, ease: 'power3.out', force3D: true },
    panelInsertTime
  );

  // 3. Menu items reveal (slide up and rotate)
  if (itemLabels.length) {
    const itemsStart = panelInsertTime + panelDuration * 0.15;
    openMenuTimeline.to(itemLabels, {
      yPercent: 0,
      rotate: 0,
      duration: 0.85,
      ease: 'power3.out',
      force3D: true,
      stagger: { each: 0.08, from: 'start' }
    }, itemsStart);

    if (numberItems.length) {
      openMenuTimeline.to(numberItems, {
        duration: 0.5,
        ease: 'power2.out',
        '--sm-num-opacity': 1,
        stagger: { each: 0.06, from: 'start' }
      }, itemsStart + 0.08);
    }
  }

  // 4. Social info reveals (fade and slide up)
  if (socialTitle || socialLinks.length) {
    const socialsStart = panelInsertTime + panelDuration * 0.4;
    if (socialTitle) {
      openMenuTimeline.to(socialTitle, {
        opacity: 1,
        duration: 0.45,
        ease: 'power2.out'
      }, socialsStart);
    }
    if (socialLinks.length) {
      openMenuTimeline.to(socialLinks, {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: 'power3.out',
        force3D: true,
        stagger: { each: 0.06, from: 'start' }
      }, socialsStart + 0.04);
    }
  }
}

function closeMenu() {
  if (!isMenuOpen) return;
  isMenuOpen = false;
  isMenuAnimating = true;

  if (openMenuTimeline) {
    openMenuTimeline.kill();
    openMenuTimeline = null;
  }

  // Restore scrolling & remove background blur class immediately
  document.body.classList.remove('menu-open');
  document.body.style.overflow = '';
  if (lenis) lenis.start();

  const allLayers = [...preLayers, menuPanel];

  closeMenuTween = gsap.timeline({
    onComplete: () => {
      gsap.set(menuWrapper, { display: 'none' });

      // Reset values
      const itemLabels = Array.from(menuPanel.querySelectorAll('.sm-panel-itemLabel'));
      if (itemLabels.length) gsap.set(itemLabels, { yPercent: 140, rotate: 10 });

      const numberItems = Array.from(menuPanel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
      if (numberItems.length) gsap.set(numberItems, { '--sm-num-opacity': 0 });

      const socialTitle = menuPanel.querySelector('.sm-socials-title');
      const socialLinks = Array.from(menuPanel.querySelectorAll('.sm-socials-link'));
      if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
      if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

      isMenuAnimating = false;
    }
  });

  closeMenuTween.to(allLayers, {
    xPercent: 100,
    duration: 0.3,
    ease: 'power3.in',
    force3D: true
  }, 0);

  if (smBackdrop) {
    closeMenuTween.to(smBackdrop, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      force3D: true
    }, 0);
  }
}

menuToggle.addEventListener('click', openMenu);
menuClose.addEventListener('click', closeMenu);

// Close menu on click outside the panel
document.addEventListener('mousedown', (event) => {
  if (isMenuOpen && menuPanel && !menuPanel.contains(event.target) && menuToggle && !menuToggle.contains(event.target)) {
    closeMenu();
  }
});

// Close menu on link click
document.querySelectorAll('.sm-panel-item').forEach(l => l.addEventListener('click', closeMenu));

// Hide pill when menu open
new MutationObserver(() => {
  const open = menuWrapper.style.display !== 'none';
  pillNav.style.opacity = open ? '0' : '1';
  pillNav.style.pointerEvents = open ? 'none' : 'all';
}).observe(menuWrapper, { attributes: true, attributeFilter: ['style'] });

/* ─── Masonry Component Initialization ─── */
let masonry;
document.addEventListener('DOMContentLoaded', () => {
  masonry = new Masonry('#masonry-grid', {
    ease: 'power3.out',
    duration: 0.6,
    stagger: 0.05,
    animateFrom: 'bottom',
    scaleOnHover: true,
    hoverScale: 0.95,
    blurToFocus: true,
    colorShiftOnHover: false,
    onItemClick: (item, index) => {
      openLB(index);
    }
  });
});

/* ─── Lightbox ─── */
const lightbox = document.getElementById('lightbox');
const lbImg    = document.getElementById('lightbox-img');
const lbTitle  = document.getElementById('lb-title');
const lbType   = document.getElementById('lb-type');
let cur = 0;

function openLB(i){
  if (!masonry || !masonry.items || masonry.items.length === 0) return;
  cur = i;
  const item = masonry.items[i];
  lbImg.src  = item.img;
  lbImg.alt  = item.alt;
  lbTitle.textContent = item.title || '';
  lbType.textContent  = item.type  || '';
  lightbox.classList.add('open');
  document.body.style.overflow='hidden';
  if (typeof lenis !== 'undefined') lenis.stop();
}
function closeLB(){
  lightbox.classList.remove('open');
  document.body.style.overflow='';
  if (typeof lenis !== 'undefined') lenis.start();
}

document.getElementById('lightbox-close').addEventListener('click', closeLB);
lightbox.addEventListener('click', e=>{ if(e.target===lightbox) closeLB(); });
document.getElementById('lb-prev').addEventListener('click', e=>{
  e.stopPropagation();
  const len = masonry ? masonry.items.length : 0;
  if (len) openLB((cur - 1 + len) % len);
});
document.getElementById('lb-next').addEventListener('click', e=>{
  e.stopPropagation();
  const len = masonry ? masonry.items.length : 0;
  if (len) openLB((cur + 1) % len);
});
document.addEventListener('keydown', e=>{
  if(!lightbox.classList.contains('open')) return;
  const len = masonry ? masonry.items.length : 0;
  if (!len) return;
  if(e.key==='Escape')      closeLB();
  if(e.key==='ArrowLeft')  openLB((cur - 1 + len) % len);
  if(e.key==='ArrowRight') openLB((cur + 1) % len);
});

/* ─── SplitText Animation Utility ─── */
function splitTextElement(element, splitType = 'chars') {
  const nodes = Array.from(element.childNodes);
  nodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (!text.trim()) return;

      const wrapper = document.createDocumentFragment();
      const tokens = text.split(/(\s+)/);
      tokens.forEach(token => {
        if (/\s+/.test(token)) {
          wrapper.appendChild(document.createTextNode(token));
        } else {
          const wordSpan = document.createElement('span');
          wordSpan.className = 'split-word';
          wordSpan.style.display = 'inline-block';
          wordSpan.style.whiteSpace = 'nowrap';
          
          if (splitType === 'chars') {
            const chars = token.split('');
            chars.forEach(char => {
              const charSpan = document.createElement('span');
              charSpan.className = 'split-char';
              charSpan.style.display = 'inline-block';
              charSpan.textContent = char;
              wordSpan.appendChild(charSpan);
            });
          } else {
            wordSpan.textContent = token;
          }
          wrapper.appendChild(wordSpan);
        }
      });
      element.replaceChild(wrapper, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName.toLowerCase() === 'br') return;
      splitTextElement(node, splitType);
    }
  });
}

function initSplitTextAnimation(selector, options = {}) {
  const defaults = {
    delay: 50,
    duration: 1.25,
    ease: 'power3.out',
    splitType: 'chars',
    from: { opacity: 0, y: 40 },
    to: { opacity: 1, y: 0 },
    threshold: 0.1,
    rootMargin: '-100px',
  };

  const settings = { ...defaults, ...options };
  const elements = document.querySelectorAll(selector);

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn("GSAP or ScrollTrigger is not loaded.");
    return;
  }

  elements.forEach(el => {
    // Store original HTML structure to revert to it later
    if (!el.dataset.originalHtml) {
      el.dataset.originalHtml = el.innerHTML;
    }

    // Perform split
    splitTextElement(el, settings.splitType);

    // Get targets
    const targets = settings.splitType.includes('chars') 
      ? el.querySelectorAll('.split-char') 
      : el.querySelectorAll('.split-word');

    if (!targets.length) return;

    // Apply basic styles
    el.style.overflow = 'hidden';
    el.style.display = 'inline-block';
    el.style.width = '100%';

    // Start threshold scroll trigger calculation
    const startPct = (1 - settings.threshold) * 100;
    const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(settings.rootMargin);
    const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
    const marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
    const sign = marginValue === 0 ? '' : (marginValue < 0 ? `-=${Math.abs(marginValue)}${marginUnit}` : `+=${marginValue}${marginUnit}`);
    const startTrigger = `top ${startPct}%${sign}`;

    // Animate
    gsap.fromTo(targets, 
      { ...settings.from },
      {
        ...settings.to,
        duration: settings.duration,
        ease: settings.ease,
        stagger: settings.delay / 1000,
        scrollTrigger: {
          trigger: el,
          start: startTrigger,
          once: true,
          fastScrollEnd: true,
          anticipatePin: 0.4
        },
        willChange: 'transform, opacity',
        force3D: true,
        onComplete: () => {
          // Revert element to its clean, original static HTML structure once animated.
          // This garbage-collects all generated <span> nodes and releases GPU layer memory!
          if (settings.to.opacity !== undefined) {
            el.style.opacity = settings.to.opacity;
          }
          el.innerHTML = el.dataset.originalHtml;
          
          if (typeof settings.onLetterAnimationComplete === 'function') {
            settings.onLetterAnimationComplete();
          }
        }
      }
    );
  });
}

/* Initialize text animations when DOM is ready and fonts are loaded */
document.addEventListener('DOMContentLoaded', () => {
  // Register ScrollTrigger plugin with GSAP
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    
    // Performance optimizations for low-end machines
    ScrollTrigger.config({
      limitCallbacks: true,
      autoRefreshEvents: "visibilitychange,DOMContentLoaded,load"
    });
    ScrollTrigger.clearScrollMemory();
  }

  const initAnimations = () => {
    // Overlines
    initSplitTextAnimation('.overline', {
      splitType: 'chars',
      delay: 20,
      duration: 0.6,
      ease: 'power3.out',
      from: { opacity: 0, y: 10 },
      to: { opacity: 0.5, y: 0 },
      threshold: 0.1,
      rootMargin: '-80px'
    });

    // Hero Heading (large reveal)
    initSplitTextAnimation('.hero-center .display-heading', {
      splitType: 'chars',
      delay: 50,
      duration: 0.8,
      ease: 'power3.out',
      from: { opacity: 0, y: 50 },
      to: { opacity: 1, y: 0 },
      threshold: 0.1,
      rootMargin: '-50px'
    });

    // Hero Subheading (word split)
    initSplitTextAnimation('.hero-sub', {
      splitType: 'words',
      delay: 15,
      duration: 0.7,
      ease: 'power3.out',
      from: { opacity: 0, y: 15 },
      to: { opacity: 0.5, y: 0 },
      threshold: 0.1,
      rootMargin: '-50px'
    });

    // About Heading
    initSplitTextAnimation('.about-center .display-heading', {
      splitType: 'chars',
      delay: 30,
      duration: 0.7,
      ease: 'power3.out',
      from: { opacity: 0, y: 35 },
      to: { opacity: 1, y: 0 },
      threshold: 0.15,
      rootMargin: '-80px'
    });

    // About Body (word split)
    initSplitTextAnimation('.about-body', {
      splitType: 'words',
      delay: 12,
      duration: 0.6,
      ease: 'power3.out',
      from: { opacity: 0, y: 15 },
      to: { opacity: 0.65, y: 0 },
      threshold: 0.1,
      rootMargin: '-80px'
    });

    // Work Heading
    initSplitTextAnimation('.work-intro .display-heading', {
      splitType: 'chars',
      delay: 30,
      duration: 0.7,
      ease: 'power3.out',
      from: { opacity: 0, y: 35 },
      to: { opacity: 1, y: 0 },
      threshold: 0.15,
      rootMargin: '-80px'
    });

    // Services Heading
    initSplitTextAnimation('.services-intro .display-heading', {
      splitType: 'chars',
      delay: 30,
      duration: 0.7,
      ease: 'power3.out',
      from: { opacity: 0, y: 35 },
      to: { opacity: 1, y: 0 },
      threshold: 0.15,
      rootMargin: '-80px'
    });

    // Service Names (char split)
    initSplitTextAnimation('.service-name', {
      splitType: 'chars',
      delay: 20,
      duration: 0.6,
      ease: 'power3.out',
      from: { opacity: 0, y: 20 },
      to: { opacity: 1, y: 0 },
      threshold: 0.1,
      rootMargin: '-80px'
    });

    // Service Descriptions (word split)
    initSplitTextAnimation('.service-desc', {
      splitType: 'words',
      delay: 12,
      duration: 0.6,
      ease: 'power3.out',
      from: { opacity: 0, y: 15 },
      to: { opacity: 0.5, y: 0 },
      threshold: 0.1,
      rootMargin: '-80px'
    });

    // Contact Heading
    initSplitTextAnimation('.contact-center .contact-heading', {
      splitType: 'chars',
      delay: 50,
      duration: 0.8,
      ease: 'power3.out',
      from: { opacity: 0, y: 40 },
      to: { opacity: 1, y: 0 },
      threshold: 0.15,
      rootMargin: '-80px'
    });

    // Contact Subtitle (word split)
    initSplitTextAnimation('.contact-sub', {
      splitType: 'words',
      delay: 15,
      duration: 0.7,
      ease: 'power3.out',
      from: { opacity: 0, y: 15 },
      to: { opacity: 0.45, y: 0 },
      threshold: 0.1,
      rootMargin: '-80px'
    });
  };

  const startPreloader = () => {
    const tl = gsap.timeline({
      onComplete: () => {
        const preloader = document.getElementById('preloader');
        if (preloader) preloader.remove();
        document.body.style.overflow = '';
        if (lenis) lenis.start();
      }
    });

    // Stop scrolling
    if (lenis) lenis.stop();
    document.body.style.overflow = 'hidden';

    // Set initial style of preloader logo wrap
    gsap.set('.preloader-logo-wrap', { opacity: 0, scale: 0.9 });

    tl.to('.preloader-logo-wrap', {
      opacity: 1,
      scale: 1,
      duration: 1.0,
      ease: 'power3.out'
    })
    .to('.preloader-logo-wrap', {
      opacity: 0,
      scale: 0.95,
      duration: 0.6,
      ease: 'power3.in',
      delay: 0.8
    })
    .to('.preloader', {
      yPercent: -100,
      duration: 0.8,
      ease: 'power4.inOut',
      onStart: () => {
        initAnimations();
      }
    }, '-=0.2');
  };

  if (document.fonts && document.fonts.status !== 'loaded') {
    document.fonts.ready.then(startPreloader);
  } else {
    startPreloader();
  }
});

// Intercept local anchors to scroll smoothly via Lenis
document.addEventListener('click', function(e) {
  const anchor = e.target.closest('a[href^="#"]');
  if (!anchor) return;
  
  const targetId = anchor.getAttribute('href');
  if (targetId === '#') return;
  
  const target = document.querySelector(targetId);
  if (target) {
    e.preventDefault();
    
    // If clicking a menu link, close the menu first
    if (anchor.classList.contains('menu-link') || anchor.classList.contains('sm-panel-item')) {
      closeMenu();
    }
    
    if (lenis) lenis.scrollTo(target);
  }
});

/* ─── ClickSpark Animation (React Bits Variant) ─── */
class ClickSpark {
  constructor(options = {}) {
    this.sparkColor = options.sparkColor || '#ffffff';
    this.sparkSize = options.sparkSize || 10;
    this.sparkRadius = options.sparkRadius || 15;
    this.sparkCount = options.sparkCount || 8;
    this.duration = options.duration || 400;
    this.easing = options.easing || 'ease-out';
    this.extraScale = options.extraScale || 1.0;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'click-spark-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '99999';
    this.canvas.style.mixBlendMode = 'difference';
    
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    this.sparks = [];
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    document.addEventListener('click', (e) => this.handleClick(e));
    this.animating = false;
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  easeFunc(t) {
    switch (this.easing) {
      case 'linear':
        return t;
      case 'ease-in':
        return t * t;
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default:
        return t * (2 - t); // ease-out
    }
  }

  handleClick(e) {
    const x = e.clientX;
    const y = e.clientY;
    const now = performance.now();
    
    const newSparks = Array.from({ length: this.sparkCount }, (_, i) => ({
      x,
      y,
      angle: (2 * Math.PI * i) / this.sparkCount,
      startTime: now
    }));
    
    this.sparks.push(...newSparks);
    
    // Lazy-start render loop only when active sparks exist, avoiding idle CPU drain!
    if (!this.animating) {
      this.animating = true;
      requestAnimationFrame((t) => this.draw(t));
    }
  }

  draw(timestamp) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    const currentTime = timestamp || performance.now();
    
    this.sparks = this.sparks.filter(spark => {
      const elapsed = currentTime - spark.startTime;
      if (elapsed >= this.duration) {
        return false;
      }
      
      const progress = elapsed / this.duration;
      const eased = this.easeFunc(progress);
      
      const distance = eased * this.sparkRadius * this.extraScale;
      const lineLength = this.sparkSize * (1 - eased);
      
      const x1 = spark.x + distance * Math.cos(spark.angle);
      const y1 = spark.y + distance * Math.sin(spark.angle);
      const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
      const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);
      
      this.ctx.strokeStyle = this.sparkColor;
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
      
      return true;
    });
    
    if (this.sparks.length > 0) {
      requestAnimationFrame((t) => this.draw(t));
    } else {
      this.animating = false;
    }
  }
}

// Instantiate ClickSpark globally
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ClickSpark({
      sparkColor: '#ffffff',
      sparkSize: 10,
      sparkRadius: 15,
      sparkCount: 8,
      duration: 400,
      extraScale: 1.0
    });
  });
} else {
  new ClickSpark({
    sparkColor: '#ffffff',
    sparkSize: 10,
    sparkRadius: 15,
    sparkCount: 8,
    duration: 400,
    extraScale: 1.0
  });
}


