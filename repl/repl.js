
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
    this._eContainer = new Element('div',{id:'repl','class':'repl'});
    this._eContainer.insert('<div id="repl_output" class="output"></div>' +
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

    var lisnr = this._onKeyDown.bindAsEventListener(this);
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
  p: function(s,klass) {
    if (klass) {
      var e = new Element('div',{'class':klass});
      e.update(s.escapeHTML());
      this._eOutput.insert(e);
      return e;
    } else {
      this._eOutput.insert(s.escapeHTML());
      return null;
    }
  },
  printLine: function(s,klass) {
    return this.p(s,klass); // TODO: probably don't need this method
  },
  printScrollable: function(s,klass) {
    return this.p(s,'scrollable '+klass);
  },
  status: function(s) {
    return this.p(s,'status');
  },
  error: function(s) {
    return this.p(s,'error');
  },
  clear: function() {
    this._eOutput.update('');
    this._i.length = 0;
    return {inspect:function(){ return '' }};
  },
  _selfClosingTags: { area:true,
                      base:true,
                      basefont:true,
                      br:true,
                      hr:true,
                      input:true,
                      img:true,
                      link:true,
                      meta:true,
                      frame:true,
                      col:true,
                      param:true },
  _inspectElement: function(e) {
    var recur = arguments.callee;
    switch(e.nodeType) {
    case document.ELEMENT_NODE: {
      var sc = this._selfClosingTags[e.tagName.toLowerCase()];
      return ['&lt;<span class="tag_name">',
              e.tagName.toLowerCase().escapeHTML(),
              '</span>',
              $A(e.attributes).map(recur,this),
              sc ? '/&gt;' : ['&gt;<span class="tag_body">',
                              $A(e.childNodes).map(recur,this),
                              '</span>&lt;/<span class="tag_name">',
                              e.tagName.toLowerCase().escapeHTML(),
                              '</span>&gt;']
              ];
    }

    case document.ATTRIBUTE_NODE:
      return [' <span class="attribute_name">',
              e.name.escapeHTML(),
              '</span>="<span class="attribute_value">',
              e.value.escapeHTML(),
              '</span>"'];

    case document.CDATA_SECTION_NODE:
    case document.TEXT_NODE:
      return ['<span class="text">',
              e.nodeValue.escapeHTML(),
              '</span>'];

    case document.COMMENT_NODE:
      return ['<span class="comment">&lt;--',
              e.nodeValue.escapeHTML(),
              '--&gt;</span>'];

    case document.DOCUMENT_NODE:
      return recur(e.documentElement);

    case document.DOCUMENT_FRAGMENT_NODE:
      return $A(e.childNodes).map(recur,this).flatten();

    case document.PROCESSING_INSTRUCTION_NODE:
      return ['<span class="processing_instruction">&lt;?',
              e.target.escapeHTML(),
              ' ',
              e.data.escapeHTML(),
              ' ?&gt;</span>'];

    // case document.ENTITY_REFERENCE_NODE:
    // case document.ENTITY_NODE:
    // case document.DOCUMENT_TYPE_NODE:
    // case document.NOTATION_NODE:
    }
    return ['<span class="error">unhandled node type</span>'];
  },

  _inspectDOM: function(e) {
    return ['<span class="dom dom_toplevel">',
            this._inspectElement(e),
            '</span>'];
  },

  _inspectObject: function(o) {
    var a = ['<table class="object_table">'];
    for (var k in o) {
      if (!o.constructor || !o.constructor.prototype || !o.constructor.prototype[k]) {
        a.push('<tr class="object_row"><td class="object_key" valign="top">',
               k.escapeHTML(),
               '</td><td class="object_value">',
               this._inspectStructure(o[k]),
               '</td></tr>');
      }
    }
    a.push('</table>');
    return a;
  },

  _inspectArray: function(o) {
    var a = ['<span class="array">['];
    if (o.length != 0) {
      a.push(this._inspectStructure(o[0]));
      for (var i = 1; i < o.length; i++) {
        a.push(', ',this._inspectStructure(o[i]));
      }
    }
    a.push(']</span>');
    return a;
  },

  _inspectStructure: function(o) {
    try {
      switch (typeof o) {
      case 'undefined':
      case 'string':
      case 'number':
      case 'function':
        return ['<span class="'+(typeof o)+'">',
                Object.inspect(o).escapeHTML(),
                '</span>'];
      case 'boolean':
      case 'object':
        switch (o) {
        case true:
        case false:
        case null:
          return ['<span class="'+o+'">'+o+'</span>'];
        default:
          if (Object.isElement(o)) {
            return this._inspectDOM(o);
          } else if (Object.isArray(o)) {
            return this._inspectArray(o);
          } else {
            return this._inspectObject(o);
          }
        }
      }
      return ['<span class="error">unknown data type</span>'];
    } catch(ex) {
      return this._inspectError(ex);
    }
  },

  _inspectError: function(ex) {
    return ['<span class="error_name">',
            e.name.escapeHTML(),
            '</span><span class="error_message">',
            e.message.escapeHTML(),
            '</span><table class="stack_trace">',
            e.stack.split(/\r?\n/).map(function(line) {
              if (line.match(/\((.*)\)@(.*):([0-9]+)/)) {
                return ['<tr><td class="stack_line">',
                        RegExp.$3,
                        '</td><td class="stack_file">',
                        RegExp.$2,
                        '</td><td class="stack_object">',
                        RegExp.$1,
                        '</td></tr>'];
              } else {
                return ['<tr><td colspan="3" class="stack_misc">',
                        line,
                        '</td></tr>'];
              }
            }),
            '</table>'];
  },

  inspectStructureAsHTML: function(o) {
    return ['<span class="inspect inspect_toplevel">',
            this._inspectStructure(o),
            '</span>'].flatten().join('');
  },

  inspectStructureAsElement: function(o) {
    return new Element('span',{'class':'inspect inspect_toplevel'}).update(this._inspectStructure(o).flatten().join(''));
  },

  _i: [],

  ii: function(o) {
    this.printRaw(this.inspectStructureAsHTML(o));
  },

  i: function(o) {
    switch (typeof o) {
    case 'undefined':
      this.printLine('undefined','undefined');
      break;
    case 'object':
      if (o == null) {
        this.printLine('null','inspect');
      } else {
        this.printScrollable(o.toSource().replace(/^\(|\)$/g,''),'inspect');
      }
      break;
    default:
      this._ = o;
      var n = this._i.length;
      this._i.push(o);
      var e = this.printLine(Object.inspect(o),'inspect');
      e.observe('click',function(ev) {
        REPL._eInput.value += "_i["+n+"]";
        REPL._eInput.focus();
      });
      break;
    }
  },

  iiiiii: function(o) {
    switch (typeof o) {
      case 'undefined':
      var s = '<table class="property_table">';
      var v, vc;

      for (var k in o) {
        try {
          v = Object.inspect(o[k]);
          vc = (typeof v == 'undefined' ? 'undefined' : 'property_value');
        } catch(ex) {
          v = Object.inspect(ex);
          vc = 'error';
        }

        s += '<tr class="object_property">'+
             '<td valign="top" class="object_key">'+k.escapeHTML()+
             '</td><td class="object_value">'+v.escapeHTML()+
             '</td></tr>';
      }
        s += '</table>';
    }
    this.printRaw(s);
  },
  printException: function(e) {
  },
  guarded: function (f,t) {
    var th = this;
    return function() {
      try {
        f.apply(t,Array.prototype.slice(arguments,2));
      } catch(ex) {
        th.printException(ex);
      }
    };
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
