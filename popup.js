const textarea = document.getElementById('list');
const applyBtn = document.getElementById('apply');
const resetLn = document.getElementById('reset');

const storage = chrome.storage.sync ?? chrome.storage.local;

const debounce = (fn, t = 400) => {
    let id; return (...a) => {clearTimeout(id); id = setTimeout(() => fn(...a), t); };
};

const getActiveTabId = () =>
    new Promise(res =>
        chrome.tabs.query({active: true, currentWindow: true}, tabs => res(tabs[0]?.id))
    );

(async () => {
    const {blockList = ''} = await storage.get('blockList');
    textarea.value = blockList;
})();

textarea.addEventListener('input', debounce(() => {
    storage.set({blockList: textarea.value});
}));

resetLn.addEventListener('click', e => {
    e.preventDefault();
    textarea.value = '';
    storage.set({blockList: ''});
    chrome.action.setBadgeText({text: ''});
});

applyBtn.addEventListener('click', async () => {
    const tabId = await getActiveTabId();
    if (!tabId) return;

    storage.set({blockList: textarea.value});

    chrome.tabs.sendMessage(tabId, {message: textarea.value}, response => {
        if (chrome.runtime.lastError) return;
        if (typeof response?.blocked === 'number'){
            chrome.action.setBadgeBackgroundColor({ color: '#4688F1'});
            chrome.action.setBadgeText({text: String(response.blocked)});
        }
        window.close();
    });
});

// listen for real-time updates from content script
chrome.runtime.onMessage.addListener(({blocked}) => {
    if (typeof blocked === 'number') {
        chrome.action.setBadgeBackgroundColor({color: '#4688F1'});
        chrome.action.setBadgeText({text: String(blocked)});
    }
});