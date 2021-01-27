'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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
function compute_slots(slots) {
    const result = {};
    for (const key in slots) {
        result[key] = true;
    }
    return result;
}
function null_to_empty(value) {
    return value == null ? '' : value;
}
function action_destroyer(action_result) {
    return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
}

function append(target, node) {
    target.appendChild(node);
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
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function set_attributes(node, attributes) {
    // @ts-ignore
    const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
    for (const key in attributes) {
        if (attributes[key] == null) {
            node.removeAttribute(key);
        }
        else if (key === 'style') {
            node.style.cssText = attributes[key];
        }
        else if (key === '__value') {
            node.value = node[key] = attributes[key];
        }
        else if (descriptors[key] && descriptors[key].set) {
            node[key] = attributes[key];
        }
        else {
            attr(node, key, attributes[key]);
        }
    }
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
function claim_text(nodes, data) {
    for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        if (node.nodeType === 3) {
            node.data = '' + data;
            return nodes.splice(i, 1)[0];
        }
    }
    return text(data);
}
function claim_space(nodes) {
    return claim_text(nodes, ' ');
}
function set_style(node, key, value, important) {
    node.style.setProperty(key, value, important ? 'important' : '');
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
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
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

var css_248z = ".element_ekolm46[data-height-base=px]{height:var(--height-base-value);}.element_ekolm46[data-width-base=px]{width:var(--width-base-value);}.element_ekolm46:not(:first-child){margin-top:var(--context-spacing-y);margin-left:var(--context-spacing-x);}\n";
styleInject(css_248z);

const element$1 = "element_ekolm46";

var css_248z$1 = ".nearby_n1ymrolb{position:static;margin:0;pointer-events:none;}\n.nearby_container_nc97fwj{position:absolute !important;pointer-events:auto !important;z-index:1;}\n.nearby_x_n1dmxc9z{top:0;height:100%;-webkit-align-items:flex-start;-webkit-box-align:flex-start;-ms-flex-align:flex-start;align-items:flex-start;}.nearby_x_n1dmxc9z > .element_ekolm46[data-height-base=fill]{height:100%;}\n.nearby_y_n91qj6k{left:0;width:100%;}.nearby_y_n91qj6k > .element_ekolm46[data-width-base=fill]{width:100%;}\n.in_back_i1ulrqav{z-index:0;}\n.on_left_o1xlmqx2{right:100%;-webkit-box-pack:end;-webkit-justify-content:flex-end;-ms-flex-pack:end;justify-content:flex-end;}\n.on_right_okq8kx3{left:100%;}\n.above_a105wjvu{bottom:100%;}\n.below_byr7vx7{top:100%;}\n";
styleInject(css_248z$1);

const nearby = "nearby_n1ymrolb";
const nearby_container = "nearby_container_nc97fwj";
const nearby_x = "nearby_x_n1dmxc9z";
const nearby_y = "nearby_y_n91qj6k";
const in_back = "in_back_i1ulrqav";
const on_left = "on_left_o1xlmqx2";
const on_right = "on_right_okq8kx3";
const above = "above_a105wjvu";
const below = "below_byr7vx7";

/* src/Spacing_Context.svelte generated by Svelte v3.32.0 */

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
const get_spacing_context = () => getContext(CONTEXT_KEY) || { x: 0, y: 0 };
const set_spacing_context = value => setContext(CONTEXT_KEY, value);

function instance($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { x = 0 } = $$props;
	let { y = 0 } = $$props;
	set_spacing_context({ x, y });

	$$self.$$set = $$props => {
		if ("x" in $$props) $$invalidate(0, x = $$props.x);
		if ("y" in $$props) $$invalidate(1, y = $$props.y);
		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
	};

	return [x, y, $$scope, slots];
}

class Spacing_Context extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { x: 0, y: 1 });
	}
}

var css_248z$2 = ".reset_rcbd2q{-webkit-align-self:auto;-ms-flex-item-align:auto;align-self:auto;border-color:#000000;border-style:solid;border-width:0;box-sizing:border-box;color:inherit;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-flex-basis:auto;-ms-flex-preferred-size:auto;flex-basis:auto;-webkit-flex-direction:row;-ms-flex-direction:row;flex-direction:row;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;-webkit-flex-wrap:nowrap;-ms-flex-wrap:nowrap;flex-wrap:nowrap;font-family:inherit;font-size:inherit;font-style:inherit;font-weight:inherit;line-height:1;margin:0;opacity:1;padding:0;position:relative;resize:none;-webkit-text-decoration:none;text-decoration:none;}\n";
styleInject(css_248z$2);

const reset = "reset_rcbd2q";

const length_defaults = { min: 0, max: Infinity };

const fill = (portion = 1) => ({ base: { type: 'fill', value: portion }, ...length_defaults });
Object.assign(fill, fill(1));

const content = { base: { type: 'content' }, ...length_defaults };

const px = value => ({ base: { type: 'px', value }, ...length_defaults });

const min = value => length => ({ ...length, min: value });

const max = value => length => ({ ...length, max: value });

const length_css = (property, { base, min, max }) =>
	`
		--${property}-base-value: ${ base.value || 0 }${ base.type === 'px' ? 'px' : '' };
		min-${property}: ${ min }px;
		max-${property}: ${ max === Infinity ? 'none' : `${ max }px` };
	`;

/* src/Element.svelte generated by Svelte v3.32.0 */

function create_default_slot(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[12].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], null);

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
				if (default_slot.p && dirty & /*$$scope*/ 16384) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[14], dirty, null, null);
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
	let spacing_context;
	let div_class_value;
	let div_data_height_base_value;
	let div_data_width_base_value;
	let div_style_value;
	let current;

	spacing_context = new Spacing_Context({
			props: {
				x: 0,
				y: 0,
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			}
		});

	let div_levels = [
		/*$$restProps*/ ctx[9],
		{
			class: div_class_value = "" + (reset + " " + element$1 + " " + (/*$$props*/ ctx[10].class || ""))
		},
		{
			"data-height-base": div_data_height_base_value = /*height*/ ctx[2].base.type
		},
		{
			"data-width-base": div_data_width_base_value = /*width*/ ctx[1].base.type
		},
		{
			style: div_style_value = "\n\t\t" + /*style*/ ctx[6] + ";\n\t\t" + length_css("height", /*height*/ ctx[2]) + ";\n\t\t" + length_css("width", /*width*/ ctx[1]) + ";\n\t\t--context-spacing-x: " + /*context_spacing*/ ctx[8].x + "px;\n\t\t--context-spacing-y: " + /*context_spacing*/ ctx[8].y + "px;\n\t\tpadding: " + /*padding_value*/ ctx[7] + ";\n\t\topacity: " + /*opacity*/ ctx[5] + ";\n\t\t" + (/*x*/ ctx[3] || /*y*/ ctx[4]
			? `transform: translate3d(${/*x*/ ctx[3]}px, ${/*y*/ ctx[4]}px, 0);`
			: "") + "\n\t"
		}
	];

	let div_data = {};

	for (let i = 0; i < div_levels.length; i += 1) {
		div_data = assign(div_data, div_levels[i]);
	}

	return {
		c() {
			div = element("div");
			create_component(spacing_context.$$.fragment);
			this.h();
		},
		l(nodes) {
			div = claim_element(nodes, "DIV", {
				class: true,
				"data-height-base": true,
				"data-width-base": true,
				style: true
			});

			var div_nodes = children(div);
			claim_component(spacing_context.$$.fragment, div_nodes);
			div_nodes.forEach(detach);
			this.h();
		},
		h() {
			set_attributes(div, div_data);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(spacing_context, div, null);
			/*div_binding*/ ctx[13](div);
			current = true;
		},
		p(ctx, [dirty]) {
			const spacing_context_changes = {};

			if (dirty & /*$$scope*/ 16384) {
				spacing_context_changes.$$scope = { dirty, ctx };
			}

			spacing_context.$set(spacing_context_changes);

			set_attributes(div, div_data = get_spread_update(div_levels, [
				dirty & /*$$restProps*/ 512 && /*$$restProps*/ ctx[9],
				(!current || dirty & /*$$props*/ 1024 && div_class_value !== (div_class_value = "" + (reset + " " + element$1 + " " + (/*$$props*/ ctx[10].class || "")))) && { class: div_class_value },
				(!current || dirty & /*height*/ 4 && div_data_height_base_value !== (div_data_height_base_value = /*height*/ ctx[2].base.type)) && {
					"data-height-base": div_data_height_base_value
				},
				(!current || dirty & /*width*/ 2 && div_data_width_base_value !== (div_data_width_base_value = /*width*/ ctx[1].base.type)) && {
					"data-width-base": div_data_width_base_value
				},
				(!current || dirty & /*style, height, width, padding_value, opacity, x, y*/ 254 && div_style_value !== (div_style_value = "\n\t\t" + /*style*/ ctx[6] + ";\n\t\t" + length_css("height", /*height*/ ctx[2]) + ";\n\t\t" + length_css("width", /*width*/ ctx[1]) + ";\n\t\t--context-spacing-x: " + /*context_spacing*/ ctx[8].x + "px;\n\t\t--context-spacing-y: " + /*context_spacing*/ ctx[8].y + "px;\n\t\tpadding: " + /*padding_value*/ ctx[7] + ";\n\t\topacity: " + /*opacity*/ ctx[5] + ";\n\t\t" + (/*x*/ ctx[3] || /*y*/ ctx[4]
				? `transform: translate3d(${/*x*/ ctx[3]}px, ${/*y*/ ctx[4]}px, 0);`
				: "") + "\n\t")) && { style: div_style_value }
			]));
		},
		i(local) {
			if (current) return;
			transition_in(spacing_context.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(spacing_context.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(spacing_context);
			/*div_binding*/ ctx[13](null);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let padding_value;
	const omit_props_names = ["ref","width","height","x","y","padding","opacity","style"];
	let $$restProps = compute_rest_props($$props, omit_props_names);
	let { $$slots: slots = {}, $$scope } = $$props;
	const context_spacing = get_spacing_context();
	let { ref = undefined } = $$props;
	let { width = content } = $$props;
	let { height = content } = $$props;
	let { x = 0 } = $$props;
	let { y = 0 } = $$props;
	let { padding = 0 } = $$props;
	let { opacity = 1 } = $$props;
	let { style = "" } = $$props;

	function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			ref = $$value;
			$$invalidate(0, ref);
		});
	}

	$$self.$$set = $$new_props => {
		$$invalidate(10, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		$$invalidate(9, $$restProps = compute_rest_props($$props, omit_props_names));
		if ("ref" in $$new_props) $$invalidate(0, ref = $$new_props.ref);
		if ("width" in $$new_props) $$invalidate(1, width = $$new_props.width);
		if ("height" in $$new_props) $$invalidate(2, height = $$new_props.height);
		if ("x" in $$new_props) $$invalidate(3, x = $$new_props.x);
		if ("y" in $$new_props) $$invalidate(4, y = $$new_props.y);
		if ("padding" in $$new_props) $$invalidate(11, padding = $$new_props.padding);
		if ("opacity" in $$new_props) $$invalidate(5, opacity = $$new_props.opacity);
		if ("style" in $$new_props) $$invalidate(6, style = $$new_props.style);
		if ("$$scope" in $$new_props) $$invalidate(14, $$scope = $$new_props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*padding*/ 2048) {
			 $$invalidate(7, padding_value = Array.isArray(padding)
			? padding.map(n => `${n}px`).join(" ")
			: `${padding}px`);
		}
	};

	$$props = exclude_internal_props($$props);

	return [
		ref,
		width,
		height,
		x,
		y,
		opacity,
		style,
		padding_value,
		context_spacing,
		$$restProps,
		$$props,
		padding,
		slots,
		div_binding,
		$$scope
	];
}

class Element extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
			ref: 0,
			width: 1,
			height: 2,
			x: 3,
			y: 4,
			padding: 11,
			opacity: 5,
			style: 6
		});
	}
}

/* src/Nearby.svelte generated by Svelte v3.32.0 */

function add_css() {
	var style = element("style");
	style.id = "svelte-1eyaf3i-style";
	style.textContent = "div.svelte-1eyaf3i:empty{display:none}";
	append(document.head, style);
}

