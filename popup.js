(function(window){
    // Default settings for the size and text in the text box
    var settings = {
        // height of the text box when it's empty
        minHeight : 40,
        // height of the text box at max capacity
        maxHeight : 100,
        // placeholder in the text box
        placeholder : "Enter block list here"
    };
    
    // DOM is ready
    document.addEventListener('DOMContentLoaded', function () {
        var textarea = document.getElementById('textarea'),
        emptyEvent = new CustomEvent("isEmpty"),
        overflowEvent = new CustomEvent("isOverflow");

        window.addEventListener('focus', fillTextarea);
        window.addEventListener('blur', saveTextarea);
        textarea.removeAttribute('readonly');
        
        textarea.addEventListener('isEmpty', function(e){
            setHeight(settings.minHeight);
        });

        textarea.addEventListener('isOverflow', function(e){
            setHeight();
        });
    
        textarea.addEventListener('input', function(e){
            if(textarea.value.trim() == ''){
                textarea.dispatchEvent(emptyEvent);
            }
            if(textarea.scrollHeight > textarea.offsetHeight){
                textarea.dispatchEvent(overflowEvent);
            }

            // Save the text in the text box
            saveTextarea();
        });

        // Send message to the content script on button press
        button.addEventListener('click', sendTextarea);

        function fillTextarea(){
            chrome.storage.local.get('text', function(result){
                var val = result.text
                if(val !== ''){
                    // focus textarea on first line
                    textarea.value = val;
                }
            });
        }

        // Save the current block list to local storage
        function saveTextarea(){
            chrome.storage.local.set({"text": textarea.value})
        }

        // Send the current URL and array of blocked journals to the content script
        function sendTextarea(){
            chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
                var activeTab = tabs[0];
                chrome.tabs.sendMessage(activeTab.id, {"currentUrl": activeTab.url, 
                                                       "message": textarea.value});
            });
        }
        
        function setHeight(value){
            var val = value || Math.min(textarea.scrollHeight, settings.maxHeight);
            textarea.style.height = val + 'px';
        }

        function init(){
            textarea.setAttribute('placeholder', settings.placeholder);
            fillTextarea();
            textarea.focus();
            setHeight();
        }
        
        init();
    });
})(this);