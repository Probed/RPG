Common Javascript
-----------------

Within this folder are file which are shared between the client and the server

In order to maintain some level of compatibility between the client and server the following needs to be at the top of each common file:

`if (!RPG) var RPG = {};
if (typeof exports != 'undefined') {
    //Object.merge([required server files]);
    module.exports = RPG;
}`

### [appInfo.js](https://github.com/Probed/RPG/tree/master/common/appInfo.js)
--------------
This file contains a free form object which should, in later development, be used in some way. It is currently loaded on both client and server but serves almost no function.

### [optionsConfig.js](https://github.com/Probed/RPG/tree/master/common/optionsConfig.js)
--------------
See [optionConfig.md](https://github.com/Probed/RPG/tree/master/common/optionsConfig.md) for more details

### [pages.js](https://github.com/Probed/RPG/tree/master/common/pages.js)
---
This object defines the relationships between hashtags and the pages they load.

### [Random.js](https://github.com/Probed/RPG/tree/master/common/Random.js)
---

#### Object: `RPG.Random`

A Cloneable object that gives seeded random values.

Options:
    `seed` : `float` any real number
    `random` : `function(min,max)` returns a random number between min and max (or 0 and 1 if no min/max is provided)

    `RPG.Random.seed = '12345';
    `var randNum = RPG.Random.random(0,100);`


#### function: `Object.getSRandom(source,rand,ignore)`

Allows you to retrieve a seeded random value from an object.

    `var obj = {`
        `'1' : 'value1'`
        `'2' : 'value2'`
        `'a' : 'valueA'`
    `};`
    `var rand = Object.getSRandom(obj,RPG.Random,'2'); //ignores the key '2'`
    `//out: rand.key = '1' (randomly selected)`
    `//out: rand.value = 'value1'`

#### function: `Array.getSRandom(source,rand)`

Allows you to retrieve a seeded random value from an array
`
var arr = ['1','2','3','4'];
var rand = Array.getSRandom(arr,RPG.Random);
//rand = '3' (randomly selected)
`

### [string.md5.js](https://github.com/Probed/RPG/tree/master/common/string.md5.js)
---

`var md5 = 'this is a string converted to md5'.toMD5();`

### [string.utf8.js](https://github.com/Probed/RPG/tree/master/common/string.utf8.js)
---

`var utf = 'this is a string converted to utf8'.toUTF8();`