function create_fragment$2(ctx) {
	let div;
	let current;
	let mounted;
	let dispose;
	const default_slot_template = /*#slots*/ ctx[2].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

	return {
		c() {
			div = element("div");
			if (default_slot) default_slot.c();
			this.h();
		},
		l(nodes) {
			div = claim_element(nodes, "DIV", { class: true });
			var div_nodes = children(div);
			if (default_slot) default_slot.l(div_nodes);
			div_nodes.forEach(detach);
			this.h();
		},
		h() {
			attr(div, "class", "" + (null_to_empty(nearby) + " svelte-1eyaf3i"));
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;

			if (!mounted) {
				dispose = action_destroyer(/*action*/ ctx[0].call(null, div));
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
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
			if (detaching) detach(div);
			if (default_slot) default_slot.d(detaching);
			mounted = false;
			dispose();
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	const class_name = `${reset} ${nearby_container} ${$$props.class || ""}`;

	/*
	A. working around svelte awkwardness
		1. using the i.e. <div slot='above'> element as the nearby_container
			Because slots are needed to control the order the nearby elements end up in the dom, for the sake of layering order consistency
			and the slot attribute is not currently supported on custom components
				<Box slot='above'> <!-- not supported -->
			so we must pass the slot content in a dom node
			and that additional dom node is in the way of the nearby container styling
			putting display: contents; on it via something like `> [slot]` solves the styling issue in a sense...
			but also breaks child selectors expecting the slot content to be a direct child of nearby_container
			whereas that child would then be the `<div slot='above'>` node instead.
	
		2. removing the dom node of this component if it has no children, meaning no slot content was actually passed
			This is necessary because
				{#if $$slots.above} <slot name='above' slot='above'/> {/if}
			is not supported by Svelte, so components like Row pass the slot content to Container, even though they don't have anything to pass
			this makes the `{#if $$slots.above}` checks in Container useless, so this component, Nearby, is always rendered.
*/
	const action = node => {
		if (node.children.length === 0) {
			node.parentNode.removeChild(node);
		}

		for (const child of node.children) {
			child.className = class_name;
		}
	};

	$$self.$$set = $$new_props => {
		$$invalidate(4, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("$$scope" in $$new_props) $$invalidate(1, $$scope = $$new_props.$$scope);
	};

	$$props = exclude_internal_props($$props);
	return [action, $$scope, slots];
}

class Nearby extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1eyaf3i-style")) add_css();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});
	}
}

/* src/Above.svelte generated by Svelte v3.32.0 */

function create_default_slot$1(ctx) {
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

function create_fragment$3(ctx) {
	let nearby;
	let current;

	nearby = new Nearby({
			props: {
				class: "" + (nearby_y + " " + above),
				$$slots: { default: [create_default_slot$1] },
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

function instance$3($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	$$self.$$set = $$props => {
		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [slots, $$scope];
}

class Above extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});
	}
}

/* src/Below.svelte generated by Svelte v3.32.0 */

function create_default_slot$2(ctx) {
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

function create_fragment$4(ctx) {
	let nearby;
	let current;

	nearby = new Nearby({
			props: {
				class: "" + (nearby_y + " " + below),
				$$slots: { default: [create_default_slot$2] },
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

function instance$4($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	$$self.$$set = $$props => {
		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [slots, $$scope];
}

class Below extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});
	}
}

/* src/On_left.svelte generated by Svelte v3.32.0 */

function create_default_slot$3(ctx) {
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

function create_fragment$5(ctx) {
	let nearby;
	let current;

	nearby = new Nearby({
			props: {
				class: "" + (nearby_x + " " + on_left),
				$$slots: { default: [create_default_slot$3] },
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

function instance$5($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	$$self.$$set = $$props => {
		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [slots, $$scope];
}

class On_left extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});
	}
}

/* src/On_right.svelte generated by Svelte v3.32.0 */

function create_default_slot$4(ctx) {
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

function create_fragment$6(ctx) {
	let nearby;
	let current;

	nearby = new Nearby({
			props: {
				class: "" + (nearby_x + " " + on_right),
				$$slots: { default: [create_default_slot$4] },
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

function instance$6($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	$$self.$$set = $$props => {
		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [slots, $$scope];
}

class On_right extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});
	}
}

/* src/In_back.svelte generated by Svelte v3.32.0 */

function create_default_slot$5(ctx) {
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

function create_fragment$7(ctx) {
	let nearby;
	let current;

	nearby = new Nearby({
			props: {
				class: "" + (nearby_x + " " + nearby_y + " " + in_back),
				$$slots: { default: [create_default_slot$5] },
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

function instance$7($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	$$self.$$set = $$props => {
		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [slots, $$scope];
}

class In_back extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});
	}
}

/* src/In_front.svelte generated by Svelte v3.32.0 */

function create_default_slot$6(ctx) {
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

function create_fragment$8(ctx) {
	let nearby;
	let current;

	nearby = new Nearby({
			props: {
				class: "" + (nearby_x + " " + nearby_y),
				$$slots: { default: [create_default_slot$6] },
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

function instance$8($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	$$self.$$set = $$props => {
		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [slots, $$scope];
}

class In_front extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});
	}
}

var css_248z$3 = ".nearby_slot_container_n10it0ph > .nearby_n1ymrolb > .nearby_container_nc97fwj > [slot]{display:contents;}\n";
styleInject(css_248z$3);

/* src/Container.svelte generated by Svelte v3.32.0 */

const get_in_front_slot_changes = dirty => ({});

const get_in_front_slot_context = ctx => ({});

const get_on_right_slot_changes = dirty => ({});

const get_on_right_slot_context = ctx => ({});

const get_on_left_slot_changes = dirty => ({});

const get_on_left_slot_context = ctx => ({});

const get_below_slot_changes = dirty => ({});

const get_below_slot_context = ctx => ({});

const get_above_slot_changes = dirty => ({});

const get_above_slot_context = ctx => ({});

const get_in_back_slot_changes = dirty => ({});

const get_in_back_slot_context = ctx => ({}); // (41:1) {#if $$slots.in_back}


function create_if_block_5(ctx) {
  let in_back;
  let current;
  in_back = new In_back({
    props: {
      $$slots: {
        default: [create_default_slot_7]
      },
      $$scope: {
        ctx
      }
    }
  });
  return {
    c() {
      create_component(in_back.$$.fragment);
    },

    l(nodes) {
      claim_component(in_back.$$.fragment, nodes);
    },

    m(target, anchor) {
      mount_component(in_back, target, anchor);
      current = true;
    },

    p(ctx, dirty) {
      const in_back_changes = {};

      if (dirty &
      /*$$scope*/
      32768) {
        in_back_changes.$$scope = {
          dirty,
          ctx
        };
      }

      in_back.$set(in_back_changes);
    },

    i(local) {
      if (current) return;
      transition_in(in_back.$$.fragment, local);
      current = true;
    },

    o(local) {
      transition_out(in_back.$$.fragment, local);
      current = false;
    },

    d(detaching) {
      destroy_component(in_back, detaching);
    }

  };
} // (41:23) <In_back>


function create_default_slot_7(ctx) {
  let current;
  const in_back_slot_template =
  /*#slots*/
  ctx[13].in_back;
  const in_back_slot = create_slot(in_back_slot_template, ctx,
  /*$$scope*/
  ctx[15], get_in_back_slot_context);
  return {
    c() {
      if (in_back_slot) in_back_slot.c();
    },

    l(nodes) {
      if (in_back_slot) in_back_slot.l(nodes);
    },

    m(target, anchor) {
      if (in_back_slot) {
        in_back_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (in_back_slot) {
        if (in_back_slot.p && dirty &
        /*$$scope*/
        32768) {
          update_slot(in_back_slot, in_back_slot_template, ctx,
          /*$$scope*/
          ctx[15], dirty, get_in_back_slot_changes, get_in_back_slot_context);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(in_back_slot, local);
      current = true;
    },

    o(local) {
      transition_out(in_back_slot, local);
      current = false;
    },

    d(detaching) {
      if (in_back_slot) in_back_slot.d(detaching);
    }

  };
} // (43:1) <Spacing_Context x={spacing_x} y={spacing_y}>


function create_default_slot_6(ctx) {
  let current;
  const default_slot_template =
  /*#slots*/
  ctx[13].default;
  const default_slot = create_slot(default_slot_template, ctx,
  /*$$scope*/
  ctx[15], null);
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
        32768) {
          update_slot(default_slot, default_slot_template, ctx,
          /*$$scope*/
          ctx[15], dirty, null, null);
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
} // (47:1) {#if $$slots.above}


function create_if_block_4(ctx) {
  let above;
  let current;
  above = new Above({
    props: {
      $$slots: {
        default: [create_default_slot_5]
      },
      $$scope: {
        ctx
      }
    }
  });
  return {
    c() {
      create_component(above.$$.fragment);
    },

    l(nodes) {
      claim_component(above.$$.fragment, nodes);
    },

    m(target, anchor) {
      mount_component(above, target, anchor);
      current = true;
    },

    p(ctx, dirty) {
      const above_changes = {};

      if (dirty &
      /*$$scope*/
      32768) {
        above_changes.$$scope = {
          dirty,
          ctx
        };
      }

      above.$set(above_changes);
    },

    i(local) {
      if (current) return;
      transition_in(above.$$.fragment, local);
      current = true;
    },

    o(local) {
      transition_out(above.$$.fragment, local);
      current = false;
    },

    d(detaching) {
      destroy_component(above, detaching);
    }

  };
} // (47:21) <Above>


function create_default_slot_5(ctx) {
  let current;
  const above_slot_template =
  /*#slots*/
  ctx[13].above;
  const above_slot = create_slot(above_slot_template, ctx,
  /*$$scope*/
  ctx[15], get_above_slot_context);
  return {
    c() {
      if (above_slot) above_slot.c();
    },

    l(nodes) {
      if (above_slot) above_slot.l(nodes);
    },

    m(target, anchor) {
      if (above_slot) {
        above_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (above_slot) {
        if (above_slot.p && dirty &
        /*$$scope*/
        32768) {
          update_slot(above_slot, above_slot_template, ctx,
          /*$$scope*/
          ctx[15], dirty, get_above_slot_changes, get_above_slot_context);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(above_slot, local);
      current = true;
    },

    o(local) {
      transition_out(above_slot, local);
      current = false;
    },

    d(detaching) {
      if (above_slot) above_slot.d(detaching);
    }

  };
} // (48:1) {#if $$slots.below}


function create_if_block_3(ctx) {
  let below;
  let current;
  below = new Below({
    props: {
      $$slots: {
        default: [create_default_slot_4]
      },
      $$scope: {
        ctx
      }
    }
  });
  return {
    c() {
      create_component(below.$$.fragment);
    },

    l(nodes) {
      claim_component(below.$$.fragment, nodes);
    },

    m(target, anchor) {
      mount_component(below, target, anchor);
      current = true;
    },

    p(ctx, dirty) {
      const below_changes = {};

      if (dirty &
      /*$$scope*/
      32768) {
        below_changes.$$scope = {
          dirty,
          ctx
        };
      }

      below.$set(below_changes);
    },

    i(local) {
      if (current) return;
      transition_in(below.$$.fragment, local);
      current = true;
    },

    o(local) {
      transition_out(below.$$.fragment, local);
      current = false;
    },

    d(detaching) {
      destroy_component(below, detaching);
    }

  };
} // (48:21) <Below>


function create_default_slot_4(ctx) {
  let current;
  const below_slot_template =
  /*#slots*/
  ctx[13].below;
  const below_slot = create_slot(below_slot_template, ctx,
  /*$$scope*/
  ctx[15], get_below_slot_context);
  return {
    c() {
      if (below_slot) below_slot.c();
    },

    l(nodes) {
      if (below_slot) below_slot.l(nodes);
    },

    m(target, anchor) {
      if (below_slot) {
        below_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (below_slot) {
        if (below_slot.p && dirty &
        /*$$scope*/
        32768) {
          update_slot(below_slot, below_slot_template, ctx,
          /*$$scope*/
          ctx[15], dirty, get_below_slot_changes, get_below_slot_context);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(below_slot, local);
      current = true;
    },

    o(local) {
      transition_out(below_slot, local);
      current = false;
    },

    d(detaching) {
      if (below_slot) below_slot.d(detaching);
    }

  };
} // (49:1) {#if $$slots.on_left}


function create_if_block_2(ctx) {
  let on_left;
  let current;
  on_left = new On_left({
    props: {
      $$slots: {
        default: [create_default_slot_3]
      },
      $$scope: {
        ctx
      }
    }
  });
  return {
    c() {
      create_component(on_left.$$.fragment);
    },

    l(nodes) {
      claim_component(on_left.$$.fragment, nodes);
    },

    m(target, anchor) {
      mount_component(on_left, target, anchor);
      current = true;
    },

    p(ctx, dirty) {
      const on_left_changes = {};

      if (dirty &
      /*$$scope*/
      32768) {
        on_left_changes.$$scope = {
          dirty,
          ctx
        };
      }

      on_left.$set(on_left_changes);
    },

    i(local) {
      if (current) return;
      transition_in(on_left.$$.fragment, local);
      current = true;
    },

    o(local) {
      transition_out(on_left.$$.fragment, local);
      current = false;
    },

    d(detaching) {
      destroy_component(on_left, detaching);
    }

  };
} // (49:23) <On_left>


function create_default_slot_3(ctx) {
  let current;
  const on_left_slot_template =
  /*#slots*/
  ctx[13].on_left;
  const on_left_slot = create_slot(on_left_slot_template, ctx,
  /*$$scope*/
  ctx[15], get_on_left_slot_context);
  return {
    c() {
      if (on_left_slot) on_left_slot.c();
    },

    l(nodes) {
      if (on_left_slot) on_left_slot.l(nodes);
    },

    m(target, anchor) {
      if (on_left_slot) {
        on_left_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (on_left_slot) {
        if (on_left_slot.p && dirty &
        /*$$scope*/
        32768) {
          update_slot(on_left_slot, on_left_slot_template, ctx,
          /*$$scope*/
          ctx[15], dirty, get_on_left_slot_changes, get_on_left_slot_context);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(on_left_slot, local);
      current = true;
    },

    o(local) {
      transition_out(on_left_slot, local);
      current = false;
    },

    d(detaching) {
      if (on_left_slot) on_left_slot.d(detaching);
    }

  };
} // (50:1) {#if $$slots.on_right}


function create_if_block_1(ctx) {
  let on_right;
  let current;
  on_right = new On_right({
    props: {
      $$slots: {
        default: [create_default_slot_2]
      },
      $$scope: {
        ctx
      }
    }
  });
  return {
    c() {
      create_component(on_right.$$.fragment);
    },

    l(nodes) {
      claim_component(on_right.$$.fragment, nodes);
    },

    m(target, anchor) {
      mount_component(on_right, target, anchor);
      current = true;
    },

    p(ctx, dirty) {
      const on_right_changes = {};

      if (dirty &
      /*$$scope*/
      32768) {
        on_right_changes.$$scope = {
          dirty,
          ctx
        };
      }

      on_right.$set(on_right_changes);
    },

    i(local) {
      if (current) return;
      transition_in(on_right.$$.fragment, local);
      current = true;
    },

    o(local) {
      transition_out(on_right.$$.fragment, local);
      current = false;
    },

    d(detaching) {
      destroy_component(on_right, detaching);
    }

  };
} // (50:24) <On_right>


function create_default_slot_2(ctx) {
  let current;
  const on_right_slot_template =
  /*#slots*/
  ctx[13].on_right;
  const on_right_slot = create_slot(on_right_slot_template, ctx,
  /*$$scope*/
  ctx[15], get_on_right_slot_context);
  return {
    c() {
      if (on_right_slot) on_right_slot.c();
    },

    l(nodes) {
      if (on_right_slot) on_right_slot.l(nodes);
    },

    m(target, anchor) {
      if (on_right_slot) {
        on_right_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (on_right_slot) {
        if (on_right_slot.p && dirty &
        /*$$scope*/
        32768) {
          update_slot(on_right_slot, on_right_slot_template, ctx,
          /*$$scope*/
          ctx[15], dirty, get_on_right_slot_changes, get_on_right_slot_context);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(on_right_slot, local);
      current = true;
    },

    o(local) {
      transition_out(on_right_slot, local);
      current = false;
    },

    d(detaching) {
      if (on_right_slot) on_right_slot.d(detaching);
    }

  };
} // (51:1) {#if $$slots.in_front}


function create_if_block(ctx) {
  let in_front;
  let current;
  in_front = new In_front({
    props: {
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
      create_component(in_front.$$.fragment);
    },

    l(nodes) {
      claim_component(in_front.$$.fragment, nodes);
    },

    m(target, anchor) {
      mount_component(in_front, target, anchor);
      current = true;
    },

    p(ctx, dirty) {
      const in_front_changes = {};

      if (dirty &
      /*$$scope*/
      32768) {
        in_front_changes.$$scope = {
          dirty,
          ctx
        };
      }

      in_front.$set(in_front_changes);
    },

    i(local) {
      if (current) return;
      transition_in(in_front.$$.fragment, local);
      current = true;
    },

    o(local) {
      transition_out(in_front.$$.fragment, local);
      current = false;
    },

    d(detaching) {
      destroy_component(in_front, detaching);
    }

  };
} // (51:24) <In_front>


function create_default_slot_1(ctx) {
  let current;
  const in_front_slot_template =
  /*#slots*/
  ctx[13].in_front;
  const in_front_slot = create_slot(in_front_slot_template, ctx,
  /*$$scope*/
  ctx[15], get_in_front_slot_context);
  return {
    c() {
      if (in_front_slot) in_front_slot.c();
    },

    l(nodes) {
      if (in_front_slot) in_front_slot.l(nodes);
    },

    m(target, anchor) {
      if (in_front_slot) {
        in_front_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (in_front_slot) {
        if (in_front_slot.p && dirty &
        /*$$scope*/
        32768) {
          update_slot(in_front_slot, in_front_slot_template, ctx,
          /*$$scope*/
          ctx[15], dirty, get_in_front_slot_changes, get_in_front_slot_context);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(in_front_slot, local);
      current = true;
    },

    o(local) {
      transition_out(in_front_slot, local);
      current = false;
    },

    d(detaching) {
      if (in_front_slot) in_front_slot.d(detaching);
    }

  };
} // (31:0) <Element  bind:ref  { ...$$restProps }  class="{ $$props.class || '' } { nearby_slot_container }"  style='   { style };   { overflow('x', clip_x, scroll_x) }   { overflow('y', clip_y, scroll_y) }  ' >


function create_default_slot$7(ctx) {
  let t0;
  let spacing_context;
  let t1;
  let t2;
  let t3;
  let t4;
  let t5;
  let if_block5_anchor;
  let current;
  let if_block0 =
  /*$$slots*/
  ctx[12].in_back && create_if_block_5(ctx);
  spacing_context = new Spacing_Context({
    props: {
      x:
      /*spacing_x*/
      ctx[1],
      y:
      /*spacing_y*/
      ctx[2],
      $$slots: {
        default: [create_default_slot_6]
      },
      $$scope: {
        ctx
      }
    }
  });
  let if_block1 =
  /*$$slots*/
  ctx[12].above && create_if_block_4(ctx);
  let if_block2 =
  /*$$slots*/
  ctx[12].below && create_if_block_3(ctx);
  let if_block3 =
  /*$$slots*/
  ctx[12].on_left && create_if_block_2(ctx);
  let if_block4 =
  /*$$slots*/
  ctx[12].on_right && create_if_block_1(ctx);
  let if_block5 =
  /*$$slots*/
  ctx[12].in_front && create_if_block(ctx);
  return {
    c() {
      if (if_block0) if_block0.c();
      t0 = space();
      create_component(spacing_context.$$.fragment);
      t1 = space();
      if (if_block1) if_block1.c();
      t2 = space();
      if (if_block2) if_block2.c();
      t3 = space();
      if (if_block3) if_block3.c();
      t4 = space();
      if (if_block4) if_block4.c();
      t5 = space();
      if (if_block5) if_block5.c();
      if_block5_anchor = empty();
    },

    l(nodes) {
      if (if_block0) if_block0.l(nodes);
      t0 = claim_space(nodes);
      claim_component(spacing_context.$$.fragment, nodes);
      t1 = claim_space(nodes);
      if (if_block1) if_block1.l(nodes);
      t2 = claim_space(nodes);
      if (if_block2) if_block2.l(nodes);
      t3 = claim_space(nodes);
      if (if_block3) if_block3.l(nodes);
      t4 = claim_space(nodes);
      if (if_block4) if_block4.l(nodes);
      t5 = claim_space(nodes);
      if (if_block5) if_block5.l(nodes);
      if_block5_anchor = empty();
    },

    m(target, anchor) {
      if (if_block0) if_block0.m(target, anchor);
      insert(target, t0, anchor);
      mount_component(spacing_context, target, anchor);
      insert(target, t1, anchor);
      if (if_block1) if_block1.m(target, anchor);
      insert(target, t2, anchor);
      if (if_block2) if_block2.m(target, anchor);
      insert(target, t3, anchor);
      if (if_block3) if_block3.m(target, anchor);
      insert(target, t4, anchor);
      if (if_block4) if_block4.m(target, anchor);
      insert(target, t5, anchor);
      if (if_block5) if_block5.m(target, anchor);
      insert(target, if_block5_anchor, anchor);
      current = true;
    },

    p(ctx, dirty) {
      if (
      /*$$slots*/
      ctx[12].in_back) {
        if (if_block0) {
          if_block0.p(ctx, dirty);

          if (dirty &
          /*$$slots*/
          4096) {
            transition_in(if_block0, 1);
          }
        } else {
          if_block0 = create_if_block_5(ctx);
          if_block0.c();
          transition_in(if_block0, 1);
          if_block0.m(t0.parentNode, t0);
        }
      } else if (if_block0) {
        group_outros();
        transition_out(if_block0, 1, 1, () => {
          if_block0 = null;
        });
        check_outros();
      }

      const spacing_context_changes = {};
      if (dirty &
      /*spacing_x*/
      2) spacing_context_changes.x =
      /*spacing_x*/
      ctx[1];
      if (dirty &
      /*spacing_y*/
      4) spacing_context_changes.y =
      /*spacing_y*/
      ctx[2];

      if (dirty &
      /*$$scope*/
      32768) {
        spacing_context_changes.$$scope = {
          dirty,
          ctx
        };
      }

      spacing_context.$set(spacing_context_changes);

      if (
      /*$$slots*/
      ctx[12].above) {
        if (if_block1) {
          if_block1.p(ctx, dirty);

          if (dirty &
          /*$$slots*/
          4096) {
            transition_in(if_block1, 1);
          }
        } else {
          if_block1 = create_if_block_4(ctx);
          if_block1.c();
          transition_in(if_block1, 1);
          if_block1.m(t2.parentNode, t2);
        }
      } else if (if_block1) {
        group_outros();
        transition_out(if_block1, 1, 1, () => {
          if_block1 = null;
        });
        check_outros();
      }

      if (
      /*$$slots*/
      ctx[12].below) {
        if (if_block2) {
          if_block2.p(ctx, dirty);

          if (dirty &
          /*$$slots*/
          4096) {
            transition_in(if_block2, 1);
          }
        } else {
          if_block2 = create_if_block_3(ctx);
          if_block2.c();
          transition_in(if_block2, 1);
          if_block2.m(t3.parentNode, t3);
        }
      } else if (if_block2) {
        group_outros();
        transition_out(if_block2, 1, 1, () => {
          if_block2 = null;
        });
        check_outros();
      }

      if (
      /*$$slots*/
      ctx[12].on_left) {
        if (if_block3) {
          if_block3.p(ctx, dirty);

          if (dirty &
          /*$$slots*/
          4096) {
            transition_in(if_block3, 1);
          }
        } else {
          if_block3 = create_if_block_2(ctx);
          if_block3.c();
          transition_in(if_block3, 1);
          if_block3.m(t4.parentNode, t4);
        }
      } else if (if_block3) {
        group_outros();
        transition_out(if_block3, 1, 1, () => {
          if_block3 = null;
        });
        check_outros();
      }

      if (
      /*$$slots*/
      ctx[12].on_right) {
        if (if_block4) {
          if_block4.p(ctx, dirty);

          if (dirty &
          /*$$slots*/
          4096) {
            transition_in(if_block4, 1);
          }
        } else {
          if_block4 = create_if_block_1(ctx);
          if_block4.c();
          transition_in(if_block4, 1);
          if_block4.m(t5.parentNode, t5);
        }
      } else if (if_block4) {
        group_outros();
        transition_out(if_block4, 1, 1, () => {
          if_block4 = null;
        });
        check_outros();
      }

      if (
      /*$$slots*/
      ctx[12].in_front) {
        if (if_block5) {
          if_block5.p(ctx, dirty);

          if (dirty &
          /*$$slots*/
          4096) {
            transition_in(if_block5, 1);
          }
        } else {
          if_block5 = create_if_block(ctx);
          if_block5.c();
          transition_in(if_block5, 1);
          if_block5.m(if_block5_anchor.parentNode, if_block5_anchor);
        }
      } else if (if_block5) {
        group_outros();
        transition_out(if_block5, 1, 1, () => {
          if_block5 = null;
        });
        check_outros();
      }
    },

    i(local) {
      if (current) return;
      transition_in(if_block0);
      transition_in(spacing_context.$$.fragment, local);
      transition_in(if_block1);
      transition_in(if_block2);
      transition_in(if_block3);
      transition_in(if_block4);
      transition_in(if_block5);
      current = true;
    },

    o(local) {
      transition_out(if_block0);
      transition_out(spacing_context.$$.fragment, local);
      transition_out(if_block1);
      transition_out(if_block2);
      transition_out(if_block3);
      transition_out(if_block4);
      transition_out(if_block5);
      current = false;
    },

    d(detaching) {
      if (if_block0) if_block0.d(detaching);
      if (detaching) detach(t0);
      destroy_component(spacing_context, detaching);
      if (detaching) detach(t1);
      if (if_block1) if_block1.d(detaching);
      if (detaching) detach(t2);
      if (if_block2) if_block2.d(detaching);
      if (detaching) detach(t3);
      if (if_block3) if_block3.d(detaching);
      if (detaching) detach(t4);
      if (if_block4) if_block4.d(detaching);
      if (detaching) detach(t5);
      if (if_block5) if_block5.d(detaching);
      if (detaching) detach(if_block5_anchor);
    }

  };
}

function create_fragment$9(ctx) {
  let element_1;
  let updating_ref;
  let current;
  const element_1_spread_levels = [
  /*$$restProps*/
  ctx[10], {
    class: "" + ((
    /*$$props*/
    ctx[11].class || "") + " " +
    /*nearby_slot_container*/
    ctx[8])
  }, {
    style: "\n\t\t" +
    /*style*/
    ctx[7] + ";\n\t\t" +
    /*overflow*/
    ctx[9]("x",
    /*clip_x*/
    ctx[3],
    /*scroll_x*/
    ctx[5]) + "\n\t\t" +
    /*overflow*/
    ctx[9]("y",
    /*clip_y*/
    ctx[4],
    /*scroll_y*/
    ctx[6]) + "\n\t"
  }];

  function element_1_ref_binding(value) {
    /*element_1_ref_binding*/
    ctx[14].call(null, value);
  }

  let element_1_props = {
    $$slots: {
      default: [create_default_slot$7]
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
      /*$$restProps, $$props, nearby_slot_container, style, overflow, clip_x, scroll_x, clip_y, scroll_y*/
      4088 ? get_spread_update(element_1_spread_levels, [dirty &
      /*$$restProps*/
      1024 && get_spread_object(
      /*$$restProps*/
      ctx[10]), dirty &
      /*$$props, nearby_slot_container*/
      2304 && {
        class: "" + ((
        /*$$props*/
        ctx[11].class || "") + " " +
        /*nearby_slot_container*/
        ctx[8])
      }, dirty &
      /*style, overflow, clip_x, scroll_x, clip_y, scroll_y*/
      760 && {
        style: "\n\t\t" +
        /*style*/
        ctx[7] + ";\n\t\t" +
        /*overflow*/
        ctx[9]("x",
        /*clip_x*/
        ctx[3],
        /*scroll_x*/
        ctx[5]) + "\n\t\t" +
        /*overflow*/
        ctx[9]("y",
        /*clip_y*/
        ctx[4],
        /*scroll_y*/
        ctx[6]) + "\n\t"
      }]) : {};

      if (dirty &
      /*$$scope, $$slots, spacing_x, spacing_y*/
      36870) {
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

function instance$9($$self, $$props, $$invalidate) {
  const omit_props_names = ["ref", "spacing_x", "spacing_y", "clip_x", "clip_y", "scroll_x", "scroll_y", "style"];
  let $$restProps = compute_rest_props($$props, omit_props_names);
  let {
    $$slots: slots = {},
    $$scope
  } = $$props;
  const $$slots = compute_slots(slots);
  let {
    ref = undefined
  } = $$props;
  let {
    spacing_x = 0
  } = $$props;
  let {
    spacing_y = 0
  } = $$props;
  let {
    clip_x = false
  } = $$props;
  let {
    clip_y = false
  } = $$props;
  let {
    scroll_x = false
  } = $$props;
  let {
    scroll_y = false
  } = $$props;
  let {
    style = ""
  } = $$props;
  const nearby_slot_container = "nearby_slot_container_n10it0ph";

  const overflow = (axis, clip, scroll) => `overflow-${axis}: ${clip ? "hidden" : scroll ? "auto" : "visible"};`;

  function element_1_ref_binding(value) {
    ref = value;
    $$invalidate(0, ref);
  }

  $$self.$$set = $$new_props => {
    $$invalidate(11, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    $$invalidate(10, $$restProps = compute_rest_props($$props, omit_props_names));
    if ("ref" in $$new_props) $$invalidate(0, ref = $$new_props.ref);
    if ("spacing_x" in $$new_props) $$invalidate(1, spacing_x = $$new_props.spacing_x);
    if ("spacing_y" in $$new_props) $$invalidate(2, spacing_y = $$new_props.spacing_y);
    if ("clip_x" in $$new_props) $$invalidate(3, clip_x = $$new_props.clip_x);
    if ("clip_y" in $$new_props) $$invalidate(4, clip_y = $$new_props.clip_y);
    if ("scroll_x" in $$new_props) $$invalidate(5, scroll_x = $$new_props.scroll_x);
    if ("scroll_y" in $$new_props) $$invalidate(6, scroll_y = $$new_props.scroll_y);
    if ("style" in $$new_props) $$invalidate(7, style = $$new_props.style);
    if ("$$scope" in $$new_props) $$invalidate(15, $$scope = $$new_props.$$scope);
  };

  $$props = exclude_internal_props($$props);
  return [ref, spacing_x, spacing_y, clip_x, clip_y, scroll_x, scroll_y, style, nearby_slot_container, overflow, $$restProps, $$props, $$slots, slots, element_1_ref_binding, $$scope];
}

class Container extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$9, create_fragment$9, safe_not_equal, {
      ref: 0,
      spacing_x: 1,
      spacing_y: 2,
      clip_x: 3,
      clip_y: 4,
      scroll_x: 5,
      scroll_y: 6,
      style: 7
    });
  }

}

var css_248z$4 = ".row_r6s9emb{-webkit-flex-direction:row;-ms-flex-direction:row;flex-direction:row;}.row_r6s9emb > .element_ekolm46[data-height-base=fill]{height:100%;}.row_r6s9emb > .element_ekolm46[data-width-base=fill]{-webkit-flex-basis:0;-ms-flex-preferred-size:0;flex-basis:0;-webkit-box-flex:var(--width-base-value);-webkit-flex-grow:var(--width-base-value);-ms-flex-positive:var(--width-base-value);flex-grow:var(--width-base-value);}.row_r6s9emb > .element_ekolm46[data-height-base=content]{height:auto;}.row_r6s9emb > .element_ekolm46[data-width-base=content]{-webkit-flex-basis:auto;-ms-flex-preferred-size:auto;flex-basis:auto;-webkit-box-flex:0;-webkit-flex-grow:0;-ms-flex-positive:0;flex-grow:0;}\n";
styleInject(css_248z$4);

/* src/Row.svelte generated by Svelte v3.32.0 */

const get_in_front_slot_changes$1 = dirty => ({});

const get_in_front_slot_context$1 = ctx => ({
  slot: "in_front"
});

const get_on_right_slot_changes$1 = dirty => ({});

const get_on_right_slot_context$1 = ctx => ({
  slot: "on_right"
});

const get_on_left_slot_changes$1 = dirty => ({});

const get_on_left_slot_context$1 = ctx => ({
  slot: "on_left"
});

const get_below_slot_changes$1 = dirty => ({});

const get_below_slot_context$1 = ctx => ({
  slot: "below"
});

const get_above_slot_changes$1 = dirty => ({});

const get_above_slot_context$1 = ctx => ({
  slot: "above"
});

const get_in_back_slot_changes$1 = dirty => ({});

const get_in_back_slot_context$1 = ctx => ({
  slot: "in_back"
}); // (49:1) <slot name='in_back' slot='in_back'/>  <slot/>  <slot name='above' slot='above'/>  <slot name='below' slot='below'/>  <slot name='on_left' slot='on_left'/>  <slot name='on_right' slot='on_right'/>  <slot name='in_front' slot='in_front'/> </Container> 


function create_in_back_slot(ctx) {
  let current;
  const in_back_slot_template =
  /*#slots*/
  ctx[10].in_back;
  const in_back_slot = create_slot(in_back_slot_template, ctx,
  /*$$scope*/
  ctx[12], get_in_back_slot_context$1);
  return {
    c() {
      if (in_back_slot) in_back_slot.c();
    },

    l(nodes) {
      if (in_back_slot) in_back_slot.l(nodes);
    },

    m(target, anchor) {
      if (in_back_slot) {
        in_back_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (in_back_slot) {
        if (in_back_slot.p && dirty &
        /*$$scope*/
        4096) {
          update_slot(in_back_slot, in_back_slot_template, ctx,
          /*$$scope*/
          ctx[12], dirty, get_in_back_slot_changes$1, get_in_back_slot_context$1);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(in_back_slot, local);
      current = true;
    },

    o(local) {
      transition_out(in_back_slot, local);
      current = false;
    },

    d(detaching) {
      if (in_back_slot) in_back_slot.d(detaching);
    }

  };
} // (51:1) <slot name='above' slot='above'/>  <slot name='below' slot='below'/>  <slot name='on_left' slot='on_left'/>  <slot name='on_right' slot='on_right'/>  <slot name='in_front' slot='in_front'/> </Container> 


function create_above_slot(ctx) {
  let current;
  const above_slot_template =
  /*#slots*/
  ctx[10].above;
  const above_slot = create_slot(above_slot_template, ctx,
  /*$$scope*/
  ctx[12], get_above_slot_context$1);
  return {
    c() {
      if (above_slot) above_slot.c();
    },

    l(nodes) {
      if (above_slot) above_slot.l(nodes);
    },

    m(target, anchor) {
      if (above_slot) {
        above_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (above_slot) {
        if (above_slot.p && dirty &
        /*$$scope*/
        4096) {
          update_slot(above_slot, above_slot_template, ctx,
          /*$$scope*/
          ctx[12], dirty, get_above_slot_changes$1, get_above_slot_context$1);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(above_slot, local);
      current = true;
    },

    o(local) {
      transition_out(above_slot, local);
      current = false;
    },

    d(detaching) {
      if (above_slot) above_slot.d(detaching);
    }

  };
} // (52:1) <slot name='below' slot='below'/>  <slot name='on_left' slot='on_left'/>  <slot name='on_right' slot='on_right'/>  <slot name='in_front' slot='in_front'/> </Container> 


function create_below_slot(ctx) {
  let current;
  const below_slot_template =
  /*#slots*/
  ctx[10].below;
  const below_slot = create_slot(below_slot_template, ctx,
  /*$$scope*/
  ctx[12], get_below_slot_context$1);
  return {
    c() {
      if (below_slot) below_slot.c();
    },

    l(nodes) {
      if (below_slot) below_slot.l(nodes);
    },

    m(target, anchor) {
      if (below_slot) {
        below_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (below_slot) {
        if (below_slot.p && dirty &
        /*$$scope*/
        4096) {
          update_slot(below_slot, below_slot_template, ctx,
          /*$$scope*/
          ctx[12], dirty, get_below_slot_changes$1, get_below_slot_context$1);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(below_slot, local);
      current = true;
    },

    o(local) {
      transition_out(below_slot, local);
      current = false;
    },

    d(detaching) {
      if (below_slot) below_slot.d(detaching);
    }

  };
} // (53:1) <slot name='on_left' slot='on_left'/>  <slot name='on_right' slot='on_right'/>  <slot name='in_front' slot='in_front'/> </Container> 


function create_on_left_slot(ctx) {
  let current;
  const on_left_slot_template =
  /*#slots*/
  ctx[10].on_left;
  const on_left_slot = create_slot(on_left_slot_template, ctx,
  /*$$scope*/
  ctx[12], get_on_left_slot_context$1);
  return {
    c() {
      if (on_left_slot) on_left_slot.c();
    },

    l(nodes) {
      if (on_left_slot) on_left_slot.l(nodes);
    },

    m(target, anchor) {
      if (on_left_slot) {
        on_left_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (on_left_slot) {
        if (on_left_slot.p && dirty &
        /*$$scope*/
        4096) {
          update_slot(on_left_slot, on_left_slot_template, ctx,
          /*$$scope*/
          ctx[12], dirty, get_on_left_slot_changes$1, get_on_left_slot_context$1);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(on_left_slot, local);
      current = true;
    },

    o(local) {
      transition_out(on_left_slot, local);
      current = false;
    },

    d(detaching) {
      if (on_left_slot) on_left_slot.d(detaching);
    }

  };
} // (54:1) <slot name='on_right' slot='on_right'/>  <slot name='in_front' slot='in_front'/> </Container> 


function create_on_right_slot(ctx) {
  let current;
  const on_right_slot_template =
  /*#slots*/
  ctx[10].on_right;
  const on_right_slot = create_slot(on_right_slot_template, ctx,
  /*$$scope*/
  ctx[12], get_on_right_slot_context$1);
  return {
    c() {
      if (on_right_slot) on_right_slot.c();
    },

    l(nodes) {
      if (on_right_slot) on_right_slot.l(nodes);
    },

    m(target, anchor) {
      if (on_right_slot) {
        on_right_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (on_right_slot) {
        if (on_right_slot.p && dirty &
        /*$$scope*/
        4096) {
          update_slot(on_right_slot, on_right_slot_template, ctx,
          /*$$scope*/
          ctx[12], dirty, get_on_right_slot_changes$1, get_on_right_slot_context$1);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(on_right_slot, local);
      current = true;
    },

    o(local) {
      transition_out(on_right_slot, local);
      current = false;
    },

    d(detaching) {
      if (on_right_slot) on_right_slot.d(detaching);
    }

  };
} // (55:1) <slot name='in_front' slot='in_front'/> </Container> 


function create_in_front_slot(ctx) {
  let current;
  const in_front_slot_template =
  /*#slots*/
  ctx[10].in_front;
  const in_front_slot = create_slot(in_front_slot_template, ctx,
  /*$$scope*/
  ctx[12], get_in_front_slot_context$1);
  return {
    c() {
      if (in_front_slot) in_front_slot.c();
    },

    l(nodes) {
      if (in_front_slot) in_front_slot.l(nodes);
    },

    m(target, anchor) {
      if (in_front_slot) {
        in_front_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (in_front_slot) {
        if (in_front_slot.p && dirty &
        /*$$scope*/
        4096) {
          update_slot(in_front_slot, in_front_slot_template, ctx,
          /*$$scope*/
          ctx[12], dirty, get_in_front_slot_changes$1, get_in_front_slot_context$1);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(in_front_slot, local);
      current = true;
    },

    o(local) {
      transition_out(in_front_slot, local);
      current = false;
    },

    d(detaching) {
      if (in_front_slot) in_front_slot.d(detaching);
    }

  };
} // (38:0) <Container  bind:ref  { ...$$restProps }  class="{ row } { $$props.class || '' }"  style='   { style };   align-items: { align_bottom ? 'flex-end' : center_y ? 'center' : 'flex-start' };   justify-content: { align_right ? 'flex-end' : center_x ? 'center' : 'flex-start' };  '  spacing_x={ spacing } >


function create_default_slot$8(ctx) {
  let t0;
  let t1;
  let t2;
  let t3;
  let t4;
  let t5;
  let current;
  const default_slot_template =
  /*#slots*/
  ctx[10].default;
  const default_slot = create_slot(default_slot_template, ctx,
  /*$$scope*/
  ctx[12], null);
  return {
    c() {
      t0 = space();
      if (default_slot) default_slot.c();
      t1 = space();
      t2 = space();
      t3 = space();
      t4 = space();
      t5 = space();
    },

    l(nodes) {
      t0 = claim_space(nodes);
      if (default_slot) default_slot.l(nodes);
      t1 = claim_space(nodes);
      t2 = claim_space(nodes);
      t3 = claim_space(nodes);
      t4 = claim_space(nodes);
      t5 = claim_space(nodes);
    },

    m(target, anchor) {
      insert(target, t0, anchor);

      if (default_slot) {
        default_slot.m(target, anchor);
      }

      insert(target, t1, anchor);
      insert(target, t2, anchor);
      insert(target, t3, anchor);
      insert(target, t4, anchor);
      insert(target, t5, anchor);
      current = true;
    },

    p(ctx, dirty) {
      if (default_slot) {
        if (default_slot.p && dirty &
        /*$$scope*/
        4096) {
          update_slot(default_slot, default_slot_template, ctx,
          /*$$scope*/
          ctx[12], dirty, null, null);
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
      if (detaching) detach(t0);
      if (default_slot) default_slot.d(detaching);
      if (detaching) detach(t1);
      if (detaching) detach(t2);
      if (detaching) detach(t3);
      if (detaching) detach(t4);
      if (detaching) detach(t5);
    }

  };
}

function create_fragment$a(ctx) {
  let container;
  let updating_ref;
  let current;
  const container_spread_levels = [
  /*$$restProps*/
  ctx[8], {
    class: "" + (
    /*row*/
    ctx[1] + " " + (
    /*$$props*/
    ctx[9].class || ""))
  }, {
    style: "\n\t\t" +
    /*style*/
    ctx[3] + ";\n\t\talign-items: " + (
    /*align_bottom*/
    ctx[7] ? "flex-end" :
    /*center_y*/
    ctx[6] ? "center" : "flex-start") + ";\n\t\tjustify-content: " + (
    /*align_right*/
    ctx[5] ? "flex-end" :
    /*center_x*/
    ctx[4] ? "center" : "flex-start") + ";\n\t"
  }, {
    spacing_x:
    /*spacing*/
    ctx[2]
  }];

  function container_ref_binding(value) {
    /*container_ref_binding*/
    ctx[11].call(null, value);
  }

  let container_props = {
    $$slots: {
      default: [create_default_slot$8],
      in_front: [create_in_front_slot],
      on_right: [create_on_right_slot],
      on_left: [create_on_left_slot],
      below: [create_below_slot],
      above: [create_above_slot],
      in_back: [create_in_back_slot]
    },
    $$scope: {
      ctx
    }
  };

  for (let i = 0; i < container_spread_levels.length; i += 1) {
    container_props = assign(container_props, container_spread_levels[i]);
  }

  if (
  /*ref*/
  ctx[0] !== void 0) {
    container_props.ref =
    /*ref*/
    ctx[0];
  }

  container = new Container({
    props: container_props
  });
  binding_callbacks.push(() => bind(container, "ref", container_ref_binding));
  return {
    c() {
      create_component(container.$$.fragment);
    },

    l(nodes) {
      claim_component(container.$$.fragment, nodes);
    },

    m(target, anchor) {
      mount_component(container, target, anchor);
      current = true;
    },

    p(ctx, [dirty]) {
      const container_changes = dirty &
      /*$$restProps, row, $$props, style, align_bottom, center_y, align_right, center_x, spacing*/
      1022 ? get_spread_update(container_spread_levels, [dirty &
      /*$$restProps*/
      256 && get_spread_object(
      /*$$restProps*/
      ctx[8]), dirty &
      /*row, $$props*/
      514 && {
        class: "" + (
        /*row*/
        ctx[1] + " " + (
        /*$$props*/
        ctx[9].class || ""))
      }, dirty &
      /*style, align_bottom, center_y, align_right, center_x*/
      248 && {
        style: "\n\t\t" +
        /*style*/
        ctx[3] + ";\n\t\talign-items: " + (
        /*align_bottom*/
        ctx[7] ? "flex-end" :
        /*center_y*/
        ctx[6] ? "center" : "flex-start") + ";\n\t\tjustify-content: " + (
        /*align_right*/
        ctx[5] ? "flex-end" :
        /*center_x*/
        ctx[4] ? "center" : "flex-start") + ";\n\t"
      }, dirty &
      /*spacing*/
      4 && {
        spacing_x:
        /*spacing*/
        ctx[2]
      }]) : {};

      if (dirty &
      /*$$scope*/
      4096) {
        container_changes.$$scope = {
          dirty,
          ctx
        };
      }

      if (!updating_ref && dirty &
      /*ref*/
      1) {
        updating_ref = true;
        container_changes.ref =
        /*ref*/
        ctx[0];
        add_flush_callback(() => updating_ref = false);
      }

      container.$set(container_changes);
    },

    i(local) {
      if (current) return;
      transition_in(container.$$.fragment, local);
      current = true;
    },

    o(local) {
      transition_out(container.$$.fragment, local);
      current = false;
    },

    d(detaching) {
      destroy_component(container, detaching);
    }

  };
}

function instance$a($$self, $$props, $$invalidate) {
  const omit_props_names = ["row", "ref", "spacing", "style", "center_x", "align_right", "center_y", "align_bottom"];
  let $$restProps = compute_rest_props($$props, omit_props_names);
  let {
    $$slots: slots = {},
    $$scope
  } = $$props;
  const row = "row_r6s9emb";
  let {
    ref = undefined
  } = $$props;
  let {
    spacing = 0
  } = $$props;
  let {
    style = ""
  } = $$props;
  let {
    center_x = false
  } = $$props;
  let {
    align_right = false
  } = $$props;
  let {
    center_y = false
  } = $$props;
  let {
    align_bottom = false
  } = $$props;

  function container_ref_binding(value) {
    ref = value;
    $$invalidate(0, ref);
  }

  $$self.$$set = $$new_props => {
    $$invalidate(9, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    $$invalidate(8, $$restProps = compute_rest_props($$props, omit_props_names));
    if ("ref" in $$new_props) $$invalidate(0, ref = $$new_props.ref);
    if ("spacing" in $$new_props) $$invalidate(2, spacing = $$new_props.spacing);
    if ("style" in $$new_props) $$invalidate(3, style = $$new_props.style);
    if ("center_x" in $$new_props) $$invalidate(4, center_x = $$new_props.center_x);
    if ("align_right" in $$new_props) $$invalidate(5, align_right = $$new_props.align_right);
    if ("center_y" in $$new_props) $$invalidate(6, center_y = $$new_props.center_y);
    if ("align_bottom" in $$new_props) $$invalidate(7, align_bottom = $$new_props.align_bottom);
    if ("$$scope" in $$new_props) $$invalidate(12, $$scope = $$new_props.$$scope);
  };

  $$props = exclude_internal_props($$props);
  return [ref, row, spacing, style, center_x, align_right, center_y, align_bottom, $$restProps, $$props, slots, container_ref_binding, $$scope];
}

class Row extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$a, create_fragment$a, safe_not_equal, {
      row: 1,
      ref: 0,
      spacing: 2,
      style: 3,
      center_x: 4,
      align_right: 5,
      center_y: 6,
      align_bottom: 7
    });
  }

  get row() {
    return this.$$.ctx[1];
  }

}

var css_248z$5 = ".box_b15mj1xn > :not(.nearby_n1ymrolb) ~ :not(.nearby_n1ymrolb){visibility:hidden;}.box_b15mj1xn > :not(.nearby_n1ymrolb) ~ :not(.nearby_n1ymrolb):before{content:\"Error: Box may only contain one child.\";visibility:visible;background:red;color:white;display:block;font-weight:bold;padding:30px;}.box_b15mj1xn > :not(.nearby_n1ymrolb) ~ :not(.nearby_n1ymrolb) ~ :not(.nearby_n1ymrolb):before{display:none;}\n";
styleInject(css_248z$5);

/* src/Box.svelte generated by Svelte v3.32.0 */

const get_in_front_slot_changes$2 = dirty => ({});

const get_in_front_slot_context$2 = ctx => ({
  slot: "in_front"
});

const get_on_right_slot_changes$2 = dirty => ({});

const get_on_right_slot_context$2 = ctx => ({
  slot: "on_right"
});

const get_on_left_slot_changes$2 = dirty => ({});

const get_on_left_slot_context$2 = ctx => ({
  slot: "on_left"
});

const get_below_slot_changes$2 = dirty => ({});

const get_below_slot_context$2 = ctx => ({
  slot: "below"
});

const get_above_slot_changes$2 = dirty => ({});

const get_above_slot_context$2 = ctx => ({
  slot: "above"
});

const get_in_back_slot_changes$2 = dirty => ({});

const get_in_back_slot_context$2 = ctx => ({
  slot: "in_back"
}); // (34:1) <slot name='in_back' slot='in_back'/>  <slot/>  <slot name='above' slot='above'/>  <slot name='below' slot='below'/>  <slot name='on_left' slot='on_left'/>  <slot name='on_right' slot='on_right'/>  <slot name='in_front' slot='in_front'/> </Row> 


function create_in_back_slot$1(ctx) {
  let current;
  const in_back_slot_template =
  /*#slots*/
  ctx[4].in_back;
  const in_back_slot = create_slot(in_back_slot_template, ctx,
  /*$$scope*/
  ctx[6], get_in_back_slot_context$2);
  return {
    c() {
      if (in_back_slot) in_back_slot.c();
    },

    l(nodes) {
      if (in_back_slot) in_back_slot.l(nodes);
    },

    m(target, anchor) {
      if (in_back_slot) {
        in_back_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (in_back_slot) {
        if (in_back_slot.p && dirty &
        /*$$scope*/
        64) {
          update_slot(in_back_slot, in_back_slot_template, ctx,
          /*$$scope*/
          ctx[6], dirty, get_in_back_slot_changes$2, get_in_back_slot_context$2);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(in_back_slot, local);
      current = true;
    },

    o(local) {
      transition_out(in_back_slot, local);
      current = false;
    },

    d(detaching) {
      if (in_back_slot) in_back_slot.d(detaching);
    }

  };
} // (36:1) <slot name='above' slot='above'/>  <slot name='below' slot='below'/>  <slot name='on_left' slot='on_left'/>  <slot name='on_right' slot='on_right'/>  <slot name='in_front' slot='in_front'/> </Row> 


function create_above_slot$1(ctx) {
  let current;
  const above_slot_template =
  /*#slots*/
  ctx[4].above;
  const above_slot = create_slot(above_slot_template, ctx,
  /*$$scope*/
  ctx[6], get_above_slot_context$2);
  return {
    c() {
      if (above_slot) above_slot.c();
    },

    l(nodes) {
      if (above_slot) above_slot.l(nodes);
    },

    m(target, anchor) {
      if (above_slot) {
        above_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (above_slot) {
        if (above_slot.p && dirty &
        /*$$scope*/
        64) {
          update_slot(above_slot, above_slot_template, ctx,
          /*$$scope*/
          ctx[6], dirty, get_above_slot_changes$2, get_above_slot_context$2);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(above_slot, local);
      current = true;
    },

    o(local) {
      transition_out(above_slot, local);
      current = false;
    },

    d(detaching) {
      if (above_slot) above_slot.d(detaching);
    }

  };
} // (37:1) <slot name='below' slot='below'/>  <slot name='on_left' slot='on_left'/>  <slot name='on_right' slot='on_right'/>  <slot name='in_front' slot='in_front'/> </Row> 


function create_below_slot$1(ctx) {
  let current;
  const below_slot_template =
  /*#slots*/
  ctx[4].below;
  const below_slot = create_slot(below_slot_template, ctx,
  /*$$scope*/
  ctx[6], get_below_slot_context$2);
  return {
    c() {
      if (below_slot) below_slot.c();
    },

    l(nodes) {
      if (below_slot) below_slot.l(nodes);
    },

    m(target, anchor) {
      if (below_slot) {
        below_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (below_slot) {
        if (below_slot.p && dirty &
        /*$$scope*/
        64) {
          update_slot(below_slot, below_slot_template, ctx,
          /*$$scope*/
          ctx[6], dirty, get_below_slot_changes$2, get_below_slot_context$2);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(below_slot, local);
      current = true;
    },

    o(local) {
      transition_out(below_slot, local);
      current = false;
    },

    d(detaching) {
      if (below_slot) below_slot.d(detaching);
    }

  };
} // (38:1) <slot name='on_left' slot='on_left'/>  <slot name='on_right' slot='on_right'/>  <slot name='in_front' slot='in_front'/> </Row> 


function create_on_left_slot$1(ctx) {
  let current;
  const on_left_slot_template =
  /*#slots*/
  ctx[4].on_left;
  const on_left_slot = create_slot(on_left_slot_template, ctx,
  /*$$scope*/
  ctx[6], get_on_left_slot_context$2);
  return {
    c() {
      if (on_left_slot) on_left_slot.c();
    },

    l(nodes) {
      if (on_left_slot) on_left_slot.l(nodes);
    },

    m(target, anchor) {
      if (on_left_slot) {
        on_left_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (on_left_slot) {
        if (on_left_slot.p && dirty &
        /*$$scope*/
        64) {
          update_slot(on_left_slot, on_left_slot_template, ctx,
          /*$$scope*/
          ctx[6], dirty, get_on_left_slot_changes$2, get_on_left_slot_context$2);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(on_left_slot, local);
      current = true;
    },

    o(local) {
      transition_out(on_left_slot, local);
      current = false;
    },

    d(detaching) {
      if (on_left_slot) on_left_slot.d(detaching);
    }

  };
} // (39:1) <slot name='on_right' slot='on_right'/>  <slot name='in_front' slot='in_front'/> </Row> 


function create_on_right_slot$1(ctx) {
  let current;
  const on_right_slot_template =
  /*#slots*/
  ctx[4].on_right;
  const on_right_slot = create_slot(on_right_slot_template, ctx,
  /*$$scope*/
  ctx[6], get_on_right_slot_context$2);
  return {
    c() {
      if (on_right_slot) on_right_slot.c();
    },

    l(nodes) {
      if (on_right_slot) on_right_slot.l(nodes);
    },

    m(target, anchor) {
      if (on_right_slot) {
        on_right_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (on_right_slot) {
        if (on_right_slot.p && dirty &
        /*$$scope*/
        64) {
          update_slot(on_right_slot, on_right_slot_template, ctx,
          /*$$scope*/
          ctx[6], dirty, get_on_right_slot_changes$2, get_on_right_slot_context$2);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(on_right_slot, local);
      current = true;
    },

    o(local) {
      transition_out(on_right_slot, local);
      current = false;
    },

    d(detaching) {
      if (on_right_slot) on_right_slot.d(detaching);
    }

  };
} // (40:1) <slot name='in_front' slot='in_front'/> </Row> 


function create_in_front_slot$1(ctx) {
  let current;
  const in_front_slot_template =
  /*#slots*/
  ctx[4].in_front;
  const in_front_slot = create_slot(in_front_slot_template, ctx,
  /*$$scope*/
  ctx[6], get_in_front_slot_context$2);
  return {
    c() {
      if (in_front_slot) in_front_slot.c();
    },

    l(nodes) {
      if (in_front_slot) in_front_slot.l(nodes);
    },

    m(target, anchor) {
      if (in_front_slot) {
        in_front_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (in_front_slot) {
        if (in_front_slot.p && dirty &
        /*$$scope*/
        64) {
          update_slot(in_front_slot, in_front_slot_template, ctx,
          /*$$scope*/
          ctx[6], dirty, get_in_front_slot_changes$2, get_in_front_slot_context$2);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(in_front_slot, local);
      current = true;
    },

    o(local) {
      transition_out(in_front_slot, local);
      current = false;
    },

    d(detaching) {
      if (in_front_slot) in_front_slot.d(detaching);
    }

  };
} // (29:0) <Row  bind:ref  { ...$$restProps }  class="{ box } { $$props.class || '' }" >


function create_default_slot$9(ctx) {
  let t0;
  let t1;
  let t2;
  let t3;
  let t4;
  let t5;
  let current;
  const default_slot_template =
  /*#slots*/
  ctx[4].default;
  const default_slot = create_slot(default_slot_template, ctx,
  /*$$scope*/
  ctx[6], null);
  return {
    c() {
      t0 = space();
      if (default_slot) default_slot.c();
      t1 = space();
      t2 = space();
      t3 = space();
      t4 = space();
      t5 = space();
    },

    l(nodes) {
      t0 = claim_space(nodes);
      if (default_slot) default_slot.l(nodes);
      t1 = claim_space(nodes);
      t2 = claim_space(nodes);
      t3 = claim_space(nodes);
      t4 = claim_space(nodes);
      t5 = claim_space(nodes);
    },

    m(target, anchor) {
      insert(target, t0, anchor);

      if (default_slot) {
        default_slot.m(target, anchor);
      }

      insert(target, t1, anchor);
      insert(target, t2, anchor);
      insert(target, t3, anchor);
      insert(target, t4, anchor);
      insert(target, t5, anchor);
      current = true;
    },

    p(ctx, dirty) {
      if (default_slot) {
        if (default_slot.p && dirty &
        /*$$scope*/
        64) {
          update_slot(default_slot, default_slot_template, ctx,
          /*$$scope*/
          ctx[6], dirty, null, null);
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
      if (detaching) detach(t0);
      if (default_slot) default_slot.d(detaching);
      if (detaching) detach(t1);
      if (detaching) detach(t2);
      if (detaching) detach(t3);
      if (detaching) detach(t4);
      if (detaching) detach(t5);
    }

  };
}

function create_fragment$b(ctx) {
  let row;
  let updating_ref;
  let current;
  const row_spread_levels = [
  /*$$restProps*/
  ctx[2], {
    class: "" + (
    /*box*/
    ctx[1] + " " + (
    /*$$props*/
    ctx[3].class || ""))
  }];

  function row_ref_binding(value) {
    /*row_ref_binding*/
    ctx[5].call(null, value);
  }

  let row_props = {
    $$slots: {
      default: [create_default_slot$9],
      in_front: [create_in_front_slot$1],
      on_right: [create_on_right_slot$1],
      on_left: [create_on_left_slot$1],
      below: [create_below_slot$1],
      above: [create_above_slot$1],
      in_back: [create_in_back_slot$1]
    },
    $$scope: {
      ctx
    }
  };

  for (let i = 0; i < row_spread_levels.length; i += 1) {
    row_props = assign(row_props, row_spread_levels[i]);
  }

  if (
  /*ref*/
  ctx[0] !== void 0) {
    row_props.ref =
    /*ref*/
    ctx[0];
  }

  row = new Row({
    props: row_props
  });
  binding_callbacks.push(() => bind(row, "ref", row_ref_binding));
  return {
    c() {
      create_component(row.$$.fragment);
    },

    l(nodes) {
      claim_component(row.$$.fragment, nodes);
    },

    m(target, anchor) {
      mount_component(row, target, anchor);
      current = true;
    },

    p(ctx, [dirty]) {
      const row_changes = dirty &
      /*$$restProps, box, $$props*/
      14 ? get_spread_update(row_spread_levels, [dirty &
      /*$$restProps*/
      4 && get_spread_object(
      /*$$restProps*/
      ctx[2]), dirty &
      /*box, $$props*/
      10 && {
        class: "" + (
        /*box*/
        ctx[1] + " " + (
        /*$$props*/
        ctx[3].class || ""))
      }]) : {};

      if (dirty &
      /*$$scope*/
      64) {
        row_changes.$$scope = {
          dirty,
          ctx
        };
      }

      if (!updating_ref && dirty &
      /*ref*/
      1) {
        updating_ref = true;
        row_changes.ref =
        /*ref*/
        ctx[0];
        add_flush_callback(() => updating_ref = false);
      }

      row.$set(row_changes);
    },

    i(local) {
      if (current) return;
      transition_in(row.$$.fragment, local);
      current = true;
    },

    o(local) {
      transition_out(row.$$.fragment, local);
      current = false;
    },

    d(detaching) {
      destroy_component(row, detaching);
    }

  };
}

function instance$b($$self, $$props, $$invalidate) {
  const omit_props_names = ["ref"];
  let $$restProps = compute_rest_props($$props, omit_props_names);
  let {
    $$slots: slots = {},
    $$scope
  } = $$props;
  let {
    ref = undefined
  } = $$props;
  const box = "box_b15mj1xn";

  function row_ref_binding(value) {
    ref = value;
    $$invalidate(0, ref);
  }

  $$self.$$set = $$new_props => {
    $$invalidate(3, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    $$invalidate(2, $$restProps = compute_rest_props($$props, omit_props_names));
    if ("ref" in $$new_props) $$invalidate(0, ref = $$new_props.ref);
    if ("$$scope" in $$new_props) $$invalidate(6, $$scope = $$new_props.$$scope);
  };

  $$props = exclude_internal_props($$props);
  return [ref, box, $$restProps, $$props, slots, row_ref_binding, $$scope];
}

class Box extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$b, create_fragment$b, safe_not_equal, {
      ref: 0
    });
  }

}

/* src/Aspect_ratio.svelte generated by Svelte v3.32.0 */

function create_in_back_slot$2(ctx) {
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

function create_fragment$c(ctx) {
	let box;
	let current;

	box = new Box({
			props: {
				width: fill,
				style: "padding-bottom: " + /*height_percent*/ ctx[0] + "%",
				$$slots: { in_back: [create_in_back_slot$2] },
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

function instance$c($$self, $$props, $$invalidate) {
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
		init(this, options, instance$c, create_fragment$c, safe_not_equal, { w: 1, h: 2 });
	}
}

var css_248z$6 = ".column_c13krpcw{-webkit-flex-direction:column;-ms-flex-direction:column;flex-direction:column;}.column_c13krpcw > .element_ekolm46[data-height-base=fill]{-webkit-flex-basis:0;-ms-flex-preferred-size:0;flex-basis:0;-webkit-box-flex:var(--height-base-value);-webkit-flex-grow:var(--height-base-value);-ms-flex-positive:var(--height-base-value);flex-grow:var(--height-base-value);}.column_c13krpcw > .element_ekolm46[data-width-base=fill]{width:100%;}.column_c13krpcw > .element_ekolm46[data-height-base=content]{-webkit-flex-basis:auto;-ms-flex-preferred-size:auto;flex-basis:auto;-webkit-box-flex:0;-webkit-flex-grow:0;-ms-flex-positive:0;flex-grow:0;}.column_c13krpcw > .element_ekolm46[data-width-base=content]{width:auto;}\n";
styleInject(css_248z$6);

/* src/Column.svelte generated by Svelte v3.32.0 */

const get_in_front_slot_changes$3 = dirty => ({});

const get_in_front_slot_context$3 = ctx => ({
  slot: "in_front"
});

const get_on_right_slot_changes$3 = dirty => ({});

const get_on_right_slot_context$3 = ctx => ({
  slot: "on_right"
});

const get_on_left_slot_changes$3 = dirty => ({});

const get_on_left_slot_context$3 = ctx => ({
  slot: "on_left"
});

const get_below_slot_changes$3 = dirty => ({});

const get_below_slot_context$3 = ctx => ({
  slot: "below"
});

const get_above_slot_changes$3 = dirty => ({});

const get_above_slot_context$3 = ctx => ({
  slot: "above"
});

const get_in_back_slot_changes$3 = dirty => ({});

const get_in_back_slot_context$3 = ctx => ({
  slot: "in_back"
}); // (49:1) <slot name='in_back' slot='in_back'/>  <slot/>  <slot name='above' slot='above'/>  <slot name='below' slot='below'/>  <slot name='on_left' slot='on_left'/>  <slot name='on_right' slot='on_right'/>  <slot name='in_front' slot='in_front'/> </Container> 


function create_in_back_slot$3(ctx) {
  let current;
  const in_back_slot_template =
  /*#slots*/
  ctx[10].in_back;
  const in_back_slot = create_slot(in_back_slot_template, ctx,
  /*$$scope*/
  ctx[12], get_in_back_slot_context$3);
  return {
    c() {
      if (in_back_slot) in_back_slot.c();
    },

    l(nodes) {
      if (in_back_slot) in_back_slot.l(nodes);
    },

    m(target, anchor) {
      if (in_back_slot) {
        in_back_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (in_back_slot) {
        if (in_back_slot.p && dirty &
        /*$$scope*/
        4096) {
          update_slot(in_back_slot, in_back_slot_template, ctx,
          /*$$scope*/
          ctx[12], dirty, get_in_back_slot_changes$3, get_in_back_slot_context$3);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(in_back_slot, local);
      current = true;
    },

    o(local) {
      transition_out(in_back_slot, local);
      current = false;
    },

    d(detaching) {
      if (in_back_slot) in_back_slot.d(detaching);
    }

  };
} // (51:1) <slot name='above' slot='above'/>  <slot name='below' slot='below'/>  <slot name='on_left' slot='on_left'/>  <slot name='on_right' slot='on_right'/>  <slot name='in_front' slot='in_front'/> </Container> 


function create_above_slot$2(ctx) {
  let current;
  const above_slot_template =
  /*#slots*/
  ctx[10].above;
  const above_slot = create_slot(above_slot_template, ctx,
  /*$$scope*/
  ctx[12], get_above_slot_context$3);
  return {
    c() {
      if (above_slot) above_slot.c();
    },

    l(nodes) {
      if (above_slot) above_slot.l(nodes);
    },

    m(target, anchor) {
      if (above_slot) {
        above_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (above_slot) {
        if (above_slot.p && dirty &
        /*$$scope*/
        4096) {
          update_slot(above_slot, above_slot_template, ctx,
          /*$$scope*/
          ctx[12], dirty, get_above_slot_changes$3, get_above_slot_context$3);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(above_slot, local);
      current = true;
    },

    o(local) {
      transition_out(above_slot, local);
      current = false;
    },

    d(detaching) {
      if (above_slot) above_slot.d(detaching);
    }

  };
} // (52:1) <slot name='below' slot='below'/>  <slot name='on_left' slot='on_left'/>  <slot name='on_right' slot='on_right'/>  <slot name='in_front' slot='in_front'/> </Container> 


function create_below_slot$2(ctx) {
  let current;
  const below_slot_template =
  /*#slots*/
  ctx[10].below;
  const below_slot = create_slot(below_slot_template, ctx,
  /*$$scope*/
  ctx[12], get_below_slot_context$3);
  return {
    c() {
      if (below_slot) below_slot.c();
    },

    l(nodes) {
      if (below_slot) below_slot.l(nodes);
    },

    m(target, anchor) {
      if (below_slot) {
        below_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (below_slot) {
        if (below_slot.p && dirty &
        /*$$scope*/
        4096) {
          update_slot(below_slot, below_slot_template, ctx,
          /*$$scope*/
          ctx[12], dirty, get_below_slot_changes$3, get_below_slot_context$3);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(below_slot, local);
      current = true;
    },

    o(local) {
      transition_out(below_slot, local);
      current = false;
    },

    d(detaching) {
      if (below_slot) below_slot.d(detaching);
    }

  };
} // (53:1) <slot name='on_left' slot='on_left'/>  <slot name='on_right' slot='on_right'/>  <slot name='in_front' slot='in_front'/> </Container> 


function create_on_left_slot$2(ctx) {
  let current;
  const on_left_slot_template =
  /*#slots*/
  ctx[10].on_left;
  const on_left_slot = create_slot(on_left_slot_template, ctx,
  /*$$scope*/
  ctx[12], get_on_left_slot_context$3);
  return {
    c() {
      if (on_left_slot) on_left_slot.c();
    },

    l(nodes) {
      if (on_left_slot) on_left_slot.l(nodes);
    },

    m(target, anchor) {
      if (on_left_slot) {
        on_left_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (on_left_slot) {
        if (on_left_slot.p && dirty &
        /*$$scope*/
        4096) {
          update_slot(on_left_slot, on_left_slot_template, ctx,
          /*$$scope*/
          ctx[12], dirty, get_on_left_slot_changes$3, get_on_left_slot_context$3);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(on_left_slot, local);
      current = true;
    },

    o(local) {
      transition_out(on_left_slot, local);
      current = false;
    },

    d(detaching) {
      if (on_left_slot) on_left_slot.d(detaching);
    }

  };
} // (54:1) <slot name='on_right' slot='on_right'/>  <slot name='in_front' slot='in_front'/> </Container> 


function create_on_right_slot$2(ctx) {
  let current;
  const on_right_slot_template =
  /*#slots*/
  ctx[10].on_right;
  const on_right_slot = create_slot(on_right_slot_template, ctx,
  /*$$scope*/
  ctx[12], get_on_right_slot_context$3);
  return {
    c() {
      if (on_right_slot) on_right_slot.c();
    },

    l(nodes) {
      if (on_right_slot) on_right_slot.l(nodes);
    },

    m(target, anchor) {
      if (on_right_slot) {
        on_right_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (on_right_slot) {
        if (on_right_slot.p && dirty &
        /*$$scope*/
        4096) {
          update_slot(on_right_slot, on_right_slot_template, ctx,
          /*$$scope*/
          ctx[12], dirty, get_on_right_slot_changes$3, get_on_right_slot_context$3);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(on_right_slot, local);
      current = true;
    },

    o(local) {
      transition_out(on_right_slot, local);
      current = false;
    },

    d(detaching) {
      if (on_right_slot) on_right_slot.d(detaching);
    }

  };
} // (55:1) <slot name='in_front' slot='in_front'/> </Container> 


function create_in_front_slot$2(ctx) {
  let current;
  const in_front_slot_template =
  /*#slots*/
  ctx[10].in_front;
  const in_front_slot = create_slot(in_front_slot_template, ctx,
  /*$$scope*/
  ctx[12], get_in_front_slot_context$3);
  return {
    c() {
      if (in_front_slot) in_front_slot.c();
    },

    l(nodes) {
      if (in_front_slot) in_front_slot.l(nodes);
    },

    m(target, anchor) {
      if (in_front_slot) {
        in_front_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (in_front_slot) {
        if (in_front_slot.p && dirty &
        /*$$scope*/
        4096) {
          update_slot(in_front_slot, in_front_slot_template, ctx,
          /*$$scope*/
          ctx[12], dirty, get_in_front_slot_changes$3, get_in_front_slot_context$3);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(in_front_slot, local);
      current = true;
    },

    o(local) {
      transition_out(in_front_slot, local);
      current = false;
    },

    d(detaching) {
      if (in_front_slot) in_front_slot.d(detaching);
    }

  };
} // (38:0) <Container  bind:ref  { ...$$restProps }  class="{ column } { $$props.class || '' }"  style='   { style };   justify-content: { align_bottom ? 'flex-end' : center_y ? 'center' : 'flex-start' };   align-items: { align_right ? 'flex-end' : center_x ? 'center' : 'flex-start' };  '  spacing_y={ spacing } >


function create_default_slot$a(ctx) {
  let t0;
  let t1;
  let t2;
  let t3;
  let t4;
  let t5;
  let current;
  const default_slot_template =
  /*#slots*/
  ctx[10].default;
  const default_slot = create_slot(default_slot_template, ctx,
  /*$$scope*/
  ctx[12], null);
  return {
    c() {
      t0 = space();
      if (default_slot) default_slot.c();
      t1 = space();
      t2 = space();
      t3 = space();
      t4 = space();
      t5 = space();
    },

    l(nodes) {
      t0 = claim_space(nodes);
      if (default_slot) default_slot.l(nodes);
      t1 = claim_space(nodes);
      t2 = claim_space(nodes);
      t3 = claim_space(nodes);
      t4 = claim_space(nodes);
      t5 = claim_space(nodes);
    },

    m(target, anchor) {
      insert(target, t0, anchor);

      if (default_slot) {
        default_slot.m(target, anchor);
      }

      insert(target, t1, anchor);
      insert(target, t2, anchor);
      insert(target, t3, anchor);
      insert(target, t4, anchor);
      insert(target, t5, anchor);
      current = true;
    },

    p(ctx, dirty) {
      if (default_slot) {
        if (default_slot.p && dirty &
        /*$$scope*/
        4096) {
          update_slot(default_slot, default_slot_template, ctx,
          /*$$scope*/
          ctx[12], dirty, null, null);
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
      if (detaching) detach(t0);
      if (default_slot) default_slot.d(detaching);
      if (detaching) detach(t1);
      if (detaching) detach(t2);
      if (detaching) detach(t3);
      if (detaching) detach(t4);
      if (detaching) detach(t5);
    }

  };
}

function create_fragment$d(ctx) {
  let container;
  let updating_ref;
  let current;
  const container_spread_levels = [
  /*$$restProps*/
  ctx[8], {
    class: "" + (
    /*column*/
    ctx[7] + " " + (
    /*$$props*/
    ctx[9].class || ""))
  }, {
    style: "\n\t\t" +
    /*style*/
    ctx[2] + ";\n\t\tjustify-content: " + (
    /*align_bottom*/
    ctx[6] ? "flex-end" :
    /*center_y*/
    ctx[5] ? "center" : "flex-start") + ";\n\t\talign-items: " + (
    /*align_right*/
    ctx[4] ? "flex-end" :
    /*center_x*/
    ctx[3] ? "center" : "flex-start") + ";\n\t"
  }, {
    spacing_y:
    /*spacing*/
    ctx[1]
  }];

  function container_ref_binding(value) {
    /*container_ref_binding*/
    ctx[11].call(null, value);
  }

  let container_props = {
    $$slots: {
      default: [create_default_slot$a],
      in_front: [create_in_front_slot$2],
      on_right: [create_on_right_slot$2],
      on_left: [create_on_left_slot$2],
      below: [create_below_slot$2],
      above: [create_above_slot$2],
      in_back: [create_in_back_slot$3]
    },
    $$scope: {
      ctx
    }
  };

  for (let i = 0; i < container_spread_levels.length; i += 1) {
    container_props = assign(container_props, container_spread_levels[i]);
  }

  if (
  /*ref*/
  ctx[0] !== void 0) {
    container_props.ref =
    /*ref*/
    ctx[0];
  }

  container = new Container({
    props: container_props
  });
  binding_callbacks.push(() => bind(container, "ref", container_ref_binding));
  return {
    c() {
      create_component(container.$$.fragment);
    },

    l(nodes) {
      claim_component(container.$$.fragment, nodes);
    },

    m(target, anchor) {
      mount_component(container, target, anchor);
      current = true;
    },

    p(ctx, [dirty]) {
      const container_changes = dirty &
      /*$$restProps, column, $$props, style, align_bottom, center_y, align_right, center_x, spacing*/
      1022 ? get_spread_update(container_spread_levels, [dirty &
      /*$$restProps*/
      256 && get_spread_object(
      /*$$restProps*/
      ctx[8]), dirty &
      /*column, $$props*/
      640 && {
        class: "" + (
        /*column*/
        ctx[7] + " " + (
        /*$$props*/
        ctx[9].class || ""))
      }, dirty &
      /*style, align_bottom, center_y, align_right, center_x*/
      124 && {
        style: "\n\t\t" +
        /*style*/
        ctx[2] + ";\n\t\tjustify-content: " + (
        /*align_bottom*/
        ctx[6] ? "flex-end" :
        /*center_y*/
        ctx[5] ? "center" : "flex-start") + ";\n\t\talign-items: " + (
        /*align_right*/
        ctx[4] ? "flex-end" :
        /*center_x*/
        ctx[3] ? "center" : "flex-start") + ";\n\t"
      }, dirty &
      /*spacing*/
      2 && {
        spacing_y:
        /*spacing*/
        ctx[1]
      }]) : {};

      if (dirty &
      /*$$scope*/
      4096) {
        container_changes.$$scope = {
          dirty,
          ctx
        };
      }

      if (!updating_ref && dirty &
      /*ref*/
      1) {
        updating_ref = true;
        container_changes.ref =
        /*ref*/
        ctx[0];
        add_flush_callback(() => updating_ref = false);
      }

      container.$set(container_changes);
    },

    i(local) {
      if (current) return;
      transition_in(container.$$.fragment, local);
      current = true;
    },

    o(local) {
      transition_out(container.$$.fragment, local);
      current = false;
    },

    d(detaching) {
      destroy_component(container, detaching);
    }

  };
}

function instance$d($$self, $$props, $$invalidate) {
  const omit_props_names = ["ref", "spacing", "style", "center_x", "align_right", "center_y", "align_bottom"];
  let $$restProps = compute_rest_props($$props, omit_props_names);
  let {
    $$slots: slots = {},
    $$scope
  } = $$props;
  const column = "column_c13krpcw";
  let {
    ref = undefined
  } = $$props;
  let {
    spacing = 0
  } = $$props;
  let {
    style = ""
  } = $$props;
  let {
    center_x = false
  } = $$props;
  let {
    align_right = false
  } = $$props;
  let {
    center_y = false
  } = $$props;
  let {
    align_bottom = false
  } = $$props;

  function container_ref_binding(value) {
    ref = value;
    $$invalidate(0, ref);
  }

  $$self.$$set = $$new_props => {
    $$invalidate(9, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    $$invalidate(8, $$restProps = compute_rest_props($$props, omit_props_names));
    if ("ref" in $$new_props) $$invalidate(0, ref = $$new_props.ref);
    if ("spacing" in $$new_props) $$invalidate(1, spacing = $$new_props.spacing);
    if ("style" in $$new_props) $$invalidate(2, style = $$new_props.style);
    if ("center_x" in $$new_props) $$invalidate(3, center_x = $$new_props.center_x);
    if ("align_right" in $$new_props) $$invalidate(4, align_right = $$new_props.align_right);
    if ("center_y" in $$new_props) $$invalidate(5, center_y = $$new_props.center_y);
    if ("align_bottom" in $$new_props) $$invalidate(6, align_bottom = $$new_props.align_bottom);
    if ("$$scope" in $$new_props) $$invalidate(12, $$scope = $$new_props.$$scope);
  };

  $$props = exclude_internal_props($$props);
  return [ref, spacing, style, center_x, align_right, center_y, align_bottom, column, $$restProps, $$props, slots, container_ref_binding, $$scope];
}

class Column extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$d, create_fragment$d, safe_not_equal, {
      ref: 0,
      spacing: 1,
      style: 2,
      center_x: 3,
      align_right: 4,
      center_y: 5,
      align_bottom: 6
    });
  }

}

var css_248z$7 = ".image_i1b6qkac > img{display:block;object-fit:cover;}.image_i1b6qkac[data-height-base=fill] > img{height:100%;}.image_i1b6qkac[data-width-base=fill] > img{width:100%;}\n";
styleInject(css_248z$7);

const image = "image_i1b6qkac";

/* src/Image.svelte generated by Svelte v3.32.0 */

function create_default_slot$b(ctx) {
	let img;
	let img_src_value;

	return {
		c() {
			img = element("img");
			this.h();
		},
		l(nodes) {
			img = claim_element(nodes, "IMG", {
				class: true,
				src: true,
				alt: true,
				style: true
			});

			this.h();
		},
		h() {
			attr(img, "class", element$1);
			if (img.src !== (img_src_value = /*src*/ ctx[1])) attr(img, "src", img_src_value);
			attr(img, "alt", /*description*/ ctx[2]);
			set_style(img, "object-position", /*origin_x*/ ctx[3] * 100 + "% " + /*origin_y*/ ctx[4] * 100 + "%");
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

			if (dirty & /*origin_x, origin_y*/ 24) {
				set_style(img, "object-position", /*origin_x*/ ctx[3] * 100 + "% " + /*origin_y*/ ctx[4] * 100 + "%");
			}
		},
		d(detaching) {
			if (detaching) detach(img);
		}
	};
}

function create_fragment$e(ctx) {
	let box;
	let updating_ref;
	let current;

	const box_spread_levels = [
		/*$$restProps*/ ctx[5],
		{
			class: "" + (image + " " + (/*$$props*/ ctx[6].class || ""))
		}
	];

	function box_ref_binding(value) {
		/*box_ref_binding*/ ctx[7].call(null, value);
	}

	let box_props = {
		$$slots: { default: [create_default_slot$b] },
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
			const box_changes = (dirty & /*$$restProps, image, $$props*/ 96)
			? get_spread_update(box_spread_levels, [
					dirty & /*$$restProps*/ 32 && get_spread_object(/*$$restProps*/ ctx[5]),
					dirty & /*image, $$props*/ 64 && {
						class: "" + (image + " " + (/*$$props*/ ctx[6].class || ""))
					}
				])
			: {};

			if (dirty & /*$$scope, src, description, origin_x, origin_y*/ 286) {
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

function instance$e($$self, $$props, $$invalidate) {
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
		$$invalidate(5, $$restProps = compute_rest_props($$props, omit_props_names));
		if ("ref" in $$new_props) $$invalidate(0, ref = $$new_props.ref);
		if ("src" in $$new_props) $$invalidate(1, src = $$new_props.src);
		if ("description" in $$new_props) $$invalidate(2, description = $$new_props.description);
		if ("origin_x" in $$new_props) $$invalidate(3, origin_x = $$new_props.origin_x);
		if ("origin_y" in $$new_props) $$invalidate(4, origin_y = $$new_props.origin_y);
	};

	$$props = exclude_internal_props($$props);

	return [
		ref,
		src,
		description,
		origin_x,
		origin_y,
		$$restProps,
		$$props,
		box_ref_binding
	];
}

class Image extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$e, create_fragment$e, safe_not_equal, {
			ref: 0,
			src: 1,
			description: 2,
			origin_x: 3,
			origin_y: 4
		});
	}
}

var css_248z$8 = ".viewport_v1p95n9t{position:absolute;top:0;left:0;height:100%;width:100%;-webkit-overflow-scrolling:touch;}\n";
styleInject(css_248z$8);

const viewport = "viewport_v1p95n9t";

/* src/Viewport.svelte generated by Svelte v3.32.0 */

function create_default_slot$c(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[13].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

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
				if (default_slot.p && dirty & /*$$scope*/ 32768) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[15], dirty, null, null);
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

function create_fragment$f(ctx) {
	let div;
	let box;
	let updating_ref;
	let current;
	let mounted;
	let dispose;

	function box_ref_binding(value) {
		/*box_ref_binding*/ ctx[14].call(null, value);
	}

	let box_props = {
		class: "" + (viewport + " " + (/*$$props*/ ctx[12].class || "")),
		center_x: /*center_x*/ ctx[1],
		align_right: /*align_right*/ ctx[2],
		center_y: /*center_y*/ ctx[3],
		align_bottom: /*align_bottom*/ ctx[4],
		x,
		y,
		clip_x: /*clip_x*/ ctx[9],
		clip_y: /*clip_y*/ ctx[10],
		scroll_x: /*scroll_x*/ ctx[6],
		scroll_y: /*scroll_y*/ ctx[5],
		style: /*style*/ ctx[7],
		$$slots: { default: [create_default_slot$c] },
		$$scope: { ctx }
	};

	if (/*ref*/ ctx[0] !== void 0) {
		box_props.ref = /*ref*/ ctx[0];
	}

	box = new Box({ props: box_props });
	binding_callbacks.push(() => bind(box, "ref", box_ref_binding));

	return {
		c() {
			div = element("div");
			create_component(box.$$.fragment);
			this.h();
		},
		l(nodes) {
			div = claim_element(nodes, "DIV", { class: true, style: true });
			var div_nodes = children(div);
			claim_component(box.$$.fragment, div_nodes);
			div_nodes.forEach(detach);
			this.h();
		},
		h() {
			attr(div, "class", "viewport-context");
			set_style(div, "display", /*display*/ ctx[8]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(box, div, null);
			current = true;

			if (!mounted) {
				dispose = action_destroyer(/*render*/ ctx[11].call(null, div));
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			const box_changes = {};
			if (dirty & /*$$props*/ 4096) box_changes.class = "" + (viewport + " " + (/*$$props*/ ctx[12].class || ""));
			if (dirty & /*center_x*/ 2) box_changes.center_x = /*center_x*/ ctx[1];
			if (dirty & /*align_right*/ 4) box_changes.align_right = /*align_right*/ ctx[2];
			if (dirty & /*center_y*/ 8) box_changes.center_y = /*center_y*/ ctx[3];
			if (dirty & /*align_bottom*/ 16) box_changes.align_bottom = /*align_bottom*/ ctx[4];
			if (dirty & /*clip_x*/ 512) box_changes.clip_x = /*clip_x*/ ctx[9];
			if (dirty & /*clip_y*/ 1024) box_changes.clip_y = /*clip_y*/ ctx[10];
			if (dirty & /*scroll_x*/ 64) box_changes.scroll_x = /*scroll_x*/ ctx[6];
			if (dirty & /*scroll_y*/ 32) box_changes.scroll_y = /*scroll_y*/ ctx[5];
			if (dirty & /*style*/ 128) box_changes.style = /*style*/ ctx[7];

			if (dirty & /*$$scope*/ 32768) {
				box_changes.$$scope = { dirty, ctx };
			}

			if (!updating_ref && dirty & /*ref*/ 1) {
				updating_ref = true;
				box_changes.ref = /*ref*/ ctx[0];
				add_flush_callback(() => updating_ref = false);
			}

			box.$set(box_changes);

			if (!current || dirty & /*display*/ 256) {
				set_style(div, "display", /*display*/ ctx[8]);
			}
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
			if (detaching) detach(div);
			destroy_component(box);
			mounted = false;
			dispose();
		}
	};
}

let x = 0;
let y = 0;

function instance$f($$self, $$props, $$invalidate) {
	let clip_x;
	let clip_y;
	let { $$slots: slots = {}, $$scope } = $$props;
	let { ref = undefined } = $$props;
	let { center_x = false } = $$props;
	let { align_right = false } = $$props;
	let { center_y = false } = $$props;
	let { align_bottom = false } = $$props;
	let { scroll_y = true } = $$props;
	let { scroll_x = true } = $$props;
	let { style = "" } = $$props;
	let display = "none";

	const render = node => {
		document.body.appendChild(node);
		$$invalidate(8, display = "contents");
	};

	function box_ref_binding(value) {
		ref = value;
		$$invalidate(0, ref);
	}

	$$self.$$set = $$new_props => {
		$$invalidate(12, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("ref" in $$new_props) $$invalidate(0, ref = $$new_props.ref);
		if ("center_x" in $$new_props) $$invalidate(1, center_x = $$new_props.center_x);
		if ("align_right" in $$new_props) $$invalidate(2, align_right = $$new_props.align_right);
		if ("center_y" in $$new_props) $$invalidate(3, center_y = $$new_props.center_y);
		if ("align_bottom" in $$new_props) $$invalidate(4, align_bottom = $$new_props.align_bottom);
		if ("scroll_y" in $$new_props) $$invalidate(5, scroll_y = $$new_props.scroll_y);
		if ("scroll_x" in $$new_props) $$invalidate(6, scroll_x = $$new_props.scroll_x);
		if ("style" in $$new_props) $$invalidate(7, style = $$new_props.style);
		if ("$$scope" in $$new_props) $$invalidate(15, $$scope = $$new_props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*scroll_x*/ 64) {
			 $$invalidate(9, clip_x = !scroll_x);
		}

		if ($$self.$$.dirty & /*scroll_y*/ 32) {
			 $$invalidate(10, clip_y = !scroll_y);
		}
	};

	$$props = exclude_internal_props($$props);

	return [
		ref,
		center_x,
		align_right,
		center_y,
		align_bottom,
		scroll_y,
		scroll_x,
		style,
		display,
		clip_x,
		clip_y,
		render,
		$$props,
		slots,
		box_ref_binding,
		$$scope
	];
}

class Viewport extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$f, create_fragment$f, safe_not_equal, {
			ref: 0,
			center_x: 1,
			align_right: 2,
			center_y: 3,
			align_bottom: 4,
			scroll_y: 5,
			scroll_x: 6,
			style: 7
		});
	}
}

exports.Aspect_ratio = Aspect_ratio;
exports.Box = Box;
exports.Column = Column;
exports.Image = Image;
exports.Row = Row;
exports.Viewport = Viewport;
exports.content = content;
exports.fill = fill;
exports.length_css = length_css;
exports.max = max;
exports.min = min;
exports.px = px;
