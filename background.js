//Activate the action only when on google scholar pages of the correct structure
chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {

        //Detect when the page is an author's profile
        var condition1 = new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {hostContains: 'scholar.google.com/citations?user'}
        });

        //Detect when the page is a general search
        var condition2 = new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {hostContains: 'scholar.google.com/scholar?h'}
        });

        //Detect when the page is a paper's citations
        var condition3 = new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {hostContains: 'scholar.google.com/scholar?cites'}
        });


        //Add the three conditions 
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [condition1,condition2,condition3],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});

//When page finishes to load, send a message containing the current url of the page to Content Script
chrome.webNavigation.onCompleted.addListener(
    function(details) {
        var currentUrl = details.url;
        var frameId = details.frameId;

        chrome.storage.local.get('text', function(result){
            chrome.tabs.sendMessage(details.tabId, {currentUrl: currentUrl, message: result.text}, function(response) {});
        });
    },
    {
        url: [
            {hostContains: 'scholar.google.com/citations?user'},
            {hostContains: 'scholar.google.com/scholar?h'},
            {hostContains: 'scholar.google.com/scholar?cites'},
            {hostContains: 'scholar.google'}
        ],
    }
);