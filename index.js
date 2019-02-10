// Generated by CoffeeScript 2.3.2
// ![PlayFrame](https://avatars3.githubusercontent.com/u/47147479)
// # ShaDOM

// ###### 1.5 kB DOM + Shadow DOM Manipulation

// ## Installation
// ```sh
// npm install --save @playframe/shadom
// ```

// ## Usage
// ```js
// import oversync from '@playframe/oversync'
// import h from '@playframe/h'
// import shadom from '@playframe/shadom'

// const sync = oversync(Date.now, requestAnimationFrame)

// const state = {}
// const View = (state)=> <div></div> // h('div')

// const render = shadom(sync)(document.body)

// // to update DOM we do
// render(View, state)
// ```

// ## Annotated Source

// `@playframe/h` is required as peer dependency. We are importing
// a `VNODE`
// [Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)
// constant. Symbol can't be created twice in two different places.
// It is important to use the same instance of `@playframe/h` acroass
// your app
var ATTR, ELEMENT, EVENTS, FIRST_CHILD, KEYED, NAME, SHADOW, VNODE, _first_run, _sync, doc, emmit_destroy, eventHandler, get_key, h, isArray, make_el, mutate_children, mutate_dom, remove_el, scan, set, set_attr;

({VNODE} = h = require('@playframe/h'));

({isArray} = Array);

doc = document;

// Let's remind outselves our virtual dom data structure
// `['div', {class: 's'}, children...]` to clarify the constants.
NAME = 0;

ATTR = 1;

FIRST_CHILD = 2;

// Symbols are designed to assign metaproperties to existing
// objects. Those properties are not occuring in `for` or `Object.keys`
// iteration. They are also free from name conflicts. For example
// different libraries can create own `Symbol('ELEMENT')` and use them
// on the same object without any collision
ELEMENT = Symbol('ELEMENT');

EVENTS = Symbol('EVENTS');

KEYED = Symbol('KEYED');

SHADOW = Symbol('SHADOW');

_sync = null;

_first_run = true;

// This function will schedule actual event handling at
// the begging of the next work batch
eventHandler = (event) => {
  var f;
  f = event.currentTarget[EVENTS][event.type];
  _sync.next(() => {
    return f(event);
  });
};

// We are exporting a higher order function that will take `sync` scheduler
// and a `root` element. It will return a function that takes latest
// `view` function and `state` and schedules vDOM producing and
// DOM mutating
module.exports = (sync) => {
  return (root) => {
    var _dom, _scheduled, _state, _v_dom, _view, render;
    _sync = sync;
    _scheduled = false;
    _view = null;
    _state = null;
    _v_dom = null;
    if (_dom = root.children[0]) {
      _v_dom = scan(_dom);
    }
    render = () => {
      var new_v_dom;
      _scheduled = false;
      new_v_dom = _view(_state);
      _dom = mutate_dom(root, _dom, new_v_dom, _v_dom);
      _v_dom = new_v_dom;
    };
    return (view, state) => {
      var run;
      run = _first_run ? (f) => { // first run, render asap
        f();
        _first_run = false;
      } : _sync.render;
      _view = view;
      _state = state;
      if (!_scheduled) {
        _scheduled = true;
        run(render);
      }
    };
  };
};

// Reusing preexisting html nodes in `root` element. This will benefit
// apps with server side pre-rendering
scan = (el) => {
  var childNodes, i, m, nodes, ref;
  if (el.nodeType === 3) { // text
    return el.nodeValue;
  } else {
    ({childNodes} = el);
    nodes = h(el.nodeName.toLowerCase(), null);
    for (i = m = 0, ref = childNodes.length; m < ref; i = m += 1) {
      nodes.push(scan(childNodes[i]));
    }
    return nodes;
  }
};

