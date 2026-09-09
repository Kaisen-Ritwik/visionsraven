/**
 * Masonry - Vanilla JS + GSAP adaptation of the React Bits Masonry Component.
 * Responsive, animated masonry grid layout.
 */
class Masonry {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) {
      console.warn(`Masonry container element not found.`);
      return;
    }

    // Default configuration (matching React Bits props)
    this.options = {
      ease: options.ease || 'power3.out',
      duration: options.duration !== undefined ? options.duration : 0.6,
      stagger: options.stagger !== undefined ? options.stagger : 0.05,
      animateFrom: options.animateFrom || 'bottom',
      scaleOnHover: options.scaleOnHover !== undefined ? options.scaleOnHover : true,
      hoverScale: options.hoverScale !== undefined ? options.hoverScale : 0.95,
      blurToFocus: options.blurToFocus !== undefined ? options.blurToFocus : true,
      colorShiftOnHover: options.colorShiftOnHover !== undefined ? options.colorShiftOnHover : false,
      items: options.items || null,
      onItemClick: options.onItemClick || null
    };

    this.items = [];
    this.gridItems = [];
    this.hasMounted = false;
    this.resizeObserver = null;

    this.init();
  }

  async init() {
    // 1. Parse items from DOM if not passed programmatically
    if (!this.options.items) {
      this.items = this.parseItemsFromDOM();
    } else {
      this.items = this.options.items;
    }

    if (this.items.length === 0) {
      console.warn('Masonry: No items found to display.');
      return;
    }

    // Set default aspect ratios so the grid renders immediately
    this.items.forEach(item => {
      item.aspectRatio = item.aspectRatio || 1.33; // Default 4:3 aspect ratio
    });

    // 2. Render HTML grid structure immediately
    this.createGridElements();

    // 3. Setup lazy loading with Intersection Observer
    this.setupLazyLoading();

    // 4. Listen to element resizes for dynamic masonry layout updating
    this.setupResizeObserver();
  }

  parseItemsFromDOM() {
    const rawItems = Array.from(this.container.querySelectorAll('.work-item, .work-card'));
    return rawItems.map((el, index) => {
      const imgEl = el.querySelector('img');
      const imgUrl = imgEl ? imgEl.getAttribute('src') : '';
      const altText = imgEl ? imgEl.getAttribute('alt') : '';

      return {
        id: el.dataset.id || String(index + 1),
        img: imgUrl,
        alt: altText,
        title: el.dataset.title || '',
        type: el.dataset.type || '',
        year: el.dataset.year || '',
        quarter: el.dataset.quarter || '',
        service: el.dataset.service || '',
        url: el.dataset.url || ''
      };
    });
  }

  setupLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: load everything immediately if no observer support
      this.gridItems.forEach((item, index) => {
        this.loadItemImage(item, index);
      });
      return;
    }

    const observerOptions = {
      root: null, // viewport
      rootMargin: '200px 0px', // Load images 200px before entering viewport
      threshold: 0.01
    };

    this.intersectionObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const index = this.gridItems.findIndex(item => item.el === el);
          if (index !== -1) {
            this.loadItemImage(this.gridItems[index], index);
            obs.unobserve(el);
          }
        }
      });
    }, observerOptions);

    this.gridItems.forEach(item => {
      this.intersectionObserver.observe(item.el);
    });
  }

  loadItemImage(item, index) {
    if (item.imageLoaded) return;
    item.imageLoaded = true;

    if (!item.img) {
      if (item.imgContainer) {
        item.imgContainer.style.opacity = '1';
      }
      return;
    }

    const img = new Image();
    img.decoding = 'async'; // Offload image decoding to GPU background thread
    img.src = item.img;
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      this.items[index].aspectRatio = ratio;
      item.aspectRatio = ratio;

      if (item.imgContainer) {
        item.imgContainer.style.backgroundImage = `url("${item.img}")`;
        item.imgContainer.style.opacity = '1';
      }

      // Re-trigger layout calculation once aspect ratio is known
      if (this.container) {
        const width = this.container.getBoundingClientRect().width;
        this.layout(width);
      }
    };
    img.onerror = () => {
      if (item.imgContainer) {
        item.imgContainer.style.opacity = '1';
      }
    };
  }

  createGridElements() {
    // Empty original static contents
    this.container.innerHTML = '';
    this.container.classList.add('list');

    this.gridItems = this.items.map((item, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'item-wrapper';
      wrapper.setAttribute('data-key', item.id);

      // Wrapper initial styles with hardware GPU layer compositing
      wrapper.style.position = 'absolute';
      wrapper.style.top = '0';
      wrapper.style.left = '0';
      wrapper.style.willChange = 'transform, opacity';
      wrapper.style.transform = 'translate3d(0, 0, 0)';
      wrapper.style.backfaceVisibility = 'hidden';
      wrapper.style.opacity = '0'; // start hidden for entry animation

      const imgContainer = document.createElement('div');
      imgContainer.className = 'item-img';
      // Defer loading the image background
      imgContainer.style.opacity = '0';
      imgContainer.style.transition = 'opacity 0.4s ease-out';

      // Optional: Color shift overlay (React Bits feature)
      if (this.options.colorShiftOnHover) {
        const colorOverlay = document.createElement('div');
        colorOverlay.className = 'color-overlay';
        imgContainer.appendChild(colorOverlay);
      }

      // Metadata Overlay
      const overlay = document.createElement('div');
      overlay.className = 'item-overlay';

      // Top Div (Index and Category)
      const topDiv = document.createElement('div');
      topDiv.className = 'item-overlay-top';

      const indexSpan = document.createElement('span');
      indexSpan.className = 'item-index';
      indexSpan.textContent = String(index + 1).padStart(2, '0');

      const categorySpan = document.createElement('span');
      categorySpan.className = 'item-category';
      categorySpan.textContent = item.type;

      topDiv.appendChild(indexSpan);
      topDiv.appendChild(categorySpan);
      overlay.appendChild(topDiv);

      // Center Div (View pill)
      const centerDiv = document.createElement('div');
      centerDiv.className = 'item-overlay-center';
      const viewSpan = document.createElement('span');
      viewSpan.textContent = 'View →';
      centerDiv.appendChild(viewSpan);
      overlay.appendChild(centerDiv);

      // Bottom Div (Title and Year/Quarter info)
      const bottomDiv = document.createElement('div');
      bottomDiv.className = 'item-overlay-bottom';

      const titleH3 = document.createElement('h3');
      titleH3.className = 'item-title';
      titleH3.textContent = item.title;

      const metaSpan = document.createElement('span');
      metaSpan.className = 'item-meta';
      const metaText = [item.quarter, item.year].filter(Boolean).join(' • ');
      metaSpan.textContent = metaText;

      bottomDiv.appendChild(titleH3);
      bottomDiv.appendChild(metaSpan);
      overlay.appendChild(bottomDiv);

      imgContainer.appendChild(overlay);
      wrapper.appendChild(imgContainer);

      // Event Listeners for Hovers (scaling and overlay)
      wrapper.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, item));
      wrapper.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, item));

      // Click callback integration
      wrapper.addEventListener('click', (e) => {
        if (this.options.onItemClick) {
          this.options.onItemClick(item, index);
        } else if (item.url) {
          window.open(item.url, '_blank', 'noopener');
        }
      });

      this.container.appendChild(wrapper);

      return {
        ...item,
        el: wrapper,
        imgContainer: imgContainer
      };
    });
  }

  handleMouseEnter(e, item) {
    const wrapper = e.currentTarget;
    const { scaleOnHover, hoverScale, colorShiftOnHover } = this.options;

    if (scaleOnHover) {
      gsap.to(wrapper, {
        scale: hoverScale,
        duration: 0.3,
        ease: 'power2.out'
      });
    }

    if (colorShiftOnHover) {
      const overlay = wrapper.querySelector('.color-overlay');
      if (overlay) {
        gsap.to(overlay, {
          opacity: 0.35,
          duration: 0.3
        });
      }
    }
  }

  handleMouseLeave(e, item) {
    const wrapper = e.currentTarget;
    const { scaleOnHover, colorShiftOnHover } = this.options;

    if (scaleOnHover) {
      gsap.to(wrapper, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    }

    if (colorShiftOnHover) {
      const overlay = wrapper.querySelector('.color-overlay');
      if (overlay) {
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.3
        });
      }
    }
  }

  getColumns(width) {
    if (width >= 1500) return 5;
    if (width >= 1000) return 4;
    if (width >= 600) return 3;
    if (width >= 400) return 2;
    return 1;
  }

  getInitialPosition(item, columns, containerWidth, containerHeight) {
    let direction = this.options.animateFrom;

    if (direction === 'random') {
      const directions = ['top', 'bottom', 'left', 'right'];
      direction = directions[Math.floor(Math.random() * directions.length)];
    }

    switch (direction) {
      case 'top':
        return { x: item.x, y: -200 };
      case 'bottom':
        return { x: item.x, y: window.innerHeight + 200 };
      case 'left':
        return { x: -200, y: item.y };
      case 'right':
        return { x: window.innerWidth + 200, y: item.y };
      case 'center':
        return {
          x: containerWidth / 2 - item.w / 2,
          y: containerHeight / 2 - item.h / 2
        };
      default:
        return { x: item.x, y: item.y + 100 };
    }
  }

  layout(width) {
    if (!width || this.gridItems.length === 0) return;

    const columns = this.getColumns(width);
    const colHeights = new Array(columns).fill(0);
    const columnWidth = width / columns;

    // Calculate layout parameters
    const computedItems = this.gridItems.map((item) => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = columnWidth * col;
      
      const aspectRatio = item.aspectRatio || 1.33;
      const height = columnWidth / aspectRatio;
      const y = colHeights[col];

      colHeights[col] += height;

      return {
        ...item,
        x,
        y,
        w: columnWidth,
        h: height
      };
    });

    const maxContainerHeight = Math.max(...colHeights);
    this.container.style.height = `${maxContainerHeight}px`;

    // Apply layout positions using GSAP
    computedItems.forEach((item, index) => {
      const animationProps = {
        x: item.x,
        y: item.y,
        width: item.w,
        height: item.h
      };

      if (!this.hasMounted) {
        // First entry animation
        const initialPos = this.getInitialPosition(item, columns, width, maxContainerHeight);
        const initialState = {
          opacity: 0,
          x: initialPos.x,
          y: initialPos.y,
          width: item.w,
          height: item.h,
          ...(this.options.blurToFocus && { filter: 'blur(10px)' })
        };

        gsap.fromTo(item.el, initialState, {
          opacity: 1,
          ...animationProps,
          ...(this.options.blurToFocus && { filter: 'blur(0px)' }),
          duration: 0.8,
          ease: 'power3.out',
          delay: index * this.options.stagger,
          onComplete: () => {
            gsap.set(item.el, { clearProps: 'willChange' });
          }
        });
      } else {
        // Resize update animation
        gsap.to(item.el, {
          ...animationProps,
          duration: this.options.duration,
          ease: this.options.ease,
          overwrite: 'auto'
        });
      }
    });

    this.hasMounted = true;
  }

  setupResizeObserver() {
    let resizeTimeout;
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.layout(width);
        }, 50); // 50ms debounce prevents rapid calculation loops
      }
    });
    this.resizeObserver.observe(this.container);
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }
}

// Export for ES6/CommonJS/Global environments
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Masonry;
} else if (typeof define === 'function' && define.amd) {
  define([], () => Masonry);
} else {
  window.Masonry = Masonry;
}
