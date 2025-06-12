// Make sure characters in user-supplied text can be used inside a regex
function escapeRegExp(str){
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Turn a list of strings into case-insensitive word-boundary regexes
function compileMatchers(list){
	return list.map(word => new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i'));
}

// Google Scholar page type
const PageType = Object.freeze({
	AUTHOR: 'author',
	CITES: 'cites',
	GENERAL: 'general',
});

// Return the Google Scholar page type basd on location.pathname + search.
function getPageType(url){
	const {pathname, search} = url;
	if (/\/citations/.test(pathname)) return PageType.AUTHOR
	if (/^\/scholar$/.test(pathname) && /[?&]cites=/.test(search)) return PageType.CITES
	return PageType.GENERAL;
}

// Extract the source text
function extractSource(row, type){
	switch (type){
		case PageType.AUTHOR:
			// Inside <td class="gsc_a_t"> there are two .gs_gray divs.
			// [0] = author list, [1] = journal/conference name
			return row.querySelectorAll('td.gsc_a_t .gs_gray')[1]?.textContent || '';
		case PageType.CITES:
		case PageType.GENERAL:
		default:
			return row.querySelector('.gs_a, .gs_gray')?.textContent || '';
	}
}

// Hide a row if the source matches a regex
function hideRow(row, matchers, type){
	const sourceText = extractSource(row, type);
	if (matchers.some(rx => rx.test(sourceText))){
		row.remove();
		return true;
	}
	return false;
}

// Run filter on a container or single node
function runFilter(root, matchers, type){
	const rows = root.matches && root.classList?.contains('gs_r')
		? [root]
		: root.querySelectorAll?.('.gs_r.gs_or.gs_scl, tr.gsc_a_tr') ?? [];

	let removed = 0;
	rows.forEach(row => {
		if (hideRow(row, matchers, type)) removed++;
	});
	return removed;
}

// Add a MutationObserver so newly-inserted rows get filtered
function observe(container, matchers, type){
	const observer = new MutationObserver((mutations) => {
		mutations.forEach(m => m.addedNodes.forEach(node => runFilter(node, matchers, type)));
	});

	observer.observe(container, {childList: true, subtree: true});
}

// message listener
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	const text = message.message ?? message.blockList ?? '';
	if (!text || !message.currentUrl) return;

	// Parse and compile block list
	const list = message.message.trim().split(/\r?\n/).filter(Boolean);
	if (!list.length) return;
	const matchers = compileMatchers(list);

	// Detect page type once
	const pageType = getPageType(new URL(message.currentUrl));

	// Choose container selector by type
	const container = pageType === PageType.AUTHOR
		? document.querySelector('#gsc_a_t') // table body in author pages
		: document.querySelector('#gs_bdy'); // main body for search pages
	if (!container) return;

	// Initial sweep + set up observer for dynamic results
	//runFilter(container, matchers, pageType);
	//observe(container, matchers, pageType);
	//sendResponse({ ok: true});

	const initialBlocked = runFilter(container, matchers, pageType);
	observe(container, matchers, pageType);
	sendResponse({blocked: initialBlocked});

	return true;
});

(function bootstrap() {
  // Load stored list so filter works without opening popup
  (chrome.storage.sync ?? chrome.storage.local).get('blockList', res => {
	const listText = res.blockList || '';
	const list     = listText.trim().split(/\r?\n/).filter(Boolean);
	if (!list.length) return;

	const matchers = compileMatchers(list);
	const pageType = getPageType(new URL(location.href));

	// Wait for Scholar body if necessary
	const wait = setInterval(() => {
	  const container = pageType === PageType.AUTHOR
		? document.querySelector('#gsc_a_t')
		: document.querySelector('#gs_bdy');
	  if (!container) return;
	  clearInterval(wait);
	  runFilter(container, matchers, pageType);
	  observe(container, matchers, pageType);
	}, 120);
  });
})();