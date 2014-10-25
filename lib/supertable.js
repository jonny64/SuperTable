(function() {//     Underscore.js 1.4.4
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.4';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? null : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(context, args.concat(slice.call(arguments)));
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

define("underscore", (function (global) {
    return function () {
        var ret, fn;
        return ret || global._;
    };
}(this)));

if ( typeof define === "function" && define.amd && define.amd.jQuery ) {
        define( "jquery", [], function () { return jQuery; } );
}


;
!function($){
  function rewriteSelector(context, name, argPos){
    var original = context[name];

    if (!original) return;

    context[name] = function(){
      arguments[argPos] = arguments[argPos].replace(/@([\w\u00c0-\uFFFF\-]+)/g, '[role~="$1"]');
      return original.apply(context, arguments);
    };

    $.extend(context[name], original);
  }

  rewriteSelector($, 'find', 0);
  rewriteSelector($, 'multiFilter', 0);
  rewriteSelector($.find, 'matchesSelector', 1);
  rewriteSelector($.find, 'matches', 0);

  function parse(roleString, without){
    var role, result = [], roles = $.trim(roleString).split(/\s+/);

    for(var i=0; i<roles.length; i++) {
      role = roles[i];
      if (!~$.inArray(role, result) && (!without || !~$.inArray(role, without)))
        result.push(role);
    }

    return result;
  };

  $.extend($.fn, {
    roles: function(){ return parse(this.attr('role')); },

    hasRole: function(roleName){
      var roles = parse(roleName);
      for(var i=0;i<roles.length;i++)
        if (!this.is('@'+roles[i])) return false;

      return true;
    },

    addRole: function(roleName){
      if (this.hasRole(roleName)) return this;

      return this.each(function(_, element){
        var $el = $(element);
        $el.attr('role', parse($el.attr('role') + ' ' + roleName).join(' '));
      });
    },

    removeRole: function(roleName){
      if (!this.hasRole(roleName)) return this;

      return this.each(function(_, element){
        var $el = $(element);
        $el.attr('role', parse($el.attr('role'), parse(roleName)).join(' '));
      });
    },

    toggleRole: function(roleName){
      var roles = parse(roleName);
      for(var i=0;i<roles.length;i++)
        this[this.hasRole(roles[i]) ? 'removeRole' : 'addRole'].call(this, roles[i]);
      return this;
    }
  });
}(jQuery);
define("jquery.role", function(){});

/**
 * Copyright (c) 2011-2013 Felix Gnass
 * Licensed under the MIT license
 */
(function(root, factory) {

  /* CommonJS */
  if (typeof exports == 'object')  module.exports = factory()

  /* AMD module */
  else if (typeof define == 'function' && define.amd) define('spin',factory)

  /* Browser global */
  else root.Spinner = factory()
}
(this, function() {
  "use strict";

  var prefixes = ['webkit', 'Moz', 'ms', 'O'] /* Vendor prefixes */
    , animations = {} /* Animation rules keyed by their name */
    , useCssAnimations /* Whether to use CSS animations or setTimeout */

  /**
   * Utility function to create elements. If no tag name is given,
   * a DIV is created. Optionally properties can be passed.
   */
  function createEl(tag, prop) {
    var el = document.createElement(tag || 'div')
      , n

    for(n in prop) el[n] = prop[n]
    return el
  }

  /**
   * Appends children and returns the parent.
   */
  function ins(parent /* child1, child2, ...*/) {
    for (var i=1, n=arguments.length; i<n; i++)
      parent.appendChild(arguments[i])

    return parent
  }

  /**
   * Insert a new stylesheet to hold the @keyframe or VML rules.
   */
  var sheet = (function() {
    var el = createEl('style', {type : 'text/css'})
    ins(document.getElementsByTagName('head')[0], el)
    return el.sheet || el.styleSheet
  }())

  /**
   * Creates an opacity keyframe animation rule and returns its name.
   * Since most mobile Webkits have timing issues with animation-delay,
   * we create separate rules for each line/segment.
   */
  function addAnimation(alpha, trail, i, lines) {
    var name = ['opacity', trail, ~~(alpha*100), i, lines].join('-')
      , start = 0.01 + i/lines * 100
      , z = Math.max(1 - (1-alpha) / trail * (100-start), alpha)
      , prefix = useCssAnimations.substring(0, useCssAnimations.indexOf('Animation')).toLowerCase()
      , pre = prefix && '-' + prefix + '-' || ''

    if (!animations[name]) {
      sheet.insertRule(
        '@' + pre + 'keyframes ' + name + '{' +
        '0%{opacity:' + z + '}' +
        start + '%{opacity:' + alpha + '}' +
        (start+0.01) + '%{opacity:1}' +
        (start+trail) % 100 + '%{opacity:' + alpha + '}' +
        '100%{opacity:' + z + '}' +
        '}', sheet.cssRules.length)

      animations[name] = 1
    }

    return name
  }

  /**
   * Tries various vendor prefixes and returns the first supported property.
   */
  function vendor(el, prop) {
    var s = el.style
      , pp
      , i

    prop = prop.charAt(0).toUpperCase() + prop.slice(1)
    for(i=0; i<prefixes.length; i++) {
      pp = prefixes[i]+prop
      if(s[pp] !== undefined) return pp
    }
    if(s[prop] !== undefined) return prop
  }

  /**
   * Sets multiple style properties at once.
   */
  function css(el, prop) {
    for (var n in prop)
      el.style[vendor(el, n)||n] = prop[n]

    return el
  }

  /**
   * Fills in default values.
   */
  function merge(obj) {
    for (var i=1; i < arguments.length; i++) {
      var def = arguments[i]
      for (var n in def)
        if (obj[n] === undefined) obj[n] = def[n]
    }
    return obj
  }

  /**
   * Returns the absolute page-offset of the given element.
   */
  function pos(el) {
    var o = { x:el.offsetLeft, y:el.offsetTop }
    while((el = el.offsetParent))
      o.x+=el.offsetLeft, o.y+=el.offsetTop

    return o
  }

  /**
   * Returns the line color from the given string or array.
   */
  function getColor(color, idx) {
    return typeof color == 'string' ? color : color[idx % color.length]
  }

  // Built-in defaults

  var defaults = {
    lines: 12,            // The number of lines to draw
    length: 7,            // The length of each line
    width: 5,             // The line thickness
    radius: 10,           // The radius of the inner circle
    rotate: 0,            // Rotation offset
    corners: 1,           // Roundness (0..1)
    color: '#000',        // #rgb or #rrggbb
    direction: 1,         // 1: clockwise, -1: counterclockwise
    speed: 1,             // Rounds per second
    trail: 100,           // Afterglow percentage
    opacity: 1/4,         // Opacity of the lines
    fps: 20,              // Frames per second when using setTimeout()
    zIndex: 2e9,          // Use a high z-index by default
    className: 'spinner', // CSS class to assign to the element
    top: 'auto',          // center vertically
    left: 'auto',         // center horizontally
    position: 'relative'  // element position
  }

  /** The constructor */
  function Spinner(o) {
    if (typeof this == 'undefined') return new Spinner(o)
    this.opts = merge(o || {}, Spinner.defaults, defaults)
  }

  // Global defaults that override the built-ins:
  Spinner.defaults = {}

  merge(Spinner.prototype, {

    /**
     * Adds the spinner to the given target element. If this instance is already
     * spinning, it is automatically removed from its previous target b calling
     * stop() internally.
     */
    spin: function(target) {
      this.stop()

      var self = this
        , o = self.opts
        , el = self.el = css(createEl(0, {className: o.className}), {position: o.position, width: 0, zIndex: o.zIndex})
        , mid = o.radius+o.length+o.width
        , ep // element position
        , tp // target position

      if (target) {
        target.insertBefore(el, target.firstChild||null)
        tp = pos(target)
        ep = pos(el)
        css(el, {
          left: (o.left == 'auto' ? tp.x-ep.x + (target.offsetWidth >> 1) : parseInt(o.left, 10) + mid) + 'px',
          top: (o.top == 'auto' ? tp.y-ep.y + (target.offsetHeight >> 1) : parseInt(o.top, 10) + mid)  + 'px'
        })
      }

      el.setAttribute('role', 'progressbar')
      self.lines(el, self.opts)

      if (!useCssAnimations) {
        // No CSS animation support, use setTimeout() instead
        var i = 0
          , start = (o.lines - 1) * (1 - o.direction) / 2
          , alpha
          , fps = o.fps
          , f = fps/o.speed
          , ostep = (1-o.opacity) / (f*o.trail / 100)
          , astep = f/o.lines

        ;(function anim() {
          i++;
          for (var j = 0; j < o.lines; j++) {
            alpha = Math.max(1 - (i + (o.lines - j) * astep) % f * ostep, o.opacity)

            self.opacity(el, j * o.direction + start, alpha, o)
          }
          self.timeout = self.el && setTimeout(anim, ~~(1000/fps))
        })()
      }
      return self
    },

    /**
     * Stops and removes the Spinner.
     */
    stop: function() {
      var el = this.el
      if (el) {
        clearTimeout(this.timeout)
        if (el.parentNode) el.parentNode.removeChild(el)
        this.el = undefined
      }
      return this
    },

    /**
     * Internal method that draws the individual lines. Will be overwritten
     * in VML fallback mode below.
     */
    lines: function(el, o) {
      var i = 0
        , start = (o.lines - 1) * (1 - o.direction) / 2
        , seg

      function fill(color, shadow) {
        return css(createEl(), {
          position: 'absolute',
          width: (o.length+o.width) + 'px',
          height: o.width + 'px',
          background: color,
          boxShadow: shadow,
          transformOrigin: 'left',
          transform: 'rotate(' + ~~(360/o.lines*i+o.rotate) + 'deg) translate(' + o.radius+'px' +',0)',
          borderRadius: (o.corners * o.width>>1) + 'px'
        })
      }

      for (; i < o.lines; i++) {
        seg = css(createEl(), {
          position: 'absolute',
          top: 1+~(o.width/2) + 'px',
          transform: o.hwaccel ? 'translate3d(0,0,0)' : '',
          opacity: o.opacity,
          animation: useCssAnimations && addAnimation(o.opacity, o.trail, start + i * o.direction, o.lines) + ' ' + 1/o.speed + 's linear infinite'
        })

        if (o.shadow) ins(seg, css(fill('#000', '0 0 4px ' + '#000'), {top: 2+'px'}))
        ins(el, ins(seg, fill(getColor(o.color, i), '0 0 1px rgba(0,0,0,.1)')))
      }
      return el
    },

    /**
     * Internal method that adjusts the opacity of a single line.
     * Will be overwritten in VML fallback mode below.
     */
    opacity: function(el, i, val) {
      if (i < el.childNodes.length) el.childNodes[i].style.opacity = val
    }

  })


  function initVML() {

    /* Utility function to create a VML tag */
    function vml(tag, attr) {
      return createEl('<' + tag + ' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">', attr)
    }

    // No CSS transforms but VML support, add a CSS rule for VML elements:
    sheet.addRule('.spin-vml', 'behavior:url(#default#VML)')

    Spinner.prototype.lines = function(el, o) {
      var r = o.length+o.width
        , s = 2*r

      function grp() {
        return css(
          vml('group', {
            coordsize: s + ' ' + s,
            coordorigin: -r + ' ' + -r
          }),
          { width: s, height: s }
        )
      }

      var margin = -(o.width+o.length)*2 + 'px'
        , g = css(grp(), {position: 'absolute', top: margin, left: margin})
        , i

      function seg(i, dx, filter) {
        ins(g,
          ins(css(grp(), {rotation: 360 / o.lines * i + 'deg', left: ~~dx}),
            ins(css(vml('roundrect', {arcsize: o.corners}), {
                width: r,
                height: o.width,
                left: o.radius,
                top: -o.width>>1,
                filter: filter
              }),
              vml('fill', {color: getColor(o.color, i), opacity: o.opacity}),
              vml('stroke', {opacity: 0}) // transparent stroke to fix color bleeding upon opacity change
            )
          )
        )
      }

      if (o.shadow)
        for (i = 1; i <= o.lines; i++)
          seg(i, -2, 'progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)')

      for (i = 1; i <= o.lines; i++) seg(i)
      return ins(el, g)
    }

    Spinner.prototype.opacity = function(el, i, val, o) {
      var c = el.firstChild
      o = o.shadow && o.lines || 0
      if (c && i+o < c.childNodes.length) {
        c = c.childNodes[i+o]; c = c && c.firstChild; c = c && c.firstChild
        if (c) c.opacity = val
      }
    }
  }

  var probe = css(createEl('group'), {behavior: 'url(#default#VML)'})

  if (!vendor(probe, 'transform') && probe.adj) initVML()
  else useCssAnimations = vendor(probe, 'animation')

  return Spinner

}));

/**
 * Copyright (c) 2011-2013 Felix Gnass
 * Licensed under the MIT license
 */

/*

Basic Usage:
============

$('#el').spin(); // Creates a default Spinner using the text color of #el.
$('#el').spin({ ... }); // Creates a Spinner using the provided options.

$('#el').spin(false); // Stops and removes the spinner.

Using Presets:
==============

$('#el').spin('small'); // Creates a 'small' Spinner using the text color of #el.
$('#el').spin('large', '#fff'); // Creates a 'large' white Spinner.

Adding a custom preset:
=======================

$.fn.spin.presets.flower = {
  lines: 9
  length: 10
  width: 20
  radius: 0
}

$('#el').spin('flower', 'red');

*/

(function(factory) {

  if (typeof exports == 'object') {
    // CommonJS
    factory(require('jquery'), require('spin'))
  }
  else if (typeof define == 'function' && define.amd) {
    // AMD, register as anonymous module
    define('jquery.spin',['jquery', 'spin'], factory)
  }
  else {
    // Browser globals
    if (!window.Spinner) throw new Error('Spin.js not present')
    factory(window.jQuery, window.Spinner)
  }

}(function($, Spinner) {

  $.fn.spin = function(opts, color) {

    return this.each(function() {
      var $this = $(this),
        data = $this.data();

      if (data.spinner) {
        data.spinner.stop();
        delete data.spinner;
      }
      if (opts !== false) {
        opts = $.extend(
          { color: color || $this.css('color') },
          $.fn.spin.presets[opts] || opts
        )
        data.spinner = new Spinner(opts).spin(this)
      }
    })
  }

  $.fn.spin.presets = {
    tiny: { lines: 8, length: 2, width: 2, radius: 3 },
    small: { lines: 8, length: 4, width: 3, radius: 5 },
    large: { lines: 10, length: 8, width: 4, radius: 8 }
  }

}));

/*! Copyright (c) 2013 Brandon Aaron (http://brandon.aaron.sh)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Version: 3.1.11
 *
 * Requires: jQuery 1.2.2+
 */

(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define('jquery-mousewheel',['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS style for Browserify
        module.exports = factory;
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    var toFix  = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'],
        toBind = ( 'onwheel' in document || document.documentMode >= 9 ) ?
                    ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'],
        slice  = Array.prototype.slice,
        nullLowestDeltaTimeout, lowestDelta;

    if ( $.event.fixHooks ) {
        for ( var i = toFix.length; i; ) {
            $.event.fixHooks[ toFix[--i] ] = $.event.mouseHooks;
        }
    }

    var special = $.event.special.mousewheel = {
        version: '3.1.11',

        setup: function() {
            if ( this.addEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.addEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = handler;
            }
            // Store the line height and page height for this particular element
            $.data(this, 'mousewheel-line-height', special.getLineHeight(this));
            $.data(this, 'mousewheel-page-height', special.getPageHeight(this));
        },

        teardown: function() {
            if ( this.removeEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.removeEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = null;
            }
            // Clean up the data we added to the element
            $.removeData(this, 'mousewheel-line-height');
            $.removeData(this, 'mousewheel-page-height');
        },

        getLineHeight: function(elem) {
            var $parent = $(elem)['offsetParent' in $.fn ? 'offsetParent' : 'parent']();
            if (!$parent.length) {
                $parent = $('body');
            }
            return parseInt($parent.css('fontSize'), 10);
        },

        getPageHeight: function(elem) {
            return $(elem).height();
        },

        settings: {
            adjustOldDeltas: true, // see shouldAdjustOldDeltas() below
            normalizeOffset: true  // calls getBoundingClientRect for each event
        }
    };

    $.fn.extend({
        mousewheel: function(fn) {
            return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
        },

        unmousewheel: function(fn) {
            return this.unbind('mousewheel', fn);
        }
    });


    function handler(event) {
        var orgEvent   = event || window.event,
            args       = slice.call(arguments, 1),
            delta      = 0,
            deltaX     = 0,
            deltaY     = 0,
            absDelta   = 0,
            offsetX    = 0,
            offsetY    = 0;
        event = $.event.fix(orgEvent);
        event.type = 'mousewheel';

        // Old school scrollwheel delta
        if ( 'detail'      in orgEvent ) { deltaY = orgEvent.detail * -1;      }
        if ( 'wheelDelta'  in orgEvent ) { deltaY = orgEvent.wheelDelta;       }
        if ( 'wheelDeltaY' in orgEvent ) { deltaY = orgEvent.wheelDeltaY;      }
        if ( 'wheelDeltaX' in orgEvent ) { deltaX = orgEvent.wheelDeltaX * -1; }

        // Firefox < 17 horizontal scrolling related to DOMMouseScroll event
        if ( 'axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
            deltaX = deltaY * -1;
            deltaY = 0;
        }

        // Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
        delta = deltaY === 0 ? deltaX : deltaY;

        // New school wheel delta (wheel event)
        if ( 'deltaY' in orgEvent ) {
            deltaY = orgEvent.deltaY * -1;
            delta  = deltaY;
        }
        if ( 'deltaX' in orgEvent ) {
            deltaX = orgEvent.deltaX;
            if ( deltaY === 0 ) { delta  = deltaX * -1; }
        }

        // No change actually happened, no reason to go any further
        if ( deltaY === 0 && deltaX === 0 ) { return; }

        // Need to convert lines and pages to pixels if we aren't already in pixels
        // There are three delta modes:
        //   * deltaMode 0 is by pixels, nothing to do
        //   * deltaMode 1 is by lines
        //   * deltaMode 2 is by pages
        if ( orgEvent.deltaMode === 1 ) {
            var lineHeight = $.data(this, 'mousewheel-line-height');
            delta  *= lineHeight;
            deltaY *= lineHeight;
            deltaX *= lineHeight;
        } else if ( orgEvent.deltaMode === 2 ) {
            var pageHeight = $.data(this, 'mousewheel-page-height');
            delta  *= pageHeight;
            deltaY *= pageHeight;
            deltaX *= pageHeight;
        }

        // Store lowest absolute delta to normalize the delta values
        absDelta = Math.max( Math.abs(deltaY), Math.abs(deltaX) );

        if ( !lowestDelta || absDelta < lowestDelta ) {
            lowestDelta = absDelta;

            // Adjust older deltas if necessary
            if ( shouldAdjustOldDeltas(orgEvent, absDelta) ) {
                lowestDelta /= 40;
            }
        }

        // Adjust older deltas if necessary
        if ( shouldAdjustOldDeltas(orgEvent, absDelta) ) {
            // Divide all the things by 40!
            delta  /= 40;
            deltaX /= 40;
            deltaY /= 40;
        }

        // Get a whole, normalized value for the deltas
        delta  = Math[ delta  >= 1 ? 'floor' : 'ceil' ](delta  / lowestDelta);
        deltaX = Math[ deltaX >= 1 ? 'floor' : 'ceil' ](deltaX / lowestDelta);
        deltaY = Math[ deltaY >= 1 ? 'floor' : 'ceil' ](deltaY / lowestDelta);

        // Normalise offsetX and offsetY properties
        if ( special.settings.normalizeOffset && this.getBoundingClientRect ) {
            var boundingRect = this.getBoundingClientRect();
            offsetX = event.clientX - boundingRect.left;
            offsetY = event.clientY - boundingRect.top;
        }

        // Add information to the event object
        event.deltaX = deltaX;
        event.deltaY = deltaY;
        event.deltaFactor = lowestDelta;
        event.offsetX = offsetX;
        event.offsetY = offsetY;
        // Go ahead and set deltaMode to 0 since we converted to pixels
        // Although this is a little odd since we overwrite the deltaX/Y
        // properties with normalized deltas.
        event.deltaMode = 0;

        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        // Clearout lowestDelta after sometime to better
        // handle multiple device types that give different
        // a different lowestDelta
        // Ex: trackpad = 3 and mouse wheel = 120
        if (nullLowestDeltaTimeout) { clearTimeout(nullLowestDeltaTimeout); }
        nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);

        return ($.event.dispatch || $.event.handle).apply(this, args);
    }

    function nullLowestDelta() {
        lowestDelta = null;
    }

    function shouldAdjustOldDeltas(orgEvent, absDelta) {
        // If this is an older event and the delta is divisable by 120,
        // then we are assuming that the browser is treating this as an
        // older mouse wheel event and that we should divide the deltas
        // by 40 to try and get a more usable deltaFactor.
        // Side note, this actually impacts the reported scroll distance
        // in older browsers and can cause scrolling to be slower than native.
        // Turn this off by setting $.event.special.mousewheel.settings.adjustOldDeltas to false.
        return special.settings.adjustOldDeltas && orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
    }

}));

//     Backbone.js 1.0.0

//     (c) 2010-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(){

  // Initial Setup
  // -------------

  // Save a reference to the global object (`window` in the browser, `exports`
  // on the server).
  var root = this;

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create local references to array methods we'll want to use later.
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;

  // The top-level namespace. All public Backbone classes and modules will
  // be attached to this. Exported for both the browser and the server.
  var Backbone;
  if (typeof exports !== 'undefined') {
    Backbone = exports;
  } else {
    Backbone = root.Backbone = {};
  }

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '1.0.0';

  // Require Underscore, if we're on the server, and it's not already present.
  var _ = root._;
  if (!_ && (typeof require !== 'undefined')) _ = require('underscore');

  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
  // the `$` variable.
  Backbone.$ = root.jQuery || root.Zepto || root.ender || root.$;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeners = this._listeners;
      if (!listeners) return this;
      var deleteListener = !name && !callback;
      if (typeof name === 'object') callback = this;
      if (obj) (listeners = {})[obj._listenerId] = obj;
      for (var id in listeners) {
        listeners[id].off(name, callback, this);
        if (deleteListener) delete this._listeners[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      if (typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Backbone.Model
  // --------------

  // Backbone **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.

  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var defaults;
    var attrs = attributes || {};
    options || (options = {});
    this.cid = _.uniqueId('c');
    this.attributes = {};
    _.extend(this, _.pick(options, modelOptions));
    if (options.parse) attrs = this.parse(attrs, options) || {};
    if (defaults = _.result(this, 'defaults')) {
      attrs = _.defaults({}, attrs, defaults);
    }
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // A list of options to be attached directly to the model, if provided.
  var modelOptions = ['url', 'urlRoot', 'collection'];

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The value returned during the last failed validation.
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = true;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, method, xhr, attributes = this.attributes;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      // If we're not waiting and attributes exist, save acts as `set(attr).save(null, opts)`.
      if (attrs && (!options || !options.wait) && !this.set(attrs, options)) return false;

      options = _.extend({validate: true}, options);

      // Do not persist invalid models.
      if (!this._validate(attrs, options)) return false;

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);

      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch') options.attrs = attrs;
      xhr = this.sync(method, this, options);

      // Restore attributes.
      if (attrs && options.wait) this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;

      var destroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function(resp) {
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
        if (!model.isNew()) model.trigger('sync', model, resp, options);
      };

      if (this.isNew()) {
        options.success();
        return false;
      }
      wrapError(this, options);

      var xhr = this.sync('delete', this, options);
      if (!options.wait) destroy();
      return xhr;
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base = _.result(this, 'urlRoot') || _.result(this.collection, 'url') || urlError();
      if (this.isNew()) return base;
      return base + (base.charAt(base.length - 1) === '/' ? '' : '/') + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return this.id == null;
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return this._validate({}, _.extend(options || {}, { validate: true }));
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, _.extend(options || {}, {validationError: error}));
      return false;
    }

  });

  // Underscore methods that we want to implement on the Model.
  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function(method) {
    Model.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });

  // Backbone.Collection
  // -------------------

  // If models tend to represent a single row of data, a Backbone Collection is
  // more analagous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.

  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.url) this.url = options.url;
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

  // Default options for `Collection#set`.
  var setOptions = {add: true, remove: true, merge: true};
  var addOptions = {add: true, merge: false, remove: false};

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set.
    add: function(models, options) {
      return this.set(models, _.defaults(options || {}, addOptions));
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      models = _.isArray(models) ? models.slice() : [models];
      options || (options = {});
      var i, l, index, model;
      for (i = 0, l = models.length; i < l; i++) {
        model = this.get(models[i]);
        if (!model) continue;
        delete this._byId[model.id];
        delete this._byId[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model);
      }
      return this;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      options = _.defaults(options || {}, setOptions);
      if (options.parse) models = this.parse(models, options);
      if (!_.isArray(models)) models = models ? [models] : [];
      var i, l, model, attrs, existing, sort;
      var at = options.at;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, l = models.length; i < l; i++) {
        if (!(model = this._prepareModel(models[i], options))) continue;

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(model)) {
          if (options.remove) modelMap[existing.cid] = true;
          if (options.merge) {
            existing.set(model.attributes, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }

        // This is a new model, push it to the `toAdd` list.
        } else if (options.add) {
          toAdd.push(model);

          // Listen to added models' events, and index models for lookup by
          // `id` and by `cid`.
          model.on('all', this._onModelEvent, this);
          this._byId[model.cid] = model;
          if (model.id != null) this._byId[model.id] = model;
        }
      }

      // Remove nonexistent models if appropriate.
      if (options.remove) {
        for (i = 0, l = this.length; i < l; ++i) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          splice.apply(this.models, [at, 0].concat(toAdd));
        } else {
          push.apply(this.models, toAdd);
        }
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({silent: true});

      if (options.silent) return this;

      // Trigger `add` events.
      for (i = 0, l = toAdd.length; i < l; i++) {
        (model = toAdd[i]).trigger('add', model, this, options);
      }

      // Trigger `sort` if the collection was sorted.
      if (sort) this.trigger('sort', this, options);
      return this;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options || (options = {});
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i]);
      }
      options.previousModels = this.models;
      this._reset();
      this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return this;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: this.length}, options));
      return model;
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: 0}, options));
      return model;
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function(begin, end) {
      return this.models.slice(begin, end);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      return this._byId[obj.id != null ? obj.id : obj.cid || obj];
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      if (_.isEmpty(attrs)) return first ? void 0 : [];
      return this[first ? 'find' : 'filter'](function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Figure out the smallest index at which a model should be inserted so as
    // to maintain order.
    sortedIndex: function(model, value, context) {
      value || (value = this.comparator);
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _.sortedIndex(this.models, model, iterator, context);
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
        var method = options.reset ? 'reset' : 'set';
        collection[method](resp, options);
        if (success) success(collection, resp, options);
        collection.trigger('sync', collection, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(resp) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models);
    },

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function() {
      this.length = 0;
      this.models = [];
      this._byId  = {};
    },

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) {
        if (!attrs.collection) attrs.collection = this;
        return attrs;
      }
      options || (options = {});
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model._validate(attrs, options)) {
        this.trigger('invalid', this, attrs, options);
        return false;
      }
      return model;
    },

    // Internal method to sever a model's ties to a collection.
    _removeReference: function(model) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (model && event === 'change:' + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'indexOf', 'shuffle', 'lastIndexOf',
    'isEmpty', 'chain'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  // Backbone.View
  // -------------

  // Backbone Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    this._configure(options || {});
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be prefered to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
    },

    // Change the view's element (`this.el` property), including event
    // re-delegation.
    setElement: function(element, delegate) {
      if (this.$el) this.undelegateEvents();
      this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
      this.el = this.$el[0];
      if (delegate !== false) this.delegateEvents();
      return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save'
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, 'events')))) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) continue;

        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegateEvents' + this.cid;
        if (selector === '') {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
      return this;
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.off('.delegateEvents' + this.cid);
      return this;
    },

    // Performs the initial configuration of a View with a set of options.
    // Keys with special meaning *(e.g. model, collection, id, className)* are
    // attached directly to the view.  See `viewOptions` for an exhaustive
    // list.
    _configure: function(options) {
      if (this.options) options = _.extend({}, _.result(this, 'options'), options);
      _.extend(this, _.pick(options, viewOptions));
      this.options = options;
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
        this.setElement($el, false);
      } else {
        this.setElement(_.result(this, 'el'), false);
      }
    }

  });

  // Backbone.sync
  // -------------

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    // If we're sending a `PATCH` request, and we're in an old Internet Explorer
    // that still has ActiveX enabled by default, override jQuery to use that
    // for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.
    if (params.type === 'PATCH' && window.ActiveXObject &&
          !(window.external && window.external.msActiveXFilteringEnabled)) {
      params.xhr = function() {
        return new ActiveXObject("Microsoft.XMLHTTP");
      };
    }

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

  // Backbone.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) callback = this[name];
      var router = this;
      Backbone.history.route(route, function(fragment) {
        var args = router._extractParameters(route, fragment);
        callback && callback.apply(router, args);
        router.trigger.apply(router, ['route:' + name].concat(args));
        router.trigger('route', name, args);
        Backbone.history.trigger('route', router, name, args);
      });
      return this;
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      this.routes = _.result(this, 'routes');
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional){
                     return optional ? match : '([^\/]+)';
                   })
                   .replace(splatParam, '(.*?)');
      return new RegExp('^' + route + '$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param) {
        return param ? decodeURIComponent(param) : null;
      });
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = this.location.pathname;
          var root = this.root.replace(trailingSlash, '');
          if (!fragment.indexOf(root)) fragment = fragment.substr(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Backbone.history has already been started");
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({}, {root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment          = this.getFragment();
      var docMode           = document.documentMode;
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      if (oldIE && this._wantsHashChange) {
        this.iframe = Backbone.$('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        Backbone.$(window).on('popstate', this.checkUrl);
      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
        Backbone.$(window).on('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;
      var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

      // If we've started off with a route from a `pushState`-enabled browser,
      // but we're currently in a browser that doesn't support it...
      if (this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot) {
        this.fragment = this.getFragment(null, true);
        this.location.replace(this.root + this.location.search + '#' + this.fragment);
        // Return immediately as browser will do redirect to new url
        return true;

      // Or if we've started out with a hash-based route, but we're currently
      // in a browser where it could be `pushState`-based instead...
      } else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
        this.fragment = this.getHash().replace(routeStripper, '');
        this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      Backbone.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
      clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl() || this.loadUrl(this.getHash());
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragmentOverride) {
      var fragment = this.fragment = this.getFragment(fragmentOverride);
      var matched = _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
      return matched;
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: options};
      fragment = this.getFragment(fragment || '');
      if (this.fragment === fragment) return;
      this.fragment = fragment;
      var url = this.root + fragment;

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function (model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error(model, resp, options);
      model.trigger('error', model, resp, options);
    };
  };

}).call(this);

define("backbone", ["underscore","jquery","jquery.role","jquery.spin","jquery-mousewheel"], (function (global) {
    return function () {
        var ret, fn;
        return ret || global.Backbone;
    };
}(this)));

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('models/table',['underscore', 'backbone'], function(_, Backbone) {
    var TableModel, _ref;
    return TableModel = (function(_super) {
      __extends(TableModel, _super);

      function TableModel() {
        this.total = __bind(this.total, this);
        this.cnt = __bind(this.cnt, this);
        this.portion = __bind(this.portion, this);
        this.start = __bind(this.start, this);
        this.prevPage = __bind(this.prevPage, this);
        this.nextPage = __bind(this.nextPage, this);
        this.firstPage = __bind(this.firstPage, this);
        this.lastPageStart = __bind(this.lastPageStart, this);
        this.lastPage = __bind(this.lastPage, this);
        this.extractOrder = __bind(this.extractOrder, this);
        _ref = TableModel.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      TableModel.prototype.parse = function(resp, options) {
        if (this.get('fetchType') === 'mergePage') {
          resp.start = '' + this.start();
          resp.cnt = '' + (this.cnt() + parseInt(resp.cnt, 10));
        }
        if (resp.columns) {
          resp.order = this.extractOrder(_.clone(resp.columns));
        }
        return resp;
      };

      TableModel.prototype.extractOrder = function(columns, order) {
        var dir, first;
        if (order == null) {
          order = {};
        }
        if (!columns.length) {
          return order;
        }
        first = columns.splice(0, 1)[0];
        if (first.sort) {
          dir = first.asc === '1' ? 'asc' : first.desc === '1' ? 'desc' : void 0;
          if (dir) {
            order[first.id] = dir;
          }
        }
        if (first.group) {
          _.extend(order, this.extractOrder(first.group));
        }
        return this.extractOrder(columns, order);
      };

      TableModel.prototype.lastPage = function() {
        return this.total() - this.cnt() <= this.start();
      };

      TableModel.prototype.lastPageStart = function() {
        return this.total() - this.total() % this.portion();
      };

      TableModel.prototype.firstPage = function() {
        return !this.start();
      };

      TableModel.prototype.nextPage = function() {
        return this.start() + this.portion();
      };

      TableModel.prototype.prevPage = function() {
        return this.start() - this.portion();
      };

      TableModel.prototype.start = function() {
        return parseInt(this.get('start'), 10);
      };

      TableModel.prototype.portion = function() {
        return parseInt(this.get('portion'), 10);
      };

      TableModel.prototype.cnt = function() {
        return parseInt(this.get('cnt'), 10);
      };

      TableModel.prototype.total = function() {
        return parseInt(this.get('total'), 10);
      };

      return TableModel;

    })(Backbone.Model);
  });

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define('services/split_table',['underscore'], function(_) {
    var SplitTable;
    return SplitTable = (function() {
      function SplitTable(container, tableHtml, tableDefaults, model, before) {
        this._countDims = __bind(this._countDims, this);
        this._insertWidthRulers = __bind(this._insertWidthRulers, this);
        this._splitTable = __bind(this._splitTable, this);
        this._preRender = __bind(this._preRender, this);
        var bodyHeights, containerWidth, headHeights, table, thead, totWidth, widths, _ref, _ref1;
        this.container = container;
        containerWidth = $(container).width();
        this.tableDefaults = tableDefaults;
        table = this._createTable(tableHtml);
        this.model = model;
        if (((_ref = model.get('calculated_dimensions')) != null ? _ref.headers : void 0)) {
          table.style.tableLayout = 'fixed';
        } else {
          table.style.width = '100%';
          table.style.tableLayout = 'auto';
        }
        thead = table.querySelector('thead');
        if (thead) {
          before(thead, this.model.get('fix_columns'));
        }
        this._insertWidthRulers(table);
        _ref1 = this._countDims(table), widths = _ref1[0], headHeights = _ref1[1], bodyHeights = _ref1[2];
        totWidth = _(widths).reduce((function(memo, num) {
          return memo + num;
        }), 0);
        this.top = this._splitTable(table.querySelector('thead'), widths, headHeights, tableDefaults.scrollBarWidth);
        this.bottom = this._splitTable(table.querySelector('tbody'), widths, bodyHeights);
      }

      SplitTable.prototype._autoExpandWidths = function(widths, k) {
        return _(widths).map(function(el) {
          return Math.round(el * k);
        });
      };

      SplitTable.prototype._createTable = function(html) {
        var div;
        div = document.createElement('div');
        div.innerHTML = html;
        return div.querySelector('table');
      };

      SplitTable.prototype._preRender = function() {
        var div, table_width, total_width, widths, _ref;
        div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '-10000px';
        div.style.left = '-10000px';
        if (!((_ref = this.model.get('calculated_dimensions')) != null ? _ref.headers : void 0)) {
          table_width = $(this.container).width();
        } else {
          widths = _(this.model.get('columns')).map(function(column) {
            return column.width;
          });
          total_width = _(widths).reduce((function(memo, num) {
            return memo + num;
          }), 0);
          table_width = total_width;
        }
        div.style.width = table_width + 'px';
        div.style.height = '100px';
        div.style.overflow = 'hidden';
        div.className = 'st-table-pre-render';
        this.container.appendChild(div);
        return div;
      };

      SplitTable.prototype._splitTable = function(table, widths, heights, scrollWidth) {
        var height, left, right, rightDiv, widthLeft, widthRight,
          _this = this;
        if (scrollWidth == null) {
          scrollWidth = 0;
        }
        height = 0;
        widthLeft = 0;
        widthRight = 0;
        left = null;
        right = null;
        if (table) {
          left = document.createElement('table');
          left.style.tableLayout = 'fixed';
          left.className = 'st-fixed-table-left';
          right = left.cloneNode();
          right.className = 'st-fixed-table-right';
          rightDiv = document.createElement('div');
          _(table.querySelectorAll('tr')).each(function(tr, trIndex) {
            var flag, ind, rowHeight, trLeft, trRight;
            trLeft = tr.cloneNode();
            trRight = tr.cloneNode();
            rowHeight = heights[trIndex];
            trLeft.style.height = "" + rowHeight + "px";
            trRight.style.height = "" + rowHeight + "px";
            left.appendChild(trLeft);
            right.appendChild(trRight);
            if (_this.model.get('fix_columns') === 0) {
              flag = false;
            } else {
              flag = true;
            }
            height = height + rowHeight;
            ind = 0;
            return _(tr.querySelectorAll('td, th')).each(function(td) {
              var width;
              if (td.className !== 'freezbar-cell') {
                if (tr.className === 'st-table-widths-row' && widths) {
                  width = widths[ind];
                  td.style.width = "" + width + "px";
                  ind = ind + 1;
                  if (flag) {
                    widthLeft = widthLeft + width;
                  } else {
                    widthRight = widthRight + width;
                  }
                }
                if (flag) {
                  return trLeft.appendChild(td.cloneNode(true));
                } else {
                  return trRight.appendChild(td.cloneNode(true));
                }
              } else {
                return flag = false;
              }
            });
          });
          left.style.width = "" + widthLeft + "px";
          if (widthRight !== 0) {
            rightDiv.style.width = "" + (widthRight + scrollWidth + this.tableDefaults.extraWidth) + "px";
            right.style.width = "" + widthRight + "px";
            right.setAttribute('data-scroll-width', '' + scrollWidth);
          }
          rightDiv.appendChild(right);
        }
        return {
          left: left,
          right: rightDiv,
          height: height
        };
      };

      SplitTable.prototype._insertWidthRulers = function(table) {
        var cell, className, col, cols, i, ind, row, splitAt, tableWidth, tbody, tdB, tdH, tdHeight, thead, trB, trH, _i, _j, _k, _len, _len1, _ref, _ref1, _ref2, _results;
        tableWidth = 0;
        splitAt = null;
        col = 0;
        _ref = table.querySelector('tr').querySelectorAll('th, td');
        for (ind = _i = 0, _len = _ref.length; _i < _len; ind = ++_i) {
          cell = _ref[ind];
          if (cell.className === 'freezbar-cell') {
            splitAt = ind;
          }
          cols = cell.colSpan ? cell.colSpan : 1;
          tableWidth = tableWidth + cols;
        }
        thead = table.querySelector('thead');
        tbody = table.querySelector('tbody');
        if (thead) {
          trH = thead.insertRow(0);
          trH.className = 'st-table-widths-row';
        }
        trB = tbody.insertRow(0);
        trB.className = 'st-table-widths-row';
        for (i = _j = 0, _ref1 = tableWidth - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
          className = i === splitAt ? 'freezbar-cell' : (col = col + 1, "st-table-column-holder st-width-col-" + col);
          if (thead) {
            tdH = trH.insertCell(-1);
            tdH.className = className;
          }
          tdB = trB.insertCell(-1);
          tdB.className = className;
        }
        _ref2 = table.querySelectorAll('tr');
        _results = [];
        for (_k = 0, _len1 = _ref2.length; _k < _len1; _k++) {
          row = _ref2[_k];
          tdHeight = row.insertCell(0);
          _results.push(tdHeight.className = 'st-row-height-td');
        }
        return _results;
      };

      SplitTable.prototype._elWidth = function(obj) {
        return Math.max(obj.clientWidth, obj.offsetWidth, obj.scrollWidth);
      };

      SplitTable.prototype._elHeight = function(obj) {
        return Math.max(obj.clientHeight, obj.offsetHeight, obj.scrollHeight);
      };

      SplitTable.prototype._countDims = function(table) {
        var bodyHeights, cell, div, eludia_table_container, fit_page_height, headHeights, table_height, td, widths, _i, _j, _len, _len1, _ref, _ref1, _ref2;
        div = this._preRender();
        div.appendChild(table);
        fit_page_height = document.documentElement.clientHeight - $(this.container).position().top;
        table_height = div.scrollHeight + this.tableDefaults.scrollBarWidth;
        if (fit_page_height > 0 && fit_page_height < table_height && fit_page_height < this.tableDefaults.min_height + this.tableDefaults.scrollBarWidth) {
          eludia_table_container = $(this.container.parentElement.parentElement);
          eludia_table_container.width(eludia_table_container.width() - this.tableDefaults.scrollBarWidth);
          div.style.width = (div.style.width.replace("px", "") - this.tableDefaults.scrollBarWidth) + 'px';
        }
        widths = [];
        _ref = table.querySelector('tr.st-table-widths-row').querySelectorAll('td');
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          cell = _ref[_i];
          if ((_ref1 = cell.className) !== 'freezbar-cell' && _ref1 !== 'st-row-height-td') {
            widths.push(this._elWidth(cell));
          }
        }
        headHeights = (function() {
          var _j, _len1, _ref2, _results;
          _ref2 = table.querySelector('thead').querySelectorAll('td.st-row-height-td');
          _results = [];
          for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
            td = _ref2[_j];
            _results.push(this._elHeight(td));
          }
          return _results;
        }).call(this);
        bodyHeights = (function() {
          var _j, _len1, _ref2, _results;
          _ref2 = table.querySelector('tbody').querySelectorAll('td.st-row-height-td');
          _results = [];
          for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
            td = _ref2[_j];
            _results.push(this._elHeight(td));
          }
          return _results;
        }).call(this);
        _ref2 = table.querySelectorAll('td.st-row-height-td');
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          td = _ref2[_j];
          td.parentNode.removeChild(td);
        }
        this.container.removeChild(div);
        return [widths, headHeights, bodyHeights];
      };

      return SplitTable;

    })();
  });

}).call(this);

