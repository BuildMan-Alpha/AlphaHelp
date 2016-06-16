/*  Iconexperience Search, version 2.1
 *  
 *  (c) 2013 Incors GmbH
 *--------------------------------------------------------------------------*/

(function($) {

$.Incors = $.Incors || {};

$.Incors.IconsColorbox = function(options) {
  this.options = $.extend({
    onOpen: function() {},
    onCleanup: function() {},
    onComplete: function() {}
  }, options || {});
  
  
  this.hashChanged = false;
  
  this.isOpen = false;
  
  this.createIconsShadowboxOptions = {
    initialWidth: 680,
    initialHeight: 570,
    innerWidth: 680,
    innerHeight: 570,
    onOpen: this.options.onOpen,
    onComplete: $.proxy(function() {
      $('.icons_related_icon_link').colorbox(this.createIconsShadowboxOptions);
      $('#show_shadows').change(function() {
        if ($('#show_shadows:checked').val() !== undefined) {
          // checked
          $('.icons_without_shadows').hide();
          $('.icons_with_shadows').show();
        } else {
          // not checked
          $('.icons_with_shadows').hide();
          $('.icons_without_shadows').show();
        }
        this.isOpen = true;
      });
      this.hashChanged = true;
      window.location.hash = $('#icon_preview_icon_name').text();
      this.options.onComplete();
    }, this),
    onCleanup: $.proxy(function() {
      this.hashChanged = true;
      window.location.hash = '';
      this.isOpen = false;
      this.options.onCleanup();
    }, this)
  };
  
  if (window.location.hash) {
    $.colorbox($.extend({ href: '../icons/?icon=' + window.location.hash.substr(1) }, this.createIconsShadowboxOptions));   
  }
  
  /*window.onhashchange = function() {
    console.info('changed');
    if(this.hashChanged == false) {
      $.colorbox($.extend(this.createIconsShadowboxOptions, { href: '?icon=' + window.location.hash.substr(1) }));
    } else {
      this.hashChanged = false;
    }
  }*/
};

$.Incors.IconsColorbox.prototype = {
  createIconsShadowbox: function(options) {
    var options = $.extend({
      href: null,
      elems: null
    }, options || {});
    
    if (options.elems) {
      options.elems.colorbox($.extend(this.createIconsShadowboxOptions, options));  
    } else if (options.href) {
      $.colorbox($.extend({}, this.createIconsShadowboxOptions, options));
    }
  }
}


$.Incors.loadCategorySprites = function(categories, category_to_img, img_path) {
  return; 
  
  var loadQueue = [];
  
  var loadCategorySprite = function(pos) {
    if (pos < categories.length) {
      var category = categories[pos][0];
      var imgSrc = categories[pos][1];
        
      $('<img/>').attr('src', imgSrc).load(function() {
        category.children(':first').addClass('prev_icons');
        loadCategorySprite(++pos);
      });
    }
  };
  
  loadCategorySprite(0);
  
};


$.Incors.ScrollHandler = function(collectionSets, colorStyle) {
  $this = this;

  this.collectionSets = collectionSets;
  this.colorStyle = colorStyle;

  this.inScrollToAnimation = false;

  this.iconsContentScroll = $('#icons_content_scroll');
  this.iconsContentScrollHeight = $('#icons_content_scroll').height();

  this.scrollProxy = $.proxy(this.scroll, this);

  this.loadedCollectionImgs = {};
  
  if (collectionSets.length > 0) {
    $(collectionSets).each(function(i, collectionSet) {
      var collectionHeading = collectionSet[0];
      var collectionLink = collectionSet[1];
      
      collectionLink.click(function() {
        $this.inScrollToAnimation = true;
        $this.iconsContentScroll.animate({ scrollTop: collectionHeading.position().top + 1 }, 1000, 'easeInOutQuart', function() {
          $this.inScrollToAnimation = false;
          $this.triggerScroll();
        });
        return false;
      });
    });

    this.iconsContentScroll.scroll(this.scrollProxy);
    this.triggerScroll();
  }
};

$.Incors.ScrollHandler.prototype = {
  showCollectionImgs: function(collectionHeading) {
    var collectionHeadingId = collectionHeading.attr('id');

    var collectionKey = this.colorStyle ? collectionHeadingId + this.colorStyle : collectionHeadingId;

    if (!(this.loadedCollectionImgs[collectionKey])) {
      var showIconsClass = this.colorStyle ? 'show_icons_' + this.colorStyle : 'show_icons'; 
      collectionHeading.find('.trigger_icons').addClass(showIconsClass);
      this.loadedCollectionImgs[collectionKey] = true;
    }
  },

  triggerScroll: function() {
    this.iconsContentScroll.trigger('scroll');
  },

  setColorStyle: function(colorStyle) {
    this.colorStyle = colorStyle;
    this.triggerScroll();
  },

  scroll: function() {
    var scrollTop = this.iconsContentScroll.scrollTop();
      
    var firstCollectionHeading = this.collectionSets[0][0];
    var firstCollectionHeadingOffset = firstCollectionHeading.position().top;
    
    for (var i = this.collectionSets.length - 1; i >= 0; --i) {
      var collectionSet = this.collectionSets[i];
      var collectionHeading = collectionSet[0];
      var collectionLink = collectionSet[1];
      
      if (scrollTop + this.iconsContentScrollHeight >= collectionHeading.position().top - firstCollectionHeadingOffset) {
        if (!$this.inScrollToAnimation) {
          this.showCollectionImgs(collectionHeading);
        }
        
        if (i > 0) {
          var collectionSetPrev = this.collectionSets[i - 1];
          var collectionHeadingPrev = collectionSetPrev[0];
          var collectionLinkPrev = collectionSetPrev[1];
          
          if (scrollTop >= collectionHeading.position().top - firstCollectionHeadingOffset) {
            collectionLink.css({ opacity: 0 });
            collectionLinkPrev.css({ opacity: 1 });
          } else {
            if (!$this.inScrollToAnimation) {
              this.showCollectionImgs(collectionHeadingPrev);
            }

            var fac = ((scrollTop + this.iconsContentScrollHeight) - (collectionHeading.position().top - firstCollectionHeadingOffset)) / this.iconsContentScrollHeight;
            collectionLink.css({ opacity: 1 - fac });
            collectionLinkPrev.css({ opacity: fac });
          }
          
          for (var j = i - 2; j >= 0; --j) {
            var collectionSet = this.collectionSets[j];
            var collectionHeading = collectionSet[0];
            var collectionLink = collectionSet[1];
            
            collectionLink.css({ opacity: 1 });
          }
        } else {
          collectionLink.css({ opacity: 0 });
        }
        break;
      } else {
        collectionLink.css({ opacity: 1 });
      }
    }
  }
};

init512Hover = function() {
  $("#plain_512").hover(
    function() {
      $("#plain_img_512").stop().fadeIn();
    },
    function() {
      $("#plain_img_512").stop().fadeOut();
    }
  );
  
  $("#shadow_512").hover(
    function() {
      $("#shadow_img_512").stop().fadeIn();
    },
    function() {
      $("#shadow_img_512").stop().fadeOut();
    }
  );
};

})(jQuery);