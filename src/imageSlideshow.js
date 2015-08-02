/**
 * Created with JetBrains WebStorm.
 * User: hemkaran
 * Date: 1/16/14
 * Time: 5:00 PM
 * To change this template use File | Settings | File Templates.
 */

$.widget("ui.imageSlideshow",{
    options : {
        duration : "600",
        animationInterval : "3000",
        easing: "linear",
        controlNav:true,
        directionNav:true,
        startAt:"1",
        keyboardNavigation : true,
        automaticSlideshow : false,
        fitToHeight : false,
        after : function(index) {},
        carouselLoaded : function() {}
    },
    width : 0,
    current : 0,
    leftSlideTimer : 0,
    _imageHeight : 0,
    _imageWidth : 0,
    _create : function() {
        this.options.duration = parseInt(this.options.duration);
        this.options.animationInterval = parseInt(this.options.animationInterval);
        var controlNav = this.options.controlNav;
        var directionNav = this.options.directionNav;
        var startAt = parseInt(this.options.startAt)-1;
        var keyboard = this.options.keyboardNavigation;

        var $image = this.element.find("img");
        var numberOfImages = $image.length;
        var $content = this.element.find('.slideshow-content');
        var obj = this;

        // Adding Last Image to first and first Image to last for rotation
        this.element.find(".slideshow-content").append("<li>"+this.element.find(".slideshow-content li:first-child").html()+"</li>");
        this.element.find(".slideshow-content").prepend("<li>"+this.element.find(".slideshow-content li:nth-last-child(2)").html()+"</li>");

        $image = this.element.find("img");

        if(obj.options.duration > this.options.animationInterval && obj.options.automaticSlideshow == true) {
            alert("Duration should be less than animationInterval. Animation behavior can be unexpected.");
        }

        if(this.options.automaticSlideshow == false) {
            this.options.animationInterval = 0;
        }

        var $this = $(this.element);
        this._setWidth($image.width());
        var height = $image.height();

        if(startAt >= numberOfImages) {
            alert("Start image number : "+startAt+" is greater than total number of images. \n\nDefault position has been set to 0 now.");
            startAt = 0;
        }

        this._setCurrentSlideNumber(startAt);
        $content.width(this._getWidth()*(numberOfImages+2));

        //Adding Arrow for control Navigation
        $this.append("<div class='leftArrow arrow'></div><div class='rightArrow arrow'></div>");

        //Setting starting Image
        $content.css({left : -this._getWidth()*(startAt+1)});

        $this.find(".leftArrow").click($.proxy(obj._animateLeft,obj));
        $this.find(".rightArrow").click($.proxy(obj._animateRight,obj));

        //Adding control Navigation Dots below Carousel
        $this.after('<ul class="listDots"></ul>');
        for(var i=0;i<numberOfImages;i++) {
            $(".listDots").append('<li><div class="dot" data-index="'+i+'"></div></li>');
        }
        obj._changeDot();
        $(".dot").click(function(){
            var i = $(this).attr("data-index");
            i = parseInt(i);
            obj._setCurrentSlideNumber(i);
            $content.animate({
                left : -obj._getWidth()*(i+1)
            },obj.options.duration,obj.options.easing,function(){
                obj._changeDot();
                obj._startTimer();
            });
        });

        //Starting timer for Automatic Slideshow
        obj._startTimer();
        if(controlNav == false) {
            $(".listDots").hide();
        }
        if(directionNav == false) {
            $this.find(".arrow").hide();
        }

        //Adding control for keyboard Arrow Keys navigation
        if(keyboard) {
            $(document).keydown(function(e){
                if(e.keyCode == 37)
                    $.proxy(obj._animateLeft(),obj);
                if(e.keyCode == 39)
                    $.proxy(obj._animateRight(),obj);
            });
        }

        $this.find("li:nth-child(1)").find("img").addClass("start-image");

        //binding responsive with image load function
        $image.one("load",function(index) {
            //Calling responsive with relative height of image as parameter
            obj.watchResponsiveness($(this).height()*$this.width()/$(this).width());
            $this.find("img:not(img.start-image)").off("load");
        });
        $this.find("img.start-image").one("load",function(index) {
            obj.watchResponsiveness($(this).height()*$this.width()/$(this).width());
            obj.options.carouselLoaded();
            $image.off("load");
            $(this).removeClass("start-image");
        });

        $(window).resize(function(){
            //Calling responsive with relative height of image as parameter
            obj.watchResponsiveness($image.height()*($this.width()/$image.width()));
        });

        /* Detecting for touches */
        var touchpoints = {
            initX : 0,
            initY : 0,
            endX : 0,
            endY : 0,
            changeX : 0,
            changeY : 0
        };
        var is_touch_device = 'ontouchstart' in document.documentElement;
        is_touch_device = true;
        var contentInitialPosition;
        if(is_touch_device) {
            $this.on("touchstart",function (evt) {
                if($(evt.target).hasClass("arrow") == true) {
                    return;
                }
                ev = evt.originalEvent;
                $content.stop(true,true);
                touchpoints.initX = ev.touches[0].pageX;
                touchpoints.initY = ev.touches[0].pageY;
                touchpoints.changeX = touchpoints.initX;
                touchpoints.changeY = touchpoints.initY;
                contentInitialPosition = $content.offset().left - $content.parent().offset().left - $content.parent().scrollLeft();
            });
            $this.on("touchmove",function(evt){
                ev = evt.originalEvent;
                if(Math.abs(ev.touches[0].pageX - touchpoints.changeX) < Math.abs(ev.touches[0].pageY - touchpoints.changeY)) {
                    touchpoints.changeX = ev.touches[0].pageX;
                    touchpoints.changeY = ev.touches[0].pageY;
                    return;
                }
                touchpoints.changeX = ev.touches[0].pageX;
                touchpoints.changeY = ev.touches[0].pageY;

                ev.preventDefault();
                $content.css({
                    left : -(obj._getWidth()*(obj._getCurrentSlideNumber()+1)) + (ev.touches[0].pageX - touchpoints.initX)
                });
            });
            $this.on("touchend",function(evt) {
                ev = evt.originalEvent;
                if($(evt.target).hasClass("arrow") == true) {
                    return;
                }
                touchpoints.endX = ev.changedTouches[0].pageX;
                touchpoints.endY = ev.changedTouches[0].pageY;
                if(contentInitialPosition == $content.offset().left - $content.parent().offset().left - $content.parent().scrollLeft()) {
                    return;
                }
                obj._animateOnTouch(touchpoints);
            });

        }
        obj._loadImages();
        /*********************************************/
    },
    watchResponsiveness : function (heightImg) {
        var $this = this.element;
        var $windowWidth = $this.width();
        if($windowWidth == 0) {   //if element has display:none property
            return;
        }
        $windowWidth++;  //For getting ceil value ex 354.445 = 354; 354+1 = 355
        var $windowHeight = $this.height();
        var $image = $this.find("img");
        var $content = $this.find('.slideshow-content');
        var $imageDescription = $this.find(".image-description");

        //Set height of image if height of image not defined
        if(!heightImg) {
            heightImg = this._imageHeight*($windowWidth/this._imageWidth);
        }
        this._setWidth($windowWidth);
        var h = $windowHeight;

        $content.width(this._getWidth()*($image.length));
        $this.find("img").width(this._getWidth());
        $imageDescription.outerWidth(this._getWidth());

        if(this.options.fitToHeight) {
            $this.find("img").height(h);
        } else if($imageDescription.length == 0) {
            $content.css({top: (h-heightImg)/2});
            this._imageHeight = heightImg;
            this._imageWidth = this._getWidth();
        }
        $content.css({left : -this._getWidth()*(this._getCurrentSlideNumber()+1)});
    },

    changeSlideToIndex : function(index) {
        index = parseInt(index);
        index = index-1;
        var obj = this;
        this._setCurrentSlideNumber(index);
        this._loadImages();
        this.element.find('.slideshow-content').animate({
            left : -obj._getWidth()*(index+1)
        },0,function() {
            obj._changeDot();
            obj._startTimer();
        });
    },
    _getWidth : function() {
        return this.width;
    },
    _setWidth : function(width) {
        this.width = width;
    },
    _getCurrentSlideNumber : function() {
        return this.current;
    },
    _setCurrentSlideNumber : function(value) {
        this.current = value;
    },
    _changeDot : function() {
        var obj = this;
        $(".listDots").find(".dot").each(function(index){
            if(index == obj._getCurrentSlideNumber()) {
                $(this).addClass("activeDot");
            } else {
                $(this).removeClass("activeDot");
            }
        });
        this.options.after(obj._getCurrentSlideNumber()+1);
    },
    _startTimer : function() {
        if(this.options.animationInterval > 0) {
            if(this.leftSlideTimer!=null)
                clearTimeout(this.leftSlideTimer);
            this.leftSlideTimer = setTimeout($.proxy(this._animateRight,this),this.options.animationInterval);
        }
    },
    _animateRight : function() {
        var obj = this;
        var $image = this.element.find("img");
        var $content = this.element.find('.slideshow-content');
        if(obj._getCurrentSlideNumber() != $image.length-2) {
            obj._increaseSlideNumber();
            $content.stop(true,false);
        } else {
            return;
        }
        obj._loadImages();
        $content.animate({
            left: -(obj._getWidth()*(obj._getCurrentSlideNumber()+1))
        },obj.options.duration,obj.options.easing,function(){
            if(obj._getCurrentSlideNumber() == $image.length-2) {
                $content.css({left: -obj._getWidth()});
                obj._setCurrentSlideNumber(0);
            }
            obj._changeDot();
            obj._startTimer();
        });
    },
    _animateLeft : function() {
        var obj = this;
        var $image = this.element.find("img");
        var $content = this.element.find('.slideshow-content');
        if(obj._getCurrentSlideNumber() != -1) {
            obj._decreaseSlideNumber();
            $content.stop(true,false);
        } else {
            return;
        }
        obj._loadImages();
        $content.animate({
            left: -(obj._getWidth()*(obj._getCurrentSlideNumber()+1))
        },obj.options.duration,obj.options.easing,function() {
            if(obj._getCurrentSlideNumber() == -1) {
                $content.css({left: -obj._getWidth()*($image.length-2)});
                obj._setCurrentSlideNumber($image.length-3);
            }
            obj._changeDot();
            obj._startTimer();
        });
    },
    _animateOnTouch : function(points) {
        var obj = this;
        var $image = this.element.find("img");
        var $content = this.element.find('.slideshow-content');
        var self = this;
        if(points.initX < points.endX) {
            obj._animateLeft();
        } else if(points.initX > points.endX) {
            obj._animateRight();
        }
    },
    _increaseSlideNumber : function() {
        this.current++;
    },
    _decreaseSlideNumber : function() {
        this.current--;
    },
    _loadImages : function() {
        var $image = this.element.find("img");
        var $imageUnloaded = this.element.find("img[src='']");
        //console.log("start at : "+(this.current+1));
        for(var i=this.current;i<this.current+4;i++) {
            var j = (i+$image.length)%$image.length;
            //console.log("Image to be loaded : "+j);
            var $this  = $($image[j]);
            if($this.attr('src') == '') {
                $this.attr('src',$this.data('src'));
            }
        }
    }
});