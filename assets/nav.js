// Dropdown toggle for touch/click devices
document.addEventListener('DOMContentLoaded', function () {
  const dropdowns = document.querySelectorAll('.nav-dropdown');

  dropdowns.forEach(function (dropdown) {
    const trigger = dropdown.querySelector('a');

    trigger.addEventListener('click', function (e) {
      const isOpen = dropdown.classList.contains('is-open');

      // Close all dropdowns first
      dropdowns.forEach(function (d) { d.classList.remove('is-open'); });

      if (!isOpen) {
        e.preventDefault();
        dropdown.classList.add('is-open');
      }
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-dropdown')) {
      dropdowns.forEach(function (d) { d.classList.remove('is-open'); });
    }
  });
});
