chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    var blockList = message.message.split("\n")

    if (typeof message.currentUrl != "undefined") {
        // Make sure we are not deleting everything!
        // I didn't combine the conditionals because I want the message passing
        // to still return as successful
        if (blockList[0] != ['']) {
            var currentUrl = message.currentUrl;
            var arrURLFragments = currentUrl.split("/");
            var currentDomain = arrURLFragments[2];
            var currentExtension = arrURLFragments[3];

            // For checking if we are on google scholar
            var regDomainGoogle = /google/g;
            var regDomainScholar = /scholar/g;

            // For checking which kind of google scholar page we are on
            var regExtensionCites = /scholar\?cites/g;
            var regExtensionAuthor = /citations/g;
            var regExtensionGeneral = /scholar\?h/g;

            // Make sure we are on google scholar
            if (regDomainGoogle.test(currentDomain.toLowerCase()) && regDomainScholar.test(currentDomain.toLowerCase())) {
                var weAreOnSearchPage = $("#gs_bdy ").length;
                if (weAreOnSearchPage > 0) {

                    if (regExtensionAuthor.test(currentExtension.toLowerCase())) {
                        // We are on an author's page

                        // Find all text that looks like it could be a journal name
                        $("div.gs_gray").each(function () {
                            currentBlock = $(this)
                            var title = currentBlock.text();

                            // Check if the journal is on the block list
                            blockList.forEach(function (item, index) {
                                if (new RegExp(item.toLowerCase()).test(title.toLowerCase())) {
                                    // Delete this element of the HTML table
                                    var elementToDelete = currentBlock.parents("td.gsc_a_t").parents("tr.gsc_a_tr");
                                    if (elementToDelete.length>0){elementToDelete[0].remove()};
                                }
                            })
                        });
                    } else if (regExtensionGeneral.test(currentExtension.toLowerCase()) || regExtensionCites.test(currentExtension.toLowerCase())) {
                        // We are on a general search page or a cited-by page

                        // Find all text that looks like it could be a journal name
                        $("div.gs_a").each(function () {
                            currentBlock = $(this)
                            var title = currentBlock.text();

                            // Check if the journal is on the block list
                            blockList.forEach(function (item, index) {
                                if (new RegExp(item.toLowerCase()).test(title.toLowerCase())) {
                                    // Delete this element of the HTML table
                                    var elementToDelete = currentBlock.parents("div.gs_ri").parents("div.gs_r.gs_or.gs_scl");
                                    if (elementToDelete.length>0){elementToDelete[0].remove()};
                                }
                            })
                        });
                    }
                }
            }
        }
    // Notify the sender that the message was successfully received
    sendResponse({ received: "OK" });
    }
});