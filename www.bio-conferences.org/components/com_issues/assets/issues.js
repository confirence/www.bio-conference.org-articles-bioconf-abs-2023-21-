jQuery(function ($) {
    var toggle = function (year, isClick) {
        var visibleBloc = null;
        $('div.year').each(function () {
            var div = $(this);
            var visible = div.find('.year_link').data('year') === year;
            var arrow = $('.arrow', div);
            var bloc = $('.bloc', div);
            if (visible) {
                arrow.removeClass('arrow-left').addClass('arrow-top');
                bloc.show();
                visibleBloc = div;
            } else {
                arrow.addClass('arrow-left').removeClass('arrow-top');
                bloc.hide();
            }

            if (visible && bloc.data('loaded') === false && bloc.data('url')) {
                bloc.data('loaded', true);
                $.getJSON(bloc.data('url')).done(function (images, status) {
                    bloc.find('.input-loading').remove();
                    if (status === 'success') {
                        if (images.length) {
                            images.forEach(image => {
                                bloc.append('<div class="issue-image-container">'+
                                    '<figure>'+
                                        '<a class="" href="'+image.href+'" target="_blank">'+
                                            '<img class="issue-image" alt="'+image.short_legend+'" loading="lazy" src="'+image.src+'"/>'+
                                        '</a>'+
                                        '<figcaption>'+
                                            image.legend+
                                        '</figcaption>'+
                                    '</figure>'+
                                    '<div class="clear"></div>'+
                                '</div>');
                            });
                        } else {
                            bloc.append('<div class="msg msg-warning"><span class="ico ico-warning"></span><div><p><strong>No featured images</strong></p></div>');
                        }
                    } else {
                        bloc.append('<div class="msg msg-error"><span class="ico ico-warning"></span><div><p><strong>Error while loading data</strong></p></div>');
                    }
                }).fail(function () {
                    bloc.find('.input-loading').remove();
                    bloc.append('<div class="msg msg-error"><span class="ico ico-warning"></span><div><p><strong>Error while loading data</strong></p></div>')
                });
            }
        });

        if (visibleBloc && isClick) {
            $('html, body').animate({
                scrollTop: visibleBloc.offset().top
            }, 100);
        }
    }

    var handler = function (e) {
        e.preventDefault();
        var node = $(this);
        toggle(node.data('year'), true);
    }
    $('div.year a[data-year]').click(handler);
    $('nav.years a[data-year]').click(handler);

    var year = $('input[name=curr_year]').val();
    if (window.location.hash) {
        year = window.location.hash.substring(1).replace('year_', '');
    }
    toggle(parseInt(year), false);
});
