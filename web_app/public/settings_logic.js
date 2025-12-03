
async function saveSettings() {
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.innerText;
    saveBtn.innerText = "Saving...";
    saveBtn.disabled = true;

    // Gather data
    const settings = {
        language: document.getElementById('languageSelect').value,
        apiKey: document.getElementById('apiKeyInput').value,
        systemPrompt: document.getElementById('systemPrompt').value,
        audioMode: document.getElementById('audioModeToggle').checked,
        autocomplete: document.getElementById('autocompleteToggle').checked,
        email: document.getElementById('emailInput').value,
        phone: document.getElementById('phoneInput').value,
        saveHistory: document.getElementById('historyToggle').checked
    };

    // Update local state immediately
    currentLanguage = settings.language;
    apiKey = settings.apiKey;
    systemPrompt = settings.systemPrompt;

    // Update UI text based on language
    updateLanguageUI();

    // Save to LocalStorage
    localStorage.setItem('zenith_settings', JSON.stringify(settings));

    // Simulate Backend Save (if we had an endpoint)
    // await fetch('/api/user/settings', { method: 'POST', body: JSON.stringify(settings) });

    setTimeout(() => {
        saveBtn.innerText = originalText;
        saveBtn.disabled = false;
        toggleSettings(); // Close modal
        // Show success toast (optional)
        // alert("Settings saved!");
    }, 500);
}

function updateLanguageUI() {
    // Simple helper to update UI text when language changes
    const lang = currentLanguage;
    const t = translations[lang] || translations['en'];

    document.getElementById('newChatText').innerText = t.newChat;
    document.getElementById('presentationText').innerText = t.presentation;
    document.getElementById('contentCreatorText').innerText = t.contentCreator;
    document.getElementById('darkModeText').innerText = t.darkMode;
    document.getElementById('settingsText').innerText = t.settings;
    document.getElementById('input').placeholder = t.placeholder;

    // Update Settings Modal Labels
    if (lang === 'de') {
        document.getElementById('generalTitle').innerText = 'Allgemeine Einstellungen';
        document.getElementById('accountTitle').innerText = 'Benutzerkonto';
        document.getElementById('dataTitle').innerText = 'Sicherheit & Daten';
        document.getElementById('saveBtn').innerText = 'Speichern & Schließen';
    } else if (lang === 'ar') {
        document.getElementById('generalTitle').innerText = 'الإعدادات العامة';
        document.getElementById('accountTitle').innerText = 'الحساب';
        document.getElementById('dataTitle').innerText = 'الأمان والبيانات';
        document.getElementById('saveBtn').innerText = 'حفظ وإغلاق';
    } else {
        document.getElementById('generalTitle').innerText = 'General Settings';
        document.getElementById('accountTitle').innerText = 'Account';
        document.getElementById('dataTitle').innerText = 'Security & Data';
        document.getElementById('saveBtn').innerText = 'Save & Close';
    }
}
