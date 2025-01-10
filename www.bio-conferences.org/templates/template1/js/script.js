jQuery(document).ready(function($) {

  $('#menu-mobile').mmenu({
     'offCanvas': {
      'pageSelector': '#journal-webpage',
        'position': 'right',
        'zposition': 'front'
     }
  });


  $( ".custom.search" ).click(function() {
        if ($("div#search").hasClass("hidden")) {
            $('div#search').show();
            $('div#search form').show();
            $( "div#search.hidden" ).switchClass( "hidden", "active", 500, "easeInOutQuad" );
            $( "#search form input[type=text]" ).focus();
        }
        else{
            $( "div#search.active" ).switchClass( "active", "hidden", 500, "easeInOutQuad" );
            $( "#search-form input[type=text]" ).focusout();
            $('div#search form').hide();
        };
    });



  //afficher / masquer les filtres solr en mobile

  if ($('body').is("#com_solr")){
    $('.block.side>h2').addClass("switch active");

    $('.block.side>h2').click(function(){
        $('div.facet-list').toggle();
        $('.block.side>h2').toggleClass('active','');
    });

    $('body.mobile_page .block.side>h2').trigger('click');
  };


  // affichage des messages de warning
  // faire plus generique si il en existe d autres
  if($("#system-message-container")){
      $("#system-message-container dt.warning").parents("#system-message-container").addClass("msg msg-warning");
      $("#system-message-container dt.warning").html("<span class='ico ico-warning'></span>")

      $("#system-message-container dt.message").parents("#system-message-container").addClass("msg msg-info");
      $("#system-message-container dt.message").html("<span class='ico ico-info'></span>")

      $("#system-message-container dt.error").parents("#system-message-container").addClass("msg msg-error");
      $("#system-message-container dt.error").html("<span class='ico ico-info'></span>")      

  }

  // taille max sur les liens dans les ref

  var links = $("#com_article.fopen2 #content .references a");
  links.each(function(i){
    if(links[i].innerHTML.length > 100){
        links[i].innerHTML = links[i].innerHTML.substring(0, 50) + "...";
    }
  })

  // plus/moins sur .readMore
  // <div class="readMore"> <p>...<span class="btn"></span></p> <div class="readMore-full"></div></div>
  $(".readMore .readMore-full").hide();
  $(".readMore .btn").addClass("btn-show");
  $(".readMore .btn").html("+");

  $(".readMore .btn").on("click.readMore",function(){
    var $this = $(this);

    if($this.hasClass("btn-show")){
      $this.html("-");
      $(this).parent().siblings(".readMore-full").slideDown(500);
    } else {
      $this.html("+");
      $(this).parent().siblings(".readMore-full").slideUp(500);   
    }

    $this.toggleClass("btn-show", "btn-hide");
  });



  $.fn.popUpMagique = function(){

  // gestion sessionStorage
  let data = {};
  if(sessionStorage["popUpMagique"]){
    let data = JSON.parse(sessionStorage["popUpMagique"]);
      for (id in data) {
        $("#" + id).addClass("hidden");
      }
  }
  $(this).find(".close").on("click", function(){
    $(this).parents(".popup").animate({"bottom" : -height}, 500, function(){$(this).hide(500)});
    if(sessionStorage){
      data[$(this).parents(".popup").attr("id")] = true;
      sessionStorage.setItem("popUpMagique", JSON.stringify(data));
    }
    })

  // gestion affichage
  let $popup = $(this).find(".header").parent(".popup-magique");
  var height = $popup.height()+100;

  if( !$popup.hasClass("hidden")){
  	$popup.delay(500).css({"display":"block","bottom": -height}).animate({"bottom" : 0}, 500);
  }

  }

  $(".popup-magique").popUpMagique();


    // Masque / Affiche les affiliations pour les auteurs
  $.fn.btnAffiliation = function(){

  //$(".corresp").append( $(".summary") );
  //$(".summary").show();

  // masque
  $(this).find(".aff").hide();
  $(this).find(".corresp").hide();
  

  $("<button class='btn btn-primary btn-small btn-aff'>+</button>").appendTo("#article .article-authors");

  $("#article button.btn-aff").on("click", function(){
    $this = $(this);

    if ($this.html() == "+"){
        $this.html("-");
        $("#article .aff").show(500);
        $("#article .corresp").show(500);
    } else {
        $this.html("+");
        $("#article .aff").hide(500);
        $("#article .corresp").hide(500);
    }
  })

  }

  if( $("body").hasClass("aa")){
    $('#article').btnAffiliation()
  }


  // AA Diapo PR
  $.fn.diapoPR = function(options){

    let settings = {duration:3000, transition:500}
    $.extend(settings, options);

    let $this = $(this);

    //init
    $this.find("figure").hide();
    $this.find("figure:first").show().addClass("active");


    let $ul = $("<ul />").appendTo($this).addClass("diapo-carousselle");
    $this.find("img").clone().appendTo($ul).wrap( "<li></li>" );
    $this.find("li:first").addClass("active");

    let $imagesCarousselle = $this.find("ul li");
    let $figures = $this.find(".diapo-slides figure");

    $imagesCarousselle.each(function( index ) {
      $(this).addClass("diapoPR" + index)
      $(this).on("click", function(){

      let selecta = $(this).attr("class");
 
      $this.find("ul li").removeClass("active");
      $(this).addClass("active");

      $this.find(".diapo-slides figure.active").fadeOut(500).removeClass("active");
      $this.find(".diapo-slides ."+selecta ).addClass("active").fadeIn(500);
      })
    });

    $figures.each(function( index ) {
      $(this).addClass("diapoPR" + index)
    });


    var timer = setInterval(function(){

    //next
    if($this.find("figure.active").next("figure").length > 0){

      $this.find("figure.active").fadeOut(settings.transition).removeClass("active").next("figure").addClass("active").fadeIn(settings.transition);
      $this.find("ul li.active").removeClass("active").next("li").addClass("active");

    } else {

      $this.find("figure.active").fadeOut(settings.transition).removeClass("active");
      $this.find("figure:first").addClass("active").fadeIn(settings.transition);
      $this.find("ul li.active").removeClass("active");
      $this.find("ul li:first").addClass("active");
    }

  },settings.duration)

  }

let options = {duration : 8000};
$('#minifrontpage-204.diapo').diapoPR(options);




/* diapoFull*/
$.fn.diapoFull = function(options){

  // cfg
  let settings = {transition: 1000, delay : 6000};
  $.extend(settings, options);

  // init
  let $this = $(this);
  $this.find(".slide").hide();
  $this.find(".slide:first").addClass("active").show();
  $ul = $("<ul>").appendTo($this).addClass("diapoFullNav");
  $("<div><a href='/2024-press-releases' title='Access all A&A press releases'>More press releases</a></div>").appendTo($this).addClass("diapoAllLink");

  $imgs = $this.find("img");
  $imgs.each(function(i){
    let src= $(this).attr("src");
    src=src.replace(".jpg","-hd.jpg");
    $(this).parent(".slide").css({"background-image" : "url("+src+")"}).addClass("slide"+i);
    $(this).remove();

    $("<li>").appendTo($ul);
  })

  // li
  $this.find("li:first").addClass('active');
  $lis = $this.find("li");

  $lis.each(function(i){
    $(this).attr("id","slide"+i);
    $(this).on("click", function(){
      $lis.removeClass("active");
      $(this).addClass("active");
      $this.find(".slide").fadeOut(settings.transition);
      $this.find(".slide."+$(this).attr("id")).addClass("active").fadeIn(settings.transition);    
    })
  })

  let timer = setInterval(function(){
    if($this.find(".slide.active").next(".slide").length > 0){
      $this.find(".slide.active").fadeOut(settings.transition).removeClass("active").next(".slide").addClass("active").fadeIn(settings.transition);
      $this.find("li.active").removeClass("active").next("li").addClass("active");
    } else {
      $this.find(".slide.active").fadeOut(settings.transition).removeClass("active");
      $this.find(".slide:first").addClass("active").fadeIn(settings.transition);
      $this.find("li.active").removeClass("active");
      $this.find("li:first").addClass("active");
    }
  }, settings.delay )
}

let diapoFullOptions = {delay: 8000};
$(".minifrontpage.diapoFull").diapoFull(diapoFullOptions);



/* banner clarivate */
if($(".banner-clarivate").length > 0 ){

  let windowHeight = $(window).height();
  let yBanner = $(".banner-clarivate").offset().top;

  $(window).scroll(function (e) {
      var scroll = $(window).scrollTop();
      if(scroll + windowHeight*0.7 > yBanner){
        TweenMax.to(".banner-clarivate .logo", 3, {opacity:1, scale:1});
      }
  });
}



});



