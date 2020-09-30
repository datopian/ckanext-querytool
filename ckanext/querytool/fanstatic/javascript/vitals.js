$(document).ready(function(){
    $(document).ready(function(){
        var maxLength = 300;
        $(".show-read-more").each(function(){
            var myStr = $(this).text();
            if($.trim(myStr).length > maxLength){
                var newStr = myStr.substring(0, maxLength);
                var removedStr = myStr.substring(maxLength, $.trim(myStr).length);
                $(this).empty().html(newStr);
                $(this).append(' <a href="javascript:void(0);" class="read-more">read more...</a>');
                $(this).append('<span class="more-text">' + removedStr + '</span>');
            }
        });
        $(".read-more").click(function(){
            $(this).siblings(".more-text").contents().unwrap();
            $(this).remove();
        });
    });
})