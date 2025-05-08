const timers = document.querySelectorAll('[data-timer]');

function startCountdown(seconds) {
  function formatTime(s) {
    const minutes = String(Math.floor(s / 60)).padStart(2, '0');
    const seconds = String(s % 60).padStart(2, '0');
    timers.forEach(el => {
      el.querySelector('[data-minutes]').textContent = `${minutes}`;
      el.querySelector('[data-seconds]').textContent = `${seconds}`;
    })
  }

  let remainingTime = seconds;

  setInterval(() => {
    formatTime(remainingTime);

    if (remainingTime === 0) {
      remainingTime = seconds; // Qayta boshlash
    } else {
      remainingTime--;
    }
  }, 1000);
}

startCountdown(119);
