jQuery(function($) {
  'use strict';
  var translations = {};
  var track = function (type, action, label) {
    try {
      _gaq.push(['_trackEvent', type, action, label]);
      _gaq.push(['t2._trackEvent', type, action, label]);
    } catch (e) {}
  };


  /**
   * -------------------------------------------------------
   * Author
   * -------------------------------------------------------
   */
   /* Display author qtip */
  $(document).on('mouseover click', '.article-authors .author[data-url]', function(event) {
    var url = $(this).data('url');
    $(this).qtip({
      overwrite: false,
      content: {
          text: function(event, api) {
            track('authors-popup', 'load', url);
            $.ajax({url: url}).then(function(content) {
              track('authors-popup', 'show', url);
              api.set('content.text', content);
            }, function(xhr, status, error) {
              track('authors-popup', 'error-' + status, error);
              api.set('content.text', status + ': ' + error);
          });
          return '<div class="author-loading">' + translations.loading + '</div>';
        }
      },
      style: {
        classes: 'qtip-bootstrap' // Standard class + overrides
      },
      position: {
          target: 'mouse',
          adjust: {
            // Don't adjust continuously the mouse, just use initial position
            mouse: false
          }
      },
      show: {
        event: 'mouseover click',
        ready: true,
        solo: true // Hide other tooltips
      },
      hide: {
        fixed: true, // Stay
        delay: 500,
        inactive: 4000
      }
    }, event);
  });

  /* Author etal. */
  $('a.author_etal').click(function() {
    var etal = $(this);
    var dkey = etal.parents('article').data('dkey');
    if (!dkey) {
      return false;
    }
    var last_span = etal.prev();
    var author_url = etal.parent('.article-authors').data('url');
    etal.before($('#wait-progress').show());
    etal.remove();
    $.ajax({
      url: translations.authors_url,
      complete: function () {
        $('#wait-progress').hide();
      },
      success: function (data) {
        set_etal(data.authors, author_url, last_span);
      },
      dataType: 'json',
      type: 'post',
      data: {'dkey': dkey}
    });
  });

  function set_etal(authors, author_url, last_span) {
    var authors_count = authors.length;
    var author_display = $(last_span).siblings('.author').length + 1;
    for (var i = author_display; i < authors_count; i++) {
      var separator = (authors_count == (i+1)) ? ' ' + translations.separator_and + ' ' : ', ';
      var span = $("<span/>")
      .attr({
      'id' : 'author_' + authors[i].id_author,
      'class': 'author',
      'data-url': author_url + '?dkey=' + authors[i].dkey + '&n=' + authors[i].author_order
      })
      .text(authors[i].whole_name);
      last_span.after(span);
      span.before(separator);
      last_span = span;
    }
    return false;
  }

  /**
   * -------------------------------------------------------
   * Article functionalities
   * -------------------------------------------------------
   */
  /* Short summary */
  $('span.short-summary-button').click(function() {
    var sel = $(this);
    var dkey = stringEscape(sel.parents('article').data('dkey'));
    var summary_div = $('#short-summary_' + dkey);
    sel.text((summary_div.css('display') == 'none') ? translations.hide_short_summary : translations.show_short_summary);
    summary_div.toggle('slow');
    return false;
  });

  /* Show more/less articles tab */
  $('a.dl_tab, a.cited_tab').click(function() {
    var self = $(this);
    var parent = $(this).parents(".modListContent");
    var duration = self.data('duration');
    parent.find('.dl_tab, .cited_tab').each(function(){
      var node_duration = $(this).data('duration');
      var target_li = $('#list_tab_head_' + node_duration);
      var target_div = $('#list_tab_div_' + node_duration);
      if (node_duration == duration) {
        target_li.addClass('active');
        target_div.show();
      } else {
        target_li.removeClass('active');
        target_div.hide();
      }
    });
    return false;
  });

  /* Graphical abstract */
  $('.GraphAbs').click(function() {
    $(this).toggleClass('big');
    return false;
  });

  /**
   * -------------------------------------------------------
   * Shopping cart
   * -------------------------------------------------------
   */
  function add_bindings() {
    $('.cart-box').on('click',function(e) {
      e.preventDefault();
      track('shopping-cart', 'open');
      open_cart();
    });

    $('body').on('click', 'a.btn-close-cart', function(){
      close_cart();
    });

    /* Add/remove article from cart */
    $('.btn-add-to-cart').on('click', function(e) {
      e.preventDefault();
      var self = $(this);
      var dkey = self.data('dkey');
      var status = (self.data('status') == 1) ? 0 : 1;
      var action = (status) ? 'remove' : 'add';
      update_cart_article_status(self, dkey, status).done(function() {
        track('shopping-cart', action + '-article', dkey);
      });
    });

    /* Remove article from cart */
    $(document).on('click', '.btn-cart-remove', function(e) {
      e.preventDefault();
      var self = $(this);
      var dkey = self.data('dkey');
      if (update_cart_article_status(self, dkey, 0)) {
        remove_elements(self);
        // Update matching button if exists
        var btn = $(document).find('.btn-add-to-cart[data-dkey="' + dkey + '"]');
        if (btn) {
          btn.buttonStatus(0);
          btn.buttonLoader('complete');
        }
      }
    });

    /* Clear cart */
    $(document).on('click', '.btn-cart-clear', function(e) {
      e.preventDefault();
      var self = $(this);
      clear_cart();
      remove_elements(self);
    });
  }

  /* Remove elements */
  function remove_elements(el) {
    var box_view = (el.data('view') == 'box');
    if (box_view && $('.cart-products-loaded li').length == 1) {
      // Avoid last element graphic bug with box view
      close_cart();
    } else {
      // Update cart block content
      $('ul.cart-products-loaded').hide('slow', function() {
        $(this).remove();
        update_cart_content();
      });
    }
  }

  /* DIsplay cart qtip */
  var qtip;
  function open_cart() {
    if (!qtip) {
      qtip = $('.cart-box').qtip({
      content: {
        text: translations.loading_cart, // Popup loading message
        ajax: {
          url: translations.get_shopping_cart_url,
          success: function(content) {
            // Set qtip content
            this.set('content.text', content);
          },
          error: function (xhr, status, error) {
            this.set('content.text', status + ': ' + error);
          }
        }
      },
      position: {
        target: $('.cart-box'),
        my: 'top right',
        at: 'bottom center',
        adjust: {
          viewport: $(window)
        }
      },
      show: {
        target: $('.cart-box'),
        event: 'click',
        effect: function() {
          $(this).fadeTo(500, 1);
        }
      },
      hide: {
        event: 'unfocus',
        effect: function() {
          $(this).slideUp();
        }
      },
      style: {
        classes: 'qtip-cart'
      }
    });
    } else {
      qtip.qtip('option', 'content.text', translations.loading_cart);
      $.ajax({
          url: translations.get_shopping_cart_url,
          success: function(content) {
            // Set qtip content
            qtip.qtip('option', 'content.text', content);
          },
          error: function (xhr, status, error) {
            qtip.qtip('option', 'content.text', status + ': ' + error);
          }
      })
    }
    qtip.qtip('show');
  }

  /* Hide cart */
  function close_cart() {
    $('.cart-box').qtip('hide');
  }

  /* Add/remove article from cart */
  function update_cart_article_status(button, dkey, status) {
    return $.ajax({
      url: translations.set_cart_article_status_url,
       beforeSend: function() {
        $(button).buttonLoader('loading');
       },
      complete: function() {
        $(button).buttonLoader('complete');
      },
      success: function(data) {
        if (data.success === true) {
          $(button).buttonStatus(status);
          set_cart_count(data.cart_count);
        }
        return data.success;
      },
      error: function (xhr, status, error) {
        track('shopping-cart', 'error-' + status, error);
      },
      dataType: 'json',
      type: 'post',
      data: {
        'dkey': dkey,
        'status': status
      }
    });
  }

  /* Clear cart */
  function clear_cart() {
    $.get(translations.clear_shopping_cart_url, function() {
      // Update matching buttons if exists
      $('.btn-cart-remove').each(function() {
        var dkey = $(this).data('dkey');
        var btn = $(document).find('.btn-add-to-cart[data-dkey="' + dkey + '"]');
        if (btn) {
          btn.buttonStatus(0);
          btn.buttonLoader('complete');
        }
      });
      // Update counter
      set_cart_count(0);
    });
  }

  /* Update cart amount */
  function update_cart_content() {
    var cart_content = $('.shopping-cart-results');
    // Update cart-box amount
    var cart_amount = $('.cart-amount');
    var cart_articles = $('.cart-products-loaded li');
    cart_amount.fadeOut();
    if (cart_amount.length > 0) {
      var amount = 0;
      if (cart_articles.length > 0) {
        cart_articles.each(function(n) {
          var item_price = parseInt($(this).find('span.cart-article-price').data('price')) || 0;
          amount += item_price;
        });
      }
      cart_amount.html(amount);
      cart_amount.fadeIn('slow');
    } else if (cart_articles.length == 0) {
      cart_content.html(
        '<div class="msg msg-info">' +
        '<span class="ico ico-info"></span>' +
        '<div><p>' + translations.empty_cart +' </p></div>' +
       '</div>'
      );
      var cart_conditions = $('.cart-conditions');
      if (cart_conditions.length > 0) {
        cart_conditions.remove();
      }
    }
  }

  /* Cart counter */
  function get_cart_count() {
    var cart = $('#cart-info');
    if (cart.length != 0 && cart.text()) {
      return parseInt(cart.text());
    }
    return 0;
  }

  function set_cart_count(count) {
    var counter = $('.cart-counter');
    if (count && count > 0) {
      counter.text(count);
      counter.removeClass('hidden');
    } else {
      counter.addClass('hidden');
    }
  }

  function initialize_cart_block() {
    add_bindings();
  }

   /**
   * -------------------------------------------------------
   * Other functionalities
   * -------------------------------------------------------
   */
  /* Get query string in dom */
  $.extend({
    getQueryString: function (name) {
      function parseParams() {
        var params = {},
        e,
        a = /\+/g, // Regex for replacing addition symbol with a space
        r = /([^&=]+)=?([^&]*)/g,
        d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
        q = window.location.search.substring(1);
        while (e = r.exec(q))
        params[d(e[1])] = d(e[2]);
        return params;
      }
      if (!this.queryStringParams) {
        this.queryStringParams = parseParams();
      }
      return this.queryStringParams[name];
    }
  });

  function stringEscape(s) {
    return s ? s.replace(/\//g,'\\\/').replace(/\./g,'\\\.') : s;
  }

  function toggle_all(main_id, status) {
    var list = document.getElementById(main_id).getElementsByTagName('input');
    for (var i=0; i<list.length; i++) {
      if (list[i].type === 'checkbox') {
        if (status === true) {
          list[i].checked = true;
        } else if (status === false) {
          list[i].checked = false;
        } else {
          list[i].checked = !list[i].checked;
        }
      }
    }
    return false;
  }

  /* Change cart article flag */
  $.fn.buttonStatus = function(status) {
    var self = $(this);
    if (status) {
      self.data('status', 1).addClass('article-in-cart');
    } else {
      self.data('status', 0).removeClass('article-in-cart');
    }
 }

  /* Input loading animation */
 $.fn.buttonLoader = function(action) {
    var self = $(this);
    var spinner = $('.has-spinner');
    if (action == 'loading') {
      spinner.prop('disabled', true);
      self.val(translations.loading_cart);
      self.addClass('active');
    } else {
      var status = self.data('status');
      self.val((status == 1) ? translations.remove_from_cart : translations.add_to_cart)
      self.removeClass('active');
      spinner.removeAttr('disabled');
    }
  }

  // Accueil tabs
  $.fn.tabsG = function(){

  // init
  $(this).addClass("ui-tabs");

  let $this = $(this);
  $this.find("ul.tabsNav").addClass("ui-tabs-nav");
  $this.find("ul.tabsNav > li").addClass("ui-tab").find("a").addClass("ui-tabs-anchor");
  
  let activateTab = function(e){
      if(e.length !== 0){
      let href = $(e).attr("href");
      let hrefIdIndex = href.search("#");
      let idSelector = href.substring(hrefIdIndex);
      $(e).parent("li").addClass("ui-state-active");    
      $this.find("div.modListContent").hide();
      $this.find(idSelector).show();
      }
  }

  activateTab($this.find("ul.tabsNav li:first a"));

  $this.find("ul.tabsNav li a").on("click",function(e){
    e.preventDefault();
    $this.find("ul.tabsNav li.ui-state-active").removeClass("ui-state-active");
    activateTab(e.target);
  })
  }
  
  $('#tabs.modList').tabsG();


  /**
   * -------------------------------------------------------
   * Common initialize
   * -------------------------------------------------------
   */
  function initialize_common() {
    $('.translations').each(function () {
      var item = $(this);
      translations[item.data('name')] = item.data('value');
    });
    initialize_cart_block();
  }

  initialize_common();
});
