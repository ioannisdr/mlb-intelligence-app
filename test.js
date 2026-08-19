
(function() {
  const saved = localStorage.getItem('userTheme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
})();
