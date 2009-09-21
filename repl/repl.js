function REPLGlobalErrorHandler(ex) {
  var msg = 'Global Exception Handler: ' + ex;
  if (ex.stack) { msg += "\n"+ex.stack; }
  if (document.body) {
    document.body.innerHTML = '<h2 style="color: #f88; background-color: #000;">'+msg+'</h2>';
  } else {
    alert(ex);
  }
}

try {

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

if (typeof KeyEvent == 'undefined') {
  // This is missing in Chromium for some reason
  KeyEvent = {
    DOM_VK_UNDEFINED     : 0x0,
    DOM_VK_RIGHT_ALT     : 0x01,
    DOM_VK_LEFT_ALT      : 0x02,
    DOM_VK_LEFT_CONTROL  : 0x03,
    DOM_VK_RIGHT_CONTROL : 0x04,
    DOM_VK_LEFT_SHIFT    : 0x05,
    DOM_VK_RIGHT_SHIFT   : 0x06,
    DOM_VK_LEFT_META     : 0x07,
    DOM_VK_RIGHT_META    : 0x08,
    DOM_VK_CAPS_LOCK     : 0x09,
    DOM_VK_DELETE        : 0x0A,
    DOM_VK_END           : 0x0B,
    DOM_VK_ENTER         : 0x0C,
    DOM_VK_ESCAPE        : 0x0D,
    DOM_VK_HOME          : 0x0E,
    DOM_VK_INSERT        : 0x0F,
    DOM_VK_NUM_LOCK      : 0x10,
    DOM_VK_PAUSE         : 0x11,
    DOM_VK_PRINTSCREEN   : 0x12,
    DOM_VK_SCROLL_LOCK   : 0x13,
    DOM_VK_LEFT          : 0x14,
    DOM_VK_RIGHT         : 0x15,
    DOM_VK_UP            : 0x16,
    DOM_VK_DOWN          : 0x17,
    DOM_VK_PAGE_DOWN     : 0x18,
    DOM_VK_PAGE_UP       : 0x19,
    DOM_VK_F1            : 0x1A,
    DOM_VK_F2            : 0x1B,
    DOM_VK_F3            : 0x1C,
    DOM_VK_F4            : 0x1D,
    DOM_VK_F5            : 0x1E,
    DOM_VK_F6            : 0x1F,
    DOM_VK_F7            : 0x20,
    DOM_VK_F8            : 0x21,
    DOM_VK_F9            : 0x22,
    DOM_VK_F10           : 0x23,
    DOM_VK_F11           : 0x24,
    DOM_VK_F12           : 0x25,
    DOM_VK_F13           : 0x26,
    DOM_VK_F14           : 0x27,
    DOM_VK_F15           : 0x28,
    DOM_VK_F16           : 0x29,
    DOM_VK_F17           : 0x2A,
    DOM_VK_F18           : 0x2B,
    DOM_VK_F19           : 0x2C,
    DOM_VK_F20           : 0x2D,
    DOM_VK_F21           : 0x2E,
    DOM_VK_F22           : 0x2F,
    DOM_VK_F23           : 0x30,
    DOM_VK_F24           : 0x31
  }
}

REPL = {
  initialize: function(o) {
    try {
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

      Event.observe(document.body, 'click', this._onBodyClick.bindAsEventListener(this));

      if (o.show) { this.show(); }

    } catch(ex) {
      REPLGlobalErrorHandler(ex);
    }
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
        try {
          th.status(t.status+' '+t.statusText,'status');
          if (func) { func(t.responseText); }
        } catch(ex) {
          REPLGlobalErrorHandler(ex);
        }
      },
      onException: function(r,e) {
        try {
          th.printException(e);
        } catch(ex) {
          REPLGlobalErrorHandler(ex);
        }
      },
      onFailure: function(t) {
        try {
          th.error(t.status+' '+t.statusText,'error');
        } catch(ex) {
          REPLGlobalErrorHandler(ex);
        }
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
  canvas: function(w,h) {
    if (!this._canvas) {
      this._canvas = new Element('canvas',{style:"position: absolute; z-index: -1;"});
      document.body.insert({top:this._canvas});
      this.ctx = this._canvas.getContext('2d');
    }
    if (w) this._canvas.width = w;
    if (h) this._canvas.height = h;
  },
  script: function(uri) {
    var th = this;
    this._lastLoad = function() {
      document.body.insert(new Element('script', {src: uri, 'class':'dynamic_script'}));
      th.status("Loading "+uri);
    }
    this._lastLoad();
  },
  load: function(uri) {
    var th = this;
    this._lastLoad = function() {
      new Ajax.Request(uri,{
        method:'get',
        asynchronous: false,
        evalJS: false,
        onSuccess: function(trans) {
          th.status("Ajax load of "+uri+" complete, evaluating...");
          th.evalScript(trans.responseText);
        },
        onFailure: function(trans) {
          th.error("Ajax load of '"+uri+"' failed: " +
                   trans.status + " " +
                   trans.statusText + "\n" +
                   trans.responseText);
        }
      });
    }
    this._lastLoad();
  },
  reload: function() {
    if (this._lastLoad) {
      this._lastLoad();
    } else {
      this.error("Nothing has been loaded yet");
    }
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
      e.update((''+s).escapeHTML());
      this._eOutput.insert(e);
      return e;
    } else {
      this._eOutput.insert((''+s).escapeHTML());
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
    this.value.length = 0;
    return 'OK';
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

  _inspectElement: function(e,opts,maxDepth) {
    this._freezeGuard();
    var funcme = arguments.callee;
    function recur(ee) { return funcme.call(this,ee,opts,maxDepth); };

    switch(e.nodeType) {
    case document.ELEMENT_NODE: {
      var tagName = e.tagName.toLowerCase();
      var sc = this._selfClosingTags[tagName];
      return ['&lt;<span id="value_"'+this._rememberValue(e),
              '" class="tag_name value">',
              tagName.escapeHTML(),
              '</span>',
              $A(e.attributes).map(recur,this),
              sc ? '/&gt;' : ['&gt;<span class="tag_body">',
                              $A(e.childNodes).map(recur,this),
                              '</span>&lt;/<span class="tag_name">',
                              tagName.escapeHTML(),
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

  _inspectDOM: function(e,opts,maxDepth) {
    this._freezeGuard();
    return ['<span class="dom dom_toplevel">',
            this._inspectElement(e,opts,maxDepth),
            '</span>'];
  },

  _prototypeName: function(o) {
    switch(typeof o) {
    case 'undefined': return 'undefined';
    case 'boolean': return 'Boolean';
    case 'number': return 'Number';
    case 'string': return 'String';
    case 'function': return 'Function';
    default:
      if (o === null) {
        return 'null';
      } else if ((''+o.constructor).match(/^\s*function\s+(\w+)/) ||
          (''+o).match(/^\[object\s+(\w+)/)) {
        return RegExp.$1;
      } else {
        return 'Object';
      }
    }
  },

  _inspectObject: function(o,opts,maxDepth) {
    this._freezeGuard();
    if (opts.tables) {
      var a = ['<table class="object_table" style="background-color: #',
               ((this._MAX_INSPECT_DEPTH-maxDepth+2)*0x111).toString(16),
               ';" cellspacing="0" cellpadding="0">',
               '<tr class="object_header"><td class="object_proto">',
               '<span class="object_proto">',
               this._prototypeName(o),
               '</span></td><td class="object_self">',
               this._valueSpan('object_self',o,o.valueOf()),
               '</td></tr>'];
      for (var k in o) {
        if (o.hasOwnProperty(k) || opts.proto) {
          a.push('<tr class="object_row"><td class="object_key" valign="top">',
                 k.escapeHTML(),
                 '</td><td class="object_value">',
                 this._inspectStructure(o[k],opts,maxDepth-1),
                 '</td></tr>');
        }
      }
      a.push('</table>');
      return a;
    } else {
      var a = [];
      for (var k in o) {
        if (o.hasOwnProperty(k) || opts.proto) {
          if (a.length > 1) a.push(', ');
          a.push('<span class="object_key">',
                 k.escapeHTML(),
                 '</span>: ',
                 this._inspectStructure(o[k],opts,maxDepth-1));
        }
      }
      var klass = this._prototypeName(o);
      if (klass == 'Object') {
        a = ['{',a,'}'];
      } else {
        a = ['&lt;#<span class="object_prototype">',klass,'</span>: {',a,'}&gt;'];
      }
      return this._containerSpan('object',o,a);
    }
  },

  _inspectArray: function(o,opts,maxDepth) {
    this._freezeGuard();
    var a = ['['];
    var len = o.length; // It is possible that o will grow
                        // as a side effect of inspecting it
                        // e.g. when inspecting this.value,
                        // so take its length in advance.
    for (var i = 0; i < len; i++) {
      if (a.length > 1) a.push(', ');
      a.push(this._inspectStructure(o[i],opts,maxDepth-1));
    }
    a.push(']');
    return this._containerSpan('array',o,a);
  },

  _inspectFunction: function(o,opts) {
    if ((''+o).match(/^\s*function\s*(\w+)?\s*\(([^\)]*)\)\s*({.*)/)) {
      var name = RegExp.$1;
      var body = RegExp.$3;
      var formals = RegExp.$2.split(/\s*,\s*/);
      var a = ['<span class="syntax keyword">function</span>'];
      if (name) a.push(' <span class="syntax function">',name,'</span>');
      a.push('(');
      for (var i = 0; i < params.length; i++) {
        if (i > 0) a.push(',');
        a.push('<span class="syntax formal">',formals[i],'</span>');
      }
      a.push(') ');
      a.push(this._expandoSpan('syntax fbody',o,opts.fbody));
      return this._valueSpan('function',o,a);
    } else {
      return this._valueSpan('function',o,o);
    }
  },

  _hasOwnProperties: function(o) {
    if (typeof k == 'undefined' ||
        k === null ||
        !k.hasOwnProperty) {
      return false;
    }
    for (var k in o) {
      if (k.hasOwnProperty(o)) return true;
    }
    return false;
  },

  _inspectStructure: function(o,opts,maxDepth) {
    this._freezeGuard();
    if (!maxDepth || maxDepth <= 0) { return ["..."]; }

    try {
      if (opts.tables && (opts.proto || this._hasOwnProperties(o))) {
        return this._inspectObject(o,opts,maxDepth);
      } else {
        switch (typeof o) {
        case 'undefined':
        case 'number':
        case 'function':
          return this._valueSpan((typeof o),o,o);
        case 'string':
          return this._valueSpan('string',o,o.inspect())
        case 'boolean':
        case 'object':
          switch (o) {
          case true:
          case false:
          case null:
            return this._valueSpan(o,o,o);
          default:
            if (Object.isElement(o)) {
              return this._inspectDOM(o,opts,maxDepth);
            } else if (Object.isArray(o)) {
              return this._inspectArray(o,opts,maxDepth);
            } else {
              return this._inspectObject(o,opts,maxDepth);
            }
          }
        }
        return this._valueSpan('error',o,["unknown data type '",(typeof o),"': ",o]);
      }
    } catch(ex) {
      return this._inspectError(ex,opts);
    }
  },

  _valueSpan: function(klass,value,str) {
    this._freezeGuard();
    return ['<span id="value_',
            this._rememberValue(value),
            '" class="value ',
            klass,
            '">',
            (''+str).escapeHTML(),
            '</span>'];
  },

  _containerSpan: function(klass,value,body) {
    this._freezeGuard();
    return ['<span id="value_',
            this._rememberValue(value),
            '" class="value ',
            klass,
            '">',
            body,
            '</span>'];
  },

  _expandoSpan: function(klass,value) {
  },

  _inspectError: function(ex,opts) {
    return ['<span class="error_name">',
            ex.name.escapeHTML(),
            '</span><span class="error_message">',
            ex.message.escapeHTML(),
            '</span><table class="stack_trace">',
            ex.stack.split(/\r?\n/).map(function(line) {
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

  _MAX_INSPECT_DEPTH: 2,

  inspectStructureAsHTML: function(o,opts) {
    opts = opts || {};
    opts.depth = opts.depth || this._MAX_INSPECT_DEPTH;
    this._freezeGuardReset();
    return ['<span class="inspect inspect_toplevel">',
            this._inspectStructure(o,opts,opts.depth),
            '</span>'].flatten().join('');
  },

  inspectStructureAsElement: function(o,opts) {
    opts = opts || {};
    opts.depth = opts.depth || _MAX_INSPECT_DEPTH;
    this._freezeGuardReset();
    return new Element('span',{'class':'inspect inspect_toplevel'}).
               update(this._inspectStructure(o,opts,opts.depth).flatten().join(''));
  },

  inspectConciseAsHTML: function(o) {
    return this._valueSpan('inspect inspect_toplevel '+(typeof o),o,Object.inspect(o)).flatten().join('');
  },

  // Nasty infinite loop/recursion bugs tend to pop up with these inspection functions
  // so this paranoid counter-measure is in place to prevent infuriating freezes,
  // at least until the code is more mature.
  _FREEZE_GUARD_MAX_COUNT: 10000,
  _freezeGuardCounter: 0,
  _freezeGuardReset: function() {
    this._freezeGuardCounter = this._FREEZE_GUARD_MAX_COUNT;
  },
  _freezeGuard: function() {
    if (--this._freezeGuardCounter <= 0) {
      throw new Error("Infinite loop detected, bailing out ("+this._FREEZE_GUARD_MAX_COUNT+" iterations)");
      //this.p("Infinite loop detected, bailing out ("+this._FREEZE_GUARD_MAX_COUNT+" iterations)");
    }
  },

  // JavaScript has no general way to get a unique ID for an object, and
  // it always coerces object keys to strings, so each entry in _valueMap
  // represents a *set* of past values sharing a particular string representation.
  // The set is an array of indexes into value[], which holds the actual values.
  // So value[] and _valueMap might look something like this:
  //
  //   value: [123, null, [], HTMLImageElement, "123", []]
  //   _valueMap: { "123":  [0,4],
  //                "null": [1],
  //                "[]":   [2,5],
  //                "HTMLImageElement": [3] }
  //
  // Notice that 123 and "123" are in the same bucket, as are two seperate
  // instances of the empty array [] which JavaScript doesn't consider equal.
  value: [],
  _valueMap: {},
  _rememberValue: function(v) {
    this._freezeGuard();
    var a = this._valueMap[v], i;
    if (a && typeof (i = a.find(function(x) { return this.value[x] === v; }, this)) != 'undefined') {
      return i;
    } else {
      i = this.value.length;
      if (!this._valueMap[v]) this._valueMap[v] = [];
      this._valueMap[v].push(i);
      this.value.push(v);
      return i;
    }
  },

  _RECALL_MAX_STRING_LENGTH: 30,
  // Return a string representation of the value in history position i.
  // This will be a literal for immutable primitive types
  // and "value[#]" for other values, where # is the value of i.
  _recallValue: function(i) {
    //this.p("_recallValue("+i+")")
    this._freezeGuard();
    var v = this.value[i];
    switch(typeof v) {
    case 'number':
    case 'boolean':
    case 'undefined':
      return ''+v;
    case 'string':
      if (v.length > this._RECALL_MAX_STRING_LENGTH) {
        return "value["+i+"]";
      } else {
        return v.inspect();
      }
    default:
      if (v === null) {
        return "null";
      } else if (Object.isElement(v) && v.id) {
        return "$("+v.id.inspect()+")";
      } else {
        return "value["+i+"]";
      }
    }
  },

  _valueElementIndex: function(e) {
    //this.p("_valueElementIndex("+e.id+")")
    if (e.id.match(/^value_(\d+)$/)) {
      return RegExp.$1-0;
    } else {
      return undefined;
    }
  },

  _onBodyClick: function(event) {
    try {
      var i = this._valueElementIndex(event.element());
      if (typeof i != 'undefined') {
        this._insertInput(this._recallValue(i));
      }
    } catch(ex) {
      REPLGlobalErrorHandler(ex);
    }
  },

  _inputElement: function() {
    if (this._multilineEnabled)
      return this._eMultiline;
    else
      return this._eInput;
  },

  _insertInput: function(s) {
    var ie = this._inputElement();
    ie.value += s;
    ie.focus();
  },

  i: function(o,depth) {
    this.printRaw(this.inspectStructureAsHTML(o,{depth: depth}));
  },

  ii: function(o,depth) {
    this.printRaw(this.inspectStructureAsHTML(o,{tables: true, depth: depth}));
  },

  proto: function(o) {
    this.printRaw(this.inspectStructureAsHTML(o,{tables: true, proto: true}));
  },

  printException: function(e) {
    this.printRaw(this._inspectError(e).flatten().join(''));
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
  evalSilent: function(_stringToEvaluate,_objectInWhichToEvaluateIt) {
    return (function() {
      // Chromium acts reeeeal weird like if you use with() on the global object
      if (_objectInWhichToEvaluateIt === REPL._global) {
        with(this.REPL) {
          return eval(_stringToEvaluate);
        }
      } else {
        with(_objectInWhichToEvaluateIt) {
          with(this.REPL) {
            return eval(_stringToEvaluate);
          }
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
    this.scrollToBottom();
  },
  evalScript: function(src) {
    try {
      if (this._global.execScript) {
        this._global.execScript(src);
      } else {
        this._global.eval.call(this._global,src);
      }
    } catch(ex) {
      this.printException(ex);
    }

    this.scrollToBottom();
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
      this.printRaw(['<span class="context">',
                     this.currentContext(),
                     '</span> <span class="history">',
                     src,
                     '</span>'].join(''));
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
    try {
      //this.ii({code: ev.keyCode, alt: ev.altKey, ctrl: ev.ctrlKey, shift: ev.shiftKey});
      this.scrollToBottom();

      if (this._multilineEnabled) {
        switch(ev.keyCode) {

        case 13:  // Chromium has wrong VK_ENTER
        case KeyEvent.DOM_VK_ENTER:
        case KeyEvent.DOM_VK_RETURN: if (ev.ctrlKey) this.evalMultiline(); break;

        default: return false;
        }
      } else {
        switch (ev.keyCode) {

        case 38: // Chromium
        case KeyEvent.DOM_VK_UP:     this.loadHistory(this._historyPosition + 1); break;

        case 40: // Chromium
        case KeyEvent.DOM_VK_DOWN:   this.loadHistory(this._historyPosition - 1); break;

        case 13:  // Chromium has wrong VK_ENTER
        case KeyEvent.DOM_VK_ENTER:
        case KeyEvent.DOM_VK_RETURN: this.evalInput(); break;

        default: return false;
        }
      }

      return true; // did handle
    } catch(ex) {
      REPLGlobalErrorHandler(ex);
      return true;
    }
  },
  updatePrompt: function() {
    this._eContext.update((Object.inspect(this.currentContext())).escapeHTML());
  }
};

Event.observe(window,'load',function(ev) {
  REPL.initialize({show: true});
});


} catch (ex) {
  REPLGlobalErrorHandler(ex);
}