// This function will take a DOM element `el` and its `parent` element.
// Also it takes a new vDOM `vnode` and `old_vnode`. Their diff will
// mutate `el`. `NS` is a XMLNS namespace for working with SVG or XHTML
mutate_dom = (parent, el, vnode, old_vnode, NS) => {
  var new_el, onupdate, ref, shadow;
  // console.log 'mutate_dom', vnode, old_vnode
  if (vnode !== old_vnode) {
    if ((old_vnode != null) && (vnode != null) && !old_vnode[VNODE] && !vnode[VNODE]) {
      el.nodeValue = vnode; // text node
    } else {
      // for SVG or XHTML
      NS = vnode && ((ref = vnode[ATTR]) != null ? ref.xmlns : void 0) || NS;
      if ((vnode == null) || (old_vnode == null) || old_vnode[NAME] !== vnode[NAME]) {
        // replace node
        if (vnode != null) {
          new_el = make_el(vnode, NS);
          parent.insertBefore(new_el, el);
        }
        if (old_vnode != null) {
          remove_el(parent, el);
          _sync.next(() => {
            return emmit_destroy(old_vnode);
          });
        }
        return new_el; // update node
      } else {
        set_attr(el, vnode[ATTR], old_vnode[ATTR], NS);
        if (shadow = old_vnode[SHADOW]) {
          vnode[SHADOW] = shadow;
          mutate_children(shadow, vnode, old_vnode, NS);
        } else {
          mutate_children(el, vnode, old_vnode, NS);
        }
        if (onupdate = vnode[ATTR] && vnode[ATTR][_first_run ? 'oncreate' : 'onupdate']) {
          // executed syncronously later
          _sync.render(() => {
            return onupdate(el);
          });
        }
      }
    }
  }
  return el;
};

// This function will compare and mutate children of given `el`.
// Keyed updates are supported
mutate_children = (el, vnode, old_vnode, NS) => {
  var by_key, child, child_el, el_i, i, j, k, key, keyed, l, ll, old_child, old_key, old_keyed, replaced_el, replacement, sub_child, sub_i, sub_il, sub_j, sub_jl, v;
  i = j = FIRST_CHILD;
  sub_i = sub_j = sub_il = sub_jl = el_i = 0;
  l = vnode.length;
  ll = (old_vnode != null ? old_vnode.length : void 0) || 0;
  by_key = false;
  while (true) {
    // 2 inline child walkers for performance reasons
    // getting next child in ['div', {}, child, [child, child],...]
    while (i <= l) {
      child = vnode[i];
      if ((child == null) || (child === true || child === false)) {
        i++; // continue
      } else if (child[VNODE] || !isArray(child)) {
        i++;
        break;
      } else {
        sub_il || (sub_il = child.length);
        if (((sub_child = child[sub_i]) != null) && (sub_child !== true && sub_child !== false)) {
          sub_i++;
          child = sub_child;
          break;
        } else {
          if (sub_i < sub_il) {
            sub_i++;
          } else {
            sub_i = sub_il = 0;
            i++;
          }
        }
      }
    }
    key = get_key(child);
    while (j <= ll) {
      old_key = null;
      old_child = old_vnode[j];
      if ((old_child == null) || (old_child === true || old_child === false)) {
        j++; // continue
      } else if (old_child[VNODE] || !isArray(old_child)) {
        j++;
        old_key = get_key(old_child);
        if (!(old_keyed && old_key && !old_keyed[old_key])) {
          break;
        }
      } else {
        sub_jl || (sub_jl = old_child.length);
        if (((sub_child = old_child[sub_j]) != null) && (sub_child !== true && sub_child !== false)) {
          sub_j++;
          old_child = sub_child;
          old_key = get_key(old_child);
          if (!(old_keyed && old_key && !old_keyed[old_key])) {
            break;
          }
        } else {
          if (sub_j < sub_jl) {
            sub_j++;
          } else {
            sub_j = sub_jl = 0;
            j++;
          }
        }
      }
    }
    if (!(child || old_child)) {
      break;
    }
    child_el = el.childNodes[el_i];
    if (!by_key && (key || old_key)) {
      by_key = true; // switch to keyed mode
      keyed = vnode[KEYED] = {};
      old_keyed = old_vnode && old_vnode[KEYED];
    }
    if (!(old_keyed && child && old_key !== key)) {
      // direct mutation unless key mismatch
      child_el = mutate_dom(el, child_el, child, old_child, NS);
    } else {
      // if there is key mismatch
      // we will replace current dom node
      // with an existing keyed or a new one
      if (replacement = old_keyed[key]) {
        replaced_el = mutate_dom(el, replacement[ELEMENT], child, replacement, NS);
      } else {
        replaced_el = make_el(child, NS);
      }
      el.insertBefore(replaced_el, child_el);
      if (old_child) {
        remove_el(el, child_el);
        if (old_key) {
          // destroy if not reused
          _sync.next(((old_key) => {
            return () => { // old_key closure
              if (old_keyed[old_key]) {
                return emmit_destroy(old_keyed[old_key]);
              }
            };
          })(old_key));
        } else {
          emmit_destroy(old_child);
        }
      }
      child_el = replaced_el;
    }
    if (child != null) {
      el_i++; // moving pointer to next DOM element
      if (key) {
        child[ELEMENT] = child_el;
        keyed[key] = child;
        old_keyed && (old_keyed[key] = null);
      }
    }
  }
  // end of loop
  if (old_keyed) {
// copying over unused cached keyed nodes
    for (k in old_keyed) {
      v = old_keyed[k];
      if (v) {
        keyed[k] = v;
      }
    }
  }
};

