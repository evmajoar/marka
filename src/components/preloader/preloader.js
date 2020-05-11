const preloaderReady = setTimeout(() => {
  document.querySelector('.preloader').classList.add('preloader--fade');
  clearTimeout(preloaderReady);
}, 3100);