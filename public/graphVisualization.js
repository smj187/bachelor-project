var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var check = function (it) {
  return it && it.Math == Math && it;
};

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global_1 =
  // eslint-disable-next-line no-undef
  check(typeof globalThis == 'object' && globalThis) ||
  check(typeof window == 'object' && window) ||
  check(typeof self == 'object' && self) ||
  check(typeof commonjsGlobal == 'object' && commonjsGlobal) ||
  // eslint-disable-next-line no-new-func
  Function('return this')();

var fails = function (exec) {
  try {
    return !!exec();
  } catch (error) {
    return true;
  }
};

// Thank's IE8 for his funny defineProperty
var descriptors = !fails(function () {
  return Object.defineProperty({}, 1, { get: function () { return 7; } })[1] != 7;
});

var nativePropertyIsEnumerable = {}.propertyIsEnumerable;
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Nashorn ~ JDK8 bug
var NASHORN_BUG = getOwnPropertyDescriptor && !nativePropertyIsEnumerable.call({ 1: 2 }, 1);

// `Object.prototype.propertyIsEnumerable` method implementation
// https://tc39.github.io/ecma262/#sec-object.prototype.propertyisenumerable
var f = NASHORN_BUG ? function propertyIsEnumerable(V) {
  var descriptor = getOwnPropertyDescriptor(this, V);
  return !!descriptor && descriptor.enumerable;
} : nativePropertyIsEnumerable;

var objectPropertyIsEnumerable = {
	f: f
};

var createPropertyDescriptor = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

var toString = {}.toString;

var classofRaw = function (it) {
  return toString.call(it).slice(8, -1);
};

var split = ''.split;

// fallback for non-array-like ES3 and non-enumerable old V8 strings
var indexedObject = fails(function () {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins
  return !Object('z').propertyIsEnumerable(0);
}) ? function (it) {
  return classofRaw(it) == 'String' ? split.call(it, '') : Object(it);
} : Object;

// `RequireObjectCoercible` abstract operation
// https://tc39.github.io/ecma262/#sec-requireobjectcoercible
var requireObjectCoercible = function (it) {
  if (it == undefined) throw TypeError("Can't call method on " + it);
  return it;
};

// toObject with fallback for non-array-like ES3 strings



var toIndexedObject = function (it) {
  return indexedObject(requireObjectCoercible(it));
};

var isObject = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

// `ToPrimitive` abstract operation
// https://tc39.github.io/ecma262/#sec-toprimitive
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
var toPrimitive = function (input, PREFERRED_STRING) {
  if (!isObject(input)) return input;
  var fn, val;
  if (PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  if (typeof (fn = input.valueOf) == 'function' && !isObject(val = fn.call(input))) return val;
  if (!PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  throw TypeError("Can't convert object to primitive value");
};

var hasOwnProperty = {}.hasOwnProperty;

var has = function (it, key) {
  return hasOwnProperty.call(it, key);
};

var document$1 = global_1.document;
// typeof document.createElement is 'object' in old IE
var EXISTS = isObject(document$1) && isObject(document$1.createElement);

var documentCreateElement = function (it) {
  return EXISTS ? document$1.createElement(it) : {};
};

// Thank's IE8 for his funny defineProperty
var ie8DomDefine = !descriptors && !fails(function () {
  return Object.defineProperty(documentCreateElement('div'), 'a', {
    get: function () { return 7; }
  }).a != 7;
});

var nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
var f$1 = descriptors ? nativeGetOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
  O = toIndexedObject(O);
  P = toPrimitive(P, true);
  if (ie8DomDefine) try {
    return nativeGetOwnPropertyDescriptor(O, P);
  } catch (error) { /* empty */ }
  if (has(O, P)) return createPropertyDescriptor(!objectPropertyIsEnumerable.f.call(O, P), O[P]);
};

var objectGetOwnPropertyDescriptor = {
	f: f$1
};

var anObject = function (it) {
  if (!isObject(it)) {
    throw TypeError(String(it) + ' is not an object');
  } return it;
};

var nativeDefineProperty = Object.defineProperty;

// `Object.defineProperty` method
// https://tc39.github.io/ecma262/#sec-object.defineproperty
var f$2 = descriptors ? nativeDefineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (ie8DomDefine) try {
    return nativeDefineProperty(O, P, Attributes);
  } catch (error) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

var objectDefineProperty = {
	f: f$2
};

var createNonEnumerableProperty = descriptors ? function (object, key, value) {
  return objectDefineProperty.f(object, key, createPropertyDescriptor(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

var setGlobal = function (key, value) {
  try {
    createNonEnumerableProperty(global_1, key, value);
  } catch (error) {
    global_1[key] = value;
  } return value;
};

var SHARED = '__core-js_shared__';
var store = global_1[SHARED] || setGlobal(SHARED, {});

var sharedStore = store;

var functionToString = Function.toString;

// this helper broken in `3.4.1-3.4.4`, so we can't use `shared` helper
if (typeof sharedStore.inspectSource != 'function') {
  sharedStore.inspectSource = function (it) {
    return functionToString.call(it);
  };
}

var inspectSource = sharedStore.inspectSource;

var WeakMap = global_1.WeakMap;

var nativeWeakMap = typeof WeakMap === 'function' && /native code/.test(inspectSource(WeakMap));

var shared = createCommonjsModule(function (module) {
(module.exports = function (key, value) {
  return sharedStore[key] || (sharedStore[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: '3.6.4',
  mode:  'global',
  copyright: '© 2020 Denis Pushkarev (zloirock.ru)'
});
});

var id = 0;
var postfix = Math.random();

var uid = function (key) {
  return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
};

var keys = shared('keys');

var sharedKey = function (key) {
  return keys[key] || (keys[key] = uid(key));
};

var hiddenKeys = {};

var WeakMap$1 = global_1.WeakMap;
var set, get, has$1;

var enforce = function (it) {
  return has$1(it) ? get(it) : set(it, {});
};

var getterFor = function (TYPE) {
  return function (it) {
    var state;
    if (!isObject(it) || (state = get(it)).type !== TYPE) {
      throw TypeError('Incompatible receiver, ' + TYPE + ' required');
    } return state;
  };
};

if (nativeWeakMap) {
  var store$1 = new WeakMap$1();
  var wmget = store$1.get;
  var wmhas = store$1.has;
  var wmset = store$1.set;
  set = function (it, metadata) {
    wmset.call(store$1, it, metadata);
    return metadata;
  };
  get = function (it) {
    return wmget.call(store$1, it) || {};
  };
  has$1 = function (it) {
    return wmhas.call(store$1, it);
  };
} else {
  var STATE = sharedKey('state');
  hiddenKeys[STATE] = true;
  set = function (it, metadata) {
    createNonEnumerableProperty(it, STATE, metadata);
    return metadata;
  };
  get = function (it) {
    return has(it, STATE) ? it[STATE] : {};
  };
  has$1 = function (it) {
    return has(it, STATE);
  };
}

var internalState = {
  set: set,
  get: get,
  has: has$1,
  enforce: enforce,
  getterFor: getterFor
};

var redefine = createCommonjsModule(function (module) {
var getInternalState = internalState.get;
var enforceInternalState = internalState.enforce;
var TEMPLATE = String(String).split('String');

(module.exports = function (O, key, value, options) {
  var unsafe = options ? !!options.unsafe : false;
  var simple = options ? !!options.enumerable : false;
  var noTargetGet = options ? !!options.noTargetGet : false;
  if (typeof value == 'function') {
    if (typeof key == 'string' && !has(value, 'name')) createNonEnumerableProperty(value, 'name', key);
    enforceInternalState(value).source = TEMPLATE.join(typeof key == 'string' ? key : '');
  }
  if (O === global_1) {
    if (simple) O[key] = value;
    else setGlobal(key, value);
    return;
  } else if (!unsafe) {
    delete O[key];
  } else if (!noTargetGet && O[key]) {
    simple = true;
  }
  if (simple) O[key] = value;
  else createNonEnumerableProperty(O, key, value);
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, 'toString', function toString() {
  return typeof this == 'function' && getInternalState(this).source || inspectSource(this);
});
});

var path = global_1;

var aFunction = function (variable) {
  return typeof variable == 'function' ? variable : undefined;
};

var getBuiltIn = function (namespace, method) {
  return arguments.length < 2 ? aFunction(path[namespace]) || aFunction(global_1[namespace])
    : path[namespace] && path[namespace][method] || global_1[namespace] && global_1[namespace][method];
};

var ceil = Math.ceil;
var floor = Math.floor;

// `ToInteger` abstract operation
// https://tc39.github.io/ecma262/#sec-tointeger
var toInteger = function (argument) {
  return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
};

var min = Math.min;

// `ToLength` abstract operation
// https://tc39.github.io/ecma262/#sec-tolength
var toLength = function (argument) {
  return argument > 0 ? min(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
};

var max = Math.max;
var min$1 = Math.min;

// Helper for a popular repeating case of the spec:
// Let integer be ? ToInteger(index).
// If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
var toAbsoluteIndex = function (index, length) {
  var integer = toInteger(index);
  return integer < 0 ? max(integer + length, 0) : min$1(integer, length);
};

// `Array.prototype.{ indexOf, includes }` methods implementation
var createMethod = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIndexedObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) {
      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

var arrayIncludes = {
  // `Array.prototype.includes` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.includes
  includes: createMethod(true),
  // `Array.prototype.indexOf` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
  indexOf: createMethod(false)
};

var indexOf = arrayIncludes.indexOf;


var objectKeysInternal = function (object, names) {
  var O = toIndexedObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~indexOf(result, key) || result.push(key);
  }
  return result;
};

// IE8- don't enum bug keys
var enumBugKeys = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];

var hiddenKeys$1 = enumBugKeys.concat('length', 'prototype');

// `Object.getOwnPropertyNames` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertynames
var f$3 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return objectKeysInternal(O, hiddenKeys$1);
};

var objectGetOwnPropertyNames = {
	f: f$3
};

var f$4 = Object.getOwnPropertySymbols;

var objectGetOwnPropertySymbols = {
	f: f$4
};

// all object keys, includes non-enumerable and symbols
var ownKeys = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
  var keys = objectGetOwnPropertyNames.f(anObject(it));
  var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
  return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
};

var copyConstructorProperties = function (target, source) {
  var keys = ownKeys(source);
  var defineProperty = objectDefineProperty.f;
  var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!has(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
  }
};

var replacement = /#|\.prototype\./;

var isForced = function (feature, detection) {
  var value = data[normalize(feature)];
  return value == POLYFILL ? true
    : value == NATIVE ? false
    : typeof detection == 'function' ? fails(detection)
    : !!detection;
};

var normalize = isForced.normalize = function (string) {
  return String(string).replace(replacement, '.').toLowerCase();
};

var data = isForced.data = {};
var NATIVE = isForced.NATIVE = 'N';
var POLYFILL = isForced.POLYFILL = 'P';

var isForced_1 = isForced;

var getOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;






/*
  options.target      - name of the target object
  options.global      - target is the global object
  options.stat        - export as static methods of target
  options.proto       - export as prototype methods of target
  options.real        - real prototype method for the `pure` version
  options.forced      - export even if the native feature is available
  options.bind        - bind methods to the target, required for the `pure` version
  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
  options.sham        - add a flag to not completely full polyfills
  options.enumerable  - export as enumerable property
  options.noTargetGet - prevent calling a getter on target
*/
var _export = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var FORCED, target, key, targetProperty, sourceProperty, descriptor;
  if (GLOBAL) {
    target = global_1;
  } else if (STATIC) {
    target = global_1[TARGET] || setGlobal(TARGET, {});
  } else {
    target = (global_1[TARGET] || {}).prototype;
  }
  if (target) for (key in source) {
    sourceProperty = source[key];
    if (options.noTargetGet) {
      descriptor = getOwnPropertyDescriptor$1(target, key);
      targetProperty = descriptor && descriptor.value;
    } else targetProperty = target[key];
    FORCED = isForced_1(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
    // contained in target
    if (!FORCED && targetProperty !== undefined) {
      if (typeof sourceProperty === typeof targetProperty) continue;
      copyConstructorProperties(sourceProperty, targetProperty);
    }
    // add a flag to not completely full polyfills
    if (options.sham || (targetProperty && targetProperty.sham)) {
      createNonEnumerableProperty(sourceProperty, 'sham', true);
    }
    // extend global
    redefine(target, key, sourceProperty, options);
  }
};

var aFunction$1 = function (it) {
  if (typeof it != 'function') {
    throw TypeError(String(it) + ' is not a function');
  } return it;
};

// optional / simple context binding
var functionBindContext = function (fn, that, length) {
  aFunction$1(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 0: return function () {
      return fn.call(that);
    };
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

// `ToObject` abstract operation
// https://tc39.github.io/ecma262/#sec-toobject
var toObject = function (argument) {
  return Object(requireObjectCoercible(argument));
};

// `IsArray` abstract operation
// https://tc39.github.io/ecma262/#sec-isarray
var isArray = Array.isArray || function isArray(arg) {
  return classofRaw(arg) == 'Array';
};

var nativeSymbol = !!Object.getOwnPropertySymbols && !fails(function () {
  // Chrome 38 Symbol has incorrect toString conversion
  // eslint-disable-next-line no-undef
  return !String(Symbol());
});

var useSymbolAsUid = nativeSymbol
  // eslint-disable-next-line no-undef
  && !Symbol.sham
  // eslint-disable-next-line no-undef
  && typeof Symbol.iterator == 'symbol';

var WellKnownSymbolsStore = shared('wks');
var Symbol$1 = global_1.Symbol;
var createWellKnownSymbol = useSymbolAsUid ? Symbol$1 : Symbol$1 && Symbol$1.withoutSetter || uid;

var wellKnownSymbol = function (name) {
  if (!has(WellKnownSymbolsStore, name)) {
    if (nativeSymbol && has(Symbol$1, name)) WellKnownSymbolsStore[name] = Symbol$1[name];
    else WellKnownSymbolsStore[name] = createWellKnownSymbol('Symbol.' + name);
  } return WellKnownSymbolsStore[name];
};

var SPECIES = wellKnownSymbol('species');

// `ArraySpeciesCreate` abstract operation
// https://tc39.github.io/ecma262/#sec-arrayspeciescreate
var arraySpeciesCreate = function (originalArray, length) {
  var C;
  if (isArray(originalArray)) {
    C = originalArray.constructor;
    // cross-realm fallback
    if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;
    else if (isObject(C)) {
      C = C[SPECIES];
      if (C === null) C = undefined;
    }
  } return new (C === undefined ? Array : C)(length === 0 ? 0 : length);
};

var push = [].push;

// `Array.prototype.{ forEach, map, filter, some, every, find, findIndex }` methods implementation
var createMethod$1 = function (TYPE) {
  var IS_MAP = TYPE == 1;
  var IS_FILTER = TYPE == 2;
  var IS_SOME = TYPE == 3;
  var IS_EVERY = TYPE == 4;
  var IS_FIND_INDEX = TYPE == 6;
  var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
  return function ($this, callbackfn, that, specificCreate) {
    var O = toObject($this);
    var self = indexedObject(O);
    var boundFunction = functionBindContext(callbackfn, that, 3);
    var length = toLength(self.length);
    var index = 0;
    var create = specificCreate || arraySpeciesCreate;
    var target = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined;
    var value, result;
    for (;length > index; index++) if (NO_HOLES || index in self) {
      value = self[index];
      result = boundFunction(value, index, O);
      if (TYPE) {
        if (IS_MAP) target[index] = result; // map
        else if (result) switch (TYPE) {
          case 3: return true;              // some
          case 5: return value;             // find
          case 6: return index;             // findIndex
          case 2: push.call(target, value); // filter
        } else if (IS_EVERY) return false;  // every
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : target;
  };
};

var arrayIteration = {
  // `Array.prototype.forEach` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.foreach
  forEach: createMethod$1(0),
  // `Array.prototype.map` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.map
  map: createMethod$1(1),
  // `Array.prototype.filter` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.filter
  filter: createMethod$1(2),
  // `Array.prototype.some` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.some
  some: createMethod$1(3),
  // `Array.prototype.every` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.every
  every: createMethod$1(4),
  // `Array.prototype.find` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.find
  find: createMethod$1(5),
  // `Array.prototype.findIndex` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
  findIndex: createMethod$1(6)
};

var arrayMethodIsStrict = function (METHOD_NAME, argument) {
  var method = [][METHOD_NAME];
  return !!method && fails(function () {
    // eslint-disable-next-line no-useless-call,no-throw-literal
    method.call(null, argument || function () { throw 1; }, 1);
  });
};

var defineProperty = Object.defineProperty;
var cache = {};

var thrower = function (it) { throw it; };

var arrayMethodUsesToLength = function (METHOD_NAME, options) {
  if (has(cache, METHOD_NAME)) return cache[METHOD_NAME];
  if (!options) options = {};
  var method = [][METHOD_NAME];
  var ACCESSORS = has(options, 'ACCESSORS') ? options.ACCESSORS : false;
  var argument0 = has(options, 0) ? options[0] : thrower;
  var argument1 = has(options, 1) ? options[1] : undefined;

  return cache[METHOD_NAME] = !!method && !fails(function () {
    if (ACCESSORS && !descriptors) return true;
    var O = { length: -1 };

    if (ACCESSORS) defineProperty(O, 1, { enumerable: true, get: thrower });
    else O[1] = 1;

    method.call(O, argument0, argument1);
  });
};

var $forEach = arrayIteration.forEach;



var STRICT_METHOD = arrayMethodIsStrict('forEach');
var USES_TO_LENGTH = arrayMethodUsesToLength('forEach');

// `Array.prototype.forEach` method implementation
// https://tc39.github.io/ecma262/#sec-array.prototype.foreach
var arrayForEach = (!STRICT_METHOD || !USES_TO_LENGTH) ? function forEach(callbackfn /* , thisArg */) {
  return $forEach(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
} : [].forEach;

// `Array.prototype.forEach` method
// https://tc39.github.io/ecma262/#sec-array.prototype.foreach
_export({ target: 'Array', proto: true, forced: [].forEach != arrayForEach }, {
  forEach: arrayForEach
});

var $indexOf = arrayIncludes.indexOf;



var nativeIndexOf = [].indexOf;

var NEGATIVE_ZERO = !!nativeIndexOf && 1 / [1].indexOf(1, -0) < 0;
var STRICT_METHOD$1 = arrayMethodIsStrict('indexOf');
var USES_TO_LENGTH$1 = arrayMethodUsesToLength('indexOf', { ACCESSORS: true, 1: 0 });

// `Array.prototype.indexOf` method
// https://tc39.github.io/ecma262/#sec-array.prototype.indexof
_export({ target: 'Array', proto: true, forced: NEGATIVE_ZERO || !STRICT_METHOD$1 || !USES_TO_LENGTH$1 }, {
  indexOf: function indexOf(searchElement /* , fromIndex = 0 */) {
    return NEGATIVE_ZERO
      // convert -0 to +0
      ? nativeIndexOf.apply(this, arguments) || 0
      : $indexOf(this, searchElement, arguments.length > 1 ? arguments[1] : undefined);
  }
});

var engineUserAgent = getBuiltIn('navigator', 'userAgent') || '';

var process$1 = global_1.process;
var versions = process$1 && process$1.versions;
var v8 = versions && versions.v8;
var match, version;

if (v8) {
  match = v8.split('.');
  version = match[0] + match[1];
} else if (engineUserAgent) {
  match = engineUserAgent.match(/Edge\/(\d+)/);
  if (!match || match[1] >= 74) {
    match = engineUserAgent.match(/Chrome\/(\d+)/);
    if (match) version = match[1];
  }
}

var engineV8Version = version && +version;

var SPECIES$1 = wellKnownSymbol('species');

var arrayMethodHasSpeciesSupport = function (METHOD_NAME) {
  // We can't use this feature detection in V8 since it causes
  // deoptimization and serious performance degradation
  // https://github.com/zloirock/core-js/issues/677
  return engineV8Version >= 51 || !fails(function () {
    var array = [];
    var constructor = array.constructor = {};
    constructor[SPECIES$1] = function () {
      return { foo: 1 };
    };
    return array[METHOD_NAME](Boolean).foo !== 1;
  });
};

var $map = arrayIteration.map;



var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('map');
// FF49- issue
var USES_TO_LENGTH$2 = arrayMethodUsesToLength('map');

// `Array.prototype.map` method
// https://tc39.github.io/ecma262/#sec-array.prototype.map
// with adding support of @@species
_export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT || !USES_TO_LENGTH$2 }, {
  map: function map(callbackfn /* , thisArg */) {
    return $map(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// `Array.prototype.{ reduce, reduceRight }` methods implementation
var createMethod$2 = function (IS_RIGHT) {
  return function (that, callbackfn, argumentsLength, memo) {
    aFunction$1(callbackfn);
    var O = toObject(that);
    var self = indexedObject(O);
    var length = toLength(O.length);
    var index = IS_RIGHT ? length - 1 : 0;
    var i = IS_RIGHT ? -1 : 1;
    if (argumentsLength < 2) while (true) {
      if (index in self) {
        memo = self[index];
        index += i;
        break;
      }
      index += i;
      if (IS_RIGHT ? index < 0 : length <= index) {
        throw TypeError('Reduce of empty array with no initial value');
      }
    }
    for (;IS_RIGHT ? index >= 0 : length > index; index += i) if (index in self) {
      memo = callbackfn(memo, self[index], index, O);
    }
    return memo;
  };
};

var arrayReduce = {
  // `Array.prototype.reduce` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.reduce
  left: createMethod$2(false),
  // `Array.prototype.reduceRight` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.reduceright
  right: createMethod$2(true)
};

var $reduce = arrayReduce.left;



var STRICT_METHOD$2 = arrayMethodIsStrict('reduce');
var USES_TO_LENGTH$3 = arrayMethodUsesToLength('reduce', { 1: 0 });

// `Array.prototype.reduce` method
// https://tc39.github.io/ecma262/#sec-array.prototype.reduce
_export({ target: 'Array', proto: true, forced: !STRICT_METHOD$2 || !USES_TO_LENGTH$3 }, {
  reduce: function reduce(callbackfn /* , initialValue */) {
    return $reduce(this, callbackfn, arguments.length, arguments.length > 1 ? arguments[1] : undefined);
  }
});

var createProperty = function (object, key, value) {
  var propertyKey = toPrimitive(key);
  if (propertyKey in object) objectDefineProperty.f(object, propertyKey, createPropertyDescriptor(0, value));
  else object[propertyKey] = value;
};

var HAS_SPECIES_SUPPORT$1 = arrayMethodHasSpeciesSupport('slice');
var USES_TO_LENGTH$4 = arrayMethodUsesToLength('slice', { ACCESSORS: true, 0: 0, 1: 2 });

var SPECIES$2 = wellKnownSymbol('species');
var nativeSlice = [].slice;
var max$1 = Math.max;

// `Array.prototype.slice` method
// https://tc39.github.io/ecma262/#sec-array.prototype.slice
// fallback for not array-like ES3 strings and DOM objects
_export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT$1 || !USES_TO_LENGTH$4 }, {
  slice: function slice(start, end) {
    var O = toIndexedObject(this);
    var length = toLength(O.length);
    var k = toAbsoluteIndex(start, length);
    var fin = toAbsoluteIndex(end === undefined ? length : end, length);
    // inline `ArraySpeciesCreate` for usage native `Array#slice` where it's possible
    var Constructor, result, n;
    if (isArray(O)) {
      Constructor = O.constructor;
      // cross-realm fallback
      if (typeof Constructor == 'function' && (Constructor === Array || isArray(Constructor.prototype))) {
        Constructor = undefined;
      } else if (isObject(Constructor)) {
        Constructor = Constructor[SPECIES$2];
        if (Constructor === null) Constructor = undefined;
      }
      if (Constructor === Array || Constructor === undefined) {
        return nativeSlice.call(O, k, fin);
      }
    }
    result = new (Constructor === undefined ? Array : Constructor)(max$1(fin - k, 0));
    for (n = 0; k < fin; k++, n++) if (k in O) createProperty(result, n, O[k]);
    result.length = n;
    return result;
  }
});

// iterable DOM collections
// flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
var domIterables = {
  CSSRuleList: 0,
  CSSStyleDeclaration: 0,
  CSSValueList: 0,
  ClientRectList: 0,
  DOMRectList: 0,
  DOMStringList: 0,
  DOMTokenList: 1,
  DataTransferItemList: 0,
  FileList: 0,
  HTMLAllCollection: 0,
  HTMLCollection: 0,
  HTMLFormElement: 0,
  HTMLSelectElement: 0,
  MediaList: 0,
  MimeTypeArray: 0,
  NamedNodeMap: 0,
  NodeList: 1,
  PaintRequestList: 0,
  Plugin: 0,
  PluginArray: 0,
  SVGLengthList: 0,
  SVGNumberList: 0,
  SVGPathSegList: 0,
  SVGPointList: 0,
  SVGStringList: 0,
  SVGTransformList: 0,
  SourceBufferList: 0,
  StyleSheetList: 0,
  TextTrackCueList: 0,
  TextTrackList: 0,
  TouchList: 0
};

for (var COLLECTION_NAME in domIterables) {
  var Collection = global_1[COLLECTION_NAME];
  var CollectionPrototype = Collection && Collection.prototype;
  // some Chrome versions have non-configurable methods on DOMTokenList
  if (CollectionPrototype && CollectionPrototype.forEach !== arrayForEach) try {
    createNonEnumerableProperty(CollectionPrototype, 'forEach', arrayForEach);
  } catch (error) {
    CollectionPrototype.forEach = arrayForEach;
  }
}

var runtime_1 = createCommonjsModule(function (module) {
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined$1; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] =
    GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return PromiseImpl.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return PromiseImpl.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    if (PromiseImpl === void 0) PromiseImpl = Promise;

    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList),
      PromiseImpl
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined$1) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined$1;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined$1;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[toStringTagSymbol] = "Generator";

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined$1;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined$1, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined$1;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined$1;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined$1;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined$1;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined$1;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
   module.exports 
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  Function("r", "regeneratorRuntime = r")(runtime);
}
});

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys$1(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys$1(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys$1(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  }
}

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

var commonjsGlobal$1 = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule$1(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var check$1 = function (it) {
  return it && it.Math == Math && it;
};

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global_1$1 =
  // eslint-disable-next-line no-undef
  check$1(typeof globalThis == 'object' && globalThis) ||
  check$1(typeof window == 'object' && window) ||
  check$1(typeof self == 'object' && self) ||
  check$1(typeof commonjsGlobal$1 == 'object' && commonjsGlobal$1) ||
  // eslint-disable-next-line no-new-func
  Function('return this')();

var fails$1 = function (exec) {
  try {
    return !!exec();
  } catch (error) {
    return true;
  }
};

// Thank's IE8 for his funny defineProperty
var descriptors$1 = !fails$1(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});

var nativePropertyIsEnumerable$1 = {}.propertyIsEnumerable;
var getOwnPropertyDescriptor$2 = Object.getOwnPropertyDescriptor;

// Nashorn ~ JDK8 bug
var NASHORN_BUG$1 = getOwnPropertyDescriptor$2 && !nativePropertyIsEnumerable$1.call({ 1: 2 }, 1);

// `Object.prototype.propertyIsEnumerable` method implementation
// https://tc39.github.io/ecma262/#sec-object.prototype.propertyisenumerable
var f$5 = NASHORN_BUG$1 ? function propertyIsEnumerable(V) {
  var descriptor = getOwnPropertyDescriptor$2(this, V);
  return !!descriptor && descriptor.enumerable;
} : nativePropertyIsEnumerable$1;

var objectPropertyIsEnumerable$1 = {
	f: f$5
};

var createPropertyDescriptor$1 = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

var toString$1 = {}.toString;

var classofRaw$1 = function (it) {
  return toString$1.call(it).slice(8, -1);
};

var split$1 = ''.split;

// fallback for non-array-like ES3 and non-enumerable old V8 strings
var indexedObject$1 = fails$1(function () {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins
  return !Object('z').propertyIsEnumerable(0);
}) ? function (it) {
  return classofRaw$1(it) == 'String' ? split$1.call(it, '') : Object(it);
} : Object;

// `RequireObjectCoercible` abstract operation
// https://tc39.github.io/ecma262/#sec-requireobjectcoercible
var requireObjectCoercible$1 = function (it) {
  if (it == undefined) throw TypeError("Can't call method on " + it);
  return it;
};

// toObject with fallback for non-array-like ES3 strings



var toIndexedObject$1 = function (it) {
  return indexedObject$1(requireObjectCoercible$1(it));
};

var isObject$1 = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

// `ToPrimitive` abstract operation
// https://tc39.github.io/ecma262/#sec-toprimitive
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
var toPrimitive$1 = function (input, PREFERRED_STRING) {
  if (!isObject$1(input)) return input;
  var fn, val;
  if (PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject$1(val = fn.call(input))) return val;
  if (typeof (fn = input.valueOf) == 'function' && !isObject$1(val = fn.call(input))) return val;
  if (!PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject$1(val = fn.call(input))) return val;
  throw TypeError("Can't convert object to primitive value");
};

var hasOwnProperty$1 = {}.hasOwnProperty;

var has$2 = function (it, key) {
  return hasOwnProperty$1.call(it, key);
};

var document$1$1 = global_1$1.document;
// typeof document.createElement is 'object' in old IE
var EXISTS$1 = isObject$1(document$1$1) && isObject$1(document$1$1.createElement);

var documentCreateElement$1 = function (it) {
  return EXISTS$1 ? document$1$1.createElement(it) : {};
};

// Thank's IE8 for his funny defineProperty
var ie8DomDefine$1 = !descriptors$1 && !fails$1(function () {
  return Object.defineProperty(documentCreateElement$1('div'), 'a', {
    get: function () { return 7; }
  }).a != 7;
});

var nativeGetOwnPropertyDescriptor$1 = Object.getOwnPropertyDescriptor;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
var f$1$1 = descriptors$1 ? nativeGetOwnPropertyDescriptor$1 : function getOwnPropertyDescriptor(O, P) {
  O = toIndexedObject$1(O);
  P = toPrimitive$1(P, true);
  if (ie8DomDefine$1) try {
    return nativeGetOwnPropertyDescriptor$1(O, P);
  } catch (error) { /* empty */ }
  if (has$2(O, P)) return createPropertyDescriptor$1(!objectPropertyIsEnumerable$1.f.call(O, P), O[P]);
};

var objectGetOwnPropertyDescriptor$1 = {
	f: f$1$1
};

var anObject$1 = function (it) {
  if (!isObject$1(it)) {
    throw TypeError(String(it) + ' is not an object');
  } return it;
};

var nativeDefineProperty$1 = Object.defineProperty;

// `Object.defineProperty` method
// https://tc39.github.io/ecma262/#sec-object.defineproperty
var f$2$1 = descriptors$1 ? nativeDefineProperty$1 : function defineProperty(O, P, Attributes) {
  anObject$1(O);
  P = toPrimitive$1(P, true);
  anObject$1(Attributes);
  if (ie8DomDefine$1) try {
    return nativeDefineProperty$1(O, P, Attributes);
  } catch (error) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

var objectDefineProperty$1 = {
	f: f$2$1
};

var createNonEnumerableProperty$1 = descriptors$1 ? function (object, key, value) {
  return objectDefineProperty$1.f(object, key, createPropertyDescriptor$1(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

var setGlobal$1 = function (key, value) {
  try {
    createNonEnumerableProperty$1(global_1$1, key, value);
  } catch (error) {
    global_1$1[key] = value;
  } return value;
};

var SHARED$1 = '__core-js_shared__';
var store$2 = global_1$1[SHARED$1] || setGlobal$1(SHARED$1, {});

var sharedStore$1 = store$2;

var shared$1 = createCommonjsModule$1(function (module) {
(module.exports = function (key, value) {
  return sharedStore$1[key] || (sharedStore$1[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: '3.3.6',
  mode:  'global',
  copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
});
});

var functionToString$1 = shared$1('native-function-to-string', Function.toString);

var WeakMap$2 = global_1$1.WeakMap;

var nativeWeakMap$1 = typeof WeakMap$2 === 'function' && /native code/.test(functionToString$1.call(WeakMap$2));

var id$1 = 0;
var postfix$1 = Math.random();

var uid$1 = function (key) {
  return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id$1 + postfix$1).toString(36);
};

var keys$1 = shared$1('keys');

var sharedKey$1 = function (key) {
  return keys$1[key] || (keys$1[key] = uid$1(key));
};

var hiddenKeys$2 = {};

var WeakMap$1$1 = global_1$1.WeakMap;
var set$1, get$1, has$1$1;

var enforce$1 = function (it) {
  return has$1$1(it) ? get$1(it) : set$1(it, {});
};

var getterFor$1 = function (TYPE) {
  return function (it) {
    var state;
    if (!isObject$1(it) || (state = get$1(it)).type !== TYPE) {
      throw TypeError('Incompatible receiver, ' + TYPE + ' required');
    } return state;
  };
};

if (nativeWeakMap$1) {
  var store$1$1 = new WeakMap$1$1();
  var wmget$1 = store$1$1.get;
  var wmhas$1 = store$1$1.has;
  var wmset$1 = store$1$1.set;
  set$1 = function (it, metadata) {
    wmset$1.call(store$1$1, it, metadata);
    return metadata;
  };
  get$1 = function (it) {
    return wmget$1.call(store$1$1, it) || {};
  };
  has$1$1 = function (it) {
    return wmhas$1.call(store$1$1, it);
  };
} else {
  var STATE$1 = sharedKey$1('state');
  hiddenKeys$2[STATE$1] = true;
  set$1 = function (it, metadata) {
    createNonEnumerableProperty$1(it, STATE$1, metadata);
    return metadata;
  };
  get$1 = function (it) {
    return has$2(it, STATE$1) ? it[STATE$1] : {};
  };
  has$1$1 = function (it) {
    return has$2(it, STATE$1);
  };
}

var internalState$1 = {
  set: set$1,
  get: get$1,
  has: has$1$1,
  enforce: enforce$1,
  getterFor: getterFor$1
};

var redefine$1 = createCommonjsModule$1(function (module) {
var getInternalState = internalState$1.get;
var enforceInternalState = internalState$1.enforce;
var TEMPLATE = String(functionToString$1).split('toString');

shared$1('inspectSource', function (it) {
  return functionToString$1.call(it);
});

(module.exports = function (O, key, value, options) {
  var unsafe = options ? !!options.unsafe : false;
  var simple = options ? !!options.enumerable : false;
  var noTargetGet = options ? !!options.noTargetGet : false;
  if (typeof value == 'function') {
    if (typeof key == 'string' && !has$2(value, 'name')) createNonEnumerableProperty$1(value, 'name', key);
    enforceInternalState(value).source = TEMPLATE.join(typeof key == 'string' ? key : '');
  }
  if (O === global_1$1) {
    if (simple) O[key] = value;
    else setGlobal$1(key, value);
    return;
  } else if (!unsafe) {
    delete O[key];
  } else if (!noTargetGet && O[key]) {
    simple = true;
  }
  if (simple) O[key] = value;
  else createNonEnumerableProperty$1(O, key, value);
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, 'toString', function toString() {
  return typeof this == 'function' && getInternalState(this).source || functionToString$1.call(this);
});
});

var path$1 = global_1$1;

var aFunction$2 = function (variable) {
  return typeof variable == 'function' ? variable : undefined;
};

var getBuiltIn$1 = function (namespace, method) {
  return arguments.length < 2 ? aFunction$2(path$1[namespace]) || aFunction$2(global_1$1[namespace])
    : path$1[namespace] && path$1[namespace][method] || global_1$1[namespace] && global_1$1[namespace][method];
};

var ceil$1 = Math.ceil;
var floor$1 = Math.floor;

// `ToInteger` abstract operation
// https://tc39.github.io/ecma262/#sec-tointeger
var toInteger$1 = function (argument) {
  return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor$1 : ceil$1)(argument);
};

var min$2 = Math.min;

// `ToLength` abstract operation
// https://tc39.github.io/ecma262/#sec-tolength
var toLength$1 = function (argument) {
  return argument > 0 ? min$2(toInteger$1(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
};

var max$2 = Math.max;
var min$1$1 = Math.min;

// Helper for a popular repeating case of the spec:
// Let integer be ? ToInteger(index).
// If integer < 0, let result be max((length + integer), 0); else let result be min(length, length).
var toAbsoluteIndex$1 = function (index, length) {
  var integer = toInteger$1(index);
  return integer < 0 ? max$2(integer + length, 0) : min$1$1(integer, length);
};

// `Array.prototype.{ indexOf, includes }` methods implementation
var createMethod$3 = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIndexedObject$1($this);
    var length = toLength$1(O.length);
    var index = toAbsoluteIndex$1(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) {
      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

var arrayIncludes$1 = {
  // `Array.prototype.includes` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.includes
  includes: createMethod$3(true),
  // `Array.prototype.indexOf` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
  indexOf: createMethod$3(false)
};

var indexOf$1 = arrayIncludes$1.indexOf;


var objectKeysInternal$1 = function (object, names) {
  var O = toIndexedObject$1(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) !has$2(hiddenKeys$2, key) && has$2(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has$2(O, key = names[i++])) {
    ~indexOf$1(result, key) || result.push(key);
  }
  return result;
};

// IE8- don't enum bug keys
var enumBugKeys$1 = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];

var hiddenKeys$1$1 = enumBugKeys$1.concat('length', 'prototype');

// `Object.getOwnPropertyNames` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertynames
var f$3$1 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return objectKeysInternal$1(O, hiddenKeys$1$1);
};

var objectGetOwnPropertyNames$1 = {
	f: f$3$1
};

var f$4$1 = Object.getOwnPropertySymbols;

var objectGetOwnPropertySymbols$1 = {
	f: f$4$1
};

// all object keys, includes non-enumerable and symbols
var ownKeys$2 = getBuiltIn$1('Reflect', 'ownKeys') || function ownKeys(it) {
  var keys = objectGetOwnPropertyNames$1.f(anObject$1(it));
  var getOwnPropertySymbols = objectGetOwnPropertySymbols$1.f;
  return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
};

var copyConstructorProperties$1 = function (target, source) {
  var keys = ownKeys$2(source);
  var defineProperty = objectDefineProperty$1.f;
  var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor$1.f;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!has$2(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
  }
};

var replacement$1 = /#|\.prototype\./;

var isForced$1 = function (feature, detection) {
  var value = data$1[normalize$1(feature)];
  return value == POLYFILL$1 ? true
    : value == NATIVE$1 ? false
    : typeof detection == 'function' ? fails$1(detection)
    : !!detection;
};

var normalize$1 = isForced$1.normalize = function (string) {
  return String(string).replace(replacement$1, '.').toLowerCase();
};

var data$1 = isForced$1.data = {};
var NATIVE$1 = isForced$1.NATIVE = 'N';
var POLYFILL$1 = isForced$1.POLYFILL = 'P';

var isForced_1$1 = isForced$1;

var getOwnPropertyDescriptor$1$1 = objectGetOwnPropertyDescriptor$1.f;






/*
  options.target      - name of the target object
  options.global      - target is the global object
  options.stat        - export as static methods of target
  options.proto       - export as prototype methods of target
  options.real        - real prototype method for the `pure` version
  options.forced      - export even if the native feature is available
  options.bind        - bind methods to the target, required for the `pure` version
  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
  options.sham        - add a flag to not completely full polyfills
  options.enumerable  - export as enumerable property
  options.noTargetGet - prevent calling a getter on target
*/
var _export$1 = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var FORCED, target, key, targetProperty, sourceProperty, descriptor;
  if (GLOBAL) {
    target = global_1$1;
  } else if (STATIC) {
    target = global_1$1[TARGET] || setGlobal$1(TARGET, {});
  } else {
    target = (global_1$1[TARGET] || {}).prototype;
  }
  if (target) for (key in source) {
    sourceProperty = source[key];
    if (options.noTargetGet) {
      descriptor = getOwnPropertyDescriptor$1$1(target, key);
      targetProperty = descriptor && descriptor.value;
    } else targetProperty = target[key];
    FORCED = isForced_1$1(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
    // contained in target
    if (!FORCED && targetProperty !== undefined) {
      if (typeof sourceProperty === typeof targetProperty) continue;
      copyConstructorProperties$1(sourceProperty, targetProperty);
    }
    // add a flag to not completely full polyfills
    if (options.sham || (targetProperty && targetProperty.sham)) {
      createNonEnumerableProperty$1(sourceProperty, 'sham', true);
    }
    // extend global
    redefine$1(target, key, sourceProperty, options);
  }
};

// `IsArray` abstract operation
// https://tc39.github.io/ecma262/#sec-isarray
var isArray$1 = Array.isArray || function isArray(arg) {
  return classofRaw$1(arg) == 'Array';
};

var createProperty$1 = function (object, key, value) {
  var propertyKey = toPrimitive$1(key);
  if (propertyKey in object) objectDefineProperty$1.f(object, propertyKey, createPropertyDescriptor$1(0, value));
  else object[propertyKey] = value;
};

var nativeSymbol$1 = !!Object.getOwnPropertySymbols && !fails$1(function () {
  // Chrome 38 Symbol has incorrect toString conversion
  // eslint-disable-next-line no-undef
  return !String(Symbol());
});

var Symbol$1$1 = global_1$1.Symbol;
var store$2$1 = shared$1('wks');

var wellKnownSymbol$1 = function (name) {
  return store$2$1[name] || (store$2$1[name] = nativeSymbol$1 && Symbol$1$1[name]
    || (nativeSymbol$1 ? Symbol$1$1 : uid$1)('Symbol.' + name));
};

var userAgent = getBuiltIn$1('navigator', 'userAgent') || '';

var process$2 = global_1$1.process;
var versions$1 = process$2 && process$2.versions;
var v8$1 = versions$1 && versions$1.v8;
var match$1, version$1;

if (v8$1) {
  match$1 = v8$1.split('.');
  version$1 = match$1[0] + match$1[1];
} else if (userAgent) {
  match$1 = userAgent.match(/Edge\/(\d+)/);
  if (!match$1 || match$1[1] >= 74) {
    match$1 = userAgent.match(/Chrome\/(\d+)/);
    if (match$1) version$1 = match$1[1];
  }
}

var v8Version = version$1 && +version$1;

var SPECIES$3 = wellKnownSymbol$1('species');

var arrayMethodHasSpeciesSupport$1 = function (METHOD_NAME) {
  // We can't use this feature detection in V8 since it causes
  // deoptimization and serious performance degradation
  // https://github.com/zloirock/core-js/issues/677
  return v8Version >= 51 || !fails$1(function () {
    var array = [];
    var constructor = array.constructor = {};
    constructor[SPECIES$3] = function () {
      return { foo: 1 };
    };
    return array[METHOD_NAME](Boolean).foo !== 1;
  });
};

var SPECIES$1$1 = wellKnownSymbol$1('species');
var nativeSlice$1 = [].slice;
var max$1$1 = Math.max;

// `Array.prototype.slice` method
// https://tc39.github.io/ecma262/#sec-array.prototype.slice
// fallback for not array-like ES3 strings and DOM objects
_export$1({ target: 'Array', proto: true, forced: !arrayMethodHasSpeciesSupport$1('slice') }, {
  slice: function slice(start, end) {
    var O = toIndexedObject$1(this);
    var length = toLength$1(O.length);
    var k = toAbsoluteIndex$1(start, length);
    var fin = toAbsoluteIndex$1(end === undefined ? length : end, length);
    // inline `ArraySpeciesCreate` for usage native `Array#slice` where it's possible
    var Constructor, result, n;
    if (isArray$1(O)) {
      Constructor = O.constructor;
      // cross-realm fallback
      if (typeof Constructor == 'function' && (Constructor === Array || isArray$1(Constructor.prototype))) {
        Constructor = undefined;
      } else if (isObject$1(Constructor)) {
        Constructor = Constructor[SPECIES$1$1];
        if (Constructor === null) Constructor = undefined;
      }
      if (Constructor === Array || Constructor === undefined) {
        return nativeSlice$1.call(O, k, fin);
      }
    }
    result = new (Constructor === undefined ? Array : Constructor)(max$1$1(fin - k, 0));
    for (n = 0; k < fin; k++, n++) if (k in O) createProperty$1(result, n, O[k]);
    result.length = n;
    return result;
  }
});

var defineProperty$1 = objectDefineProperty$1.f;

var FunctionPrototype = Function.prototype;
var FunctionPrototypeToString = FunctionPrototype.toString;
var nameRE = /^\s*function ([^ (]*)/;
var NAME = 'name';

// Function instances `.name` property
// https://tc39.github.io/ecma262/#sec-function-instances-name
if (descriptors$1 && !(NAME in FunctionPrototype)) {
  defineProperty$1(FunctionPrototype, NAME, {
    configurable: true,
    get: function () {
      try {
        return FunctionPrototypeToString.call(this).match(nameRE)[1];
      } catch (error) {
        return '';
      }
    }
  });
}

var nativeGetOwnPropertyNames = objectGetOwnPropertyNames$1.f;

var toString$1$1 = {}.toString;

var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function (it) {
  try {
    return nativeGetOwnPropertyNames(it);
  } catch (error) {
    return windowNames.slice();
  }
};

// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
var f$5$1 = function getOwnPropertyNames(it) {
  return windowNames && toString$1$1.call(it) == '[object Window]'
    ? getWindowNames(it)
    : nativeGetOwnPropertyNames(toIndexedObject$1(it));
};

var objectGetOwnPropertyNamesExternal = {
	f: f$5$1
};

var nativeGetOwnPropertyNames$1 = objectGetOwnPropertyNamesExternal.f;

var FAILS_ON_PRIMITIVES = fails$1(function () { return !Object.getOwnPropertyNames(1); });

// `Object.getOwnPropertyNames` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertynames
_export$1({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES }, {
  getOwnPropertyNames: nativeGetOwnPropertyNames$1
});

function _typeof2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

function _typeof(obj) {
  if (typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol") {
    _typeof = function _typeof(obj) {
      return _typeof2(obj);
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : _typeof2(obj);
    };
  }

  return _typeof(obj);
}

// `ToObject` abstract operation
// https://tc39.github.io/ecma262/#sec-toobject
var toObject$1 = function (argument) {
  return Object(requireObjectCoercible$1(argument));
};

// `Object.keys` method
// https://tc39.github.io/ecma262/#sec-object.keys
var objectKeys = Object.keys || function keys(O) {
  return objectKeysInternal$1(O, enumBugKeys$1);
};

// `Object.defineProperties` method
// https://tc39.github.io/ecma262/#sec-object.defineproperties
var objectDefineProperties = descriptors$1 ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject$1(O);
  var keys = objectKeys(Properties);
  var length = keys.length;
  var index = 0;
  var key;
  while (length > index) objectDefineProperty$1.f(O, key = keys[index++], Properties[key]);
  return O;
};

var html = getBuiltIn$1('document', 'documentElement');

var IE_PROTO = sharedKey$1('IE_PROTO');

var PROTOTYPE = 'prototype';
var Empty = function () { /* empty */ };

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = documentCreateElement$1('iframe');
  var length = enumBugKeys$1.length;
  var lt = '<';
  var script = 'script';
  var gt = '>';
  var js = 'java' + script + ':';
  var iframeDocument;
  iframe.style.display = 'none';
  html.appendChild(iframe);
  iframe.src = String(js);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + script + gt + 'document.F=Object' + lt + '/' + script + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while (length--) delete createDict[PROTOTYPE][enumBugKeys$1[length]];
  return createDict();
};

// `Object.create` method
// https://tc39.github.io/ecma262/#sec-object.create
var objectCreate = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    Empty[PROTOTYPE] = anObject$1(O);
    result = new Empty();
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : objectDefineProperties(result, Properties);
};

hiddenKeys$2[IE_PROTO] = true;

var f$6 = wellKnownSymbol$1;

var wrappedWellKnownSymbol = {
	f: f$6
};

var defineProperty$1$1 = objectDefineProperty$1.f;

var defineWellKnownSymbol = function (NAME) {
  var Symbol = path$1.Symbol || (path$1.Symbol = {});
  if (!has$2(Symbol, NAME)) defineProperty$1$1(Symbol, NAME, {
    value: wrappedWellKnownSymbol.f(NAME)
  });
};

var defineProperty$2 = objectDefineProperty$1.f;



var TO_STRING_TAG = wellKnownSymbol$1('toStringTag');

var setToStringTag = function (it, TAG, STATIC) {
  if (it && !has$2(it = STATIC ? it : it.prototype, TO_STRING_TAG)) {
    defineProperty$2(it, TO_STRING_TAG, { configurable: true, value: TAG });
  }
};

var aFunction$1$1 = function (it) {
  if (typeof it != 'function') {
    throw TypeError(String(it) + ' is not a function');
  } return it;
};

// optional / simple context binding
var bindContext = function (fn, that, length) {
  aFunction$1$1(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 0: return function () {
      return fn.call(that);
    };
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

var SPECIES$2$1 = wellKnownSymbol$1('species');

// `ArraySpeciesCreate` abstract operation
// https://tc39.github.io/ecma262/#sec-arrayspeciescreate
var arraySpeciesCreate$1 = function (originalArray, length) {
  var C;
  if (isArray$1(originalArray)) {
    C = originalArray.constructor;
    // cross-realm fallback
    if (typeof C == 'function' && (C === Array || isArray$1(C.prototype))) C = undefined;
    else if (isObject$1(C)) {
      C = C[SPECIES$2$1];
      if (C === null) C = undefined;
    }
  } return new (C === undefined ? Array : C)(length === 0 ? 0 : length);
};

var push$1 = [].push;

// `Array.prototype.{ forEach, map, filter, some, every, find, findIndex }` methods implementation
var createMethod$1$1 = function (TYPE) {
  var IS_MAP = TYPE == 1;
  var IS_FILTER = TYPE == 2;
  var IS_SOME = TYPE == 3;
  var IS_EVERY = TYPE == 4;
  var IS_FIND_INDEX = TYPE == 6;
  var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
  return function ($this, callbackfn, that, specificCreate) {
    var O = toObject$1($this);
    var self = indexedObject$1(O);
    var boundFunction = bindContext(callbackfn, that, 3);
    var length = toLength$1(self.length);
    var index = 0;
    var create = specificCreate || arraySpeciesCreate$1;
    var target = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined;
    var value, result;
    for (;length > index; index++) if (NO_HOLES || index in self) {
      value = self[index];
      result = boundFunction(value, index, O);
      if (TYPE) {
        if (IS_MAP) target[index] = result; // map
        else if (result) switch (TYPE) {
          case 3: return true;              // some
          case 5: return value;             // find
          case 6: return index;             // findIndex
          case 2: push$1.call(target, value); // filter
        } else if (IS_EVERY) return false;  // every
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : target;
  };
};

var arrayIteration$1 = {
  // `Array.prototype.forEach` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.foreach
  forEach: createMethod$1$1(0),
  // `Array.prototype.map` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.map
  map: createMethod$1$1(1),
  // `Array.prototype.filter` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.filter
  filter: createMethod$1$1(2),
  // `Array.prototype.some` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.some
  some: createMethod$1$1(3),
  // `Array.prototype.every` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.every
  every: createMethod$1$1(4),
  // `Array.prototype.find` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.find
  find: createMethod$1$1(5),
  // `Array.prototype.findIndex` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
  findIndex: createMethod$1$1(6)
};

var $forEach$1 = arrayIteration$1.forEach;

var HIDDEN = sharedKey$1('hidden');
var SYMBOL = 'Symbol';
var PROTOTYPE$1 = 'prototype';
var TO_PRIMITIVE = wellKnownSymbol$1('toPrimitive');
var setInternalState = internalState$1.set;
var getInternalState = internalState$1.getterFor(SYMBOL);
var ObjectPrototype = Object[PROTOTYPE$1];
var $Symbol = global_1$1.Symbol;
var JSON$1 = global_1$1.JSON;
var nativeJSONStringify = JSON$1 && JSON$1.stringify;
var nativeGetOwnPropertyDescriptor$1$1 = objectGetOwnPropertyDescriptor$1.f;
var nativeDefineProperty$1$1 = objectDefineProperty$1.f;
var nativeGetOwnPropertyNames$2 = objectGetOwnPropertyNamesExternal.f;
var nativePropertyIsEnumerable$1$1 = objectPropertyIsEnumerable$1.f;
var AllSymbols = shared$1('symbols');
var ObjectPrototypeSymbols = shared$1('op-symbols');
var StringToSymbolRegistry = shared$1('string-to-symbol-registry');
var SymbolToStringRegistry = shared$1('symbol-to-string-registry');
var WellKnownSymbolsStore$1 = shared$1('wks');
var QObject = global_1$1.QObject;
// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
var USE_SETTER = !QObject || !QObject[PROTOTYPE$1] || !QObject[PROTOTYPE$1].findChild;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDescriptor = descriptors$1 && fails$1(function () {
  return objectCreate(nativeDefineProperty$1$1({}, 'a', {
    get: function () { return nativeDefineProperty$1$1(this, 'a', { value: 7 }).a; }
  })).a != 7;
}) ? function (O, P, Attributes) {
  var ObjectPrototypeDescriptor = nativeGetOwnPropertyDescriptor$1$1(ObjectPrototype, P);
  if (ObjectPrototypeDescriptor) delete ObjectPrototype[P];
  nativeDefineProperty$1$1(O, P, Attributes);
  if (ObjectPrototypeDescriptor && O !== ObjectPrototype) {
    nativeDefineProperty$1$1(ObjectPrototype, P, ObjectPrototypeDescriptor);
  }
} : nativeDefineProperty$1$1;

var wrap = function (tag, description) {
  var symbol = AllSymbols[tag] = objectCreate($Symbol[PROTOTYPE$1]);
  setInternalState(symbol, {
    type: SYMBOL,
    tag: tag,
    description: description
  });
  if (!descriptors$1) symbol.description = description;
  return symbol;
};

var isSymbol = nativeSymbol$1 && typeof $Symbol.iterator == 'symbol' ? function (it) {
  return typeof it == 'symbol';
} : function (it) {
  return Object(it) instanceof $Symbol;
};

var $defineProperty = function defineProperty(O, P, Attributes) {
  if (O === ObjectPrototype) $defineProperty(ObjectPrototypeSymbols, P, Attributes);
  anObject$1(O);
  var key = toPrimitive$1(P, true);
  anObject$1(Attributes);
  if (has$2(AllSymbols, key)) {
    if (!Attributes.enumerable) {
      if (!has$2(O, HIDDEN)) nativeDefineProperty$1$1(O, HIDDEN, createPropertyDescriptor$1(1, {}));
      O[HIDDEN][key] = true;
    } else {
      if (has$2(O, HIDDEN) && O[HIDDEN][key]) O[HIDDEN][key] = false;
      Attributes = objectCreate(Attributes, { enumerable: createPropertyDescriptor$1(0, false) });
    } return setSymbolDescriptor(O, key, Attributes);
  } return nativeDefineProperty$1$1(O, key, Attributes);
};

var $defineProperties = function defineProperties(O, Properties) {
  anObject$1(O);
  var properties = toIndexedObject$1(Properties);
  var keys = objectKeys(properties).concat($getOwnPropertySymbols(properties));
  $forEach$1(keys, function (key) {
    if (!descriptors$1 || $propertyIsEnumerable.call(properties, key)) $defineProperty(O, key, properties[key]);
  });
  return O;
};

var $create = function create(O, Properties) {
  return Properties === undefined ? objectCreate(O) : $defineProperties(objectCreate(O), Properties);
};

var $propertyIsEnumerable = function propertyIsEnumerable(V) {
  var P = toPrimitive$1(V, true);
  var enumerable = nativePropertyIsEnumerable$1$1.call(this, P);
  if (this === ObjectPrototype && has$2(AllSymbols, P) && !has$2(ObjectPrototypeSymbols, P)) return false;
  return enumerable || !has$2(this, P) || !has$2(AllSymbols, P) || has$2(this, HIDDEN) && this[HIDDEN][P] ? enumerable : true;
};

var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(O, P) {
  var it = toIndexedObject$1(O);
  var key = toPrimitive$1(P, true);
  if (it === ObjectPrototype && has$2(AllSymbols, key) && !has$2(ObjectPrototypeSymbols, key)) return;
  var descriptor = nativeGetOwnPropertyDescriptor$1$1(it, key);
  if (descriptor && has$2(AllSymbols, key) && !(has$2(it, HIDDEN) && it[HIDDEN][key])) {
    descriptor.enumerable = true;
  }
  return descriptor;
};

var $getOwnPropertyNames = function getOwnPropertyNames(O) {
  var names = nativeGetOwnPropertyNames$2(toIndexedObject$1(O));
  var result = [];
  $forEach$1(names, function (key) {
    if (!has$2(AllSymbols, key) && !has$2(hiddenKeys$2, key)) result.push(key);
  });
  return result;
};

var $getOwnPropertySymbols = function getOwnPropertySymbols(O) {
  var IS_OBJECT_PROTOTYPE = O === ObjectPrototype;
  var names = nativeGetOwnPropertyNames$2(IS_OBJECT_PROTOTYPE ? ObjectPrototypeSymbols : toIndexedObject$1(O));
  var result = [];
  $forEach$1(names, function (key) {
    if (has$2(AllSymbols, key) && (!IS_OBJECT_PROTOTYPE || has$2(ObjectPrototype, key))) {
      result.push(AllSymbols[key]);
    }
  });
  return result;
};

// `Symbol` constructor
// https://tc39.github.io/ecma262/#sec-symbol-constructor
if (!nativeSymbol$1) {
  $Symbol = function Symbol() {
    if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor');
    var description = !arguments.length || arguments[0] === undefined ? undefined : String(arguments[0]);
    var tag = uid$1(description);
    var setter = function (value) {
      if (this === ObjectPrototype) setter.call(ObjectPrototypeSymbols, value);
      if (has$2(this, HIDDEN) && has$2(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
      setSymbolDescriptor(this, tag, createPropertyDescriptor$1(1, value));
    };
    if (descriptors$1 && USE_SETTER) setSymbolDescriptor(ObjectPrototype, tag, { configurable: true, set: setter });
    return wrap(tag, description);
  };

  redefine$1($Symbol[PROTOTYPE$1], 'toString', function toString() {
    return getInternalState(this).tag;
  });

  objectPropertyIsEnumerable$1.f = $propertyIsEnumerable;
  objectDefineProperty$1.f = $defineProperty;
  objectGetOwnPropertyDescriptor$1.f = $getOwnPropertyDescriptor;
  objectGetOwnPropertyNames$1.f = objectGetOwnPropertyNamesExternal.f = $getOwnPropertyNames;
  objectGetOwnPropertySymbols$1.f = $getOwnPropertySymbols;

  if (descriptors$1) {
    // https://github.com/tc39/proposal-Symbol-description
    nativeDefineProperty$1$1($Symbol[PROTOTYPE$1], 'description', {
      configurable: true,
      get: function description() {
        return getInternalState(this).description;
      }
    });
    {
      redefine$1(ObjectPrototype, 'propertyIsEnumerable', $propertyIsEnumerable, { unsafe: true });
    }
  }

  wrappedWellKnownSymbol.f = function (name) {
    return wrap(wellKnownSymbol$1(name), name);
  };
}

_export$1({ global: true, wrap: true, forced: !nativeSymbol$1, sham: !nativeSymbol$1 }, {
  Symbol: $Symbol
});

$forEach$1(objectKeys(WellKnownSymbolsStore$1), function (name) {
  defineWellKnownSymbol(name);
});

_export$1({ target: SYMBOL, stat: true, forced: !nativeSymbol$1 }, {
  // `Symbol.for` method
  // https://tc39.github.io/ecma262/#sec-symbol.for
  'for': function (key) {
    var string = String(key);
    if (has$2(StringToSymbolRegistry, string)) return StringToSymbolRegistry[string];
    var symbol = $Symbol(string);
    StringToSymbolRegistry[string] = symbol;
    SymbolToStringRegistry[symbol] = string;
    return symbol;
  },
  // `Symbol.keyFor` method
  // https://tc39.github.io/ecma262/#sec-symbol.keyfor
  keyFor: function keyFor(sym) {
    if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol');
    if (has$2(SymbolToStringRegistry, sym)) return SymbolToStringRegistry[sym];
  },
  useSetter: function () { USE_SETTER = true; },
  useSimple: function () { USE_SETTER = false; }
});

_export$1({ target: 'Object', stat: true, forced: !nativeSymbol$1, sham: !descriptors$1 }, {
  // `Object.create` method
  // https://tc39.github.io/ecma262/#sec-object.create
  create: $create,
  // `Object.defineProperty` method
  // https://tc39.github.io/ecma262/#sec-object.defineproperty
  defineProperty: $defineProperty,
  // `Object.defineProperties` method
  // https://tc39.github.io/ecma262/#sec-object.defineproperties
  defineProperties: $defineProperties,
  // `Object.getOwnPropertyDescriptor` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptors
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor
});

_export$1({ target: 'Object', stat: true, forced: !nativeSymbol$1 }, {
  // `Object.getOwnPropertyNames` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertynames
  getOwnPropertyNames: $getOwnPropertyNames,
  // `Object.getOwnPropertySymbols` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertysymbols
  getOwnPropertySymbols: $getOwnPropertySymbols
});

// Chrome 38 and 39 `Object.getOwnPropertySymbols` fails on primitives
// https://bugs.chromium.org/p/v8/issues/detail?id=3443
_export$1({ target: 'Object', stat: true, forced: fails$1(function () { objectGetOwnPropertySymbols$1.f(1); }) }, {
  getOwnPropertySymbols: function getOwnPropertySymbols(it) {
    return objectGetOwnPropertySymbols$1.f(toObject$1(it));
  }
});

// `JSON.stringify` method behavior with symbols
// https://tc39.github.io/ecma262/#sec-json.stringify
JSON$1 && _export$1({ target: 'JSON', stat: true, forced: !nativeSymbol$1 || fails$1(function () {
  var symbol = $Symbol();
  // MS Edge converts symbol values to JSON as {}
  return nativeJSONStringify([symbol]) != '[null]'
    // WebKit converts symbol values to JSON as null
    || nativeJSONStringify({ a: symbol }) != '{}'
    // V8 throws on boxed symbols
    || nativeJSONStringify(Object(symbol)) != '{}';
}) }, {
  stringify: function stringify(it) {
    var args = [it];
    var index = 1;
    var replacer, $replacer;
    while (arguments.length > index) args.push(arguments[index++]);
    $replacer = replacer = args[1];
    if (!isObject$1(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
    if (!isArray$1(replacer)) replacer = function (key, value) {
      if (typeof $replacer == 'function') value = $replacer.call(this, key, value);
      if (!isSymbol(value)) return value;
    };
    args[1] = replacer;
    return nativeJSONStringify.apply(JSON$1, args);
  }
});

// `Symbol.prototype[@@toPrimitive]` method
// https://tc39.github.io/ecma262/#sec-symbol.prototype-@@toprimitive
if (!$Symbol[PROTOTYPE$1][TO_PRIMITIVE]) {
  createNonEnumerableProperty$1($Symbol[PROTOTYPE$1], TO_PRIMITIVE, $Symbol[PROTOTYPE$1].valueOf);
}
// `Symbol.prototype[@@toStringTag]` property
// https://tc39.github.io/ecma262/#sec-symbol.prototype-@@tostringtag
setToStringTag($Symbol, SYMBOL);

hiddenKeys$2[HIDDEN] = true;

var defineProperty$3 = objectDefineProperty$1.f;


var NativeSymbol = global_1$1.Symbol;

if (descriptors$1 && typeof NativeSymbol == 'function' && (!('description' in NativeSymbol.prototype) ||
  // Safari 12 bug
  NativeSymbol().description !== undefined
)) {
  var EmptyStringDescriptionStore = {};
  // wrap Symbol constructor for correct work with undefined description
  var SymbolWrapper = function Symbol() {
    var description = arguments.length < 1 || arguments[0] === undefined ? undefined : String(arguments[0]);
    var result = this instanceof SymbolWrapper
      ? new NativeSymbol(description)
      // in Edge 13, String(Symbol(undefined)) === 'Symbol(undefined)'
      : description === undefined ? NativeSymbol() : NativeSymbol(description);
    if (description === '') EmptyStringDescriptionStore[result] = true;
    return result;
  };
  copyConstructorProperties$1(SymbolWrapper, NativeSymbol);
  var symbolPrototype = SymbolWrapper.prototype = NativeSymbol.prototype;
  symbolPrototype.constructor = SymbolWrapper;

  var symbolToString = symbolPrototype.toString;
  var native = String(NativeSymbol('test')) == 'Symbol(test)';
  var regexp = /^Symbol\((.*)\)[^)]+$/;
  defineProperty$3(symbolPrototype, 'description', {
    configurable: true,
    get: function description() {
      var symbol = isObject$1(this) ? this.valueOf() : this;
      var string = symbolToString.call(symbol);
      if (has$2(EmptyStringDescriptionStore, symbol)) return '';
      var desc = native ? string.slice(7, -1) : string.replace(regexp, '$1');
      return desc === '' ? undefined : desc;
    }
  });

  _export$1({ global: true, forced: true }, {
    Symbol: SymbolWrapper
  });
}

// `Symbol.iterator` well-known symbol
// https://tc39.github.io/ecma262/#sec-symbol.iterator
defineWellKnownSymbol('iterator');

var UNSCOPABLES = wellKnownSymbol$1('unscopables');
var ArrayPrototype = Array.prototype;

// Array.prototype[@@unscopables]
// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
if (ArrayPrototype[UNSCOPABLES] == undefined) {
  createNonEnumerableProperty$1(ArrayPrototype, UNSCOPABLES, objectCreate(null));
}

// add a key to Array.prototype[@@unscopables]
var addToUnscopables = function (key) {
  ArrayPrototype[UNSCOPABLES][key] = true;
};

var iterators = {};

var correctPrototypeGetter = !fails$1(function () {
  function F() { /* empty */ }
  F.prototype.constructor = null;
  return Object.getPrototypeOf(new F()) !== F.prototype;
});

var IE_PROTO$1 = sharedKey$1('IE_PROTO');
var ObjectPrototype$1 = Object.prototype;

// `Object.getPrototypeOf` method
// https://tc39.github.io/ecma262/#sec-object.getprototypeof
var objectGetPrototypeOf = correctPrototypeGetter ? Object.getPrototypeOf : function (O) {
  O = toObject$1(O);
  if (has$2(O, IE_PROTO$1)) return O[IE_PROTO$1];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectPrototype$1 : null;
};

var ITERATOR = wellKnownSymbol$1('iterator');
var BUGGY_SAFARI_ITERATORS = false;

var returnThis = function () { return this; };

// `%IteratorPrototype%` object
// https://tc39.github.io/ecma262/#sec-%iteratorprototype%-object
var IteratorPrototype, PrototypeOfArrayIteratorPrototype, arrayIterator;

if ([].keys) {
  arrayIterator = [].keys();
  // Safari 8 has buggy iterators w/o `next`
  if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true;
  else {
    PrototypeOfArrayIteratorPrototype = objectGetPrototypeOf(objectGetPrototypeOf(arrayIterator));
    if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype = PrototypeOfArrayIteratorPrototype;
  }
}

if (IteratorPrototype == undefined) IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
if ( !has$2(IteratorPrototype, ITERATOR)) {
  createNonEnumerableProperty$1(IteratorPrototype, ITERATOR, returnThis);
}

var iteratorsCore = {
  IteratorPrototype: IteratorPrototype,
  BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS
};

var IteratorPrototype$1 = iteratorsCore.IteratorPrototype;





var returnThis$1 = function () { return this; };

var createIteratorConstructor = function (IteratorConstructor, NAME, next) {
  var TO_STRING_TAG = NAME + ' Iterator';
  IteratorConstructor.prototype = objectCreate(IteratorPrototype$1, { next: createPropertyDescriptor$1(1, next) });
  setToStringTag(IteratorConstructor, TO_STRING_TAG, false);
  iterators[TO_STRING_TAG] = returnThis$1;
  return IteratorConstructor;
};

var aPossiblePrototype = function (it) {
  if (!isObject$1(it) && it !== null) {
    throw TypeError("Can't set " + String(it) + ' as a prototype');
  } return it;
};

// `Object.setPrototypeOf` method
// https://tc39.github.io/ecma262/#sec-object.setprototypeof
// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var objectSetPrototypeOf = Object.setPrototypeOf || ('__proto__' in {} ? function () {
  var CORRECT_SETTER = false;
  var test = {};
  var setter;
  try {
    setter = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set;
    setter.call(test, []);
    CORRECT_SETTER = test instanceof Array;
  } catch (error) { /* empty */ }
  return function setPrototypeOf(O, proto) {
    anObject$1(O);
    aPossiblePrototype(proto);
    if (CORRECT_SETTER) setter.call(O, proto);
    else O.__proto__ = proto;
    return O;
  };
}() : undefined);

var IteratorPrototype$2 = iteratorsCore.IteratorPrototype;
var BUGGY_SAFARI_ITERATORS$1 = iteratorsCore.BUGGY_SAFARI_ITERATORS;
var ITERATOR$1 = wellKnownSymbol$1('iterator');
var KEYS = 'keys';
var VALUES = 'values';
var ENTRIES = 'entries';

var returnThis$2 = function () { return this; };

var defineIterator = function (Iterable, NAME, IteratorConstructor, next, DEFAULT, IS_SET, FORCED) {
  createIteratorConstructor(IteratorConstructor, NAME, next);

  var getIterationMethod = function (KIND) {
    if (KIND === DEFAULT && defaultIterator) return defaultIterator;
    if (!BUGGY_SAFARI_ITERATORS$1 && KIND in IterablePrototype) return IterablePrototype[KIND];
    switch (KIND) {
      case KEYS: return function keys() { return new IteratorConstructor(this, KIND); };
      case VALUES: return function values() { return new IteratorConstructor(this, KIND); };
      case ENTRIES: return function entries() { return new IteratorConstructor(this, KIND); };
    } return function () { return new IteratorConstructor(this); };
  };

  var TO_STRING_TAG = NAME + ' Iterator';
  var INCORRECT_VALUES_NAME = false;
  var IterablePrototype = Iterable.prototype;
  var nativeIterator = IterablePrototype[ITERATOR$1]
    || IterablePrototype['@@iterator']
    || DEFAULT && IterablePrototype[DEFAULT];
  var defaultIterator = !BUGGY_SAFARI_ITERATORS$1 && nativeIterator || getIterationMethod(DEFAULT);
  var anyNativeIterator = NAME == 'Array' ? IterablePrototype.entries || nativeIterator : nativeIterator;
  var CurrentIteratorPrototype, methods, KEY;

  // fix native
  if (anyNativeIterator) {
    CurrentIteratorPrototype = objectGetPrototypeOf(anyNativeIterator.call(new Iterable()));
    if (IteratorPrototype$2 !== Object.prototype && CurrentIteratorPrototype.next) {
      if ( objectGetPrototypeOf(CurrentIteratorPrototype) !== IteratorPrototype$2) {
        if (objectSetPrototypeOf) {
          objectSetPrototypeOf(CurrentIteratorPrototype, IteratorPrototype$2);
        } else if (typeof CurrentIteratorPrototype[ITERATOR$1] != 'function') {
          createNonEnumerableProperty$1(CurrentIteratorPrototype, ITERATOR$1, returnThis$2);
        }
      }
      // Set @@toStringTag to native iterators
      setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true);
    }
  }

  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEFAULT == VALUES && nativeIterator && nativeIterator.name !== VALUES) {
    INCORRECT_VALUES_NAME = true;
    defaultIterator = function values() { return nativeIterator.call(this); };
  }

  // define iterator
  if ( IterablePrototype[ITERATOR$1] !== defaultIterator) {
    createNonEnumerableProperty$1(IterablePrototype, ITERATOR$1, defaultIterator);
  }
  iterators[NAME] = defaultIterator;

  // export additional methods
  if (DEFAULT) {
    methods = {
      values: getIterationMethod(VALUES),
      keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
      entries: getIterationMethod(ENTRIES)
    };
    if (FORCED) for (KEY in methods) {
      if (BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME || !(KEY in IterablePrototype)) {
        redefine$1(IterablePrototype, KEY, methods[KEY]);
      }
    } else _export$1({ target: NAME, proto: true, forced: BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME }, methods);
  }

  return methods;
};

var ARRAY_ITERATOR = 'Array Iterator';
var setInternalState$1 = internalState$1.set;
var getInternalState$1 = internalState$1.getterFor(ARRAY_ITERATOR);

// `Array.prototype.entries` method
// https://tc39.github.io/ecma262/#sec-array.prototype.entries
// `Array.prototype.keys` method
// https://tc39.github.io/ecma262/#sec-array.prototype.keys
// `Array.prototype.values` method
// https://tc39.github.io/ecma262/#sec-array.prototype.values
// `Array.prototype[@@iterator]` method
// https://tc39.github.io/ecma262/#sec-array.prototype-@@iterator
// `CreateArrayIterator` internal method
// https://tc39.github.io/ecma262/#sec-createarrayiterator
var es_array_iterator = defineIterator(Array, 'Array', function (iterated, kind) {
  setInternalState$1(this, {
    type: ARRAY_ITERATOR,
    target: toIndexedObject$1(iterated), // target
    index: 0,                          // next index
    kind: kind                         // kind
  });
// `%ArrayIteratorPrototype%.next` method
// https://tc39.github.io/ecma262/#sec-%arrayiteratorprototype%.next
}, function () {
  var state = getInternalState$1(this);
  var target = state.target;
  var kind = state.kind;
  var index = state.index++;
  if (!target || index >= target.length) {
    state.target = undefined;
    return { value: undefined, done: true };
  }
  if (kind == 'keys') return { value: index, done: false };
  if (kind == 'values') return { value: target[index], done: false };
  return { value: [index, target[index]], done: false };
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values%
// https://tc39.github.io/ecma262/#sec-createunmappedargumentsobject
// https://tc39.github.io/ecma262/#sec-createmappedargumentsobject
iterators.Arguments = iterators.Array;

// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

var nativeAssign = Object.assign;

// `Object.assign` method
// https://tc39.github.io/ecma262/#sec-object.assign
// should work with symbols and should have deterministic property order (V8 bug)
var objectAssign = !nativeAssign || fails$1(function () {
  var A = {};
  var B = {};
  // eslint-disable-next-line no-undef
  var symbol = Symbol();
  var alphabet = 'abcdefghijklmnopqrst';
  A[symbol] = 7;
  alphabet.split('').forEach(function (chr) { B[chr] = chr; });
  return nativeAssign({}, A)[symbol] != 7 || objectKeys(nativeAssign({}, B)).join('') != alphabet;
}) ? function assign(target, source) { // eslint-disable-line no-unused-vars
  var T = toObject$1(target);
  var argumentsLength = arguments.length;
  var index = 1;
  var getOwnPropertySymbols = objectGetOwnPropertySymbols$1.f;
  var propertyIsEnumerable = objectPropertyIsEnumerable$1.f;
  while (argumentsLength > index) {
    var S = indexedObject$1(arguments[index++]);
    var keys = getOwnPropertySymbols ? objectKeys(S).concat(getOwnPropertySymbols(S)) : objectKeys(S);
    var length = keys.length;
    var j = 0;
    var key;
    while (length > j) {
      key = keys[j++];
      if (!descriptors$1 || propertyIsEnumerable.call(S, key)) T[key] = S[key];
    }
  } return T;
} : nativeAssign;

// `Object.assign` method
// https://tc39.github.io/ecma262/#sec-object.assign
_export$1({ target: 'Object', stat: true, forced: Object.assign !== objectAssign }, {
  assign: objectAssign
});

var TO_STRING_TAG$1 = wellKnownSymbol$1('toStringTag');
// ES3 wrong here
var CORRECT_ARGUMENTS = classofRaw$1(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (error) { /* empty */ }
};

// getting tag from ES6+ `Object.prototype.toString`
var classof = function (it) {
  var O, tag, result;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (tag = tryGet(O = Object(it), TO_STRING_TAG$1)) == 'string' ? tag
    // builtinTag case
    : CORRECT_ARGUMENTS ? classofRaw$1(O)
    // ES3 arguments fallback
    : (result = classofRaw$1(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : result;
};

var TO_STRING_TAG$2 = wellKnownSymbol$1('toStringTag');
var test = {};

test[TO_STRING_TAG$2] = 'z';

// `Object.prototype.toString` method implementation
// https://tc39.github.io/ecma262/#sec-object.prototype.tostring
var objectToString = String(test) !== '[object z]' ? function toString() {
  return '[object ' + classof(this) + ']';
} : test.toString;

var ObjectPrototype$2 = Object.prototype;

// `Object.prototype.toString` method
// https://tc39.github.io/ecma262/#sec-object.prototype.tostring
if (objectToString !== ObjectPrototype$2.toString) {
  redefine$1(ObjectPrototype$2, 'toString', objectToString, { unsafe: true });
}

var freezing = !fails$1(function () {
  return Object.isExtensible(Object.preventExtensions({}));
});

var internalMetadata = createCommonjsModule$1(function (module) {
var defineProperty = objectDefineProperty$1.f;



var METADATA = uid$1('meta');
var id = 0;

var isExtensible = Object.isExtensible || function () {
  return true;
};

var setMetadata = function (it) {
  defineProperty(it, METADATA, { value: {
    objectID: 'O' + ++id, // object ID
    weakData: {}          // weak collections IDs
  } });
};

var fastKey = function (it, create) {
  // return a primitive with prefix
  if (!isObject$1(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if (!has$2(it, METADATA)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return 'F';
    // not necessary to add metadata
    if (!create) return 'E';
    // add missing metadata
    setMetadata(it);
  // return object ID
  } return it[METADATA].objectID;
};

var getWeakData = function (it, create) {
  if (!has$2(it, METADATA)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return true;
    // not necessary to add metadata
    if (!create) return false;
    // add missing metadata
    setMetadata(it);
  // return the store of weak collections IDs
  } return it[METADATA].weakData;
};

// add metadata on freeze-family methods calling
var onFreeze = function (it) {
  if (freezing && meta.REQUIRED && isExtensible(it) && !has$2(it, METADATA)) setMetadata(it);
  return it;
};

var meta = module.exports = {
  REQUIRED: false,
  fastKey: fastKey,
  getWeakData: getWeakData,
  onFreeze: onFreeze
};

hiddenKeys$2[METADATA] = true;
});

var ITERATOR$2 = wellKnownSymbol$1('iterator');
var ArrayPrototype$1 = Array.prototype;

// check on default Array iterator
var isArrayIteratorMethod = function (it) {
  return it !== undefined && (iterators.Array === it || ArrayPrototype$1[ITERATOR$2] === it);
};

var ITERATOR$3 = wellKnownSymbol$1('iterator');

var getIteratorMethod = function (it) {
  if (it != undefined) return it[ITERATOR$3]
    || it['@@iterator']
    || iterators[classof(it)];
};

// call something on iterator step with safe closing on error
var callWithSafeIterationClosing = function (iterator, fn, value, ENTRIES) {
  try {
    return ENTRIES ? fn(anObject$1(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch (error) {
    var returnMethod = iterator['return'];
    if (returnMethod !== undefined) anObject$1(returnMethod.call(iterator));
    throw error;
  }
};

var iterate_1 = createCommonjsModule$1(function (module) {
var Result = function (stopped, result) {
  this.stopped = stopped;
  this.result = result;
};

var iterate = module.exports = function (iterable, fn, that, AS_ENTRIES, IS_ITERATOR) {
  var boundFunction = bindContext(fn, that, AS_ENTRIES ? 2 : 1);
  var iterator, iterFn, index, length, result, next, step;

  if (IS_ITERATOR) {
    iterator = iterable;
  } else {
    iterFn = getIteratorMethod(iterable);
    if (typeof iterFn != 'function') throw TypeError('Target is not iterable');
    // optimisation for array iterators
    if (isArrayIteratorMethod(iterFn)) {
      for (index = 0, length = toLength$1(iterable.length); length > index; index++) {
        result = AS_ENTRIES
          ? boundFunction(anObject$1(step = iterable[index])[0], step[1])
          : boundFunction(iterable[index]);
        if (result && result instanceof Result) return result;
      } return new Result(false);
    }
    iterator = iterFn.call(iterable);
  }

  next = iterator.next;
  while (!(step = next.call(iterator)).done) {
    result = callWithSafeIterationClosing(iterator, boundFunction, step.value, AS_ENTRIES);
    if (typeof result == 'object' && result && result instanceof Result) return result;
  } return new Result(false);
};

iterate.stop = function (result) {
  return new Result(true, result);
};
});

var anInstance = function (it, Constructor, name) {
  if (!(it instanceof Constructor)) {
    throw TypeError('Incorrect ' + (name ? name + ' ' : '') + 'invocation');
  } return it;
};

var ITERATOR$4 = wellKnownSymbol$1('iterator');
var SAFE_CLOSING = false;

try {
  var called = 0;
  var iteratorWithReturn = {
    next: function () {
      return { done: !!called++ };
    },
    'return': function () {
      SAFE_CLOSING = true;
    }
  };
  iteratorWithReturn[ITERATOR$4] = function () {
    return this;
  };
  // eslint-disable-next-line no-throw-literal
  Array.from(iteratorWithReturn, function () { throw 2; });
} catch (error) { /* empty */ }

var checkCorrectnessOfIteration = function (exec, SKIP_CLOSING) {
  if (!SKIP_CLOSING && !SAFE_CLOSING) return false;
  var ITERATION_SUPPORT = false;
  try {
    var object = {};
    object[ITERATOR$4] = function () {
      return {
        next: function () {
          return { done: ITERATION_SUPPORT = true };
        }
      };
    };
    exec(object);
  } catch (error) { /* empty */ }
  return ITERATION_SUPPORT;
};

// makes subclassing work correct for wrapped built-ins
var inheritIfRequired = function ($this, dummy, Wrapper) {
  var NewTarget, NewTargetPrototype;
  if (
    // it can work only with native `setPrototypeOf`
    objectSetPrototypeOf &&
    // we haven't completely correct pre-ES6 way for getting `new.target`, so use this
    typeof (NewTarget = dummy.constructor) == 'function' &&
    NewTarget !== Wrapper &&
    isObject$1(NewTargetPrototype = NewTarget.prototype) &&
    NewTargetPrototype !== Wrapper.prototype
  ) objectSetPrototypeOf($this, NewTargetPrototype);
  return $this;
};

var collection = function (CONSTRUCTOR_NAME, wrapper, common, IS_MAP, IS_WEAK) {
  var NativeConstructor = global_1$1[CONSTRUCTOR_NAME];
  var NativePrototype = NativeConstructor && NativeConstructor.prototype;
  var Constructor = NativeConstructor;
  var ADDER = IS_MAP ? 'set' : 'add';
  var exported = {};

  var fixMethod = function (KEY) {
    var nativeMethod = NativePrototype[KEY];
    redefine$1(NativePrototype, KEY,
      KEY == 'add' ? function add(value) {
        nativeMethod.call(this, value === 0 ? 0 : value);
        return this;
      } : KEY == 'delete' ? function (key) {
        return IS_WEAK && !isObject$1(key) ? false : nativeMethod.call(this, key === 0 ? 0 : key);
      } : KEY == 'get' ? function get(key) {
        return IS_WEAK && !isObject$1(key) ? undefined : nativeMethod.call(this, key === 0 ? 0 : key);
      } : KEY == 'has' ? function has(key) {
        return IS_WEAK && !isObject$1(key) ? false : nativeMethod.call(this, key === 0 ? 0 : key);
      } : function set(key, value) {
        nativeMethod.call(this, key === 0 ? 0 : key, value);
        return this;
      }
    );
  };

  // eslint-disable-next-line max-len
  if (isForced_1$1(CONSTRUCTOR_NAME, typeof NativeConstructor != 'function' || !(IS_WEAK || NativePrototype.forEach && !fails$1(function () {
    new NativeConstructor().entries().next();
  })))) {
    // create collection constructor
    Constructor = common.getConstructor(wrapper, CONSTRUCTOR_NAME, IS_MAP, ADDER);
    internalMetadata.REQUIRED = true;
  } else if (isForced_1$1(CONSTRUCTOR_NAME, true)) {
    var instance = new Constructor();
    // early implementations not supports chaining
    var HASNT_CHAINING = instance[ADDER](IS_WEAK ? {} : -0, 1) != instance;
    // V8 ~ Chromium 40- weak-collections throws on primitives, but should return false
    var THROWS_ON_PRIMITIVES = fails$1(function () { instance.has(1); });
    // most early implementations doesn't supports iterables, most modern - not close it correctly
    // eslint-disable-next-line no-new
    var ACCEPT_ITERABLES = checkCorrectnessOfIteration(function (iterable) { new NativeConstructor(iterable); });
    // for early implementations -0 and +0 not the same
    var BUGGY_ZERO = !IS_WEAK && fails$1(function () {
      // V8 ~ Chromium 42- fails only with 5+ elements
      var $instance = new NativeConstructor();
      var index = 5;
      while (index--) $instance[ADDER](index, index);
      return !$instance.has(-0);
    });

    if (!ACCEPT_ITERABLES) {
      Constructor = wrapper(function (dummy, iterable) {
        anInstance(dummy, Constructor, CONSTRUCTOR_NAME);
        var that = inheritIfRequired(new NativeConstructor(), dummy, Constructor);
        if (iterable != undefined) iterate_1(iterable, that[ADDER], that, IS_MAP);
        return that;
      });
      Constructor.prototype = NativePrototype;
      NativePrototype.constructor = Constructor;
    }

    if (THROWS_ON_PRIMITIVES || BUGGY_ZERO) {
      fixMethod('delete');
      fixMethod('has');
      IS_MAP && fixMethod('get');
    }

    if (BUGGY_ZERO || HASNT_CHAINING) fixMethod(ADDER);

    // weak collections should not contains .clear method
    if (IS_WEAK && NativePrototype.clear) delete NativePrototype.clear;
  }

  exported[CONSTRUCTOR_NAME] = Constructor;
  _export$1({ global: true, forced: Constructor != NativeConstructor }, exported);

  setToStringTag(Constructor, CONSTRUCTOR_NAME);

  if (!IS_WEAK) common.setStrong(Constructor, CONSTRUCTOR_NAME, IS_MAP);

  return Constructor;
};

var redefineAll = function (target, src, options) {
  for (var key in src) redefine$1(target, key, src[key], options);
  return target;
};

var SPECIES$3$1 = wellKnownSymbol$1('species');

var setSpecies = function (CONSTRUCTOR_NAME) {
  var Constructor = getBuiltIn$1(CONSTRUCTOR_NAME);
  var defineProperty = objectDefineProperty$1.f;

  if (descriptors$1 && Constructor && !Constructor[SPECIES$3$1]) {
    defineProperty(Constructor, SPECIES$3$1, {
      configurable: true,
      get: function () { return this; }
    });
  }
};

var defineProperty$4 = objectDefineProperty$1.f;








var fastKey = internalMetadata.fastKey;


var setInternalState$2 = internalState$1.set;
var internalStateGetterFor = internalState$1.getterFor;

var collectionStrong = {
  getConstructor: function (wrapper, CONSTRUCTOR_NAME, IS_MAP, ADDER) {
    var C = wrapper(function (that, iterable) {
      anInstance(that, C, CONSTRUCTOR_NAME);
      setInternalState$2(that, {
        type: CONSTRUCTOR_NAME,
        index: objectCreate(null),
        first: undefined,
        last: undefined,
        size: 0
      });
      if (!descriptors$1) that.size = 0;
      if (iterable != undefined) iterate_1(iterable, that[ADDER], that, IS_MAP);
    });

    var getInternalState = internalStateGetterFor(CONSTRUCTOR_NAME);

    var define = function (that, key, value) {
      var state = getInternalState(that);
      var entry = getEntry(that, key);
      var previous, index;
      // change existing entry
      if (entry) {
        entry.value = value;
      // create new entry
      } else {
        state.last = entry = {
          index: index = fastKey(key, true),
          key: key,
          value: value,
          previous: previous = state.last,
          next: undefined,
          removed: false
        };
        if (!state.first) state.first = entry;
        if (previous) previous.next = entry;
        if (descriptors$1) state.size++;
        else that.size++;
        // add to index
        if (index !== 'F') state.index[index] = entry;
      } return that;
    };

    var getEntry = function (that, key) {
      var state = getInternalState(that);
      // fast case
      var index = fastKey(key);
      var entry;
      if (index !== 'F') return state.index[index];
      // frozen object case
      for (entry = state.first; entry; entry = entry.next) {
        if (entry.key == key) return entry;
      }
    };

    redefineAll(C.prototype, {
      // 23.1.3.1 Map.prototype.clear()
      // 23.2.3.2 Set.prototype.clear()
      clear: function clear() {
        var that = this;
        var state = getInternalState(that);
        var data = state.index;
        var entry = state.first;
        while (entry) {
          entry.removed = true;
          if (entry.previous) entry.previous = entry.previous.next = undefined;
          delete data[entry.index];
          entry = entry.next;
        }
        state.first = state.last = undefined;
        if (descriptors$1) state.size = 0;
        else that.size = 0;
      },
      // 23.1.3.3 Map.prototype.delete(key)
      // 23.2.3.4 Set.prototype.delete(value)
      'delete': function (key) {
        var that = this;
        var state = getInternalState(that);
        var entry = getEntry(that, key);
        if (entry) {
          var next = entry.next;
          var prev = entry.previous;
          delete state.index[entry.index];
          entry.removed = true;
          if (prev) prev.next = next;
          if (next) next.previous = prev;
          if (state.first == entry) state.first = next;
          if (state.last == entry) state.last = prev;
          if (descriptors$1) state.size--;
          else that.size--;
        } return !!entry;
      },
      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
      forEach: function forEach(callbackfn /* , that = undefined */) {
        var state = getInternalState(this);
        var boundFunction = bindContext(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3);
        var entry;
        while (entry = entry ? entry.next : state.first) {
          boundFunction(entry.value, entry.key, this);
          // revert to the last existing entry
          while (entry && entry.removed) entry = entry.previous;
        }
      },
      // 23.1.3.7 Map.prototype.has(key)
      // 23.2.3.7 Set.prototype.has(value)
      has: function has(key) {
        return !!getEntry(this, key);
      }
    });

    redefineAll(C.prototype, IS_MAP ? {
      // 23.1.3.6 Map.prototype.get(key)
      get: function get(key) {
        var entry = getEntry(this, key);
        return entry && entry.value;
      },
      // 23.1.3.9 Map.prototype.set(key, value)
      set: function set(key, value) {
        return define(this, key === 0 ? 0 : key, value);
      }
    } : {
      // 23.2.3.1 Set.prototype.add(value)
      add: function add(value) {
        return define(this, value = value === 0 ? 0 : value, value);
      }
    });
    if (descriptors$1) defineProperty$4(C.prototype, 'size', {
      get: function () {
        return getInternalState(this).size;
      }
    });
    return C;
  },
  setStrong: function (C, CONSTRUCTOR_NAME, IS_MAP) {
    var ITERATOR_NAME = CONSTRUCTOR_NAME + ' Iterator';
    var getInternalCollectionState = internalStateGetterFor(CONSTRUCTOR_NAME);
    var getInternalIteratorState = internalStateGetterFor(ITERATOR_NAME);
    // add .keys, .values, .entries, [@@iterator]
    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
    defineIterator(C, CONSTRUCTOR_NAME, function (iterated, kind) {
      setInternalState$2(this, {
        type: ITERATOR_NAME,
        target: iterated,
        state: getInternalCollectionState(iterated),
        kind: kind,
        last: undefined
      });
    }, function () {
      var state = getInternalIteratorState(this);
      var kind = state.kind;
      var entry = state.last;
      // revert to the last existing entry
      while (entry && entry.removed) entry = entry.previous;
      // get next entry
      if (!state.target || !(state.last = entry = entry ? entry.next : state.state.first)) {
        // or finish the iteration
        state.target = undefined;
        return { value: undefined, done: true };
      }
      // return step by kind
      if (kind == 'keys') return { value: entry.key, done: false };
      if (kind == 'values') return { value: entry.value, done: false };
      return { value: [entry.key, entry.value], done: false };
    }, IS_MAP ? 'entries' : 'values', !IS_MAP, true);

    // add [@@species], 23.1.2.2, 23.2.2.2
    setSpecies(CONSTRUCTOR_NAME);
  }
};

// `Set` constructor
// https://tc39.github.io/ecma262/#sec-set-objects
var es_set = collection('Set', function (get) {
  return function Set() { return get(this, arguments.length ? arguments[0] : undefined); };
}, collectionStrong);

// `String.prototype.{ codePointAt, at }` methods implementation
var createMethod$2$1 = function (CONVERT_TO_STRING) {
  return function ($this, pos) {
    var S = String(requireObjectCoercible$1($this));
    var position = toInteger$1(pos);
    var size = S.length;
    var first, second;
    if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
    first = S.charCodeAt(position);
    return first < 0xD800 || first > 0xDBFF || position + 1 === size
      || (second = S.charCodeAt(position + 1)) < 0xDC00 || second > 0xDFFF
        ? CONVERT_TO_STRING ? S.charAt(position) : first
        : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
  };
};

var stringMultibyte = {
  // `String.prototype.codePointAt` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.codepointat
  codeAt: createMethod$2$1(false),
  // `String.prototype.at` method
  // https://github.com/mathiasbynens/String.prototype.at
  charAt: createMethod$2$1(true)
};

var charAt = stringMultibyte.charAt;



var STRING_ITERATOR = 'String Iterator';
var setInternalState$3 = internalState$1.set;
var getInternalState$2 = internalState$1.getterFor(STRING_ITERATOR);

// `String.prototype[@@iterator]` method
// https://tc39.github.io/ecma262/#sec-string.prototype-@@iterator
defineIterator(String, 'String', function (iterated) {
  setInternalState$3(this, {
    type: STRING_ITERATOR,
    string: String(iterated),
    index: 0
  });
// `%StringIteratorPrototype%.next` method
// https://tc39.github.io/ecma262/#sec-%stringiteratorprototype%.next
}, function next() {
  var state = getInternalState$2(this);
  var string = state.string;
  var index = state.index;
  var point;
  if (index >= string.length) return { value: undefined, done: true };
  point = charAt(string, index);
  state.index += point.length;
  return { value: point, done: false };
});

// iterable DOM collections
// flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
var domIterables$1 = {
  CSSRuleList: 0,
  CSSStyleDeclaration: 0,
  CSSValueList: 0,
  ClientRectList: 0,
  DOMRectList: 0,
  DOMStringList: 0,
  DOMTokenList: 1,
  DataTransferItemList: 0,
  FileList: 0,
  HTMLAllCollection: 0,
  HTMLCollection: 0,
  HTMLFormElement: 0,
  HTMLSelectElement: 0,
  MediaList: 0,
  MimeTypeArray: 0,
  NamedNodeMap: 0,
  NodeList: 1,
  PaintRequestList: 0,
  Plugin: 0,
  PluginArray: 0,
  SVGLengthList: 0,
  SVGNumberList: 0,
  SVGPathSegList: 0,
  SVGPointList: 0,
  SVGStringList: 0,
  SVGTransformList: 0,
  SourceBufferList: 0,
  StyleSheetList: 0,
  TextTrackCueList: 0,
  TextTrackList: 0,
  TouchList: 0
};

var ITERATOR$5 = wellKnownSymbol$1('iterator');
var TO_STRING_TAG$3 = wellKnownSymbol$1('toStringTag');
var ArrayValues = es_array_iterator.values;

for (var COLLECTION_NAME$1 in domIterables$1) {
  var Collection$1 = global_1$1[COLLECTION_NAME$1];
  var CollectionPrototype$1 = Collection$1 && Collection$1.prototype;
  if (CollectionPrototype$1) {
    // some Chrome versions have non-configurable methods on DOMTokenList
    if (CollectionPrototype$1[ITERATOR$5] !== ArrayValues) try {
      createNonEnumerableProperty$1(CollectionPrototype$1, ITERATOR$5, ArrayValues);
    } catch (error) {
      CollectionPrototype$1[ITERATOR$5] = ArrayValues;
    }
    if (!CollectionPrototype$1[TO_STRING_TAG$3]) {
      createNonEnumerableProperty$1(CollectionPrototype$1, TO_STRING_TAG$3, COLLECTION_NAME$1);
    }
    if (domIterables$1[COLLECTION_NAME$1]) for (var METHOD_NAME in es_array_iterator) {
      // some Chrome versions have non-configurable methods on DOMTokenList
      if (CollectionPrototype$1[METHOD_NAME] !== es_array_iterator[METHOD_NAME]) try {
        createNonEnumerableProperty$1(CollectionPrototype$1, METHOD_NAME, es_array_iterator[METHOD_NAME]);
      } catch (error) {
        CollectionPrototype$1[METHOD_NAME] = es_array_iterator[METHOD_NAME];
      }
    }
  }
}

function _arrayWithoutHoles$1(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }
}

function _iterableToArray$1(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

function _nonIterableSpread$1() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

function _toConsumableArray$1(arr) {
  return _arrayWithoutHoles$1(arr) || _iterableToArray$1(arr) || _nonIterableSpread$1();
}

var methods = {};
var names = [];
function registerMethods(name, m) {
  if (Array.isArray(name)) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = name[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _name = _step.value;
        registerMethods(_name, m);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return;
  }

  if (_typeof(name) === 'object') {
    for (var _name2 in name) {
      registerMethods(_name2, name[_name2]);
    }

    return;
  }

  addMethodNames(Object.getOwnPropertyNames(m));
  methods[name] = Object.assign(methods[name] || {}, m);
}
function getMethodsFor(name) {
  return methods[name] || {};
}
function getMethodNames() {
  return _toConsumableArray$1(new Set(names));
}
function addMethodNames(_names) {
  names.push.apply(names, _toConsumableArray$1(_names));
}

var $includes = arrayIncludes$1.includes;


// `Array.prototype.includes` method
// https://tc39.github.io/ecma262/#sec-array.prototype.includes
_export$1({ target: 'Array', proto: true }, {
  includes: function includes(el /* , fromIndex = 0 */) {
    return $includes(this, el, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables('includes');

// `RegExp.prototype.flags` getter implementation
// https://tc39.github.io/ecma262/#sec-get-regexp.prototype.flags
var regexpFlags = function () {
  var that = anObject$1(this);
  var result = '';
  if (that.global) result += 'g';
  if (that.ignoreCase) result += 'i';
  if (that.multiline) result += 'm';
  if (that.dotAll) result += 's';
  if (that.unicode) result += 'u';
  if (that.sticky) result += 'y';
  return result;
};

var nativeExec = RegExp.prototype.exec;
// This always refers to the native implementation, because the
// String#replace polyfill uses ./fix-regexp-well-known-symbol-logic.js,
// which loads this file before patching the method.
var nativeReplace = String.prototype.replace;

var patchedExec = nativeExec;

var UPDATES_LAST_INDEX_WRONG = (function () {
  var re1 = /a/;
  var re2 = /b*/g;
  nativeExec.call(re1, 'a');
  nativeExec.call(re2, 'a');
  return re1.lastIndex !== 0 || re2.lastIndex !== 0;
})();

// nonparticipating capturing group, copied from es5-shim's String#split patch.
var NPCG_INCLUDED = /()??/.exec('')[1] !== undefined;

var PATCH = UPDATES_LAST_INDEX_WRONG || NPCG_INCLUDED;

if (PATCH) {
  patchedExec = function exec(str) {
    var re = this;
    var lastIndex, reCopy, match, i;

    if (NPCG_INCLUDED) {
      reCopy = new RegExp('^' + re.source + '$(?!\\s)', regexpFlags.call(re));
    }
    if (UPDATES_LAST_INDEX_WRONG) lastIndex = re.lastIndex;

    match = nativeExec.call(re, str);

    if (UPDATES_LAST_INDEX_WRONG && match) {
      re.lastIndex = re.global ? match.index + match[0].length : lastIndex;
    }
    if (NPCG_INCLUDED && match && match.length > 1) {
      // Fix browsers whose `exec` methods don't consistently return `undefined`
      // for NPCG, like IE8. NOTE: This doesn' work for /(.?)?/
      nativeReplace.call(match[0], reCopy, function () {
        for (i = 1; i < arguments.length - 2; i++) {
          if (arguments[i] === undefined) match[i] = undefined;
        }
      });
    }

    return match;
  };
}

var regexpExec = patchedExec;

_export$1({ target: 'RegExp', proto: true, forced: /./.exec !== regexpExec }, {
  exec: regexpExec
});

var MATCH = wellKnownSymbol$1('match');

// `IsRegExp` abstract operation
// https://tc39.github.io/ecma262/#sec-isregexp
var isRegexp = function (it) {
  var isRegExp;
  return isObject$1(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : classofRaw$1(it) == 'RegExp');
};

var notARegexp = function (it) {
  if (isRegexp(it)) {
    throw TypeError("The method doesn't accept regular expressions");
  } return it;
};

var MATCH$1 = wellKnownSymbol$1('match');

var correctIsRegexpLogic = function (METHOD_NAME) {
  var regexp = /./;
  try {
    '/./'[METHOD_NAME](regexp);
  } catch (e) {
    try {
      regexp[MATCH$1] = false;
      return '/./'[METHOD_NAME](regexp);
    } catch (f) { /* empty */ }
  } return false;
};

// `String.prototype.includes` method
// https://tc39.github.io/ecma262/#sec-string.prototype.includes
_export$1({ target: 'String', proto: true, forced: !correctIsRegexpLogic('includes') }, {
  includes: function includes(searchString /* , position = 0 */) {
    return !!~String(requireObjectCoercible$1(this))
      .indexOf(notARegexp(searchString), arguments.length > 1 ? arguments[1] : undefined);
  }
});

var SPECIES$4 = wellKnownSymbol$1('species');

var REPLACE_SUPPORTS_NAMED_GROUPS = !fails$1(function () {
  // #replace needs built-in support for named groups.
  // #match works fine because it just return the exec results, even if it has
  // a "grops" property.
  var re = /./;
  re.exec = function () {
    var result = [];
    result.groups = { a: '7' };
    return result;
  };
  return ''.replace(re, '$<a>') !== '7';
});

// Chrome 51 has a buggy "split" implementation when RegExp#exec !== nativeExec
// Weex JS has frozen built-in prototypes, so use try / catch wrapper
var SPLIT_WORKS_WITH_OVERWRITTEN_EXEC = !fails$1(function () {
  var re = /(?:)/;
  var originalExec = re.exec;
  re.exec = function () { return originalExec.apply(this, arguments); };
  var result = 'ab'.split(re);
  return result.length !== 2 || result[0] !== 'a' || result[1] !== 'b';
});

var fixRegexpWellKnownSymbolLogic = function (KEY, length, exec, sham) {
  var SYMBOL = wellKnownSymbol$1(KEY);

  var DELEGATES_TO_SYMBOL = !fails$1(function () {
    // String methods call symbol-named RegEp methods
    var O = {};
    O[SYMBOL] = function () { return 7; };
    return ''[KEY](O) != 7;
  });

  var DELEGATES_TO_EXEC = DELEGATES_TO_SYMBOL && !fails$1(function () {
    // Symbol-named RegExp methods call .exec
    var execCalled = false;
    var re = /a/;

    if (KEY === 'split') {
      // We can't use real regex here since it causes deoptimization
      // and serious performance degradation in V8
      // https://github.com/zloirock/core-js/issues/306
      re = {};
      // RegExp[@@split] doesn't call the regex's exec method, but first creates
      // a new one. We need to return the patched regex when creating the new one.
      re.constructor = {};
      re.constructor[SPECIES$4] = function () { return re; };
      re.flags = '';
      re[SYMBOL] = /./[SYMBOL];
    }

    re.exec = function () { execCalled = true; return null; };

    re[SYMBOL]('');
    return !execCalled;
  });

  if (
    !DELEGATES_TO_SYMBOL ||
    !DELEGATES_TO_EXEC ||
    (KEY === 'replace' && !REPLACE_SUPPORTS_NAMED_GROUPS) ||
    (KEY === 'split' && !SPLIT_WORKS_WITH_OVERWRITTEN_EXEC)
  ) {
    var nativeRegExpMethod = /./[SYMBOL];
    var methods = exec(SYMBOL, ''[KEY], function (nativeMethod, regexp, str, arg2, forceStringMethod) {
      if (regexp.exec === regexpExec) {
        if (DELEGATES_TO_SYMBOL && !forceStringMethod) {
          // The native String method already delegates to @@method (this
          // polyfilled function), leasing to infinite recursion.
          // We avoid it by directly calling the native @@method method.
          return { done: true, value: nativeRegExpMethod.call(regexp, str, arg2) };
        }
        return { done: true, value: nativeMethod.call(str, regexp, arg2) };
      }
      return { done: false };
    });
    var stringMethod = methods[0];
    var regexMethod = methods[1];

    redefine$1(String.prototype, KEY, stringMethod);
    redefine$1(RegExp.prototype, SYMBOL, length == 2
      // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
      // 21.2.5.11 RegExp.prototype[@@split](string, limit)
      ? function (string, arg) { return regexMethod.call(string, this, arg); }
      // 21.2.5.6 RegExp.prototype[@@match](string)
      // 21.2.5.9 RegExp.prototype[@@search](string)
      : function (string) { return regexMethod.call(string, this); }
    );
    if (sham) createNonEnumerableProperty$1(RegExp.prototype[SYMBOL], 'sham', true);
  }
};

var charAt$1 = stringMultibyte.charAt;

// `AdvanceStringIndex` abstract operation
// https://tc39.github.io/ecma262/#sec-advancestringindex
var advanceStringIndex = function (S, index, unicode) {
  return index + (unicode ? charAt$1(S, index).length : 1);
};

// `RegExpExec` abstract operation
// https://tc39.github.io/ecma262/#sec-regexpexec
var regexpExecAbstract = function (R, S) {
  var exec = R.exec;
  if (typeof exec === 'function') {
    var result = exec.call(R, S);
    if (typeof result !== 'object') {
      throw TypeError('RegExp exec method returned something other than an Object or null');
    }
    return result;
  }

  if (classofRaw$1(R) !== 'RegExp') {
    throw TypeError('RegExp#exec called on incompatible receiver');
  }

  return regexpExec.call(R, S);
};

var max$2$1 = Math.max;
var min$2$1 = Math.min;
var floor$1$1 = Math.floor;
var SUBSTITUTION_SYMBOLS = /\$([$&'`]|\d\d?|<[^>]*>)/g;
var SUBSTITUTION_SYMBOLS_NO_NAMED = /\$([$&'`]|\d\d?)/g;

var maybeToString = function (it) {
  return it === undefined ? it : String(it);
};

// @@replace logic
fixRegexpWellKnownSymbolLogic('replace', 2, function (REPLACE, nativeReplace, maybeCallNative) {
  return [
    // `String.prototype.replace` method
    // https://tc39.github.io/ecma262/#sec-string.prototype.replace
    function replace(searchValue, replaceValue) {
      var O = requireObjectCoercible$1(this);
      var replacer = searchValue == undefined ? undefined : searchValue[REPLACE];
      return replacer !== undefined
        ? replacer.call(searchValue, O, replaceValue)
        : nativeReplace.call(String(O), searchValue, replaceValue);
    },
    // `RegExp.prototype[@@replace]` method
    // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@replace
    function (regexp, replaceValue) {
      var res = maybeCallNative(nativeReplace, regexp, this, replaceValue);
      if (res.done) return res.value;

      var rx = anObject$1(regexp);
      var S = String(this);

      var functionalReplace = typeof replaceValue === 'function';
      if (!functionalReplace) replaceValue = String(replaceValue);

      var global = rx.global;
      if (global) {
        var fullUnicode = rx.unicode;
        rx.lastIndex = 0;
      }
      var results = [];
      while (true) {
        var result = regexpExecAbstract(rx, S);
        if (result === null) break;

        results.push(result);
        if (!global) break;

        var matchStr = String(result[0]);
        if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength$1(rx.lastIndex), fullUnicode);
      }

      var accumulatedResult = '';
      var nextSourcePosition = 0;
      for (var i = 0; i < results.length; i++) {
        result = results[i];

        var matched = String(result[0]);
        var position = max$2$1(min$2$1(toInteger$1(result.index), S.length), 0);
        var captures = [];
        // NOTE: This is equivalent to
        //   captures = result.slice(1).map(maybeToString)
        // but for some reason `nativeSlice.call(result, 1, result.length)` (called in
        // the slice polyfill when slicing native arrays) "doesn't work" in safari 9 and
        // causes a crash (https://pastebin.com/N21QzeQA) when trying to debug it.
        for (var j = 1; j < result.length; j++) captures.push(maybeToString(result[j]));
        var namedCaptures = result.groups;
        if (functionalReplace) {
          var replacerArgs = [matched].concat(captures, position, S);
          if (namedCaptures !== undefined) replacerArgs.push(namedCaptures);
          var replacement = String(replaceValue.apply(undefined, replacerArgs));
        } else {
          replacement = getSubstitution(matched, S, position, captures, namedCaptures, replaceValue);
        }
        if (position >= nextSourcePosition) {
          accumulatedResult += S.slice(nextSourcePosition, position) + replacement;
          nextSourcePosition = position + matched.length;
        }
      }
      return accumulatedResult + S.slice(nextSourcePosition);
    }
  ];

  // https://tc39.github.io/ecma262/#sec-getsubstitution
  function getSubstitution(matched, str, position, captures, namedCaptures, replacement) {
    var tailPos = position + matched.length;
    var m = captures.length;
    var symbols = SUBSTITUTION_SYMBOLS_NO_NAMED;
    if (namedCaptures !== undefined) {
      namedCaptures = toObject$1(namedCaptures);
      symbols = SUBSTITUTION_SYMBOLS;
    }
    return nativeReplace.call(replacement, symbols, function (match, ch) {
      var capture;
      switch (ch.charAt(0)) {
        case '$': return '$';
        case '&': return matched;
        case '`': return str.slice(0, position);
        case "'": return str.slice(tailPos);
        case '<':
          capture = namedCaptures[ch.slice(1, -1)];
          break;
        default: // \d\d?
          var n = +ch;
          if (n === 0) return match;
          if (n > m) {
            var f = floor$1$1(n / 10);
            if (f === 0) return match;
            if (f <= m) return captures[f - 1] === undefined ? ch.charAt(1) : captures[f - 1] + ch.charAt(1);
            return match;
          }
          capture = captures[n - 1];
      }
      return capture === undefined ? '' : capture;
    });
  }
});

// a string of all valid unicode whitespaces
// eslint-disable-next-line max-len
var whitespaces = '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';

var whitespace = '[' + whitespaces + ']';
var ltrim = RegExp('^' + whitespace + whitespace + '*');
var rtrim = RegExp(whitespace + whitespace + '*$');

// `String.prototype.{ trim, trimStart, trimEnd, trimLeft, trimRight }` methods implementation
var createMethod$3$1 = function (TYPE) {
  return function ($this) {
    var string = String(requireObjectCoercible$1($this));
    if (TYPE & 1) string = string.replace(ltrim, '');
    if (TYPE & 2) string = string.replace(rtrim, '');
    return string;
  };
};

var stringTrim = {
  // `String.prototype.{ trimLeft, trimStart }` methods
  // https://tc39.github.io/ecma262/#sec-string.prototype.trimstart
  start: createMethod$3$1(1),
  // `String.prototype.{ trimRight, trimEnd }` methods
  // https://tc39.github.io/ecma262/#sec-string.prototype.trimend
  end: createMethod$3$1(2),
  // `String.prototype.trim` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.trim
  trim: createMethod$3$1(3)
};

var non = '\u200B\u0085\u180E';

// check that a method works with the correct list
// of whitespaces and has a correct name
var forcedStringTrimMethod = function (METHOD_NAME) {
  return fails$1(function () {
    return !!whitespaces[METHOD_NAME]() || non[METHOD_NAME]() != non || whitespaces[METHOD_NAME].name !== METHOD_NAME;
  });
};

var $trim = stringTrim.trim;


// `String.prototype.trim` method
// https://tc39.github.io/ecma262/#sec-string.prototype.trim
_export$1({ target: 'String', proto: true, forced: forcedStringTrimMethod('trim') }, {
  trim: function trim() {
    return $trim(this);
  }
});

// Map function
function map(array, block) {
  var i;
  var il = array.length;
  var result = [];

  for (i = 0; i < il; i++) {
    result.push(block(array[i]));
  }

  return result;
} // Filter function

function filter(array, block) {
  var i;
  var il = array.length;
  var result = [];

  for (i = 0; i < il; i++) {
    if (block(array[i])) {
      result.push(array[i]);
    }
  }

  return result;
} // Degrees to radians

function radians(d) {
  return d % 360 * Math.PI / 180;
} // Radians to degrees

function degrees(r) {
  return r * 180 / Math.PI % 360;
} // Convert dash-separated-string to camelCase

function camelCase(s) {
  return s.toLowerCase().replace(/-(.)/g, function (m, g) {
    return g.toUpperCase();
  });
} // Convert camel cased string to string seperated

function unCamelCase(s) {
  return s.replace(/([A-Z])/g, function (m, g) {
    return '-' + g.toLowerCase();
  });
} // Capitalize first letter of a string

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
} // Calculate proportional width and height values when necessary

function proportionalSize(element, width, height, box) {
  if (width == null || height == null) {
    box = box || element.bbox();

    if (width == null) {
      width = box.width / box.height * height;
    } else if (height == null) {
      height = box.height / box.width * width;
    }
  }

  return {
    width: width,
    height: height
  };
}
function getOrigin(o, element) {
  // Allow origin or around as the names
  var origin = o.origin; // o.around == null ? o.origin : o.around

  var ox, oy; // Allow the user to pass a string to rotate around a given point

  if (typeof origin === 'string' || origin == null) {
    // Get the bounding box of the element with no transformations applied
    var string = (origin || 'center').toLowerCase().trim();

    var _element$bbox = element.bbox(),
        height = _element$bbox.height,
        width = _element$bbox.width,
        x = _element$bbox.x,
        y = _element$bbox.y; // Calculate the transformed x and y coordinates


    var bx = string.includes('left') ? x : string.includes('right') ? x + width : x + width / 2;
    var by = string.includes('top') ? y : string.includes('bottom') ? y + height : y + height / 2; // Set the bounds eg : "bottom-left", "Top right", "middle" etc...

    ox = o.ox != null ? o.ox : bx;
    oy = o.oy != null ? o.oy : by;
  } else {
    ox = origin[0];
    oy = origin[1];
  } // Return the origin as it is if it wasn't a string


  return [ox, oy];
}

var utils = ({
	__proto__: null,
	map: map,
	filter: filter,
	radians: radians,
	degrees: degrees,
	camelCase: camelCase,
	unCamelCase: unCamelCase,
	capitalize: capitalize,
	proportionalSize: proportionalSize,
	getOrigin: getOrigin
});

// Default namespaces
var ns = 'http://www.w3.org/2000/svg';
var xmlns = 'http://www.w3.org/2000/xmlns/';
var xlink = 'http://www.w3.org/1999/xlink';
var svgjs = 'http://svgjs.com/svgjs';

var namespaces = ({
	__proto__: null,
	ns: ns,
	xmlns: xmlns,
	xlink: xlink,
	svgjs: svgjs
});

var globals = {
  window: typeof window === 'undefined' ? null : window,
  document: typeof document === 'undefined' ? null : document
};

function _classCallCheck$1(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var Base = function Base() {
  _classCallCheck$1(this, Base);
};

var elements = {};
var root = '___SYMBOL___ROOT___'; // Method for element creation

function create(name) {
  // create element
  return globals.document.createElementNS(ns, name);
}
function makeInstance(element) {
  if (element instanceof Base) return element;

  if (_typeof(element) === 'object') {
    return adopter(element);
  }

  if (element == null) {
    return new elements[root]();
  }

  if (typeof element === 'string' && element.charAt(0) !== '<') {
    return adopter(globals.document.querySelector(element));
  }

  var node = create('svg');
  node.innerHTML = element; // We can use firstChild here because we know,
  // that the first char is < and thus an element

  element = adopter(node.firstChild);
  return element;
}
function nodeOrNew(name, node) {
  return node instanceof globals.window.Node ? node : create(name);
} // Adopt existing svg elements

function adopt(node) {
  // check for presence of node
  if (!node) return null; // make sure a node isn't already adopted

  if (node.instance instanceof Base) return node.instance; // initialize variables

  var className = capitalize(node.nodeName || 'Dom'); // Make sure that gradients are adopted correctly

  if (className === 'LinearGradient' || className === 'RadialGradient') {
    className = 'Gradient'; // Fallback to Dom if element is not known
  } else if (!elements[className]) {
    className = 'Dom';
  }

  return new elements[className](node);
}
var adopter = adopt;
function register(element) {
  var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : element.name;
  var asRoot = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  elements[name] = element;
  if (asRoot) elements[root] = element;
  addMethodNames(Object.getOwnPropertyNames(element.prototype));
  return element;
}
function getClass(name) {
  return elements[name];
} // Element id sequence

var did = 1000; // Get next named element id

function eid(name) {
  return 'Svgjs' + capitalize(name) + did++;
} // Deep new id assignment

function assignNewId(node) {
  // do the same for SVG child nodes as well
  for (var i = node.children.length - 1; i >= 0; i--) {
    assignNewId(node.children[i]);
  }

  if (node.id) {
    return adopt(node).id(eid(node.nodeName));
  }

  return adopt(node);
} // Method for extending objects

function extend(modules, methods, attrCheck) {
  var key, i;
  modules = Array.isArray(modules) ? modules : [modules];

  for (i = modules.length - 1; i >= 0; i--) {
    for (key in methods) {
      var method = methods[key];

      if (attrCheck) {
        method = wrapWithAttrCheck(methods[key]);
      }

      modules[i].prototype[key] = method;
    }
  }
} // export function extendWithAttrCheck (...args) {
//   extend(...args, true)
// }

function wrapWithAttrCheck(fn) {
  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var o = args[args.length - 1];

    if (o && o.constructor === Object && !(o instanceof Array)) {
      return fn.apply(this, args.slice(0, -1)).attr(o);
    } else {
      return fn.apply(this, args);
    }
  };
}

function siblings() {
  return this.parent().children();
} // Get the curent position siblings

function position() {
  return this.parent().index(this);
} // Get the next element (will return null if there is none)

function next() {
  return this.siblings()[this.position() + 1];
} // Get the next element (will return null if there is none)

function prev() {
  return this.siblings()[this.position() - 1];
} // Send given element one step forward

function forward() {
  var i = this.position() + 1;
  var p = this.parent(); // move node one step forward

  p.removeElement(this).add(this, i); // make sure defs node is always at the top

  if (typeof p.isRoot === 'function' && p.isRoot()) {
    p.node.appendChild(p.defs().node);
  }

  return this;
} // Send given element one step backward

function backward() {
  var i = this.position();

  if (i > 0) {
    this.parent().removeElement(this).add(this, i - 1);
  }

  return this;
} // Send given element all the way to the front

function front() {
  var p = this.parent(); // Move node forward

  p.node.appendChild(this.node); // Make sure defs node is always at the top

  if (typeof p.isRoot === 'function' && p.isRoot()) {
    p.node.appendChild(p.defs().node);
  }

  return this;
} // Send given element all the way to the back

function back() {
  if (this.position() > 0) {
    this.parent().removeElement(this).add(this, 0);
  }

  return this;
} // Inserts a given element before the targeted element

function before(element) {
  element = makeInstance(element);
  element.remove();
  var i = this.position();
  this.parent().add(element, i);
  return this;
} // Inserts a given element after the targeted element

function after(element) {
  element = makeInstance(element);
  element.remove();
  var i = this.position();
  this.parent().add(element, i + 1);
  return this;
}
function insertBefore(element) {
  element = makeInstance(element);
  element.before(this);
  return this;
}
function insertAfter(element) {
  element = makeInstance(element);
  element.after(this);
  return this;
}
registerMethods('Dom', {
  siblings: siblings,
  position: position,
  next: next,
  prev: prev,
  forward: forward,
  backward: backward,
  front: front,
  back: back,
  before: before,
  after: after,
  insertBefore: insertBefore,
  insertAfter: insertAfter
});

var $filter = arrayIteration$1.filter;


// `Array.prototype.filter` method
// https://tc39.github.io/ecma262/#sec-array.prototype.filter
// with adding support of @@species
_export$1({ target: 'Array', proto: true, forced: !arrayMethodHasSpeciesSupport$1('filter') }, {
  filter: function filter(callbackfn /* , thisArg */) {
    return $filter(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

var sloppyArrayMethod = function (METHOD_NAME, argument) {
  var method = [][METHOD_NAME];
  return !method || !fails$1(function () {
    // eslint-disable-next-line no-useless-call,no-throw-literal
    method.call(null, argument || function () { throw 1; }, 1);
  });
};

var $indexOf$1 = arrayIncludes$1.indexOf;


var nativeIndexOf$1 = [].indexOf;

var NEGATIVE_ZERO$1 = !!nativeIndexOf$1 && 1 / [1].indexOf(1, -0) < 0;
var SLOPPY_METHOD = sloppyArrayMethod('indexOf');

// `Array.prototype.indexOf` method
// https://tc39.github.io/ecma262/#sec-array.prototype.indexof
_export$1({ target: 'Array', proto: true, forced: NEGATIVE_ZERO$1 || SLOPPY_METHOD }, {
  indexOf: function indexOf(searchElement /* , fromIndex = 0 */) {
    return NEGATIVE_ZERO$1
      // convert -0 to +0
      ? nativeIndexOf$1.apply(this, arguments) || 0
      : $indexOf$1(this, searchElement, arguments.length > 1 ? arguments[1] : undefined);
  }
});

var nativeJoin = [].join;

var ES3_STRINGS = indexedObject$1 != Object;
var SLOPPY_METHOD$1 = sloppyArrayMethod('join', ',');

// `Array.prototype.join` method
// https://tc39.github.io/ecma262/#sec-array.prototype.join
_export$1({ target: 'Array', proto: true, forced: ES3_STRINGS || SLOPPY_METHOD$1 }, {
  join: function join(separator) {
    return nativeJoin.call(toIndexedObject$1(this), separator === undefined ? ',' : separator);
  }
});

var SPECIES$5 = wellKnownSymbol$1('species');

// `SpeciesConstructor` abstract operation
// https://tc39.github.io/ecma262/#sec-speciesconstructor
var speciesConstructor = function (O, defaultConstructor) {
  var C = anObject$1(O).constructor;
  var S;
  return C === undefined || (S = anObject$1(C)[SPECIES$5]) == undefined ? defaultConstructor : aFunction$1$1(S);
};

var arrayPush = [].push;
var min$3 = Math.min;
var MAX_UINT32 = 0xFFFFFFFF;

// babel-minify transpiles RegExp('x', 'y') -> /x/y and it causes SyntaxError
var SUPPORTS_Y = !fails$1(function () { return !RegExp(MAX_UINT32, 'y'); });

// @@split logic
fixRegexpWellKnownSymbolLogic('split', 2, function (SPLIT, nativeSplit, maybeCallNative) {
  var internalSplit;
  if (
    'abbc'.split(/(b)*/)[1] == 'c' ||
    'test'.split(/(?:)/, -1).length != 4 ||
    'ab'.split(/(?:ab)*/).length != 2 ||
    '.'.split(/(.?)(.?)/).length != 4 ||
    '.'.split(/()()/).length > 1 ||
    ''.split(/.?/).length
  ) {
    // based on es5-shim implementation, need to rework it
    internalSplit = function (separator, limit) {
      var string = String(requireObjectCoercible$1(this));
      var lim = limit === undefined ? MAX_UINT32 : limit >>> 0;
      if (lim === 0) return [];
      if (separator === undefined) return [string];
      // If `separator` is not a regex, use native split
      if (!isRegexp(separator)) {
        return nativeSplit.call(string, separator, lim);
      }
      var output = [];
      var flags = (separator.ignoreCase ? 'i' : '') +
                  (separator.multiline ? 'm' : '') +
                  (separator.unicode ? 'u' : '') +
                  (separator.sticky ? 'y' : '');
      var lastLastIndex = 0;
      // Make `global` and avoid `lastIndex` issues by working with a copy
      var separatorCopy = new RegExp(separator.source, flags + 'g');
      var match, lastIndex, lastLength;
      while (match = regexpExec.call(separatorCopy, string)) {
        lastIndex = separatorCopy.lastIndex;
        if (lastIndex > lastLastIndex) {
          output.push(string.slice(lastLastIndex, match.index));
          if (match.length > 1 && match.index < string.length) arrayPush.apply(output, match.slice(1));
          lastLength = match[0].length;
          lastLastIndex = lastIndex;
          if (output.length >= lim) break;
        }
        if (separatorCopy.lastIndex === match.index) separatorCopy.lastIndex++; // Avoid an infinite loop
      }
      if (lastLastIndex === string.length) {
        if (lastLength || !separatorCopy.test('')) output.push('');
      } else output.push(string.slice(lastLastIndex));
      return output.length > lim ? output.slice(0, lim) : output;
    };
  // Chakra, V8
  } else if ('0'.split(undefined, 0).length) {
    internalSplit = function (separator, limit) {
      return separator === undefined && limit === 0 ? [] : nativeSplit.call(this, separator, limit);
    };
  } else internalSplit = nativeSplit;

  return [
    // `String.prototype.split` method
    // https://tc39.github.io/ecma262/#sec-string.prototype.split
    function split(separator, limit) {
      var O = requireObjectCoercible$1(this);
      var splitter = separator == undefined ? undefined : separator[SPLIT];
      return splitter !== undefined
        ? splitter.call(separator, O, limit)
        : internalSplit.call(String(O), separator, limit);
    },
    // `RegExp.prototype[@@split]` method
    // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@split
    //
    // NOTE: This cannot be properly polyfilled in engines that don't support
    // the 'y' flag.
    function (regexp, limit) {
      var res = maybeCallNative(internalSplit, regexp, this, limit, internalSplit !== nativeSplit);
      if (res.done) return res.value;

      var rx = anObject$1(regexp);
      var S = String(this);
      var C = speciesConstructor(rx, RegExp);

      var unicodeMatching = rx.unicode;
      var flags = (rx.ignoreCase ? 'i' : '') +
                  (rx.multiline ? 'm' : '') +
                  (rx.unicode ? 'u' : '') +
                  (SUPPORTS_Y ? 'y' : 'g');

      // ^(? + rx + ) is needed, in combination with some S slicing, to
      // simulate the 'y' flag.
      var splitter = new C(SUPPORTS_Y ? rx : '^(?:' + rx.source + ')', flags);
      var lim = limit === undefined ? MAX_UINT32 : limit >>> 0;
      if (lim === 0) return [];
      if (S.length === 0) return regexpExecAbstract(splitter, S) === null ? [S] : [];
      var p = 0;
      var q = 0;
      var A = [];
      while (q < S.length) {
        splitter.lastIndex = SUPPORTS_Y ? q : 0;
        var z = regexpExecAbstract(splitter, SUPPORTS_Y ? S : S.slice(q));
        var e;
        if (
          z === null ||
          (e = min$3(toLength$1(splitter.lastIndex + (SUPPORTS_Y ? 0 : q)), S.length)) === p
        ) {
          q = advanceStringIndex(S, q, unicodeMatching);
        } else {
          A.push(S.slice(p, q));
          if (A.length === lim) return A;
          for (var i = 1; i <= z.length - 1; i++) {
            A.push(z[i]);
            if (A.length === lim) return A;
          }
          q = p = e;
        }
      }
      A.push(S.slice(p));
      return A;
    }
  ];
}, !SUPPORTS_Y);

// Parse unit value
var numberAndUnit = /^([+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?)([a-z%]*)$/i; // Parse hex value

var hex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i; // Parse rgb value

var rgb = /rgb\((\d+),(\d+),(\d+)\)/; // Parse reference id

var reference = /(#[a-z0-9\-_]+)/i; // splits a transformation chain

var transforms = /\)\s*,?\s*/; // Whitespace

var whitespace$1 = /\s/g; // Test hex value

var isHex = /^#[a-f0-9]{3,6}$/i; // Test rgb value

var isRgb = /^rgb\(/; // Test css declaration

var isBlank = /^(\s+)?$/; // Test for numeric string

var isNumber = /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i; // Test for percent value

var isImage = /\.(jpg|jpeg|png|gif|svg)(\?[^=]+.*)?/i; // split at whitespace and comma

var delimiter = /[\s,]+/; // The following regex are used to parse the d attribute of a path
// Matches all hyphens which are not after an exponent

var hyphen = /([^e])-/gi; // Replaces and tests for all path letters

var pathLetters = /[MLHVCSQTAZ]/gi; // yes we need this one, too

var isPathLetter = /[MLHVCSQTAZ]/i; // matches 0.154.23.45

var numbersWithDots = /((\d?\.\d+(?:e[+-]?\d+)?)((?:\.\d+(?:e[+-]?\d+)?)+))+/gi; // matches .

var dots = /\./g;

function classes() {
  var attr = this.attr('class');
  return attr == null ? [] : attr.trim().split(delimiter);
} // Return true if class exists on the node, false otherwise

function hasClass(name) {
  return this.classes().indexOf(name) !== -1;
} // Add class to the node

function addClass(name) {
  if (!this.hasClass(name)) {
    var array = this.classes();
    array.push(name);
    this.attr('class', array.join(' '));
  }

  return this;
} // Remove class from the node

function removeClass(name) {
  if (this.hasClass(name)) {
    this.attr('class', this.classes().filter(function (c) {
      return c !== name;
    }).join(' '));
  }

  return this;
} // Toggle the presence of a class on the node

function toggleClass(name) {
  return this.hasClass(name) ? this.removeClass(name) : this.addClass(name);
}
registerMethods('Dom', {
  classes: classes,
  hasClass: hasClass,
  addClass: addClass,
  removeClass: removeClass,
  toggleClass: toggleClass
});

var $forEach$1$1 = arrayIteration$1.forEach;


// `Array.prototype.forEach` method implementation
// https://tc39.github.io/ecma262/#sec-array.prototype.foreach
var arrayForEach$1 = sloppyArrayMethod('forEach') ? function forEach(callbackfn /* , thisArg */) {
  return $forEach$1$1(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
} : [].forEach;

// `Array.prototype.forEach` method
// https://tc39.github.io/ecma262/#sec-array.prototype.foreach
_export$1({ target: 'Array', proto: true, forced: [].forEach != arrayForEach$1 }, {
  forEach: arrayForEach$1
});

for (var COLLECTION_NAME$1$1 in domIterables$1) {
  var Collection$1$1 = global_1$1[COLLECTION_NAME$1$1];
  var CollectionPrototype$1$1 = Collection$1$1 && Collection$1$1.prototype;
  // some Chrome versions have non-configurable methods on DOMTokenList
  if (CollectionPrototype$1$1 && CollectionPrototype$1$1.forEach !== arrayForEach$1) try {
    createNonEnumerableProperty$1(CollectionPrototype$1$1, 'forEach', arrayForEach$1);
  } catch (error) {
    CollectionPrototype$1$1.forEach = arrayForEach$1;
  }
}

function css(style, val) {
  var ret = {};

  if (arguments.length === 0) {
    // get full style as object
    this.node.style.cssText.split(/\s*;\s*/).filter(function (el) {
      return !!el.length;
    }).forEach(function (el) {
      var t = el.split(/\s*:\s*/);
      ret[t[0]] = t[1];
    });
    return ret;
  }

  if (arguments.length < 2) {
    // get style properties in the array
    if (Array.isArray(style)) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = style[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var name = _step.value;
          var cased = camelCase(name);
          ret[cased] = this.node.style[cased];
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return ret;
    } // get style for property


    if (typeof style === 'string') {
      return this.node.style[camelCase(style)];
    } // set styles in object


    if (_typeof(style) === 'object') {
      for (var _name in style) {
        // set empty string if null/undefined/'' was given
        this.node.style[camelCase(_name)] = style[_name] == null || isBlank.test(style[_name]) ? '' : style[_name];
      }
    }
  } // set style for property


  if (arguments.length === 2) {
    this.node.style[camelCase(style)] = val == null || isBlank.test(val) ? '' : val;
  }

  return this;
} // Show element

function show() {
  return this.css('display', '');
} // Hide element

function hide() {
  return this.css('display', 'none');
} // Is element visible?

function visible() {
  return this.css('display') !== 'none';
}
registerMethods('Dom', {
  css: css,
  show: show,
  hide: hide,
  visible: visible
});

function data$1$1(a, v, r) {
  if (_typeof(a) === 'object') {
    for (v in a) {
      this.data(v, a[v]);
    }
  } else if (arguments.length < 2) {
    try {
      return JSON.parse(this.attr('data-' + a));
    } catch (e) {
      return this.attr('data-' + a);
    }
  } else {
    this.attr('data-' + a, v === null ? null : r === true || typeof v === 'string' || typeof v === 'number' ? v : JSON.stringify(v));
  }

  return this;
}
registerMethods('Dom', {
  data: data$1$1
});

function remember(k, v) {
  // remember every item in an object individually
  if (_typeof(arguments[0]) === 'object') {
    for (var key in k) {
      this.remember(key, k[key]);
    }
  } else if (arguments.length === 1) {
    // retrieve memory
    return this.memory()[k];
  } else {
    // store memory
    this.memory()[k] = v;
  }

  return this;
} // Erase a given memory

function forget() {
  if (arguments.length === 0) {
    this._memory = {};
  } else {
    for (var i = arguments.length - 1; i >= 0; i--) {
      delete this.memory()[arguments[i]];
    }
  }

  return this;
} // This triggers creation of a new hidden class which is not performant
// However, this function is not rarely used so it will not happen frequently
// Return local memory object

function memory() {
  return this._memory = this._memory || {};
}
registerMethods('Dom', {
  remember: remember,
  forget: forget,
  memory: memory
});

// `Array.prototype.{ reduce, reduceRight }` methods implementation
var createMethod$4 = function (IS_RIGHT) {
  return function (that, callbackfn, argumentsLength, memo) {
    aFunction$1$1(callbackfn);
    var O = toObject$1(that);
    var self = indexedObject$1(O);
    var length = toLength$1(O.length);
    var index = IS_RIGHT ? length - 1 : 0;
    var i = IS_RIGHT ? -1 : 1;
    if (argumentsLength < 2) while (true) {
      if (index in self) {
        memo = self[index];
        index += i;
        break;
      }
      index += i;
      if (IS_RIGHT ? index < 0 : length <= index) {
        throw TypeError('Reduce of empty array with no initial value');
      }
    }
    for (;IS_RIGHT ? index >= 0 : length > index; index += i) if (index in self) {
      memo = callbackfn(memo, self[index], index, O);
    }
    return memo;
  };
};

var arrayReduce$1 = {
  // `Array.prototype.reduce` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.reduce
  left: createMethod$4(false),
  // `Array.prototype.reduceRight` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.reduceright
  right: createMethod$4(true)
};

var $reduce$1 = arrayReduce$1.left;


// `Array.prototype.reduce` method
// https://tc39.github.io/ecma262/#sec-array.prototype.reduce
_export$1({ target: 'Array', proto: true, forced: sloppyArrayMethod('reduce') }, {
  reduce: function reduce(callbackfn /* , initialValue */) {
    return $reduce$1(this, callbackfn, arguments.length, arguments.length > 1 ? arguments[1] : undefined);
  }
});

var listenerId = 0;
var windowEvents = {};

function getEvents(instance) {
  var n = instance.getEventHolder(); // We dont want to save events in global space

  if (n === globals.window) n = windowEvents;
  if (!n.events) n.events = {};
  return n.events;
}

function getEventTarget(instance) {
  return instance.getEventTarget();
}

function clearEvents(instance) {
  var n = instance.getEventHolder();
  if (n.events) n.events = {};
} // Add event binder in the SVG namespace


function on(node, events, listener, binding, options) {
  var l = listener.bind(binding || node);
  var instance = makeInstance(node);
  var bag = getEvents(instance);
  var n = getEventTarget(instance); // events can be an array of events or a string of events

  events = Array.isArray(events) ? events : events.split(delimiter); // add id to listener

  if (!listener._svgjsListenerId) {
    listener._svgjsListenerId = ++listenerId;
  }

  events.forEach(function (event) {
    var ev = event.split('.')[0];
    var ns = event.split('.')[1] || '*'; // ensure valid object

    bag[ev] = bag[ev] || {};
    bag[ev][ns] = bag[ev][ns] || {}; // reference listener

    bag[ev][ns][listener._svgjsListenerId] = l; // add listener

    n.addEventListener(ev, l, options || false);
  });
} // Add event unbinder in the SVG namespace

function off(node, events, listener, options) {
  var instance = makeInstance(node);
  var bag = getEvents(instance);
  var n = getEventTarget(instance); // listener can be a function or a number

  if (typeof listener === 'function') {
    listener = listener._svgjsListenerId;
    if (!listener) return;
  } // events can be an array of events or a string or undefined


  events = Array.isArray(events) ? events : (events || '').split(delimiter);
  events.forEach(function (event) {
    var ev = event && event.split('.')[0];
    var ns = event && event.split('.')[1];
    var namespace, l;

    if (listener) {
      // remove listener reference
      if (bag[ev] && bag[ev][ns || '*']) {
        // removeListener
        n.removeEventListener(ev, bag[ev][ns || '*'][listener], options || false);
        delete bag[ev][ns || '*'][listener];
      }
    } else if (ev && ns) {
      // remove all listeners for a namespaced event
      if (bag[ev] && bag[ev][ns]) {
        for (l in bag[ev][ns]) {
          off(n, [ev, ns].join('.'), l);
        }

        delete bag[ev][ns];
      }
    } else if (ns) {
      // remove all listeners for a specific namespace
      for (event in bag) {
        for (namespace in bag[event]) {
          if (ns === namespace) {
            off(n, [event, ns].join('.'));
          }
        }
      }
    } else if (ev) {
      // remove all listeners for the event
      if (bag[ev]) {
        for (namespace in bag[ev]) {
          off(n, [ev, namespace].join('.'));
        }

        delete bag[ev];
      }
    } else {
      // remove all listeners on a given node
      for (event in bag) {
        off(n, event);
      }

      clearEvents(instance);
    }
  });
}
function dispatch(node, event, data) {
  var n = getEventTarget(node); // Dispatch event

  if (event instanceof globals.window.Event) {
    n.dispatchEvent(event);
  } else {
    event = new globals.window.CustomEvent(event, {
      detail: data,
      cancelable: true
    });
    n.dispatchEvent(event);
  }

  return event;
}

var IS_CONCAT_SPREADABLE = wellKnownSymbol$1('isConcatSpreadable');
var MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF;
var MAXIMUM_ALLOWED_INDEX_EXCEEDED = 'Maximum allowed index exceeded';

// We can't use this feature detection in V8 since it causes
// deoptimization and serious performance degradation
// https://github.com/zloirock/core-js/issues/679
var IS_CONCAT_SPREADABLE_SUPPORT = v8Version >= 51 || !fails$1(function () {
  var array = [];
  array[IS_CONCAT_SPREADABLE] = false;
  return array.concat()[0] !== array;
});

var SPECIES_SUPPORT = arrayMethodHasSpeciesSupport$1('concat');

var isConcatSpreadable = function (O) {
  if (!isObject$1(O)) return false;
  var spreadable = O[IS_CONCAT_SPREADABLE];
  return spreadable !== undefined ? !!spreadable : isArray$1(O);
};

var FORCED = !IS_CONCAT_SPREADABLE_SUPPORT || !SPECIES_SUPPORT;

// `Array.prototype.concat` method
// https://tc39.github.io/ecma262/#sec-array.prototype.concat
// with adding support of @@isConcatSpreadable and @@species
_export$1({ target: 'Array', proto: true, forced: FORCED }, {
  concat: function concat(arg) { // eslint-disable-line no-unused-vars
    var O = toObject$1(this);
    var A = arraySpeciesCreate$1(O, 0);
    var n = 0;
    var i, k, length, len, E;
    for (i = -1, length = arguments.length; i < length; i++) {
      E = i === -1 ? O : arguments[i];
      if (isConcatSpreadable(E)) {
        len = toLength$1(E.length);
        if (n + len > MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
        for (k = 0; k < len; k++, n++) if (k in E) createProperty$1(A, n, E[k]);
      } else {
        if (n >= MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
        createProperty$1(A, n++, E);
      }
    }
    A.length = n;
    return A;
  }
});

var $map$1 = arrayIteration$1.map;


// `Array.prototype.map` method
// https://tc39.github.io/ecma262/#sec-array.prototype.map
// with adding support of @@species
_export$1({ target: 'Array', proto: true, forced: !arrayMethodHasSpeciesSupport$1('map') }, {
  map: function map(callbackfn /* , thisArg */) {
    return $map$1(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

var DatePrototype = Date.prototype;
var INVALID_DATE = 'Invalid Date';
var TO_STRING = 'toString';
var nativeDateToString = DatePrototype[TO_STRING];
var getTime = DatePrototype.getTime;

// `Date.prototype.toString` method
// https://tc39.github.io/ecma262/#sec-date.prototype.tostring
if (new Date(NaN) + '' != INVALID_DATE) {
  redefine$1(DatePrototype, TO_STRING, function toString() {
    var value = getTime.call(this);
    // eslint-disable-next-line no-self-compare
    return value === value ? nativeDateToString.call(this) : INVALID_DATE;
  });
}

var trim = stringTrim.trim;


var nativeParseInt = global_1$1.parseInt;
var hex$1 = /^[+-]?0[Xx]/;
var FORCED$1 = nativeParseInt(whitespaces + '08') !== 8 || nativeParseInt(whitespaces + '0x16') !== 22;

// `parseInt` method
// https://tc39.github.io/ecma262/#sec-parseint-string-radix
var _parseInt = FORCED$1 ? function parseInt(string, radix) {
  var S = trim(String(string));
  return nativeParseInt(S, (radix >>> 0) || (hex$1.test(S) ? 16 : 10));
} : nativeParseInt;

// `parseInt` method
// https://tc39.github.io/ecma262/#sec-parseint-string-radix
_export$1({ global: true, forced: parseInt != _parseInt }, {
  parseInt: _parseInt
});

var TO_STRING$1 = 'toString';
var RegExpPrototype = RegExp.prototype;
var nativeToString = RegExpPrototype[TO_STRING$1];

var NOT_GENERIC = fails$1(function () { return nativeToString.call({ source: 'a', flags: 'b' }) != '/a/b'; });
// FF44- RegExp#toString has a wrong name
var INCORRECT_NAME = nativeToString.name != TO_STRING$1;

// `RegExp.prototype.toString` method
// https://tc39.github.io/ecma262/#sec-regexp.prototype.tostring
if (NOT_GENERIC || INCORRECT_NAME) {
  redefine$1(RegExp.prototype, TO_STRING$1, function toString() {
    var R = anObject$1(this);
    var p = String(R.source);
    var rf = R.flags;
    var f = String(rf === undefined && R instanceof RegExp && !('flags' in RegExpPrototype) ? regexpFlags.call(R) : rf);
    return '/' + p + '/' + f;
  }, { unsafe: true });
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
    return;
  }

  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
}

function _defineProperties$1(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass$1(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties$1(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties$1(Constructor, staticProps);
  return Constructor;
}

function sixDigitHex(hex) {
  return hex.length === 4 ? ['#', hex.substring(1, 2), hex.substring(1, 2), hex.substring(2, 3), hex.substring(2, 3), hex.substring(3, 4), hex.substring(3, 4)].join('') : hex;
}

function componentHex(component) {
  var integer = Math.round(component);
  var bounded = Math.max(0, Math.min(255, integer));
  var hex = bounded.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

function is(object, space) {
  for (var i = space.length; i--;) {
    if (object[space[i]] == null) {
      return false;
    }
  }

  return true;
}

function getParameters(a, b) {
  var params = is(a, 'rgb') ? {
    _a: a.r,
    _b: a.g,
    _c: a.b,
    space: 'rgb'
  } : is(a, 'xyz') ? {
    _a: a.x,
    _b: a.y,
    _c: a.z,
    _d: 0,
    space: 'xyz'
  } : is(a, 'hsl') ? {
    _a: a.h,
    _b: a.s,
    _c: a.l,
    _d: 0,
    space: 'hsl'
  } : is(a, 'lab') ? {
    _a: a.l,
    _b: a.a,
    _c: a.b,
    _d: 0,
    space: 'lab'
  } : is(a, 'lch') ? {
    _a: a.l,
    _b: a.c,
    _c: a.h,
    _d: 0,
    space: 'lch'
  } : is(a, 'cmyk') ? {
    _a: a.c,
    _b: a.m,
    _c: a.y,
    _d: a.k,
    space: 'cmyk'
  } : {
    _a: 0,
    _b: 0,
    _c: 0,
    space: 'rgb'
  };
  params.space = b || params.space;
  return params;
}

function cieSpace(space) {
  if (space === 'lab' || space === 'xyz' || space === 'lch') {
    return true;
  } else {
    return false;
  }
}

function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

var Color =
/*#__PURE__*/
function () {
  function Color() {
    _classCallCheck$1(this, Color);

    this.init.apply(this, arguments);
  }

  _createClass$1(Color, [{
    key: "init",
    value: function init() {
      var a = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var b = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var c = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var d = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var space = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 'rgb';
      // This catches the case when a falsy value is passed like ''
      a = !a ? 0 : a; // Reset all values in case the init function is rerun with new color space

      if (this.space) {
        for (var component in this.space) {
          delete this[this.space[component]];
        }
      }

      if (typeof a === 'number') {
        // Allow for the case that we don't need d...
        space = typeof d === 'string' ? d : space;
        d = typeof d === 'string' ? 0 : d; // Assign the values straight to the color

        Object.assign(this, {
          _a: a,
          _b: b,
          _c: c,
          _d: d,
          space: space
        }); // If the user gave us an array, make the color from it
      } else if (a instanceof Array) {
        this.space = b || (typeof a[3] === 'string' ? a[3] : a[4]) || 'rgb';
        Object.assign(this, {
          _a: a[0],
          _b: a[1],
          _c: a[2],
          _d: a[3] || 0
        });
      } else if (a instanceof Object) {
        // Set the object up and assign its values directly
        var values = getParameters(a, b);
        Object.assign(this, values);
      } else if (typeof a === 'string') {
        if (isRgb.test(a)) {
          var noWhitespace = a.replace(whitespace$1, '');

          var _rgb$exec$slice$map = rgb.exec(noWhitespace).slice(1, 4).map(function (v) {
            return parseInt(v);
          }),
              _rgb$exec$slice$map2 = _slicedToArray(_rgb$exec$slice$map, 3),
              _a2 = _rgb$exec$slice$map2[0],
              _b2 = _rgb$exec$slice$map2[1],
              _c2 = _rgb$exec$slice$map2[2];

          Object.assign(this, {
            _a: _a2,
            _b: _b2,
            _c: _c2,
            _d: 0,
            space: 'rgb'
          });
        } else if (isHex.test(a)) {
          var hexParse = function hexParse(v) {
            return parseInt(v, 16);
          };

          var _hex$exec$map = hex.exec(sixDigitHex(a)).map(hexParse),
              _hex$exec$map2 = _slicedToArray(_hex$exec$map, 4),
              _a3 = _hex$exec$map2[1],
              _b3 = _hex$exec$map2[2],
              _c3 = _hex$exec$map2[3];

          Object.assign(this, {
            _a: _a3,
            _b: _b3,
            _c: _c3,
            _d: 0,
            space: 'rgb'
          });
        } else throw Error('Unsupported string format, can\'t construct Color');
      } // Now add the components as a convenience


      var _a = this._a,
          _b = this._b,
          _c = this._c,
          _d = this._d;
      var components = this.space === 'rgb' ? {
        r: _a,
        g: _b,
        b: _c
      } : this.space === 'xyz' ? {
        x: _a,
        y: _b,
        z: _c
      } : this.space === 'hsl' ? {
        h: _a,
        s: _b,
        l: _c
      } : this.space === 'lab' ? {
        l: _a,
        a: _b,
        b: _c
      } : this.space === 'lch' ? {
        l: _a,
        c: _b,
        h: _c
      } : this.space === 'cmyk' ? {
        c: _a,
        m: _b,
        y: _c,
        k: _d
      } : {};
      Object.assign(this, components);
    }
    /*
    Conversion Methods
    */

  }, {
    key: "rgb",
    value: function rgb() {
      if (this.space === 'rgb') {
        return this;
      } else if (cieSpace(this.space)) {
        // Convert to the xyz color space
        var x = this.x,
            y = this.y,
            z = this.z;

        if (this.space === 'lab' || this.space === 'lch') {
          // Get the values in the lab space
          var l = this.l,
              a = this.a,
              _b4 = this.b;

          if (this.space === 'lch') {
            var c = this.c,
                h = this.h;
            var dToR = Math.PI / 180;
            a = c * Math.cos(dToR * h);
            _b4 = c * Math.sin(dToR * h);
          } // Undo the nonlinear function


          var yL = (l + 16) / 116;
          var xL = a / 500 + yL;
          var zL = yL - _b4 / 200; // Get the xyz values

          var ct = 16 / 116;
          var mx = 0.008856;
          var nm = 7.787;
          x = 0.95047 * (Math.pow(xL, 3) > mx ? Math.pow(xL, 3) : (xL - ct) / nm);
          y = 1.00000 * (Math.pow(yL, 3) > mx ? Math.pow(yL, 3) : (yL - ct) / nm);
          z = 1.08883 * (Math.pow(zL, 3) > mx ? Math.pow(zL, 3) : (zL - ct) / nm);
        } // Convert xyz to unbounded rgb values


        var rU = x * 3.2406 + y * -1.5372 + z * -0.4986;
        var gU = x * -0.9689 + y * 1.8758 + z * 0.0415;
        var bU = x * 0.0557 + y * -0.2040 + z * 1.0570; // Convert the values to true rgb values

        var pow = Math.pow;
        var bd = 0.0031308;
        var r = rU > bd ? 1.055 * pow(rU, 1 / 2.4) - 0.055 : 12.92 * rU;
        var g = gU > bd ? 1.055 * pow(gU, 1 / 2.4) - 0.055 : 12.92 * gU;
        var b = bU > bd ? 1.055 * pow(bU, 1 / 2.4) - 0.055 : 12.92 * bU; // Make and return the color

        var color = new Color(255 * r, 255 * g, 255 * b);
        return color;
      } else if (this.space === 'hsl') {
        // https://bgrins.github.io/TinyColor/docs/tinycolor.html
        // Get the current hsl values
        var _h = this.h,
            s = this.s,
            _l = this.l;
        _h /= 360;
        s /= 100;
        _l /= 100; // If we are grey, then just make the color directly

        if (s === 0) {
          _l *= 255;

          var _color2 = new Color(_l, _l, _l);

          return _color2;
        } // TODO I have no idea what this does :D If you figure it out, tell me!


        var q = _l < 0.5 ? _l * (1 + s) : _l + s - _l * s;
        var p = 2 * _l - q; // Get the rgb values

        var _r = 255 * hueToRgb(p, q, _h + 1 / 3);

        var _g = 255 * hueToRgb(p, q, _h);

        var _b5 = 255 * hueToRgb(p, q, _h - 1 / 3); // Make a new color


        var _color = new Color(_r, _g, _b5);

        return _color;
      } else if (this.space === 'cmyk') {
        // https://gist.github.com/felipesabino/5066336
        // Get the normalised cmyk values
        var _c4 = this.c,
            m = this.m,
            _y = this.y,
            k = this.k; // Get the rgb values

        var _r2 = 255 * (1 - Math.min(1, _c4 * (1 - k) + k));

        var _g2 = 255 * (1 - Math.min(1, m * (1 - k) + k));

        var _b6 = 255 * (1 - Math.min(1, _y * (1 - k) + k)); // Form the color and return it


        var _color3 = new Color(_r2, _g2, _b6);

        return _color3;
      } else {
        return this;
      }
    }
  }, {
    key: "lab",
    value: function lab() {
      // Get the xyz color
      var _this$xyz = this.xyz(),
          x = _this$xyz.x,
          y = _this$xyz.y,
          z = _this$xyz.z; // Get the lab components


      var l = 116 * y - 16;
      var a = 500 * (x - y);
      var b = 200 * (y - z); // Construct and return a new color

      var color = new Color(l, a, b, 'lab');
      return color;
    }
  }, {
    key: "xyz",
    value: function xyz() {
      // Normalise the red, green and blue values
      var _this$rgb = this.rgb(),
          r255 = _this$rgb._a,
          g255 = _this$rgb._b,
          b255 = _this$rgb._c;

      var _map = [r255, g255, b255].map(function (v) {
        return v / 255;
      }),
          _map2 = _slicedToArray(_map, 3),
          r = _map2[0],
          g = _map2[1],
          b = _map2[2]; // Convert to the lab rgb space


      var rL = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
      var gL = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
      var bL = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92; // Convert to the xyz color space without bounding the values

      var xU = (rL * 0.4124 + gL * 0.3576 + bL * 0.1805) / 0.95047;
      var yU = (rL * 0.2126 + gL * 0.7152 + bL * 0.0722) / 1.00000;
      var zU = (rL * 0.0193 + gL * 0.1192 + bL * 0.9505) / 1.08883; // Get the proper xyz values by applying the bounding

      var x = xU > 0.008856 ? Math.pow(xU, 1 / 3) : 7.787 * xU + 16 / 116;
      var y = yU > 0.008856 ? Math.pow(yU, 1 / 3) : 7.787 * yU + 16 / 116;
      var z = zU > 0.008856 ? Math.pow(zU, 1 / 3) : 7.787 * zU + 16 / 116; // Make and return the color

      var color = new Color(x, y, z, 'xyz');
      return color;
    }
  }, {
    key: "lch",
    value: function lch() {
      // Get the lab color directly
      var _this$lab = this.lab(),
          l = _this$lab.l,
          a = _this$lab.a,
          b = _this$lab.b; // Get the chromaticity and the hue using polar coordinates


      var c = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
      var h = 180 * Math.atan2(b, a) / Math.PI;

      if (h < 0) {
        h *= -1;
        h = 360 - h;
      } // Make a new color and return it


      var color = new Color(l, c, h, 'lch');
      return color;
    }
  }, {
    key: "hsl",
    value: function hsl() {
      // Get the rgb values
      var _this$rgb2 = this.rgb(),
          _a = _this$rgb2._a,
          _b = _this$rgb2._b,
          _c = _this$rgb2._c;

      var _map3 = [_a, _b, _c].map(function (v) {
        return v / 255;
      }),
          _map4 = _slicedToArray(_map3, 3),
          r = _map4[0],
          g = _map4[1],
          b = _map4[2]; // Find the maximum and minimum values to get the lightness


      var max = Math.max(r, g, b);
      var min = Math.min(r, g, b);
      var l = (max + min) / 2; // If the r, g, v values are identical then we are grey

      var isGrey = max === min; // Calculate the hue and saturation

      var delta = max - min;
      var s = isGrey ? 0 : l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
      var h = isGrey ? 0 : max === r ? ((g - b) / delta + (g < b ? 6 : 0)) / 6 : max === g ? ((b - r) / delta + 2) / 6 : max === b ? ((r - g) / delta + 4) / 6 : 0; // Construct and return the new color

      var color = new Color(360 * h, 100 * s, 100 * l, 'hsl');
      return color;
    }
  }, {
    key: "cmyk",
    value: function cmyk() {
      // Get the rgb values for the current color
      var _this$rgb3 = this.rgb(),
          _a = _this$rgb3._a,
          _b = _this$rgb3._b,
          _c = _this$rgb3._c;

      var _map5 = [_a, _b, _c].map(function (v) {
        return v / 255;
      }),
          _map6 = _slicedToArray(_map5, 3),
          r = _map6[0],
          g = _map6[1],
          b = _map6[2]; // Get the cmyk values in an unbounded format


      var k = Math.min(1 - r, 1 - g, 1 - b);

      if (k === 1) {
        // Catch the black case
        return new Color(0, 0, 0, 1, 'cmyk');
      }

      var c = (1 - r - k) / (1 - k);
      var m = (1 - g - k) / (1 - k);
      var y = (1 - b - k) / (1 - k); // Construct the new color

      var color = new Color(c, m, y, k, 'cmyk');
      return color;
    }
    /*
    Input and Output methods
    */

  }, {
    key: "_clamped",
    value: function _clamped() {
      var _this$rgb4 = this.rgb(),
          _a = _this$rgb4._a,
          _b = _this$rgb4._b,
          _c = _this$rgb4._c;

      var max = Math.max,
          min = Math.min,
          round = Math.round;

      var format = function format(v) {
        return max(0, min(round(v), 255));
      };

      return [_a, _b, _c].map(format);
    }
  }, {
    key: "toHex",
    value: function toHex() {
      var _this$_clamped$map = this._clamped().map(componentHex),
          _this$_clamped$map2 = _slicedToArray(_this$_clamped$map, 3),
          r = _this$_clamped$map2[0],
          g = _this$_clamped$map2[1],
          b = _this$_clamped$map2[2];

      return "#".concat(r).concat(g).concat(b);
    }
  }, {
    key: "toString",
    value: function toString() {
      return this.toHex();
    }
  }, {
    key: "toRgb",
    value: function toRgb() {
      var _this$_clamped = this._clamped(),
          _this$_clamped2 = _slicedToArray(_this$_clamped, 3),
          rV = _this$_clamped2[0],
          gV = _this$_clamped2[1],
          bV = _this$_clamped2[2];

      var string = "rgb(".concat(rV, ",").concat(gV, ",").concat(bV, ")");
      return string;
    }
  }, {
    key: "toArray",
    value: function toArray() {
      var _a = this._a,
          _b = this._b,
          _c = this._c,
          _d = this._d,
          space = this.space;
      return [_a, _b, _c, _d, space];
    }
    /*
    Generating random colors
    */

  }], [{
    key: "random",
    value: function random() {
      var mode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'vibrant';
      var t = arguments.length > 1 ? arguments[1] : undefined;
      // Get the math modules
      var random = Math.random,
          round = Math.round,
          sin = Math.sin,
          pi = Math.PI; // Run the correct generator

      if (mode === 'vibrant') {
        var l = (81 - 57) * random() + 57;
        var c = (83 - 45) * random() + 45;
        var h = 360 * random();
        var color = new Color(l, c, h, 'lch');
        return color;
      } else if (mode === 'sine') {
        t = t == null ? random() : t;
        var r = round(80 * sin(2 * pi * t / 0.5 + 0.01) + 150);
        var g = round(50 * sin(2 * pi * t / 0.5 + 4.6) + 200);
        var b = round(100 * sin(2 * pi * t / 0.5 + 2.3) + 150);

        var _color4 = new Color(r, g, b);

        return _color4;
      } else if (mode === 'pastel') {
        var _l2 = (94 - 86) * random() + 86;

        var _c5 = (26 - 9) * random() + 9;

        var _h2 = 360 * random();

        var _color5 = new Color(_l2, _c5, _h2, 'lch');

        return _color5;
      } else if (mode === 'dark') {
        var _l3 = 10 + 10 * random();

        var _c6 = (125 - 75) * random() + 86;

        var _h3 = 360 * random();

        var _color6 = new Color(_l3, _c6, _h3, 'lch');

        return _color6;
      } else if (mode === 'rgb') {
        var _r3 = 255 * random();

        var _g3 = 255 * random();

        var _b7 = 255 * random();

        var _color7 = new Color(_r3, _g3, _b7);

        return _color7;
      } else if (mode === 'lab') {
        var _l4 = 100 * random();

        var a = 256 * random() - 128;

        var _b8 = 256 * random() - 128;

        var _color8 = new Color(_l4, a, _b8, 'lab');

        return _color8;
      } else if (mode === 'grey') {
        var grey = 255 * random();

        var _color9 = new Color(grey, grey, grey);

        return _color9;
      }
    }
    /*
    Constructing colors
    */
    // Test if given value is a color string

  }, {
    key: "test",
    value: function test(color) {
      return typeof color === 'string' && (isHex.test(color) || isRgb.test(color));
    } // Test if given value is an rgb object

  }, {
    key: "isRgb",
    value: function isRgb(color) {
      return color && typeof color.r === 'number' && typeof color.g === 'number' && typeof color.b === 'number';
    } // Test if given value is a color

  }, {
    key: "isColor",
    value: function isColor(color) {
      return color && (color instanceof Color || this.isRgb(color) || this.test(color));
    }
  }]);

  return Color;
}();

var FAILS_ON_PRIMITIVES$1 = fails$1(function () { objectKeys(1); });

// `Object.keys` method
// https://tc39.github.io/ecma262/#sec-object.keys
_export$1({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES$1 }, {
  keys: function keys(it) {
    return objectKeys(toObject$1(it));
  }
});

// @@match logic
fixRegexpWellKnownSymbolLogic('match', 1, function (MATCH, nativeMatch, maybeCallNative) {
  return [
    // `String.prototype.match` method
    // https://tc39.github.io/ecma262/#sec-string.prototype.match
    function match(regexp) {
      var O = requireObjectCoercible$1(this);
      var matcher = regexp == undefined ? undefined : regexp[MATCH];
      return matcher !== undefined ? matcher.call(regexp, O) : new RegExp(regexp)[MATCH](String(O));
    },
    // `RegExp.prototype[@@match]` method
    // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@match
    function (regexp) {
      var res = maybeCallNative(nativeMatch, regexp, this);
      if (res.done) return res.value;

      var rx = anObject$1(regexp);
      var S = String(this);

      if (!rx.global) return regexpExecAbstract(rx, S);

      var fullUnicode = rx.unicode;
      rx.lastIndex = 0;
      var A = [];
      var n = 0;
      var result;
      while ((result = regexpExecAbstract(rx, S)) !== null) {
        var matchStr = String(result[0]);
        A[n] = matchStr;
        if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength$1(rx.lastIndex), fullUnicode);
        n++;
      }
      return n === 0 ? null : A;
    }
  ];
});

function _assertThisInitialized$1(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _possibleConstructorReturn$1(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized$1(self);
}

function _getPrototypeOf$1(o) {
  _getPrototypeOf$1 = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf$1(o);
}

function _superPropBase(object, property) {
  while (!Object.prototype.hasOwnProperty.call(object, property)) {
    object = _getPrototypeOf$1(object);
    if (object === null) break;
  }

  return object;
}

function _get(target, property, receiver) {
  if (typeof Reflect !== "undefined" && Reflect.get) {
    _get = Reflect.get;
  } else {
    _get = function _get(target, property, receiver) {
      var base = _superPropBase(target, property);
      if (!base) return;
      var desc = Object.getOwnPropertyDescriptor(base, property);

      if (desc.get) {
        return desc.get.call(receiver);
      }

      return desc.value;
    };
  }

  return _get(target, property, receiver || target);
}

function _setPrototypeOf$1(o, p) {
  _setPrototypeOf$1 = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf$1(o, p);
}

function _inherits$1(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf$1(subClass, superClass);
}

var getOwnPropertyNames = objectGetOwnPropertyNames$1.f;
var getOwnPropertyDescriptor$2$1 = objectGetOwnPropertyDescriptor$1.f;
var defineProperty$5 = objectDefineProperty$1.f;
var trim$1 = stringTrim.trim;

var NUMBER = 'Number';
var NativeNumber = global_1$1[NUMBER];
var NumberPrototype = NativeNumber.prototype;

// Opera ~12 has broken Object#toString
var BROKEN_CLASSOF = classofRaw$1(objectCreate(NumberPrototype)) == NUMBER;

// `ToNumber` abstract operation
// https://tc39.github.io/ecma262/#sec-tonumber
var toNumber = function (argument) {
  var it = toPrimitive$1(argument, false);
  var first, third, radix, maxCode, digits, length, index, code;
  if (typeof it == 'string' && it.length > 2) {
    it = trim$1(it);
    first = it.charCodeAt(0);
    if (first === 43 || first === 45) {
      third = it.charCodeAt(2);
      if (third === 88 || third === 120) return NaN; // Number('+0x1') should be NaN, old V8 fix
    } else if (first === 48) {
      switch (it.charCodeAt(1)) {
        case 66: case 98: radix = 2; maxCode = 49; break; // fast equal of /^0b[01]+$/i
        case 79: case 111: radix = 8; maxCode = 55; break; // fast equal of /^0o[0-7]+$/i
        default: return +it;
      }
      digits = it.slice(2);
      length = digits.length;
      for (index = 0; index < length; index++) {
        code = digits.charCodeAt(index);
        // parseInt parses a string to a first unavailable symbol
        // but ToNumber should return NaN if a string contains unavailable symbols
        if (code < 48 || code > maxCode) return NaN;
      } return parseInt(digits, radix);
    }
  } return +it;
};

// `Number` constructor
// https://tc39.github.io/ecma262/#sec-number-constructor
if (isForced_1$1(NUMBER, !NativeNumber(' 0o1') || !NativeNumber('0b1') || NativeNumber('+0x1'))) {
  var NumberWrapper = function Number(value) {
    var it = arguments.length < 1 ? 0 : value;
    var dummy = this;
    return dummy instanceof NumberWrapper
      // check on 1..constructor(foo) case
      && (BROKEN_CLASSOF ? fails$1(function () { NumberPrototype.valueOf.call(dummy); }) : classofRaw$1(dummy) != NUMBER)
        ? inheritIfRequired(new NativeNumber(toNumber(it)), dummy, NumberWrapper) : toNumber(it);
  };
  for (var keys$1$1 = descriptors$1 ? getOwnPropertyNames(NativeNumber) : (
    // ES3:
    'MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,' +
    // ES2015 (in case, if modules with ES2015 Number statics required before):
    'EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,' +
    'MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger'
  ).split(','), j = 0, key; keys$1$1.length > j; j++) {
    if (has$2(NativeNumber, key = keys$1$1[j]) && !has$2(NumberWrapper, key)) {
      defineProperty$5(NumberWrapper, key, getOwnPropertyDescriptor$2$1(NativeNumber, key));
    }
  }
  NumberWrapper.prototype = NumberPrototype;
  NumberPrototype.constructor = NumberWrapper;
  redefine$1(global_1$1, NUMBER, NumberWrapper);
}

var trim$2 = stringTrim.trim;


var nativeParseFloat = global_1$1.parseFloat;
var FORCED$2 = 1 / nativeParseFloat(whitespaces + '-0') !== -Infinity;

// `parseFloat` method
// https://tc39.github.io/ecma262/#sec-parsefloat-string
var _parseFloat = FORCED$2 ? function parseFloat(string) {
  var trimmedString = trim$2(String(string));
  var result = nativeParseFloat(trimmedString);
  return result === 0 && trimmedString.charAt(0) == '-' ? -0 : result;
} : nativeParseFloat;

// `parseFloat` method
// https://tc39.github.io/ecma262/#sec-parsefloat-string
_export$1({ global: true, forced: parseFloat != _parseFloat }, {
  parseFloat: _parseFloat
});

var Point$1 =
/*#__PURE__*/
function () {
  // Initialize
  function Point() {
    _classCallCheck$1(this, Point);

    this.init.apply(this, arguments);
  }

  _createClass$1(Point, [{
    key: "init",
    value: function init(x, y) {
      var base = {
        x: 0,
        y: 0
      }; // ensure source as object

      var source = Array.isArray(x) ? {
        x: x[0],
        y: x[1]
      } : _typeof(x) === 'object' ? {
        x: x.x,
        y: x.y
      } : {
        x: x,
        y: y
      }; // merge source

      this.x = source.x == null ? base.x : source.x;
      this.y = source.y == null ? base.y : source.y;
      return this;
    } // Clone point

  }, {
    key: "clone",
    value: function clone() {
      return new Point(this);
    }
  }, {
    key: "transform",
    value: function transform(m) {
      return this.clone().transformO(m);
    } // Transform point with matrix

  }, {
    key: "transformO",
    value: function transformO(m) {
      if (!Matrix.isMatrixLike(m)) {
        m = new Matrix(m);
      }

      var x = this.x,
          y = this.y; // Perform the matrix multiplication

      this.x = m.a * x + m.c * y + m.e;
      this.y = m.b * x + m.d * y + m.f;
      return this;
    }
  }, {
    key: "toArray",
    value: function toArray() {
      return [this.x, this.y];
    }
  }]);

  return Point;
}();
function point(x, y) {
  return new Point$1(x, y).transform(this.screenCTM().inverse());
}

function closeEnough(a, b, threshold) {
  return Math.abs(b - a) < (threshold || 1e-6);
}

var Matrix =
/*#__PURE__*/
function () {
  function Matrix() {
    _classCallCheck$1(this, Matrix);

    this.init.apply(this, arguments);
  } // Initialize


  _createClass$1(Matrix, [{
    key: "init",
    value: function init(source) {
      var base = Matrix.fromArray([1, 0, 0, 1, 0, 0]); // ensure source as object

      source = source instanceof Element ? source.matrixify() : typeof source === 'string' ? Matrix.fromArray(source.split(delimiter).map(parseFloat)) : Array.isArray(source) ? Matrix.fromArray(source) : _typeof(source) === 'object' && Matrix.isMatrixLike(source) ? source : _typeof(source) === 'object' ? new Matrix().transform(source) : arguments.length === 6 ? Matrix.fromArray([].slice.call(arguments)) : base; // Merge the source matrix with the base matrix

      this.a = source.a != null ? source.a : base.a;
      this.b = source.b != null ? source.b : base.b;
      this.c = source.c != null ? source.c : base.c;
      this.d = source.d != null ? source.d : base.d;
      this.e = source.e != null ? source.e : base.e;
      this.f = source.f != null ? source.f : base.f;
      return this;
    } // Clones this matrix

  }, {
    key: "clone",
    value: function clone() {
      return new Matrix(this);
    } // Transform a matrix into another matrix by manipulating the space

  }, {
    key: "transform",
    value: function transform(o) {
      // Check if o is a matrix and then left multiply it directly
      if (Matrix.isMatrixLike(o)) {
        var matrix = new Matrix(o);
        return matrix.multiplyO(this);
      } // Get the proposed transformations and the current transformations


      var t = Matrix.formatTransforms(o);
      var current = this;

      var _transform = new Point$1(t.ox, t.oy).transform(current),
          ox = _transform.x,
          oy = _transform.y; // Construct the resulting matrix


      var transformer = new Matrix().translateO(t.rx, t.ry).lmultiplyO(current).translateO(-ox, -oy).scaleO(t.scaleX, t.scaleY).skewO(t.skewX, t.skewY).shearO(t.shear).rotateO(t.theta).translateO(ox, oy); // If we want the origin at a particular place, we force it there

      if (isFinite(t.px) || isFinite(t.py)) {
        var origin = new Point$1(ox, oy).transform(transformer); // TODO: Replace t.px with isFinite(t.px)

        var dx = t.px ? t.px - origin.x : 0;
        var dy = t.py ? t.py - origin.y : 0;
        transformer.translateO(dx, dy);
      } // Translate now after positioning


      transformer.translateO(t.tx, t.ty);
      return transformer;
    } // Applies a matrix defined by its affine parameters

  }, {
    key: "compose",
    value: function compose(o) {
      if (o.origin) {
        o.originX = o.origin[0];
        o.originY = o.origin[1];
      } // Get the parameters


      var ox = o.originX || 0;
      var oy = o.originY || 0;
      var sx = o.scaleX || 1;
      var sy = o.scaleY || 1;
      var lam = o.shear || 0;
      var theta = o.rotate || 0;
      var tx = o.translateX || 0;
      var ty = o.translateY || 0; // Apply the standard matrix

      var result = new Matrix().translateO(-ox, -oy).scaleO(sx, sy).shearO(lam).rotateO(theta).translateO(tx, ty).lmultiplyO(this).translateO(ox, oy);
      return result;
    } // Decomposes this matrix into its affine parameters

  }, {
    key: "decompose",
    value: function decompose() {
      var cx = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var cy = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      // Get the parameters from the matrix
      var a = this.a;
      var b = this.b;
      var c = this.c;
      var d = this.d;
      var e = this.e;
      var f = this.f; // Figure out if the winding direction is clockwise or counterclockwise

      var determinant = a * d - b * c;
      var ccw = determinant > 0 ? 1 : -1; // Since we only shear in x, we can use the x basis to get the x scale
      // and the rotation of the resulting matrix

      var sx = ccw * Math.sqrt(a * a + b * b);
      var thetaRad = Math.atan2(ccw * b, ccw * a);
      var theta = 180 / Math.PI * thetaRad;
      var ct = Math.cos(thetaRad);
      var st = Math.sin(thetaRad); // We can then solve the y basis vector simultaneously to get the other
      // two affine parameters directly from these parameters

      var lam = (a * c + b * d) / determinant;
      var sy = c * sx / (lam * a - b) || d * sx / (lam * b + a); // Use the translations

      var tx = e - cx + cx * ct * sx + cy * (lam * ct * sx - st * sy);
      var ty = f - cy + cx * st * sx + cy * (lam * st * sx + ct * sy); // Construct the decomposition and return it

      return {
        // Return the affine parameters
        scaleX: sx,
        scaleY: sy,
        shear: lam,
        rotate: theta,
        translateX: tx,
        translateY: ty,
        originX: cx,
        originY: cy,
        // Return the matrix parameters
        a: this.a,
        b: this.b,
        c: this.c,
        d: this.d,
        e: this.e,
        f: this.f
      };
    } // Left multiplies by the given matrix

  }, {
    key: "multiply",
    value: function multiply(matrix) {
      return this.clone().multiplyO(matrix);
    }
  }, {
    key: "multiplyO",
    value: function multiplyO(matrix) {
      // Get the matrices
      var l = this;
      var r = matrix instanceof Matrix ? matrix : new Matrix(matrix);
      return Matrix.matrixMultiply(l, r, this);
    }
  }, {
    key: "lmultiply",
    value: function lmultiply(matrix) {
      return this.clone().lmultiplyO(matrix);
    }
  }, {
    key: "lmultiplyO",
    value: function lmultiplyO(matrix) {
      var r = this;
      var l = matrix instanceof Matrix ? matrix : new Matrix(matrix);
      return Matrix.matrixMultiply(l, r, this);
    } // Inverses matrix

  }, {
    key: "inverseO",
    value: function inverseO() {
      // Get the current parameters out of the matrix
      var a = this.a;
      var b = this.b;
      var c = this.c;
      var d = this.d;
      var e = this.e;
      var f = this.f; // Invert the 2x2 matrix in the top left

      var det = a * d - b * c;
      if (!det) throw new Error('Cannot invert ' + this); // Calculate the top 2x2 matrix

      var na = d / det;
      var nb = -b / det;
      var nc = -c / det;
      var nd = a / det; // Apply the inverted matrix to the top right

      var ne = -(na * e + nc * f);
      var nf = -(nb * e + nd * f); // Construct the inverted matrix

      this.a = na;
      this.b = nb;
      this.c = nc;
      this.d = nd;
      this.e = ne;
      this.f = nf;
      return this;
    }
  }, {
    key: "inverse",
    value: function inverse() {
      return this.clone().inverseO();
    } // Translate matrix

  }, {
    key: "translate",
    value: function translate(x, y) {
      return this.clone().translateO(x, y);
    }
  }, {
    key: "translateO",
    value: function translateO(x, y) {
      this.e += x || 0;
      this.f += y || 0;
      return this;
    } // Scale matrix

  }, {
    key: "scale",
    value: function scale(x, y, cx, cy) {
      var _this$clone;

      return (_this$clone = this.clone()).scaleO.apply(_this$clone, arguments);
    }
  }, {
    key: "scaleO",
    value: function scaleO(x) {
      var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : x;
      var cx = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var cy = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

      // Support uniform scaling
      if (arguments.length === 3) {
        cy = cx;
        cx = y;
        y = x;
      }

      var a = this.a,
          b = this.b,
          c = this.c,
          d = this.d,
          e = this.e,
          f = this.f;
      this.a = a * x;
      this.b = b * y;
      this.c = c * x;
      this.d = d * y;
      this.e = e * x - cx * x + cx;
      this.f = f * y - cy * y + cy;
      return this;
    } // Rotate matrix

  }, {
    key: "rotate",
    value: function rotate(r, cx, cy) {
      return this.clone().rotateO(r, cx, cy);
    }
  }, {
    key: "rotateO",
    value: function rotateO(r) {
      var cx = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var cy = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      // Convert degrees to radians
      r = radians(r);
      var cos = Math.cos(r);
      var sin = Math.sin(r);
      var a = this.a,
          b = this.b,
          c = this.c,
          d = this.d,
          e = this.e,
          f = this.f;
      this.a = a * cos - b * sin;
      this.b = b * cos + a * sin;
      this.c = c * cos - d * sin;
      this.d = d * cos + c * sin;
      this.e = e * cos - f * sin + cy * sin - cx * cos + cx;
      this.f = f * cos + e * sin - cx * sin - cy * cos + cy;
      return this;
    } // Flip matrix on x or y, at a given offset

  }, {
    key: "flip",
    value: function flip(axis, around) {
      return this.clone().flipO(axis, around);
    }
  }, {
    key: "flipO",
    value: function flipO(axis, around) {
      return axis === 'x' ? this.scaleO(-1, 1, around, 0) : axis === 'y' ? this.scaleO(1, -1, 0, around) : this.scaleO(-1, -1, axis, around || axis); // Define an x, y flip point
    } // Shear matrix

  }, {
    key: "shear",
    value: function shear(a, cx, cy) {
      return this.clone().shearO(a, cx, cy);
    }
  }, {
    key: "shearO",
    value: function shearO(lx) {
      var cy = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var a = this.a,
          b = this.b,
          c = this.c,
          d = this.d,
          e = this.e,
          f = this.f;
      this.a = a + b * lx;
      this.c = c + d * lx;
      this.e = e + f * lx - cy * lx;
      return this;
    } // Skew Matrix

  }, {
    key: "skew",
    value: function skew(x, y, cx, cy) {
      var _this$clone2;

      return (_this$clone2 = this.clone()).skewO.apply(_this$clone2, arguments);
    }
  }, {
    key: "skewO",
    value: function skewO(x) {
      var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : x;
      var cx = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var cy = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

      // support uniformal skew
      if (arguments.length === 3) {
        cy = cx;
        cx = y;
        y = x;
      } // Convert degrees to radians


      x = radians(x);
      y = radians(y);
      var lx = Math.tan(x);
      var ly = Math.tan(y);
      var a = this.a,
          b = this.b,
          c = this.c,
          d = this.d,
          e = this.e,
          f = this.f;
      this.a = a + b * lx;
      this.b = b + a * ly;
      this.c = c + d * lx;
      this.d = d + c * ly;
      this.e = e + f * lx - cy * lx;
      this.f = f + e * ly - cx * ly;
      return this;
    } // SkewX

  }, {
    key: "skewX",
    value: function skewX(x, cx, cy) {
      return this.skew(x, 0, cx, cy);
    }
  }, {
    key: "skewXO",
    value: function skewXO(x, cx, cy) {
      return this.skewO(x, 0, cx, cy);
    } // SkewY

  }, {
    key: "skewY",
    value: function skewY(y, cx, cy) {
      return this.skew(0, y, cx, cy);
    }
  }, {
    key: "skewYO",
    value: function skewYO(y, cx, cy) {
      return this.skewO(0, y, cx, cy);
    } // Transform around a center point

  }, {
    key: "aroundO",
    value: function aroundO(cx, cy, matrix) {
      var dx = cx || 0;
      var dy = cy || 0;
      return this.translateO(-dx, -dy).lmultiplyO(matrix).translateO(dx, dy);
    }
  }, {
    key: "around",
    value: function around(cx, cy, matrix) {
      return this.clone().aroundO(cx, cy, matrix);
    } // Check if two matrices are equal

  }, {
    key: "equals",
    value: function equals(other) {
      var comp = new Matrix(other);
      return closeEnough(this.a, comp.a) && closeEnough(this.b, comp.b) && closeEnough(this.c, comp.c) && closeEnough(this.d, comp.d) && closeEnough(this.e, comp.e) && closeEnough(this.f, comp.f);
    } // Convert matrix to string

  }, {
    key: "toString",
    value: function toString() {
      return 'matrix(' + this.a + ',' + this.b + ',' + this.c + ',' + this.d + ',' + this.e + ',' + this.f + ')';
    }
  }, {
    key: "toArray",
    value: function toArray() {
      return [this.a, this.b, this.c, this.d, this.e, this.f];
    }
  }, {
    key: "valueOf",
    value: function valueOf() {
      return {
        a: this.a,
        b: this.b,
        c: this.c,
        d: this.d,
        e: this.e,
        f: this.f
      };
    }
  }], [{
    key: "fromArray",
    value: function fromArray(a) {
      return {
        a: a[0],
        b: a[1],
        c: a[2],
        d: a[3],
        e: a[4],
        f: a[5]
      };
    }
  }, {
    key: "isMatrixLike",
    value: function isMatrixLike(o) {
      return o.a != null || o.b != null || o.c != null || o.d != null || o.e != null || o.f != null;
    }
  }, {
    key: "formatTransforms",
    value: function formatTransforms(o) {
      // Get all of the parameters required to form the matrix
      var flipBoth = o.flip === 'both' || o.flip === true;
      var flipX = o.flip && (flipBoth || o.flip === 'x') ? -1 : 1;
      var flipY = o.flip && (flipBoth || o.flip === 'y') ? -1 : 1;
      var skewX = o.skew && o.skew.length ? o.skew[0] : isFinite(o.skew) ? o.skew : isFinite(o.skewX) ? o.skewX : 0;
      var skewY = o.skew && o.skew.length ? o.skew[1] : isFinite(o.skew) ? o.skew : isFinite(o.skewY) ? o.skewY : 0;
      var scaleX = o.scale && o.scale.length ? o.scale[0] * flipX : isFinite(o.scale) ? o.scale * flipX : isFinite(o.scaleX) ? o.scaleX * flipX : flipX;
      var scaleY = o.scale && o.scale.length ? o.scale[1] * flipY : isFinite(o.scale) ? o.scale * flipY : isFinite(o.scaleY) ? o.scaleY * flipY : flipY;
      var shear = o.shear || 0;
      var theta = o.rotate || o.theta || 0;
      var origin = new Point$1(o.origin || o.around || o.ox || o.originX, o.oy || o.originY);
      var ox = origin.x;
      var oy = origin.y;
      var position = new Point$1(o.position || o.px || o.positionX, o.py || o.positionY);
      var px = position.x;
      var py = position.y;
      var translate = new Point$1(o.translate || o.tx || o.translateX, o.ty || o.translateY);
      var tx = translate.x;
      var ty = translate.y;
      var relative = new Point$1(o.relative || o.rx || o.relativeX, o.ry || o.relativeY);
      var rx = relative.x;
      var ry = relative.y; // Populate all of the values

      return {
        scaleX: scaleX,
        scaleY: scaleY,
        skewX: skewX,
        skewY: skewY,
        shear: shear,
        theta: theta,
        rx: rx,
        ry: ry,
        tx: tx,
        ty: ty,
        ox: ox,
        oy: oy,
        px: px,
        py: py
      };
    } // left matrix, right matrix, target matrix which is overwritten

  }, {
    key: "matrixMultiply",
    value: function matrixMultiply(l, r, o) {
      // Work out the product directly
      var a = l.a * r.a + l.c * r.b;
      var b = l.b * r.a + l.d * r.b;
      var c = l.a * r.c + l.c * r.d;
      var d = l.b * r.c + l.d * r.d;
      var e = l.e + l.a * r.e + l.c * r.f;
      var f = l.f + l.b * r.e + l.d * r.f; // make sure to use local variables because l/r and o could be the same

      o.a = a;
      o.b = b;
      o.c = c;
      o.d = d;
      o.e = e;
      o.f = f;
      return o;
    }
  }]);

  return Matrix;
}();
function ctm() {
  return new Matrix(this.node.getCTM());
}
function screenCTM() {
  /* https://bugzilla.mozilla.org/show_bug.cgi?id=1344537
     This is needed because FF does not return the transformation matrix
     for the inner coordinate system when getScreenCTM() is called on nested svgs.
     However all other Browsers do that */
  if (typeof this.isRoot === 'function' && !this.isRoot()) {
    var rect = this.rect(1, 1);
    var m = rect.node.getScreenCTM();
    rect.remove();
    return new Matrix(m);
  }

  return new Matrix(this.node.getScreenCTM());
}
register(Matrix, 'Matrix');

function parser() {
  // Reuse cached element if possible
  if (!parser.nodes) {
    var svg = makeInstance().size(2, 0);
    svg.node.style.cssText = ['opacity: 0', 'position: absolute', 'left: -100%', 'top: -100%', 'overflow: hidden'].join(';');
    svg.attr('focusable', 'false');
    svg.attr('aria-hidden', 'true');
    var path = svg.path().node;
    parser.nodes = {
      svg: svg,
      path: path
    };
  }

  if (!parser.nodes.svg.node.parentNode) {
    var b = globals.document.body || globals.document.documentElement;
    parser.nodes.svg.addTo(b);
  }

  return parser.nodes;
}

function isNulledBox(box) {
  return !box.width && !box.height && !box.x && !box.y;
}

function domContains(node) {
  return node === globals.document || (globals.document.documentElement.contains || function (node) {
    // This is IE - it does not support contains() for top-level SVGs
    while (node.parentNode) {
      node = node.parentNode;
    }

    return node === globals.document;
  }).call(globals.document.documentElement, node);
}

var Box =
/*#__PURE__*/
function () {
  function Box() {
    _classCallCheck$1(this, Box);

    this.init.apply(this, arguments);
  }

  _createClass$1(Box, [{
    key: "init",
    value: function init(source) {
      var base = [0, 0, 0, 0];
      source = typeof source === 'string' ? source.split(delimiter).map(parseFloat) : Array.isArray(source) ? source : _typeof(source) === 'object' ? [source.left != null ? source.left : source.x, source.top != null ? source.top : source.y, source.width, source.height] : arguments.length === 4 ? [].slice.call(arguments) : base;
      this.x = source[0] || 0;
      this.y = source[1] || 0;
      this.width = this.w = source[2] || 0;
      this.height = this.h = source[3] || 0; // Add more bounding box properties

      this.x2 = this.x + this.w;
      this.y2 = this.y + this.h;
      this.cx = this.x + this.w / 2;
      this.cy = this.y + this.h / 2;
      return this;
    } // Merge rect box with another, return a new instance

  }, {
    key: "merge",
    value: function merge(box) {
      var x = Math.min(this.x, box.x);
      var y = Math.min(this.y, box.y);
      var width = Math.max(this.x + this.width, box.x + box.width) - x;
      var height = Math.max(this.y + this.height, box.y + box.height) - y;
      return new Box(x, y, width, height);
    }
  }, {
    key: "transform",
    value: function transform(m) {
      if (!(m instanceof Matrix)) {
        m = new Matrix(m);
      }

      var xMin = Infinity;
      var xMax = -Infinity;
      var yMin = Infinity;
      var yMax = -Infinity;
      var pts = [new Point$1(this.x, this.y), new Point$1(this.x2, this.y), new Point$1(this.x, this.y2), new Point$1(this.x2, this.y2)];
      pts.forEach(function (p) {
        p = p.transform(m);
        xMin = Math.min(xMin, p.x);
        xMax = Math.max(xMax, p.x);
        yMin = Math.min(yMin, p.y);
        yMax = Math.max(yMax, p.y);
      });
      return new Box(xMin, yMin, xMax - xMin, yMax - yMin);
    }
  }, {
    key: "addOffset",
    value: function addOffset() {
      // offset by window scroll position, because getBoundingClientRect changes when window is scrolled
      this.x += globals.window.pageXOffset;
      this.y += globals.window.pageYOffset;
      return this;
    }
  }, {
    key: "toString",
    value: function toString() {
      return this.x + ' ' + this.y + ' ' + this.width + ' ' + this.height;
    }
  }, {
    key: "toArray",
    value: function toArray() {
      return [this.x, this.y, this.width, this.height];
    }
  }, {
    key: "isNulled",
    value: function isNulled() {
      return isNulledBox(this);
    }
  }]);

  return Box;
}();

function getBox(cb, retry) {
  var box;

  try {
    box = cb(this.node);

    if (isNulledBox(box) && !domContains(this.node)) {
      throw new Error('Element not in the dom');
    }
  } catch (e) {
    box = retry(this);
  }

  return box;
}

function bbox() {
  return new Box(getBox.call(this, function (node) {
    return node.getBBox();
  }, function (el) {
    try {
      var clone = el.clone().addTo(parser().svg).show();
      var box = clone.node.getBBox();
      clone.remove();
      return box;
    } catch (e) {
      throw new Error('Getting bbox of element "' + el.node.nodeName + '" is not possible. ' + e.toString());
    }
  }));
}
function rbox(el) {
  var box = new Box(getBox.call(this, function (node) {
    return node.getBoundingClientRect();
  }, function (el) {
    throw new Error('Getting rbox of element "' + el.node.nodeName + '" is not possible');
  }));
  if (el) return box.transform(el.screenCTM().inverse());
  return box.addOffset();
}
registerMethods({
  viewbox: {
    viewbox: function viewbox(x, y, width, height) {
      // act as getter
      if (x == null) return new Box(this.attr('viewBox')); // act as setter

      return this.attr('viewBox', new Box(x, y, width, height));
    },
    zoom: function zoom(level, point) {
      var width = this.node.clientWidth;
      var height = this.node.clientHeight;
      var v = this.viewbox(); // Firefox does not support clientHeight and returns 0
      // https://bugzilla.mozilla.org/show_bug.cgi?id=874811

      if (!width && !height) {
        var style = window.getComputedStyle(this.node);
        width = parseFloat(style.getPropertyValue('width'));
        height = parseFloat(style.getPropertyValue('height'));
      }

      var zoomX = width / v.width;
      var zoomY = height / v.height;
      var zoom = Math.min(zoomX, zoomY);

      if (level == null) {
        return zoom;
      }

      var zoomAmount = zoom / level;
      if (zoomAmount === Infinity) zoomAmount = Number.MIN_VALUE;
      point = point || new Point$1(width / 2 / zoomX + v.x, height / 2 / zoomY + v.y);
      var box = new Box(v).transform(new Matrix({
        scale: zoomAmount,
        origin: point
      }));
      return this.viewbox(box);
    }
  }
});
register(Box, 'Box');

/* eslint no-new-func: "off" */
var subClassArray = function () {
  try {
    // try es6 subclassing
    return Function('name', 'baseClass', '_constructor', ['baseClass = baseClass || Array', 'return {', '  [name]: class extends baseClass {', '    constructor (...args) {', '      super(...args)', '      _constructor && _constructor.apply(this, args)', '    }', '  }', '}[name]'].join('\n'));
  } catch (e) {
    // Use es5 approach
    return function (name) {
      var baseClass = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Array;

      var _constructor = arguments.length > 2 ? arguments[2] : undefined;

      var Arr = function Arr() {
        baseClass.apply(this, arguments);
        _constructor && _constructor.apply(this, arguments);
      };

      Arr.prototype = Object.create(baseClass.prototype);
      Arr.prototype.constructor = Arr;

      Arr.prototype.map = function (fn) {
        var arr = new Arr();
        arr.push.apply(arr, Array.prototype.map.call(this, fn));
        return arr;
      };

      return Arr;
    };
  }
}();

var List = subClassArray('List', Array, function () {
  var arr = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  // This catches the case, that native map tries to create an array with new Array(1)
  if (typeof arr === 'number') return this;
  this.length = 0;
  this.push.apply(this, _toConsumableArray$1(arr));
});
extend(List, {
  each: function each(fnOrMethodName) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    if (typeof fnOrMethodName === 'function') {
      return this.map(function (el) {
        return fnOrMethodName.call(el, el);
      });
    } else {
      return this.map(function (el) {
        return el[fnOrMethodName].apply(el, args);
      });
    }
  },
  toArray: function toArray() {
    return Array.prototype.concat.apply([], this);
  }
});
var reserved = ['toArray', 'constructor', 'each'];

List.extend = function (methods) {
  methods = methods.reduce(function (obj, name) {
    // Don't overwrite own methods
    if (reserved.includes(name)) return obj; // Don't add private methods

    if (name[0] === '_') return obj; // Relay every call to each()

    obj[name] = function () {
      for (var _len2 = arguments.length, attrs = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        attrs[_key2] = arguments[_key2];
      }

      return this.each.apply(this, [name].concat(attrs));
    };

    return obj;
  }, {});
  extend(List, methods);
};

function baseFind(query, parent) {
  return new List(map((parent || globals.document).querySelectorAll(query), function (node) {
    return adopt(node);
  }));
} // Scoped find method

function find(query) {
  return baseFind(query, this.node);
}
function findOne(query) {
  return adopt(this.node.querySelector(query));
}

var EventTarget =
/*#__PURE__*/
function (_Base) {
  _inherits$1(EventTarget, _Base);

  function EventTarget() {
    var _this;

    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$events = _ref.events,
        events = _ref$events === void 0 ? {} : _ref$events;

    _classCallCheck$1(this, EventTarget);

    _this = _possibleConstructorReturn$1(this, _getPrototypeOf$1(EventTarget).call(this));
    _this.events = events;
    return _this;
  }

  _createClass$1(EventTarget, [{
    key: "addEventListener",
    value: function addEventListener() {}
  }, {
    key: "dispatch",
    value: function dispatch$1(event, data) {
      return dispatch(this, event, data);
    }
  }, {
    key: "dispatchEvent",
    value: function dispatchEvent(event) {
      var bag = this.getEventHolder().events;
      if (!bag) return true;
      var events = bag[event.type];

      for (var i in events) {
        for (var j in events[i]) {
          events[i][j](event);
        }
      }

      return !event.defaultPrevented;
    } // Fire given event

  }, {
    key: "fire",
    value: function fire(event, data) {
      this.dispatch(event, data);
      return this;
    }
  }, {
    key: "getEventHolder",
    value: function getEventHolder() {
      return this;
    }
  }, {
    key: "getEventTarget",
    value: function getEventTarget() {
      return this;
    } // Unbind event from listener

  }, {
    key: "off",
    value: function off$1(event, listener) {
      off(this, event, listener);

      return this;
    } // Bind given event to listener

  }, {
    key: "on",
    value: function on$1(event, listener, binding, options) {
      on(this, event, listener, binding, options);

      return this;
    }
  }, {
    key: "removeEventListener",
    value: function removeEventListener() {}
  }]);

  return EventTarget;
}(Base);
register(EventTarget, 'EventTarget');

function noop() {} // Default animation values

var timeline = {
  duration: 400,
  ease: '>',
  delay: 0
}; // Default attribute values

var attrs = {
  // fill and stroke
  'fill-opacity': 1,
  'stroke-opacity': 1,
  'stroke-width': 0,
  'stroke-linejoin': 'miter',
  'stroke-linecap': 'butt',
  fill: '#000000',
  stroke: '#000000',
  opacity: 1,
  // position
  x: 0,
  y: 0,
  cx: 0,
  cy: 0,
  // size
  width: 0,
  height: 0,
  // radius
  r: 0,
  rx: 0,
  ry: 0,
  // gradient
  offset: 0,
  'stop-opacity': 1,
  'stop-color': '#000000',
  // text
  'text-anchor': 'start'
};

var SVGArray = subClassArray('SVGArray', Array, function (arr) {
  this.init(arr);
});
extend(SVGArray, {
  init: function init(arr) {
    // This catches the case, that native map tries to create an array with new Array(1)
    if (typeof arr === 'number') return this;
    this.length = 0;
    this.push.apply(this, _toConsumableArray$1(this.parse(arr)));
    return this;
  },
  toArray: function toArray() {
    return Array.prototype.concat.apply([], this);
  },
  toString: function toString() {
    return this.join(' ');
  },
  // Flattens the array if needed
  valueOf: function valueOf() {
    var ret = [];
    ret.push.apply(ret, _toConsumableArray$1(this));
    return ret;
  },
  // Parse whitespace separated string
  parse: function parse() {
    var array = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    // If already is an array, no need to parse it
    if (array instanceof Array) return array;
    return array.trim().split(delimiter).map(parseFloat);
  },
  clone: function clone() {
    return new this.constructor(this);
  },
  toSet: function toSet() {
    return new Set(this);
  }
});

var SVGNumber =
/*#__PURE__*/
function () {
  // Initialize
  function SVGNumber() {
    _classCallCheck$1(this, SVGNumber);

    this.init.apply(this, arguments);
  }

  _createClass$1(SVGNumber, [{
    key: "init",
    value: function init(value, unit) {
      unit = Array.isArray(value) ? value[1] : unit;
      value = Array.isArray(value) ? value[0] : value; // initialize defaults

      this.value = 0;
      this.unit = unit || ''; // parse value

      if (typeof value === 'number') {
        // ensure a valid numeric value
        this.value = isNaN(value) ? 0 : !isFinite(value) ? value < 0 ? -3.4e+38 : +3.4e+38 : value;
      } else if (typeof value === 'string') {
        unit = value.match(numberAndUnit);

        if (unit) {
          // make value numeric
          this.value = parseFloat(unit[1]); // normalize

          if (unit[5] === '%') {
            this.value /= 100;
          } else if (unit[5] === 's') {
            this.value *= 1000;
          } // store unit


          this.unit = unit[5];
        }
      } else {
        if (value instanceof SVGNumber) {
          this.value = value.valueOf();
          this.unit = value.unit;
        }
      }

      return this;
    }
  }, {
    key: "toString",
    value: function toString() {
      return (this.unit === '%' ? ~~(this.value * 1e8) / 1e6 : this.unit === 's' ? this.value / 1e3 : this.value) + this.unit;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.toString();
    }
  }, {
    key: "toArray",
    value: function toArray() {
      return [this.value, this.unit];
    }
  }, {
    key: "valueOf",
    value: function valueOf() {
      return this.value;
    } // Add number

  }, {
    key: "plus",
    value: function plus(number) {
      number = new SVGNumber(number);
      return new SVGNumber(this + number, this.unit || number.unit);
    } // Subtract number

  }, {
    key: "minus",
    value: function minus(number) {
      number = new SVGNumber(number);
      return new SVGNumber(this - number, this.unit || number.unit);
    } // Multiply number

  }, {
    key: "times",
    value: function times(number) {
      number = new SVGNumber(number);
      return new SVGNumber(this * number, this.unit || number.unit);
    } // Divide number

  }, {
    key: "divide",
    value: function divide(number) {
      number = new SVGNumber(number);
      return new SVGNumber(this / number, this.unit || number.unit);
    }
  }, {
    key: "convert",
    value: function convert(unit) {
      return new SVGNumber(this.value, unit);
    }
  }]);

  return SVGNumber;
}();

var hooks = [];
function registerAttrHook(fn) {
  hooks.push(fn);
} // Set svg element attribute

function attr(attr, val, ns) {
  var _this = this;

  // act as full getter
  if (attr == null) {
    // get an object of attributes
    attr = {};
    val = this.node.attributes;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = val[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var node = _step.value;
        attr[node.nodeName] = isNumber.test(node.nodeValue) ? parseFloat(node.nodeValue) : node.nodeValue;
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return attr;
  } else if (attr instanceof Array) {
    // loop through array and get all values
    return attr.reduce(function (last, curr) {
      last[curr] = _this.attr(curr);
      return last;
    }, {});
  } else if (_typeof(attr) === 'object' && attr.constructor === Object) {
    // apply every attribute individually if an object is passed
    for (val in attr) {
      this.attr(val, attr[val]);
    }
  } else if (val === null) {
    // remove value
    this.node.removeAttribute(attr);
  } else if (val == null) {
    // act as a getter if the first and only argument is not an object
    val = this.node.getAttribute(attr);
    return val == null ? attrs[attr] : isNumber.test(val) ? parseFloat(val) : val;
  } else {
    // Loop through hooks and execute them to convert value
    val = hooks.reduce(function (_val, hook) {
      return hook(attr, _val, _this);
    }, val); // ensure correct numeric values (also accepts NaN and Infinity)

    if (typeof val === 'number') {
      val = new SVGNumber(val);
    } else if (Color.isColor(val)) {
      // ensure full hex color
      val = new Color(val);
    } else if (val.constructor === Array) {
      // Check for plain arrays and parse array values
      val = new SVGArray(val);
    } // if the passed attribute is leading...


    if (attr === 'leading') {
      // ... call the leading method instead
      if (this.leading) {
        this.leading(val);
      }
    } else {
      // set given attribute on node
      typeof ns === 'string' ? this.node.setAttributeNS(ns, attr, val.toString()) : this.node.setAttribute(attr, val.toString());
    } // rebuild if required


    if (this.rebuild && (attr === 'font-size' || attr === 'x')) {
      this.rebuild();
    }
  }

  return this;
}

var Dom =
/*#__PURE__*/
function (_EventTarget) {
  _inherits$1(Dom, _EventTarget);

  function Dom(node, attrs) {
    var _this2;

    _classCallCheck$1(this, Dom);

    _this2 = _possibleConstructorReturn$1(this, _getPrototypeOf$1(Dom).call(this, node));
    _this2.node = node;
    _this2.type = node.nodeName;

    if (attrs && node !== attrs) {
      _this2.attr(attrs);
    }

    return _this2;
  } // Add given element at a position


  _createClass$1(Dom, [{
    key: "add",
    value: function add(element, i) {
      element = makeInstance(element);

      if (i == null) {
        this.node.appendChild(element.node);
      } else if (element.node !== this.node.childNodes[i]) {
        this.node.insertBefore(element.node, this.node.childNodes[i]);
      }

      return this;
    } // Add element to given container and return self

  }, {
    key: "addTo",
    value: function addTo(parent) {
      return makeInstance(parent).put(this);
    } // Returns all child elements

  }, {
    key: "children",
    value: function children() {
      return new List(map(this.node.children, function (node) {
        return adopt(node);
      }));
    } // Remove all elements in this container

  }, {
    key: "clear",
    value: function clear() {
      // remove children
      while (this.node.hasChildNodes()) {
        this.node.removeChild(this.node.lastChild);
      }

      return this;
    } // Clone element

  }, {
    key: "clone",
    value: function clone() {
      // write dom data to the dom so the clone can pickup the data
      this.writeDataToDom(); // clone element and assign new id

      return assignNewId(this.node.cloneNode(true));
    } // Iterates over all children and invokes a given block

  }, {
    key: "each",
    value: function each(block, deep) {
      var children = this.children();
      var i, il;

      for (i = 0, il = children.length; i < il; i++) {
        block.apply(children[i], [i, children]);

        if (deep) {
          children[i].each(block, deep);
        }
      }

      return this;
    }
  }, {
    key: "element",
    value: function element(nodeName) {
      return this.put(new Dom(create(nodeName)));
    } // Get first child

  }, {
    key: "first",
    value: function first() {
      return adopt(this.node.firstChild);
    } // Get a element at the given index

  }, {
    key: "get",
    value: function get(i) {
      return adopt(this.node.childNodes[i]);
    }
  }, {
    key: "getEventHolder",
    value: function getEventHolder() {
      return this.node;
    }
  }, {
    key: "getEventTarget",
    value: function getEventTarget() {
      return this.node;
    } // Checks if the given element is a child

  }, {
    key: "has",
    value: function has(element) {
      return this.index(element) >= 0;
    } // Get / set id

  }, {
    key: "id",
    value: function id(_id) {
      // generate new id if no id set
      if (typeof _id === 'undefined' && !this.node.id) {
        this.node.id = eid(this.type);
      } // dont't set directly width this.node.id to make `null` work correctly


      return this.attr('id', _id);
    } // Gets index of given element

  }, {
    key: "index",
    value: function index(element) {
      return [].slice.call(this.node.childNodes).indexOf(element.node);
    } // Get the last child

  }, {
    key: "last",
    value: function last() {
      return adopt(this.node.lastChild);
    } // matches the element vs a css selector

  }, {
    key: "matches",
    value: function matches(selector) {
      var el = this.node;
      return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector);
    } // Returns the parent element instance

  }, {
    key: "parent",
    value: function parent(type) {
      var parent = this; // check for parent

      if (!parent.node.parentNode) return null; // get parent element

      parent = adopt(parent.node.parentNode);
      if (!type) return parent; // loop trough ancestors if type is given

      while (parent) {
        if (typeof type === 'string' ? parent.matches(type) : parent instanceof type) return parent;
        if (!parent.node.parentNode || parent.node.parentNode.nodeName === '#document' || parent.node.parentNode.nodeName === '#document-fragment') return null; // #759, #720

        parent = adopt(parent.node.parentNode);
      }
    } // Basically does the same as `add()` but returns the added element instead

  }, {
    key: "put",
    value: function put(element, i) {
      this.add(element, i);
      return element;
    } // Add element to given container and return container

  }, {
    key: "putIn",
    value: function putIn(parent) {
      return makeInstance(parent).add(this);
    } // Remove element

  }, {
    key: "remove",
    value: function remove() {
      if (this.parent()) {
        this.parent().removeElement(this);
      }

      return this;
    } // Remove a given child

  }, {
    key: "removeElement",
    value: function removeElement(element) {
      this.node.removeChild(element.node);
      return this;
    } // Replace this with element

  }, {
    key: "replace",
    value: function replace(element) {
      element = makeInstance(element);
      this.node.parentNode.replaceChild(element.node, this.node);
      return element;
    }
  }, {
    key: "round",
    value: function round() {
      var precision = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2;
      var map = arguments.length > 1 ? arguments[1] : undefined;
      var factor = Math.pow(10, precision);
      var attrs = this.attr(); // If we have no map, build one from attrs

      if (!map) {
        map = Object.keys(attrs);
      } // Holds rounded attributes


      var newAttrs = {};
      map.forEach(function (key) {
        newAttrs[key] = Math.round(attrs[key] * factor) / factor;
      });
      this.attr(newAttrs);
      return this;
    } // Return id on string conversion

  }, {
    key: "toString",
    value: function toString() {
      return this.id();
    } // Import raw svg

  }, {
    key: "svg",
    value: function svg(svgOrFn, outerHTML) {
      var well, len, fragment;

      if (svgOrFn === false) {
        outerHTML = false;
        svgOrFn = null;
      } // act as getter if no svg string is given


      if (svgOrFn == null || typeof svgOrFn === 'function') {
        // The default for exports is, that the outerNode is included
        outerHTML = outerHTML == null ? true : outerHTML; // write svgjs data to the dom

        this.writeDataToDom();
        var current = this; // An export modifier was passed

        if (svgOrFn != null) {
          current = adopt(current.node.cloneNode(true)); // If the user wants outerHTML we need to process this node, too

          if (outerHTML) {
            var result = svgOrFn(current);
            current = result || current; // The user does not want this node? Well, then he gets nothing

            if (result === false) return '';
          } // Deep loop through all children and apply modifier


          current.each(function () {
            var result = svgOrFn(this);

            var _this = result || this; // If modifier returns false, discard node


            if (result === false) {
              this.remove(); // If modifier returns new node, use it
            } else if (result && this !== _this) {
              this.replace(_this);
            }
          }, true);
        } // Return outer or inner content


        return outerHTML ? current.node.outerHTML : current.node.innerHTML;
      } // Act as setter if we got a string
      // The default for import is, that the current node is not replaced


      outerHTML = outerHTML == null ? false : outerHTML; // Create temporary holder

      well = globals.document.createElementNS(ns, 'svg');
      fragment = globals.document.createDocumentFragment(); // Dump raw svg

      well.innerHTML = svgOrFn; // Transplant nodes into the fragment

      for (len = well.children.length; len--;) {
        fragment.appendChild(well.firstElementChild);
      }

      var parent = this.parent(); // Add the whole fragment at once

      return outerHTML ? this.replace(fragment) && parent : this.add(fragment);
    }
  }, {
    key: "words",
    value: function words(text) {
      // This is faster than removing all children and adding a new one
      this.node.textContent = text;
      return this;
    } // write svgjs data to the dom

  }, {
    key: "writeDataToDom",
    value: function writeDataToDom() {
      // dump variables recursively
      this.each(function () {
        this.writeDataToDom();
      });
      return this;
    }
  }]);

  return Dom;
}(EventTarget);
extend(Dom, {
  attr: attr,
  find: find,
  findOne: findOne
});
register(Dom, 'Dom');

var Element =
/*#__PURE__*/
function (_Dom) {
  _inherits$1(Element, _Dom);

  function Element(node, attrs) {
    var _this;

    _classCallCheck$1(this, Element);

    _this = _possibleConstructorReturn$1(this, _getPrototypeOf$1(Element).call(this, node, attrs)); // initialize data object

    _this.dom = {}; // create circular reference

    _this.node.instance = _assertThisInitialized$1(_this);

    if (node.hasAttribute('svgjs:data')) {
      // pull svgjs data from the dom (getAttributeNS doesn't work in html5)
      _this.setData(JSON.parse(node.getAttribute('svgjs:data')) || {});
    }

    return _this;
  } // Move element by its center


  _createClass$1(Element, [{
    key: "center",
    value: function center(x, y) {
      return this.cx(x).cy(y);
    } // Move by center over x-axis

  }, {
    key: "cx",
    value: function cx(x) {
      return x == null ? this.x() + this.width() / 2 : this.x(x - this.width() / 2);
    } // Move by center over y-axis

  }, {
    key: "cy",
    value: function cy(y) {
      return y == null ? this.y() + this.height() / 2 : this.y(y - this.height() / 2);
    } // Get defs

  }, {
    key: "defs",
    value: function defs() {
      return this.root().defs();
    } // Relative move over x and y axes

  }, {
    key: "dmove",
    value: function dmove(x, y) {
      return this.dx(x).dy(y);
    } // Relative move over x axis

  }, {
    key: "dx",
    value: function dx() {
      var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      return this.x(new SVGNumber(x).plus(this.x()));
    } // Relative move over y axis

  }, {
    key: "dy",
    value: function dy() {
      var y = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      return this.y(new SVGNumber(y).plus(this.y()));
    } // Get parent document

  }, {
    key: "root",
    value: function root$1() {
      var p = this.parent(getClass(root));
      return p && p.root();
    }
  }, {
    key: "getEventHolder",
    value: function getEventHolder() {
      return this;
    } // Set height of element

  }, {
    key: "height",
    value: function height(_height) {
      return this.attr('height', _height);
    } // Checks whether the given point inside the bounding box of the element

  }, {
    key: "inside",
    value: function inside(x, y) {
      var box = this.bbox();
      return x > box.x && y > box.y && x < box.x + box.width && y < box.y + box.height;
    } // Move element to given x and y values

  }, {
    key: "move",
    value: function move(x, y) {
      return this.x(x).y(y);
    } // return array of all ancestors of given type up to the root svg

  }, {
    key: "parents",
    value: function parents() {
      var until = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : globals.document;
      until = makeInstance(until);
      var parents = new List();
      var parent = this;

      while ((parent = parent.parent()) && parent.node !== until.node && parent.node !== globals.document) {
        parents.push(parent);
      }

      return parents;
    } // Get referenced element form attribute value

  }, {
    key: "reference",
    value: function reference$1(attr) {
      attr = this.attr(attr);
      if (!attr) return null;
      var m = attr.match(reference);
      return m ? makeInstance(m[1]) : null;
    } // set given data to the elements data property

  }, {
    key: "setData",
    value: function setData(o) {
      this.dom = o;
      return this;
    } // Set element size to given width and height

  }, {
    key: "size",
    value: function size(width, height) {
      var p = proportionalSize(this, width, height);
      return this.width(new SVGNumber(p.width)).height(new SVGNumber(p.height));
    } // Set width of element

  }, {
    key: "width",
    value: function width(_width) {
      return this.attr('width', _width);
    } // write svgjs data to the dom

  }, {
    key: "writeDataToDom",
    value: function writeDataToDom() {
      // remove previously set data
      this.node.removeAttribute('svgjs:data');

      if (Object.keys(this.dom).length) {
        this.node.setAttribute('svgjs:data', JSON.stringify(this.dom)); // see #428
      }

      return _get(_getPrototypeOf$1(Element.prototype), "writeDataToDom", this).call(this);
    } // Move over x-axis

  }, {
    key: "x",
    value: function x(_x) {
      return this.attr('x', _x);
    } // Move over y-axis

  }, {
    key: "y",
    value: function y(_y) {
      return this.attr('y', _y);
    }
  }]);

  return Element;
}(Dom);
extend(Element, {
  bbox: bbox,
  rbox: rbox,
  point: point,
  ctm: ctm,
  screenCTM: screenCTM
});
register(Element, 'Element');

var sugar = {
  stroke: ['color', 'width', 'opacity', 'linecap', 'linejoin', 'miterlimit', 'dasharray', 'dashoffset'],
  fill: ['color', 'opacity', 'rule'],
  prefix: function prefix(t, a) {
    return a === 'color' ? t : t + '-' + a;
  }
} // Add sugar for fill and stroke
;
['fill', 'stroke'].forEach(function (m) {
  var extension = {};
  var i;

  extension[m] = function (o) {
    if (typeof o === 'undefined') {
      return this.attr(m);
    }

    if (typeof o === 'string' || o instanceof Color || Color.isRgb(o) || o instanceof Element) {
      this.attr(m, o);
    } else {
      // set all attributes from sugar.fill and sugar.stroke list
      for (i = sugar[m].length - 1; i >= 0; i--) {
        if (o[sugar[m][i]] != null) {
          this.attr(sugar.prefix(m, sugar[m][i]), o[sugar[m][i]]);
        }
      }
    }

    return this;
  };

  registerMethods(['Element', 'Runner'], extension);
});
registerMethods(['Element', 'Runner'], {
  // Let the user set the matrix directly
  matrix: function matrix(mat, b, c, d, e, f) {
    // Act as a getter
    if (mat == null) {
      return new Matrix(this);
    } // Act as a setter, the user can pass a matrix or a set of numbers


    return this.attr('transform', new Matrix(mat, b, c, d, e, f));
  },
  // Map rotation to transform
  rotate: function rotate(angle, cx, cy) {
    return this.transform({
      rotate: angle,
      ox: cx,
      oy: cy
    }, true);
  },
  // Map skew to transform
  skew: function skew(x, y, cx, cy) {
    return arguments.length === 1 || arguments.length === 3 ? this.transform({
      skew: x,
      ox: y,
      oy: cx
    }, true) : this.transform({
      skew: [x, y],
      ox: cx,
      oy: cy
    }, true);
  },
  shear: function shear(lam, cx, cy) {
    return this.transform({
      shear: lam,
      ox: cx,
      oy: cy
    }, true);
  },
  // Map scale to transform
  scale: function scale(x, y, cx, cy) {
    return arguments.length === 1 || arguments.length === 3 ? this.transform({
      scale: x,
      ox: y,
      oy: cx
    }, true) : this.transform({
      scale: [x, y],
      ox: cx,
      oy: cy
    }, true);
  },
  // Map translate to transform
  translate: function translate(x, y) {
    return this.transform({
      translate: [x, y]
    }, true);
  },
  // Map relative translations to transform
  relative: function relative(x, y) {
    return this.transform({
      relative: [x, y]
    }, true);
  },
  // Map flip to transform
  flip: function flip(direction, around) {
    var directionString = typeof direction === 'string' ? direction : isFinite(direction) ? 'both' : 'both';
    var origin = direction === 'both' && isFinite(around) ? [around, around] : direction === 'x' ? [around, 0] : direction === 'y' ? [0, around] : isFinite(direction) ? [direction, direction] : [0, 0];
    return this.transform({
      flip: directionString,
      origin: origin
    }, true);
  },
  // Opacity
  opacity: function opacity(value) {
    return this.attr('opacity', value);
  }
});
registerMethods('radius', {
  // Add x and y radius
  radius: function radius(x, y) {
    var type = (this._element || this).type;
    return type === 'radialGradient' || type === 'radialGradient' ? this.attr('r', new SVGNumber(x)) : this.rx(x).ry(y == null ? x : y);
  }
});
registerMethods('Path', {
  // Get path length
  length: function length() {
    return this.node.getTotalLength();
  },
  // Get point at length
  pointAt: function pointAt(length) {
    return new Point$1(this.node.getPointAtLength(length));
  }
});
registerMethods(['Element', 'Runner'], {
  // Set font
  font: function font(a, v) {
    if (_typeof(a) === 'object') {
      for (v in a) {
        this.font(v, a[v]);
      }

      return this;
    }

    return a === 'leading' ? this.leading(v) : a === 'anchor' ? this.attr('text-anchor', v) : a === 'size' || a === 'family' || a === 'weight' || a === 'stretch' || a === 'variant' || a === 'style' ? this.attr('font-' + a, v) : this.attr(a, v);
  }
});
registerMethods('Text', {
  ax: function ax(x) {
    return this.attr('x', x);
  },
  ay: function ay(y) {
    return this.attr('y', y);
  },
  amove: function amove(x, y) {
    return this.ax(x).ay(y);
  }
}); // Add events to elements

var methods$1 = ['click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mouseout', 'mousemove', 'mouseenter', 'mouseleave', 'touchstart', 'touchmove', 'touchleave', 'touchend', 'touchcancel'].reduce(function (last, event) {
  // add event to Element
  var fn = function fn(f) {
    if (f === null) {
      off(this, event);
    } else {
      on(this, event, f);
    }

    return this;
  };

  last[event] = fn;
  return last;
}, {});
registerMethods('Element', methods$1);

var nativeReverse = [].reverse;
var test$1 = [1, 2];

// `Array.prototype.reverse` method
// https://tc39.github.io/ecma262/#sec-array.prototype.reverse
// fix for Safari 12.0 bug
// https://bugs.webkit.org/show_bug.cgi?id=188794
_export$1({ target: 'Array', proto: true, forced: String(test$1) === String(test$1.reverse()) }, {
  reverse: function reverse() {
    // eslint-disable-next-line no-self-assign
    if (isArray$1(this)) this.length = this.length;
    return nativeReverse.call(this);
  }
});

// `Object.defineProperties` method
// https://tc39.github.io/ecma262/#sec-object.defineproperties
_export$1({ target: 'Object', stat: true, forced: !descriptors$1, sham: !descriptors$1 }, {
  defineProperties: objectDefineProperties
});

// `Object.defineProperty` method
// https://tc39.github.io/ecma262/#sec-object.defineproperty
_export$1({ target: 'Object', stat: true, forced: !descriptors$1, sham: !descriptors$1 }, {
  defineProperty: objectDefineProperty$1.f
});

var nativeGetOwnPropertyDescriptor$2 = objectGetOwnPropertyDescriptor$1.f;


var FAILS_ON_PRIMITIVES$2 = fails$1(function () { nativeGetOwnPropertyDescriptor$2(1); });
var FORCED$3 = !descriptors$1 || FAILS_ON_PRIMITIVES$2;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
_export$1({ target: 'Object', stat: true, forced: FORCED$3, sham: !descriptors$1 }, {
  getOwnPropertyDescriptor: function getOwnPropertyDescriptor(it, key) {
    return nativeGetOwnPropertyDescriptor$2(toIndexedObject$1(it), key);
  }
});

// `Object.getOwnPropertyDescriptors` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptors
_export$1({ target: 'Object', stat: true, sham: !descriptors$1 }, {
  getOwnPropertyDescriptors: function getOwnPropertyDescriptors(object) {
    var O = toIndexedObject$1(object);
    var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor$1.f;
    var keys = ownKeys$2(O);
    var result = {};
    var index = 0;
    var key, descriptor;
    while (keys.length > index) {
      descriptor = getOwnPropertyDescriptor(O, key = keys[index++]);
      if (descriptor !== undefined) createProperty$1(result, key, descriptor);
    }
    return result;
  }
});

function _defineProperty$1(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys$1$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$1$1(source, true).forEach(function (key) { _defineProperty$1(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$1$1(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function untransform() {
  return this.attr('transform', null);
} // merge the whole transformation chain into one matrix and returns it

function matrixify() {
  var matrix = (this.attr('transform') || ''). // split transformations
  split(transforms).slice(0, -1).map(function (str) {
    // generate key => value pairs
    var kv = str.trim().split('(');
    return [kv[0], kv[1].split(delimiter).map(function (str) {
      return parseFloat(str);
    })];
  }).reverse() // merge every transformation into one matrix
  .reduce(function (matrix, transform) {
    if (transform[0] === 'matrix') {
      return matrix.lmultiply(Matrix.fromArray(transform[1]));
    }

    return matrix[transform[0]].apply(matrix, transform[1]);
  }, new Matrix());
  return matrix;
} // add an element to another parent without changing the visual representation on the screen

function toParent(parent) {
  if (this === parent) return this;
  var ctm = this.screenCTM();
  var pCtm = parent.screenCTM().inverse();
  this.addTo(parent).untransform().transform(pCtm.multiply(ctm));
  return this;
} // same as above with parent equals root-svg

function toRoot() {
  return this.toParent(this.root());
} // Add transformations

function transform(o, relative) {
  // Act as a getter if no object was passed
  if (o == null || typeof o === 'string') {
    var decomposed = new Matrix(this).decompose();
    return o == null ? decomposed : decomposed[o];
  }

  if (!Matrix.isMatrixLike(o)) {
    // Set the origin according to the defined transform
    o = _objectSpread({}, o, {
      origin: getOrigin(o, this)
    });
  } // The user can pass a boolean, an Element or an Matrix or nothing


  var cleanRelative = relative === true ? this : relative || false;
  var result = new Matrix(cleanRelative).transform(o);
  return this.attr('transform', result);
}
registerMethods('Element', {
  untransform: untransform,
  matrixify: matrixify,
  toParent: toParent,
  toRoot: toRoot,
  transform: transform
});

function rx(rx) {
  return this.attr('rx', rx);
} // Radius y value

function ry(ry) {
  return this.attr('ry', ry);
} // Move over x-axis

function x(x) {
  return x == null ? this.cx() - this.rx() : this.cx(x + this.rx());
} // Move over y-axis

function y$1(y) {
  return y == null ? this.cy() - this.ry() : this.cy(y + this.ry());
} // Move by center over x-axis

function cx(x) {
  return x == null ? this.attr('cx') : this.attr('cx', x);
} // Move by center over y-axis

function cy(y) {
  return y == null ? this.attr('cy') : this.attr('cy', y);
} // Set width of element

function width(width) {
  return width == null ? this.rx() * 2 : this.rx(new SVGNumber(width).divide(2));
} // Set height of element

function height(height) {
  return height == null ? this.ry() * 2 : this.ry(new SVGNumber(height).divide(2));
}

var circled = ({
	__proto__: null,
	rx: rx,
	ry: ry,
	x: x,
	y: y$1,
	cx: cx,
	cy: cy,
	width: width,
	height: height
});

var Shape =
/*#__PURE__*/
function (_Element) {
  _inherits$1(Shape, _Element);

  function Shape() {
    _classCallCheck$1(this, Shape);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(Shape).apply(this, arguments));
  }

  return Shape;
}(Element);
register(Shape, 'Shape');

var Circle =
/*#__PURE__*/
function (_Shape) {
  _inherits$1(Circle, _Shape);

  function Circle(node) {
    _classCallCheck$1(this, Circle);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(Circle).call(this, nodeOrNew('circle', node), node));
  }

  _createClass$1(Circle, [{
    key: "radius",
    value: function radius(r) {
      return this.attr('r', r);
    } // Radius x value

  }, {
    key: "rx",
    value: function rx(_rx) {
      return this.attr('r', _rx);
    } // Alias radius x value

  }, {
    key: "ry",
    value: function ry(_ry) {
      return this.rx(_ry);
    }
  }, {
    key: "size",
    value: function size(_size) {
      return this.radius(new SVGNumber(_size).divide(2));
    }
  }]);

  return Circle;
}(Shape);
extend(Circle, {
  x: x,
  y: y$1,
  cx: cx,
  cy: cy,
  width: width,
  height: height
});
registerMethods({
  Container: {
    // Create circle element
    circle: wrapWithAttrCheck(function (size) {
      return this.put(new Circle()).size(size).move(0, 0);
    })
  }
});
register(Circle, 'Circle');

var Container =
/*#__PURE__*/
function (_Element) {
  _inherits$1(Container, _Element);

  function Container() {
    _classCallCheck$1(this, Container);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(Container).apply(this, arguments));
  }

  _createClass$1(Container, [{
    key: "flatten",
    value: function flatten(parent) {
      this.each(function () {
        if (this instanceof Container) return this.flatten(parent).ungroup(parent);
        return this.toParent(parent);
      }); // we need this so that the root does not get removed

      this.node.firstElementChild || this.remove();
      return this;
    }
  }, {
    key: "ungroup",
    value: function ungroup(parent) {
      parent = parent || this.parent();
      this.each(function () {
        return this.toParent(parent);
      });
      this.remove();
      return this;
    }
  }]);

  return Container;
}(Element);
register(Container, 'Container');

var Defs =
/*#__PURE__*/
function (_Container) {
  _inherits$1(Defs, _Container);

  function Defs(node) {
    _classCallCheck$1(this, Defs);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(Defs).call(this, nodeOrNew('defs', node), node));
  }

  _createClass$1(Defs, [{
    key: "flatten",
    value: function flatten() {
      return this;
    }
  }, {
    key: "ungroup",
    value: function ungroup() {
      return this;
    }
  }]);

  return Defs;
}(Container);
register(Defs, 'Defs');

var Ellipse =
/*#__PURE__*/
function (_Shape) {
  _inherits$1(Ellipse, _Shape);

  function Ellipse(node) {
    _classCallCheck$1(this, Ellipse);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(Ellipse).call(this, nodeOrNew('ellipse', node), node));
  }

  _createClass$1(Ellipse, [{
    key: "size",
    value: function size(width, height) {
      var p = proportionalSize(this, width, height);
      return this.rx(new SVGNumber(p.width).divide(2)).ry(new SVGNumber(p.height).divide(2));
    }
  }]);

  return Ellipse;
}(Shape);
extend(Ellipse, circled);
registerMethods('Container', {
  // Create an ellipse
  ellipse: wrapWithAttrCheck(function () {
    var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : width;
    return this.put(new Ellipse()).size(width, height).move(0, 0);
  })
});
register(Ellipse, 'Ellipse');

var Stop =
/*#__PURE__*/
function (_Element) {
  _inherits$1(Stop, _Element);

  function Stop(node) {
    _classCallCheck$1(this, Stop);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(Stop).call(this, nodeOrNew('stop', node), node));
  } // add color stops


  _createClass$1(Stop, [{
    key: "update",
    value: function update(o) {
      if (typeof o === 'number' || o instanceof SVGNumber) {
        o = {
          offset: arguments[0],
          color: arguments[1],
          opacity: arguments[2]
        };
      } // set attributes


      if (o.opacity != null) this.attr('stop-opacity', o.opacity);
      if (o.color != null) this.attr('stop-color', o.color);
      if (o.offset != null) this.attr('offset', new SVGNumber(o.offset));
      return this;
    }
  }]);

  return Stop;
}(Element);
register(Stop, 'Stop');

function from(x, y) {
  return (this._element || this).type === 'radialGradient' ? this.attr({
    fx: new SVGNumber(x),
    fy: new SVGNumber(y)
  }) : this.attr({
    x1: new SVGNumber(x),
    y1: new SVGNumber(y)
  });
}
function to(x, y) {
  return (this._element || this).type === 'radialGradient' ? this.attr({
    cx: new SVGNumber(x),
    cy: new SVGNumber(y)
  }) : this.attr({
    x2: new SVGNumber(x),
    y2: new SVGNumber(y)
  });
}

var gradiented = ({
	__proto__: null,
	from: from,
	to: to
});

var Gradient =
/*#__PURE__*/
function (_Container) {
  _inherits$1(Gradient, _Container);

  function Gradient(type, attrs) {
    _classCallCheck$1(this, Gradient);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(Gradient).call(this, nodeOrNew(type + 'Gradient', typeof type === 'string' ? null : type), attrs));
  } // Add a color stop


  _createClass$1(Gradient, [{
    key: "stop",
    value: function stop(offset, color, opacity) {
      return this.put(new Stop()).update(offset, color, opacity);
    } // Update gradient

  }, {
    key: "update",
    value: function update(block) {
      // remove all stops
      this.clear(); // invoke passed block

      if (typeof block === 'function') {
        block.call(this, this);
      }

      return this;
    } // Return the fill id

  }, {
    key: "url",
    value: function url() {
      return 'url(#' + this.id() + ')';
    } // Alias string convertion to fill

  }, {
    key: "toString",
    value: function toString() {
      return this.url();
    } // custom attr to handle transform

  }, {
    key: "attr",
    value: function attr(a, b, c) {
      if (a === 'transform') a = 'gradientTransform';
      return _get(_getPrototypeOf$1(Gradient.prototype), "attr", this).call(this, a, b, c);
    }
  }, {
    key: "targets",
    value: function targets() {
      return baseFind('svg [fill*="' + this.id() + '"]');
    }
  }, {
    key: "bbox",
    value: function bbox() {
      return new Box();
    }
  }]);

  return Gradient;
}(Container);
extend(Gradient, gradiented);
registerMethods({
  Container: {
    // Create gradient element in defs
    gradient: wrapWithAttrCheck(function (type, block) {
      return this.defs().gradient(type, block);
    })
  },
  // define gradient
  Defs: {
    gradient: wrapWithAttrCheck(function (type, block) {
      return this.put(new Gradient(type)).update(block);
    })
  }
});
register(Gradient, 'Gradient');

var Pattern =
/*#__PURE__*/
function (_Container) {
  _inherits$1(Pattern, _Container);

  // Initialize node
  function Pattern(node) {
    _classCallCheck$1(this, Pattern);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(Pattern).call(this, nodeOrNew('pattern', node), node));
  } // Return the fill id


  _createClass$1(Pattern, [{
    key: "url",
    value: function url() {
      return 'url(#' + this.id() + ')';
    } // Update pattern by rebuilding

  }, {
    key: "update",
    value: function update(block) {
      // remove content
      this.clear(); // invoke passed block

      if (typeof block === 'function') {
        block.call(this, this);
      }

      return this;
    } // Alias string convertion to fill

  }, {
    key: "toString",
    value: function toString() {
      return this.url();
    } // custom attr to handle transform

  }, {
    key: "attr",
    value: function attr(a, b, c) {
      if (a === 'transform') a = 'patternTransform';
      return _get(_getPrototypeOf$1(Pattern.prototype), "attr", this).call(this, a, b, c);
    }
  }, {
    key: "targets",
    value: function targets() {
      return baseFind('svg [fill*="' + this.id() + '"]');
    }
  }, {
    key: "bbox",
    value: function bbox() {
      return new Box();
    }
  }]);

  return Pattern;
}(Container);
registerMethods({
  Container: {
    // Create pattern element in defs
    pattern: function pattern() {
      var _this$defs;

      return (_this$defs = this.defs()).pattern.apply(_this$defs, arguments);
    }
  },
  Defs: {
    pattern: wrapWithAttrCheck(function (width, height, block) {
      return this.put(new Pattern()).update(block).attr({
        x: 0,
        y: 0,
        width: width,
        height: height,
        patternUnits: 'userSpaceOnUse'
      });
    })
  }
});
register(Pattern, 'Pattern');

var Image =
/*#__PURE__*/
function (_Shape) {
  _inherits$1(Image, _Shape);

  function Image(node) {
    _classCallCheck$1(this, Image);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(Image).call(this, nodeOrNew('image', node), node));
  } // (re)load image


  _createClass$1(Image, [{
    key: "load",
    value: function load(url, callback) {
      if (!url) return this;
      var img = new globals.window.Image();
      on(img, 'load', function (e) {
        var p = this.parent(Pattern); // ensure image size

        if (this.width() === 0 && this.height() === 0) {
          this.size(img.width, img.height);
        }

        if (p instanceof Pattern) {
          // ensure pattern size if not set
          if (p.width() === 0 && p.height() === 0) {
            p.size(this.width(), this.height());
          }
        }

        if (typeof callback === 'function') {
          callback.call(this, e);
        }
      }, this);
      on(img, 'load error', function () {
        // dont forget to unbind memory leaking events
        off(img);
      });
      return this.attr('href', img.src = url, xlink);
    }
  }]);

  return Image;
}(Shape);
registerAttrHook(function (attr, val, _this) {
  // convert image fill and stroke to patterns
  if (attr === 'fill' || attr === 'stroke') {
    if (isImage.test(val)) {
      val = _this.root().defs().image(val);
    }
  }

  if (val instanceof Image) {
    val = _this.root().defs().pattern(0, 0, function (pattern) {
      pattern.add(val);
    });
  }

  return val;
});
registerMethods({
  Container: {
    // create image element, load image and set its size
    image: wrapWithAttrCheck(function (source, callback) {
      return this.put(new Image()).size(0, 0).load(source, callback);
    })
  }
});
register(Image, 'Image');

var PointArray = subClassArray('PointArray', SVGArray);
extend(PointArray, {
  // Convert array to string
  toString: function toString() {
    // convert to a poly point string
    for (var i = 0, il = this.length, array = []; i < il; i++) {
      array.push(this[i].join(','));
    }

    return array.join(' ');
  },
  // Convert array to line object
  toLine: function toLine() {
    return {
      x1: this[0][0],
      y1: this[0][1],
      x2: this[1][0],
      y2: this[1][1]
    };
  },
  // Get morphed array at given position
  at: function at(pos) {
    // make sure a destination is defined
    if (!this.destination) return this; // generate morphed point string

    for (var i = 0, il = this.length, array = []; i < il; i++) {
      array.push([this[i][0] + (this.destination[i][0] - this[i][0]) * pos, this[i][1] + (this.destination[i][1] - this[i][1]) * pos]);
    }

    return new PointArray(array);
  },
  // Parse point string and flat array
  parse: function parse() {
    var array = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [[0, 0]];
    var points = []; // if it is an array

    if (array instanceof Array) {
      // and it is not flat, there is no need to parse it
      if (array[0] instanceof Array) {
        return array;
      }
    } else {
      // Else, it is considered as a string
      // parse points
      array = array.trim().split(delimiter).map(parseFloat);
    } // validate points - https://svgwg.org/svg2-draft/shapes.html#DataTypePoints
    // Odd number of coordinates is an error. In such cases, drop the last odd coordinate.


    if (array.length % 2 !== 0) array.pop(); // wrap points in two-tuples

    for (var i = 0, len = array.length; i < len; i = i + 2) {
      points.push([array[i], array[i + 1]]);
    }

    return points;
  },
  // transform points with matrix (similar to Point.transform)
  transform: function transform(m) {
    var points = [];

    for (var i = 0; i < this.length; i++) {
      var point = this[i]; // Perform the matrix multiplication

      points.push([m.a * point[0] + m.c * point[1] + m.e, m.b * point[0] + m.d * point[1] + m.f]);
    } // Return the required point


    return new PointArray(points);
  },
  // Move point string
  move: function move(x, y) {
    var box = this.bbox(); // get relative offset

    x -= box.x;
    y -= box.y; // move every point

    if (!isNaN(x) && !isNaN(y)) {
      for (var i = this.length - 1; i >= 0; i--) {
        this[i] = [this[i][0] + x, this[i][1] + y];
      }
    }

    return this;
  },
  // Resize poly string
  size: function size(width, height) {
    var i;
    var box = this.bbox(); // recalculate position of all points according to new size

    for (i = this.length - 1; i >= 0; i--) {
      if (box.width) this[i][0] = (this[i][0] - box.x) * width / box.width + box.x;
      if (box.height) this[i][1] = (this[i][1] - box.y) * height / box.height + box.y;
    }

    return this;
  },
  // Get bounding box of points
  bbox: function bbox() {
    var maxX = -Infinity;
    var maxY = -Infinity;
    var minX = Infinity;
    var minY = Infinity;
    this.forEach(function (el) {
      maxX = Math.max(el[0], maxX);
      maxY = Math.max(el[1], maxY);
      minX = Math.min(el[0], minX);
      minY = Math.min(el[1], minY);
    });
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
});

var MorphArray = PointArray; // Move by left top corner over x-axis

function x$1(x) {
  return x == null ? this.bbox().x : this.move(x, this.bbox().y);
} // Move by left top corner over y-axis

function y$1$1(y) {
  return y == null ? this.bbox().y : this.move(this.bbox().x, y);
} // Set width of element

function width$1(width) {
  var b = this.bbox();
  return width == null ? b.width : this.size(width, b.height);
} // Set height of element

function height$1(height) {
  var b = this.bbox();
  return height == null ? b.height : this.size(b.width, height);
}

var pointed = ({
	__proto__: null,
	MorphArray: MorphArray,
	x: x$1,
	y: y$1$1,
	width: width$1,
	height: height$1
});

var Line =
/*#__PURE__*/
function (_Shape) {
  _inherits$1(Line, _Shape);

  // Initialize node
  function Line(node) {
    _classCallCheck$1(this, Line);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(Line).call(this, nodeOrNew('line', node), node));
  } // Get array


  _createClass$1(Line, [{
    key: "array",
    value: function array() {
      return new PointArray([[this.attr('x1'), this.attr('y1')], [this.attr('x2'), this.attr('y2')]]);
    } // Overwrite native plot() method

  }, {
    key: "plot",
    value: function plot(x1, y1, x2, y2) {
      if (x1 == null) {
        return this.array();
      } else if (typeof y1 !== 'undefined') {
        x1 = {
          x1: x1,
          y1: y1,
          x2: x2,
          y2: y2
        };
      } else {
        x1 = new PointArray(x1).toLine();
      }

      return this.attr(x1);
    } // Move by left top corner

  }, {
    key: "move",
    value: function move(x, y) {
      return this.attr(this.array().move(x, y).toLine());
    } // Set element size to given width and height

  }, {
    key: "size",
    value: function size(width, height) {
      var p = proportionalSize(this, width, height);
      return this.attr(this.array().size(p.width, p.height).toLine());
    }
  }]);

  return Line;
}(Shape);
extend(Line, pointed);
registerMethods({
  Container: {
    // Create a line element
    line: wrapWithAttrCheck(function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      // make sure plot is called as a setter
      // x1 is not necessarily a number, it can also be an array, a string and a PointArray
      return Line.prototype.plot.apply(this.put(new Line()), args[0] != null ? args : [0, 0, 0, 0]);
    })
  }
});
register(Line, 'Line');

var Marker =
/*#__PURE__*/
function (_Container) {
  _inherits$1(Marker, _Container);

  // Initialize node
  function Marker(node) {
    _classCallCheck$1(this, Marker);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(Marker).call(this, nodeOrNew('marker', node), node));
  } // Set width of element


  _createClass$1(Marker, [{
    key: "width",
    value: function width(_width) {
      return this.attr('markerWidth', _width);
    } // Set height of element

  }, {
    key: "height",
    value: function height(_height) {
      return this.attr('markerHeight', _height);
    } // Set marker refX and refY

  }, {
    key: "ref",
    value: function ref(x, y) {
      return this.attr('refX', x).attr('refY', y);
    } // Update marker

  }, {
    key: "update",
    value: function update(block) {
      // remove all content
      this.clear(); // invoke passed block

      if (typeof block === 'function') {
        block.call(this, this);
      }

      return this;
    } // Return the fill id

  }, {
    key: "toString",
    value: function toString() {
      return 'url(#' + this.id() + ')';
    }
  }]);

  return Marker;
}(Container);
registerMethods({
  Container: {
    marker: function marker() {
      var _this$defs;

      // Create marker element in defs
      return (_this$defs = this.defs()).marker.apply(_this$defs, arguments);
    }
  },
  Defs: {
    // Create marker
    marker: wrapWithAttrCheck(function (width, height, block) {
      // Set default viewbox to match the width and height, set ref to cx and cy and set orient to auto
      return this.put(new Marker()).size(width, height).ref(width / 2, height / 2).viewbox(0, 0, width, height).attr('orient', 'auto').update(block);
    })
  },
  marker: {
    // Create and attach markers
    marker: function marker(_marker, width, height, block) {
      var attr = ['marker']; // Build attribute name

      if (_marker !== 'all') attr.push(_marker);
      attr = attr.join('-'); // Set marker attribute

      _marker = arguments[1] instanceof Marker ? arguments[1] : this.defs().marker(width, height, block);
      return this.attr(attr, _marker);
    }
  }
});
register(Marker, 'Marker');

var nativeSort = [].sort;
var test$2 = [1, 2, 3];

// IE8-
var FAILS_ON_UNDEFINED = fails$1(function () {
  test$2.sort(undefined);
});
// V8 bug
var FAILS_ON_NULL = fails$1(function () {
  test$2.sort(null);
});
// Old WebKit
var SLOPPY_METHOD$2 = sloppyArrayMethod('sort');

var FORCED$4 = FAILS_ON_UNDEFINED || !FAILS_ON_NULL || SLOPPY_METHOD$2;

// `Array.prototype.sort` method
// https://tc39.github.io/ecma262/#sec-array.prototype.sort
_export$1({ target: 'Array', proto: true, forced: FORCED$4 }, {
  sort: function sort(comparefn) {
    return comparefn === undefined
      ? nativeSort.call(toObject$1(this))
      : nativeSort.call(toObject$1(this), aFunction$1$1(comparefn));
  }
});

/***
Base Class
==========
The base stepper class that will be
***/

function makeSetterGetter(k, f) {
  return function (v) {
    if (v == null) return this[v];
    this[k] = v;
    if (f) f.call(this);
    return this;
  };
}

var easing = {
  '-': function _(pos) {
    return pos;
  },
  '<>': function _(pos) {
    return -Math.cos(pos * Math.PI) / 2 + 0.5;
  },
  '>': function _(pos) {
    return Math.sin(pos * Math.PI / 2);
  },
  '<': function _(pos) {
    return -Math.cos(pos * Math.PI / 2) + 1;
  },
  bezier: function bezier(x1, y1, x2, y2) {
    // see https://www.w3.org/TR/css-easing-1/#cubic-bezier-algo
    return function (t) {
      if (t < 0) {
        if (x1 > 0) {
          return y1 / x1 * t;
        } else if (x2 > 0) {
          return y2 / x2 * t;
        } else {
          return 0;
        }
      } else if (t > 1) {
        if (x2 < 1) {
          return (1 - y2) / (1 - x2) * t + (y2 - x2) / (1 - x2);
        } else if (x1 < 1) {
          return (1 - y1) / (1 - x1) * t + (y1 - x1) / (1 - x1);
        } else {
          return 1;
        }
      } else {
        return 3 * t * Math.pow(1 - t, 2) * y1 + 3 * Math.pow(t, 2) * (1 - t) * y2 + Math.pow(t, 3);
      }
    };
  },
  // see https://www.w3.org/TR/css-easing-1/#step-timing-function-algo
  steps: function steps(_steps) {
    var stepPosition = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'end';
    // deal with "jump-" prefix
    stepPosition = stepPosition.split('-').reverse()[0];
    var jumps = _steps;

    if (stepPosition === 'none') {
      --jumps;
    } else if (stepPosition === 'both') {
      ++jumps;
    } // The beforeFlag is essentially useless


    return function (t) {
      var beforeFlag = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      // Step is called currentStep in referenced url
      var step = Math.floor(t * _steps);
      var jumping = t * step % 1 === 0;

      if (stepPosition === 'start' || stepPosition === 'both') {
        ++step;
      }

      if (beforeFlag && jumping) {
        --step;
      }

      if (t >= 0 && step < 0) {
        step = 0;
      }

      if (t <= 1 && step > jumps) {
        step = jumps;
      }

      return step / jumps;
    };
  }
};
var Stepper =
/*#__PURE__*/
function () {
  function Stepper() {
    _classCallCheck$1(this, Stepper);
  }

  _createClass$1(Stepper, [{
    key: "done",
    value: function done() {
      return false;
    }
  }]);

  return Stepper;
}();
/***
Easing Functions
================
***/

var Ease =
/*#__PURE__*/
function (_Stepper) {
  _inherits$1(Ease, _Stepper);

  function Ease(fn) {
    var _this;

    _classCallCheck$1(this, Ease);

    _this = _possibleConstructorReturn$1(this, _getPrototypeOf$1(Ease).call(this));
    _this.ease = easing[fn || timeline.ease] || fn;
    return _this;
  }

  _createClass$1(Ease, [{
    key: "step",
    value: function step(from, to, pos) {
      if (typeof from !== 'number') {
        return pos < 1 ? from : to;
      }

      return from + (to - from) * this.ease(pos);
    }
  }]);

  return Ease;
}(Stepper);
/***
Controller Types
================
***/

var Controller =
/*#__PURE__*/
function (_Stepper2) {
  _inherits$1(Controller, _Stepper2);

  function Controller(fn) {
    var _this2;

    _classCallCheck$1(this, Controller);

    _this2 = _possibleConstructorReturn$1(this, _getPrototypeOf$1(Controller).call(this));
    _this2.stepper = fn;
    return _this2;
  }

  _createClass$1(Controller, [{
    key: "step",
    value: function step(current, target, dt, c) {
      return this.stepper(current, target, dt, c);
    }
  }, {
    key: "done",
    value: function done(c) {
      return c.done;
    }
  }]);

  return Controller;
}(Stepper);

function recalculate() {
  // Apply the default parameters
  var duration = (this._duration || 500) / 1000;
  var overshoot = this._overshoot || 0; // Calculate the PID natural response

  var eps = 1e-10;
  var pi = Math.PI;
  var os = Math.log(overshoot / 100 + eps);
  var zeta = -os / Math.sqrt(pi * pi + os * os);
  var wn = 3.9 / (zeta * duration); // Calculate the Spring values

  this.d = 2 * zeta * wn;
  this.k = wn * wn;
}

var Spring =
/*#__PURE__*/
function (_Controller) {
  _inherits$1(Spring, _Controller);

  function Spring(duration, overshoot) {
    var _this3;

    _classCallCheck$1(this, Spring);

    _this3 = _possibleConstructorReturn$1(this, _getPrototypeOf$1(Spring).call(this));

    _this3.duration(duration || 500).overshoot(overshoot || 0);

    return _this3;
  }

  _createClass$1(Spring, [{
    key: "step",
    value: function step(current, target, dt, c) {
      if (typeof current === 'string') return current;
      c.done = dt === Infinity;
      if (dt === Infinity) return target;
      if (dt === 0) return current;
      if (dt > 100) dt = 16;
      dt /= 1000; // Get the previous velocity

      var velocity = c.velocity || 0; // Apply the control to get the new position and store it

      var acceleration = -this.d * velocity - this.k * (current - target);
      var newPosition = current + velocity * dt + acceleration * dt * dt / 2; // Store the velocity

      c.velocity = velocity + acceleration * dt; // Figure out if we have converged, and if so, pass the value

      c.done = Math.abs(target - newPosition) + Math.abs(velocity) < 0.002;
      return c.done ? target : newPosition;
    }
  }]);

  return Spring;
}(Controller);
extend(Spring, {
  duration: makeSetterGetter('_duration', recalculate),
  overshoot: makeSetterGetter('_overshoot', recalculate)
});
var PID =
/*#__PURE__*/
function (_Controller2) {
  _inherits$1(PID, _Controller2);

  function PID(p, i, d, windup) {
    var _this4;

    _classCallCheck$1(this, PID);

    _this4 = _possibleConstructorReturn$1(this, _getPrototypeOf$1(PID).call(this));
    p = p == null ? 0.1 : p;
    i = i == null ? 0.01 : i;
    d = d == null ? 0 : d;
    windup = windup == null ? 1000 : windup;

    _this4.p(p).i(i).d(d).windup(windup);

    return _this4;
  }

  _createClass$1(PID, [{
    key: "step",
    value: function step(current, target, dt, c) {
      if (typeof current === 'string') return current;
      c.done = dt === Infinity;
      if (dt === Infinity) return target;
      if (dt === 0) return current;
      var p = target - current;
      var i = (c.integral || 0) + p * dt;
      var d = (p - (c.error || 0)) / dt;
      var windup = this.windup; // antiwindup

      if (windup !== false) {
        i = Math.max(-windup, Math.min(i, windup));
      }

      c.error = p;
      c.integral = i;
      c.done = Math.abs(p) < 0.001;
      return c.done ? target : current + (this.P * p + this.I * i + this.D * d);
    }
  }]);

  return PID;
}(Controller);
extend(PID, {
  windup: makeSetterGetter('windup'),
  p: makeSetterGetter('P'),
  i: makeSetterGetter('I'),
  d: makeSetterGetter('D')
});

var PathArray = subClassArray('PathArray', SVGArray);
function pathRegReplace(a, b, c, d) {
  return c + d.replace(dots, ' .');
}

function arrayToString(a) {
  for (var i = 0, il = a.length, s = ''; i < il; i++) {
    s += a[i][0];

    if (a[i][1] != null) {
      s += a[i][1];

      if (a[i][2] != null) {
        s += ' ';
        s += a[i][2];

        if (a[i][3] != null) {
          s += ' ';
          s += a[i][3];
          s += ' ';
          s += a[i][4];

          if (a[i][5] != null) {
            s += ' ';
            s += a[i][5];
            s += ' ';
            s += a[i][6];

            if (a[i][7] != null) {
              s += ' ';
              s += a[i][7];
            }
          }
        }
      }
    }
  }

  return s + ' ';
}

var pathHandlers = {
  M: function M(c, p, p0) {
    p.x = p0.x = c[0];
    p.y = p0.y = c[1];
    return ['M', p.x, p.y];
  },
  L: function L(c, p) {
    p.x = c[0];
    p.y = c[1];
    return ['L', c[0], c[1]];
  },
  H: function H(c, p) {
    p.x = c[0];
    return ['H', c[0]];
  },
  V: function V(c, p) {
    p.y = c[0];
    return ['V', c[0]];
  },
  C: function C(c, p) {
    p.x = c[4];
    p.y = c[5];
    return ['C', c[0], c[1], c[2], c[3], c[4], c[5]];
  },
  S: function S(c, p) {
    p.x = c[2];
    p.y = c[3];
    return ['S', c[0], c[1], c[2], c[3]];
  },
  Q: function Q(c, p) {
    p.x = c[2];
    p.y = c[3];
    return ['Q', c[0], c[1], c[2], c[3]];
  },
  T: function T(c, p) {
    p.x = c[0];
    p.y = c[1];
    return ['T', c[0], c[1]];
  },
  Z: function Z(c, p, p0) {
    p.x = p0.x;
    p.y = p0.y;
    return ['Z'];
  },
  A: function A(c, p) {
    p.x = c[5];
    p.y = c[6];
    return ['A', c[0], c[1], c[2], c[3], c[4], c[5], c[6]];
  }
};
var mlhvqtcsaz = 'mlhvqtcsaz'.split('');

for (var i$1 = 0, il = mlhvqtcsaz.length; i$1 < il; ++i$1) {
  pathHandlers[mlhvqtcsaz[i$1]] = function (i) {
    return function (c, p, p0) {
      if (i === 'H') c[0] = c[0] + p.x;else if (i === 'V') c[0] = c[0] + p.y;else if (i === 'A') {
        c[5] = c[5] + p.x;
        c[6] = c[6] + p.y;
      } else {
        for (var j = 0, jl = c.length; j < jl; ++j) {
          c[j] = c[j] + (j % 2 ? p.y : p.x);
        }
      }
      return pathHandlers[i](c, p, p0);
    };
  }(mlhvqtcsaz[i$1].toUpperCase());
}

extend(PathArray, {
  // Convert array to string
  toString: function toString() {
    return arrayToString(this);
  },
  // Move path string
  move: function move(x, y) {
    // get bounding box of current situation
    var box = this.bbox(); // get relative offset

    x -= box.x;
    y -= box.y;

    if (!isNaN(x) && !isNaN(y)) {
      // move every point
      for (var l, i = this.length - 1; i >= 0; i--) {
        l = this[i][0];

        if (l === 'M' || l === 'L' || l === 'T') {
          this[i][1] += x;
          this[i][2] += y;
        } else if (l === 'H') {
          this[i][1] += x;
        } else if (l === 'V') {
          this[i][1] += y;
        } else if (l === 'C' || l === 'S' || l === 'Q') {
          this[i][1] += x;
          this[i][2] += y;
          this[i][3] += x;
          this[i][4] += y;

          if (l === 'C') {
            this[i][5] += x;
            this[i][6] += y;
          }
        } else if (l === 'A') {
          this[i][6] += x;
          this[i][7] += y;
        }
      }
    }

    return this;
  },
  // Resize path string
  size: function size(width, height) {
    // get bounding box of current situation
    var box = this.bbox();
    var i, l; // If the box width or height is 0 then we ignore
    // transformations on the respective axis

    box.width = box.width === 0 ? 1 : box.width;
    box.height = box.height === 0 ? 1 : box.height; // recalculate position of all points according to new size

    for (i = this.length - 1; i >= 0; i--) {
      l = this[i][0];

      if (l === 'M' || l === 'L' || l === 'T') {
        this[i][1] = (this[i][1] - box.x) * width / box.width + box.x;
        this[i][2] = (this[i][2] - box.y) * height / box.height + box.y;
      } else if (l === 'H') {
        this[i][1] = (this[i][1] - box.x) * width / box.width + box.x;
      } else if (l === 'V') {
        this[i][1] = (this[i][1] - box.y) * height / box.height + box.y;
      } else if (l === 'C' || l === 'S' || l === 'Q') {
        this[i][1] = (this[i][1] - box.x) * width / box.width + box.x;
        this[i][2] = (this[i][2] - box.y) * height / box.height + box.y;
        this[i][3] = (this[i][3] - box.x) * width / box.width + box.x;
        this[i][4] = (this[i][4] - box.y) * height / box.height + box.y;

        if (l === 'C') {
          this[i][5] = (this[i][5] - box.x) * width / box.width + box.x;
          this[i][6] = (this[i][6] - box.y) * height / box.height + box.y;
        }
      } else if (l === 'A') {
        // resize radii
        this[i][1] = this[i][1] * width / box.width;
        this[i][2] = this[i][2] * height / box.height; // move position values

        this[i][6] = (this[i][6] - box.x) * width / box.width + box.x;
        this[i][7] = (this[i][7] - box.y) * height / box.height + box.y;
      }
    }

    return this;
  },
  // Test if the passed path array use the same path data commands as this path array
  equalCommands: function equalCommands(pathArray) {
    var i, il, equalCommands;
    pathArray = new PathArray(pathArray);
    equalCommands = this.length === pathArray.length;

    for (i = 0, il = this.length; equalCommands && i < il; i++) {
      equalCommands = this[i][0] === pathArray[i][0];
    }

    return equalCommands;
  },
  // Make path array morphable
  morph: function morph(pathArray) {
    pathArray = new PathArray(pathArray);

    if (this.equalCommands(pathArray)) {
      this.destination = pathArray;
    } else {
      this.destination = null;
    }

    return this;
  },
  // Get morphed path array at given position
  at: function at(pos) {
    // make sure a destination is defined
    if (!this.destination) return this;
    var sourceArray = this;
    var destinationArray = this.destination.value;
    var array = [];
    var pathArray = new PathArray();
    var i, il, j, jl; // Animate has specified in the SVG spec
    // See: https://www.w3.org/TR/SVG11/paths.html#PathElement

    for (i = 0, il = sourceArray.length; i < il; i++) {
      array[i] = [sourceArray[i][0]];

      for (j = 1, jl = sourceArray[i].length; j < jl; j++) {
        array[i][j] = sourceArray[i][j] + (destinationArray[i][j] - sourceArray[i][j]) * pos;
      } // For the two flags of the elliptical arc command, the SVG spec say:
      // Flags and booleans are interpolated as fractions between zero and one, with any non-zero value considered to be a value of one/true
      // Elliptical arc command as an array followed by corresponding indexes:
      // ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
      //   0    1   2        3                 4             5      6  7


      if (array[i][0] === 'A') {
        array[i][4] = +(array[i][4] !== 0);
        array[i][5] = +(array[i][5] !== 0);
      }
    } // Directly modify the value of a path array, this is done this way for performance


    pathArray.value = array;
    return pathArray;
  },
  // Absolutize and parse path to array
  parse: function parse() {
    var array = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [['M', 0, 0]];
    // if it's already a patharray, no need to parse it
    if (array instanceof PathArray) return array; // prepare for parsing

    var s;
    var paramCnt = {
      M: 2,
      L: 2,
      H: 1,
      V: 1,
      C: 6,
      S: 4,
      Q: 4,
      T: 2,
      A: 7,
      Z: 0
    };

    if (typeof array === 'string') {
      array = array.replace(numbersWithDots, pathRegReplace) // convert 45.123.123 to 45.123 .123
      .replace(pathLetters, ' $& ') // put some room between letters and numbers
      .replace(hyphen, '$1 -') // add space before hyphen
      .trim() // trim
      .split(delimiter); // split into array
    } else {
      array = array.reduce(function (prev, curr) {
        return [].concat.call(prev, curr);
      }, []);
    } // array now is an array containing all parts of a path e.g. ['M', '0', '0', 'L', '30', '30' ...]


    var result = [];
    var p = new Point$1();
    var p0 = new Point$1();
    var index = 0;
    var len = array.length;

    do {
      // Test if we have a path letter
      if (isPathLetter.test(array[index])) {
        s = array[index];
        ++index; // If last letter was a move command and we got no new, it defaults to [L]ine
      } else if (s === 'M') {
        s = 'L';
      } else if (s === 'm') {
        s = 'l';
      }

      result.push(pathHandlers[s].call(null, array.slice(index, index = index + paramCnt[s.toUpperCase()]).map(parseFloat), p, p0));
    } while (len > index);

    return result;
  },
  // Get bounding box of path
  bbox: function bbox() {
    parser().path.setAttribute('d', this.toString());
    return parser.nodes.path.getBBox();
  }
});

var Morphable =
/*#__PURE__*/
function () {
  function Morphable(stepper) {
    _classCallCheck$1(this, Morphable);

    this._stepper = stepper || new Ease('-');
    this._from = null;
    this._to = null;
    this._type = null;
    this._context = null;
    this._morphObj = null;
  }

  _createClass$1(Morphable, [{
    key: "from",
    value: function from(val) {
      if (val == null) {
        return this._from;
      }

      this._from = this._set(val);
      return this;
    }
  }, {
    key: "to",
    value: function to(val) {
      if (val == null) {
        return this._to;
      }

      this._to = this._set(val);
      return this;
    }
  }, {
    key: "type",
    value: function type(_type) {
      // getter
      if (_type == null) {
        return this._type;
      } // setter


      this._type = _type;
      return this;
    }
  }, {
    key: "_set",
    value: function _set(value) {
      if (!this._type) {
        var type = _typeof(value);

        if (type === 'number') {
          this.type(SVGNumber);
        } else if (type === 'string') {
          if (Color.isColor(value)) {
            this.type(Color);
          } else if (delimiter.test(value)) {
            this.type(pathLetters.test(value) ? PathArray : SVGArray);
          } else if (numberAndUnit.test(value)) {
            this.type(SVGNumber);
          } else {
            this.type(NonMorphable);
          }
        } else if (morphableTypes.indexOf(value.constructor) > -1) {
          this.type(value.constructor);
        } else if (Array.isArray(value)) {
          this.type(SVGArray);
        } else if (type === 'object') {
          this.type(ObjectBag);
        } else {
          this.type(NonMorphable);
        }
      }

      var result = new this._type(value);

      if (this._type === Color) {
        result = this._to ? result[this._to[4]]() : this._from ? result[this._from[4]]() : result;
      }

      result = result.toArray();
      this._morphObj = this._morphObj || new this._type();
      this._context = this._context || Array.apply(null, Array(result.length)).map(Object).map(function (o) {
        o.done = true;
        return o;
      });
      return result;
    }
  }, {
    key: "stepper",
    value: function stepper(_stepper) {
      if (_stepper == null) return this._stepper;
      this._stepper = _stepper;
      return this;
    }
  }, {
    key: "done",
    value: function done() {
      var complete = this._context.map(this._stepper.done).reduce(function (last, curr) {
        return last && curr;
      }, true);

      return complete;
    }
  }, {
    key: "at",
    value: function at(pos) {
      var _this = this;

      return this._morphObj.fromArray(this._from.map(function (i, index) {
        return _this._stepper.step(i, _this._to[index], pos, _this._context[index], _this._context);
      }));
    }
  }]);

  return Morphable;
}();
var NonMorphable =
/*#__PURE__*/
function () {
  function NonMorphable() {
    _classCallCheck$1(this, NonMorphable);

    this.init.apply(this, arguments);
  }

  _createClass$1(NonMorphable, [{
    key: "init",
    value: function init(val) {
      val = Array.isArray(val) ? val[0] : val;
      this.value = val;
      return this;
    }
  }, {
    key: "valueOf",
    value: function valueOf() {
      return this.value;
    }
  }, {
    key: "toArray",
    value: function toArray() {
      return [this.value];
    }
  }]);

  return NonMorphable;
}();
var TransformBag =
/*#__PURE__*/
function () {
  function TransformBag() {
    _classCallCheck$1(this, TransformBag);

    this.init.apply(this, arguments);
  }

  _createClass$1(TransformBag, [{
    key: "init",
    value: function init(obj) {
      if (Array.isArray(obj)) {
        obj = {
          scaleX: obj[0],
          scaleY: obj[1],
          shear: obj[2],
          rotate: obj[3],
          translateX: obj[4],
          translateY: obj[5],
          originX: obj[6],
          originY: obj[7]
        };
      }

      Object.assign(this, TransformBag.defaults, obj);
      return this;
    }
  }, {
    key: "toArray",
    value: function toArray() {
      var v = this;
      return [v.scaleX, v.scaleY, v.shear, v.rotate, v.translateX, v.translateY, v.originX, v.originY];
    }
  }]);

  return TransformBag;
}();
TransformBag.defaults = {
  scaleX: 1,
  scaleY: 1,
  shear: 0,
  rotate: 0,
  translateX: 0,
  translateY: 0,
  originX: 0,
  originY: 0
};
var ObjectBag =
/*#__PURE__*/
function () {
  function ObjectBag() {
    _classCallCheck$1(this, ObjectBag);

    this.init.apply(this, arguments);
  }

  _createClass$1(ObjectBag, [{
    key: "init",
    value: function init(objOrArr) {
      this.values = [];

      if (Array.isArray(objOrArr)) {
        this.values = objOrArr;
        return;
      }

      objOrArr = objOrArr || {};
      var entries = [];

      for (var i in objOrArr) {
        entries.push([i, objOrArr[i]]);
      }

      entries.sort(function (a, b) {
        return a[0] - b[0];
      });
      this.values = entries.reduce(function (last, curr) {
        return last.concat(curr);
      }, []);
      return this;
    }
  }, {
    key: "valueOf",
    value: function valueOf() {
      var obj = {};
      var arr = this.values;

      for (var i = 0, len = arr.length; i < len; i += 2) {
        obj[arr[i]] = arr[i + 1];
      }

      return obj;
    }
  }, {
    key: "toArray",
    value: function toArray() {
      return this.values;
    }
  }]);

  return ObjectBag;
}();
var morphableTypes = [NonMorphable, TransformBag, ObjectBag];
function registerMorphableType() {
  var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  morphableTypes.push.apply(morphableTypes, _toConsumableArray$1([].concat(type)));
}
function makeMorphable() {
  extend(morphableTypes, {
    to: function to(val) {
      return new Morphable().type(this.constructor).from(this.valueOf()).to(val);
    },
    fromArray: function fromArray(arr) {
      this.init(arr);
      return this;
    }
  });
}

var Path =
/*#__PURE__*/
function (_Shape) {
  _inherits$1(Path, _Shape);

  // Initialize node
  function Path(node) {
    _classCallCheck$1(this, Path);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(Path).call(this, nodeOrNew('path', node), node));
  } // Get array


  _createClass$1(Path, [{
    key: "array",
    value: function array() {
      return this._array || (this._array = new PathArray(this.attr('d')));
    } // Plot new path

  }, {
    key: "plot",
    value: function plot(d) {
      return d == null ? this.array() : this.clear().attr('d', typeof d === 'string' ? d : this._array = new PathArray(d));
    } // Clear array cache

  }, {
    key: "clear",
    value: function clear() {
      delete this._array;
      return this;
    } // Move by left top corner

  }, {
    key: "move",
    value: function move(x, y) {
      return this.attr('d', this.array().move(x, y));
    } // Move by left top corner over x-axis

  }, {
    key: "x",
    value: function x(_x) {
      return _x == null ? this.bbox().x : this.move(_x, this.bbox().y);
    } // Move by left top corner over y-axis

  }, {
    key: "y",
    value: function y(_y) {
      return _y == null ? this.bbox().y : this.move(this.bbox().x, _y);
    } // Set element size to given width and height

  }, {
    key: "size",
    value: function size(width, height) {
      var p = proportionalSize(this, width, height);
      return this.attr('d', this.array().size(p.width, p.height));
    } // Set width of element

  }, {
    key: "width",
    value: function width(_width) {
      return _width == null ? this.bbox().width : this.size(_width, this.bbox().height);
    } // Set height of element

  }, {
    key: "height",
    value: function height(_height) {
      return _height == null ? this.bbox().height : this.size(this.bbox().width, _height);
    }
  }, {
    key: "targets",
    value: function targets() {
      return baseFind('svg textpath [href*="' + this.id() + '"]');
    }
  }]);

  return Path;
}(Shape); // Define morphable array
Path.prototype.MorphArray = PathArray; // Add parent method

registerMethods({
  Container: {
    // Create a wrapped path element
    path: wrapWithAttrCheck(function (d) {
      // make sure plot is called as a setter
      return this.put(new Path()).plot(d || new PathArray());
    })
  }
});
register(Path, 'Path');

function array() {
  return this._array || (this._array = new PointArray(this.attr('points')));
} // Plot new path

function plot(p) {
  return p == null ? this.array() : this.clear().attr('points', typeof p === 'string' ? p : this._array = new PointArray(p));
} // Clear array cache

function clear() {
  delete this._array;
  return this;
} // Move by left top corner

function move(x, y) {
  return this.attr('points', this.array().move(x, y));
} // Set element size to given width and height

function size(width, height) {
  var p = proportionalSize(this, width, height);
  return this.attr('points', this.array().size(p.width, p.height));
}

var poly = ({
	__proto__: null,
	array: array,
	plot: plot,
	clear: clear,
	move: move,
	size: size
});

var Polygon =
/*#__PURE__*/
function (_Shape) {
  _inherits$1(Polygon, _Shape);

  // Initialize node
  function Polygon(node) {
    _classCallCheck$1(this, Polygon);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(Polygon).call(this, nodeOrNew('polygon', node), node));
  }

  return Polygon;
}(Shape);
registerMethods({
  Container: {
    // Create a wrapped polygon element
    polygon: wrapWithAttrCheck(function (p) {
      // make sure plot is called as a setter
      return this.put(new Polygon()).plot(p || new PointArray());
    })
  }
});
extend(Polygon, pointed);
extend(Polygon, poly);
register(Polygon, 'Polygon');

var Polyline =
/*#__PURE__*/
function (_Shape) {
  _inherits$1(Polyline, _Shape);

  // Initialize node
  function Polyline(node) {
    _classCallCheck$1(this, Polyline);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(Polyline).call(this, nodeOrNew('polyline', node), node));
  }

  return Polyline;
}(Shape);
registerMethods({
  Container: {
    // Create a wrapped polygon element
    polyline: wrapWithAttrCheck(function (p) {
      // make sure plot is called as a setter
      return this.put(new Polyline()).plot(p || new PointArray());
    })
  }
});
extend(Polyline, pointed);
extend(Polyline, poly);
register(Polyline, 'Polyline');

var Rect =
/*#__PURE__*/
function (_Shape) {
  _inherits$1(Rect, _Shape);

  // Initialize node
  function Rect(node) {
    _classCallCheck$1(this, Rect);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(Rect).call(this, nodeOrNew('rect', node), node));
  }

  return Rect;
}(Shape);
extend(Rect, {
  rx: rx,
  ry: ry
});
registerMethods({
  Container: {
    // Create a rect element
    rect: wrapWithAttrCheck(function (width, height) {
      return this.put(new Rect()).size(width, height);
    })
  }
});
register(Rect, 'Rect');

var max$3 = Math.max;
var min$4 = Math.min;
var MAX_SAFE_INTEGER$1 = 0x1FFFFFFFFFFFFF;
var MAXIMUM_ALLOWED_LENGTH_EXCEEDED = 'Maximum allowed length exceeded';

// `Array.prototype.splice` method
// https://tc39.github.io/ecma262/#sec-array.prototype.splice
// with adding support of @@species
_export$1({ target: 'Array', proto: true, forced: !arrayMethodHasSpeciesSupport$1('splice') }, {
  splice: function splice(start, deleteCount /* , ...items */) {
    var O = toObject$1(this);
    var len = toLength$1(O.length);
    var actualStart = toAbsoluteIndex$1(start, len);
    var argumentsLength = arguments.length;
    var insertCount, actualDeleteCount, A, k, from, to;
    if (argumentsLength === 0) {
      insertCount = actualDeleteCount = 0;
    } else if (argumentsLength === 1) {
      insertCount = 0;
      actualDeleteCount = len - actualStart;
    } else {
      insertCount = argumentsLength - 2;
      actualDeleteCount = min$4(max$3(toInteger$1(deleteCount), 0), len - actualStart);
    }
    if (len + insertCount - actualDeleteCount > MAX_SAFE_INTEGER$1) {
      throw TypeError(MAXIMUM_ALLOWED_LENGTH_EXCEEDED);
    }
    A = arraySpeciesCreate$1(O, actualDeleteCount);
    for (k = 0; k < actualDeleteCount; k++) {
      from = actualStart + k;
      if (from in O) createProperty$1(A, k, O[from]);
    }
    A.length = actualDeleteCount;
    if (insertCount < actualDeleteCount) {
      for (k = actualStart; k < len - actualDeleteCount; k++) {
        from = k + actualDeleteCount;
        to = k + insertCount;
        if (from in O) O[to] = O[from];
        else delete O[to];
      }
      for (k = len; k > len - actualDeleteCount + insertCount; k--) delete O[k - 1];
    } else if (insertCount > actualDeleteCount) {
      for (k = len - actualDeleteCount; k > actualStart; k--) {
        from = k + actualDeleteCount - 1;
        to = k + insertCount - 1;
        if (from in O) O[to] = O[from];
        else delete O[to];
      }
    }
    for (k = 0; k < insertCount; k++) {
      O[k + actualStart] = arguments[k + 2];
    }
    O.length = len - actualDeleteCount + insertCount;
    return A;
  }
});

var Queue =
/*#__PURE__*/
function () {
  function Queue() {
    _classCallCheck$1(this, Queue);

    this._first = null;
    this._last = null;
  }

  _createClass$1(Queue, [{
    key: "push",
    value: function push(value) {
      // An item stores an id and the provided value
      var item = value.next ? value : {
        value: value,
        next: null,
        prev: null
      }; // Deal with the queue being empty or populated

      if (this._last) {
        item.prev = this._last;
        this._last.next = item;
        this._last = item;
      } else {
        this._last = item;
        this._first = item;
      } // Return the current item


      return item;
    }
  }, {
    key: "shift",
    value: function shift() {
      // Check if we have a value
      var remove = this._first;
      if (!remove) return null; // If we do, remove it and relink things

      this._first = remove.next;
      if (this._first) this._first.prev = null;
      this._last = this._first ? this._last : null;
      return remove.value;
    } // Shows us the first item in the list

  }, {
    key: "first",
    value: function first() {
      return this._first && this._first.value;
    } // Shows us the last item in the list

  }, {
    key: "last",
    value: function last() {
      return this._last && this._last.value;
    } // Removes the item that was returned from the push

  }, {
    key: "remove",
    value: function remove(item) {
      // Relink the previous item
      if (item.prev) item.prev.next = item.next;
      if (item.next) item.next.prev = item.prev;
      if (item === this._last) this._last = item.prev;
      if (item === this._first) this._first = item.next; // Invalidate item

      item.prev = null;
      item.next = null;
    }
  }]);

  return Queue;
}();

var Animator = {
  nextDraw: null,
  frames: new Queue(),
  timeouts: new Queue(),
  immediates: new Queue(),
  timer: function timer() {
    return globals.window.performance || globals.window.Date;
  },
  transforms: [],
  frame: function frame(fn) {
    // Store the node
    var node = Animator.frames.push({
      run: fn
    }); // Request an animation frame if we don't have one

    if (Animator.nextDraw === null) {
      Animator.nextDraw = globals.window.requestAnimationFrame(Animator._draw);
    } // Return the node so we can remove it easily


    return node;
  },
  timeout: function timeout(fn, delay) {
    delay = delay || 0; // Work out when the event should fire

    var time = Animator.timer().now() + delay; // Add the timeout to the end of the queue

    var node = Animator.timeouts.push({
      run: fn,
      time: time
    }); // Request another animation frame if we need one

    if (Animator.nextDraw === null) {
      Animator.nextDraw = globals.window.requestAnimationFrame(Animator._draw);
    }

    return node;
  },
  immediate: function immediate(fn) {
    // Add the immediate fn to the end of the queue
    var node = Animator.immediates.push(fn); // Request another animation frame if we need one

    if (Animator.nextDraw === null) {
      Animator.nextDraw = globals.window.requestAnimationFrame(Animator._draw);
    }

    return node;
  },
  cancelFrame: function cancelFrame(node) {
    node != null && Animator.frames.remove(node);
  },
  clearTimeout: function clearTimeout(node) {
    node != null && Animator.timeouts.remove(node);
  },
  cancelImmediate: function cancelImmediate(node) {
    node != null && Animator.immediates.remove(node);
  },
  _draw: function _draw(now) {
    // Run all the timeouts we can run, if they are not ready yet, add them
    // to the end of the queue immediately! (bad timeouts!!! [sarcasm])
    var nextTimeout = null;
    var lastTimeout = Animator.timeouts.last();

    while (nextTimeout = Animator.timeouts.shift()) {
      // Run the timeout if its time, or push it to the end
      if (now >= nextTimeout.time) {
        nextTimeout.run();
      } else {
        Animator.timeouts.push(nextTimeout);
      } // If we hit the last item, we should stop shifting out more items


      if (nextTimeout === lastTimeout) break;
    } // Run all of the animation frames


    var nextFrame = null;
    var lastFrame = Animator.frames.last();

    while (nextFrame !== lastFrame && (nextFrame = Animator.frames.shift())) {
      nextFrame.run(now);
    }

    var nextImmediate = null;

    while (nextImmediate = Animator.immediates.shift()) {
      nextImmediate();
    } // If we have remaining timeouts or frames, draw until we don't anymore


    Animator.nextDraw = Animator.timeouts.first() || Animator.frames.first() ? globals.window.requestAnimationFrame(Animator._draw) : null;
  }
};

var makeSchedule = function makeSchedule(runnerInfo) {
  var start = runnerInfo.start;
  var duration = runnerInfo.runner.duration();
  var end = start + duration;
  return {
    start: start,
    duration: duration,
    end: end,
    runner: runnerInfo.runner
  };
};

var defaultSource = function defaultSource() {
  var w = globals.window;
  return (w.performance || w.Date).now();
};

var Timeline =
/*#__PURE__*/
function (_EventTarget) {
  _inherits$1(Timeline, _EventTarget);

  // Construct a new timeline on the given element
  function Timeline() {
    var _this;

    var timeSource = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultSource;

    _classCallCheck$1(this, Timeline);

    _this = _possibleConstructorReturn$1(this, _getPrototypeOf$1(Timeline).call(this));
    _this._timeSource = timeSource; // Store the timing variables

    _this._startTime = 0;
    _this._speed = 1.0; // Determines how long a runner is hold in memory. Can be a dt or true/false

    _this._persist = 0; // Keep track of the running animations and their starting parameters

    _this._nextFrame = null;
    _this._paused = true;
    _this._runners = [];
    _this._runnerIds = [];
    _this._lastRunnerId = -1;
    _this._time = 0;
    _this._lastSourceTime = 0;
    _this._lastStepTime = 0; // Make sure that step is always called in class context

    _this._step = _this._stepFn.bind(_assertThisInitialized$1(_this), false);
    _this._stepImmediate = _this._stepFn.bind(_assertThisInitialized$1(_this), true);
    return _this;
  } // schedules a runner on the timeline


  _createClass$1(Timeline, [{
    key: "schedule",
    value: function schedule(runner, delay, when) {
      if (runner == null) {
        return this._runners.map(makeSchedule);
      } // The start time for the next animation can either be given explicitly,
      // derived from the current timeline time or it can be relative to the
      // last start time to chain animations direclty


      var absoluteStartTime = 0;
      var endTime = this.getEndTime();
      delay = delay || 0; // Work out when to start the animation

      if (when == null || when === 'last' || when === 'after') {
        // Take the last time and increment
        absoluteStartTime = endTime;
      } else if (when === 'absolute' || when === 'start') {
        absoluteStartTime = delay;
        delay = 0;
      } else if (when === 'now') {
        absoluteStartTime = this._time;
      } else if (when === 'relative') {
        var _runnerInfo = this._runners[runner.id];

        if (_runnerInfo) {
          absoluteStartTime = _runnerInfo.start + delay;
          delay = 0;
        }
      } else {
        throw new Error('Invalid value for the "when" parameter');
      } // Manage runner


      runner.unschedule();
      runner.timeline(this);
      var persist = runner.persist();
      var runnerInfo = {
        persist: persist === null ? this._persist : persist,
        start: absoluteStartTime + delay,
        runner: runner
      };
      this._lastRunnerId = runner.id;

      this._runners.push(runnerInfo);

      this._runners.sort(function (a, b) {
        return a.start - b.start;
      });

      this._runnerIds = this._runners.map(function (info) {
        return info.runner.id;
      });

      this.updateTime()._continue();

      return this;
    } // Remove the runner from this timeline

  }, {
    key: "unschedule",
    value: function unschedule(runner) {
      var index = this._runnerIds.indexOf(runner.id);

      if (index < 0) return this;

      this._runners.splice(index, 1);

      this._runnerIds.splice(index, 1);

      runner.timeline(null);
      return this;
    } // Calculates the end of the timeline

  }, {
    key: "getEndTime",
    value: function getEndTime() {
      var lastRunnerInfo = this._runners[this._runnerIds.indexOf(this._lastRunnerId)];

      var lastDuration = lastRunnerInfo ? lastRunnerInfo.runner.duration() : 0;
      var lastStartTime = lastRunnerInfo ? lastRunnerInfo.start : 0;
      return lastStartTime + lastDuration;
    }
  }, {
    key: "getEndTimeOfTimeline",
    value: function getEndTimeOfTimeline() {
      var lastEndTime = 0;

      for (var i = 0; i < this._runners.length; i++) {
        var runnerInfo = this._runners[i];
        var duration = runnerInfo ? runnerInfo.runner.duration() : 0;
        var startTime = runnerInfo ? runnerInfo.start : 0;
        var endTime = startTime + duration;

        if (endTime > lastEndTime) {
          lastEndTime = endTime;
        }
      }

      return lastEndTime;
    } // Makes sure, that after pausing the time doesn't jump

  }, {
    key: "updateTime",
    value: function updateTime() {
      if (!this.active()) {
        this._lastSourceTime = this._timeSource();
      }

      return this;
    }
  }, {
    key: "play",
    value: function play() {
      // Now make sure we are not paused and continue the animation
      this._paused = false;
      return this.updateTime()._continue();
    }
  }, {
    key: "pause",
    value: function pause() {
      this._paused = true;
      return this._continue();
    }
  }, {
    key: "stop",
    value: function stop() {
      // Go to start and pause
      this.time(0);
      return this.pause();
    }
  }, {
    key: "finish",
    value: function finish() {
      // Go to end and pause
      this.time(this.getEndTimeOfTimeline() + 1);
      return this.pause();
    }
  }, {
    key: "speed",
    value: function speed(_speed) {
      if (_speed == null) return this._speed;
      this._speed = _speed;
      return this;
    }
  }, {
    key: "reverse",
    value: function reverse(yes) {
      var currentSpeed = this.speed();
      if (yes == null) return this.speed(-currentSpeed);
      var positive = Math.abs(currentSpeed);
      return this.speed(yes ? positive : -positive);
    }
  }, {
    key: "seek",
    value: function seek(dt) {
      return this.time(this._time + dt);
    }
  }, {
    key: "time",
    value: function time(_time) {
      if (_time == null) return this._time;
      this._time = _time;
      return this._continue(true);
    }
  }, {
    key: "persist",
    value: function persist(dtOrForever) {
      if (dtOrForever == null) return this._persist;
      this._persist = dtOrForever;
      return this;
    }
  }, {
    key: "source",
    value: function source(fn) {
      if (fn == null) return this._timeSource;
      this._timeSource = fn;
      return this;
    }
  }, {
    key: "_stepFn",
    value: function _stepFn() {
      var immediateStep = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      // Get the time delta from the last time and update the time
      var time = this._timeSource();

      var dtSource = time - this._lastSourceTime;
      if (immediateStep) dtSource = 0;
      var dtTime = this._speed * dtSource + (this._time - this._lastStepTime);
      this._lastSourceTime = time; // Only update the time if we use the timeSource.
      // Otherwise use the current time

      if (!immediateStep) {
        // Update the time
        this._time += dtTime;
        this._time = this._time < 0 ? 0 : this._time;
      }

      this._lastStepTime = this._time;
      this.fire('time', this._time); // This is for the case that the timeline was seeked so that the time
      // is now before the startTime of the runner. Thats why we need to set
      // the runner to position 0
      // FIXME:
      // However, reseting in insertion order leads to bugs. Considering the case,
      // where 2 runners change the same attriute but in different times,
      // reseting both of them will lead to the case where the later defined
      // runner always wins the reset even if the other runner started earlier
      // and therefore should win the attribute battle
      // this can be solved by reseting them backwards

      for (var k = this._runners.length; k--;) {
        // Get and run the current runner and ignore it if its inactive
        var runnerInfo = this._runners[k];
        var runner = runnerInfo.runner; // Make sure that we give the actual difference
        // between runner start time and now

        var dtToStart = this._time - runnerInfo.start; // Dont run runner if not started yet
        // and try to reset it

        if (dtToStart <= 0) {
          runner.reset();
        }
      } // Run all of the runners directly


      var runnersLeft = false;

      for (var i = 0, len = this._runners.length; i < len; i++) {
        // Get and run the current runner and ignore it if its inactive
        var _runnerInfo2 = this._runners[i];
        var _runner = _runnerInfo2.runner;
        var dt = dtTime; // Make sure that we give the actual difference
        // between runner start time and now

        var _dtToStart = this._time - _runnerInfo2.start; // Dont run runner if not started yet


        if (_dtToStart <= 0) {
          runnersLeft = true;
          continue;
        } else if (_dtToStart < dt) {
          // Adjust dt to make sure that animation is on point
          dt = _dtToStart;
        }

        if (!_runner.active()) continue; // If this runner is still going, signal that we need another animation
        // frame, otherwise, remove the completed runner

        var finished = _runner.step(dt).done;

        if (!finished) {
          runnersLeft = true; // continue
        } else if (_runnerInfo2.persist !== true) {
          // runner is finished. And runner might get removed
          var endTime = _runner.duration() - _runner.time() + this._time;

          if (endTime + _runnerInfo2.persist < this._time) {
            // Delete runner and correct index
            _runner.unschedule();

            --i;
            --len;
          }
        }
      } // Basically: we continue when there are runners right from us in time
      // when -->, and when runners are left from us when <--


      if (runnersLeft && !(this._speed < 0 && this._time === 0) || this._runnerIds.length && this._speed < 0 && this._time > 0) {
        this._continue();
      } else {
        this.pause();
        this.fire('finished');
      }

      return this;
    } // Checks if we are running and continues the animation

  }, {
    key: "_continue",
    value: function _continue() {
      var immediateStep = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      Animator.cancelFrame(this._nextFrame);
      this._nextFrame = null;
      if (immediateStep) return this._stepImmediate();
      if (this._paused) return this;
      this._nextFrame = Animator.frame(this._step);
      return this;
    }
  }, {
    key: "active",
    value: function active() {
      return !!this._nextFrame;
    }
  }]);

  return Timeline;
}(EventTarget);
registerMethods({
  Element: {
    timeline: function timeline(_timeline) {
      if (_timeline == null) {
        this._timeline = this._timeline || new Timeline();
        return this._timeline;
      } else {
        this._timeline = _timeline;
        return this;
      }
    }
  }
});

function ownKeys$2$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$2$1(source, true).forEach(function (key) { _defineProperty$1(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$2$1(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var Runner =
/*#__PURE__*/
function (_EventTarget) {
  _inherits$1(Runner, _EventTarget);

  function Runner(options) {
    var _this;

    _classCallCheck$1(this, Runner);

    _this = _possibleConstructorReturn$1(this, _getPrototypeOf$1(Runner).call(this)); // Store a unique id on the runner, so that we can identify it later

    _this.id = Runner.id++; // Ensure a default value

    options = options == null ? timeline.duration : options; // Ensure that we get a controller

    options = typeof options === 'function' ? new Controller(options) : options; // Declare all of the variables

    _this._element = null;
    _this._timeline = null;
    _this.done = false;
    _this._queue = []; // Work out the stepper and the duration

    _this._duration = typeof options === 'number' && options;
    _this._isDeclarative = options instanceof Controller;
    _this._stepper = _this._isDeclarative ? options : new Ease(); // We copy the current values from the timeline because they can change

    _this._history = {}; // Store the state of the runner

    _this.enabled = true;
    _this._time = 0;
    _this._lastTime = 0; // At creation, the runner is in reseted state

    _this._reseted = true; // Save transforms applied to this runner

    _this.transforms = new Matrix();
    _this.transformId = 1; // Looping variables

    _this._haveReversed = false;
    _this._reverse = false;
    _this._loopsDone = 0;
    _this._swing = false;
    _this._wait = 0;
    _this._times = 1;
    _this._frameId = null; // Stores how long a runner is stored after beeing done

    _this._persist = _this._isDeclarative ? true : null;
    return _this;
  }
  /*
  Runner Definitions
  ==================
  These methods help us define the runtime behaviour of the Runner or they
  help us make new runners from the current runner
  */


  _createClass$1(Runner, [{
    key: "element",
    value: function element(_element) {
      if (_element == null) return this._element;
      this._element = _element;

      _element._prepareRunner();

      return this;
    }
  }, {
    key: "timeline",
    value: function timeline(_timeline) {
      // check explicitly for undefined so we can set the timeline to null
      if (typeof _timeline === 'undefined') return this._timeline;
      this._timeline = _timeline;
      return this;
    }
  }, {
    key: "animate",
    value: function animate(duration, delay, when) {
      var o = Runner.sanitise(duration, delay, when);
      var runner = new Runner(o.duration);
      if (this._timeline) runner.timeline(this._timeline);
      if (this._element) runner.element(this._element);
      return runner.loop(o).schedule(o.delay, o.when);
    }
  }, {
    key: "schedule",
    value: function schedule(timeline, delay, when) {
      // The user doesn't need to pass a timeline if we already have one
      if (!(timeline instanceof Timeline)) {
        when = delay;
        delay = timeline;
        timeline = this.timeline();
      } // If there is no timeline, yell at the user...


      if (!timeline) {
        throw Error('Runner cannot be scheduled without timeline');
      } // Schedule the runner on the timeline provided


      timeline.schedule(this, delay, when);
      return this;
    }
  }, {
    key: "unschedule",
    value: function unschedule() {
      var timeline = this.timeline();
      timeline && timeline.unschedule(this);
      return this;
    }
  }, {
    key: "loop",
    value: function loop(times, swing, wait) {
      // Deal with the user passing in an object
      if (_typeof(times) === 'object') {
        swing = times.swing;
        wait = times.wait;
        times = times.times;
      } // Sanitise the values and store them


      this._times = times || Infinity;
      this._swing = swing || false;
      this._wait = wait || 0; // Allow true to be passed

      if (this._times === true) {
        this._times = Infinity;
      }

      return this;
    }
  }, {
    key: "delay",
    value: function delay(_delay) {
      return this.animate(0, _delay);
    }
    /*
    Basic Functionality
    ===================
    These methods allow us to attach basic functions to the runner directly
    */

  }, {
    key: "queue",
    value: function queue(initFn, runFn, retargetFn, isTransform) {
      this._queue.push({
        initialiser: initFn || noop,
        runner: runFn || noop,
        retarget: retargetFn,
        isTransform: isTransform,
        initialised: false,
        finished: false
      });

      var timeline = this.timeline();
      timeline && this.timeline()._continue();
      return this;
    }
  }, {
    key: "during",
    value: function during(fn) {
      return this.queue(null, fn);
    }
  }, {
    key: "after",
    value: function after(fn) {
      return this.on('finished', fn);
    }
    /*
    Runner animation methods
    ========================
    Control how the animation plays
    */

  }, {
    key: "time",
    value: function time(_time) {
      if (_time == null) {
        return this._time;
      }

      var dt = _time - this._time;
      this.step(dt);
      return this;
    }
  }, {
    key: "duration",
    value: function duration() {
      return this._times * (this._wait + this._duration) - this._wait;
    }
  }, {
    key: "loops",
    value: function loops(p) {
      var loopDuration = this._duration + this._wait;

      if (p == null) {
        var loopsDone = Math.floor(this._time / loopDuration);
        var relativeTime = this._time - loopsDone * loopDuration;
        var position = relativeTime / this._duration;
        return Math.min(loopsDone + position, this._times);
      }

      var whole = Math.floor(p);
      var partial = p % 1;
      var time = loopDuration * whole + this._duration * partial;
      return this.time(time);
    }
  }, {
    key: "persist",
    value: function persist(dtOrForever) {
      if (dtOrForever == null) return this._persist;
      this._persist = dtOrForever;
      return this;
    }
  }, {
    key: "position",
    value: function position(p) {
      // Get all of the variables we need
      var x = this._time;
      var d = this._duration;
      var w = this._wait;
      var t = this._times;
      var s = this._swing;
      var r = this._reverse;
      var position;

      if (p == null) {
        /*
        This function converts a time to a position in the range [0, 1]
        The full explanation can be found in this desmos demonstration
          https://www.desmos.com/calculator/u4fbavgche
        The logic is slightly simplified here because we can use booleans
        */
        // Figure out the value without thinking about the start or end time
        var f = function f(x) {
          var swinging = s * Math.floor(x % (2 * (w + d)) / (w + d));
          var backwards = swinging && !r || !swinging && r;
          var uncliped = Math.pow(-1, backwards) * (x % (w + d)) / d + backwards;
          var clipped = Math.max(Math.min(uncliped, 1), 0);
          return clipped;
        }; // Figure out the value by incorporating the start time


        var endTime = t * (w + d) - w;
        position = x <= 0 ? Math.round(f(1e-5)) : x < endTime ? f(x) : Math.round(f(endTime - 1e-5));
        return position;
      } // Work out the loops done and add the position to the loops done


      var loopsDone = Math.floor(this.loops());
      var swingForward = s && loopsDone % 2 === 0;
      var forwards = swingForward && !r || r && swingForward;
      position = loopsDone + (forwards ? p : 1 - p);
      return this.loops(position);
    }
  }, {
    key: "progress",
    value: function progress(p) {
      if (p == null) {
        return Math.min(1, this._time / this.duration());
      }

      return this.time(p * this.duration());
    }
  }, {
    key: "step",
    value: function step(dt) {
      // If we are inactive, this stepper just gets skipped
      if (!this.enabled) return this; // Update the time and get the new position

      dt = dt == null ? 16 : dt;
      this._time += dt;
      var position = this.position(); // Figure out if we need to run the stepper in this frame

      var running = this._lastPosition !== position && this._time >= 0;
      this._lastPosition = position; // Figure out if we just started

      var duration = this.duration();
      var justStarted = this._lastTime <= 0 && this._time > 0;
      var justFinished = this._lastTime < duration && this._time >= duration;
      this._lastTime = this._time;

      if (justStarted) {
        this.fire('start', this);
      } // Work out if the runner is finished set the done flag here so animations
      // know, that they are running in the last step (this is good for
      // transformations which can be merged)


      var declarative = this._isDeclarative;
      this.done = !declarative && !justFinished && this._time >= duration; // Runner is running. So its not in reseted state anymore

      this._reseted = false; // Call initialise and the run function

      if (running || declarative) {
        this._initialise(running); // clear the transforms on this runner so they dont get added again and again


        this.transforms = new Matrix();

        var converged = this._run(declarative ? dt : position);

        this.fire('step', this);
      } // correct the done flag here
      // declaritive animations itself know when they converged


      this.done = this.done || converged && declarative;

      if (justFinished) {
        this.fire('finished', this);
      }

      return this;
    }
  }, {
    key: "reset",
    value: function reset() {
      if (this._reseted) return this;
      this.time(0);
      this._reseted = true;
      return this;
    }
  }, {
    key: "finish",
    value: function finish() {
      return this.step(Infinity);
    }
  }, {
    key: "reverse",
    value: function reverse(_reverse) {
      this._reverse = _reverse == null ? !this._reverse : _reverse;
      return this;
    }
  }, {
    key: "ease",
    value: function ease(fn) {
      this._stepper = new Ease(fn);
      return this;
    }
  }, {
    key: "active",
    value: function active(enabled) {
      if (enabled == null) return this.enabled;
      this.enabled = enabled;
      return this;
    }
    /*
    Private Methods
    ===============
    Methods that shouldn't be used externally
    */
    // Save a morpher to the morpher list so that we can retarget it later

  }, {
    key: "_rememberMorpher",
    value: function _rememberMorpher(method, morpher) {
      this._history[method] = {
        morpher: morpher,
        caller: this._queue[this._queue.length - 1]
      }; // We have to resume the timeline in case a controller
      // is already done without beeing ever run
      // This can happen when e.g. this is done:
      //    anim = el.animate(new SVG.Spring)
      // and later
      //    anim.move(...)

      if (this._isDeclarative) {
        var timeline = this.timeline();
        timeline && timeline.play();
      }
    } // Try to set the target for a morpher if the morpher exists, otherwise
    // do nothing and return false

  }, {
    key: "_tryRetarget",
    value: function _tryRetarget(method, target, extra) {
      if (this._history[method]) {
        // if the last method wasnt even initialised, throw it away
        if (!this._history[method].caller.initialised) {
          var index = this._queue.indexOf(this._history[method].caller);

          this._queue.splice(index, 1);

          return false;
        } // for the case of transformations, we use the special retarget function
        // which has access to the outer scope


        if (this._history[method].caller.retarget) {
          this._history[method].caller.retarget(target, extra); // for everything else a simple morpher change is sufficient

        } else {
          this._history[method].morpher.to(target);
        }

        this._history[method].caller.finished = false;
        var timeline = this.timeline();
        timeline && timeline.play();
        return true;
      }

      return false;
    } // Run each initialise function in the runner if required

  }, {
    key: "_initialise",
    value: function _initialise(running) {
      // If we aren't running, we shouldn't initialise when not declarative
      if (!running && !this._isDeclarative) return; // Loop through all of the initialisers

      for (var i = 0, len = this._queue.length; i < len; ++i) {
        // Get the current initialiser
        var current = this._queue[i]; // Determine whether we need to initialise

        var needsIt = this._isDeclarative || !current.initialised && running;
        running = !current.finished; // Call the initialiser if we need to

        if (needsIt && running) {
          current.initialiser.call(this);
          current.initialised = true;
        }
      }
    } // Run each run function for the position or dt given

  }, {
    key: "_run",
    value: function _run(positionOrDt) {
      // Run all of the _queue directly
      var allfinished = true;

      for (var i = 0, len = this._queue.length; i < len; ++i) {
        // Get the current function to run
        var current = this._queue[i]; // Run the function if its not finished, we keep track of the finished
        // flag for the sake of declarative _queue

        var converged = current.runner.call(this, positionOrDt);
        current.finished = current.finished || converged === true;
        allfinished = allfinished && current.finished;
      } // We report when all of the constructors are finished


      return allfinished;
    }
  }, {
    key: "addTransform",
    value: function addTransform(transform, index) {
      this.transforms.lmultiplyO(transform);
      return this;
    }
  }, {
    key: "clearTransform",
    value: function clearTransform() {
      this.transforms = new Matrix();
      return this;
    } // TODO: Keep track of all transformations so that deletion is faster

  }, {
    key: "clearTransformsFromQueue",
    value: function clearTransformsFromQueue() {
      if (!this.done || !this._timeline || !this._timeline._runnerIds.includes(this.id)) {
        this._queue = this._queue.filter(function (item) {
          return !item.isTransform;
        });
      }
    }
  }], [{
    key: "sanitise",
    value: function sanitise(duration, delay, when) {
      // Initialise the default parameters
      var times = 1;
      var swing = false;
      var wait = 0;
      duration = duration || timeline.duration;
      delay = delay || timeline.delay;
      when = when || 'last'; // If we have an object, unpack the values

      if (_typeof(duration) === 'object' && !(duration instanceof Stepper)) {
        delay = duration.delay || delay;
        when = duration.when || when;
        swing = duration.swing || swing;
        times = duration.times || times;
        wait = duration.wait || wait;
        duration = duration.duration || timeline.duration;
      }

      return {
        duration: duration,
        delay: delay,
        swing: swing,
        times: times,
        wait: wait,
        when: when
      };
    }
  }]);

  return Runner;
}(EventTarget);
Runner.id = 0;

var FakeRunner =
/*#__PURE__*/
function () {
  function FakeRunner() {
    var transforms = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Matrix();
    var id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;
    var done = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    _classCallCheck$1(this, FakeRunner);

    this.transforms = transforms;
    this.id = id;
    this.done = done;
  }

  _createClass$1(FakeRunner, [{
    key: "clearTransformsFromQueue",
    value: function clearTransformsFromQueue() {}
  }]);

  return FakeRunner;
}();

extend([Runner, FakeRunner], {
  mergeWith: function mergeWith(runner) {
    return new FakeRunner(runner.transforms.lmultiply(this.transforms), runner.id);
  }
}); // FakeRunner.emptyRunner = new FakeRunner()

var lmultiply = function lmultiply(last, curr) {
  return last.lmultiplyO(curr);
};

var getRunnerTransform = function getRunnerTransform(runner) {
  return runner.transforms;
};

function mergeTransforms() {
  // Find the matrix to apply to the element and apply it
  var runners = this._transformationRunners.runners;
  var netTransform = runners.map(getRunnerTransform).reduce(lmultiply, new Matrix());
  this.transform(netTransform);

  this._transformationRunners.merge();

  if (this._transformationRunners.length() === 1) {
    this._frameId = null;
  }
}

var RunnerArray =
/*#__PURE__*/
function () {
  function RunnerArray() {
    _classCallCheck$1(this, RunnerArray);

    this.runners = [];
    this.ids = [];
  }

  _createClass$1(RunnerArray, [{
    key: "add",
    value: function add(runner) {
      if (this.runners.includes(runner)) return;
      var id = runner.id + 1;
      this.runners.push(runner);
      this.ids.push(id);
      return this;
    }
  }, {
    key: "getByID",
    value: function getByID(id) {
      return this.runners[this.ids.indexOf(id + 1)];
    }
  }, {
    key: "remove",
    value: function remove(id) {
      var index = this.ids.indexOf(id + 1);
      this.ids.splice(index, 1);
      this.runners.splice(index, 1);
      return this;
    }
  }, {
    key: "merge",
    value: function merge() {
      var _this2 = this;

      var lastRunner = null;
      this.runners.forEach(function (runner, i) {
        var condition = lastRunner && runner.done && lastRunner.done // don't merge runner when persisted on timeline
        && (!runner._timeline || !runner._timeline._runnerIds.includes(runner.id)) && (!lastRunner._timeline || !lastRunner._timeline._runnerIds.includes(lastRunner.id));

        if (condition) {
          // the +1 happens in the function
          _this2.remove(runner.id);

          _this2.edit(lastRunner.id, runner.mergeWith(lastRunner));
        }

        lastRunner = runner;
      });
      return this;
    }
  }, {
    key: "edit",
    value: function edit(id, newRunner) {
      var index = this.ids.indexOf(id + 1);
      this.ids.splice(index, 1, id + 1);
      this.runners.splice(index, 1, newRunner);
      return this;
    }
  }, {
    key: "length",
    value: function length() {
      return this.ids.length;
    }
  }, {
    key: "clearBefore",
    value: function clearBefore(id) {
      var deleteCnt = this.ids.indexOf(id + 1) || 1;
      this.ids.splice(0, deleteCnt, 0);
      this.runners.splice(0, deleteCnt, new FakeRunner()).forEach(function (r) {
        return r.clearTransformsFromQueue();
      });
      return this;
    }
  }]);

  return RunnerArray;
}();

registerMethods({
  Element: {
    animate: function animate(duration, delay, when) {
      var o = Runner.sanitise(duration, delay, when);
      var timeline = this.timeline();
      return new Runner(o.duration).loop(o).element(this).timeline(timeline.play()).schedule(o.delay, o.when);
    },
    delay: function delay(by, when) {
      return this.animate(0, by, when);
    },
    // this function searches for all runners on the element and deletes the ones
    // which run before the current one. This is because absolute transformations
    // overwfrite anything anyway so there is no need to waste time computing
    // other runners
    _clearTransformRunnersBefore: function _clearTransformRunnersBefore(currentRunner) {
      this._transformationRunners.clearBefore(currentRunner.id);
    },
    _currentTransform: function _currentTransform(current) {
      return this._transformationRunners.runners // we need the equal sign here to make sure, that also transformations
      // on the same runner which execute before the current transformation are
      // taken into account
      .filter(function (runner) {
        return runner.id <= current.id;
      }).map(getRunnerTransform).reduce(lmultiply, new Matrix());
    },
    _addRunner: function _addRunner(runner) {
      this._transformationRunners.add(runner); // Make sure that the runner merge is executed at the very end of
      // all Animator functions. Thats why we use immediate here to execute
      // the merge right after all frames are run


      Animator.cancelImmediate(this._frameId);
      this._frameId = Animator.immediate(mergeTransforms.bind(this));
    },
    _prepareRunner: function _prepareRunner() {
      if (this._frameId == null) {
        this._transformationRunners = new RunnerArray().add(new FakeRunner(new Matrix(this)));
      }
    }
  }
});
extend(Runner, {
  attr: function attr(a, v) {
    return this.styleAttr('attr', a, v);
  },
  // Add animatable styles
  css: function css(s, v) {
    return this.styleAttr('css', s, v);
  },
  styleAttr: function styleAttr(type, name, val) {
    // apply attributes individually
    if (_typeof(name) === 'object') {
      for (var key in name) {
        this.styleAttr(type, key, name[key]);
      }

      return this;
    }

    var morpher = new Morphable(this._stepper).to(val);
    this.queue(function () {
      morpher = morpher.from(this.element()[type](name));
    }, function (pos) {
      this.element()[type](name, morpher.at(pos));
      return morpher.done();
    });
    return this;
  },
  zoom: function zoom(level, point) {
    if (this._tryRetarget('zoom', to, point)) return this;
    var morpher = new Morphable(this._stepper).to(new SVGNumber(level));
    this.queue(function () {
      morpher = morpher.from(this.element().zoom());
    }, function (pos) {
      this.element().zoom(morpher.at(pos), point);
      return morpher.done();
    }, function (newLevel, newPoint) {
      point = newPoint;
      morpher.to(newLevel);
    });

    this._rememberMorpher('zoom', morpher);

    return this;
  },

  /**
   ** absolute transformations
   **/
  //
  // M v -----|-----(D M v = F v)------|----->  T v
  //
  // 1. define the final state (T) and decompose it (once)
  //    t = [tx, ty, the, lam, sy, sx]
  // 2. on every frame: pull the current state of all previous transforms
  //    (M - m can change)
  //   and then write this as m = [tx0, ty0, the0, lam0, sy0, sx0]
  // 3. Find the interpolated matrix F(pos) = m + pos * (t - m)
  //   - Note F(0) = M
  //   - Note F(1) = T
  // 4. Now you get the delta matrix as a result: D = F * inv(M)
  transform: function transform(transforms, relative, affine) {
    // If we have a declarative function, we should retarget it if possible
    relative = transforms.relative || relative;

    if (this._isDeclarative && !relative && this._tryRetarget('transform', transforms)) {
      return this;
    } // Parse the parameters


    var isMatrix = Matrix.isMatrixLike(transforms);
    affine = transforms.affine != null ? transforms.affine : affine != null ? affine : !isMatrix; // Create a morepher and set its type

    var morpher = new Morphable(this._stepper).type(affine ? TransformBag : Matrix);
    var origin;
    var element;
    var current;
    var currentAngle;
    var startTransform;

    function setup() {
      // make sure element and origin is defined
      element = element || this.element();
      origin = origin || getOrigin(transforms, element);
      startTransform = new Matrix(relative ? undefined : element); // add the runner to the element so it can merge transformations

      element._addRunner(this); // Deactivate all transforms that have run so far if we are absolute


      if (!relative) {
        element._clearTransformRunnersBefore(this);
      }
    }

    function run(pos) {
      // clear all other transforms before this in case something is saved
      // on this runner. We are absolute. We dont need these!
      if (!relative) this.clearTransform();

      var _transform = new Point$1(origin).transform(element._currentTransform(this)),
          x = _transform.x,
          y = _transform.y;

      var target = new Matrix(_objectSpread$1({}, transforms, {
        origin: [x, y]
      }));
      var start = this._isDeclarative && current ? current : startTransform;

      if (affine) {
        target = target.decompose(x, y);
        start = start.decompose(x, y); // Get the current and target angle as it was set

        var rTarget = target.rotate;
        var rCurrent = start.rotate; // Figure out the shortest path to rotate directly

        var possibilities = [rTarget - 360, rTarget, rTarget + 360];
        var distances = possibilities.map(function (a) {
          return Math.abs(a - rCurrent);
        });
        var shortest = Math.min.apply(Math, _toConsumableArray$1(distances));
        var index = distances.indexOf(shortest);
        target.rotate = possibilities[index];
      }

      if (relative) {
        // we have to be careful here not to overwrite the rotation
        // with the rotate method of Matrix
        if (!isMatrix) {
          target.rotate = transforms.rotate || 0;
        }

        if (this._isDeclarative && currentAngle) {
          start.rotate = currentAngle;
        }
      }

      morpher.from(start);
      morpher.to(target);
      var affineParameters = morpher.at(pos);
      currentAngle = affineParameters.rotate;
      current = new Matrix(affineParameters);
      this.addTransform(current);

      element._addRunner(this);

      return morpher.done();
    }

    function retarget(newTransforms) {
      // only get a new origin if it changed since the last call
      if ((newTransforms.origin || 'center').toString() !== (transforms.origin || 'center').toString()) {
        origin = getOrigin(transforms, element);
      } // overwrite the old transformations with the new ones


      transforms = _objectSpread$1({}, newTransforms, {
        origin: origin
      });
    }

    this.queue(setup, run, retarget, true);
    this._isDeclarative && this._rememberMorpher('transform', morpher);
    return this;
  },
  // Animatable x-axis
  x: function x(_x, relative) {
    return this._queueNumber('x', _x);
  },
  // Animatable y-axis
  y: function y(_y) {
    return this._queueNumber('y', _y);
  },
  dx: function dx() {
    var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    return this._queueNumberDelta('x', x);
  },
  dy: function dy() {
    var y = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    return this._queueNumberDelta('y', y);
  },
  dmove: function dmove(x, y) {
    return this.dx(x).dy(y);
  },
  _queueNumberDelta: function _queueNumberDelta(method, to) {
    to = new SVGNumber(to); // Try to change the target if we have this method already registerd

    if (this._tryRetarget(method, to)) return this; // Make a morpher and queue the animation

    var morpher = new Morphable(this._stepper).to(to);
    var from = null;
    this.queue(function () {
      from = this.element()[method]();
      morpher.from(from);
      morpher.to(from + to);
    }, function (pos) {
      this.element()[method](morpher.at(pos));
      return morpher.done();
    }, function (newTo) {
      morpher.to(from + new SVGNumber(newTo));
    }); // Register the morpher so that if it is changed again, we can retarget it

    this._rememberMorpher(method, morpher);

    return this;
  },
  _queueObject: function _queueObject(method, to) {
    // Try to change the target if we have this method already registerd
    if (this._tryRetarget(method, to)) return this; // Make a morpher and queue the animation

    var morpher = new Morphable(this._stepper).to(to);
    this.queue(function () {
      morpher.from(this.element()[method]());
    }, function (pos) {
      this.element()[method](morpher.at(pos));
      return morpher.done();
    }); // Register the morpher so that if it is changed again, we can retarget it

    this._rememberMorpher(method, morpher);

    return this;
  },
  _queueNumber: function _queueNumber(method, value) {
    return this._queueObject(method, new SVGNumber(value));
  },
  // Animatable center x-axis
  cx: function cx(x) {
    return this._queueNumber('cx', x);
  },
  // Animatable center y-axis
  cy: function cy(y) {
    return this._queueNumber('cy', y);
  },
  // Add animatable move
  move: function move(x, y) {
    return this.x(x).y(y);
  },
  // Add animatable center
  center: function center(x, y) {
    return this.cx(x).cy(y);
  },
  // Add animatable size
  size: function size(width, height) {
    // animate bbox based size for all other elements
    var box;

    if (!width || !height) {
      box = this._element.bbox();
    }

    if (!width) {
      width = box.width / box.height * height;
    }

    if (!height) {
      height = box.height / box.width * width;
    }

    return this.width(width).height(height);
  },
  // Add animatable width
  width: function width(_width) {
    return this._queueNumber('width', _width);
  },
  // Add animatable height
  height: function height(_height) {
    return this._queueNumber('height', _height);
  },
  // Add animatable plot
  plot: function plot(a, b, c, d) {
    // Lines can be plotted with 4 arguments
    if (arguments.length === 4) {
      return this.plot([a, b, c, d]);
    }

    if (this._tryRetarget('plot', a)) return this;
    var morpher = new Morphable(this._stepper).type(this._element.MorphArray).to(a);
    this.queue(function () {
      morpher.from(this._element.array());
    }, function (pos) {
      this._element.plot(morpher.at(pos));

      return morpher.done();
    });

    this._rememberMorpher('plot', morpher);

    return this;
  },
  // Add leading method
  leading: function leading(value) {
    return this._queueNumber('leading', value);
  },
  // Add animatable viewbox
  viewbox: function viewbox(x, y, width, height) {
    return this._queueObject('viewbox', new Box(x, y, width, height));
  },
  update: function update(o) {
    if (_typeof(o) !== 'object') {
      return this.update({
        offset: arguments[0],
        color: arguments[1],
        opacity: arguments[2]
      });
    }

    if (o.opacity != null) this.attr('stop-opacity', o.opacity);
    if (o.color != null) this.attr('stop-color', o.color);
    if (o.offset != null) this.attr('offset', o.offset);
    return this;
  }
});
extend(Runner, {
  rx: rx,
  ry: ry,
  from: from,
  to: to
});
register(Runner, 'Runner');

var Svg =
/*#__PURE__*/
function (_Container) {
  _inherits$1(Svg, _Container);

  function Svg(node) {
    var _this;

    _classCallCheck$1(this, Svg);

    _this = _possibleConstructorReturn$1(this, _getPrototypeOf$1(Svg).call(this, nodeOrNew('svg', node), node));

    _this.namespace();

    return _this;
  }

  _createClass$1(Svg, [{
    key: "isRoot",
    value: function isRoot() {
      return !this.node.parentNode || !(this.node.parentNode instanceof globals.window.SVGElement) || this.node.parentNode.nodeName === '#document';
    } // Check if this is a root svg
    // If not, call docs from this element

  }, {
    key: "root",
    value: function root() {
      if (this.isRoot()) return this;
      return _get(_getPrototypeOf$1(Svg.prototype), "root", this).call(this);
    } // Add namespaces

  }, {
    key: "namespace",
    value: function namespace() {
      if (!this.isRoot()) return this.root().namespace();
      return this.attr({
        xmlns: ns,
        version: '1.1'
      }).attr('xmlns:xlink', xlink, xmlns).attr('xmlns:svgjs', svgjs, xmlns);
    } // Creates and returns defs element

  }, {
    key: "defs",
    value: function defs() {
      if (!this.isRoot()) return this.root().defs();
      return adopt(this.node.querySelector('defs')) || this.put(new Defs());
    } // custom parent method

  }, {
    key: "parent",
    value: function parent(type) {
      if (this.isRoot()) {
        return this.node.parentNode.nodeName === '#document' ? null : adopt(this.node.parentNode);
      }

      return _get(_getPrototypeOf$1(Svg.prototype), "parent", this).call(this, type);
    }
  }, {
    key: "clear",
    value: function clear() {
      // remove children
      while (this.node.hasChildNodes()) {
        this.node.removeChild(this.node.lastChild);
      } // remove defs reference


      delete this._defs;
      return this;
    }
  }]);

  return Svg;
}(Container);
registerMethods({
  Container: {
    // Create nested svg document
    nested: wrapWithAttrCheck(function () {
      return this.put(new Svg());
    })
  }
});
register(Svg, 'Svg', true);

var _Symbol =
/*#__PURE__*/
function (_Container) {
  _inherits$1(_Symbol, _Container);

  // Initialize node
  function _Symbol(node) {
    _classCallCheck$1(this, _Symbol);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(_Symbol).call(this, nodeOrNew('symbol', node), node));
  }

  return _Symbol;
}(Container);
registerMethods({
  Container: {
    symbol: wrapWithAttrCheck(function () {
      return this.put(new _Symbol());
    })
  }
});
register(_Symbol, 'Symbol');

function plain(text) {
  // clear if build mode is disabled
  if (this._build === false) {
    this.clear();
  } // create text node


  this.node.appendChild(globals.document.createTextNode(text));
  return this;
} // Get length of text element

function length() {
  return this.node.getComputedTextLength();
}

var textable = ({
	__proto__: null,
	plain: plain,
	length: length
});

var Text =
/*#__PURE__*/
function (_Shape) {
  _inherits$1(Text, _Shape);

  // Initialize node
  function Text(node) {
    var _this;

    _classCallCheck$1(this, Text);

    _this = _possibleConstructorReturn$1(this, _getPrototypeOf$1(Text).call(this, nodeOrNew('text', node), node));
    _this.dom.leading = new SVGNumber(1.3); // store leading value for rebuilding

    _this._rebuild = true; // enable automatic updating of dy values

    _this._build = false; // disable build mode for adding multiple lines

    return _this;
  } // Move over x-axis
  // Text is moved its bounding box
  // text-anchor does NOT matter


  _createClass$1(Text, [{
    key: "x",
    value: function x(_x) {
      var box = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.bbox();

      if (_x == null) {
        return box.x;
      }

      return this.attr('x', this.attr('x') + _x - box.x);
    } // Move over y-axis

  }, {
    key: "y",
    value: function y(_y) {
      var box = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.bbox();

      if (_y == null) {
        return box.y;
      }

      return this.attr('y', this.attr('y') + _y - box.y);
    }
  }, {
    key: "move",
    value: function move(x, y) {
      var box = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.bbox();
      return this.x(x, box).y(y, box);
    } // Move center over x-axis

  }, {
    key: "cx",
    value: function cx(x) {
      var box = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.bbox();

      if (x == null) {
        return box.cx;
      }

      return this.attr('x', this.attr('x') + x - box.cx);
    } // Move center over y-axis

  }, {
    key: "cy",
    value: function cy(y) {
      var box = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.bbox();

      if (y == null) {
        return box.cy;
      }

      return this.attr('y', this.attr('y') + y - box.cy);
    }
  }, {
    key: "center",
    value: function center(x, y) {
      var box = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.bbox();
      return this.cx(x, box).cy(y, box);
    } // Set the text content

  }, {
    key: "text",
    value: function text(_text) {
      // act as getter
      if (_text === undefined) {
        var children = this.node.childNodes;
        var firstLine = 0;
        _text = '';

        for (var i = 0, len = children.length; i < len; ++i) {
          // skip textPaths - they are no lines
          if (children[i].nodeName === 'textPath') {
            if (i === 0) firstLine = 1;
            continue;
          } // add newline if its not the first child and newLined is set to true


          if (i !== firstLine && children[i].nodeType !== 3 && adopt(children[i]).dom.newLined === true) {
            _text += '\n';
          } // add content of this node


          _text += children[i].textContent;
        }

        return _text;
      } // remove existing content


      this.clear().build(true);

      if (typeof _text === 'function') {
        // call block
        _text.call(this, this);
      } else {
        // store text and make sure text is not blank
        _text = _text.split('\n'); // build new lines

        for (var j = 0, jl = _text.length; j < jl; j++) {
          this.tspan(_text[j]).newLine();
        }
      } // disable build mode and rebuild lines


      return this.build(false).rebuild();
    } // Set / get leading

  }, {
    key: "leading",
    value: function leading(value) {
      // act as getter
      if (value == null) {
        return this.dom.leading;
      } // act as setter


      this.dom.leading = new SVGNumber(value);
      return this.rebuild();
    } // Rebuild appearance type

  }, {
    key: "rebuild",
    value: function rebuild(_rebuild) {
      // store new rebuild flag if given
      if (typeof _rebuild === 'boolean') {
        this._rebuild = _rebuild;
      } // define position of all lines


      if (this._rebuild) {
        var self = this;
        var blankLineOffset = 0;
        var leading = this.dom.leading;
        this.each(function () {
          var fontSize = globals.window.getComputedStyle(this.node).getPropertyValue('font-size');
          var dy = leading * new SVGNumber(fontSize);

          if (this.dom.newLined) {
            this.attr('x', self.attr('x'));

            if (this.text() === '\n') {
              blankLineOffset += dy;
            } else {
              this.attr('dy', dy + blankLineOffset);
              blankLineOffset = 0;
            }
          }
        });
        this.fire('rebuild');
      }

      return this;
    } // Enable / disable build mode

  }, {
    key: "build",
    value: function build(_build) {
      this._build = !!_build;
      return this;
    } // overwrite method from parent to set data properly

  }, {
    key: "setData",
    value: function setData(o) {
      this.dom = o;
      this.dom.leading = new SVGNumber(o.leading || 1.3);
      return this;
    }
  }]);

  return Text;
}(Shape);
extend(Text, textable);
registerMethods({
  Container: {
    // Create text element
    text: wrapWithAttrCheck(function (text) {
      return this.put(new Text()).text(text);
    }),
    // Create plain text element
    plain: wrapWithAttrCheck(function (text) {
      return this.put(new Text()).plain(text);
    })
  }
});
register(Text, 'Text');

var Tspan =
/*#__PURE__*/
function (_Text) {
  _inherits$1(Tspan, _Text);

  // Initialize node
  function Tspan(node) {
    _classCallCheck$1(this, Tspan);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(Tspan).call(this, nodeOrNew('tspan', node), node));
  } // Set text content


  _createClass$1(Tspan, [{
    key: "text",
    value: function text(_text) {
      if (_text == null) return this.node.textContent + (this.dom.newLined ? '\n' : '');
      typeof _text === 'function' ? _text.call(this, this) : this.plain(_text);
      return this;
    } // Shortcut dx

  }, {
    key: "dx",
    value: function dx(_dx) {
      return this.attr('dx', _dx);
    } // Shortcut dy

  }, {
    key: "dy",
    value: function dy(_dy) {
      return this.attr('dy', _dy);
    }
  }, {
    key: "x",
    value: function x(_x) {
      return this.attr('x', _x);
    }
  }, {
    key: "y",
    value: function y(_y) {
      return this.attr('x', _y);
    }
  }, {
    key: "move",
    value: function move(x, y) {
      return this.x(x).y(y);
    } // Create new line

  }, {
    key: "newLine",
    value: function newLine() {
      // fetch text parent
      var t = this.parent(Text); // mark new line

      this.dom.newLined = true;
      var fontSize = globals.window.getComputedStyle(this.node).getPropertyValue('font-size');
      var dy = t.dom.leading * new SVGNumber(fontSize); // apply new position

      return this.dy(dy).attr('x', t.x());
    }
  }]);

  return Tspan;
}(Text);
extend(Tspan, textable);
registerMethods({
  Tspan: {
    tspan: wrapWithAttrCheck(function (text) {
      var tspan = new Tspan(); // clear if build mode is disabled

      if (!this._build) {
        this.clear();
      } // add new tspan


      this.node.appendChild(tspan.node);
      return tspan.text(text);
    })
  }
});
register(Tspan, 'Tspan');

var ClipPath =
/*#__PURE__*/
function (_Container) {
  _inherits$1(ClipPath, _Container);

  function ClipPath(node) {
    _classCallCheck$1(this, ClipPath);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(ClipPath).call(this, nodeOrNew('clipPath', node), node));
  } // Unclip all clipped elements and remove itself


  _createClass$1(ClipPath, [{
    key: "remove",
    value: function remove() {
      // unclip all targets
      this.targets().forEach(function (el) {
        el.unclip();
      }); // remove clipPath from parent

      return _get(_getPrototypeOf$1(ClipPath.prototype), "remove", this).call(this);
    }
  }, {
    key: "targets",
    value: function targets() {
      return baseFind('svg [clip-path*="' + this.id() + '"]');
    }
  }]);

  return ClipPath;
}(Container);
registerMethods({
  Container: {
    // Create clipping element
    clip: wrapWithAttrCheck(function () {
      return this.defs().put(new ClipPath());
    })
  },
  Element: {
    // Distribute clipPath to svg element
    clipWith: function clipWith(element) {
      // use given clip or create a new one
      var clipper = element instanceof ClipPath ? element : this.parent().clip().add(element); // apply mask

      return this.attr('clip-path', 'url("#' + clipper.id() + '")');
    },
    // Unclip element
    unclip: function unclip() {
      return this.attr('clip-path', null);
    },
    clipper: function clipper() {
      return this.reference('clip-path');
    }
  }
});
register(ClipPath, 'ClipPath');

var ForeignObject =
/*#__PURE__*/
function (_Element) {
  _inherits$1(ForeignObject, _Element);

  function ForeignObject(node) {
    _classCallCheck$1(this, ForeignObject);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(ForeignObject).call(this, nodeOrNew('foreignObject', node), node));
  }

  return ForeignObject;
}(Element);
registerMethods({
  Container: {
    foreignObject: wrapWithAttrCheck(function (width, height) {
      return this.put(new ForeignObject()).size(width, height);
    })
  }
});
register(ForeignObject, 'ForeignObject');

var G =
/*#__PURE__*/
function (_Container) {
  _inherits$1(G, _Container);

  function G(node) {
    _classCallCheck$1(this, G);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(G).call(this, nodeOrNew('g', node), node));
  }

  _createClass$1(G, [{
    key: "x",
    value: function x(_x) {
      var box = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.bbox();
      if (_x == null) return box.x;
      return this.move(_x, box.y, box);
    }
  }, {
    key: "y",
    value: function y(_y) {
      var box = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.bbox();
      if (_y == null) return box.y;
      return this.move(box.x, _y, box);
    }
  }, {
    key: "move",
    value: function move() {
      var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var box = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.bbox();
      var dx = x - box.x;
      var dy = y - box.y;
      return this.dmove(dx, dy);
    }
  }, {
    key: "dx",
    value: function dx(_dx) {
      return this.dmove(_dx, 0);
    }
  }, {
    key: "dy",
    value: function dy(_dy) {
      return this.dmove(0, _dy);
    }
  }, {
    key: "dmove",
    value: function dmove(dx, dy) {
      this.children().forEach(function (child, i) {
        // Get the childs bbox
        var bbox = child.bbox(); // Get childs matrix

        var m = new Matrix(child); // Translate childs matrix by amount and
        // transform it back into parents space

        var matrix = m.translate(dx, dy).transform(m.inverse()); // Calculate new x and y from old box

        var p = new Point$1(bbox.x, bbox.y).transform(matrix); // Move element

        child.move(p.x, p.y);
      });
      return this;
    }
  }, {
    key: "width",
    value: function width(_width) {
      var box = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.bbox();
      if (_width == null) return box.width;
      return this.size(_width, box.height, box);
    }
  }, {
    key: "height",
    value: function height(_height) {
      var box = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.bbox();
      if (_height == null) return box.height;
      return this.size(box.width, _height, box);
    }
  }, {
    key: "size",
    value: function size(width, height) {
      var box = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.bbox();
      var p = proportionalSize(this, width, height, box);
      var scaleX = p.width / box.width;
      var scaleY = p.height / box.height;
      this.children().forEach(function (child, i) {
        var o = new Point$1(box).transform(new Matrix(child).inverse());
        child.scale(scaleX, scaleY, o.x, o.y);
      });
      return this;
    }
  }]);

  return G;
}(Container);
registerMethods({
  Container: {
    // Create a group element
    group: wrapWithAttrCheck(function () {
      return this.put(new G());
    })
  }
});
register(G, 'G');

var A =
/*#__PURE__*/
function (_Container) {
  _inherits$1(A, _Container);

  function A(node) {
    _classCallCheck$1(this, A);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(A).call(this, nodeOrNew('a', node), node));
  } // Link url


  _createClass$1(A, [{
    key: "to",
    value: function to(url) {
      return this.attr('href', url, xlink);
    } // Link target attribute

  }, {
    key: "target",
    value: function target(_target) {
      return this.attr('target', _target);
    }
  }]);

  return A;
}(Container);
registerMethods({
  Container: {
    // Create a hyperlink element
    link: wrapWithAttrCheck(function (url) {
      return this.put(new A()).to(url);
    })
  },
  Element: {
    // Create a hyperlink element
    linkTo: function linkTo(url) {
      var link = new A();

      if (typeof url === 'function') {
        url.call(link, link);
      } else {
        link.to(url);
      }

      return this.parent().put(link).put(this);
    }
  }
});
register(A, 'A');

var Mask =
/*#__PURE__*/
function (_Container) {
  _inherits$1(Mask, _Container);

  // Initialize node
  function Mask(node) {
    _classCallCheck$1(this, Mask);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(Mask).call(this, nodeOrNew('mask', node), node));
  } // Unmask all masked elements and remove itself


  _createClass$1(Mask, [{
    key: "remove",
    value: function remove() {
      // unmask all targets
      this.targets().forEach(function (el) {
        el.unmask();
      }); // remove mask from parent

      return _get(_getPrototypeOf$1(Mask.prototype), "remove", this).call(this);
    }
  }, {
    key: "targets",
    value: function targets() {
      return baseFind('svg [mask*="' + this.id() + '"]');
    }
  }]);

  return Mask;
}(Container);
registerMethods({
  Container: {
    mask: wrapWithAttrCheck(function () {
      return this.defs().put(new Mask());
    })
  },
  Element: {
    // Distribute mask to svg element
    maskWith: function maskWith(element) {
      // use given mask or create a new one
      var masker = element instanceof Mask ? element : this.parent().mask().add(element); // apply mask

      return this.attr('mask', 'url("#' + masker.id() + '")');
    },
    // Unmask element
    unmask: function unmask() {
      return this.attr('mask', null);
    },
    masker: function masker() {
      return this.reference('mask');
    }
  }
});
register(Mask, 'Mask');

function ownKeys$3(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$3(source, true).forEach(function (key) { _defineProperty$1(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$3(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function cssRule(selector, rule) {
  if (!selector) return '';
  if (!rule) return selector;
  var ret = selector + '{';

  for (var i in rule) {
    ret += unCamelCase(i) + ':' + rule[i] + ';';
  }

  ret += '}';
  return ret;
}

var Style =
/*#__PURE__*/
function (_Element) {
  _inherits$1(Style, _Element);

  function Style(node) {
    _classCallCheck$1(this, Style);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(Style).call(this, nodeOrNew('style', node), node));
  }

  _createClass$1(Style, [{
    key: "addText",
    value: function addText() {
      var w = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      this.node.textContent += w;
      return this;
    }
  }, {
    key: "font",
    value: function font(name, src) {
      var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      return this.rule('@font-face', _objectSpread$2({
        fontFamily: name,
        src: src
      }, params));
    }
  }, {
    key: "rule",
    value: function rule(selector, obj) {
      return this.addText(cssRule(selector, obj));
    }
  }]);

  return Style;
}(Element);
registerMethods('Dom', {
  style: wrapWithAttrCheck(function (selector, obj) {
    return this.put(new Style()).rule(selector, obj);
  }),
  fontface: wrapWithAttrCheck(function (name, src, params) {
    return this.put(new Style()).font(name, src, params);
  })
});
register(Style, 'Style');

var TextPath =
/*#__PURE__*/
function (_Text) {
  _inherits$1(TextPath, _Text);

  // Initialize node
  function TextPath(node) {
    _classCallCheck$1(this, TextPath);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(TextPath).call(this, nodeOrNew('textPath', node), node));
  } // return the array of the path track element


  _createClass$1(TextPath, [{
    key: "array",
    value: function array() {
      var track = this.track();
      return track ? track.array() : null;
    } // Plot path if any

  }, {
    key: "plot",
    value: function plot(d) {
      var track = this.track();
      var pathArray = null;

      if (track) {
        pathArray = track.plot(d);
      }

      return d == null ? pathArray : this;
    } // Get the path element

  }, {
    key: "track",
    value: function track() {
      return this.reference('href');
    }
  }]);

  return TextPath;
}(Text);
registerMethods({
  Container: {
    textPath: wrapWithAttrCheck(function (text, path) {
      // Convert text to instance if needed
      if (!(text instanceof Text)) {
        text = this.text(text);
      }

      return text.path(path);
    })
  },
  Text: {
    // Create path for text to run on
    path: wrapWithAttrCheck(function (track) {
      var importNodes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var textPath = new TextPath(); // if track is a path, reuse it

      if (!(track instanceof Path)) {
        // create path element
        track = this.defs().path(track);
      } // link textPath to path and add content


      textPath.attr('href', '#' + track, xlink); // Transplant all nodes from text to textPath

      var node;

      if (importNodes) {
        while (node = this.node.firstChild) {
          textPath.node.appendChild(node);
        }
      } // add textPath element as child node and return textPath


      return this.put(textPath);
    }),
    // Get the textPath children
    textPath: function textPath() {
      return this.findOne('textPath');
    }
  },
  Path: {
    // creates a textPath from this path
    text: wrapWithAttrCheck(function (text) {
      // Convert text to instance if needed
      if (!(text instanceof Text)) {
        text = new Text().addTo(this.parent()).text(text);
      } // Create textPath from text and path and return


      return text.path(this);
    }),
    targets: function targets() {
      return baseFind('svg [href*="' + this.id() + '"]');
    }
  }
});
TextPath.prototype.MorphArray = PathArray;
register(TextPath, 'TextPath');

var Use =
/*#__PURE__*/
function (_Shape) {
  _inherits$1(Use, _Shape);

  function Use(node) {
    _classCallCheck$1(this, Use);

    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(Use).call(this, nodeOrNew('use', node), node));
  } // Use element as a reference


  _createClass$1(Use, [{
    key: "element",
    value: function element(_element, file) {
      // Set lined element
      return this.attr('href', (file || '') + '#' + _element, xlink);
    }
  }]);

  return Use;
}(Shape);
registerMethods({
  Container: {
    // Create a use element
    use: wrapWithAttrCheck(function (element, file) {
      return this.put(new Use()).element(element, file);
    })
  }
});
register(Use, 'Use');

/* Optional Modules */
var SVG = makeInstance;
extend([Svg, _Symbol, Image, Pattern, Marker], getMethodsFor('viewbox'));
extend([Line, Polyline, Polygon, Path], getMethodsFor('marker'));
extend(Text, getMethodsFor('Text'));
extend(Path, getMethodsFor('Path'));
extend(Defs, getMethodsFor('Defs'));
extend([Text, Tspan], getMethodsFor('Tspan'));
extend([Rect, Ellipse, Circle, Gradient], getMethodsFor('radius'));
extend(EventTarget, getMethodsFor('EventTarget'));
extend(Dom, getMethodsFor('Dom'));
extend(Element, getMethodsFor('Element'));
extend(Shape, getMethodsFor('Shape')); // extend(Element, getConstructor('Memory'))

extend(Container, getMethodsFor('Container'));
extend(Runner, getMethodsFor('Runner'));
List.extend(getMethodNames());
registerMorphableType([SVGNumber, Color, Box, Matrix, SVGArray, PointArray, PathArray]);
makeMorphable();
//# sourceMappingURL=svg.esm.js.map

const getCoordsFromEvent = (ev) => {
  if (ev.changedTouches) {
    ev = ev.changedTouches[0];
  }
  return { x: ev.clientX, y: ev.clientY }
};

// Creates handler, saves it
class DragHandler {
  constructor (el) {
    el.remember('_draggable', this);
    this.el = el;

    this.drag = this.drag.bind(this);
    this.startDrag = this.startDrag.bind(this);
    this.endDrag = this.endDrag.bind(this);
  }

  // Enables or disabled drag based on input
  init (enabled) {
    if (enabled) {
      this.el.on('mousedown.drag', this.startDrag);
      this.el.on('touchstart.drag', this.startDrag);
    } else {
      this.el.off('mousedown.drag');
      this.el.off('touchstart.drag');
    }
  }

  // Start dragging
  startDrag (ev) {
    const isMouse = !ev.type.indexOf('mouse');

    // Check for left button
    if (isMouse && (ev.which || ev.buttons) !== 1) {
      return
    }

    // Fire beforedrag event
    if (this.el.dispatch('beforedrag', { event: ev, handler: this }).defaultPrevented) {
      return
    }

    // Prevent browser drag behavior as soon as possible
    ev.preventDefault();

    // Prevent propagation to a parent that might also have dragging enabled
    ev.stopPropagation();

    // Make sure that start events are unbound so that one element
    // is only dragged by one input only
    this.init(false);

    this.box = this.el.bbox();
    this.lastClick = this.el.point(getCoordsFromEvent(ev));

    // We consider the drag done, when a touch is canceled, too
    const eventMove = (isMouse ? 'mousemove' : 'touchmove') + '.drag';
    const eventEnd = (isMouse ? 'mouseup' : 'touchcancel.drag touchend') + '.drag';

    // Bind drag and end events to window
    on(window, eventMove, this.drag);
    on(window, eventEnd, this.endDrag);

    // Fire dragstart event
    this.el.fire('dragstart', { event: ev, handler: this, box: this.box });
  }

  // While dragging
  drag (ev) {

    const { box, lastClick } = this;

    const currentClick = this.el.point(getCoordsFromEvent(ev));
    const x = box.x + (currentClick.x - lastClick.x);
    const y = box.y + (currentClick.y - lastClick.y);
    const newBox = new Box(x, y, box.w, box.h);

    if (this.el.dispatch('dragmove', {
      event: ev,
      handler: this,
      box: newBox
    }).defaultPrevented) return

    this.move(x, y);
    return newBox
  }

  move (x, y) {
    // Svg elements bbox depends on their content even though they have
    // x, y, width and height - strange!
    // Thats why we handle them the same as groups
    if (this.el.type === 'svg') {
      G.prototype.move.call(this.el, x, y);
    } else {
      this.el.move(x, y);
    }
  }

  endDrag (ev) {
    // final drag
    const box = this.drag(ev);

    // fire dragend event
    this.el.fire('dragend', { event: ev, handler: this, box });

    // unbind events
    off(window, 'mousemove.drag');
    off(window, 'touchmove.drag');
    off(window, 'mouseup.drag');
    off(window, 'touchend.drag');

    // Rebind initial Events
    this.init(true);
  }
}

extend(Element, {
  draggable (enable = true) {
    const dragHandler = this.remember('_draggable') || new DragHandler(this);
    dragHandler.init(enable);
    return this
  }
});

var aPossiblePrototype$1 = function (it) {
  if (!isObject(it) && it !== null) {
    throw TypeError("Can't set " + String(it) + ' as a prototype');
  } return it;
};

// `Object.setPrototypeOf` method
// https://tc39.github.io/ecma262/#sec-object.setprototypeof
// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var objectSetPrototypeOf$1 = Object.setPrototypeOf || ('__proto__' in {} ? function () {
  var CORRECT_SETTER = false;
  var test = {};
  var setter;
  try {
    setter = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set;
    setter.call(test, []);
    CORRECT_SETTER = test instanceof Array;
  } catch (error) { /* empty */ }
  return function setPrototypeOf(O, proto) {
    anObject(O);
    aPossiblePrototype$1(proto);
    if (CORRECT_SETTER) setter.call(O, proto);
    else O.__proto__ = proto;
    return O;
  };
}() : undefined);

// makes subclassing work correct for wrapped built-ins
var inheritIfRequired$1 = function ($this, dummy, Wrapper) {
  var NewTarget, NewTargetPrototype;
  if (
    // it can work only with native `setPrototypeOf`
    objectSetPrototypeOf$1 &&
    // we haven't completely correct pre-ES6 way for getting `new.target`, so use this
    typeof (NewTarget = dummy.constructor) == 'function' &&
    NewTarget !== Wrapper &&
    isObject(NewTargetPrototype = NewTarget.prototype) &&
    NewTargetPrototype !== Wrapper.prototype
  ) objectSetPrototypeOf$1($this, NewTargetPrototype);
  return $this;
};

// `Object.keys` method
// https://tc39.github.io/ecma262/#sec-object.keys
var objectKeys$1 = Object.keys || function keys(O) {
  return objectKeysInternal(O, enumBugKeys);
};

// `Object.defineProperties` method
// https://tc39.github.io/ecma262/#sec-object.defineproperties
var objectDefineProperties$1 = descriptors ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = objectKeys$1(Properties);
  var length = keys.length;
  var index = 0;
  var key;
  while (length > index) objectDefineProperty.f(O, key = keys[index++], Properties[key]);
  return O;
};

var html$1 = getBuiltIn('document', 'documentElement');

var GT = '>';
var LT = '<';
var PROTOTYPE$2 = 'prototype';
var SCRIPT = 'script';
var IE_PROTO$2 = sharedKey('IE_PROTO');

var EmptyConstructor = function () { /* empty */ };

var scriptTag = function (content) {
  return LT + SCRIPT + GT + content + LT + '/' + SCRIPT + GT;
};

// Create object with fake `null` prototype: use ActiveX Object with cleared prototype
var NullProtoObjectViaActiveX = function (activeXDocument) {
  activeXDocument.write(scriptTag(''));
  activeXDocument.close();
  var temp = activeXDocument.parentWindow.Object;
  activeXDocument = null; // avoid memory leak
  return temp;
};

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var NullProtoObjectViaIFrame = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = documentCreateElement('iframe');
  var JS = 'java' + SCRIPT + ':';
  var iframeDocument;
  iframe.style.display = 'none';
  html$1.appendChild(iframe);
  // https://github.com/zloirock/core-js/issues/475
  iframe.src = String(JS);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(scriptTag('document.F=Object'));
  iframeDocument.close();
  return iframeDocument.F;
};

// Check for document.domain and active x support
// No need to use active x approach when document.domain is not set
// see https://github.com/es-shims/es5-shim/issues/150
// variation of https://github.com/kitcambridge/es5-shim/commit/4f738ac066346
// avoid IE GC bug
var activeXDocument;
var NullProtoObject = function () {
  try {
    /* global ActiveXObject */
    activeXDocument = document.domain && new ActiveXObject('htmlfile');
  } catch (error) { /* ignore */ }
  NullProtoObject = activeXDocument ? NullProtoObjectViaActiveX(activeXDocument) : NullProtoObjectViaIFrame();
  var length = enumBugKeys.length;
  while (length--) delete NullProtoObject[PROTOTYPE$2][enumBugKeys[length]];
  return NullProtoObject();
};

hiddenKeys[IE_PROTO$2] = true;

// `Object.create` method
// https://tc39.github.io/ecma262/#sec-object.create
var objectCreate$1 = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    EmptyConstructor[PROTOTYPE$2] = anObject(O);
    result = new EmptyConstructor();
    EmptyConstructor[PROTOTYPE$2] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO$2] = O;
  } else result = NullProtoObject();
  return Properties === undefined ? result : objectDefineProperties$1(result, Properties);
};

// a string of all valid unicode whitespaces
// eslint-disable-next-line max-len
var whitespaces$1 = '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';

var whitespace$2 = '[' + whitespaces$1 + ']';
var ltrim$1 = RegExp('^' + whitespace$2 + whitespace$2 + '*');
var rtrim$1 = RegExp(whitespace$2 + whitespace$2 + '*$');

// `String.prototype.{ trim, trimStart, trimEnd, trimLeft, trimRight }` methods implementation
var createMethod$5 = function (TYPE) {
  return function ($this) {
    var string = String(requireObjectCoercible($this));
    if (TYPE & 1) string = string.replace(ltrim$1, '');
    if (TYPE & 2) string = string.replace(rtrim$1, '');
    return string;
  };
};

var stringTrim$1 = {
  // `String.prototype.{ trimLeft, trimStart }` methods
  // https://tc39.github.io/ecma262/#sec-string.prototype.trimstart
  start: createMethod$5(1),
  // `String.prototype.{ trimRight, trimEnd }` methods
  // https://tc39.github.io/ecma262/#sec-string.prototype.trimend
  end: createMethod$5(2),
  // `String.prototype.trim` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.trim
  trim: createMethod$5(3)
};

var getOwnPropertyNames$1 = objectGetOwnPropertyNames.f;
var getOwnPropertyDescriptor$3 = objectGetOwnPropertyDescriptor.f;
var defineProperty$6 = objectDefineProperty.f;
var trim$3 = stringTrim$1.trim;

var NUMBER$1 = 'Number';
var NativeNumber$1 = global_1[NUMBER$1];
var NumberPrototype$1 = NativeNumber$1.prototype;

// Opera ~12 has broken Object#toString
var BROKEN_CLASSOF$1 = classofRaw(objectCreate$1(NumberPrototype$1)) == NUMBER$1;

// `ToNumber` abstract operation
// https://tc39.github.io/ecma262/#sec-tonumber
var toNumber$1 = function (argument) {
  var it = toPrimitive(argument, false);
  var first, third, radix, maxCode, digits, length, index, code;
  if (typeof it == 'string' && it.length > 2) {
    it = trim$3(it);
    first = it.charCodeAt(0);
    if (first === 43 || first === 45) {
      third = it.charCodeAt(2);
      if (third === 88 || third === 120) return NaN; // Number('+0x1') should be NaN, old V8 fix
    } else if (first === 48) {
      switch (it.charCodeAt(1)) {
        case 66: case 98: radix = 2; maxCode = 49; break; // fast equal of /^0b[01]+$/i
        case 79: case 111: radix = 8; maxCode = 55; break; // fast equal of /^0o[0-7]+$/i
        default: return +it;
      }
      digits = it.slice(2);
      length = digits.length;
      for (index = 0; index < length; index++) {
        code = digits.charCodeAt(index);
        // parseInt parses a string to a first unavailable symbol
        // but ToNumber should return NaN if a string contains unavailable symbols
        if (code < 48 || code > maxCode) return NaN;
      } return parseInt(digits, radix);
    }
  } return +it;
};

// `Number` constructor
// https://tc39.github.io/ecma262/#sec-number-constructor
if (isForced_1(NUMBER$1, !NativeNumber$1(' 0o1') || !NativeNumber$1('0b1') || NativeNumber$1('+0x1'))) {
  var NumberWrapper$1 = function Number(value) {
    var it = arguments.length < 1 ? 0 : value;
    var dummy = this;
    return dummy instanceof NumberWrapper$1
      // check on 1..constructor(foo) case
      && (BROKEN_CLASSOF$1 ? fails(function () { NumberPrototype$1.valueOf.call(dummy); }) : classofRaw(dummy) != NUMBER$1)
        ? inheritIfRequired$1(new NativeNumber$1(toNumber$1(it)), dummy, NumberWrapper$1) : toNumber$1(it);
  };
  for (var keys$2 = descriptors ? getOwnPropertyNames$1(NativeNumber$1) : (
    // ES3:
    'MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,' +
    // ES2015 (in case, if modules with ES2015 Number statics required before):
    'EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,' +
    'MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger'
  ).split(','), j$1 = 0, key$1; keys$2.length > j$1; j$1++) {
    if (has(NativeNumber$1, key$1 = keys$2[j$1]) && !has(NumberWrapper$1, key$1)) {
      defineProperty$6(NumberWrapper$1, key$1, getOwnPropertyDescriptor$3(NativeNumber$1, key$1));
    }
  }
  NumberWrapper$1.prototype = NumberPrototype$1;
  NumberPrototype$1.constructor = NumberWrapper$1;
  redefine(global_1, NUMBER$1, NumberWrapper$1);
}

/**
 * Minified extension. The orginal library had a lot of unwanted functionality
 * 
 * @see https://github.com/svgdotjs/svg.panzoom.js
 * @private
 */

extend(Svg, {
  panZoom: function panZoom(options) {
    var _options,
        _options$zoomFactor,
        _options$zoomMin,
        _options$zoomMax,
        _options$wheelZoom,
        _options$margins,
        _this = this;

    this.off('.panZoom'); // when called with false, disable panZoom

    if (options === false) return this;
    options = (_options = options) !== null && _options !== void 0 ? _options : {};
    var zoomFactor = (_options$zoomFactor = options.zoomFactor) !== null && _options$zoomFactor !== void 0 ? _options$zoomFactor : 2;
    var zoomMin = (_options$zoomMin = options.zoomMin) !== null && _options$zoomMin !== void 0 ? _options$zoomMin : Number.MIN_VALUE;
    var zoomMax = (_options$zoomMax = options.zoomMax) !== null && _options$zoomMax !== void 0 ? _options$zoomMax : Number.MAX_VALUE;
    var doWheelZoom = (_options$wheelZoom = options.wheelZoom) !== null && _options$wheelZoom !== void 0 ? _options$wheelZoom : true;
    var margins = (_options$margins = options.margins) !== null && _options$margins !== void 0 ? _options$margins : false;

    var restrictToMargins = function restrictToMargins(box) {
      if (!margins) return;
      var top = margins.top,
          left = margins.left,
          bottom = margins.bottom,
          right = margins.right;
      var zoom = _this.width() / box.width;

      var _this$attr = _this.attr(['width', 'height']),
          width = _this$attr.width,
          height = _this$attr.height;

      var leftLimit = width - left / zoom;
      var rightLimit = (right - width) / zoom;
      var topLimit = height - top / zoom;
      var bottomLimit = (bottom - height) / zoom;
      box.x = Math.min(leftLimit, Math.max(rightLimit, box.x));
      box.y = Math.min(topLimit, Math.max(bottomLimit, box.y));
      return box;
    };

    var wheelZoom = function wheelZoom(ev) {
      ev.preventDefault(); // touchpads can give ev.deltaY == 0, which skrews the lvl calculation

      if (ev.deltaY === 0) return;
      var lvl = Math.pow(1 + zoomFactor, -1 * ev.deltaY / 100) * this.zoom();
      var p = this.point(ev.clientX, ev.clientY);

      if (lvl > zoomMax) {
        lvl = zoomMax;
      }

      if (lvl < zoomMin) {
        lvl = zoomMin;
      }

      if (this.dispatch('zoom', {
        level: lvl,
        focus: p
      }).defaultPrevented) {
        return this;
      }

      this.zoom(lvl, p);

      if (margins) {
        var box = restrictToMargins(this.viewbox());
        this.viewbox(box);
      }
    };

    if (doWheelZoom) {
      this.on('wheel.panZoom', wheelZoom, this, {
        passive: false
      });
    }

    return this;
  }
});

var UNSCOPABLES$1 = wellKnownSymbol('unscopables');
var ArrayPrototype$2 = Array.prototype;

// Array.prototype[@@unscopables]
// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
if (ArrayPrototype$2[UNSCOPABLES$1] == undefined) {
  objectDefineProperty.f(ArrayPrototype$2, UNSCOPABLES$1, {
    configurable: true,
    value: objectCreate$1(null)
  });
}

// add a key to Array.prototype[@@unscopables]
var addToUnscopables$1 = function (key) {
  ArrayPrototype$2[UNSCOPABLES$1][key] = true;
};

var $find = arrayIteration.find;



var FIND = 'find';
var SKIPS_HOLES = true;

var USES_TO_LENGTH$5 = arrayMethodUsesToLength(FIND);

// Shouldn't skip holes
if (FIND in []) Array(1)[FIND](function () { SKIPS_HOLES = false; });

// `Array.prototype.find` method
// https://tc39.github.io/ecma262/#sec-array.prototype.find
_export({ target: 'Array', proto: true, forced: SKIPS_HOLES || !USES_TO_LENGTH$5 }, {
  find: function find(callbackfn /* , that = undefined */) {
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables$1(FIND);

var IS_CONCAT_SPREADABLE$1 = wellKnownSymbol('isConcatSpreadable');
var MAX_SAFE_INTEGER$2 = 0x1FFFFFFFFFFFFF;
var MAXIMUM_ALLOWED_INDEX_EXCEEDED$1 = 'Maximum allowed index exceeded';

// We can't use this feature detection in V8 since it causes
// deoptimization and serious performance degradation
// https://github.com/zloirock/core-js/issues/679
var IS_CONCAT_SPREADABLE_SUPPORT$1 = engineV8Version >= 51 || !fails(function () {
  var array = [];
  array[IS_CONCAT_SPREADABLE$1] = false;
  return array.concat()[0] !== array;
});

var SPECIES_SUPPORT$1 = arrayMethodHasSpeciesSupport('concat');

var isConcatSpreadable$1 = function (O) {
  if (!isObject(O)) return false;
  var spreadable = O[IS_CONCAT_SPREADABLE$1];
  return spreadable !== undefined ? !!spreadable : isArray(O);
};

var FORCED$5 = !IS_CONCAT_SPREADABLE_SUPPORT$1 || !SPECIES_SUPPORT$1;

// `Array.prototype.concat` method
// https://tc39.github.io/ecma262/#sec-array.prototype.concat
// with adding support of @@isConcatSpreadable and @@species
_export({ target: 'Array', proto: true, forced: FORCED$5 }, {
  concat: function concat(arg) { // eslint-disable-line no-unused-vars
    var O = toObject(this);
    var A = arraySpeciesCreate(O, 0);
    var n = 0;
    var i, k, length, len, E;
    for (i = -1, length = arguments.length; i < length; i++) {
      E = i === -1 ? O : arguments[i];
      if (isConcatSpreadable$1(E)) {
        len = toLength(E.length);
        if (n + len > MAX_SAFE_INTEGER$2) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED$1);
        for (k = 0; k < len; k++, n++) if (k in E) createProperty(A, n, E[k]);
      } else {
        if (n >= MAX_SAFE_INTEGER$2) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED$1);
        createProperty(A, n++, E);
      }
    }
    A.length = n;
    return A;
  }
});

var $filter$1 = arrayIteration.filter;



var HAS_SPECIES_SUPPORT$2 = arrayMethodHasSpeciesSupport('filter');
// Edge 14- issue
var USES_TO_LENGTH$6 = arrayMethodUsesToLength('filter');

// `Array.prototype.filter` method
// https://tc39.github.io/ecma262/#sec-array.prototype.filter
// with adding support of @@species
_export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT$2 || !USES_TO_LENGTH$6 }, {
  filter: function filter(callbackfn /* , thisArg */) {
    return $filter$1(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// `FlattenIntoArray` abstract operation
// https://tc39.github.io/proposal-flatMap/#sec-FlattenIntoArray
var flattenIntoArray = function (target, original, source, sourceLen, start, depth, mapper, thisArg) {
  var targetIndex = start;
  var sourceIndex = 0;
  var mapFn = mapper ? functionBindContext(mapper, thisArg, 3) : false;
  var element;

  while (sourceIndex < sourceLen) {
    if (sourceIndex in source) {
      element = mapFn ? mapFn(source[sourceIndex], sourceIndex, original) : source[sourceIndex];

      if (depth > 0 && isArray(element)) {
        targetIndex = flattenIntoArray(target, original, element, toLength(element.length), targetIndex, depth - 1) - 1;
      } else {
        if (targetIndex >= 0x1FFFFFFFFFFFFF) throw TypeError('Exceed the acceptable array length');
        target[targetIndex] = element;
      }

      targetIndex++;
    }
    sourceIndex++;
  }
  return targetIndex;
};

var flattenIntoArray_1 = flattenIntoArray;

// `Array.prototype.flat` method
// https://github.com/tc39/proposal-flatMap
_export({ target: 'Array', proto: true }, {
  flat: function flat(/* depthArg = 1 */) {
    var depthArg = arguments.length ? arguments[0] : undefined;
    var O = toObject(this);
    var sourceLen = toLength(O.length);
    var A = arraySpeciesCreate(O, 0);
    A.length = flattenIntoArray_1(A, O, O, sourceLen, 0, depthArg === undefined ? 1 : toInteger(depthArg));
    return A;
  }
});

var $includes$1 = arrayIncludes.includes;



var USES_TO_LENGTH$7 = arrayMethodUsesToLength('indexOf', { ACCESSORS: true, 1: 0 });

// `Array.prototype.includes` method
// https://tc39.github.io/ecma262/#sec-array.prototype.includes
_export({ target: 'Array', proto: true, forced: !USES_TO_LENGTH$7 }, {
  includes: function includes(el /* , fromIndex = 0 */) {
    return $includes$1(this, el, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables$1('includes');

var iterators$1 = {};

var correctPrototypeGetter$1 = !fails(function () {
  function F() { /* empty */ }
  F.prototype.constructor = null;
  return Object.getPrototypeOf(new F()) !== F.prototype;
});

var IE_PROTO$3 = sharedKey('IE_PROTO');
var ObjectPrototype$3 = Object.prototype;

// `Object.getPrototypeOf` method
// https://tc39.github.io/ecma262/#sec-object.getprototypeof
var objectGetPrototypeOf$1 = correctPrototypeGetter$1 ? Object.getPrototypeOf : function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO$3)) return O[IE_PROTO$3];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectPrototype$3 : null;
};

var ITERATOR$6 = wellKnownSymbol('iterator');
var BUGGY_SAFARI_ITERATORS$2 = false;

var returnThis$3 = function () { return this; };

// `%IteratorPrototype%` object
// https://tc39.github.io/ecma262/#sec-%iteratorprototype%-object
var IteratorPrototype$3, PrototypeOfArrayIteratorPrototype$1, arrayIterator$1;

if ([].keys) {
  arrayIterator$1 = [].keys();
  // Safari 8 has buggy iterators w/o `next`
  if (!('next' in arrayIterator$1)) BUGGY_SAFARI_ITERATORS$2 = true;
  else {
    PrototypeOfArrayIteratorPrototype$1 = objectGetPrototypeOf$1(objectGetPrototypeOf$1(arrayIterator$1));
    if (PrototypeOfArrayIteratorPrototype$1 !== Object.prototype) IteratorPrototype$3 = PrototypeOfArrayIteratorPrototype$1;
  }
}

if (IteratorPrototype$3 == undefined) IteratorPrototype$3 = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
if ( !has(IteratorPrototype$3, ITERATOR$6)) {
  createNonEnumerableProperty(IteratorPrototype$3, ITERATOR$6, returnThis$3);
}

var iteratorsCore$1 = {
  IteratorPrototype: IteratorPrototype$3,
  BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS$2
};

var defineProperty$7 = objectDefineProperty.f;



var TO_STRING_TAG$4 = wellKnownSymbol('toStringTag');

var setToStringTag$1 = function (it, TAG, STATIC) {
  if (it && !has(it = STATIC ? it : it.prototype, TO_STRING_TAG$4)) {
    defineProperty$7(it, TO_STRING_TAG$4, { configurable: true, value: TAG });
  }
};

var IteratorPrototype$4 = iteratorsCore$1.IteratorPrototype;





var returnThis$4 = function () { return this; };

var createIteratorConstructor$1 = function (IteratorConstructor, NAME, next) {
  var TO_STRING_TAG = NAME + ' Iterator';
  IteratorConstructor.prototype = objectCreate$1(IteratorPrototype$4, { next: createPropertyDescriptor(1, next) });
  setToStringTag$1(IteratorConstructor, TO_STRING_TAG, false);
  iterators$1[TO_STRING_TAG] = returnThis$4;
  return IteratorConstructor;
};

var IteratorPrototype$5 = iteratorsCore$1.IteratorPrototype;
var BUGGY_SAFARI_ITERATORS$3 = iteratorsCore$1.BUGGY_SAFARI_ITERATORS;
var ITERATOR$7 = wellKnownSymbol('iterator');
var KEYS$1 = 'keys';
var VALUES$1 = 'values';
var ENTRIES$1 = 'entries';

var returnThis$5 = function () { return this; };

var defineIterator$1 = function (Iterable, NAME, IteratorConstructor, next, DEFAULT, IS_SET, FORCED) {
  createIteratorConstructor$1(IteratorConstructor, NAME, next);

  var getIterationMethod = function (KIND) {
    if (KIND === DEFAULT && defaultIterator) return defaultIterator;
    if (!BUGGY_SAFARI_ITERATORS$3 && KIND in IterablePrototype) return IterablePrototype[KIND];
    switch (KIND) {
      case KEYS$1: return function keys() { return new IteratorConstructor(this, KIND); };
      case VALUES$1: return function values() { return new IteratorConstructor(this, KIND); };
      case ENTRIES$1: return function entries() { return new IteratorConstructor(this, KIND); };
    } return function () { return new IteratorConstructor(this); };
  };

  var TO_STRING_TAG = NAME + ' Iterator';
  var INCORRECT_VALUES_NAME = false;
  var IterablePrototype = Iterable.prototype;
  var nativeIterator = IterablePrototype[ITERATOR$7]
    || IterablePrototype['@@iterator']
    || DEFAULT && IterablePrototype[DEFAULT];
  var defaultIterator = !BUGGY_SAFARI_ITERATORS$3 && nativeIterator || getIterationMethod(DEFAULT);
  var anyNativeIterator = NAME == 'Array' ? IterablePrototype.entries || nativeIterator : nativeIterator;
  var CurrentIteratorPrototype, methods, KEY;

  // fix native
  if (anyNativeIterator) {
    CurrentIteratorPrototype = objectGetPrototypeOf$1(anyNativeIterator.call(new Iterable()));
    if (IteratorPrototype$5 !== Object.prototype && CurrentIteratorPrototype.next) {
      if ( objectGetPrototypeOf$1(CurrentIteratorPrototype) !== IteratorPrototype$5) {
        if (objectSetPrototypeOf$1) {
          objectSetPrototypeOf$1(CurrentIteratorPrototype, IteratorPrototype$5);
        } else if (typeof CurrentIteratorPrototype[ITERATOR$7] != 'function') {
          createNonEnumerableProperty(CurrentIteratorPrototype, ITERATOR$7, returnThis$5);
        }
      }
      // Set @@toStringTag to native iterators
      setToStringTag$1(CurrentIteratorPrototype, TO_STRING_TAG, true);
    }
  }

  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEFAULT == VALUES$1 && nativeIterator && nativeIterator.name !== VALUES$1) {
    INCORRECT_VALUES_NAME = true;
    defaultIterator = function values() { return nativeIterator.call(this); };
  }

  // define iterator
  if ( IterablePrototype[ITERATOR$7] !== defaultIterator) {
    createNonEnumerableProperty(IterablePrototype, ITERATOR$7, defaultIterator);
  }
  iterators$1[NAME] = defaultIterator;

  // export additional methods
  if (DEFAULT) {
    methods = {
      values: getIterationMethod(VALUES$1),
      keys: IS_SET ? defaultIterator : getIterationMethod(KEYS$1),
      entries: getIterationMethod(ENTRIES$1)
    };
    if (FORCED) for (KEY in methods) {
      if (BUGGY_SAFARI_ITERATORS$3 || INCORRECT_VALUES_NAME || !(KEY in IterablePrototype)) {
        redefine(IterablePrototype, KEY, methods[KEY]);
      }
    } else _export({ target: NAME, proto: true, forced: BUGGY_SAFARI_ITERATORS$3 || INCORRECT_VALUES_NAME }, methods);
  }

  return methods;
};

var ARRAY_ITERATOR$1 = 'Array Iterator';
var setInternalState$4 = internalState.set;
var getInternalState$3 = internalState.getterFor(ARRAY_ITERATOR$1);

// `Array.prototype.entries` method
// https://tc39.github.io/ecma262/#sec-array.prototype.entries
// `Array.prototype.keys` method
// https://tc39.github.io/ecma262/#sec-array.prototype.keys
// `Array.prototype.values` method
// https://tc39.github.io/ecma262/#sec-array.prototype.values
// `Array.prototype[@@iterator]` method
// https://tc39.github.io/ecma262/#sec-array.prototype-@@iterator
// `CreateArrayIterator` internal method
// https://tc39.github.io/ecma262/#sec-createarrayiterator
var es_array_iterator$1 = defineIterator$1(Array, 'Array', function (iterated, kind) {
  setInternalState$4(this, {
    type: ARRAY_ITERATOR$1,
    target: toIndexedObject(iterated), // target
    index: 0,                          // next index
    kind: kind                         // kind
  });
// `%ArrayIteratorPrototype%.next` method
// https://tc39.github.io/ecma262/#sec-%arrayiteratorprototype%.next
}, function () {
  var state = getInternalState$3(this);
  var target = state.target;
  var kind = state.kind;
  var index = state.index++;
  if (!target || index >= target.length) {
    state.target = undefined;
    return { value: undefined, done: true };
  }
  if (kind == 'keys') return { value: index, done: false };
  if (kind == 'values') return { value: target[index], done: false };
  return { value: [index, target[index]], done: false };
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values%
// https://tc39.github.io/ecma262/#sec-createunmappedargumentsobject
// https://tc39.github.io/ecma262/#sec-createmappedargumentsobject
iterators$1.Arguments = iterators$1.Array;

// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables$1('keys');
addToUnscopables$1('values');
addToUnscopables$1('entries');

var nativeJoin$1 = [].join;

var ES3_STRINGS$1 = indexedObject != Object;
var STRICT_METHOD$3 = arrayMethodIsStrict('join', ',');

// `Array.prototype.join` method
// https://tc39.github.io/ecma262/#sec-array.prototype.join
_export({ target: 'Array', proto: true, forced: ES3_STRINGS$1 || !STRICT_METHOD$3 }, {
  join: function join(separator) {
    return nativeJoin$1.call(toIndexedObject(this), separator === undefined ? ',' : separator);
  }
});

// this method was added to unscopables after implementation
// in popular engines, so it's moved to a separate module


addToUnscopables$1('flat');

var TO_STRING_TAG$5 = wellKnownSymbol('toStringTag');
var test$3 = {};

test$3[TO_STRING_TAG$5] = 'z';

var toStringTagSupport = String(test$3) === '[object z]';

var TO_STRING_TAG$6 = wellKnownSymbol('toStringTag');
// ES3 wrong here
var CORRECT_ARGUMENTS$1 = classofRaw(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet$1 = function (it, key) {
  try {
    return it[key];
  } catch (error) { /* empty */ }
};

// getting tag from ES6+ `Object.prototype.toString`
var classof$1 = toStringTagSupport ? classofRaw : function (it) {
  var O, tag, result;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (tag = tryGet$1(O = Object(it), TO_STRING_TAG$6)) == 'string' ? tag
    // builtinTag case
    : CORRECT_ARGUMENTS$1 ? classofRaw(O)
    // ES3 arguments fallback
    : (result = classofRaw(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : result;
};

// `Object.prototype.toString` method implementation
// https://tc39.github.io/ecma262/#sec-object.prototype.tostring
var objectToString$1 = toStringTagSupport ? {}.toString : function toString() {
  return '[object ' + classof$1(this) + ']';
};

// `Object.prototype.toString` method
// https://tc39.github.io/ecma262/#sec-object.prototype.tostring
if (!toStringTagSupport) {
  redefine(Object.prototype, 'toString', objectToString$1, { unsafe: true });
}

var nativePromiseConstructor = global_1.Promise;

var redefineAll$1 = function (target, src, options) {
  for (var key in src) redefine(target, key, src[key], options);
  return target;
};

var SPECIES$6 = wellKnownSymbol('species');

var setSpecies$1 = function (CONSTRUCTOR_NAME) {
  var Constructor = getBuiltIn(CONSTRUCTOR_NAME);
  var defineProperty = objectDefineProperty.f;

  if (descriptors && Constructor && !Constructor[SPECIES$6]) {
    defineProperty(Constructor, SPECIES$6, {
      configurable: true,
      get: function () { return this; }
    });
  }
};

var anInstance$1 = function (it, Constructor, name) {
  if (!(it instanceof Constructor)) {
    throw TypeError('Incorrect ' + (name ? name + ' ' : '') + 'invocation');
  } return it;
};

var ITERATOR$8 = wellKnownSymbol('iterator');
var ArrayPrototype$3 = Array.prototype;

// check on default Array iterator
var isArrayIteratorMethod$1 = function (it) {
  return it !== undefined && (iterators$1.Array === it || ArrayPrototype$3[ITERATOR$8] === it);
};

var ITERATOR$9 = wellKnownSymbol('iterator');

var getIteratorMethod$1 = function (it) {
  if (it != undefined) return it[ITERATOR$9]
    || it['@@iterator']
    || iterators$1[classof$1(it)];
};

// call something on iterator step with safe closing on error
var callWithSafeIterationClosing$1 = function (iterator, fn, value, ENTRIES) {
  try {
    return ENTRIES ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch (error) {
    var returnMethod = iterator['return'];
    if (returnMethod !== undefined) anObject(returnMethod.call(iterator));
    throw error;
  }
};

var iterate_1$1 = createCommonjsModule(function (module) {
var Result = function (stopped, result) {
  this.stopped = stopped;
  this.result = result;
};

var iterate = module.exports = function (iterable, fn, that, AS_ENTRIES, IS_ITERATOR) {
  var boundFunction = functionBindContext(fn, that, AS_ENTRIES ? 2 : 1);
  var iterator, iterFn, index, length, result, next, step;

  if (IS_ITERATOR) {
    iterator = iterable;
  } else {
    iterFn = getIteratorMethod$1(iterable);
    if (typeof iterFn != 'function') throw TypeError('Target is not iterable');
    // optimisation for array iterators
    if (isArrayIteratorMethod$1(iterFn)) {
      for (index = 0, length = toLength(iterable.length); length > index; index++) {
        result = AS_ENTRIES
          ? boundFunction(anObject(step = iterable[index])[0], step[1])
          : boundFunction(iterable[index]);
        if (result && result instanceof Result) return result;
      } return new Result(false);
    }
    iterator = iterFn.call(iterable);
  }

  next = iterator.next;
  while (!(step = next.call(iterator)).done) {
    result = callWithSafeIterationClosing$1(iterator, boundFunction, step.value, AS_ENTRIES);
    if (typeof result == 'object' && result && result instanceof Result) return result;
  } return new Result(false);
};

iterate.stop = function (result) {
  return new Result(true, result);
};
});

var ITERATOR$a = wellKnownSymbol('iterator');
var SAFE_CLOSING$1 = false;

try {
  var called$1 = 0;
  var iteratorWithReturn$1 = {
    next: function () {
      return { done: !!called$1++ };
    },
    'return': function () {
      SAFE_CLOSING$1 = true;
    }
  };
  iteratorWithReturn$1[ITERATOR$a] = function () {
    return this;
  };
  // eslint-disable-next-line no-throw-literal
  Array.from(iteratorWithReturn$1, function () { throw 2; });
} catch (error) { /* empty */ }

var checkCorrectnessOfIteration$1 = function (exec, SKIP_CLOSING) {
  if (!SKIP_CLOSING && !SAFE_CLOSING$1) return false;
  var ITERATION_SUPPORT = false;
  try {
    var object = {};
    object[ITERATOR$a] = function () {
      return {
        next: function () {
          return { done: ITERATION_SUPPORT = true };
        }
      };
    };
    exec(object);
  } catch (error) { /* empty */ }
  return ITERATION_SUPPORT;
};

var SPECIES$7 = wellKnownSymbol('species');

// `SpeciesConstructor` abstract operation
// https://tc39.github.io/ecma262/#sec-speciesconstructor
var speciesConstructor$1 = function (O, defaultConstructor) {
  var C = anObject(O).constructor;
  var S;
  return C === undefined || (S = anObject(C)[SPECIES$7]) == undefined ? defaultConstructor : aFunction$1(S);
};

var engineIsIos = /(iphone|ipod|ipad).*applewebkit/i.test(engineUserAgent);

var location = global_1.location;
var set$2 = global_1.setImmediate;
var clear$1 = global_1.clearImmediate;
var process$3 = global_1.process;
var MessageChannel = global_1.MessageChannel;
var Dispatch = global_1.Dispatch;
var counter = 0;
var queue = {};
var ONREADYSTATECHANGE = 'onreadystatechange';
var defer, channel, port;

var run = function (id) {
  // eslint-disable-next-line no-prototype-builtins
  if (queue.hasOwnProperty(id)) {
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};

var runner = function (id) {
  return function () {
    run(id);
  };
};

var listener = function (event) {
  run(event.data);
};

var post = function (id) {
  // old engines have not location.origin
  global_1.postMessage(id + '', location.protocol + '//' + location.host);
};

// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if (!set$2 || !clear$1) {
  set$2 = function setImmediate(fn) {
    var args = [];
    var i = 1;
    while (arguments.length > i) args.push(arguments[i++]);
    queue[++counter] = function () {
      // eslint-disable-next-line no-new-func
      (typeof fn == 'function' ? fn : Function(fn)).apply(undefined, args);
    };
    defer(counter);
    return counter;
  };
  clear$1 = function clearImmediate(id) {
    delete queue[id];
  };
  // Node.js 0.8-
  if (classofRaw(process$3) == 'process') {
    defer = function (id) {
      process$3.nextTick(runner(id));
    };
  // Sphere (JS game engine) Dispatch API
  } else if (Dispatch && Dispatch.now) {
    defer = function (id) {
      Dispatch.now(runner(id));
    };
  // Browsers with MessageChannel, includes WebWorkers
  // except iOS - https://github.com/zloirock/core-js/issues/624
  } else if (MessageChannel && !engineIsIos) {
    channel = new MessageChannel();
    port = channel.port2;
    channel.port1.onmessage = listener;
    defer = functionBindContext(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if (global_1.addEventListener && typeof postMessage == 'function' && !global_1.importScripts && !fails(post)) {
    defer = post;
    global_1.addEventListener('message', listener, false);
  // IE8-
  } else if (ONREADYSTATECHANGE in documentCreateElement('script')) {
    defer = function (id) {
      html$1.appendChild(documentCreateElement('script'))[ONREADYSTATECHANGE] = function () {
        html$1.removeChild(this);
        run(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function (id) {
      setTimeout(runner(id), 0);
    };
  }
}

var task = {
  set: set$2,
  clear: clear$1
};

var getOwnPropertyDescriptor$4 = objectGetOwnPropertyDescriptor.f;

var macrotask = task.set;


var MutationObserver = global_1.MutationObserver || global_1.WebKitMutationObserver;
var process$4 = global_1.process;
var Promise$1 = global_1.Promise;
var IS_NODE = classofRaw(process$4) == 'process';
// Node.js 11 shows ExperimentalWarning on getting `queueMicrotask`
var queueMicrotaskDescriptor = getOwnPropertyDescriptor$4(global_1, 'queueMicrotask');
var queueMicrotask = queueMicrotaskDescriptor && queueMicrotaskDescriptor.value;

var flush, head, last, notify, toggle, node, promise, then;

// modern engines have queueMicrotask method
if (!queueMicrotask) {
  flush = function () {
    var parent, fn;
    if (IS_NODE && (parent = process$4.domain)) parent.exit();
    while (head) {
      fn = head.fn;
      head = head.next;
      try {
        fn();
      } catch (error) {
        if (head) notify();
        else last = undefined;
        throw error;
      }
    } last = undefined;
    if (parent) parent.enter();
  };

  // Node.js
  if (IS_NODE) {
    notify = function () {
      process$4.nextTick(flush);
    };
  // browsers with MutationObserver, except iOS - https://github.com/zloirock/core-js/issues/339
  } else if (MutationObserver && !engineIsIos) {
    toggle = true;
    node = document.createTextNode('');
    new MutationObserver(flush).observe(node, { characterData: true });
    notify = function () {
      node.data = toggle = !toggle;
    };
  // environments with maybe non-completely correct, but existent Promise
  } else if (Promise$1 && Promise$1.resolve) {
    // Promise.resolve without an argument throws an error in LG WebOS 2
    promise = Promise$1.resolve(undefined);
    then = promise.then;
    notify = function () {
      then.call(promise, flush);
    };
  // for other environments - macrotask based on:
  // - setImmediate
  // - MessageChannel
  // - window.postMessag
  // - onreadystatechange
  // - setTimeout
  } else {
    notify = function () {
      // strange IE + webpack dev server bug - use .call(global)
      macrotask.call(global_1, flush);
    };
  }
}

var microtask = queueMicrotask || function (fn) {
  var task = { fn: fn, next: undefined };
  if (last) last.next = task;
  if (!head) {
    head = task;
    notify();
  } last = task;
};

var PromiseCapability = function (C) {
  var resolve, reject;
  this.promise = new C(function ($$resolve, $$reject) {
    if (resolve !== undefined || reject !== undefined) throw TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject = $$reject;
  });
  this.resolve = aFunction$1(resolve);
  this.reject = aFunction$1(reject);
};

// 25.4.1.5 NewPromiseCapability(C)
var f$7 = function (C) {
  return new PromiseCapability(C);
};

var newPromiseCapability = {
	f: f$7
};

var promiseResolve = function (C, x) {
  anObject(C);
  if (isObject(x) && x.constructor === C) return x;
  var promiseCapability = newPromiseCapability.f(C);
  var resolve = promiseCapability.resolve;
  resolve(x);
  return promiseCapability.promise;
};

var hostReportErrors = function (a, b) {
  var console = global_1.console;
  if (console && console.error) {
    arguments.length === 1 ? console.error(a) : console.error(a, b);
  }
};

var perform = function (exec) {
  try {
    return { error: false, value: exec() };
  } catch (error) {
    return { error: true, value: error };
  }
};

var task$1 = task.set;










var SPECIES$8 = wellKnownSymbol('species');
var PROMISE = 'Promise';
var getInternalState$4 = internalState.get;
var setInternalState$5 = internalState.set;
var getInternalPromiseState = internalState.getterFor(PROMISE);
var PromiseConstructor = nativePromiseConstructor;
var TypeError$1 = global_1.TypeError;
var document$2 = global_1.document;
var process$5 = global_1.process;
var $fetch = getBuiltIn('fetch');
var newPromiseCapability$1 = newPromiseCapability.f;
var newGenericPromiseCapability = newPromiseCapability$1;
var IS_NODE$1 = classofRaw(process$5) == 'process';
var DISPATCH_EVENT = !!(document$2 && document$2.createEvent && global_1.dispatchEvent);
var UNHANDLED_REJECTION = 'unhandledrejection';
var REJECTION_HANDLED = 'rejectionhandled';
var PENDING = 0;
var FULFILLED = 1;
var REJECTED = 2;
var HANDLED = 1;
var UNHANDLED = 2;
var Internal, OwnPromiseCapability, PromiseWrapper, nativeThen;

var FORCED$6 = isForced_1(PROMISE, function () {
  var GLOBAL_CORE_JS_PROMISE = inspectSource(PromiseConstructor) !== String(PromiseConstructor);
  if (!GLOBAL_CORE_JS_PROMISE) {
    // V8 6.6 (Node 10 and Chrome 66) have a bug with resolving custom thenables
    // https://bugs.chromium.org/p/chromium/issues/detail?id=830565
    // We can't detect it synchronously, so just check versions
    if (engineV8Version === 66) return true;
    // Unhandled rejections tracking support, NodeJS Promise without it fails @@species test
    if (!IS_NODE$1 && typeof PromiseRejectionEvent != 'function') return true;
  }
  // We can't use @@species feature detection in V8 since it causes
  // deoptimization and performance degradation
  // https://github.com/zloirock/core-js/issues/679
  if (engineV8Version >= 51 && /native code/.test(PromiseConstructor)) return false;
  // Detect correctness of subclassing with @@species support
  var promise = PromiseConstructor.resolve(1);
  var FakePromise = function (exec) {
    exec(function () { /* empty */ }, function () { /* empty */ });
  };
  var constructor = promise.constructor = {};
  constructor[SPECIES$8] = FakePromise;
  return !(promise.then(function () { /* empty */ }) instanceof FakePromise);
});

var INCORRECT_ITERATION = FORCED$6 || !checkCorrectnessOfIteration$1(function (iterable) {
  PromiseConstructor.all(iterable)['catch'](function () { /* empty */ });
});

// helpers
var isThenable = function (it) {
  var then;
  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
};

var notify$1 = function (promise, state, isReject) {
  if (state.notified) return;
  state.notified = true;
  var chain = state.reactions;
  microtask(function () {
    var value = state.value;
    var ok = state.state == FULFILLED;
    var index = 0;
    // variable length - can't use forEach
    while (chain.length > index) {
      var reaction = chain[index++];
      var handler = ok ? reaction.ok : reaction.fail;
      var resolve = reaction.resolve;
      var reject = reaction.reject;
      var domain = reaction.domain;
      var result, then, exited;
      try {
        if (handler) {
          if (!ok) {
            if (state.rejection === UNHANDLED) onHandleUnhandled(promise, state);
            state.rejection = HANDLED;
          }
          if (handler === true) result = value;
          else {
            if (domain) domain.enter();
            result = handler(value); // can throw
            if (domain) {
              domain.exit();
              exited = true;
            }
          }
          if (result === reaction.promise) {
            reject(TypeError$1('Promise-chain cycle'));
          } else if (then = isThenable(result)) {
            then.call(result, resolve, reject);
          } else resolve(result);
        } else reject(value);
      } catch (error) {
        if (domain && !exited) domain.exit();
        reject(error);
      }
    }
    state.reactions = [];
    state.notified = false;
    if (isReject && !state.rejection) onUnhandled(promise, state);
  });
};

var dispatchEvent = function (name, promise, reason) {
  var event, handler;
  if (DISPATCH_EVENT) {
    event = document$2.createEvent('Event');
    event.promise = promise;
    event.reason = reason;
    event.initEvent(name, false, true);
    global_1.dispatchEvent(event);
  } else event = { promise: promise, reason: reason };
  if (handler = global_1['on' + name]) handler(event);
  else if (name === UNHANDLED_REJECTION) hostReportErrors('Unhandled promise rejection', reason);
};

var onUnhandled = function (promise, state) {
  task$1.call(global_1, function () {
    var value = state.value;
    var IS_UNHANDLED = isUnhandled(state);
    var result;
    if (IS_UNHANDLED) {
      result = perform(function () {
        if (IS_NODE$1) {
          process$5.emit('unhandledRejection', value, promise);
        } else dispatchEvent(UNHANDLED_REJECTION, promise, value);
      });
      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
      state.rejection = IS_NODE$1 || isUnhandled(state) ? UNHANDLED : HANDLED;
      if (result.error) throw result.value;
    }
  });
};

var isUnhandled = function (state) {
  return state.rejection !== HANDLED && !state.parent;
};

var onHandleUnhandled = function (promise, state) {
  task$1.call(global_1, function () {
    if (IS_NODE$1) {
      process$5.emit('rejectionHandled', promise);
    } else dispatchEvent(REJECTION_HANDLED, promise, state.value);
  });
};

var bind = function (fn, promise, state, unwrap) {
  return function (value) {
    fn(promise, state, value, unwrap);
  };
};

var internalReject = function (promise, state, value, unwrap) {
  if (state.done) return;
  state.done = true;
  if (unwrap) state = unwrap;
  state.value = value;
  state.state = REJECTED;
  notify$1(promise, state, true);
};

var internalResolve = function (promise, state, value, unwrap) {
  if (state.done) return;
  state.done = true;
  if (unwrap) state = unwrap;
  try {
    if (promise === value) throw TypeError$1("Promise can't be resolved itself");
    var then = isThenable(value);
    if (then) {
      microtask(function () {
        var wrapper = { done: false };
        try {
          then.call(value,
            bind(internalResolve, promise, wrapper, state),
            bind(internalReject, promise, wrapper, state)
          );
        } catch (error) {
          internalReject(promise, wrapper, error, state);
        }
      });
    } else {
      state.value = value;
      state.state = FULFILLED;
      notify$1(promise, state, false);
    }
  } catch (error) {
    internalReject(promise, { done: false }, error, state);
  }
};

// constructor polyfill
if (FORCED$6) {
  // 25.4.3.1 Promise(executor)
  PromiseConstructor = function Promise(executor) {
    anInstance$1(this, PromiseConstructor, PROMISE);
    aFunction$1(executor);
    Internal.call(this);
    var state = getInternalState$4(this);
    try {
      executor(bind(internalResolve, this, state), bind(internalReject, this, state));
    } catch (error) {
      internalReject(this, state, error);
    }
  };
  // eslint-disable-next-line no-unused-vars
  Internal = function Promise(executor) {
    setInternalState$5(this, {
      type: PROMISE,
      done: false,
      notified: false,
      parent: false,
      reactions: [],
      rejection: false,
      state: PENDING,
      value: undefined
    });
  };
  Internal.prototype = redefineAll$1(PromiseConstructor.prototype, {
    // `Promise.prototype.then` method
    // https://tc39.github.io/ecma262/#sec-promise.prototype.then
    then: function then(onFulfilled, onRejected) {
      var state = getInternalPromiseState(this);
      var reaction = newPromiseCapability$1(speciesConstructor$1(this, PromiseConstructor));
      reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;
      reaction.fail = typeof onRejected == 'function' && onRejected;
      reaction.domain = IS_NODE$1 ? process$5.domain : undefined;
      state.parent = true;
      state.reactions.push(reaction);
      if (state.state != PENDING) notify$1(this, state, false);
      return reaction.promise;
    },
    // `Promise.prototype.catch` method
    // https://tc39.github.io/ecma262/#sec-promise.prototype.catch
    'catch': function (onRejected) {
      return this.then(undefined, onRejected);
    }
  });
  OwnPromiseCapability = function () {
    var promise = new Internal();
    var state = getInternalState$4(promise);
    this.promise = promise;
    this.resolve = bind(internalResolve, promise, state);
    this.reject = bind(internalReject, promise, state);
  };
  newPromiseCapability.f = newPromiseCapability$1 = function (C) {
    return C === PromiseConstructor || C === PromiseWrapper
      ? new OwnPromiseCapability(C)
      : newGenericPromiseCapability(C);
  };

  if ( typeof nativePromiseConstructor == 'function') {
    nativeThen = nativePromiseConstructor.prototype.then;

    // wrap native Promise#then for native async functions
    redefine(nativePromiseConstructor.prototype, 'then', function then(onFulfilled, onRejected) {
      var that = this;
      return new PromiseConstructor(function (resolve, reject) {
        nativeThen.call(that, resolve, reject);
      }).then(onFulfilled, onRejected);
    // https://github.com/zloirock/core-js/issues/640
    }, { unsafe: true });

    // wrap fetch result
    if (typeof $fetch == 'function') _export({ global: true, enumerable: true, forced: true }, {
      // eslint-disable-next-line no-unused-vars
      fetch: function fetch(input /* , init */) {
        return promiseResolve(PromiseConstructor, $fetch.apply(global_1, arguments));
      }
    });
  }
}

_export({ global: true, wrap: true, forced: FORCED$6 }, {
  Promise: PromiseConstructor
});

setToStringTag$1(PromiseConstructor, PROMISE, false);
setSpecies$1(PROMISE);

PromiseWrapper = getBuiltIn(PROMISE);

// statics
_export({ target: PROMISE, stat: true, forced: FORCED$6 }, {
  // `Promise.reject` method
  // https://tc39.github.io/ecma262/#sec-promise.reject
  reject: function reject(r) {
    var capability = newPromiseCapability$1(this);
    capability.reject.call(undefined, r);
    return capability.promise;
  }
});

_export({ target: PROMISE, stat: true, forced:  FORCED$6 }, {
  // `Promise.resolve` method
  // https://tc39.github.io/ecma262/#sec-promise.resolve
  resolve: function resolve(x) {
    return promiseResolve( this, x);
  }
});

_export({ target: PROMISE, stat: true, forced: INCORRECT_ITERATION }, {
  // `Promise.all` method
  // https://tc39.github.io/ecma262/#sec-promise.all
  all: function all(iterable) {
    var C = this;
    var capability = newPromiseCapability$1(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var $promiseResolve = aFunction$1(C.resolve);
      var values = [];
      var counter = 0;
      var remaining = 1;
      iterate_1$1(iterable, function (promise) {
        var index = counter++;
        var alreadyCalled = false;
        values.push(undefined);
        remaining++;
        $promiseResolve.call(C, promise).then(function (value) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[index] = value;
          --remaining || resolve(values);
        }, reject);
      });
      --remaining || resolve(values);
    });
    if (result.error) reject(result.value);
    return capability.promise;
  },
  // `Promise.race` method
  // https://tc39.github.io/ecma262/#sec-promise.race
  race: function race(iterable) {
    var C = this;
    var capability = newPromiseCapability$1(C);
    var reject = capability.reject;
    var result = perform(function () {
      var $promiseResolve = aFunction$1(C.resolve);
      iterate_1$1(iterable, function (promise) {
        $promiseResolve.call(C, promise).then(capability.resolve, reject);
      });
    });
    if (result.error) reject(result.value);
    return capability.promise;
  }
});

var freezing$1 = !fails(function () {
  return Object.isExtensible(Object.preventExtensions({}));
});

var internalMetadata$1 = createCommonjsModule(function (module) {
var defineProperty = objectDefineProperty.f;



var METADATA = uid('meta');
var id = 0;

var isExtensible = Object.isExtensible || function () {
  return true;
};

var setMetadata = function (it) {
  defineProperty(it, METADATA, { value: {
    objectID: 'O' + ++id, // object ID
    weakData: {}          // weak collections IDs
  } });
};

var fastKey = function (it, create) {
  // return a primitive with prefix
  if (!isObject(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if (!has(it, METADATA)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return 'F';
    // not necessary to add metadata
    if (!create) return 'E';
    // add missing metadata
    setMetadata(it);
  // return object ID
  } return it[METADATA].objectID;
};

var getWeakData = function (it, create) {
  if (!has(it, METADATA)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return true;
    // not necessary to add metadata
    if (!create) return false;
    // add missing metadata
    setMetadata(it);
  // return the store of weak collections IDs
  } return it[METADATA].weakData;
};

// add metadata on freeze-family methods calling
var onFreeze = function (it) {
  if (freezing$1 && meta.REQUIRED && isExtensible(it) && !has(it, METADATA)) setMetadata(it);
  return it;
};

var meta = module.exports = {
  REQUIRED: false,
  fastKey: fastKey,
  getWeakData: getWeakData,
  onFreeze: onFreeze
};

hiddenKeys[METADATA] = true;
});
var internalMetadata_1 = internalMetadata$1.REQUIRED;
var internalMetadata_2 = internalMetadata$1.fastKey;
var internalMetadata_3 = internalMetadata$1.getWeakData;
var internalMetadata_4 = internalMetadata$1.onFreeze;

var collection$1 = function (CONSTRUCTOR_NAME, wrapper, common) {
  var IS_MAP = CONSTRUCTOR_NAME.indexOf('Map') !== -1;
  var IS_WEAK = CONSTRUCTOR_NAME.indexOf('Weak') !== -1;
  var ADDER = IS_MAP ? 'set' : 'add';
  var NativeConstructor = global_1[CONSTRUCTOR_NAME];
  var NativePrototype = NativeConstructor && NativeConstructor.prototype;
  var Constructor = NativeConstructor;
  var exported = {};

  var fixMethod = function (KEY) {
    var nativeMethod = NativePrototype[KEY];
    redefine(NativePrototype, KEY,
      KEY == 'add' ? function add(value) {
        nativeMethod.call(this, value === 0 ? 0 : value);
        return this;
      } : KEY == 'delete' ? function (key) {
        return IS_WEAK && !isObject(key) ? false : nativeMethod.call(this, key === 0 ? 0 : key);
      } : KEY == 'get' ? function get(key) {
        return IS_WEAK && !isObject(key) ? undefined : nativeMethod.call(this, key === 0 ? 0 : key);
      } : KEY == 'has' ? function has(key) {
        return IS_WEAK && !isObject(key) ? false : nativeMethod.call(this, key === 0 ? 0 : key);
      } : function set(key, value) {
        nativeMethod.call(this, key === 0 ? 0 : key, value);
        return this;
      }
    );
  };

  // eslint-disable-next-line max-len
  if (isForced_1(CONSTRUCTOR_NAME, typeof NativeConstructor != 'function' || !(IS_WEAK || NativePrototype.forEach && !fails(function () {
    new NativeConstructor().entries().next();
  })))) {
    // create collection constructor
    Constructor = common.getConstructor(wrapper, CONSTRUCTOR_NAME, IS_MAP, ADDER);
    internalMetadata$1.REQUIRED = true;
  } else if (isForced_1(CONSTRUCTOR_NAME, true)) {
    var instance = new Constructor();
    // early implementations not supports chaining
    var HASNT_CHAINING = instance[ADDER](IS_WEAK ? {} : -0, 1) != instance;
    // V8 ~ Chromium 40- weak-collections throws on primitives, but should return false
    var THROWS_ON_PRIMITIVES = fails(function () { instance.has(1); });
    // most early implementations doesn't supports iterables, most modern - not close it correctly
    // eslint-disable-next-line no-new
    var ACCEPT_ITERABLES = checkCorrectnessOfIteration$1(function (iterable) { new NativeConstructor(iterable); });
    // for early implementations -0 and +0 not the same
    var BUGGY_ZERO = !IS_WEAK && fails(function () {
      // V8 ~ Chromium 42- fails only with 5+ elements
      var $instance = new NativeConstructor();
      var index = 5;
      while (index--) $instance[ADDER](index, index);
      return !$instance.has(-0);
    });

    if (!ACCEPT_ITERABLES) {
      Constructor = wrapper(function (dummy, iterable) {
        anInstance$1(dummy, Constructor, CONSTRUCTOR_NAME);
        var that = inheritIfRequired$1(new NativeConstructor(), dummy, Constructor);
        if (iterable != undefined) iterate_1$1(iterable, that[ADDER], that, IS_MAP);
        return that;
      });
      Constructor.prototype = NativePrototype;
      NativePrototype.constructor = Constructor;
    }

    if (THROWS_ON_PRIMITIVES || BUGGY_ZERO) {
      fixMethod('delete');
      fixMethod('has');
      IS_MAP && fixMethod('get');
    }

    if (BUGGY_ZERO || HASNT_CHAINING) fixMethod(ADDER);

    // weak collections should not contains .clear method
    if (IS_WEAK && NativePrototype.clear) delete NativePrototype.clear;
  }

  exported[CONSTRUCTOR_NAME] = Constructor;
  _export({ global: true, forced: Constructor != NativeConstructor }, exported);

  setToStringTag$1(Constructor, CONSTRUCTOR_NAME);

  if (!IS_WEAK) common.setStrong(Constructor, CONSTRUCTOR_NAME, IS_MAP);

  return Constructor;
};

var defineProperty$8 = objectDefineProperty.f;








var fastKey$1 = internalMetadata$1.fastKey;


var setInternalState$6 = internalState.set;
var internalStateGetterFor$1 = internalState.getterFor;

var collectionStrong$1 = {
  getConstructor: function (wrapper, CONSTRUCTOR_NAME, IS_MAP, ADDER) {
    var C = wrapper(function (that, iterable) {
      anInstance$1(that, C, CONSTRUCTOR_NAME);
      setInternalState$6(that, {
        type: CONSTRUCTOR_NAME,
        index: objectCreate$1(null),
        first: undefined,
        last: undefined,
        size: 0
      });
      if (!descriptors) that.size = 0;
      if (iterable != undefined) iterate_1$1(iterable, that[ADDER], that, IS_MAP);
    });

    var getInternalState = internalStateGetterFor$1(CONSTRUCTOR_NAME);

    var define = function (that, key, value) {
      var state = getInternalState(that);
      var entry = getEntry(that, key);
      var previous, index;
      // change existing entry
      if (entry) {
        entry.value = value;
      // create new entry
      } else {
        state.last = entry = {
          index: index = fastKey$1(key, true),
          key: key,
          value: value,
          previous: previous = state.last,
          next: undefined,
          removed: false
        };
        if (!state.first) state.first = entry;
        if (previous) previous.next = entry;
        if (descriptors) state.size++;
        else that.size++;
        // add to index
        if (index !== 'F') state.index[index] = entry;
      } return that;
    };

    var getEntry = function (that, key) {
      var state = getInternalState(that);
      // fast case
      var index = fastKey$1(key);
      var entry;
      if (index !== 'F') return state.index[index];
      // frozen object case
      for (entry = state.first; entry; entry = entry.next) {
        if (entry.key == key) return entry;
      }
    };

    redefineAll$1(C.prototype, {
      // 23.1.3.1 Map.prototype.clear()
      // 23.2.3.2 Set.prototype.clear()
      clear: function clear() {
        var that = this;
        var state = getInternalState(that);
        var data = state.index;
        var entry = state.first;
        while (entry) {
          entry.removed = true;
          if (entry.previous) entry.previous = entry.previous.next = undefined;
          delete data[entry.index];
          entry = entry.next;
        }
        state.first = state.last = undefined;
        if (descriptors) state.size = 0;
        else that.size = 0;
      },
      // 23.1.3.3 Map.prototype.delete(key)
      // 23.2.3.4 Set.prototype.delete(value)
      'delete': function (key) {
        var that = this;
        var state = getInternalState(that);
        var entry = getEntry(that, key);
        if (entry) {
          var next = entry.next;
          var prev = entry.previous;
          delete state.index[entry.index];
          entry.removed = true;
          if (prev) prev.next = next;
          if (next) next.previous = prev;
          if (state.first == entry) state.first = next;
          if (state.last == entry) state.last = prev;
          if (descriptors) state.size--;
          else that.size--;
        } return !!entry;
      },
      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
      forEach: function forEach(callbackfn /* , that = undefined */) {
        var state = getInternalState(this);
        var boundFunction = functionBindContext(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3);
        var entry;
        while (entry = entry ? entry.next : state.first) {
          boundFunction(entry.value, entry.key, this);
          // revert to the last existing entry
          while (entry && entry.removed) entry = entry.previous;
        }
      },
      // 23.1.3.7 Map.prototype.has(key)
      // 23.2.3.7 Set.prototype.has(value)
      has: function has(key) {
        return !!getEntry(this, key);
      }
    });

    redefineAll$1(C.prototype, IS_MAP ? {
      // 23.1.3.6 Map.prototype.get(key)
      get: function get(key) {
        var entry = getEntry(this, key);
        return entry && entry.value;
      },
      // 23.1.3.9 Map.prototype.set(key, value)
      set: function set(key, value) {
        return define(this, key === 0 ? 0 : key, value);
      }
    } : {
      // 23.2.3.1 Set.prototype.add(value)
      add: function add(value) {
        return define(this, value = value === 0 ? 0 : value, value);
      }
    });
    if (descriptors) defineProperty$8(C.prototype, 'size', {
      get: function () {
        return getInternalState(this).size;
      }
    });
    return C;
  },
  setStrong: function (C, CONSTRUCTOR_NAME, IS_MAP) {
    var ITERATOR_NAME = CONSTRUCTOR_NAME + ' Iterator';
    var getInternalCollectionState = internalStateGetterFor$1(CONSTRUCTOR_NAME);
    var getInternalIteratorState = internalStateGetterFor$1(ITERATOR_NAME);
    // add .keys, .values, .entries, [@@iterator]
    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
    defineIterator$1(C, CONSTRUCTOR_NAME, function (iterated, kind) {
      setInternalState$6(this, {
        type: ITERATOR_NAME,
        target: iterated,
        state: getInternalCollectionState(iterated),
        kind: kind,
        last: undefined
      });
    }, function () {
      var state = getInternalIteratorState(this);
      var kind = state.kind;
      var entry = state.last;
      // revert to the last existing entry
      while (entry && entry.removed) entry = entry.previous;
      // get next entry
      if (!state.target || !(state.last = entry = entry ? entry.next : state.state.first)) {
        // or finish the iteration
        state.target = undefined;
        return { value: undefined, done: true };
      }
      // return step by kind
      if (kind == 'keys') return { value: entry.key, done: false };
      if (kind == 'values') return { value: entry.value, done: false };
      return { value: [entry.key, entry.value], done: false };
    }, IS_MAP ? 'entries' : 'values', !IS_MAP, true);

    // add [@@species], 23.1.2.2, 23.2.2.2
    setSpecies$1(CONSTRUCTOR_NAME);
  }
};

// `Set` constructor
// https://tc39.github.io/ecma262/#sec-set-objects
var es_set$1 = collection$1('Set', function (init) {
  return function Set() { return init(this, arguments.length ? arguments[0] : undefined); };
}, collectionStrong$1);

var MATCH$2 = wellKnownSymbol('match');

// `IsRegExp` abstract operation
// https://tc39.github.io/ecma262/#sec-isregexp
var isRegexp$1 = function (it) {
  var isRegExp;
  return isObject(it) && ((isRegExp = it[MATCH$2]) !== undefined ? !!isRegExp : classofRaw(it) == 'RegExp');
};

var notARegexp$1 = function (it) {
  if (isRegexp$1(it)) {
    throw TypeError("The method doesn't accept regular expressions");
  } return it;
};

var MATCH$3 = wellKnownSymbol('match');

var correctIsRegexpLogic$1 = function (METHOD_NAME) {
  var regexp = /./;
  try {
    '/./'[METHOD_NAME](regexp);
  } catch (e) {
    try {
      regexp[MATCH$3] = false;
      return '/./'[METHOD_NAME](regexp);
    } catch (f) { /* empty */ }
  } return false;
};

// `String.prototype.includes` method
// https://tc39.github.io/ecma262/#sec-string.prototype.includes
_export({ target: 'String', proto: true, forced: !correctIsRegexpLogic$1('includes') }, {
  includes: function includes(searchString /* , position = 0 */) {
    return !!~String(requireObjectCoercible(this))
      .indexOf(notARegexp$1(searchString), arguments.length > 1 ? arguments[1] : undefined);
  }
});

// `String.prototype.{ codePointAt, at }` methods implementation
var createMethod$6 = function (CONVERT_TO_STRING) {
  return function ($this, pos) {
    var S = String(requireObjectCoercible($this));
    var position = toInteger(pos);
    var size = S.length;
    var first, second;
    if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
    first = S.charCodeAt(position);
    return first < 0xD800 || first > 0xDBFF || position + 1 === size
      || (second = S.charCodeAt(position + 1)) < 0xDC00 || second > 0xDFFF
        ? CONVERT_TO_STRING ? S.charAt(position) : first
        : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
  };
};

var stringMultibyte$1 = {
  // `String.prototype.codePointAt` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.codepointat
  codeAt: createMethod$6(false),
  // `String.prototype.at` method
  // https://github.com/mathiasbynens/String.prototype.at
  charAt: createMethod$6(true)
};

var charAt$2 = stringMultibyte$1.charAt;



var STRING_ITERATOR$1 = 'String Iterator';
var setInternalState$7 = internalState.set;
var getInternalState$5 = internalState.getterFor(STRING_ITERATOR$1);

// `String.prototype[@@iterator]` method
// https://tc39.github.io/ecma262/#sec-string.prototype-@@iterator
defineIterator$1(String, 'String', function (iterated) {
  setInternalState$7(this, {
    type: STRING_ITERATOR$1,
    string: String(iterated),
    index: 0
  });
// `%StringIteratorPrototype%.next` method
// https://tc39.github.io/ecma262/#sec-%stringiteratorprototype%.next
}, function next() {
  var state = getInternalState$5(this);
  var string = state.string;
  var index = state.index;
  var point;
  if (index >= string.length) return { value: undefined, done: true };
  point = charAt$2(string, index);
  state.index += point.length;
  return { value: point, done: false };
});

var ITERATOR$b = wellKnownSymbol('iterator');
var TO_STRING_TAG$7 = wellKnownSymbol('toStringTag');
var ArrayValues$1 = es_array_iterator$1.values;

for (var COLLECTION_NAME$2 in domIterables) {
  var Collection$2 = global_1[COLLECTION_NAME$2];
  var CollectionPrototype$2 = Collection$2 && Collection$2.prototype;
  if (CollectionPrototype$2) {
    // some Chrome versions have non-configurable methods on DOMTokenList
    if (CollectionPrototype$2[ITERATOR$b] !== ArrayValues$1) try {
      createNonEnumerableProperty(CollectionPrototype$2, ITERATOR$b, ArrayValues$1);
    } catch (error) {
      CollectionPrototype$2[ITERATOR$b] = ArrayValues$1;
    }
    if (!CollectionPrototype$2[TO_STRING_TAG$7]) {
      createNonEnumerableProperty(CollectionPrototype$2, TO_STRING_TAG$7, COLLECTION_NAME$2);
    }
    if (domIterables[COLLECTION_NAME$2]) for (var METHOD_NAME$1 in es_array_iterator$1) {
      // some Chrome versions have non-configurable methods on DOMTokenList
      if (CollectionPrototype$2[METHOD_NAME$1] !== es_array_iterator$1[METHOD_NAME$1]) try {
        createNonEnumerableProperty(CollectionPrototype$2, METHOD_NAME$1, es_array_iterator$1[METHOD_NAME$1]);
      } catch (error) {
        CollectionPrototype$2[METHOD_NAME$1] = es_array_iterator$1[METHOD_NAME$1];
      }
    }
  }
}

var nativeGetOwnPropertyNames$3 = objectGetOwnPropertyNames.f;

var toString$2 = {}.toString;

var windowNames$1 = typeof window == 'object' && window && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames$1 = function (it) {
  try {
    return nativeGetOwnPropertyNames$3(it);
  } catch (error) {
    return windowNames$1.slice();
  }
};

// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
var f$8 = function getOwnPropertyNames(it) {
  return windowNames$1 && toString$2.call(it) == '[object Window]'
    ? getWindowNames$1(it)
    : nativeGetOwnPropertyNames$3(toIndexedObject(it));
};

var objectGetOwnPropertyNamesExternal$1 = {
	f: f$8
};

var f$9 = wellKnownSymbol;

var wellKnownSymbolWrapped = {
	f: f$9
};

var defineProperty$9 = objectDefineProperty.f;

var defineWellKnownSymbol$1 = function (NAME) {
  var Symbol = path.Symbol || (path.Symbol = {});
  if (!has(Symbol, NAME)) defineProperty$9(Symbol, NAME, {
    value: wellKnownSymbolWrapped.f(NAME)
  });
};

var $forEach$2 = arrayIteration.forEach;

var HIDDEN$1 = sharedKey('hidden');
var SYMBOL$1 = 'Symbol';
var PROTOTYPE$3 = 'prototype';
var TO_PRIMITIVE$1 = wellKnownSymbol('toPrimitive');
var setInternalState$8 = internalState.set;
var getInternalState$6 = internalState.getterFor(SYMBOL$1);
var ObjectPrototype$4 = Object[PROTOTYPE$3];
var $Symbol$1 = global_1.Symbol;
var $stringify = getBuiltIn('JSON', 'stringify');
var nativeGetOwnPropertyDescriptor$3 = objectGetOwnPropertyDescriptor.f;
var nativeDefineProperty$2 = objectDefineProperty.f;
var nativeGetOwnPropertyNames$4 = objectGetOwnPropertyNamesExternal$1.f;
var nativePropertyIsEnumerable$2 = objectPropertyIsEnumerable.f;
var AllSymbols$1 = shared('symbols');
var ObjectPrototypeSymbols$1 = shared('op-symbols');
var StringToSymbolRegistry$1 = shared('string-to-symbol-registry');
var SymbolToStringRegistry$1 = shared('symbol-to-string-registry');
var WellKnownSymbolsStore$2 = shared('wks');
var QObject$1 = global_1.QObject;
// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
var USE_SETTER$1 = !QObject$1 || !QObject$1[PROTOTYPE$3] || !QObject$1[PROTOTYPE$3].findChild;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDescriptor$1 = descriptors && fails(function () {
  return objectCreate$1(nativeDefineProperty$2({}, 'a', {
    get: function () { return nativeDefineProperty$2(this, 'a', { value: 7 }).a; }
  })).a != 7;
}) ? function (O, P, Attributes) {
  var ObjectPrototypeDescriptor = nativeGetOwnPropertyDescriptor$3(ObjectPrototype$4, P);
  if (ObjectPrototypeDescriptor) delete ObjectPrototype$4[P];
  nativeDefineProperty$2(O, P, Attributes);
  if (ObjectPrototypeDescriptor && O !== ObjectPrototype$4) {
    nativeDefineProperty$2(ObjectPrototype$4, P, ObjectPrototypeDescriptor);
  }
} : nativeDefineProperty$2;

var wrap$1 = function (tag, description) {
  var symbol = AllSymbols$1[tag] = objectCreate$1($Symbol$1[PROTOTYPE$3]);
  setInternalState$8(symbol, {
    type: SYMBOL$1,
    tag: tag,
    description: description
  });
  if (!descriptors) symbol.description = description;
  return symbol;
};

var isSymbol$1 = useSymbolAsUid ? function (it) {
  return typeof it == 'symbol';
} : function (it) {
  return Object(it) instanceof $Symbol$1;
};

var $defineProperty$1 = function defineProperty(O, P, Attributes) {
  if (O === ObjectPrototype$4) $defineProperty$1(ObjectPrototypeSymbols$1, P, Attributes);
  anObject(O);
  var key = toPrimitive(P, true);
  anObject(Attributes);
  if (has(AllSymbols$1, key)) {
    if (!Attributes.enumerable) {
      if (!has(O, HIDDEN$1)) nativeDefineProperty$2(O, HIDDEN$1, createPropertyDescriptor(1, {}));
      O[HIDDEN$1][key] = true;
    } else {
      if (has(O, HIDDEN$1) && O[HIDDEN$1][key]) O[HIDDEN$1][key] = false;
      Attributes = objectCreate$1(Attributes, { enumerable: createPropertyDescriptor(0, false) });
    } return setSymbolDescriptor$1(O, key, Attributes);
  } return nativeDefineProperty$2(O, key, Attributes);
};

var $defineProperties$1 = function defineProperties(O, Properties) {
  anObject(O);
  var properties = toIndexedObject(Properties);
  var keys = objectKeys$1(properties).concat($getOwnPropertySymbols$1(properties));
  $forEach$2(keys, function (key) {
    if (!descriptors || $propertyIsEnumerable$1.call(properties, key)) $defineProperty$1(O, key, properties[key]);
  });
  return O;
};

var $create$1 = function create(O, Properties) {
  return Properties === undefined ? objectCreate$1(O) : $defineProperties$1(objectCreate$1(O), Properties);
};

var $propertyIsEnumerable$1 = function propertyIsEnumerable(V) {
  var P = toPrimitive(V, true);
  var enumerable = nativePropertyIsEnumerable$2.call(this, P);
  if (this === ObjectPrototype$4 && has(AllSymbols$1, P) && !has(ObjectPrototypeSymbols$1, P)) return false;
  return enumerable || !has(this, P) || !has(AllSymbols$1, P) || has(this, HIDDEN$1) && this[HIDDEN$1][P] ? enumerable : true;
};

var $getOwnPropertyDescriptor$1 = function getOwnPropertyDescriptor(O, P) {
  var it = toIndexedObject(O);
  var key = toPrimitive(P, true);
  if (it === ObjectPrototype$4 && has(AllSymbols$1, key) && !has(ObjectPrototypeSymbols$1, key)) return;
  var descriptor = nativeGetOwnPropertyDescriptor$3(it, key);
  if (descriptor && has(AllSymbols$1, key) && !(has(it, HIDDEN$1) && it[HIDDEN$1][key])) {
    descriptor.enumerable = true;
  }
  return descriptor;
};

var $getOwnPropertyNames$1 = function getOwnPropertyNames(O) {
  var names = nativeGetOwnPropertyNames$4(toIndexedObject(O));
  var result = [];
  $forEach$2(names, function (key) {
    if (!has(AllSymbols$1, key) && !has(hiddenKeys, key)) result.push(key);
  });
  return result;
};

var $getOwnPropertySymbols$1 = function getOwnPropertySymbols(O) {
  var IS_OBJECT_PROTOTYPE = O === ObjectPrototype$4;
  var names = nativeGetOwnPropertyNames$4(IS_OBJECT_PROTOTYPE ? ObjectPrototypeSymbols$1 : toIndexedObject(O));
  var result = [];
  $forEach$2(names, function (key) {
    if (has(AllSymbols$1, key) && (!IS_OBJECT_PROTOTYPE || has(ObjectPrototype$4, key))) {
      result.push(AllSymbols$1[key]);
    }
  });
  return result;
};

// `Symbol` constructor
// https://tc39.github.io/ecma262/#sec-symbol-constructor
if (!nativeSymbol) {
  $Symbol$1 = function Symbol() {
    if (this instanceof $Symbol$1) throw TypeError('Symbol is not a constructor');
    var description = !arguments.length || arguments[0] === undefined ? undefined : String(arguments[0]);
    var tag = uid(description);
    var setter = function (value) {
      if (this === ObjectPrototype$4) setter.call(ObjectPrototypeSymbols$1, value);
      if (has(this, HIDDEN$1) && has(this[HIDDEN$1], tag)) this[HIDDEN$1][tag] = false;
      setSymbolDescriptor$1(this, tag, createPropertyDescriptor(1, value));
    };
    if (descriptors && USE_SETTER$1) setSymbolDescriptor$1(ObjectPrototype$4, tag, { configurable: true, set: setter });
    return wrap$1(tag, description);
  };

  redefine($Symbol$1[PROTOTYPE$3], 'toString', function toString() {
    return getInternalState$6(this).tag;
  });

  redefine($Symbol$1, 'withoutSetter', function (description) {
    return wrap$1(uid(description), description);
  });

  objectPropertyIsEnumerable.f = $propertyIsEnumerable$1;
  objectDefineProperty.f = $defineProperty$1;
  objectGetOwnPropertyDescriptor.f = $getOwnPropertyDescriptor$1;
  objectGetOwnPropertyNames.f = objectGetOwnPropertyNamesExternal$1.f = $getOwnPropertyNames$1;
  objectGetOwnPropertySymbols.f = $getOwnPropertySymbols$1;

  wellKnownSymbolWrapped.f = function (name) {
    return wrap$1(wellKnownSymbol(name), name);
  };

  if (descriptors) {
    // https://github.com/tc39/proposal-Symbol-description
    nativeDefineProperty$2($Symbol$1[PROTOTYPE$3], 'description', {
      configurable: true,
      get: function description() {
        return getInternalState$6(this).description;
      }
    });
    {
      redefine(ObjectPrototype$4, 'propertyIsEnumerable', $propertyIsEnumerable$1, { unsafe: true });
    }
  }
}

_export({ global: true, wrap: true, forced: !nativeSymbol, sham: !nativeSymbol }, {
  Symbol: $Symbol$1
});

$forEach$2(objectKeys$1(WellKnownSymbolsStore$2), function (name) {
  defineWellKnownSymbol$1(name);
});

_export({ target: SYMBOL$1, stat: true, forced: !nativeSymbol }, {
  // `Symbol.for` method
  // https://tc39.github.io/ecma262/#sec-symbol.for
  'for': function (key) {
    var string = String(key);
    if (has(StringToSymbolRegistry$1, string)) return StringToSymbolRegistry$1[string];
    var symbol = $Symbol$1(string);
    StringToSymbolRegistry$1[string] = symbol;
    SymbolToStringRegistry$1[symbol] = string;
    return symbol;
  },
  // `Symbol.keyFor` method
  // https://tc39.github.io/ecma262/#sec-symbol.keyfor
  keyFor: function keyFor(sym) {
    if (!isSymbol$1(sym)) throw TypeError(sym + ' is not a symbol');
    if (has(SymbolToStringRegistry$1, sym)) return SymbolToStringRegistry$1[sym];
  },
  useSetter: function () { USE_SETTER$1 = true; },
  useSimple: function () { USE_SETTER$1 = false; }
});

_export({ target: 'Object', stat: true, forced: !nativeSymbol, sham: !descriptors }, {
  // `Object.create` method
  // https://tc39.github.io/ecma262/#sec-object.create
  create: $create$1,
  // `Object.defineProperty` method
  // https://tc39.github.io/ecma262/#sec-object.defineproperty
  defineProperty: $defineProperty$1,
  // `Object.defineProperties` method
  // https://tc39.github.io/ecma262/#sec-object.defineproperties
  defineProperties: $defineProperties$1,
  // `Object.getOwnPropertyDescriptor` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptors
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor$1
});

_export({ target: 'Object', stat: true, forced: !nativeSymbol }, {
  // `Object.getOwnPropertyNames` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertynames
  getOwnPropertyNames: $getOwnPropertyNames$1,
  // `Object.getOwnPropertySymbols` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertysymbols
  getOwnPropertySymbols: $getOwnPropertySymbols$1
});

// Chrome 38 and 39 `Object.getOwnPropertySymbols` fails on primitives
// https://bugs.chromium.org/p/v8/issues/detail?id=3443
_export({ target: 'Object', stat: true, forced: fails(function () { objectGetOwnPropertySymbols.f(1); }) }, {
  getOwnPropertySymbols: function getOwnPropertySymbols(it) {
    return objectGetOwnPropertySymbols.f(toObject(it));
  }
});

// `JSON.stringify` method behavior with symbols
// https://tc39.github.io/ecma262/#sec-json.stringify
if ($stringify) {
  var FORCED_JSON_STRINGIFY = !nativeSymbol || fails(function () {
    var symbol = $Symbol$1();
    // MS Edge converts symbol values to JSON as {}
    return $stringify([symbol]) != '[null]'
      // WebKit converts symbol values to JSON as null
      || $stringify({ a: symbol }) != '{}'
      // V8 throws on boxed symbols
      || $stringify(Object(symbol)) != '{}';
  });

  _export({ target: 'JSON', stat: true, forced: FORCED_JSON_STRINGIFY }, {
    // eslint-disable-next-line no-unused-vars
    stringify: function stringify(it, replacer, space) {
      var args = [it];
      var index = 1;
      var $replacer;
      while (arguments.length > index) args.push(arguments[index++]);
      $replacer = replacer;
      if (!isObject(replacer) && it === undefined || isSymbol$1(it)) return; // IE8 returns string on undefined
      if (!isArray(replacer)) replacer = function (key, value) {
        if (typeof $replacer == 'function') value = $replacer.call(this, key, value);
        if (!isSymbol$1(value)) return value;
      };
      args[1] = replacer;
      return $stringify.apply(null, args);
    }
  });
}

// `Symbol.prototype[@@toPrimitive]` method
// https://tc39.github.io/ecma262/#sec-symbol.prototype-@@toprimitive
if (!$Symbol$1[PROTOTYPE$3][TO_PRIMITIVE$1]) {
  createNonEnumerableProperty($Symbol$1[PROTOTYPE$3], TO_PRIMITIVE$1, $Symbol$1[PROTOTYPE$3].valueOf);
}
// `Symbol.prototype[@@toStringTag]` property
// https://tc39.github.io/ecma262/#sec-symbol.prototype-@@tostringtag
setToStringTag$1($Symbol$1, SYMBOL$1);

hiddenKeys[HIDDEN$1] = true;

var defineProperty$a = objectDefineProperty.f;


var NativeSymbol$1 = global_1.Symbol;

if (descriptors && typeof NativeSymbol$1 == 'function' && (!('description' in NativeSymbol$1.prototype) ||
  // Safari 12 bug
  NativeSymbol$1().description !== undefined
)) {
  var EmptyStringDescriptionStore$1 = {};
  // wrap Symbol constructor for correct work with undefined description
  var SymbolWrapper$1 = function Symbol() {
    var description = arguments.length < 1 || arguments[0] === undefined ? undefined : String(arguments[0]);
    var result = this instanceof SymbolWrapper$1
      ? new NativeSymbol$1(description)
      // in Edge 13, String(Symbol(undefined)) === 'Symbol(undefined)'
      : description === undefined ? NativeSymbol$1() : NativeSymbol$1(description);
    if (description === '') EmptyStringDescriptionStore$1[result] = true;
    return result;
  };
  copyConstructorProperties(SymbolWrapper$1, NativeSymbol$1);
  var symbolPrototype$1 = SymbolWrapper$1.prototype = NativeSymbol$1.prototype;
  symbolPrototype$1.constructor = SymbolWrapper$1;

  var symbolToString$1 = symbolPrototype$1.toString;
  var native$1 = String(NativeSymbol$1('test')) == 'Symbol(test)';
  var regexp$1 = /^Symbol\((.*)\)[^)]+$/;
  defineProperty$a(symbolPrototype$1, 'description', {
    configurable: true,
    get: function description() {
      var symbol = isObject(this) ? this.valueOf() : this;
      var string = symbolToString$1.call(symbol);
      if (has(EmptyStringDescriptionStore$1, symbol)) return '';
      var desc = native$1 ? string.slice(7, -1) : string.replace(regexp$1, '$1');
      return desc === '' ? undefined : desc;
    }
  });

  _export({ global: true, forced: true }, {
    Symbol: SymbolWrapper$1
  });
}

var clamp = createCommonjsModule(function (module, exports) {
/*!
 * Clamp.js 0.7.0
 *
 * Copyright 2011-2013, Joseph Schmitt http://joe.sh
 * Released under the WTFPL license
 * http://sam.zoy.org/wtfpl/
 */

(function(root, factory) {
  {
    // Node, CommonJS-like
    module.exports = factory();
  }
}(commonjsGlobal, function() {
  /**
   * Clamps a text node.
   * @param {HTMLElement} element. Element containing the text node to clamp.
   * @param {Object} options. Options to pass to the clamper.
   */
  function clamp(element, options) {
    options = options || {};

    var win = window,
      opt = {
        clamp: options.clamp || 2,
        useNativeClamp: typeof(options.useNativeClamp) != 'undefined' ? options.useNativeClamp : true,
        splitOnChars: options.splitOnChars || ['.', '-', '–', '—', ' '], //Split on sentences (periods), hypens, en-dashes, em-dashes, and words (spaces).
        animate: options.animate || false,
        truncationChar: options.truncationChar || '…',
        truncationHTML: options.truncationHTML
      },

      sty = element.style,
      originalText = element.innerHTML,

      supportsNativeClamp = typeof(element.style.webkitLineClamp) != 'undefined',
      clampValue = opt.clamp,
      isCSSValue = clampValue.indexOf && (clampValue.indexOf('px') > -1 || clampValue.indexOf('em') > -1),
      truncationHTMLContainer;

    if (opt.truncationHTML) {
      truncationHTMLContainer = document.createElement('span');
      truncationHTMLContainer.innerHTML = opt.truncationHTML;
    }


    // UTILITY FUNCTIONS __________________________________________________________

    /**
     * Return the current style for an element.
     * @param {HTMLElement} elem The element to compute.
     * @param {string} prop The style property.
     * @returns {number}
     */
    function computeStyle(elem, prop) {
      if (!win.getComputedStyle) {
        win.getComputedStyle = function(el, pseudo) {
          this.el = el;
          this.getPropertyValue = function(prop) {
            var re = /(\-([a-z]){1})/g;
            if (prop == 'float') prop = 'styleFloat';
            if (re.test(prop)) {
              prop = prop.replace(re, function() {
                return arguments[2].toUpperCase();
              });
            }
            return el.currentStyle && el.currentStyle[prop] ? el.currentStyle[prop] : null;
          };
          return this;
        };
      }

      return win.getComputedStyle(elem, null).getPropertyValue(prop);
    }

    /**
     * Returns the maximum number of lines of text that should be rendered based
     * on the current height of the element and the line-height of the text.
     */
    function getMaxLines(height) {
      var availHeight = height || element.clientHeight,
        lineHeight = getLineHeight(element);

      return Math.max(Math.floor(availHeight / lineHeight), 0);
    }

    /**
     * Returns the maximum height a given element should have based on the line-
     * height of the text and the given clamp value.
     */
    function getMaxHeight(clmp) {
      var lineHeight = getLineHeight(element);
      return lineHeight * clmp;
    }

    /**
     * Returns the line-height of an element as an integer.
     */
    function getLineHeight(elem) {
      var lh = computeStyle(elem, 'line-height');
      if (lh == 'normal') {
        // Normal line heights vary from browser to browser. The spec recommends
        // a value between 1.0 and 1.2 of the font size. Using 1.1 to split the diff.
        lh = parseInt(computeStyle(elem, 'font-size')) * 1.2;
      }
      return parseInt(lh);
    }


    // MEAT AND POTATOES (MMMM, POTATOES...) ______________________________________
    var splitOnChars = opt.splitOnChars.slice(0),
      splitChar = splitOnChars[0],
      chunks,
      lastChunk;

    /**
     * Gets an element's last child. That may be another node or a node's contents.
     */
    function getLastChild(elem) {
      //Current element has children, need to go deeper and get last child as a text node
      if (elem.lastChild.children && elem.lastChild.children.length > 0) {
        return getLastChild(Array.prototype.slice.call(elem.children).pop());
      }
      //This is the absolute last child, a text node, but something's wrong with it. Remove it and keep trying
      else if (!elem.lastChild || !elem.lastChild.nodeValue || elem.lastChild.nodeValue === '' || elem.lastChild.nodeValue == opt.truncationChar) {
        elem.lastChild.parentNode.removeChild(elem.lastChild);
        return getLastChild(element);
      }
      //This is the last child we want, return it
      else {
        return elem.lastChild;
      }
    }

    /**
     * Removes one character at a time from the text until its width or
     * height is beneath the passed-in max param.
     */
    function truncate(target, maxHeight) {
      if (!maxHeight) {
        return;
      }

      /**
       * Resets global variables.
       */
      function reset() {
        splitOnChars = opt.splitOnChars.slice(0);
        splitChar = splitOnChars[0];
        chunks = null;
        lastChunk = null;
      }

      var nodeValue = target.nodeValue.replace(opt.truncationChar, '');

      //Grab the next chunks
      if (!chunks) {
        //If there are more characters to try, grab the next one
        if (splitOnChars.length > 0) {
          splitChar = splitOnChars.shift();
        }
        //No characters to chunk by. Go character-by-character
        else {
          splitChar = '';
        }

        chunks = nodeValue.split(splitChar);
      }

      //If there are chunks left to remove, remove the last one and see if
      // the nodeValue fits.
      if (chunks.length > 1) {
        // console.log('chunks', chunks);
        lastChunk = chunks.pop();
        // console.log('lastChunk', lastChunk);
        applyEllipsis(target, chunks.join(splitChar));
      }
      //No more chunks can be removed using this character
      else {
        chunks = null;
      }

      //Insert the custom HTML before the truncation character
      if (truncationHTMLContainer) {
        target.nodeValue = target.nodeValue.replace(opt.truncationChar, '');
        element.innerHTML = target.nodeValue + ' ' + truncationHTMLContainer.innerHTML + opt.truncationChar;
      }

      //Search produced valid chunks
      if (chunks) {
        //It fits
        if (element.clientHeight <= maxHeight) {
          //There's still more characters to try splitting on, not quite done yet
          if (splitOnChars.length >= 0 && splitChar !== '') {
            applyEllipsis(target, chunks.join(splitChar) + splitChar + lastChunk);
            chunks = null;
          }
          //Finished!
          else {
            return element.innerHTML;
          }
        }
      }
      //No valid chunks produced
      else {
        //No valid chunks even when splitting by letter, time to move
        //on to the next node
        if (splitChar === '') {
          applyEllipsis(target, '');
          target = getLastChild(element);

          reset();
        }
      }

      //If you get here it means still too big, let's keep truncating
      if (opt.animate) {
        setTimeout(function() {
          truncate(target, maxHeight);
        }, opt.animate === true ? 10 : opt.animate);
      } else {
        return truncate(target, maxHeight);
      }
    }

    function applyEllipsis(elem, str) {
      elem.nodeValue = str + opt.truncationChar;
    }


    // CONSTRUCTOR ________________________________________________________________

    if (clampValue == 'auto') {
      clampValue = getMaxLines();
    } else if (isCSSValue) {
      clampValue = getMaxLines(parseInt(clampValue));
    }

    var clampedText;
    if (supportsNativeClamp && opt.useNativeClamp) {
      sty.overflow = 'hidden';
      sty.textOverflow = 'ellipsis';
      sty.webkitBoxOrient = 'vertical';
      sty.display = '-webkit-box';
      sty.webkitLineClamp = clampValue;

      if (isCSSValue) {
        sty.height = opt.clamp + 'px';
      }
    } else {
      var height = getMaxHeight(clampValue);
      if (height <= element.clientHeight) {
        clampedText = truncate(getLastChild(element), height);
      }
    }

    return {
      'original': originalText,
      'clamped': clampedText
    };
  }

  return clamp;
}));
});

// `Array.prototype.fill` method implementation
// https://tc39.github.io/ecma262/#sec-array.prototype.fill
var arrayFill = function fill(value /* , start = 0, end = @length */) {
  var O = toObject(this);
  var length = toLength(O.length);
  var argumentsLength = arguments.length;
  var index = toAbsoluteIndex(argumentsLength > 1 ? arguments[1] : undefined, length);
  var end = argumentsLength > 2 ? arguments[2] : undefined;
  var endPos = end === undefined ? length : toAbsoluteIndex(end, length);
  while (endPos > index) O[index++] = value;
  return O;
};

// `Array.prototype.fill` method
// https://tc39.github.io/ecma262/#sec-array.prototype.fill
_export({ target: 'Array', proto: true }, {
  fill: arrayFill
});

// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables$1('fill');

var $findIndex = arrayIteration.findIndex;



var FIND_INDEX = 'findIndex';
var SKIPS_HOLES$1 = true;

var USES_TO_LENGTH$8 = arrayMethodUsesToLength(FIND_INDEX);

// Shouldn't skip holes
if (FIND_INDEX in []) Array(1)[FIND_INDEX](function () { SKIPS_HOLES$1 = false; });

// `Array.prototype.findIndex` method
// https://tc39.github.io/ecma262/#sec-array.prototype.findindex
_export({ target: 'Array', proto: true, forced: SKIPS_HOLES$1 || !USES_TO_LENGTH$8 }, {
  findIndex: function findIndex(callbackfn /* , that = undefined */) {
    return $findIndex(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables$1(FIND_INDEX);

// `Map` constructor
// https://tc39.github.io/ecma262/#sec-map-objects
var es_map = collection$1('Map', function (init) {
  return function Map() { return init(this, arguments.length ? arguments[0] : undefined); };
}, collectionStrong$1);

// `RegExp.prototype.flags` getter implementation
// https://tc39.github.io/ecma262/#sec-get-regexp.prototype.flags
var regexpFlags$1 = function () {
  var that = anObject(this);
  var result = '';
  if (that.global) result += 'g';
  if (that.ignoreCase) result += 'i';
  if (that.multiline) result += 'm';
  if (that.dotAll) result += 's';
  if (that.unicode) result += 'u';
  if (that.sticky) result += 'y';
  return result;
};

var TO_STRING$2 = 'toString';
var RegExpPrototype$1 = RegExp.prototype;
var nativeToString$1 = RegExpPrototype$1[TO_STRING$2];

var NOT_GENERIC$1 = fails(function () { return nativeToString$1.call({ source: 'a', flags: 'b' }) != '/a/b'; });
// FF44- RegExp#toString has a wrong name
var INCORRECT_NAME$1 = nativeToString$1.name != TO_STRING$2;

// `RegExp.prototype.toString` method
// https://tc39.github.io/ecma262/#sec-regexp.prototype.tostring
if (NOT_GENERIC$1 || INCORRECT_NAME$1) {
  redefine(RegExp.prototype, TO_STRING$2, function toString() {
    var R = anObject(this);
    var p = String(R.source);
    var rf = R.flags;
    var f = String(rf === undefined && R instanceof RegExp && !('flags' in RegExpPrototype$1) ? regexpFlags$1.call(R) : rf);
    return '/' + p + '/' + f;
  }, { unsafe: true });
}

class Filter extends Element {
  constructor (node) {
    super(nodeOrNew('filter', node), node);

    this.$source = 'SourceGraphic';
    this.$sourceAlpha = 'SourceAlpha';
    this.$background = 'BackgroundImage';
    this.$backgroundAlpha = 'BackgroundAlpha';
    this.$fill = 'FillPaint';
    this.$stroke = 'StrokePaint';
    this.$autoSetIn = true;
  }

  put (element, i) {
    element = super.put(element, i);

    if (!element.attr('in') && this.$autoSetIn) {
      element.attr('in', this.$source);
    }
    if (!element.attr('result')) {
      element.attr('result', element.id());
    }

    return element
  }

  // Unmask all masked elements and remove itself
  remove () {
    // unmask all targets
    this.targets().each('unfilter');

    // remove mask from parent
    return super.remove()
  }

  targets () {
    return baseFind('svg [filter*="' + this.id() + '"]')
  }

  toString () {
    return 'url(#' + this.id() + ')'
  }
}

// Create Effect class
class Effect extends Element {
  constructor (node) {
    super(node, node);
    this.result(this.id());
  }

  in (effect) {
    // Act as getter
    if (effect == null) {
      const _in = this.attr('in');
      const ref = this.parent() && this.parent().find(`[result="${_in}"]`)[0];
      return ref || _in
    }

    // Avr as setter
    return this.attr('in', effect)
  }

  // Named result
  result (result) {
    return this.attr('result', result)
  }

  // Stringification
  toString () {
    return this.result()
  }
}

// This function takes an array with attr keys and sets for every key the
// attribute to the value of one paramater
// getAttrSetter(['a', 'b']) becomes this.attr({a: param1, b: param2})
const getAttrSetter = (params) => {
  return function (...args) {
    for (let i = params.length; i--;) {
      if (args[i] != null) {
        this.attr(params[i], args[i]);
      }
    }
  }
};

const updateFunctions = {
  blend: getAttrSetter(['in', 'in2', 'mode']),
  // ColorMatrix effect
  colorMatrix: getAttrSetter(['type', 'values']),
  // Composite effect
  composite: getAttrSetter(['in', 'in2', 'operator']),
  // ConvolveMatrix effect
  convolveMatrix: function (matrix) {
    matrix = new SVGArray(matrix).toString();

    this.attr({
      order: Math.sqrt(matrix.split(' ').length),
      kernelMatrix: matrix
    });
  },
  // DiffuseLighting effect
  diffuseLighting: getAttrSetter(['surfaceScale', 'lightingColor', 'diffuseConstant', 'kernelUnitLength']),
  // DisplacementMap effect
  displacementMap: getAttrSetter(['in', 'in2', 'scale', 'xChannelSelector', 'yChannelSelector']),
  // DropShadow effect
  dropShadow: getAttrSetter(['in', 'dx', 'dy', 'stdDeviation']),
  // Flood effect
  flood: getAttrSetter(['flood-color', 'flood-opacity']),
  // Gaussian Blur effect
  gaussianBlur: function (x = 0, y = x) {
    this.attr('stdDeviation', x + ' ' + y);
  },
  // Image effect
  image: function (src) {
    this.attr('href', src, namespaces.xlink);
  },
  // Morphology effect
  morphology: getAttrSetter(['operator', 'radius']),
  // Offset effect
  offset: getAttrSetter(['dx', 'dy']),
  // SpecularLighting effect
  specularLighting: getAttrSetter(['surfaceScale', 'lightingColor', 'diffuseConstant', 'specularExponent', 'kernelUnitLength']),
  // Tile effect
  tile: getAttrSetter([]),
  // Turbulence effect
  turbulence: getAttrSetter(['baseFrequency', 'numOctaves', 'seed', 'stitchTiles', 'type'])
};

const filterNames = [
  'blend',
  'colorMatrix',
  'componentTransfer',
  'composite',
  'convolveMatrix',
  'diffuseLighting',
  'displacementMap',
  'dropShadow',
  'flood',
  'gaussianBlur',
  'image',
  'merge',
  'morphology',
  'offset',
  'specularLighting',
  'tile',
  'turbulence'
];

// For every filter create a class
filterNames.forEach((effect) => {
  const name = utils.capitalize(effect);
  const fn = updateFunctions[effect];

  Filter[name + 'Effect'] = class extends Effect {
    constructor (node) {
      super(nodeOrNew('fe' + name, node), node);
    }

    // This function takes all parameters from the factory call
    // and updates the attributes according to the updateFunctions
    update (args) {
      fn.apply(this, args);
      return this
    }
  };

  // Add factory function to filter
  // Allow to pass a function or object
  // The attr object is catched from "wrapWithAttrCheck"
  Filter.prototype[effect] = wrapWithAttrCheck(function (fn, ...args) {
    const effect = new Filter[name + 'Effect']();

    if (fn == null) return this.put(effect)

    // For Effects which can take children, a function is allowed
    if (typeof fn === 'function') {
      fn.call(effect, effect);
    } else {
      // In case it is not a function, add it to arguments
      args.unshift(fn);
    }
    return this.put(effect).update(args)
  });
});

// Correct factories which are not that simple
extend(Filter, {
  merge (arrayOrFn) {
    const node = this.put(new Filter.MergeEffect());

    // If a function was passed, execute it
    // That makes stuff like this possible:
    // filter.merge((mergeEffect) => mergeEffect.mergeNode(in))
    if (typeof arrayOrFn === 'function') {
      arrayOrFn.call(node, node);
      return node
    }

    // Check if first child is an array, otherwise use arguments as array
    var children = arrayOrFn instanceof Array ? arrayOrFn : [...arguments];

    children.forEach((child) => {
      if (child instanceof Filter.MergeNode) {
        node.put(child);
      } else {
        node.mergeNode(child);
      }
    });

    return node
  },
  componentTransfer (components = {}) {
    const node = this.put(new Filter.ComponentTransferEffect());

    if (typeof components === 'function') {
      components.call(node, node);
      return node
    }

    // If no component is set, we use the given object for all components
    if (!components.r && !components.g && !components.b && !components.a) {
      const temp = components;
      components = {
        r: temp, g: temp, b: temp, a: temp
      };
    }

    for (const c in components) {
      // components[c] has to hold an attributes object
      node.add(new Filter['Func' + c.toUpperCase()](components[c]));
    }

    return node
  }
});

const filterChildNodes = [
  'distantLight',
  'pointLight',
  'spotLight',
  'mergeNode',
  'FuncR',
  'FuncG',
  'FuncB',
  'FuncA'
];

filterChildNodes.forEach((child) => {
  const name = utils.capitalize(child);
  Filter[name] = class extends Effect {
    constructor (node) {
      super(nodeOrNew('fe' + name, node), node);
    }
  };
});

const componentFuncs = [
  'funcR',
  'funcG',
  'funcB',
  'funcA'
];

// Add an update function for componentTransfer-children
componentFuncs.forEach(function (c) {
  const _class = Filter[utils.capitalize(c)];
  const fn = wrapWithAttrCheck(function () {
    return this.put(new _class())
  });

  Filter.ComponentTransferEffect.prototype[c] = fn;
});

const lights = [
  'distantLight',
  'pointLight',
  'spotLight'
];

// Add light sources factories to lightining effects
lights.forEach((light) => {
  const _class = Filter[utils.capitalize(light)];
  const fn = wrapWithAttrCheck(function () {
    return this.put(new _class())
  });

  Filter.DiffuseLightingEffect.prototype[light] = fn;
  Filter.SpecularLightingEffect.prototype[light] = fn;
});

extend(Filter.MergeEffect, {
  mergeNode (_in) {
    return this.put(new Filter.MergeNode()).attr('in', _in)
  }
});

// add .filter function
extend(Defs, {
  // Define filter
  filter: function (block) {
    var filter = this.put(new Filter());

    /* invoke passed block */
    if (typeof block === 'function') { block.call(filter, filter); }

    return filter
  }
});

extend(Container, {
  // Define filter on defs
  filter: function (block) {
    return this.defs().filter(block)
  }
});

extend(Element, {
  // Create filter element in defs and store reference
  filterWith: function (block) {
    const filter = block instanceof Filter
      ? block : this.defs().filter(block);

    return this.attr('filter', filter)
  },
  // Remove filter
  unfilter: function (remove) {
    /* remove filter attribute */
    return this.attr('filter', null)
  },
  filterer () {
    return this.reference('filter')
  }
});

// chaining
var chainingEffects = {
  // Blend effect
  blend: function (in2, mode) {
    return this.parent() && this.parent().blend(this, in2, mode) // pass this as the first input
  },
  // ColorMatrix effect
  colorMatrix: function (type, values) {
    return this.parent() && this.parent().colorMatrix(type, values).in(this)
  },
  // ComponentTransfer effect
  componentTransfer: function (components) {
    return this.parent() && this.parent().componentTransfer(components).in(this)
  },
  // Composite effect
  composite: function (in2, operator) {
    return this.parent() && this.parent().composite(this, in2, operator) // pass this as the first input
  },
  // ConvolveMatrix effect
  convolveMatrix: function (matrix) {
    return this.parent() && this.parent().convolveMatrix(matrix).in(this)
  },
  // DiffuseLighting effect
  diffuseLighting: function (surfaceScale, lightingColor, diffuseConstant, kernelUnitLength) {
    return this.parent() && this.parent().diffuseLighting(surfaceScale, diffuseConstant, kernelUnitLength).in(this)
  },
  // DisplacementMap effect
  displacementMap: function (in2, scale, xChannelSelector, yChannelSelector) {
    return this.parent() && this.parent().displacementMap(this, in2, scale, xChannelSelector, yChannelSelector) // pass this as the first input
  },
  // DisplacementMap effect
  dropShadow: function (x, y, stdDeviation) {
    return this.parent() && this.parent().dropShadow(this, x, y, stdDeviation).in(this) // pass this as the first input
  },
  // Flood effect
  flood: function (color, opacity) {
    return this.parent() && this.parent().flood(color, opacity) // this effect dont have inputs
  },
  // Gaussian Blur effect
  gaussianBlur: function (x, y) {
    return this.parent() && this.parent().gaussianBlur(x, y).in(this)
  },
  // Image effect
  image: function (src) {
    return this.parent() && this.parent().image(src) // this effect dont have inputs
  },
  // Merge effect
  merge: function (arg) {
    arg = arg instanceof Array ? arg : [...arg];
    return this.parent() && this.parent().merge(this, ...arg) // pass this as the first argument
  },
  // Morphology effect
  morphology: function (operator, radius) {
    return this.parent() && this.parent().morphology(operator, radius).in(this)
  },
  // Offset effect
  offset: function (dx, dy) {
    return this.parent() && this.parent().offset(dx, dy).in(this)
  },
  // SpecularLighting effect
  specularLighting: function (surfaceScale, lightingColor, diffuseConstant, specularExponent, kernelUnitLength) {
    return this.parent() && this.parent().specularLighting(surfaceScale, diffuseConstant, specularExponent, kernelUnitLength).in(this)
  },
  // Tile effect
  tile: function () {
    return this.parent() && this.parent().tile().in(this)
  },
  // Turbulence effect
  turbulence: function (baseFrequency, numOctaves, seed, stitchTiles, type) {
    return this.parent() && this.parent().turbulence(baseFrequency, numOctaves, seed, stitchTiles, type).in(this)
  }
};

extend(Effect, chainingEffects);

// Effect-specific extensions
extend(Filter.MergeEffect, {
  in: function (effect) {
    if (effect instanceof Filter.MergeNode) {
      this.add(effect, 0);
    } else {
      this.add(new Filter.MergeNode().in(effect), 0);
    }

    return this
  }
});

extend([Filter.CompositeEffect, Filter.BlendEffect, Filter.DisplacementMapEffect], {
  in2: function (effect) {
    if (effect == null) {
      const in2 = this.attr('in2');
      const ref = this.parent() && this.parent().find(`[result="${in2}"]`)[0];
      return ref || in2
    }
    return this.attr('in2', effect)
  }
});

// Presets
Filter.filter = {
  sepiatone: [
    0.343, 0.669, 0.119, 0, 0,
    0.249, 0.626, 0.130, 0, 0,
    0.172, 0.334, 0.111, 0, 0,
    0.000, 0.000, 0.000, 1, 0]
};

var FallbackControlIcon = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20version%3D%221.1%22%20style%3D%22%22%20xml%3Aspace%3D%22preserve%22%20width%3D%22254.313%22%20height%3D%22254.313%22%3E%3Crect%20id%3D%22backgroundrect%22%20width%3D%22100%25%22%20height%3D%22100%25%22%20x%3D%220%22%20y%3D%220%22%20fill%3D%22none%22%20stroke%3D%22none%22%2F%3E%3Cg%20class%3D%22currentLayer%22%20style%3D%22%22%3E%3Ctitle%3ELayer%201%3C%2Ftitle%3E%3Cg%20id%3D%22svg_1%22%20class%3D%22selected%22%20fill%3D%22%237daed6%22%20fill-opacity%3D%221%22%3E%20%3Cpath%20style%3D%22%22%20d%3D%22M11.749%2C73.933l111.871%2C59.819c1.104%2C0.591%2C2.32%2C0.886%2C3.536%2C0.886s2.432-0.295%2C3.536-0.886%20%20%20l111.871-59.819c2.44-1.305%2C3.964-3.847%2C3.964-6.614s-1.523-5.309-3.964-6.614L130.692%2C0.886c-2.209-1.182-4.863-1.182-7.072%2C0%20%20%20L11.749%2C60.705c-2.44%2C1.305-3.964%2C3.847-3.964%2C6.614S9.309%2C72.628%2C11.749%2C73.933z%20M127.156%2C16.005l95.966%2C51.314l-95.966%2C51.314%20%20%20L31.19%2C67.319L127.156%2C16.005z%22%20id%3D%22svg_2%22%20fill%3D%22%237daed6%22%20fill-opacity%3D%221%22%2F%3E%20%3Cpath%20style%3D%22%22%20d%3D%22M242.563%2C120.561l-32.612-17.438c-3.653-1.954-8.197-0.575-10.15%2C3.077%20%20%20c-1.953%2C3.653-0.575%2C8.197%2C3.078%2C10.15l20.243%2C10.824l-95.966%2C51.314L31.19%2C127.175l20.478-10.95%20%20%20c3.653-1.953%2C5.031-6.498%2C3.078-10.15c-1.953-3.652-6.498-5.03-10.15-3.077l-32.847%2C17.563c-2.44%2C1.305-3.964%2C3.847-3.964%2C6.614%20%20%20s1.523%2C5.309%2C3.964%2C6.614l111.871%2C59.819c1.104%2C0.591%2C2.32%2C0.886%2C3.536%2C0.886s2.432-0.295%2C3.536-0.886l111.871-59.819%20%20%20c2.44-1.305%2C3.964-3.847%2C3.964-6.614S245.004%2C121.866%2C242.563%2C120.561z%22%20id%3D%22svg_3%22%20fill%3D%22%237daed6%22%20fill-opacity%3D%221%22%2F%3E%20%3Cpath%20style%3D%22%22%20d%3D%22M242.563%2C180.38l-31.578-16.885c-3.654-1.953-8.197-0.575-10.15%2C3.077%20%20%20c-1.953%2C3.653-0.575%2C8.197%2C3.078%2C10.15l19.209%2C10.271l-95.966%2C51.314L31.19%2C186.994l19.001-10.16%20%20%20c3.653-1.953%2C5.031-6.498%2C3.078-10.15s-6.498-5.031-10.15-3.077l-31.37%2C16.774c-2.44%2C1.305-3.964%2C3.847-3.964%2C6.614%20%20%20s1.523%2C5.309%2C3.964%2C6.614l111.871%2C59.819c1.104%2C0.591%2C2.32%2C0.886%2C3.536%2C0.886s2.432-0.295%2C3.536-0.886l111.871-59.819%20%20%20c2.44-1.305%2C3.964-3.847%2C3.964-6.614S245.004%2C181.685%2C242.563%2C180.38z%22%20id%3D%22svg_4%22%20fill%3D%22%237daed6%22%20fill-opacity%3D%221%22%2F%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_5%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_6%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_7%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_8%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_9%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_10%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_11%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_12%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_13%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_14%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_15%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_16%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_17%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_18%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_19%22%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E";

var FallbackAssetIcon = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22512%22%20height%3D%22512%22%3E%3Crect%20id%3D%22backgroundrect%22%20width%3D%22100%25%22%20height%3D%22100%25%22%20x%3D%220%22%20y%3D%220%22%20fill%3D%22none%22%20stroke%3D%22none%22%2F%3E%3Cg%20class%3D%22currentLayer%22%20style%3D%22%22%3E%3Ctitle%3ELayer%201%3C%2Ftitle%3E%3Cpath%20d%3D%22M59.5625%2C198.65625l48%2C32A7.99836%2C7.99836%2C0%2C0%2C0%2C112%2C232h48a7.99836%2C7.99836%2C0%2C0%2C0%2C4.4375-1.34375l48-32A7.99943%2C7.99943%2C0%2C0%2C0%2C216%2C192V104a7.99927%2C7.99927%2C0%2C0%2C0-4.11523-6.99316l-72-40a7.99618%2C7.99618%2C0%2C0%2C0-7.76954%2C0l-72%2C40A7.99927%2C7.99927%2C0%2C0%2C0%2C56%2C104v88A7.99943%2C7.99943%2C0%2C0%2C0%2C59.5625%2C198.65625ZM157.57812%2C216H114.42188L72%2C187.71875V117.59583l60.11523%2C33.39733a7.99788%2C7.99788%2C0%2C0%2C0%2C7.76954%2C0L200%2C117.59583v70.12292ZM136%2C73.15186%2C191.52734%2C104%2C136%2C134.84814%2C80.47266%2C104Z%22%20id%3D%22svg_1%22%20class%3D%22%22%20fill%3D%22%2379aed3%22%20fill-opacity%3D%221%22%2F%3E%3Crect%20x%3D%22136%22%20y%3D%22264%22%20width%3D%2240%22%20height%3D%2216%22%20id%3D%22svg_2%22%20class%3D%22%22%20fill%3D%22%2379aed3%22%20fill-opacity%3D%221%22%2F%3E%3Crect%20x%3D%2296%22%20y%3D%22264%22%20width%3D%2224%22%20height%3D%2216%22%20id%3D%22svg_3%22%20class%3D%22%22%20fill%3D%22%2379aed3%22%20fill-opacity%3D%221%22%2F%3E%3Crect%20x%3D%22152%22%20y%3D%22296%22%20width%3D%2248%22%20height%3D%2216%22%20id%3D%22svg_4%22%20class%3D%22%22%20fill%3D%22%2379aed3%22%20fill-opacity%3D%221%22%2F%3E%3Crect%20x%3D%2272%22%20y%3D%22296%22%20width%3D%2264%22%20height%3D%2216%22%20id%3D%22svg_5%22%20class%3D%22%22%20fill%3D%22%2379aed3%22%20fill-opacity%3D%221%22%2F%3E%3Cpath%20d%3D%22M472%2C24a8.00008%2C8.00008%2C0%2C0%2C0-8-8H400a8.00008%2C8.00008%2C0%2C0%2C0-8%2C8V144H336a8.00008%2C8.00008%2C0%2C0%2C0-8%2C8v96H272a8.00008%2C8.00008%2C0%2C0%2C0-8%2C8v72H208a8.00008%2C8.00008%2C0%2C0%2C0-8%2C8v53.35486a184.91086%2C184.91086%2C0%2C0%2C0-20.05078-10.08L160%2C370.725V360a8.00008%2C8.00008%2C0%2C0%2C0-8-8H24a8.00008%2C8.00008%2C0%2C0%2C0-8%2C8v96a8.00008%2C8.00008%2C0%2C0%2C0%2C8%2C8H152a7.96954%2C7.96954%2C0%2C0%2C0%2C5.58032-2.27368A95.77127%2C95.77127%2C0%2C0%2C0%2C231.0957%2C496H312a23.99123%2C23.99123%2C0%2C0%2C0%2C22.62378-32H496V448H472ZM280%2C264h48V448H286.62378a23.98127%2C23.98127%2C0%2C0%2C0-5.655-24.97168c-.31543-.31525-.6394-.61822-.96875-.91363Zm-64%2C80h48v72h-.00488l-28.72266.00586A184.17574%2C184.17574%2C0%2C0%2C0%2C216%2C399.79272ZM144%2C448H32V368H144Zm168%2C32H231.0957a79.83745%2C79.83745%2C0%2C0%2C1-66.56347-35.62451L160%2C437.57751V388.13232l13.64648%2C5.84864a167.473%2C167.473%2C0%2C0%2C1%2C52.69727%2C35.68164%2C7.99952%2C7.99952%2C0%2C0%2C0%2C5.65723%2C2.34375h.00195L263.99805%2C432a8%2C8%2C0%2C0%2C1%2C.00488%2C16H224v16h32.00293v.00244L312%2C464.00049A7.99976%2C7.99976%2C0%2C1%2C1%2C312%2C480Zm32-320h48V448H344Zm64%2C288V32h48V448Z%22%20id%3D%22svg_6%22%20class%3D%22%22%20fill%3D%22%2379aed3%22%20fill-opacity%3D%221%22%2F%3E%3Crect%20x%3D%22352%22%20y%3D%22480%22%20width%3D%2232%22%20height%3D%2216%22%20id%3D%22svg_7%22%20class%3D%22%22%20fill%3D%22%2379aed3%22%20fill-opacity%3D%221%22%2F%3E%3Crect%20x%3D%22416%22%20y%3D%22480%22%20width%3D%2232%22%20height%3D%2216%22%20id%3D%22svg_8%22%20class%3D%22%22%20fill%3D%22%2379aed3%22%20fill-opacity%3D%221%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E";

var FallbackRiskIcon = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20version%3D%221.1%22%20style%3D%22enable-background%3Anew%200%200%2028.937%2028.937%3B%22%20xml%3Aspace%3D%22preserve%22%20width%3D%2228.937%22%20height%3D%2228.937%22%3E%3Crect%20id%3D%22backgroundrect%22%20width%3D%22100%25%22%20height%3D%22100%25%22%20x%3D%220%22%20y%3D%220%22%20fill%3D%22none%22%20stroke%3D%22none%22%2F%3E%3Cg%20class%3D%22currentLayer%22%20style%3D%22%22%3E%3Ctitle%3ELayer%201%3C%2Ftitle%3E%3Cg%20id%3D%22svg_1%22%20class%3D%22selected%22%20fill%3D%22%23f26a7c%22%20fill-opacity%3D%221%22%3E%20%3Cpath%20d%3D%22M28.859%2C26.124L14.957%2C2.245c-0.101-0.173-0.287-0.279-0.489-0.279c-0.198%2C0-0.383%2C0.106-0.481%2C0.279L0.079%2C26.124%20%20%20c-0.102%2C0.175-0.106%2C0.389-0.006%2C0.565c0.103%2C0.174%2C0.287%2C0.282%2C0.488%2C0.282h27.814c0.201%2C0%2C0.389-0.108%2C0.488-0.282%20%20%20c0.047-0.088%2C0.074-0.186%2C0.074-0.281C28.938%2C26.309%2C28.911%2C26.211%2C28.859%2C26.124z%20M16.369%2C10.441l-0.462%2C9.493h-2.389%20%20%20l-0.461-9.493H16.369z%20M14.711%2C24.794h-0.042c-1.089%2C0-1.843-0.817-1.843-1.907c0-1.131%2C0.774-1.907%2C1.885-1.907%20%20%20s1.846%2C0.775%2C1.867%2C1.907C16.579%2C23.977%2C15.844%2C24.794%2C14.711%2C24.794z%22%20id%3D%22svg_2%22%20fill%3D%22%23f26a7c%22%20fill-opacity%3D%221%22%2F%3E%20%3Cg%20id%3D%22svg_3%22%20fill%3D%22%23f26a7c%22%20fill-opacity%3D%221%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22svg_4%22%20fill%3D%22%23f26a7c%22%20fill-opacity%3D%221%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22svg_5%22%20fill%3D%22%23f26a7c%22%20fill-opacity%3D%221%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22svg_6%22%20fill%3D%22%23f26a7c%22%20fill-opacity%3D%221%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22svg_7%22%20fill%3D%22%23f26a7c%22%20fill-opacity%3D%221%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22svg_8%22%20fill%3D%22%23f26a7c%22%20fill-opacity%3D%221%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22svg_9%22%20fill%3D%22%23f26a7c%22%20fill-opacity%3D%221%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22svg_10%22%20fill%3D%22%23f26a7c%22%20fill-opacity%3D%221%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22svg_11%22%20fill%3D%22%23f26a7c%22%20fill-opacity%3D%221%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22svg_12%22%20fill%3D%22%23f26a7c%22%20fill-opacity%3D%221%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22svg_13%22%20fill%3D%22%23f26a7c%22%20fill-opacity%3D%221%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22svg_14%22%20fill%3D%22%23f26a7c%22%20fill-opacity%3D%221%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22svg_15%22%20fill%3D%22%23f26a7c%22%20fill-opacity%3D%221%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22svg_16%22%20fill%3D%22%23f26a7c%22%20fill-opacity%3D%221%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22svg_17%22%20fill%3D%22%23f26a7c%22%20fill-opacity%3D%221%22%3E%20%3C%2Fg%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_18%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_19%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_20%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_21%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_22%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_23%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_24%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_25%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_26%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_27%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_28%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_29%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_30%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_31%22%3E%3C%2Fg%3E%3Cg%20id%3D%22svg_32%22%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E";

var FallbackCustomIcon = "data:image/svg+xml,%3Csvg%20enable-background%3D%22new%200%200%2060%2052%22%20height%3D%22512%22%20viewBox%3D%220%200%2060%2052%22%20width%3D%22512%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22m30%2034c-4.411%200-8-3.589-8-8s3.589-8%208-8%208%203.589%208%208-3.589%208-8%208zm0-14c-3.308%200-6%202.691-6%206s2.692%206%206%206%206-2.691%206-6-2.692-6-6-6z%22%2F%3E%3Cpath%20d%3D%22m54%2012c-3.308%200-6-2.691-6-6s2.692-6%206-6%206%202.691%206%206-2.692%206-6%206zm0-10c-2.206%200-4%201.794-4%204s1.794%204%204%204%204-1.794%204-4-1.794-4-4-4z%22%2F%3E%3Cpath%20d%3D%22m6%2052c-3.308%200-6-2.691-6-6s2.692-6%206-6%206%202.691%206%206-2.692%206-6%206zm0-10c-2.206%200-4%201.794-4%204s1.794%204%204%204%204-1.794%204-4-1.794-4-4-4z%22%2F%3E%3Cpath%20d%3D%22m8%2021c-2.206%200-4-1.794-4-4s1.794-4%204-4%204%201.794%204%204-1.794%204-4%204zm0-6c-1.103%200-2%20.897-2%202s.897%202%202%202%202-.897%202-2-.897-2-2-2z%22%2F%3E%3Cpath%20d%3D%22m28%2010c-2.206%200-4-1.794-4-4s1.794-4%204-4%204%201.794%204%204-1.794%204-4%204zm0-6c-1.103%200-2%20.897-2%202s.897%202%202%202%202-.897%202-2-.897-2-2-2z%22%2F%3E%3Cpath%20d%3D%22m46%2043c-2.206%200-4-1.794-4-4s1.794-4%204-4%204%201.794%204%204-1.794%204-4%204zm0-6c-1.103%200-2%20.897-2%202s.897%202%202%202%202-.897%202-2-.897-2-2-2z%22%2F%3E%3Cpath%20d%3D%22m29.999%2020c-.467%200-.885-.329-.979-.804l-2-10c-.108-.542.243-1.068.784-1.177.543-.108%201.068.243%201.177.784l2%2010c.108.542-.243%201.068-.784%201.177-.067.014-.133.02-.198.02z%22%2F%3E%3Cpath%20d%3D%22m35.377%2022.519c-.286%200-.571-.123-.769-.36-.354-.424-.296-1.055.128-1.408l14.783-12.318c.424-.354%201.055-.297%201.408.128.354.424.296%201.055-.128%201.408l-14.782%2012.318c-.187.156-.414.232-.64.232z%22%2F%3E%3Cpath%20d%3D%22m9.978%2043.974c-.283%200-.563-.119-.761-.351-.358-.42-.308-1.051.112-1.41l14.646-12.493c.42-.359%201.051-.309%201.41.112.358.42.308%201.051-.112%201.41l-14.647%2012.492c-.188.161-.418.24-.648.24z%22%2F%3E%3Cpath%20d%3D%22m23.52%2024.35c-.126%200-.254-.024-.378-.075l-12.746-5.214c-.511-.209-.756-.793-.547-1.304s.792-.753%201.304-.547l12.746%205.214c.511.209.756.793.547%201.304-.158.387-.532.622-.926.622z%22%2F%3E%3Cpath%20d%3D%22m43.806%2037.958c-.218%200-.437-.071-.621-.217l-8.325-6.607c-.433-.343-.505-.972-.162-1.405.343-.434.972-.506%201.405-.162l8.325%206.607c.433.343.505.972.162%201.405-.197.249-.489.379-.784.379z%22%2F%3E%3C%2Fsvg%3E";

var LightenDarkenColor = function LightenDarkenColor(col, amt) {
  var num = parseInt(col, 16);
  var r = (num >> 16) + amt;
  var b = (num >> 8 & 0x00FF) + amt;
  var g = (num & 0x0000FF) + amt;
  var newColor = g | b << 8 | r << 16;
  return newColor.toString(16);
};
/**
 * Base class for all node representations
 * @param {Data} data the raw data object to represent
 * @param {Canvas} canvas the svg canvas element to render the node on
 */


var BaseNode = /*#__PURE__*/function () {
  function BaseNode(data, canvas) {
    _classCallCheck(this, BaseNode);

    this.svg = null;
    this.canvas = canvas;
    this.config = {}; // set by class
    // node data

    this.id = data.id || 0;
    this.label = data.label || "";
    this.type = data.type || "unkown";
    this.tooltipText = data.tooltipText || null;
    this.description = data.description || null;
    this.keyValuePairs = data.keyValuePairs || [];
    this.state = data.state || null;
    this.attributes = new Map(); // TODO: key value paired map
    // layout data

    this.depth = 0;
    this.parent = null;
    this.parentId = data.parentId || null;
    this.children = [];
    this.childrenIds = data.childrenIds || [];
    this.prevSibling = data.prevSibling || null;
    this.modifier = 0;
    this.mod = 0; // node position

    this.initialX = 0;
    this.initialY = 0;
    this.finalX = 0;
    this.finalY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.x = 0;
    this.y = 0; // node info

    this.nodeSize = "min"; // minimal or maximal representation

    this.opacity = 1;
    this.isHidden = false;
    this.currentWidth = 0;
    this.currentHeight = 0; // events

    this.events = [];
    this.outgoingEdges = [];
    this.incomingEdges = [];
  }

  _createClass(BaseNode, [{
    key: "addIncomingEdge",
    value: function addIncomingEdge(incomingEdge) {
      this.incomingEdges.push(incomingEdge);
    }
  }, {
    key: "addOutgoingEdge",
    value: function addOutgoingEdge(outgoingEdge) {
      this.outgoingEdges.push(outgoingEdge);
    }
  }, {
    key: "transformToPosition",
    value: function transformToPosition() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.initialX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.initialY;
      this.svg.animate({
        duration: this.config.animationSpeed
      }).transform({
        position: [X, Y]
      });
    }
  }, {
    key: "transformToFinalPosition",
    value: function transformToFinalPosition() {
      this.svg.attr({
        opacity: 1
      }).animate({
        duration: this.config.animationSpeed
      }).transform({
        position: [this.finalX, this.finalY]
      }).attr({
        opacity: 1
      });
    }
  }, {
    key: "transformToInitialPosition",
    value: function transformToInitialPosition() {
      this.svg.back();
      this.svg.attr({
        opacity: 1
      }).animate({
        duration: this.config.animationSpeed
      }).transform({
        position: [this.initialX, this.initialY]
      }).attr({
        opacity: 1
      });
    }
  }, {
    key: "isRendered",
    value: function isRendered() {
      return this.svg !== null;
    }
  }, {
    key: "removeNode",
    value: function removeNode() {
      var _this = this;

      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.initialX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.initialY;
      var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
        animation: true
      };

      if (opts.animation === true) {
        if (this.svg !== null) {
          this.svg.animate({
            duration: this.config.animationSpeed
          }).transform({
            scale: 0.001,
            position: [X, Y]
          }).after(function () {
            _this.svg.remove();

            _this.svg = null;
          });
        }
      } else {
        this.svg.remove();
        this.svg = null;
      }
    }
  }, {
    key: "getSVGBbox",
    value: function getSVGBbox() {
      return this.svg.bbox();
    } // TODO: ask: shall the library export a method where the user can change the default
    //            mouse events for every interaction function

  }, {
    key: "addEvent",
    value: function addEvent(event, func) {
      // this.svg.on(event, func)
      // console.log(this.svg)
      this.events = [].concat(_toConsumableArray(this.events), [{
        event: event,
        func: func
      }]); // console.log(this.getNodeSize())
    }
  }, {
    key: "createSVGElement",
    value: function createSVGElement() {
      var _this2 = this;

      // const svg = this.canvas.group().draggable()
      var svg = this.canvas.group();
      svg.css("cursor", "pointer");
      svg.id("node#".concat(this.id));
      svg.on("mouseover", function () {
        svg.front();

        if (_this2.tooltipText !== null && _this2.nodeSize === "min") {
          svg.on("mousemove", function (ev) {
            // show tooltip
            var tooltip = document.getElementById("tooltip");
            tooltip.innerHTML = _this2.tooltipText;
            tooltip.style.display = "block";
            tooltip.style.left = "".concat(ev.clientX - tooltip.clientWidth / 2, "px");
            tooltip.style.top = "".concat(ev.clientY - tooltip.clientHeight - 15, "px");
          });
        } // remove border dasharray


        var node = _this2.svg.get(0);

        node.stroke({
          width: _this2.config.borderStrokeWidth,
          color: _this2.config.borderStrokeColor,
          dasharray: 0
        }); // add hover highlight

        var toDark = _this2.config.borderStrokeColor.substr(1);

        if (_this2.type === "requirement") {
          toDark = _this2.config.backgroundColor.substr(1);
        }

        node.filterWith(function (add) {
          var blur = add.offset(0, 0).in(add.$source).gaussianBlur(3);
          var color = add.composite(add.flood("#".concat(LightenDarkenColor(toDark, -10))), blur, "in");
          add.merge(color, add.$source);
        });
      });
      svg.on("mouseout", function () {
        // reset border stroke
        var node = _this2.svg.get(0);

        node.stroke({
          width: _this2.config.borderStrokeWidth,
          color: _this2.config.borderStrokeColor,
          dasharray: _this2.config.borderStrokeDasharray
        });
        svg.off("mousemove", null); // remove the tooltip

        var tooltip = document.getElementById("tooltip");
        tooltip.style.display = "none"; // remove hover highlight

        node.filterer().remove();

        var i = _toConsumableArray(_this2.canvas.defs().node.childNodes).findIndex(function (d) {
          return d.id === "defaultNodeBorderFilter";
        });

        var filter = _this2.canvas.defs().get(i);

        node.filterWith(filter);
      });
      this.events.forEach(function (_ref) {
        var event = _ref.event,
            func = _ref.func;
        svg.on(event, func);
      });
      return svg;
    }
  }, {
    key: "createNode",
    value: function createNode() {
      var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var node = null;

      if (this.type === "custom") {
        if (this.config.nodeType === "rect") {
          node = this.canvas.rect(width, height);
        } else if (this.config.nodeType === "ellipse") {
          node = this.canvas.ellipse(width, height);
        } else if (this.config.nodeType === "path") {
          node = this.canvas.path(this.config.svg);
        }
      } else {
        node = this.canvas.rect(width, height);
      }

      node.fill(this.config.backgroundColor);
      node.stroke({
        width: this.config.borderStrokeWidth,
        color: this.config.borderStrokeColor,
        dasharray: this.config.borderStrokeDasharray
      });

      if (this.config.nodeType !== "path") {
        node.radius(this.config.borderRadius);
      } // add a re-usable light and color highlight


      var i = _toConsumableArray(this.canvas.defs().node.childNodes).findIndex(function (d) {
        return d.id === "defaultNodeBorderFilter";
      });

      if (i === -1) {
        var filter = new Filter();
        filter.id("defaultNodeBorderFilter");
        var blur = filter.offset(0, 0).in(filter.$source).gaussianBlur(2);
        var color = filter.composite(filter.flood("#fff"), blur, "in");
        filter.merge(color, filter.$source);
        this.canvas.defs().add(filter);
        node.filterWith(filter);
      } else {
        var _filter = this.canvas.defs().get(i);

        node.filterWith(_filter);
      }

      return node;
    }
  }, {
    key: "createIcon",
    value: function createIcon() {
      var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var icon = null;

      if (this.config.iconUrl === null) {
        if (this.type === "control") {
          icon = this.canvas.image(FallbackControlIcon);
        }

        if (this.type === "risk") {
          icon = this.canvas.image(FallbackRiskIcon);
        }

        if (this.type === "asset") {
          icon = this.canvas.image(FallbackAssetIcon);
        }

        if (this.type === "custom") {
          icon = this.canvas.image(FallbackCustomIcon);
        }
      } else {
        icon = this.canvas.image(this.config.iconUrl);
      }

      icon.size(size, size);
      return icon;
    }
  }, {
    key: "createLabel",
    value: function createLabel() {
      var textAlign = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "center";
      // FIXME: html text gets highlighted way to often
      var fobj = this.canvas.foreignObject(this.config.minTextWidth, 0);
      var background = document.createElement("div");
      background.style.background = this.config.labelBackground;
      background.style.padding = "".concat(this.config.offset / 2, "px");
      background.style.textAlign = textAlign;
      background.style.width = "".concat(this.config.minTextWidth, "px");
      var label = document.createElement("div");
      label.innerText = this.label;
      label.style.color = this.config.labelColor;
      label.style.fontSize = "".concat(this.config.labelFontSize, "px");
      label.style.fontFamily = this.config.labelFontFamily;
      label.style.fontWeight = this.config.labelFontWeight;
      label.style.fontStyle = this.config.labelFontStyle;
      clamp(label, {
        clamp: 2
      });
      background.appendChild(label);
      fobj.add(background);
      fobj.css("user-select", "none");
      fobj.dmove(this.config.borderStrokeWidth, this.config.borderStrokeWidth);
      return fobj;
    }
  }, {
    key: "isLeaf",
    value: function isLeaf() {
      return this.children.length === 0;
    }
  }, {
    key: "isLeftMost",
    value: function isLeftMost() {
      if (this.parent === null || this.parent === undefined) {
        return true;
      }

      return this.parent.children[0] === this;
    }
  }, {
    key: "isRightMost",
    value: function isRightMost() {
      if (this.parent === null || this.parent === undefined) {
        return true;
      }

      return this.parent.children[this.children.length - 1] === this;
    }
  }, {
    key: "getLeftMostChild",
    value: function getLeftMostChild() {
      if (this.children.length === 0) {
        return null;
      }

      return this.children[0];
    }
  }, {
    key: "getRightMostChild",
    value: function getRightMostChild() {
      if (this.children.length === 0) {
        return null;
      }

      return this.children[this.children.length - 1];
    }
  }, {
    key: "getPrevSibling",
    value: function getPrevSibling() {
      if (this.parent === null || this.parent === undefined || this.isLeftMost()) {
        return null;
      }

      return this.parent.children[this.parent.children.indexOf(this) - 1];
    }
  }, {
    key: "setPrevSibling",
    value: function setPrevSibling(prevSibling) {
      this.prevSibling = prevSibling;
    }
  }, {
    key: "getNextSibling",
    value: function getNextSibling() {
      if (this.parent === null || this.isRightMost()) {
        return null;
      }

      return this.parent.children[this.parent.children.indexOf(this) + 1];
    }
  }, {
    key: "getLeftMostSibling",
    value: function getLeftMostSibling() {
      if (this.parent === null) {
        return null;
      }

      if (this.isLeftMost()) {
        return this;
      }

      return this.parent.children[0];
    }
  }, {
    key: "getRightMostSibling",
    value: function getRightMostSibling() {
      if (this.children.length === 0) {
        return null;
      }

      return this.children[this.children.length - 1];
    }
  }, {
    key: "setModifier",
    value: function setModifier(modifier) {
      this.modifier = modifier;
    }
  }, {
    key: "getModifier",
    value: function getModifier() {
      return this.modifier;
    }
  }, {
    key: "getMinWidth",
    value: function getMinWidth() {
      return this.config.minWidth;
    }
  }, {
    key: "getMaxWidth",
    value: function getMaxWidth() {
      return this.config.maxWidth;
    }
  }, {
    key: "getMinHeight",
    value: function getMinHeight() {
      return this.config.minHeight;
    }
  }, {
    key: "getMaxHeight",
    value: function getMaxHeight() {
      return this.config.maxHeight;
    }
  }, {
    key: "setConfig",
    value: function setConfig(config) {
      this.config = _objectSpread2({}, this.config, {}, config);
    }
  }, {
    key: "getConfig",
    value: function getConfig() {
      return this.config;
    }
  }, {
    key: "getFinalX",
    value: function getFinalX() {
      return this.finalX;
    }
  }, {
    key: "getFinalY",
    value: function getFinalY() {
      return this.finalY;
    }
  }, {
    key: "setFinalX",
    value: function setFinalX(finalX) {
      this.finalX = finalX;
    }
  }, {
    key: "setFinalY",
    value: function setFinalY(finalY) {
      this.finalY = finalY;
    }
  }, {
    key: "setFinalXY",
    value: function setFinalXY(finalX, finalY) {
      this.finalX = finalX;
      this.finalY = finalY;
    }
  }, {
    key: "getInitialX",
    value: function getInitialX() {
      return this.initialX;
    }
  }, {
    key: "getInitialY",
    value: function getInitialY() {
      return this.initialY;
    }
  }, {
    key: "setInitialX",
    value: function setInitialX(initialX) {
      this.initialX = initialX;
    }
  }, {
    key: "setInitialY",
    value: function setInitialY(initialY) {
      this.initialY = initialY;
    }
  }, {
    key: "setInitialXY",
    value: function setInitialXY(initialX, initialY) {
      this.initialX = initialX;
      this.initialY = initialY;
    }
  }, {
    key: "getCurrentWidth",
    value: function getCurrentWidth() {
      return this.currentWidth;
    }
  }, {
    key: "getCurrentHeight",
    value: function getCurrentHeight() {
      return this.currentHeight;
    }
  }, {
    key: "getNodeSize",
    value: function getNodeSize() {
      return this.nodeSize;
    }
  }, {
    key: "isRoot",
    value: function isRoot() {
      return this.parentId === null;
    }
  }, {
    key: "getChildren",
    value: function getChildren() {
      return this.children;
    }
  }, {
    key: "setChildren",
    value: function setChildren(children) {
      this.children = children;
    }
  }, {
    key: "setNodeSize",
    value: function setNodeSize(nodeSize) {
      this.nodeSize = nodeSize;
    }
  }, {
    key: "getParent",
    value: function getParent() {
      return this.parent;
    }
  }, {
    key: "setParent",
    value: function setParent(parent) {
      this.parent = parent;
    }
  }, {
    key: "setDepth",
    value: function setDepth(depth) {
      this.depth = depth;
    }
  }, {
    key: "getDepth",
    value: function getDepth() {
      return this.depth;
    }
  }, {
    key: "moveToFront",
    value: function moveToFront() {
      this.svg.front();
    }
  }, {
    key: "moveToBack",
    value: function moveToBack() {
      this.svg.back();
    }
  }, {
    key: "getId",
    value: function getId() {
      return this.id;
    }
  }]);

  return BaseNode;
}();

/**
 * Default configuration for risk nodes
 * @typedef {RiskConfig} RiskConfig
 *
 * @param {Number} [maxWidth=300] The nodes maximal width
 * @param {Number} [maxHeight=150] The nodes maximal height
 * @param {Number} [minWidth=150] The nodes minimal width
 * @param {Number} [minHeight=50] The nodes minimal height
 *
 * @param {String} [iconUrl=null] The path to the image icon (if this value is null, the default icon is used)
 * @param {Number} [minIconOpacity=0.6] The basic visibility of the icon
 * @param {Number} [minIconSize=35] The width and height for the image icon
 * @param {Number} [minIconTranslateX=-50] Moves the icon horizontally
 * @param {Number} [minIconTranslateY=0] Moves the icon vertically
 * @param {Number} [maxIconOpacity=0.75] The basic visibility of the icon
 * @param {Number} [maxIconSize=30] The width and height for the image icon
 * @param {Number} [maxIconTranslateX=-120] Moves the icon horizontally
 * @param {Number} [maxIconTranslateY=-55] Moves the icon vertically
 *
 * @param {Number} [offset=8] The spacing used by padding and margin
 * @param {Number} [animationSpeed=300] The animation in milliseconds
 * @param {Number} [borderRadius=4] The border radius
 * @param {Number} [borderStrokeWidth=1] The border stroke width
 * @param {String} [borderStrokeColor="#F26A7C"] The border color
 * @param {String} [borderStrokeDasharray="5 10"] Gaps inside border
 * @param {String} [backgroundColor="#ffffff"] The background color for the rendered node
 *
 * @param {Number} [minTextWidth=100] The minimal text width for the label
 * @param {Number} [minTextHeight=45] The minimal text height for the label
 * @param {Number} [minTextTranslateX=22] Moves the label horizontally
 * @param {Number} [minTextTranslateY=0] The the label vertically
 * @param {Number} [maxTextWidth=295] The maximal text width for the description
 * @param {Number} [maxTextHeight=145] The maximal text height for the description
 * @param {Number} [maxTextTranslateX=0] The the description horizontally
 * @param {Number} [maxTextTranslateY=0] The the description vertically
 * @param {String} [labelColor="#ff8e9e"] The label text color
 * @param {String} [labelFontFamily="Montserrat"] The label font family
 * @param {Number} [labelFontSize=14] The label font size
 * @param {Number} [labelFontWeight=600] The label font weight
 * @param {String} [labelFontStyle="normal"] The label font style
 * @param {String} [labelBackground="transparent"] The label background color
 * @param {String} [detailsColor="#ff8e9e"] The details text color
 * @param {String} [detailsFontFamily="Montserrat"] The details family
 * @param {Number} [detailsFontSize=12] The details font size
 * @param {Number} [detailsFontWeight=600] The details font weight
 * @param {String} [detailsFontStyle="normal"] The details font style
 * @param {String} [detailsBackground="transparent"] The details text background color
 */

var RiskConfig = {
  // large node
  maxWidth: 300,
  maxHeight: 150,
  // small node
  minWidth: 150,
  minHeight: 50,
  // icon
  iconUrl: null,
  minIconOpacity: 0.6,
  minIconSize: 35,
  minIconTranslateX: -50,
  minIconTranslateY: 0,
  maxIconOpacity: 0.75,
  maxIconSize: 30,
  maxIconTranslateX: -120,
  maxIconTranslateY: -55,
  // node
  offset: 8,
  animationSpeed: 300,
  borderRadius: 4,
  borderStrokeWidth: 1,
  borderStrokeColor: "#F26A7C",
  borderStrokeDasharray: "5 10",
  backgroundColor: "#ffffff",
  // text
  minTextWidth: 100,
  minTextHeight: 45,
  minTextTranslateX: 22,
  minTextTranslateY: 0,
  maxTextWidth: 295,
  maxTextHeight: 145,
  maxTextTranslateX: 0,
  maxTextTranslateY: 0,
  labelColor: "#ff8e9e",
  labelFontFamily: "Montserrat",
  labelFontSize: 14,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "transparent",
  detailsColor: "#ff8e9e",
  detailsFontFamily: "Montserrat",
  detailsFontSize: 12,
  detailsFontWeight: 600,
  detailsFontStyle: "normal",
  detailsBackground: "transparent"
};
/**
 * Class representing the visualization of risks
 * @param {Data} data the raw node data
 * @param {Canvas} canvas the canvas to render the node on
 * @param {RiskConfig} customRiskConfig custom config to override default values
 *
 */

var RiskNode = /*#__PURE__*/function (_BaseNode) {
  _inherits(RiskNode, _BaseNode);

  function RiskNode(data, canvas, customRiskConfig) {
    var _this;

    _classCallCheck(this, RiskNode);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(RiskNode).call(this, data, canvas));
    _this.config = _objectSpread2({}, RiskConfig, {}, customRiskConfig);
    return _this;
  }

  _createClass(RiskNode, [{
    key: "createRiskDetails",
    value: function createRiskDetails() {
      // create svg obj to store html
      var text = this.canvas.foreignObject(this.config.maxTextWidth, this.config.maxTextHeight);
      var background = document.createElement("div");
      background.style.width = "".concat(this.config.maxTextWidth, "px");
      background.style.height = "".concat(this.config.maxTextHeight, "px");
      background.style.display = "grid";
      background.style.alignItems = "center";
      background.style.gridTemplateColumns = "auto 10px auto";
      background.style.gridTemplateRows = "".concat(this.config.labelFontSize + 4 + this.config.offset * 2, "px auto");
      text.add(background); // create label

      var label = document.createElement("p");
      label.innerText = this.label;
      label.style.background = this.config.labelBackground;
      label.style.padding = "\n      ".concat(this.config.offset, "px \n      ").concat(this.config.offset / 2, "px \n      ").concat(this.config.offset / 1.5, "px \n      ").concat(this.config.offset / 2, "px\n    ");
      label.style.color = this.config.labelColor;
      label.style.fontSize = "".concat(this.config.labelFontSize + 4, "px");
      label.style.fontFamily = this.config.labelFontFamily;
      label.style.fontWeight = this.config.labelFontWeight;
      label.style.fontStyle = this.config.labelFontStyle;

      if (this.state !== null) {
        label.style.textAlign = "right";
      } else {
        label.style.width = "inherit";
        label.style.textAlign = "center";
      }

      label.style.marginTop = "".concat(this.config.offset, "px");
      label.style.height = "fit-content";
      label.style.gridRow = "1";
      label.style.gridColumn = "1";
      background.appendChild(label); // create status, if any exists

      if (this.state !== null) {
        var seperator = document.createElement("p");
        seperator.innerText = "•";
        seperator.style.background = this.config.labelBackground;
        seperator.style.padding = "\n        ".concat(this.config.offset, "px \n        ").concat(this.config.offset / 2, "px \n        ").concat(this.config.offset / 1.5, "px \n        ").concat(this.config.offset / 2, "px\n      ");
        seperator.style.color = this.config.labelColor;
        seperator.style.fontSize = "".concat(this.config.labelFontSize + 4, "px");
        seperator.style.fontFamily = this.config.labelFontFamily;
        seperator.style.fontWeight = "900";
        seperator.style.fontStyle = this.config.labelFontStyle;
        seperator.style.marginTop = "".concat(this.config.offset, "px");
        seperator.style.height = "fit-content";
        seperator.style.gridRow = "1";
        seperator.style.gridColumn = "2";
        background.appendChild(seperator);
        var status = document.createElement("p");
        status.innerText = this.state;
        status.style.background = this.config.labelBackground;
        status.style.padding = "\n        ".concat(this.config.offset, "px \n        ").concat(this.config.offset / 2, "px \n        ").concat(this.config.offset / 1.5, "px \n        ").concat(this.config.offset / 2, "px\n      ");
        status.style.color = this.config.labelColor;
        status.style.fontSize = "".concat(this.config.labelFontSize + 4, "px");
        status.style.fontFamily = this.config.labelFontFamily;
        status.style.fontWeight = this.config.labelFontWeight;
        status.style.fontStyle = this.config.labelFontStyle; // status.style.fontStyle = "italic"

        status.style.marginTop = "".concat(this.config.offset, "px");
        status.style.height = "fit-content";
        status.style.gridRow = "1";
        status.style.gridColumn = "3";
        background.appendChild(status);
      } // create description


      var descriptionBg = document.createElement("div");
      descriptionBg.style.gridRow = "2";
      descriptionBg.style.gridColumn = "1 / 4";
      descriptionBg.style.width = "fit-content";
      background.appendChild(descriptionBg);
      var description = document.createElement("p");
      description.innerText = this.description;
      description.style.background = this.config.detailsBackground;
      description.style.height = "".concat(this.config.maxTextHeight - label.clientHeight - this.config.offset * 2, "px");
      description.style.padding = "0 ".concat(this.config.offset * 1.5, "px");
      description.style.color = this.config.detailsColor;
      description.style.fontSize = "".concat(this.config.detailsFontSize, "px");
      description.style.fontFamily = this.config.detailsFontFamily;
      description.style.fontWeight = this.config.detailsFontWeight;
      description.style.fontStyle = this.config.detailsFontStyle;
      descriptionBg.appendChild(description);
      clamp(description, {
        clamp: "".concat(this.config.maxTextHeight - label.clientHeight - this.config.offset * 2, "px")
      });
      return text;
    }
  }, {
    key: "renderAsMin",
    value: function renderAsMin() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.initialX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.initialY;
      // create svg elements
      var svg = this.createSVGElement();
      var node = this.createNode();
      var icon = this.createIcon();
      var text = this.createLabel();
      svg.add(node);
      svg.add(icon);
      svg.add(text); // animate new elements into position

      svg.center(X, Y);
      node.center(X, Y).animate({
        duration: this.config.animationSpeed
      }).width(this.config.minWidth).height(this.config.minHeight).dmove(-this.config.minWidth / 2, -this.config.minHeight / 2);
      icon.center(X, Y).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: this.config.minIconOpacity
      }).size(this.config.minIconSize, this.config.minIconSize).dx(-this.config.minIconSize / 2 + this.config.minIconTranslateX).dy(-this.config.minIconSize / 2 + this.config.minIconTranslateY);
      text.size(this.config.minTextWidth, text.children()[0].node.clientHeight).center(X, Y).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1,
        translate: [this.config.minTextTranslateX, this.config.minTextTranslateY]
      });
      this.currentWidth = this.config.minWidth;
      this.currentHeight = this.config.minHeight;
      this.nodeSize = "min";
      this.currentX = X;
      this.currentY = Y;
      this.opacity = 1;
      this.isHidden = false;
      this.svg = svg;
    }
  }, {
    key: "renderAsMax",
    value: function renderAsMax() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.initialX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.initialY;
      // create svg elements
      var svg = this.createSVGElement();
      var node = this.createNode();
      var icon = this.createIcon();
      var text = this.createRiskDetails();
      svg.add(node);
      svg.add(icon);
      svg.add(text); // animate new elements into position

      svg.center(X, Y);
      node.center(X, Y).animate({
        duration: this.config.animationSpeed
      }).width(this.config.maxWidth).height(this.config.maxHeight).dmove(-this.config.maxWidth / 2, -this.config.maxHeight / 2);
      icon.center(X, Y).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: this.config.maxIconOpacity
      }).size(this.config.maxIconSize, this.config.maxIconSize).dx(-this.config.maxIconSize / 2 + this.config.maxIconTranslateX).dy(-this.config.maxIconSize / 2 + this.config.maxIconTranslateY);
      text.center(X, Y).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1,
        translate: [this.config.maxTextTranslateX, this.config.maxTextTranslateY]
      });
      this.currentWidth = this.config.maxWidth;
      this.currentHeight = this.config.maxHeight;
      this.nodeSize = "max";
      this.currentX = X;
      this.currentY = Y;
      this.opacity = 1;
      this.isHidden = false;
      this.svg = svg;
    }
  }, {
    key: "transformToMax",
    value: function transformToMax() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.finalX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.finalY;
      // update current elements
      this.svg.get(0).animate({
        duration: this.config.animationSpeed
      }).width(this.config.maxWidth).height(this.config.maxHeight).center(X, Y);
      this.svg.get(2).remove();
      this.svg.get(1).remove(); // create new elements

      var icon = this.createIcon();
      var text = this.createRiskDetails();
      this.svg.add(icon);
      this.svg.add(text); // put new elements into position

      icon.center(this.initialX, this.initialY).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: this.config.maxIconOpacity
      }).size(this.config.maxIconSize, this.config.maxIconSize).cx(X - this.config.maxIconSize / 2 + this.config.maxIconTranslateX + this.config.maxIconSize / 2).cy(Y - this.config.maxIconSize / 2 + this.config.maxIconTranslateY + this.config.maxIconSize / 2);
      text.center(this.initialX, this.initialY).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1,
        translate: [this.config.maxTextTranslateX, this.config.maxTextTranslateY]
      }).center(X, Y);
      this.currentWidth = this.config.minWidth;
      this.currentHeight = this.config.minHeight;
      this.nodeSize = "max";
      this.currentX = X;
      this.currentY = Y;
    }
  }, {
    key: "transformToMin",
    value: function transformToMin() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.finalX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.finalY;
      // update current elements
      this.svg.get(0).animate({
        duration: this.config.animationSpeed
      }).width(this.config.minWidth).height(this.config.minHeight).center(X, Y);
      this.svg.get(2).remove();
      this.svg.get(1).remove(); // create new elements

      var icon = this.createIcon();
      var text = this.createLabel();
      this.svg.add(icon);
      this.svg.add(text); // put new elements into position

      icon.center(X, Y).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: this.config.minIconOpacity
      }).size(this.config.minIconSize, this.config.minIconSize).dx(-this.config.minIconSize / 2 + this.config.minIconTranslateX).dy(-this.config.minIconSize / 2 + this.config.minIconTranslateY);
      text.size(this.config.minTextWidth, text.children()[0].node.clientHeight).center(X, Y).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1,
        translate: [this.config.minTextTranslateX, this.config.minTextTranslateY]
      });
      this.currentWidth = this.config.minWidth;
      this.currentHeight = this.config.minHeight;
      this.nodeSize = "min";
      this.currentX = X;
      this.currentY = Y;
    }
  }]);

  return RiskNode;
}(BaseNode);

/**
 * Default configuration for asset nodes
 * @typedef {AssetConfig} AssetConfig
 *
 * @param {Number} [maxWidth=350] The nodes maximal width
 * @param {Number} [maxHeight=225] The nodes maximal height
 * @param {Number} [minWidth=150] The nodes minimal width
 * @param {Number} [minHeight=80] The nodes minimal height
 *
 * @param {String} [iconUrl=null] The path to the image icon (if this value is null, the default icon is used)
 * @param {Number} [minIconOpacity=0.5] The basic visibility of the icon
 * @param {Number} [minIconSize=70] The width and height for the image icon
 * @param {Number} [minIconTranslateX=0] Moves the icon horizontally
 * @param {Number} [minIconTranslateY=0] Moves the icon vertically
 * @param {Number} [maxIconOpacity=0.75] The basic visibility of the icon
 * @param {Number} [maxIconSize=30] The width and height for the image icon
 * @param {Number} [maxIconTranslateX=-140] Moves the icon horizontally
 * @param {Number} [maxIconTranslateY=-85] Moves the icon vertically
 *
 * @param {Number} [offset=8] The spacing used by padding and margin
 * @param {Number} [animationSpeed=300] The animation in milliseconds
 * @param {Number} [borderRadius=5] The border radius
 * @param {Number} [borderStrokeWidth=1] The border stroke width
 * @param {String} [borderStrokeColor="#84a8f2"] The border color
 * @param {String} [borderStrokeDasharray="5"] Gaps inside border
 * @param {String} [backgroundColor="#ffffff"] The background color for the rendered node
 *
 * @param {Number} [minTextWidth=145] The minimal text width for the label
 * @param {Number} [minTextHeight=75] The minimal text height for the label
 * @param {Number} [minTextTranslateX=0] Moves the label horizontally
 * @param {Number} [minTextTranslateY=0] The the label vertically
 * @param {Number} [maxTextWidth=345] The maximal text width for the description
 * @param {Number} [maxTextHeight=220] The maximal text height for the description
 * @param {Number} [maxTextTranslateX=0] The the description horizontally
 * @param {Number} [maxTextTranslateY=0] The the description vertically
 * @param {String} [labelColor="#7fa5f5"] The label text color
 * @param {String} [labelFontFamily="Montserrat"] The label font family
 * @param {Number} [labelFontSize=16] The label font size
 * @param {Number} [labelFontWeight=600] The label font weight
 * @param {String} [labelFontStyle="normal"] The label font style
 * @param {String} [labelBackground="#ffffffcc"] The label background color
 * @param {String} [detailsColor="#7fa5f5"] The details text color
 * @param {String} [detailsFontFamily="Montserrat"] The details family
 * @param {Number} [detailsFontSize=12] The details font size
 * @param {Number} [detailsFontWeight=600] The details font weight
 * @param {String} [detailsFontStyle="normal"] The details font style
 * @param {String} [detailsBackground="#ffffff"] The details text background color
 */

var AssetConfig = {
  // large node
  maxWidth: 350,
  maxHeight: 225,
  // small node
  minWidth: 150,
  minHeight: 80,
  // icon
  iconUrl: null,
  minIconOpacity: 0.5,
  minIconSize: 70,
  minIconTranslateX: 0,
  minIconTranslateY: 0,
  maxIconOpacity: 0.75,
  maxIconSize: 30,
  maxIconTranslateX: -140,
  maxIconTranslateY: -85,
  // node
  offset: 8,
  animationSpeed: 300,
  borderRadius: 5,
  borderStrokeWidth: 1,
  borderStrokeColor: "#84a8f2",
  borderStrokeDasharray: "5",
  backgroundColor: "#ffffff",
  // text
  minTextWidth: 145,
  minTextHeight: 75,
  minTextTranslateX: 0,
  minTextTranslateY: 0,
  maxTextWidth: 345,
  maxTextHeight: 220,
  maxTextTranslateX: 0,
  maxTextTranslateY: 0,
  labelColor: "#7fa5f5",
  labelFontFamily: "Montserrat",
  labelFontSize: 16,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#ffffff",
  detailsColor: "#7fa5f5",
  detailsFontFamily: "Montserrat",
  detailsFontSize: 12,
  detailsFontWeight: 600,
  detailsFontStyle: "normal",
  detailsBackground: "#ffffff"
};
/**
 * Class representing the visualization of assets
 * @param {Data} data the raw node data
 * @param {Canvas} canvas the canvas to render the node on
 * @param {AssetConfig} customAssetConfig custom config to override default values
 *
 */

var AssetNode = /*#__PURE__*/function (_BaseNode) {
  _inherits(AssetNode, _BaseNode);

  function AssetNode(data, canvas, customAssetConfig) {
    var _this;

    _classCallCheck(this, AssetNode);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(AssetNode).call(this, data, canvas));
    _this.config = _objectSpread2({}, AssetConfig, {}, customAssetConfig);
    return _this;
  }

  _createClass(AssetNode, [{
    key: "createAssetDetails",
    value: function createAssetDetails() {
      var _this2 = this;

      var text = this.canvas.foreignObject(this.config.maxTextWidth, this.config.maxTextHeight);
      var background = document.createElement("div");
      text.add(background);
      background.style.width = "".concat(this.config.maxTextWidth, "px");
      background.style.height = "".concat(this.config.maxTextHeight, "px");
      background.style.display = "grid";
      background.style.gridTemplateColumns = "50% 50%";
      var labelBg = document.createElement("div");
      labelBg.style.gridColumn = "1 / 3";
      labelBg.style.display = "flex";
      labelBg.style.justifyContent = "center";
      background.appendChild(labelBg);
      var label = document.createElement("p");
      label.innerHTML = this.label;
      label.style.textAlign = "center";
      label.style.background = this.config.labelBackground;
      label.style.margin = "".concat(this.config.offset * 2, "px 0 ").concat(this.config.offset, "px");
      label.style.color = this.config.labelColor;
      label.style.fontSize = "".concat(this.config.labelFontSize + 4, "px");
      label.style.fontFamily = this.config.labelFontFamily;
      label.style.fontWeight = this.config.labelFontWeight;
      label.style.fontStyle = this.config.labelFontStyle;
      labelBg.appendChild(label);
      var descriptionBg = document.createElement("div");

      if (this.keyValuePairs.length === 0) {
        descriptionBg.style.gridRow = "2";
        descriptionBg.style.gridColumn = "1 / 3";
      }

      descriptionBg.style.overflow = "hidden";
      background.appendChild(descriptionBg);
      var description = document.createElement("p");
      description.style.background = this.config.detailsBackground;
      description.style.padding = "".concat(this.config.offset / 2, "px 0 ").concat(this.config.offset / 2, "px ").concat(this.config.offset, "px");
      description.style.color = this.config.detailsColor;
      description.style.fontSize = "".concat(this.config.detailsFontSize, "px");
      description.style.fontFamily = this.config.detailsFontFamily;
      description.style.fontWeight = this.config.detailsFontWeight;
      description.style.fontStyle = this.config.detailsFontStyle;
      description.innerText = this.description;
      descriptionBg.appendChild(description);
      var maxH = this.config.maxTextHeight - label.clientHeight - this.config.offset * 5;
      clamp(description, {
        clamp: "".concat(maxH, "px")
      });
      descriptionBg.style.height = "".concat(description.clientHeight - 2, "px");
      var kvBg = document.createElement("div");
      kvBg.style.overflow = "hidden";
      background.appendChild(kvBg);
      var kvH = 0;
      this.keyValuePairs.forEach(function (elem) {
        var key = document.createElement("p");
        key.innerText = "\u2022 ".concat(elem.key);
        key.style.color = _this2.config.detailsColor;
        key.style.fontSize = "".concat(_this2.config.detailsFontSize + 1, "px");
        key.style.fontFamily = _this2.config.detailsFontFamily;
        key.style.fontWeight = _this2.config.detailsFontWeight;
        key.style.fontStyle = _this2.config.detailsFontStyle;
        kvBg.appendChild(key);
        var value = document.createElement("p");
        value.innerText = "".concat(elem.value);
        value.style.color = _this2.config.detailsColor;
        value.style.fontSize = "".concat(_this2.config.detailsFontSize, "px");
        value.style.fontFamily = _this2.config.detailsFontFamily;
        value.style.fontWeight = _this2.config.detailsFontWeight - 200;
        value.style.fontStyle = _this2.config.detailsFontStyle;
        value.style.marginBottom = "".concat(_this2.config.offset / 2, "px");
        value.style.marginLeft = "".concat(_this2.config.offset, "px");
        kvBg.appendChild(value);
        kvH += key.clientHeight + value.clientHeight;

        if (kvH > maxH) {
          kvBg.removeChild(key);
          kvBg.removeChild(value);
        }
      });
      return text;
    }
  }, {
    key: "renderAsMin",
    value: function renderAsMin() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.initialX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.initialY;
      // create svg elements
      var svg = this.createSVGElement();
      var node = this.createNode();
      var icon = this.createIcon();
      var text = this.createLabel();
      svg.add(node);
      svg.add(icon);
      svg.add(text); // animate new elements into position

      svg.center(X, Y);
      node.center(X, Y).animate({
        duration: this.config.animationSpeed
      }).width(this.config.minWidth).height(this.config.minHeight).dmove(-this.config.minWidth / 2, -this.config.minHeight / 2);
      icon.center(X, Y).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: this.config.minIconOpacity
      }).size(this.config.minIconSize, this.config.minIconSize).dx(-this.config.minIconSize / 2 + this.config.minIconTranslateX).dy(-this.config.minIconSize / 2 + this.config.minIconTranslateY);
      text.size(this.config.minTextWidth, text.children()[0].node.clientHeight).center(X, Y).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1,
        translate: [this.config.minTextTranslateX, this.config.minTextTranslateY]
      });
      this.currentWidth = this.config.minWidth;
      this.currentHeight = this.config.minHeight;
      this.nodeSize = "min";
      this.currentX = X;
      this.currentY = Y;
      this.opacity = 1;
      this.isHidden = false;
      this.svg = svg;
    }
  }, {
    key: "renderAsMax",
    value: function renderAsMax() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.initialX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.initialY;
      // create svg elements
      var svg = this.createSVGElement();
      var node = this.createNode();
      var icon = this.createIcon();
      var text = this.createAssetDetails();
      svg.add(node);
      svg.add(icon);
      svg.add(text); // animate new elements into position

      svg.center(X, Y);
      node.center(X, Y).animate({
        duration: this.config.animationSpeed
      }).width(this.config.maxWidth).height(this.config.maxHeight).dmove(-this.config.maxWidth / 2, -this.config.maxHeight / 2);
      icon.center(X, Y).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: this.config.maxIconOpacity
      }).size(this.config.maxIconSize, this.config.maxIconSize).dx(-this.config.maxIconSize / 2 + this.config.maxIconTranslateX).dy(-this.config.maxIconSize / 2 + this.config.maxIconTranslateY);
      text.center(X, Y).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1,
        translate: [this.config.maxTextTranslateX, this.config.maxTextTranslateY]
      });
      this.currentWidth = this.config.maxWidth;
      this.currentHeight = this.config.maxHeight;
      this.nodeSize = "max";
      this.currentX = X;
      this.currentY = Y;
      this.opacity = 1;
      this.isHidden = false;
      this.svg = svg;
    }
  }, {
    key: "transformToMax",
    value: function transformToMax() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.finalX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.finalY;
      // update current elements
      this.svg.get(0).animate({
        duration: this.config.animationSpeed
      }).width(this.config.maxWidth).height(this.config.maxHeight).center(X, Y);
      this.svg.get(2).remove();
      this.svg.get(1).remove(); // create new elements

      var icon = this.createIcon();
      var text = this.createAssetDetails();
      this.svg.add(icon);
      this.svg.add(text); // put new elements into position

      icon.center(this.initialX, this.initialY).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: this.config.maxIconOpacity
      }).size(this.config.maxIconSize, this.config.maxIconSize).cx(X - this.config.maxIconSize / 2 + this.config.maxIconTranslateX + this.config.maxIconSize / 2).cy(Y - this.config.maxIconSize / 2 + this.config.maxIconTranslateY + this.config.maxIconSize / 2);
      text.center(this.initialX, this.initialY).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1,
        translate: [this.config.maxTextTranslateX, this.config.maxTextTranslateY]
      }).center(X, Y);
      this.currentWidth = this.config.minWidth;
      this.currentHeight = this.config.minHeight;
      this.nodeSize = "max";
      this.currentX = X;
      this.currentY = Y;
    }
  }, {
    key: "transformToMin",
    value: function transformToMin() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.finalX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.finalY;
      // update current elements
      this.svg.get(0).animate({
        duration: this.config.animationSpeed
      }).width(this.config.minWidth).height(this.config.minHeight).center(X, Y);
      this.svg.get(2).remove();
      this.svg.get(1).remove(); // create new elements

      var icon = this.createIcon();
      var text = this.createLabel();
      this.svg.add(icon);
      this.svg.add(text); // put new elements into position

      icon.center(this.initialX, this.initialY).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: this.config.minIconOpacity
      }).size(this.config.minIconSize, this.config.minIconSize).dx(-this.config.minIconSize / 2 + this.config.minIconTranslateX).dy(-this.config.minIconSize / 2 + this.config.minIconTranslateY).center(X, Y);
      text.center(this.initialX, this.initialY).size(this.config.minTextWidth, text.children()[0].node.clientHeight).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1,
        translate: [this.config.minTextTranslateX, this.config.minTextTranslateY]
      }).center(X, Y);
      this.currentWidth = this.config.minWidth;
      this.currentHeight = this.config.minHeight;
      this.nodeSize = "min";
      this.currentX = X;
      this.currentY = Y;
    }
  }]);

  return AssetNode;
}(BaseNode);

var defineProperty$b = objectDefineProperty.f;

var FunctionPrototype$1 = Function.prototype;
var FunctionPrototypeToString$1 = FunctionPrototype$1.toString;
var nameRE$1 = /^\s*function ([^ (]*)/;
var NAME$1 = 'name';

// Function instances `.name` property
// https://tc39.github.io/ecma262/#sec-function-instances-name
if (descriptors && !(NAME$1 in FunctionPrototype$1)) {
  defineProperty$b(FunctionPrototype$1, NAME$1, {
    configurable: true,
    get: function () {
      try {
        return FunctionPrototypeToString$1.call(this).match(nameRE$1)[1];
      } catch (error) {
        return '';
      }
    }
  });
}

/**
 * @typedef
 */

/**
 * Default configuration for requirement nodes
 * @typedef {RequirementConfig} RequirementConfig
 *
 * @param {Number} [maxWidth=370] The nodes maximal width
 * @param {Number} [maxHeight=200] The nodes maximal height
 * @param {Number} [minWidth=155] The nodes minimal width
 * @param {Number} [minHeight=50] The nodes minimal height
 *
 * @param {Object} state // TODO: create a proper type
 * @param {String} state.state A specific requirement state
 * @param {String} state.name The display name of a specific requirement state
 * @param {String} state.color The color attached to a specifc state
 * @param {Array} [states=Array[state]] An array of aviable requirement states
 *
 * @param {Number} [offset=8] The spacing used by padding and margin
 * @param {Number} [animationSpeed=300] The animation in milliseconds
 * @param {Number} [borderRadius=8] The border radius
 * @param {Number} [borderStrokeWidth=1] The border stroke width
 * @param {String} [borderStrokeColor="#666666"] The border color
 * @param {String} [borderStrokeDasharray="0"] Gaps inside border
 * @param {String} [backgroundColor="#ffffff"] The background color for the rendered node
 *
 * @param {Number} [minTextWidth=150] The minimal text width for the label
 * @param {Number} [minTextHeight=45] The minimal text height for the label
 * @param {Number} [minTextTranslateX=0] Moves the label horizontally
 * @param {Number} [minTextTranslateY=0] The the label vertically
 * @param {Number} [maxTextWidth=365] The maximal text width for the description
 * @param {Number} [maxTextHeight=195] The maximal text height for the description
 * @param {Number} [maxTextTranslateX=0] The the description horizontally
 * @param {Number} [maxTextTranslateY=0] The the description vertically
 * @param {String} [labelColor="#222222"] The label text color for details
 * @param {String} [labelColor="#ffffff"] The label text color for minimal nodes
 * @param {String} [labelFontFamily="Montserrat"] The label font family
 * @param {Number} [labelFontSize=14] The label font size
 * @param {Number} [labelFontWeight=600] The label font weight
 * @param {String} [labelFontStyle="normal"] The label font style
 * @param {String} [labelBackground="none"] The label background color
 * @param {String} [detailsColor="#222222"] The details text color
 * @param {String} [detailsFontFamily="Montserrat"] The details family
 * @param {Number} [detailsFontSize=12] The details font size
 * @param {Number} [detailsFontWeight=600] The details font weight
 * @param {String} [detailsFontStyle="normal"] The details font style
 * @param {String} [detailsBackground="none"] The details text background color
 */

var RequirementConfig = {
  // large node
  maxWidth: 370,
  maxHeight: 200,
  // small node
  minWidth: 155,
  minHeight: 50,
  // available node states
  states: [{
    state: "fulfilled",
    name: "Fulfilled",
    color: "#7ed167"
  }, {
    state: "partially-fulfilled",
    name: "Partially Fulfilled",
    color: "#ffc453"
  }, {
    state: "not-fulfilled",
    name: "Not Fulfilled",
    color: "#ff6655"
  }, {
    state: "Unknown State",
    name: "Unknown State",
    color: "#84a8f2"
  }],
  // node
  offset: 8,
  animationSpeed: 300,
  borderRadius: 8,
  borderStrokeWidth: 1,
  borderStrokeColor: "#666666",
  borderStrokeDasharray: "0",
  backgroundColor: "#ffffff",
  // text
  minTextWidth: 150,
  minTextHeight: 45,
  minTextTranslateX: 0,
  minTextTranslateY: 0,
  maxTextWidth: 365,
  maxTextHeight: 195,
  maxTextTranslateX: 0,
  maxTextTranslateY: 0,
  maxLabelColor: "#222222",
  labelColor: "#ffffff",
  labelFontFamily: "Montserrat",
  labelFontSize: 14,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "none",
  detailsColor: "#222222",
  detailsFontFamily: "Montserrat",
  detailsFontSize: 12,
  detailsFontWeight: 600,
  detailsFontStyle: "normal",
  detailsBackground: "none"
};
/**
 * Class representing the visualization of requirements
 * @param {Data} data the raw node data
 * @param {Canvas} canvas the canvas to render the node on
 * @param {RequirementConfig} customRequirementConfig custom config to override the default values
 *
 */

var RequirementNode = /*#__PURE__*/function (_BaseNode) {
  _inherits(RequirementNode, _BaseNode);

  function RequirementNode(data, canvas, customRequirementConfig) {
    var _this;

    _classCallCheck(this, RequirementNode);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(RequirementNode).call(this, data, canvas));
    _this.config = _objectSpread2({}, RequirementConfig, {}, customRequirementConfig); // map color to respected state

    if (data.state !== null || data.state !== undefined) {
      var state = _this.config.states.find(function (s) {
        return s.state === data.state;
      }) || {
        color: "#84a8f2"
      };
      _this.config = _objectSpread2({}, _this.config, {
        borderStrokeColor: state.color,
        backgroundColor: state.color
      });
    }

    return _this;
  }

  _createClass(RequirementNode, [{
    key: "createRequirementDetails",
    value: function createRequirementDetails() {
      var _this2 = this;

      var text = this.canvas.foreignObject(this.config.maxTextWidth, this.config.maxTextHeight);
      var background = document.createElement("div");
      background.style.display = "flex";
      background.style.flexDirection = "column";
      background.style.alignItems = "center";
      text.add(background); // create label

      var label = document.createElement("p");
      label.innerHTML = this.label;
      label.style.textAlign = "center";
      label.style.background = this.config.labelBackground;
      label.style.marginTop = "".concat(this.config.offset, "px");
      label.style.color = this.config.maxLabelColor;
      label.style.fontSize = "".concat(this.config.labelFontSize + 4, "px");
      label.style.fontFamily = this.config.labelFontFamily;
      label.style.fontWeight = this.config.labelFontWeight;
      label.style.fontStyle = this.config.labelFontStyle;
      background.appendChild(label); // create status, if any exists

      var status = document.createElement("p");

      if (this.state !== null) {
        status.innerHTML = this.config.states.find(function (s) {
          return s.state.toLowerCase() === _this2.state.toLowerCase();
        }).name;
        status.style.background = "#222";
        status.style.color = "#fff";
        status.style.fontSize = "".concat(this.config.labelFontSize + 2, "px");
        status.style.fontFamily = this.config.labelFontFamily;
        status.style.fontWeight = "normal";
        status.style.textAlign = "center";
        status.style.width = "fit-content";
        status.style.padding = "".concat(this.config.offset / 2, "px ").concat(this.config.offset / 1.5, "px");
        status.style.borderRadius = "".concat(this.config.borderRadius / 2, "px");
        status.style.margin = "".concat(this.config.offset, "px ").concat(this.config.offset, "px");
        background.appendChild(status);
      } // create description


      var descriptionBg = document.createElement("div");
      background.appendChild(descriptionBg);
      var description = document.createElement("p");
      description.style.background = this.config.detailsBackground;
      description.style.padding = "0 ".concat(this.config.offset, "px");
      description.style.margin = "0 ".concat(this.config.offset, "px ").concat(this.config.offset, "px ").concat(this.config.offset, "px");

      if (this.state === null) {
        description.style.marginTop = "".concat(this.config.offset, "px");
      }

      description.style.color = this.config.detailsColor;
      description.style.fontSize = "".concat(this.config.detailsFontSize, "px");
      description.style.fontFamily = this.config.detailsFontFamily;
      description.style.fontWeight = this.config.detailsFontWeight;
      description.style.fontStyle = this.config.detailsFontStyle;
      description.innerText = this.description;
      descriptionBg.appendChild(description);
      var h = this.config.maxTextHeight - label.clientHeight - status.clientHeight - this.config.offset * 3.5;
      clamp(description, {
        clamp: "".concat(h, "px")
      });
      return text;
    }
  }, {
    key: "renderAsMin",
    value: function renderAsMin() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.initialX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.initialY;
      // create svg elements
      var svg = this.createSVGElement();
      var node = this.createNode();
      var text = this.createLabel();
      svg.add(node);
      svg.add(text); // animate new elements into position

      svg.center(X, Y);
      node.center(X, Y).animate({
        duration: this.config.animationSpeed
      }).width(this.config.minWidth).height(this.config.minHeight).dmove(-this.config.minWidth / 2, -this.config.minHeight / 2);
      text.size(this.config.minTextWidth, text.children()[0].node.clientHeight).center(X, Y).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1,
        translate: [this.config.minTextTranslateX, this.config.minTextTranslateY]
      });
      this.currentWidth = this.config.minWidth;
      this.currentHeight = this.config.minHeight;
      this.nodeSize = "min";
      this.currentX = X;
      this.currentY = Y;
      this.opacity = 1;
      this.isHidden = false;
      this.svg = svg;
    }
  }, {
    key: "renderAsMax",
    value: function renderAsMax() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.initialX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.initialY;
      // create svg elements
      var svg = this.createSVGElement();
      var node = this.createNode();
      var text = this.createRequirementDetails();
      svg.add(node);
      svg.add(text); // animate new elements into position

      svg.center(X, Y);
      node.center(X, Y).animate({
        duration: this.config.animationSpeed
      }).width(this.config.maxWidth).height(this.config.maxHeight).dmove(-this.config.maxWidth / 2, -this.config.maxHeight / 2);
      text.center(X, Y).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1,
        translate: [this.config.maxTextTranslateX, this.config.maxTextTranslateY]
      });
      this.currentWidth = this.config.maxWidth;
      this.currentHeight = this.config.maxHeight;
      this.nodeSize = "max";
      this.currentX = X;
      this.currentY = Y;
      this.opacity = 1;
      this.isHidden = false;
      this.svg = svg;
    }
  }, {
    key: "transformToMax",
    value: function transformToMax() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.finalX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.finalY;
      // update current elements
      this.svg.get(0).animate({
        duration: this.config.animationSpeed
      }).width(this.config.maxWidth).height(this.config.maxHeight).center(X, Y);
      this.svg.get(1).remove(); // create new elements

      var text = this.createRequirementDetails();
      this.svg.add(text); // put new elements into position

      text.center(X, Y).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1,
        translate: [this.config.maxTextTranslateX, this.config.maxTextTranslateY]
      });
      this.currentWidth = this.config.minWidth;
      this.currentHeight = this.config.minHeight;
      this.nodeSize = "max";
      this.currentX = X;
      this.currentY = Y;
    }
  }, {
    key: "transformToMin",
    value: function transformToMin() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.finalX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.finalY;
      // update current elements
      this.svg.get(0).animate({
        duration: this.config.animationSpeed
      }).width(this.config.minWidth).height(this.config.minHeight).center(X, Y);
      this.svg.get(1).remove(); // create new elements

      var text = this.createLabel();
      this.svg.add(text); // put new elements into position

      text.size(this.config.minTextWidth, text.children()[0].node.clientHeight).center(X, Y).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1,
        translate: [this.config.minTextTranslateX, this.config.minTextTranslateY]
      });
      this.currentWidth = this.config.minWidth;
      this.currentHeight = this.config.minHeight;
      this.nodeSize = "min";
      this.currentX = X;
      this.currentY = Y;
    }
  }]);

  return RequirementNode;
}(BaseNode);

/**
 * Default configuration for asset nodes
 * @typedef {CustomConfig} CustomConfig
 *
 * @param {String} [nodeType="rect"] The form the node is rendered. "path" for a custom SVG element
 * @param {String} [svg=null] The custom SVG path that is rendered as node if nodeType is set to "path"
 *
 * @param {Number} [maxWidth=275] The nodes maximal width
 * @param {Number} [maxHeight=175] The nodes maximal height
 * @param {Number} [minWidth=150] The nodes minimal width
 * @param {Number} [minHeight=80] The nodes minimal height
 *
 * @param {String} [iconUrl=null] The path to the image icon (if this value is null, the default icon is used)
 * @param {Number} [minIconOpacity=0.3] The basic visibility of the icon
 * @param {Number} [minIconSize=70] The width and height for the image icon
 * @param {Number} [minIconTranslateX=0] Moves the icon horizontally
 * @param {Number} [minIconTranslateY=0] Moves the icon vertically
 * @param {Number} [maxIconOpacity=0.4] The basic visibility of the icon
 * @param {Number} [maxIconSize=200] The width and height for the image icon
 * @param {Number} [maxIconTranslateX=0] Moves the icon horizontally
 * @param {Number} [maxIconTranslateY=0] Moves the icon vertically
 *
 * @param {Number} [offset=8] The spacing used by padding and margin
 * @param {Number} [animationSpeed=300] The animation in milliseconds
 * @param {Number} [borderRadius=5] The border radius
 * @param {Number} [borderStrokeWidth=1] The border stroke width
 * @param {String} [borderStrokeColor="#222222"] The border color
 * @param {String} [borderStrokeDasharray="0"] Gaps inside border
 * @param {String} [backgroundColor="#ffffff"] The background color for the rendered node
 *
 * @param {Number} [minTextWidth=145] The minimal text width for the label
 * @param {Number} [minTextHeight=75] The minimal text height for the label
 * @param {Number} [minTextTranslateX=0] Moves the label horizontally
 * @param {Number} [minTextTranslateY=0] The the label vertically
 * @param {Number} [maxTextWidth=260] The maximal text width for the description
 * @param {Number} [maxTextHeight=220] The maximal text height for the description
 * @param {Number} [maxTextTranslateX=0] The the description horizontally
 * @param {Number} [maxTextTranslateY=0] The the description vertically
 * @param {String} [labelColor="#444444"] The label text color
 * @param {String} [labelFontFamily="Montserrat"] The label font family
 * @param {Number} [labelFontSize=16] The label font size
 * @param {Number} [labelFontWeight=600] The label font weight
 * @param {String} [labelFontStyle="normal"] The label font style
 * @param {String} [labelBackground="#ffffffcc"] The label background color
 * @param {String} [detailsColor="#444444"] The details text color
 * @param {String} [detailsFontFamily="Montserrat"] The details family
 * @param {Number} [detailsFontSize=12] The details font size
 * @param {Number} [detailsFontWeight=600] The details font weight
 * @param {String} [detailsFontStyle="normal"] The details font style
 * @param {String} [detailsBackground="#ffffff"] The details text background color
 *
 */

var CustomConfig = {
  nodeType: "rect",
  // rect or path
  svg: null,
  // large node
  maxWidth: 275,
  maxHeight: 175,
  // small node
  minWidth: 200,
  minHeight: 100,
  // icon
  iconUrl: null,
  minIconOpacity: 0.3,
  minIconSize: 70,
  minIconTranslateX: 0,
  minIconTranslateY: 0,
  maxIconOpacity: 0.4,
  maxIconSize: 200,
  maxIconTranslateX: 0,
  maxIconTranslateY: 0,
  // node
  offset: 8,
  animationSpeed: 300,
  borderRadius: 5,
  borderStrokeWidth: 1,
  borderStrokeColor: "#222222",
  borderStrokeDasharray: "0",
  backgroundColor: "#ffffff",
  // text
  minTextWidth: 145,
  minTextHeight: 75,
  minTextTranslateX: 0,
  minTextTranslateY: 0,
  maxTextWidth: 260,
  maxTextHeight: 220,
  maxTextTranslateX: 0,
  maxTextTranslateY: 0,
  labelColor: "#444444",
  labelFontFamily: "Montserrat",
  labelFontSize: 16,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#ffffffcc",
  detailsColor: "#444444",
  detailsFontFamily: "Montserrat",
  detailsFontSize: 12,
  detailsFontWeight: 600,
  detailsFontStyle: "normal",
  detailsBackground: "#ffffffcc"
};
/**
 * Class representing the visualization of custom elements
 * @param {Data} data the raw node data
 * @param {Canvas} canvas the canvas to render the node on
 * @param {CustomConfig} customConfig custom config to override the default values
 *
 * @example
 * // a custom node with a given svg shape
 * const config1 = {
 *    nodeType: "path",
 *    svg: "M 0, 0 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0",
 *    minTextWidth: 145,
 *    minIconSize: 100,
 *    minWidth: 150,
 *    minHeight: 150,
 *    maxTextWidth: 250,
 *    maxIconSize: 200,
 *    maxWidth: 300,
 *    maxHeight: 300,
 *    maxTextTranslateX: 5,
 *    maxTextTranslateY: -20
 * }
 * const custom1 = NodeFactory.create(data.find(d => d.type === "custom"), canvas)
 * custom1.setConfig(config1)
 * custom1.setInitialXY(200, 90)
 * custom1.renderAsMin()
 *
 * const custom2 = NodeFactory.create(data.find(d => d.type === "custom"), canvas)
 * custom2.setConfig(config1)
 * custom2.setInitialXY(200, 350)
 * custom2.renderAsMax()
 *
 * setTimeout(() => custom1.transformToMax(200, 350), 500)
 * setTimeout(() => custom2.transformToMin(200, 90), 500)
 *
 *
 * // or a normal custom node
 * const config2 = {
 *    maxWidth: 275,
 *    maxHeight: 175,
 *    maxIconSize: 150,
 *    maxTextWidth: 260,
 *    maxTextHeight: 175,
 *    maxTextTranslateX: 5,
 *    maxTextTranslateY: 2
 * }
 * const custom3 = NodeFactory.create(data.find(d => d.type === "custom"), canvas)
 * custom3.setConfig(config2)
 * custom3.setInitialXY(550, 110)
 * custom3.renderAsMax()
 *
 * const custom4 = NodeFactory.create(data.find(d => d.type === "custom"), canvas)
 * custom4.setConfig(config2)
 * custom4.setInitialXY(550, 350)
 * custom4.renderAsMin()
 *
 * setTimeout(() => custom4.transformToMax(550, 110), 500)
 * setTimeout(() => custom3.transformToMin(550, 350), 500)
 */

var CustomNode = /*#__PURE__*/function (_BaseNode) {
  _inherits(CustomNode, _BaseNode);

  function CustomNode(data, canvas, customConfig) {
    var _this;

    _classCallCheck(this, CustomNode);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(CustomNode).call(this, data, canvas));
    _this.config = _objectSpread2({}, CustomConfig, {}, customConfig);
    return _this;
  }

  _createClass(CustomNode, [{
    key: "createCustomDetails",
    value: function createCustomDetails() {
      var text = this.canvas.foreignObject(this.config.maxTextWidth, this.config.maxTextHeight);
      var background = document.createElement("div");
      background.style.width = "".concat(this.config.maxTextWidth, "px");
      background.style.height = "".concat(this.config.maxTextHeight, "px");
      background.style.display = "flex";
      background.style.flexDirection = "column";
      background.style.justifyContent = "center";
      background.style.alignItems = "center";
      text.add(background); // add label

      var label = document.createElement("p");
      label.innerText = this.label;
      label.style.padding = "".concat(this.config.offset * 1.5, "px ").concat(this.config.offset / 2, "px ").concat(this.config.offset / 2, "px 0px");
      label.style.color = this.config.labelColor;
      label.style.fontSize = "".concat(this.config.labelFontSize + 4, "px");
      label.style.fontFamily = this.config.labelFontFamily;
      label.style.fontWeight = this.config.labelFontWeight;
      label.style.fontStyle = this.config.labelFontStyle;
      label.style.textAlign = "center";
      label.style.background = this.config.detailsBackground;
      label.style.width = "fit-content";
      background.appendChild(label); // add description

      var descriptionBg = document.createElement("div");
      descriptionBg.style.overflow = "hidden";
      descriptionBg.style.margin = "".concat(this.config.offset, "px ").concat(this.config.offset, "px ").concat(this.config.offset, "px 0");
      background.appendChild(descriptionBg);
      var description = document.createElement("p");
      description.innerText = this.description;
      description.style.color = this.config.detailsColor;
      description.style.fontSize = "".concat(this.config.detailsFontSize, "px");
      description.style.fontFamily = this.config.detailsFontFamily;
      description.style.fontWeight = this.config.detailsFontWeight;
      description.style.fontStyle = this.config.detailsFontStyle;
      description.style.background = this.config.detailsBackground;
      description.style.width = "fit-content";
      descriptionBg.appendChild(description); // fix overflow text

      clamp(description, {
        clamp: "".concat(this.config.maxTextHeight - label.clientHeight - this.config.offset * 2.5, "px")
      });
      return text;
    }
  }, {
    key: "renderAsMin",
    value: function renderAsMin() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.initialX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.initialY;
      // create svg elements
      var svg = this.createSVGElement();
      var node = this.createNode();
      var icon = this.createIcon(); // FIXME: by loading the icon, on sometimes the icon is not in the correct position

      var text = this.createLabel();
      svg.add(node);
      svg.add(icon);
      svg.add(text); // animate new elements into position

      svg.center(X, Y);

      if (this.config.nodeType === "path") {
        node.center(X, Y).scale(0.001).animate({
          duration: this.config.animationSpeed
        }).transform({
          scale: 1
        });
      } else {
        node.center(X, Y).animate({
          duration: this.config.animationSpeed
        }).width(this.config.minWidth).height(this.config.minHeight).dmove(-this.config.minWidth / 2, -this.config.minHeight / 2);
      }

      icon.center(X, Y).size(0, 0).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: this.config.minIconOpacity
      }).size(this.config.minIconSize, this.config.minIconSize).dx(-this.config.minIconSize / 2 + this.config.minIconTranslateX).dy(-this.config.minIconSize / 2 + this.config.minIconTranslateY);
      text.center(X, Y).size(this.config.minTextWidth, text.children()[0].node.clientHeight).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1,
        translate: [this.config.minTextTranslateX, this.config.minTextTranslateY]
      });
      this.currentWidth = this.config.minWidth;
      this.currentHeight = this.config.minHeight;
      this.nodeSize = "min";
      this.currentX = X;
      this.currentY = Y;
      this.opacity = 1;
      this.isHidden = false;
      this.svg = svg;
    }
  }, {
    key: "renderAsMax",
    value: function renderAsMax() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.initialX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.initialY;
      // create svg elements
      var svg = this.createSVGElement();
      var node = this.createNode();
      var icon = this.createIcon();
      var text = this.createCustomDetails();
      svg.add(node);
      svg.add(icon);
      svg.add(text); // animate new elements into position

      svg.center(X, Y);

      if (this.config.nodeType === "path") {
        node.center(X, Y).animate({
          duration: this.config.animationSpeed
        }).width(this.config.maxWidth).height(this.config.maxHeight).dmove(-this.config.maxWidth / 4, -this.config.maxHeight / 4);
      } else {
        node.center(X, Y).animate({
          duration: this.config.animationSpeed
        }).width(this.config.maxWidth).height(this.config.maxHeight).dmove(-this.config.maxWidth / 2, -this.config.maxHeight / 2);
      }

      icon.size(0, 0).center(X, Y).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: this.config.maxIconOpacity
      }).size(this.config.maxIconSize, this.config.maxIconSize).dx(-this.config.maxIconSize / 2 + this.config.maxIconTranslateX).dy(-this.config.maxIconSize / 2 + this.config.maxIconTranslateY);
      text.size(this.config.maxTextWidth, text.children()[0].node.clientHeight).center(X, Y).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1,
        translate: [this.config.maxTextTranslateX, this.config.maxTextTranslateY]
      });
      this.currentWidth = this.config.maxWidth;
      this.currentHeight = this.config.maxHeight;
      this.nodeSize = "max";
      this.currentX = X;
      this.currentY = Y;
      this.opacity = 1;
      this.isHidden = false;
      this.svg = svg;
    }
  }, {
    key: "transformToMax",
    value: function transformToMax() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.finalX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.finalY;
      // update current elements
      this.svg.get(0).animate({
        duration: this.config.animationSpeed
      }).width(this.config.maxWidth).height(this.config.maxHeight).center(X, Y);
      this.svg.get(2).remove();
      this.svg.get(1).remove(); // create new elements

      var icon = this.createIcon();
      var text = this.createCustomDetails();
      this.svg.add(icon);
      this.svg.add(text); // put new elements into position

      icon.size(0, 0).center(this.initialX, this.initialY).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: this.config.maxIconOpacity
      }).size(this.config.maxIconSize, this.config.maxIconSize).cx(X - this.config.maxIconSize / 2 + this.config.maxIconTranslateX + this.config.maxIconSize / 2).cy(Y - this.config.maxIconSize / 2 + this.config.maxIconTranslateY + this.config.maxIconSize / 2);
      text.center(this.initialX, this.initialY).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1,
        translate: [this.config.maxTextTranslateX, this.config.maxTextTranslateY]
      }).center(X, Y);
      this.currentWidth = this.config.minWidth;
      this.currentHeight = this.config.minHeight;
      this.nodeSize = "max";
      this.currentX = X;
      this.currentY = Y;
    }
  }, {
    key: "transformToMin",
    value: function transformToMin() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.finalX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.finalY;
      // update current elements
      this.svg.get(0).animate({
        duration: this.config.animationSpeed
      }).width(this.config.minWidth).height(this.config.minHeight).center(X, Y);
      this.svg.get(2).remove();
      this.svg.get(1).remove(); // create new elements

      var icon = this.createIcon();
      var text = this.createLabel();
      this.svg.add(icon);
      this.svg.add(text); // put new elements into position

      icon.center(this.initialX, this.initialY).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: this.config.minIconOpacity
      }).size(this.config.minIconSize, this.config.minIconSize).dx(-this.config.minIconSize / 2 + this.config.minIconTranslateX).dy(-this.config.minIconSize / 2 + this.config.minIconTranslateY).center(X, Y);
      text.center(this.initialX, this.initialY).size(this.config.minTextWidth, text.children()[0].node.clientHeight).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1,
        translate: [this.config.minTextTranslateX, this.config.minTextTranslateY]
      }).center(X, Y);
      this.currentWidth = this.config.minWidth;
      this.currentHeight = this.config.minHeight;
      this.nodeSize = "min";
      this.currentX = X;
      this.currentY = Y;
    }
  }]);

  return CustomNode;
}(BaseNode);

/**
 * Default configuration for asset nodes
 * @typedef {ControlConfig} ControlConfig
 *
 * @param {Number} [maxWidth=400] The nodes maximal width
 * @param {Number} [maxHeight=190] The nodes maximal height
 * @param {Number} [minWidth=150] The nodes minimal width
 * @param {Number} [minHeight=80] The nodes minimal height
 *
 * @param {String} [iconUrl=null] The path to the image icon (if this value is null, the default icon is used)
 * @param {Number} [minIconOpacity=0.5] The basic visibility of the icon
 * @param {Number} [minIconSize=64] The width and height for the image icon
 * @param {Number} [minIconTranslateX=0] Moves the icon horizontally
 * @param {Number} [minIconTranslateY=0] Moves the icon vertically
 * @param {Number} [maxIconOpacity=0.75] The basic visibility of the icon
 * @param {Number} [maxIconSize=180] The width and height for the image icon
 * @param {Number} [maxIconTranslateX=-100] Moves the icon horizontally
 * @param {Number} [maxIconTranslateY=0] Moves the icon vertically
 *
 * @param {Number} [offset=8] The spacing used by padding and margin
 * @param {Number} [animationSpeed=300] The animation in milliseconds
 * @param {Number} [borderRadius=5] The border radius
 * @param {Number} [borderStrokeWidth=1] The border stroke width
 * @param {String} [borderStrokeColor="#7daed6"] The border color
 * @param {String} [borderStrokeDasharray="0"] Gaps inside border
 * @param {String} [backgroundColor="#ffffff"] The background color for the rendered node
 *
 * @param {Number} [minTextWidth=145] The minimal text width for the label
 * @param {Number} [minTextHeight=75] The minimal text height for the label
 * @param {Number} [minTextTranslateX=0] Moves the label horizontally
 * @param {Number} [minTextTranslateY=0] The the label vertically
 * @param {Number} [maxTextWidth=395] The maximal text width for the description
 * @param {Number} [maxTextHeight=185] The maximal text height for the description
 * @param {Number} [maxTextTranslateX=100] The the description horizontally
 * @param {Number} [maxTextTranslateY=0] The the description vertically
 * @param {String} [labelColor="#5b91b5"] The label text color
 * @param {String} [labelFontFamily="Montserrat"] The label font family
 * @param {Number} [labelFontSize=16] The label font size
 * @param {Number} [labelFontWeight=600] The label font weight
 * @param {String} [labelFontStyle="normal"] The label font style
 * @param {String} [labelBackground="#ffffffcc"] The label background color
 * @param {String} [detailsColor="#5b91b5"] The details text color
 * @param {String} [detailsFontFamily="Montserrat"] The details family
 * @param {Number} [detailsFontSize=12] The details font size
 * @param {Number} [detailsFontWeight=600] The details font weight
 * @param {String} [detailsFontStyle="normal"] The details font style
 * @param {String} [detailsBackground="#ffffff"] The details text background color
 */

var ControlConfig = {
  // large node
  maxWidth: 400,
  maxHeight: 190,
  // small node
  minWidth: 150,
  minHeight: 80,
  // icon
  iconUrl: null,
  minIconOpacity: 0.5,
  minIconSize: 64,
  minIconTranslateX: 0,
  minIconTranslateY: 0,
  maxIconOpacity: 0.75,
  maxIconSize: 180,
  maxIconTranslateX: -100,
  maxIconTranslateY: 0,
  // node
  offset: 8,
  animationSpeed: 300,
  borderRadius: 5,
  borderStrokeWidth: 1,
  borderStrokeColor: "#7daed6",
  borderStrokeDasharray: "0",
  backgroundColor: "#ffffff",
  // text
  minTextWidth: 145,
  minTextHeight: 75,
  minTextTranslateX: 0,
  minTextTranslateY: 0,
  maxTextWidth: 395,
  maxTextHeight: 185,
  maxTextTranslateX: 100,
  maxTextTranslateY: 0,
  labelColor: "#5b91b5",
  labelFontFamily: "Montserrat",
  labelFontSize: 16,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#ffffffcc",
  detailsColor: "#5b91b5",
  detailsFontFamily: "Montserrat",
  detailsFontSize: 12,
  detailsFontWeight: 600,
  detailsFontStyle: "normal",
  detailsBackground: "#ffffff"
};
/**
 * Class representing the visualization of controls
 * @param {Data} data the raw node data
 * @param {Canvas} canvas the canvas to render the node on
 * @param {ControlConfig} customControlConfig custom config to override default values
 *
 */

var ControlNode = /*#__PURE__*/function (_BaseNode) {
  _inherits(ControlNode, _BaseNode);

  function ControlNode(data, canvas, customControlConfig) {
    var _this;

    _classCallCheck(this, ControlNode);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ControlNode).call(this, data, canvas));
    _this.config = _objectSpread2({}, ControlConfig, {}, customControlConfig);
    return _this;
  }

  _createClass(ControlNode, [{
    key: "createControlDetails",
    value: function createControlDetails() {
      var text = this.canvas.foreignObject(this.config.maxTextWidth / 2, this.config.maxTextHeight);
      var background = document.createElement("div");
      background.style.width = "".concat(this.config.maxTextWidth / 2, "px");
      background.style.height = "".concat(this.config.maxTextHeight, "px");
      text.add(background); // add label

      var label = document.createElement("p");
      label.innerText = this.label;
      label.style.padding = "".concat(this.config.offset * 1.5, "px ").concat(this.config.offset / 2, "px ").concat(this.config.offset / 2, "px 0px");
      label.style.color = this.config.labelColor;
      label.style.fontSize = "".concat(this.config.labelFontSize + 4, "px");
      label.style.fontFamily = this.config.labelFontFamily;
      label.style.fontWeight = this.config.labelFontWeight;
      label.style.fontStyle = this.config.labelFontStyle;
      label.style.textAlign = "left";
      background.appendChild(label); // add description

      var descriptionBg = document.createElement("div");
      descriptionBg.style.overflow = "hidden";
      descriptionBg.style.margin = "".concat(this.config.offset, "px ").concat(this.config.offset, "px ").concat(this.config.offset, "px 0");
      background.appendChild(descriptionBg);
      var description = document.createElement("p");
      description.innerText = this.description;
      description.style.color = this.config.detailsColor;
      description.style.fontSize = "".concat(this.config.detailsFontSize, "px");
      description.style.fontFamily = this.config.detailsFontFamily;
      description.style.fontWeight = this.config.detailsFontWeight;
      description.style.fontStyle = this.config.detailsFontStyle;
      descriptionBg.appendChild(description); // fix overflow text

      clamp(description, {
        clamp: "".concat(this.config.maxTextHeight - label.clientHeight - this.config.offset * 2.5, "px")
      });
      return text;
    }
  }, {
    key: "renderAsMin",
    value: function renderAsMin() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.initialX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.initialY;
      // create svg elements
      var svg = this.createSVGElement();
      var node = this.createNode();
      var icon = this.createIcon();
      var text = this.createLabel();
      svg.add(node);
      svg.add(icon);
      svg.add(text); // animate new elements into position

      svg.center(X, Y);
      node.center(X, Y).animate({
        duration: this.config.animationSpeed
      }).width(this.config.minWidth).height(this.config.minHeight).dmove(-this.config.minWidth / 2, -this.config.minHeight / 2);
      icon.center(X, Y).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: this.config.minIconOpacity
      }).size(this.config.minIconSize, this.config.minIconSize).dx(-this.config.minIconSize / 2 + this.config.minIconTranslateX).dy(-this.config.minIconSize / 2 + this.config.minIconTranslateY);
      text.size(this.config.minTextWidth, text.children()[0].node.clientHeight).center(X, Y).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1,
        translate: [this.config.minTextTranslateX, this.config.minTextTranslateY]
      });
      this.currentWidth = this.config.minWidth;
      this.currentHeight = this.config.minHeight;
      this.nodeSize = "min";
      this.currentX = X;
      this.currentY = Y;
      this.opacity = 1;
      this.isHidden = false;
      this.svg = svg;
    }
  }, {
    key: "renderAsMax",
    value: function renderAsMax() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.initialX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.initialY;
      // create svg elements
      var svg = this.createSVGElement();
      var node = this.createNode();
      var icon = this.createIcon();
      var text = this.createControlDetails();
      svg.add(node);
      svg.add(icon);
      svg.add(text); // animate new elements into position

      svg.center(X, Y);
      node.center(X, Y).animate({
        duration: this.config.animationSpeed
      }).width(this.config.maxWidth).height(this.config.maxHeight).dmove(-this.config.maxWidth / 2, -this.config.maxHeight / 2);
      icon.center(X, Y).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: this.config.maxIconOpacity
      }).size(this.config.maxIconSize, this.config.maxIconSize).dx(-this.config.maxIconSize / 2 + this.config.maxIconTranslateX).dy(-this.config.maxIconSize / 2 + this.config.maxIconTranslateY);
      text.center(X, Y).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1,
        translate: [this.config.maxTextTranslateX, this.config.maxTextTranslateY]
      });
      this.currentWidth = this.config.maxWidth;
      this.currentHeight = this.config.maxHeight;
      this.nodeSize = "max";
      this.currentX = X;
      this.currentY = Y;
      this.opacity = 1;
      this.isHidden = false;
      this.svg = svg;
    }
  }, {
    key: "transformToMax",
    value: function transformToMax() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.finalX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.finalY;
      // update current elements
      this.svg.get(0).animate({
        duration: this.config.animationSpeed
      }).width(this.config.maxWidth).height(this.config.maxHeight).center(X, Y);
      this.svg.get(2).remove();
      this.svg.get(1).remove(); // create new elements

      var icon = this.createIcon();
      var text = this.createControlDetails();
      this.svg.add(icon);
      this.svg.add(text); // put new elements into position

      icon.center(this.initialX, this.initialY).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: this.config.maxIconOpacity
      }).size(this.config.maxIconSize, this.config.maxIconSize).cx(X - this.config.maxIconSize / 2 + this.config.maxIconTranslateX + this.config.maxIconSize / 2).cy(Y - this.config.maxIconSize / 2 + this.config.maxIconTranslateY + this.config.maxIconSize / 2);
      text.center(this.initialX, this.initialY).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1,
        translate: [this.config.maxTextTranslateX, this.config.maxTextTranslateY]
      }).center(X, Y);
      this.currentWidth = this.config.minWidth;
      this.currentHeight = this.config.minHeight;
      this.nodeSize = "max";
      this.currentX = X;
      this.currentY = Y;
    }
  }, {
    key: "transformToMin",
    value: function transformToMin() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.finalX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.finalY;
      // update current elements
      this.svg.get(0).animate({
        duration: this.config.animationSpeed
      }).width(this.config.minWidth).height(this.config.minHeight).center(X, Y);
      this.svg.get(2).remove();
      this.svg.get(1).remove(); // create new elements

      var icon = this.createIcon();
      var text = this.createLabel();
      this.svg.add(icon);
      this.svg.add(text); // put new elements into position

      icon.center(this.initialX, this.initialY).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: this.config.minIconOpacity
      }).size(this.config.minIconSize, this.config.minIconSize).dx(-this.config.minIconSize / 2 + this.config.minIconTranslateX).dy(-this.config.minIconSize / 2 + this.config.minIconTranslateY).center(X, Y);
      text.center(this.initialX, this.initialY).size(this.config.minTextWidth, text.children()[0].node.clientHeight).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1,
        translate: [this.config.minTextTranslateX, this.config.minTextTranslateY]
      }).center(X, Y);
      this.currentWidth = this.config.minWidth;
      this.currentHeight = this.config.minHeight;
      this.nodeSize = "min";
      this.currentX = X;
      this.currentY = Y;
    }
  }]);

  return ControlNode;
}(BaseNode);

var Point2D_1 = createCommonjsModule(function (module) {
/**
 *
 *   Point2D.js
 *
 *   copyright 2001-2002, 2013 Kevin Lindsey
 *
 */

/**
 *  Point2D
 *
 *  @param {Number} x
 *  @param {Number} y
 *  @returns {Point2D}
 */
function Point2D(x, y) {
    Object.defineProperties(this, {
        "x": {
            value: x,
            writable: false,
            enumerable: true,
            configurable: false
        },
        "y": {
            value: y,
            writable: false,
            enumerable: true,
            configurable: false
        }
    });
    // this.x = x;
    // this.y = y;
}

/**
 *  clone
 *
 *  @returns {Point2D}
 */
Point2D.prototype.clone = function() {
    return new this.constructor(this.x, this.y);
};

/**
 *  add
 *
 *  @param {Point2D|Vector2D} that
 *  @returns {Point2D}
 */
Point2D.prototype.add = function(that) {
    return new this.constructor(this.x+that.x, this.y+that.y);
};

/**
 *  subtract
 *
 *  @param { Vector2D | Point2D } that
 *  @returns {Point2D}
 */
Point2D.prototype.subtract = function(that) {
    return new this.constructor(this.x-that.x, this.y-that.y);
};

/**
 *  multiply
 *
 *  @param {Number} scalar
 *  @returns {Point2D}
 */
Point2D.prototype.multiply = function(scalar) {
    return new this.constructor(this.x*scalar, this.y*scalar);
};

/**
 *  divide
 *
 *  @param {Number} scalar
 *  @returns {Point2D}
 */
Point2D.prototype.divide = function(scalar) {
    return new this.constructor(this.x/scalar, this.y/scalar);
};

/**
 *  equals
 *
 *  @param {Point2D} that
 *  @returns {Boolean}
 */
Point2D.prototype.equals = function(that) {
    return ( this.x === that.x && this.y === that.y );
};

// utility methods

/**
 *  lerp
 *
 *  @param { Vector2D | Point2D } that
 *  @param {Number} t
 @  @returns {Point2D}
 */
Point2D.prototype.lerp = function(that, t) {
    var omt = 1.0 - t;

    return new this.constructor(
        this.x * omt + that.x * t,
        this.y * omt + that.y * t
    );
};

/**
 *  distanceFrom
 *
 *  @param {Point2D} that
 *  @returns {Number}
 */
Point2D.prototype.distanceFrom = function(that) {
    var dx = this.x - that.x;
    var dy = this.y - that.y;

    return Math.sqrt(dx*dx + dy*dy);
};

/**
 *  min
 *
 *  @param {Point2D} that
 *  @returns {Number}
 */
Point2D.prototype.min = function(that) {
    return new this.constructor(
        Math.min( this.x, that.x ),
        Math.min( this.y, that.y )
    );
};

/**
 *  max
 *
 *  @param {Point2D} that
 *  @returns {Number}
 */
Point2D.prototype.max = function(that) {
    return new this.constructor(
        Math.max( this.x, that.x ),
        Math.max( this.y, that.y )
    );
};

/**
 *  transform
 *
 *  @param {Matrix2D}
 *  @result {Point2D}
 */
Point2D.prototype.transform = function(matrix) {
    return new this.constructor(
        matrix.a * this.x + matrix.c * this.y + matrix.e,
        matrix.b * this.x + matrix.d * this.y + matrix.f
    );
};

/**
 *  toString
 *
 *  @returns {String}
 */
Point2D.prototype.toString = function() {
    return "point(" + this.x + "," + this.y + ")";
};

{
    module.exports = Point2D;
}
});

var Vector2D_1 = createCommonjsModule(function (module) {
/**
 *
 *   Vector2D.js
 *
 *   copyright 2001-2002, 2013 Kevin Lindsey
 *
 */

/**
 *  Vector2D
 *
 *  @param {Number} x
 *  @param {Number} y
 *  @returns {Vector2D}
 */
function Vector2D(x, y) {
    Object.defineProperties(this, {
        "x": {
            value: x,
            writable: false,
            enumerable: true,
            configurable: false
        },
        "y": {
            value: y,
            writable: false,
            enumerable: true,
            configurable: false
        }
    });
    // this.x = x;
    // this.y = y;
}

/**
 *  fromPoints
 *
 *  @param {Point2D} p1
 *  @param {Point2D} p2
 *  @returns {Vector2D}
 */
Vector2D.fromPoints = function(p1, p2) {
    return new Vector2D(
        p2.x - p1.x,
        p2.y - p1.y
    );
};

/**
 *  length
 *
 *  @returns {Number}
 */
Vector2D.prototype.length = function() {
    return Math.sqrt(this.x*this.x + this.y*this.y);
};

/**
 *  magnitude
 *
 *  @returns {Number}
 */
Vector2D.prototype.magnitude = function() {
    return this.x*this.x + this.y*this.y;
};

/**
 *  dot
 *
 *  @param {Vector2D} that
 *  @returns {Number}
 */
Vector2D.prototype.dot = function(that) {
    return this.x*that.x + this.y*that.y;
};

/**
 *  cross
 *
 *  @param {Vector2D} that
 *  @returns {Number}
 */
Vector2D.prototype.cross = function(that) {
    return this.x*that.y - this.y*that.x;
};

/**
 *  determinant
 *
 *  @param {Vector2D} that
 *  @returns {Number}
 */
Vector2D.prototype.determinant = function(that) {
    return this.x*that.y - this.y*that.x;
};

/**
 *  unit
 *
 *  @returns {Vector2D}
 */
Vector2D.prototype.unit = function() {
    return this.divide( this.length() );
};

/**
 *  add
 *
 *  @param {Vector2D} that
 *  @returns {Vector2D}
 */
Vector2D.prototype.add = function(that) {
    return new this.constructor(this.x + that.x, this.y + that.y);
};

/**
 *  subtract
 *
 *  @param {Vector2D} that
 *  @returns {Vector2D}
 */
Vector2D.prototype.subtract = function(that) {
    return new this.constructor(this.x - that.x, this.y - that.y);
};

/**
 *  multiply
 *
 *  @param {Number} scalar
 *  @returns {Vector2D}
 */
Vector2D.prototype.multiply = function(scalar) {
    return new this.constructor(this.x * scalar, this.y * scalar);
};

/**
 *  divide
 *
 *  @param {Number} scalar
 *  @returns {Vector2D}
 */
Vector2D.prototype.divide = function(scalar) {
    return new this.constructor(this.x / scalar, this.y / scalar);
};

/**
 *  angleBetween
 *
 *  @param {Vector2D} that
 *  @returns {Number}
 */
Vector2D.prototype.angleBetween = function(that) {
    var cos = this.dot(that) / (this.length() * that.length());
    cos = Math.max(-1, Math.min(cos, 1));
    var radians = Math.acos(cos);

    return (this.cross(that) < 0.0) ? -radians : radians;
};

/**
 *  Find a vector is that is perpendicular to this vector
 *
 *  @returns {Vector2D}
 */
Vector2D.prototype.perp = function() {
    return new this.constructor(-this.y, this.x);
};

/**
 *  Find the component of the specified vector that is perpendicular to
 *  this vector
 *
 *  @param {Vector2D} that
 *  @returns {Vector2D}
 */
Vector2D.prototype.perpendicular = function(that) {
    return this.subtract(this.project(that));
};

/**
 *  project
 *
 *  @param {Vector2D} that
 *  @returns {Vector2D}
 */
Vector2D.prototype.project = function(that) {
    var percent = this.dot(that) / that.dot(that);

    return that.multiply(percent);
};

/**
 *  transform
 *
 *  @param {Matrix2D}
 *  @returns {Vector2D}
 */
Vector2D.prototype.transform = function(matrix) {
    return new this.constructor(
        matrix.a * this.x + matrix.c * this.y,
        matrix.b * this.x + matrix.d * this.y
    );
};

/**
 *  equals
 *
 *  @param {Vector2D} that
 *  @returns {Boolean}
 */
Vector2D.prototype.equals = function(that) {
    return (
        this.x === that.x &&
        this.y === that.y
    );
};

/**
 *  toString
 *
 *  @returns {String}
 */
Vector2D.prototype.toString = function() {
    return "vector(" + this.x + "," + this.y + ")";
};

{
    module.exports = Vector2D;
}
});

var Matrix2D_1 = createCommonjsModule(function (module) {
/**
 *   Matrix2D.js
 *
 *   copyright 2001-2002, 2013 Kevin Lindsey
 */

/**
 *  Matrix2D
 *
 *  [a c e]
 *  [b d f]
 *  [0 0 1]
 *
 *  @param {Number} a
 *  @param {Number} b
 *  @param {Number} c
 *  @param {Number} d
 *  @param {Number} e
 *  @param {Number} f
 *  @returns {Matrix2D}
 */
function Matrix2D(a, b, c, d, e, f) {
    Object.defineProperties(this, {
        "a": {
            value: (a !== undefined) ? a : 1,
            writable: false,
            enumerable: true,
            configurable: false
        },
        "b": {
            value: (b !== undefined) ? b : 0,
            writable: false,
            enumerable: true,
            configurable: false
        },
        "c": {
            value: (c !== undefined) ? c : 0,
            writable: false,
            enumerable: true,
            configurable: false
        },
        "d": {
            value: (d !== undefined) ? d : 1,
            writable: false,
            enumerable: true,
            configurable: false
        },
        "e": {
            value: (e !== undefined) ? e : 0,
            writable: false,
            enumerable: true,
            configurable: false
        },
        "f": {
            value: (f !== undefined) ? f : 0,
            writable: false,
            enumerable: true,
            configurable: false
        }
    });
}

/**
 *  Identity matrix
 *
 *  @returns {Matrix2D}
 */
// TODO: consider using Object#defineProperty to make this read-only
Matrix2D.IDENTITY = new Matrix2D(1, 0, 0, 1, 0, 0);
Matrix2D.IDENTITY.isIdentity = function () { return true; };

/**
 *  multiply
 *
 *  @pararm {Matrix2D} that
 *  @returns {Matrix2D}
 */
Matrix2D.prototype.multiply = function (that) {
    if (this.isIdentity()) {
        return that;
    }

    if (that.isIdentity()) {
        return this;
    }

    return new this.constructor(
        this.a * that.a + this.c * that.b,
        this.b * that.a + this.d * that.b,
        this.a * that.c + this.c * that.d,
        this.b * that.c + this.d * that.d,
        this.a * that.e + this.c * that.f + this.e,
        this.b * that.e + this.d * that.f + this.f
    );
};

/**
 *  inverse
 *
 *  @returns {Matrix2D}
 */
Matrix2D.prototype.inverse = function () {
    if (this.isIdentity()) {
        return this;
    }

    var det1 = this.a * this.d - this.b * this.c;

    if ( det1 === 0.0 ) {
        throw("Matrix is not invertible");
    }

    var idet = 1.0 / det1;
    var det2 = this.f * this.c - this.e * this.d;
    var det3 = this.e * this.b - this.f * this.a;

    return new this.constructor(
        this.d * idet,
       -this.b * idet,
       -this.c * idet,
        this.a * idet,
          det2 * idet,
          det3 * idet
    );
};

/**
 *  translate
 *
 *  @param {Number} tx
 *  @param {Number} ty
 *  @returns {Matrix2D}
 */
Matrix2D.prototype.translate = function(tx, ty) {
    return new this.constructor(
        this.a,
        this.b,
        this.c,
        this.d,
        this.a * tx + this.c * ty + this.e,
        this.b * tx + this.d * ty + this.f
    );
};

/**
 *  scale
 *
 *  @param {Number} scale
 *  @returns {Matrix2D}
 */
Matrix2D.prototype.scale = function(scale) {
    return new this.constructor(
        this.a * scale,
        this.b * scale,
        this.c * scale,
        this.d * scale,
        this.e,
        this.f
    );
};

/**
 *  scaleAt
 *
 *  @param {Number} scale
 *  @param {Point2D} center
 *  @returns {Matrix2D}
 */
Matrix2D.prototype.scaleAt = function(scale, center) {
    var dx = center.x - scale * center.x;
    var dy = center.y - scale * center.y;

    return new this.constructor(
        this.a * scale,
        this.b * scale,
        this.c * scale,
        this.d * scale,
        this.a * dx + this.c * dy + this.e,
        this.b * dx + this.d * dy + this.f
    );
};

/**
 *  scaleNonUniform
 *
 *  @param {Number} scaleX
 *  @param {Number} scaleY
 *  @returns {Matrix2D}
 */
Matrix2D.prototype.scaleNonUniform = function(scaleX, scaleY) {
    return new this.constructor(
        this.a * scaleX,
        this.b * scaleX,
        this.c * scaleY,
        this.d * scaleY,
        this.e,
        this.f
    );
};

/**
 *  scaleNonUniformAt
 *
 *  @param {Number} scaleX
 *  @param {Number} scaleY
 *  @param {Point2D} center
 *  @returns {Matrix2D}
 */
Matrix2D.prototype.scaleNonUniformAt = function(scaleX, scaleY, center) {
    var dx = center.x - scaleX * center.x;
    var dy = center.y - scaleY * center.y;

    return new this.constructor(
        this.a * scaleX,
        this.b * scaleX,
        this.c * scaleY,
        this.d * scaleY,
        this.a * dx + this.c * dy + this.e,
        this.b * dx + this.d * dy + this.f
    );
};

/**
 *  rotate
 *
 *  @param {Number} radians
 *  @returns {Matrix2D}
 */
Matrix2D.prototype.rotate = function(radians) {
    var c = Math.cos(radians);
    var s = Math.sin(radians);

    return new this.constructor(
        this.a *  c + this.c * s,
        this.b *  c + this.d * s,
        this.a * -s + this.c * c,
        this.b * -s + this.d * c,
        this.e,
        this.f
    );
};

/**
 *  rotateAt
 *
 *  @param {Number} radians
 *  @param {Point2D} center
 *  @result {Matrix2D}
 */
Matrix2D.prototype.rotateAt = function(radians, center) {
    var c = Math.cos(radians);
    var s = Math.sin(radians);
    var t1 = -center.x + center.x * c - center.y * s;
    var t2 = -center.y + center.y * c + center.x * s;

    return new this.constructor(
        this.a *  c + this.c * s,
        this.b *  c + this.d * s,
        this.a * -s + this.c * c,
        this.b * -s + this.d * c,
        this.a * t1 + this.c * t2 + this.e,
        this.b * t1 + this.d * t2 + this.f
    );
};

/**
 *  rotateFromVector
 *
 *  @param {Vector2D}
 *  @returns {Matrix2D}
 */
Matrix2D.prototype.rotateFromVector = function(vector) {
    var unit = vector.unit();
    var c = unit.x; // cos
    var s = unit.y; // sin

    return new this.constructor(
        this.a *  c + this.c * s,
        this.b *  c + this.d * s,
        this.a * -s + this.c * c,
        this.b * -s + this.d * c,
        this.e,
        this.f
    );
};

/**
 *  flipX
 *
 *  @returns {Matrix2D}
 */
Matrix2D.prototype.flipX = function() {
    return new this.constructor(
        -this.a,
        -this.b,
         this.c,
         this.d,
         this.e,
         this.f
    );
};

/**
 *  flipY
 *
 *  @returns {Matrix2D}
 */
Matrix2D.prototype.flipY = function() {
    return new this.constructor(
         this.a,
         this.b,
        -this.c,
        -this.d,
         this.e,
         this.f
    );
};

/**
 *  skewX
 *
 *  @pararm {Number} radians
 *  @returns {Matrix2D}
 */
Matrix2D.prototype.skewX = function(radians) {
    var t = Math.tan(radians);

    return new this.constructor(
        this.a,
        this.b,
        this.a * t + this.c,
        this.b * t + this.d,
        this.e,
        this.f
    );
};

// TODO: skewXAt

/**
 *  skewY
 *
 *  @pararm {Number} radians
 *  @returns {Matrix2D}
 */
Matrix2D.prototype.skewY = function(radians) {
    var t = Math.tan(radians);

    return new this.constructor(
        this.a + this.c * t,
        this.b + this.d * t,
        this.c,
        this.d,
        this.e,
        this.f
    );
};

// TODO: skewYAt

/**
 *  isIdentity
 *
 *  @returns {Boolean}
 */
Matrix2D.prototype.isIdentity = function() {
    return (
        this.a === 1.0 &&
        this.b === 0.0 &&
        this.c === 0.0 &&
        this.d === 1.0 &&
        this.e === 0.0 &&
        this.f === 0.0
    );
};

/**
 *  isInvertible
 *
 *  @returns {Boolean}
 */
Matrix2D.prototype.isInvertible = function() {
    return this.a * this.d - this.b * this.c !== 0.0;
};

/**
 *  getScale
 *
 *  @returns {{ scaleX: Number, scaleY: Number }}
 */
Matrix2D.prototype.getScale = function() {
    return {
        scaleX: Math.sqrt(this.a * this.a + this.c * this.c),
        scaleY: Math.sqrt(this.b * this.b + this.d * this.d)
    };
};

/**
 *  getDecomposition
 *
 *  Calculates matrix Singular Value Decomposition
 *
 *  The resulting matrices, translation, rotation, scale, and rotation0, return
 *  this matrix when they are muliplied together in the listed order
 *
 *  @see Jim Blinn's article {@link http://dx.doi.org/10.1109/38.486688}
 *  @see {@link http://math.stackexchange.com/questions/861674/decompose-a-2d-arbitrary-transform-into-only-scaling-and-rotation}
 *
 *  @returns {{ translation: Matrix2D, rotation: Matrix2D, scale: Matrix2D, rotation0: Matrix2D }}
 */
Matrix2D.prototype.getDecomposition = function () {
    var E      = (this.a + this.d) * 0.5;
    var F      = (this.a - this.d) * 0.5;
    var G      = (this.b + this.c) * 0.5;
    var H      = (this.b - this.c) * 0.5;

    var Q      = Math.sqrt(E * E + H * H);
    var R      = Math.sqrt(F * F + G * G);
    var scaleX = Q + R;
    var scaleY = Q - R;

    var a1     = Math.atan2(G, F);
    var a2     = Math.atan2(H, E);
    var theta  = (a2 - a1) * 0.5;
    var phi    = (a2 + a1) * 0.5;

    // TODO: Add static methods to generate translation, rotation, etc.
    // matrices directly

    return {
        translation: new this.constructor(1, 0, 0, 1, this.e, this.f),
        rotation:    this.constructor.IDENTITY.rotate(phi),
        scale:       new this.constructor(scaleX, 0, 0, scaleY, 0, 0),
        rotation0:   this.constructor.IDENTITY.rotate(theta)
    };
};

/**
 *  equals
 *
 *  @param {Matrix2D} that
 *  @returns {Boolean}
 */
Matrix2D.prototype.equals = function(that) {
    return (
        this.a === that.a &&
        this.b === that.b &&
        this.c === that.c &&
        this.d === that.d &&
        this.e === that.e &&
        this.f === that.f
    );
};

/**
 *  toString
 *
 *  @returns {String}
 */
Matrix2D.prototype.toString = function() {
    return "matrix(" + [this.a, this.b, this.c, this.d, this.e, this.f].join(",") + ")";
};

{
    module.exports = Matrix2D;
}
});

// expose classes

var Point2D = Point2D_1;
var Vector2D = Vector2D_1;
var Matrix2D = Matrix2D_1;

var kldAffine = {
	Point2D: Point2D,
	Vector2D: Vector2D,
	Matrix2D: Matrix2D
};

var Polynomial_1 = createCommonjsModule(function (module) {
/**
 *
 *   Polynomial.js
 *
 *   copyright 2002, 2013 Kevin Lindsey
 * 
 *   contribution {@link http://github.com/Quazistax/kld-polynomial}
 *       @copyright 2015 Robert Benko (Quazistax) <quazistax@gmail.com>
 *       @license MIT
 */

Polynomial.TOLERANCE = 1e-6;
Polynomial.ACCURACY  = 15;


/**
 *  interpolate
 *
 *  @param {Array<Number>} xs
 *  @param {Array<Number>} ys
 *  @param {Number} n
 *  @param {Number} offset
 *  @param {Number} x
 *
 *  @returns {y:Number, dy:Number}
 */
Polynomial.interpolate = function(xs, ys, n, offset, x) {
    if ( xs.constructor !== Array || ys.constructor !== Array )
        throw new Error("Polynomial.interpolate: xs and ys must be arrays");
    if ( isNaN(n) || isNaN(offset) || isNaN(x) )
        throw new Error("Polynomial.interpolate: n, offset, and x must be numbers");

    var y  = 0;
    var dy = 0;
    var c = new Array(n);
    var d = new Array(n);
    var ns = 0;

    var diff = Math.abs(x - xs[offset]);
    for ( var i = 0; i < n; i++ ) {
        var dift = Math.abs(x - xs[offset+i]);

        if ( dift < diff ) {
            ns = i;
            diff = dift;
        }
        c[i] = d[i] = ys[offset+i];
    }
    y = ys[offset+ns];
    ns--;

    for ( var m = 1; m < n; m++ ) {
        for ( var i = 0; i < n-m; i++ ) {
            var ho = xs[offset+i] - x;
            var hp = xs[offset+i+m] - x;
            var w = c[i+1]-d[i];
            var den = ho - hp;

            if ( den == 0.0 ) {
                break;
            }

            den = w / den;
            d[i] = hp*den;
            c[i] = ho*den;
        }
        dy = (2*(ns+1) < (n-m)) ? c[ns+1] : d[ns--];
        y += dy;
    }

    return { y: y, dy: dy };
};


/**
 *  Polynomial
 *
 *  @returns {Polynomial}
 */
function Polynomial() {
    this.init( arguments );
}


/**
 *  init
 */
Polynomial.prototype.init = function(coefs) {
    this.coefs = new Array();

    for ( var i = coefs.length - 1; i >= 0; i-- )
        this.coefs.push( coefs[i] );

    this._variable = "t";
    this._s = 0;
};


/**
 *  eval
 */
Polynomial.prototype.eval = function(x) {
    if ( isNaN(x) )
        throw new Error("Polynomial.eval: parameter must be a number");

    var result = 0;

    for ( var i = this.coefs.length - 1; i >= 0; i-- )
        result = result * x + this.coefs[i];

    return result;
};


/**
 *  add
 */
Polynomial.prototype.add = function(that) {
    var result = new Polynomial();
    var d1 = this.getDegree();
    var d2 = that.getDegree();
    var dmax = Math.max(d1,d2);

    for ( var i = 0; i <= dmax; i++ ) {
        var v1 = (i <= d1) ? this.coefs[i] : 0;
        var v2 = (i <= d2) ? that.coefs[i] : 0;

        result.coefs[i] = v1 + v2;
    }

    return result;
};


/**
 *  multiply
 */
Polynomial.prototype.multiply = function(that) {
    var result = new Polynomial();

    for ( var i = 0; i <= this.getDegree() + that.getDegree(); i++ )
        result.coefs.push(0);

    for ( var i = 0; i <= this.getDegree(); i++ )
        for ( var j = 0; j <= that.getDegree(); j++ )
            result.coefs[i+j] += this.coefs[i] * that.coefs[j];

    return result;
};


/**
 *  divide_scalar
 */
Polynomial.prototype.divide_scalar = function(scalar) {
    for ( var i = 0; i < this.coefs.length; i++ )
        this.coefs[i] /= scalar;
};


/**
 *  simplify
 */
Polynomial.prototype.simplify = function() {
    var TOLERANCE = 1e-15;
    for ( var i = this.getDegree(); i >= 0; i-- ) {
        if ( Math.abs( this.coefs[i] ) <= TOLERANCE )
            this.coefs.pop();
        else
            break;
    }
};


/**
 *  bisection
 */
Polynomial.prototype.bisection = function(min, max) {
    var minValue = this.eval(min);
    var maxValue = this.eval(max);
    var result;

    if ( Math.abs(minValue) <= Polynomial.TOLERANCE )
        result = min;
    else if ( Math.abs(maxValue) <= Polynomial.TOLERANCE )
        result = max;
    else if ( minValue * maxValue <= 0 ) {
        var tmp1  = Math.log(max - min);
        var tmp2  = Math.LN10 * Polynomial.ACCURACY;
        var iters = Math.ceil( (tmp1+tmp2) / Math.LN2 );

        for ( var i = 0; i < iters; i++ ) {
            result = 0.5 * (min + max);
            var value = this.eval(result);

            if ( Math.abs(value) <= Polynomial.TOLERANCE ) {
                break;
            }

            if ( value * minValue < 0 ) {
                max = result;
                maxValue = value;
            } else {
                min = result;
                minValue = value;
            }
        }
    }

    return result;
};


/**
 *  toString
 */
Polynomial.prototype.toString = function() {
    var coefs = new Array();
    var signs = new Array();

    for ( var i = this.coefs.length - 1; i >= 0; i-- ) {
        var value = Math.round(this.coefs[i]*1000)/1000;
        //var value = this.coefs[i];

        if ( value != 0 ) {
            var sign = ( value < 0 ) ? " - " : " + ";

            value = Math.abs(value);
            if ( i > 0 )
                if ( value == 1 )
                    value = this._variable;
                else
                    value += this._variable;
            if ( i > 1 ) value += "^" + i;

            signs.push( sign );
            coefs.push( value );
        }
    }

    signs[0] = ( signs[0] == " + " ) ? "" : "-";

    var result = "";
    for ( var i = 0; i < coefs.length; i++ )
        result += signs[i] + coefs[i];

    return result;
};


/**
 *  trapezoid
 *  Based on trapzd in "Numerical Recipes in C", page 137
 */
Polynomial.prototype.trapezoid = function(min, max, n) {
    if ( isNaN(min) || isNaN(max) || isNaN(n) )
        throw new Error("Polynomial.trapezoid: parameters must be numbers");

    var range = max - min;

    if ( n == 1 ) {
        var minValue = this.eval(min);
        var maxValue = this.eval(max);
        this._s = 0.5*range*( minValue + maxValue );
    } else {
        var it = 1 << (n-2);
        var delta = range / it;
        var x = min + 0.5*delta;
        var sum = 0;

        for ( var i = 0; i < it; i++ ) {
            sum += this.eval(x);
            x += delta;
        }
        this._s = 0.5*(this._s + range*sum/it);
    }

    if ( isNaN(this._s) )
        throw new Error("Polynomial.trapezoid: this._s is NaN");

    return this._s;
};


/**
 *  simpson
 *  Based on trapzd in "Numerical Recipes in C", page 139
 */
Polynomial.prototype.simpson = function(min, max) {
    if ( isNaN(min) || isNaN(max) )
        throw new Error("Polynomial.simpson: parameters must be numbers");

    var range = max - min;
    var st = 0.5 * range * ( this.eval(min) + this.eval(max) );
    var t = st;
    var s = 4.0*st/3.0;
    var os = s;
    var ost = st;
    var TOLERANCE = 1e-7;

    var it = 1;
    for ( var n = 2; n <= 20; n++ ) {
        var delta = range / it;
        var x     = min + 0.5*delta;
        var sum   = 0;

        for ( var i = 1; i <= it; i++ ) {
            sum += this.eval(x);
            x += delta;
        }

        t = 0.5 * (t + range * sum / it);
        st = t;
        s = (4.0*st - ost)/3.0;

        if ( Math.abs(s-os) < TOLERANCE*Math.abs(os) )
            break;

        os = s;
        ost = st;
        it <<= 1;
    }

    return s;
};


/**
 *  romberg
 */
Polynomial.prototype.romberg = function(min, max) {
    if ( isNaN(min) || isNaN(max) )
        throw new Error("Polynomial.romberg: parameters must be numbers");

    var MAX = 20;
    var K = 3;
    var TOLERANCE = 1e-6;
    var s = new Array(MAX+1);
    var h = new Array(MAX+1);
    var result = { y: 0, dy: 0 };

    h[0] = 1.0;
    for ( var j = 1; j <= MAX; j++ ) {
        s[j-1] = this.trapezoid(min, max, j);
        if ( j >= K ) {
            result = Polynomial.interpolate(h, s, K, j-K, 0.0);
            if ( Math.abs(result.dy) <= TOLERANCE*result.y) break;
        }
        s[j] = s[j-1];
        h[j] = 0.25 * h[j-1];
    }

    return result.y;
};

// getters and setters

/**
 *  get degree
 */
Polynomial.prototype.getDegree = function() {
    return this.coefs.length - 1;
};


/**
 *  getDerivative
 */
Polynomial.prototype.getDerivative = function() {
    var derivative = new Polynomial();

    for ( var i = 1; i < this.coefs.length; i++ ) {
        derivative.coefs.push(i*this.coefs[i]);
    }

    return derivative;
};


/**
 *  getRoots
 */
Polynomial.prototype.getRoots = function() {
    var result;

    this.simplify();
    switch ( this.getDegree() ) {
        case 0: result = new Array();              break;
        case 1: result = this.getLinearRoot();     break;
        case 2: result = this.getQuadraticRoots(); break;
        case 3: result = this.getCubicRoots();     break;
        case 4: result = this.getQuarticRoots();   break;
        default:
            result = new Array();
            // should try Newton's method and/or bisection
    }

    return result;
};


/**
 *  getRootsInInterval
 */
Polynomial.prototype.getRootsInInterval = function(min, max) {
    var roots = new Array();
    var root;

    if ( this.getDegree() == 1 ) {
        root = this.bisection(min, max);
        if ( root != null ) roots.push(root);
    } else {
        // get roots of derivative
        var deriv  = this.getDerivative();
        var droots = deriv.getRootsInInterval(min, max);

        if ( droots.length > 0 ) {
            // find root on [min, droots[0]]
            root = this.bisection(min, droots[0]);
            if ( root != null ) roots.push(root);

            // find root on [droots[i],droots[i+1]] for 0 <= i <= count-2
            for ( i = 0; i <= droots.length-2; i++ ) {
                root = this.bisection(droots[i], droots[i+1]);
                if ( root != null ) roots.push(root);
            }

            // find root on [droots[count-1],xmax]
            root = this.bisection(droots[droots.length-1], max);
            if ( root != null ) roots.push(root);
        } else {
            // polynomial is monotone on [min,max], has at most one root
            root = this.bisection(min, max);
            if ( root != null ) roots.push(root);
        }
    }

    return roots;
};


/**
 *  getLinearRoot
 */
Polynomial.prototype.getLinearRoot = function() {
    var result = new Array();
    var a = this.coefs[1];

    if ( a != 0 )
        result.push( -this.coefs[0] / a );

    return result;
};


/**
 *  getQuadraticRoots
 */
Polynomial.prototype.getQuadraticRoots = function() {
    var results = new Array();

    if ( this.getDegree() == 2 ) {
        var a = this.coefs[2];
        var b = this.coefs[1] / a;
        var c = this.coefs[0] / a;
        var d = b*b - 4*c;

        if ( d > 0 ) {
            var e = Math.sqrt(d);

            results.push( 0.5 * (-b + e) );
            results.push( 0.5 * (-b - e) );
        } else if ( d == 0 ) {
            // really two roots with same value, but we only return one
            results.push( 0.5 * -b );
        }
    }

    return results;
};


/**
 *  getCubicRoots
 *
 *  This code is based on MgcPolynomial.cpp written by David Eberly.  His
 *  code along with many other excellent examples are avaiable at his site:
 *  http://www.geometrictools.com
 */
Polynomial.prototype.getCubicRoots = function() {
    var results = new Array();

    if ( this.getDegree() == 3 ) {
        var c3 = this.coefs[3];
        var c2 = this.coefs[2] / c3;
        var c1 = this.coefs[1] / c3;
        var c0 = this.coefs[0] / c3;

        var a       = (3*c1 - c2*c2) / 3;
        var b       = (2*c2*c2*c2 - 9*c1*c2 + 27*c0) / 27;
        var offset  = c2 / 3;
        var discrim = b*b/4 + a*a*a/27;
        var halfB   = b / 2;

        var ZEROepsilon = this.zeroErrorEstimate();
        if (Math.abs(discrim) <= ZEROepsilon) discrim = 0;

        if ( discrim > 0 ) {
            var e = Math.sqrt(discrim);
            var tmp;
            var root;

            tmp = -halfB + e;
            if ( tmp >= 0 )
                root = Math.pow(tmp, 1/3);
            else
                root = -Math.pow(-tmp, 1/3);

            tmp = -halfB - e;
            if ( tmp >= 0 )
                root += Math.pow(tmp, 1/3);
            else
                root -= Math.pow(-tmp, 1/3);

            results.push( root - offset );
        } else if ( discrim < 0 ) {
            var distance = Math.sqrt(-a/3);
            var angle    = Math.atan2( Math.sqrt(-discrim), -halfB) / 3;
            var cos      = Math.cos(angle);
            var sin      = Math.sin(angle);
            var sqrt3    = Math.sqrt(3);

            results.push( 2*distance*cos - offset );
            results.push( -distance * (cos + sqrt3 * sin) - offset);
            results.push( -distance * (cos - sqrt3 * sin) - offset);
        } else {
            var tmp;

            if ( halfB >= 0 )
                tmp = -Math.pow(halfB, 1/3);
            else
                tmp = Math.pow(-halfB, 1/3);

            results.push( 2*tmp - offset );
            // really should return next root twice, but we return only one
            results.push( -tmp - offset );
        }
    }

    return results;
};

/**
    Sign of a number (+1, -1, +0, -0).
 */
var sign = function (x) {
    return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? x : NaN : NaN;
};


///////////////////////////////////////////////////////////////////
/**
    Calculates roots of quartic polynomial. <br/>
    First, derivative roots are found, then used to split quartic polynomial 
    into segments, each containing one root of quartic polynomial.
    Segments are then passed to newton's method to find roots.

    @returns {Array<Number>} roots
*/
Polynomial.prototype.getQuarticRoots = function () {
    var results = [];

    var n = this.getDegree();
    if (n == 4) {

        var poly = new Polynomial();
        poly.coefs = this.coefs.slice();
        poly.divide_scalar(poly.coefs[n]);
        var ERRF = 1e-15;
        if (Math.abs(poly.coefs[0]) < 10 * ERRF * Math.abs(poly.coefs[3]))
            poly.coefs[0] = 0;
        var poly_d = poly.getDerivative();
        var derrt = poly_d.getRoots().sort(function (a, b) { return a - b; });
        var dery = [];
        var nr = derrt.length - 1;
        var i;
        var rb = this.bounds();
        maxabsX = Math.max(Math.abs(rb.minX), Math.abs(rb.maxX));
        var ZEROepsilon = this.zeroErrorEstimate(maxabsX);
        
        for (i = 0; i <= nr; i++) {
            dery.push(poly.eval(derrt[i]));
        }

        for (i = 0; i <= nr; i++) {
            if (Math.abs(dery[i]) < ZEROepsilon)
                dery[i] = 0;
        }

        i = 0;
        var dx = Math.max(0.1 * (rb.maxX - rb.minX) / n, ERRF);
        var guesses = [];
        var minmax = [];
        if (nr > -1) {
            if (dery[0] != 0) {
                if (sign(dery[0]) != sign(poly.eval(derrt[0] - dx) - dery[0])) {
                    guesses.push(derrt[0] - dx);
                    minmax.push([rb.minX, derrt[0]]);
                }
            }
            else {
                results.push(derrt[0], derrt[0]);
                i++;
            }

            for (; i < nr; i++) {
                if (dery[i + 1] == 0) {
                    results.push(derrt[i + 1], derrt[i + 1]);
                    i++;
                }
                else if (sign(dery[i]) != sign(dery[i + 1])) {
                    guesses.push((derrt[i] + derrt[i + 1]) / 2);
                    minmax.push([derrt[i], derrt[i + 1]]);
                }
            }
            if (dery[nr] != 0 && sign(dery[nr]) != sign(poly.eval(derrt[nr] + dx) - dery[nr])) {
                guesses.push(derrt[nr] + dx);
                minmax.push([derrt[nr], rb.maxX]);
            }
        }

        var f = function (x) { return poly.eval(x); };
        var df = function (x) { return poly_d.eval(x); };
        if (guesses.length > 0) {
            for (i = 0; i < guesses.length; i++) {
                guesses[i] = Polynomial.newton_secant_bisection(guesses[i], f, df, 32, minmax[i][0], minmax[i][1]);
            }
        }

        results = results.concat(guesses);
    }
    return results;
};

///////////////////////////////////////////////////////////////////
/**
    Estimate what is the maximum polynomial evaluation error value under which polynomial evaluation could be in fact 0.
    
    @returns {Number} 
*/
Polynomial.prototype.zeroErrorEstimate = function (maxabsX) {
    var poly = this;
    var ERRF = 1e-15;
    if (typeof maxabsX === 'undefined') {
        var rb = poly.bounds();
        maxabsX = Math.max(Math.abs(rb.minX), Math.abs(rb.maxX));
    }
    if (maxabsX < 0.001) {
        return 2*Math.abs(poly.eval(ERRF));
    }
    var n = poly.coefs.length - 1;
    var an = poly.coefs[n];
    return 10 * ERRF * poly.coefs.reduce(function (m, v, i) {
        var nm = v / an * Math.pow(maxabsX, i);
        return nm > m ? nm : m;
    }, 0);
};

///////////////////////////////////////////////////////////////////
/**
    Calculates upper Real roots bounds. <br/>
    Real roots are in interval [negX, posX]. Determined by Fujiwara method.
    @see {@link http://en.wikipedia.org/wiki/Properties_of_polynomial_roots}

    @returns {{ negX: Number, posX: Number }}
*/
Polynomial.prototype.bounds_UpperReal_Fujiwara = function () {
    var a = this.coefs;
    var n = a.length - 1;
    var an = a[n];
    if (an != 1) {
        a = this.coefs.map(function (v) { return v / an; });
    }
    var b = a.map(function (v, i) { return (i < n) ? Math.pow(Math.abs((i == 0) ? v / 2 : v), 1 / (n - i)) : v; });

    var coefSelectionFunc;
    var find2Max = function (acc, bi, i) {
        if (coefSelectionFunc(i)) {
            if (acc.max < bi) {
                acc.nearmax = acc.max;
                acc.max = bi;
            }
            else if (acc.nearmax < bi) {
                acc.nearmax = bi;
            }
        }
        return acc;
    };

    coefSelectionFunc = function (i) { return i < n && a[i] < 0; };
    var max_nearmax_pos = b.reduce(find2Max, { max: 0, nearmax: 0 });

    coefSelectionFunc = function (i) { return i < n && ((n % 2 == i % 2) ? a[i] < 0 : a[i] > 0); };
    var max_nearmax_neg = b.reduce(find2Max, { max: 0, nearmax: 0 });

    return {
        negX: -2 * max_nearmax_neg.max,
        posX: 2 * max_nearmax_pos.max
    };
};


///////////////////////////////////////////////////////////////////
/** 
    Calculates lower Real roots bounds. <br/>
    There are no Real roots in interval <negX, posX>. Determined by Fujiwara method.
    @see {@link http://en.wikipedia.org/wiki/Properties_of_polynomial_roots}

    @returns {{ negX: Number, posX: Number }}
*/
Polynomial.prototype.bounds_LowerReal_Fujiwara = function () {
    var poly = new Polynomial();
    poly.coefs = this.coefs.slice().reverse();
    var res = poly.bounds_UpperReal_Fujiwara();
    res.negX = 1 / res.negX;
    res.posX = 1 / res.posX;
    return res;
};


///////////////////////////////////////////////////////////////////
/** 
    Calculates left and right Real roots bounds. <br/>
    Real roots are in interval [minX, maxX]. Combines Fujiwara lower and upper bounds to get minimal interval.
    @see {@link http://en.wikipedia.org/wiki/Properties_of_polynomial_roots}

    @returns {{ minX: Number, maxX: Number }}
*/
Polynomial.prototype.bounds = function () {
    var urb = this.bounds_UpperReal_Fujiwara();
    var rb = { minX: urb.negX, maxX: urb.posX };
    if (urb.negX === 0 && urb.posX === 0)
        return rb;
    if (urb.negX === 0) {
        rb.minX = this.bounds_LowerReal_Fujiwara().posX;
    }
    else if (urb.posX === 0) {
        rb.maxX = this.bounds_LowerReal_Fujiwara().negX;
    }
    if (rb.minX > rb.maxX) {
        //console.log('Polynomial.prototype.bounds: poly has no real roots? or floating point error?');
        rb.minX = rb.maxX = 0;
    }
    return rb;
    // TODO: if sure that there are no complex roots 
    // (maybe by using Sturm's theorem) use:
    //return this.bounds_Real_Laguerre();
};


/////////////////////////////////////////////////////////////////// 
/**
    Newton's (Newton-Raphson) method for finding Real roots on univariate function. <br/>
    When using bounds, algorithm falls back to secant if newton goes out of range.
    Bisection is fallback for secant when determined secant is not efficient enough.
    @see {@link http://en.wikipedia.org/wiki/Newton%27s_method}
    @see {@link http://en.wikipedia.org/wiki/Secant_method}
    @see {@link http://en.wikipedia.org/wiki/Bisection_method}

    @param {Number} x0 - Inital root guess
    @param {function(x)} f - Function which root we are trying to find
    @param {function(x)} df - Derivative of function f
    @param {Number} max_iterations - Maximum number of algorithm iterations
    @param {Number} [min_x] - Left bound value
    @param {Number} [max_x] - Right bound value
    @returns {Number} - root
*/
Polynomial.newton_secant_bisection = function (x0, f, df, max_iterations, min, max) {
    var x, prev_dfx = 0, dfx, prev_x_ef_correction = 0, x_correction, x_new;
    var y_atmin, y_atmax;
    x = x0;
    var ACCURACY = 14;
    var min_correction_factor = Math.pow(10, -ACCURACY);
    var isBounded = (typeof min === 'number' && typeof max === 'number');
    if (isBounded) {
        if (min > max)
            throw new Error("newton root finding: min must be greater than max");
        y_atmin = f(min);
        y_atmax = f(max);
        if (sign(y_atmin) ==  sign(y_atmax))
            throw new Error("newton root finding: y values of bounds must be of opposite sign");
    }

    var isEnoughCorrection = function () {
        // stop if correction is too small
        // or if correction is in simple loop
        return (Math.abs(x_correction) <= min_correction_factor * Math.abs(x))
            || (prev_x_ef_correction == (x - x_correction) - x);
    };

    var i;
    //var stepMethod;
    //var details = [];
    for (i = 0; i < max_iterations; i++) {
        dfx = df(x);
        if (dfx == 0) {
            if (prev_dfx == 0) {
                // error
                throw new Error("newton root finding: df(x) is zero");
                //return null;
            }
            else {
                // use previous derivation value
                dfx = prev_dfx;
            }
            // or move x a little?
            //dfx = df(x != 0 ? x + x * 1e-15 : 1e-15);
        }
        //stepMethod = 'newton';
        prev_dfx = dfx;
        y = f(x);
        x_correction = y / dfx;
        x_new = x - x_correction;
        if (isEnoughCorrection()) {
            break;
        }

        if (isBounded) {
            if (sign(y) == sign(y_atmax)) {
                max = x;
                y_atmax = y;
            }
            else if (sign(y) == sign(y_atmin)) {
                min = x;
                y_atmin = y;
            }
            else {
                x = x_new;
                //console.log("newton root finding: sign(y) not matched.");
                break;
            }

            if ((x_new < min) || (x_new > max)) {
                if (sign(y_atmin) == sign(y_atmax)) {
                    break;
                }

                var RATIO_LIMIT = 50;
                var AIMED_BISECT_OFFSET = 0.25; // [0, 0.5)
                var dy = y_atmax - y_atmin;
                var dx = max - min;

                if (dy == 0) {
                    //stepMethod = 'bisect';
                    x_correction = x - (min + dx * 0.5);
                }
                else if (Math.abs(dy / Math.min(y_atmin, y_atmax)) > RATIO_LIMIT) {
                    //stepMethod = 'aimed bisect';
                    x_correction = x - (min + dx * (0.5 + (Math.abs(y_atmin) < Math.abs(y_atmax) ? -AIMED_BISECT_OFFSET : AIMED_BISECT_OFFSET)));
                }
                else {
                    //stepMethod = 'secant'; 
                    x_correction = x - (min - y_atmin / dy * dx);
                }
                x_new = x - x_correction;

                if (isEnoughCorrection()) {
                    break;
                }
            }
        }
        //details.push([stepMethod, i, x, x_new, x_correction, min, max, y]);
        prev_x_ef_correction = x - x_new;
        x = x_new;
    }
    //details.push([stepMethod, i, x, x_new, x_correction, min, max, y]);
    //console.log(details.join('\r\n'));
    //if (i == max_iterations)
    //    console.log('newt: steps=' + ((i==max_iterations)? i:(i + 1)));
    return x;
};

{
    module.exports = Polynomial;
}
});

var SqrtPolynomial_1 = createCommonjsModule(function (module) {
/**
 *
 *   SqrtPolynomial.js
 *
 *   copyright 2003, 2013 Kevin Lindsey
 *
 */

{
    var Polynomial = Polynomial_1;
}

/**
 *   class variables
 */
SqrtPolynomial.VERSION = 1.0;

// setup inheritance
SqrtPolynomial.prototype             = new Polynomial();
SqrtPolynomial.prototype.constructor = SqrtPolynomial;
SqrtPolynomial.superclass            = Polynomial.prototype;


/**
 *  SqrtPolynomial
 */
function SqrtPolynomial() {
    this.init( arguments );
}


/**
 *  eval
 *
 *  @param {Number} x
 *  @returns {Number}
 */
SqrtPolynomial.prototype.eval = function(x) {
    var TOLERANCE = 1e-7;
    var result = SqrtPolynomial.superclass.eval.call(this, x);

    // NOTE: May need to change the following.  I added these to capture
    // some really small negative values that were being generated by one
    // of my Bezier arcLength functions
    if ( Math.abs(result) < TOLERANCE ) result = 0;
    if ( result < 0 )
        throw new Error("SqrtPolynomial.eval: cannot take square root of negative number");

    return Math.sqrt(result);
};

SqrtPolynomial.prototype.toString = function() {
    var result = SqrtPolynomial.superclass.toString.call(this);

    return "sqrt(" + result + ")";
};

{
    module.exports = SqrtPolynomial;
}
});

// expose classes

var Polynomial = Polynomial_1;
var SqrtPolynomial = SqrtPolynomial_1;

var kldPolynomial = {
	Polynomial: Polynomial,
	SqrtPolynomial: SqrtPolynomial
};

var Point2D$1 = kldAffine.Point2D;


/**
    getArcParameters

    @param {Point2D} startPoint
    @param {Point2D} endPoint
    @param {Number} rx
    @param {Number} ry
    @param {Number} angle - in degrees
    @param {Boolean} arcFlag
    @param {Boolean} sweepFlag
    @returns {{ center: Point2D, rx: Number, ry: Number, theta1: Number, deltaTheta: Number }}
*/
function getArcParameters(startPoint, endPoint, rx, ry, angle, arcFlag, sweepFlag) {
    function radian(ux, uy, vx, vy) {
        var dot = ux * vx + uy * vy;
        var mod = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
        var rad = Math.acos(dot / mod);
        if (ux * vy - uy * vx < 0.0) rad = -rad;
        return rad;
    }
    angle = angle * Math.PI / 180;
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var TOLERANCE = 1e-6;
    var halfDiff = startPoint.subtract(endPoint).divide(2);
    var x1p = halfDiff.x * c + halfDiff.y * s;
    var y1p = halfDiff.x * -s + halfDiff.y * c;
    var x1px1p = x1p * x1p;
    var y1py1p = y1p * y1p;
    var lambda = (x1px1p / (rx * rx)) + (y1py1p / (ry * ry));
    var factor;
    if (lambda > 1) {
        factor = Math.sqrt(lambda);
        rx *= factor;
        ry *= factor;
    }
    var rxrx = rx * rx;
    var ryry = ry * ry;
    var rxy1 = rxrx * y1py1p;
    var ryx1 = ryry * x1px1p;
    factor = (rxrx * ryry - rxy1 - ryx1) / (rxy1 + ryx1);
    if (Math.abs(factor) < TOLERANCE) factor = 0;
    var sq = Math.sqrt(factor);
    if (arcFlag == sweepFlag) sq = -sq;
    var mid = startPoint.add(endPoint).divide(2);
    var cxp = sq * rx * y1p / ry;
    var cyp = sq * -ry * x1p / rx;
    //return new Point2D(cxp * c - cyp * s + mid.x, cxp * s + cyp * c + mid.y);

    var xcr1 = (x1p - cxp) / rx;
    var xcr2 = (x1p + cxp) / rx;
    var ycr1 = (y1p - cyp) / ry;
    var ycr2 = (y1p + cyp) / ry;

    var theta1 = radian(1.0, 0.0, xcr1, ycr1);

    var deltaTheta = radian(xcr1, ycr1, -xcr2, -ycr2);
    var PIx2 = Math.PI * 2.0;
    while (deltaTheta > PIx2) deltaTheta -= PIx2;
    while (deltaTheta < 0.0) deltaTheta += PIx2;
    if (sweepFlag == false) deltaTheta -= PIx2;

    return {
        center: new Point2D$1(cxp * c - cyp * s + mid.x, cxp * s + cyp * c + mid.y),
        rx: rx,
        ry: ry,
        theta1: theta1,
        deltaTheta: deltaTheta
    };
}


/**
 *  IntersectionParams
 *
 *  @param {String} name
 *  @param {Array<Point2D} params
 *  @returns {IntersectionParams}
 */
function IntersectionParams(name, params) {
    this.init(name, params);
}

/**
 *  init
 *
 *  @param {String} type
 *  @param {Array<Point2D>} params
 */
IntersectionParams.prototype.init = function (type, params) {
    this.type = type;
    this.params = params;
    this.meta = {};
};

IntersectionParams.TYPE = {};
var IPTYPE = IntersectionParams.TYPE;
IPTYPE.LINE = 'Line';
IPTYPE.RECT = 'Rectangle';
IPTYPE.ROUNDRECT = 'RoundRectangle';
IPTYPE.CIRCLE = 'Circle';
IPTYPE.ELLIPSE = 'Ellipse';
IPTYPE.POLYGON = 'Polygon';
IPTYPE.POLYLINE = 'Polyline';
IPTYPE.PATH = 'Path';
IPTYPE.ARC = 'Arc';
IPTYPE.BEZIER2 = 'Bezier2';
IPTYPE.BEZIER3 = 'Bezier3';


function parsePointsString(points) {
    return points.split(" ").map(function(point) {
        point = point.split(",");
        return new Point2D$1(point[0], point[1]);
    });
}

IntersectionParams.newShape = function(svgElementName, props) {
    svgElementName = svgElementName.toLowerCase();

    if(svgElementName === "line") {
        return IntersectionParams.newLine(
            new Point2D$1(props.x1, props.y1),
            new Point2D$1(props.x2, props.y2)
        );
    }

    if(svgElementName === "rect") {
        if(props.rx > 0 || props.ry > 0) {
            return IntersectionParams.newRoundRect(
                props.x, props.y,
                props.width, props.height,
                props.rx, props.ry
            );
        } else {
            return IntersectionParams.newRect(
                props.x, props.y,
                props.width, props.height
            );
        }
    }

    if(svgElementName === "circle") {
        return IntersectionParams.newCircle(
            new Point2D$1(props.cx, props.cy),
            props.r
        );
    }

    if(svgElementName === "ellipse") {
        return IntersectionParams.newEllipse(
            new Point2D$1(props.cx, props.cy),
            props.rx, props.ry
        );
    }

    if(svgElementName === "polygon") {
        return IntersectionParams.newPolygon(
            parsePointsString(props.points)
        );
    }

    if(svgElementName === "polyline") {
        return IntersectionParams.newPolyline(
            parsePointsString(props.points)
        );
    }

    if(svgElementName === "path") {
        return IntersectionParams.newPath(
            props.d
        );
    }

};


///////////////////////////////////////////////////////////////////
/**
    Creates IntersectionParams for arc.

    @param {Point2D} startPoint - arc start point
    @param {Point2D} endPoint - arc end point
    @param {Number} rx - arc ellipse x radius
    @param {Number} ry - arc ellipse y radius
    @param {Number} angle - arc ellipse rotation in degrees
    @param {Boolean} largeArcFlag
    @param {Boolean} sweepFlag
    @returns {IntersectionParams}
*/
IntersectionParams.newArc = function (startPoint, endPoint, rx, ry, angle, largeArcFlag, sweepFlag) {
    var p = getArcParameters(startPoint, endPoint, rx, ry, angle, largeArcFlag, sweepFlag);
    return new IntersectionParams(IPTYPE.ARC, [p.center, p.rx, p.ry, (angle * Math.PI / 180), p.theta1, p.deltaTheta]);
};

///////////////////////////////////////////////////////////////////
/**
    Creates IntersectionParams for bezier2.

    @param {Point2D} p1
    @param {Point2D} p2
    @param {Point2D} p3
    @returns {IntersectionParams}
*/
IntersectionParams.newBezier2 = function (p1, p2, p3) {
    return new IntersectionParams(IPTYPE.BEZIER2, [p1, p2, p3]);
};

///////////////////////////////////////////////////////////////////
/**
    Creates IntersectionParams for bezier3.

    @param {Point2D} p1
    @param {Point2D} p2
    @param {Point2D} p3
    @param {Point2D} p4
    @returns {IntersectionParams}
*/
IntersectionParams.newBezier3 = function (p1, p2, p3, p4) {
    return new IntersectionParams(IPTYPE.BEZIER3, [p1, p2, p3, p4]);
};

///////////////////////////////////////////////////////////////////
/**
    Creates IntersectionParams for circle.

    @param {Point2D} c
    @param {Number} r
    @returns {IntersectionParams}
*/
IntersectionParams.newCircle = function (c, r) {
    return new IntersectionParams(IPTYPE.CIRCLE, [c, r]);
};

///////////////////////////////////////////////////////////////////
/**
    Creates IntersectionParams for ellipse.

    @param {Point2D} c
    @param {Number} rx
    @param {Number} ry
    @returns {IntersectionParams}
*/
IntersectionParams.newEllipse = function (c, rx, ry) {
    return new IntersectionParams(IPTYPE.ELLIPSE, [c, rx, ry]);
};

///////////////////////////////////////////////////////////////////
/**
    Creates IntersectionParams for line.

    @param {Point2D} a1
    @param {Point2D} a2
    @returns {IntersectionParams}
*/
IntersectionParams.newLine = function (a1, a2) {
    return new IntersectionParams(IPTYPE.LINE, [a1, a2]);
};

///////////////////////////////////////////////////////////////////
/**
    Creates IntersectionParams for polygon.

    @param {Array<Point2D>} points
    @returns {IntersectionParams}
*/
IntersectionParams.newPolygon = function (points) {
    return new IntersectionParams(IPTYPE.POLYGON, [points]);
};

///////////////////////////////////////////////////////////////////
/**
    Creates IntersectionParams for polyline.

     @param {Array<Point2D>} points
    @returns {IntersectionParams}
*/
IntersectionParams.newPolyline = function (points) {
    return new IntersectionParams(IPTYPE.POLYLINE, [points]);
};


///////////////////////////////////////////////////////////////////
/**
    Creates IntersectionParams for rectangle.

    @param {Number} x
    @param {Number} y
    @param {Number} width
    @param {Number} height
    @returns {IntersectionParams}
*/
IntersectionParams.newRect = function (x, y, width, height) {
    var points = [];
    points.push(new Point2D$1(x, y));
    points.push(new Point2D$1(x + width, y));
    points.push(new Point2D$1(x + width, y + height));
    points.push(new Point2D$1(x, y + height));
    return new IntersectionParams(IPTYPE.RECT, [points]);
};

var degreesToRadians = function (angle) {
    return angle * Math.PI / 180;
};
///////////////////////////////////////////////////////////////////
/**
    Creates IntersectionParams for round rectangle, or for rectangle if rx and ry are 0.

    @param {Number} x
    @param {Number} y
    @param {Number} width
    @param {Number} height
    @param {Number} rx
    @param {Number} ry
    @returns {IntersectionParams}
*/
IntersectionParams.newRoundRect = function (x, y, width, height, rx, ry) {
    if (rx === 0 && ry === 0)
        return IntersectionParams.newRect(x, y, width, height);
    if (rx === 0)
        rx = ry;
    if (ry === 0)
        ry = rx;
    if (rx > width / 2)
        rx = width / 2;
    if (ry > height / 2)
        rx = height / 2;
    var shape = [];
    var x0 = x, x1 = x + rx, x2 = x + width - rx, x3 = x + width;
    var y0 = y, y1 = y + ry, y2 = y + height - ry, y3 = y + height;
    shape.push(new IntersectionParams(IPTYPE.ARC, [new Point2D$1(x1, y1), rx, ry, 0, degreesToRadians(180), degreesToRadians(90)]));
    shape.push(new IntersectionParams(IPTYPE.LINE, [new Point2D$1(x1, y0), new Point2D$1(x2, y0)]));
    shape.push(new IntersectionParams(IPTYPE.ARC, [new Point2D$1(x2, y1), rx, ry, 0, degreesToRadians(-90), degreesToRadians(90)]));
    shape.push(new IntersectionParams(IPTYPE.LINE, [new Point2D$1(x3, y1), new Point2D$1(x3, y2)]));
    shape.push(new IntersectionParams(IPTYPE.ARC, [new Point2D$1(x2, y2), rx, ry, 0, degreesToRadians(0), degreesToRadians(90)]));
    shape.push(new IntersectionParams(IPTYPE.LINE, [new Point2D$1(x2, y3), new Point2D$1(x1, y3)]));
    shape.push(new IntersectionParams(IPTYPE.ARC, [new Point2D$1(x1, y2), rx, ry, 0, degreesToRadians(90), degreesToRadians(90)]));
    shape.push(new IntersectionParams(IPTYPE.LINE, [new Point2D$1(x0, y2), new Point2D$1(x0, y1)]));
    shape[shape.length - 1].meta.closePath = true;
    return new IntersectionParams(IPTYPE.ROUNDRECT, [shape]);
};




function Token(type, text) {
    if (arguments.length > 0) {
        this.init(type, text);
    }
}
Token.prototype.init = function(type, text) {
    this.type = type;
    this.text = text;
};
Token.prototype.typeis = function(type) {
    return this.type == type;
};
var Path$1 = {};
Path$1.COMMAND = 0;
Path$1.NUMBER = 1;
Path$1.EOD = 2;
Path$1.PARAMS = {
    A: ["rx", "ry", "x-axis-rotation", "large-arc-flag", "sweep-flag", "x", "y"],
    a: ["rx", "ry", "x-axis-rotation", "large-arc-flag", "sweep-flag", "x", "y"],
    C: ["x1", "y1", "x2", "y2", "x", "y"],
    c: ["x1", "y1", "x2", "y2", "x", "y"],
    H: ["x"],
    h: ["x"],
    L: ["x", "y"],
    l: ["x", "y"],
    M: ["x", "y"],
    m: ["x", "y"],
    Q: ["x1", "y1", "x", "y"],
    q: ["x1", "y1", "x", "y"],
    S: ["x2", "y2", "x", "y"],
    s: ["x2", "y2", "x", "y"],
    T: ["x", "y"],
    t: ["x", "y"],
    V: ["y"],
    v: ["y"],
    Z: [],
    z: []
};

function tokenize(d) {
    var tokens = new Array();
    while (d != "") {
        if (d.match(/^([ \t\r\n,]+)/)) {
            d = d.substr(RegExp.$1.length);
        } else if (d.match(/^([aAcChHlLmMqQsStTvVzZ])/)) {
            tokens[tokens.length] = new Token(Path$1.COMMAND, RegExp.$1);
            d = d.substr(RegExp.$1.length);
        } else if (d.match(/^(([-+]?[0-9]+(\.[0-9]*)?|[-+]?\.[0-9]+)([eE][-+]?[0-9]+)?)/)) {
            tokens[tokens.length] = new Token(Path$1.NUMBER, parseFloat(RegExp.$1));
            d = d.substr(RegExp.$1.length);
        } else {
            throw new Error("Unrecognized segment command: " + d);
        }
    }
    tokens[tokens.length] = new Token(Path$1.EOD, null);
    return tokens;
}

IntersectionParams.newPath = function(d) {
    var tokens = tokenize(d);
    var index = 0;
    var token = tokens[index];
    var mode = "BOD";
    var segments = [];

    while (!token.typeis(Path$1.EOD)) {
        var param_length;
        var params = new Array();
        if (mode == "BOD") {
            if (token.text == "M" || token.text == "m") {
                index++;
                param_length = Path$1.PARAMS[token.text].length;
                mode = token.text;
            } else {
                throw new Error("Path data must begin with a moveto command");
            }
        } else {
            if (token.typeis(Path$1.NUMBER)) {
                param_length = Path$1.PARAMS[mode].length;
            } else {
                index++;
                param_length = Path$1.PARAMS[token.text].length;
                mode = token.text;
            }
        }
        if ((index + param_length) < tokens.length) {
            for (var i = index; i < index + param_length; i++) {
                var number = tokens[i];
                if (number.typeis(Path$1.NUMBER)) params[params.length] = number.text;
                else throw new Error("Parameter type is not a number: " + mode + "," + number.text);
            }
            var segment;
            var length = segments.length;
            var previous = (length == 0) ? null : segments[length - 1];
            switch (mode) {
                case "A":
                    segment = new AbsoluteArcPath(params, previous);
                    break;
                case "C":
                    segment = new AbsoluteCurveto3(params, previous);
                    break;
                case "c":
                    segment = new RelativeCurveto3(params, previous);
                    break;
                case "H":
                    segment = new AbsoluteHLineto(params, previous);
                    break;
                case "V":
                    segment = new AbsoluteVLineto(params, previous);
                    break;
                case "L":
                    segment = new AbsoluteLineto(params, previous);
                    break;
                case "l":
                    segment = new RelativeLineto(params, previous);
                    break;
                case "M":
                    segment = new AbsoluteMoveto(params, previous);
                    break;
                case "m":
                    segment = new RelativeMoveto(params, previous);
                    break;
                case "Q":
                    segment = new AbsoluteCurveto2(params, previous);
                    break;
                case "q":
                    segment = new RelativeCurveto2(params, previous);
                    break;
                case "S":
                    segment = new AbsoluteSmoothCurveto3(params, previous);
                    break;
                case "s":
                    segment = new RelativeSmoothCurveto3(params, previous);
                    break;
                case "T":
                    segment = new AbsoluteSmoothCurveto2(params, previous);
                    break;
                case "t":
                    segment = new RelativeSmoothCurveto2(params, previous);
                    break;
                case "Z":
                    segment = new RelativeClosePath(params, previous);
                    break;
                case "z":
                    segment = new RelativeClosePath(params, previous);
                    break;
                default:
                    throw new Error("Unsupported segment type: " + mode);
            }            segments.push(segment);
            index += param_length;
            token = tokens[index];
            if (mode == "M") mode = "L";
            if (mode == "m") mode = "l";
        } else {
            throw new Error("Path data ended before all parameters were found");
        }
    }

    var segmentParams = [];
    for(i=0; i<segments.length; i++) {
        var ip = segments[i].getIntersectionParams();
        if(ip) {
            segmentParams.push(ip);
        }
    }

    return new IntersectionParams(IPTYPE.PATH, [segmentParams]);
};


function AbsolutePathSegment(command, params, previous) {
    if (arguments.length > 0) this.init(command, params, previous);
}AbsolutePathSegment.prototype.init = function(command, params, previous) {
    this.command = command;
    this.previous = previous;
    this.points = [];
    var index = 0;
    while (index < params.length) {
        this.points.push(new Point2D$1(params[index], params[index + 1]));
        index += 2;
    }
};
AbsolutePathSegment.prototype.getLastPoint = function() {
    return this.points[this.points.length - 1];
};
AbsolutePathSegment.prototype.getIntersectionParams = function() {
    return null;
};



function AbsoluteArcPath(params, previous) {
    if (arguments.length > 0) {
        this.init("A", params, previous);
    }
}
AbsoluteArcPath.prototype = new AbsolutePathSegment();
AbsoluteArcPath.prototype.constructor = AbsoluteCurveto2;
AbsoluteArcPath.superclass = AbsolutePathSegment.prototype;

AbsoluteArcPath.prototype.init = function(command, params, previous) {
    var point = new Array();
    var y = params.pop();
    var x = params.pop();
    point.push(x, y);
    AbsoluteArcPath.superclass.init.call(this, command, point, previous);
    this.rx = parseFloat(params.shift());
    this.ry = parseFloat(params.shift());
    this.angle = parseFloat(params.shift());
    this.arcFlag = parseFloat(params.shift());
    this.sweepFlag = parseFloat(params.shift());
};
AbsoluteArcPath.prototype.getIntersectionParams = function() {
    return IntersectionParams.newArc(this.previous.getLastPoint(),
                                     this.points[0],
                                     this.rx,
                                     this.ry,
                                     this.angle,
                                     this.arcFlag,
                                     this.sweepFlag);
};


function AbsoluteCurveto2(params, previous) {
    if (arguments.length > 0) {
        this.init("Q", params, previous);
    }
}
AbsoluteCurveto2.prototype = new AbsolutePathSegment();
AbsoluteCurveto2.prototype.constructor = AbsoluteCurveto2;
AbsoluteCurveto2.superclass = AbsolutePathSegment.prototype;

AbsoluteCurveto2.prototype.getIntersectionParams = function() {
    return IntersectionParams.newBezier2(this.previous.getLastPoint(), this.points[0], this.points[1]);
};



function AbsoluteCurveto3(params, previous) {
    if (arguments.length > 0) {
        this.init("C", params, previous);
    }
}
AbsoluteCurveto3.prototype = new AbsolutePathSegment();
AbsoluteCurveto3.prototype.constructor = AbsoluteCurveto3;
AbsoluteCurveto3.superclass = AbsolutePathSegment.prototype;

AbsoluteCurveto3.prototype.getLastControlPoint = function() {
    return this.points[1];
};
AbsoluteCurveto3.prototype.getIntersectionParams = function() {
    return IntersectionParams.newBezier3(this.previous.getLastPoint(), this.points[0], this.points[1], this.points[2]);
};


function AbsoluteHLineto(params, previous) {
    if (arguments.length > 0) {
        this.init("H", params, previous);
    }
}
AbsoluteHLineto.prototype = new AbsolutePathSegment();
AbsoluteHLineto.prototype.constructor = AbsoluteHLineto;
AbsoluteHLineto.superclass = AbsolutePathSegment.prototype;

AbsoluteHLineto.prototype.init = function(command, params, previous) {
    var prevPoint = previous.getLastPoint();
    var point = new Array();
    point.push(params.pop(), prevPoint.y);
    AbsoluteHLineto.superclass.init.call(this, command, point, previous);
};

function AbsoluteVLineto(params, previous) {
    if (arguments.length > 0) {
        this.init("V", params, previous);
    }
}
AbsoluteVLineto.prototype = new AbsolutePathSegment();
AbsoluteVLineto.prototype.constructor = AbsoluteVLineto;
AbsoluteVLineto.superclass = AbsolutePathSegment.prototype;

AbsoluteVLineto.prototype.init = function(command, params, previous) {
    var prevPoint = previous.getLastPoint();
    var point = new Array();
    point.push(prevPoint.x, params.pop());
    AbsoluteVLineto.superclass.init.call(this, command, point, previous);
};


function AbsoluteLineto(params, previous) {
    if (arguments.length > 0) {
        this.init("L", params, previous);
    }
}
AbsoluteLineto.prototype = new AbsolutePathSegment();
AbsoluteLineto.prototype.constructor = AbsoluteLineto;
AbsoluteLineto.superclass = AbsolutePathSegment.prototype;

AbsoluteLineto.prototype.getIntersectionParams = function() {
    return IntersectionParams.newLine(this.previous.getLastPoint(), this.points[0]);
};



function AbsoluteMoveto(params, previous) {
    if (arguments.length > 0) {
        this.init("M", params, previous);
    }
}
AbsoluteMoveto.prototype = new AbsolutePathSegment();
AbsoluteMoveto.prototype.constructor = AbsoluteMoveto;
AbsoluteMoveto.superclass = AbsolutePathSegment.prototype;


function AbsoluteSmoothCurveto2(params, previous) {
    if (arguments.length > 0) {
        this.init("T", params, previous);
    }
}
AbsoluteSmoothCurveto2.prototype = new AbsolutePathSegment();
AbsoluteSmoothCurveto2.prototype.constructor = AbsoluteSmoothCurveto2;
AbsoluteSmoothCurveto2.superclass = AbsolutePathSegment.prototype;

AbsoluteSmoothCurveto2.prototype.getControlPoint = function() {
    var lastPoint = this.previous.getLastPoint();
    var point;
    if (this.previous.command.match(/^[QqTt]$/)) {
        var ctrlPoint = this.previous.getControlPoint();
        var diff = ctrlPoint.subtract(lastPoint);
        point = lastPoint.subtract(diff);
    } else {
        point = lastPoint;
    }
    return point;
};
AbsoluteSmoothCurveto2.prototype.getIntersectionParams = function() {
    return IntersectionParams.newBezier2(this.previous.getLastPoint(), this.getControlPoint(), this.points[0]);
};


function AbsoluteSmoothCurveto3(params, previous) {
    if (arguments.length > 0) {
        this.init("S", params, previous);
    }
}
AbsoluteSmoothCurveto3.prototype = new AbsolutePathSegment();
AbsoluteSmoothCurveto3.prototype.constructor = AbsoluteSmoothCurveto3;
AbsoluteSmoothCurveto3.superclass = AbsolutePathSegment.prototype;

AbsoluteSmoothCurveto3.prototype.getFirstControlPoint = function() {
    var lastPoint = this.previous.getLastPoint();
    var point;
    if (this.previous.command.match(/^[SsCc]$/)) {
        var lastControl = this.previous.getLastControlPoint();
        var diff = lastControl.subtract(lastPoint);
        point = lastPoint.subtract(diff);
    } else {
        point = lastPoint;
    }
    return point;
};
AbsoluteSmoothCurveto3.prototype.getLastControlPoint = function() {
    return this.points[0];
};
AbsoluteSmoothCurveto3.prototype.getIntersectionParams = function() {
    return IntersectionParams.newBezier3(this.previous.getLastPoint(), this.getFirstControlPoint(), this.points[0], this.points[1]);
};


function RelativePathSegment(command, params, previous) {
    if (arguments.length > 0) this.init(command, params, previous);
}
RelativePathSegment.prototype = new AbsolutePathSegment();
RelativePathSegment.prototype.constructor = RelativePathSegment;
RelativePathSegment.superclass = AbsolutePathSegment.prototype;

RelativePathSegment.prototype.init = function(command, params, previous) {
    this.command = command;
    this.previous = previous;
    this.points = [];
    var lastPoint;
    if (this.previous) lastPoint = this.previous.getLastPoint();
    else lastPoint = new Point2D$1(0, 0);
    var index = 0;
    while (index < params.length) {
        var point = new Point2D$1(lastPoint.x + params[index], lastPoint.y + params[index + 1]);
        this.points.push(point);
        index += 2;
    }
};

function RelativeClosePath(params, previous) {
    if (arguments.length > 0) {
        this.init("z", params, previous);
    }
}
RelativeClosePath.prototype = new RelativePathSegment();
RelativeClosePath.prototype.constructor = RelativeClosePath;
RelativeClosePath.superclass = RelativePathSegment.prototype;
RelativeClosePath.prototype.getLastPoint = function() {
    var current = this.previous;
    var point;
    while (current) {
        if (current.command.match(/^[mMzZ]$/)) {
            point = current.getLastPoint();
            break;
        }
        current = current.previous;
    }
    return point;
};
RelativeClosePath.prototype.getIntersectionParams = function() {
    return IntersectionParams.newLine(this.previous.getLastPoint(), this.getLastPoint());
};


function RelativeCurveto2(params, previous) {
    if (arguments.length > 0) {
        this.init("q", params, previous);
    }
}
RelativeCurveto2.prototype = new RelativePathSegment();
RelativeCurveto2.prototype.constructor = RelativeCurveto2;
RelativeCurveto2.superclass = RelativePathSegment.prototype;

RelativeCurveto2.prototype.getControlPoint = function() {
    return this.points[0];
};
RelativeCurveto2.prototype.getIntersectionParams = function() {
    return IntersectionParams.newBezier2(this.previous.getLastPoint(), this.points[0], this.points[1]);
};


function RelativeCurveto3(params, previous) {
    if (arguments.length > 0) {
        this.init("c", params, previous);
    }
}
RelativeCurveto3.prototype = new RelativePathSegment();
RelativeCurveto3.prototype.constructor = RelativeCurveto3;
RelativeCurveto3.superclass = RelativePathSegment.prototype;

RelativeCurveto3.prototype.getLastControlPoint = function() {
    return this.points[1];
};
RelativeCurveto3.prototype.getIntersectionParams = function() {
    return IntersectionParams.newBezier3(this.previous.getLastPoint(), this.points[0], this.points[1], this.points[2]);
};


function RelativeLineto(params, previous) {
    if (arguments.length > 0) {
        this.init("l", params, previous);
    }
}
RelativeLineto.prototype = new RelativePathSegment();
RelativeLineto.prototype.constructor = RelativeLineto;
RelativeLineto.superclass = RelativePathSegment.prototype;

RelativeLineto.prototype.toString = function() {
    var points = new Array();
    var lastPoint;
    var point;
    if (this.previous) lastPoint = this.previous.getLastPoint();
    else lastPoint = new Point(0, 0);
    point = this.points[0].subtract(lastPoint);
    if (this.previous.constructor != this.constuctor)
        if (this.previous.constructor != RelativeMoveto) cmd = this.command;
    return cmd + point.toString();
};
RelativeLineto.prototype.getIntersectionParams = function() {
    return IntersectionParams.newLine(this.previous.getLastPoint(), this.points[0]);
};



function RelativeMoveto(params, previous) {
    if (arguments.length > 0) {
        this.init("m", params, previous);
    }
}
RelativeMoveto.prototype = new RelativePathSegment();
RelativeMoveto.prototype.constructor = RelativeMoveto;
RelativeMoveto.superclass = RelativePathSegment.prototype;



function RelativeSmoothCurveto2(params, previous) {
    if (arguments.length > 0) {
        this.init("t", params, previous);
    }
}
RelativeSmoothCurveto2.prototype = new RelativePathSegment();
RelativeSmoothCurveto2.prototype.constructor = RelativeSmoothCurveto2;
RelativeSmoothCurveto2.superclass = RelativePathSegment.prototype;

RelativeSmoothCurveto2.prototype.getControlPoint = function() {
    var lastPoint = this.previous.getLastPoint();
    var point;
    if (this.previous.command.match(/^[QqTt]$/)) {
        var ctrlPoint = this.previous.getControlPoint();
        var diff = ctrlPoint.subtract(lastPoint);
        point = lastPoint.subtract(diff);
    } else {
        point = lastPoint;
    }
    return point;
};
RelativeSmoothCurveto2.prototype.getIntersectionParams = function() {
    return IntersectionParams.newBezier2(this.previous.getLastPoint(), this.getControlPoint(), this.points[0]);
};



function RelativeSmoothCurveto3(params, previous) {
    if (arguments.length > 0) {
        this.init("s", params, previous);
    }
}
RelativeSmoothCurveto3.prototype = new RelativePathSegment();
RelativeSmoothCurveto3.prototype.constructor = RelativeSmoothCurveto3;
RelativeSmoothCurveto3.superclass = RelativePathSegment.prototype;

RelativeSmoothCurveto3.prototype.getFirstControlPoint = function() {
    var lastPoint = this.previous.getLastPoint();
    var point;
    if (this.previous.command.match(/^[SsCc]$/)) {
        var lastControl = this.previous.getLastControlPoint();
        var diff = lastControl.subtract(lastPoint);
        point = lastPoint.subtract(diff);
    } else {
        point = lastPoint;
    }
    return point;
};
RelativeSmoothCurveto3.prototype.getLastControlPoint = function() {
    return this.points[0];
};
RelativeSmoothCurveto3.prototype.getIntersectionParams = function() {
    return IntersectionParams.newBezier3(this.previous.getLastPoint(), this.getFirstControlPoint(), this.points[0], this.points[1]);
};


var IntersectionParams_1 = IntersectionParams;

/**
 *  Intersection
 */
function Intersection(status) {
    this.init(status);
}

/**
 *  init
 *
 *  @param {String} status
 *  @returns {Intersection}
 */
Intersection.prototype.init = function(status) {
    this.status = status;
    this.points = [];
};

/**
 *  appendPoint
 *
 *  @param {Point2D} point
 */
Intersection.prototype.appendPoint = function(point) {
    this.points.push(point);
};

/**
 *  appendPoints
 *
 *  @param {Array<Point2D>} points
 */
Intersection.prototype.appendPoints = function(points) {
    this.points = this.points.concat(points);
};

var Intersection_1 = Intersection;

var Point2D$2 = kldAffine.Point2D;
var Vector2D$1 = kldAffine.Vector2D;

var Polynomial$1 = kldPolynomial.Polynomial;

function removeMultipleRootsIn01(roots) {
    var ZEROepsilon = 1e-15;
    roots.sort(function (a, b) { return a - b; });
    for (var i = 1; i < roots.length;) {
        if (Math.abs(roots[i] - roots[i - 1]) < ZEROepsilon) {
            roots.splice(i, 1);
        }
        else {
            i++;
        }
    }
}

var bezier = {};

/**
 *  intersectBezier2Bezier2
 *
 *  @param {Point2D} a1
 *  @param {Point2D} a2
 *  @param {Point2D} a3
 *  @param {Point2D} b1
 *  @param {Point2D} b2
 *  @param {Point2D} b3
 *  @returns {Intersection}
 */
var intersectBezier2Bezier2 = function(a1, a2, a3, b1, b2, b3) {
    var a, b;
    var c12, c11, c10;
    var c22, c21, c20;
    var result = new Intersection_1();
    var poly;

    a = a2.multiply(-2);
    c12 = a1.add(a.add(a3));

    a = a1.multiply(-2);
    b = a2.multiply(2);
    c11 = a.add(b);

    c10 = new Point2D$2(a1.x, a1.y);

    a = b2.multiply(-2);
    c22 = b1.add(a.add(b3));

    a = b1.multiply(-2);
    b = b2.multiply(2);
    c21 = a.add(b);

    c20 = new Point2D$2(b1.x, b1.y);

    var v0, v1, v2, v3, v4, v5, v6;
    if ( c12.y === 0 ) {
        v0 = c12.x*(c10.y - c20.y);
        v1 = v0 - c11.x*c11.y;
        v2 = v0 + v1;
        v3 = c11.y*c11.y;

        poly = new Polynomial$1(
            c12.x*c22.y*c22.y,
            2*c12.x*c21.y*c22.y,
            c12.x*c21.y*c21.y - c22.x*v3 - c22.y*v0 - c22.y*v1,
            -c21.x*v3 - c21.y*v0 - c21.y*v1,
            (c10.x - c20.x)*v3 + (c10.y - c20.y)*v1
        );
    } else {
        v0 = c12.x*c22.y - c12.y*c22.x;
        v1 = c12.x*c21.y - c21.x*c12.y;
        v2 = c11.x*c12.y - c11.y*c12.x;
        v3 = c10.y - c20.y;
        v4 = c12.y*(c10.x - c20.x) - c12.x*v3;
        v5 = -c11.y*v2 + c12.y*v4;
        v6 = v2*v2;

        poly = new Polynomial$1(
            v0*v0,
            2*v0*v1,
            (-c22.y*v6 + c12.y*v1*v1 + c12.y*v0*v4 + v0*v5) / c12.y,
            (-c21.y*v6 + c12.y*v1*v4 + v1*v5) / c12.y,
            (v3*v6 + v4*v5) / c12.y
        );
    }

    var roots = poly.getRoots();
    for ( var i = 0; i < roots.length; i++ ) {
        var s = roots[i];

        if ( 0 <= s && s <= 1 ) {
            var xRoots = new Polynomial$1(
                c12.x,
                c11.x,
                c10.x - c20.x - s*c21.x - s*s*c22.x
            ).getRoots();
            var yRoots = new Polynomial$1(
                c12.y,
                c11.y,
                c10.y - c20.y - s*c21.y - s*s*c22.y
            ).getRoots();

            if ( xRoots.length > 0 && yRoots.length > 0 ) {
                var TOLERANCE = 1e-4;

                checkRoots:
                    for ( var j = 0; j < xRoots.length; j++ ) {
                        var xRoot = xRoots[j];

                        if ( 0 <= xRoot && xRoot <= 1 ) {
                            for ( var k = 0; k < yRoots.length; k++ ) {
                                if ( Math.abs( xRoot - yRoots[k] ) < TOLERANCE ) {
                                    result.points.push( c22.multiply(s*s).add(c21.multiply(s).add(c20)) );
                                    break checkRoots;
                                }
                            }
                        }
                    }
            }
        }
    }

    return result;
};


/**
 *  intersectBezier2Bezier3
 *
 *  @param {Point2D} a1
 *  @param {Point2D} a2
 *  @param {Point2D} a3
 *  @param {Point2D} b1
 *  @param {Point2D} b2
 *  @param {Point2D} b3
 *  @param {Point2D} b4
 *  @returns {Intersection}
 */
var intersectBezier2Bezier3 = function(a1, a2, a3, b1, b2, b3, b4) {
    var a, b,c, d;
    var c12, c11, c10;
    var c23, c22, c21, c20;
    var result = new Intersection_1();

    a = a2.multiply(-2);
    c12 = a1.add(a.add(a3));

    a = a1.multiply(-2);
    b = a2.multiply(2);
    c11 = a.add(b);

    c10 = new Point2D$2(a1.x, a1.y);

    a = b1.multiply(-1);
    b = b2.multiply(3);
    c = b3.multiply(-3);
    d = a.add(b.add(c.add(b4)));
    c23 = new Vector2D$1(d.x, d.y);

    a = b1.multiply(3);
    b = b2.multiply(-6);
    c = b3.multiply(3);
    d = a.add(b.add(c));
    c22 = new Vector2D$1(d.x, d.y);

    a = b1.multiply(-3);
    b = b2.multiply(3);
    c = a.add(b);
    c21 = new Vector2D$1(c.x, c.y);

    c20 = new Vector2D$1(b1.x, b1.y);

    var c10x2 = c10.x*c10.x;
    var c10y2 = c10.y*c10.y;
    var c11x2 = c11.x*c11.x;
    var c11y2 = c11.y*c11.y;
    var c12x2 = c12.x*c12.x;
    var c12y2 = c12.y*c12.y;
    var c20x2 = c20.x*c20.x;
    var c20y2 = c20.y*c20.y;
    var c21x2 = c21.x*c21.x;
    var c21y2 = c21.y*c21.y;
    var c22x2 = c22.x*c22.x;
    var c22y2 = c22.y*c22.y;
    var c23x2 = c23.x*c23.x;
    var c23y2 = c23.y*c23.y;

    var poly = new Polynomial$1(
        -2*c12.x*c12.y*c23.x*c23.y + c12x2*c23y2 + c12y2*c23x2,
        -2*c12.x*c12.y*c22.x*c23.y - 2*c12.x*c12.y*c22.y*c23.x + 2*c12y2*c22.x*c23.x +
            2*c12x2*c22.y*c23.y,
        -2*c12.x*c21.x*c12.y*c23.y - 2*c12.x*c12.y*c21.y*c23.x - 2*c12.x*c12.y*c22.x*c22.y +
            2*c21.x*c12y2*c23.x + c12y2*c22x2 + c12x2*(2*c21.y*c23.y + c22y2),
        2*c10.x*c12.x*c12.y*c23.y + 2*c10.y*c12.x*c12.y*c23.x + c11.x*c11.y*c12.x*c23.y +
            c11.x*c11.y*c12.y*c23.x - 2*c20.x*c12.x*c12.y*c23.y - 2*c12.x*c20.y*c12.y*c23.x -
            2*c12.x*c21.x*c12.y*c22.y - 2*c12.x*c12.y*c21.y*c22.x - 2*c10.x*c12y2*c23.x -
            2*c10.y*c12x2*c23.y + 2*c20.x*c12y2*c23.x + 2*c21.x*c12y2*c22.x -
            c11y2*c12.x*c23.x - c11x2*c12.y*c23.y + c12x2*(2*c20.y*c23.y + 2*c21.y*c22.y),
        2*c10.x*c12.x*c12.y*c22.y + 2*c10.y*c12.x*c12.y*c22.x + c11.x*c11.y*c12.x*c22.y +
            c11.x*c11.y*c12.y*c22.x - 2*c20.x*c12.x*c12.y*c22.y - 2*c12.x*c20.y*c12.y*c22.x -
            2*c12.x*c21.x*c12.y*c21.y - 2*c10.x*c12y2*c22.x - 2*c10.y*c12x2*c22.y +
            2*c20.x*c12y2*c22.x - c11y2*c12.x*c22.x - c11x2*c12.y*c22.y + c21x2*c12y2 +
            c12x2*(2*c20.y*c22.y + c21y2),
        2*c10.x*c12.x*c12.y*c21.y + 2*c10.y*c12.x*c21.x*c12.y + c11.x*c11.y*c12.x*c21.y +
            c11.x*c11.y*c21.x*c12.y - 2*c20.x*c12.x*c12.y*c21.y - 2*c12.x*c20.y*c21.x*c12.y -
            2*c10.x*c21.x*c12y2 - 2*c10.y*c12x2*c21.y + 2*c20.x*c21.x*c12y2 -
            c11y2*c12.x*c21.x - c11x2*c12.y*c21.y + 2*c12x2*c20.y*c21.y,
        -2*c10.x*c10.y*c12.x*c12.y - c10.x*c11.x*c11.y*c12.y - c10.y*c11.x*c11.y*c12.x +
            2*c10.x*c12.x*c20.y*c12.y + 2*c10.y*c20.x*c12.x*c12.y + c11.x*c20.x*c11.y*c12.y +
            c11.x*c11.y*c12.x*c20.y - 2*c20.x*c12.x*c20.y*c12.y - 2*c10.x*c20.x*c12y2 +
            c10.x*c11y2*c12.x + c10.y*c11x2*c12.y - 2*c10.y*c12x2*c20.y -
            c20.x*c11y2*c12.x - c11x2*c20.y*c12.y + c10x2*c12y2 + c10y2*c12x2 +
            c20x2*c12y2 + c12x2*c20y2
    );
    var roots = poly.getRootsInInterval(0,1);
    removeMultipleRootsIn01(roots);

    for ( var i = 0; i < roots.length; i++ ) {
        var s = roots[i];
        var xRoots = new Polynomial$1(
            c12.x,
            c11.x,
            c10.x - c20.x - s*c21.x - s*s*c22.x - s*s*s*c23.x
        ).getRoots();
        var yRoots = new Polynomial$1(
            c12.y,
            c11.y,
            c10.y - c20.y - s*c21.y - s*s*c22.y - s*s*s*c23.y
        ).getRoots();

        if ( xRoots.length > 0 && yRoots.length > 0 ) {
            var TOLERANCE = 1e-4;

            checkRoots:
                for ( var j = 0; j < xRoots.length; j++ ) {
                    var xRoot = xRoots[j];

                    if ( 0 <= xRoot && xRoot <= 1 ) {
                        for ( var k = 0; k < yRoots.length; k++ ) {
                            if ( Math.abs( xRoot - yRoots[k] ) < TOLERANCE ) {
                                var v = c23.multiply(s * s * s).add(c22.multiply(s * s).add(c21.multiply(s).add(c20)));
                                result.points.push(new Point2D$2(v.x, v.y));
                                break checkRoots;
                            }
                        }
                    }
                }
        }
    }

    return result;

};

/**
 *  intersectBezier2Ellipse
 *
 *  @param {Point2D} p1
 *  @param {Point2D} p2
 *  @param {Point2D} p3
 *  @param {Point2D} ec
 *  @param {Number} rx
 *  @param {Number} ry
 *  @returns {Intersection}
 */
var intersectBezier2Ellipse = function(p1, p2, p3, ec, rx, ry) {
    var a, b;       // temporary variables
    var c2, c1, c0; // coefficients of quadratic
    var result = new Intersection_1();

    a = p2.multiply(-2);
    c2 = p1.add(a.add(p3));

    a = p1.multiply(-2);
    b = p2.multiply(2);
    c1 = a.add(b);

    c0 = new Point2D$2(p1.x, p1.y);

    var rxrx  = rx*rx;
    var ryry  = ry*ry;
    var roots = new Polynomial$1(
        ryry*c2.x*c2.x + rxrx*c2.y*c2.y,
        2*(ryry*c2.x*c1.x + rxrx*c2.y*c1.y),
        ryry*(2*c2.x*c0.x + c1.x*c1.x) + rxrx*(2*c2.y*c0.y+c1.y*c1.y) -
            2*(ryry*ec.x*c2.x + rxrx*ec.y*c2.y),
        2*(ryry*c1.x*(c0.x-ec.x) + rxrx*c1.y*(c0.y-ec.y)),
        ryry*(c0.x*c0.x+ec.x*ec.x) + rxrx*(c0.y*c0.y + ec.y*ec.y) -
            2*(ryry*ec.x*c0.x + rxrx*ec.y*c0.y) - rxrx*ryry
    ).getRoots();

    for ( var i = 0; i < roots.length; i++ ) {
        var t = roots[i];

        if ( 0 <= t && t <= 1 )
            result.points.push( c2.multiply(t*t).add(c1.multiply(t).add(c0)) );
    }

    return result;
};


/**
 *  intersectBezier2Line
 *
 *  @param {Point2D} p1
 *  @param {Point2D} p2
 *  @param {Point2D} p3
 *  @param {Point2D} a1
 *  @param {Point2D} a2
 *  @returns {Intersection}
 */
var intersectBezier2Line = function(p1, p2, p3, a1, a2) {
    var a, b;             // temporary variables
    var c2, c1, c0;       // coefficients of quadratic
    var cl;               // c coefficient for normal form of line
    var n;                // normal for normal form of line
    var min = a1.min(a2); // used to determine if point is on line segment
    var max = a1.max(a2); // used to determine if point is on line segment
    var result = new Intersection_1();

    a = p2.multiply(-2);
    c2 = p1.add(a.add(p3));

    a = p1.multiply(-2);
    b = p2.multiply(2);
    c1 = a.add(b);

    c0 = new Point2D$2(p1.x, p1.y);

    // Convert line to normal form: ax + by + c = 0
    // Find normal to line: negative inverse of original line's slope
    n = new Vector2D$1(a1.y - a2.y, a2.x - a1.x);

    // Determine new c coefficient
    cl = a1.x*a2.y - a2.x*a1.y;

    // Transform cubic coefficients to line's coordinate system and find roots
    // of cubic
    roots = new Polynomial$1(
        n.dot(c2),
        n.dot(c1),
        n.dot(c0) + cl
    ).getRoots();

    // Any roots in closed interval [0,1] are intersections on Bezier, but
    // might not be on the line segment.
    // Find intersections and calculate point coordinates
    for ( var i = 0; i < roots.length; i++ ) {
        var t = roots[i];

        if ( 0 <= t && t <= 1 ) {
            // We're within the Bezier curve
            // Find point on Bezier
            var p4 = p1.lerp(p2, t);
            var p5 = p2.lerp(p3, t);

            var p6 = p4.lerp(p5, t);

            // See if point is on line segment
            // Had to make special cases for vertical and horizontal lines due
            // to slight errors in calculation of p6
            if ( a1.x == a2.x ) {
                if ( min.y <= p6.y && p6.y <= max.y ) {
                    result.appendPoint( p6 );
                }
            } else if ( a1.y == a2.y ) {
                if ( min.x <= p6.x && p6.x <= max.x ) {
                    result.appendPoint( p6 );
                }
            } else if (min.x <= p6.x && p6.x <= max.x && min.y <= p6.y && p6.y <= max.y) {
                result.appendPoint( p6 );
            }
        }
    }

    return result;
};


/**
 *  intersectBezier3Bezier3
 *
 *  @param {Point2D} a1
 *  @param {Point2D} a2
 *  @param {Point2D} a3
 *  @param {Point2D} a4
 *  @param {Point2D} b1
 *  @param {Point2D} b2
 *  @param {Point2D} b3
 *  @param {Point2D} b4
 *  @returns {Intersection}
 */
var intersectBezier3Bezier3 = function(a1, a2, a3, a4, b1, b2, b3, b4) {
    var a, b, c, d;         // temporary variables
    var c13, c12, c11, c10; // coefficients of cubic
    var c23, c22, c21, c20; // coefficients of cubic
    var result = new Intersection_1();

    // Calculate the coefficients of cubic polynomial
    a = a1.multiply(-1);
    b = a2.multiply(3);
    c = a3.multiply(-3);
    d = a.add(b.add(c.add(a4)));
    c13 = new Vector2D$1(d.x, d.y);

    a = a1.multiply(3);
    b = a2.multiply(-6);
    c = a3.multiply(3);
    d = a.add(b.add(c));
    c12 = new Vector2D$1(d.x, d.y);

    a = a1.multiply(-3);
    b = a2.multiply(3);
    c = a.add(b);
    c11 = new Vector2D$1(c.x, c.y);

    c10 = new Vector2D$1(a1.x, a1.y);

    a = b1.multiply(-1);
    b = b2.multiply(3);
    c = b3.multiply(-3);
    d = a.add(b.add(c.add(b4)));
    c23 = new Vector2D$1(d.x, d.y);

    a = b1.multiply(3);
    b = b2.multiply(-6);
    c = b3.multiply(3);
    d = a.add(b.add(c));
    c22 = new Vector2D$1(d.x, d.y);

    a = b1.multiply(-3);
    b = b2.multiply(3);
    c = a.add(b);
    c21 = new Vector2D$1(c.x, c.y);

    c20 = new Vector2D$1(b1.x, b1.y);

    var c10x2 = c10.x*c10.x;
    var c10x3 = c10.x*c10.x*c10.x;
    var c10y2 = c10.y*c10.y;
    var c10y3 = c10.y*c10.y*c10.y;
    var c11x2 = c11.x*c11.x;
    var c11x3 = c11.x*c11.x*c11.x;
    var c11y2 = c11.y*c11.y;
    var c11y3 = c11.y*c11.y*c11.y;
    var c12x2 = c12.x*c12.x;
    var c12x3 = c12.x*c12.x*c12.x;
    var c12y2 = c12.y*c12.y;
    var c12y3 = c12.y*c12.y*c12.y;
    var c13x2 = c13.x*c13.x;
    var c13x3 = c13.x*c13.x*c13.x;
    var c13y2 = c13.y*c13.y;
    var c13y3 = c13.y*c13.y*c13.y;
    var c20x2 = c20.x*c20.x;
    var c20x3 = c20.x*c20.x*c20.x;
    var c20y2 = c20.y*c20.y;
    var c20y3 = c20.y*c20.y*c20.y;
    var c21x2 = c21.x*c21.x;
    var c21x3 = c21.x*c21.x*c21.x;
    var c21y2 = c21.y*c21.y;
    var c22x2 = c22.x*c22.x;
    var c22x3 = c22.x*c22.x*c22.x;
    var c22y2 = c22.y*c22.y;
    var c23x2 = c23.x*c23.x;
    var c23x3 = c23.x*c23.x*c23.x;
    var c23y2 = c23.y*c23.y;
    var c23y3 = c23.y*c23.y*c23.y;
    var poly = new Polynomial$1(
        -c13x3*c23y3 + c13y3*c23x3 - 3*c13.x*c13y2*c23x2*c23.y +
            3*c13x2*c13.y*c23.x*c23y2,
        -6*c13.x*c22.x*c13y2*c23.x*c23.y + 6*c13x2*c13.y*c22.y*c23.x*c23.y + 3*c22.x*c13y3*c23x2 -
            3*c13x3*c22.y*c23y2 - 3*c13.x*c13y2*c22.y*c23x2 + 3*c13x2*c22.x*c13.y*c23y2,
        -6*c21.x*c13.x*c13y2*c23.x*c23.y - 6*c13.x*c22.x*c13y2*c22.y*c23.x + 6*c13x2*c22.x*c13.y*c22.y*c23.y +
            3*c21.x*c13y3*c23x2 + 3*c22x2*c13y3*c23.x + 3*c21.x*c13x2*c13.y*c23y2 - 3*c13.x*c21.y*c13y2*c23x2 -
            3*c13.x*c22x2*c13y2*c23.y + c13x2*c13.y*c23.x*(6*c21.y*c23.y + 3*c22y2) + c13x3*(-c21.y*c23y2 -
            2*c22y2*c23.y - c23.y*(2*c21.y*c23.y + c22y2)),
        c11.x*c12.y*c13.x*c13.y*c23.x*c23.y - c11.y*c12.x*c13.x*c13.y*c23.x*c23.y + 6*c21.x*c22.x*c13y3*c23.x +
            3*c11.x*c12.x*c13.x*c13.y*c23y2 + 6*c10.x*c13.x*c13y2*c23.x*c23.y - 3*c11.x*c12.x*c13y2*c23.x*c23.y -
            3*c11.y*c12.y*c13.x*c13.y*c23x2 - 6*c10.y*c13x2*c13.y*c23.x*c23.y - 6*c20.x*c13.x*c13y2*c23.x*c23.y +
            3*c11.y*c12.y*c13x2*c23.x*c23.y - 2*c12.x*c12y2*c13.x*c23.x*c23.y - 6*c21.x*c13.x*c22.x*c13y2*c23.y -
            6*c21.x*c13.x*c13y2*c22.y*c23.x - 6*c13.x*c21.y*c22.x*c13y2*c23.x + 6*c21.x*c13x2*c13.y*c22.y*c23.y +
            2*c12x2*c12.y*c13.y*c23.x*c23.y + c22x3*c13y3 - 3*c10.x*c13y3*c23x2 + 3*c10.y*c13x3*c23y2 +
            3*c20.x*c13y3*c23x2 + c12y3*c13.x*c23x2 - c12x3*c13.y*c23y2 - 3*c10.x*c13x2*c13.y*c23y2 +
            3*c10.y*c13.x*c13y2*c23x2 - 2*c11.x*c12.y*c13x2*c23y2 + c11.x*c12.y*c13y2*c23x2 - c11.y*c12.x*c13x2*c23y2 +
            2*c11.y*c12.x*c13y2*c23x2 + 3*c20.x*c13x2*c13.y*c23y2 - c12.x*c12y2*c13.y*c23x2 -
            3*c20.y*c13.x*c13y2*c23x2 + c12x2*c12.y*c13.x*c23y2 - 3*c13.x*c22x2*c13y2*c22.y +
            c13x2*c13.y*c23.x*(6*c20.y*c23.y + 6*c21.y*c22.y) + c13x2*c22.x*c13.y*(6*c21.y*c23.y + 3*c22y2) +
            c13x3*(-2*c21.y*c22.y*c23.y - c20.y*c23y2 - c22.y*(2*c21.y*c23.y + c22y2) - c23.y*(2*c20.y*c23.y + 2*c21.y*c22.y)),
        6*c11.x*c12.x*c13.x*c13.y*c22.y*c23.y + c11.x*c12.y*c13.x*c22.x*c13.y*c23.y + c11.x*c12.y*c13.x*c13.y*c22.y*c23.x -
            c11.y*c12.x*c13.x*c22.x*c13.y*c23.y - c11.y*c12.x*c13.x*c13.y*c22.y*c23.x - 6*c11.y*c12.y*c13.x*c22.x*c13.y*c23.x -
            6*c10.x*c22.x*c13y3*c23.x + 6*c20.x*c22.x*c13y3*c23.x + 6*c10.y*c13x3*c22.y*c23.y + 2*c12y3*c13.x*c22.x*c23.x -
            2*c12x3*c13.y*c22.y*c23.y + 6*c10.x*c13.x*c22.x*c13y2*c23.y + 6*c10.x*c13.x*c13y2*c22.y*c23.x +
            6*c10.y*c13.x*c22.x*c13y2*c23.x - 3*c11.x*c12.x*c22.x*c13y2*c23.y - 3*c11.x*c12.x*c13y2*c22.y*c23.x +
            2*c11.x*c12.y*c22.x*c13y2*c23.x + 4*c11.y*c12.x*c22.x*c13y2*c23.x - 6*c10.x*c13x2*c13.y*c22.y*c23.y -
            6*c10.y*c13x2*c22.x*c13.y*c23.y - 6*c10.y*c13x2*c13.y*c22.y*c23.x - 4*c11.x*c12.y*c13x2*c22.y*c23.y -
            6*c20.x*c13.x*c22.x*c13y2*c23.y - 6*c20.x*c13.x*c13y2*c22.y*c23.x - 2*c11.y*c12.x*c13x2*c22.y*c23.y +
            3*c11.y*c12.y*c13x2*c22.x*c23.y + 3*c11.y*c12.y*c13x2*c22.y*c23.x - 2*c12.x*c12y2*c13.x*c22.x*c23.y -
            2*c12.x*c12y2*c13.x*c22.y*c23.x - 2*c12.x*c12y2*c22.x*c13.y*c23.x - 6*c20.y*c13.x*c22.x*c13y2*c23.x -
            6*c21.x*c13.x*c21.y*c13y2*c23.x - 6*c21.x*c13.x*c22.x*c13y2*c22.y + 6*c20.x*c13x2*c13.y*c22.y*c23.y +
            2*c12x2*c12.y*c13.x*c22.y*c23.y + 2*c12x2*c12.y*c22.x*c13.y*c23.y + 2*c12x2*c12.y*c13.y*c22.y*c23.x +
            3*c21.x*c22x2*c13y3 + 3*c21x2*c13y3*c23.x - 3*c13.x*c21.y*c22x2*c13y2 - 3*c21x2*c13.x*c13y2*c23.y +
            c13x2*c22.x*c13.y*(6*c20.y*c23.y + 6*c21.y*c22.y) + c13x2*c13.y*c23.x*(6*c20.y*c22.y + 3*c21y2) +
            c21.x*c13x2*c13.y*(6*c21.y*c23.y + 3*c22y2) + c13x3*(-2*c20.y*c22.y*c23.y - c23.y*(2*c20.y*c22.y + c21y2) -
            c21.y*(2*c21.y*c23.y + c22y2) - c22.y*(2*c20.y*c23.y + 2*c21.y*c22.y)),
        c11.x*c21.x*c12.y*c13.x*c13.y*c23.y + c11.x*c12.y*c13.x*c21.y*c13.y*c23.x + c11.x*c12.y*c13.x*c22.x*c13.y*c22.y -
            c11.y*c12.x*c21.x*c13.x*c13.y*c23.y - c11.y*c12.x*c13.x*c21.y*c13.y*c23.x - c11.y*c12.x*c13.x*c22.x*c13.y*c22.y -
            6*c11.y*c21.x*c12.y*c13.x*c13.y*c23.x - 6*c10.x*c21.x*c13y3*c23.x + 6*c20.x*c21.x*c13y3*c23.x +
            2*c21.x*c12y3*c13.x*c23.x + 6*c10.x*c21.x*c13.x*c13y2*c23.y + 6*c10.x*c13.x*c21.y*c13y2*c23.x +
            6*c10.x*c13.x*c22.x*c13y2*c22.y + 6*c10.y*c21.x*c13.x*c13y2*c23.x - 3*c11.x*c12.x*c21.x*c13y2*c23.y -
            3*c11.x*c12.x*c21.y*c13y2*c23.x - 3*c11.x*c12.x*c22.x*c13y2*c22.y + 2*c11.x*c21.x*c12.y*c13y2*c23.x +
            4*c11.y*c12.x*c21.x*c13y2*c23.x - 6*c10.y*c21.x*c13x2*c13.y*c23.y - 6*c10.y*c13x2*c21.y*c13.y*c23.x -
            6*c10.y*c13x2*c22.x*c13.y*c22.y - 6*c20.x*c21.x*c13.x*c13y2*c23.y - 6*c20.x*c13.x*c21.y*c13y2*c23.x -
            6*c20.x*c13.x*c22.x*c13y2*c22.y + 3*c11.y*c21.x*c12.y*c13x2*c23.y - 3*c11.y*c12.y*c13.x*c22x2*c13.y +
            3*c11.y*c12.y*c13x2*c21.y*c23.x + 3*c11.y*c12.y*c13x2*c22.x*c22.y - 2*c12.x*c21.x*c12y2*c13.x*c23.y -
            2*c12.x*c21.x*c12y2*c13.y*c23.x - 2*c12.x*c12y2*c13.x*c21.y*c23.x - 2*c12.x*c12y2*c13.x*c22.x*c22.y -
            6*c20.y*c21.x*c13.x*c13y2*c23.x - 6*c21.x*c13.x*c21.y*c22.x*c13y2 + 6*c20.y*c13x2*c21.y*c13.y*c23.x +
            2*c12x2*c21.x*c12.y*c13.y*c23.y + 2*c12x2*c12.y*c21.y*c13.y*c23.x + 2*c12x2*c12.y*c22.x*c13.y*c22.y -
            3*c10.x*c22x2*c13y3 + 3*c20.x*c22x2*c13y3 + 3*c21x2*c22.x*c13y3 + c12y3*c13.x*c22x2 +
            3*c10.y*c13.x*c22x2*c13y2 + c11.x*c12.y*c22x2*c13y2 + 2*c11.y*c12.x*c22x2*c13y2 -
            c12.x*c12y2*c22x2*c13.y - 3*c20.y*c13.x*c22x2*c13y2 - 3*c21x2*c13.x*c13y2*c22.y +
            c12x2*c12.y*c13.x*(2*c21.y*c23.y + c22y2) + c11.x*c12.x*c13.x*c13.y*(6*c21.y*c23.y + 3*c22y2) +
            c21.x*c13x2*c13.y*(6*c20.y*c23.y + 6*c21.y*c22.y) + c12x3*c13.y*(-2*c21.y*c23.y - c22y2) +
            c10.y*c13x3*(6*c21.y*c23.y + 3*c22y2) + c11.y*c12.x*c13x2*(-2*c21.y*c23.y - c22y2) +
            c11.x*c12.y*c13x2*(-4*c21.y*c23.y - 2*c22y2) + c10.x*c13x2*c13.y*(-6*c21.y*c23.y - 3*c22y2) +
            c13x2*c22.x*c13.y*(6*c20.y*c22.y + 3*c21y2) + c20.x*c13x2*c13.y*(6*c21.y*c23.y + 3*c22y2) +
            c13x3*(-2*c20.y*c21.y*c23.y - c22.y*(2*c20.y*c22.y + c21y2) - c20.y*(2*c21.y*c23.y + c22y2) -
            c21.y*(2*c20.y*c23.y + 2*c21.y*c22.y)),
        -c10.x*c11.x*c12.y*c13.x*c13.y*c23.y + c10.x*c11.y*c12.x*c13.x*c13.y*c23.y + 6*c10.x*c11.y*c12.y*c13.x*c13.y*c23.x -
            6*c10.y*c11.x*c12.x*c13.x*c13.y*c23.y - c10.y*c11.x*c12.y*c13.x*c13.y*c23.x + c10.y*c11.y*c12.x*c13.x*c13.y*c23.x +
            c11.x*c11.y*c12.x*c12.y*c13.x*c23.y - c11.x*c11.y*c12.x*c12.y*c13.y*c23.x + c11.x*c20.x*c12.y*c13.x*c13.y*c23.y +
            c11.x*c20.y*c12.y*c13.x*c13.y*c23.x + c11.x*c21.x*c12.y*c13.x*c13.y*c22.y + c11.x*c12.y*c13.x*c21.y*c22.x*c13.y -
            c20.x*c11.y*c12.x*c13.x*c13.y*c23.y - 6*c20.x*c11.y*c12.y*c13.x*c13.y*c23.x - c11.y*c12.x*c20.y*c13.x*c13.y*c23.x -
            c11.y*c12.x*c21.x*c13.x*c13.y*c22.y - c11.y*c12.x*c13.x*c21.y*c22.x*c13.y - 6*c11.y*c21.x*c12.y*c13.x*c22.x*c13.y -
            6*c10.x*c20.x*c13y3*c23.x - 6*c10.x*c21.x*c22.x*c13y3 - 2*c10.x*c12y3*c13.x*c23.x + 6*c20.x*c21.x*c22.x*c13y3 +
            2*c20.x*c12y3*c13.x*c23.x + 2*c21.x*c12y3*c13.x*c22.x + 2*c10.y*c12x3*c13.y*c23.y - 6*c10.x*c10.y*c13.x*c13y2*c23.x +
            3*c10.x*c11.x*c12.x*c13y2*c23.y - 2*c10.x*c11.x*c12.y*c13y2*c23.x - 4*c10.x*c11.y*c12.x*c13y2*c23.x +
            3*c10.y*c11.x*c12.x*c13y2*c23.x + 6*c10.x*c10.y*c13x2*c13.y*c23.y + 6*c10.x*c20.x*c13.x*c13y2*c23.y -
            3*c10.x*c11.y*c12.y*c13x2*c23.y + 2*c10.x*c12.x*c12y2*c13.x*c23.y + 2*c10.x*c12.x*c12y2*c13.y*c23.x +
            6*c10.x*c20.y*c13.x*c13y2*c23.x + 6*c10.x*c21.x*c13.x*c13y2*c22.y + 6*c10.x*c13.x*c21.y*c22.x*c13y2 +
            4*c10.y*c11.x*c12.y*c13x2*c23.y + 6*c10.y*c20.x*c13.x*c13y2*c23.x + 2*c10.y*c11.y*c12.x*c13x2*c23.y -
            3*c10.y*c11.y*c12.y*c13x2*c23.x + 2*c10.y*c12.x*c12y2*c13.x*c23.x + 6*c10.y*c21.x*c13.x*c22.x*c13y2 -
            3*c11.x*c20.x*c12.x*c13y2*c23.y + 2*c11.x*c20.x*c12.y*c13y2*c23.x + c11.x*c11.y*c12y2*c13.x*c23.x -
            3*c11.x*c12.x*c20.y*c13y2*c23.x - 3*c11.x*c12.x*c21.x*c13y2*c22.y - 3*c11.x*c12.x*c21.y*c22.x*c13y2 +
            2*c11.x*c21.x*c12.y*c22.x*c13y2 + 4*c20.x*c11.y*c12.x*c13y2*c23.x + 4*c11.y*c12.x*c21.x*c22.x*c13y2 -
            2*c10.x*c12x2*c12.y*c13.y*c23.y - 6*c10.y*c20.x*c13x2*c13.y*c23.y - 6*c10.y*c20.y*c13x2*c13.y*c23.x -
            6*c10.y*c21.x*c13x2*c13.y*c22.y - 2*c10.y*c12x2*c12.y*c13.x*c23.y - 2*c10.y*c12x2*c12.y*c13.y*c23.x -
            6*c10.y*c13x2*c21.y*c22.x*c13.y - c11.x*c11.y*c12x2*c13.y*c23.y - 2*c11.x*c11y2*c13.x*c13.y*c23.x +
            3*c20.x*c11.y*c12.y*c13x2*c23.y - 2*c20.x*c12.x*c12y2*c13.x*c23.y - 2*c20.x*c12.x*c12y2*c13.y*c23.x -
            6*c20.x*c20.y*c13.x*c13y2*c23.x - 6*c20.x*c21.x*c13.x*c13y2*c22.y - 6*c20.x*c13.x*c21.y*c22.x*c13y2 +
            3*c11.y*c20.y*c12.y*c13x2*c23.x + 3*c11.y*c21.x*c12.y*c13x2*c22.y + 3*c11.y*c12.y*c13x2*c21.y*c22.x -
            2*c12.x*c20.y*c12y2*c13.x*c23.x - 2*c12.x*c21.x*c12y2*c13.x*c22.y - 2*c12.x*c21.x*c12y2*c22.x*c13.y -
            2*c12.x*c12y2*c13.x*c21.y*c22.x - 6*c20.y*c21.x*c13.x*c22.x*c13y2 - c11y2*c12.x*c12.y*c13.x*c23.x +
            2*c20.x*c12x2*c12.y*c13.y*c23.y + 6*c20.y*c13x2*c21.y*c22.x*c13.y + 2*c11x2*c11.y*c13.x*c13.y*c23.y +
            c11x2*c12.x*c12.y*c13.y*c23.y + 2*c12x2*c20.y*c12.y*c13.y*c23.x + 2*c12x2*c21.x*c12.y*c13.y*c22.y +
            2*c12x2*c12.y*c21.y*c22.x*c13.y + c21x3*c13y3 + 3*c10x2*c13y3*c23.x - 3*c10y2*c13x3*c23.y +
            3*c20x2*c13y3*c23.x + c11y3*c13x2*c23.x - c11x3*c13y2*c23.y - c11.x*c11y2*c13x2*c23.y +
            c11x2*c11.y*c13y2*c23.x - 3*c10x2*c13.x*c13y2*c23.y + 3*c10y2*c13x2*c13.y*c23.x - c11x2*c12y2*c13.x*c23.y +
            c11y2*c12x2*c13.y*c23.x - 3*c21x2*c13.x*c21.y*c13y2 - 3*c20x2*c13.x*c13y2*c23.y + 3*c20y2*c13x2*c13.y*c23.x +
            c11.x*c12.x*c13.x*c13.y*(6*c20.y*c23.y + 6*c21.y*c22.y) + c12x3*c13.y*(-2*c20.y*c23.y - 2*c21.y*c22.y) +
            c10.y*c13x3*(6*c20.y*c23.y + 6*c21.y*c22.y) + c11.y*c12.x*c13x2*(-2*c20.y*c23.y - 2*c21.y*c22.y) +
            c12x2*c12.y*c13.x*(2*c20.y*c23.y + 2*c21.y*c22.y) + c11.x*c12.y*c13x2*(-4*c20.y*c23.y - 4*c21.y*c22.y) +
            c10.x*c13x2*c13.y*(-6*c20.y*c23.y - 6*c21.y*c22.y) + c20.x*c13x2*c13.y*(6*c20.y*c23.y + 6*c21.y*c22.y) +
            c21.x*c13x2*c13.y*(6*c20.y*c22.y + 3*c21y2) + c13x3*(-2*c20.y*c21.y*c22.y - c20y2*c23.y -
            c21.y*(2*c20.y*c22.y + c21y2) - c20.y*(2*c20.y*c23.y + 2*c21.y*c22.y)),
        -c10.x*c11.x*c12.y*c13.x*c13.y*c22.y + c10.x*c11.y*c12.x*c13.x*c13.y*c22.y + 6*c10.x*c11.y*c12.y*c13.x*c22.x*c13.y -
            6*c10.y*c11.x*c12.x*c13.x*c13.y*c22.y - c10.y*c11.x*c12.y*c13.x*c22.x*c13.y + c10.y*c11.y*c12.x*c13.x*c22.x*c13.y +
            c11.x*c11.y*c12.x*c12.y*c13.x*c22.y - c11.x*c11.y*c12.x*c12.y*c22.x*c13.y + c11.x*c20.x*c12.y*c13.x*c13.y*c22.y +
            c11.x*c20.y*c12.y*c13.x*c22.x*c13.y + c11.x*c21.x*c12.y*c13.x*c21.y*c13.y - c20.x*c11.y*c12.x*c13.x*c13.y*c22.y -
            6*c20.x*c11.y*c12.y*c13.x*c22.x*c13.y - c11.y*c12.x*c20.y*c13.x*c22.x*c13.y - c11.y*c12.x*c21.x*c13.x*c21.y*c13.y -
            6*c10.x*c20.x*c22.x*c13y3 - 2*c10.x*c12y3*c13.x*c22.x + 2*c20.x*c12y3*c13.x*c22.x + 2*c10.y*c12x3*c13.y*c22.y -
            6*c10.x*c10.y*c13.x*c22.x*c13y2 + 3*c10.x*c11.x*c12.x*c13y2*c22.y - 2*c10.x*c11.x*c12.y*c22.x*c13y2 -
            4*c10.x*c11.y*c12.x*c22.x*c13y2 + 3*c10.y*c11.x*c12.x*c22.x*c13y2 + 6*c10.x*c10.y*c13x2*c13.y*c22.y +
            6*c10.x*c20.x*c13.x*c13y2*c22.y - 3*c10.x*c11.y*c12.y*c13x2*c22.y + 2*c10.x*c12.x*c12y2*c13.x*c22.y +
            2*c10.x*c12.x*c12y2*c22.x*c13.y + 6*c10.x*c20.y*c13.x*c22.x*c13y2 + 6*c10.x*c21.x*c13.x*c21.y*c13y2 +
            4*c10.y*c11.x*c12.y*c13x2*c22.y + 6*c10.y*c20.x*c13.x*c22.x*c13y2 + 2*c10.y*c11.y*c12.x*c13x2*c22.y -
            3*c10.y*c11.y*c12.y*c13x2*c22.x + 2*c10.y*c12.x*c12y2*c13.x*c22.x - 3*c11.x*c20.x*c12.x*c13y2*c22.y +
            2*c11.x*c20.x*c12.y*c22.x*c13y2 + c11.x*c11.y*c12y2*c13.x*c22.x - 3*c11.x*c12.x*c20.y*c22.x*c13y2 -
            3*c11.x*c12.x*c21.x*c21.y*c13y2 + 4*c20.x*c11.y*c12.x*c22.x*c13y2 - 2*c10.x*c12x2*c12.y*c13.y*c22.y -
            6*c10.y*c20.x*c13x2*c13.y*c22.y - 6*c10.y*c20.y*c13x2*c22.x*c13.y - 6*c10.y*c21.x*c13x2*c21.y*c13.y -
            2*c10.y*c12x2*c12.y*c13.x*c22.y - 2*c10.y*c12x2*c12.y*c22.x*c13.y - c11.x*c11.y*c12x2*c13.y*c22.y -
            2*c11.x*c11y2*c13.x*c22.x*c13.y + 3*c20.x*c11.y*c12.y*c13x2*c22.y - 2*c20.x*c12.x*c12y2*c13.x*c22.y -
            2*c20.x*c12.x*c12y2*c22.x*c13.y - 6*c20.x*c20.y*c13.x*c22.x*c13y2 - 6*c20.x*c21.x*c13.x*c21.y*c13y2 +
            3*c11.y*c20.y*c12.y*c13x2*c22.x + 3*c11.y*c21.x*c12.y*c13x2*c21.y - 2*c12.x*c20.y*c12y2*c13.x*c22.x -
            2*c12.x*c21.x*c12y2*c13.x*c21.y - c11y2*c12.x*c12.y*c13.x*c22.x + 2*c20.x*c12x2*c12.y*c13.y*c22.y -
            3*c11.y*c21x2*c12.y*c13.x*c13.y + 6*c20.y*c21.x*c13x2*c21.y*c13.y + 2*c11x2*c11.y*c13.x*c13.y*c22.y +
            c11x2*c12.x*c12.y*c13.y*c22.y + 2*c12x2*c20.y*c12.y*c22.x*c13.y + 2*c12x2*c21.x*c12.y*c21.y*c13.y -
            3*c10.x*c21x2*c13y3 + 3*c20.x*c21x2*c13y3 + 3*c10x2*c22.x*c13y3 - 3*c10y2*c13x3*c22.y + 3*c20x2*c22.x*c13y3 +
            c21x2*c12y3*c13.x + c11y3*c13x2*c22.x - c11x3*c13y2*c22.y + 3*c10.y*c21x2*c13.x*c13y2 -
            c11.x*c11y2*c13x2*c22.y + c11.x*c21x2*c12.y*c13y2 + 2*c11.y*c12.x*c21x2*c13y2 + c11x2*c11.y*c22.x*c13y2 -
            c12.x*c21x2*c12y2*c13.y - 3*c20.y*c21x2*c13.x*c13y2 - 3*c10x2*c13.x*c13y2*c22.y + 3*c10y2*c13x2*c22.x*c13.y -
            c11x2*c12y2*c13.x*c22.y + c11y2*c12x2*c22.x*c13.y - 3*c20x2*c13.x*c13y2*c22.y + 3*c20y2*c13x2*c22.x*c13.y +
            c12x2*c12.y*c13.x*(2*c20.y*c22.y + c21y2) + c11.x*c12.x*c13.x*c13.y*(6*c20.y*c22.y + 3*c21y2) +
            c12x3*c13.y*(-2*c20.y*c22.y - c21y2) + c10.y*c13x3*(6*c20.y*c22.y + 3*c21y2) +
            c11.y*c12.x*c13x2*(-2*c20.y*c22.y - c21y2) + c11.x*c12.y*c13x2*(-4*c20.y*c22.y - 2*c21y2) +
            c10.x*c13x2*c13.y*(-6*c20.y*c22.y - 3*c21y2) + c20.x*c13x2*c13.y*(6*c20.y*c22.y + 3*c21y2) +
            c13x3*(-2*c20.y*c21y2 - c20y2*c22.y - c20.y*(2*c20.y*c22.y + c21y2)),
        -c10.x*c11.x*c12.y*c13.x*c21.y*c13.y + c10.x*c11.y*c12.x*c13.x*c21.y*c13.y + 6*c10.x*c11.y*c21.x*c12.y*c13.x*c13.y -
            6*c10.y*c11.x*c12.x*c13.x*c21.y*c13.y - c10.y*c11.x*c21.x*c12.y*c13.x*c13.y + c10.y*c11.y*c12.x*c21.x*c13.x*c13.y -
            c11.x*c11.y*c12.x*c21.x*c12.y*c13.y + c11.x*c11.y*c12.x*c12.y*c13.x*c21.y + c11.x*c20.x*c12.y*c13.x*c21.y*c13.y +
            6*c11.x*c12.x*c20.y*c13.x*c21.y*c13.y + c11.x*c20.y*c21.x*c12.y*c13.x*c13.y - c20.x*c11.y*c12.x*c13.x*c21.y*c13.y -
            6*c20.x*c11.y*c21.x*c12.y*c13.x*c13.y - c11.y*c12.x*c20.y*c21.x*c13.x*c13.y - 6*c10.x*c20.x*c21.x*c13y3 -
            2*c10.x*c21.x*c12y3*c13.x + 6*c10.y*c20.y*c13x3*c21.y + 2*c20.x*c21.x*c12y3*c13.x + 2*c10.y*c12x3*c21.y*c13.y -
            2*c12x3*c20.y*c21.y*c13.y - 6*c10.x*c10.y*c21.x*c13.x*c13y2 + 3*c10.x*c11.x*c12.x*c21.y*c13y2 -
            2*c10.x*c11.x*c21.x*c12.y*c13y2 - 4*c10.x*c11.y*c12.x*c21.x*c13y2 + 3*c10.y*c11.x*c12.x*c21.x*c13y2 +
            6*c10.x*c10.y*c13x2*c21.y*c13.y + 6*c10.x*c20.x*c13.x*c21.y*c13y2 - 3*c10.x*c11.y*c12.y*c13x2*c21.y +
            2*c10.x*c12.x*c21.x*c12y2*c13.y + 2*c10.x*c12.x*c12y2*c13.x*c21.y + 6*c10.x*c20.y*c21.x*c13.x*c13y2 +
            4*c10.y*c11.x*c12.y*c13x2*c21.y + 6*c10.y*c20.x*c21.x*c13.x*c13y2 + 2*c10.y*c11.y*c12.x*c13x2*c21.y -
            3*c10.y*c11.y*c21.x*c12.y*c13x2 + 2*c10.y*c12.x*c21.x*c12y2*c13.x - 3*c11.x*c20.x*c12.x*c21.y*c13y2 +
            2*c11.x*c20.x*c21.x*c12.y*c13y2 + c11.x*c11.y*c21.x*c12y2*c13.x - 3*c11.x*c12.x*c20.y*c21.x*c13y2 +
            4*c20.x*c11.y*c12.x*c21.x*c13y2 - 6*c10.x*c20.y*c13x2*c21.y*c13.y - 2*c10.x*c12x2*c12.y*c21.y*c13.y -
            6*c10.y*c20.x*c13x2*c21.y*c13.y - 6*c10.y*c20.y*c21.x*c13x2*c13.y - 2*c10.y*c12x2*c21.x*c12.y*c13.y -
            2*c10.y*c12x2*c12.y*c13.x*c21.y - c11.x*c11.y*c12x2*c21.y*c13.y - 4*c11.x*c20.y*c12.y*c13x2*c21.y -
            2*c11.x*c11y2*c21.x*c13.x*c13.y + 3*c20.x*c11.y*c12.y*c13x2*c21.y - 2*c20.x*c12.x*c21.x*c12y2*c13.y -
            2*c20.x*c12.x*c12y2*c13.x*c21.y - 6*c20.x*c20.y*c21.x*c13.x*c13y2 - 2*c11.y*c12.x*c20.y*c13x2*c21.y +
            3*c11.y*c20.y*c21.x*c12.y*c13x2 - 2*c12.x*c20.y*c21.x*c12y2*c13.x - c11y2*c12.x*c21.x*c12.y*c13.x +
            6*c20.x*c20.y*c13x2*c21.y*c13.y + 2*c20.x*c12x2*c12.y*c21.y*c13.y + 2*c11x2*c11.y*c13.x*c21.y*c13.y +
            c11x2*c12.x*c12.y*c21.y*c13.y + 2*c12x2*c20.y*c21.x*c12.y*c13.y + 2*c12x2*c20.y*c12.y*c13.x*c21.y +
            3*c10x2*c21.x*c13y3 - 3*c10y2*c13x3*c21.y + 3*c20x2*c21.x*c13y3 + c11y3*c21.x*c13x2 - c11x3*c21.y*c13y2 -
            3*c20y2*c13x3*c21.y - c11.x*c11y2*c13x2*c21.y + c11x2*c11.y*c21.x*c13y2 - 3*c10x2*c13.x*c21.y*c13y2 +
            3*c10y2*c21.x*c13x2*c13.y - c11x2*c12y2*c13.x*c21.y + c11y2*c12x2*c21.x*c13.y - 3*c20x2*c13.x*c21.y*c13y2 +
            3*c20y2*c21.x*c13x2*c13.y,
        c10.x*c10.y*c11.x*c12.y*c13.x*c13.y - c10.x*c10.y*c11.y*c12.x*c13.x*c13.y + c10.x*c11.x*c11.y*c12.x*c12.y*c13.y -
            c10.y*c11.x*c11.y*c12.x*c12.y*c13.x - c10.x*c11.x*c20.y*c12.y*c13.x*c13.y + 6*c10.x*c20.x*c11.y*c12.y*c13.x*c13.y +
            c10.x*c11.y*c12.x*c20.y*c13.x*c13.y - c10.y*c11.x*c20.x*c12.y*c13.x*c13.y - 6*c10.y*c11.x*c12.x*c20.y*c13.x*c13.y +
            c10.y*c20.x*c11.y*c12.x*c13.x*c13.y - c11.x*c20.x*c11.y*c12.x*c12.y*c13.y + c11.x*c11.y*c12.x*c20.y*c12.y*c13.x +
            c11.x*c20.x*c20.y*c12.y*c13.x*c13.y - c20.x*c11.y*c12.x*c20.y*c13.x*c13.y - 2*c10.x*c20.x*c12y3*c13.x +
            2*c10.y*c12x3*c20.y*c13.y - 3*c10.x*c10.y*c11.x*c12.x*c13y2 - 6*c10.x*c10.y*c20.x*c13.x*c13y2 +
            3*c10.x*c10.y*c11.y*c12.y*c13x2 - 2*c10.x*c10.y*c12.x*c12y2*c13.x - 2*c10.x*c11.x*c20.x*c12.y*c13y2 -
            c10.x*c11.x*c11.y*c12y2*c13.x + 3*c10.x*c11.x*c12.x*c20.y*c13y2 - 4*c10.x*c20.x*c11.y*c12.x*c13y2 +
            3*c10.y*c11.x*c20.x*c12.x*c13y2 + 6*c10.x*c10.y*c20.y*c13x2*c13.y + 2*c10.x*c10.y*c12x2*c12.y*c13.y +
            2*c10.x*c11.x*c11y2*c13.x*c13.y + 2*c10.x*c20.x*c12.x*c12y2*c13.y + 6*c10.x*c20.x*c20.y*c13.x*c13y2 -
            3*c10.x*c11.y*c20.y*c12.y*c13x2 + 2*c10.x*c12.x*c20.y*c12y2*c13.x + c10.x*c11y2*c12.x*c12.y*c13.x +
            c10.y*c11.x*c11.y*c12x2*c13.y + 4*c10.y*c11.x*c20.y*c12.y*c13x2 - 3*c10.y*c20.x*c11.y*c12.y*c13x2 +
            2*c10.y*c20.x*c12.x*c12y2*c13.x + 2*c10.y*c11.y*c12.x*c20.y*c13x2 + c11.x*c20.x*c11.y*c12y2*c13.x -
            3*c11.x*c20.x*c12.x*c20.y*c13y2 - 2*c10.x*c12x2*c20.y*c12.y*c13.y - 6*c10.y*c20.x*c20.y*c13x2*c13.y -
            2*c10.y*c20.x*c12x2*c12.y*c13.y - 2*c10.y*c11x2*c11.y*c13.x*c13.y - c10.y*c11x2*c12.x*c12.y*c13.y -
            2*c10.y*c12x2*c20.y*c12.y*c13.x - 2*c11.x*c20.x*c11y2*c13.x*c13.y - c11.x*c11.y*c12x2*c20.y*c13.y +
            3*c20.x*c11.y*c20.y*c12.y*c13x2 - 2*c20.x*c12.x*c20.y*c12y2*c13.x - c20.x*c11y2*c12.x*c12.y*c13.x +
            3*c10y2*c11.x*c12.x*c13.x*c13.y + 3*c11.x*c12.x*c20y2*c13.x*c13.y + 2*c20.x*c12x2*c20.y*c12.y*c13.y -
            3*c10x2*c11.y*c12.y*c13.x*c13.y + 2*c11x2*c11.y*c20.y*c13.x*c13.y + c11x2*c12.x*c20.y*c12.y*c13.y -
            3*c20x2*c11.y*c12.y*c13.x*c13.y - c10x3*c13y3 + c10y3*c13x3 + c20x3*c13y3 - c20y3*c13x3 -
            3*c10.x*c20x2*c13y3 - c10.x*c11y3*c13x2 + 3*c10x2*c20.x*c13y3 + c10.y*c11x3*c13y2 +
            3*c10.y*c20y2*c13x3 + c20.x*c11y3*c13x2 + c10x2*c12y3*c13.x - 3*c10y2*c20.y*c13x3 - c10y2*c12x3*c13.y +
            c20x2*c12y3*c13.x - c11x3*c20.y*c13y2 - c12x3*c20y2*c13.y - c10.x*c11x2*c11.y*c13y2 +
            c10.y*c11.x*c11y2*c13x2 - 3*c10.x*c10y2*c13x2*c13.y - c10.x*c11y2*c12x2*c13.y + c10.y*c11x2*c12y2*c13.x -
            c11.x*c11y2*c20.y*c13x2 + 3*c10x2*c10.y*c13.x*c13y2 + c10x2*c11.x*c12.y*c13y2 +
            2*c10x2*c11.y*c12.x*c13y2 - 2*c10y2*c11.x*c12.y*c13x2 - c10y2*c11.y*c12.x*c13x2 + c11x2*c20.x*c11.y*c13y2 -
            3*c10.x*c20y2*c13x2*c13.y + 3*c10.y*c20x2*c13.x*c13y2 + c11.x*c20x2*c12.y*c13y2 - 2*c11.x*c20y2*c12.y*c13x2 +
            c20.x*c11y2*c12x2*c13.y - c11.y*c12.x*c20y2*c13x2 - c10x2*c12.x*c12y2*c13.y - 3*c10x2*c20.y*c13.x*c13y2 +
            3*c10y2*c20.x*c13x2*c13.y + c10y2*c12x2*c12.y*c13.x - c11x2*c20.y*c12y2*c13.x + 2*c20x2*c11.y*c12.x*c13y2 +
            3*c20.x*c20y2*c13x2*c13.y - c20x2*c12.x*c12y2*c13.y - 3*c20x2*c20.y*c13.x*c13y2 + c12x2*c20y2*c12.y*c13.x
    );
    var roots = poly.getRootsInInterval(0,1);
    removeMultipleRootsIn01(roots);

    for ( var i = 0; i < roots.length; i++ ) {
        var s = roots[i];
        var xRoots = new Polynomial$1(
            c13.x,
            c12.x,
            c11.x,
            c10.x - c20.x - s*c21.x - s*s*c22.x - s*s*s*c23.x
        ).getRoots();
        var yRoots = new Polynomial$1(
            c13.y,
            c12.y,
            c11.y,
            c10.y - c20.y - s*c21.y - s*s*c22.y - s*s*s*c23.y
        ).getRoots();

        if ( xRoots.length > 0 && yRoots.length > 0 ) {
            var TOLERANCE = 1e-4;

            checkRoots:
                for ( var j = 0; j < xRoots.length; j++ ) {
                    var xRoot = xRoots[j];

                    if ( 0 <= xRoot && xRoot <= 1 ) {
                        for ( var k = 0; k < yRoots.length; k++ ) {
                            if ( Math.abs( xRoot - yRoots[k] ) < TOLERANCE ) {
                                var v = c23.multiply(s * s * s).add(c22.multiply(s * s).add(c21.multiply(s).add(c20)));
                                result.points.push(new Point2D$2(v.x, v.y));
                                break checkRoots;
                            }
                        }
                    }
                }
        }
    }

    return result;
};

/**
 *  intersectBezier3Ellipse
 *
 *  @param {Point2D} p1
 *  @param {Point2D} p2
 *  @param {Point2D} p3
 *  @param {Point2D} p4
 *  @param {Point2D} ec
 *  @param {Number} rx
 *  @param {Number} ry
 *  @returns {Intersection}
 */
var intersectBezier3Ellipse = function(p1, p2, p3, p4, ec, rx, ry) {
    var a, b, c, d;       // temporary variables
    var c3, c2, c1, c0;   // coefficients of cubic
    var result = new Intersection_1();

    // Calculate the coefficients of cubic polynomial
    a = p1.multiply(-1);
    b = p2.multiply(3);
    c = p3.multiply(-3);
    d = a.add(b.add(c.add(p4)));
    c3 = new Vector2D$1(d.x, d.y);

    a = p1.multiply(3);
    b = p2.multiply(-6);
    c = p3.multiply(3);
    d = a.add(b.add(c));
    c2 = new Vector2D$1(d.x, d.y);

    a = p1.multiply(-3);
    b = p2.multiply(3);
    c = a.add(b);
    c1 = new Vector2D$1(c.x, c.y);

    c0 = new Vector2D$1(p1.x, p1.y);

    var rxrx  = rx*rx;
    var ryry  = ry*ry;
    var poly = new Polynomial$1(
        c3.x*c3.x*ryry + c3.y*c3.y*rxrx,
        2*(c3.x*c2.x*ryry + c3.y*c2.y*rxrx),
        2*(c3.x*c1.x*ryry + c3.y*c1.y*rxrx) + c2.x*c2.x*ryry + c2.y*c2.y*rxrx,
        2*c3.x*ryry*(c0.x - ec.x) + 2*c3.y*rxrx*(c0.y - ec.y) +
            2*(c2.x*c1.x*ryry + c2.y*c1.y*rxrx),
        2*c2.x*ryry*(c0.x - ec.x) + 2*c2.y*rxrx*(c0.y - ec.y) +
            c1.x*c1.x*ryry + c1.y*c1.y*rxrx,
        2*c1.x*ryry*(c0.x - ec.x) + 2*c1.y*rxrx*(c0.y - ec.y),
        c0.x*c0.x*ryry - 2*c0.y*ec.y*rxrx - 2*c0.x*ec.x*ryry +
            c0.y*c0.y*rxrx + ec.x*ec.x*ryry + ec.y*ec.y*rxrx - rxrx*ryry
    );
    var roots = poly.getRootsInInterval(0,1);
    removeMultipleRootsIn01(roots);

    for ( var i = 0; i < roots.length; i++ ) {
        var t = roots[i];
        var v = c3.multiply(t * t * t).add(c2.multiply(t * t).add(c1.multiply(t).add(c0)));
        result.points.push(new Point2D$2(v.x, v.y));
    }

    return result;
};


/**
 *  intersectBezier3Line
 *
 *  Many thanks to Dan Sunday at SoftSurfer.com.  He gave me a very thorough
 *  sketch of the algorithm used here.  Without his help, I'm not sure when I
 *  would have figured out this intersection problem.
 *
 *  @param {Point2D} p1
 *  @param {Point2D} p2
 *  @param {Point2D} p3
 *  @param {Point2D} p4
 *  @param {Point2D} a1
 *  @param {Point2D} a2
 *  @returns {Intersection}
 */
var intersectBezier3Line = function(p1, p2, p3, p4, a1, a2) {
    var a, b, c, d;       // temporary variables
    var c3, c2, c1, c0;   // coefficients of cubic
    var cl;               // c coefficient for normal form of line
    var n;                // normal for normal form of line
    var min = a1.min(a2); // used to determine if point is on line segment
    var max = a1.max(a2); // used to determine if point is on line segment
    var result = new Intersection_1();

    // Start with Bezier using Bernstein polynomials for weighting functions:
    //     (1-t^3)P1 + 3t(1-t)^2P2 + 3t^2(1-t)P3 + t^3P4
    //
    // Expand and collect terms to form linear combinations of original Bezier
    // controls.  This ends up with a vector cubic in t:
    //     (-P1+3P2-3P3+P4)t^3 + (3P1-6P2+3P3)t^2 + (-3P1+3P2)t + P1
    //             /\                  /\                /\       /\
    //             ||                  ||                ||       ||
    //             c3                  c2                c1       c0

    // Calculate the coefficients
    a = p1.multiply(-1);
    b = p2.multiply(3);
    c = p3.multiply(-3);
    d = a.add(b.add(c.add(p4)));
    c3 = new Vector2D$1(d.x, d.y);

    a = p1.multiply(3);
    b = p2.multiply(-6);
    c = p3.multiply(3);
    d = a.add(b.add(c));
    c2 = new Vector2D$1(d.x, d.y);

    a = p1.multiply(-3);
    b = p2.multiply(3);
    c = a.add(b);
    c1 = new Vector2D$1(c.x, c.y);

    c0 = new Vector2D$1(p1.x, p1.y);

    // Convert line to normal form: ax + by + c = 0
    // Find normal to line: negative inverse of original line's slope
    n = new Vector2D$1(a1.y - a2.y, a2.x - a1.x);

    // Determine new c coefficient
    cl = a1.x*a2.y - a2.x*a1.y;

    // ?Rotate each cubic coefficient using line for new coordinate system?
    // Find roots of rotated cubic
    roots = new Polynomial$1(
        n.dot(c3),
        n.dot(c2),
        n.dot(c1),
        n.dot(c0) + cl
    ).getRoots();

    // Any roots in closed interval [0,1] are intersections on Bezier, but
    // might not be on the line segment.
    // Find intersections and calculate point coordinates
    for ( var i = 0; i < roots.length; i++ ) {
        var t = roots[i];

        if ( 0 <= t && t <= 1 ) {
            // We're within the Bezier curve
            // Find point on Bezier
            var p5 = p1.lerp(p2, t);
            var p6 = p2.lerp(p3, t);
            var p7 = p3.lerp(p4, t);

            var p8 = p5.lerp(p6, t);
            var p9 = p6.lerp(p7, t);

            var p10 = p8.lerp(p9, t);

            // See if point is on line segment
            // Had to make special cases for vertical and horizontal lines due
            // to slight errors in calculation of p10
            if ( a1.x == a2.x ) {
                if ( min.y <= p10.y && p10.y <= max.y ) {
                    result.appendPoint( p10 );
                }
            } else if ( a1.y == a2.y ) {
                if ( min.x <= p10.x && p10.x <= max.x ) {
                    result.appendPoint( p10 );
                }
            } else if (min.x <= p10.x && p10.x <= max.x && min.y <= p10.y && p10.y <= max.y) {
                result.appendPoint( p10 );
            }
        }
    }

    return result;
};
bezier.intersectBezier2Bezier2 = intersectBezier2Bezier2;
bezier.intersectBezier2Bezier3 = intersectBezier2Bezier3;
bezier.intersectBezier2Ellipse = intersectBezier2Ellipse;
bezier.intersectBezier2Line = intersectBezier2Line;
bezier.intersectBezier3Bezier3 = intersectBezier3Bezier3;
bezier.intersectBezier3Ellipse = intersectBezier3Ellipse;
bezier.intersectBezier3Line = intersectBezier3Line;

/**
 *
 *  Intersection.js
 *
 *  copyright 2002, 2013 Kevin Lindsey
 *
 *  contribution {@link http://github.com/Quazistax/kld-intersections}
 *      @copyright 2015 Robert Benko (Quazistax) <quazistax@gmail.com>
 *      @license MIT
 */

var Point2D$3 = kldAffine.Point2D;
var Vector2D$2 = kldAffine.Vector2D;
var Matrix2D$1 = kldAffine.Matrix2D;
var Polynomial$2 = kldPolynomial.Polynomial;




var IPTYPE$1 = IntersectionParams_1.TYPE;



/**
 *  bezout
 *
 *  This code is based on MgcIntr2DElpElp.cpp written by David Eberly.  His
 *  code along with many other excellent examples are avaiable at his site:
 *  http://www.geometrictools.com
 *
 *  @param {Array<Point2D>} e1
 *  @param {Array<Point2D>} e2
 *  @returns {Polynomial}
 */
function bezout(e1, e2) {
    var AB    = e1[0]*e2[1] - e2[0]*e1[1];
    var AC    = e1[0]*e2[2] - e2[0]*e1[2];
    var AD    = e1[0]*e2[3] - e2[0]*e1[3];
    var AE    = e1[0]*e2[4] - e2[0]*e1[4];
    var AF    = e1[0]*e2[5] - e2[0]*e1[5];
    var BC    = e1[1]*e2[2] - e2[1]*e1[2];
    var BE    = e1[1]*e2[4] - e2[1]*e1[4];
    var BF    = e1[1]*e2[5] - e2[1]*e1[5];
    var CD    = e1[2]*e2[3] - e2[2]*e1[3];
    var DE    = e1[3]*e2[4] - e2[3]*e1[4];
    var DF    = e1[3]*e2[5] - e2[3]*e1[5];
    var BFpDE = BF + DE;
    var BEmCD = BE - CD;

    return new Polynomial$2(
        AB*BC - AC*AC,
        AB*BEmCD + AD*BC - 2*AC*AE,
        AB*BFpDE + AD*BEmCD - AE*AE - 2*AC*AF,
        AB*DF + AD*BFpDE - 2*AE*AF,
        AD*DF - AF*AF
    );
}

/**
    Removes from intersection points those points that are not between two rays determined by arc parameters.
    Rays begin at ellipse center and go through arc startPoint/endPoint.

    @param {Intersection} intersection - will be modified and returned
    @param {Point2D} c - center of arc ellipse
    @param {Number} rx
    @param {Number} ry
    @param {Number} phi - in radians
    @param {Number} th1 - in radians
    @param {Number} dth - in radians
    @param {Matrix2D} [m] - arc transformation matrix
    @returns {Intersection}
*/
function removePointsNotInArc(intersection, c, rx, ry, phi, th1, dth, m) {
    if (intersection.points.length === 0) return intersection;
    if (m && !m.isIdentity())
        var mp = m.inverse();
    var np = [];
    var vx = new Vector2D$2(1, 0);
    var pi2 = Math.PI * 2;
    var wasNeg = dth < 0;
    var wasBig = Math.abs(dth) > Math.PI;
    var m1 = new Matrix2D$1().scaleNonUniform(1, ry / rx).rotate(th1);
    var m2 = new Matrix2D$1().scaleNonUniform(1, ry / rx).rotate(th1 + dth);

    th1 = (vx.angleBetween(vx.transform(m1)) + pi2) % pi2;
    dth = vx.transform(m1).angleBetween(vx.transform(m2));
    dth = (wasBig ? pi2 - Math.abs(dth) : Math.abs(dth)) * (wasNeg ? -1 : 1);
    var m3 = new Matrix2D$1().rotate(phi).multiply(m1);

    for (var i = 0, p, a; i < intersection.points.length; i++) {
        p = intersection.points[i];
        a = vx.transform(m3).angleBetween(Vector2D$2.fromPoints(c, (mp) ? p.transform(mp) : p));
        if (dth >= 0) {
            a = (a + 2 * pi2) % pi2;
            if (a <= dth)
                np.push(p);
        } else {
            a = (a - 2 * pi2) % pi2;
            if (a >= dth)
                np.push(p);
        }
    }
    intersection.points = np;
    return intersection;
}
/**
    points1 will be modified, points close (almost identical) to any point in points2 will be removed

    @param {Array<Point2D>} points1 - will be modified, points close to any point in points2 will be removed
    @param {Array<Point2D>} points2
*/
function removeClosePoints(points1, points2) {
    if (points1.length === 0 || points2.length === 0)
        return;
    var maxf = function (p, v) { if (p < v.x) p = v.x; if (p < v.y) p = v.y; return p; };
    var max = points1.reduce(maxf, 0);
    max = points2.reduce(maxf, max);
    var ERRF = 1e-15;
    var ZEROepsilon = 100 * max * ERRF * Math.SQRT2;
    var j;
    for (var i = 0; i < points1.length;) {
        for (j = 0; j < points2.length; j++) {
            if (points1[i].distanceFrom(points2[j]) <= ZEROepsilon) {
                points1.splice(i, 1);
                break;
            }
        }
        if (j == points2.length)
            i++;
    }
}

var intersectionFunctions = {

    /**
        intersectPathShape

        @param {IntersectionParams} path
        @param {IntersectionParams} shape
        @param {Matrix2D} [m1]
        @param {Matrix2D} [m2]
        @returns {Intersection}
    */
    intersectPathShape: function (path, shape, m1, m2) {
        var result = new Intersection_1();
        var pathParams = path.params[0];
        var previnter;
        for (var inter, i = 0; i < pathParams.length; i++) {
            inter = intersect(pathParams[i], shape, m1, m2);
            if (previnter) {
                removeClosePoints(previnter.points, inter.points);
                result.appendPoints(previnter.points);
            }
            previnter = inter;
        }
        if (previnter) {
            result.appendPoints(previnter.points);
        }
        return result;
    },


    /**
        intersectLinesShape

        @param {IntersectionParams} lines - IntersectionParams with points as first parameter (like types RECT, POLYLINE or POLYGON)
        @param {IntersectionParams} shape - IntersectionParams of other shape
        @param {Matrix2D} [m1]
        @param {Matrix2D} [m2]
        @param {Boolean} [closed] - if set, determines if line between first and last point will be taken into callculation too. If not set, it's true for RECT and POLYGON, false for other <b>lines</b> types.
        @returns {Intersection}
    */
    intersectLinesShape: function (lines, shape, m1, m2, closed) {
        var IPTYPE = IntersectionParams_1.TYPE;
        var line_points = lines.params[0];
        var ip = new IntersectionParams_1(IPTYPE.LINE, [0, 0]);
        var result = new Intersection_1();
        var inter, i;
        var intersectLine = function (i1, i2) {
            ip.params[0] = line_points[i1];
            ip.params[1] = line_points[i2];
            inter = intersect(ip, shape, m1, m2);
            removeClosePoints(inter.points, [line_points[i2]]);
            result.appendPoints(inter.points);
        };
        for (i = 0; i < line_points.length - 1; i++) {
            intersectLine(i, i + 1);
        }
        if (typeof closed !== 'undefined' && closed || lines.type === IPTYPE.RECT || lines.type === IPTYPE.POLYGON) {
            intersectLine(line_points.length - 1, 0);
        }
        return result;
    },

    ///////////////////////////////////////////////////////////////////
    /**
        intersectArcShape

        @param {IntersectionParams} arc
        @param {IntersectionParams} shape
        @param {Matrix2D} [m1]
        @param {Matrix2D} [m2]
        @returns {Intersection}
    */
    intersectArcShape: function (arc, shape, m1, m2) {
        m1 = m1 || Matrix2D$1.IDENTITY;
        m2 = m2 || Matrix2D$1.IDENTITY;
        var c1 = arc.params[0],
            rx1 = arc.params[1],
            ry1 = arc.params[2],
            phi1 = arc.params[3],
            th1 = arc.params[4],
            dth1 = arc.params[5];

        var res;
        if (m1.isIdentity() && phi1 === 0) {
            res = intersect(IntersectionParams_1.newEllipse(c1, rx1, ry1), shape, m1, m2);
        }
        else {
            m1 = m1.multiply(Matrix2D$1.IDENTITY.translate(c1.x, c1.y).rotate(phi1));
            c1 = new Point2D$3(0, 0);
            phi1 = 0;
            res = intersect(IntersectionParams_1.newEllipse(c1, rx1, ry1), shape, m1, m2);
        }
        res = removePointsNotInArc(res, c1, rx1, ry1, phi1, th1, dth1, m1);
        return res;
    },

    /**
     *  Finds intersection points of two ellipses. <br/>
     *
     *  This code is based on MgcIntr2DElpElp.cpp written by David Eberly. His
     *  code along with many other excellent examples are avaiable at his site:
     *  http://www.geometrictools.com
     *
     *  Changes - 2015 Robert Benko (Quazistax)
     *
     *  @param {Point2D} c1
     *  @param {Number} rx1
     *  @param {Number} ry1
     *  @param {Point2D} c2
     *  @param {Number} rx2
     *  @param {Number} ry2
     *  @returns {Intersection}
     */
    intersectEllipseEllipse: function (c1, rx1, ry1, c2, rx2, ry2) {
        var a = [
            ry1 * ry1, 0, rx1 * rx1, -2 * ry1 * ry1 * c1.x, -2 * rx1 * rx1 * c1.y,
            ry1 * ry1 * c1.x * c1.x + rx1 * rx1 * c1.y * c1.y - rx1 * rx1 * ry1 * ry1
        ];
        var b = [
            ry2 * ry2, 0, rx2 * rx2, -2 * ry2 * ry2 * c2.x, -2 * rx2 * rx2 * c2.y,
            ry2 * ry2 * c2.x * c2.x + rx2 * rx2 * c2.y * c2.y - rx2 * rx2 * ry2 * ry2
        ];

        var yPoly = bezout(a, b);
        var yRoots = yPoly.getRoots();
        var epsilon = 1e-3;
        var norm0 = (a[0] * a[0] + 2 * a[1] * a[1] + a[2] * a[2]) * epsilon;
        var norm1 = (b[0] * b[0] + 2 * b[1] * b[1] + b[2] * b[2]) * epsilon;
        var result = new Intersection_1();

        var i;
        //Handling root calculation error causing not detecting intersection
        var clip = function (val, min, max) { return Math.max(min, Math.min(max, val)); };
        for (i = 0 ; i < yRoots.length; i++) {
            yRoots[i] = clip(yRoots[i], c1.y - ry1, c1.y + ry1);
            yRoots[i] = clip(yRoots[i], c2.y - ry2, c2.y + ry2);
        }

        //For detection of multiplicated intersection points
        yRoots.sort(function (a, b) { return a - b; });
        var rootPointsN = [];

        for (var y = 0; y < yRoots.length; y++) {
            var xPoly = new Polynomial$2(
                a[0],
                a[3] + yRoots[y] * a[1],
                a[5] + yRoots[y] * (a[4] + yRoots[y] * a[2])
            );
            var ERRF = 1e-15;
            if (Math.abs(xPoly.coefs[0]) < 10 * ERRF * Math.abs(xPoly.coefs[2]))
                xPoly.coefs[0] = 0;
            var xRoots = xPoly.getRoots();

            rootPointsN.push(0);
            for (var x = 0; x < xRoots.length; x++) {
                var test =
                    (a[0] * xRoots[x] + a[1] * yRoots[y] + a[3]) * xRoots[x] +
                    (a[2] * yRoots[y] + a[4]) * yRoots[y] + a[5];
                if (Math.abs(test) < norm0) {
                    test =
                        (b[0] * xRoots[x] + b[1] * yRoots[y] + b[3]) * xRoots[x] +
                        (b[2] * yRoots[y] + b[4]) * yRoots[y] + b[5];
                    if (Math.abs(test) < norm1) {
                        result.appendPoint(new Point2D$3(xRoots[x], yRoots[y]));
                        rootPointsN[y] += 1;
                    }
                }
            }
        }

        if (result.points.length <= 0)
            return result;

        //Removal of multiplicated intersection points
        var pts = result.points;
        if (pts.length == 8) {
            pts = pts.splice(0, 6);
            pts.splice(2, 2);
        }
        else if (pts.length == 7) {
            pts = pts.splice(0, 6);
            pts.splice(2, 2);
            pts.splice(rootPointsN.indexOf(1), 1);
        }
        else if (pts.length == 6) {
            pts.splice(2, 2);
            //console.log('ElEl 6pts: N: ' + rootPointsN.toString());
            if (rootPointsN.indexOf(0) > -1) {
                if (pts[0].distanceFrom(pts[1]) < pts[2].distanceFrom(pts[3])) {
                    pts.splice(0, 1);
                }
                else {
                    pts.splice(2, 1);
                }
            }
            else if (rootPointsN[0] == rootPointsN[3]) {
                pts.splice(1, 2);
            }
        }
        else if (pts.length == 4) {
            if (
                (yRoots.length == 2)
            || (yRoots.length == 4 && (rootPointsN[0] == 2 && rootPointsN[1] == 2 || rootPointsN[2] == 2 && rootPointsN[3] == 2))
            ) {
                pts.splice(2, 2);
            }
        }
        else if (pts.length == 3 || pts.length == 5) {
            i = rootPointsN.indexOf(2);
            if (i > -1) {
                if (pts.length == 3)
                    i = i % 2;
                var ii = i + (i % 2 ? -1 : 2);
                var d1, d2, d3;
                d1 = pts[i].distanceFrom(pts[i + 1]);
                d2 = pts[i].distanceFrom(pts[ii]);
                d3 = pts[i + 1].distanceFrom(pts[ii]);
                if (d1 < d2 && d1 < d3) {
                    pts.splice(i, 1);
                }
                else {
                    pts.splice(ii, 1);
                }
            }
        }
        var ZEROepsilon = yPoly.zeroErrorEstimate();
        ZEROepsilon *= 100 * Math.SQRT2;
        for (i = 0; i < pts.length - 1;) {
            if (pts[i].distanceFrom(pts[i + 1]) < ZEROepsilon) {
                pts.splice(i + 1, 1);
                continue;
            }
            i++;
        }

        result.points = pts;
        return result;
    },


    /**
     *  intersectEllipseLine
     *
     *  NOTE: Rotation will need to be added to this function
     *
     *  @param {Point2D} c
     *  @param {Number} rx
     *  @param {Number} ry
     *  @param {Point2D} a1
     *  @param {Point2D} a2
     *  @returns {Intersection}
     */
    intersectEllipseLine: function(c, rx, ry, a1, a2) {
        var result;
        var origin = new Vector2D$2(a1.x, a1.y);
        var dir    = Vector2D$2.fromPoints(a1, a2);
        var center = new Vector2D$2(c.x, c.y);
        var diff   = origin.subtract(center);
        var mDir   = new Vector2D$2( dir.x/(rx*rx),  dir.y/(ry*ry)  );
        var mDiff  = new Vector2D$2( diff.x/(rx*rx), diff.y/(ry*ry) );

        var a = dir.dot(mDir);
        var b = dir.dot(mDiff);
        var c = diff.dot(mDiff) - 1.0;
        var d = b*b - a*c;

        var ERRF = 1e-15;
        var ZEROepsilon = 10 * Math.max(Math.abs(a), Math.abs(b), Math.abs(c)) * ERRF;
        if (Math.abs(d) < ZEROepsilon) {
            d = 0;
        }

        if ( d < 0 ) {
            result = new Intersection_1("Outside");
        } else if ( d > 0 ) {
            var root = Math.sqrt(d);
            var t_a  = (-b - root) / a;
            var t_b  = (-b + root) / a;

            t_b = (t_b > 1) ? t_b - ERRF : (t_b < 0) ? t_b + ERRF : t_b;
            t_a = (t_a > 1) ? t_a - ERRF : (t_a < 0) ? t_a + ERRF : t_a;

            if ( (t_a < 0 || 1 < t_a) && (t_b < 0 || 1 < t_b) ) {
                if ( (t_a < 0 && t_b < 0) || (t_a > 1 && t_b > 1) )
                    result = new Intersection_1("Outside");
                else
                    result = new Intersection_1("Inside");
            } else {
                result = new Intersection_1();
                if ( 0 <= t_a && t_a <= 1 )
                    result.appendPoint( a1.lerp(a2, t_a) );
                if ( 0 <= t_b && t_b <= 1 )
                    result.appendPoint( a1.lerp(a2, t_b) );
            }
        } else {
            var t = -b/a;
            if ( 0 <= t && t <= 1 ) {
                result = new Intersection_1();
                result.appendPoint( a1.lerp(a2, t) );
            } else {
                result = new Intersection_1("Outside");
            }
        }

        return result;
    },


    /**
     *  intersectLineLine
     *
     *  @param {Point2D} a1
     *  @param {Point2D} a2
     *  @param {Point2D} b1
     *  @param {Point2D} b2
     *  @returns {Intersection}
     */
    intersectLineLine: function(a1, a2, b1, b2) {
        var result;
        var ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
        var ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
        var u_b  = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

        if ( u_b !== 0 ) {
            var ua = ua_t / u_b;
            var ub = ub_t / u_b;

            if ( 0 <= ua && ua <= 1 && 0 <= ub && ub <= 1 ) {
                result = new Intersection_1();
                result.points.push(
                    new Point2D$3(
                        a1.x + ua * (a2.x - a1.x),
                        a1.y + ua * (a2.y - a1.y)
                    )
                );
            } else {
                result = new Intersection_1();
            }
        } else {
            if ( ua_t === 0 || ub_t === 0 ) {
                result = new Intersection_1("Coincident");
            } else {
                result = new Intersection_1("Parallel");
            }
        }

        return result;
    },


    /**
     *  intersectRayRay
     *
     *  @param {Point2D} a1
     *  @param {Point2D} a2
     *  @param {Point2D} b1
     *  @param {Point2D} b2
     *  @returns {Intersection}
     */
    intersectRayRay: function(a1, a2, b1, b2) {
        var result;

        var ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
        var ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
        var u_b  = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

        if ( u_b !== 0 ) {
            var ua = ua_t / u_b;

            result = new Intersection_1();
            result.points.push(
                new Point2D$3(
                    a1.x + ua * (a2.x - a1.x),
                    a1.y + ua * (a2.y - a1.y)
                )
            );
        } else {
            if ( ua_t === 0 || ub_t === 0 ) {
                result = new Intersection_1("Coincident");
            } else {
                result = new Intersection_1("Parallel");
            }
        }

        return result;
    }
};

var composedShapeMethods = {};
composedShapeMethods[IPTYPE$1.PATH] = intersectionFunctions.intersectPathShape;
composedShapeMethods[IPTYPE$1.POLYLINE] = intersectionFunctions.intersectLinesShape;
composedShapeMethods[IPTYPE$1.POLYGON] = intersectionFunctions.intersectLinesShape;
composedShapeMethods[IPTYPE$1.RECT] = intersectionFunctions.intersectLinesShape;
composedShapeMethods[IPTYPE$1.ROUNDRECT] = intersectionFunctions.intersectPathShape;
composedShapeMethods[IPTYPE$1.ARC] = intersectionFunctions.intersectArcShape;



function intersect(shape1, shape2, m1, m2) {
    var ip1 = shape1;
    var ip2 = shape2;
    var result;

    if (ip1 !== null && ip2 !== null) {
        var method;
        if (method = composedShapeMethods[ip1.type]) {
            result = method(ip1, ip2, m1, m2);
        }
        else if (method = composedShapeMethods[ip2.type]) {
            result = method(ip2, ip1, m2, m1);
        }
        else {
            var params;

            var params1, params2, type1, type2;

            if (ip1.type === IPTYPE$1.CIRCLE) {
                params1 = [ip1.params[0], ip1.params[1], ip1.params[1]];
                type1 = IPTYPE$1.ELLIPSE;
            }
            else {
                params1 = ip1.params.slice();
                type1 = ip1.type;
            }

            if (ip2.type === IPTYPE$1.CIRCLE) {
                params2 = [ip2.params[0], ip2.params[1], ip2.params[1]];
                type2 = IPTYPE$1.ELLIPSE;
            }
            else {
                params2 = ip2.params.slice();
                type2 = ip2.type;
            }

            //var m1 = new Matrix2D(), m2 = new Matrix2D();
            var SMF = 1;
            var itm;
            var useCTM = (m1 instanceof Matrix2D$1 && m2 instanceof Matrix2D$1);// && (!m1.isIdentity() || !m2.isIdentity()));
            if (useCTM) {
                if (type1 === IPTYPE$1.ELLIPSE && type2 === IPTYPE$1.ELLIPSE) {
                    var m1_, m2_;
                    var d2;
                    var c1 = params1[0], rx1 = params1[1], ry1 = params1[2];
                    var c2 = params2[0], rx2 = params2[1], ry2 = params2[2];

                    m1 = m1.multiply(Matrix2D$1.IDENTITY.translate(c1.x, c1.y).scaleNonUniform(rx1 / SMF, ry1 / SMF));
                    c1 = new Point2D$3(0, 0);
                    rx1 = ry1 = SMF;

                    m2 = m2.multiply(Matrix2D$1.IDENTITY.translate(c2.x, c2.y).scaleNonUniform(rx2, ry2));
                    c2 = new Point2D$3(0, 0);
                    rx2 = ry2 = 1;

                    d2 = m1.inverse().multiply(m2).getDecomposition();
                    m1_ = d2.rotation.inverse().multiply(d2.translation.inverse());
                    m2_ = d2.scale;

                    rx2 = m2_.a;
                    ry2 = m2_.d;
                    c1 = c1.transform(m1_);
                    itm = m1.multiply(m1_.inverse());

                    params1[0] = c1;
                    params1[1] = rx1;
                    params1[2] = ry1;
                    params2[0] = c2;
                    params2[1] = rx2;
                    params2[2] = ry2;
                }
                else {
                    var transParams = function (type, params, m) {
                        var transParam = function (i) {
                            params[i] = params[i].transform(m);
                        };

                        if (type === IPTYPE$1.LINE) {
                            transParam(0);
                            transParam(1);
                        }
                        else if (type === IPTYPE$1.BEZIER2) {
                            transParam(0);
                            transParam(1);
                            transParam(2);
                        }
                        else if (type === IPTYPE$1.BEZIER3) {
                            transParam(0);
                            transParam(1);
                            transParam(2);
                            transParam(3);
                        }
                        else {
                            throw new Error('Unknown shape: ' + type);
                        }
                    };

                    if (type2 === IPTYPE$1.ELLIPSE) {
                        var tmp;
                        tmp = params2; params2 = params1; params1 = tmp;
                        tmp = type2; type2 = type1; type1 = tmp;
                        tmp = m2; m2 = m1; m1 = tmp;
                    }

                    if (type1 === IPTYPE$1.ELLIPSE) {
                        var c1 = params1[0], rx1 = params1[1], ry1 = params1[2];

                        m1 = m1.multiply(Matrix2D$1.IDENTITY.translate(c1.x, c1.y).scaleNonUniform(rx1 / SMF, ry1 / SMF));
                        c1 = new Point2D$3(0, 0);
                        rx1 = ry1 = SMF;

                        m2_ = m1.inverse().multiply(m2);
                        transParams(type2, params2, m2_);

                        itm = m1;

                        params1[0] = c1;
                        params1[1] = rx1;
                        params1[2] = ry1;
                    }
                    else {
                        transParams(type1, params1, m1);
                        transParams(type2, params2, m2);
                        itm = Matrix2D$1.IDENTITY;
                    }
                }
            }

            if (type1 < type2) {
                method = "intersect" + type1 + type2;
                params = params1.concat(params2);
            } else {
                method = "intersect" + type2 + type1;
                params = params2.concat(params1);
            }

            result = intersectionFunctions[method].apply(null, params);

            if (useCTM) {
                for (var i = 0; i < result.points.length; i++) {
                    result.points[i] = result.points[i].transform(itm);
                }
            }
        }
    } else {
        result = new Intersection_1();
    }

    return result;
}

for(var key$2 in bezier) {
    if(bezier.hasOwnProperty(key$2)) {
        intersectionFunctions[key$2] = bezier[key$2];
    }
}

var intersect_1 = intersect;

// expose module classes

var intersect$1 = intersect_1;
var shape = IntersectionParams_1.newShape;

/**
 * Base class for all edge representations
 * @param {Canvas} canvas the svg canvas element to render the node on
 * @param {BaseNode} fromNode The from node
 * @param {BaseNode} toNode The to node
 */

var BaseEdge = /*#__PURE__*/function () {
  function BaseEdge(canvas, fromNode, toNode) {
    _classCallCheck(this, BaseEdge);

    this.svg = null;
    this.canvas = canvas;
    this.fromNode = fromNode;
    this.toNode = toNode;
    this.label = null; // node position

    this.initialX = 0;
    this.initialY = 0;
    this.finalToX = 0;
    this.finalToY = 0;
    this.finalFromX = 0;
    this.finalFromY = 0;
    this.opacity = 1;
    this.isHidden = false;
  }

  _createClass(BaseEdge, [{
    key: "calculateEdge",
    value: function calculateEdge() {
      var fx = this.fromNode.getFinalX();
      var fy = this.fromNode.getFinalY();
      var tx = this.toNode.getFinalX();
      var ty = this.toNode.getFinalY(); // this.canvas.circle(5).fill("#75f").center(fx, fy)
      // this.canvas.circle(5).fill("#000").center(tx, ty)

      var line = shape("line", {
        x1: fx,
        y1: fy,
        x2: tx,
        y2: ty
      }); // from intersection point calculation

      var w2 = this.fromNode.getNodeSize() === "min" ? this.fromNode.config.minWidth : this.fromNode.config.maxWidth;
      var h2 = this.fromNode.getNodeSize() === "min" ? this.fromNode.config.minHeight : this.fromNode.config.maxHeight;
      var rect2 = shape("rect", {
        x: fx - w2 / 2 - this.fromNode.config.borderStrokeWidth / 2 - this.config.offset / 2,
        y: fy - h2 / 2 - this.fromNode.config.borderStrokeWidth / 2 - this.config.offset / 2,
        width: w2 + this.fromNode.config.borderStrokeWidth + this.config.offset,
        height: h2 + this.fromNode.config.borderStrokeWidth + this.config.offset,
        rx: this.fromNode.config.borderRadius,
        ry: this.fromNode.config.borderRadius
      });
      var fromPoints = intersect$1(rect2, line); // console.log(fromPoints)

      this.finalFromX = fromPoints.points[0].x;
      this.finalFromY = fromPoints.points[0].y; // to intersection point calculation

      var w1 = this.toNode.getNodeSize() === "min" ? this.toNode.config.minWidth : this.toNode.config.maxWidth;
      var h1 = this.toNode.getNodeSize() === "min" ? this.toNode.config.minHeight : this.toNode.config.maxHeight;
      var rect1 = shape("rect", {
        x: tx - w1 / 2 - this.toNode.config.borderStrokeWidth / 2 - this.config.offset / 2,
        y: ty - h1 / 2 - this.toNode.config.borderStrokeWidth / 2 - this.config.offset / 2,
        width: w1 + this.toNode.config.borderStrokeWidth + this.config.offset,
        height: h1 + this.toNode.config.borderStrokeWidth + this.config.offset,
        rx: this.toNode.config.borderRadius,
        ry: this.toNode.config.borderRadius
      });
      var toPoints = intersect$1(rect1, line);
      this.finalToX = toPoints.points[0].x;
      this.finalToY = toPoints.points[0].y; // this.canvas.circle(5).fill("#75f").center(this.finalFromX, this.finalFromY)
      // this.canvas.circle(5).fill("#000").center(this.finalToX, this.finalToY)
    }
  }, {
    key: "updateEdgePosition",
    value: function updateEdgePosition() {
      var fx = this.fromNode.getFinalX();
      var fy = this.fromNode.getFinalY();
      var tx = this.toNode.getFinalX();
      var ty = this.toNode.getFinalY(); // this.canvas.circle(5).fill("#75f").center(fx, fy)
      // this.canvas.circle(5).fill("#000").center(tx, ty)

      var line = shape("line", {
        x1: fx,
        y1: fy,
        x2: tx,
        y2: ty
      }); // from intersection point calculation

      var w2 = this.fromNode.getNodeSize() === "min" ? this.fromNode.config.minWidth : this.fromNode.config.maxWidth;
      var h2 = this.fromNode.getNodeSize() === "min" ? this.fromNode.config.minHeight : this.fromNode.config.maxHeight;
      var rect2 = shape("rect", {
        x: fx - w2 / 2 - this.fromNode.config.borderStrokeWidth / 2 - this.config.offset / 2,
        y: fy - h2 / 2 - this.fromNode.config.borderStrokeWidth / 2 - this.config.offset / 2,
        width: w2 + this.fromNode.config.borderStrokeWidth + this.config.offset,
        height: h2 + this.fromNode.config.borderStrokeWidth + this.config.offset,
        rx: this.fromNode.config.borderRadius,
        ry: this.fromNode.config.borderRadius
      });
      var fromPoints = intersect$1(rect2, line); // console.log(fromPoints)

      this.finalFromX = fromPoints.points[0].x;
      this.finalFromY = fromPoints.points[0].y; // to intersection point calculation

      var w1 = this.toNode.getNodeSize() === "min" ? this.toNode.config.minWidth : this.toNode.config.maxWidth;
      var h1 = this.toNode.getNodeSize() === "min" ? this.toNode.config.minHeight : this.toNode.config.maxHeight;
      var rect1 = shape("rect", {
        x: tx - w1 / 2 - this.toNode.config.borderStrokeWidth / 2 - this.config.offset / 2,
        y: ty - h2 / 2 - this.toNode.config.borderStrokeWidth / 2 - this.config.offset / 2,
        width: w1 + this.toNode.config.borderStrokeWidth + this.config.offset,
        height: h1 + this.toNode.config.borderStrokeWidth + this.config.offset,
        rx: this.toNode.config.borderRadius,
        ry: this.toNode.config.borderRadius
      });
      var toPoints = intersect$1(rect1, line);
      this.finalToX = toPoints.points[0].x;
      this.finalToY = toPoints.points[0].y; // this.canvas.circle(5).fill("#75f").center(this.finalFromX, this.finalFromY)
      // this.canvas.circle(5).fill("#000").center(this.finalToX, this.finalToY)
    }
  }, {
    key: "removeEdge",
    value: function removeEdge(X, Y) {
      var _this = this;

      this.svg.attr({
        opacity: 1
      }).animate({
        duration: this.config.animationSpeed
      }).transform({
        scale: 0.001,
        position: [X, Y]
      }).attr({
        opacity: 0
      }).after(function () {
        _this.svg.remove();

        _this.svg = null;
      });
    }
    /**
     * Creates the edge label
     * @private
     */

  }, {
    key: "createLabel",
    value: function createLabel() {
      var fobj = this.canvas.foreignObject(0, 0);
      var background = document.createElement("div");
      background.style.background = this.config.labelBackground;
      background.style.padding = "".concat(this.config.offset / 2, "px");
      background.style.textAlign = "center";
      background.style.width = "100px";
      background.style.minWidth = "100px"; // FIXME: this creates a new row for each word

      var label = document.createElement("p");
      label.innerText = this.label;
      label.style.color = this.config.labelColor;
      label.style.fontSize = "".concat(this.config.labelFontSize, "px");
      label.style.fontFamily = this.config.labelFontFamily;
      label.style.fontWeight = this.config.labelFontWeight;
      label.style.fontStyle = this.config.labelFontStyle;
      clamp(label, {
        clamp: 2
      });
      background.appendChild(label);
      fobj.add(background);
      fobj.width(background.clientWidth);
      fobj.height(background.clientHeight);
      fobj.center(this.finalFromX, this.finalFromY);
      return fobj;
    }
  }, {
    key: "setLabel",
    value: function setLabel(label) {
      this.label = label || null;
    }
  }]);

  return BaseEdge;
}();

var ThinEdgeConfig = {
  offset: 8,
  animationSpeed: 300,
  type: "solid",
  // arrow
  strokeWidth: 2,
  strokeColor: "#aaa",
  strokeDasharray: "7 5",
  marker: "M 0 0 L 6 3 L 0 6 z",
  // text
  labelColor: "#777",
  labelFontFamily: "Montserrat",
  labelFontSize: 16,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#ffffffcc"
};

var ThinEdge = /*#__PURE__*/function (_BaseEdge) {
  _inherits(ThinEdge, _BaseEdge);

  function ThinEdge(canvas, fromNode, toNode) {
    var _this;

    var customThinEdgeConfig = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    _classCallCheck(this, ThinEdge);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ThinEdge).call(this, canvas, fromNode, toNode));
    _this.config = _objectSpread2({}, ThinEdgeConfig, {}, customThinEdgeConfig);
    return _this;
  }
  /**
   * Creates the initial SVG element and adds hover effect
   */


  _createClass(ThinEdge, [{
    key: "render",
    value: function render(X, Y) {
      var _this2 = this;

      var svg = this.canvas.group(); // .draggable()

      svg.css("cursor", "default");
      svg.id("edge#".concat(this.fromNode.id, "_").concat(this.toNode.id));
      var line = "M".concat(this.finalFromX, ",").concat(this.finalFromY, " L").concat(this.finalToX, ",").concat(this.finalToY);
      var dasharray = this.config.type === "dashed" ? this.config.strokeDasharray : "0";
      var path = this.canvas.path(line).stroke({
        width: this.config.strokeWidth,
        color: this.config.strokeColor,
        dasharray: dasharray
      }); // create a re-useable marker

      var i = _toConsumableArray(this.canvas.defs().node.childNodes).findIndex(function (d) {
        return d.id === "defaultThinMarker";
      });

      if (i === -1) {
        var marker = this.canvas.marker(12, 6, function (add) {
          add.path(_this2.config.marker).fill(_this2.config.strokeColor).dx(1);
        });
        marker.id("defaultThinMarker");
        this.canvas.defs().add(marker);
        path.marker("end", marker);
      } else {
        var _marker = this.canvas.defs().get(i);

        path.marker("end", _marker);
      }

      svg.add(path);

      if (this.label !== null) {
        var label = this.createLabel();
        svg.add(label);
      }

      svg.attr({
        opacity: 0
      });
      svg.center(X, Y);
      this.svg = svg;
    }
    /**
     * Transform an edge to its final rendered position
     */

  }, {
    key: "transformToFinalPosition",
    value: function transformToFinalPosition() {
      this.svg.back();
      this.svg.scale(0.001).attr({
        opacity: 1
      }).animate({
        duration: this.config.animationSpeed
      }).transform({
        scale: 1
      });
      this.svg.get(0).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).plot("M".concat(this.finalFromX, ",").concat(this.finalFromY, " L").concat(this.finalToX, ",").concat(this.finalToY)).attr({
        opacity: 1
      });

      if (this.label) {
        this.svg.get(1).attr({
          opacity: 0
        }).animate({
          duration: this.config.animationSpeed
        }).center((this.finalFromX + this.finalToX) / 2, (this.finalFromY + this.finalToY) / 2).attr({
          opacity: 1
        });
      }
    }
    /**
     * Transform an edge from its visible position to its initial rendered position
     * @param {Number} [X=finalFromX] The x-position the edge will be translated
     * @param {Number} [Y=finalFromY] The y-position the edge will be translated
     */

  }, {
    key: "transformToInitialPosition",
    value: function transformToInitialPosition() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.finalFromX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.finalFromY;
      this.svg.back();
      this.svg.get(0).attr({
        opacity: 1
      }).animate({
        duration: this.config.animationSpeed
      }).plot("M".concat(X, ",").concat(Y, " L").concat(X, ",").concat(Y)).attr({
        opacity: 0
      });

      if (this.label) {
        this.svg.get(1).attr({
          opacity: 1
        }).animate({
          duration: this.config.animationSpeed
        }).center(X, Y).attr({
          opacity: 0
        });
      }
    }
  }]);

  return ThinEdge;
}(BaseEdge);

var BoldEdgeConfig = {
  offset: 8,
  animationSpeed: 300,
  color1: null,
  color2: null,
  blockarrowLineWidth: 3,
  blockarrowArrowWidth: 10,
  blockarrowArrowLength: 5,
  labelColor: "#222222",
  labelFontFamily: "Montserrat",
  labelFontSize: 16,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#ffffffcc",
  labelTranslateX: 0,
  labelTranslateY: 0
};

var BoldEdge = /*#__PURE__*/function (_BaseEdge) {
  _inherits(BoldEdge, _BaseEdge);

  function BoldEdge(canvas, fromNode, toNode) {
    var _this;

    var customBoldEdgeConfig = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    _classCallCheck(this, BoldEdge);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(BoldEdge).call(this, canvas, fromNode, toNode));
    _this.config = _objectSpread2({}, BoldEdgeConfig, {}, customBoldEdgeConfig);
    return _this;
  }
  /**
   * Creates the initial SVG element and adds hover effect
   */


  _createClass(BoldEdge, [{
    key: "render",
    value: function render() {
      var svg = this.canvas.group();
      svg.css("cursor", "default");
      svg.id("edge#".concat(this.fromNode.id, "_").concat(this.toNode.id));
      svg.attr({
        opacity: 0
      });
      this.svg = svg;
    }
    /**
     * Transform an edge to its final rendered position
     */

  }, {
    key: "transformToFinalPosition",
    value: function transformToFinalPosition() {
      this.svg.attr({
        opacity: 1
      }); // create new elements

      var lw = this.config.blockarrowLineWidth;
      var aw = this.config.blockarrowArrowWidth;
      var al = this.config.blockarrowArrowLength;
      var dx = this.finalToX - this.finalFromX;
      var dy = this.finalToY - this.finalFromY;
      var len = Math.sqrt(dx * dx + dy * dy);
      var dW = aw - lw;
      var angle = Math.atan2(dy, dx) * 180 / Math.PI;
      this.angle = angle;
      var svgPath = "\n      M 0,".concat(-lw / 2, "\n      h ").concat(len - al, "\n      v ").concat(-dW / 2, "\n      L ").concat(len, ",0\n      L ").concat(len - al, ",").concat(aw / 2, "\n      v ").concat(-dW / 2, "\n      H 0\n      Z\n    ");
      var path = this.canvas.path();
      path.plot(svgPath);

      var getColor = function getColor(where) {
        if (where.type === "requirement") {
          return where.config.backgroundColor;
        }

        return where.config.borderStrokeColor;
      };

      var c1 = this.config.color1 !== "null" ? this.config.color1 : getColor(this.fromNode);
      var c2 = this.config.color2 !== "null" ? this.config.color2 : getColor(this.toNode);
      var gradient = this.canvas.gradient("linear", function (add) {
        add.stop(0, c1);
        add.stop(1, c2);
      });
      path.fill(gradient);
      path.center(this.finalFromX, this.finalFromY);
      path.rotate(angle);
      path.scale(0.0001);
      this.svg.add(path);

      if (this.label !== null) {
        var label = this.createLabel();
        this.svg.add(label);
      } // put new elements into position


      this.svg.get(0).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).transform({
        scale: 1,
        rotate: angle,
        position: [(this.finalFromX + this.finalToX) / 2, (this.finalFromY + this.finalToY) / 2]
      }).attr({
        opacity: 1
      });

      if (this.label) {
        var cx = (this.finalFromX + this.finalToX) / 2 + this.config.labelTranslateX;
        var cy = (this.finalFromY + this.finalToY) / 2 + this.config.labelTranslateY;
        this.svg.get(1).attr({
          opacity: 0
        }).animate({
          duration: this.config.animationSpeed
        }).center(cx, cy).attr({
          opacity: 1
        });
      }
    }
    /**
     * Transform an edge from its visible position to its initial rendered position
     * @param {Number} [X=finalFromX] The x-position the edge will be translated
     * @param {Number} [Y=finalFromY] The y-position the edge will be translated
     */

  }, {
    key: "transformToInitialPosition",
    value: function transformToInitialPosition() {
      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.finalFromX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.finalFromY;
      var blockArrow = this.svg.get(0);
      var label = this.svg.get(1);
      blockArrow.attr({
        opacity: 1
      }).animate({
        duration: this.config.animationSpeed
      }).transform({
        position: [X, Y],
        scale: 0.0001,
        rotate: this.angle
      }).attr({
        opacity: 0
      }).after(function () {
        return blockArrow.remove();
      });

      if (this.label) {
        label.attr({
          opacity: 1
        }).animate({
          duration: this.config.animationSpeed
        }).transform({
          position: [X, Y],
          scale: 0.0001
        }).attr({
          opacity: 0
        }).after(function () {
          return label.remove();
        });
      }
    }
  }]);

  return BoldEdge;
}(BaseEdge);

var bind$1 = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return fn.apply(thisArg, args);
  };
};

/*global toString:true*/

// utils is a library of generic helper functions non-specific to axios

var toString$3 = Object.prototype.toString;

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
function isArray$2(val) {
  return toString$3.call(val) === '[object Array]';
}

/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */
function isUndefined(val) {
  return typeof val === 'undefined';
}

/**
 * Determine if a value is a Buffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Buffer, otherwise false
 */
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
    && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
function isArrayBuffer(val) {
  return toString$3.call(val) === '[object ArrayBuffer]';
}

/**
 * Determine if a value is a FormData
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an FormData, otherwise false
 */
function isFormData(val) {
  return (typeof FormData !== 'undefined') && (val instanceof FormData);
}

/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  var result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
    result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
  }
  return result;
}

/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */
function isString(val) {
  return typeof val === 'string';
}

/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */
function isNumber$1(val) {
  return typeof val === 'number';
}

/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
function isObject$2(val) {
  return val !== null && typeof val === 'object';
}

/**
 * Determine if a value is a Date
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
function isDate(val) {
  return toString$3.call(val) === '[object Date]';
}

/**
 * Determine if a value is a File
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
function isFile(val) {
  return toString$3.call(val) === '[object File]';
}

/**
 * Determine if a value is a Blob
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Blob, otherwise false
 */
function isBlob(val) {
  return toString$3.call(val) === '[object Blob]';
}

/**
 * Determine if a value is a Function
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
function isFunction(val) {
  return toString$3.call(val) === '[object Function]';
}

/**
 * Determine if a value is a Stream
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Stream, otherwise false
 */
function isStream(val) {
  return isObject$2(val) && isFunction(val.pipe);
}

/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
function isURLSearchParams(val) {
  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
}

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 * @returns {String} The String freed of excess whitespace
 */
function trim$4(str) {
  return str.replace(/^\s*/, '').replace(/\s*$/, '');
}

/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 * nativescript
 *  navigator.product -> 'NativeScript' or 'NS'
 */
function isStandardBrowserEnv() {
  if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                           navigator.product === 'NativeScript' ||
                                           navigator.product === 'NS')) {
    return false;
  }
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined'
  );
}

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray$2(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */) {
  var result = {};
  function assignValue(val, key) {
    if (typeof result[key] === 'object' && typeof val === 'object') {
      result[key] = merge(result[key], val);
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Function equal to merge with the difference being that no reference
 * to original objects is kept.
 *
 * @see merge
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
function deepMerge(/* obj1, obj2, obj3, ... */) {
  var result = {};
  function assignValue(val, key) {
    if (typeof result[key] === 'object' && typeof val === 'object') {
      result[key] = deepMerge(result[key], val);
    } else if (typeof val === 'object') {
      result[key] = deepMerge({}, val);
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 * @return {Object} The resulting value of object a
 */
function extend$1(a, b, thisArg) {
  forEach(b, function assignValue(val, key) {
    if (thisArg && typeof val === 'function') {
      a[key] = bind$1(val, thisArg);
    } else {
      a[key] = val;
    }
  });
  return a;
}

var utils$1 = {
  isArray: isArray$2,
  isArrayBuffer: isArrayBuffer,
  isBuffer: isBuffer,
  isFormData: isFormData,
  isArrayBufferView: isArrayBufferView,
  isString: isString,
  isNumber: isNumber$1,
  isObject: isObject$2,
  isUndefined: isUndefined,
  isDate: isDate,
  isFile: isFile,
  isBlob: isBlob,
  isFunction: isFunction,
  isStream: isStream,
  isURLSearchParams: isURLSearchParams,
  isStandardBrowserEnv: isStandardBrowserEnv,
  forEach: forEach,
  merge: merge,
  deepMerge: deepMerge,
  extend: extend$1,
  trim: trim$4
};

function encode(val) {
  return encodeURIComponent(val).
    replace(/%40/gi, '@').
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
var buildURL = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  var serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils$1.isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    var parts = [];

    utils$1.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (utils$1.isArray(val)) {
        key = key + '[]';
      } else {
        val = [val];
      }

      utils$1.forEach(val, function parseValue(v) {
        if (utils$1.isDate(v)) {
          v = v.toISOString();
        } else if (utils$1.isObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + '=' + encode(v));
      });
    });

    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    var hashmarkIndex = url.indexOf('#');
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }

    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};

function InterceptorManager() {
  this.handlers = [];
}

/**
 * Add a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected
  });
  return this.handlers.length - 1;
};

/**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};

/**
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils$1.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};

var InterceptorManager_1 = InterceptorManager;

/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
var transformData = function transformData(data, headers, fns) {
  /*eslint no-param-reassign:0*/
  utils$1.forEach(fns, function transform(fn) {
    data = fn(data, headers);
  });

  return data;
};

var isCancel = function isCancel(value) {
  return !!(value && value.__CANCEL__);
};

var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
  utils$1.forEach(headers, function processHeader(value, name) {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;
      delete headers[name];
    }
  });
};

/**
 * Update an Error with the specified config, error code, and response.
 *
 * @param {Error} error The error to update.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The error.
 */
var enhanceError = function enhanceError(error, config, code, request, response) {
  error.config = config;
  if (code) {
    error.code = code;
  }

  error.request = request;
  error.response = response;
  error.isAxiosError = true;

  error.toJSON = function() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code
    };
  };
  return error;
};

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The created error.
 */
var createError = function createError(message, config, code, request, response) {
  var error = new Error(message);
  return enhanceError(error, config, code, request, response);
};

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
var settle = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  if (!validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(createError(
      'Request failed with status code ' + response.status,
      response.config,
      null,
      response.request,
      response
    ));
  }
};

/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
var isAbsoluteURL = function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
};

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
var combineURLs = function combineURLs(baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
};

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 * @returns {string} The combined full path
 */
var buildFullPath = function buildFullPath(baseURL, requestedURL) {
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
};

// Headers whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
var ignoreDuplicateOf = [
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
];

/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} headers Headers needing to be parsed
 * @returns {Object} Headers parsed into an object
 */
var parseHeaders = function parseHeaders(headers) {
  var parsed = {};
  var key;
  var val;
  var i;

  if (!headers) { return parsed; }

  utils$1.forEach(headers.split('\n'), function parser(line) {
    i = line.indexOf(':');
    key = utils$1.trim(line.substr(0, i)).toLowerCase();
    val = utils$1.trim(line.substr(i + 1));

    if (key) {
      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
        return;
      }
      if (key === 'set-cookie') {
        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    }
  });

  return parsed;
};

var isURLSameOrigin = (
  utils$1.isStandardBrowserEnv() ?

  // Standard browser envs have full support of the APIs needed to test
  // whether the request URL is of the same origin as current location.
    (function standardBrowserEnv() {
      var msie = /(msie|trident)/i.test(navigator.userAgent);
      var urlParsingNode = document.createElement('a');
      var originURL;

      /**
    * Parse a URL to discover it's components
    *
    * @param {String} url The URL to be parsed
    * @returns {Object}
    */
      function resolveURL(url) {
        var href = url;

        if (msie) {
        // IE needs attribute set twice to normalize properties
          urlParsingNode.setAttribute('href', href);
          href = urlParsingNode.href;
        }

        urlParsingNode.setAttribute('href', href);

        // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
        return {
          href: urlParsingNode.href,
          protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
          host: urlParsingNode.host,
          search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
          hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
          hostname: urlParsingNode.hostname,
          port: urlParsingNode.port,
          pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
            urlParsingNode.pathname :
            '/' + urlParsingNode.pathname
        };
      }

      originURL = resolveURL(window.location.href);

      /**
    * Determine if a URL shares the same origin as the current location
    *
    * @param {String} requestURL The URL to test
    * @returns {boolean} True if URL shares the same origin, otherwise false
    */
      return function isURLSameOrigin(requestURL) {
        var parsed = (utils$1.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
        return (parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host);
      };
    })() :

  // Non standard browser envs (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return function isURLSameOrigin() {
        return true;
      };
    })()
);

var cookies = (
  utils$1.isStandardBrowserEnv() ?

  // Standard browser envs support document.cookie
    (function standardBrowserEnv() {
      return {
        write: function write(name, value, expires, path, domain, secure) {
          var cookie = [];
          cookie.push(name + '=' + encodeURIComponent(value));

          if (utils$1.isNumber(expires)) {
            cookie.push('expires=' + new Date(expires).toGMTString());
          }

          if (utils$1.isString(path)) {
            cookie.push('path=' + path);
          }

          if (utils$1.isString(domain)) {
            cookie.push('domain=' + domain);
          }

          if (secure === true) {
            cookie.push('secure');
          }

          document.cookie = cookie.join('; ');
        },

        read: function read(name) {
          var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
          return (match ? decodeURIComponent(match[3]) : null);
        },

        remove: function remove(name) {
          this.write(name, '', Date.now() - 86400000);
        }
      };
    })() :

  // Non standard browser env (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return {
        write: function write() {},
        read: function read() { return null; },
        remove: function remove() {}
      };
    })()
);

var xhr = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;

    if (utils$1.isFormData(requestData)) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    var request = new XMLHttpRequest();

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password || '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    var fullPath = buildFullPath(config.baseURL, config.url);
    request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    request.timeout = config.timeout;

    // Listen for ready state
    request.onreadystatechange = function handleLoad() {
      if (!request || request.readyState !== 4) {
        return;
      }

      // The request errored out and we didn't get a response, this will be
      // handled by onerror instead
      // With one exception: request that using file: protocol, most browsers
      // will return status as 0 even though it's a successful request
      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
        return;
      }

      // Prepare the response
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };

      settle(resolve, reject, response);

      // Clean up request
      request = null;
    };

    // Handle browser request cancellation (as opposed to a manual cancellation)
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(createError('Request aborted', config, 'ECONNABORTED', request));

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
        request));

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (utils$1.isStandardBrowserEnv()) {
      var cookies$1 = cookies;

      // Add xsrf header
      var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
        cookies$1.read(config.xsrfCookieName) :
        undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils$1.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    }

    // Add withCredentials to request if needed
    if (!utils$1.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // Add responseType to request if needed
    if (config.responseType) {
      try {
        request.responseType = config.responseType;
      } catch (e) {
        // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
        // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
        if (config.responseType !== 'json') {
          throw e;
        }
      }
    }

    // Handle progress if needed
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // Not all browsers support upload events
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!request) {
          return;
        }

        request.abort();
        reject(cancel);
        // Clean up request
        request = null;
      });
    }

    if (requestData === undefined) {
      requestData = null;
    }

    // Send the request
    request.send(requestData);
  });
};

var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function setContentTypeIfUnset(headers, value) {
  if (!utils$1.isUndefined(headers) && utils$1.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}

function getDefaultAdapter() {
  var adapter;
  if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = xhr;
  } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    adapter = xhr;
  }
  return adapter;
}

var defaults = {
  adapter: getDefaultAdapter(),

  transformRequest: [function transformRequest(data, headers) {
    normalizeHeaderName(headers, 'Accept');
    normalizeHeaderName(headers, 'Content-Type');
    if (utils$1.isFormData(data) ||
      utils$1.isArrayBuffer(data) ||
      utils$1.isBuffer(data) ||
      utils$1.isStream(data) ||
      utils$1.isFile(data) ||
      utils$1.isBlob(data)
    ) {
      return data;
    }
    if (utils$1.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils$1.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }
    if (utils$1.isObject(data)) {
      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
      return JSON.stringify(data);
    }
    return data;
  }],

  transformResponse: [function transformResponse(data) {
    /*eslint no-param-reassign:0*/
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) { /* Ignore */ }
    }
    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,

  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  }
};

defaults.headers = {
  common: {
    'Accept': 'application/json, text/plain, */*'
  }
};

utils$1.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});

utils$1.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils$1.merge(DEFAULT_CONTENT_TYPE);
});

var defaults_1 = defaults;

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
var dispatchRequest = function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  // Ensure headers exist
  config.headers = config.headers || {};

  // Transform request data
  config.data = transformData(
    config.data,
    config.headers,
    config.transformRequest
  );

  // Flatten headers
  config.headers = utils$1.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers
  );

  utils$1.forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method) {
      delete config.headers[method];
    }
  );

  var adapter = config.adapter || defaults_1.adapter;

  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData(
      response.data,
      response.headers,
      config.transformResponse
    );

    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData(
          reason.response.data,
          reason.response.headers,
          config.transformResponse
        );
      }
    }

    return Promise.reject(reason);
  });
};

/**
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 * @returns {Object} New object resulting from merging config2 to config1
 */
var mergeConfig = function mergeConfig(config1, config2) {
  // eslint-disable-next-line no-param-reassign
  config2 = config2 || {};
  var config = {};

  var valueFromConfig2Keys = ['url', 'method', 'params', 'data'];
  var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy'];
  var defaultToConfig2Keys = [
    'baseURL', 'url', 'transformRequest', 'transformResponse', 'paramsSerializer',
    'timeout', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
    'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress',
    'maxContentLength', 'validateStatus', 'maxRedirects', 'httpAgent',
    'httpsAgent', 'cancelToken', 'socketPath'
  ];

  utils$1.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
    if (typeof config2[prop] !== 'undefined') {
      config[prop] = config2[prop];
    }
  });

  utils$1.forEach(mergeDeepPropertiesKeys, function mergeDeepProperties(prop) {
    if (utils$1.isObject(config2[prop])) {
      config[prop] = utils$1.deepMerge(config1[prop], config2[prop]);
    } else if (typeof config2[prop] !== 'undefined') {
      config[prop] = config2[prop];
    } else if (utils$1.isObject(config1[prop])) {
      config[prop] = utils$1.deepMerge(config1[prop]);
    } else if (typeof config1[prop] !== 'undefined') {
      config[prop] = config1[prop];
    }
  });

  utils$1.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
    if (typeof config2[prop] !== 'undefined') {
      config[prop] = config2[prop];
    } else if (typeof config1[prop] !== 'undefined') {
      config[prop] = config1[prop];
    }
  });

  var axiosKeys = valueFromConfig2Keys
    .concat(mergeDeepPropertiesKeys)
    .concat(defaultToConfig2Keys);

  var otherKeys = Object
    .keys(config2)
    .filter(function filterAxiosKeys(key) {
      return axiosKeys.indexOf(key) === -1;
    });

  utils$1.forEach(otherKeys, function otherKeysDefaultToConfig2(prop) {
    if (typeof config2[prop] !== 'undefined') {
      config[prop] = config2[prop];
    } else if (typeof config1[prop] !== 'undefined') {
      config[prop] = config1[prop];
    }
  });

  return config;
};

/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager_1(),
    response: new InterceptorManager_1()
  };
}

/**
 * Dispatch a request
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request(config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof config === 'string') {
    config = arguments[1] || {};
    config.url = arguments[0];
  } else {
    config = config || {};
  }

  config = mergeConfig(this.defaults, config);

  // Set config.method
  if (config.method) {
    config.method = config.method.toLowerCase();
  } else if (this.defaults.method) {
    config.method = this.defaults.method.toLowerCase();
  } else {
    config.method = 'get';
  }

  // Hook up interceptors middleware
  var chain = [dispatchRequest, undefined];
  var promise = Promise.resolve(config);

  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
};

// Provide aliases for supported request methods
utils$1.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(utils$1.merge(config || {}, {
      method: method,
      url: url
    }));
  };
});

utils$1.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, data, config) {
    return this.request(utils$1.merge(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
});

var Axios_1 = Axios;

/**
 * A `Cancel` is an object that is thrown when an operation is canceled.
 *
 * @class
 * @param {string=} message The message.
 */
function Cancel(message) {
  this.message = message;
}

Cancel.prototype.toString = function toString() {
  return 'Cancel' + (this.message ? ': ' + this.message : '');
};

Cancel.prototype.__CANCEL__ = true;

var Cancel_1 = Cancel;

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;
  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  var token = this;
  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    token.reason = new Cancel_1(message);
    resolvePromise(token.reason);
  });
}

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};

/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};

var CancelToken_1 = CancelToken;

/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 * @returns {Function}
 */
var spread = function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
};

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  var context = new Axios_1(defaultConfig);
  var instance = bind$1(Axios_1.prototype.request, context);

  // Copy axios.prototype to instance
  utils$1.extend(instance, Axios_1.prototype, context);

  // Copy context to instance
  utils$1.extend(instance, context);

  return instance;
}

// Create the default instance to be exported
var axios = createInstance(defaults_1);

// Expose Axios class to allow class inheritance
axios.Axios = Axios_1;

// Factory for creating new instances
axios.create = function create(instanceConfig) {
  return createInstance(mergeConfig(axios.defaults, instanceConfig));
};

// Expose Cancel & CancelToken
axios.Cancel = Cancel_1;
axios.CancelToken = CancelToken_1;
axios.isCancel = isCancel;

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = spread;

var axios_1 = axios;

// Allow use of default import syntax in TypeScript
var default_1 = axios;
axios_1.default = default_1;

var axios$1 = axios_1;

var Request = function Request(url, body) {
  axios$1.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8";
  return axios$1.post(url, JSON.stringify(body)).then(function (response) {
    return Promise.resolve(response);
  }).catch(function (error) {
    return Promise.reject(error);
  });
};

var RequestMultiple = function RequestMultiple(requests) {
  axios$1.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8";
  var reqs = requests.map(function (r) {
    return axios$1.post(r.url, JSON.stringify(r.body));
  });
  return axios$1.all(reqs).then(axios$1.spread(function () {
    var res1 = arguments.length <= 0 ? undefined : arguments[0];
    var res2 = arguments.length <= 1 ? undefined : arguments[1];
    return [res1, res2];
  })).catch(function (error) {
    return Promise.reject(error);
  });
};

// https://enmascript.com/articles/2018/10/05/javascript-factory-pattern

/**
 * Optional configuration to override default values
 *  @typedef {Config} Config
 *
 * @param {Number} [maxWidth] node size in maximal representation
 * @param {Number} [maxHeight] node size in maximal representation
 * @param {Number} [minWidth] node size in minimal representation
 * @param {Number} [minHeight] node size in minimal representation
 * @param {String} [iconUrl] path to an image icon
 * @param {Object} [iconOpacity]
 * @param {Number} [iconOpacity.minOpacity] opacity value for minimal representation
 * @param {Number} [iconOpacity.maxOpacity] opacity value for maximal representation
 * @param {Number} [offset] spacing for all elements inside the node
 * @param {Number} [animationSpeed] how long a node animations takes
 * @param {Number} [borderRadius] the border radius
 * @param {Object} [borderStroke]
 * @param {Number} [borderStroke.width] border width
 * @param {String} [borderStroke.color] border color as hex values
 * @param {Object} [backgroundColor]
 * @param {String} [backgroundColor.color] the nodes background color
 * @param {Object} [labelColor]
 * @param {String} [labelColor.color] the color for the label as hex value
 * @param {Object} [labelFont]
 * @param {String} [labelFont.family] the font family
 * @param {Number} [labelFont.size] the font size
 * @param {Number} [labelFont.weight] the font weight
 * @param {String} [labelFont.style] the font style
 * @param {Object} [labelBackground]
 * @param {String} [labelBackground.color] the label's background color as hex value
 * @param {Number} [labelBackground.opacity] the opacity of the label background
 * @param {Object} [detailsColor]
 * @param {String} [detailsColor.color] the color for the details as hex value
 * @param {Object} [detailsFont]
 * @param {Number} [detailsFont.family] the font family
 * @param {Number} [detailsFont.size] the font size
 * @param {Number} [detailsFont.weight] the font weight
 * @param {String} [detailsFont.style] the font style
 * @param {Object} [detailsBackground]
 * @param {String} [detailsBackground.color] the details background color as hex value
 * @param {Number} [detailsBackground.opacity] the details background opacity
 */

/**
 * Factory to create node objects
 * @param {Data} data the raw node data
 * @param {Canvas} canvas the canvas to render the node on
 * @param {Config} [config] custom config to override the default values
 *
 */

var NodeFactory = /*#__PURE__*/function () {
  function NodeFactory() {
    _classCallCheck(this, NodeFactory);
  }

  _createClass(NodeFactory, null, [{
    key: "create",
    value: function create(rawNode, canvas) {
      var node;
      if (rawNode.type === "risk") node = new RiskNode(rawNode, canvas);
      if (rawNode.type === "asset") node = new AssetNode(rawNode, canvas);
      if (rawNode.type === "custom") node = new CustomNode(rawNode, canvas);
      if (rawNode.type === "requirement") node = new RequirementNode(rawNode, canvas);
      if (rawNode.type === "control") node = new ControlNode(rawNode, canvas);
      return node;
    }
  }]);

  return NodeFactory;
}();

/**
 * Optional configuration to override default values
 *  @typedef {EdgeConfig} EdgeConfig
 *
 * TODO:

 */

/**
 * Factory to create edge objects
 * @param {Canvas} canvas the canvas to render the node on
 * @param {BaseNode} fromNode The from node
 * @param {BaseNode} fromNode The to node
 * @param {EdgeConfig} [edgeConfig] custom config to override the default values
 */

var EdgeFactory = /*#__PURE__*/function () {
  function EdgeFactory() {
    _classCallCheck(this, EdgeFactory);
  }

  _createClass(EdgeFactory, null, [{
    key: "create",
    value: function create(canvas, fromNode, toNode) {
      var edgeConfig = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
      var edge;

      if (edgeConfig.type === "dashed") {
        edge = new ThinEdge(canvas, fromNode, toNode, _objectSpread2({}, edgeConfig, {
          type: "dashed"
        }));
      } else if (edgeConfig.type === "bold") {
        edge = new BoldEdge(canvas, fromNode, toNode, edgeConfig);
      } else {
        edge = new ThinEdge(canvas, fromNode, toNode, _objectSpread2({}, edgeConfig, {
          type: "solid"
        }));
      }

      return edge;
    }
  }]);

  return EdgeFactory;
}();

var BaseLayout = /*#__PURE__*/function () {
  function BaseLayout() {
    _classCallCheck(this, BaseLayout);

    this.canvas = null;
    this.nodes = [];
    this.edges = [];
    this.leafs = [];
    this.currentLayoutState = null;
    this.layoutInfo = {
      x: 0,
      y: 0,
      cx: 0,
      cy: 0,
      w: 0,
      h: 0
    };
    this.tree = null;
    this.layoutReferences = [];
  }

  _createClass(BaseLayout, [{
    key: "loadAdditionalGridDataAsync",
    value: function () {
      var _loadAdditionalGridDataAsync = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var existingNodeIds, additionalNodes, ids, _ref, nodes;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                existingNodeIds = this.nodes.map(function (n) {
                  return n.id;
                });
                additionalNodes = this.nodeData.filter(function (n) {
                  return !existingNodeIds.includes(n.id);
                });

                if (!additionalNodes.length) {
                  _context.next = 9;
                  break;
                }

                ids = additionalNodes.map(function (n) {
                  return n.id;
                });
                _context.next = 6;
                return Request("".concat(this.config.databaseUrl, "/").concat(this.config.nodeEndpoint), ids);

              case 6:
                _ref = _context.sent;
                nodes = _ref.data;
                this.createRepresentations(nodes);

              case 9:
                return _context.abrupt("return", this);

              case 10:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function loadAdditionalGridDataAsync() {
        return _loadAdditionalGridDataAsync.apply(this, arguments);
      }

      return loadAdditionalGridDataAsync;
    }()
  }, {
    key: "loadInitialGridDataAsync",
    value: function () {
      var _loadInitialGridDataAsync = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var limit, ids, _ref2, nodes;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                limit = this.config.limitNodes ? this.config.limitNodes : this.nodeData.length;
                ids = this.nodeData.map(function (n) {
                  return n.id;
                }).slice(0, limit);

                if (!ids.length) {
                  _context2.next = 8;
                  break;
                }

                _context2.next = 5;
                return Request("".concat(this.config.databaseUrl, "/").concat(this.config.nodeEndpoint), ids);

              case 5:
                _ref2 = _context2.sent;
                nodes = _ref2.data;
                this.createRepresentations(nodes);

              case 8:
                return _context2.abrupt("return", this);

              case 9:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function loadInitialGridDataAsync() {
        return _loadInitialGridDataAsync.apply(this, arguments);
      }

      return loadInitialGridDataAsync;
    }()
  }, {
    key: "removeGridDataAsync",
    value: function () {
      var _removeGridDataAsync = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(newGraph) {
        var nodes;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                nodes = newGraph.getNodes().map(function (n) {
                  return n.id;
                });
                this.removeRepresentation(nodes);

              case 2:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function removeGridDataAsync(_x) {
        return _removeGridDataAsync.apply(this, arguments);
      }

      return removeGridDataAsync;
    }()
  }, {
    key: "updateGraphStructure",
    value: function () {
      var _updateGraphStructure = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(newGraph, newConfiguration) {
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                this.nodeData = newGraph.getNodes();
                this.edgeData = newGraph.getEdges();
                this.removeGridDataAsync(newGraph);
                this.config = _objectSpread2({}, this.config, {}, newConfiguration);

                if (newConfiguration.limitColumns) {
                  this.removeLayout();
                }

                return _context4.abrupt("return", this);

              case 6:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function updateGraphStructure(_x2, _x3) {
        return _updateGraphStructure.apply(this, arguments);
      }

      return updateGraphStructure;
    }()
  }, {
    key: "updateLayoutConfiguration",
    value: function () {
      var _updateLayoutConfiguration = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(newConfiguration) {
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                this.config = _objectSpread2({}, this.config, {}, newConfiguration);

                if (newConfiguration.limitColumns) {
                  this.removeLayout();
                }

                return _context5.abrupt("return", this);

              case 3:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function updateLayoutConfiguration(_x4) {
        return _updateLayoutConfiguration.apply(this, arguments);
      }

      return updateLayoutConfiguration;
    }()
  }, {
    key: "loadInitialContextualDataAsync",
    value: function () {
      var _loadInitialContextualDataAsync = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
        var _this = this;

        var request1, response1, focus, assignedInfo, parentIds, childrenIds, assignedId, riskIds, parentEdges, childrenEdges, request2, response2, nodes, edges;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                // load focus and assigned info
                request1 = [{
                  url: "".concat(this.config.databaseUrl, "/").concat(this.config.nodeEndpoint),
                  body: [this.focusId]
                }, {
                  url: "".concat(this.config.databaseUrl, "/").concat(this.config.contextualRelationshipEndpoint),
                  body: [this.focusId]
                }];
                _context6.next = 3;
                return RequestMultiple(request1);

              case 3:
                response1 = _context6.sent;
                focus = response1[0].data[0];
                assignedInfo = response1[1].data; // load parents, children, assigned, risks and edges

                parentIds = focus.parent !== null ? focus.parent instanceof Array ? focus.parent : [focus.parent] : [];
                childrenIds = focus.children;
                assignedId = assignedInfo.assigned;
                riskIds = assignedInfo !== [] ? _toConsumableArray(assignedInfo.risks) : [];
                parentEdges = parentIds.map(function (id) {
                  return {
                    fromNode: _this.focusId,
                    toNode: id
                  };
                });
                childrenEdges = childrenIds.map(function (id) {
                  return {
                    fromNode: id,
                    toNode: _this.focusId
                  };
                });
                request2 = [{
                  url: "".concat(this.config.databaseUrl, "/").concat(this.config.nodeEndpoint),
                  body: [].concat(_toConsumableArray(parentIds), _toConsumableArray(childrenIds), [assignedId], _toConsumableArray(riskIds))
                }, {
                  url: "".concat(this.config.databaseUrl, "/").concat(this.config.edgeEndpoint),
                  body: [].concat(_toConsumableArray(parentEdges), _toConsumableArray(childrenEdges))
                }];
                _context6.next = 15;
                return RequestMultiple(request2);

              case 15:
                response2 = _context6.sent;
                nodes = response2[0].data;
                edges = response2[1].data;
                console.log(nodes, edges); // console.log(this.focusId)

                console.log(parentIds);
                console.log(childrenIds);
                console.log(assignedId);
                console.log(riskIds);
                console.log(parentEdges);
                console.log(childrenEdges);
                return _context6.abrupt("return", this);

              case 26:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function loadInitialContextualDataAsync() {
        return _loadInitialContextualDataAsync.apply(this, arguments);
      }

      return loadInitialContextualDataAsync;
    }()
  }, {
    key: "removeLayout",
    value: function removeLayout() {
      this.nodes.forEach(function (node) {
        node.removeNode();
      }); // grid

      if (this.expander) {
        this.expander.removeNode();
      }

      this.nodes = []; // this.edges.forEach((edge) => {
      //   edge.removeEdge()
      // })
      // this.leafs.forEach((leaf) => {
      //   leaf.removeLeaf()
      // })
    }
  }, {
    key: "createRepresentations",
    value: function createRepresentations() {
      var _this2 = this;

      var nodes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var edges = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      var renderingSize = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.config.renderingSize;
      nodes.forEach(function (rawNode) {
        var node = NodeFactory.create(rawNode, _this2.canvas);
        node.setNodeSize(renderingSize);

        _this2.nodes.push(node);
      });
      edges.forEach(function (rawEdge) {
        var edge = EdgeFactory.create(rawEdge, _this2.canvas);

        _this2.nodes.push(edge);
      });
    }
  }, {
    key: "removeRepresentation",
    value: function removeRepresentation() {
      var nodes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      this.nodes = this.nodes.filter(function (node) {
        if (!nodes.includes(node.getId())) {
          node.removeNode(undefined, undefined, {
            animation: false
          });
          return false;
        }

        return true;
      }); // this.edges = this.nodes.filter((node) => {
      //   if (!nodes.includes(node.getId())) {
      //     node.removeNode(undefined, undefined, { animation: false })
      //     return false
      //   }
      //   return true
      // })
    }
  }, {
    key: "createContextualDataAsync",
    value: function () {
      var _createContextualDataAsync = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(nodeData, edgeData) {
        var _this3 = this;

        var focusNode, focusFetchUrl, fetchedFocus, parentChildNodeIds, mapNodeIdsToUrl, nodeIdsToFetch, nodeFetchUrl, fetchedNodes, parentNodeIds, childNodeIds, assignedNodeDataUrl, assignedNodeData, assignedNodeId, riskIds, assignedNodeUrl, assignedNode, riskIdsToFetch, riskFetchUrl, fetchedRisks, config, connection, parentChildEdges, mapEdgeIdsToUrl, edgeIdsToFetch, edgeFetchUrl, fetchedEdges;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                this.nodeData = nodeData;
                this.edgeData = edgeData; // in order to load parents and children, the data of the focus node has to be loaded first

                focusNode = this.nodeData.find(function (n) {
                  return n.id === _this3.startNodeId;
                });
                focusFetchUrl = "".concat(this.config.databaseUrl, "/nodes?id=").concat(focusNode.id);
                _context7.next = 6;
                return fetch(focusFetchUrl).then(function (data) {
                  return data.json();
                });

              case 6:
                fetchedFocus = _context7.sent;
                this.createNodeFromData(fetchedFocus[0], "max");
                this.focus = this.nodes.find(function (n) {
                  return n.id === _this3.startNodeId;
                }); // load parents and children passed on edges inside the graph structure

                parentChildNodeIds = this.edgeData.map(function (e) {
                  if (e.startNodeId === _this3.startNodeId) {
                    return e.endNodeId;
                  }

                  if (e.endNodeId === _this3.startNodeId) {
                    return e.startNodeId;
                  }

                  return null;
                }).filter(function (id) {
                  return id !== null;
                });

                mapNodeIdsToUrl = function mapNodeIdsToUrl(id) {
                  return "id=".concat(id, "&");
                };

                nodeIdsToFetch = parentChildNodeIds.map(mapNodeIdsToUrl).join("").slice(0, -1);
                nodeFetchUrl = "".concat(this.config.databaseUrl, "/nodes?").concat(nodeIdsToFetch);
                _context7.next = 15;
                return fetch(nodeFetchUrl).then(function (data) {
                  return data.json();
                });

              case 15:
                fetchedNodes = _context7.sent;
                fetchedNodes.forEach(function (rawNode) {
                  _this3.createNodeFromData(rawNode, "min");
                });
                parentNodeIds = this.edgeData.filter(function (e) {
                  return e.startNodeId === _this3.startNodeId;
                }).map(function (e) {
                  return e.endNodeId;
                });
                childNodeIds = this.edgeData.filter(function (e) {
                  return e.endNodeId === _this3.startNodeId;
                }).map(function (e) {
                  return e.startNodeId;
                });
                this.parents = this.nodes.filter(function (n) {
                  return parentNodeIds.includes(n.id);
                });
                this.children = this.nodes.filter(function (n) {
                  return childNodeIds.includes(n.id);
                }); // here we load attached risks which are attached to a different node

                assignedNodeDataUrl = "".concat(this.config.databaseUrl, "/RiskEdgeConnectionTable?startNodeId=").concat(this.startNodeId);
                _context7.next = 24;
                return fetch(assignedNodeDataUrl).then(function (data) {
                  return data.json();
                });

              case 24:
                assignedNodeData = _context7.sent;
                assignedNodeId = assignedNodeData[0].endNodeId;
                riskIds = assignedNodeData[0].risks;
                assignedNodeUrl = "".concat(this.config.databaseUrl, "/nodes?id=").concat(assignedNodeId);
                _context7.next = 30;
                return fetch(assignedNodeUrl).then(function (data) {
                  return data.json();
                });

              case 30:
                assignedNode = _context7.sent;
                this.createNodeFromData(assignedNode[0], "min");
                this.assginedNode = this.nodes.find(function (n) {
                  return n.id === assignedNodeId;
                });
                riskIdsToFetch = riskIds.map(mapNodeIdsToUrl).join("").slice(0, -1);
                riskFetchUrl = "".concat(this.config.databaseUrl, "/nodes?").concat(riskIdsToFetch);
                _context7.next = 37;
                return fetch(riskFetchUrl).then(function (data) {
                  return data.json();
                });

              case 37:
                fetchedRisks = _context7.sent;
                fetchedRisks.forEach(function (rawNode) {
                  _this3.createNodeFromData(rawNode, "min");
                });
                this.risks = this.nodes.filter(function (n) {
                  return riskIds.includes(n.id);
                });
                config = {
                  color1: "#F26A7C",
                  color2: "#F26A7C",
                  labelTranslateY: -20,
                  labelColor: "#ff8e9e"
                };
                connection = new BoldEdge(this.canvas, this.focus, this.assginedNode, config);
                connection.setLabel("associated");
                this.edges.push(connection); // load edges

                parentChildEdges = this.edgeData.filter(function (e) {
                  if (e.startNodeId === _this3.startNodeId) {
                    return true;
                  }

                  if (e.endNodeId === _this3.startNodeId) {
                    return true;
                  }

                  return false;
                }); // fetch edges based on given ids

                mapEdgeIdsToUrl = function mapEdgeIdsToUrl(n) {
                  return "endNodeId=".concat(n.endNodeId, "&startNodeId=").concat(n.startNodeId, "&");
                };

                edgeIdsToFetch = parentChildEdges.map(mapEdgeIdsToUrl).join("").slice(0, -1);
                edgeFetchUrl = "".concat(this.config.databaseUrl, "/edges?").concat(edgeIdsToFetch);
                _context7.next = 50;
                return fetch(edgeFetchUrl).then(function (data) {
                  return data.json();
                });

              case 50:
                fetchedEdges = _context7.sent;
                // create new edges
                fetchedEdges.forEach(function (rawEdge) {
                  var fromNode = _this3.nodes.find(function (n) {
                    return n.id === rawEdge.startNodeId;
                  });

                  var toNode = _this3.nodes.find(function (n) {
                    return n.id === rawEdge.endNodeId;
                  });

                  var edge = null;
                  if (rawEdge.type === "solid") edge = new ThinEdge(_this3.canvas, fromNode, toNode, {
                    type: "solid"
                  });else if (rawEdge.type === "dashed") edge = new ThinEdge(_this3.canvas, fromNode, toNode, {
                    type: "dashed"
                  });else if (rawEdge.type === "bold") edge = new BoldEdge(_this3.canvas, fromNode, toNode, {
                    type: "bold"
                  });else edge = new ThinEdge(_this3.canvas, fromNode, toNode, {
                    type: "solid"
                  });
                  fromNode.addOutgoingEdge(edge);
                  toNode.addIncomingEdge(edge);
                  edge.setLabel(rawEdge.label);

                  _this3.edges.push(edge);
                }); // re-calculate and re-render layout

                this.calculateLayout();
                this.renderLayout();

              case 54:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function createContextualDataAsync(_x5, _x6) {
        return _createContextualDataAsync.apply(this, arguments);
      }

      return createContextualDataAsync;
    }()
  }, {
    key: "manageContextualDataAsync",
    value: function () {
      var _manageContextualDataAsync = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(clickedNode) {
        var removedNodes, nodesToRemove, X, Y;
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                // remove all elements but the clicked node
                removedNodes = [];
                nodesToRemove = this.nodes; // .filter((n) => n.id !== clickedNode.id)

                X = this.focus.getFinalX();
                Y = this.focus.getFinalY(); // remove children

                nodesToRemove.forEach(function (child) {
                  child.removeNode(X, Y);
                  removedNodes.push(child.id);
                });
                clickedNode.setChildren([]); // this.nodes = this.nodes.filter((node) => !removedNodes.includes(node.id))

                this.nodes = []; // remove containers

                this.containers.forEach(function (container) {
                  container.removeContainer(X, Y);
                });
                this.containers = []; // remove edges

                this.edges.forEach(function (edge) {
                  edge.removeEdge(X, Y);
                });
                this.edges = []; // transform clicked node into max and position it to focus
                // clickedNode.setInitialXY(clickedNode.getFinalX(), clickedNode.getFinalY())
                // clickedNode.transformToMax(X, Y)
                // clear layout

                this.focus = null;
                this.parents = [];
                this.children = [];
                this.assginedNode = null;
                this.assignedRisks = [];
                this.containers = []; // this.nodes[0].transformToMax(X, Y)
                // // add data

                this.startNodeId = clickedNode.id;
                this.createContextualDataAsync(this.nodeData, this.edgeData); // // in order to load parents and children, the data of the focus node has to be loaded first
                // const focusFetchUrl = `${this.config.databaseUrl}/nodes?id=${clickedNode.getId()}`
                // const fetchedFocus = await fetch(focusFetchUrl).then((data) => data.json())
                // console.log(fetchedFocus[0])
                // this.createNodeFromData(fetchedFocus[0], "max")
                // this.focus = this.nodes.find((n) => n.id === fetchedFocus[0].id)
                // // load parents and children edges
                // const parentEdgeFetchUrl = `${this.config.databaseUrl}/edges?startNodeId=${fetchedFocus[0].id}`
                // const childrenEdgeFetchUrl = `${this.config.databaseUrl}/edges?endNodeId=${fetchedFocus[0].id}`
                // const fetchedParentEdges = await fetch(parentEdgeFetchUrl).then((data) => data.json())
                // const fetchedChildrenEdges = await fetch(childrenEdgeFetchUrl).then((data) => data.json())
                // const fetchedEdges = [...fetchedChildrenEdges, ...fetchedParentEdges]
                // // load nodes based on edngNodeIds in edge response
                // const nodeIds = fetchedEdges.map((e) => e.endNodeId)
                // const mapNodeIdsToUrl = (id) => `id=${id}&`
                // const nodeIdsToFetch = nodeIds.map(mapNodeIdsToUrl).join("").slice(0, -1)
                // const nodeFetchUrl = `${this.config.databaseUrl}/nodes?${nodeIdsToFetch}`
                // const fetchedNodes = await fetch(nodeFetchUrl).then((data) => data.json())
                // fetchedNodes.forEach((rawNode) => {
                //   this.createNodeFromData(rawNode, "min")
                // })
                // // console.log(fetchedEdges)
                // const parentNodeIds = fetchedEdges.filter((e) => e.endNodeId !== clickedNode.id).map((n) => n.endNodeId)
                // const childNodeIds = fetchedEdges.filter((e) => e.startNodeId !== clickedNode.id).map((n) => n.startNodeId)
                // this.parents = this.nodes.filter((n) => parentNodeIds.includes(n.id))
                // this.children = this.nodes.filter((n) => childNodeIds.includes(n.id))
                // console.log(childNodeIds, this.nodes)
                // // // this.parents = this.nodes.filter((n) => parentNodeIds.includes(n.id))
                // // // this.children = this.nodes.filter((n) => childNodeIds.includes(n.id))
                // create new edges
                // fetchedEdges.forEach((rawEdge) => {
                //   const fromNode = this.nodes.find((n) => n.id === rawEdge.startNodeId)
                //   const toNode = this.nodes.find((n) => n.id === rawEdge.endNodeId)
                //   let edge = null
                //   if (rawEdge.type === "solid") edge = new ThinEdge(this.canvas, fromNode, toNode, { type: "solid" })
                //   else if (rawEdge.type === "dashed") edge = new ThinEdge(this.canvas, fromNode, toNode, { type: "dashed" })
                //   else if (rawEdge.type === "bold") edge = new BoldEdge(this.canvas, fromNode, toNode, { type: "bold" })
                //   else edge = new ThinEdge(this.canvas, fromNode, toNode, { type: "solid" })
                //   fromNode.addOutgoingEdge(edge)
                //   toNode.addIncomingEdge(edge)
                //   edge.setLabel(rawEdge.label)
                //   this.edges.push(edge)
                // })
                // load parents and children passed on those edges
                // console.log(fetchedEdges)

              case 19:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function manageContextualDataAsync(_x7) {
        return _manageContextualDataAsync.apply(this, arguments);
      }

      return manageContextualDataAsync;
    }()
  }, {
    key: "createNodeFromData",
    value: function createNodeFromData(data, renderingSize) {
      var _this4 = this;

      var node;
      if (data.type === "risk") node = new RiskNode(data, this.canvas);
      if (data.type === "asset") node = new AssetNode(data, this.canvas);
      if (data.type === "custom") node = new CustomNode(data, this.canvas);
      if (data.type === "requirement") node = new RequirementNode(data, this.canvas);
      if (data.type === "control") node = new ControlNode(data, this.canvas); // sets the currently used rendering size

      node.setNodeSize(renderingSize);

      if (data.type === "control") {
        node.addEvent("dblclick", function () {
          _this4.manageContextualDataAsync(node);
        });
      }

      this.nodes.push(node);
    }
  }, {
    key: "createRadialDataAsync",
    value: function () {
      var _createRadialDataAsync = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(nodeData, edgeData) {
        var _this5 = this;

        var mapNodeIdsToUrl, nodeIdsToFetch, nodeFetchUrl, fetchedNodes, constructTree, tree, createEdges, requiredEdges, mapEdgeIdsToUrl, edgeIdsToFetch, edgeFetchUrl, fetchedEdges;
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                // FIXME: ask: what if an edge dose not exist?
                this.nodeData = nodeData;
                this.edgeData = edgeData; // find children ids that we need to fetch

                mapNodeIdsToUrl = function mapNodeIdsToUrl(n) {
                  return "id=".concat(n.id, "&");
                };

                nodeIdsToFetch = nodeData.map(mapNodeIdsToUrl).join("").slice(0, -1);
                nodeFetchUrl = "".concat(this.config.databaseUrl, "/nodes?").concat(nodeIdsToFetch);
                _context9.next = 7;
                return fetch(nodeFetchUrl).then(function (data) {
                  return data.json();
                });

              case 7:
                fetchedNodes = _context9.sent;
                // create new nodes
                fetchedNodes.forEach(function (rawNode) {
                  var node;
                  if (rawNode.type === "risk") node = new RiskNode(rawNode, _this5.canvas);
                  if (rawNode.type === "asset") node = new AssetNode(rawNode, _this5.canvas);
                  if (rawNode.type === "custom") node = new CustomNode(rawNode, _this5.canvas);
                  if (rawNode.type === "requirement") node = new RequirementNode(rawNode, _this5.canvas);
                  if (rawNode.type === "control") node = new ControlNode(rawNode, _this5.canvas); // sets the currently used rendering size

                  node.setNodeSize(_this5.config.renderingSize);
                  node.addEvent("dblclick", function () {
                    _this5.manageTreeDataAsync(node);
                  });

                  _this5.nodes.push(node);
                }); // construct a tree data structure to generate edges and calculate node positions

                constructTree = function constructTree(array, parentRef, rootRef) {
                  var root = rootRef !== undefined ? rootRef : [];
                  var parent = parentRef !== undefined ? parentRef : {
                    id: null
                  };
                  var children = array.filter(function (child) {
                    return child.parentId === parent.id;
                  });

                  if (children.length > 0) {
                    if (parent.id === null) {
                      root = children;
                    } else {
                      parent.children = children;
                    }

                    children.forEach(function (child) {
                      constructTree(array, child);
                    });
                  }

                  return root;
                };

                tree = constructTree(fetchedNodes)[0]; // FIXME: where is the root?
                // find edges that the layout needs

                createEdges = function createEdges(root, edgeList) {
                  if (root.children) {
                    root.children.forEach(function (child) {
                      edgeList.push({
                        startNodeId: child.id,
                        endNodeId: root.id
                      });
                      createEdges(child, edgeList);
                    });
                  }

                  return edgeList;
                };

                requiredEdges = _toConsumableArray(new Set(createEdges(tree, []))); // fetch edges based on given ids

                mapEdgeIdsToUrl = function mapEdgeIdsToUrl(n) {
                  return "endNodeId=".concat(n.endNodeId, "&startNodeId=").concat(n.startNodeId, "&");
                };

                edgeIdsToFetch = requiredEdges.map(mapEdgeIdsToUrl).join("").slice(0, -1);
                edgeFetchUrl = "".concat(this.config.databaseUrl, "/edges?").concat(edgeIdsToFetch);
                _context9.next = 18;
                return fetch(edgeFetchUrl).then(function (data) {
                  return data.json();
                });

              case 18:
                fetchedEdges = _context9.sent;
                // create new edges
                fetchedEdges.forEach(function (rawEdge) {
                  var fromNode = _this5.nodes.find(function (n) {
                    return n.id === rawEdge.startNodeId;
                  });

                  var toNode = _this5.nodes.find(function (n) {
                    return n.id === rawEdge.endNodeId;
                  });

                  var edge = null;
                  if (rawEdge.type === "solid") edge = new ThinEdge(_this5.canvas, fromNode, toNode, {
                    type: "solid"
                  });else if (rawEdge.type === "dashed") edge = new ThinEdge(_this5.canvas, fromNode, toNode, {
                    type: "dashed"
                  });else if (rawEdge.type === "bold") edge = new BoldEdge(_this5.canvas, fromNode, toNode, {
                    type: "bold"
                  });else edge = new ThinEdge(_this5.canvas, fromNode, toNode, {
                    type: "solid"
                  });
                  fromNode.addOutgoingEdge(edge);
                  toNode.addIncomingEdge(edge);
                  edge.setLabel(rawEdge.label);

                  _this5.edges.push(edge);
                }); // re-calculate and re-render layout

                this.calculateLayout();
                this.renderLayout();

              case 22:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function createRadialDataAsync(_x8, _x9) {
        return _createRadialDataAsync.apply(this, arguments);
      }

      return createRadialDataAsync;
    }()
  }, {
    key: "manageTreeDataAsync",
    value: function () {
      var _manageTreeDataAsync = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(clickedNode) {
        var _this6 = this;

        var BFS, isAddOperation, requestedNodes, existingNodes, mapNodeIdsToUrl, nodeIdsToFetch, nodeFetchUrl, fetchedNodes, requiredEdges, mapEdgeIdsToUrl, edgeIdsToFetch, edgeFetchUrl, fetchedEdges, removedNodes, nodesToRemove, X, Y, edgesToRemove, edgesToBeUpdated;
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                BFS = function BFS(root) {
                  var remove = [];
                  var queue = [];
                  queue.push(root);

                  while (queue.length) {
                    var current = queue.shift();

                    if (current.id !== root.id) {
                      remove.push(current);
                    }

                    current.children.forEach(function (child) {
                      if (!queue.includes(child)) {
                        queue.push(child);
                      }
                    });
                  }

                  return remove;
                }; // skip, if node has no children


                if (!(clickedNode.childrenIds.length === 0)) {
                  _context10.next = 3;
                  break;
                }

                return _context10.abrupt("return");

              case 3:
                isAddOperation = clickedNode.children.map(function (child) {
                  return child.svg;
                }).length === 0; // add new data

                if (!isAddOperation) {
                  _context10.next = 28;
                  break;
                }

                // find children ids that we need to fetch
                requestedNodes = [];
                existingNodes = this.nodes.map(function (n) {
                  return n.id;
                });
                clickedNode.childrenIds.forEach(function (id) {
                  if (!existingNodes.includes(id)) {
                    requestedNodes.push(id);
                  }
                }); // remove leafs (tree specific)

                this.leafs.forEach(function (leafe) {
                  leafe.removeLeaf(clickedNode.getFinalX(), clickedNode.getFinalY());
                });
                this.leafs = []; // fetch children based on given ids

                mapNodeIdsToUrl = function mapNodeIdsToUrl(id) {
                  return "id=".concat(id, "&");
                };

                nodeIdsToFetch = requestedNodes.map(mapNodeIdsToUrl).join("").slice(0, -1);
                nodeFetchUrl = "".concat(this.config.databaseUrl, "/nodes?").concat(nodeIdsToFetch);
                _context10.next = 15;
                return fetch(nodeFetchUrl).then(function (data) {
                  return data.json();
                });

              case 15:
                fetchedNodes = _context10.sent;
                // create new children nodes
                fetchedNodes.forEach(function (rawNode) {
                  var node;
                  if (rawNode.type === "risk") node = new RiskNode(rawNode, _this6.canvas);
                  if (rawNode.type === "asset") node = new AssetNode(rawNode, _this6.canvas);
                  if (rawNode.type === "custom") node = new CustomNode(rawNode, _this6.canvas);
                  if (rawNode.type === "requirement") node = new RequirementNode(rawNode, _this6.canvas);
                  if (rawNode.type === "control") node = new ControlNode(rawNode, _this6.canvas); // sets the currently used rendering size

                  node.setNodeSize(_this6.config.renderingSize);
                  node.addEvent("dblclick", function () {
                    _this6.manageTreeDataAsync(node);
                  });

                  _this6.nodes.push(node);
                }); // find edges between new children and clicked node

                requiredEdges = [];
                fetchedNodes.forEach(function (node) {
                  requiredEdges.push({
                    startNodeId: node.id,
                    endNodeId: clickedNode.id
                  });
                }); // fetch edges based on given ids

                mapEdgeIdsToUrl = function mapEdgeIdsToUrl(n) {
                  return "endNodeId=".concat(n.endNodeId, "&startNodeId=").concat(n.startNodeId, "&");
                };

                edgeIdsToFetch = requiredEdges.map(mapEdgeIdsToUrl).join("").slice(0, -1);
                edgeFetchUrl = "".concat(this.config.databaseUrl, "/edges?").concat(edgeIdsToFetch);
                _context10.next = 24;
                return fetch(edgeFetchUrl).then(function (data) {
                  return data.json();
                });

              case 24:
                fetchedEdges = _context10.sent;
                // create new edges
                fetchedEdges.forEach(function (rawEdge) {
                  var fromNode = _this6.nodes.find(function (n) {
                    return n.id === rawEdge.startNodeId;
                  });

                  var toNode = _this6.nodes.find(function (n) {
                    return n.id === rawEdge.endNodeId;
                  });

                  var edge = null;
                  if (rawEdge.type === "solid") edge = new ThinEdge(_this6.canvas, fromNode, toNode, {
                    type: "solid"
                  });else if (rawEdge.type === "dashed") edge = new ThinEdge(_this6.canvas, fromNode, toNode, {
                    type: "dashed"
                  });else if (rawEdge.type === "bold") edge = new BoldEdge(_this6.canvas, fromNode, toNode, {
                    type: "bold"
                  });else edge = new ThinEdge(_this6.canvas, fromNode, toNode, {
                    type: "solid"
                  });
                  fromNode.addOutgoingEdge(edge);
                  toNode.addIncomingEdge(edge);
                  edge.setLabel(rawEdge.label);

                  _this6.edges.push(edge);
                }); // re-calculate and re-render layout

                this.calculateLayout();
                this.renderLayout();

              case 28:
                // remove existing data
                if (isAddOperation === false) {
                  // find children ids that we need to remove
                  removedNodes = [];
                  nodesToRemove = BFS(clickedNode);
                  X = clickedNode.getFinalX();
                  Y = clickedNode.getFinalY(); // remove children

                  nodesToRemove.forEach(function (child) {
                    child.removeNode(X, Y);
                    removedNodes.push(child.id);
                  });
                  clickedNode.setChildren([]);
                  this.nodes = this.nodes.filter(function (node) {
                    return !removedNodes.includes(node.id);
                  }); // find edges that we need to remove

                  edgesToRemove = _toConsumableArray(nodesToRemove.map(function (n) {
                    return n.outgoingEdges;
                  })).flat();
                  edgesToBeUpdated = [];
                  this.edges.forEach(function (edge) {
                    if (edgesToRemove.includes(edge) === false) {
                      edgesToBeUpdated.push(edge);
                    }
                  }); // remove edges

                  edgesToRemove.forEach(function (edge) {
                    edge.removeEdge(clickedNode.getFinalX(), clickedNode.getFinalY());
                  });
                  this.edges = [];
                  this.edges = [].concat(edgesToBeUpdated); // remove leafs (tree specific)

                  this.leafs.forEach(function (leafe) {
                    leafe.removeLeaf(clickedNode.getFinalX(), clickedNode.getFinalY());
                  });
                  this.leafs = []; // re-calculate and re-render layout

                  this.calculateLayout();
                  this.renderLayout(); // update existing edges

                  this.edges.forEach(function (edge) {
                    edge.updateEdgePosition();
                  });
                }

              case 29:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function manageTreeDataAsync(_x10) {
        return _manageTreeDataAsync.apply(this, arguments);
      }

      return manageTreeDataAsync;
    }()
  }, {
    key: "setLayoutReferences",
    value: function setLayoutReferences(layoutReferences) {
      this.layoutReferences = layoutReferences;
    }
  }, {
    key: "getLayoutReferences",
    value: function getLayoutReferences() {
      return this.layoutReferences;
    }
  }, {
    key: "setConfig",
    value: function setConfig(config) {
      this.config = _objectSpread2({}, this.config, {}, config);
    }
  }, {
    key: "getConfig",
    value: function getConfig(key) {
      return this.config[key];
    }
  }, {
    key: "setCanvas",
    value: function setCanvas(canvas) {
      this.canvas = canvas.nested();
    }
  }, {
    key: "setNodes",
    value: function setNodes(nodes) {
      this.nodes = nodes;
    }
  }, {
    key: "getNodes",
    value: function getNodes() {
      return this.nodes;
    }
  }, {
    key: "getEdges",
    value: function getEdges() {
      return this.edges;
    }
  }, {
    key: "setEdges",
    value: function setEdges(edges) {
      this.edges = edges;
    }
  }, {
    key: "setNodeData",
    value: function setNodeData(nodeData) {
      this.nodeData = nodeData;
    }
  }, {
    key: "getNodeData",
    value: function getNodeData() {
      return this.nodeData;
    }
  }, {
    key: "setEdgeData",
    value: function setEdgeData(edgeData) {
      this.edgeData = edgeData;
    }
  }, {
    key: "getEdgeData",
    value: function getEdgeData() {
      return this.edgeData;
    }
  }]);

  return BaseLayout;
}();

var GridExpanderConfiguration = {
  animationSpeed: 300,
  expanderWidth: 105,
  expanderHeight: 40,
  expanderTextColor: "#222",
  expanderPadding: 8,
  expanderFontFamily: "Montserrat",
  expanderFontSize: 12,
  expanderFontWeight: 700,
  expanderFontStyle: "normal",
  expanderBackground: "#fff"
};
/**
 * Class representing the option to collapse or expand the grid layout
 *
 * @param {Canvas} canvas The canvas to render this expander on
 * @private
 */

var GridExpander = /*#__PURE__*/function () {
  function GridExpander(canvas) {
    _classCallCheck(this, GridExpander);

    this.svg = null;
    this.canvas = canvas;
    this.config = _objectSpread2({}, GridExpanderConfiguration); // the re-render function reference

    this.reRenderFunc = null;
  }

  _createClass(GridExpander, [{
    key: "render",
    value: function render() {
      var _this = this;

      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.finalX + this.config.expanderWidth / 2;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.finalY;
      var svg = this.canvas.group();
      svg.css("cursor", "pointer");
      svg.id("gridExpander");
      var w = this.config.expanderWidth;
      var h = this.config.expanderHeight;

      var createText = function createText(innerText) {
        var fobj = _this.canvas.foreignObject(w, h);

        var background = document.createElement("div");
        background.style.background = _this.config.expanderBackground;
        background.style.padding = "".concat(_this.config.expanderPadding / 2, "px");
        background.style.textAlign = "left";
        var label = document.createElement("div");
        label.innerText = innerText;
        label.style.color = _this.config.expanderTextColor;
        label.style.fontSize = "".concat(_this.config.expanderFontSize, "px");
        label.style.fontFamily = _this.config.expanderFontFamily;
        label.style.fontWeight = _this.config.expanderFontWeight;
        label.style.fontStyle = _this.config.expanderFontStyle;
        background.appendChild(label);
        fobj.add(background);
        fobj.css("user-select", "none");
        fobj.height(background.clientHeight);
        return fobj;
      }; // create new elements


      var showMore = createText("Load more data");
      var showLess = createText("Show less data");
      svg.add(showMore);
      svg.add(showLess); // animate new elements into position

      svg.center(X, Y);
      showMore.scale(0.001).center(X, Y).animate({
        duration: this.config.animationSpeed
      }).transform({
        scale: 1,
        position: [X, Y]
      });
      showLess.attr({
        opacity: 0
      }).scale(0.001).center(X, Y).animate({
        duration: this.config.animationSpeed
      }).transform({
        scale: 1,
        position: [X, Y]
      }); // add tooltip

      svg.on("mouseover", function (ev) {
        // const tooltip = document.getElementById("tooltip")
        // tooltip.innerHTML = this.isExpanded ? "Collapse layout" : "Expand layout"
        // tooltip.style.display = "block"
        // tooltip.style.left = `${ev.clientX - tooltip.clientWidth / 2}px`
        // tooltip.style.top = `${ev.clientY - tooltip.clientHeight - 20}px`
        showLess.transform({
          scale: 1.05,
          position: [X, Y]
        });
        showMore.transform({
          scale: 1.05,
          position: [X, Y]
        });
      }); // remove tooltip

      svg.on("mouseout", function () {
        // const tooltip = document.getElementById("tooltip")
        // tooltip.style.display = "none"
        showLess.transform({
          scale: 0.95,
          position: [X, Y]
        });
        showMore.transform({
          scale: 0.95,
          position: [X, Y]
        });
      });

      if (this.reRenderFunc) {
        svg.on("click", this.reRenderFunc); // svg.on("dblclick", this.reRenderFunc)
      }

      this.isExpanded = false;
      this.svg = svg;
    }
  }, {
    key: "changeToShowMoreText",
    value: function changeToShowMoreText() {
      this.svg.get(0).attr({
        opacity: 0
      });
      this.svg.get(1).attr({
        opacity: 1
      });
      this.isExpanded = true;
    }
  }, {
    key: "changeToHideMoreText",
    value: function changeToHideMoreText() {
      this.svg.get(0).attr({
        opacity: 1
      });
      this.svg.get(1).attr({
        opacity: 0
      });
      this.isExpanded = false;
    }
  }, {
    key: "transformToFinalPosition",
    value: function transformToFinalPosition() {
      this.svg.attr({
        opacity: 1
      }).animate({
        duration: this.config.animationSpeed
      }).transform({
        position: [this.finalX + this.config.expanderWidth / 2, this.finalY]
      }).attr({
        opacity: 1
      });
    }
  }, {
    key: "isRendered",
    value: function isRendered() {
      return this.svg !== null;
    }
  }, {
    key: "setReRenderFunc",
    value: function setReRenderFunc(reRenderFunc) {
      this.reRenderFunc = reRenderFunc;
    }
  }, {
    key: "removeNode",
    value: function removeNode() {
      if (this.svg !== null) {
        this.svg.remove();
        this.svg = null;
      }
    }
  }, {
    key: "getIsExpanded",
    value: function getIsExpanded() {
      return this.isExpanded;
    }
  }, {
    key: "getFinalX",
    value: function getFinalX() {
      return this.finalX;
    }
  }, {
    key: "setFinalX",
    value: function setFinalX(finalX) {
      this.finalX = finalX;
    }
  }, {
    key: "getFinalY",
    value: function getFinalY() {
      return this.finalY;
    }
  }, {
    key: "setFinalY",
    value: function setFinalY(finalY) {
      this.finalY = finalY;
    }
  }]);

  return GridExpander;
}();

/**
 * @namespace GridLayoutConfiguration
 * @description This object contains default configuration for grid layout representations.
 *
 * @property {Number} limitColumns=3             - Limits how many columns the layout has.
 * @property {Number} limitNodes=null            - Limits how many nodes are rendered.
 * @property {Number} translateX=0               - Adds additional X translation for all SVG elements before rendering.
 * @property {Number} translateY=0               - Adds additional Y translation for all SVG elements before rendering.
 * @property {Number} animationSpeed=300         - Determins how fast SVG elements animates inside the current layout.
 * @property {Boolean} hideOtherLayouts=false    - If set to true, other layouts are not visible.
 * @property {Number} spacing=32                 - Determins the minimal spacing between nodes.
 * @property {String} renderingSize=min          - Determins the node render representation. Available: "min" or "max".
 */
var GridLayoutConfiguration = {
  limitColumns: 4,
  limitNodes: null,
  translateX: 0,
  translateY: 0,
  animationSpeed: 300,
  hideOtherLayouts: false,
  // TODO:
  spacing: 32,
  renderingSize: "min"
};

var GridLayout = /*#__PURE__*/function (_BaseLayout) {
  _inherits(GridLayout, _BaseLayout);

  function GridLayout() {
    var _this;

    var customConfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, GridLayout);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(GridLayout).call(this));
    _this.config = _objectSpread2({}, GridLayoutConfiguration, {}, customConfig);
    _this.expander = null;
    return _this;
  }

  _createClass(GridLayout, [{
    key: "calculateLayout",
    value: function calculateLayout() {
      var _this2 = this;

      var offset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      this.config = _objectSpread2({}, this.config, {
        translateX: this.config.translateX + offset
      });

      var calculateFinalPosition = function calculateFinalPosition() {
        var limit = _this2.config.limitNodes ? _this2.config.limitNodes : _this2.nodes.length;

        var nodes = _this2.nodes.slice(0, limit); // create grid expander only if required


        if (_this2.config.limitNodes < _this2.nodeData.length && _this2.expander === null) {
          var expander = new GridExpander(_this2.canvas);
          _this2.expander = expander;
        }

        var cols = _this2.config.limitColumns;
        var nodeIndex = 0;
        var nodeCols = [];
        var nodeRows = []; // divide nodes into sets of rows

        for (var i = 0; i < nodes.length; i += 1) {
          var row = [];

          for (var j = 0; j < cols; j += 1) {
            var node = nodes[nodeIndex];

            if (node !== undefined) {
              row.push(node);
              nodeIndex += 1;
            }
          }

          if (row.length) {
            nodeRows.push(row);
          }
        } // divide nodes into sets of columns


        nodeIndex = 0;

        for (var _i = 0; _i < cols; _i += 1) {
          nodeCols.push([]);
        }

        nodes.forEach(function (node, i) {
          var col = nodeCols[i % cols];
          col.push(node);
        }); // console.log(nodeRows)
        // console.log(nodeCols)
        // console.log("----")
        // calculate initial position

        _this2.nodes.forEach(function (node) {
          var w = _this2.config.renderingSize === "max" ? node.getMaxWidth() : node.getMinWidth();
          var h = _this2.config.renderingSize === "max" ? node.getMaxHeight() : node.getMinHeight();
          var x = _this2.config.spacing + _this2.config.translateX + w / 2; // +w / 1

          var y = _this2.config.spacing + _this2.config.translateY + h / 2;
          node.setFinalX(x);
          node.setFinalY(y);
        }); // find row spacing


        var rowSpacing = 0;
        nodeRows.forEach(function (row) {
          var h = row.map(function (n) {
            return _this2.config.renderingSize === "max" ? n.getMaxHeight() : n.getMinHeight();
          });
          var max = Math.max.apply(Math, _toConsumableArray(h));
          rowSpacing = Math.max(rowSpacing, max);
        }); // calculate y positions

        nodeRows.forEach(function (row, i) {
          if (i >= 1) {
            row.forEach(function (n) {
              var h = (rowSpacing + _this2.config.spacing) * i;
              n.setFinalY(n.getFinalY() + h);
            });
          }
        }); // find col spacing

        var columnSpacing = 0;
        nodeRows.forEach(function (row) {
          var w = row.map(function (n) {
            return _this2.config.renderingSize === "max" ? n.getMaxWidth() : n.getMinWidth();
          });
          var max = Math.max.apply(Math, _toConsumableArray(w));
          columnSpacing = Math.max(columnSpacing, max);
        }); // calculate x positions

        nodeCols.forEach(function (column, i) {
          if (i >= 1) {
            column.forEach(function (n) {
              var w = (columnSpacing + _this2.config.spacing) * i;
              n.setFinalX(n.getFinalX() + w);
            });
          }
        });
      };

      var calculateExpander = function calculateExpander() {
        // collapsed state
        if (_this2.expander === null) {
          return;
        }

        if (_this2.config.limitNodes === null) {
          return;
        } // get lowest X coordinate


        var minX = Math.min.apply(Math, _toConsumableArray(_this2.nodes.map(function (n) {
          return n.getFinalX();
        })));

        var minNode = _this2.nodes.find(function (n) {
          return n.getFinalX() === minX;
        });

        var w = _this2.config.renderingSize === "max" ? minNode.getMaxWidth() : minNode.getMinWidth();
        var x = minX - w / 2; // get deepest Y coordinate

        var maxY = Math.max.apply(Math, _toConsumableArray(_this2.nodes.map(function (n) {
          return n.getFinalY();
        })));

        var maxNode = _this2.nodes.find(function (n) {
          return n.getFinalY() === maxY;
        });

        var h = _this2.config.renderingSize === "max" ? maxNode.getMaxHeight() : maxNode.getMinHeight();
        var y = maxY + h + _this2.config.spacing; // this.canvas.circle(5).fill("#f75").center(x, y)

        _this2.expander.setFinalX(x);

        _this2.expander.setFinalY(y);
      };

      var calculateBackground = function calculateBackground() {
        // top left
        var nodes = _this2.nodes;
        var x0 = Math.min.apply(Math, _toConsumableArray(nodes.map(function (n) {
          var w = _this2.config.renderingSize === "max" ? n.getMaxWidth() : n.getMinWidth();
          return n.getFinalX() - w / 2 - _this2.config.spacing / 2;
        })));
        var y0 = Math.min.apply(Math, _toConsumableArray(nodes.map(function (n) {
          var h = _this2.config.renderingSize === "max" ? n.getMaxHeight() : n.getMinHeight();
          return n.getFinalY() - h / 2 - _this2.config.spacing / 2;
        }))); // this.canvas.circle(5).fill("#000").center(x0, y0)
        // top right

        var x1 = Math.max.apply(Math, _toConsumableArray(nodes.map(function (n) {
          var w = _this2.config.renderingSize === "max" ? n.getMaxWidth() : n.getMinWidth();
          return n.getFinalX() + w / 2 + _this2.config.spacing / 2;
        })));
        var y1 = y0; // this.canvas.circle(5).fill("#75f").center(x1, y1)
        // bottom right

        var x2 = x1;
        var y2 = Math.max.apply(Math, _toConsumableArray(nodes.map(function (n) {
          var h = _this2.config.renderingSize === "max" ? n.getMaxHeight() : n.getMinHeight();
          return n.getFinalY() + h / 2 + _this2.config.spacing / 2;
        })));

        if (_this2.expander !== null && _this2.config.limitNodes !== null) {
          y2 = _this2.expander.getFinalY() + _this2.config.spacing / 2 + _this2.expander.config.expanderHeight / 2;
        } // this.canvas.circle(5).fill("#f75").center(x2, y2)
        // store layout width and height info

        var calculateDistance = function calculateDistance(sx, sy, tx, ty) {
          var dx = tx - sx;
          var dy = ty - sy;
          return Math.sqrt(dx * dx + dy * dy);
        };

        _this2.layoutInfo = {
          x: x0,
          y: y0,
          cx: (x0 + x2) / 2,
          cy: (y0 + y2) / 2,
          w: calculateDistance(x0, y0, x1, y1),
          h: calculateDistance(x1, y1, x2, y2)
        };
      };

      calculateFinalPosition();
      calculateExpander();
      calculateBackground();
      return this.layoutInfo;
    }
  }, {
    key: "renderLayout",
    value: function renderLayout() {
      var _this3 = this;

      var limit = this.config.limitNodes ? this.config.limitNodes : this.nodes.length;
      var X = this.layoutInfo.cx;
      var Y = this.layoutInfo.cy;

      var renderExpander = function renderExpander() {
        if (_this3.config.limitNodes === null && _this3.expander.isRendered() === true) {
          _this3.expander.removeNode();

          return;
        }

        if (_this3.expander === null) {
          return;
        }

        if (_this3.expander.isRendered() === true) {
          _this3.expander.transformToFinalPosition();

          return;
        }

        if (_this3.config.limitNodes === null) {
          return;
        }

        var reRenderFunc = /*#__PURE__*/function () {
          var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
            var tooltip, prevW, newW;
            return regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    if (_this3.currentLayoutState === "show more") {
                      _this3.currentLayoutState = "show less";
                      _this3.config = _objectSpread2({}, _this3.config, {
                        limitNodes: _this3.config.cachedLimit
                      });
                      delete _this3.config.cachedLimit;

                      _this3.expander.changeToHideMoreText();
                    } else {
                      _this3.currentLayoutState = "show more";
                      _this3.config = _objectSpread2({}, _this3.config, {
                        cachedLimit: _this3.config.limitNodes,
                        limitNodes: _this3.nodeData.length
                      });

                      _this3.expander.changeToShowMoreText();
                    }

                    tooltip = document.getElementById("tooltip");
                    tooltip.style.display = "none";
                    _context.next = 5;
                    return _this3.loadInitialGridDataAsync();

                  case 5:
                    // update all layouts to the right
                    prevW = _this3.layoutInfo.w;

                    _this3.calculateLayout();

                    newW = _this3.layoutInfo.w;

                    _this3.renderLayout(); // update all layouts right side


                    _this3.layoutReferences.forEach(function (llayout, i) {
                      if (i > _this3.layoutReferences.indexOf(_this3)) {
                        llayout.calculateLayout(newW - prevW);
                        llayout.renderLayout();
                      }
                    });

                  case 10:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));

          return function reRenderFunc() {
            return _ref.apply(this, arguments);
          };
        }();

        if (_this3.expander.svg === null) {
          _this3.expander.setReRenderFunc(reRenderFunc);

          _this3.expander.render(X, Y);
        }

        _this3.expander.transformToFinalPosition();
      };

      var renderNodes = function renderNodes() {
        _this3.nodes.forEach(function (node, i) {
          // render new nodes
          if (i <= limit && node.isRendered() === false) {
            if (node.isRendered() === false) {
              if (_this3.config.renderingSize === "max") node.renderAsMax(X, Y);
              if (_this3.config.renderingSize === "min") node.renderAsMin(X, Y);
            }
          }

          if (node.isRendered() === true) {
            node.transformToFinalPosition();
          } // remove existing nodes


          if (i >= limit && node.isRendered() === true) {
            node.removeNode(null, null, {
              animation: false
            });
          }
        });
      };

      renderExpander();
      renderNodes();
    }
  }]);

  return GridLayout;
}(BaseLayout);

var RadialConfig = {
  maxLayoutWidth: 600,
  maxLayoutHeight: 600,
  // where to translate a given layout
  translateX: 0,
  translateY: 0,
  // layout animation speed
  animationSpeed: 300,
  // how a layout starts
  layoutState: "expanded",
  // expanded, collapsed // TODO: ask: even needed?
  // hide all other layouts and center selected one
  hideOtherLayouts: false,
  // TODO:
  // radial radius (first radius only)
  radialRadius: 200,
  // user defined delta angle constant (second+ radius)
  radiusDelta: 150,
  hAspect: 4 / 3,
  wAspect: 4 / 4,
  // how to render all nodes
  renderingSize: "min" // min, max

};

var RadialLayout = /*#__PURE__*/function (_BaseLayout) {
  _inherits(RadialLayout, _BaseLayout);

  function RadialLayout() {
    var _this;

    var customRadialConfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, RadialLayout);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(RadialLayout).call(this));
    _this.config = _objectSpread2({}, RadialConfig, {}, customRadialConfig);
    return _this;
  } // calculates the radial layout positions for all given nodes and edges


  _createClass(RadialLayout, [{
    key: "calculateLayout",
    value: function calculateLayout() {
      var _this2 = this;

      // construct a tree
      var constructTree = function constructTree(array, parentRef, rootRef) {
        var root = rootRef !== undefined ? rootRef : [];
        var parent = parentRef !== undefined ? parentRef : {
          id: null
        };
        var children = array.filter(function (child) {
          return child.parentId === parent.id;
        }); // console.log("0", children, parent, parentRef)

        if (children.length > 0) {
          if (parent.id === null) {
            // console.log("1", children)
            root = children;
          } else {
            parent.children = children; // console.log("2", children)
          }

          children.forEach(function (child) {
            // console.log("chid", child, child instanceof Number)
            constructTree(array, child);
          });
        }

        return root;
      };

      var updateNodeDepth = function updateNodeDepth(node, depth) {
        node.setDepth(depth);
        node.children.forEach(function (child) {
          updateNodeDepth(child, depth + 1);
        });
      };

      var calcRadialPositions = function calcRadialPositions(node, alfa, beta) {
        // center root
        if (node.parentId === null) {
          node.setFinalX(_this2.config.maxLayoutWidth / 2 + _this2.config.translateX);
          node.setFinalY(_this2.config.maxLayoutHeight / 2 + _this2.config.translateY);
        } // depth of node inside tree


        var depth = node.getDepth(); // theta

        var theta = alfa; // multipler for depth levels after the first circle

        var delta = _this2.config.radiusDelta; // innermost circle radius + delta angle

        var radius = _this2.config.radialRadius + delta * depth;

        var BFS = function BFS(root) {
          var queue = [];
          var leaves = 0;
          queue.push(root);

          while (queue.length) {
            var current = queue.shift();
            current.children.forEach(function (child) {
              if (!queue.includes(child)) {
                queue.push(child);
              }
            });

            if (current.children.length === 0) {
              leaves += 1;
            }
          }

          return leaves;
        }; // number of children in the subtree


        var children = BFS(node);
        node.children.forEach(function (child) {
          // number of leaves in subtree
          var lambda = BFS(child);
          var mü = theta + lambda / children * (beta - alfa);

          var x = radius * Math.cos((theta + mü) / 2) * _this2.config.hAspect;

          var y = radius * Math.sin((theta + mü) / 2) * _this2.config.wAspect;

          child.setFinalX(x + _this2.config.maxLayoutWidth / 2 + _this2.config.translateX);
          child.setFinalY(y + _this2.config.maxLayoutHeight / 2 + _this2.config.translateY);

          if (child.children.length > 0) {
            calcRadialPositions(child, theta, mü);
          }

          theta = mü;
        });
      }; // calculate edges


      var calcRadialEdges = function calcRadialEdges(edges) {
        edges.forEach(function (edge) {
          edge.calculateEdge();
        });
      };

      var tree = constructTree(this.nodes)[0]; // TODO: where is the root?

      updateNodeDepth(tree, 0);
      calcRadialPositions(tree, 0, 2 * Math.PI);
      calcRadialEdges(this.edges);
    }
  }, {
    key: "renderLayout",
    value: function renderLayout() {
      var _this3 = this;

      this.centerX = this.nodes[0].getFinalX();
      this.centerY = this.nodes[0].getFinalY();
      this.nodes.forEach(function (node) {
        if (_this3.config.renderingSize === "max") {
          if (node.svg === null) node.renderAsMax(_this3.centerX, _this3.centerY);
        } else if (_this3.config.renderingSize === "min") {
          if (node.svg === null) {
            node.renderAsMin(_this3.centerX, _this3.centerY);
          }
        }

        node.transformToFinalPosition();
      }); // this.nodes.forEach((node) => {
      // })

      this.edges.forEach(function (edge) {
        if (edge.svg === null) {
          edge.render(_this3.centerX, _this3.centerY);
        }

        edge.transformToFinalPosition();
      }); // this.edges.forEach((edge) => {
      // })
    }
  }]);

  return RadialLayout;
}(BaseLayout);

var LeafConfig = {
  // large representation
  maxWidth: 370,
  maxHeight: 200,
  // small representation
  minWidth: 150,
  minHeight: 40,
  // icon
  iconUrl: null,
  minIconOpacity: 1,
  minIconSize: 32,
  minIconTranslateX: -45,
  minIconTranslateY: 0,
  // node
  offset: 8,
  animationSpeed: 300,
  borderRadius: 5,
  borderStrokeWidth: 0,
  borderStrokeColor: "#aaa",
  borderStrokeDasharray: "0",
  backgroundColor: "#ffffff",
  // text
  minTextWidth: 87,
  minTextHeight: 24,
  minTextTranslateX: 15,
  minTextTranslateY: 0,
  labelColor: "#84a8f2",
  labelFontFamily: "Montserrat",
  labelFontSize: 12,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#fff",
  // arrow
  strokeWidth: 2,
  strokeColor: "#aaa",
  strokeDasharray: "7 5",
  marker: "M 0 0 L 6 3 L 0 6 z",
  color1: "#aaa",
  color2: "#222"
};

var LeafExtenstion = /*#__PURE__*/function () {
  function LeafExtenstion(canvas, node) {
    _classCallCheck(this, LeafExtenstion);

    this.svg = null;
    this.canvas = canvas;
    this.node = node;
    this.nodeSize = node.childrenIds.length;
    this.config = _objectSpread2({}, LeafConfig); // position

    this.initialX = 0;
    this.initialY = 0;
    this.finalX = 0;
    this.finalY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.events = [];
  }

  _createClass(LeafExtenstion, [{
    key: "addEvent",
    value: function addEvent(event, func) {
      // this.svg.on(event, func)
      // console.log(this.svg)
      this.events = [].concat(_toConsumableArray(this.events), [{
        event: event,
        func: func
      }]); // console.log(this.getNodeSize())
    }
  }, {
    key: "render",
    value: function render() {
      var _this = this;

      var X = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.node.finalX;
      var Y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.node.finalY;
      var svg = this.canvas.group().draggable();
      svg.css("cursor", "pointer");
      svg.id("leafExtenstion");
      var w = this.node.nodeSize === "min" ? this.config.minWidth : this.config.maxWidth;
      var h = this.node.nodeSize === "min" ? this.config.minHeight + 10 : this.config.maxHeight;
      var text = this.canvas.foreignObject(w, h);
      var background = document.createElement("div");
      var label = document.createElement("p");
      label.innerText = "Show ".concat(this.nodeSize, " more children");
      label.style.color = this.config.labelColor;
      label.style.textAlign = "center";
      label.style.padding = "".concat(this.config.offset / 2, "px");
      label.style.background = this.config.labelBackground;
      label.style.fontSize = "".concat(this.config.labelFontSize, "px");
      label.style.fontFamily = this.config.labelFontFamily;
      label.style.fontWeight = this.config.labelFontWeight;
      label.style.fontStyle = this.config.labelFontStyle;
      background.appendChild(label);
      text.add(background);
      text.height(background.clientHeight);
      svg.add(text);
      var translateY = this.node.nodeSize === "min" ? 75 : 195;
      svg.center(X, Y + translateY);
      var tx = this.node.getFinalX();
      var ty = this.node.getFinalY();
      var edgesStartingLine = this.canvas.path("M 0 0 h".concat(this.node.currentWidth * 1.35)).stroke({
        width: 0,
        color: "red"
      }).center(tx, ty + h / 2 + this.config.offset + translateY / 3);
      var interval = edgesStartingLine.length() / this.nodeSize;
      var intervalSpaceUsed = 0;

      for (var i = 0; i < this.nodeSize; i += 1) {
        var p = edgesStartingLine.pointAt(intervalSpaceUsed);
        intervalSpaceUsed += interval;
        var fx = p.x + interval / 2;
        var fy = p.y; // this.canvas.circle(5).fill("#75f").center(fx, fy)
        // this.canvas.circle(5).fill("#000").center(tx, ty)

        var _intersect = intersect$1(shape("rect", {
          x: tx - w / 2 - this.node.config.borderStrokeWidth / 2 - this.config.offset / 2,
          y: ty - h / 2 - this.node.config.borderStrokeWidth / 2 - this.config.offset / 2,
          width: w + this.node.config.borderStrokeWidth + this.config.offset,
          height: h + this.node.config.borderStrokeWidth + this.config.offset,
          rx: this.node.config.borderRadius,
          ry: this.node.config.borderRadius
        }), shape("line", {
          x1: fx,
          y1: fy,
          x2: tx,
          y2: ty
        })),
            points = _intersect.points; // this.canvas.circle(5).fill("#000").center(points[0].x, points[0].y)


        var path = this.canvas.path("M".concat(fx, ",").concat(fy, " L").concat(points[0].x, ",").concat(points[0].y)).stroke({
          width: this.config.strokeWidth,
          color: this.config.strokeColor
        }); // create a re-useable marker

        var index = _toConsumableArray(this.canvas.defs().node.childNodes).findIndex(function (d) {
          return d.id === "defaultThinMarker";
        });

        if (index === -1) {
          var marker = this.canvas.marker(12, 6, function (add) {
            add.path(_this.config.marker).fill(_this.config.strokeColor).dx(1);
          });
          marker.id("defaultThinMarker");
          this.canvas.defs().add(marker);
          path.marker("end", marker);
        } else {
          var _marker = this.canvas.defs().get(index);

          path.marker("end", _marker);
        }

        svg.add(path);
      }

      svg.transform({
        position: [this.initialX, this.initialY]
      });
      this.finalX = svg.cx();
      this.finalY = svg.cy();
      this.events.forEach(function (_ref) {
        var event = _ref.event,
            func = _ref.func;
        svg.on(event, func);
      });
      this.svg = svg;
    }
  }, {
    key: "transformToFinalPosition",
    value: function transformToFinalPosition() {
      this.svg.attr({
        opacity: 1
      }).animate({
        duration: this.config.animationSpeed
      }).transform({
        position: [this.finalX, this.finalY]
      }).attr({
        opacity: 1
      });
    }
  }, {
    key: "removeLeaf",
    value: function removeLeaf() {
      this.svg.remove();
      this.svg = null;
    }
  }]);

  return LeafExtenstion;
}();

var TreeConfig = {
  maxLayoutWidth: 600,
  minHeight: window.innerHeight - 10,
  // where to translate a given layout
  translateX: 0,
  translateY: 0,
  // layout animation speed
  animationSpeed: 300,
  // how a layout starts
  layoutState: "expanded",
  // expanded, collapsed // TODO: ask: even needed?
  // tree orientation
  orientation: "vertical",
  // vertical, horizontal
  // hide all other layouts and center selected one
  hideOtherLayouts: false,
  // TODO:
  // node spacing
  vSpacing: 100,
  hSpacing: 25,
  // how to render all nodes
  renderingSize: "min",
  // min, max
  // renders additional edges to indicate loadable nodes
  showAdditionEdges: true // true, false

};

var TreeLayout = /*#__PURE__*/function (_BaseLayout) {
  _inherits(TreeLayout, _BaseLayout);

  function TreeLayout() {
    var _this;

    var customTreeConfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, TreeLayout);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(TreeLayout).call(this));
    _this.config = _objectSpread2({}, TreeConfig, {}, customTreeConfig);
    _this.leafs = [];
    return _this;
  }

  _createClass(TreeLayout, [{
    key: "calculateLayout",
    value: function calculateLayout() {
      var _this2 = this;

      var isVertical = this.config.orientation === "vertical"; // construct a tree

      var constructTree = function constructTree(array, parentRef, rootRef) {
        var root = rootRef !== undefined ? rootRef : [];
        var parent = parentRef !== undefined ? parentRef : {
          id: null
        };
        var children = array.filter(function (child) {
          return child.parentId === parent.id;
        });

        if (children.length > 0) {
          if (parent.id === null) {
            root = children;
          } else {
            parent.children = children;
          }

          children.forEach(function (child) {
            constructTree(array, child);
          });
        }

        return root;
      };

      var InitializeNodes = function InitializeNodes(node, parent, prevSibling, depth) {
        node.setDepth(depth);
        node.setParent(parent);
        node.setPrevSibling(prevSibling);

        if (isVertical) {
          node.setFinalY(depth);
        } else {
          node.setFinalX(depth);
        }

        if (node.getChildren() === undefined) {
          node.setChildren([]);
        }

        node.children.forEach(function (child, i) {
          var prev = i >= 1 ? node.children[i - 1] : null;
          InitializeNodes(child, node, prev, depth + 1);
        });
      };

      var finalizeTree = function finalizeTree(node) {
        node.setFinalX(node.getFinalX() + _this2.config.translateX);
        node.setFinalY(node.getFinalY() + _this2.config.translateY);
        node.children.forEach(function (child) {
          finalizeTree(child);
        });
      };

      var CalculateFinalPositions = function CalculateFinalPositions(node, modifier) {
        if (isVertical) {
          node.setFinalX(node.getFinalX() + modifier);
        } else {
          node.setFinalY(node.getFinalY() + modifier);
        }

        node.children.forEach(function (child) {
          CalculateFinalPositions(child, node.modifier + modifier);
        });
      };

      var CalculateInitialX = function CalculateInitialX(node) {
        node.children.forEach(function (child) {
          CalculateInitialX(child);
        });
        var w = _this2.config.renderingSize === "max" ? node.config.maxWidth : node.config.minWidth;
        var h = _this2.config.renderingSize === "max" ? node.config.maxHeight : node.config.minHeight;
        w += _this2.config.hSpacing;
        h += _this2.config.vSpacing;

        if (isVertical) {
          node.setFinalY(node.getDepth() * h); // if node has no children

          if (node.children.length === 0) {
            // set x to prev siblings x, or 0 for first node in row
            if (!node.isLeftMost()) {
              node.setFinalX(node.getPrevSibling().getFinalX() + w);
            } else {
              node.setFinalX(0);
            }
          } else if (node.children.length === 1) {
            if (node.isLeftMost()) {
              node.setFinalX(node.children[0].getFinalX());
            } else {
              node.setFinalX(node.getPrevSibling().getFinalX() + w);
              node.setModifier(node.getFinalX() - node.children[0].getFinalX());
            }
          } else {
            // center node on 2+ nodes
            var left = node.getLeftMostChild();
            var right = node.getRightMostChild();
            var mid = (left.getFinalX() + right.getFinalX()) / 2;

            if (node.isLeftMost()) {
              node.setFinalX(mid);
            } else {
              node.setFinalX(node.getPrevSibling().getFinalX() + w);
              node.setModifier(node.getFinalX() - mid);
            }
          }
        } else {
          node.setFinalX(node.getDepth() * w); // if node has no children

          if (node.children.length === 0) {
            // set y to prev siblings y, or 0 for first node in col
            if (!node.isLeftMost()) {
              node.setFinalY(node.getPrevSibling().getFinalY() + h);
            } else {
              node.setFinalY(0);
            }
          } else if (node.children.length === 1) {
            if (node.isLeftMost()) {
              node.setFinalY(node.children[0].getFinalY());
            } else {
              node.setFinalY(node.getPrevSibling().getFinalY() + h);
              node.setModifier(node.getFinalY() - node.children[0].getFinalY());
            }
          } else {
            // center node on 2+ nodes
            var _left = node.getLeftMostChild();

            var _right = node.getRightMostChild();

            var _mid = (_left.getFinalY() + _right.getFinalY()) / 2;

            if (node.isLeftMost()) {
              node.setFinalY(_mid);
            } else {
              node.setFinalY(node.getPrevSibling().getFinalY() + h);
              node.setModifier(node.getFinalY() - _mid);
            }
          }
        }
      };

      var fixOverlappingConflicts = function fixOverlappingConflicts(node) {
        node.children.forEach(function (child) {
          fixOverlappingConflicts(child);
        });

        var getLeftContour = function getLeftContour(current) {
          var value = -Infinity;
          var queue = [current];

          while (queue.length !== 0) {
            var deq = queue.shift();
            deq.children.forEach(function (child) {
              queue.push(child);
            });

            if (isVertical) {
              value = Math.max(value, deq.getFinalX());
            } else {
              value = Math.max(value, deq.getFinalY());
            }
          }

          return value;
        };

        var getRightContour = function getRightContour(current) {
          var value = Infinity;
          var queue = [current];

          while (queue.length !== 0) {
            var deq = queue.shift();
            deq.children.forEach(function (child) {
              queue.push(child);
            });

            if (isVertical) {
              value = Math.min(value, deq.getFinalX());
            } else {
              value = Math.min(value, deq.getFinalY());
            }
          }

          return value;
        };

        var shift = function shift(current, value) {
          var queue = [current];

          while (queue.length !== 0) {
            var deq = queue.shift();
            deq.children.forEach(function (child) {
              queue.push(child);
            });

            if (isVertical) {
              deq.setFinalX(deq.getFinalX() + value);
            } else {
              deq.setFinalY(deq.getFinalY() + value);
            }
          }
        };

        var distance = 0;
        var w = _this2.config.renderingSize === "max" ? node.config.maxWidth : node.config.minWidth;
        var h = _this2.config.renderingSize === "max" ? node.config.maxHeight : node.config.minHeight;

        if (isVertical) {
          distance = w + _this2.config.hSpacing;
        } else {
          distance = h + _this2.config.vSpacing;
        }

        for (var i = 0; i < node.children.length - 1; i += 1) {
          var c1 = getLeftContour(node.children[i]);
          var c2 = getRightContour(node.children[i + 1]);

          if (c1 >= c2) {
            shift(node.children[i + 1], c1 - c2 + distance);
          }
        }
      };

      var centerRoot = function centerRoot(node) {
        if (isVertical) {
          (function () {
            var minX = 0;
            var maxX = 0;
            var queue = [node];

            while (queue.length) {
              var deq = queue.shift();
              minX = Math.min(deq.getFinalX(), minX);
              maxX = Math.max(deq.getFinalX(), maxX);
              deq.children.forEach(function (child) {
                return queue.push(child);
              });
            }

            node.setFinalX((minX + maxX) / 2);
          })();
        } else {
          (function () {
            var minY = 0;
            var maxY = 0;
            var queue = [node];

            while (queue.length) {
              var deq = queue.shift();
              minY = Math.min(deq.getFinalY(), minY);
              maxY = Math.max(deq.getFinalY(), maxY);
              deq.children.forEach(function (child) {
                return queue.push(child);
              });
            }

            node.setFinalY((minY + maxY) / 2);
          })();
        }
      };

      var calcRadialEdges = function calcRadialEdges(edges) {
        edges.forEach(function (edge) {
          edge.calculateEdge();
        });
      };

      var addLeaf = function addLeaf(node, initialX, initialY) {
        if (_this2.config.showAdditionEdges === false) {
          return;
        }

        if (node.children.length === 0 && node.childrenIds.length > 0) {
          var leaf = new LeafExtenstion(_this2.canvas, node);
          leaf.finalX = node.finalX;
          var h = _this2.config.renderingSize === "max" ? node.config.maxHeight : node.config.minHeight;
          leaf.finalY = node.finalY + h + 35;
          leaf.initialX = initialX;
          leaf.initialY = initialY;
          leaf.addEvent("dblclick", function () {
            _this2.manageDataAsync(node);
          });

          _this2.leafs.push(leaf);
        }

        node.children.forEach(function (child) {
          addLeaf(child, initialX, initialY);
        });
      };

      var root = constructTree(this.nodes)[0]; // TODO: filter for root

      InitializeNodes(root, null, null, 0);
      CalculateInitialX(root);
      CalculateFinalPositions(root, 0);
      fixOverlappingConflicts(root);
      centerRoot(root);
      finalizeTree(root);
      calcRadialEdges(this.edges);
      addLeaf(root, root.getFinalX(), root.getFinalY()); // console.log(root)
    }
  }, {
    key: "renderLayout",
    value: function renderLayout() {
      var _this3 = this;

      this.centerX = this.nodes[0].getFinalX();
      this.centerY = this.nodes[0].getFinalY();
      this.nodes.forEach(function (node) {
        if (_this3.config.renderingSize === "max") {
          if (node.svg === null) node.renderAsMax(_this3.centerX, _this3.centerY);
        } else if (_this3.config.renderingSize === "min") {
          if (node.svg === null) {
            node.renderAsMin(_this3.centerX, _this3.centerY);
          }
        }

        node.transformToFinalPosition();
      });
      this.leafs.forEach(function (leaf) {
        leaf.render();
        leaf.transformToFinalPosition();
      });
      this.edges.forEach(function (edge) {
        if (edge.svg === null) {
          edge.render(_this3.centerX, _this3.centerY);
        }

        edge.transformToFinalPosition();
      });
    }
  }]);

  return TreeLayout;
}(BaseLayout);

var $hypot = Math.hypot;
var abs = Math.abs;
var sqrt = Math.sqrt;

// Chrome 77 bug
// https://bugs.chromium.org/p/v8/issues/detail?id=9546
var BUGGY = !!$hypot && $hypot(Infinity, NaN) !== Infinity;

// `Math.hypot` method
// https://tc39.github.io/ecma262/#sec-math.hypot
_export({ target: 'Math', stat: true, forced: BUGGY }, {
  hypot: function hypot(value1, value2) { // eslint-disable-line no-unused-vars
    var sum = 0;
    var i = 0;
    var aLen = arguments.length;
    var larg = 0;
    var arg, div;
    while (i < aLen) {
      arg = abs(arguments[i++]);
      if (larg < arg) {
        div = larg / arg;
        sum = sum * div * div + 1;
        larg = arg;
      } else if (arg > 0) {
        div = arg / larg;
        sum += div * div;
      } else sum += arg;
    }
    return larg === Infinity ? Infinity : larg * sqrt(sum);
  }
});

var ContextualConfig = {
  offset: 8,
  animationSpeed: 300,
  color: "#ff8e9e",
  blockarrowLineWidth: 3,
  blockarrowArrowWidth: 10,
  blockarrowArrowLength: 5
};

var ContextualConainer = /*#__PURE__*/function () {
  function ContextualConainer(canvas, contextualConfig, type) {
    _classCallCheck(this, ContextualConainer);

    this.canvas = canvas;
    this.svg = null;
    this.config = _objectSpread2({}, ContextualConfig, {}, contextualConfig);
    this.type = type;
    this.initialX = 0;
    this.initialY = 0;
    this.finalX = 0;
    this.finalY = 0;
    this.w = 0;
    this.h = 0;
    this.cx = 0;
    this.cy = 0;
    this.fromPoint = null;
    this.toPoint = null;
  }

  _createClass(ContextualConainer, [{
    key: "setColor",
    value: function setColor(color) {
      this.config = _objectSpread2({}, this.config, {
        color: color
      });
    }
  }, {
    key: "render",
    value: function render(X, Y) {
      var svg = this.canvas.group().draggable();
      var node = this.canvas.rect(0, 0).draggable();

      if (this.type === "riskContainer") {
        node.fill(this.config.riskContainerBackgroundColor);
        node.radius(this.config.riskContainderBorderRadius);
        node.stroke({
          color: this.config.riskContainerBorderStrokeColor,
          width: this.config.riskContainerBorderStrokeWidth
        });
      } else if (this.type === "childrenContainer") {
        node.fill(this.config.childrenContainerBackgroundColor);
        node.radius(this.config.childrenContainderBorderRadius);
        node.stroke({
          color: this.config.childrenContainerBorderStrokeColor,
          width: this.config.childrenContainerBorderStrokeWidth
        });
      } else if (this.type === "parentContainer") {
        node.fill(this.config.parentContainerBackgroundColor);
        node.radius(this.config.parentContainderBorderRadius);
        node.stroke({
          color: this.config.parentContainerBorderStrokeColor,
          width: this.config.parentContainerBorderStrokeWidth
        });
      }

      svg.add(node);
      svg.id(this.type);
      svg.center(X, Y);
      this.svg = svg;
      this.fromPoint.y -= this.config.offset;
      this.toPoint.y += this.config.offset; // this.canvas.circle(5).center(this.fromPoint.x, this.fromPoint.y).fill("#000")
      // this.canvas.circle(5).center(this.toPoint.x, this.toPoint.y).fill("#99f")
      // add edge

      var lw = this.config.blockarrowLineWidth;
      var aw = this.config.blockarrowArrowWidth;
      var al = this.config.blockarrowArrowLength;
      var dx = this.toPoint.x - this.fromPoint.x;
      var dy = this.toPoint.y - this.fromPoint.y;
      var len = Math.sqrt(dx * dx + dy * dy);
      var dW = aw - lw;
      var angle = Math.atan2(dy, dx) * 180 / Math.PI;
      this.angle = angle;
      var svgPath = "\n      M 0,".concat(-lw / 2, "\n      h ").concat(len - al, "\n      v ").concat(-dW / 2, "\n      L ").concat(len, ",0\n      L ").concat(len - al, ",").concat(aw / 2, "\n      v ").concat(-dW / 2, "\n      H 0\n      Z\n    ");
      var path = this.canvas.path();
      path.plot(svgPath);
      path.fill(this.config.color);
      this.ex = this.toPoint.x;
      this.ey = (this.toPoint.y + this.fromPoint.y) / 2;
      path.center(this.ex, this.ey);
      path.rotate(angle);
      path.scale(0.0001);
      svg.add(path); // this.canvas.circle(5).center(this.cx, this.cy).fill("#f75")
      // this.canvas.circle(5).center(p2x, p2y).fill("#6f7")
    }
  }, {
    key: "transform",
    value: function transform() {
      this.svg.back();
      this.svg.get(0).animate({
        duration: this.config.animationSpeed
      }).size(this.w, this.h).center(this.cx, this.cy);
      this.svg.get(1).animate({
        duration: this.config.animationSpeed
      }).transform({
        scale: 1,
        rotate: this.angle,
        position: [this.ex, this.ey]
      });
    }
  }, {
    key: "removeContainer",
    value: function removeContainer(X, Y) {
      var _this = this;

      if (this.svg !== null) {
        this.svg.animate({
          duration: this.config.animationSpeed
        }).transform({
          scale: 0.001,
          position: [X, Y]
        }).after(function () {
          _this.svg.remove();

          _this.svg = null;
        });
      }
    }
  }]);

  return ContextualConainer;
}();

var ContextualConfig$1 = {
  // limit width and size
  maxLayoutWidth: 1200,
  maxLayoutHeight: 800,
  // where to translate a given layout
  translateX: 0,
  translateY: 0,
  // layout animation speed for all nodes and edges
  animationSpeed: 300,
  // hide all other layouts and center selected one
  hideOtherLayouts: false,
  // TODO:
  // spacing between nodes
  spacing: 16,
  parentFocusDistance: 250,
  // TODO: fix naming convention
  childFocusDistance: 250,
  translateRiskX: 450,
  translateRiskY: -100,
  focusRiskDistance: 400,
  // how to render all nodes
  renderingSize: "min",
  // min max
  // risk container
  riskLimitContainer: 1,
  riskContainderBorderRadius: 5,
  riskContainerBorderStrokeColor: "#ff8e9e",
  riskContainerBorderStrokeWidth: 1,
  riskContainerBackgroundColor: "#fff",
  // children container
  childrenLimitContainer: 3,
  childrenContainderBorderRadius: 5,
  childrenContainerBorderStrokeColor: "#555555cc",
  childrenContainerBorderStrokeWidth: 1,
  childrenContainerBackgroundColor: "#fff",
  // container config
  parentLimitContainer: 3,
  parentContainderBorderRadius: 5,
  parentContainerBorderStrokeColor: "#555555cc",
  parentContainerBorderStrokeWidth: 1,
  parentContainerBackgroundColor: "#fff"
};

var ContextualLayout = /*#__PURE__*/function (_BaseLayout) {
  _inherits(ContextualLayout, _BaseLayout);

  function ContextualLayout() {
    var _this;

    var customConfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, ContextualLayout);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ContextualLayout).call(this));
    console.log(customConfig);
    _this.config = _objectSpread2({}, ContextualConfig$1, {}, customConfig);

    if (customConfig.focus === undefined) {
      throw new Error("No Focus element reference id provided");
    }

    _this.focusId = customConfig.focus;
    _this.focus = null;
    _this.parents = [];
    _this.children = [];
    _this.assginedNode = null;
    _this.assignedRisks = [];
    _this.containers = [];
    return _this;
  }

  _createClass(ContextualLayout, [{
    key: "calculateLayout",
    value: function calculateLayout() {
      var _this2 = this;

      var centerX = this.config.maxLayoutWidth / 2;
      var centerY = this.config.maxLayoutHeight / 2; // calculate risk container

      var calculateContainers = function calculateContainers(risks, children, parents) {
        var createContainer = function createContainer(nodes, type) {
          var xValues = nodes.map(function (r) {
            return r.finalX;
          });
          var yValues = nodes.map(function (r) {
            return r.finalY;
          });

          var p0x = Math.min.apply(Math, _toConsumableArray(xValues)) - nodes[0].config.minWidth / 2 - _this2.config.spacing;

          var p0y = Math.min.apply(Math, _toConsumableArray(yValues)) - nodes[0].config.minHeight / 2 - _this2.config.spacing;

          var p1x = Math.max.apply(Math, _toConsumableArray(xValues)) + nodes[0].config.minWidth / 2 + _this2.config.spacing;

          var p1y = Math.min.apply(Math, _toConsumableArray(yValues)) - nodes[0].config.minHeight / 2 - _this2.config.spacing;

          var p2x = Math.max.apply(Math, _toConsumableArray(xValues)) + nodes[0].config.minWidth / 2 + _this2.config.spacing;

          var p2y = Math.max.apply(Math, _toConsumableArray(yValues)) + nodes[0].config.minHeight / 2 + _this2.config.spacing; // this.canvas.circle(5).center(p0x, p0y)
          // this.canvas.circle(5).center(p1x, p1y).fill("#f75")
          // this.canvas.circle(5).center(p2x, p2y).fill("#6f7")


          var w = Math.hypot(p0x - p1x, p0y - p1y);
          var h = Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));
          var cx = (p0x + p2x) / 2;
          var cy = (p0y + p2y) / 2;
          var container = new ContextualConainer(_this2.canvas, _this2.config, type);
          container.w = w;
          container.h = h;
          container.cx = cx;
          container.cy = cy;
          _this2.containers = [].concat(_toConsumableArray(_this2.containers), [container]);
        };

        if (risks.length > _this2.config.riskLimitContainer) {
          // FIXME: it does not render a container for one risk
          createContainer(risks, "riskContainer");
        }

        if (children.length > _this2.config.childrenLimitContainer) {
          createContainer(children, "childrenContainer");
        }

        if (parents.length > _this2.config.parentLimitContainer) {
          createContainer(parents, "parentContainer");
        }
      }; // calculate focus position


      var calculateFocusPosition = function calculateFocusPosition() {
        _this2.focus.setFinalX(centerX - centerX / 2.5);

        _this2.focus.setFinalY(centerY);
      }; // caculate assgined node position


      var calculateAssignedPosition = function calculateAssignedPosition() {
        if (_this2.assginedNode) {
          _this2.assginedNode.setFinalX(centerX + centerX / 1.25);

          _this2.assginedNode.setFinalY(centerY);
        }
      }; // position parents as grid


      var calculateParentChildRiskPositions = function calculateParentChildRiskPositions(nodes, location) {
        if (nodes.length === 0) {
          return;
        }

        var limitation;

        if (location === "risk") {
          limitation = _this2.config.riskLimitContainer;
        } else if (location === "parent") {
          limitation = _this2.config.parentLimitContainer;
        } else {
          limitation = _this2.config.childrenLimitContainer;
        }

        var fx = _this2.focus.getFinalX();

        var fy = _this2.focus.getFinalY();

        var rx = _this2.focus.getFinalY() + _this2.config.translateRiskX;

        var ry = _this2.focus.getFinalY() + _this2.config.translateRiskY; // arranges nodes next to each other growing to the left


        var calculateLeftNodes = function calculateLeftNodes(nodeList, row) {
          var isEven = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
          var w = 0;
          nodeList.forEach(function (node, i) {
            if (isEven === false) {
              w += node.config.minWidth + _this2.config.spacing;
            } else {
              w += node.config.minWidth / 2 + _this2.config.spacing;

              if (i > 0) {
                w += node.config.minWidth / 2;
              } else {
                w -= _this2.config.spacing / 2;
              }
            }

            if (location === "risk") {
              node.setFinalX(rx - w);
            } else {
              node.setFinalX(fx - w);
            }

            var rowMultiplier = row * node.config.minHeight + row * _this2.config.spacing;

            if (location === "parent") {
              node.setFinalY(fy - _this2.config.parentFocusDistance - rowMultiplier);
            } else if (location === "child") {
              node.setFinalY(fy + _this2.config.childFocusDistance + rowMultiplier);
            } else {
              node.setFinalY(ry + _this2.config.childFocusDistance + rowMultiplier);
            }
          });
        }; // arranges nodes next to each other growing to the right


        var calculateRightNodes = function calculateRightNodes(nodeList, row) {
          var isEven = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
          var w = 0;
          nodeList.forEach(function (node, i) {
            if (isEven === false) {
              w += node.config.minWidth + _this2.config.spacing;
            } else {
              w += node.config.minWidth / 2 + _this2.config.spacing;

              if (i > 0) {
                w += node.config.minWidth / 2;
              } else {
                w -= _this2.config.spacing / 2;
              }
            }

            if (location === "risk") {
              node.setFinalX(rx + w);
            } else {
              node.setFinalX(fx + w);
            }

            var rowMultiplier = row * node.config.minHeight + row * _this2.config.spacing;

            if (location === "parent") {
              node.setFinalY(fy - _this2.config.parentFocusDistance - rowMultiplier);
            } else if (location === "child") {
              node.setFinalY(fy + _this2.config.childFocusDistance + rowMultiplier);
            } else {
              node.setFinalY(ry + _this2.config.childFocusDistance + rowMultiplier);
            }
          });
        };

        var calculateCenterNode = function calculateCenterNode(node, row) {
          if (location === "risk") {
            node.setFinalX(rx);
          } else {
            node.setFinalX(fx);
          }

          var rowMultiplier = row * node.config.minHeight + row * _this2.config.spacing;

          if (location === "parent") {
            node.setFinalY(fy - _this2.config.parentFocusDistance - rowMultiplier);
          } else if (location === "child") {
            node.setFinalY(fy + _this2.config.parentFocusDistance + rowMultiplier);
          } else {
            node.setFinalY(ry + _this2.config.childFocusDistance + rowMultiplier);
          }
        }; // arragen nodes without a container


        if (limitation >= nodes.length) {
          // dont create a container
          if (nodes.length % 2 === 1) {
            var mid = nodes.indexOf(nodes[Math.floor(nodes.length / 2)]);
            var leftNodes = nodes.slice(0, mid);
            var rightNodes = nodes.slice(mid + 1);
            var center = nodes[mid];
            calculateCenterNode(center, 0);
            calculateLeftNodes(leftNodes, 0);
            calculateRightNodes(rightNodes, 0);
          } else {
            var _mid = nodes.indexOf(nodes[Math.floor(nodes.length / 2)]);

            var _leftNodes = nodes.slice(0, _mid);

            var _rightNodes = nodes.slice(_mid);

            calculateLeftNodes(_leftNodes, 0, true);
            calculateRightNodes(_rightNodes, 0, true);
          }
        } // create nodes inside a container


        if (limitation < nodes.length) {
          // calculate node positions if there are more nodes than the set container limit
          if (limitation % 2 === 0) {
            var cols = limitation;
            var rows = Math.ceil(nodes.length / cols);
            var nodeIndex = 0;

            for (var row = 0; row < rows; row += 1) {
              var rowNodes = [];

              for (var col = 0; col < cols; col += 1) {
                var node = nodes[nodeIndex];

                if (node !== undefined) {
                  rowNodes.push(node);
                  nodeIndex += 1;
                }
              }

              if (rowNodes.length % 2 === 0) {
                var _mid2 = rowNodes.indexOf(rowNodes[Math.floor(rowNodes.length / 2)]);

                var _leftNodes2 = rowNodes.slice(0, _mid2);

                var _rightNodes2 = rowNodes.slice(_mid2);

                calculateLeftNodes(_leftNodes2, row, true);
                calculateRightNodes(_rightNodes2, row, true);
              } else {
                var _mid3 = rowNodes.indexOf(rowNodes[Math.floor(rowNodes.length / 2)]);

                var _leftNodes3 = rowNodes.slice(0, _mid3);

                var _rightNodes3 = rowNodes.slice(_mid3 + 1);

                var _center = rowNodes[_mid3];
                calculateCenterNode(_center, row);
                calculateLeftNodes(_leftNodes3, row);
                calculateRightNodes(_rightNodes3, row);
              }
            }
          } else {
            var _cols = limitation;

            var _rows = Math.ceil(nodes.length / _cols);

            var _nodeIndex = 0;

            for (var _row = 0; _row < _rows; _row += 1) {
              var _rowNodes = [];

              for (var _col = 0; _col < _cols; _col += 1) {
                var _node = nodes[_nodeIndex];

                if (_node !== undefined) {
                  _rowNodes.push(_node);

                  _nodeIndex += 1;
                }
              }

              if (_rowNodes.length % 2 === 1) {
                var _mid4 = _rowNodes.indexOf(_rowNodes[Math.floor(_rowNodes.length / 2)]);

                var _leftNodes4 = _rowNodes.slice(0, _mid4);

                var _rightNodes4 = _rowNodes.slice(_mid4 + 1);

                var _center2 = _rowNodes[_mid4];
                calculateCenterNode(_center2, _row);
                calculateLeftNodes(_leftNodes4, _row);
                calculateRightNodes(_rightNodes4, _row);
              } else {
                var _mid5 = _rowNodes.indexOf(_rowNodes[Math.floor(_rowNodes.length / 2)]);

                var _leftNodes5 = _rowNodes.slice(0, _mid5);

                var _rightNodes5 = _rowNodes.slice(_mid5);

                calculateLeftNodes(_leftNodes5, _row, true);
                calculateRightNodes(_rightNodes5, _row, true);
              }
            }
          }
        }
      }; // calculate parent and child edges


      var calculateParentChildEdges = function calculateParentChildEdges(edges) {
        edges.forEach(function (edge) {
          edge.calculateEdge();
        });
      }; // calculate risk and assigned edge // TODO:


      var calculateContainerEdges = function calculateContainerEdges(risks, container) {
        // risk
        var riskContainer = container.find(function (c) {
          return c.type === "riskContainer";
        });
        var childrenContainer = container.find(function (c) {
          return c.type === "childrenContainer";
        });
        var parentContainer = container.find(function (c) {
          return c.type === "parentContainer";
        });

        if (riskContainer) {
          var p0x = _this2.focus.getFinalX() + _this2.focus.config.maxWidth / 2;

          var p0y = _this2.focus.getFinalY(); // this.canvas.circle(5).center(p0x, p0y).fill("#f75")


          var p1x = _this2.assginedNode.getFinalX() - _this2.focus.config.minWidth / 2;

          var p1y = _this2.assginedNode.getFinalY(); // this.canvas.circle(5).center(p1x, p1y).fill("#76f")
          // has container


          if (risks.length > _this2.config.riskLimitContainer) {
            var p2x = riskContainer.cx;
            var p2y = riskContainer.cy - riskContainer.h / 2; // this.canvas.circle(5).center(p2x, p2y).fill("#18f")

            var p3x = p2x;
            var p3y = p1y; // this.canvas.circle(5).center(p3x, p3y).fill("#8ff")

            riskContainer.fromPoint = {
              x: p2x,
              y: p2y
            };
            riskContainer.toPoint = {
              x: p3x,
              y: p3y
            };
          }
        }

        if (childrenContainer) {
          // remove edges
          console.log();
          _this2.edges = _this2.edges.filter(function (e) {
            return e.toNode.getId() !== _this2.focus.getId();
          });

          var _p0x = _this2.focus.getFinalX();

          var _p0y = _this2.focus.getFinalY() + _this2.focus.config.maxHeight / 2; // this.canvas.circle(5).center(p0x, p0y).fill("#f75")


          var containerSpacing = 8 * 2; // TODO:

          var _p1x = _this2.focus.getFinalX();

          var _p1y = _this2.children[0].getFinalY() - _this2.children[0].config.minHeight / 2 - containerSpacing; // this.canvas.circle(5).center(p1x, p1y).fill("#76f")


          childrenContainer.setColor("#aaa");
          childrenContainer.fromPoint = {
            x: _p1x,
            y: _p1y
          };
          childrenContainer.toPoint = {
            x: _p0x,
            y: _p0y
          };
        }

        if (parentContainer) {
          console.log("parentContainer");
          _this2.edges = _this2.edges.filter(function (e) {
            return e.fromNode.getId() !== _this2.focus.getId();
          });

          var _p0x2 = _this2.focus.getFinalX();

          var _p0y2 = _this2.focus.getFinalY() - _this2.focus.config.maxHeight / 2;

          var _containerSpacing = 8 * 2; // TODO:


          var _p1x2 = _this2.focus.getFinalX();

          var maxY = Math.max.apply(Math, _toConsumableArray(_this2.parents.map(function (p) {
            return p.getFinalY();
          })));

          var _p1y2 = maxY + _this2.parents[0].config.minHeight / 2 + _containerSpacing;

          parentContainer.setColor("#aaa");
          parentContainer.fromPoint = {
            x: _p0x2,
            y: _p0y2
          };
          parentContainer.toPoint = {
            x: _p1x2,
            y: _p1y2
          };
        } // has no container

      };

      calculateFocusPosition();
      calculateAssignedPosition();
      calculateParentChildRiskPositions(this.parents, "parent");
      calculateParentChildRiskPositions(this.children, "child");
      calculateParentChildRiskPositions(this.risks, "risk");
      calculateParentChildEdges(this.edges);
      calculateContainers(this.risks, this.children, this.parents);
      calculateContainerEdges(this.risks, this.containers);
    }
  }, {
    key: "renderLayout",
    value: function renderLayout() {
      this.centerX = this.config.maxLayoutWidth / 2;
      this.centerY = this.config.maxLayoutHeight / 2;
      var X = this.focus.getFinalX();
      var Y = this.focus.getFinalY(); // render nodes

      this.nodes.forEach(function (node) {
        if (node.nodeSize === "max") {
          if (node.svg === null) node.renderAsMax(X, Y);
        } else if (node.nodeSize === "min") {
          if (node.svg === null) node.renderAsMin(X, Y);
        }

        node.transformToFinalPosition();
      }); // render containers

      this.containers.forEach(function (container) {
        container.render(X, Y);
        container.transform();
      });
      this.edges.forEach(function (edge) {
        if (edge.svg === null) {
          edge.render(X, Y);
        }

        edge.transformToFinalPosition();
      });
    }
  }]);

  return ContextualLayout;
}(BaseLayout);

/**
 * This class represents a graph node.
 * @param {Number} id The given id for this node.
 */
var GraphNode = /*#__PURE__*/function () {
  function GraphNode(id) {
    _classCallCheck(this, GraphNode);

    this.id = id;
    this.neighbors = [];
    this.edges = [];
  }
  /**
   * Adds a node as neighbor to the current nodes neighbors.
   * @param {GraphNode} node The neighbor node to add to the node.
   */


  _createClass(GraphNode, [{
    key: "addNeighbor",
    value: function addNeighbor(node) {
      this.neighbors.push(node);
    }
    /**
     * Removes a neighbor from the current nodes neighbors.
     * @param {GraphNode} node The neighbor node to remove from the node.
     */

  }, {
    key: "removeNeighbor",
    value: function removeNeighbor(node) {
      this.neighbors = this.neighbors.filter(function (neighbor) {
        return neighbor !== node;
      });
    }
    /**
     * Adds a new edge to the current nodes edges.
     * @param {GraphEdge} edge The edge to add to the node.
     */

  }, {
    key: "addEdge",
    value: function addEdge(edge) {
      this.edges.push(edge);
    }
    /**
     * Returns all neighbors for this node.
     */

  }, {
    key: "getNeighbors",
    value: function getNeighbors() {
      return this.neighbors;
    }
  }]);

  return GraphNode;
}();

/**
 * This class represents a graph node.
 * @param {Number} startNode The start node id.
 * @param {Number} endNode The end node id.
 */
var GraphEdge = function GraphEdge(startNode, endNode) {
  _classCallCheck(this, GraphEdge);

  this.startNode = startNode;
  this.endNode = endNode;
};

/**
 * This class provides basic functionality for managing data.
 */

var Graph = /*#__PURE__*/function () {
  function Graph() {
    _classCallCheck(this, Graph);

    this.nodes = [];
    this.edges = [];
  }
  /**
   * Creates and adds a new node to the current graph.
   * @param {Number} id The node id to include in the current graph.
   */


  _createClass(Graph, [{
    key: "includeNode",
    value: function includeNode(id) {
      this.nodes.push(new GraphNode(id));
    }
    /**
     * Removes a node and all its occurrences within the current graph.
     * @param {Number} id The node id to exclude from the current graph.
     */

  }, {
    key: "excludeNode",
    value: function excludeNode(id) {
      var _this = this;

      var node = this.nodes.find(function (n) {
        return n.id === id;
      });
      this.nodes = this.nodes.filter(function (n) {
        return n !== node;
      }); // remove edge references

      node.neighbors.forEach(function (neighbor) {
        // edge from end node to removed node
        var edge1 = _this.edges.find(function (e) {
          return e.startNode === id && e.endNode === neighbor.id;
        });

        if (edge1 !== undefined) {
          _this.edges = _this.edges.filter(function (e) {
            return e !== edge1;
          }); // remove start node edge reference

          var endNode = _this.nodes.find(function (n) {
            return n.id === edge1.endNode;
          });

          endNode.edges = endNode.edges.filter(function (e) {
            return e !== edge1;
          }); // remove start node neighbor

          endNode.removeNeighbor(node);
        } // edge from start node to removed node


        var edge2 = _this.edges.find(function (e) {
          return e.startNode === neighbor.id && e.endNode === id;
        });

        if (edge2 !== undefined) {
          _this.edges = _this.edges.filter(function (e) {
            return e !== edge2;
          }); // remove start node edge reference

          var startNode = _this.nodes.find(function (n) {
            return n.id === edge2.startNode;
          });

          startNode.edges = startNode.edges.filter(function (e) {
            return e !== edge2;
          }); // remove start node neighbor

          startNode.removeNeighbor(node);
        }
      });
    }
    /**
     * Creates a new edge and update the current graph.
     * @param {Number} startNode The start node id.
     * @param {Number} endNode The end node id.
     */

  }, {
    key: "includeEdge",
    value: function includeEdge(startNode, endNode) {
      if (startNode === endNode) {
        throw new Error("could not create an edge between two identical nodes");
      }

      var fromNodeRef = this.nodes.find(function (n) {
        return n.id === startNode;
      });

      if (fromNodeRef === undefined) {
        throw new Error("could not find start node ".concat(startNode));
      }

      var toNodeRef = this.nodes.find(function (n) {
        return n.id === endNode;
      });

      if (toNodeRef === undefined) {
        throw new Error("could not find start node ".concat(endNode));
      } // add neigbhor


      fromNodeRef.addNeighbor(toNodeRef);
      toNodeRef.addNeighbor(fromNodeRef); // create edge

      var edge = new GraphEdge(startNode, endNode);
      fromNodeRef.addEdge(edge);
      toNodeRef.addEdge(edge);
      this.edges.push(edge);
    }
    /**
     * Removes an edge and all its occurrences within the current graph.
     * @param {Number} startNode The start node id.
     * @param {Number} endNode The end node id.
     */

  }, {
    key: "excludeEdge",
    value: function excludeEdge(startNode, endNode) {
      if (startNode === endNode) {
        throw new Error("could not remove an edge between two identical nodes");
      }

      var fromNodeRef = this.nodes.find(function (n) {
        return n.id === startNode;
      });

      if (fromNodeRef === undefined) {
        throw new Error("could not find start node ".concat(startNode));
      }

      var toNodeRef = this.nodes.find(function (n) {
        return n.id === endNode;
      });

      if (toNodeRef === undefined) {
        throw new Error("could not find start node ".concat(endNode));
      } // remove edge


      var edge = this.edges.find(function (e) {
        return e.startNode === startNode && e.endNode === endNode;
      });
      this.edges = this.edges.filter(function (e) {
        return e !== edge;
      }); // remove edge reference from nodes

      fromNodeRef.edges = fromNodeRef.edges.filter(function (e) {
        return e !== edge;
      });
      toNodeRef.edges = toNodeRef.edges.filter(function (e) {
        return e !== edge;
      }); // remove unused neighbors

      fromNodeRef.removeNeighbor(toNodeRef);
      toNodeRef.removeNeighbor(fromNodeRef);
    }
  }, {
    key: "hasNode",
    value: function hasNode(node) {
      return this.nodes.find(function (n) {
        return n.id === node.id;
      });
    }
  }, {
    key: "getNodes",
    value: function getNodes() {
      return this.nodes;
    }
  }, {
    key: "getEdges",
    value: function getEdges() {
      return this.edges;
    }
  }]);

  return Graph;
}();

/**
 * The canvas element where all svgs are held
 * @typedef {Canvas} Canvas
 *
 * @see https://svgjs.com/docs/3.0/container-elements/#svg-svg
 */

/**
 * The raw data object to create a node
 * @typedef {Data} Data
 *
 * @property {Number} id the node id
 * @property {String} label the node label
 * @property {String} type the node type (asset, control, risk requirement, custom)
 * @property {String} tooltipText the tooltip text that is shown while hovering a specific node
 */

/**
 * Creates and handles all vizualization operations
 *
 */

var Visualization = /*#__PURE__*/function () {
  function Visualization(config) {
    _classCallCheck(this, Visualization);

    // TODO: this constructor should receive custom overrides for all nodes, edges and layouts
    if (config.databaseUrl === undefined || config.databaseUrl === null) {
      throw new Error("missing database URL");
    } // create the main canvas element dom element


    var element = document.createElement("div");
    element.setAttribute("id", "canvas");
    element.style.position = "relative";
    document.body.appendChild(element); // create the tooltip dom element

    var tooltip = document.createElement("div");
    tooltip.setAttribute("id", "tooltip");
    tooltip.style.display = "none";
    tooltip.style.position = "absolute";
    tooltip.style.background = "#333";
    tooltip.style.border = "0px";
    tooltip.style.boxShadow = "0 5px 15px -5px rgba(0, 0, 0, .65)";
    tooltip.style.color = "#eee";
    tooltip.style.padding = "0.4rem 0.6rem";
    tooltip.style.fontSize = "0.85rem";
    tooltip.style.fontWeight = "400";
    tooltip.style.fontStyle = "normal";
    element.appendChild(tooltip); // canvas set up

    this.zoomLevel = 1;
    this.canvas = SVG().addTo(element).size(window.innerWidth - 10, window.innerHeight - 10).viewbox(0, 0, window.innerWidth - 10, window.innerHeight - 10).panZoom({
      zoomMin: 0.25,
      zoomMax: 10,
      zoomFactor: 0.25
    });
    this.layouts = [];
    this.lastLayoutWidth = 0;
    this.config = _objectSpread2({}, config, {
      nodeEndpoint: "node-data",
      edgeEndpoint: "edge-data",
      contextualRelationshipEndpoint: "contextual-relationships",
      layoutSpacing: 200
    }); // stores all loaded nodes

    this.loadedNodes = [];
    this.knownGraph = new Graph();
    this.fetchedNodes = [];
    this.fetchedEdges = [];
  }

  _createClass(Visualization, [{
    key: "createInitialGraph",
    value: function createInitialGraph() {
      var _this = this;

      var nodeIds = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      var edgeIds = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      var graph = new Graph(); // add nodes

      nodeIds.forEach(function (id) {
        graph.includeNode(id);

        _this.knownGraph.includeNode(id);
      }); // add edges

      edgeIds.forEach(function (ids) {
        graph.includeEdge(ids[0], ids[1]);

        _this.knownGraph.includeEdge(ids[0], ids[1]);
      });
      return graph;
    }
    /**
     * Renders a layout
     * @param {Graph} initialGraphData the initial graph that should be displayed
     * @param {Layout} layout the layout type
     */

  }, {
    key: "render",
    value: function () {
      var _render = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(initialGraphData, layout) {
        var createdLayout, layouts, offset, _createdLayout;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                layout.setCanvas(this.canvas);
                layout.setConfig({
                  databaseUrl: this.config.databaseUrl,
                  nodeEndpoint: this.config.nodeEndpoint,
                  edgeEndpoint: this.config.edgeEndpoint,
                  contextualRelationshipEndpoint: this.config.contextualRelationshipEndpoint
                });
                layout.setNodeData(initialGraphData.getNodes());
                layout.setEdgeData(initialGraphData.getEdges());
                this.layouts.push(layout);
                layout.setLayoutReferences(this.layouts);

                if (!(layout instanceof GridLayout)) {
                  _context.next = 14;
                  break;
                }

                _context.next = 9;
                return layout.loadInitialGridDataAsync();

              case 9:
                createdLayout = _context.sent;
                layouts = this.layouts.slice(0, this.layouts.indexOf(layout));
                offset = layouts.map(function (l) {
                  return l.layoutInfo.w;
                }).reduce(function (a, b) {
                  return a + b;
                }, 0);
                createdLayout.calculateLayout(offset);
                createdLayout.renderLayout();

              case 14:
                if (!(layout instanceof ContextualLayout)) {
                  _context.next = 18;
                  break;
                }

                _context.next = 17;
                return layout.loadInitialContextualDataAsync();

              case 17:
                _createdLayout = _context.sent;

              case 18:
                return _context.abrupt("return", layout);

              case 19:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function render(_x, _x2) {
        return _render.apply(this, arguments);
      }

      return render;
    }()
  }, {
    key: "update",
    value: function () {
      var _update = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(layout, graphOrConfig) {
        var _this2 = this;

        var config,
            updatedLayout,
            prevW,
            newW,
            _updatedLayout,
            _prevW,
            _newW,
            _args2 = arguments;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                config = _args2.length > 2 && _args2[2] !== undefined ? _args2[2] : {};

                if (!(graphOrConfig instanceof Graph)) {
                  _context2.next = 14;
                  break;
                }

                _context2.next = 4;
                return layout.updateGraphStructure(graphOrConfig, config);

              case 4:
                _context2.next = 6;
                return layout.loadAdditionalGridDataAsync();

              case 6:
                updatedLayout = _context2.sent;
                prevW = updatedLayout.layoutInfo.w;
                updatedLayout.calculateLayout();
                newW = updatedLayout.layoutInfo.w; // update all layouts right side

                this.layouts.forEach(function (llayout, i) {
                  if (i > _this2.layouts.indexOf(layout)) {
                    llayout.calculateLayout(newW - prevW);
                    llayout.renderLayout();
                  }
                });
                updatedLayout.renderLayout();
                _context2.next = 24;
                break;

              case 14:
                _context2.next = 16;
                return layout.updateLayoutConfiguration(graphOrConfig);

              case 16:
                _updatedLayout = _context2.sent;
                _context2.next = 19;
                return _updatedLayout.loadAdditionalGridDataAsync();

              case 19:
                _prevW = _updatedLayout.layoutInfo.w;

                _updatedLayout.calculateLayout();

                _newW = _updatedLayout.layoutInfo.w; // update all layouts right side

                this.layouts.forEach(function (llayout, i) {
                  if (i > _this2.layouts.indexOf(layout)) {
                    llayout.calculateLayout(_newW - _prevW);
                    llayout.renderLayout();
                  }
                });

                _updatedLayout.renderLayout();

              case 24:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function update(_x3, _x4) {
        return _update.apply(this, arguments);
      }

      return update;
    }()
    /**
     * Transforms a layout from one type into another type
     * @param {Layout} currentLayout
     * @param {Layout} newLayout
     */

  }, {
    key: "transform",
    value: function () {
      var _transform = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(currentLayout, newLayout) {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                newLayout.setCanvas(this.canvas);
                newLayout.setConfig({
                  databaseUrl: this.config.databaseUrl
                });

                if (newLayout instanceof RadialLayout) {
                  newLayout.createRadialDataAsync(currentLayout.getNodeData(), currentLayout.getEdgeData());
                }

                if (newLayout instanceof GridLayout) {
                  newLayout.createGridDataAsync(currentLayout.getNodeData(), currentLayout.getEdgeData());
                }

                if (newLayout instanceof TreeLayout) {
                  newLayout.createRadialDataAsync(currentLayout.getNodeData(), currentLayout.getEdgeData());
                }

                if (newLayout instanceof ContextualLayout) {
                  newLayout.createContextualDataAsync(currentLayout.getNodeData(), currentLayout.getEdgeData());
                }

                currentLayout.removeLayout();

              case 7:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function transform(_x5, _x6) {
        return _transform.apply(this, arguments);
      }

      return transform;
    }()
    /**
     * Change the current zoom level
     * @param {Number} zoom zoom level between 0.25 and 10
     * @param {Object} [zoomOptions]
     * @param {Number} [zoomOptions.x] zoom into specified point
     * @param {Number} [zoomOptions.y] zoom into specified point
     *
     */

  }, {
    key: "setZoom",
    value: function setZoom(zoom, opts) {
      this.canvas.zoom(zoom, opts);
    }
    /**
     * Returns the current canvas element
     */

  }, {
    key: "getCanvas",
    value: function getCanvas() {
      return this.canvas;
    }
  }]);

  return Visualization;
}();

export { ContextualLayout, EdgeFactory, Graph, GridLayout, NodeFactory, RadialLayout, TreeLayout, Visualization };
//# sourceMappingURL=graphVisualization.js.map
