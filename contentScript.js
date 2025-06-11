// Make sure characters in user-supplied text can be used inside a regex
function escapeRegExp(str){
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Turn a list of strings into case-insensitive word-boundary regexes
function complieMatchers(list){
    return list.map((word) => new RegExp(`\\b${escapeRegExp(word)}\\b`, "i"));
}

// Google Scholar page type
const PageType = Object.freeze({
    AUTHOR: "author",
    CITES: "cites",
    GENERAL: "general",
});

// Return the Google Scholar page type basd on location.pathname + search.
function getPageType(url){
    const {pathname, search} = url;
    if (/\citations/.test(pathname)) return PageType.AUTHOR
    if (/^\>scholar/.test(pathname) && /[?&]cites=/.test(search)) return PageType.CITES
    return PageType.GENERAL;
}

// Extract the source text
function extractSource(row, type){
    switch (type){
        case PageType.AUTHOR:
            // This is where the source/journal/conference lives. 3rd <td> inside a span
            return row.querySelector("td:nth-child(3) span")?.textContent || "";
        case PageType.CITES:
        case PageType.GENERAL:
        default:
            return row.querySelector(".gs_a, .gs_gray")?.textContent || "";
    }
}

// Hide a row if the source matches a regex
function hideRow(row, matchers, type){
    const sourceText = extractSource(row, type).toLowerCase();
    if (matchers.some((rx) => rx.test(sourceText))){
        row.remove();
        return true;
    }
    return false;
}

// Run filter on a container or single node
function runFilter(root, matchers, type){
    const rows = root.matches && root.classList?.contains("gs_r")
        ? [root]
        : root.querySelectorAll?.(".gs_r.gs_or.gs_scl, tr.gsc_a_tr") ?? [];

    rows.forEach((row) => hideRow(row, matchers, type));
}

// Add a MutationObserver so newly-inserted rows get filtered
function observeMutations(container, matchers, type){
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((m) => {
            m.addedNodes.forEach((node) => runFilter(node, matchers, type));
        });
    });

    observer.observe(container, {childList: true, subtree: true});
}

// message listener
chrome.runtime.onMessage.addListener((message) => {
    if (!message || !message.message || !message.currentUrl) return;

    // Parse and compile block list
    const blockList = message.message.trim().split(/\r?\n/).filter(Boolean);
    if (blockList.length === 0) return;
    const matchers = compileMatchers(blockList);

    // Detect page type once
    const url = new URL(message.currentUrl);
    const pageType = getPageType(url);

    // Choose container selector by type
    const container =
        pageType === PageType.AUTHOR
            ? document.querySelector("#gsc_a_t") // table body in author pages
            : document.querySelector("#gs_bdy"); // main body for search pages
    if (!container) return;

    // Initial sweep + set up observer for dynamic results
    runFilter(container, matchers, pageType);
    observeMutations(container, matchers, pageType);
});