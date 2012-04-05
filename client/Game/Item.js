if (!RPG) RPG = {};

RPG.Item = new Class({


    /**
     * Init Character Equipment
     */
    initialize : function(cache,path) {
	this.itemCache = cache;
	this.path = path;
	if (!cache || !path) return;

	this.item = Object.getFromPath(this.itemCache,path)
    },

    attachToolTip : function(tips, element) {
	var item = this.item;
	if (!item) return element;
	RPG.tipFactory.attach(element,{
	    tips : tips,
	    tipTitle : (new HtmlTable({
		zebra : true,
		selectable : false,
		useKeyboard : false,
		properties : {
		    cellpadding : 2,
		    align : 'left',
		    'class' : 'textLarge',
		    styles : {
			'background-color' : 'black',
			color : 'white',
			width : '100%'
		    }
		},
		rows : [
		[
		{
		    properties : {
			styles : Object.merge(RPG.getMapTileStyles({
			    map : {
				cache : this.itemCache,
				tiles : [this.path]
			    },
			    zoom : 48
			}),{
			    'background-size' : '100% 100%',
			    'background-position' : '0% 0%'
			})
		    },
		    content : '&nbsp'
		},
		{
		    properties : {
			'class' : 'vMiddle'
		    },
		    content : this.item.options.property.tileName
		}
		]
		]
	    })).toElement(),
	    tipText : (new HtmlTable({
		zebra : true,
		selectable : false,
		useKeyboard : false,
		properties : {
		    cellpadding : 2,
		    align : 'left',
		    'class' : 'textLarge',
		    styles : {
			'background-color' : 'black',
			color : 'white',
			width : '100%'
		    }
		},
		rows : (function(){
		    var rows = [];
		    Object.each(item.options.item,function(content,key){
			var row = [{
			    content : key.capitalize()
			}];
			var value = '';
			if (typeof content == 'object') {
			    Object.each(content,function(c,k){
				value += k.capitalize() +': '+ c + ', '
			    });
			    row.push({
				content : value
			    });
			} else {
			    row.push({
				content : content
			    });
			}
			rows.push(row);
		    });
		    return rows;
		}())
	    }).toElement())
	});
	item = null;
	return element;
    }

})