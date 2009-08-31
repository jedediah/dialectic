
function instanceEval_evaluator(_o,_s) {
  return window.eval(_s);
}

function instanceEval(obj,code) {
  a = [];
  for (var k in obj) {
    a.push('var '+k+'=_o.'+k+';');
  }
  return instanceEval_evaluator(obj,a.join('')+code);
}

REPL = {
  initialize: function(o) {
    this._ = null;  // result of last eval in the repl
    this._global = (function() { return this; }).call(null);
    this._extensions = {};
    this._historyPosition = 0;
    this._currentInput = "";
    this._contextStack = [this._global];
    this._inputHistory = [];
    this._displayStyle = 'block';
    this._eContainer = new Element('div',{id:'repl',class:'repl'});
    this._eContainer.insert('<pre id="repl_output" class="output"></pre>' +
                            '<div id="repl_context" class="context"></div>' +
                            '<input id="repl_input" class="input"/>' +
                            '<textarea id="repl_multiline" class="multiline"></textarea>');

    if (o.parent)
      this._eParent = $(o.parent);
    else
      this._eParent = $(document.body);

    this._eParent.insert(this._eContainer);
    
    this._eOutput = $('repl_output');
    this._eContext = $('repl_context');
    this._eInput = $('repl_input');
    this._eMultiline = $('repl_multiline');

    var lisnr = this._onKeyDown.bindAsEventListener(this)
    Event.observe(this._eInput,'keydown',lisnr);
    Event.observe(this._eMultiline,'keydown',lisnr);

    if (o.show) { this.show(); }
  },
  show: function() {
    this.updatePrompt();
    this._eContainer.style.display = this._displayStyle;
    this._eInput.focus();
  },
  hide: function() {
    this._eInput.blur();
    this._eContainer.style.display = 'none';
  },
  element: function() {
    return this._eContainer;
  },
  multi: function() {
    this._eMultiline.value = this._eInput.value;
    this._eInput.style.display = 'none';
    this._eMultiline.style.display = 'block';
    this._eMultiline.focus();
    this._multilineEnabled = true;
  },
  single: function() {
    this._eInput.value = this._eMultiline.value;
    this._eMultiline.style.display = 'none';
    this._eInput.style.display = 'block';
    this._eInput.focus();
    this._multilineEnabled = false;
  },
  request: function(method,uri,params,func) {
    if (typeof params == 'function') {
      func = params;
      params = null;
    }

    var th = this;
    return (new Ajax.Request(uri,{
      method: method,
      parameters: params,
      onSuccess: function(t) {
        th.status(t.status+' '+t.statusText,'status');
        if (func) { func(t.responseText); }
      },
      onException: function(r,e) {
        th.printException(e);
      },
      onFailure: function(t) {
        th.error(t.status+' '+t.statusText,'error');
      }
    })).transport;
  },
  GET: function(uri,params,func) {
    return this.request('GET',uri,params,func);
  },
  POST: function(uri,params,func) {
    return this.request('POST',uri,params,func);
  },
  cd: function(x) {
    this._contextStack.push(x);
  },
  registerExtension: function(id,module) {
    this._extensions[id] = {module: module,
                            running: false};
  },
  start: function(ext) {
    var k;
    if (!(k = this._extensions[ext])) {
      this.error("Unknown extension '"+ext+"'");
    } else if (k.running) {
      this.error("Extension '"+ext+"' already running");
    } else {
      try {
        k.module.start(this);
        k.running = true;
        this.status("Extension '"+ext+"' started");
      } catch(ex) {
        this.printException(ex);
      }
    }
    return this;
  },
  stop: function(ext) {
    var k;
    if (!(k = this._extensions[ext])) {
      this.error("Unknown extension '"+ext+"'");
    } else if (!k.running) {
      this.error("Extension '"+ext+"' is not running");
    } else {
      try {
        k.module.stop(this);
        k.running = false;
        this.status("Extension '"+ext+"' stopped");
      } catch(ex) {
        this.printException(ex);
      }
    }
    return this;
  },
  pop: function() {
    if (this._contextStack.length > 1) {
      this._contextStack.pop();
    } else {
      this.error("Sorry, you can't pop the top level context");
    }
  },
  script: function(uri) {
    document.body.insert(new Element('script', {src: uri}));
    this.status("Loading "+uri);
  },
  load: function(uri) {
    var th = this;
    new Ajax.Request(uri,{
      method:'get',
      asynchronous: false,
      evalJS: false,
      onSuccess: function(trans) {
        th.status("Ajax load of "+uri+" complete, evaluating...");
        th.evalLine(trans.responseText,this._global);
      },
      onFailure: function(trans) {
        th.error("Ajax load of '"+uri+"' failed: " +
                 trans.status + " " +
                 trans.statusText + "\n" +
                 trans.responseText);
      }
    });
  },
  extend: function(ext) {
    this.load('repl/extensions/'+ext+'.js');
    this.start(ext);
  },
  currentContext: function() {
    return this._contextStack[this._contextStack.length-1];
  },
  scrollToBottom: function() {
    this._eOutput.scrollTop = 999999;
    return this;
  },
  printRaw: function(s) {
    return this._eOutput.insert(s);
  },
  print: function(s,klass) {
    if (klass) {
      var e = new Element('span',{class:klass}).update(s.escapeHTML());
      this._eOutput.insert(e);
      return e;
    } else {
      this._eOutput.insert(s.escapeHTML());
      return null;
    }
  },
  printLine: function(s,klass) {
    return this.print(s+"\n",klass);
  },
  status: function(s) {
    return this.printLine(s,'status');
  },
  error: function(s) {
    return this.printLine(s,'error');
  },
  clear: function() {
    this._eOutput.update('');
    this._i.length = 0;
    return {inspect:function(){ return '' }};
  },
  i: function(o) {
    if (typeof o == 'undefined') {
      this.printLine('undefined','undefined');
    } else {
      this._ = o;
      var n = this._i.length;
      this._i.push(o);
      var e = this.printLine(Object.inspect(o),'inspect');
      e.observe('click',function(ev) {
        REPL._eInput.value += "_i["+n+"]";
        REPL._eInput.focus();
      });
    }
  },

  _i: [],
  
  ii: function(o) {
    var s = '<table class="property_table">'
    var v, vc;

    for (var k in o) {
      try {
        v = Object.inspect(o[k]);
        vc = (typeof v == 'undefined' ? 'undefined' : 'inspect')
      } catch(ex) {
        v = Object.inspect(ex);
        vc = 'error'
      }

      s += '<tr><td class="property_name">'+k.escapeHTML()+
           '</td><td class="'+vc+'">'+v.escapeHTML()+'</td></tr>';
    }
    s += '</table>';
    this.printRaw(s);
  },
  printException: function(e) {
    this.printRaw(
      '<span class="error_name">'+e.name+'</span>'+
      '<span class="error_message">'+e.message+"</span>"+
      '<table class="stack_trace">'+

      e.stack.split(/\r?\n/).map(function(line) {
        if (line.match(/\((.*)\)@(.*):([0-9]+)/)) {
          return '<tr><td class="stack_line">'+RegExp.$3+'</td>'+
                     '<td class="stack_file">'+RegExp.$2+'</td>'+
                     '<td class="stack_object">'+RegExp.$1+'</td></tr>';
        } else {
          return '<tr><td colspan="3" class="stack_misc">'+line+'</td></tr>';
        }
      }).join('')+"</table>");

    return this;
  },
  guarded: function (f,t) {
    var th = this;
    return function() {
      try {
        f.apply(t,Array.prototype.slice(arguments,2));
      } catch(ex) {
        th.printException(ex);
      }
    }
  },
  evalSilent: function(_stringToEvaluate,_objectInWhichToEvaluteIt) {
    return (function() {
      with(_objectInWhichToEvaluteIt) {
        with(this.REPL) {
          return this.eval(_stringToEvaluate);
        }
      }
    }).call(null);
  },
  evalLine: function(s,ctx) {
    ctx = ctx || this.currentContext();

    try {
      this.i(this.evalSilent(s,ctx));
    } catch(ex) {
      this.printException(ex);
    }

    this.updatePrompt();
    setTimeout(this.scrollToBottom.bindAsEventListener(this),100);
  },
  translateCommands: function(s) {
    if (s.match(/^\/(\w+)(?:\s+(\S.*))?$/)) {
      return RegExp.$1+'('+RegExp.$2+');';
    } else {
      return s;
    }
  },
  getInputElement: function() {
    return this._multilineEnabled ? this._eMultiline : this._eInput;
  },
  evalInput: function() {
    var src = this._eInput.value;
    this._eInput.value = '';
    this._historyPosition = 0;

    if (src.match(/\S/)) {
      this._inputHistory.push(src);
      this.printLine(src, 'history');
      this.evalLine(this.translateCommands(src));
    }
  },
  evalMultiline: function() {
    var src = this._eMultiline.value;
    if (src.match(/\S/)) {
      this.printRaw('<hr/>');
      this.evalLine(this.translateCommands(src));
    }
  },
  loadHistory: function(n) {
    if (n != this._historyPosition) {
      if (n == 0) {
        this._eInput.value = this._currentInput;
        this._historyPosition = 0;
      } else if (n > 0 && n <= this._inputHistory.length) {
        if (this._historyPosition == 0) { this._currentInput = this._eInput.value; }
        this._eInput.value = this._inputHistory[this._inputHistory.length-n];
        this._historyPosition = n;
      }
    }
  },
  _onKeyDown: function(ev) {
    //this.ii({code: ev.keyCode, alt: ev.altKey, ctrl: ev.ctrlKey, shift: ev.shiftKey});
    this.scrollToBottom();

    if (this._multilineEnabled) {
      switch(ev.keyCode) {
      case KeyEvent.DOM_VK_ENTER:
      case KeyEvent.DOM_VK_RETURN: if (ev.ctrlKey) this.evalMultiline(); break;
      default: return false;
      }
    } else {
      switch (ev.keyCode) {
      case KeyEvent.DOM_VK_UP:     this.loadHistory(this._historyPosition + 1); break;
      case KeyEvent.DOM_VK_DOWN:   this.loadHistory(this._historyPosition - 1); break;
      case KeyEvent.DOM_VK_ENTER:
      case KeyEvent.DOM_VK_RETURN: this.evalInput(); break;
      default: return false;
      }
    }

    return true; // did handle
  },
  updatePrompt: function() {
    this._eContext.update((Object.inspect(this.currentContext())).escapeHTML());
  }
};

Event.observe(window,'load',function(ev) {
  REPL.initialize({show: true});
});
