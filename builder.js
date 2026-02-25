(function () {
  const API = (path, opts = {}) =>
    fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', ...opts.headers } })
      .then((r) => r.json());

  let token = localStorage.getItem('builder_token');
  let currentSite = null; // { siteId, previewUrl }

  const authStatus = document.getElementById('authStatus');
  const siteInfo = document.getElementById('siteInfo');
  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');
  const siteNameEl = document.getElementById('siteName');

  function updateAuthStatus() {
    authStatus.textContent = token ? 'Logged in' : 'Not logged in';
  }

  document.getElementById('register').onclick = async () => {
    const result = await API('/api/register', {
      method: 'POST',
      body: JSON.stringify({ email: emailEl.value, password: passwordEl.value }),
    });
    if (result.token) {
      token = result.token;
      localStorage.setItem('builder_token', token);
      updateAuthStatus();
    } else alert(JSON.stringify(result));
  };

  document.getElementById('login').onclick = async () => {
    const result = await API('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email: emailEl.value, password: passwordEl.value }),
    });
    if (result.token) {
      token = result.token;
      localStorage.setItem('builder_token', token);
      updateAuthStatus();
    } else alert(JSON.stringify(result));
  };

  let editor = null;

  function getFullHtml() {
    if (!editor) return '';
    const html = editor.getHtml();
    const css = editor.getCss();
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>' + css + '</style></head><body>' + html + '</body></html>';
  }

  document.getElementById('save').onclick = async () => {
    if (!token) return alert('Please log in first.');
    const name = siteNameEl.value.trim() || 'My Site';
    const html = getFullHtml();
    const result = await API('/api/site/create', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: JSON.stringify({ name, html }),
    });
    if (result.error) return alert(result.error);
    currentSite = { siteId: result.siteId, previewUrl: result.previewUrl };
    siteInfo.innerHTML = 'Saved. <a href="' + result.previewUrl + '" target="_blank">Preview</a>';
  };

  document.getElementById('publish').onclick = async () => {
    if (!token) return alert('Please log in first.');
    if (!currentSite) return alert('Save the site first.');
    const result = await API('/api/site/publish', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: JSON.stringify({ siteId: currentSite.siteId }),
    });
    if (result.error) return alert(result.error);
    siteInfo.innerHTML = 'Published: <a href="' + result.publicUrl + '" target="_blank">' + result.publicUrl + '</a>';
  };

  document.getElementById('deploy').onclick = async () => {
    if (!token) return alert('Please log in first.');
    if (!currentSite) return alert('Save the site first.');
    siteInfo.textContent = 'Deploying…';
    const result = await API('/api/site/deploy', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: JSON.stringify({ siteId: currentSite.siteId }),
    });
    if (result.error) {
      siteInfo.textContent = '';
      return alert(result.error);
    }
    siteInfo.innerHTML = result.deployedUrl
      ? 'Deployed: <a href="' + result.deployedUrl + '" target="_blank">' + result.deployedUrl + '</a>'
      : 'Deploy done. Check server logs for URL.';
  };

  updateAuthStatus();

  const plugins = [];
  const pluginsOpts = {};
  if (typeof window['gjs-blocks-basic'] !== 'undefined') {
    plugins.push('gjs-blocks-basic');
  }

  editor = grapesjs.init({
    container: '#gjs',
    height: '100%',
    fromElement: false,
    storageManager: { autoload: false },
    plugins,
    pluginsOpts,
  });
})();
