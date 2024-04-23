/* 
    
    Apply fixes to anchors on all pages


*/

(function (_, jQuery) {
    "use strict";
  
    const isExternalUrl = (url) => {
        //  If it doesn't start with 'http://' or 'https://'
        if(!/^http[s]?:\/\//.test(url)) {
            return false;
        }

        return new URL(url).origin !== location.origin;
    }
  
    $(document).ready(function () {
        //  Ensures external links open on new tab
        $('a').each((i, a) => {
            const el = $(a);
            const url = el.attr('href');
            if(isExternalUrl(url)) {
                el.attr('target', '_blank')
            }
        })
    });
  })($);
  