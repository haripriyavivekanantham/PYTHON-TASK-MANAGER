const API = window.API_BASE || 'http://localhost:8000';

async function loadProfile() {
  if (!Auth.isLoggedIn()) { window.location.href = 'login.html'; return; }

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    Auth.clear(); window.location.href = 'login.html';
  });

  try {
    const user = await apiFetch('/profile');
    renderProfile(user);

    // Load motivation
    const mot = await apiFetch('/profile/motivation');
    const card = document.getElementById('motivation-card');
    document.getElementById('motivation-msg').textContent   = mot.message;
    document.getElementById('motivation-quote').textContent = '💬 ' + mot.quote;
    card.style.display = 'block';

  } catch (err) {
    console.error(err);
  }
}

function renderProfile(user) {
  // Avatar
  const placeholder = document.getElementById('avatar-placeholder');
  const img         = document.getElementById('avatar-img');
  const removeBtn   = document.getElementById('remove-pic-btn');

  if (user.profile_picture) {
    img.src = `${API}/uploads/profiles/${user.profile_picture}`;
    img.style.display = 'block';
    placeholder.style.display = 'none';
    removeBtn.style.display = 'inline-flex';
  } else {
    const initial = (user.full_name || user.username || '?')[0].toUpperCase();
    placeholder.textContent = initial;
    placeholder.style.display = 'flex';
    img.style.display = 'none';
    removeBtn.style.display = 'none';
  }

  // Info
  document.getElementById('info-username').textContent = '@' + user.username;
  document.getElementById('info-email').textContent    = user.email;
  document.getElementById('info-joined').textContent   =
    new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  document.getElementById('full-name').value = user.full_name || '';

  // Update stored user
  Auth.set(Auth.getToken(), user);
}

async function updateProfile() {
  const full_name = document.getElementById('full-name').value.trim();
  try {
    const user = await apiFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify({ full_name }),
    });
    renderProfile(user);
    showAlert('alert', 'Profile updated successfully!', 'success');
  } catch (err) {
    showAlert('alert', err.message);
  }
}

async function uploadPicture() {
  const input = document.getElementById('pic-input');
  if (!input.files[0]) return;

  const formData = new FormData();
  formData.append('file', input.files[0]);

  try {
    const token = Auth.getToken();
    const res = await fetch(`${API}/profile/picture`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    }
    const user = await res.json();
    renderProfile(user);
    showAlert('alert', 'Profile picture updated! 🎉', 'success');
  } catch (err) {
    showAlert('alert', err.message);
  }
}

async function removePicture() {
  if (!confirm('Remove profile picture?')) return;
  try {
    const user = await apiFetch('/profile/picture', { method: 'DELETE' });
    renderProfile(user);
    showAlert('alert', 'Profile picture removed.', 'success');
  } catch (err) {
    showAlert('alert', err.message);
  }
}

document.addEventListener('DOMContentLoaded', loadProfile);