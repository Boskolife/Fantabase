import './script.js';

function initBurgerMenu() {
  const burger = document.querySelector('.header_burger');
  const nav = document.querySelector('.header_nav');
  const body = document.body;

  if (!burger || !nav) return;

  const closeMenu = () => {
    burger.classList.remove('is-active');
    nav.classList.remove('is-active');
    body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
  };

  const toggleMenu = () => {
    const isActive = burger.classList.contains('is-active');
    burger.classList.toggle('is-active');
    nav.classList.toggle('is-active');
    body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', !isActive ? 'true' : 'false');
  };

  burger.addEventListener('click', toggleMenu);

  const navLinks = document.querySelectorAll('.header_nav-link');
  navLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', (e) => {
    const isClickInsideNav = nav.contains(e.target);
    const isClickOnBurger = burger.contains(e.target);

    if (
      !isClickInsideNav &&
      !isClickOnBurger &&
      nav.classList.contains('is-active')
    ) {
      closeMenu();
    }
  });

  // Закрытие меню по клавише Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-active')) {
      closeMenu();
      burger.focus();
    }
  });
}

function initNavBar() {
  const navBar = document.querySelector('.nav-bar');
  const navLinks = document.querySelectorAll('.nav-bar_link');
  const sectionIds = ['feed', 'updates', 'watchlist', 'howie', 'data-engine'];

  if (!navBar) return;

  // Изначально скрываем навигационную панель
  navBar.classList.add('is-hidden');
  navBar.setAttribute('aria-hidden', 'true');

  const checkScrollPosition = () => {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;

    // Находим первую и последнюю секцию с нужными id
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section) => section !== null);

    if (sections.length === 0) return;

    const firstSection = sections[0];
    const lastSection = sections[sections.length - 1];

    const firstSectionTop = firstSection.offsetTop;
    const lastSectionBottom = lastSection.offsetTop + lastSection.offsetHeight;

    // Проверяем, находится ли пользователь в области секций
    const isInSectionArea =
      scrollY + windowHeight >= firstSectionTop && scrollY <= lastSectionBottom;

    // Показываем/скрываем навигационную панель
    if (isInSectionArea) {
      navBar.classList.remove('is-hidden');
      navBar.setAttribute('aria-hidden', 'false');
    } else {
      navBar.classList.add('is-hidden');
      navBar.setAttribute('aria-hidden', 'true');
    }

    // Определяем активную секцию
    let activeSectionId = null;
    const scrollCenter = scrollY + windowHeight / 2;

    for (const section of sections) {
      const sectionTop = section.offsetTop;
      const sectionBottom = sectionTop + section.offsetHeight;

      if (scrollCenter >= sectionTop && scrollCenter <= sectionBottom) {
        activeSectionId = section.id;
        break;
      }
    }

    // Обновляем активный элемент навигации
    navLinks.forEach((link) => {
      const linkHref = link.getAttribute('href');
      const linkSectionId = linkHref.replace('#', '');
      const navItem = link.closest('.nav-bar_item');

      if (linkSectionId === activeSectionId) {
        navItem?.classList.add('active');
      } else {
        navItem?.classList.remove('active');
      }
    });
  };

  // Обработчик прокрутки с throttling для производительности
  let ticking = false;
  const handleScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        checkScrollPosition();
        ticking = false;
      });
      ticking = true;
    }
  };

  // Проверяем начальную позицию
  checkScrollPosition();

  // Добавляем обработчик прокрутки
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Обработчик клика по ссылкам навигации для плавной прокрутки
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href.startsWith('#')) {
        const targetSection = document.querySelector(href);
        if (targetSection) {
          e.preventDefault();
          const offsetTop = targetSection.offsetTop;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth',
          });
        }
      }
    });
  });
}

function initDifferentiatorsSwiper() {
  const swiperContainer = document.querySelector('.differentiators_swiper');
  if (!swiperContainer) return;

  let swiperInstance = null;
  const breakpoint = 1024;

  const initSwiper = () => {
    if (window.innerWidth < breakpoint) {
      if (!swiperInstance && window.Swiper) {
        swiperInstance = new window.Swiper('.differentiators_swiper', {
          slidesPerView: 1.2,
          spaceBetween: 24,
          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          },
          a11y: {
            enabled: true,
            prevSlideMessage: 'Previous slide',
            nextSlideMessage: 'Next slide',
            firstSlideMessage: 'This is the first slide',
            lastSlideMessage: 'This is the last slide',
          },
          breakpoints: {
            320: {
              slidesPerView: 1.3,
              spaceBetween: 16,
            },
            480: {
              slidesPerView: 1.5,
              spaceBetween: 16,
            },
            650: {
              slidesPerView: 1.9,
              spaceBetween: 16,
            },
            768: {
              slidesPerView: 2.2,
              spaceBetween: 16,
            },
            950: {
              slidesPerView: 2.6,
              spaceBetween: 16,
            },
          },
        });
      }
    } else {
      if (swiperInstance) {
        swiperInstance.destroy(true, true);
        swiperInstance = null;
      }
    }
  };

  // Инициализация при загрузке
  initSwiper();

  // Обработка изменения размера окна
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      initSwiper();
    }, 250);
  });
}

function initMarketStrategySwiper() {
  const swiperContainer = document.querySelector('.market-strategy_swiper');
  if (!swiperContainer) return;

  let swiperInstance = null;
  const breakpoint = 1024;

  const initSwiper = () => {
    if (window.innerWidth >= breakpoint) {
      if (!swiperInstance && window.Swiper) {
        swiperInstance = new window.Swiper('.market-strategy_swiper', {
          slidesPerView: 'auto',
          spaceBetween: 120,
          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          },
          a11y: {
            enabled: true,
            prevSlideMessage: 'Previous slide',
            nextSlideMessage: 'Next slide',
            firstSlideMessage: 'This is the first slide',
            lastSlideMessage: 'This is the last slide',
          },
          on: {
            progress: function (swiper, progress) {
              const progressBar = document.querySelector(
                '.swiper-pagination-progressbar',
              );
              if (progressBar) {
                const percentage = Math.round(progress * 100);
                progressBar.setAttribute('aria-valuenow', percentage);
              }
            },
          },
        });
      }
    } else {
      if (swiperInstance) {
        swiperInstance.destroy(true, true);
        swiperInstance = null;
      }
    }
  };

  // Инициализация при загрузке
  initSwiper();

  // Обработка изменения размера окна
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      initSwiper();
    }, 250);
  });
}

function updateYear() {
  const year = new Date().getFullYear();
  const yearElement = document.querySelector('.year');
  if (yearElement) {
    yearElement.textContent = year;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateYear();
  initBurgerMenu();
  initNavBar();
  initDifferentiatorsSwiper();
  initMarketStrategySwiper();
});

window.addEventListener('resize', () => {
  initDifferentiatorsSwiper();
  initMarketStrategySwiper();
});
