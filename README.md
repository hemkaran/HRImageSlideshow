# HRImageSlideshow
A jQuery Image Slideshow Widget

This is a basic image slider widget which you can include at your website easily.

### Usage
```js
$(".yourHtmlDivClass").imageSlideshow();
```

**OR**

with all configuration
```js
$(".yourHtmlDivClass").imageSlideshow({
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
    });

```

See Demo for more information.


