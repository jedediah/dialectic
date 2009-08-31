REPL.registerExtension('canvas',{
  start: function(repl) {
    // startup code
    function width() {
      return window.innerWidth || document.body.clientWidth;
    }
    function height() {
      return window.innerHeight || document.body.clientHeight;
    }
    function update() {
      this._canvas.width = this._c2d.width = width();
      this._canvas.height = this._c2d.height = height();
    }

    this._canvas = new Element('canvas',{width:width(),height:height()});
    with(this._canvas.style) {
      position = 'absolute';
      left = 0; top = 0;
      zIndex = -1;
    }
    
    $(document.body).insert(this._canvas);
    this._c2d = this._canvas.getContext("2d");
    //update();
    
    Event.observe(window,'resize',update);

    window.canvas = this._canvas;
    window.c2d = this._c2d;
  },
  stop: function(repl) {
    // cleanup
    this._c2d = window.c2d = null;
    this._canvas.remove();
    this._canvas = window.canvas = null;
  },
  erase: function() {
    with(this._c2d) {
      save();
      setTransform(0,1,1,0,0,0);
      clearRect(0,0,width,height);
      restore();
    }
  }
});
