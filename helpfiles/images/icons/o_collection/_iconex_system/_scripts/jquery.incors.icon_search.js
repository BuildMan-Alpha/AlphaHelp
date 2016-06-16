/*  Iconexperience Search, version 2.1
 *  
 *  (c) 2013 Incors GmbH
 *--------------------------------------------------------------------------*/

(function($) {

$.Incors = $.Incors || {};

startSearch = function() {
  if ($.Incors.IconSearchAjaxDb) {
    var db = new $.Incors.IconSearchAjaxDb();
  } else if ($.Incors.IconSearchFileDb) {
    var db = new $.Incors.IconSearchFileDb();
  } else {
    alert('Icon Database Missing');
    return;
  }
  
  iconSearch = new $.Incors.IconSearch(db);
  new $.Incors.ExceptionHandler();
  
  $("a[rel='samples']").colorbox({ title: function() { return $(this).attr('subtitle'); } });
};

var endSearch = function() {

};

//$(document).ready(startSearch);

$(window).load(function() {
  startSearch();
});

$.Incors.IconSearchConfig = {
  imgKeywordSearchPreviewSize: 24,
  searchFieldOpacity: 0.6
};

$.Incors.IconSearch = function(db, options) {
  this.options = $.extend({}, options || {});
  
  $('#icon_search').show();
  $('#i_icon_search').css({ opacity: $.Incors.IconSearchConfig.searchFieldOpacity });

  // used database (ajax or file)
  this.db = db;
  
  // image loader
  this.imageLoader = new $.Incors.ImageLoader({ imgSize: $.Incors.IconSearchConfig.imgKeywordSearchPreviewSize });
  
  // icon preview colorbox
  this.iconsColorbox = new $.Incors.IconsColorbox({
    onOpen: $.proxy(function() {
      this.imageLoader.pause();
    }, this),
    onCleanup: $.proxy(function() {
      this.imageLoader.resume();
    }, this),
    onComplete: $.proxy(function() {
      var imgs = $('#icon_preview_colorbox').find('img');
      //var imgs = $('#details').find('.detail_img');
      var imgLoadCount = imgs.length;
      var imageLoader = this.imageLoader;
      imgs.bind('load', function(event) {
        if (--imgLoadCount == 0) {
          imageLoader.resume();
        }
      });
    }, this)
  });
  
  this.emptyResult = $('#results').children()[0];
  
  // binding functions
  this.resultIconsProxy = $.proxy(this.resultIcons, this);
  this.keywordResultHandlerProxy = $.proxy(this.keywordResultHandler, this);
  this.nameResultHandlerProxy = $.proxy(this.nameResultHandler, this);
  this.onClickResultsProxy = $.proxy(this.onClickResults, this);
  this.onSearchTypeChangedProxy = $.proxy(this.onSearchTypeChanged, this);
  this.onShadowTrueProxy = $.proxy(this.onShadowTrue, this);
  this.onShadowFalseProxy = $.proxy(this.onShadowFalse, this);
  this.onClickKeywordProxy = $.proxy(this.onClickKeyword, this);
  
  // observing
  this.inputObserver = new $.Incors.InputObserver($('#i_icon_search'), this.resultIconsProxy);
  $('#results').bind('click', this.onClickResultsProxy);
  $('#search_type_icon_names').bind('click', this.onSearchTypeChangedProxy);
  $('#search_type_keywords').bind('click', this.onSearchTypeChangedProxy);
  
  // cursor into input field
  $('#i_icon_search').focus();
  
  this.cssHelper = new $.Incors.CssHelper();

  // resize content to fill window space
  this.cssHelper.addVertFillElem($('#results'), 0);
  this.cssHelper.addVertFillElem($('#details'), 0);


  // set shadow versions displayed by default
  this.shadow = this.isShadow();
  
  // this is used when input field is already prepopulated
  // the timeout is used to fix an unsolved bug where in some cases the ajax request returns
  // not the expected json but the full html of search.php
  window.setTimeout(function() { $('#i_icon_search').keyup(); }, 100);
};

$.Incors.IconSearch.prototype = {
  isShadow: function() { return true; },
  
  getRowBackgroundColor: function() { return 'none'; },
  
  getHighlightedIconBorder: function() { return 'solid 2px #adad1b'; }, 
  
  getBackgroundColorOnSelect: function(elem) { return 'none'},
  
  /**
  * Called when user has entered a new search value.
  * 
  * @param {String} value Search value
  * @param {Function} callBack Function called when done
  * @param {Boolean} showAllResults set to true if size of results should not be limited
  * 
  * @return void
  */
  resultIcons: function(value, callBack, showAllResults) {
    this.imageLoader.reset();
    $('#i_icon_search').css({ backgroundColor: '#e6e9ea', color: '#bbb' });
    window.setTimeout($.proxy(function() { this.resultIconsDelayed(value, callBack, showAllResults); }, this), 50);
  },
  
  /**
  * Wrapped function which is called after a short timeout to allow the input field to
  * change its appearance.
  * 
  * @see Incors.IconSearch.resultIcons
  */
  resultIconsDelayed: function(value, callBack, showAllResults) {
    var showAllResults = (showAllResults == null) ? false : showAllResults;
    if ($('#search_type_icon_names:checked').val() == null) {
      this.value = $.Incors.StringNormalizer.normalizeKeyword(value);
    } else {
      this.value = $.Incors.StringNormalizer.normalizeName(value);
    }
    
    this.resetDetails();
  
    if (this.value == "" || this.value == null) {
      this.removeResultsRowMore();
      $('#results').html(this.emptyResult);
      $('#i_icon_search').css({ backgroundColor: '#fff', color: '#000' });
      callBack();
      return;
    }
    
    if ($('#search_type_icon_names:checked').val()) {
      this.db.searchName(this.value, true, $.proxy(function(name, value) {
        this.removeResultsRowMore();
        if (name != null) {
          this.nameResultHandlerProxy(name, value);
        }
        $('#i_icon_search').css({ backgroundColor: '#fff', color: '#000' });
        callBack();
      }, this));
    } else {
      this.db.searchKeyword(this.value, showAllResults, $.proxy(function(searchWord, value) {
        if (searchWord != null) {
          this.keywordResultHandlerProxy(searchWord, showAllResults, value);
        }
        $('#i_icon_search').css({ backgroundColor: '#fff', color: '#000' });
        callBack();
      }, this));
    }
  },
  
  removeResultsRowMore: function() {
    var resultsRowMore = $('#results_row_more');
    if (resultsRowMore) {
      resultsRowMore.remove();
      this.cssHelper.adjustVertFillElems();
    }
  },
  
  insertResultsRowMore: function() {
    var resultsRowMore = $('#results_row_more');
    if (resultsRowMore.length == 0) {
      $($.Incors.Template.resultRowMoreTmpl({maxSize: MAX_RESULT_SIZE})).insertAfter($('#search'));
      this.cssHelper.adjustVertFillElems();
    }
  },
  
  resetDetails: function() {
    $('#details').empty();
  },
  
  keywordResultHandler: function(searchWord, showAllResults, value) {
    var totalCount = value.total_count;
    var keywords = value.value;
    keywords.sort(function(a, b) {
      aL = a[0].toLowerCase();
      bL = b[0].toLowerCase();
      return (aL < bL) ? -1 : (aL > bL) ? 1 : 0;
    });
    var resultRows = [];
    if (!showAllResults && totalCount >= MAX_RESULT_SIZE) {
      this.insertResultsRowMore();
    } else {
      this.removeResultsRowMore();
    }
    
    if (keywords.length == 0) {
      resultRows.push($.Incors.Template.noKeywordResultTmpl({searchWord: $.Incors.escapeHtml(searchWord)}));
    }
    
    for (var i = 0; i < keywords.length && (showAllResults || i < MAX_RESULT_SIZE); i++) {
      if (this.value != searchWord) {
        // search has changed
        return;
      }
      var keywordEntry = keywords[i];
      var resultListImgs = [];
      var iconDeclarations = keywordEntry[1];
      var rowBackgroundColor = this.getRowBackgroundColor();
      for (var j = 0; j < iconDeclarations.length; j++) {
        var iconDeclaration = iconDeclarations[j];
        var iconId = iconDeclaration[0]
        var iconName = iconDeclaration[1];
        resultListImgs.push($.Incors.Template.resultListImgTmpl({iconId: iconId, iconName: iconName, backgroundColor: rowBackgroundColor }));   
      }
      var oddOrEven = i % 2 == 0 ? "odd" : "even";
      
      var keywordEntryHighlight = this.highlightKeyword(keywordEntry[0], searchWord);
      resultRows.push($.Incors.Template.resultRowTmpl({keyword: keywordEntryHighlight, resultListImgs: resultListImgs.join(''), oddOrEven: oddOrEven, backgroundColor: rowBackgroundColor }));
    }
    var output = $.Incors.Template.resultTmpl({resultRows: resultRows.join("")});
    
    $('#results').html(output);
    $('#results').scrollTop = 0;
    
    var imgs = $('#results img');
    
    for (var i = 0; i < imgs.length; ++i) {
      this.imageLoader.insertLast(imgs[i]);
    }
    this.imageLoader.loadImages();
  },
  
  nameResultHandler: function(name, value) {
    var resultsRowMore = $('results_row_more');
    if (resultsRowMore) {
      resultsRowMore.remove();
      this.cssHelper.adjustVertFillElems();
    }
    var totalCount = value.total_count;
    var names = value.value;
    var output = "";
    
    if (names.length == 0) {
      output = $.Incors.Template.noNameResultTmpl({name: $.Incors.escapeHtml(name)});
    }
    
    for (var i = 0; i < names.length; i++) {
      var backgroundColor = this.getRowBackgroundColor();
      var iconId = names[i][0];
      var iconName = names[i][1];
      var iconNameHighlight = iconName.replace(new RegExp("((\\s+)|(^))(" + name+ ")","g"),'$1<span style="font-weight:bold;">$4</span>');
      output += $.Incors.Template.resultListImg2Tmpl({iconId: iconId, iconName: iconName, iconNameHighlight: iconNameHighlight, backgroundColor: backgroundColor });
    }
    $('#results').html(output);
  },
  
  /**
  * Finds a search word inside a keyword and highlights each occurence.
  * 
  * @param {String} keyword
  * @param {String} searchWord 
  * 
  * @return highlighted keyword
  */
  highlightKeyword: function(keyword, searchWord) {
    var searchWordLength = searchWord.length;
    var keywordLength = keyword.length;
    if (searchWordLength <= 0 || searchWordLength > keywordLength) {
      return keyword;
    }
    var highlightedKeyword = [];
    for (var i = 0; i < keyword.length; ++i) {
      var keywordPos = i;
      for (var j = 0; j < searchWord.length; ++j) {       
        var keywordChar = keyword.charAt(keywordPos++);
        while (keywordChar == ' ' || keywordChar == '_' || keywordChar == '-') {
          if (keywordPos == keyword.length) {
            return highlightedKeyword.push(keyword.slice(i, i + keywordPos));
          }
          keywordChar = keyword.charAt(keywordPos++);
        }
        if (keywordChar.toLowerCase() == searchWord.charAt(j)) {
          if (j == searchWord.length - 1) {
            highlightedKeyword.push('<span style="font-weight:bold;">' + keyword.slice(i, keywordPos) + '</span>');
            i = keywordPos - 1;
          }
        } else {
          highlightedKeyword.push(keyword.charAt(i));
          while (keyword.charAt(i + 1) != ' ' && i < keyword.length) {
            highlightedKeyword.push(keyword.charAt(++i));
          }
          break;
        }
      }
    }
    return highlightedKeyword.join('');
  },
  
  /**
  * Adds a tooltip to each image in the details area.
  * 
  * @return void
  */
  addTooltips: function() {
    if ($.Incors.IconSearchFileDb) {
      $('#details img').tooltip({ tip: '#tooltip_right_click' });
    }  
  },
  
  setKeywordToSearchField: function(keyword) {
    $('#search_type_keywords').attr('checked', 'checked');
    $('#i_icon_search').val(keyword);
    this.resultIcons(keyword.toLowerCase(), function(){});
  },
  
  createKeywordLinks: function(keywords) {
    for (var i = 0; i < keywords.length; ++i) {
      keywords[i] = '<a class="keyword_for_icon" onclick="return false;">' + keywords[i] + '</a>';
    }
    return '<span id="keywords_for_icon">' + keywords.join(', ') + '</span>';
  },

  get_param: function(param) {
    var search = window.location.search.substring(1);
    if(search.indexOf('&') > -1) {
      var params = search.split('&');
      for(var i = 0; i < params.length; i++) {
        var key_value = params[i].split('=');
        if(key_value[0] == param) return key_value[1];
      }
   } else {
      var params = search.split('=');
      if(params[0] == param) return params[1];
   }
   return null;
  },
  
  /* ------- event handling functions ------- */
  
  /**
  * Triggered when user clicks on an image in the results area.
  * 
  * @param {Event} event object
  *
  * @return void
  */
  onClickResults: function(event) {
    var elem = $(event.target);
    this.showElem(elem);
  },
  
  showElem: function(elem) {
    this.iconId = elem.attr('icon_id');
    this.iconName = elem.attr('name');
    
    /* alternative: display icons in different sizes in a shadowbox */
    //if (this.iconName) {
    //  this.iconsColorbox.createIconsShadowbox({ href: '/v_collection/icons/?icon=' + this.iconName });
    //}
    //return;
    
    var ancestor = elem.parent();
    while (ancestor.id != 'results' && ancestor.length != 0) {
      if (ancestor.hasClass('detail_link')) {
        if (this.lastClickImage != null) {
          this.lastClickImage.css({ margin: '3px', border: 'none' });
        }
        var img = ancestor.find('img').first();
        this.lastClickImage = img;
        img.css({ border: this.getHighlightedIconBorder(), margin: '1px' });
        
        this.iconId = img.attr('icon_id');
        this.iconName = img.attr('name');
        
        this.db.getKeywordsForIconId(this.iconId, $.proxy(function(keywords) {
          this.keywordLinks = this.createKeywordLinks(keywords);
          if (this.shadow) {
            var output = $.Incors.Template.detailsShadowTmpl({name: this.iconName, keywordLinks: this.keywordLinks });
            $('#details').html(output);
            $('#shadow_false').bind('click', this.onShadowFalseProxy);
          } else {
            var output = $.Incors.Template.detailsTmpl({name: this.iconName, keywordLinks: this.keywordLinks, background: this.getBackgroundColorOnSelect(elem) });
            $('#details').html(output);
            $('#shadow_true').bind('click', this.onShadowTrueProxy);
          }
          
          this.pauseWhileDetailsLoad();      
          
          $('#keywords_for_icon').bind('click', this.onClickKeywordProxy);
          this.addTooltips();  
        }, this));
        break;
      }
      ancestor = ancestor.parent();
    }
  },
  
  pauseWhileDetailsLoad: function() {
    this.imageLoader.pause();
    var imgs = $('#details').find('.detail_img');
    var imgLoadCount = imgs.length;
    var imageLoader = this.imageLoader;
    imgs.bind('load', function(event) {
      if (--imgLoadCount == 0) {
        imageLoader.resume();
      }
    });
  },
  
  onClickKeyword: function(event) {
    var elem = $(event.target);
    var keyword = elem.text();
    this.setKeywordToSearchField(keyword);
  },
  
  /**
  * Triggered when user switches between search for keywords and search for icon names
  * 
  * @param {Event} event object
  *
  * @return void
  */
  onSearchTypeChanged: function(event) {
    this.resultIcons($('#i_icon_search').val(), function(){});
  },
  
  /**
  * Triggered when user clicks on shadow radio button in the details area.
  * 
  * @param {Event} event object
  *
  * @return void
  */
  onShadowTrue: function(event) {
    $('#shadow_true').unbind('click', this.onShadowTrueProxy);
    $('#keywords_for_icon').unbind('click', this.onClickKeywordProxy);
    
    var output = $.Incors.Template.detailsShadowTmpl({name: this.iconName, keywordLinks: this.keywordLinks });
    $('#details').html(output);
       
    this.pauseWhileDetailsLoad();
       
    $('#shadow_false').bind('click', this.onShadowFalseProxy);
    $('#keywords_for_icon').bind('click', this.onClickKeywordProxy);
    
    this.addTooltips();
    this.shadow = true;
  },
  
  /**
  * Triggered when user clicks on 'no shadow' radio button in the details area.
  * 
  * @param {Event} event object
  *
  * @return void
  */
  onShadowFalse: function(event) {
    $('#shadow_false').unbind('click', this.onShadowFalseProxy);
    $('#keywords_for_icon').unbind('click', this.onClickKeywordProxy);
    
    var output = $.Incors.Template.detailsTmpl({name: this.iconName, keywordLinks: this.keywordLinks});
    $('#details').html(output);
       
    this.pauseWhileDetailsLoad();
       
    $('#shadow_true').bind('click', this.onShadowTrueProxy);
    $('#keywords_for_icon').bind('click', this.onClickKeywordProxy);
    
    this.addTooltips();
    this.shadow = false;
  }
}

/**--------------------------------------------------------------------------
* class for css manipulating functions
*/
$.Incors.CssHelper = function() {
  this.onWindowResizeProxy = $.proxy(this.onWindowResize, this);
  $(window).bind('resize', this.onWindowResizeProxy);
  this.vertFillElems = [];
};
$.Incors.CssHelper.prototype = {
  
  /**
  * Adds an area which is rsized to at least the size of the window minus an offset.
  * 
  * @param {Element}  
  *
  * @return void
  */
  addVertFillElem: function(elem, offset) {
    this.vertFillElems.push([$(elem), offset]);
    this.adjustVertFillElems();
  },
  
  /**
  * Adjusts all Elements in this.vertFillElems.
  *
  * @return void
  */
  adjustVertFillElems: function() {
    $.each(this.vertFillElems, function(i, vertFillElem) {
      var elem = vertFillElem[0];
      var offset = vertFillElem[1];
      size = $(window).height() - elem.offset().top - offset - 1;
      elem.css({ height: size + "px" })
    });
  },
  
  /**
  * Triggered when browser window is resized.
  * 
  * @param {Event} event object
  *
  * @return void
  */
  onWindowResize: function(event) {
    this.adjustVertFillElems();
  }
}

/**--------------------------------------------------------------------------
* Class to handle the keystrokes inside an input field.
*/
$.Incors.InputObserver = function(inputElem, action) {
  this.inputElem = inputElem;
  this.action = action;
  this.onUpdateProxy = $.proxy(this.onUpdate, this);
  this.callBackProxy = $.proxy(this.callBack, this);
  this.value = '';
  this.inputElem.bind('keyup', this.onUpdateProxy);
};

$.Incors.InputObserver.prototype = {
  searchCall: function(inputValue, callBack) {
    var value = this.inputElem.val().toLowerCase();
    if (inputValue == value) {
      if (!this.isInCall) {
        this.isInCall = true;
        this.searchCall2(value, callBack);
      } else {
        this.isUpdated = value;
      }
    }
  },
  
  searchCall2: function(value, callBack) {
    if (value != null && value != this.value) {
      this.value = value;
      this.action(value, $.proxy(function() {
        this.callBack(callBack);
      }, this));
    } else {
      this.callBack(callBack);
    }
  },
  
  callBack: function(callBack) {
    if (this.isUpdated) {
      var updateVal = this.isUpdated;
      this.isUpdated = false;
      this.searchCall2(updateVal, callBack);
    } else {
      this.isInCall = false;
      callBack && callBack();
    }
  },
  
  onUpdate: function(event, callBack) {
    var inputValue = this.inputElem.val().toLowerCase();
    window.setTimeout($.proxy(function() { this.searchCall(inputValue, callBack); }, this), 300);
  }
}

/**--------------------------------------------------------------------------
* Class for image related functions.
*/
$.Incors.Image = {
  imgPlainPath: function(name, size, colorStyle) {
    var colorStyle = colorStyle ? colorStyle : (typeof(DEFAULT_COLOR_STYLE) == 'undefined') ? null: DEFAULT_COLOR_STYLE;
    var imgPath = colorStyle ? IMG_PATH + '/' + colorStyle : IMG_PATH;
    return [imgPath , '/' , size , 'x' , size , '/plain/' , name , '.png'].join('');
  },

  imgShadowPath: function(name, size) {
    var colorStyle = colorStyle ? colorStyle : (typeof(DEFAULT_COLOR_STYLE) == 'undefined') ? null: DEFAULT_COLOR_STYLE;
    var imgPath = colorStyle ? IMG_PATH + '/' + colorStyle : IMG_PATH;
    return [imgPath , '/' , size , 'x' , size , '/shadow/' , name , '.png'].join('');
  }
}


/**--------------------------------------------------------------------------
* Class for image related functions.
*/
$.Incors.ImageLoader = function(options) {
  this.options = $.extend({
    imgSize: 24
  }, options || {});
  this.onImageLoadProxy = $.proxy(this.onImageLoad, this);
  //this.loadNextImageProxy = $.proxy(this.loadNextImage, this);
  this.imageLoadedMap = {};
  this.reset();
};

$.Incors.ImageLoader.prototype = {
  loadImages: function() {
    if ($.Incors.IconSearchAjaxDb) {
      if (!this.paused) {
        while (this.loadableImageNum > 0) {
          this.loadableImageNum--;
          this.loadNextImage();
        }
      }
    } else {
      return;
    }
  },
  
  reset: function() {
    if (this.imageLoadMap) {
      $.each(this.imageLoadMap, $.proxy(function(imageName, img) {
        img.unbind('load', this.onImageLoadProxy);
      }, this));
    }
    this.loadableImageNum = CONCURRENT_IMAGE_LOADS;
    this.imageQueue = [];
    this.imageLoadMap = {};
    this.imageMap = {};
    this.imagePos = 0;
    this.paused = false;
  },
  
  pause: function() {
    this.paused = true;
  },
  
  resume: function() {
    if (this.paused) {
      this.paused = false;
      this.loadImages();
    }
  },
  
  loadNextImage: function() {
    if (this.imagePos == this.imageQueue.length) {
      return;
    }
    var imageName = this.imageQueue[this.imagePos++];
    
    var imgs = this.imageMap[imageName]
    
    this.imageLoadMap[imageName] = imgs[0];
    
    for (var i = 0; i < imgs.length; ++i) {
      var img = imgs[i];
      img.attr('src', $.Incors.Image.imgPlainPath(imageName, this.options.imgSize));
    }
    imgs[0].bind('load', { img: imgs[0] }, this.onImageLoadProxy);
  },
  
  insertFirst: function(img) {
    var img = $(img);
    var imageName = img.attr('name');
    
    if (this.insertInImageMap(img, imageName)) {
      this.imageQueue.splice(0, 0, imageName);
    }
  },
  
  insertLast: function(img) {
    var img = $(img);
    var imageName = img.attr('name');
    
    if (this.insertInImageMap(img, imageName)) {
      this.imageQueue.push(imageName);
    }
  },
  
  insertInImageMap: function(img, imageName) {
    if (this.imageLoadedMap[imageName]) {
      img.attr('src', $.Incors.Image.imgPlainPath(imageName, this.options.imgSize));
      return false;
    }
    
    if (this.imageMap[imageName]) {
      this.imageMap[imageName].push(img);
      return false;
    } else {
      this.imageMap[imageName] = [img];
      return true;
    }
  },
  
  onImageLoad: function(event) {
    this.loadableImageNum++;
    var img = event.data.img;
    var imageName = img.attr('name');
    
    this.imageLoadedMap[imageName] = true;
      
    if (!this.imageLoadMap[imageName]) {
      return;
    }
    delete this.imageLoadMap[imageName];
    event.stopPropagation();
    
    img.unbind('load', this.onImageLoadProxy);
    
    this.loadImages();
  }
}

/**--------------------------------------------------------------------------
* Class to handle String related functions.
*/
$.Incors.StringNormalizer = {
  normalizeKeyword: function(string) {
    string = string.replace(/é/g, 'e');
    string = string.replace(/[- _]/g, '');
    return string;
  },
  
  normalizeName: function(string) {
    string = string.replace(/^\s*/, "").replace(/\s*$/, ""); // trim
    string = string.replace(/é/g, 'e');
    string = string.replace(/[ ]/g, '_');
    return string;
  }
}

/**--------------------------------------------------------------------------
* Exception Handler. 
*/
$.Incors.ExceptionHandler = function() {
  this.registerGlobalExceptions();
  if ($.Incors.IconSearchAjaxDb) {
    this.registerResponderExceptions();
  }
};

$.Incors.ExceptionHandler.prototype = {
  registerGlobalExceptions: function() {
    window.onerror = $.proxy(function(message, uri, line) {
      alert('registerGlobalExceptions');
      console.info(message);
      
      var fullMessage = message + "\n at " + uri + ": " + line
      this.log(
        'message: ' + message + ",\n" +
        'uri: ' + uri + ",\n" +
        'line: ' + line + ",\n",
        $.proxy(function(isSend, errorMessage) {
          if (isSend) {
            this.userErrorMessage('Unexpected Exception:\r\n\r\nUnfortunately there was an unexpected exception while executing the Iconexperience Search.\r\nWe have been notified about this issue and apologize for any inconvenience.\r\nYou might have to reload the page to restart the search.');
          } else {
            if ($.Incors.IconSearchAjaxDb) {
              this.userErrorMessage('Unexpected Exception:\r\n\r\nUnfortunately there was an unexpected exception while executing the Iconexperience Search.\r\nWe apologize for any inconvenience.\r\nYou might have to reload the page to restart the search.');
            } else {
              this.userErrorMessage('Unexpected Exception:\r\n\r\nUnfortunately there was an unexpected exception while executing the Iconexperience Search.\r\nWe apologize for any inconvenience.\r\nYou might have to reload the page to restart the search.\r\n\r\details:\r\n' + errorMessage);
            }
          }
        }, this)
      );                  
    }, this)
  },
  
  registerResponderExceptions: function() {
    $(document).ajaxError(function(e, jqxhr, settings, exception) {
      alert('registerResponderExceptions');
      console.info(e);
      console.info(jqxhr);
      console.info(settings);
      console.info(exception);
    });
    
    return;
    
    Ajax.Responders.register({
      onException: $.proxy(function(requester, exception, json) {
        if (typeof exception == 'string') {
          exception = new Error(exception);
        }
        if (exception.name == 'NS_ERROR_NOT_AVAILABLE') {
          return;
        }
        this.log(
          'responseText: ' + requester.transport.responseText + ",\n" + 
          'message: ' + exception.message + ",\n" +
          'fileName: ' + exception.fileName + ",\n" +
          'lineNumber: ' + exception.lineNumber + ",\n" +
          'stack: ' + exception.stack + ",\n",
          $.proxy(function(isSend, logMessage) {
            if (isSend) {
              this.userErrorMessage('Unexpected Exception:\r\n\r\nUnfortunately there was an unexpected exception while executing the Iconexperience Search.\r\nWe have been notified about this issue and apologize for any inconvenience.\r\nYou have to reload the page to restart the search.');
            } else {
              this.userErrorMessage('Unexpected Network Error:\r\n\r\nUnfortunately there was an unexpected network error while executing the Iconexperience Search.\r\nPlease make sure your network connection is active and try again.\r\nIf your network connection is active we might experience some difficulties on the server. You might have to try later to access the search.\r\nWe apologize for any inconvenience.');
            }
          }, this)
        );
      }, this)
    });
  },
  
  log: function(errorMessage, callBack) {
    if ($.Incors.IconSearchAjaxDb && !this.sendLogRemote) {
      errorMessage += 
        'appName: ' + navigator.appName + ",\n" +
        'appVersion: ' + navigator.appVersion + ",\n" +
        'cookieEnabled: ' + navigator.cookieEnabled + ",\n" +
        'language: ' + navigator.language + ",\n" +
        'platform: ' + navigator.platform + ",\n" +
        'userAgent: ' + navigator.userAgent + ",\n"
      ;
   
      $.ajax(
        'index.php',
        {
          type: 'POST',
          data: { action: 'exception', error_message: errorMessage },
          success: $.proxy(function(data, textStatus, jqXHR) {
            callBack(true, errorMessage);
            this.sendLogRemote = true;
          }, this),
          error: $.proxy(function(jqXHR, textStatus, errorThrown) {
            callBack(false, errorMessage);
            this.sendLogRemote = true;
          }, this)
        }
      );
    } else {
      callBack(false, errorMessage);
    }
  },
  
  userErrorMessage: function(errorMessage) {
    alert(errorMessage);
  }
}

/**--------------------------------------------------------------------------
* Templates as arrays of Strings.
*/
if (typeof($.Incors.Template) == 'undefined') $.Incors.Template = {};

$.Incors.Template.resultTmpl = function(vars) {
  return ['<table id="results_table"><colgroup><col width="150px" /><col width="100%" /></colgroup>' , vars.resultRows , '</table>'].join('');
};
  
$.Incors.Template.resultRowTmpl = function(vars) {
  return ['<tr class="results_row_' , vars.oddOrEven , '"><td class="results_col_left"><table class="results_col_left_text" style="background: ', vars.backgroundColor , ';"><tr><td>' , vars.keyword , '</td></tr></table></td><td class="results_col_right"><ul class="icon_list_1">' , vars.resultListImgs , '</ul></td></tr>'].join('');
};
  
$.Incors.Template.resultRowMoreTmpl = function(vars) {
  return ['<div id="results_row_more">more than ' , vars.maxSize , ' keywords found <a id="show_all" href="#" onclick="iconSearch.resultIcons($(\'#i_icon_search\').val(), function(){}, true); return false;">(show all results)</a></div>'].join('');
};
  
$.Incors.Template.resultListImg2Tmpl = function(vars) {
  return ['<div class="icon_result_name"><div class="detail_link"><a href="#" onClick="return false;"><img src="' , $.Incors.Image.imgPlainPath(vars.iconName, 24) , '" name="' , vars.iconName , '" title="' , vars.iconName , '" icon_id="' , vars.iconId , '" style="width: 24px; height: 24px;"></a></div><div>' , vars.iconNameHighlight , '</div></div>'].join('');
};

$.Incors.Template.noKeywordResultTmpl = function(vars) {
  return ['<table id="no_results"><tr><td><div id="no_result_text">No keywords found matching: "', vars.searchWord, '"</div></td></tr></table>'].join('');
};

$.Incors.Template.noNameResultTmpl = function(vars) {
  return ['<table id="no_results"><tr><td><div id="no_result_text">No icon names found matching: "', vars.name, '"</div></td></tr></table>'].join('');
};

$.Incors.Template.detailsTmpl = function(vars) {
  return [
    '<div id="details_content">' ,
    '<div id="details_icon_name">' , vars.name , '</div>' , 
    '<div id="details_shadows"><b>shadow:</b> <input id="shadow_true" type="radio" name="shadow" value="true" />&nbsp;yes <input id="shadow_false" type="radio" name="shadow" value="false" checked />&nbsp;no</div>' ,
    '<table id="details_table"><tr>' ,
    '<td style="width: 50%;">' ,
    '<div class="details_size">16x16</div>' , 
    '<div class="details_icon"><img width="16" height="16" class="detail_img" style="position: relative; top: 4px; background: ', vars.background ,';" src="' , $.Incors.Image.imgPlainPath(vars.name, 16) , '"></div>' ,
    '</td>' ,
    '<td style="width: 50%">' ,
    '<div class="details_size">24x24</div>' ,
    '<div class="details_icon"><img width="24" height="24" class="detail_img" style="background: ', vars.background ,';" src="' , $.Incors.Image.imgPlainPath(vars.name, 24) , '"></div>' ,
    '</td>' ,
    '</tr><tr>' ,
    '<td>' ,
    '<div class="details_size">32x32</div>' ,
    '<div class="details_icon"><img width="32" height="32" class="detail_img" style="position: relative; top: 8px; background: ', vars.background ,';" src="' , $.Incors.Image.imgPlainPath(vars.name, 32) , '"></div>' ,
    '</td>' ,
    '<td>' ,
    '<div class="details_size">48x48</div>' ,
    '<div class="details_icon"><img width="48" height="48" class="detail_img" style="background: ', vars.background ,';" src="' , $.Incors.Image.imgPlainPath(vars.name, 48) , '"></div>' ,
    '</td>' ,
    '</tr><tr>' ,
    '<td>' ,
    '<div class="details_size">64x64</div>' ,
    '<div class="details_icon"><img width="64" height="64" class="detail_img" style="position: relative; top: 32px; background: ', vars.background ,';" src="' , $.Incors.Image.imgPlainPath(vars.name, 64) , '"></div>' ,
    '</td>' ,
    '<td>' ,
    '<div class="details_size">128x128</div>' ,
    '<div class="details_icon"><img width="128" height="128" class="detail_img" style="background: ', vars.background ,';" src="' , $.Incors.Image.imgPlainPath(vars.name, 128) , '"></div>' ,
    '</td>' ,
    '</tr><tr>' ,
    '<td colspan="2">' ,
    '<div class="details_size">256x256</div>' ,
    '<div class="details_icon"><img width="256" height="256" class="detail_img" style="background: ', vars.background ,';" src="' , $.Incors.Image.imgPlainPath(vars.name, 256) , '"></div>' ,
    '</td>' ,
    '</tr>' ,
    '</tr></table>' , 
    '<div style="padding: 10px 0;">' ,
      '<div style="font-size: 13px; padding: 10px 0 0 0;">Other formats:</div>' ,
      '<div class="details_size">512x512: <a href="#" onclick="$.colorbox({ html: \'<div style=\\\'background: ', vars.background , ';\\\'><div><img width=\\\'512\\\' height=\\\'512\\\' src=\\\'' , $.Incors.Image.imgPlainPath(vars.name, 512) , '\\\' /></div></div>\' }); return false;">click here</a></div>' ,
    '</div>' ,
    '<div class="details_keywords">Keywords:<br />' , vars.keywordLinks , '</div>' ,
    '</div>'
  ].join('');
};

$.Incors.Template.detailsShadowTmpl = function(vars) {
  return [
    '<div id="details_content">' ,
    '<div id="details_icon_name">' , vars.name , '</div>' , 
    '<div id="details_shadows"><b>shadow:</b> <input id="shadow_true" type="radio" name="shadow" value="true" checked />&nbsp;yes <input id="shadow_false" type="radio" name="shadow" value="false" />&nbsp;no</div>' ,
    '<table id="details_table"><tr>' ,
    '<td style="width: 50%;">' ,
    '<div class="details_size">16x16</div>' , 
    '<div class="details_icon"><img width="16" height="16" class="detail_img" style="position: relative; top: 4px;" src="' , $.Incors.Image.imgPlainPath(vars.name, 16) , '"></div>' ,
    '</td>' ,
    '<td style="width: 50%">' ,
    '<div class="details_size">24x24</div>' ,
    '<div class="details_icon"><img width="24" height="24" class="detail_img" src="' , $.Incors.Image.imgPlainPath(vars.name, 24) , '"></div>' ,
    '</td>' ,
    '</tr><tr>' ,
    '<td>' ,
    '<div class="details_size">32x32</div>' ,
    '<div class="details_icon"><img width="32" height="32" class="detail_img" style="position: relative; top: 8px;" src="' , $.Incors.Image.imgShadowPath(vars.name, 32) , '"></div>' ,
    '</td>' ,
    '<td>' ,
    '<div class="details_size">48x48</div>' ,
    '<div class="details_icon"><img width="48" height="48" class="detail_img" src="' , $.Incors.Image.imgShadowPath(vars.name, 48) , '"></div>' ,
    '</td>' ,
    '</tr><tr>' ,
    '<td>' ,
    '<div class="details_size">64x64</div>' ,
    '<div class="details_icon"><img width="64" height="64" class="detail_img" style="position: relative; top: 32px;" src="' , $.Incors.Image.imgShadowPath(vars.name, 64) , '"></div>' ,
    '</td>' ,
    '<td>' ,
    '<div class="details_size">128x128</div>' ,
    '<div class="details_icon"><img width="128" height="128" class="detail_img" src="' , $.Incors.Image.imgShadowPath(vars.name, 128) , '"></div>' ,
    '</td>' ,
    '</tr><tr>' ,
    '<td colspan="2">' ,
    '<div class="details_size">256x256</div>' ,
    '<div class="details_icon"><img width="256" height="256" class="detail_img" src="' , $.Incors.Image.imgShadowPath(vars.name, 256) , '"></div>' ,
    '</td>' ,
    '</tr></table>' ,
    '<div style="padding: 10px 0;">' ,
      '<div style="padding: 10px 0 0 0; font-weight: bold;">Other formats:</div>' ,
      '<div class="details_size">512x512: <a href="#" onclick="$.colorbox({ html: \'<div style=\\\'background: ', vars.background , ';\\\'><div><img width=\\\'512\\\' height=\\\'512\\\' src=\\\'' , $.Incors.Image.imgShadowPath(vars.name, 512) , '\\\' /></div></div>\' }); return false;">click here</a></div>' ,
    '</div>' ,
    '<div class="details_keywords"><b>Keywords:</b><br />' , vars.keywordLinks , '</div>' ,
    '</div>'
  ].join('');
};

$.Incors.escapeHtml = function(unsafe) {
  return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}

})(jQuery);