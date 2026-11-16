const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const examMenuButton = document.querySelector('.nav-menu-button');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Ambient spotlight is enabled only for precise hover pointers.
const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
if (hasFinePointer) {
  const ambientSpotlight = document.createElement('div');
  ambientSpotlight.className = 'pointer-spotlight';
  ambientSpotlight.setAttribute('aria-hidden', 'true');
  document.body.append(ambientSpotlight);

  const moveSpotlight = (event) => {
    document.documentElement.style.setProperty('--screen-x', `${event.clientX}px`);
    document.documentElement.style.setProperty('--screen-y', `${event.clientY}px`);
    ambientSpotlight.classList.add('is-active');
  };
  window.addEventListener('pointermove', moveSpotlight, { passive: true });
}

// Card borders keep their own local spotlight while pointer or touch moves over them.
const glowCards = document.querySelectorAll('[data-glow]');
glowCards.forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    const bounds = card.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    card.style.setProperty('--x', x.toFixed(2));
    card.style.setProperty('--y', y.toFixed(2));
    card.style.setProperty('--xp', (event.clientX / window.innerWidth).toFixed(3));
    card.classList.add('is-active');
  });
  card.addEventListener('pointerleave', () => {
    card.style.removeProperty('--x');
    card.style.removeProperty('--y');
    card.style.removeProperty('--xp');
    card.classList.remove('is-active');
  });
});

menuButton.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    examMenuButton.setAttribute('aria-expanded', 'false');
    examMenuButton.nextElementSibling.classList.remove('is-open');
  });
});

examMenuButton.addEventListener('click', () => {
  const isOpen = examMenuButton.getAttribute('aria-expanded') === 'true';
  examMenuButton.setAttribute('aria-expanded', String(!isOpen));
  examMenuButton.nextElementSibling.classList.toggle('is-open', !isOpen);
});

const header = document.querySelector('.site-header');
const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 18);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const observedSections = ['tentang', 'dokumentasi', 'ujian-lisan', 'ujian-tulis']
  .map((id) => document.getElementById(id))
  .filter(Boolean);
const sectionVisibility = new Map();
const navLinks = [...nav.querySelectorAll('a[href^="#"]')];
const examMenuLink = nav.querySelector('.nav-menu-button');

const updateActiveNavigation = () => {
  const activeSection = [...sectionVisibility.entries()]
    .filter(([, entry]) => entry.isIntersecting)
    .sort(([aId, a], [bId, b]) => {
      const aPriority = aId.startsWith('ujian-') ? 2 : 1;
      const bPriority = bId.startsWith('ujian-') ? 2 : 1;
      return bPriority - aPriority || b.intersectionRatio - a.intersectionRatio;
    })[0]?.[0];
  navLinks.forEach((link) => {
    const isActive = link.hash === `#${activeSection}`;
    link.classList.toggle('is-active', isActive);
    if (isActive) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });

  examMenuLink.classList.toggle('is-active', activeSection === 'ujian-lisan' || activeSection === 'ujian-tulis');
};

if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => sectionVisibility.set(entry.target.id, entry));
    updateActiveNavigation();
  }, { rootMargin: '-22% 0px -58% 0px', threshold: [0, 0.15, 0.35, 0.6] });
  observedSections.forEach((section) => sectionObserver.observe(section));
}

if (window.lucide) {
  window.lucide.createIcons();
}

