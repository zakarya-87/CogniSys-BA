// OAuth popup callback handler — external script to satisfy CSP (no unsafe-inline needed)
(function () {
  var el = document.getElementById('oauth-data');
  if (!el) return;

  var status = el.dataset.status;

  if (status === 'success') {
    var user = {
      id: el.dataset.userId,
      name: el.dataset.userName,
      avatarUrl: el.dataset.userAvatar,
    };

    if (window.opener) {
      window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: user }, window.location.origin);
      window.close();
    } else {
      window.location.href = '/';
    }
  } else {
    // Error path — close popup after 3 seconds
    setTimeout(function () { window.close(); }, 3000);
  }
})();
