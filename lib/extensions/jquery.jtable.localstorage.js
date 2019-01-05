/* 

COOKIES METHODS EXTENSION FOR JTABLE
REPLACE COOKIES WITH LOCAL STORAGE
http://www.jtable.org

*/
(function ($) {

    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
        * COOKIE                                                                *
        *************************************************************************/
       
        /* OVERRIDES BASE METHOD.
        /* Sets a local storage item with given key.
        *************************************************************************/
       _setCookie: function (key, value) {
            key = this._cookieKeyPrefix + key;
            localStorage.setItem(key,value);
        },

        /* OVERRIDES BASE METHOD.
        /* Gets local storage item with given key.
        *************************************************************************/
        _getCookie: function (key) {
            key = this._cookieKeyPrefix + key;
            var result = localStorage.getItem(key);
            return result;
        }
    });

})(jQuery);