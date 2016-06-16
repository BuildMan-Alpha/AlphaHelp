/*  Iconexperience Search, version 2.1
 *  
 *  (c) 2011 Incors GmbH
 *--------------------------------------------------------------------------*/

(function($) {

/* maximum size of keywords shown */
MAX_RESULT_SIZE = 100;

/* number of images loaded concurrently */
CONCURRENT_IMAGE_LOADS = 50;

$.Incors = $.Incors || {};

$.Incors.IconSearchFileDb = function() {};

$.Incors.IconSearchFileDb.prototype = {
  searchName: function(name, showAllResults, callBack) {
    var results = this.binarySearch(COLLECTION_DB.iconNamesToKeywordIds, name, showAllResults, $.proxy(function(id, resultValue, used, maxSize, showAllResults) {
      if (maxSize > 0 || showAllResults) {
        var iconName = resultValue[0];
        var collectionId = resultValue[1];
        return [[id, iconName]];
      } 
      return [];
    }, this), function(resultValue) {
      var iconName = resultValue[0];
      var collectionId = resultValue[1];
      return 1;
    });
    callBack(name, results);
  },
  
  searchKeyword: function(keyword, showAllResults, callBack) {
    var results = this.binarySearch(
      COLLECTION_DB.searchKeywordsToKeywordIds,
      keyword,
      showAllResults,
      $.proxy(function(id, resultValue, used, maxSize, showAllResults) {
        var keywordIds = resultValue[1];
      
        var keywordDeclarations = [];
        for (var i = 0; i < keywordIds.length/* && (showAllResults || i < maxSize)*/; ++i) {
          var keywordId = keywordIds[i];
          var keywordToIconNameIds = COLLECTION_DB.keywordsToIconNameIds[keywordId];
          var keyword = keywordToIconNameIds[0];
          if (used[keyword]) {
            continue;
          }
          
          used[keyword] = true;
          var iconNameIds = keywordToIconNameIds[1];
      
          var iconNameDeclarations = [];
          for (var j = 0; j < iconNameIds.length; ++j) {
            var iconNameId = iconNameIds[j];
            var iconNameToKeywordIds = COLLECTION_DB.iconNamesToKeywordIds[iconNameId];
            var iconName = iconNameToKeywordIds[0];
            
            iconNameDeclarations.push([iconNameId, iconName]);
          }
          if (iconNameDeclarations.length > 0) {
            this.totalCount++;
            keywordDeclarations.push([keyword, iconNameDeclarations]);
          }
        }
        return keywordDeclarations;
      }, this), 
      function(resultValue) {
        return resultValue[1].length;
      }
    );
    callBack(keyword, results);
  },
  
  emptyResults: function() {
    $.Incors.Template.resultRowMoreTmpl({maxSize: MAX_RESULT_SIZE})
  },
  
  binarySearch: function(arr, value, showAllResults, resultValueHandler, countHandler) {
    var low = 0;
    var mid = 0;
    var compValue;
    var high = arr.length - 1;
    var returnVal = [];
    
    while (low <= high) {
      mid = Math.round((low + high) / 2);
      compValue = arr[mid][0];
      if (compValue > value) {
        high = mid - 1;
      } else if (compValue < value) {
        low = mid + 1;
      } else {
        break;
      }
    }
  
    var count = 0;
    this.totalCount = 0;
  
    var used = {};
  
    if (compValue.indexOf(value) == 0) {
      var arrValue = arr[mid];
      var transVals = resultValueHandler(mid, arrValue, used, MAX_RESULT_SIZE - count, showAllResults);
      count += transVals.length;
      for (var i = 0; i < transVals.length; ++i) {
        returnVal.push(transVals[i]);
      }
    }
    for (var i = mid + 1; i < arr.length; i++) {
      var arrValue = arr[i];
      if (arrValue[0].indexOf(value) == 0) {       
        if (count < MAX_RESULT_SIZE || showAllResults) {
          var transVals = resultValueHandler(i, arrValue, used, MAX_RESULT_SIZE - count, showAllResults);
          count += transVals.length;
          for (var j = 0; j < transVals.length; ++j) {
            returnVal.push(transVals[j]);
          }
        } else {
          this.totalCount += countHandler(arrValue);
        }
      } else {
        break;
      }
    }
    for (var i = mid - 1; i >= 0; i--) {
      var arrValue = arr[i];
      if (arrValue[0].indexOf(value) == 0) {
        if (count < MAX_RESULT_SIZE || showAllResults) {
          var transVals = resultValueHandler(i, arrValue, used, MAX_RESULT_SIZE - count, showAllResults);
          count += transVals.length;
          for (var j = 0; j < transVals.length; ++j) {
            returnVal.push(transVals[j]);
          }
        } else {
          this.totalCount += countHandler(arrValue);
        }
      } else {
        break;
      }
    }
    return { total_count: this.totalCount, value: returnVal };
  },
  
  getKeywordsForIconId: function(iconId, callBack) {
    var keywordIds = COLLECTION_DB.iconNamesToKeywordIds[iconId][1];
    var keywords = new Array(keywordIds.length);
    for (var i = 0; i < keywordIds.length; ++i) {
      keywords[i] = COLLECTION_DB.keywordsToIconNameIds[keywordIds[i]][0];
    }
    callBack(keywords);
  }
};

/**--------------------------------------------------------------------------
* Templates as arrays of Strings.
*/
if (typeof($.Incors.Template) == 'undefined') $.Incors.Template = {};
    
$.Incors.Template.resultListImgTmpl = function(vars) {
  return ['<li class="detail_link"><a href="#" onClick="return false;"><img src="' , $.Incors.Image.imgPlainPath(vars.iconName, 24) , '" name="' , vars.iconName , '" title="' , vars.iconName , '" icon_id="' , vars.iconId , '" style="width: 24px; height: 24px;"></a></li>'].join('');
};

$.Incors.Template.emptyResult = function(vars) {
  return ['<div>', vars.collections , '</div>'].join('');
};

$.Incors.Template.emptyResultCollectionIncluded = function(vars) {
  return ['<div><img src=_iconex_system/_html_img/sample_', vars.collectionFileName , '.png />&nbsp;', vars.collectionName, ' (included)</div>'].join('');
};

$.Incors.Template.emptyResultCollectionNotIncluded = function(vars) {
  return ['<div><img src=_iconex_system/_html_img/sample_', vars.collectionFileName , '.png />&nbsp;', vars.collectionName, ' (not included)</div>'].join('');
};


})(jQuery);