/*  Iconexperience Search, version 2.1
 *  
 *  (c) 2013 Incors GmbH
 *--------------------------------------------------------------------------*/

(function($) {

  /* path to image files */
  DEFAULT_COLOR_STYLE = 'dark_grey';
  COLOR_STYLE = 'green_dark_grey';
  IMG_PATH = 'o_collection_png';

  COLOR_STYLES = [
    'yellow_dark_grey',
    'blue_dark_grey',
    'green_dark_grey',
    'orange_dark_grey',
    'dark_grey',
    'white',
    'office'
  ];

  $.Incors.IconSearchConfig = $.extend($.Incors.IconSearchConfig, {
    imgKeywordSearchPreviewSize: 32,
    searchFieldOpacity: 1
  });

  $.Incors.Template.resultListImgTmpl = function(vars) {
    return ['<li class="detail_link"><a href="#" onClick="return false;"><img src="' , $.Incors.Image.imgPlainPath(vars.iconName, 32) , '" name="' , vars.iconName , '" title="' , vars.iconName , '" icon_id="' , vars.iconId , '" style="width: 32px; height: 32px; background: ', vars.backgroundColor ,';"></a></li>'].join('');
  };

  $.Incors.Template.resultListImg2Tmpl = function(vars) {
    return ['<div class="icon_result_name"><div class="detail_link"><a href="#" onClick="return false;"><img src="' , $.Incors.Image.imgPlainPath(vars.iconName, 48) , '" name="' , vars.iconName , '" title="' , vars.iconName , '" icon_id="' , vars.iconId , '" style="width: 48px; height: 48px; background: ', vars.backgroundColor ,';"></a></div><div>' , vars.iconNameHighlight , '</div></div>'].join('');
  };

  $.Incors.IconSearch.prototype.getHighlightedIconBorder = function() {
    return 'solid 2px #000';
  };

  $.Incors.IconSearch.prototype.isShadow = function() {
    return false;
  };

  $.Incors.IconSearch.prototype.getBackgroundColorOnSelect = function(elem) {
    return elem.css('background-color');
  };

  $.Incors.Template.detailsTmpl = function(vars) {
    return [
      '<div id="details_content" class="color_style_' + COLOR_STYLE + '">' ,
      '<div id="details_icon_name">' , vars.name , '</div>' , 
      '<div style="padding: 10px 0;">' ,
      '<div style="float: left; margin: 0 10px 0 0; height: 30px; line-height: 30px;">Color Style:</div>' ,
      '<div class="color_style_img color_style_img_green_dark_grey" data-color-style="green_dark_grey" alt="" title="color style: green/dark grey"><div></div></div>' ,
      '<div class="color_style_img color_style_img_blue_dark_grey" data-color-style="blue_dark_grey" alt="" title="color style: blue/dark grey"><div></div></div>' ,
      '<div class="color_style_img color_style_img_yellow_dark_grey" data-color-style="yellow_dark_grey" alt="" title="color style: yellow/dark grey"><div></div></div>' ,
      '<div class="color_style_img color_style_img_orange_dark_grey" data-color-style="orange_dark_grey" alt="" title="color style: orange/dark grey"><div></div></div>' ,
      '<div class="color_style_img color_style_img_dark_grey" data-color-style="dark_grey" alt="" title="color style: dark grey"><div></div></div>' ,
      '<div class="color_style_img color_style_img_white" data-color-style="white" alt="" title="color style: white"><div></div></div>' ,
      '<div class="color_style_img color_style_img_office" data-color-style="office" alt="" title="color style: office"><div></div></div>' ,
      '<div style="clear: both;"></div>' ,
      '</div>' ,
      '<table id="details_table"><tr>' ,
      '<td style="width: 50%;">' ,
      '<div class="details_size">16x16</div>' , 
      '<div class="details_icon"><img class="icon_preview" width="16" height="16" style="position: relative; top: 4px; background: ', vars.background ,';" src="' , $.Incors.Image.imgPlainPath(vars.name, 16, COLOR_STYLE) , '"></div>' ,
      '</td>' ,
      '<td style="width: 50%">' ,
      '<div class="details_size">24x24</div>' ,
      '<div class="details_icon"><img class="icon_preview" width="24" height="24" style="background: ', vars.background ,';" src="' , $.Incors.Image.imgPlainPath(vars.name, 24, COLOR_STYLE) , '"></div>' ,
      '</td>' ,
      '</tr><tr>' ,
      '<td>' ,
      '<div class="details_size">32x32</div>' ,
      '<div class="details_icon"><img class="icon_preview" width="32" height="32" style="position: relative; top: 8px; background: ', vars.background ,';" src="' , $.Incors.Image.imgPlainPath(vars.name, 32, COLOR_STYLE) , '"></div>' ,
      '</td>' ,
      '<td>' ,
      '<div class="details_size">48x48</div>' ,
      '<div class="details_icon"><img class="icon_preview" width="48" height="48" style="background: ', vars.background ,';" src="' , $.Incors.Image.imgPlainPath(vars.name, 48, COLOR_STYLE) , '"></div>' ,
      '</td>' ,
      '</tr><tr>' ,
      '<td>' ,
      '<div class="details_size">64x64</div>' ,
      '<div class="details_icon"><img class="icon_preview" width="64" height="64" style="position: relative; top: 32px; background: ', vars.background ,';" src="' , $.Incors.Image.imgPlainPath(vars.name, 64, COLOR_STYLE) , '"></div>' ,
      '</td>' ,
      '<td>' ,
      '<div class="details_size">128x128</div>' ,
      '<div class="details_icon"><img class="icon_preview" width="128" height="128" style="background: ', vars.background ,';" src="' , $.Incors.Image.imgPlainPath(vars.name, 128, COLOR_STYLE) , '"></div>' ,
      '</td>' ,
      '</tr><tr>' ,
      '<td colspan="2">' ,
      '<div class="details_size">256x256</div>' ,
      '<div class="details_icon"><img class="icon_preview" width="256" height="256" style="background: ', vars.background ,';" src="' , $.Incors.Image.imgPlainPath(vars.name, 256, COLOR_STYLE) , '"></div>' ,
      '</td>' ,
      '</tr>' ,
      '</tr><tr>' ,
      '<td colspan="2">' ,
      '<div class="details_size">512x512: <a href="#" onclick="$.colorbox({ html: \'<div style=\\\'background: ', vars.background , ';\\\' class=\\\'color_style_\' + COLOR_STYLE + \'\\\'><div><img class=\\\'icon_preview\\\' width=\\\'512\\\' height=\\\'512\\\' src=\\\'\' + $.Incors.Image.imgPlainPath(\'' + vars.name + '\', 512, COLOR_STYLE) + \'\\\' /></div></div>\' }); return false;">click here</a></div>' ,
      '</td>' ,
      '</tr><tr>' ,
      '<td colspan="2">' ,
      '<div class="details_size">SVG file (vector format): <a class="icon_link" href="o_collection_svg/', COLOR_STYLE, '/' , vars.name , '.svg" target="_blank">click here</a></div>' ,
      '<div class="details_size">XAML file (vector format): <a class="icon_link" href="o_collection_xaml/', COLOR_STYLE, '/' , vars.name , '.xaml" target="_blank">click here</a></div>' ,
      '</td>' ,
      '</tr></table>' ,
      '<div class="details_keywords"><b>Keywords:</b><br />' , vars.keywordLinks , '</div>' ,
      '</div>' ,
    '<script>$.Incors.IconSearch.changeColorStyle();</script>'
    ].join('');
  };

  $.Incors.IconSearch.changeColorStyle = function() {
    var changeColorStyle = function(cS) {
      COLOR_STYLE = cS;
      $('#details_content').attr( "class", "color_style_" + COLOR_STYLE);
    };

    $("#details_content .color_style_img > div").click(function(event) {
      var oldColorStyle = COLOR_STYLE;
      var cS = $(event.target).parent().attr("data-color-style");
      changeColorStyle(cS);

      $("#details_content img.icon_preview").each(function() {
        this.src = this.src.replace(oldColorStyle, COLOR_STYLE); 
      });

      $("#details_content a.icon_link").each(function() {
        this.href = this.href.replace(oldColorStyle, COLOR_STYLE); 
      });
    });
  };

  $.Incors.Image.imgPlainPath = function(name, size, colorStyle) {
    var colorStyle = colorStyle ? colorStyle : (typeof(DEFAULT_COLOR_STYLE) == 'undefined') ? null: DEFAULT_COLOR_STYLE;
    var imgPath = colorStyle ? IMG_PATH + '/' + colorStyle : IMG_PATH;
    return [imgPath , '/' , size , 'x' , size , '/' , name , '.png'].join('');
  };

  var startSearchWrapped = startSearch;
  startSearch = function() {
    var firstImg = COLLECTION_DB.iconNamesToKeywordIds[0][0];
    
    var checkCount = COLOR_STYLES.length;
    var loadedStyles = [];
    var errorStyles = [];
    var imgLoaded = function(colorStyle, success) {
      if (success) {
        loadedStyles.push(colorStyle);
      } else {
        errorStyles.push(colorStyle);
      }

      if (--checkCount == 0) {
        if (errorStyles.length == 0) {
          startSearchWrapped();
        } else {
          var missing = '';
          for (var i = 0; i < errorStyles.length; ++i) {
            var errorStyle = errorStyles[i];
            missing += '<li>o_collection_png/' + errorStyle  + '</li>';
          }
          var twoDownlads = '';
          if (errorStyles.length == 4 && errorStyles[0] == COLOR_STYLES[0] && errorStyles[1] == COLOR_STYLES[1] && errorStyles[2] == COLOR_STYLES[2] && errorStyles[3] == COLOR_STYLES[3]) {
            twoDownlads = '<h2 style="color: #cc3333;">If you have downloaded the O-Collection in two seperate ZIP files please make sure to copy the files in iconex_o1_part_b.zip into the /o_collection/o_collection_png folder.</h2>'
          }
          $('#content').append([
            '<div style="text-align: center;">',
              '<h1 style="color: #cc3333;">Error: Icon Sources Incomplete</h1>',
              '<p>Please make sure the following folders exist in your local file structure and contain the complete set of the O-Collection icons:</p>',
              '<ul>', missing, '</ul>',
              twoDownlads, 
            '</div>'
          ].join(''));
        }
      }
    };

    var loadImgSample = function(colorStyle) {
      $('<img src="' + $.Incors.Image.imgPlainPath(firstImg, 16, colorStyle) + '">')
      .load(function(event) {
        imgLoaded(colorStyle, true);
      })
      .error(function() {
        imgLoaded(colorStyle, false);
      });
    };

    for (var i = 0; i < COLOR_STYLES.length; ++i) {
      loadImgSample(COLOR_STYLES[i]);
    }
  };


})(jQuery);