// Keyboard-friendly subject tabs for the oral exam materials.
const subjectTabs = document.querySelector('[data-subject-tabs]');
if (subjectTabs) {
  const tabButtons = [...subjectTabs.querySelectorAll('[role="tab"]')];
  const tabIndicator = subjectTabs.querySelector('.subject-tab-indicator');
  let activePanel = subjectTabs.querySelector('.subject-panel.is-active');

  const moveTabIndicator = (tab, animate = true) => {
    if (!tabIndicator || !tab) return;
    const x = tab.offsetLeft - tabButtons[0].offsetLeft;
    if (window.gsap && !reducedMotion && animate) {
      gsap.to(tabIndicator, { x, width: tab.offsetWidth, duration: 0.42, ease: 'power3.out', overwrite: true });
    } else {
      tabIndicator.style.width = `${tab.offsetWidth}px`;
      tabIndicator.style.transform = `translateX(${x}px)`;
    }
  };

  const activateTab = (tab, animate = true) => {
    const nextPanel = document.getElementById(tab.getAttribute('aria-controls'));
    if (!nextPanel || nextPanel === activePanel) {
      moveTabIndicator(tab, animate);
      return;
    }

    tabButtons.forEach((button) => {
      const isActive = button === tab;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });

    const revealPanel = () => {
      nextPanel.hidden = false;
      nextPanel.classList.add('is-active');
      if (window.gsap && !reducedMotion && animate) {
        gsap.fromTo(nextPanel, { autoAlpha: 0, y: 8 }, {
          autoAlpha: 1, y: 0, duration: 0.32, ease: 'power2.out',
          onComplete: () => gsap.set(nextPanel, { clearProps: 'opacity,visibility,transform' })
        });
        gsap.fromTo(nextPanel.querySelectorAll('.subject-chip'), { autoAlpha: 0, y: 6 }, {
          autoAlpha: 1, y: 0, duration: 0.28, stagger: 0.035, ease: 'power2.out', clearProps: 'all'
        });
      }
    };

    if (activePanel && window.gsap && !reducedMotion && animate) {
      gsap.to(activePanel, {
        autoAlpha: 0, y: -5, duration: 0.16, ease: 'power1.out',
        onComplete: () => {
          activePanel.hidden = true;
          activePanel.classList.remove('is-active');
          revealPanel();
          activePanel = nextPanel;
        }
      });
    } else {
      if (activePanel) {
        activePanel.hidden = true;
        activePanel.classList.remove('is-active');
      }
      revealPanel();
      activePanel = nextPanel;
    }

    moveTabIndicator(tab, animate);
  };

  tabButtons.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (event) => {
      let nextIndex = index;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabButtons.length;
      else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabButtons.length - 1;
      else return;
      event.preventDefault();
      tabButtons[nextIndex].focus();
      activateTab(tabButtons[nextIndex]);
    });
  });

  moveTabIndicator(tabButtons.find((tab) => tab.getAttribute('aria-selected') === 'true'), false);
  window.addEventListener('resize', () => {
    moveTabIndicator(tabButtons.find((tab) => tab.getAttribute('aria-selected') === 'true'), false);
  }, { passive: true });
}

if (window.Lenis && !reducedMotion) {
  const lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.9, anchors: true });
  window.lenis = lenis;
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
}

if (window.gsap && window.ScrollTrigger && !reducedMotion) {
  gsap.registerPlugin(ScrollTrigger);

  const statNumbers = [...document.querySelectorAll('.stat-number[data-count]')];
  if (statNumbers.length) {
    statNumbers.forEach((element) => {
      element.textContent = `0${element.dataset.suffix || ''}`;
    });

    ScrollTrigger.create({
      trigger: '.stats-strip',
      start: 'top 82%',
      once: true,
      onEnter: () => {
        statNumbers.forEach((element, index) => {
          const counter = { value: 0 };
          const target = Number(element.dataset.count);
          const suffix = element.dataset.suffix || '';
          gsap.to(counter, {
            value: target,
            duration: 1.7,
            delay: index * 0.1,
            ease: 'power2.out',
            onUpdate: () => {
              element.textContent = `${Math.round(counter.value)}${suffix}`;
            }
          });
        });
      }
    });
  }

  gsap.from('.hero .eyebrow', {
    y: 18, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.15
  });
  gsap.from('.hero .reveal-line', {
    yPercent: 110, opacity: 0, duration: 1, stagger: 0.14,
    ease: 'power4.out', delay: 0.25
  });
  gsap.from('.hero-copy, .hero-content .button', {
    y: 22, opacity: 0, duration: 0.8, stagger: 0.12,
    ease: 'power3.out', delay: 0.55
  });

  gsap.from('.intro-heading .reveal-line', {
    yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.12,
    ease: 'power3.out', scrollTrigger: {
      trigger: '.intro-heading', start: 'top 82%', once: true
    }
  });
  gsap.from('.intro-copy > *', {
    y: 20, opacity: 0, duration: 0.65, stagger: 0.09,
    ease: 'power2.out', scrollTrigger: {
      trigger: '.intro-copy', start: 'top 82%', once: true
    }
  });

  gsap.from('.doc-card', {
    y: 54, opacity: 0, scale: 0.97, duration: 0.9, stagger: 0.16,
    ease: 'power3.out', scrollTrigger: {
      trigger: '.card-grid', start: 'top 82%', once: true
    }
  });
  gsap.from('.exam-section', {
    y: 35, opacity: 0, duration: 0.75, stagger: 0.14,
    ease: 'power3.out', scrollTrigger: {
      trigger: '.exam-sections', start: 'top 84%', once: true
    }
  });

  gsap.to('.hero-pattern', {
    y: 72, ease: 'none', scrollTrigger: {
      trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8
    }
  });
  gsap.to('.hero-ornament', {
    y: -48, ease: 'none', scrollTrigger: {
      trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8
    }
  });
}

if (window.GLightbox) {
  GLightbox({ selector: '.glightbox', touchNavigation: true, loop: true });
}

