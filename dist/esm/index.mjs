function noop() { }
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}
function subscribe(store, ...callbacks) {
    if (store == null) {
        return noop;
    }
    const unsub = store.subscribe(...callbacks);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function component_subscribe(component, store, callback) {
    component.$$.on_destroy.push(subscribe(store, callback));
}
function create_slot(definition, ctx, $$scope, fn) {
    if (definition) {
        const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
        return definition[0](slot_ctx);
    }
}
function get_slot_context(definition, ctx, $$scope, fn) {
    return definition[1] && fn
        ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
        : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
    if (definition[2] && fn) {
        const lets = definition[2](fn(dirty));
        if ($$scope.dirty === undefined) {
            return lets;
        }
        if (typeof lets === 'object') {
            const merged = [];
            const len = Math.max($$scope.dirty.length, lets.length);
            for (let i = 0; i < len; i += 1) {
                merged[i] = $$scope.dirty[i] | lets[i];
            }
            return merged;
        }
        return $$scope.dirty | lets;
    }
    return $$scope.dirty;
}
function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
    const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
    if (slot_changes) {
        const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
        slot.p(slot_context, slot_changes);
    }
}
function exclude_internal_props(props) {
    const result = {};
    for (const k in props)
        if (k[0] !== '$')
            result[k] = props[k];
    return result;
}
function compute_rest_props(props, keys) {
    const rest = {};
    keys = new Set(keys);
    for (const k in props)
        if (!keys.has(k) && k[0] !== '$')
            rest[k] = props[k];
    return rest;
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function element(name) {
    return document.createElement(name);
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function claim_element(nodes, name, attributes, svg) {
    for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        if (node.nodeName === name) {
            let j = 0;
            const remove = [];
            while (j < node.attributes.length) {
                const attribute = node.attributes[j++];
                if (!attributes[attribute.name]) {
                    remove.push(attribute.name);
                }
            }
            for (let k = 0; k < remove.length; k++) {
                node.removeAttribute(remove[k]);
            }
            return nodes.splice(i, 1)[0];
        }
    }
    return svg ? svg_element(name) : element(name);
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error('Function called outside component initialization');
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
function setContext(key, context) {
    get_current_component().$$.context.set(key, context);
}
function getContext(key) {
    return get_current_component().$$.context.get(key);
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
function add_flush_callback(fn) {
    flush_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    flushing = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
let outros;
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}

function get_spread_update(levels, updates) {
    const update = {};
    const to_null_out = {};
    const accounted_for = { $$scope: 1 };
    let i = levels.length;
    while (i--) {
        const o = levels[i];
        const n = updates[i];
        if (n) {
            for (const key in o) {
                if (!(key in n))
                    to_null_out[key] = 1;
            }
            for (const key in n) {
                if (!accounted_for[key]) {
                    update[key] = n[key];
                    accounted_for[key] = 1;
                }
            }
            levels[i] = n;
        }
        else {
            for (const key in o) {
                accounted_for[key] = 1;
            }
        }
    }
    for (const key in to_null_out) {
        if (!(key in update))
            update[key] = undefined;
    }
    return update;
}
function get_spread_object(spread_props) {
    return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
}

function bind(component, name, callback) {
    const index = component.$$.props[name];
    if (index !== undefined) {
        component.$$.bound[index] = callback;
        callback(component.$$.ctx[index]);
    }
}
function create_component(block) {
    block && block.c();
}
function claim_component(block, parent_nodes) {
    block && block.l(parent_nodes);
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const prop_values = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, prop_values, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
/**
 * Base class for Svelte components. Used when dev=false.
 */
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

const length = type => value => ({ type, value });

const length_defaults = { min: 0, max: Infinity };

const px = length('px');

const ratio = length('ratio');

const fill = length('fill');
Object.assign(fill, fill(1));

const grow = length('grow');
Object.assign(grow, grow(1));

const content = grow(0);

const format_length_property = length => typeof length === 'number' ? px(length) : length;

const format_length_object = ({ type, value, min = 0, max = Infinity }) => ({
	type,
	value,
	min: format_length_property(min),
	max: format_length_property(max)
});

const format_length = length =>
	format_length_object(format_length_property(length));

const modifier = prop => value => length => ({ ...format_length_property(length), [prop]: value });

const min = modifier('min');

const max = modifier('max');

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = ".element_ekolm46{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-flex-direction:row;-ms-flex-direction:row;flex-direction:row;-webkit-flex:0 0 auto;-ms-flex:0 0 auto;flex:0 0 auto;position:relative;box-sizing:border-box;overflow:visible;}\n";
styleInject(css_248z);

const target_value = ({
  type,
  value
}) => type === 'ratio' ? `${value * 100}%` : `${value}px`;

const length_css = (property, length) => {
  return [length.type === 'px' ? `${property}: ${length.value}px;` : '', length.min.value > 0 ? `min-${property}: ${target_value(length.min)};` : '', length.max.value === Infinity ? '' : `max-${property}: ${target_value(length.max)};`].join(' ');
};
/*
 * styles necessary for a dom node child of a layout container
 */
// static styles


const element$1 = "element_ekolm46";

const overflow_style = (axis, clip, scroll) => clip || scroll ? `overflow-${axis}: ${clip ? 'hidden' : 'auto'};` : ''; // dynamic styles


const element_style = ({
  height = content,
  width = content,
  padding,
  opacity,
  x,
  y,
  clip_x,
  clip_y,
  scroll_x,
  scroll_y
}) => [length_css('height', height), length_css('width', width), opacity == null ? '' : `opacity: ${opacity};`, padding == null ? '' : `padding: ${Array.isArray(padding) ? padding.map(n => `${n}px`).join(' ') : `${padding}px`};`, x || y ? `transform: translate3d(${x || 0}px, ${y || 0}px, 0);` : '', overflow_style('x', clip_x, scroll_x), overflow_style('y', clip_y, scroll_y)].join('');

const space_between = 'space-between';
const space_around = 'space-around';
const space_evenly = 'space-evenly';

var css_248z$1 = ".layout_lb7yjy4{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-flex-wrap:nowrap;-ms-flex-wrap:nowrap;flex-wrap:nowrap;-webkit-align-items:flex-start;-webkit-box-align:flex-start;-ms-flex-align:flex-start;align-items:flex-start;-webkit-box-pack:start;-webkit-justify-content:flex-start;-ms-flex-pack:start;justify-content:flex-start;}\n.layout_x_l1m6442m{-webkit-flex-direction:row;-ms-flex-direction:row;flex-direction:row;}\n.layout_y_l8o4g34{-webkit-flex-direction:column;-ms-flex-direction:column;flex-direction:column;}\n";
styleInject(css_248z$1);

/*
 * NOTE: an element with `{dimension}=fill` must specify a min-{dimension} (i.e. min-width: 0) or min-{dimension} will default to min-content,
 * potentially causing content to expand the parent beyond its fill size.
 */

const fill_main_axis = length => `flex-grow: ${length.value}; flex-basis: 0%; ${length.min ? '' : 'min-width: 0;'}`;

const fill_cross_axis = spacing => spacing ? `calc(100% - ${spacing}px)` : '100%';

const child_ratio_length = (property, parent, child) => child[property].type === 'ratio' ? `${property}: ${parent[property].type === 'grow' ? '0px' : `${child[property].value * 100}%`};` : '';
/*
 * styles necessary for a dom node containing one or more children (layout container)
 *
 * a layout container must choose an axis as its basis for layout, even if it can only contain one child
 */
// static styles


const layout = "layout_lb7yjy4"; // dynamic styles

const layout_style = ({
  wrap
}) => wrap ? 'flex-wrap: wrap; align-content: flex-start;' : ''; // static styles for x layout

const layout_x = "layout_x_l1m6442m";
const layout_child = (parent, child) => [child_ratio_length('height', parent, child), child_ratio_length('width', parent, child), parent.spacing_y ? `margin-top: ${parent.spacing_y}px;` : '', parent.spacing_x ? `margin-left: ${parent.spacing_x}px;` : ''].join('');
const layout_x_child = ({
  spacing_x = 0,
  spacing_y = 0
} = {}) => ({
  height,
  width
}) => [height.type === 'fill' ? `height: ${fill_cross_axis(spacing_y)};` : '', height.type === 'grow' && height.value > 0 ? `height: ${fill_cross_axis(spacing_y)};` : '', width.type === 'fill' ? fill_main_axis(width) : '', width.type === 'grow' ? `flex-grow: ${width.value};` : ''].join(''); // static styles for y layout

const layout_y = "layout_y_l8o4g34";
const layout_y_child = ({
  spacing_x = 0,
  spacing_y = 0
} = {}) => ({
  height,
  width
}) => [height.type === 'fill' ? fill_main_axis(height) : '', height.type === 'grow' ? `flex-grow: ${height.value};` : '', width.type === 'fill' ? `width: ${fill_cross_axis(spacing_x)};` : '', width.type === 'grow' && width.value > 0 ? `width: ${fill_cross_axis(spacing_x)};` : ''].join(''); // dynamic styles for x layout

const layout_x_style = ({
  align_bottom,
  center_y,
  align_right,
  center_x
}) => [align_right || center_x ? `justify-content: ${align_right ? 'flex-end' : 'center'};` : '', align_bottom || center_y ? `align-items: ${align_bottom ? 'flex-end' : 'center'};` : ''].join(''); // dynamic styles for y layout

const layout_y_style = ({
  align_bottom,
  center_y,
  align_right,
  center_x
}) => [align_bottom || center_y ? `justify-content: ${align_bottom ? 'flex-end' : 'center'};` : '', align_right || center_x ? `align-items: ${align_right ? 'flex-end' : 'center'};` : ''].join(''); // dynamic styles for layout with spacing

const spacing_context = (x, y) => [typeof x === 'number' ? `margin-left: -${x}px;` : '', typeof y === 'number' ? `margin-top: -${y}px;` : ''].join(''); // dynamic styles for x layout with spacing

const spacing_x_context = (x, y) => [typeof x === 'string' ? `justify-content: ${x};` : '', typeof y === 'string' ? `align-content: ${y};` : ''].join(''); // dynamic styles for y layout with spacing

const spacing_y_context = (x, y) => [typeof x === 'string' ? `align-content: ${x};` : '', typeof y === 'string' ? `justify-content: ${y};` : ''].join('');

const subscriber_queue = [];
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = [];
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (let i = 0; i < subscribers.length; i += 1) {
                    const s = subscribers[i];
                    s[1]();
                    subscriber_queue.push(s, value);
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.push(subscriber);
        if (subscribers.length === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            const index = subscribers.indexOf(subscriber);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
            if (subscribers.length === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}

/* src/Layout_context.svelte generated by Svelte v3.32.0 */

function create_fragment(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[3].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		l(nodes) {
			if (default_slot) default_slot.l(nodes);
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 4) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

const CONTEXT_KEY = Symbol();

const get_layout_context = () => getContext(CONTEXT_KEY) || {
	style: writable(layout_y_child()),
	class: ""
};

const set_layout_context = value => setContext(CONTEXT_KEY, value);

function instance($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { context_class = "" } = $$props;
	let { context_style = layout_y_child() } = $$props;
	const store = writable();
	set_layout_context({ style: store, class: context_class });

	$$self.$$set = $$props => {
		if ("context_class" in $$props) $$invalidate(0, context_class = $$props.context_class);
		if ("context_style" in $$props) $$invalidate(1, context_style = $$props.context_style);
		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*context_style*/ 2) {
			 store.set(context_style);
		}
	};

	return [context_class, context_style, $$scope, slots];
}

class Layout_context extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { context_class: 0, context_style: 1 });
	}
}

const concat = names => names.reduce((acc, value) => value ? `${acc} ${value}` : acc, '');

/* src/Element.svelte generated by Svelte v3.32.0 */

function create_default_slot(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[9].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		l(nodes) {
			if (default_slot) default_slot.l(nodes);
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 2048) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[11], dirty, null, null);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment$1(ctx) {
	let div;
	let layout_context;
	let div_style_value;
	let current;

	layout_context = new Layout_context({
			props: {
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			div = element("div");
			create_component(layout_context.$$.fragment);
			this.h();
		},
		l(nodes) {
			div = claim_element(nodes, "DIV", { class: true, style: true });
			var div_nodes = children(div);
			claim_component(layout_context.$$.fragment, div_nodes);
			div_nodes.forEach(detach);
			this.h();
		},
		h() {
			attr(div, "class", /*class_name*/ ctx[3]);
			attr(div, "style", div_style_value = "" + (element_style(/*props*/ ctx[2]) + /*$context_style*/ ctx[4](/*props*/ ctx[2]) + /*style*/ ctx[1]));
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(layout_context, div, null);
			/*div_binding*/ ctx[10](div);
			current = true;
		},
		p(ctx, [dirty]) {
			const layout_context_changes = {};

			if (dirty & /*$$scope*/ 2048) {
				layout_context_changes.$$scope = { dirty, ctx };
			}

			layout_context.$set(layout_context_changes);

			if (!current || dirty & /*class_name*/ 8) {
				attr(div, "class", /*class_name*/ ctx[3]);
			}

			if (!current || dirty & /*props, $context_style, style*/ 22 && div_style_value !== (div_style_value = "" + (element_style(/*props*/ ctx[2]) + /*$context_style*/ ctx[4](/*props*/ ctx[2]) + /*style*/ ctx[1]))) {
				attr(div, "style", div_style_value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(layout_context.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(layout_context.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(layout_context);
			/*div_binding*/ ctx[10](null);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let height;
	let width;
	let props;
	let class_name;
	let $context_style;
	let { $$slots: slots = {}, $$scope } = $$props;
	let { ref = undefined } = $$props;
	let { on = null } = $$props;
	let { style = "" } = $$props;

	onMount(() => {
		if (on) {
			const dispose = Object.keys(on).map(name => typeof on[name] === "function"
			? listen(ref, name, on[name])
			: listen(ref, name, on[name].listener, on[name].options));

			return () => run_all(dispose);
		}
	});

	const { style: context_style, class: context_class } = get_layout_context();
	component_subscribe($$self, context_style, value => $$invalidate(4, $context_style = value));

	function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			ref = $$value;
			$$invalidate(0, ref);
		});
	}

	$$self.$$set = $$new_props => {
		$$invalidate(13, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("ref" in $$new_props) $$invalidate(0, ref = $$new_props.ref);
		if ("on" in $$new_props) $$invalidate(6, on = $$new_props.on);
		if ("style" in $$new_props) $$invalidate(1, style = $$new_props.style);
		if ("$$scope" in $$new_props) $$invalidate(11, $$scope = $$new_props.$$scope);
	};

	$$self.$$.update = () => {
		 $$invalidate(7, height = format_length($$props.height || content));
		 $$invalidate(8, width = format_length($$props.width || content));
		 $$invalidate(2, props = { ...$$props, height, width });
		 $$invalidate(3, class_name = concat([$$props.class, context_class, element$1]));
	};

	$$props = exclude_internal_props($$props);

	return [
		ref,
		style,
		props,
		class_name,
		$context_style,
		context_style,
		on,
		height,
		width,
		slots,
		div_binding,
		$$scope
	];
}

class Element extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, { ref: 0, on: 6, style: 1 });
	}
}

var css_248z$2 = ".nearby_n1ymrolb{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;position:absolute;pointer-events:none;}\n.nearby_x_nc97fwj{top:0;z-index:1;height:100%;}\n.nearby_y_n1dmxc9z{left:0;z-index:1;width:100%;}\n.nearby_z_n91qj6k{top:0;left:0;height:100%;width:100%;}\n.in_back_i1ulrqav{z-index:0;}\n.in_front_i1xlmqx2{z-index:1;}\n.on_left_okq8kx3{right:100%;-webkit-box-pack:end;-webkit-justify-content:flex-end;-ms-flex-pack:end;justify-content:flex-end;}\n.on_right_o105wjvu{left:100%;}\n.above_ayr7vx7{bottom:100%;}\n.below_b1lubls{top:100%;}\n.nearby_child_n1iosxib{pointer-events:auto;}\n";
styleInject(css_248z$2);

const nearby = "nearby_n1ymrolb";
const nearby_x = "nearby_x_nc97fwj";
const nearby_y = "nearby_y_n1dmxc9z";
const nearby_z = "nearby_z_n91qj6k";
const in_back = "in_back_i1ulrqav";
const in_front = "in_front_i1xlmqx2";
const on_left = "on_left_okq8kx3";
const on_right = "on_right_o105wjvu";
const above = "above_ayr7vx7";
const below = "below_b1lubls";
const nearby_child = "nearby_child_n1iosxib";
const nearby_x_child = ({
  height
}) => height.type === 'fill' ? 'height: 100%;' : '';
const nearby_y_child = ({
  width
}) => width.type === 'fill' ? 'width: 100%;' : '';
const nearby_z_child = props => `${nearby_x_child(props)}${nearby_y_child(props)}`;

var css_248z$3 = ".box_b15mj1xn > :not(.nearby_n1ymrolb) ~ :not(.nearby_n1ymrolb){visibility:hidden;}.box_b15mj1xn > :not(.nearby_n1ymrolb) ~ :not(.nearby_n1ymrolb):before{content:\"Error: Box may only contain one child.\";visibility:visible;background:red;color:white;display:block;font-weight:bold;padding:30px;}.box_b15mj1xn > :not(.nearby_n1ymrolb) ~ :not(.nearby_n1ymrolb) ~ :not(.nearby_n1ymrolb):before{display:none;}\n";
styleInject(css_248z$3);

/* src/Box.svelte generated by Svelte v3.32.0 */

function create_default_slot_1(ctx) {
  let current;
  const default_slot_template =
  /*#slots*/
  ctx[5].default;
  const default_slot = create_slot(default_slot_template, ctx,
  /*$$scope*/
  ctx[7], null);
  return {
    c() {
      if (default_slot) default_slot.c();
    },

    l(nodes) {
      if (default_slot) default_slot.l(nodes);
    },

    m(target, anchor) {
      if (default_slot) {
        default_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (default_slot) {
        if (default_slot.p && dirty &
        /*$$scope*/
        128) {
          update_slot(default_slot, default_slot_template, ctx,
          /*$$scope*/
          ctx[7], dirty, null, null);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },

    o(local) {
      transition_out(default_slot, local);
      current = false;
    },

    d(detaching) {
      if (default_slot) default_slot.d(detaching);
    }

  };
} // (32:0) <Element  bind:ref  { ...$$restProps }  class="{ classname_concat([ $$props.class, box, layout_x, layout ]) }"  style="{ layout_x_style($$props) }{ style }" >


function create_default_slot$1(ctx) {
  let layout_context;
  let current;
  layout_context = new Layout_context({
    props: {
      context_style: layout_x_child(),
      $$slots: {
        default: [create_default_slot_1]
      },
      $$scope: {
        ctx
      }
    }
  });
  return {
    c() {
      create_component(layout_context.$$.fragment);
    },

    l(nodes) {
      claim_component(layout_context.$$.fragment, nodes);
    },

    m(target, anchor) {
      mount_component(layout_context, target, anchor);
      current = true;
    },

    p(ctx, dirty) {
      const layout_context_changes = {};

      if (dirty &
      /*$$scope*/
      128) {
        layout_context_changes.$$scope = {
          dirty,
          ctx
        };
      }

      layout_context.$set(layout_context_changes);
    },

    i(local) {
      if (current) return;
      transition_in(layout_context.$$.fragment, local);
      current = true;
    },

    o(local) {
      transition_out(layout_context.$$.fragment, local);
      current = false;
    },

    d(detaching) {
      destroy_component(layout_context, detaching);
    }

  };
}

function create_fragment$2(ctx) {
  let element_1;
  let updating_ref;
  let current;
  const element_1_spread_levels = [
  /*$$restProps*/
  ctx[3], {
    class: concat([
    /*$$props*/
    ctx[4].class,
    /*box*/
    ctx[2], layout_x, layout])
  }, {
    style: "" + (layout_x_style(
    /*$$props*/
    ctx[4]) +
    /*style*/
    ctx[1])
  }];

  function element_1_ref_binding(value) {
    /*element_1_ref_binding*/
    ctx[6].call(null, value);
  }

  let element_1_props = {
    $$slots: {
      default: [create_default_slot$1]
    },
    $$scope: {
      ctx
    }
  };

  for (let i = 0; i < element_1_spread_levels.length; i += 1) {
    element_1_props = assign(element_1_props, element_1_spread_levels[i]);
  }

  if (
  /*ref*/
  ctx[0] !== void 0) {
    element_1_props.ref =
    /*ref*/
    ctx[0];
  }

  element_1 = new Element({
    props: element_1_props
  });
  binding_callbacks.push(() => bind(element_1, "ref", element_1_ref_binding));
  return {
    c() {
      create_component(element_1.$$.fragment);
    },

    l(nodes) {
      claim_component(element_1.$$.fragment, nodes);
    },

    m(target, anchor) {
      mount_component(element_1, target, anchor);
      current = true;
    },

    p(ctx, [dirty]) {
      const element_1_changes = dirty &
      /*$$restProps, classname_concat, $$props, box, layout_x, layout, layout_x_style, style*/
      30 ? get_spread_update(element_1_spread_levels, [dirty &
      /*$$restProps*/
      8 && get_spread_object(
      /*$$restProps*/
      ctx[3]), dirty &
      /*classname_concat, $$props, box, layout_x, layout*/
      20 && {
        class: concat([
        /*$$props*/
        ctx[4].class,
        /*box*/
        ctx[2], layout_x, layout])
      }, dirty &
      /*layout_x_style, $$props, style*/
      18 && {
        style: "" + (layout_x_style(
        /*$$props*/
        ctx[4]) +
        /*style*/
        ctx[1])
      }]) : {};

      if (dirty &
      /*$$scope*/
      128) {
        element_1_changes.$$scope = {
          dirty,
          ctx
        };
      }

      if (!updating_ref && dirty &
      /*ref*/
      1) {
        updating_ref = true;
        element_1_changes.ref =
        /*ref*/
        ctx[0];
        add_flush_callback(() => updating_ref = false);
      }

      element_1.$set(element_1_changes);
    },

    i(local) {
      if (current) return;
      transition_in(element_1.$$.fragment, local);
      current = true;
    },

    o(local) {
      transition_out(element_1.$$.fragment, local);
      current = false;
    },

    d(detaching) {
      destroy_component(element_1, detaching);
    }

  };
}

function instance$2($$self, $$props, $$invalidate) {
  const omit_props_names = ["ref", "style"];
  let $$restProps = compute_rest_props($$props, omit_props_names);
  let {
    $$slots: slots = {},
    $$scope
  } = $$props;
  const box = "box_b15mj1xn";
  let {
    ref = undefined
  } = $$props;
  let {
    style = ""
  } = $$props;

  function element_1_ref_binding(value) {
    ref = value;
    $$invalidate(0, ref);
  }

  $$self.$$set = $$new_props => {
    $$invalidate(4, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    $$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
    if ("ref" in $$new_props) $$invalidate(0, ref = $$new_props.ref);
    if ("style" in $$new_props) $$invalidate(1, style = $$new_props.style);
    if ("$$scope" in $$new_props) $$invalidate(7, $$scope = $$new_props.$$scope);
  };

  $$props = exclude_internal_props($$props);
  return [ref, style, box, $$restProps, $$props, slots, element_1_ref_binding, $$scope];
}

class Box extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$2, create_fragment$2, safe_not_equal, {
      ref: 0,
      style: 1
    });
  }

}

/* src/Aspect_ratio.svelte generated by Svelte v3.32.0 */

function create_in_back_slot(ctx) {
	let div;
	let current;
	const default_slot_template = /*#slots*/ ctx[3].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

	return {
		c() {
			div = element("div");
			if (default_slot) default_slot.c();
			this.h();
		},
		l(nodes) {
			div = claim_element(nodes, "DIV", { slot: true });
			var div_nodes = children(div);
			if (default_slot) default_slot.l(div_nodes);
			div_nodes.forEach(detach);
			this.h();
		},
		h() {
			attr(div, "slot", "in_back");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 16) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment$3(ctx) {
	let box;
	let current;

	box = new Box({
			props: {
				width: fill,
				style: "padding-bottom: " + /*height_percent*/ ctx[0] + "%",
				$$slots: { in_back: [create_in_back_slot] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(box.$$.fragment);
		},
		l(nodes) {
			claim_component(box.$$.fragment, nodes);
		},
		m(target, anchor) {
			mount_component(box, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const box_changes = {};
			if (dirty & /*height_percent*/ 1) box_changes.style = "padding-bottom: " + /*height_percent*/ ctx[0] + "%";

			if (dirty & /*$$scope*/ 16) {
				box_changes.$$scope = { dirty, ctx };
			}

			box.$set(box_changes);
		},
		i(local) {
			if (current) return;
			transition_in(box.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(box.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(box, detaching);
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { w = 0 } = $$props;
	let { h = 0 } = $$props;
	let height_percent;

	$$self.$$set = $$props => {
		if ("w" in $$props) $$invalidate(1, w = $$props.w);
		if ("h" in $$props) $$invalidate(2, h = $$props.h);
		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*h, w*/ 6) {
			 $$invalidate(0, height_percent = h / w * 100);
		}
	};

	return [height_percent, w, h, slots, $$scope];
}

class Aspect_ratio extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { w: 1, h: 2 });
	}
}

/* src/Layout.svelte generated by Svelte v3.32.0 */

function create_default_slot_1$1(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[16].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[18], null);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		l(nodes) {
			if (default_slot) default_slot.l(nodes);
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 262144) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[18], dirty, null, null);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

// (50:0) <Element  bind:ref  style={ outer_style }  { ...element_props } >
function create_default_slot$2(ctx) {
	let div;
	let layout_context_1;
	let div_class_value;
	let current;

	layout_context_1 = new Layout_context({
			props: {
				context_style: /*context_style*/ ctx[5],
				$$slots: { default: [create_default_slot_1$1] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			div = element("div");
			create_component(layout_context_1.$$.fragment);
			this.h();
		},
		l(nodes) {
			div = claim_element(nodes, "DIV", { class: true, style: true });
			var div_nodes = children(div);
			claim_component(layout_context_1.$$.fragment, div_nodes);
			div_nodes.forEach(detach);
			this.h();
		},
		h() {
			attr(div, "class", div_class_value = "" + (/*layout_class*/ ctx[1] + " " + layout));
			attr(div, "style", /*inner_style*/ ctx[3]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(layout_context_1, div, null);
			current = true;
		},
		p(ctx, dirty) {
			const layout_context_1_changes = {};
			if (dirty & /*context_style*/ 32) layout_context_1_changes.context_style = /*context_style*/ ctx[5];

			if (dirty & /*$$scope*/ 262144) {
				layout_context_1_changes.$$scope = { dirty, ctx };
			}

			layout_context_1.$set(layout_context_1_changes);

			if (!current || dirty & /*layout_class*/ 2 && div_class_value !== (div_class_value = "" + (/*layout_class*/ ctx[1] + " " + layout))) {
				attr(div, "class", div_class_value);
			}

			if (!current || dirty & /*inner_style*/ 8) {
				attr(div, "style", /*inner_style*/ ctx[3]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(layout_context_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(layout_context_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(layout_context_1);
		}
	};
}

function create_fragment$4(ctx) {
	let element_1;
	let updating_ref;
	let current;
	const element_1_spread_levels = [{ style: /*outer_style*/ ctx[2] }, /*element_props*/ ctx[4]];

	function element_1_ref_binding(value) {
		/*element_1_ref_binding*/ ctx[17].call(null, value);
	}

	let element_1_props = {
		$$slots: { default: [create_default_slot$2] },
		$$scope: { ctx }
	};

	for (let i = 0; i < element_1_spread_levels.length; i += 1) {
		element_1_props = assign(element_1_props, element_1_spread_levels[i]);
	}

	if (/*ref*/ ctx[0] !== void 0) {
		element_1_props.ref = /*ref*/ ctx[0];
	}

	element_1 = new Element({ props: element_1_props });
	binding_callbacks.push(() => bind(element_1, "ref", element_1_ref_binding));

	return {
		c() {
			create_component(element_1.$$.fragment);
		},
		l(nodes) {
			claim_component(element_1.$$.fragment, nodes);
		},
		m(target, anchor) {
			mount_component(element_1, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const element_1_changes = (dirty & /*outer_style, element_props*/ 20)
			? get_spread_update(element_1_spread_levels, [
					dirty & /*outer_style*/ 4 && { style: /*outer_style*/ ctx[2] },
					dirty & /*element_props*/ 16 && get_spread_object(/*element_props*/ ctx[4])
				])
			: {};

			if (dirty & /*$$scope, layout_class, inner_style, context_style*/ 262186) {
				element_1_changes.$$scope = { dirty, ctx };
			}

			if (!updating_ref && dirty & /*ref*/ 1) {
				updating_ref = true;
				element_1_changes.ref = /*ref*/ ctx[0];
				add_flush_callback(() => updating_ref = false);
			}

			element_1.$set(element_1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(element_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(element_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(element_1, detaching);
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	let outer_style;
	let inner_style;
	let height;
	let width;
	let element_props;
	let context_values;
	let context_style;

	const omit_props_names = [
		"container_style","style","ref","layout_class","layout_style","layout_spacing","layout_context","spacing_x","spacing_y"
	];

	let $$restProps = compute_rest_props($$props, omit_props_names);
	let { $$slots: slots = {}, $$scope } = $$props;
	let { container_style = "" } = $$props; // TODO: this is temporary, especially in case `align-content` is needed
	let { style = "" } = $$props;
	let { ref } = $$props;
	let { layout_class } = $$props;
	let { layout_style: layout_style$1 } = $$props;
	let { layout_spacing } = $$props;
	let { layout_context } = $$props;
	let { spacing_x = 0 } = $$props;
	let { spacing_y = 0 } = $$props;

	function element_1_ref_binding(value) {
		ref = value;
		$$invalidate(0, ref);
	}

	$$self.$$set = $$new_props => {
		$$invalidate(19, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		$$invalidate(20, $$restProps = compute_rest_props($$props, omit_props_names));
		if ("container_style" in $$new_props) $$invalidate(6, container_style = $$new_props.container_style);
		if ("style" in $$new_props) $$invalidate(7, style = $$new_props.style);
		if ("ref" in $$new_props) $$invalidate(0, ref = $$new_props.ref);
		if ("layout_class" in $$new_props) $$invalidate(1, layout_class = $$new_props.layout_class);
		if ("layout_style" in $$new_props) $$invalidate(8, layout_style$1 = $$new_props.layout_style);
		if ("layout_spacing" in $$new_props) $$invalidate(9, layout_spacing = $$new_props.layout_spacing);
		if ("layout_context" in $$new_props) $$invalidate(10, layout_context = $$new_props.layout_context);
		if ("spacing_x" in $$new_props) $$invalidate(11, spacing_x = $$new_props.spacing_x);
		if ("spacing_y" in $$new_props) $$invalidate(12, spacing_y = $$new_props.spacing_y);
		if ("$$scope" in $$new_props) $$invalidate(18, $$scope = $$new_props.$$scope);
	};

	$$self.$$.update = () => {
		 $$invalidate(2, outer_style = [layout_x_style($$props), style].join(""));

		 $$invalidate(3, inner_style = [
			"flex-grow: 1; align-self: stretch;",
			layout_style($$props),
			layout_style$1($$props),
			layout_spacing(spacing_x, spacing_y),
			spacing_context(spacing_x, spacing_y),
			container_style
		].join(""));

		 $$invalidate(13, height = format_length($$props.height || content));
		 $$invalidate(14, width = format_length($$props.width || content));
		 $$invalidate(4, element_props = { ...$$restProps, height, width });

		if ($$self.$$.dirty & /*height, width, spacing_x, spacing_y*/ 30720) {
			 $$invalidate(15, context_values = {
				height,
				width,
				spacing_x: typeof spacing_x === "number" ? spacing_x : 0,
				spacing_y: typeof spacing_y === "number" ? spacing_y : 0
			});
		}

		if ($$self.$$.dirty & /*context_values, layout_context*/ 33792) {
			 $$invalidate(5, context_style = props => `${layout_child(context_values, props)}${layout_context(context_values)(props)}`);
		}
	};

	$$props = exclude_internal_props($$props);

	return [
		ref,
		layout_class,
		outer_style,
		inner_style,
		element_props,
		context_style,
		container_style,
		style,
		layout_style$1,
		layout_spacing,
		layout_context,
		spacing_x,
		spacing_y,
		height,
		width,
		context_values,
		slots,
		element_1_ref_binding,
		$$scope
	];
}

class Layout extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
			container_style: 6,
			style: 7,
			ref: 0,
			layout_class: 1,
			layout_style: 8,
			layout_spacing: 9,
			layout_context: 10,
			spacing_x: 11,
			spacing_y: 12
		});
	}
}

/* src/Column.svelte generated by Svelte v3.32.0 */

function create_default_slot$3(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[3].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		l(nodes) {
			if (default_slot) default_slot.l(nodes);
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 32) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment$5(ctx) {
	let layout;
	let updating_ref;
	let current;

	const layout_spread_levels = [
		/*$$restProps*/ ctx[1],
		{
			class: concat([/*$$props*/ ctx[2].class, "column"])
		},
		{
			spacing_x: /*$$props*/ ctx[2].wrap
			? /*$$props*/ ctx[2].spacing_x || /*$$props*/ ctx[2].spacing
			: 0
		},
		{
			spacing_y: /*$$props*/ ctx[2].spacing_y || /*$$props*/ ctx[2].spacing
		},
		{ layout_class: layout_y },
		{ layout_style: layout_y_style },
		{ layout_spacing: spacing_y_context },
		{ layout_context: layout_y_child }
	];

	function layout_ref_binding(value) {
		/*layout_ref_binding*/ ctx[4].call(null, value);
	}

	let layout_props = {
		$$slots: { default: [create_default_slot$3] },
		$$scope: { ctx }
	};

	for (let i = 0; i < layout_spread_levels.length; i += 1) {
		layout_props = assign(layout_props, layout_spread_levels[i]);
	}

	if (/*ref*/ ctx[0] !== void 0) {
		layout_props.ref = /*ref*/ ctx[0];
	}

	layout = new Layout({ props: layout_props });
	binding_callbacks.push(() => bind(layout, "ref", layout_ref_binding));

	return {
		c() {
			create_component(layout.$$.fragment);
		},
		l(nodes) {
			claim_component(layout.$$.fragment, nodes);
		},
		m(target, anchor) {
			mount_component(layout, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const layout_changes = (dirty & /*$$restProps, classname_concat, $$props, layout_y, layout_y_style, spacing_y_context, layout_y_child*/ 6)
			? get_spread_update(layout_spread_levels, [
					dirty & /*$$restProps*/ 2 && get_spread_object(/*$$restProps*/ ctx[1]),
					dirty & /*classname_concat, $$props*/ 4 && {
						class: concat([/*$$props*/ ctx[2].class, "column"])
					},
					dirty & /*$$props*/ 4 && {
						spacing_x: /*$$props*/ ctx[2].wrap
						? /*$$props*/ ctx[2].spacing_x || /*$$props*/ ctx[2].spacing
						: 0
					},
					dirty & /*$$props*/ 4 && {
						spacing_y: /*$$props*/ ctx[2].spacing_y || /*$$props*/ ctx[2].spacing
					},
					dirty & /*layout_y*/ 0 && { layout_class: layout_y },
					dirty & /*layout_y_style*/ 0 && { layout_style: layout_y_style },
					dirty & /*spacing_y_context*/ 0 && { layout_spacing: spacing_y_context },
					dirty & /*layout_y_child*/ 0 && { layout_context: layout_y_child }
				])
			: {};

			if (dirty & /*$$scope*/ 32) {
				layout_changes.$$scope = { dirty, ctx };
			}

			if (!updating_ref && dirty & /*ref*/ 1) {
				updating_ref = true;
				layout_changes.ref = /*ref*/ ctx[0];
				add_flush_callback(() => updating_ref = false);
			}

			layout.$set(layout_changes);
		},
		i(local) {
			if (current) return;
			transition_in(layout.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(layout.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(layout, detaching);
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	const omit_props_names = ["ref"];
	let $$restProps = compute_rest_props($$props, omit_props_names);
	let { $$slots: slots = {}, $$scope } = $$props;
	let { ref = undefined } = $$props;

	function layout_ref_binding(value) {
		ref = value;
		$$invalidate(0, ref);
	}

	$$self.$$set = $$new_props => {
		$$invalidate(2, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
		if ("ref" in $$new_props) $$invalidate(0, ref = $$new_props.ref);
		if ("$$scope" in $$new_props) $$invalidate(5, $$scope = $$new_props.$$scope);
	};

	$$props = exclude_internal_props($$props);
	return [ref, $$restProps, $$props, slots, layout_ref_binding, $$scope];
}

class Column extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$5, create_fragment$5, safe_not_equal, { ref: 0 });
	}
}

var css_248z$4 = ".image_i1b6qkac > img{display:block;object-fit:cover;}\n";
styleInject(css_248z$4);

const image = "image_i1b6qkac";

/* src/Image.svelte generated by Svelte v3.32.0 */

function create_default_slot$4(ctx) {
	let img;
	let img_src_value;

	return {
		c() {
			img = element("img");
			this.h();
		},
		l(nodes) {
			img = claim_element(nodes, "IMG", {
				src: true,
				alt: true,
				width: true,
				height: true,
				style: true
			});

			this.h();
		},
		h() {
			if (img.src !== (img_src_value = /*src*/ ctx[1])) attr(img, "src", img_src_value);
			attr(img, "alt", /*description*/ ctx[2]);
			attr(img, "width", /*width*/ ctx[4]);
			attr(img, "height", /*height*/ ctx[5]);
			attr(img, "style", /*style*/ ctx[3]);
		},
		m(target, anchor) {
			insert(target, img, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*src*/ 2 && img.src !== (img_src_value = /*src*/ ctx[1])) {
				attr(img, "src", img_src_value);
			}

			if (dirty & /*description*/ 4) {
				attr(img, "alt", /*description*/ ctx[2]);
			}

			if (dirty & /*width*/ 16) {
				attr(img, "width", /*width*/ ctx[4]);
			}

			if (dirty & /*height*/ 32) {
				attr(img, "height", /*height*/ ctx[5]);
			}

			if (dirty & /*style*/ 8) {
				attr(img, "style", /*style*/ ctx[3]);
			}
		},
		d(detaching) {
			if (detaching) detach(img);
		}
	};
}

function create_fragment$6(ctx) {
	let box;
	let updating_ref;
	let current;

	const box_spread_levels = [
		/*$$restProps*/ ctx[7],
		{
			class: [/*$$props*/ ctx[6].class || "", image].join(" ")
		}
	];

	function box_ref_binding(value) {
		/*box_ref_binding*/ ctx[12].call(null, value);
	}

	let box_props = {
		$$slots: { default: [create_default_slot$4] },
		$$scope: { ctx }
	};

	for (let i = 0; i < box_spread_levels.length; i += 1) {
		box_props = assign(box_props, box_spread_levels[i]);
	}

	if (/*ref*/ ctx[0] !== void 0) {
		box_props.ref = /*ref*/ ctx[0];
	}

	box = new Box({ props: box_props });
	binding_callbacks.push(() => bind(box, "ref", box_ref_binding));

	return {
		c() {
			create_component(box.$$.fragment);
		},
		l(nodes) {
			claim_component(box.$$.fragment, nodes);
		},
		m(target, anchor) {
			mount_component(box, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const box_changes = (dirty & /*$$restProps, $$props, image*/ 192)
			? get_spread_update(box_spread_levels, [
					dirty & /*$$restProps*/ 128 && get_spread_object(/*$$restProps*/ ctx[7]),
					dirty & /*$$props, image*/ 64 && {
						class: [/*$$props*/ ctx[6].class || "", image].join(" ")
					}
				])
			: {};

			if (dirty & /*$$scope, src, description, width, height, style*/ 8254) {
				box_changes.$$scope = { dirty, ctx };
			}

			if (!updating_ref && dirty & /*ref*/ 1) {
				updating_ref = true;
				box_changes.ref = /*ref*/ ctx[0];
				add_flush_callback(() => updating_ref = false);
			}

			box.$set(box_changes);
		},
		i(local) {
			if (current) return;
			transition_in(box.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(box.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(box, detaching);
		}
	};
}

function instance$6($$self, $$props, $$invalidate) {
	let height_prop;
	let width_prop;
	let style;
	let width;
	let height;
	const omit_props_names = ["ref","src","description","origin_x","origin_y"];
	let $$restProps = compute_rest_props($$props, omit_props_names);
	let { ref = undefined } = $$props;
	let { src } = $$props;
	let { description } = $$props;
	let { origin_x = 0 } = $$props;
	let { origin_y = 0 } = $$props;

	function box_ref_binding(value) {
		ref = value;
		$$invalidate(0, ref);
	}

	$$self.$$set = $$new_props => {
		$$invalidate(6, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		$$invalidate(7, $$restProps = compute_rest_props($$props, omit_props_names));
		if ("ref" in $$new_props) $$invalidate(0, ref = $$new_props.ref);
		if ("src" in $$new_props) $$invalidate(1, src = $$new_props.src);
		if ("description" in $$new_props) $$invalidate(2, description = $$new_props.description);
		if ("origin_x" in $$new_props) $$invalidate(8, origin_x = $$new_props.origin_x);
		if ("origin_y" in $$new_props) $$invalidate(9, origin_y = $$new_props.origin_y);
	};

	$$self.$$.update = () => {
		 $$invalidate(10, height_prop = format_length($$props.height || content));
		 $$invalidate(11, width_prop = format_length($$props.width || content));

		if ($$self.$$.dirty & /*origin_x, origin_y, height_prop, width_prop*/ 3840) {
			 $$invalidate(3, style = [
				`object-position: ${origin_x * 100}% ${origin_y * 100}%;`,
				height_prop.type !== "content" ? `height: 100%;` : "",
				width_prop.type !== "content" ? `width: 100%;` : ""
			].join(""));
		}

		if ($$self.$$.dirty & /*width_prop*/ 2048) {
			 $$invalidate(4, width = width_prop.type === "px" ? width_prop.value : null);
		}

		if ($$self.$$.dirty & /*height_prop*/ 1024) {
			 $$invalidate(5, height = height_prop.type === "px" ? height_prop.value : null);
		}
	};

	$$props = exclude_internal_props($$props);

	return [
		ref,
		src,
		description,
		style,
		width,
		height,
		$$props,
		$$restProps,
		origin_x,
		origin_y,
		height_prop,
		width_prop,
		box_ref_binding
	];
}

class Image extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
			ref: 0,
			src: 1,
			description: 2,
			origin_x: 8,
			origin_y: 9
		});
	}
}

/* src/Row.svelte generated by Svelte v3.32.0 */

function create_default_slot$5(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[3].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		l(nodes) {
			if (default_slot) default_slot.l(nodes);
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 32) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment$7(ctx) {
	let layout;
	let updating_ref;
	let current;

	const layout_spread_levels = [
		/*$$restProps*/ ctx[1],
		{
			class: concat([/*$$props*/ ctx[2].class, "row"])
		},
		{
			spacing_x: /*$$props*/ ctx[2].spacing_x || /*$$props*/ ctx[2].spacing
		},
		{
			spacing_y: /*$$props*/ ctx[2].wrap
			? /*$$props*/ ctx[2].spacing_y || /*$$props*/ ctx[2].spacing
			: 0
		},
		{ layout_class: layout_x },
		{ layout_style: layout_x_style },
		{ layout_spacing: spacing_x_context },
		{ layout_context: layout_x_child }
	];

	function layout_ref_binding(value) {
		/*layout_ref_binding*/ ctx[4].call(null, value);
	}

	let layout_props = {
		$$slots: { default: [create_default_slot$5] },
		$$scope: { ctx }
	};

	for (let i = 0; i < layout_spread_levels.length; i += 1) {
		layout_props = assign(layout_props, layout_spread_levels[i]);
	}

	if (/*ref*/ ctx[0] !== void 0) {
		layout_props.ref = /*ref*/ ctx[0];
	}

	layout = new Layout({ props: layout_props });
	binding_callbacks.push(() => bind(layout, "ref", layout_ref_binding));

	return {
		c() {
			create_component(layout.$$.fragment);
		},
		l(nodes) {
			claim_component(layout.$$.fragment, nodes);
		},
		m(target, anchor) {
			mount_component(layout, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const layout_changes = (dirty & /*$$restProps, classname_concat, $$props, layout_x, layout_x_style, spacing_x_context, layout_x_child*/ 6)
			? get_spread_update(layout_spread_levels, [
					dirty & /*$$restProps*/ 2 && get_spread_object(/*$$restProps*/ ctx[1]),
					dirty & /*classname_concat, $$props*/ 4 && {
						class: concat([/*$$props*/ ctx[2].class, "row"])
					},
					dirty & /*$$props*/ 4 && {
						spacing_x: /*$$props*/ ctx[2].spacing_x || /*$$props*/ ctx[2].spacing
					},
					dirty & /*$$props*/ 4 && {
						spacing_y: /*$$props*/ ctx[2].wrap
						? /*$$props*/ ctx[2].spacing_y || /*$$props*/ ctx[2].spacing
						: 0
					},
					dirty & /*layout_x*/ 0 && { layout_class: layout_x },
					dirty & /*layout_x_style*/ 0 && { layout_style: layout_x_style },
					dirty & /*spacing_x_context*/ 0 && { layout_spacing: spacing_x_context },
					dirty & /*layout_x_child*/ 0 && { layout_context: layout_x_child }
				])
			: {};

			if (dirty & /*$$scope*/ 32) {
				layout_changes.$$scope = { dirty, ctx };
			}

			if (!updating_ref && dirty & /*ref*/ 1) {
				updating_ref = true;
				layout_changes.ref = /*ref*/ ctx[0];
				add_flush_callback(() => updating_ref = false);
			}

			layout.$set(layout_changes);
		},
		i(local) {
			if (current) return;
			transition_in(layout.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(layout.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(layout, detaching);
		}
	};
}

function instance$7($$self, $$props, $$invalidate) {
	const omit_props_names = ["ref"];
	let $$restProps = compute_rest_props($$props, omit_props_names);
	let { $$slots: slots = {}, $$scope } = $$props;
	let { ref = undefined } = $$props;

	function layout_ref_binding(value) {
		ref = value;
		$$invalidate(0, ref);
	}

	$$self.$$set = $$new_props => {
		$$invalidate(2, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		$$invalidate(1, $$restProps = compute_rest_props($$props, omit_props_names));
		if ("ref" in $$new_props) $$invalidate(0, ref = $$new_props.ref);
		if ("$$scope" in $$new_props) $$invalidate(5, $$scope = $$new_props.$$scope);
	};

	$$props = exclude_internal_props($$props);
	return [ref, $$restProps, $$props, slots, layout_ref_binding, $$scope];
}

class Row extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$7, create_fragment$7, safe_not_equal, { ref: 0 });
	}
}

/* src/Nearby.svelte generated by Svelte v3.32.0 */

function create_default_slot$6(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[2].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		l(nodes) {
			if (default_slot) default_slot.l(nodes);
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 8) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment$8(ctx) {
	let div;
	let layout_context;
	let div_class_value;
	let current;

	layout_context = new Layout_context({
			props: {
				context_class: nearby_child,
				context_style: /*context_style*/ ctx[0],
				$$slots: { default: [create_default_slot$6] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			div = element("div");
			create_component(layout_context.$$.fragment);
			this.h();
		},
		l(nodes) {
			div = claim_element(nodes, "DIV", { class: true });
			var div_nodes = children(div);
			claim_component(layout_context.$$.fragment, div_nodes);
			div_nodes.forEach(detach);
			this.h();
		},
		h() {
			attr(div, "class", div_class_value = "" + (nearby + " " + /*$$props*/ ctx[1].class));
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(layout_context, div, null);
			current = true;
		},
		p(ctx, [dirty]) {
			const layout_context_changes = {};
			if (dirty & /*context_style*/ 1) layout_context_changes.context_style = /*context_style*/ ctx[0];

			if (dirty & /*$$scope*/ 8) {
				layout_context_changes.$$scope = { dirty, ctx };
			}

			layout_context.$set(layout_context_changes);

			if (!current || dirty & /*$$props*/ 2 && div_class_value !== (div_class_value = "" + (nearby + " " + /*$$props*/ ctx[1].class))) {
				attr(div, "class", div_class_value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(layout_context.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(layout_context.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(layout_context);
		}
	};
}

function instance$8($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { context_style } = $$props;

	$$self.$$set = $$new_props => {
		$$invalidate(1, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("context_style" in $$new_props) $$invalidate(0, context_style = $$new_props.context_style);
		if ("$$scope" in $$new_props) $$invalidate(3, $$scope = $$new_props.$$scope);
	};

	$$props = exclude_internal_props($$props);
	return [context_style, $$props, slots, $$scope];
}

class Nearby extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$8, create_fragment$8, safe_not_equal, { context_style: 0 });
	}
}

/* src/Above.svelte generated by Svelte v3.32.0 */

function create_default_slot$7(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[0].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		l(nodes) {
			if (default_slot) default_slot.l(nodes);
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 2) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment$9(ctx) {
	let nearby;
	let current;

	nearby = new Nearby({
			props: {
				class: "" + (above + " " + nearby_y),
				context_style: nearby_y_child,
				$$slots: { default: [create_default_slot$7] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(nearby.$$.fragment);
		},
		l(nodes) {
			claim_component(nearby.$$.fragment, nodes);
		},
		m(target, anchor) {
			mount_component(nearby, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const nearby_changes = {};

			if (dirty & /*$$scope*/ 2) {
				nearby_changes.$$scope = { dirty, ctx };
			}

			nearby.$set(nearby_changes);
		},
		i(local) {
			if (current) return;
			transition_in(nearby.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(nearby.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(nearby, detaching);
		}
	};
}

function instance$9($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	$$self.$$set = $$props => {
		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [slots, $$scope];
}

class Above extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});
	}
}

/* src/Below.svelte generated by Svelte v3.32.0 */

function create_default_slot$8(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[0].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		l(nodes) {
			if (default_slot) default_slot.l(nodes);
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 2) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment$a(ctx) {
	let nearby;
	let current;

	nearby = new Nearby({
			props: {
				class: "" + (below + " " + nearby_y),
				context_style: nearby_y_child,
				$$slots: { default: [create_default_slot$8] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(nearby.$$.fragment);
		},
		l(nodes) {
			claim_component(nearby.$$.fragment, nodes);
		},
		m(target, anchor) {
			mount_component(nearby, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const nearby_changes = {};

			if (dirty & /*$$scope*/ 2) {
				nearby_changes.$$scope = { dirty, ctx };
			}

			nearby.$set(nearby_changes);
		},
		i(local) {
			if (current) return;
			transition_in(nearby.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(nearby.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(nearby, detaching);
		}
	};
}

function instance$a($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	$$self.$$set = $$props => {
		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [slots, $$scope];
}

class Below extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});
	}
}

/* src/On_left.svelte generated by Svelte v3.32.0 */

function create_default_slot$9(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[0].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		l(nodes) {
			if (default_slot) default_slot.l(nodes);
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 2) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment$b(ctx) {
	let nearby;
	let current;

	nearby = new Nearby({
			props: {
				class: "" + (on_left + " " + nearby_x),
				context_style: nearby_x_child,
				$$slots: { default: [create_default_slot$9] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(nearby.$$.fragment);
		},
		l(nodes) {
			claim_component(nearby.$$.fragment, nodes);
		},
		m(target, anchor) {
			mount_component(nearby, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const nearby_changes = {};

			if (dirty & /*$$scope*/ 2) {
				nearby_changes.$$scope = { dirty, ctx };
			}

			nearby.$set(nearby_changes);
		},
		i(local) {
			if (current) return;
			transition_in(nearby.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(nearby.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(nearby, detaching);
		}
	};
}

function instance$b($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	$$self.$$set = $$props => {
		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [slots, $$scope];
}

class On_left extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});
	}
}

/* src/On_right.svelte generated by Svelte v3.32.0 */

function create_default_slot$a(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[0].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		l(nodes) {
			if (default_slot) default_slot.l(nodes);
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 2) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment$c(ctx) {
	let nearby;
	let current;

	nearby = new Nearby({
			props: {
				class: "" + (on_right + " " + nearby_x),
				context_style: nearby_x_child,
				$$slots: { default: [create_default_slot$a] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(nearby.$$.fragment);
		},
		l(nodes) {
			claim_component(nearby.$$.fragment, nodes);
		},
		m(target, anchor) {
			mount_component(nearby, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const nearby_changes = {};

			if (dirty & /*$$scope*/ 2) {
				nearby_changes.$$scope = { dirty, ctx };
			}

			nearby.$set(nearby_changes);
		},
		i(local) {
			if (current) return;
			transition_in(nearby.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(nearby.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(nearby, detaching);
		}
	};
}

function instance$c($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	$$self.$$set = $$props => {
		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [slots, $$scope];
}

class On_right extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});
	}
}

/* src/In_back.svelte generated by Svelte v3.32.0 */

function create_default_slot$b(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[0].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		l(nodes) {
			if (default_slot) default_slot.l(nodes);
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 2) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment$d(ctx) {
	let nearby;
	let current;

	nearby = new Nearby({
			props: {
				class: "" + (in_back + " " + nearby_z),
				context_style: nearby_z_child,
				$$slots: { default: [create_default_slot$b] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(nearby.$$.fragment);
		},
		l(nodes) {
			claim_component(nearby.$$.fragment, nodes);
		},
		m(target, anchor) {
			mount_component(nearby, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const nearby_changes = {};

			if (dirty & /*$$scope*/ 2) {
				nearby_changes.$$scope = { dirty, ctx };
			}

			nearby.$set(nearby_changes);
		},
		i(local) {
			if (current) return;
			transition_in(nearby.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(nearby.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(nearby, detaching);
		}
	};
}

function instance$d($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	$$self.$$set = $$props => {
		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [slots, $$scope];
}

class In_back extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});
	}
}

/* src/In_front.svelte generated by Svelte v3.32.0 */

function create_default_slot$c(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[0].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		l(nodes) {
			if (default_slot) default_slot.l(nodes);
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 2) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment$e(ctx) {
	let layout_context;
	let current;

	layout_context = new Layout_context({
			props: {
				context_class: "" + (in_front + " " + nearby_z + " " + nearby),
				context_style: nearby_z_child,
				$$slots: { default: [create_default_slot$c] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(layout_context.$$.fragment);
		},
		l(nodes) {
			claim_component(layout_context.$$.fragment, nodes);
		},
		m(target, anchor) {
			mount_component(layout_context, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const layout_context_changes = {};

			if (dirty & /*$$scope*/ 2) {
				layout_context_changes.$$scope = { dirty, ctx };
			}

			layout_context.$set(layout_context_changes);
		},
		i(local) {
			if (current) return;
			transition_in(layout_context.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(layout_context.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(layout_context, detaching);
		}
	};
}

function instance$e($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	$$self.$$set = $$props => {
		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [slots, $$scope];
}

class In_front extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});
	}
}

export { Above, Aspect_ratio, Below, Box, Column, Image, In_back, In_front, On_left, On_right, Row, content, fill, format_length, format_length_property, grow, length_defaults, max, min, px, ratio, space_around, space_between, space_evenly };
