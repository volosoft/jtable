/* 

ASP.NET WEB FORMS PAGE METHODS EXTENSION FOR JTABLE
http://www.jtable.org

---------------------------------------------------------------------------

Copyright (C) 2011 by Halil İbrahim Kalkan (http://www.halilibrahimkalkan.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
(function ($) {
    
    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        /* OVERRIDES BASE METHOD */
        _performAjaxCall: function (url, postData, async, success, error) {
            var self = this;

            if (postData == null || postData == undefined) {
                postData = {};
            } else if (typeof postData == 'string') {
                postData = self._convertQueryStringToObject(postData);
            }

            var qmIndex = url.indexOf('?');
            if (qmIndex > -1) {
                $.extend(postData, self._convertQueryStringToObject(url.substring(qmIndex + 1)));
            }

            postData = JSON.stringify(postData);

            $.ajax({
                url: url,
                type: 'POST',
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                data: postData,
                async: async,
                success: function (data) {
                    data = self._normalizeJSONReturnData(data);
                    success(data);
                },
                error: function () {
                    error();
                }
            });
        },

        /* OVERRIDES BASE METHOD */
        _submitFormUsingAjax: function (url, formData, success, error) {
            var self = this;

            formData = {
                record: self._convertQueryStringToObject(formData)
            };

            var qmIndex = url.indexOf('?');
            if (qmIndex > -1) {
                $.extend(formData, self._convertQueryStringToObject(url.substring(qmIndex + 1)));
            }

            var postData = JSON.stringify(formData);

            $.ajax({
                url: url,
                type: 'POST',
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                data: postData,
                success: function (data) {
                    data = self._normalizeJSONReturnData(data);
                    success(data);
                },
                error: function () {
                    error();
                }
            });
        },

        _convertQueryStringToObject: function (queryString) {
            var jsonObj = {};
            var e,
                a = /\+/g,
                r = /([^&=]+)=?([^&]*)/g,
                d = function (s) { return decodeURIComponent(s.replace(a, " ")); };

            while (e = r.exec(queryString)) {
                jsonObj[d(e[1])] = d(e[2]);
            }

            return jsonObj;
        },

        /* Normalizes JSON data that is returned from server.
        *************************************************************************/
        _normalizeJSONReturnData: function (data) {
            //JSON Normalization for ASP.NET
            if (data.hasOwnProperty('d')) {
                return data.d;
            }

            return data;
        }
    });

})(jQuery);