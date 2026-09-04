function getQueryParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
  }

  function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
  }

  var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9+/=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/rn/g,"n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}

  function utmCookie() {

    if (getQueryParam('utm_campaign')) {
    
      var existingCookie = [];
      var newCookie = [];

      var cookieValue = getCookie('csutm');
      if (cookieValue) {
        existingCookie = JSON.parse(Base64.decode(cookieValue));
      }

      var item = {
        c: getQueryParam('utm_campaign'),
        m: getQueryParam('utm_medium'),
        s: getQueryParam('utm_source'),
        t: new Date().getTime()
      }

      var found = false;
      for (var idx=0;idx<existingCookie.length;idx++){
        var val = existingCookie[idx];
        console.log(val);
        if (val.c == item.c && val.m == item.m && val.s == item.s) {
          found = true;
        } 

        if (val.t > new Date().getTime() - 2592000000) {
          newCookie.push(val);
        }
      }

      if (!found) {
        newCookie.push(item);
      }

      var encoded = Base64.encode(JSON.stringify(newCookie));
      setCookie("csutm", encoded, 30);
    }
  }

  function uaCookie() {
      var cookieValue = getCookie('csua');
      if (cookieValue) {
        return;
      }
      var userId = new Date().getTime();
      var encoded = Base64.encode(JSON.stringify(userId));
      setCookie("csua", encoded, 30);
  }

  (function () {
    try {
      utmCookie();
      uaCookie();
    } catch(e) {}
  })();

  var getFirstBrowserLanguage = function () {
    var nav = window.navigator,
    browserLanguagePropertyKeys = ['language', 'browserLanguage', 'systemLanguage', 'userLanguage'],
    i,
    language;
  
    // support for HTML 5.1 "navigator.languages"
    if (Array.isArray(nav.languages)) {
      for (i = 0; i < nav.languages.length; i++) {
        language = nav.languages[i];
        if (language && language.length) {
          return language;
        }
      }
    }
  
    // support for other well known properties in browsers
    for (i = 0; i < browserLanguagePropertyKeys.length; i++) {
      language = nav[browserLanguagePropertyKeys[i]];
      if (language && language.length) {
        return language;
      }
    }   
    return null;
  };

  function uaevent(category, action, label, value) {
    $.post('/ua/event', { category: category, action: action, label: label, value: value });    
  }

  $(function () {
  
    $.post('/ua', { 
      title: document.title, 
      userAgentOverride: navigator.userAgent, 
      path: window.location.pathname, 
      referrer: document.referrer,
      language: getFirstBrowserLanguage(),
      documentencoding: document.characterSet,
      viewportsize: $(window).width() + 'x' + $(window).height(),
      screenresolution: window.screen.width + 'x' + window.screen.height,
      colordepth: screen.colorDepth,
      fp: fp.get()
    });
  
  });

  var Clipboard = function() {

    var textArea;
  
    function isOS() {
      return navigator.userAgent.match(/ipad|iphone/i);
    }
  
    function createTextArea(text) {
      textArea = document.createElement('textArea');
      textArea.readOnly = true;
      textArea.contentEditable = true;
      textArea.value = text;
      document.body.appendChild(textArea);
    }
  
    function selectText() {
      var range, selection;
  
      if (isOS()) {
      range = document.createRange();
      range.selectNodeContents(textArea);
      selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      textArea.setSelectionRange(0, 999999);
      } else {
      textArea.select();
      }
    }
  
    function copyTo() {
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  
    return {
      copy: function(textToCopy) {
        createTextArea(textToCopy);
        selectText();
        copyTo();
      }
    }
  
  } ();
  
  if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength,padString) {
        targetLength = targetLength>>0; //truncate if number or convert non-number to 0;
        padString = String((typeof padString !== 'undefined' ? padString : ' '));
        if (this.length > targetLength) {
            return String(this);
        }
        else {
            targetLength = targetLength-this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength/padString.length); //append to original to ensure we are longer than needed
            }
            return padString.slice(0,targetLength) + String(this);
        }
    };
}
  