// This function will create a new DOM element with its children
make_el = (vnode, NS) => {
  var el, oncreate, shadow, shadow_props;
  if (vnode[VNODE]) {
    el = NS ? doc.createElementNS(NS, vnode[NAME]) : doc.createElement(vnode[NAME]);
    set_attr(el, vnode[ATTR], null, NS);
    if (shadow_props = vnode[ATTR] && vnode[ATTR].attachShadow) {
      shadow = vnode[SHADOW] = el.attachShadow(shadow_props);
      vnode.patch = (x, y) => {
        mutate_children(shadow, x, y, NS);
      };
      mutate_children(shadow, vnode, null, NS);
    } else {
      mutate_children(el, vnode, null, NS);
    }
    if (oncreate = vnode[ATTR] && vnode[ATTR].oncreate) {
      // executed later but syncronously
      _sync.render(() => {
        return oncreate(el);
      });
    }
    return el;
  } else {
    return doc.createTextNode(vnode);
  }
};

// Removing element from its parent
remove_el = (parent, el) => {
  parent.removeChild(el);
};

emmit_destroy = (vnode) => {
  var child, length, ondestroy;
  ({length} = vnode);
  while (length-- > 0) {
    if (isArray(child = vnode[length])) {
      emmit_destroy(child);
    }
  }
  if (ondestroy = vnode[ATTR] && vnode[ATTR].ondestroy) {
    ondestroy();
  }
};

// Comparing and setting attributes
set_attr = (el, attr, old_attr, NS) => {
  var k, old_v, v;
  if (old_attr) {
    for (k in old_attr) {
      old_v = old_attr[k];
      if (attr[k] == null) {
        set(el, k, null, old_v, NS);
      }
    }
  }
  for (k in attr) {
    v = attr[k];
    old_v = k === 'value' || k === 'checked' ? el[k] : old_attr && old_attr[k];
    if (v !== old_v) {
      set(el, k, v, old_v, NS);
    }
  }
};

set = (el, name, value, old_value, NS) => {
  var events, k, style, v;
  if (name === 'key' || name === 'attachShadow') {

  // skip
  } else if (name === 'style') {
    style = el[name];
    if (typeof value === 'string') {
      style.cssText = value;
    } else {
      if (typeof old_value === 'string') {
        style.cssText = '';
      } else {
        value = {...value};
        for (k in old_value) {
          if (value[k] == null) {
            value[k] = '';
          }
        }
      }
      for (k in value) {
        v = value[k];
        if (k.charCodeAt(0) === 45) { // starts with '-'
          style.setProperty(k, v);
        } else {
          style[k] = v;
        }
      }
    }
  } else {
    // starts with 'on', event listener
    if (name.charCodeAt(0) === 111 && name.charCodeAt(1) === 110) {
      name = name.slice(2);
      events = el[EVENTS] || (el[EVENTS] = {});
      old_value || (old_value = events[name]);
      events[name] = value;
      if (value) {
        if (!old_value) {
          el.addEventListener(name, eventHandler);
        }
      } else {
        el.removeEventListener(name, eventHandler);
      }
    // attribute
    } else if (name in el && (name !== 'list' && name !== 'type' && name !== 'draggable' && name !== 'spellcheck' && name !== 'translate') && !NS) {
      el[name] = value != null ? value : value = '';
    } else if ((value != null) && value !== false) {
      el.setAttribute(name, value);
    } else {
      el.removeAttribute(name);
    }
  }
};

// Getting a key from a virtual node
get_key = (vnode) => {
  return vnode && vnode[ATTR] && vnode[ATTR].key;
};
