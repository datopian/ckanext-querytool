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
  };

  $(document).ready(function () {
    const isEmbeded = detectEmbedding();

    if (!isEmbeded) {
      //  Show elements
      $(".embed-hide").removeClass("embed-hide");

      //  Apply header styles
      $(".embed-style").addClass("custom-theme").removeClass("embed-style");
    } else {
      $(".embed-show").removeClass("embed-show");

      //  Make navbar sticky when page is being embedded
      $(".toolbar").css("position", "fixed");
      $(".toolbar").css("z-index", "10000");

      const recalculateTopPadding = () => {
        const toolbarHeight = $(".toolbar").height();
        $(".public-header .container").css("padding-top", toolbarHeight + "px");
        $(".public-header .container-fluid").css(
          "padding-top",
          toolbarHeight + "px"
        );
      };

      recalculateTopPadding();
      $(window).resize(recalculateTopPadding);
    }
  });
})($);
