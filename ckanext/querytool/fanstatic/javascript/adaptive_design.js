/* 
    
    Apply styling related to the embedding adaptive design 


*/

(function (_, jQuery) {
  "use strict";

  $(document).ready(function () {
    const isEmbeded = true;

    if (!isEmbeded) {
      const els = [ ...document.getElementsByClassName("embed-hide")];

      let i;
      for (i = 0; i < els.length; i++) {
        //  To avoid flickering, all elements are hidden
        //  by default
        els[i].classList.remove("embed-hide");
      }
    } else {
      const els = [ ...document.getElementsByClassName("embed-show")];

      let i;
      for (i = 0; i < els.length; i++) {
        els[i].classList.remove("embed-show");
      }
    }
  });
})($);
