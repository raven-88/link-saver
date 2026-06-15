document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  const saveBtn         = document.getElementById('saveBtn');
  const saveAllBtn      = document.getElementById('saveAllBtn');
  const openAllBtn      = document.getElementById('openAllBtn');
  const clearAllBtn     = document.getElementById('clearAllBtn');
  const currentUrlEl    = document.getElementById('currentUrl');
  const urlList         = document.getElementById('urlList');
  const savedCountEl    = document.getElementById('savedCount');

  // Segmented control and view panels
  const viewRecentsBtn  = document.getElementById('viewRecentsBtn');
  const viewGroupsBtn   = document.getElementById('viewGroupsBtn');
  const settingsBtn     = document.getElementById('settingsBtn');
  const recentsView     = document.getElementById('recentsView');
  const groupsView      = document.getElementById('groupsView');
  const settingsView    = document.getElementById('settingsView');

  // Settings specific elements
  const deleteAfterOpenCheck = document.getElementById('deleteAfterOpenCheck');
  const saveGroupSelect      = document.getElementById('saveGroupSelect');
  const exportBtn            = document.getElementById('exportBtn');
  const importBtn            = document.getElementById('importBtn');
  const importFile           = document.getElementById('importFile');
  const resetAllBtn          = document.getElementById('resetAllBtn');

  // Groups specific elements
  const addGroupBtn     = document.getElementById('addGroupBtn');
  const newGroupForm    = document.getElementById('newGroupForm');
  const newGroupNameInput = document.getElementById('newGroupNameInput');
  const saveGroupBtn    = document.getElementById('saveGroupBtn');
  const cancelGroupBtn  = document.getElementById('cancelGroupBtn');
  const groupsList      = document.getElementById('groupsList');

  // Search elements
  const searchInput     = document.getElementById('searchInput');
  const clearSearchBtn  = document.getElementById('clearSearchBtn');

  // Stats elements
  const statTotal       = document.getElementById('statTotal');
  const statYoutube     = document.getElementById('statYoutube');
  const statDomain      = document.getElementById('statDomain');

  let allUrls      = [];
  let allGroups    = [];
  let currentTab   = null;
  let expandedGroups = new Set(); // store group IDs that are expanded

  init();

  async function init() {
    await loadCurrentTab();
    setupSettings();
    loadData();
    setupViewSwitcher();
    setupGroupCreation();
    setupSearch();
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
      document.querySelectorAll('.dropdown-menu.active').forEach(el => {
        el.classList.remove('active');
      });
      document.querySelectorAll('.item-actions.menu-active').forEach(el => {
        el.classList.remove('menu-active');
      });
    });
  }

  function setupSettings() {
    chrome.storage.local.get({ deleteAfterOpen: false, defaultGroupId: '' }, (result) => {
      deleteAfterOpenCheck.checked = result.deleteAfterOpen;
      saveGroupSelect.value = result.defaultGroupId;
    });

    deleteAfterOpenCheck.addEventListener('change', () => {
      chrome.storage.local.set({ deleteAfterOpen: deleteAfterOpenCheck.checked });
    });

    saveGroupSelect.addEventListener('change', () => {
      chrome.storage.local.set({ defaultGroupId: saveGroupSelect.value });
    });

    // Backup & Restore
    exportBtn.addEventListener('click', () => {
      chrome.storage.local.get({ urls: [], groups: [], deleteAfterOpen: false, defaultGroupId: '' }, (data) => {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `url_vault_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    });

    importBtn.addEventListener('click', () => {
      importFile.click();
    });

    importFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data && (Array.isArray(data.urls) || Array.isArray(data.groups))) {
            chrome.storage.local.set({
              urls: data.urls || [],
              groups: data.groups || [],
              deleteAfterOpen: data.deleteAfterOpen || false,
              defaultGroupId: data.defaultGroupId || ''
            }, () => {
              loadData();
              importFile.value = '';
              alert('Backup imported successfully!');
            });
          } else {
            alert('Invalid backup file format.');
          }
        } catch (err) {
          alert('Failed to parse backup file.');
        }
      };
      reader.readAsText(file);
    });

    // Reset All
    resetAllBtn.addEventListener('click', () => {
      if (confirm('Are you absolutely sure you want to reset URL Vault? This will permanently delete all saved URLs, groups, and settings.')) {
        chrome.storage.local.clear(() => {
          loadData();
          deleteAfterOpenCheck.checked = false;
          saveGroupSelect.value = '';
          alert('Vault reset successfully.');
        });
      }
    });
  }

  async function loadCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTab = tab;
      if (tab?.url) {
        currentUrlEl.textContent = tab.url;
        currentUrlEl.title = tab.url;
      } else {
        currentUrlEl.textContent = 'No active tab found';
      }
    } catch {
      currentUrlEl.textContent = 'Unable to read tab URL';
    }
  }

  function loadData() {
    chrome.storage.local.get({ urls: [], groups: [] }, (result) => {
      allUrls = result.urls.sort((a, b) => b.timestamp - a.timestamp);
      allGroups = result.groups || [];
      updateBadge(allUrls.length);
      
      const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
      if (searchVal) {
        const filtered = allUrls.filter(item => 
          item.title.toLowerCase().includes(searchVal) || 
          getDomain(item.url).toLowerCase().includes(searchVal) ||
          (item.note && item.note.toLowerCase().includes(searchVal))
        );
        renderUrls(filtered);
      } else {
        renderUrls(allUrls);
      }
      
      renderGroups();
      populateSaveGroupSelect();
      updateStats();
      if (currentTab?.url) updateSaveBtn(currentTab.url);
    });
  }

  function populateSaveGroupSelect() {
    if (!saveGroupSelect) return;
    chrome.storage.local.get({ defaultGroupId: '' }, (result) => {
      const currentValue = result.defaultGroupId;
      saveGroupSelect.innerHTML = '<option value="">Default (No Group)</option>';
      allGroups.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.name;
        if (currentValue === g.id) {
          opt.selected = true;
        }
        saveGroupSelect.appendChild(opt);
      });
    });
  }

  function updateBadge(count) {
    savedCountEl.textContent = count;
  }

  function updateSaveBtn(url) {
    const isSaved = allUrls.some(item => item.url === url);
    const savedPill = document.getElementById('savedStatusPill');
    if (isSaved) {
      saveBtn.innerHTML = `<i data-lucide="trash-2"></i><span>Remove</span>`;
      saveBtn.className = 'btn btn-primary already-saved';
      if (savedPill) savedPill.style.display = 'flex';
    } else {
      saveBtn.innerHTML = `<i data-lucide="bookmark"></i><span>Save Tab</span>`;
      saveBtn.className = 'btn btn-primary';
      if (savedPill) savedPill.style.display = 'none';
    }
    lucide.createIcons();
  }

  function setupViewSwitcher() {
    const deactivateAll = () => {
      viewRecentsBtn.classList.remove('active');
      viewGroupsBtn.classList.remove('active');
      settingsBtn.classList.remove('active');
      recentsView.classList.remove('active');
      groupsView.classList.remove('active');
      settingsView.classList.remove('active');
    };

    viewRecentsBtn.addEventListener('click', () => {
      deactivateAll();
      viewRecentsBtn.classList.add('active');
      recentsView.classList.add('active');
    });

    viewGroupsBtn.addEventListener('click', () => {
      deactivateAll();
      viewGroupsBtn.classList.add('active');
      groupsView.classList.add('active');
    });

    settingsBtn.addEventListener('click', () => {
      deactivateAll();
      settingsBtn.classList.add('active');
      settingsView.classList.add('active');
    });
  }

  function setupGroupCreation() {
    addGroupBtn.addEventListener('click', () => {
      newGroupForm.classList.add('active');
      newGroupNameInput.focus();
    });

    cancelGroupBtn.addEventListener('click', () => {
      newGroupForm.classList.remove('active');
      newGroupNameInput.value = '';
    });

    saveGroupBtn.addEventListener('click', () => {
      const name = newGroupNameInput.value.trim();
      if (!name) return;

      chrome.storage.local.get({ groups: [] }, (result) => {
        const groups = result.groups || [];
        const newGroup = {
          id: 'group_' + Date.now(),
          name: name,
          createdAt: Date.now()
        };
        groups.push(newGroup);
        chrome.storage.local.set({ groups }, () => {
          newGroupForm.classList.remove('active');
          newGroupNameInput.value = '';
          loadData();
        });
      });
    });
  }

  function removeGroup(groupId) {
    chrome.storage.local.get({ groups: [], urls: [] }, (result) => {
      const groups = result.groups.filter(g => g.id !== groupId);
      // Remove groupId association from URLs in this group (ungroup them)
      const urls = result.urls.map(u => {
        if (u.groupId === groupId) {
          const { groupId: _, ...rest } = u;
          return rest;
        }
        return u;
      });

      chrome.storage.local.set({ groups, urls }, loadData);
    });
  }

  async function getYoutubeVideoProgress(tabId) {
    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          const video = document.querySelector('video');
          if (video) {
            return {
              currentTime: video.currentTime,
              duration: video.duration
            };
          }
          return null;
        }
      });
      return result;
    } catch (e) {
      console.warn('Could not read video state: ', e);
      return null;
    }
  }

  saveBtn.addEventListener('click', async () => {
    if (!currentTab?.url) return;
    chrome.storage.local.get({ urls: [], defaultGroupId: '' }, async (result) => {
      const urls  = result.urls;
      const index = urls.findIndex(item => item.url === currentTab.url);
      if (index !== -1) {
        urls.splice(index, 1); // toggle off
      } else {
        const newItem = { title: currentTab.title || currentTab.url, url: currentTab.url, timestamp: Date.now() };
        if (result.defaultGroupId) {
          newItem.groupId = result.defaultGroupId;
        }
        
        // Extract YouTube progress
        const isYoutube = currentTab.url.includes('youtube.com/watch') || currentTab.url.includes('youtu.be/');
        if (isYoutube) {
          const progress = await getYoutubeVideoProgress(currentTab.id);
          if (progress) {
            newItem.ytProgress = progress;
          }
        }
        
        urls.push(newItem);
      }
      chrome.storage.local.set({ urls }, loadData);
    });
  });

  saveAllBtn.addEventListener('click', async () => {
    let tabs = await chrome.tabs.query({ currentWindow: true });
    chrome.storage.local.get({ urls: [], defaultGroupId: '' }, async (result) => {
      let urls = result.urls;
      let updated = false;
      
      for (const tab of tabs) {
        if (!tab.url) continue;
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('brave://') || tab.url.startsWith('edge://')) continue;
        
        const index = urls.findIndex(item => item.url === tab.url);
        if (index === -1) {
          const newItem = { title: tab.title || tab.url, url: tab.url, timestamp: Date.now() };
          if (result.defaultGroupId) {
            newItem.groupId = result.defaultGroupId;
          }
          
          // Extract YouTube progress for this tab
          const isYoutube = tab.url.includes('youtube.com/watch') || tab.url.includes('youtu.be/');
          if (isYoutube) {
            const progress = await getYoutubeVideoProgress(tab.id);
            if (progress) {
              newItem.ytProgress = progress;
            }
          }
          
          urls.push(newItem);
          updated = true;
        }
      }
      if (updated) {
        chrome.storage.local.set({ urls }, loadData);
      }
    });
  });

  openAllBtn.addEventListener('click', async () => {
    const tabs = await chrome.tabs.query({});
    allUrls.forEach(item => {
      const existingTab = tabs.find(t => t.url === item.url || t.pendingUrl === item.url);
      if (!existingTab) {
        chrome.tabs.create({ url: item.url });
      }
    });
  });

  clearAllBtn.addEventListener('click', () => {
    if (allUrls.length === 0) return;
    chrome.storage.local.set({ urls: [] }, loadData);
  });

  // Reusable URL list item generator helper
  function createUrlItem(item, isInsideGroup) {
    const li = document.createElement('li');
    li.style.opacity = '0';
    li.style.transform = 'translateY(4px)';
    setTimeout(() => {
      li.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      li.style.opacity    = '1';
      li.style.transform  = 'translateY(0)';
    }, 10);

    const domain = getDomain(item.url);

    // ── Favicon ──
    // ── Thumbnail / Favicon ──
    const faviconWrap = document.createElement('div');
    faviconWrap.className = 'favicon-wrap';

    const img = document.createElement('img');
    img.className = 'url-favicon';
    
    // YouTube Thumbnail Logic
    const ytMatch = item.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
    if (ytMatch) {
      li.classList.add('yt-item');
      img.src = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    } else {
      img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    }
    
    img.onerror = () => {
      img.style.display = 'none';
      const fb = document.createElement('i');
      fb.setAttribute('data-lucide', 'globe');
      fb.className = 'favicon-fallback-icon';
      faviconWrap.appendChild(fb);
      lucide.createIcons();
    };
    faviconWrap.appendChild(img);

    // ── Info ──
    const infoDiv = document.createElement('div');
    infoDiv.className = 'url-info';

    const titleEl = document.createElement('span');
    titleEl.className = 'url-title';
    titleEl.textContent = item.title;
    titleEl.title = item.title;

    const linkEl = document.createElement('span');
    linkEl.className = 'url-link';
    linkEl.textContent = domain;
    linkEl.title = 'Click to copy URL';
    linkEl.onclick = async () => {
      try {
        await navigator.clipboard.writeText(item.url);
        linkEl.textContent = 'Copied!';
        setTimeout(() => { linkEl.textContent = domain; }, 1500);
      } catch (e) {}
    };

    // ── Note display ──
    const noteEl = document.createElement('div');
    if (item.note) {
      noteEl.className = 'url-note';
      noteEl.textContent = item.note;
      noteEl.title = 'Click to edit note';
    } else {
      noteEl.className = 'url-note empty-note';
      noteEl.textContent = '+ Add a note...';
      noteEl.title = 'Click to add a note';
    }

    // ── Inline note editor ──
    const editorWrap = document.createElement('div');
    editorWrap.className = 'note-editor';

    const textarea = document.createElement('textarea');
    textarea.className = 'note-textarea';
    textarea.placeholder = 'Write a note...';
    textarea.value = item.note || '';

    const editorActions = document.createElement('div');
    editorActions.className = 'note-editor-actions';

    const maximizeBtn = document.createElement('button');
    maximizeBtn.className = 'note-btn note-maximize';
    maximizeBtn.innerHTML = '<i data-lucide="maximize-2"></i>';
    maximizeBtn.title = 'Maximize Note Editor';
    maximizeBtn.onclick = () => {
      textarea.classList.toggle('maximized');
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'note-btn note-cancel';
    cancelBtn.textContent = 'Cancel';

    const saveNoteBtn = document.createElement('button');
    saveNoteBtn.className = 'note-btn note-save';
    saveNoteBtn.textContent = 'Save';

    editorActions.appendChild(maximizeBtn);
    editorActions.appendChild(cancelBtn);
    editorActions.appendChild(saveNoteBtn);
    editorWrap.appendChild(textarea);
    editorWrap.appendChild(editorActions);

    const openEditor = () => {
      noteEl.style.display = 'none';
      groupSelectorWrap.classList.remove('active'); // hide group selector if open
      editorWrap.classList.add('active');
      textarea.focus();
    };

    cancelBtn.onclick = () => {
      editorWrap.classList.remove('active');
      noteEl.style.display = '';
      textarea.value = item.note || '';
    };

    saveNoteBtn.onclick = () => {
      const newNote = textarea.value.trim();
      chrome.storage.local.get({ urls: [] }, (result) => {
        const urls = result.urls;
        const idx  = urls.findIndex(u => u.url === item.url);
        if (idx !== -1) {
          urls[idx].note = newNote;
          chrome.storage.local.set({ urls }, loadData);
        }
      });
    };

    noteEl.onclick = openEditor;

    infoDiv.appendChild(titleEl);
    infoDiv.appendChild(linkEl);
    infoDiv.appendChild(noteEl);
    infoDiv.appendChild(editorWrap);

    // ── Inline group selector ──
    const groupSelectorWrap = document.createElement('div');
    groupSelectorWrap.className = 'group-selector-wrap';

    const selectEl = document.createElement('select');
    selectEl.className = 'group-select';
    
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = item.groupId ? 'Remove from Group' : 'Move to Group...';
    selectEl.appendChild(defaultOpt);

    allGroups.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = g.name;
      if (item.groupId === g.id) {
        opt.selected = true;
        defaultOpt.textContent = 'Remove from Group';
      }
      selectEl.appendChild(opt);
    });

    const createOpt = document.createElement('option');
    createOpt.value = 'NEW_GROUP_ACTION';
    createOpt.textContent = '➕ Create New Group...';
    selectEl.appendChild(createOpt);

    const newGroupInput = document.createElement('input');
    newGroupInput.type = 'text';
    newGroupInput.className = 'new-group-inline-input';
    newGroupInput.placeholder = 'Enter new group name...';
    newGroupInput.style.display = 'none';
    newGroupInput.style.marginTop = '4px';

    selectEl.addEventListener('change', () => {
      if (selectEl.value === 'NEW_GROUP_ACTION') {
        newGroupInput.style.display = 'block';
        newGroupInput.focus();
      } else {
        newGroupInput.style.display = 'none';
        newGroupInput.value = '';
      }
    });

    const selectorActions = document.createElement('div');
    selectorActions.className = 'group-selector-actions';

    const moveSaveBtn = document.createElement('button');
    moveSaveBtn.className = 'group-select-btn save';
    moveSaveBtn.textContent = 'Move';

    const moveCancelBtn = document.createElement('button');
    moveCancelBtn.className = 'group-select-btn cancel';
    moveCancelBtn.textContent = 'Cancel';

    selectorActions.appendChild(moveCancelBtn);
    selectorActions.appendChild(moveSaveBtn);

    groupSelectorWrap.appendChild(selectEl);
    groupSelectorWrap.appendChild(newGroupInput);
    groupSelectorWrap.appendChild(selectorActions);

    moveCancelBtn.onclick = () => {
      groupSelectorWrap.classList.remove('active');
      noteEl.style.display = '';
      selectEl.value = item.groupId || '';
      newGroupInput.style.display = 'none';
      newGroupInput.value = '';
    };

    moveSaveBtn.onclick = () => {
      const selectedVal = selectEl.value;
      if (selectedVal === 'NEW_GROUP_ACTION') {
        const newGroupName = newGroupInput.value.trim();
        if (!newGroupName) return;

        chrome.storage.local.get({ groups: [], urls: [] }, (result) => {
          const groups = result.groups || [];
          const urls = result.urls || [];
          const newGroupId = 'group_' + Date.now();
          
          groups.push({
            id: newGroupId,
            name: newGroupName,
            createdAt: Date.now()
          });

          const idx = urls.findIndex(u => u.url === item.url);
          if (idx !== -1) {
            urls[idx].groupId = newGroupId;
          }

          chrome.storage.local.set({ groups, urls }, () => {
            groupSelectorWrap.classList.remove('active');
            noteEl.style.display = '';
            loadData();
          });
        });
      } else {
        const newGroupId = selectedVal;
        chrome.storage.local.get({ urls: [] }, (result) => {
          const urls = result.urls;
          const idx = urls.findIndex(u => u.url === item.url);
          if (idx !== -1) {
            if (newGroupId) {
              urls[idx].groupId = newGroupId;
            } else {
              delete urls[idx].groupId;
            }
            chrome.storage.local.set({ urls }, () => {
              groupSelectorWrap.classList.remove('active');
              noteEl.style.display = '';
              loadData();
            });
          }
        });
      }
    };

    // ── YouTube Progress Display ──
    if (item.ytProgress && item.ytProgress.duration > 0) {
      const { currentTime, duration } = item.ytProgress;
      const percentage = Math.min(100, Math.max(0, (currentTime / duration) * 100));
      
      if (currentTime > 5 && currentTime < duration - 5) {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'yt-progress-container';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'yt-progress-bar';
        progressBar.style.width = `${percentage}%`;
        
        progressContainer.appendChild(progressBar);
        infoDiv.appendChild(progressContainer);
        
        const resumeBadge = document.createElement('div');
        resumeBadge.className = 'yt-resume-badge';
        
        const playIcon = document.createElement('i');
        playIcon.setAttribute('data-lucide', 'play');
        resumeBadge.appendChild(playIcon);
        
        const formatTime = (secs) => {
          const h = Math.floor(secs / 3600);
          const m = Math.floor((secs % 3600) / 60);
          const s = Math.floor(secs % 60);
          if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
          return `${m}:${s.toString().padStart(2, '0')}`;
        };
        
        const badgeText = document.createTextNode(` Resume at ${formatTime(currentTime)}`);
        resumeBadge.appendChild(badgeText);
        infoDiv.appendChild(resumeBadge);
      }
    }

    infoDiv.appendChild(groupSelectorWrap);

    const openUrl = async () => {
      let openUrlStr = item.url;
      if (item.ytProgress && item.ytProgress.currentTime > 5 && item.ytProgress.currentTime < item.ytProgress.duration - 5) {
        const seconds = Math.floor(item.ytProgress.currentTime);
        try {
          const urlObj = new URL(openUrlStr);
          urlObj.searchParams.set('t', seconds + 's');
          openUrlStr = urlObj.toString();
        } catch {}
      }

      const tabs = await chrome.tabs.query({});
      const existingTab = tabs.find(t => {
        const tUrl = t.url || t.pendingUrl;
        if (!tUrl) return false;
        const matchA = tUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
        const matchB = item.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
        if (matchA && matchB && matchA[1] === matchB[1]) return true;
        return tUrl === item.url || tUrl === openUrlStr;
      });

      if (existingTab) {
        chrome.tabs.update(existingTab.id, { url: openUrlStr, active: true });
        chrome.windows.update(existingTab.windowId, { focused: true });
      } else {
        chrome.tabs.create({ url: openUrlStr });
      }

      chrome.storage.local.get({ deleteAfterOpen: false }, (result) => {
        if (result.deleteAfterOpen) {
          removeUrl(item.url);
        }
      });
    };

    titleEl.onclick = openUrl;
    faviconWrap.onclick = openUrl;
    faviconWrap.style.cursor = 'pointer';

    // ── Actions ──
    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const menuTrigger = document.createElement('button');
    menuTrigger.className = 'icon-btn menu-trigger';
    menuTrigger.title = 'Options';
    menuTrigger.innerHTML = '<i data-lucide="more-vertical"></i>';
    actions.appendChild(menuTrigger);

    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown-menu';

    if (isInsideGroup) {
      const removeFromGroupBtn = document.createElement('button');
      removeFromGroupBtn.className = 'dropdown-item';
      removeFromGroupBtn.innerHTML = '<i data-lucide="folder-minus"></i> Remove from Group';
      removeFromGroupBtn.onclick = (e) => {
        e.stopPropagation();
        dropdown.classList.remove('active');
        chrome.storage.local.get({ urls: [] }, (result) => {
          const urls = result.urls;
          const idx = urls.findIndex(u => u.url === item.url);
          if (idx !== -1) {
            delete urls[idx].groupId;
            chrome.storage.local.set({ urls }, loadData);
          }
        });
      };
      dropdown.appendChild(removeFromGroupBtn);
    } else {
      const groupBtn = document.createElement('button');
      groupBtn.className = 'dropdown-item';
      groupBtn.innerHTML = '<i data-lucide="folder-plus"></i> Move to Group';
      groupBtn.onclick = (e) => {
        e.stopPropagation();
        dropdown.classList.remove('active');
        const isActive = groupSelectorWrap.classList.contains('active');
        document.querySelectorAll('.group-selector-wrap.active').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.note-editor.active').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.url-note').forEach(el => el.style.display = '');

        if (!isActive) {
          groupSelectorWrap.classList.add('active');
          noteEl.style.display = 'none';
        }
      };
      dropdown.appendChild(groupBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'dropdown-item danger';
      deleteBtn.innerHTML = '<i data-lucide="trash-2"></i> Delete';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        dropdown.classList.remove('active');
        li.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
        li.style.opacity    = '0';
        li.style.transform  = 'translateX(6px)';
        setTimeout(() => removeUrl(item.url), 160);
      };
      dropdown.appendChild(deleteBtn);
    }

    actions.appendChild(dropdown);

    menuTrigger.onclick = (e) => {
      e.stopPropagation();
      const isActive = dropdown.classList.contains('active');
      document.querySelectorAll('.dropdown-menu.active').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.item-actions.menu-active').forEach(el => el.classList.remove('menu-active'));
      if (!isActive) {
        dropdown.classList.add('active');
        actions.classList.add('menu-active');
      }
    };

    li.appendChild(faviconWrap);
    li.appendChild(infoDiv);
    li.appendChild(actions);

    return li;
  }

  function renderUrls(urls) {
    urlList.innerHTML = '';

    if (urls.length === 0) {
      urlList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <i data-lucide="vault" style="width:22px;height:22px;color:var(--text-3)"></i>
          </div>
          <p>Your vault is empty.<br>Save a tab to get started.</p>
        </div>`;
      lucide.createIcons();
      return;
    }

    // Group URLs by day
    const groups = [];
    urls.forEach(item => {
      const label = getDayLabel(item.timestamp);
      let group = groups.find(g => g.label === label);
      if (!group) {
        group = { label, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    });

    groups.forEach(group => {
      // Create and append the group header
      const headerLi = document.createElement('li');
      headerLi.className = 'group-header';
      const span = document.createElement('span');
      span.textContent = group.label;
      headerLi.appendChild(span);

      const openGroupBtn = document.createElement('button');
      openGroupBtn.className = 'open-group-btn';
      openGroupBtn.title = `Open all tabs from ${group.label}`;
      openGroupBtn.innerHTML = '<i data-lucide="external-link"></i>';
      openGroupBtn.onclick = async () => {
        const tabs = await chrome.tabs.query({});
        group.items.forEach(item => {
          const existingTab = tabs.find(t => t.url === item.url || t.pendingUrl === item.url);
          if (!existingTab) {
            chrome.tabs.create({ url: item.url });
          }
        });
      };
      headerLi.appendChild(openGroupBtn);

      urlList.appendChild(headerLi);

      // Render items under this group
      group.items.forEach(item => {
        const li = createUrlItem(item, false);
        urlList.appendChild(li);
      });
    });

    lucide.createIcons();
  }

  function renderGroups() {
    groupsList.innerHTML = '';

    if (allGroups.length === 0) {
      groupsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <i data-lucide="folder" style="width:22px;height:22px;color:var(--text-3)"></i>
          </div>
          <p>No groups created yet.<br>Create a group to categorize your tabs.</p>
        </div>`;
      lucide.createIcons();
      return;
    }

    allGroups.forEach(group => {
      const groupUrls = allUrls.filter(u => u.groupId === group.id);

      const li = document.createElement('li');
      li.className = 'group-item';
      if (expandedGroups.has(group.id)) {
        li.classList.add('expanded');
      }

      // Group Header
      const headerDiv = document.createElement('div');
      headerDiv.className = 'group-item-header';

      const titleWrap = document.createElement('div');
      titleWrap.className = 'group-title-wrap';

      const folderIcon = document.createElement('i');
      folderIcon.setAttribute('data-lucide', 'folder');
      folderIcon.className = 'group-folder-icon';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'group-name';
      nameSpan.textContent = group.name;

      const countSpan = document.createElement('span');
      countSpan.className = 'group-count';
      countSpan.textContent = `(${groupUrls.length})`;

      titleWrap.appendChild(folderIcon);
      titleWrap.appendChild(nameSpan);
      titleWrap.appendChild(countSpan);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'group-actions';

      const openGroupBtn = document.createElement('button');
      openGroupBtn.className = 'icon-btn open-group-btn';
      openGroupBtn.title = 'Open All Tabs';
      openGroupBtn.innerHTML = '<i data-lucide="external-link"></i>';
      openGroupBtn.onclick = (e) => {
        e.stopPropagation();
        if (groupUrls.length === 0) return;
        chrome.tabs.query({}, (tabs) => {
          groupUrls.forEach(item => {
            const existingTab = tabs.find(t => t.url === item.url || t.pendingUrl === item.url);
            if (!existingTab) {
              chrome.tabs.create({ url: item.url });
            }
          });
        });
      };

      const deleteGroupBtn = document.createElement('button');
      deleteGroupBtn.className = 'icon-btn delete-btn';
      deleteGroupBtn.title = 'Delete Group';
      deleteGroupBtn.innerHTML = '<i data-lucide="trash-2"></i>';
      deleteGroupBtn.onclick = (e) => {
        e.stopPropagation();
        removeGroup(group.id);
      };

      actionsDiv.appendChild(openGroupBtn);
      actionsDiv.appendChild(deleteGroupBtn);

      headerDiv.appendChild(titleWrap);
      headerDiv.appendChild(actionsDiv);

      // Accordion click listener
      headerDiv.addEventListener('click', () => {
        const isExpanded = li.classList.contains('expanded');
        document.querySelectorAll('.group-item.expanded').forEach(itemLi => {
          itemLi.classList.remove('expanded');
        });
        expandedGroups.clear();

        if (!isExpanded) {
          li.classList.add('expanded');
          expandedGroups.add(group.id);
        }
      });

      // Sublist containing URLs
      const sublistUl = document.createElement('ul');
      sublistUl.className = 'group-sublist';

      if (groupUrls.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.className = 'group-sublist-empty';
        emptyLi.textContent = 'No tabs in this group';
        sublistUl.appendChild(emptyLi);
      } else {
        groupUrls.forEach(item => {
          const itemLi = createUrlItem(item, true);
          sublistUl.appendChild(itemLi);
        });
      }

      li.appendChild(headerDiv);
      li.appendChild(sublistUl);
      groupsList.appendChild(li);
    });

    lucide.createIcons();
  }

  function removeUrl(url) {
    chrome.storage.local.get({ urls: [] }, (result) => {
      const urls = result.urls.filter(item => item.url !== url);
      chrome.storage.local.set({ urls }, loadData);
    });
  }

  function getDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  function getDayLabel(timestamp) {
    if (!timestamp) return 'Earlier';
    const date = new Date(timestamp);
    const today = new Date();
    
    const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffTime = dToday - dDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7 && diffDays > 0) {
      return date.toLocaleDateString(undefined, { weekday: 'long' });
    } else {
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
  }

  function setupSearch() {
    if (!searchInput) return;
    searchInput.addEventListener('input', () => {
      const val = searchInput.value.toLowerCase().trim();
      if (val) {
        clearSearchBtn.style.display = 'flex';
        const filtered = allUrls.filter(item => 
          item.title.toLowerCase().includes(val) || 
          getDomain(item.url).toLowerCase().includes(val) ||
          (item.note && item.note.toLowerCase().includes(val))
        );
        renderUrls(filtered);
      } else {
        clearSearchBtn.style.display = 'none';
        renderUrls(allUrls);
      }
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      renderUrls(allUrls);
      searchInput.focus();
    });
  }

  function updateStats() {
    if (!statTotal || !statYoutube || !statDomain) return;
    
    // 1. Total Links
    statTotal.textContent = allUrls.length;
    
    // 2. YouTube count
    const ytCount = allUrls.filter(item => {
      const dom = getDomain(item.url).toLowerCase();
      return dom.includes('youtube.com') || dom.includes('youtu.be');
    }).length;
    statYoutube.textContent = ytCount;
    
    // 3. Top domain
    if (allUrls.length === 0) {
      statDomain.textContent = 'None';
      statDomain.title = '';
      return;
    }
    
    const domains = {};
    allUrls.forEach(item => {
      const d = getDomain(item.url);
      domains[d] = (domains[d] || 0) + 1;
    });
    
    let topD = 'None';
    let maxCount = 0;
    for (const d in domains) {
      if (domains[d] > maxCount) {
        maxCount = domains[d];
        topD = d;
      }
    }
    
    statDomain.textContent = topD;
    statDomain.title = `${topD} (${maxCount} saves)`;
  }
});
