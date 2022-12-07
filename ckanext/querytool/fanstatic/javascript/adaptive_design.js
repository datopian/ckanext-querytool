/* 
    
    Apply styling related to the embedding adaptive design 


*/

(function (_, jQuery) {
  "use strict";

  const detectEmbedding = () => {
    try {
      return window.self !== window.top;
    } catch (e) {
        return true;
    }
  }

  $(document).ready(function () {
    const isEmbeded = detectEmbedding();

    if (!isEmbeded) {
      //  Show elements
      $(".embed-hide").removeClass("embed-hide");
      
      //  Apply header styles
      $('.embed-style')
        .addClass('custom-theme')
        .removeClass('embed-style');

    } else {
      $(".embed-show").removeClass("embed-show");
    }
  });
})($);
