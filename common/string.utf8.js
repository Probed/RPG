/*
---
description: String UTF8 encoding.
license: MIT-style
authors: [Christopher Pitt]
provides: [String.toUTF8]
requires:
  core/1.2.4: [String]
...
*/
(function() {
    function utf8(string)
    {
	var a, b, result = '',
	from = String.fromCharCode;

	for (a = 0; b = string.charCodeAt(a); a++)
	{
	    if (b < 128)
	    {
		result += from(b);
	    }
	    else if ((b > 127) && (b < 2048))
	    {
		result += from((b >> 6) | 192);
		result += from((b & 63) | 128);
	    }
	    else
	    {
		result += from((b >> 12) | 224);
		result += from(((b >> 6) & 63) | 128);
		result += from((b & 63) | 128);
	    }
	}

	return result;
    }

    String.implement({
	'toUTF8': function()
	{
	    return utf8(this);
	}
    });

})();