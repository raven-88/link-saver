// Background script for URL Vault extension

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    updateBadge(tab);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab) {
      updateBadge(tab);
    }
  });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.urls) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab) {
        updateBadge(tab);
      }
    });
  }
});

let cachedSavedIcons = null;

async function generateCombinedIcon(size) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const baseRes = await fetch(chrome.runtime.getURL(`icon${size}.png`));
  const baseBlob = await baseRes.blob();
  const baseBitmap = await createImageBitmap(baseBlob);

  const checkRes = await fetch(chrome.runtime.getURL(`saved${size}.png`));
  const checkBlob = await checkRes.blob();
  const checkBitmap = await createImageBitmap(checkBlob);

  ctx.drawImage(baseBitmap, 0, 0, size, size);

  // Bottom-left corner checkmark overlay (scaled slightly larger)
  const badgeSize = Math.round(size * 0.55);
  const x = 0;
  const y = size - badgeSize;

  // Draw white circle background behind the checkmark to make it pop and look premium
  ctx.beginPath();
  ctx.arc(x + badgeSize / 2, y + badgeSize / 2, (badgeSize / 2) - 0.5, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.drawImage(checkBitmap, x, y, badgeSize, badgeSize);

  return ctx.getImageData(0, 0, size, size);
}

async function getSavedIcons() {
  if (cachedSavedIcons) return cachedSavedIcons;

  try {
    const imgData16 = await generateCombinedIcon(16);
    const imgData32 = await generateCombinedIcon(32);
    const imgData48 = await generateCombinedIcon(48);
    cachedSavedIcons = {
      16: imgData16,
      32: imgData32,
      48: imgData48
    };
    return cachedSavedIcons;
  } catch (e) {
    console.error("Failed to generate icons:", e);
    return null;
  }
}

function updateBadge(tab) {
  if (!tab || !tab.id || !tab.url) return;
  
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('brave://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
    chrome.action.setIcon({
      path: {
        "16": "icon16.png",
        "32": "icon32.png",
        "48": "icon48.png"
      },
      tabId: tab.id
    });
    return;
  }

  chrome.storage.local.get({ urls: [] }, async (result) => {
    const isSaved = result.urls.some(item => item.url === tab.url);
    if (isSaved) {
      const savedIcons = await getSavedIcons();
      if (savedIcons) {
        chrome.action.setIcon({ imageData: savedIcons, tabId: tab.id });
      }
    } else {
      chrome.action.setIcon({
        path: {
          "16": "icon16.png",
          "32": "icon32.png",
          "48": "icon48.png"
        },
        tabId: tab.id
      });
    }
  });
}