(function() {
  define('templates/_sort_block',['jquery', 'underscore'], function($, _) {
    return function(context) {
      var render;
      render = function() {
        var $o;
        $o = [];
        $o.push("<div class='st-sort-block'>\n  <span class='st-sort-btn' data-order-dir='desc' title='сортировать по убыванию'>\n    &#9650;\n  </span>\n  <span class='st-sort-btn' data-order-dir='asc' title='сортировать по возрастанию'>\n    &#9660;\n  </span>\n</div>");
        return $o.join("\n").replace(/\s(?:id|class)=(['"])(\1)/mg, "");
      };
      return render.call(context);
    };
  });

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define('services/sorting',['underscore', 'jquery', 'backbone', 'templates/_sort_block'], function(_, $, Backbone) {
    var Sorting;
    return Sorting = (function() {
      function Sorting(options) {
        this.setSorting = __bind(this.setSorting, this);
        this._onClickSort = __bind(this._onClickSort, this);
        this._assignHandlers = __bind(this._assignHandlers, this);
        _.extend(this, Backbone.Events);
        this.model = options.model;
        this.app = options.app;
        this.$container = $(options.container);
        this._assignHandlers();
        this.setSorting();
        this.listenTo(this.model, 'change:order', this.setSorting);
      }

      Sorting.prototype._assignHandlers = function() {
        return this.$container.on('click', '[data-order-dir]', this._onClickSort);
      };

      Sorting.prototype._onClickSort = function(e) {
        var $el, clickedDir, order, orderId, sort;
        this.app.log('sort click');
        $el = $(e.currentTarget);
        orderId = $el.closest('td, th').attr('id');
        clickedDir = $el.data('order-dir');
        sort = {};
        order = _.clone(this.model.get('order'));
        if (!$el.hasClass("active") || _.size(order) > 1) {
          sort[orderId] = clickedDir;
        }
        if (e.ctrlKey) {
          order[orderId] = clickedDir;
          this.model.set('order', order);
        } else {
          this.model.set('order', sort);
        }
        return this.app.trigger('table:sort');
      };

      Sorting.prototype.setSorting = function() {
        var _this = this;
        this.$container.find("div.st-sort-block > span[data-order-dir]").removeClass("active");
        return _(this.model.get('order')).each(function(dir, id) {
          return _this.$container.find("#" + id + " span[data-order-dir=\"" + dir + "\"]").addClass("active");
        });
      };

      return Sorting;

    })();
  });

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define('services/resizing_grid',['underscore', 'jquery'], function(_, $) {
    var ResizingGrid;
    return ResizingGrid = (function() {
      function ResizingGrid(options) {
        this._getWidthColumns = __bind(this._getWidthColumns, this);
        this.resizeHolder = __bind(this.resizeHolder, this);
        this.$container = $(options.container);
        this.model = options.model;
        this.app = options.app;
        this.currentBlock = null;
        this.holder = null;
      }

      ResizingGrid.prototype.setGrid = function() {
        var container, table, tds,
          _this = this;
        container = this.$container[0];
        if (container.contains(this.holder)) {
          container.removeChild(this.holder);
        }
        this.holder = this.resizeHolder();
        this.widthCols = {};
        table = container.querySelector('table');
        this.$container.find('tr .st-table-column-holder').each(function(ind, el) {
          var right;
          right = el.offsetLeft + _this.app.elWidth(el);
          return _this.widthCols[right] = el;
        });
        this.widthColsKeys = _.keys(this.widthCols);
        tds = this.$container.find('th, td').filter(':not(.st-table-column-holder)');
        _(tds).each(function(td) {
          var left, resizeBlock;
          left = td.offsetLeft + td.clientWidth;
          resizeBlock = _this.resizeBlock({
            left: left,
            top: td.offsetTop
          }, _this.app.elHeight(td));
          resizeBlock._resize = {};
          resizeBlock._resize.resizeGrid = _this;
          resizeBlock._resize.tableClass = table.className;
          resizeBlock._resize.tdClass = td.className;
          resizeBlock._resize.width = td.clientWidth;
          resizeBlock._resize.colsClasses = _this._getWidthColumns(td);
          return _this.holder.appendChild(resizeBlock);
        });
        return container.appendChild(this.holder);
      };

      ResizingGrid.prototype.resizeHolder = function() {
        var div;
        div = document.createElement('div');
        div.className = 'st-resize-container';
        return div;
      };

      ResizingGrid.prototype.resizeBlock = function(pos, height) {
        var resizeDiv;
        resizeDiv = document.createElement('div');
        resizeDiv.className = 'st-resize-block';
        resizeDiv.style.height = "" + height + "px";
        resizeDiv.style.left = "" + pos.left + "px";
        resizeDiv.style.top = "" + pos.top + "px";
        return resizeDiv;
      };

      ResizingGrid.prototype._getWidthColumns = function(td) {
        var key, offset, width, _i, _len, _ref, _results;
        offset = td.offsetLeft;
        width = this.app.elWidth(td);
        _ref = _.filter(this.widthColsKeys, (function(el) {
          var _ref;
          return (offset < (_ref = parseInt(el, 10)) && _ref <= offset + width);
        }));
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          key = _ref[_i];
          _results.push(this.widthCols[key].className);
        }
        return _results;
      };

      return ResizingGrid;

    })();
  });

}).call(this);

(function() {
  define('templates/_resize_bar',['jquery', 'underscore'], function($, _) {
    return function(context) {
      var render;
      render = function() {
        var $o;
        $o = [];
        $o.push("<div class='st-resizing-bar'></div>\n<div class='st-resizing-drop-bar'></div>");
        return $o.join("\n").replace(/\s(?:id|class)=(['"])(\1)/mg, "");
      };
      return render.call(context);
    };
  });

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define('services/resizing',['underscore', 'jquery', 'templates/_resize_bar'], function(_, $, template) {
    var Resizing;
    return Resizing = (function() {
      function Resizing(options) {
        this._resizeAction = __bind(this._resizeAction, this);
        this._resizeBar = __bind(this._resizeBar, this);
        this._newWidth = __bind(this._newWidth, this);
        this._onMouseUp = __bind(this._onMouseUp, this);
        this._onMouseMove = __bind(this._onMouseMove, this);
        this._onMouseDown = __bind(this._onMouseDown, this);
        this.rebind = __bind(this.rebind, this);
        this.app = options.app;
        this.onResizeCb = options.onResizeCb;
        this.tableDefaults = options.tableDefaults;
        this.$main = options.$main;
        this.mainHeight = this.$main.height();
        this.statOverlay = options.statOverlay;
        this.$main.on('mousedown', '.st-resize-block', this._onMouseDown);
        this.$main.on('mousemove', this._onMouseMove);
        this.$main.on('mouseup', this._onMouseUp);
        this.dragging = false;
      }

      Resizing.prototype.rebind = function(_arg) {
        this.statOverlay = _arg.statOverlay;
      };

      Resizing.prototype._onMouseDown = function(e) {
        this.$current = $(e.currentTarget);
        this.$current.addClass('dragging');
        this.resizeBar = this._resizeBar(e.currentTarget);
        this.statOverlay.appendChild(this.resizeBar.div);
        this.startDragX = e.clientX;
        this.origWidth = this.$current[0]._resize.width;
        this.numCols = this.$current[0]._resize.colsClasses.length;
        this.dragging = true;
        e.preventDefault();
        return e.stopPropagation();
      };

      Resizing.prototype._onMouseMove = function(e) {
        var newLeft;
        if (!this.dragging) {
          return;
        }
        newLeft = this.resizeBar.initLeft - this.origWidth + this._newWidth(e);
        return this.resizeBar.div.style.left = "" + newLeft + "px";
      };

      Resizing.prototype._onMouseUp = function(e) {
        var newWidth;
        if (!this.dragging) {
          return;
        }
        newWidth = this._newWidth(e);
        this.app.log("prev width: " + this.origWidth + " | new width: " + newWidth);
        this._resizeAction(newWidth, this.$current[0]);
        this.$current.removeClass('dragging');
        this.$current = null;
        this.statOverlay.removeChild(this.resizeBar.div);
        this.resizeBar = null;
        this.startDragX = 0;
        this.origWidth = 0;
        this.dragging = false;
        return this.app.cancelSelection();
      };

      Resizing.prototype._newWidth = function(e) {
        var offset;
        if (!this.dragging) {
          return 0;
        }
        offset = e.clientX - this.startDragX;
        return _.max([this.tableDefaults.columnMinWidth * this.numCols, this.origWidth + offset]);
      };

      Resizing.prototype._resizeBar = function(origin) {
        var bar, dropBar, headerBar, left, originHeight, originRect, staticRect, top;
        bar = document.createElement('div');
        bar.className = 'st-resizing-bar-holder';
        bar.innerHTML = template();
        originRect = origin.getBoundingClientRect();
        staticRect = this.statOverlay.getBoundingClientRect();
        top = originRect.top - staticRect.top;
        left = originRect.left - staticRect.left;
        bar.style.top = "" + top + "px";
        bar.style.left = "" + left + "px";
        headerBar = bar.querySelector('.st-resizing-bar');
        originHeight = originRect.height || (originRect.bottom - originRect.top);
        headerBar.style.height = "" + originHeight + "px";
        dropBar = bar.querySelector('.st-resizing-drop-bar');
        dropBar.style.height = "" + this.mainHeight + "px";
        return {
          div: bar,
          initLeft: left
        };
      };

      Resizing.prototype._resizeAction = function(width, origin) {
        var $tables, diff, i, tableWidth, td, tds, w, _i, _j, _len, _len1, _ref;
        $tables = this.$main.find("." + origin._resize.tableClass);
        tableWidth = $tables.eq(0).width();
        diff = width - origin._resize.width;
        $tables.each(function(ind, table) {
          return table.style.width = "" + (tableWidth + diff) + "px";
        });
        _ref = this._splitByColumns(width, this.numCols);
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          w = _ref[i];
          tds = this.$main[0].querySelectorAll(this._classToQuery(origin._resize.colsClasses[i]));
          for (_j = 0, _len1 = tds.length; _j < _len1; _j++) {
            td = tds[_j];
            td.style.width = "" + w + "px";
          }
        }
        origin._resize.resizeGrid.setGrid();
        if (_.isFunction(this.onResizeCb)) {
          return this.onResizeCb.call(null, origin._resize.tableClass);
        }
      };

      Resizing.prototype._classToQuery = function(str) {
        return ("." + str).split(' ').join('.');
      };

      Resizing.prototype._splitByColumns = function(width, num) {
        var base, i, rest, _i, _results;
        rest = width % num;
        base = Math.floor(width / num);
        _results = [];
        for (i = _i = 1; 1 <= num ? _i <= num : _i >= num; i = 1 <= num ? ++_i : --_i) {
          _results.push(base + (i <= rest ? 1 : 0));
        }
        return _results;
      };

      return Resizing;

    })();
  });

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define('services/column_reordering',['underscore', 'jquery'], function(_, $) {
    var ColumnReordering;
    return ColumnReordering = (function() {
      function ColumnReordering(options, mainViewport) {
        this._scrollSpeed = __bind(this._scrollSpeed, this);
        this._scrollHeader = __bind(this._scrollHeader, this);
        this._restorePosition = __bind(this._restorePosition, this);
        this._savePosition = __bind(this._savePosition, this);
        this._insertAfter = __bind(this._insertAfter, this);
        this._insertBefore = __bind(this._insertBefore, this);
        this._calcTable = __bind(this._calcTable, this);
        this._nextEdge = __bind(this._nextEdge, this);
        this._unmarkGroup = __bind(this._unmarkGroup, this);
        this._markGroup = __bind(this._markGroup, this);
        this._getBoundaries = __bind(this._getBoundaries, this);
        this.buildHierarchy = __bind(this.buildHierarchy, this);
        this._divPos = __bind(this._divPos, this);
        this.doDrag = __bind(this.doDrag, this);
        this._changedPos = __bind(this._changedPos, this);
        this._onMouseUp = __bind(this._onMouseUp, this);
        this._onMouseMove = __bind(this._onMouseMove, this);
        this._onMouseDown = __bind(this._onMouseDown, this);
        this.dragConfig = {
          threshold: 10,
          scrollEdge: 50,
          maxScrollSpeed: 50
        };
        this.app = options.app;
        this.el = options.container;
        this.$el = $(this.el);
        this.mainViewport = mainViewport;
        this.$el.on('mousedown', 'th', this._onMouseDown);
        $(document).on('mousemove', this._onMouseMove);
        $(document).on('mouseup', this._onMouseUp);
      }

      ColumnReordering.prototype._onMouseDown = function(e) {
        if (this.dragEvent) {
          return;
        }
        return this.initState = {
          x: e.clientX,
          y: e.clientY,
          scrollInit: this.el.scrollLeft,
          el: e.currentTarget
        };
      };

      ColumnReordering.prototype._onMouseMove = function(e) {
        var el;
        if (!this.initState) {
          return;
        }
        if (this.dragEvent) {
          this.polling = false;
          if (this.dragPoll) {
            clearTimeout(this.dragPoll);
          }
          this.doDrag(e.clientX);
        } else if (Math.abs(this.initState.x - e.clientX) > this.dragConfig.threshold || Math.abs(this.initState.y - e.clientY) > this.dragConfig.threshold) {
          this.app.cancelSelection();
          el = this.initState.el;
          this.dragEvent = {
            initState: _.clone(this.initState),
            oldPos: {
              left: el.offsetLeft,
              top: el.offsetTop
            },
            boundaries: this._getBoundaries(el),
            elWidth: el.offsetWidth,
            initElBgColor: el.style.backgroundColor,
            dragDiv: this._dragDiv(this.initState)
          };
          this._markGroup(this.dragEvent);
          this._savePosition(el.nextSibling);
          this._setDivPos(e, this.dragEvent);
          this.el.appendChild(this.dragEvent.dragDiv);
        }
        e.preventDefault();
        return e.stopPropagation();
      };

      ColumnReordering.prototype._onMouseUp = function(e) {
        this.initState = null;
        if (!this.dragEvent) {
          return;
        }
        if (this.el.contains(e.target)) {
          if (this._changedPos()) {
            this.app.trigger('table:reorder');
          }
        } else {
          this._restorePosition(this.dragEvent);
        }
        this._unmarkGroup();
        this.el.removeChild(this.dragEvent.dragDiv);
        this.app.cancelSelection();
        return this.dragEvent = null;
      };

      ColumnReordering.prototype._changedPos = function() {
        return typeof this._prevPosition !== "undefined" && this.dragEvent.initState.el.nextSibling !== this._prevPosition;
      };

      ColumnReordering.prototype.doDrag = function(x) {
        if (!this.dragEvent) {
          return;
        }
        this._scrollHeader(x);
        this._setDivPos(x, this.dragEvent);
        this._calcTable(this.dragEvent);
        if (this.polling) {
          return this.dragPoll = setTimeout(this.doDrag, 100, x);
        }
      };

      ColumnReordering.prototype._dragDiv = function(initState, pos) {
        var div, el, rect;
        el = initState.el;
        rect = el._reorder.boundingRect;
        div = document.createElement('div');
        div.className = 'st-drag-div';
        div.style.width = "" + (rect.right - rect.left) + "px";
        div.style.height = "" + (rect.bottom - rect.top) + "px";
        return div;
      };

      ColumnReordering.prototype._setDivPos = function(x, dragEvent) {
        var pos;
        pos = this._divPos(x, dragEvent);
        dragEvent.dragDiv.style.top = "" + pos.y + "px";
        return dragEvent.dragDiv.style.left = "" + pos.x + "px";
      };

      ColumnReordering.prototype._divPos = function(x, dragEvent) {
        var scrollOffset;
        scrollOffset = this.el.scrollLeft - dragEvent.initState.scrollInit;
        x = dragEvent.oldPos.left + (x + scrollOffset - dragEvent.initState.x);
        return {
          y: dragEvent.oldPos.top,
          x: _.min([_.max([x, dragEvent.boundaries.left]), dragEvent.boundaries.right - dragEvent.elWidth])
        };
      };

      ColumnReordering.prototype.buildHierarchy = function() {
        var table, tds, w,
          _this = this;
        table = this.el.querySelector('table');
        tds = table.querySelectorAll('th, td');
        w = _(tds).map(function(td) {
          td._reorder = null;
          return {
            el: td,
            left: td.offsetLeft,
            right: td.offsetLeft + td.offsetWidth
          };
        });
        _(w).each(function(tdi) {
          var _base;
          (_base = tdi.el)._reorder || (_base._reorder = {
            children: [],
            parents: []
          });
          return _(w).each(function(tdj) {
            var _base1, _base2, _name;
            if (tdi !== tdj && tdi.left <= tdj.left && tdi.right >= tdj.right) {
              (_base1 = tdj.el)._reorder || (_base1._reorder = {
                children: [],
                parents: []
              });
              (_base2 = tdi.el._reorder.children)[_name = tdj.el.parentElement.getAttribute('data-row-index')] || (_base2[_name] = []);
              tdi.el._reorder.children[tdj.el.parentElement.getAttribute('data-row-index')].push(tdj.el);
              return tdj.el._reorder.parents.push(tdi.el);
            }
          });
        });
        _(tds).each(function(td) {
          var minWidth, nearestParent;
          minWidth = +Infinity;
          nearestParent = null;
          _(td._reorder.parents).each(function(parent) {
            if (parent.offsetWidth < minWidth && parent.parentElement.getAttribute('data-row-index') !== "0") {
              minWidth = parent.offsetWidth;
              return nearestParent = parent;
            }
          });
          return td._reorder.nearestParent = nearestParent;
        });
        return _(tds).each(function(td) {
          var rect;
          rect = _this._getRect(td);
          _(td._reorder.children).each(function(row) {
            return _(row).each(function(child) {
              return rect = _this._calcRect(rect, _this._getRect(child));
            });
          });
          return td._reorder.boundingRect = rect;
        });
      };

      ColumnReordering.prototype._getRect = function(el) {
        return {
          top: el.offsetTop,
          left: el.offsetLeft,
          right: el.offsetLeft + el.offsetWidth,
          bottom: el.offsetTop + el.offsetHeight
        };
      };

      ColumnReordering.prototype._calcRect = function(rect1, rect2) {
        return {
          top: _.min([rect1.top, rect2.top]),
          left: _.min([rect1.left, rect2.left]),
          right: _.max([rect1.right, rect2.right]),
          bottom: _.max([rect1.bottom, rect2.bottom])
        };
      };

      ColumnReordering.prototype._getBoundaries = function(el) {
        var parent;
        parent = el._reorder.nearestParent || this.el.querySelector('table');
        return {
          left: parent.offsetLeft,
          right: parent.offsetLeft + parent.offsetWidth
        };
      };

      ColumnReordering.prototype._markGroup = function(drag) {
        var el,
          _this = this;
        if (this.prevState) {
          this._unmarkGroup();
        }
        el = drag.initState.el;
        this.prevState = [];
        this.prevState.push({
          el: el,
          state: this._saveThState(el)
        });
        return _(el._reorder.children).each(function(row) {
          return _(row).each(function(child) {
            return _this.prevState.push({
              el: child,
              state: _this._saveThState(child)
            });
          });
        });
      };

      ColumnReordering.prototype._unmarkGroup = function() {
        var _this = this;
        _(this.prevState).each(function(s) {
          return _this._restoreThState(s.el, s.state);
        });
        return this.prevState = null;
      };

      ColumnReordering.prototype._saveThState = function(el) {
        var prevBg;
        prevBg = el.style.backgroundColor;
        el.style.backgroundColor = '#ccc';
        return {
          bg: prevBg
        };
      };

      ColumnReordering.prototype._restoreThState = function(el, state) {
        return el.style.backgroundColor = state.bg;
      };

      ColumnReordering.prototype._prevEdge = function(el) {
        return el.offsetLeft + (el.offsetWidth / 2);
      };

      ColumnReordering.prototype._nextEdge = function(el) {
        return this._prevEdge(el);
      };

      ColumnReordering.prototype._calcTable = function(drag) {
        var div, el, next, prev;
        div = drag.dragDiv;
        el = drag.initState.el;
        prev = el.previousSibling;
        next = el.nextSibling;
        if (prev && div.offsetLeft < this._prevEdge(prev)) {
          return this._insertBefore(el, prev);
        } else if (next && (div.offsetLeft + div.offsetWidth) > this._nextEdge(next)) {
          return this._insertAfter(el, next);
        }
      };

      ColumnReordering.prototype._insertBefore = function(el, prev) {
        var del, parent,
          _this = this;
        parent = el.parentNode;
        del = parent.removeChild(el);
        parent.insertBefore(del, prev);
        return _(el._reorder.children).each(function(row, ind) {
          return _(row).each(function(child) {
            var before, childDel, childParent;
            childParent = child.parentNode;
            before = prev ? prev._reorder.children[ind][0] : null;
            childDel = childParent.removeChild(child);
            return childParent.insertBefore(childDel, before);
          });
        });
      };

      ColumnReordering.prototype._insertAfter = function(el, next) {
        return this._insertBefore(el, next.nextSibling);
      };

      ColumnReordering.prototype._savePosition = function(pos) {
        return this._prevPosition = pos || null;
      };

      ColumnReordering.prototype._restorePosition = function(drag) {
        if (typeof this._prevPosition !== 'undefined') {
          this._insertBefore(drag.initState.el, this._prevPosition);
        }
        return this._prevPosition = void 0;
      };

      ColumnReordering.prototype._scrollHeader = function(x) {
        var leftEdge, rect, rightEdge;
        rect = this.el.getBoundingClientRect();
        leftEdge = rect.left + this.dragConfig.scrollEdge;
        rightEdge = rect.right - this.dragConfig.scrollEdge;
        if (x < leftEdge) {
          this.el.scrollLeft = this.el.scrollLeft - this._scrollSpeed(leftEdge - x);
          this.mainViewport.scrollLeft = this.el.scrollLeft;
          return this.polling = true;
        } else if (x > rightEdge) {
          this.el.scrollLeft = this.el.scrollLeft + this._scrollSpeed(x - rightEdge);
          this.mainViewport.scrollLeft = this.el.scrollLeft;
          return this.polling = true;
        }
      };

      ColumnReordering.prototype._scrollSpeed = function(dist) {
        return Math.floor(_.max([dist, this.dragConfig.scrollEdge]) / this.dragConfig.scrollEdge * this.dragConfig.maxScrollSpeed);
      };

      return ColumnReordering;

    })();
  });

}).call(this);

(function() {
  define('templates/main_table',['jquery', 'underscore'], function($, _) {
    return function(context) {
      var render;
      render = function() {
        var $o;
        $o = [];
        $o.push("<div class='st-table-container'>\n  <div class='st-overlay-container'>\n    <div class='st-selection-container'></div>\n    <div class='st-coldrag-container'></div>\n  </div>\n  <div class='st-table-header-left-pane'></div>\n  <div class='st-table-header-right-pane'></div>\n  <div class='st-table-left-viewport'></div>\n  <div class='st-table-right-viewport'></div>\n</div>");
        return $o.join("\n").replace(/\s(?:id|class)=(['"])(\1)/mg, "");
      };
      return render.call(context);
    };
  });

}).call(this);

(function() {
  define('templates/empty_table',['jquery', 'underscore'], function($, _) {
    return function(context) {
      var render;
      render = function() {
        var $o;
        $o = [];
        $o.push("No data");
        return $o.join("\n");
      };
      return render.call(context);
    };
  });

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/table',['underscore', 'jquery', 'backbone', 'services/split_table', 'services/sorting', 'services/resizing_grid', 'services/resizing', 'services/column_reordering', 'templates/main_table', 'templates/empty_table', 'templates/_sort_block'], function(_, $, Backbone, SplitTable, Sorting, ResizingGrid, Resizing, ColumnReordering, mainTableTemplate, emptyTableTemplate, sortTemplate) {
    var TableView, _ref;
    return TableView = (function(_super) {
      __extends(TableView, _super);

      function TableView() {
        this._scrollBarWidth = __bind(this._scrollBarWidth, this);
        this._setPanesSize = __bind(this._setPanesSize, this);
        this._getContainerHeight = __bind(this._getContainerHeight, this);
        this._viewportHeight = __bind(this._viewportHeight, this);
        this._startSpinner = __bind(this._startSpinner, this);
        this._stopSpinner = __bind(this._stopSpinner, this);
        this._assignExtensions = __bind(this._assignExtensions, this);
        this._renderContainer = __bind(this._renderContainer, this);
        this._onScroll = __bind(this._onScroll, this);
        this._resizeCb = __bind(this._resizeCb, this);
        this._assignRegions = __bind(this._assignRegions, this);
        _ref = TableView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      TableView.prototype.events = {
        'click [data-href]': '_onClickDataHref'
      };

      TableView.prototype._onClickDataHref = function(e) {
        var data, el, jscode, parseData, prefix;
        e.stopPropagation();
        if (e.target.tagName !== 'TD') {
          return;
        }
        el = e.currentTarget;
        data = el.getAttribute('data-href');
        if (parseData = data.match(/^javascript:(.*)/m)) {
          prefix = parseData[0], jscode = parseData[1];
          return eval(jscode);
        } else {
          return window.location.href = data;
        }
      };

      TableView.prototype.initialize = function() {
        var debounceSize,
          _this = this;
        this.tableDefaults = {
          columnWidth: 120,
          columnMinWidth: 40,
          borderWidth: 1,
          rowHeight: 28,
          width: 0,
          height: 0,
          extraWidth: 0,
          scrollBarWidth: null,
          min_height: 200
        };
        this.app = this.options.app;
        this.log = this.app.log;
        this.listenTo(this.options.app, 'page:loading', this._startSpinner);
        this.listenTo(this.options.app, 'page:loaded', this._stopSpinner);
        this.listenTo(this.model, 'change', function(model) {
          if (model.changed.data) {
            return _this.render();
          }
        });
        this.prevScrollTop = 0;
        this.prevScrollLeft = 0;
        this._tableRendered = false;
        this._regionsAssigned = false;
        this._hitBottom = false;
        debounceSize = _.debounce((function() {
          if (!_this.tableContainer) {
            return;
          }
          _this.tableContainer.style.width = '0px';
          _this.tableContainer.style.height = '0px';
          _this.$el.width(0);
          _this.$el.height(0);
          document.body.style.overflow = 'auto';
          return _this._setPanesSize();
        }), 300);
        $(window).on('resize', (function() {
          return document.body.style.overflow = 'hidden';
        }));
        return $(window).on('resize', debounceSize);
      };

      TableView.prototype.render = function() {
        var html, scroll_top, visited_row;
        this.log('render');
        this._scrollBarWidth();
        html = this.model.get('data');
        if (!this._regionsAssigned) {
          this.$el.html(mainTableTemplate());
          this._assignRegions();
        }
        if (html) {
          this._renderContainer(html);
        }
        visited_row = this.$el.find('tr.row-state-visited');
        if (visited_row.length) {
          scroll_top = visited_row.position().top - $(this.tableRightViewport).height() / 2;
          this.tableRightViewport.scrollTop = this.tableLeftViewport.scrollTop = scroll_top;
        }
        return this;
      };

      TableView.prototype.insertSortBlocks = function(container, is_fix_columns) {
        var tds;
        tds = container.querySelectorAll('td.sortable, th.sortable');
        return _(tds).each(function(td) {
          if (is_fix_columns) {
            td.style.whiteSpace = 'nowrap';
          } else {
            $(td).append('&nbsp;');
          }
          return $(td).append(sortTemplate());
        });
      };

      TableView.prototype.onShow = function() {
        if (this._tableRendered) {
          this._setPanesSize();
          return this._stopSpinner();
        } else {
          return this.$el.spin();
        }
      };

      TableView.prototype._assignRegions = function() {
        if (this._regionsAssigned) {
          return;
        }
        this.$tableContainer = this.$('.st-table-container');
        this.tableContainer = this.$tableContainer[0];
        this.staticOverlay = this.tableContainer.querySelector('.st-overlay-container');
        this.tableRightViewport = this.tableContainer.querySelector('.st-table-right-viewport');
        this.tableLeftViewport = this.tableContainer.querySelector('.st-table-left-viewport');
        this.headerRightPane = this.tableContainer.querySelector('.st-table-header-right-pane');
        this.headerLeftPane = this.tableContainer.querySelector('.st-table-header-left-pane');
        this.leftExts = this._assignExtensions(this.headerLeftPane);
        this.rightExts = this._assignExtensions(this.headerRightPane);
        if (this.resizer) {
          this.resizer.rebind({
            statOverlay: this.staticOverlay
          });
        } else {
          this.resizer = new Resizing({
            app: this.app,
            "$main": this.$el,
            onResizeCb: this._resizeCb,
            statOverlay: this.staticOverlay,
            tableDefaults: this.tableDefaults
          });
        }
        return this._regionsAssigned = true;
      };

      TableView.prototype._resizeCb = function(tableClass) {
        var div, extraWidth, table, tables, _i, _len, _width;
        if (tableClass === 'st-fixed-table-left') {
          this._setPanesSize();
          this.leftExts.reorder.buildHierarchy();
        } else if (tableClass === 'st-fixed-table-right') {
          tables = this.tableContainer.querySelectorAll('.st-fixed-table-right');
          for (_i = 0, _len = tables.length; _i < _len; _i++) {
            table = tables[_i];
            extraWidth = this.tableDefaults.extraWidth + ((_width = table.getAttribute('data-scroll-width')) ? parseInt(_width, 10) : 0);
            div = table.parentElement;
            div.style.width = "" + (this.app.elWidth(table) + extraWidth) + "px";
          }
          this.rightExts.reorder.buildHierarchy();
        }
        return this.app.trigger('table:widths');
      };

      TableView.prototype._onScroll = function(e) {
        var hScroll, scrollLeft, scrollTop, vScroll;
        if (!this.tableRightViewport) {
          return;
        }
        scrollLeft = this.tableRightViewport.scrollLeft;
        scrollTop = this.tableRightViewport.scrollTop;
        hScroll = Math.abs(scrollLeft - this.prevScrollLeft);
        vScroll = Math.abs(scrollTop - this.prevScrollTop);
        this.prevScrollLeft = scrollLeft;
        this.prevScrollTop = scrollTop;
        if (hScroll) {
          this.headerRightPane.scrollLeft = scrollLeft;
        }
        if (vScroll) {
          this.tableLeftViewport.scrollTop = scrollTop;
          if ((scrollTop + this.tableRightViewport.clientHeight) >= this.tableRightViewport.scrollHeight) {
            this.options.app.trigger('scroll:bottom');
            return this._hitBottom = true;
          } else if (this._hitBottom) {
            this.options.app.trigger('scroll');
            return this._hitBottom = false;
          }
        }
      };

      TableView.prototype._renderContainer = function(data) {
        var tables,
          _this = this;
        if (!data) {
          return;
        }
        this.log('render container');
        this._startSpinner();
        tables = new SplitTable(this.el, data, this.tableDefaults, this.model, this.insertSortBlocks);
        this._numerateRows(tables.top.left);
        this._numerateRows(tables.top.right);
        this.log('insert header');
        if (tables.top.left) {
          this.headerLeftPane.innerHTML = '';
          this.headerLeftPane.appendChild(tables.top.left);
          this.headerLeftColumns = this.headerLeftPane.querySelector('table');
          this.leftExts.reset();
        }
        if (tables.top.right) {
          this.headerRightPane.innerHTML = '';
          if (tables.top.right) {
            this.headerRightPane.appendChild(tables.top.right);
          }
          this.headerRightColumns = this.headerRightPane.querySelector('table');
          this.headerHeight = tables.top.height;
          this.rightExts.reset();
        }
        this.log('insert data');
        if (this.model.get('fetchType') === 'page') {
          this.tableLeftViewport.innerHTML = '';
          this.tableRightViewport.innerHTML = '';
        }
        this.tableLeftViewport.appendChild(tables.bottom.left);
        this.tableRightViewport.appendChild(tables.bottom.right);
        this.tableRightViewport.onscroll = this._onScroll;
        $(this.tableLeftViewport).off('mousewheel');
        $(this.tableLeftViewport).on('mousewheel', function(e) {
          if (e.deltaY) {
            _this.tableRightViewport.scrollTop -= e.deltaY * e.deltaFactor;
          }
          return _this._onScroll();
        });
        this._tableRendered = true;
        this._tables = tables;
        this.app.trigger('container:render');
        this._setPanesSize();
        return this._stopSpinner();
      };

      TableView.prototype._numerateRows = function(table, offset) {
        var trs;
        if (offset == null) {
          offset = 0;
        }
        trs = table != null ? table.querySelectorAll('tr') : void 0;
        return _(trs).each(function(tr, ind) {
          return tr.setAttribute('data-row-index', ind + offset);
        });
      };

      TableView.prototype._assignExtensions = function(container) {
        var options;
        options = {
          app: this.options.app,
          model: this.model,
          container: container
        };
        return {
          sort: new Sorting(options),
          resize: new ResizingGrid(options),
          reorder: new ColumnReordering(options, this.tableRightViewport),
          reset: function() {
            this.sort.setSorting();
            this.resize.setGrid();
            return this.reorder.buildHierarchy();
          }
        };
      };

      TableView.prototype._stopSpinner = function() {
        return this.$el.spin(false);
      };

      TableView.prototype._startSpinner = function() {
        return this.$el.spin(true);
      };

      TableView.prototype._viewportHeight = function() {
        return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      };

      TableView.prototype._getContainerHeight = function(tables) {
        var body_height, expanded_table_height, fit_page_height, header_height, min_height, scroll_width;
        header_height = $(tables.top.right).height();
        body_height = $(tables.bottom.right).height();
        scroll_width = this._scrollBarWidth();
        expanded_table_height = header_height + body_height + scroll_width;
        fit_page_height = this._viewportHeight() - this.$el.position().top;
        fit_page_height -= this.$el.css("padding-top").replace("px", "");
        fit_page_height -= this.$el.css("padding-bottom").replace("px", "");
        min_height = this.tableDefaults.min_height + scroll_width;
        if (expanded_table_height < fit_page_height) {
          return expanded_table_height;
        }
        if (fit_page_height > min_height) {
          return fit_page_height;
        }
        return expanded_table_height;
      };

      TableView.prototype._setPanesSize = function() {
        var borderWidth, leftBordersWidth, paneHeight, rightPaneWidth, scrollWidth;
        this.containerWidth = this.$el.width();
        this.$el.height(this._getContainerHeight(this._tables));
        this.containerHeight = this.$el.height();
        this.log('set panes size');
        this.log("setting sizes for width: " + this.containerWidth + ", height: " + this.containerHeight);
        this.tableDefaults.width = this.containerWidth;
        this.tableDefaults.height = this.containerHeight;
        this.leftWidth = this.app.elWidth(this.headerLeftColumns);
        this.rightWidth = this.app.elWidth(this.headerRightColumns);
        scrollWidth = this._scrollBarWidth();
        borderWidth = this.tableDefaults.borderWidth;
        rightPaneWidth = this.containerWidth - this.leftWidth;
        paneHeight = this.containerHeight - this.headerHeight;
        this.tableContainer.style.width = "" + this.containerWidth + "px";
        this.tableContainer.style.height = "" + this.containerHeight + "px";
        leftBordersWidth = this.headerLeftPane.offsetWidth - this.headerLeftPane.clientWidth;
        this.leftWidth += leftBordersWidth;
        this.headerLeftPane.style.width = "" + this.leftWidth + "px";
        this.headerRightPane.style.left = "" + this.leftWidth + "px";
        this.headerRightPane.style.width = "" + rightPaneWidth + "px";
        this.tableLeftViewport.style.top = "" + this.headerHeight + "px";
        this.tableLeftViewport.style.width = "" + this.leftWidth + "px";
        this.tableLeftViewport.style.height = "" + paneHeight + "px";
        this.tableRightViewport.style.top = "" + this.headerHeight + "px";
        this.tableRightViewport.style.left = "" + this.leftWidth + "px";
        this.tableRightViewport.style.width = "" + rightPaneWidth + "px";
        this.tableRightViewport.style.height = "" + paneHeight + "px";
        if (!this.model.get('fix_columns')) {
          return this.tableRightViewport.style.overflowX = "auto";
        }
      };

      TableView.prototype._scrollBarWidth = function() {
        var div, width;
        if (this.tableDefaults.scrollBarWidth !== null) {
          return this.tableDefaults.scrollBarWidth;
        }
        div = document.createElement('div');
        div.innerHTML = '<div style="width:50px;height:50px;position:absolute;left:-50px;top:-50px;overflow:auto;"><div style="width:1px;height:100px;"></div></div>';
        div = div.firstChild;
        document.body.appendChild(div);
        width = div.offsetWidth - div.clientWidth;
        document.body.removeChild(div);
        return this.tableDefaults.scrollBarWidth = width;
      };

      return TableView;

    })(Backbone.View);
  });

}).call(this);

(function() {
  define('templates/header',['jquery', 'underscore'], function($, _) {
    return function(context) {
      var render;
      render = function() {
        var $o;
        $o = [];
        $o.push("<a class='disabled st-btn' href='#' role='first-page' title='Первая страница'>\n  <strong>&lt;&lt;</strong>\n</a>\n<a class='disabled st-btn' href='#' role='prev-page' title='Предыдущая страница'>\n  <strong>&lt;</strong>\n</a>\n<span role='first-row'>?</span>\n\-\n<span role='last-row'>?</span>\nиз\n<span role='total-rows'>?</span>\n<a class='disabled st-btn' href='#' role='next-page' title='Следующая страница'>\n  <strong>&gt;</strong>\n</a>\n<a class='disabled st-btn' href='#' role='last-page' title='Последняя страница'>\n  <strong>&gt;&gt;</strong>\n</a>");
        return $o.join("\n").replace(/\s(?:id|class)=(['"])(\1)/mg, "");
      };
      return render.call(context);
    };
  });

}).call(this);

(function() {
  define('templates/empty_header',['jquery', 'underscore'], function($, _) {
    return function(context) {
      var render;
      render = function() {
        var $c, $o;
        $c = function(text) {
          switch (text) {
            case null:
            case void 0:
              return '';
            case true:
            case false:
              return '' + text;
            default:
              return text;
          }
        };
        $o = [];
        $o.push("<div class='disabled st-btn'>" + ($c(this.msg || 'список пуст')) + "</div>");
        return $o.join("\n").replace(/\s([\w-]+)='true'/mg, ' $1').replace(/\s([\w-]+)='false'/mg, '').replace(/\s(?:id|class)=(['"])(\1)/mg, "");
      };
      return render.call(context);
    };
  });

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/header',['backbone', 'templates/header', 'templates/empty_header'], function(Backbone, template, emptyTemplate) {
    var FooterView, _ref;
    return FooterView = (function(_super) {
      __extends(FooterView, _super);

      function FooterView() {
        this.enablePrev = __bind(this.enablePrev, this);
        this.disablePrev = __bind(this.disablePrev, this);
        this.enableNext = __bind(this.enableNext, this);
        this.disableNext = __bind(this.disableNext, this);
        this.renderBindVals = __bind(this.renderBindVals, this);
        this.render = __bind(this.render, this);
        _ref = FooterView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      FooterView.prototype.events = {
        'click @more-button': '_onClickMore',
        'click @next-page': '_onClickNext',
        'click @prev-page': '_onClickPrev',
        'click @first-page': '_onClickFirst',
        'click @last-page': '_onClickLast'
      };

      FooterView.prototype.initialize = function() {
        var _this = this;
        this.listenTo(this.model, 'change', this.render);
        this.listenTo(this.options.app, 'scroll:bottom', function() {
          if (!_this.model.lastPage()) {
            return _this._enableMore();
          }
        });
        return this.listenTo(this.options.app, 'scroll', this._disableMore);
      };

      FooterView.prototype.render = function() {
        if (this.model.get('pager_off')) {
          this.$el.hide();
        } else {
          this.$el.show();
          if (parseInt(this.model.get('cnt'), 10) > 0) {
            this.$el.html(template());
            this._assignUi();
            this.renderBindVals();
          } else {
            this.$el.html(emptyTemplate({
              msg: this.model.get('empty_label')
            }));
          }
        }
        return this;
      };

      FooterView.prototype.renderBindVals = function() {
        this.$firstRow.html(this.model.start() + 1 || '?');
        this.$lastRow.html(this.model.start() + this.model.cnt() || '?');
        this.$totalRows.html(this.model.total() || '?');
        if (!this.model.firstPage()) {
          this.enablePrev();
        } else {
          this.disablePrev();
        }
        if (!this.model.lastPage()) {
          return this.enableNext();
        } else {
          return this.disableNext();
        }
      };

      FooterView.prototype._assignUi = function() {
        this.$moreButton = this.$('@more-button');
        this.$nextPage = this.$('@next-page');
        this.$prevPage = this.$('@prev-page');
        this.$firstPage = this.$('@first-page');
        this.$lastPage = this.$('@last-page');
        this.$firstRow = this.$('@first-row');
        this.$lastRow = this.$('@last-row');
        return this.$totalRows = this.$('@total-rows');
      };

      FooterView.prototype._preventDefault = function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };

      FooterView.prototype._onClickMore = function(e) {
        this._preventDefault(e);
        if (this.$moreButton.hasClass('disabled')) {
          return;
        }
        this._disableMore();
        this.options.app.trigger('more-button:click');
        return false;
      };

      FooterView.prototype._onClickNext = function(e) {
        this._preventDefault(e);
        if (this.$nextPage.hasClass('disabled')) {
          return;
        }
        this.options.app.trigger('next-page:click');
        return false;
      };

      FooterView.prototype._onClickPrev = function(e) {
        this._preventDefault(e);
        if (this.$prevPage.hasClass('disabled')) {
          return;
        }
        this.options.app.trigger('prev-page:click');
        return false;
      };

      FooterView.prototype._onClickLast = function(e) {
        this._preventDefault(e);
        if (this.$lastPage.hasClass('disabled')) {
          return;
        }
        this.options.app.trigger('last-page:click');
        return false;
      };

      FooterView.prototype._onClickFirst = function(e) {
        this._preventDefault(e);
        if (this.$firstPage.hasClass('disabled')) {
          return;
        }
        this.options.app.trigger('first-page:click');
        return false;
      };

      FooterView.prototype._disableMore = function() {
        return this.$moreButton.addClass('disabled');
      };

      FooterView.prototype._enableMore = function() {
        return this.$moreButton.removeClass('disabled');
      };

      FooterView.prototype.disableNext = function() {
        this.$nextPage.addClass('disabled');
        return this.$lastPage.addClass('disabled');
      };

      FooterView.prototype.enableNext = function() {
        this.$nextPage.removeClass('disabled');
        return this.$lastPage.removeClass('disabled');
      };

      FooterView.prototype.disablePrev = function() {
        this.$prevPage.addClass('disabled');
        return this.$firstPage.addClass('disabled');
      };

      FooterView.prototype.enablePrev = function() {
        this.$prevPage.removeClass('disabled');
        return this.$firstPage.removeClass('disabled');
      };

      return FooterView;

    })(Backbone.View);
  });

}).call(this);

(function() {
  define('templates/layout',['jquery', 'underscore'], function($, _) {
    return function(context) {
      var render;
      render = function() {
        var $o;
        $o = [];
        $o.push("<div class='main-container'>\n  <div class='table-header' role='header' style='display:none'></div>\n  <div class='table-container' role='table-container'></div>\n  <div class='table-footer' role='footer'></div>\n</div>");
        return $o.join("\n").replace(/\s(?:id|class)=(['"])(\1)/mg, "");
      };
      return render.call(context);
    };
  });

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('views/layout',['backbone', 'views/table', 'views/header', 'templates/layout'], function(Backbone, TableView, HeaderView, template) {
    var LayoutView, _ref;
    return LayoutView = (function(_super) {
      __extends(LayoutView, _super);

      function LayoutView() {
        _ref = LayoutView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      LayoutView.prototype.render = function() {
        this.$el.empty();
        this.$el.html(template());
        (new HeaderView({
          el: this.$el.parent().prev().find('@header'),
          app: this.options.app,
          model: this.options.table
        })).render();
        this.table = new TableView({
          el: this.$('@table-container'),
          app: this.options.app,
          model: this.options.table,
          $container: this.$el
        });
        return this.table.render();
      };

      return LayoutView;

    })(Backbone.View);
  });

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define('services/table_state',['underscore', 'backbone'], function(_, Backbone) {
    var TableState;
    return TableState = (function() {
      function TableState(_arg) {
        this.app = _arg.app, this.el = _arg.el, this.table = _arg.table;
        this._gatherData = __bind(this._gatherData, this);
        this._collectHeaderData = __bind(this._collectHeaderData, this);
        this.columns = __bind(this.columns, this);
        this.columnsStr = __bind(this.columnsStr, this);
      }

      TableState.prototype.columnsStr = function() {
        return JSON.stringify(this.columns());
      };

      TableState.prototype.columns = function() {
        var leftHeader, rightHeader;
        leftHeader = this.el.querySelector('.st-table-container .st-table-header-left-pane table.st-fixed-table-left');
        rightHeader = this.el.querySelector('.st-table-container .st-table-header-right-pane table.st-fixed-table-right');
        return [].concat(this._collectHeaderData(leftHeader)).concat(this._collectHeaderData(rightHeader));
      };

      TableState.prototype._collectHeaderData = function(header) {
        var tds, w;
        tds = header.querySelectorAll('th[id], td[id]');
        w = _(tds).map(function(td) {
          return {
            el: td,
            left: td.offsetLeft,
            right: td.offsetLeft + td.offsetWidth
          };
        });
        return this._gatherData(w);
      };

      TableState.prototype._gatherData = function(tds, arr) {
        var children, first, isChild, obj, other;
        if (arr == null) {
          arr = [];
        }
        if (!tds.length) {
          return arr;
        }
        first = tds.splice(0, 1)[0];
        obj = this._tdAttrs(first.el);
        isChild = _.partial(this._isChild, first);
        children = _(tds).filter(isChild);
        other = _(tds).reject(isChild);
        if (children.length) {
          obj.group = this._gatherData(children, []);
        }
        arr.push(obj);
        return this._gatherData(other, arr);
      };

      TableState.prototype._isChild = function(parent, child) {
        return child.left >= parent.left && child.right <= parent.right;
      };

      TableState.prototype._tdAttrs = function(td) {
        var sort;
        sort = {};
        if (td.className.match(/\bsortable\b/)) {
          sort.sort = '1';
          if (td.querySelector('div.st-sort-block span[data-order-dir="asc"]').className.match(/\bactive\b/)) {
            sort.asc = '1';
          } else if (td.querySelector('div.st-sort-block span[data-order-dir="desc"]').className.match(/\bactive\b/)) {
            sort.desc = '1';
          }
        }
        return _.extend({
          id: td.id,
          width: td.clientWidth,
          height: td.clientHeight
        }, sort);
      };

      return TableState;

    })();
  });

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define('services/table_api',['underscore', 'backbone'], function(_, Backbone) {
    var TableAPI;
    return TableAPI = (function() {
      function TableAPI(options) {
        this._saveState = __bind(this._saveState, this);
        this._fetchPage = __bind(this._fetchPage, this);
        this._withDefaults = __bind(this._withDefaults, this);
        this.postPage = __bind(this.postPage, this);
        this.getPage = __bind(this.getPage, this);
        var state,
          _this = this;
        _.extend(this, Backbone.Events);
        this.app = options.app;
        this.log = this.app.log;
        state = options.tableState;
        this.listenTo(options.app, 'more-button:click', function() {
          if (!_this.table.lastPage()) {
            return _this.getPage(_this.table.nextPage(), 'mergePage');
          }
        });
        this.listenTo(options.app, 'next-page:click', function() {
          if (!_this.table.lastPage()) {
            return _this.getPage(_this.table.nextPage());
          }
        });
        this.listenTo(options.app, 'prev-page:click', function() {
          if (!_this.table.firstPage()) {
            return _this.getPage(_this.table.prevPage());
          }
        });
        this.listenTo(options.app, 'first-page:click', function() {
          if (!_this.table.firstPage()) {
            return _this.getPage(_this.table.firstPage());
          }
        });
        this.listenTo(options.app, 'last-page:click', function() {
          if (!_this.table.lastPage()) {
            return _this.getPage(_this.table.lastPageStart());
          }
        });
        this.listenTo(options.app, 'table:sort', function() {
          return _this.postPage({
            action: 'update_columns',
            sort: 1,
            columns: state.columnsStr(),
            salt: Math.random()
          });
        });
        this.listenTo(options.app, 'table:reorder', function() {
          return _this.postPage({
            action: 'update_columns',
            order: 1,
            columns: state.columnsStr(),
            salt: Math.random()
          });
        });
        this.listenTo(options.app, 'table:widths', function() {
          return _this._saveState({
            data: {
              action: 'update_dimensions',
              columns: state.columnsStr(),
              salt: Math.random()
            }
          });
        });
        this.listenTo(options.app, 'container:render', function() {
          return options.containerRender();
        });
        this.pageUrl = options.pageUrl;
        this.table = options.table;
      }

      TableAPI.prototype.getPage = function(start, fetchType) {
        if (start == null) {
          start = 0;
        }
        if (fetchType == null) {
          fetchType = 'page';
        }
        return this._fetchPage({
          data: {
            start: start
          },
          fetchType: fetchType
        });
      };

      TableAPI.prototype.postPage = function(data) {
        return this._fetchPage({
          data: data,
          method: 'POST'
        });
      };

      TableAPI.prototype._withDefaults = function(options) {
        var data;
        data = _.extend({
          start: this.table.start() || 0
        }, options.data, this.table.get('datasource_params'));
        return _.extend({}, {
          data: data,
          fetchType: 'page',
          method: 'GET'
        }, _.omit(options, 'data'));
      };

      TableAPI.prototype._fetchPage = function(options) {
        var _this = this;
        options = this._withDefaults(options);
        this.log('fetching page');
        this.table.set('fetchType', options.fetchType);
        this.app.trigger('page:loading');
        return this.table.fetch({
          url: this._apiUrl(options.data.start),
          data: options.data,
          method: options.method,
          success: function() {
            return _this.app.trigger('page:loaded');
          },
          error: function() {
            return alert("Ошибка при загрузке страницы");
          },
          dataType: 'json'
        });
      };

      TableAPI.prototype._saveState = function(options) {
        options = this._withDefaults(options);
        return Backbone.$.ajax({
          method: 'POST',
          url: this.table.url,
          data: options.data
        });
      };

      TableAPI.prototype._apiUrl = function(index) {
        return this.table.url.replace('#{page}', index) + '&salt=' + Math.random();
      };

      return TableAPI;

    })();
  });

}).call(this);

(function() {
  define('app',['underscore', 'backbone', 'models/table', 'views/layout', 'services/table_state', 'services/table_api'], function(_, Backbone, TableModel, LayoutView, TableState, TableAPI) {
    var App;
    return App = (function() {
      App.version = '0.1.4';

      App.prototype.log = function(msg) {
        var _ref;
        return (_ref = window.console) != null ? typeof _ref.log === "function" ? _ref.log(msg) : void 0 : void 0;
      };

      function App(options) {
        var el, layoutView, table, tableAPI, tableState;
        _.extend(this, Backbone.Events);
        this.log("app starting version " + App.version + "...");
        if (!options.tableUrl) {
          this.log('url is a mandatory parameter');
          return false;
        }
        el = options.el || 'body';
        table = new TableModel(options.initial_data || {}, {
          url: options.tableUrl
        });
        layoutView = new LayoutView({
          app: this,
          el: el,
          table: table
        });
        layoutView.render();
        tableState = new TableState({
          app: this,
          table: table,
          el: layoutView.table.el
        });
        tableAPI = new TableAPI({
          app: this,
          table: table,
          tableState: tableState,
          pageUrl: options.pageUrl,
          containerRender: options.containerRender || function() {}
        });
        this.trigger('page:loaded');
        this.trigger('container:render');
      }

      App.prototype.elWidth = function(obj) {
        return Math.max(obj.clientWidth, obj.offsetWidth, obj.scrollWidth);
      };

      App.prototype.elHeight = function(obj) {
        return Math.max(obj.clientHeight, obj.offsetHeight, obj.scrollHeight);
      };

      App.prototype.cancelSelection = function() {
        if (document.selection) {
          return document.selection.empty();
        } else if (window.getSelection) {
          try {
            return window.getSelection().collapseToStart();
          } catch (_error) {}
        }
      };

      return App;

    })();
  });

}).call(this);

(function() {
  'use strict';
  require.config({
    baseUrl: 'scripts',
    shim: {
      'jquery.role': ['jquery'],
      'jquery-mousewheel': ['jquery'],
      underscore: {
        exports: '_'
      },
      backbone: {
        deps: ['underscore', 'jquery', 'jquery.role', 'jquery.spin', 'jquery-mousewheel'],
        exports: 'Backbone'
      }
    },
    paths: {
      jquery: '../bower_components/jquery/jquery',
      'jquery-mousewheel': '../bower_components/jquery-mousewheel/jquery.mousewheel',
      'jquery.role': '../bower_components/rolejs/lib/jquery.role',
      spin: '../bower_components/spinjs/spin',
      'jquery.spin': '../bower_components/spinjs/jquery.spin',
      backbone: '../bower_components/backbone/backbone',
      underscore: '../bower_components/underscore/underscore'
    }
  });

  define('main',['app'], function(SuperTable) {
    return SuperTable;
  });

}).call(this);

define(['main'], function(SuperTable) {return SuperTable;});}).call(this);