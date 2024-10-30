(function() {
  const iframe = document.createElement('iframe');
  iframe.src = 'https://your-domain.com/embed';
  iframe.style.position = 'fixed';
  iframe.style.bottom = '0';
  iframe.style.right = '0';
  iframe.style.width = '400px';
  iframe.style.height = '600px';
  iframe.style.border = 'none';
  iframe.style.zIndex = '9999';
  document.body.appendChild(iframe);
})();
