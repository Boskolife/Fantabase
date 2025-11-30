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
}

document.addEventListener('DOMContentLoaded', () => {
  initBurgerMenu();
});
