/*
---
description: String MD5 hashing.
license: MIT-style
authors: [Christopher Pitt]
provides: [String.toMD5]
requires:
  core/1.2.4: [String]
  _self_/_current_: [String.toUTF8]
...
*/
(function() {
    var transforms = {
	'f': function(a, b, c)
	{
	    return (a & b) | ((~a) & c);
	},
	'g': function(a, b, c)
	{
	    return (a & c) | (b & (~c));
	},
	'h': function(a, b, c)
	{
	    return (a ^ b ^ c);
	},
	'i': function(a, b, c)
	{
	    return (b ^ (a | (~c)));
	},
	'rotateLeft': function(a, b)
	{
	    return (a << b) | (a >>> (32 - b));
	},
	'addUnsigned': function(a, b)
	{
	    var a8 = (a & 0x80000000),
	    b8 = (b & 0x80000000),
	    a4 = (a & 0x40000000),
	    b4 = (b & 0x40000000),
	    result = (a & 0x3FFFFFFF) + (b & 0x3FFFFFFF);

	    if (a4 & b4)
	    {
		return (result ^ 0x80000000 ^ a8 ^ b8);
	    }

	    if (a4 | b4)
	    {
		if (result & 0x40000000)
		{
		    return (result ^ 0xC0000000 ^ a8 ^ b8);
		}
		else
		{
		    return (result ^ 0x40000000 ^ a8 ^ b8);
		}
	    }
	    else
	    {
		return (result ^ a8 ^ b8);
	    }
	},
	'compound': function(a, b, c, d, e, f, g, h)
	{
	    var trans = transforms,
	    add = trans.addUnsigned,
	    temp = add(b, add(add(trans[a](c, d, e), g), f));

	    return add(trans.rotateLeft(temp, h), c);
	}
    };

    function convertToArray(string)
    {
	var messageLength = string.length;
	var numberOfWords = (((messageLength + 8) - ((messageLength + 8) % 64)) / 64 + 1) * 16;
	var wordArray = new Array();
	var wordCount = 0;
	var bytePosition = 0;
	var byteCount = 0;

	while (byteCount < messageLength)
	{
	    wordCount = (byteCount - (byteCount % 4)) / 4;
	    bytePosition = (byteCount % 4) * 8;
	    wordArray[wordCount] = (wordArray[wordCount] | (string.charCodeAt(byteCount) << bytePosition));
	    byteCount++;
	}

	wordCount = (byteCount - (byteCount % 4)) / 4;
	bytePosition = (byteCount % 4) * 8;
	wordArray[wordCount] = wordArray[wordCount] | (0x80 << bytePosition);
	wordArray[numberOfWords - 2] = messageLength << 3;
	wordArray[numberOfWords - 1] = messageLength >>> 29;

	return wordArray;
    }

    function convertToHex(string)
    {
	var result = '';
	var temp = '';
	var nibble = '';
	var i = '';

	for (i = 0; i <= 3; i++)
	{
	    nibble = (string >>> (i * 8)) & 255;
	    temp = "0" + nibble.toString(16);
	    result = result + temp.substr(temp.length-2,2);
	}

	return result;
    }

    function md5(string)
    {
	var t1, t2, t3, t4,
	x = convertToArray(string.toUTF8()),

	a = 0x67452301, b = 0xEFCDAB89,
	c = 0x98BADCFE, d = 0x10325476,

	s1 = 7, s2 = 12, s3 = 17, s4 = 22,
	s5 = 5, s6 = 9, s7 = 14, s8 = 20,
	s9 = 4, s10 = 11, s11 = 16, s12 = 23,
	s13 = 6, s14 = 10, s15 = 15, s16 = 21;

	for (var k = 0; k < x.length; k += 16)
	{
	    t1 = a;
	    t2 = b;
	    t3 = c;
	    t4 = d;

	    a = transforms.compound('f', a, b, c, d, 0xD76AA478, x[k + 0], s1);
	    d = transforms.compound('f', d, a, b, c, 0xE8C7B756, x[k + 1], s2);
	    c = transforms.compound('f', c, d, a, b, 0x242070DB, x[k + 2], s3);
	    b = transforms.compound('f', b, c, d, a, 0xC1BDCEEE, x[k + 3], s4);
	    a = transforms.compound('f', a, b, c, d, 0xF57C0FAF, x[k + 4], s1);
	    d = transforms.compound('f', d, a, b, c, 0x4787C62A, x[k + 5], s2);
	    c = transforms.compound('f', c, d, a, b, 0xA8304613, x[k + 6], s3);
	    b = transforms.compound('f', b, c, d, a, 0xFD469501, x[k + 7], s4);
	    a = transforms.compound('f', a, b, c, d, 0x698098D8, x[k + 8], s1);
	    d = transforms.compound('f', d, a, b, c, 0x8B44F7AF, x[k + 9], s2);
	    c = transforms.compound('f', c, d, a, b, 0xFFFF5BB1, x[k + 10], s3);
	    b = transforms.compound('f', b, c, d, a, 0x895CD7BE, x[k + 11], s4);
	    a = transforms.compound('f', a, b, c, d, 0x6B901122, x[k + 12], s1);
	    d = transforms.compound('f', d, a, b, c, 0xFD987193, x[k + 13], s2);
	    c = transforms.compound('f', c, d, a, b, 0xA679438E, x[k + 14], s3);
	    b = transforms.compound('f', b, c, d, a, 0x49B40821, x[k + 15], s4);
	    a = transforms.compound('g', a, b, c, d, 0xF61E2562, x[k + 1], s5);
	    d = transforms.compound('g', d, a, b, c, 0xC040B340, x[k + 6], s6);
	    c = transforms.compound('g', c, d, a, b, 0x265E5A51, x[k + 11], s7);
	    b = transforms.compound('g', b, c, d, a, 0xE9B6C7AA, x[k + 0], s8);
	    a = transforms.compound('g', a, b, c, d, 0xD62F105D, x[k + 5], s5);
	    d = transforms.compound('g', d, a, b, c, 0x2441453, x[k + 10], s6);
	    c = transforms.compound('g', c, d, a, b, 0xD8A1E681, x[k + 15], s7);
	    b = transforms.compound('g', b, c, d, a, 0xE7D3FBC8, x[k + 4], s8);
	    a = transforms.compound('g', a, b, c, d, 0x21E1CDE6, x[k + 9], s5);
	    d = transforms.compound('g', d, a, b, c, 0xC33707D6, x[k + 14], s6);
	    c = transforms.compound('g', c, d, a, b, 0xF4D50D87, x[k + 3], s7);
	    b = transforms.compound('g', b, c, d, a, 0x455A14ED, x[k + 8], s8);
	    a = transforms.compound('g', a, b, c, d, 0xA9E3E905, x[k + 13], s5);
	    d = transforms.compound('g', d, a, b, c, 0xFCEFA3F8, x[k + 2], s6);
	    c = transforms.compound('g', c, d, a, b, 0x676F02D9, x[k + 7], s7);
	    b = transforms.compound('g', b, c, d, a, 0x8D2A4C8A, x[k + 12], s8);
	    a = transforms.compound('h', a, b, c, d, 0xFFFA3942, x[k + 5], s9);
	    d = transforms.compound('h', d, a, b, c, 0x8771F681, x[k + 8], s10);
	    c = transforms.compound('h', c, d, a, b, 0x6D9D6122, x[k + 11], s11);
	    b = transforms.compound('h', b, c, d, a, 0xFDE5380C, x[k + 14], s12);
	    a = transforms.compound('h', a, b, c, d, 0xA4BEEA44, x[k + 1], s9);
	    d = transforms.compound('h', d, a, b, c, 0x4BDECFA9, x[k + 4], s10);
	    c = transforms.compound('h', c, d, a, b, 0xF6BB4B60, x[k + 7], s11);
	    b = transforms.compound('h', b, c, d, a, 0xBEBFBC70, x[k + 10], s12);
	    a = transforms.compound('h', a, b, c, d, 0x289B7EC6, x[k + 13], s9);
	    d = transforms.compound('h', d, a, b, c, 0xEAA127FA, x[k + 0], s10);
	    c = transforms.compound('h', c, d, a, b, 0xD4EF3085, x[k + 3], s11);
	    b = transforms.compound('h', b, c, d, a, 0x4881D05, x[k + 6], s12);
	    a = transforms.compound('h', a, b, c, d, 0xD9D4D039, x[k + 9], s9);
	    d = transforms.compound('h', d, a, b, c, 0xE6DB99E5, x[k + 12], s10);
	    c = transforms.compound('h', c, d, a, b, 0x1FA27CF8, x[k + 15], s11);
	    b = transforms.compound('h', b, c, d, a, 0xC4AC5665, x[k + 2], s12);
	    a = transforms.compound('i', a, b, c, d, 0xF4292244, x[k + 0], s13);
	    d = transforms.compound('i', d, a, b, c, 0x432AFF97, x[k + 7], s14);
	    c = transforms.compound('i', c, d, a, b, 0xAB9423A7, x[k + 14], s15);
	    b = transforms.compound('i', b, c, d, a, 0xFC93A039, x[k + 5], s16);
	    a = transforms.compound('i', a, b, c, d, 0x655B59C3, x[k + 12], s13);
	    d = transforms.compound('i', d, a, b, c, 0x8F0CCC92, x[k + 3], s14);
	    c = transforms.compound('i', c, d, a, b, 0xFFEFF47D, x[k + 10], s15);
	    b = transforms.compound('i', b, c, d, a, 0x85845DD1, x[k + 1], s16);
	    a = transforms.compound('i', a, b, c, d, 0x6FA87E4F, x[k + 8], s13);
	    d = transforms.compound('i', d, a, b, c, 0xFE2CE6E0, x[k + 15], s14);
	    c = transforms.compound('i', c, d, a, b, 0xA3014314, x[k + 6], s15);
	    b = transforms.compound('i', b, c, d, a, 0x4E0811A1, x[k + 13], s16);
	    a = transforms.compound('i', a, b, c, d, 0xF7537E82, x[k + 4], s13);
	    d = transforms.compound('i', d, a, b, c, 0xBD3AF235, x[k + 11], s14);
	    c = transforms.compound('i', c, d, a, b, 0x2AD7D2BB, x[k + 2], s15);
	    b = transforms.compound('i', b, c, d, a, 0xEB86D391, x[k + 9], s16);

	    a = transforms.addUnsigned(a, t1);
	    b = transforms.addUnsigned(b, t2);
	    c = transforms.addUnsigned(c, t3);
	    d = transforms.addUnsigned(d, t4);
	}

	return (convertToHex(a) + convertToHex(b) + convertToHex(c) + convertToHex(d)).toLowerCase();
    }

    String.implement({
	'toMD5': function()
	{
	    return md5(this);
	}
    });

})();