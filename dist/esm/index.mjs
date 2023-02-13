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
let src_url_equal_anchor;
function src_url_equal(element_src, url) {
    if (!src_url_equal_anchor) {
        src_url_equal_anchor = document.createElement('a');
    }
    src_url_equal_anchor.href = url;
    return element_src === src_url_equal_anchor.href;
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
function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
    if (slot_changes) {
        const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
        slot.p(slot_context, slot_changes);
    }
}
function get_all_dirty_from_scope($$scope) {
    if ($$scope.ctx.length > 32) {
        const dirty = [];
        const length = $$scope.ctx.length / 32;
        for (let i = 0; i < length; i++) {
            dirty[i] = -1;
        }
        return dirty;
    }
    return -1;
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

// Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
// at the end of hydration without touching the remaining nodes.
let is_hydrating = false;
function start_hydrating() {
    is_hydrating = true;
}
function end_hydrating() {
    is_hydrating = false;
}
function upper_bound(low, high, key, value) {
    // Return first index of value larger than input value in the range [low, high)
    while (low < high) {
        const mid = low + ((high - low) >> 1);
        if (key(mid) <= value) {
            low = mid + 1;
        }
        else {
            high = mid;
        }
    }
    return low;
}
function init_hydrate(target) {
    if (target.hydrate_init)
        return;
    target.hydrate_init = true;
    // We know that all children have claim_order values since the unclaimed have been detached if target is not <head>
    let children = target.childNodes;
    // If target is <head>, there may be children without claim_order
    if (target.nodeName === 'HEAD') {
        const myChildren = [];
        for (let i = 0; i < children.length; i++) {
            const node = children[i];
            if (node.claim_order !== undefined) {
                myChildren.push(node);
            }
        }
        children = myChildren;
    }
    /*
    * Reorder claimed children optimally.
    * We can reorder claimed children optimally by finding the longest subsequence of
    * nodes that are already claimed in order and only moving the rest. The longest
    * subsequence of nodes that are claimed in order can be found by
    * computing the longest increasing subsequence of .claim_order values.
    *
    * This algorithm is optimal in generating the least amount of reorder operations
    * possible.
    *
    * Proof:
    * We know that, given a set of reordering operations, the nodes that do not move
    * always form an increasing subsequence, since they do not move among each other
    * meaning that they must be already ordered among each other. Thus, the maximal
    * set of nodes that do not move form a longest increasing subsequence.
    */
    // Compute longest increasing subsequence
    // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
    const m = new Int32Array(children.length + 1);
    // Predecessor indices + 1
    const p = new Int32Array(children.length);
    m[0] = -1;
    let longest = 0;
    for (let i = 0; i < children.length; i++) {
        const current = children[i].claim_order;
        // Find the largest subsequence length such that it ends in a value less than our current value
        // upper_bound returns first greater value, so we subtract one
        // with fast path for when we are on the current longest subsequence
        const seqLen = ((longest > 0 && children[m[longest]].claim_order <= current) ? longest + 1 : upper_bound(1, longest, idx => children[m[idx]].claim_order, current)) - 1;
        p[i] = m[seqLen] + 1;
        const newLen = seqLen + 1;
        // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
        m[newLen] = i;
        longest = Math.max(newLen, longest);
    }
    // The longest increasing subsequence of nodes (initially reversed)
    const lis = [];
    // The rest of the nodes, nodes that will be moved
    const toMove = [];
    let last = children.length - 1;
    for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
        lis.push(children[cur - 1]);
        for (; last >= cur; last--) {
            toMove.push(children[last]);
        }
        last--;
    }
    for (; last >= 0; last--) {
        toMove.push(children[last]);
    }
    lis.reverse();
    // We sort the nodes being moved to guarantee that their insertion order matches the claim order
    toMove.sort((a, b) => a.claim_order - b.claim_order);
    // Finally, we move the nodes
    for (let i = 0, j = 0; i < toMove.length; i++) {
        while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
            j++;
        }
        const anchor = j < lis.length ? lis[j] : null;
        target.insertBefore(toMove[i], anchor);
    }
}
function append_hydration(target, node) {
    if (is_hydrating) {
        init_hydrate(target);
        if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentNode !== target))) {
            target.actual_end_child = target.firstChild;
        }
        // Skip nodes of undefined ordering
        while ((target.actual_end_child !== null) && (target.actual_end_child.claim_order === undefined)) {
            target.actual_end_child = target.actual_end_child.nextSibling;
        }
        if (node !== target.actual_end_child) {
            // We only insert if the ordering of this node should be modified or the parent node is not target
            if (node.claim_order !== undefined || node.parentNode !== target) {
                target.insertBefore(node, target.actual_end_child);
            }
        }
        else {
            target.actual_end_child = node.nextSibling;
        }
    }
    else if (node.parentNode !== target || node.nextSibling !== null) {
        target.appendChild(node);
    }
}
function insert_hydration(target, node, anchor) {
    if (is_hydrating && !anchor) {
        append_hydration(target, node);
    }
    else if (node.parentNode !== target || node.nextSibling != anchor) {
        target.insertBefore(node, anchor || null);
    }
}
function detach(node) {
    if (node.parentNode) {
        node.parentNode.removeChild(node);
    }
}
function element$1(name) {
    return document.createElement(name);
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
function init_claim_info(nodes) {
    if (nodes.claim_info === undefined) {
        nodes.claim_info = { last_index: 0, total_claimed: 0 };
    }
}
function claim_node(nodes, predicate, processNode, createNode, dontUpdateLastIndex = false) {
    // Try to find nodes in an order such that we lengthen the longest increasing subsequence
    init_claim_info(nodes);
    const resultNode = (() => {
        // We first try to find an element after the previous one
        for (let i = nodes.claim_info.last_index; i < nodes.length; i++) {
            const node = nodes[i];
            if (predicate(node)) {
                const replacement = processNode(node);
                if (replacement === undefined) {
                    nodes.splice(i, 1);
                }
                else {
                    nodes[i] = replacement;
                }
                if (!dontUpdateLastIndex) {
                    nodes.claim_info.last_index = i;
                }
                return node;
            }
        }
        // Otherwise, we try to find one before
        // We iterate in reverse so that we don't go too far back
        for (let i = nodes.claim_info.last_index - 1; i >= 0; i--) {
            const node = nodes[i];
            if (predicate(node)) {
                const replacement = processNode(node);
                if (replacement === undefined) {
                    nodes.splice(i, 1);
                }
                else {
                    nodes[i] = replacement;
                }
                if (!dontUpdateLastIndex) {
                    nodes.claim_info.last_index = i;
                }
                else if (replacement === undefined) {
                    // Since we spliced before the last_index, we decrease it
                    nodes.claim_info.last_index--;
                }
                return node;
            }
        }
        // If we can't find any matching node, we create a new one
        return createNode();
    })();
    resultNode.claim_order = nodes.claim_info.total_claimed;
    nodes.claim_info.total_claimed += 1;
    return resultNode;
}
function claim_element_base(nodes, name, attributes, create_element) {
    return claim_node(nodes, (node) => node.nodeName === name, (node) => {
        const remove = [];
        for (let j = 0; j < node.attributes.length; j++) {
            const attribute = node.attributes[j];
            if (!attributes[attribute.name]) {
                remove.push(attribute.name);
            }
        }
        remove.forEach(v => node.removeAttribute(v));
        return undefined;
    }, () => create_element(name));
}
function claim_element(nodes, name, attributes) {
    return claim_element_base(nodes, name, attributes, element$1);
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
/**
 * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
 * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
 * it can be called from an external module).
 *
 * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
 *
 * https://svelte.dev/docs#run-time-svelte-onmount
 */
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
/**
 * Associates an arbitrary `context` object with the current component and the specified `key`
 * and returns that object. The context is then available to children of the component
 * (including slotted content) with `getContext`.
 *
 * Like lifecycle functions, this must be called during component initialisation.
 *
 * https://svelte.dev/docs#run-time-svelte-setcontext
 */
function setContext(key, context) {
    get_current_component().$$.context.set(key, context);
    return context;
}
/**
 * Retrieves the context that belongs to the closest parent component with the specified `key`.
 * Must be called during component initialisation.
 *
 * https://svelte.dev/docs#run-time-svelte-getcontext
 */
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
// flush() calls callbacks in this order:
// 1. All beforeUpdate callbacks, in order: parents before children
// 2. All bind:this callbacks, in reverse order: children before parents.
// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
//    for afterUpdates called during the initial onMount, which are called in
//    reverse order: children before parents.
// Since callbacks might update component values, which could trigger another
// call to flush(), the following steps guard against this:
// 1. During beforeUpdate, any updated components will be added to the
//    dirty_components array and will cause a reentrant call to flush(). Because
//    the flush index is kept outside the function, the reentrant call will pick
//    up where the earlier call left off and go through all dirty components. The
//    current_component value is saved and restored so that the reentrant call will
//    not interfere with the "parent" flush() call.
// 2. bind:this callbacks cannot trigger new flush() calls.
// 3. During afterUpdate, any updated components will NOT have their afterUpdate
//    callback called a second time; the seen_callbacks set, outside the flush()
//    function, guarantees this behavior.
const seen_callbacks = new Set();
let flushidx = 0; // Do *not* move this inside the flush() function
function flush() {
    // Do not reenter flush while dirty components are updated, as this can
    // result in an infinite loop. Instead, let the inner flush handle it.
    // Reentrancy is ok afterwards for bindings etc.
    if (flushidx !== 0) {
        return;
    }
    const saved_component = current_component;
    do {
        // first, call beforeUpdate functions
        // and update components
        try {
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
        }
        catch (e) {
            // reset dirty state to not end up in a deadlocked state and then rethrow
            dirty_components.length = 0;
            flushidx = 0;
            throw e;
        }
        set_current_component(null);
        dirty_components.length = 0;
        flushidx = 0;
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
    seen_callbacks.clear();
    set_current_component(saved_component);
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
    else if (callback) {
        callback();
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
function mount_component(component, target, anchor, customElement) {
    const { fragment, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    if (!customElement) {
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
            // if the component was destroyed immediately
            // it will update the `$$.on_destroy` reference to `null`.
            // the destructured on_destroy may still reference to the old array
            if (component.$$.on_destroy) {
                component.$$.on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
    }
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
function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const $$ = component.$$ = {
        fragment: null,
        ctx: [],
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        on_disconnect: [],
        before_update: [],
        after_update: [],
        context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false,
        root: options.target || parent_component.$$.root
    };
    append_styles && append_styles($$.root);
    let ready = false;
    $$.ctx = instance
        ? instance(component, options.props || {}, (i, ret, ...rest) => {
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
            start_hydrating();
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
        mount_component(component, options.target, options.anchor, options.customElement);
        end_hydrating();
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
        if (!is_function(callback)) {
            return noop;
        }
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

var css_248z$3 = ".element_ekolm46{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-flex-direction:row;-ms-flex-direction:row;flex-direction:row;-webkit-flex:0 0 auto;-ms-flex:0 0 auto;flex:0 0 auto;box-sizing:border-box;overflow:visible;}\n";
styleInject(css_248z$3);

const target_value = ({
  type,
  value
}) => type === 'ratio' ? `${value * 100}%` : `${value}px`;

/*
	TODO: to settle conflicts between given size, min, and/or max, perhaps the latest specified should always win
	max (10) (100) // => 10
	min (100) (10) // => 100
	min (100) (max (10) (fill)) // => 100
	max (10) (min (100) (fill)) // => 10
*/
const length_css = (property, length) => {
  return [length.type === 'px' ? `${property}: ${length.value}px;` : '', length.min.value > 0 ? `min-${property}: ${target_value(length.min)};` : '', length.max.value === Infinity ? '' : `max-${property}: ${target_value(length.max)};`].join(' ');
};

/*
	 styles necessary for a dom node child of a layout container
*/

// static styles
const element = "element_ekolm46";
const overflow_style = (axis, clip, scroll) => clip || scroll ? `overflow-${axis}: ${clip ? 'hidden' : 'auto'};` : '';

// dynamic styles
const element_style = ({
  height = content,
  width = content,
  padding,
  opacity,
  x,
  y,
  anchor_x,
  anchor_y,
  clip_x,
  clip_y,
  scroll_x,
  scroll_y
}) => [length_css('height', height), length_css('width', width), opacity == null ? '' : `opacity: ${opacity};`, padding == null ? '' : `padding: ${Array.isArray(padding) ? padding.map(n => `${n}px`).join(' ') : `${padding}px`};`, anchor_x ? `left: ${anchor_x[1] * 100}%; margin-right: ${anchor_x[1] * -100}%;` : '', anchor_y ? `top: ${anchor_y[1] * 100}%;` : '', `position: ${anchor_x || anchor_y ? 'absolute' : 'relative'};`, x || y || anchor_x || anchor_y ? `transform: translate3d(calc(${(anchor_x?.[0] ?? 0) * -100}% + ${x || 0}px), calc(${(anchor_y?.[0] ?? 0) * -100}% + ${y || 0}px), 0);` : '', overflow_style('x', clip_x, scroll_x), overflow_style('y', clip_y, scroll_y)].join('');

const space_between = 'space-between';
const space_around = 'space-around';
const space_evenly = 'space-evenly';

var css_248z$2 = ".layout_lb7yjy4{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-flex-wrap:nowrap;-ms-flex-wrap:nowrap;flex-wrap:nowrap;-webkit-align-items:flex-start;-webkit-box-align:flex-start;-ms-flex-align:flex-start;align-items:flex-start;-webkit-box-pack:start;-webkit-justify-content:flex-start;-ms-flex-pack:start;justify-content:flex-start;}\n.layout_x_l1m6442m{-webkit-flex-direction:row;-ms-flex-direction:row;flex-direction:row;}\n.layout_y_l8o4g34{-webkit-flex-direction:column;-ms-flex-direction:column;flex-direction:column;}\n";
styleInject(css_248z$2);

/*
	TODO: test that min/max work properly with fill and grow
*/
const fill_main_axis = (property, length) => `flex-grow: ${length.value}; flex-basis: 0px; ${property}: 0px; ${length.min ? '' : `min-${property}: 0px;`}`;
const fill_cross_axis = spacing => spacing ? `calc(100% - ${spacing}px)` : '100%';
const child_ratio_length = (property, parent, child) => child[property].type === 'ratio' ? `${property}: ${parent[property].type === 'grow' ? '0px' : `${child[property].value * 100}%`};` : '';

/*
	This file is for styles for layout containers, which are elements that contain one or more children.

	A layout container must choose an axis as its basis for layout, even if it can only contain one child,
	because the implementation is based on flex, where everything is a row or column.
*/

// static styles
const layout = "layout_lb7yjy4";

// dynamic styles
const layout_style = ({
  wrap
}) => wrap ? 'flex-wrap: wrap; align-content: flex-start;' : '';

// static styles for x layout
const layout_x = "layout_x_l1m6442m";
const layout_child = (parent, child) => [child_ratio_length('height', parent, child), child_ratio_length('width', parent, child), parent.spacing_y ? `margin-top: ${parent.spacing_y}px;` : '', parent.spacing_x ? `margin-left: ${parent.spacing_x}px;` : ''].join('');
const layout_x_child = ({
  spacing_x = 0,
  spacing_y = 0
} = {}) => ({
  height,
  width
}) => [height.type === 'fill' ? `height: ${fill_cross_axis(spacing_y)};` : '', height.type === 'grow' && height.value > 0 ? `height: ${fill_cross_axis(spacing_y)};` : '', width.type === 'fill' ? fill_main_axis('width', width) : '', width.type === 'grow' ? `flex-grow: ${width.value};` : ''].join('');

// static styles for y layout
const layout_y = "layout_y_l8o4g34";
const layout_y_child = ({
  spacing_x = 0,
  spacing_y = 0
} = {}) => ({
  height,
  width
}) => [height.type === 'fill' ? fill_main_axis('height', height) : '', height.type === 'grow' ? `flex-grow: ${height.value};` : '', width.type === 'fill' ? `width: ${fill_cross_axis(spacing_x)};` : '', width.type === 'grow' && width.value > 0 ? `width: ${fill_cross_axis(spacing_x)};` : ''].join('');

// dynamic styles for x layout
const layout_x_style = ({
  align_bottom,
  center_y,
  align_right,
  center_x
}) => [align_right || center_x ? `justify-content: ${align_right ? 'flex-end' : 'center'};` : '', align_bottom || center_y ? `align-items: ${align_bottom ? 'flex-end' : 'center'};` : ''].join('');

// dynamic styles for y layout
const layout_y_style = ({
  align_bottom,
  center_y,
  align_right,
  center_x
}) => [align_bottom || center_y ? `justify-content: ${align_bottom ? 'flex-end' : 'center'};` : '', align_right || center_x ? `align-items: ${align_right ? 'flex-end' : 'center'};` : ''].join('');

// dynamic styles for layout with spacing
const spacing_context = (x, y) => [typeof x === 'number' ? `margin-left: -${x}px;` : '', typeof y === 'number' ? `margin-top: -${y}px;` : ''].join('');

// dynamic styles for x layout with spacing
const spacing_x_context = (x, y) => [typeof x === 'string' ? `justify-content: ${x};` : '', typeof y === 'string' ? `align-content: ${y};` : ''].join('');

// dynamic styles for y layout with spacing
const spacing_y_context = (x, y) => [typeof x === 'string' ? `align-content: ${x};` : '', typeof y === 'string' ? `justify-content: ${y};` : ''].join('');

const subscriber_queue = [];
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = new Set();
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (const subscriber of subscribers) {
                    subscriber[1]();
                    subscriber_queue.push(subscriber, value);
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
        subscribers.add(subscriber);
        if (subscribers.size === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            subscribers.delete(subscriber);
            if (subscribers.size === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}

/* src/Layout_context.svelte generated by Svelte v3.55.1 */

function create_fragment$e(ctx) {
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
				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[2],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
						null
					);
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
	class: ''
};

const set_layout_context = value => setContext(CONTEXT_KEY, value);

function instance$e($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { context_class = '' } = $$props;
	let { context_style = layout_y_child() } = $$props;
	const store = writable();
	set_layout_context({ style: store, class: context_class });

	$$self.$$set = $$props => {
		if ('context_class' in $$props) $$invalidate(0, context_class = $$props.context_class);
		if ('context_style' in $$props) $$invalidate(1, context_style = $$props.context_style);
		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
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
		init(this, options, instance$e, create_fragment$e, safe_not_equal, { context_class: 0, context_style: 1 });
	}
}

var Layout_context$1 = Layout_context;

const concat = names => names.reduce((acc, value) => value ? `${acc} ${value}` : acc, '');

/* src/Element.svelte generated by Svelte v3.55.1 */

function create_default_slot$c(ctx) {
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
				if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[11],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null),
						null
					);
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
	let div;
	let layout_context;
	let div_style_value;
	let current;

	layout_context = new Layout_context$1({
			props: {
				$$slots: { default: [create_default_slot$c] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			div = element$1("div");
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
			attr(div, "class", /*class_name*/ ctx[2]);
			attr(div, "style", div_style_value = "" + (element_style(/*props*/ ctx[3]) + /*$context_style*/ ctx[4](/*props*/ ctx[3]) + /*style*/ ctx[1]));
		},
		m(target, anchor) {
			insert_hydration(target, div, anchor);
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

			if (!current || dirty & /*class_name*/ 4) {
				attr(div, "class", /*class_name*/ ctx[2]);
			}

			if (!current || dirty & /*props, $context_style, style*/ 26 && div_style_value !== (div_style_value = "" + (element_style(/*props*/ ctx[3]) + /*$context_style*/ ctx[4](/*props*/ ctx[3]) + /*style*/ ctx[1]))) {
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

function instance$d($$self, $$props, $$invalidate) {
	let height;
	let width;
	let props;
	let class_name;
	let $context_style;
	let { $$slots: slots = {}, $$scope } = $$props;
	let { ref = undefined } = $$props;
	let { on = null } = $$props;
	let { style = '' } = $$props;

	onMount(() => {
		if (on) {
			const dispose = Object.keys(on).map(name => typeof on[name] === 'function'
			? listen(ref, name, on[name])
			: listen(ref, name, on[name].listener, on[name].options));

			return () => run_all(dispose);
		}
	});

	const { style: context_style, class: context_class } = get_layout_context();
	component_subscribe($$self, context_style, value => $$invalidate(4, $context_style = value));

	function div_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			ref = $$value;
			$$invalidate(0, ref);
		});
	}

	$$self.$$set = $$new_props => {
		$$invalidate(13, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ('ref' in $$new_props) $$invalidate(0, ref = $$new_props.ref);
		if ('on' in $$new_props) $$invalidate(6, on = $$new_props.on);
		if ('style' in $$new_props) $$invalidate(1, style = $$new_props.style);
		if ('$$scope' in $$new_props) $$invalidate(11, $$scope = $$new_props.$$scope);
	};

	$$self.$$.update = () => {
		$$invalidate(8, height = format_length('height' in $$props ? $$props.height : content));
		$$invalidate(7, width = format_length('width' in $$props ? $$props.width : content));
		$$invalidate(3, props = { ...$$props, height, width });
		$$invalidate(2, class_name = concat([$$props.class, context_class, element]));
	};

	$$props = exclude_internal_props($$props);

	return [
		ref,
		style,
		class_name,
		props,
		$context_style,
		context_style,
		on,
		width,
		height,
		slots,
		div_binding,
		$$scope
	];
}

class Element extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$d, create_fragment$d, safe_not_equal, { ref: 0, on: 6, style: 1 });
	}
}

var Element$1 = Element;

/* src/Box.svelte generated by Svelte v3.55.1 */

function create_default_slot_1$1(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[7].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);

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
				if (default_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[10],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[10], dirty, null),
						null
					);
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

// (43:0) <Element  bind:ref  style="{ layout_x_style($$props) }{ style }"  { ...element_props } >
function create_default_slot$b(ctx) {
	let layout_context;
	let current;

	layout_context = new Layout_context$1({
			props: {
				context_style: /*func*/ ctx[8],
				$$slots: { default: [create_default_slot_1$1] },
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
		p(ctx, dirty) {
			const layout_context_changes = {};
			if (dirty & /*context_values*/ 8) layout_context_changes.context_style = /*func*/ ctx[8];

			if (dirty & /*$$scope*/ 1024) {
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

function create_fragment$c(ctx) {
	let element_1;
	let updating_ref;
	let current;

	const element_1_spread_levels = [
		{
			style: "" + (layout_x_style(/*$$props*/ ctx[4]) + /*style*/ ctx[1])
		},
		/*element_props*/ ctx[2]
	];

	function element_1_ref_binding(value) {
		/*element_1_ref_binding*/ ctx[9](value);
	}

	let element_1_props = {
		$$slots: { default: [create_default_slot$b] },
		$$scope: { ctx }
	};

	for (let i = 0; i < element_1_spread_levels.length; i += 1) {
		element_1_props = assign(element_1_props, element_1_spread_levels[i]);
	}

	if (/*ref*/ ctx[0] !== void 0) {
		element_1_props.ref = /*ref*/ ctx[0];
	}

	element_1 = new Element$1({ props: element_1_props });
	binding_callbacks.push(() => bind(element_1, 'ref', element_1_ref_binding));

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
			const element_1_changes = (dirty & /*layout_x_style, $$props, style, element_props*/ 22)
			? get_spread_update(element_1_spread_levels, [
					dirty & /*layout_x_style, $$props, style*/ 18 && {
						style: "" + (layout_x_style(/*$$props*/ ctx[4]) + /*style*/ ctx[1])
					},
					dirty & /*element_props*/ 4 && get_spread_object(/*element_props*/ ctx[2])
				])
			: {};

			if (dirty & /*$$scope, context_values*/ 1032) {
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

function instance$c($$self, $$props, $$invalidate) {
	let height;
	let width;
	let context_values;
	let element_props;
	const omit_props_names = ["ref","style"];
	let $$restProps = compute_rest_props($$props, omit_props_names);
	let { $$slots: slots = {}, $$scope } = $$props;
	let { ref = undefined } = $$props;
	let { style = '' } = $$props;
	const func = props => `${layout_child(context_values, props)}${layout_x_child()(props)}`;

	function element_1_ref_binding(value) {
		ref = value;
		$$invalidate(0, ref);
	}

	$$self.$$set = $$new_props => {
		$$invalidate(4, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		$$invalidate(11, $$restProps = compute_rest_props($$props, omit_props_names));
		if ('ref' in $$new_props) $$invalidate(0, ref = $$new_props.ref);
		if ('style' in $$new_props) $$invalidate(1, style = $$new_props.style);
		if ('$$scope' in $$new_props) $$invalidate(10, $$scope = $$new_props.$$scope);
	};

	$$self.$$.update = () => {
		$$invalidate(6, height = format_length('height' in $$props ? $$props.height : content));
		$$invalidate(5, width = format_length('width' in $$props ? $$props.width : content));

		if ($$self.$$.dirty & /*height, width*/ 96) {
			$$invalidate(3, context_values = { height, width });
		}

		$$invalidate(2, element_props = {
			...$$restProps,
			class: concat([$$props.class, 'box', layout_x, layout]),
			height,
			width
		});
	};

	$$props = exclude_internal_props($$props);

	return [
		ref,
		style,
		element_props,
		context_values,
		$$props,
		width,
		height,
		slots,
		func,
		element_1_ref_binding,
		$$scope
	];
}

class Box extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$c, create_fragment$c, safe_not_equal, { ref: 0, style: 1 });
	}
}

var Box$1 = Box;

/* src/Aspect_ratio.svelte generated by Svelte v3.55.1 */

function create_in_back_slot(ctx) {
	let div;
	let current;
	const default_slot_template = /*#slots*/ ctx[3].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

	return {
		c() {
			div = element$1("div");
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
			insert_hydration(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[4],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[4])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null),
						null
					);
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

function create_fragment$b(ctx) {
	let box;
	let current;

	box = new Box$1({
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

function instance$b($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { w = 0 } = $$props;
	let { h = 0 } = $$props;
	let height_percent;

	$$self.$$set = $$props => {
		if ('w' in $$props) $$invalidate(1, w = $$props.w);
		if ('h' in $$props) $$invalidate(2, h = $$props.h);
		if ('$$scope' in $$props) $$invalidate(4, $$scope = $$props.$$scope);
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
		init(this, options, instance$b, create_fragment$b, safe_not_equal, { w: 1, h: 2 });
	}
}

var Aspect_ratio$1 = Aspect_ratio;

/* src/Layout.svelte generated by Svelte v3.55.1 */

function create_default_slot_1(ctx) {
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
				if (default_slot.p && (!current || dirty & /*$$scope*/ 262144)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[18],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[18])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[18], dirty, null),
						null
					);
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

// (52:0) <Element  bind:ref  style={ outer_style }  { ...element_props } >
function create_default_slot$a(ctx) {
	let div;
	let layout_context_1;
	let div_class_value;
	let current;

	layout_context_1 = new Layout_context$1({
			props: {
				context_style: /*context_style*/ ctx[2],
				$$slots: { default: [create_default_slot_1] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			div = element$1("div");
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
			attr(div, "style", /*inner_style*/ ctx[4]);
		},
		m(target, anchor) {
			insert_hydration(target, div, anchor);
			mount_component(layout_context_1, div, null);
			current = true;
		},
		p(ctx, dirty) {
			const layout_context_1_changes = {};
			if (dirty & /*context_style*/ 4) layout_context_1_changes.context_style = /*context_style*/ ctx[2];

			if (dirty & /*$$scope*/ 262144) {
				layout_context_1_changes.$$scope = { dirty, ctx };
			}

			layout_context_1.$set(layout_context_1_changes);

			if (!current || dirty & /*layout_class*/ 2 && div_class_value !== (div_class_value = "" + (/*layout_class*/ ctx[1] + " " + layout))) {
				attr(div, "class", div_class_value);
			}

			if (!current || dirty & /*inner_style*/ 16) {
				attr(div, "style", /*inner_style*/ ctx[4]);
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

function create_fragment$a(ctx) {
	let element_1;
	let updating_ref;
	let current;
	const element_1_spread_levels = [{ style: /*outer_style*/ ctx[5] }, /*element_props*/ ctx[3]];

	function element_1_ref_binding(value) {
		/*element_1_ref_binding*/ ctx[17](value);
	}

	let element_1_props = {
		$$slots: { default: [create_default_slot$a] },
		$$scope: { ctx }
	};

	for (let i = 0; i < element_1_spread_levels.length; i += 1) {
		element_1_props = assign(element_1_props, element_1_spread_levels[i]);
	}

	if (/*ref*/ ctx[0] !== void 0) {
		element_1_props.ref = /*ref*/ ctx[0];
	}

	element_1 = new Element$1({ props: element_1_props });
	binding_callbacks.push(() => bind(element_1, 'ref', element_1_ref_binding));

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
			const element_1_changes = (dirty & /*outer_style, element_props*/ 40)
			? get_spread_update(element_1_spread_levels, [
					dirty & /*outer_style*/ 32 && { style: /*outer_style*/ ctx[5] },
					dirty & /*element_props*/ 8 && get_spread_object(/*element_props*/ ctx[3])
				])
			: {};

			if (dirty & /*$$scope, layout_class, inner_style, context_style*/ 262166) {
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

function instance$a($$self, $$props, $$invalidate) {
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
	let { container_style = '' } = $$props; // TODO: this is temporary, especially in case `align-content` is needed
	let { style = '' } = $$props;
	let { ref = undefined } = $$props;
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
		$$invalidate(20, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		$$invalidate(19, $$restProps = compute_rest_props($$props, omit_props_names));
		if ('container_style' in $$new_props) $$invalidate(6, container_style = $$new_props.container_style);
		if ('style' in $$new_props) $$invalidate(7, style = $$new_props.style);
		if ('ref' in $$new_props) $$invalidate(0, ref = $$new_props.ref);
		if ('layout_class' in $$new_props) $$invalidate(1, layout_class = $$new_props.layout_class);
		if ('layout_style' in $$new_props) $$invalidate(8, layout_style$1 = $$new_props.layout_style);
		if ('layout_spacing' in $$new_props) $$invalidate(9, layout_spacing = $$new_props.layout_spacing);
		if ('layout_context' in $$new_props) $$invalidate(10, layout_context = $$new_props.layout_context);
		if ('spacing_x' in $$new_props) $$invalidate(11, spacing_x = $$new_props.spacing_x);
		if ('spacing_y' in $$new_props) $$invalidate(12, spacing_y = $$new_props.spacing_y);
		if ('$$scope' in $$new_props) $$invalidate(18, $$scope = $$new_props.$$scope);
	};

	$$self.$$.update = () => {
		$$invalidate(5, outer_style = [layout_x_style($$props), style].join(''));

		$$invalidate(4, inner_style = [
			// NOTE: width: 100% is necessary for Safari so that width={fill} children don't cause this element to get wider
			// TODO: are there cases where height: 100% is also necessary for the same reason? This all needs to be fully investigated and documented.
			'flex-grow: 1; align-self: stretch; width: 100%;',
			layout_style($$props),
			layout_style$1($$props),
			layout_spacing(spacing_x, spacing_y),
			spacing_context(spacing_x, spacing_y),
			container_style
		].join(''));

		$$invalidate(15, height = format_length('height' in $$props ? $$props.height : content));
		$$invalidate(14, width = format_length('width' in $$props ? $$props.width : content));
		$$invalidate(3, element_props = { ...$$restProps, height, width });

		if ($$self.$$.dirty & /*height, width, spacing_x, spacing_y*/ 55296) {
			$$invalidate(13, context_values = {
				height,
				width,
				spacing_x: typeof spacing_x === 'number' ? spacing_x : 0,
				spacing_y: typeof spacing_y === 'number' ? spacing_y : 0
			});
		}

		if ($$self.$$.dirty & /*context_values, layout_context*/ 9216) {
			$$invalidate(2, context_style = props => `${layout_child(context_values, props)}${layout_context(context_values)(props)}`);
		}
	};

	$$props = exclude_internal_props($$props);

	return [
		ref,
		layout_class,
		context_style,
		element_props,
		inner_style,
		outer_style,
		container_style,
		style,
		layout_style$1,
		layout_spacing,
		layout_context,
		spacing_x,
		spacing_y,
		context_values,
		width,
		height,
		slots,
		element_1_ref_binding,
		$$scope
	];
}

class Layout extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
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

var Layout$1 = Layout;

/* src/Column.svelte generated by Svelte v3.55.1 */

function create_default_slot$9(ctx) {
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
				if (default_slot.p && (!current || dirty & /*$$scope*/ 32)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[5],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[5])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null),
						null
					);
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
	let layout;
	let updating_ref;
	let current;

	const layout_spread_levels = [
		/*$$restProps*/ ctx[1],
		{
			class: concat([/*$$props*/ ctx[2].class, 'column'])
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
		/*layout_ref_binding*/ ctx[4](value);
	}

	let layout_props = {
		$$slots: { default: [create_default_slot$9] },
		$$scope: { ctx }
	};

	for (let i = 0; i < layout_spread_levels.length; i += 1) {
		layout_props = assign(layout_props, layout_spread_levels[i]);
	}

	if (/*ref*/ ctx[0] !== void 0) {
		layout_props.ref = /*ref*/ ctx[0];
	}

	layout = new Layout$1({ props: layout_props });
	binding_callbacks.push(() => bind(layout, 'ref', layout_ref_binding));

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
						class: concat([/*$$props*/ ctx[2].class, 'column'])
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

function instance$9($$self, $$props, $$invalidate) {
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
		if ('ref' in $$new_props) $$invalidate(0, ref = $$new_props.ref);
		if ('$$scope' in $$new_props) $$invalidate(5, $$scope = $$new_props.$$scope);
	};

	$$props = exclude_internal_props($$props);
	return [ref, $$restProps, $$props, slots, layout_ref_binding, $$scope];
}

class Column extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$9, create_fragment$9, safe_not_equal, { ref: 0 });
	}
}

var Column$1 = Column;

var css_248z$1 = ".image_i1b6qkac > img{display:block;object-fit:cover;}\n";
styleInject(css_248z$1);

const image = "image_i1b6qkac";

/* src/Image.svelte generated by Svelte v3.55.1 */

function create_default_slot$8(ctx) {
	let img;
	let img_src_value;

	return {
		c() {
			img = element$1("img");
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
			if (!src_url_equal(img.src, img_src_value = /*src*/ ctx[1])) attr(img, "src", img_src_value);
			attr(img, "alt", /*description*/ ctx[2]);
			attr(img, "width", /*width*/ ctx[4]);
			attr(img, "height", /*height*/ ctx[3]);
			attr(img, "style", /*style*/ ctx[5]);
		},
		m(target, anchor) {
			insert_hydration(target, img, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*src*/ 2 && !src_url_equal(img.src, img_src_value = /*src*/ ctx[1])) {
				attr(img, "src", img_src_value);
			}

			if (dirty & /*description*/ 4) {
				attr(img, "alt", /*description*/ ctx[2]);
			}

			if (dirty & /*width*/ 16) {
				attr(img, "width", /*width*/ ctx[4]);
			}

			if (dirty & /*height*/ 8) {
				attr(img, "height", /*height*/ ctx[3]);
			}

			if (dirty & /*style*/ 32) {
				attr(img, "style", /*style*/ ctx[5]);
			}
		},
		d(detaching) {
			if (detaching) detach(img);
		}
	};
}

function create_fragment$8(ctx) {
	let box;
	let updating_ref;
	let current;

	const box_spread_levels = [
		/*$$restProps*/ ctx[7],
		{
			class: [/*$$props*/ ctx[6].class || '', image].join(' ')
		}
	];

	function box_ref_binding(value) {
		/*box_ref_binding*/ ctx[12](value);
	}

	let box_props = {
		$$slots: { default: [create_default_slot$8] },
		$$scope: { ctx }
	};

	for (let i = 0; i < box_spread_levels.length; i += 1) {
		box_props = assign(box_props, box_spread_levels[i]);
	}

	if (/*ref*/ ctx[0] !== void 0) {
		box_props.ref = /*ref*/ ctx[0];
	}

	box = new Box$1({ props: box_props });
	binding_callbacks.push(() => bind(box, 'ref', box_ref_binding));

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
						class: [/*$$props*/ ctx[6].class || '', image].join(' ')
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

function instance$8($$self, $$props, $$invalidate) {
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
		if ('ref' in $$new_props) $$invalidate(0, ref = $$new_props.ref);
		if ('src' in $$new_props) $$invalidate(1, src = $$new_props.src);
		if ('description' in $$new_props) $$invalidate(2, description = $$new_props.description);
		if ('origin_x' in $$new_props) $$invalidate(8, origin_x = $$new_props.origin_x);
		if ('origin_y' in $$new_props) $$invalidate(9, origin_y = $$new_props.origin_y);
	};

	$$self.$$.update = () => {
		$$invalidate(10, height_prop = format_length($$props.height || content));
		$$invalidate(11, width_prop = format_length($$props.width || content));

		if ($$self.$$.dirty & /*origin_x, origin_y, height_prop, width_prop*/ 3840) {
			$$invalidate(5, style = [
				`object-position: ${origin_x * 100}% ${origin_y * 100}%;`,
				height_prop.type !== 'content' ? `height: 100%;` : '',
				width_prop.type !== 'content' ? `width: 100%;` : ''
			].join(''));
		}

		if ($$self.$$.dirty & /*width_prop*/ 2048) {
			$$invalidate(4, width = width_prop.type === 'px' ? width_prop.value : null);
		}

		if ($$self.$$.dirty & /*height_prop*/ 1024) {
			$$invalidate(3, height = height_prop.type === 'px' ? height_prop.value : null);
		}
	};

	$$props = exclude_internal_props($$props);

	return [
		ref,
		src,
		description,
		height,
		width,
		style,
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

		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
			ref: 0,
			src: 1,
			description: 2,
			origin_x: 8,
			origin_y: 9
		});
	}
}

var Image$1 = Image;

/* src/Row.svelte generated by Svelte v3.55.1 */

function create_default_slot$7(ctx) {
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
				if (default_slot.p && (!current || dirty & /*$$scope*/ 32)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[5],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[5])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null),
						null
					);
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
			class: concat([/*$$props*/ ctx[2].class, 'row'])
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
		/*layout_ref_binding*/ ctx[4](value);
	}

	let layout_props = {
		$$slots: { default: [create_default_slot$7] },
		$$scope: { ctx }
	};

	for (let i = 0; i < layout_spread_levels.length; i += 1) {
		layout_props = assign(layout_props, layout_spread_levels[i]);
	}

	if (/*ref*/ ctx[0] !== void 0) {
		layout_props.ref = /*ref*/ ctx[0];
	}

	layout = new Layout$1({ props: layout_props });
	binding_callbacks.push(() => bind(layout, 'ref', layout_ref_binding));

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
						class: concat([/*$$props*/ ctx[2].class, 'row'])
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
		if ('ref' in $$new_props) $$invalidate(0, ref = $$new_props.ref);
		if ('$$scope' in $$new_props) $$invalidate(5, $$scope = $$new_props.$$scope);
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

var Row$1 = Row;

var css_248z = ".nearby_n1ymrolb{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;position:absolute !important;pointer-events:none;}\n.nearby_x_nc97fwj{top:0;z-index:1;height:100%;}\n.nearby_y_n1dmxc9z{left:0;z-index:1;width:100%;}\n.nearby_z_n91qj6k{top:0;left:0;height:100%;width:100%;}\n.in_back_i1ulrqav{z-index:0;}\n.in_front_i1xlmqx2{z-index:1;}\n.on_left_okq8kx3{right:100%;-webkit-box-pack:end;-webkit-justify-content:flex-end;-ms-flex-pack:end;justify-content:flex-end;}\n.on_right_o105wjvu{left:100%;}\n.above_ayr7vx7{bottom:100%;}\n.below_b1lubls{top:100%;}\n.nearby_child_n1iosxib{pointer-events:auto;}\n";
styleInject(css_248z);

/*
	The `position` of `element_style` in `element.js` overrides this `position: absolute`, breaking nearby elements.
	Nearby elements are deprecated by anchoring and should be removed in the future.
	Meanwhile, this bug is fixed by `position: absolute !important;`.
*/
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

/* src/Nearby.svelte generated by Svelte v3.55.1 */

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
				if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[3],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
						null
					);
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
	let div;
	let layout_context;
	let div_class_value;
	let current;

	layout_context = new Layout_context$1({
			props: {
				context_class: nearby_child,
				context_style: /*context_style*/ ctx[0],
				$$slots: { default: [create_default_slot$6] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			div = element$1("div");
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
			insert_hydration(target, div, anchor);
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

function instance$6($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { context_style } = $$props;

	$$self.$$set = $$new_props => {
		$$invalidate(1, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ('context_style' in $$new_props) $$invalidate(0, context_style = $$new_props.context_style);
		if ('$$scope' in $$new_props) $$invalidate(3, $$scope = $$new_props.$$scope);
	};

	$$props = exclude_internal_props($$props);
	return [context_style, $$props, slots, $$scope];
}

class Nearby extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$6, create_fragment$6, safe_not_equal, { context_style: 0 });
	}
}

var Nearby$1 = Nearby;

/* src/Above.svelte generated by Svelte v3.55.1 */

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
				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[1],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
						null
					);
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

	nearby = new Nearby$1({
			props: {
				class: "" + (above + " " + nearby_y),
				context_style: nearby_y_child,
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

function instance$5($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	$$self.$$set = $$props => {
		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [slots, $$scope];
}

class Above extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});
	}
}

var Above$1 = Above;

/* src/Below.svelte generated by Svelte v3.55.1 */

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
				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[1],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
						null
					);
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

	nearby = new Nearby$1({
			props: {
				class: "" + (below + " " + nearby_y),
				context_style: nearby_y_child,
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

function instance$4($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	$$self.$$set = $$props => {
		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [slots, $$scope];
}

class Below extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});
	}
}

var Below$1 = Below;

/* src/On_left.svelte generated by Svelte v3.55.1 */

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
				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[1],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
						null
					);
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

	nearby = new Nearby$1({
			props: {
				class: "" + (on_left + " " + nearby_x),
				context_style: nearby_x_child,
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

function instance$3($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	$$self.$$set = $$props => {
		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [slots, $$scope];
}

class On_left extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});
	}
}

var On_left$1 = On_left;

/* src/On_right.svelte generated by Svelte v3.55.1 */

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
				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[1],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
						null
					);
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

function create_fragment$2(ctx) {
	let nearby;
	let current;

	nearby = new Nearby$1({
			props: {
				class: "" + (on_right + " " + nearby_x),
				context_style: nearby_x_child,
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

function instance$2($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	$$self.$$set = $$props => {
		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [slots, $$scope];
}

class On_right extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});
	}
}

var On_right$1 = On_right;

/* src/In_back.svelte generated by Svelte v3.55.1 */

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
				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[1],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
						null
					);
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
	let nearby;
	let current;

	nearby = new Nearby$1({
			props: {
				class: "" + (in_back + " " + nearby_z),
				context_style: nearby_z_child,
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

function instance$1($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	$$self.$$set = $$props => {
		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [slots, $$scope];
}

class In_back extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});
	}
}

var In_back$1 = In_back;

/* src/In_front.svelte generated by Svelte v3.55.1 */

function create_default_slot(ctx) {
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
				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[1],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
						null
					);
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

function create_fragment(ctx) {
	let layout_context;
	let current;

	layout_context = new Layout_context$1({
			props: {
				context_class: "" + (in_front + " " + nearby_z + " " + nearby),
				context_style: nearby_z_child,
				$$slots: { default: [create_default_slot] },
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

function instance($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;

	$$self.$$set = $$props => {
		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [slots, $$scope];
}

class In_front extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, {});
	}
}

var In_front$1 = In_front;

export { Above$1 as Above, Aspect_ratio$1 as Aspect_ratio, Below$1 as Below, Box$1 as Box, Column$1 as Column, Image$1 as Image, In_back$1 as In_back, In_front$1 as In_front, On_left$1 as On_left, On_right$1 as On_right, Row$1 as Row, content, fill, format_length, format_length_property, grow, length_defaults, max, min, px, ratio, space_around, space_between, space_evenly };
