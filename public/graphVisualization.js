var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
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

function ownKeys(object, enumerableOnly) {
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
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
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

const methods = {};
const names = [];

function registerMethods (name, m) {
  if (Array.isArray(name)) {
    for (const _name of name) {
      registerMethods(_name, m);
    }
    return
  }

  if (typeof name === 'object') {
    for (const _name in name) {
      registerMethods(_name, name[_name]);
    }
    return
  }

  addMethodNames(Object.getOwnPropertyNames(m));
  methods[name] = Object.assign(methods[name] || {}, m);
}

function getMethodsFor (name) {
  return methods[name] || {}
}

function getMethodNames () {
  return [ ...new Set(names) ]
}

function addMethodNames (_names) {
  names.push(..._names);
}

// Map function
function map (array, block) {
  var i;
  var il = array.length;
  var result = [];

  for (i = 0; i < il; i++) {
    result.push(block(array[i]));
  }

  return result
}

// Degrees to radians
function radians (d) {
  return d % 360 * Math.PI / 180
}

// Convert dash-separated-string to camelCase
function camelCase (s) {
  return s.toLowerCase().replace(/-(.)/g, function (m, g) {
    return g.toUpperCase()
  })
}

// Convert camel cased string to string seperated
function unCamelCase (s) {
  return s.replace(/([A-Z])/g, function (m, g) {
    return '-' + g.toLowerCase()
  })
}

// Capitalize first letter of a string
function capitalize (s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Calculate proportional width and height values when necessary
function proportionalSize (element, width, height, box) {
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
  }
}

function getOrigin (o, element) {
  // Allow origin or around as the names
  const origin = o.origin; // o.around == null ? o.origin : o.around
  let ox, oy;

  // Allow the user to pass a string to rotate around a given point
  if (typeof origin === 'string' || origin == null) {
    // Get the bounding box of the element with no transformations applied
    const string = (origin || 'center').toLowerCase().trim();
    const { height, width, x, y } = element.bbox();

    // Calculate the transformed x and y coordinates
    const bx = string.includes('left') ? x
      : string.includes('right') ? x + width
      : x + width / 2;
    const by = string.includes('top') ? y
      : string.includes('bottom') ? y + height
      : y + height / 2;

    // Set the bounds eg : "bottom-left", "Top right", "middle" etc...
    ox = o.ox != null ? o.ox : bx;
    oy = o.oy != null ? o.oy : by;
  } else {
    ox = origin[0];
    oy = origin[1];
  }

  // Return the origin as it is if it wasn't a string
  return [ ox, oy ]
}

// Default namespaces
const ns = 'http://www.w3.org/2000/svg';
const xmlns = 'http://www.w3.org/2000/xmlns/';
const xlink = 'http://www.w3.org/1999/xlink';
const svgjs = 'http://svgjs.com/svgjs';

const globals = {
  window: typeof window === 'undefined' ? null : window,
  document: typeof document === 'undefined' ? null : document
};

class Base {
  // constructor (node/*, {extensions = []} */) {
  //   // this.tags = []
  //   //
  //   // for (let extension of extensions) {
  //   //   extension.setup.call(this, node)
  //   //   this.tags.push(extension.name)
  //   // }
  // }
}

const elements = {};
const root = '___SYMBOL___ROOT___';

// Method for element creation
function create (name) {
  // create element
  return globals.document.createElementNS(ns, name)
}

function makeInstance (element) {
  if (element instanceof Base) return element

  if (typeof element === 'object') {
    return adopter(element)
  }

  if (element == null) {
    return new elements[root]()
  }

  if (typeof element === 'string' && element.charAt(0) !== '<') {
    return adopter(globals.document.querySelector(element))
  }

  var node = create('svg');
  node.innerHTML = element;

  // We can use firstChild here because we know,
  // that the first char is < and thus an element
  element = adopter(node.firstChild);

  return element
}

function nodeOrNew (name, node) {
  return node instanceof globals.window.Node ? node : create(name)
}

// Adopt existing svg elements
function adopt (node) {
  // check for presence of node
  if (!node) return null

  // make sure a node isn't already adopted
  if (node.instance instanceof Base) return node.instance

  // initialize variables
  var className = capitalize(node.nodeName || 'Dom');

  // Make sure that gradients are adopted correctly
  if (className === 'LinearGradient' || className === 'RadialGradient') {
    className = 'Gradient';

  // Fallback to Dom if element is not known
  } else if (!elements[className]) {
    className = 'Dom';
  }

  return new elements[className](node)
}

let adopter = adopt;

function register (element, name = element.name, asRoot = false) {
  elements[name] = element;
  if (asRoot) elements[root] = element;

  addMethodNames(Object.getOwnPropertyNames(element.prototype));

  return element
}

function getClass (name) {
  return elements[name]
}

// Element id sequence
let did = 1000;

// Get next named element id
function eid (name) {
  return 'Svgjs' + capitalize(name) + (did++)
}

// Deep new id assignment
function assignNewId (node) {
  // do the same for SVG child nodes as well
  for (var i = node.children.length - 1; i >= 0; i--) {
    assignNewId(node.children[i]);
  }

  if (node.id) {
    return adopt(node).id(eid(node.nodeName))
  }

  return adopt(node)
}

// Method for extending objects
function extend (modules, methods, attrCheck) {
  var key, i;

  modules = Array.isArray(modules) ? modules : [ modules ];

  for (i = modules.length - 1; i >= 0; i--) {
    for (key in methods) {
      let method = methods[key];
      if (attrCheck) {
        method = wrapWithAttrCheck(methods[key]);
      }
      modules[i].prototype[key] = method;
    }
  }
}

// export function extendWithAttrCheck (...args) {
//   extend(...args, true)
// }

function wrapWithAttrCheck (fn) {
  return function (...args) {
    const o = args[args.length - 1];

    if (o && o.constructor === Object && !(o instanceof Array)) {
      return fn.apply(this, args.slice(0, -1)).attr(o)
    } else {
      return fn.apply(this, args)
    }
  }
}

// Get all siblings, including myself
function siblings () {
  return this.parent().children()
}

// Get the curent position siblings
function position () {
  return this.parent().index(this)
}

// Get the next element (will return null if there is none)
function next () {
  return this.siblings()[this.position() + 1]
}

// Get the next element (will return null if there is none)
function prev () {
  return this.siblings()[this.position() - 1]
}

// Send given element one step forward
function forward () {
  var i = this.position() + 1;
  var p = this.parent();

  // move node one step forward
  p.removeElement(this).add(this, i);

  // make sure defs node is always at the top
  if (typeof p.isRoot === 'function' && p.isRoot()) {
    p.node.appendChild(p.defs().node);
  }

  return this
}

// Send given element one step backward
function backward () {
  var i = this.position();

  if (i > 0) {
    this.parent().removeElement(this).add(this, i - 1);
  }

  return this
}

// Send given element all the way to the front
function front () {
  var p = this.parent();

  // Move node forward
  p.node.appendChild(this.node);

  // Make sure defs node is always at the top
  if (typeof p.isRoot === 'function' && p.isRoot()) {
    p.node.appendChild(p.defs().node);
  }

  return this
}

// Send given element all the way to the back
function back () {
  if (this.position() > 0) {
    this.parent().removeElement(this).add(this, 0);
  }

  return this
}

// Inserts a given element before the targeted element
function before (element) {
  element = makeInstance(element);
  element.remove();

  var i = this.position();

  this.parent().add(element, i);

  return this
}

// Inserts a given element after the targeted element
function after (element) {
  element = makeInstance(element);
  element.remove();

  var i = this.position();

  this.parent().add(element, i + 1);

  return this
}

function insertBefore (element) {
  element = makeInstance(element);
  element.before(this);
  return this
}

function insertAfter (element) {
  element = makeInstance(element);
  element.after(this);
  return this
}

registerMethods('Dom', {
  siblings,
  position,
  next,
  prev,
  forward,
  backward,
  front,
  back,
  before,
  after,
  insertBefore,
  insertAfter
});

// Parse unit value
const numberAndUnit = /^([+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?)([a-z%]*)$/i;

// Parse hex value
const hex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

// Parse rgb value
const rgb = /rgb\((\d+),(\d+),(\d+)\)/;

// Parse reference id
const reference = /(#[a-z0-9\-_]+)/i;

// splits a transformation chain
const transforms = /\)\s*,?\s*/;

// Whitespace
const whitespace = /\s/g;

// Test hex value
const isHex = /^#[a-f0-9]{3,6}$/i;

// Test rgb value
const isRgb = /^rgb\(/;

// Test for blank string
const isBlank = /^(\s+)?$/;

// Test for numeric string
const isNumber = /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;

// Test for image url
const isImage = /\.(jpg|jpeg|png|gif|svg)(\?[^=]+.*)?/i;

// split at whitespace and comma
const delimiter = /[\s,]+/;

// The following regex are used to parse the d attribute of a path

// Matches all hyphens which are not after an exponent
const hyphen = /([^e])-/gi;

// Replaces and tests for all path letters
const pathLetters = /[MLHVCSQTAZ]/gi;

// yes we need this one, too
const isPathLetter = /[MLHVCSQTAZ]/i;

// matches 0.154.23.45
const numbersWithDots = /((\d?\.\d+(?:e[+-]?\d+)?)((?:\.\d+(?:e[+-]?\d+)?)+))+/gi;

// matches .
const dots = /\./g;

// Return array of classes on the node
function classes () {
  var attr = this.attr('class');
  return attr == null ? [] : attr.trim().split(delimiter)
}

// Return true if class exists on the node, false otherwise
function hasClass (name) {
  return this.classes().indexOf(name) !== -1
}

// Add class to the node
function addClass (name) {
  if (!this.hasClass(name)) {
    var array = this.classes();
    array.push(name);
    this.attr('class', array.join(' '));
  }

  return this
}

// Remove class from the node
function removeClass (name) {
  if (this.hasClass(name)) {
    this.attr('class', this.classes().filter(function (c) {
      return c !== name
    }).join(' '));
  }

  return this
}

// Toggle the presence of a class on the node
function toggleClass (name) {
  return this.hasClass(name) ? this.removeClass(name) : this.addClass(name)
}

registerMethods('Dom', {
  classes, hasClass, addClass, removeClass, toggleClass
});

// Dynamic style generator
function css (style, val) {
  const ret = {};
  if (arguments.length === 0) {
    // get full style as object
    this.node.style.cssText.split(/\s*;\s*/)
      .filter(function (el) {
        return !!el.length
      })
      .forEach(function (el) {
        const t = el.split(/\s*:\s*/);
        ret[t[0]] = t[1];
      });
    return ret
  }

  if (arguments.length < 2) {
    // get style properties in the array
    if (Array.isArray(style)) {
      for (const name of style) {
        const cased = camelCase(name);
        ret[cased] = this.node.style[cased];
      }
      return ret
    }

    // get style for property
    if (typeof style === 'string') {
      return this.node.style[camelCase(style)]
    }

    // set styles in object
    if (typeof style === 'object') {
      for (const name in style) {
        // set empty string if null/undefined/'' was given
        this.node.style[camelCase(name)]
          = (style[name] == null || isBlank.test(style[name])) ? '' : style[name];
      }
    }
  }

  // set style for property
  if (arguments.length === 2) {
    this.node.style[camelCase(style)]
      = (val == null || isBlank.test(val)) ? '' : val;
  }

  return this
}

// Show element
function show () {
  return this.css('display', '')
}

// Hide element
function hide () {
  return this.css('display', 'none')
}

// Is element visible?
function visible () {
  return this.css('display') !== 'none'
}

registerMethods('Dom', {
  css, show, hide, visible
});

// Store data values on svg nodes
function data (a, v, r) {
  if (typeof a === 'object') {
    for (v in a) {
      this.data(v, a[v]);
    }
  } else if (arguments.length < 2) {
    try {
      return JSON.parse(this.attr('data-' + a))
    } catch (e) {
      return this.attr('data-' + a)
    }
  } else {
    this.attr('data-' + a,
      v === null ? null
      : r === true || typeof v === 'string' || typeof v === 'number' ? v
      : JSON.stringify(v)
    );
  }

  return this
}

registerMethods('Dom', { data });

// Remember arbitrary data
function remember (k, v) {
  // remember every item in an object individually
  if (typeof arguments[0] === 'object') {
    for (var key in k) {
      this.remember(key, k[key]);
    }
  } else if (arguments.length === 1) {
    // retrieve memory
    return this.memory()[k]
  } else {
    // store memory
    this.memory()[k] = v;
  }

  return this
}

// Erase a given memory
function forget () {
  if (arguments.length === 0) {
    this._memory = {};
  } else {
    for (var i = arguments.length - 1; i >= 0; i--) {
      delete this.memory()[arguments[i]];
    }
  }
  return this
}

// This triggers creation of a new hidden class which is not performant
// However, this function is not rarely used so it will not happen frequently
// Return local memory object
function memory () {
  return (this._memory = this._memory || {})
}

registerMethods('Dom', { remember, forget, memory });

let listenerId = 0;
const windowEvents = {};

function getEvents (instance) {
  let n = instance.getEventHolder();

  // We dont want to save events in global space
  if (n === globals.window) n = windowEvents;
  if (!n.events) n.events = {};
  return n.events
}

function getEventTarget (instance) {
  return instance.getEventTarget()
}

function clearEvents (instance) {
  const n = instance.getEventHolder();
  if (n.events) n.events = {};
}

// Add event binder in the SVG namespace
function on (node, events, listener, binding, options) {
  var l = listener.bind(binding || node);
  var instance = makeInstance(node);
  var bag = getEvents(instance);
  var n = getEventTarget(instance);

  // events can be an array of events or a string of events
  events = Array.isArray(events) ? events : events.split(delimiter);

  // add id to listener
  if (!listener._svgjsListenerId) {
    listener._svgjsListenerId = ++listenerId;
  }

  events.forEach(function (event) {
    var ev = event.split('.')[0];
    var ns = event.split('.')[1] || '*';

    // ensure valid object
    bag[ev] = bag[ev] || {};
    bag[ev][ns] = bag[ev][ns] || {};

    // reference listener
    bag[ev][ns][listener._svgjsListenerId] = l;

    // add listener
    n.addEventListener(ev, l, options || false);
  });
}

// Add event unbinder in the SVG namespace
function off (node, events, listener, options) {
  var instance = makeInstance(node);
  var bag = getEvents(instance);
  var n = getEventTarget(instance);

  // listener can be a function or a number
  if (typeof listener === 'function') {
    listener = listener._svgjsListenerId;
    if (!listener) return
  }

  // events can be an array of events or a string or undefined
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
          off(n, [ ev, ns ].join('.'), l);
        }

        delete bag[ev][ns];
      }
    } else if (ns) {
      // remove all listeners for a specific namespace
      for (event in bag) {
        for (namespace in bag[event]) {
          if (ns === namespace) {
            off(n, [ event, ns ].join('.'));
          }
        }
      }
    } else if (ev) {
      // remove all listeners for the event
      if (bag[ev]) {
        for (namespace in bag[ev]) {
          off(n, [ ev, namespace ].join('.'));
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

function dispatch (node, event, data) {
  var n = getEventTarget(node);

  // Dispatch event
  if (event instanceof globals.window.Event) {
    n.dispatchEvent(event);
  } else {
    event = new globals.window.CustomEvent(event, { detail: data, cancelable: true });
    n.dispatchEvent(event);
  }
  return event
}

function sixDigitHex (hex) {
  return hex.length === 4
    ? [ '#',
      hex.substring(1, 2), hex.substring(1, 2),
      hex.substring(2, 3), hex.substring(2, 3),
      hex.substring(3, 4), hex.substring(3, 4)
    ].join('')
    : hex
}

function componentHex (component) {
  const integer = Math.round(component);
  const bounded = Math.max(0, Math.min(255, integer));
  const hex = bounded.toString(16);
  return hex.length === 1 ? '0' + hex : hex
}

function is (object, space) {
  for (let i = space.length; i--;) {
    if (object[space[i]] == null) {
      return false
    }
  }
  return true
}

function getParameters (a, b) {
  const params = is(a, 'rgb') ? { _a: a.r, _b: a.g, _c: a.b, space: 'rgb' }
    : is(a, 'xyz') ? { _a: a.x, _b: a.y, _c: a.z, _d: 0, space: 'xyz' }
    : is(a, 'hsl') ? { _a: a.h, _b: a.s, _c: a.l, _d: 0, space: 'hsl' }
    : is(a, 'lab') ? { _a: a.l, _b: a.a, _c: a.b, _d: 0, space: 'lab' }
    : is(a, 'lch') ? { _a: a.l, _b: a.c, _c: a.h, _d: 0, space: 'lch' }
    : is(a, 'cmyk') ? { _a: a.c, _b: a.m, _c: a.y, _d: a.k, space: 'cmyk' }
    : { _a: 0, _b: 0, _c: 0, space: 'rgb' };

  params.space = b || params.space;
  return params
}

function cieSpace (space) {
  if (space === 'lab' || space === 'xyz' || space === 'lch') {
    return true
  } else {
    return false
  }
}

function hueToRgb (p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
  return p
}

class Color {
  constructor (...inputs) {
    this.init(...inputs);
  }

  init (a = 0, b = 0, c = 0, d = 0, space = 'rgb') {
    // This catches the case when a falsy value is passed like ''
    a = !a ? 0 : a;

    // Reset all values in case the init function is rerun with new color space
    if (this.space) {
      for (const component in this.space) {
        delete this[this.space[component]];
      }
    }

    if (typeof a === 'number') {
      // Allow for the case that we don't need d...
      space = typeof d === 'string' ? d : space;
      d = typeof d === 'string' ? 0 : d;

      // Assign the values straight to the color
      Object.assign(this, { _a: a, _b: b, _c: c, _d: d, space });
    // If the user gave us an array, make the color from it
    } else if (a instanceof Array) {
      this.space = b || (typeof a[3] === 'string' ? a[3] : a[4]) || 'rgb';
      Object.assign(this, { _a: a[0], _b: a[1], _c: a[2], _d: a[3] || 0 });
    } else if (a instanceof Object) {
      // Set the object up and assign its values directly
      const values = getParameters(a, b);
      Object.assign(this, values);
    } else if (typeof a === 'string') {
      if (isRgb.test(a)) {
        const noWhitespace = a.replace(whitespace, '');
        const [ _a, _b, _c ] = rgb.exec(noWhitespace)
          .slice(1, 4).map(v => parseInt(v));
        Object.assign(this, { _a, _b, _c, _d: 0, space: 'rgb' });
      } else if (isHex.test(a)) {
        const hexParse = v => parseInt(v, 16);
        const [ , _a, _b, _c ] = hex.exec(sixDigitHex(a)).map(hexParse);
        Object.assign(this, { _a, _b, _c, _d: 0, space: 'rgb' });
      } else throw Error('Unsupported string format, can\'t construct Color')
    }

    // Now add the components as a convenience
    const { _a, _b, _c, _d } = this;
    const components = this.space === 'rgb' ? { r: _a, g: _b, b: _c }
      : this.space === 'xyz' ? { x: _a, y: _b, z: _c }
      : this.space === 'hsl' ? { h: _a, s: _b, l: _c }
      : this.space === 'lab' ? { l: _a, a: _b, b: _c }
      : this.space === 'lch' ? { l: _a, c: _b, h: _c }
      : this.space === 'cmyk' ? { c: _a, m: _b, y: _c, k: _d }
      : {};
    Object.assign(this, components);
  }

  /*
  Conversion Methods
  */

  rgb () {
    if (this.space === 'rgb') {
      return this
    } else if (cieSpace(this.space)) {
      // Convert to the xyz color space
      let { x, y, z } = this;
      if (this.space === 'lab' || this.space === 'lch') {
        // Get the values in the lab space
        let { l, a, b } = this;
        if (this.space === 'lch') {
          const { c, h } = this;
          const dToR = Math.PI / 180;
          a = c * Math.cos(dToR * h);
          b = c * Math.sin(dToR * h);
        }

        // Undo the nonlinear function
        const yL = (l + 16) / 116;
        const xL = a / 500 + yL;
        const zL = yL - b / 200;

        // Get the xyz values
        const ct = 16 / 116;
        const mx = 0.008856;
        const nm = 7.787;
        x = 0.95047 * ((xL ** 3 > mx) ? xL ** 3 : (xL - ct) / nm);
        y = 1.00000 * ((yL ** 3 > mx) ? yL ** 3 : (yL - ct) / nm);
        z = 1.08883 * ((zL ** 3 > mx) ? zL ** 3 : (zL - ct) / nm);
      }

      // Convert xyz to unbounded rgb values
      const rU = x * 3.2406 + y * -1.5372 + z * -0.4986;
      const gU = x * -0.9689 + y * 1.8758 + z * 0.0415;
      const bU = x * 0.0557 + y * -0.2040 + z * 1.0570;

      // Convert the values to true rgb values
      const pow = Math.pow;
      const bd = 0.0031308;
      const r = (rU > bd) ? (1.055 * pow(rU, 1 / 2.4) - 0.055) : 12.92 * rU;
      const g = (gU > bd) ? (1.055 * pow(gU, 1 / 2.4) - 0.055) : 12.92 * gU;
      const b = (bU > bd) ? (1.055 * pow(bU, 1 / 2.4) - 0.055) : 12.92 * bU;

      // Make and return the color
      const color = new Color(255 * r, 255 * g, 255 * b);
      return color
    } else if (this.space === 'hsl') {
      // https://bgrins.github.io/TinyColor/docs/tinycolor.html
      // Get the current hsl values
      let { h, s, l } = this;
      h /= 360;
      s /= 100;
      l /= 100;

      // If we are grey, then just make the color directly
      if (s === 0) {
        l *= 255;
        const color = new Color(l, l, l);
        return color
      }

      // TODO I have no idea what this does :D If you figure it out, tell me!
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      // Get the rgb values
      const r = 255 * hueToRgb(p, q, h + 1 / 3);
      const g = 255 * hueToRgb(p, q, h);
      const b = 255 * hueToRgb(p, q, h - 1 / 3);

      // Make a new color
      const color = new Color(r, g, b);
      return color
    } else if (this.space === 'cmyk') {
      // https://gist.github.com/felipesabino/5066336
      // Get the normalised cmyk values
      const { c, m, y, k } = this;

      // Get the rgb values
      const r = 255 * (1 - Math.min(1, c * (1 - k) + k));
      const g = 255 * (1 - Math.min(1, m * (1 - k) + k));
      const b = 255 * (1 - Math.min(1, y * (1 - k) + k));

      // Form the color and return it
      const color = new Color(r, g, b);
      return color
    } else {
      return this
    }
  }

  lab () {
    // Get the xyz color
    const { x, y, z } = this.xyz();

    // Get the lab components
    const l = (116 * y) - 16;
    const a = 500 * (x - y);
    const b = 200 * (y - z);

    // Construct and return a new color
    const color = new Color(l, a, b, 'lab');
    return color
  }

  xyz () {

    // Normalise the red, green and blue values
    const { _a: r255, _b: g255, _c: b255 } = this.rgb();
    const [ r, g, b ] = [ r255, g255, b255 ].map(v => v / 255);

    // Convert to the lab rgb space
    const rL = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    const gL = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    const bL = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    // Convert to the xyz color space without bounding the values
    const xU = (rL * 0.4124 + gL * 0.3576 + bL * 0.1805) / 0.95047;
    const yU = (rL * 0.2126 + gL * 0.7152 + bL * 0.0722) / 1.00000;
    const zU = (rL * 0.0193 + gL * 0.1192 + bL * 0.9505) / 1.08883;

    // Get the proper xyz values by applying the bounding
    const x = (xU > 0.008856) ? Math.pow(xU, 1 / 3) : (7.787 * xU) + 16 / 116;
    const y = (yU > 0.008856) ? Math.pow(yU, 1 / 3) : (7.787 * yU) + 16 / 116;
    const z = (zU > 0.008856) ? Math.pow(zU, 1 / 3) : (7.787 * zU) + 16 / 116;

    // Make and return the color
    const color = new Color(x, y, z, 'xyz');
    return color
  }

  lch () {

    // Get the lab color directly
    const { l, a, b } = this.lab();

    // Get the chromaticity and the hue using polar coordinates
    const c = Math.sqrt(a ** 2 + b ** 2);
    let h = 180 * Math.atan2(b, a) / Math.PI;
    if (h < 0) {
      h *= -1;
      h = 360 - h;
    }

    // Make a new color and return it
    const color = new Color(l, c, h, 'lch');
    return color
  }

  hsl () {

    // Get the rgb values
    const { _a, _b, _c } = this.rgb();
    const [ r, g, b ] = [ _a, _b, _c ].map(v => v / 255);

    // Find the maximum and minimum values to get the lightness
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    // If the r, g, v values are identical then we are grey
    const isGrey = max === min;

    // Calculate the hue and saturation
    const delta = max - min;
    const s = isGrey ? 0
      : l > 0.5 ? delta / (2 - max - min)
      : delta / (max + min);
    const h = isGrey ? 0
      : max === r ? ((g - b) / delta + (g < b ? 6 : 0)) / 6
      : max === g ? ((b - r) / delta + 2) / 6
      : max === b ? ((r - g) / delta + 4) / 6
      : 0;

    // Construct and return the new color
    const color = new Color(360 * h, 100 * s, 100 * l, 'hsl');
    return color
  }

  cmyk () {

    // Get the rgb values for the current color
    const { _a, _b, _c } = this.rgb();
    const [ r, g, b ] = [ _a, _b, _c ].map(v => v / 255);

    // Get the cmyk values in an unbounded format
    const k = Math.min(1 - r, 1 - g, 1 - b);

    if (k === 1) {
      // Catch the black case
      return new Color(0, 0, 0, 1, 'cmyk')
    }

    const c = (1 - r - k) / (1 - k);
    const m = (1 - g - k) / (1 - k);
    const y = (1 - b - k) / (1 - k);

    // Construct the new color
    const color = new Color(c, m, y, k, 'cmyk');
    return color
  }

  /*
  Input and Output methods
  */

  _clamped () {
    const { _a, _b, _c } = this.rgb();
    const { max, min, round } = Math;
    const format = v => max(0, min(round(v), 255));
    return [ _a, _b, _c ].map(format)
  }

  toHex () {
    const [ r, g, b ] = this._clamped().map(componentHex);
    return `#${r}${g}${b}`
  }

  toString () {
    return this.toHex()
  }

  toRgb () {
    const [ rV, gV, bV ] = this._clamped();
    const string = `rgb(${rV},${gV},${bV})`;
    return string
  }

  toArray () {
    const { _a, _b, _c, _d, space } = this;
    return [ _a, _b, _c, _d, space ]
  }

  /*
  Generating random colors
  */

  static random (mode = 'vibrant', t, u) {

    // Get the math modules
    const { random, round, sin, PI: pi } = Math;

    // Run the correct generator
    if (mode === 'vibrant') {

      const l = (81 - 57) * random() + 57;
      const c = (83 - 45) * random() + 45;
      const h = 360 * random();
      const color = new Color(l, c, h, 'lch');
      return color

    } else if (mode === 'sine') {

      t = t == null ? random() : t;
      const r = round(80 * sin(2 * pi * t / 0.5 + 0.01) + 150);
      const g = round(50 * sin(2 * pi * t / 0.5 + 4.6) + 200);
      const b = round(100 * sin(2 * pi * t / 0.5 + 2.3) + 150);
      const color = new Color(r, g, b);
      return color

    } else if (mode === 'pastel') {

      const l = (94 - 86) * random() + 86;
      const c = (26 - 9) * random() + 9;
      const h = 360 * random();
      const color = new Color(l, c, h, 'lch');
      return color

    } else if (mode === 'dark') {

      const l = 10 + 10 * random();
      const c = (125 - 75) * random() + 86;
      const h = 360 * random();
      const color = new Color(l, c, h, 'lch');
      return color

    } else if (mode === 'rgb') {

      const r = 255 * random();
      const g = 255 * random();
      const b = 255 * random();
      const color = new Color(r, g, b);
      return color

    } else if (mode === 'lab') {

      const l = 100 * random();
      const a = 256 * random() - 128;
      const b = 256 * random() - 128;
      const color = new Color(l, a, b, 'lab');
      return color

    } else if (mode === 'grey') {

      const grey = 255 * random();
      const color = new Color(grey, grey, grey);
      return color

    }
  }

  /*
  Constructing colors
  */

  // Test if given value is a color string
  static test (color) {
    return (typeof color === 'string')
      && (isHex.test(color) || isRgb.test(color))
  }

  // Test if given value is an rgb object
  static isRgb (color) {
    return color && typeof color.r === 'number'
      && typeof color.g === 'number'
      && typeof color.b === 'number'
  }

  // Test if given value is a color
  static isColor (color) {
    return color && (
      color instanceof Color
      || this.isRgb(color)
      || this.test(color)
    )
  }
}

class Point$1 {
  // Initialize
  constructor (...args) {
    this.init(...args);
  }

  init (x, y) {
    const base = { x: 0, y: 0 };

    // ensure source as object
    const source = Array.isArray(x) ? { x: x[0], y: x[1] }
      : typeof x === 'object' ? { x: x.x, y: x.y }
      : { x: x, y: y };

    // merge source
    this.x = source.x == null ? base.x : source.x;
    this.y = source.y == null ? base.y : source.y;

    return this
  }

  // Clone point
  clone () {
    return new Point$1(this)
  }

  transform (m) {
    return this.clone().transformO(m)
  }

  // Transform point with matrix
  transformO (m) {
    if (!Matrix.isMatrixLike(m)) {
      m = new Matrix(m);
    }

    const { x, y } = this;

    // Perform the matrix multiplication
    this.x = m.a * x + m.c * y + m.e;
    this.y = m.b * x + m.d * y + m.f;

    return this
  }

  toArray () {
    return [ this.x, this.y ]
  }
}

function point (x, y) {
  return new Point$1(x, y).transform(this.screenCTM().inverse())
}

function closeEnough (a, b, threshold) {
  return Math.abs(b - a) < (threshold || 1e-6)
}

class Matrix {
  constructor (...args) {
    this.init(...args);
  }

  // Initialize
  init (source) {
    var base = Matrix.fromArray([ 1, 0, 0, 1, 0, 0 ]);

    // ensure source as object
    source = source instanceof Element ? source.matrixify()
      : typeof source === 'string' ? Matrix.fromArray(source.split(delimiter).map(parseFloat))
      : Array.isArray(source) ? Matrix.fromArray(source)
      : (typeof source === 'object' && Matrix.isMatrixLike(source)) ? source
      : (typeof source === 'object') ? new Matrix().transform(source)
      : arguments.length === 6 ? Matrix.fromArray([].slice.call(arguments))
      : base;

    // Merge the source matrix with the base matrix
    this.a = source.a != null ? source.a : base.a;
    this.b = source.b != null ? source.b : base.b;
    this.c = source.c != null ? source.c : base.c;
    this.d = source.d != null ? source.d : base.d;
    this.e = source.e != null ? source.e : base.e;
    this.f = source.f != null ? source.f : base.f;

    return this
  }

  // Clones this matrix
  clone () {
    return new Matrix(this)
  }

  // Transform a matrix into another matrix by manipulating the space
  transform (o) {
    // Check if o is a matrix and then left multiply it directly
    if (Matrix.isMatrixLike(o)) {
      var matrix = new Matrix(o);
      return matrix.multiplyO(this)
    }

    // Get the proposed transformations and the current transformations
    var t = Matrix.formatTransforms(o);
    var current = this;
    const { x: ox, y: oy } = new Point$1(t.ox, t.oy).transform(current);

    // Construct the resulting matrix
    var transformer = new Matrix()
      .translateO(t.rx, t.ry)
      .lmultiplyO(current)
      .translateO(-ox, -oy)
      .scaleO(t.scaleX, t.scaleY)
      .skewO(t.skewX, t.skewY)
      .shearO(t.shear)
      .rotateO(t.theta)
      .translateO(ox, oy);

    // If we want the origin at a particular place, we force it there
    if (isFinite(t.px) || isFinite(t.py)) {
      const origin = new Point$1(ox, oy).transform(transformer);
      // TODO: Replace t.px with isFinite(t.px)
      const dx = t.px ? t.px - origin.x : 0;
      const dy = t.py ? t.py - origin.y : 0;
      transformer.translateO(dx, dy);
    }

    // Translate now after positioning
    transformer.translateO(t.tx, t.ty);
    return transformer
  }

  // Applies a matrix defined by its affine parameters
  compose (o) {
    if (o.origin) {
      o.originX = o.origin[0];
      o.originY = o.origin[1];
    }
    // Get the parameters
    var ox = o.originX || 0;
    var oy = o.originY || 0;
    var sx = o.scaleX || 1;
    var sy = o.scaleY || 1;
    var lam = o.shear || 0;
    var theta = o.rotate || 0;
    var tx = o.translateX || 0;
    var ty = o.translateY || 0;

    // Apply the standard matrix
    var result = new Matrix()
      .translateO(-ox, -oy)
      .scaleO(sx, sy)
      .shearO(lam)
      .rotateO(theta)
      .translateO(tx, ty)
      .lmultiplyO(this)
      .translateO(ox, oy);
    return result
  }

  // Decomposes this matrix into its affine parameters
  decompose (cx = 0, cy = 0) {
    // Get the parameters from the matrix
    var a = this.a;
    var b = this.b;
    var c = this.c;
    var d = this.d;
    var e = this.e;
    var f = this.f;

    // Figure out if the winding direction is clockwise or counterclockwise
    var determinant = a * d - b * c;
    var ccw = determinant > 0 ? 1 : -1;

    // Since we only shear in x, we can use the x basis to get the x scale
    // and the rotation of the resulting matrix
    var sx = ccw * Math.sqrt(a * a + b * b);
    var thetaRad = Math.atan2(ccw * b, ccw * a);
    var theta = 180 / Math.PI * thetaRad;
    var ct = Math.cos(thetaRad);
    var st = Math.sin(thetaRad);

    // We can then solve the y basis vector simultaneously to get the other
    // two affine parameters directly from these parameters
    var lam = (a * c + b * d) / determinant;
    var sy = ((c * sx) / (lam * a - b)) || ((d * sx) / (lam * b + a));

    // Use the translations
    const tx = e - cx + cx * ct * sx + cy * (lam * ct * sx - st * sy);
    const ty = f - cy + cx * st * sx + cy * (lam * st * sx + ct * sy);

    // Construct the decomposition and return it
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
    }
  }

  // Left multiplies by the given matrix
  multiply (matrix) {
    return this.clone().multiplyO(matrix)
  }

  multiplyO (matrix) {
    // Get the matrices
    var l = this;
    var r = matrix instanceof Matrix
      ? matrix
      : new Matrix(matrix);

    return Matrix.matrixMultiply(l, r, this)
  }

  lmultiply (matrix) {
    return this.clone().lmultiplyO(matrix)
  }

  lmultiplyO (matrix) {
    var r = this;
    var l = matrix instanceof Matrix
      ? matrix
      : new Matrix(matrix);

    return Matrix.matrixMultiply(l, r, this)
  }

  // Inverses matrix
  inverseO () {
    // Get the current parameters out of the matrix
    var a = this.a;
    var b = this.b;
    var c = this.c;
    var d = this.d;
    var e = this.e;
    var f = this.f;

    // Invert the 2x2 matrix in the top left
    var det = a * d - b * c;
    if (!det) throw new Error('Cannot invert ' + this)

    // Calculate the top 2x2 matrix
    var na = d / det;
    var nb = -b / det;
    var nc = -c / det;
    var nd = a / det;

    // Apply the inverted matrix to the top right
    var ne = -(na * e + nc * f);
    var nf = -(nb * e + nd * f);

    // Construct the inverted matrix
    this.a = na;
    this.b = nb;
    this.c = nc;
    this.d = nd;
    this.e = ne;
    this.f = nf;

    return this
  }

  inverse () {
    return this.clone().inverseO()
  }

  // Translate matrix
  translate (x, y) {
    return this.clone().translateO(x, y)
  }

  translateO (x, y) {
    this.e += x || 0;
    this.f += y || 0;
    return this
  }

  // Scale matrix
  scale (x, y, cx, cy) {
    return this.clone().scaleO(...arguments)
  }

  scaleO (x, y = x, cx = 0, cy = 0) {
    // Support uniform scaling
    if (arguments.length === 3) {
      cy = cx;
      cx = y;
      y = x;
    }

    const { a, b, c, d, e, f } = this;

    this.a = a * x;
    this.b = b * y;
    this.c = c * x;
    this.d = d * y;
    this.e = e * x - cx * x + cx;
    this.f = f * y - cy * y + cy;

    return this
  }

  // Rotate matrix
  rotate (r, cx, cy) {
    return this.clone().rotateO(r, cx, cy)
  }

  rotateO (r, cx = 0, cy = 0) {
    // Convert degrees to radians
    r = radians(r);

    const cos = Math.cos(r);
    const sin = Math.sin(r);

    const { a, b, c, d, e, f } = this;

    this.a = a * cos - b * sin;
    this.b = b * cos + a * sin;
    this.c = c * cos - d * sin;
    this.d = d * cos + c * sin;
    this.e = e * cos - f * sin + cy * sin - cx * cos + cx;
    this.f = f * cos + e * sin - cx * sin - cy * cos + cy;

    return this
  }

  // Flip matrix on x or y, at a given offset
  flip (axis, around) {
    return this.clone().flipO(axis, around)
  }

  flipO (axis, around) {
    return axis === 'x' ? this.scaleO(-1, 1, around, 0)
      : axis === 'y' ? this.scaleO(1, -1, 0, around)
      : this.scaleO(-1, -1, axis, around || axis) // Define an x, y flip point
  }

  // Shear matrix
  shear (a, cx, cy) {
    return this.clone().shearO(a, cx, cy)
  }

  shearO (lx, cx = 0, cy = 0) {
    const { a, b, c, d, e, f } = this;

    this.a = a + b * lx;
    this.c = c + d * lx;
    this.e = e + f * lx - cy * lx;

    return this
  }

  // Skew Matrix
  skew (x, y, cx, cy) {
    return this.clone().skewO(...arguments)
  }

  skewO (x, y = x, cx = 0, cy = 0) {
    // support uniformal skew
    if (arguments.length === 3) {
      cy = cx;
      cx = y;
      y = x;
    }

    // Convert degrees to radians
    x = radians(x);
    y = radians(y);

    const lx = Math.tan(x);
    const ly = Math.tan(y);

    const { a, b, c, d, e, f } = this;

    this.a = a + b * lx;
    this.b = b + a * ly;
    this.c = c + d * lx;
    this.d = d + c * ly;
    this.e = e + f * lx - cy * lx;
    this.f = f + e * ly - cx * ly;

    return this
  }

  // SkewX
  skewX (x, cx, cy) {
    return this.skew(x, 0, cx, cy)
  }

  skewXO (x, cx, cy) {
    return this.skewO(x, 0, cx, cy)
  }

  // SkewY
  skewY (y, cx, cy) {
    return this.skew(0, y, cx, cy)
  }

  skewYO (y, cx, cy) {
    return this.skewO(0, y, cx, cy)
  }

  // Transform around a center point
  aroundO (cx, cy, matrix) {
    var dx = cx || 0;
    var dy = cy || 0;
    return this.translateO(-dx, -dy).lmultiplyO(matrix).translateO(dx, dy)
  }

  around (cx, cy, matrix) {
    return this.clone().aroundO(cx, cy, matrix)
  }

  // Check if two matrices are equal
  equals (other) {
    var comp = new Matrix(other);
    return closeEnough(this.a, comp.a) && closeEnough(this.b, comp.b)
      && closeEnough(this.c, comp.c) && closeEnough(this.d, comp.d)
      && closeEnough(this.e, comp.e) && closeEnough(this.f, comp.f)
  }

  // Convert matrix to string
  toString () {
    return 'matrix(' + this.a + ',' + this.b + ',' + this.c + ',' + this.d + ',' + this.e + ',' + this.f + ')'
  }

  toArray () {
    return [ this.a, this.b, this.c, this.d, this.e, this.f ]
  }

  valueOf () {
    return {
      a: this.a,
      b: this.b,
      c: this.c,
      d: this.d,
      e: this.e,
      f: this.f
    }
  }

  static fromArray (a) {
    return { a: a[0], b: a[1], c: a[2], d: a[3], e: a[4], f: a[5] }
  }

  static isMatrixLike (o) {
    return (
      o.a != null
      || o.b != null
      || o.c != null
      || o.d != null
      || o.e != null
      || o.f != null
    )
  }

  static formatTransforms (o) {
    // Get all of the parameters required to form the matrix
    var flipBoth = o.flip === 'both' || o.flip === true;
    var flipX = o.flip && (flipBoth || o.flip === 'x') ? -1 : 1;
    var flipY = o.flip && (flipBoth || o.flip === 'y') ? -1 : 1;
    var skewX = o.skew && o.skew.length ? o.skew[0]
      : isFinite(o.skew) ? o.skew
      : isFinite(o.skewX) ? o.skewX
      : 0;
    var skewY = o.skew && o.skew.length ? o.skew[1]
      : isFinite(o.skew) ? o.skew
      : isFinite(o.skewY) ? o.skewY
      : 0;
    var scaleX = o.scale && o.scale.length ? o.scale[0] * flipX
      : isFinite(o.scale) ? o.scale * flipX
      : isFinite(o.scaleX) ? o.scaleX * flipX
      : flipX;
    var scaleY = o.scale && o.scale.length ? o.scale[1] * flipY
      : isFinite(o.scale) ? o.scale * flipY
      : isFinite(o.scaleY) ? o.scaleY * flipY
      : flipY;
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
    var ry = relative.y;

    // Populate all of the values
    return {
      scaleX, scaleY, skewX, skewY, shear, theta, rx, ry, tx, ty, ox, oy, px, py
    }
  }

  // left matrix, right matrix, target matrix which is overwritten
  static matrixMultiply (l, r, o) {
    // Work out the product directly
    var a = l.a * r.a + l.c * r.b;
    var b = l.b * r.a + l.d * r.b;
    var c = l.a * r.c + l.c * r.d;
    var d = l.b * r.c + l.d * r.d;
    var e = l.e + l.a * r.e + l.c * r.f;
    var f = l.f + l.b * r.e + l.d * r.f;

    // make sure to use local variables because l/r and o could be the same
    o.a = a;
    o.b = b;
    o.c = c;
    o.d = d;
    o.e = e;
    o.f = f;

    return o
  }
}

function ctm () {
  return new Matrix(this.node.getCTM())
}

function screenCTM () {
  /* https://bugzilla.mozilla.org/show_bug.cgi?id=1344537
     This is needed because FF does not return the transformation matrix
     for the inner coordinate system when getScreenCTM() is called on nested svgs.
     However all other Browsers do that */
  if (typeof this.isRoot === 'function' && !this.isRoot()) {
    var rect = this.rect(1, 1);
    var m = rect.node.getScreenCTM();
    rect.remove();
    return new Matrix(m)
  }
  return new Matrix(this.node.getScreenCTM())
}

register(Matrix, 'Matrix');

function parser () {
  // Reuse cached element if possible
  if (!parser.nodes) {
    const svg = makeInstance().size(2, 0);
    svg.node.style.cssText = [
      'opacity: 0',
      'position: absolute',
      'left: -100%',
      'top: -100%',
      'overflow: hidden'
    ].join(';');

    svg.attr('focusable', 'false');
    svg.attr('aria-hidden', 'true');

    const path = svg.path().node;

    parser.nodes = { svg, path };
  }

  if (!parser.nodes.svg.node.parentNode) {
    const b = globals.document.body || globals.document.documentElement;
    parser.nodes.svg.addTo(b);
  }

  return parser.nodes
}

function isNulledBox (box) {
  return !box.width && !box.height && !box.x && !box.y
}

function domContains (node) {
  return node === globals.document
    || (globals.document.documentElement.contains || function (node) {
      // This is IE - it does not support contains() for top-level SVGs
      while (node.parentNode) {
        node = node.parentNode;
      }
      return node === globals.document
    }).call(globals.document.documentElement, node)
}

class Box {
  constructor (...args) {
    this.init(...args);
  }

  init (source) {
    var base = [ 0, 0, 0, 0 ];
    source = typeof source === 'string' ? source.split(delimiter).map(parseFloat)
      : Array.isArray(source) ? source
      : typeof source === 'object' ? [ source.left != null ? source.left
      : source.x, source.top != null ? source.top : source.y, source.width, source.height ]
      : arguments.length === 4 ? [].slice.call(arguments)
      : base;

    this.x = source[0] || 0;
    this.y = source[1] || 0;
    this.width = this.w = source[2] || 0;
    this.height = this.h = source[3] || 0;

    // Add more bounding box properties
    this.x2 = this.x + this.w;
    this.y2 = this.y + this.h;
    this.cx = this.x + this.w / 2;
    this.cy = this.y + this.h / 2;

    return this
  }

  // Merge rect box with another, return a new instance
  merge (box) {
    const x = Math.min(this.x, box.x);
    const y = Math.min(this.y, box.y);
    const width = Math.max(this.x + this.width, box.x + box.width) - x;
    const height = Math.max(this.y + this.height, box.y + box.height) - y;

    return new Box(x, y, width, height)
  }

  transform (m) {
    if (!(m instanceof Matrix)) {
      m = new Matrix(m);
    }

    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;

    const pts = [
      new Point$1(this.x, this.y),
      new Point$1(this.x2, this.y),
      new Point$1(this.x, this.y2),
      new Point$1(this.x2, this.y2)
    ];

    pts.forEach(function (p) {
      p = p.transform(m);
      xMin = Math.min(xMin, p.x);
      xMax = Math.max(xMax, p.x);
      yMin = Math.min(yMin, p.y);
      yMax = Math.max(yMax, p.y);
    });

    return new Box(
      xMin, yMin,
      xMax - xMin,
      yMax - yMin
    )
  }

  addOffset () {
    // offset by window scroll position, because getBoundingClientRect changes when window is scrolled
    this.x += globals.window.pageXOffset;
    this.y += globals.window.pageYOffset;
    return this
  }

  toString () {
    return this.x + ' ' + this.y + ' ' + this.width + ' ' + this.height
  }

  toArray () {
    return [ this.x, this.y, this.width, this.height ]
  }

  isNulled () {
    return isNulledBox(this)
  }
}

function getBox (cb, retry) {
  let box;

  try {
    box = cb(this.node);

    if (isNulledBox(box) && !domContains(this.node)) {
      throw new Error('Element not in the dom')
    }
  } catch (e) {
    box = retry(this);
  }

  return box
}

function bbox () {
  return new Box(getBox.call(this, (node) => node.getBBox(), (el) => {
    try {
      const clone = el.clone().addTo(parser().svg).show();
      const box = clone.node.getBBox();
      clone.remove();
      return box
    } catch (e) {
      throw new Error('Getting bbox of element "' + el.node.nodeName + '" is not possible. ' + e.toString())
    }
  }))
}

function rbox (el) {
  const box = new Box(getBox.call(this, (node) => node.getBoundingClientRect(), (el) => {
    throw new Error('Getting rbox of element "' + el.node.nodeName + '" is not possible')
  }));
  if (el) return box.transform(el.screenCTM().inverse())
  return box.addOffset()
}

registerMethods({
  viewbox: {
    viewbox (x, y, width, height) {
      // act as getter
      if (x == null) return new Box(this.attr('viewBox'))

      // act as setter
      return this.attr('viewBox', new Box(x, y, width, height))
    },

    zoom (level, point) {
      let width = this.node.clientWidth;
      let height = this.node.clientHeight;
      const v = this.viewbox();

      // Firefox does not support clientHeight and returns 0
      // https://bugzilla.mozilla.org/show_bug.cgi?id=874811
      if (!width && !height) {
        var style = window.getComputedStyle(this.node);
        width = parseFloat(style.getPropertyValue('width'));
        height = parseFloat(style.getPropertyValue('height'));
      }

      const zoomX = width / v.width;
      const zoomY = height / v.height;
      const zoom = Math.min(zoomX, zoomY);

      if (level == null) {
        return zoom
      }

      let zoomAmount = zoom / level;
      if (zoomAmount === Infinity) zoomAmount = Number.MIN_VALUE;

      point = point || new Point$1(width / 2 / zoomX + v.x, height / 2 / zoomY + v.y);

      const box = new Box(v).transform(
        new Matrix({ scale: zoomAmount, origin: point })
      );

      return this.viewbox(box)
    }
  }
});

register(Box, 'Box');

/* eslint no-new-func: "off" */
const subClassArray = (function () {
  try {
    // try es6 subclassing
    return Function('name', 'baseClass', '_constructor', [
      'baseClass = baseClass || Array',
      'return {',
      '  [name]: class extends baseClass {',
      '    constructor (...args) {',
      '      super(...args)',
      '      _constructor && _constructor.apply(this, args)',
      '    }',
      '  }',
      '}[name]'
    ].join('\n'))
  } catch (e) {
    // Use es5 approach
    return (name, baseClass = Array, _constructor) => {
      const Arr = function () {
        baseClass.apply(this, arguments);
        _constructor && _constructor.apply(this, arguments);
      };

      Arr.prototype = Object.create(baseClass.prototype);
      Arr.prototype.constructor = Arr;

      Arr.prototype.map = function (fn) {
        const arr = new Arr();
        arr.push.apply(arr, Array.prototype.map.call(this, fn));
        return arr
      };

      return Arr
    }
  }
})();

const List = subClassArray('List', Array, function (arr = []) {
  // This catches the case, that native map tries to create an array with new Array(1)
  if (typeof arr === 'number') return this
  this.length = 0;
  this.push(...arr);
});

extend(List, {
  each (fnOrMethodName, ...args) {
    if (typeof fnOrMethodName === 'function') {
      return this.map((el) => {
        return fnOrMethodName.call(el, el)
      })
    } else {
      return this.map(el => {
        return el[fnOrMethodName](...args)
      })
    }
  },

  toArray () {
    return Array.prototype.concat.apply([], this)
  }
});

const reserved = [ 'toArray', 'constructor', 'each' ];

List.extend = function (methods) {
  methods = methods.reduce((obj, name) => {
    // Don't overwrite own methods
    if (reserved.includes(name)) return obj

    // Don't add private methods
    if (name[0] === '_') return obj

    // Relay every call to each()
    obj[name] = function (...attrs) {
      return this.each(name, ...attrs)
    };
    return obj
  }, {});

  extend(List, methods);
};

function baseFind (query, parent) {
  return new List(map((parent || globals.document).querySelectorAll(query), function (node) {
    return adopt(node)
  }))
}

// Scoped find method
function find (query) {
  return baseFind(query, this.node)
}

function findOne (query) {
  return adopt(this.node.querySelector(query))
}

class EventTarget extends Base {
  constructor ({ events = {} } = {}) {
    super();
    this.events = events;
  }

  addEventListener () {}

  dispatch (event, data) {
    return dispatch(this, event, data)
  }

  dispatchEvent (event) {
    const bag = this.getEventHolder().events;
    if (!bag) return true

    const events = bag[event.type];

    for (const i in events) {
      for (const j in events[i]) {
        events[i][j](event);
      }
    }

    return !event.defaultPrevented
  }

  // Fire given event
  fire (event, data) {
    this.dispatch(event, data);
    return this
  }

  getEventHolder () {
    return this
  }

  getEventTarget () {
    return this
  }

  // Unbind event from listener
  off (event, listener) {
    off(this, event, listener);
    return this
  }

  // Bind given event to listener
  on (event, listener, binding, options) {
    on(this, event, listener, binding, options);
    return this
  }

  removeEventListener () {}
}

register(EventTarget, 'EventTarget');

function noop () {}

// Default animation values
const timeline = {
  duration: 400,
  ease: '>',
  delay: 0
};

// Default attribute values
const attrs = {

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

const SVGArray = subClassArray('SVGArray', Array, function (arr) {
  this.init(arr);
});

extend(SVGArray, {
  init (arr) {
    // This catches the case, that native map tries to create an array with new Array(1)
    if (typeof arr === 'number') return this
    this.length = 0;
    this.push(...this.parse(arr));
    return this
  },

  toArray () {
    return Array.prototype.concat.apply([], this)
  },

  toString () {
    return this.join(' ')
  },

  // Flattens the array if needed
  valueOf () {
    const ret = [];
    ret.push(...this);
    return ret
  },

  // Parse whitespace separated string
  parse (array = []) {
    // If already is an array, no need to parse it
    if (array instanceof Array) return array

    return array.trim().split(delimiter).map(parseFloat)
  },

  clone () {
    return new this.constructor(this)
  },

  toSet () {
    return new Set(this)
  }
});

// Module for unit convertions
class SVGNumber {
  // Initialize
  constructor (...args) {
    this.init(...args);
  }

  init (value, unit) {
    unit = Array.isArray(value) ? value[1] : unit;
    value = Array.isArray(value) ? value[0] : value;

    // initialize defaults
    this.value = 0;
    this.unit = unit || '';

    // parse value
    if (typeof value === 'number') {
      // ensure a valid numeric value
      this.value = isNaN(value) ? 0 : !isFinite(value) ? (value < 0 ? -3.4e+38 : +3.4e+38) : value;
    } else if (typeof value === 'string') {
      unit = value.match(numberAndUnit);

      if (unit) {
        // make value numeric
        this.value = parseFloat(unit[1]);

        // normalize
        if (unit[5] === '%') {
          this.value /= 100;
        } else if (unit[5] === 's') {
          this.value *= 1000;
        }

        // store unit
        this.unit = unit[5];
      }
    } else {
      if (value instanceof SVGNumber) {
        this.value = value.valueOf();
        this.unit = value.unit;
      }
    }

    return this
  }

  toString () {
    return (this.unit === '%' ? ~~(this.value * 1e8) / 1e6
      : this.unit === 's' ? this.value / 1e3
      : this.value
    ) + this.unit
  }

  toJSON () {
    return this.toString()
  }

  toArray () {
    return [ this.value, this.unit ]
  }

  valueOf () {
    return this.value
  }

  // Add number
  plus (number) {
    number = new SVGNumber(number);
    return new SVGNumber(this + number, this.unit || number.unit)
  }

  // Subtract number
  minus (number) {
    number = new SVGNumber(number);
    return new SVGNumber(this - number, this.unit || number.unit)
  }

  // Multiply number
  times (number) {
    number = new SVGNumber(number);
    return new SVGNumber(this * number, this.unit || number.unit)
  }

  // Divide number
  divide (number) {
    number = new SVGNumber(number);
    return new SVGNumber(this / number, this.unit || number.unit)
  }

  convert (unit) {
    return new SVGNumber(this.value, unit)
  }
}

const hooks = [];
function registerAttrHook (fn) {
  hooks.push(fn);
}

// Set svg element attribute
function attr (attr, val, ns) {
  // act as full getter
  if (attr == null) {
    // get an object of attributes
    attr = {};
    val = this.node.attributes;

    for (const node of val) {
      attr[node.nodeName] = isNumber.test(node.nodeValue)
        ? parseFloat(node.nodeValue)
        : node.nodeValue;
    }

    return attr
  } else if (attr instanceof Array) {
    // loop through array and get all values
    return attr.reduce((last, curr) => {
      last[curr] = this.attr(curr);
      return last
    }, {})
  } else if (typeof attr === 'object' && attr.constructor === Object) {
    // apply every attribute individually if an object is passed
    for (val in attr) this.attr(val, attr[val]);
  } else if (val === null) {
    // remove value
    this.node.removeAttribute(attr);
  } else if (val == null) {
    // act as a getter if the first and only argument is not an object
    val = this.node.getAttribute(attr);
    return val == null ? attrs[attr]
      : isNumber.test(val) ? parseFloat(val)
      : val
  } else {
    // Loop through hooks and execute them to convert value
    val = hooks.reduce((_val, hook) => {
      return hook(attr, _val, this)
    }, val);

    // ensure correct numeric values (also accepts NaN and Infinity)
    if (typeof val === 'number') {
      val = new SVGNumber(val);
    } else if (Color.isColor(val)) {
      // ensure full hex color
      val = new Color(val);
    } else if (val.constructor === Array) {
      // Check for plain arrays and parse array values
      val = new SVGArray(val);
    }

    // if the passed attribute is leading...
    if (attr === 'leading') {
      // ... call the leading method instead
      if (this.leading) {
        this.leading(val);
      }
    } else {
      // set given attribute on node
      typeof ns === 'string' ? this.node.setAttributeNS(ns, attr, val.toString())
        : this.node.setAttribute(attr, val.toString());
    }

    // rebuild if required
    if (this.rebuild && (attr === 'font-size' || attr === 'x')) {
      this.rebuild();
    }
  }

  return this
}

class Dom extends EventTarget {
  constructor (node, attrs) {
    super(node);
    this.node = node;
    this.type = node.nodeName;

    if (attrs && node !== attrs) {
      this.attr(attrs);
    }
  }

  // Add given element at a position
  add (element, i) {
    element = makeInstance(element);

    if (i == null) {
      this.node.appendChild(element.node);
    } else if (element.node !== this.node.childNodes[i]) {
      this.node.insertBefore(element.node, this.node.childNodes[i]);
    }

    return this
  }

  // Add element to given container and return self
  addTo (parent) {
    return makeInstance(parent).put(this)
  }

  // Returns all child elements
  children () {
    return new List(map(this.node.children, function (node) {
      return adopt(node)
    }))
  }

  // Remove all elements in this container
  clear () {
    // remove children
    while (this.node.hasChildNodes()) {
      this.node.removeChild(this.node.lastChild);
    }

    return this
  }

  // Clone element
  clone () {
    // write dom data to the dom so the clone can pickup the data
    this.writeDataToDom();

    // clone element and assign new id
    return assignNewId(this.node.cloneNode(true))
  }

  // Iterates over all children and invokes a given block
  each (block, deep) {
    var children = this.children();
    var i, il;

    for (i = 0, il = children.length; i < il; i++) {
      block.apply(children[i], [ i, children ]);

      if (deep) {
        children[i].each(block, deep);
      }
    }

    return this
  }

  element (nodeName) {
    return this.put(new Dom(create(nodeName)))
  }

  // Get first child
  first () {
    return adopt(this.node.firstChild)
  }

  // Get a element at the given index
  get (i) {
    return adopt(this.node.childNodes[i])
  }

  getEventHolder () {
    return this.node
  }

  getEventTarget () {
    return this.node
  }

  // Checks if the given element is a child
  has (element) {
    return this.index(element) >= 0
  }

  // Get / set id
  id (id) {
    // generate new id if no id set
    if (typeof id === 'undefined' && !this.node.id) {
      this.node.id = eid(this.type);
    }

    // dont't set directly width this.node.id to make `null` work correctly
    return this.attr('id', id)
  }

  // Gets index of given element
  index (element) {
    return [].slice.call(this.node.childNodes).indexOf(element.node)
  }

  // Get the last child
  last () {
    return adopt(this.node.lastChild)
  }

  // matches the element vs a css selector
  matches (selector) {
    const el = this.node;
    return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector)
  }

  // Returns the parent element instance
  parent (type) {
    var parent = this;

    // check for parent
    if (!parent.node.parentNode) return null

    // get parent element
    parent = adopt(parent.node.parentNode);

    if (!type) return parent

    // loop trough ancestors if type is given
    while (parent) {
      if (typeof type === 'string' ? parent.matches(type) : parent instanceof type) return parent
      if (!parent.node.parentNode || parent.node.parentNode.nodeName === '#document' || parent.node.parentNode.nodeName === '#document-fragment') return null // #759, #720
      parent = adopt(parent.node.parentNode);
    }
  }

  // Basically does the same as `add()` but returns the added element instead
  put (element, i) {
    this.add(element, i);
    return element
  }

  // Add element to given container and return container
  putIn (parent) {
    return makeInstance(parent).add(this)
  }

  // Remove element
  remove () {
    if (this.parent()) {
      this.parent().removeElement(this);
    }

    return this
  }

  // Remove a given child
  removeElement (element) {
    this.node.removeChild(element.node);

    return this
  }

  // Replace this with element
  replace (element) {
    element = makeInstance(element);
    this.node.parentNode.replaceChild(element.node, this.node);
    return element
  }

  round (precision = 2, map) {
    const factor = 10 ** precision;
    const attrs = this.attr();

    // If we have no map, build one from attrs
    if (!map) {
      map = Object.keys(attrs);
    }

    // Holds rounded attributes
    const newAttrs = {};
    map.forEach((key) => {
      newAttrs[key] = Math.round(attrs[key] * factor) / factor;
    });

    this.attr(newAttrs);
    return this
  }

  // Return id on string conversion
  toString () {
    return this.id()
  }

  // Import raw svg
  svg (svgOrFn, outerHTML) {
    var well, len, fragment;

    if (svgOrFn === false) {
      outerHTML = false;
      svgOrFn = null;
    }

    // act as getter if no svg string is given
    if (svgOrFn == null || typeof svgOrFn === 'function') {
      // The default for exports is, that the outerNode is included
      outerHTML = outerHTML == null ? true : outerHTML;

      // write svgjs data to the dom
      this.writeDataToDom();
      let current = this;

      // An export modifier was passed
      if (svgOrFn != null) {
        current = adopt(current.node.cloneNode(true));

        // If the user wants outerHTML we need to process this node, too
        if (outerHTML) {
          const result = svgOrFn(current);
          current = result || current;

          // The user does not want this node? Well, then he gets nothing
          if (result === false) return ''
        }

        // Deep loop through all children and apply modifier
        current.each(function () {
          const result = svgOrFn(this);
          const _this = result || this;

          // If modifier returns false, discard node
          if (result === false) {
            this.remove();

            // If modifier returns new node, use it
          } else if (result && this !== _this) {
            this.replace(_this);
          }
        }, true);
      }

      // Return outer or inner content
      return outerHTML
        ? current.node.outerHTML
        : current.node.innerHTML
    }

    // Act as setter if we got a string

    // The default for import is, that the current node is not replaced
    outerHTML = outerHTML == null ? false : outerHTML;

    // Create temporary holder
    well = globals.document.createElementNS(ns, 'svg');
    fragment = globals.document.createDocumentFragment();

    // Dump raw svg
    well.innerHTML = svgOrFn;

    // Transplant nodes into the fragment
    for (len = well.children.length; len--;) {
      fragment.appendChild(well.firstElementChild);
    }

    const parent = this.parent();

    // Add the whole fragment at once
    return outerHTML
      ? this.replace(fragment) && parent
      : this.add(fragment)
  }

  words (text) {
    // This is faster than removing all children and adding a new one
    this.node.textContent = text;
    return this
  }

  // write svgjs data to the dom
  writeDataToDom () {
    // dump variables recursively
    this.each(function () {
      this.writeDataToDom();
    });

    return this
  }
}

extend(Dom, { attr, find, findOne });
register(Dom, 'Dom');

class Element extends Dom {
  constructor (node, attrs) {
    super(node, attrs);

    // initialize data object
    this.dom = {};

    // create circular reference
    this.node.instance = this;

    if (node.hasAttribute('svgjs:data')) {
      // pull svgjs data from the dom (getAttributeNS doesn't work in html5)
      this.setData(JSON.parse(node.getAttribute('svgjs:data')) || {});
    }
  }

  // Move element by its center
  center (x, y) {
    return this.cx(x).cy(y)
  }

  // Move by center over x-axis
  cx (x) {
    return x == null ? this.x() + this.width() / 2 : this.x(x - this.width() / 2)
  }

  // Move by center over y-axis
  cy (y) {
    return y == null
      ? this.y() + this.height() / 2
      : this.y(y - this.height() / 2)
  }

  // Get defs
  defs () {
    return this.root().defs()
  }

  // Relative move over x and y axes
  dmove (x, y) {
    return this.dx(x).dy(y)
  }

  // Relative move over x axis
  dx (x = 0) {
    return this.x(new SVGNumber(x).plus(this.x()))
  }

  // Relative move over y axis
  dy (y = 0) {
    return this.y(new SVGNumber(y).plus(this.y()))
  }

  // Get parent document
  root () {
    const p = this.parent(getClass(root));
    return p && p.root()
  }

  getEventHolder () {
    return this
  }

  // Set height of element
  height (height) {
    return this.attr('height', height)
  }

  // Checks whether the given point inside the bounding box of the element
  inside (x, y) {
    const box = this.bbox();

    return x > box.x
      && y > box.y
      && x < box.x + box.width
      && y < box.y + box.height
  }

  // Move element to given x and y values
  move (x, y) {
    return this.x(x).y(y)
  }

  // return array of all ancestors of given type up to the root svg
  parents (until = globals.document) {
    until = makeInstance(until);
    const parents = new List();
    let parent = this;

    while (
      (parent = parent.parent())
      && parent.node !== until.node
      && parent.node !== globals.document
    ) {
      parents.push(parent);
    }

    return parents
  }

  // Get referenced element form attribute value
  reference (attr) {
    attr = this.attr(attr);
    if (!attr) return null

    const m = attr.match(reference);
    return m ? makeInstance(m[1]) : null
  }

  // set given data to the elements data property
  setData (o) {
    this.dom = o;
    return this
  }

  // Set element size to given width and height
  size (width, height) {
    const p = proportionalSize(this, width, height);

    return this
      .width(new SVGNumber(p.width))
      .height(new SVGNumber(p.height))
  }

  // Set width of element
  width (width) {
    return this.attr('width', width)
  }

  // write svgjs data to the dom
  writeDataToDom () {
    // remove previously set data
    this.node.removeAttribute('svgjs:data');

    if (Object.keys(this.dom).length) {
      this.node.setAttribute('svgjs:data', JSON.stringify(this.dom)); // see #428
    }

    return super.writeDataToDom()
  }

  // Move over x-axis
  x (x) {
    return this.attr('x', x)
  }

  // Move over y-axis
  y (y) {
    return this.attr('y', y)
  }
}

extend(Element, {
  bbox, rbox, point, ctm, screenCTM
});

register(Element, 'Element');

// Define list of available attributes for stroke and fill
var sugar = {
  stroke: [ 'color', 'width', 'opacity', 'linecap', 'linejoin', 'miterlimit', 'dasharray', 'dashoffset' ],
  fill: [ 'color', 'opacity', 'rule' ],
  prefix: function (t, a) {
    return a === 'color' ? t : t + '-' + a
  }
}

// Add sugar for fill and stroke
;[ 'fill', 'stroke' ].forEach(function (m) {
  var extension = {};
  var i;

  extension[m] = function (o) {
    if (typeof o === 'undefined') {
      return this.attr(m)
    }
    if (typeof o === 'string' || o instanceof Color || Color.isRgb(o) || (o instanceof Element)) {
      this.attr(m, o);
    } else {
      // set all attributes from sugar.fill and sugar.stroke list
      for (i = sugar[m].length - 1; i >= 0; i--) {
        if (o[sugar[m][i]] != null) {
          this.attr(sugar.prefix(m, sugar[m][i]), o[sugar[m][i]]);
        }
      }
    }

    return this
  };

  registerMethods([ 'Element', 'Runner' ], extension);
});

registerMethods([ 'Element', 'Runner' ], {
  // Let the user set the matrix directly
  matrix: function (mat, b, c, d, e, f) {
    // Act as a getter
    if (mat == null) {
      return new Matrix(this)
    }

    // Act as a setter, the user can pass a matrix or a set of numbers
    return this.attr('transform', new Matrix(mat, b, c, d, e, f))
  },

  // Map rotation to transform
  rotate: function (angle, cx, cy) {
    return this.transform({ rotate: angle, ox: cx, oy: cy }, true)
  },

  // Map skew to transform
  skew: function (x, y, cx, cy) {
    return arguments.length === 1 || arguments.length === 3
      ? this.transform({ skew: x, ox: y, oy: cx }, true)
      : this.transform({ skew: [ x, y ], ox: cx, oy: cy }, true)
  },

  shear: function (lam, cx, cy) {
    return this.transform({ shear: lam, ox: cx, oy: cy }, true)
  },

  // Map scale to transform
  scale: function (x, y, cx, cy) {
    return arguments.length === 1 || arguments.length === 3
      ? this.transform({ scale: x, ox: y, oy: cx }, true)
      : this.transform({ scale: [ x, y ], ox: cx, oy: cy }, true)
  },

  // Map translate to transform
  translate: function (x, y) {
    return this.transform({ translate: [ x, y ] }, true)
  },

  // Map relative translations to transform
  relative: function (x, y) {
    return this.transform({ relative: [ x, y ] }, true)
  },

  // Map flip to transform
  flip: function (direction, around) {
    var directionString = typeof direction === 'string' ? direction
      : isFinite(direction) ? 'both'
      : 'both';
    var origin = (direction === 'both' && isFinite(around)) ? [ around, around ]
      : (direction === 'x') ? [ around, 0 ]
      : (direction === 'y') ? [ 0, around ]
      : isFinite(direction) ? [ direction, direction ]
      : [ 0, 0 ];
    return this.transform({ flip: directionString, origin: origin }, true)
  },

  // Opacity
  opacity: function (value) {
    return this.attr('opacity', value)
  }
});

registerMethods('radius', {
  // Add x and y radius
  radius: function (x, y) {
    var type = (this._element || this).type;
    return type === 'radialGradient' || type === 'radialGradient'
      ? this.attr('r', new SVGNumber(x))
      : this.rx(x).ry(y == null ? x : y)
  }
});

registerMethods('Path', {
  // Get path length
  length: function () {
    return this.node.getTotalLength()
  },
  // Get point at length
  pointAt: function (length) {
    return new Point$1(this.node.getPointAtLength(length))
  }
});

registerMethods([ 'Element', 'Runner' ], {
  // Set font
  font: function (a, v) {
    if (typeof a === 'object') {
      for (v in a) this.font(v, a[v]);
      return this
    }

    return a === 'leading'
      ? this.leading(v)
      : a === 'anchor'
        ? this.attr('text-anchor', v)
        : a === 'size' || a === 'family' || a === 'weight' || a === 'stretch' || a === 'variant' || a === 'style'
          ? this.attr('font-' + a, v)
          : this.attr(a, v)
  }
});

registerMethods('Text', {
  ax (x) {
    return this.attr('x', x)
  },
  ay (y) {
    return this.attr('y', y)
  },
  amove (x, y) {
    return this.ax(x).ay(y)
  }
});

// Add events to elements
const methods$1 = [ 'click',
  'dblclick',
  'mousedown',
  'mouseup',
  'mouseover',
  'mouseout',
  'mousemove',
  'mouseenter',
  'mouseleave',
  'touchstart',
  'touchmove',
  'touchleave',
  'touchend',
  'touchcancel' ].reduce(function (last, event) {
  // add event to Element
  const fn = function (f) {
    if (f === null) {
      off(this, event);
    } else {
      on(this, event, f);
    }
    return this
  };

  last[event] = fn;
  return last
}, {});

registerMethods('Element', methods$1);

// Reset all transformations
function untransform () {
  return this.attr('transform', null)
}

// merge the whole transformation chain into one matrix and returns it
function matrixify () {
  var matrix = (this.attr('transform') || '')
    // split transformations
    .split(transforms).slice(0, -1).map(function (str) {
      // generate key => value pairs
      var kv = str.trim().split('(');
      return [ kv[0],
        kv[1].split(delimiter)
          .map(function (str) {
            return parseFloat(str)
          })
      ]
    })
    .reverse()
    // merge every transformation into one matrix
    .reduce(function (matrix, transform) {
      if (transform[0] === 'matrix') {
        return matrix.lmultiply(Matrix.fromArray(transform[1]))
      }
      return matrix[transform[0]].apply(matrix, transform[1])
    }, new Matrix());

  return matrix
}

// add an element to another parent without changing the visual representation on the screen
function toParent (parent) {
  if (this === parent) return this
  var ctm = this.screenCTM();
  var pCtm = parent.screenCTM().inverse();

  this.addTo(parent).untransform().transform(pCtm.multiply(ctm));

  return this
}

// same as above with parent equals root-svg
function toRoot () {
  return this.toParent(this.root())
}

// Add transformations
function transform (o, relative) {
  // Act as a getter if no object was passed
  if (o == null || typeof o === 'string') {
    var decomposed = new Matrix(this).decompose();
    return o == null ? decomposed : decomposed[o]
  }

  if (!Matrix.isMatrixLike(o)) {
    // Set the origin according to the defined transform
    o = { ...o, origin: getOrigin(o, this) };
  }

  // The user can pass a boolean, an Element or an Matrix or nothing
  var cleanRelative = relative === true ? this : (relative || false);
  var result = new Matrix(cleanRelative).transform(o);
  return this.attr('transform', result)
}

registerMethods('Element', {
  untransform, matrixify, toParent, toRoot, transform
});

// Radius x value
function rx (rx) {
  return this.attr('rx', rx)
}

// Radius y value
function ry (ry) {
  return this.attr('ry', ry)
}

// Move over x-axis
function x (x) {
  return x == null
    ? this.cx() - this.rx()
    : this.cx(x + this.rx())
}

// Move over y-axis
function y$1 (y) {
  return y == null
    ? this.cy() - this.ry()
    : this.cy(y + this.ry())
}

// Move by center over x-axis
function cx (x) {
  return x == null
    ? this.attr('cx')
    : this.attr('cx', x)
}

// Move by center over y-axis
function cy (y) {
  return y == null
    ? this.attr('cy')
    : this.attr('cy', y)
}

// Set width of element
function width (width) {
  return width == null
    ? this.rx() * 2
    : this.rx(new SVGNumber(width).divide(2))
}

// Set height of element
function height (height) {
  return height == null
    ? this.ry() * 2
    : this.ry(new SVGNumber(height).divide(2))
}

var circled = /*#__PURE__*/Object.freeze({
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

class Shape extends Element {}

register(Shape, 'Shape');

class Circle extends Shape {
  constructor (node) {
    super(nodeOrNew('circle', node), node);
  }

  radius (r) {
    return this.attr('r', r)
  }

  // Radius x value
  rx (rx) {
    return this.attr('r', rx)
  }

  // Alias radius x value
  ry (ry) {
    return this.rx(ry)
  }

  size (size) {
    return this.radius(new SVGNumber(size).divide(2))
  }
}

extend(Circle, { x, y: y$1, cx, cy, width, height });

registerMethods({
  Container: {
    // Create circle element
    circle: wrapWithAttrCheck(function (size) {
      return this.put(new Circle())
        .size(size)
        .move(0, 0)
    })
  }
});

register(Circle, 'Circle');

class Container extends Element {
  flatten (parent) {
    this.each(function () {
      if (this instanceof Container) return this.flatten(parent).ungroup(parent)
      return this.toParent(parent)
    });

    // we need this so that the root does not get removed
    this.node.firstElementChild || this.remove();

    return this
  }

  ungroup (parent) {
    parent = parent || this.parent();

    this.each(function () {
      return this.toParent(parent)
    });

    this.remove();

    return this
  }
}

register(Container, 'Container');

class Defs extends Container {
  constructor (node) {
    super(nodeOrNew('defs', node), node);
  }

  flatten () {
    return this
  }

  ungroup () {
    return this
  }
}

register(Defs, 'Defs');

class Ellipse extends Shape {
  constructor (node) {
    super(nodeOrNew('ellipse', node), node);
  }

  size (width, height) {
    var p = proportionalSize(this, width, height);

    return this
      .rx(new SVGNumber(p.width).divide(2))
      .ry(new SVGNumber(p.height).divide(2))
  }
}

extend(Ellipse, circled);

registerMethods('Container', {
  // Create an ellipse
  ellipse: wrapWithAttrCheck(function (width = 0, height = width) {
    return this.put(new Ellipse()).size(width, height).move(0, 0)
  })
});

register(Ellipse, 'Ellipse');

class Stop extends Element {
  constructor (node) {
    super(nodeOrNew('stop', node), node);
  }

  // add color stops
  update (o) {
    if (typeof o === 'number' || o instanceof SVGNumber) {
      o = {
        offset: arguments[0],
        color: arguments[1],
        opacity: arguments[2]
      };
    }

    // set attributes
    if (o.opacity != null) this.attr('stop-opacity', o.opacity);
    if (o.color != null) this.attr('stop-color', o.color);
    if (o.offset != null) this.attr('offset', new SVGNumber(o.offset));

    return this
  }
}

register(Stop, 'Stop');

function from (x, y) {
  return (this._element || this).type === 'radialGradient'
    ? this.attr({ fx: new SVGNumber(x), fy: new SVGNumber(y) })
    : this.attr({ x1: new SVGNumber(x), y1: new SVGNumber(y) })
}

function to (x, y) {
  return (this._element || this).type === 'radialGradient'
    ? this.attr({ cx: new SVGNumber(x), cy: new SVGNumber(y) })
    : this.attr({ x2: new SVGNumber(x), y2: new SVGNumber(y) })
}

var gradiented = /*#__PURE__*/Object.freeze({
	__proto__: null,
	from: from,
	to: to
});

class Gradient extends Container {
  constructor (type, attrs) {
    super(
      nodeOrNew(type + 'Gradient', typeof type === 'string' ? null : type),
      attrs
    );
  }

  // Add a color stop
  stop (offset, color, opacity) {
    return this.put(new Stop()).update(offset, color, opacity)
  }

  // Update gradient
  update (block) {
    // remove all stops
    this.clear();

    // invoke passed block
    if (typeof block === 'function') {
      block.call(this, this);
    }

    return this
  }

  // Return the fill id
  url () {
    return 'url(#' + this.id() + ')'
  }

  // Alias string convertion to fill
  toString () {
    return this.url()
  }

  // custom attr to handle transform
  attr (a, b, c) {
    if (a === 'transform') a = 'gradientTransform';
    return super.attr(a, b, c)
  }

  targets () {
    return baseFind('svg [fill*="' + this.id() + '"]')
  }

  bbox () {
    return new Box()
  }
}

extend(Gradient, gradiented);

registerMethods({
  Container: {
    // Create gradient element in defs
    gradient: wrapWithAttrCheck(function (type, block) {
      return this.defs().gradient(type, block)
    })
  },
  // define gradient
  Defs: {
    gradient: wrapWithAttrCheck(function (type, block) {
      return this.put(new Gradient(type)).update(block)
    })
  }
});

register(Gradient, 'Gradient');

class Pattern extends Container {
  // Initialize node
  constructor (node) {
    super(nodeOrNew('pattern', node), node);
  }

  // Return the fill id
  url () {
    return 'url(#' + this.id() + ')'
  }

  // Update pattern by rebuilding
  update (block) {
    // remove content
    this.clear();

    // invoke passed block
    if (typeof block === 'function') {
      block.call(this, this);
    }

    return this
  }

  // Alias string convertion to fill
  toString () {
    return this.url()
  }

  // custom attr to handle transform
  attr (a, b, c) {
    if (a === 'transform') a = 'patternTransform';
    return super.attr(a, b, c)
  }

  targets () {
    return baseFind('svg [fill*="' + this.id() + '"]')
  }

  bbox () {
    return new Box()
  }
}

registerMethods({
  Container: {
    // Create pattern element in defs
    pattern (...args) {
      return this.defs().pattern(...args)
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
      })
    })
  }
});

register(Pattern, 'Pattern');

class Image extends Shape {
  constructor (node) {
    super(nodeOrNew('image', node), node);
  }

  // (re)load image
  load (url, callback) {
    if (!url) return this

    var img = new globals.window.Image();

    on(img, 'load', function (e) {
      var p = this.parent(Pattern);

      // ensure image size
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

    return this.attr('href', (img.src = url), xlink)
  }
}

registerAttrHook(function (attr, val, _this) {
  // convert image fill and stroke to patterns
  if (attr === 'fill' || attr === 'stroke') {
    if (isImage.test(val)) {
      val = _this.root().defs().image(val);
    }
  }

  if (val instanceof Image) {
    val = _this.root().defs().pattern(0, 0, (pattern) => {
      pattern.add(val);
    });
  }

  return val
});

registerMethods({
  Container: {
    // create image element, load image and set its size
    image: wrapWithAttrCheck(function (source, callback) {
      return this.put(new Image()).size(0, 0).load(source, callback)
    })
  }
});

register(Image, 'Image');

const PointArray = subClassArray('PointArray', SVGArray);

extend(PointArray, {
  // Convert array to string
  toString () {
    // convert to a poly point string
    for (var i = 0, il = this.length, array = []; i < il; i++) {
      array.push(this[i].join(','));
    }

    return array.join(' ')
  },

  // Convert array to line object
  toLine () {
    return {
      x1: this[0][0],
      y1: this[0][1],
      x2: this[1][0],
      y2: this[1][1]
    }
  },

  // Get morphed array at given position
  at (pos) {
    // make sure a destination is defined
    if (!this.destination) return this

    // generate morphed point string
    for (var i = 0, il = this.length, array = []; i < il; i++) {
      array.push([
        this[i][0] + (this.destination[i][0] - this[i][0]) * pos,
        this[i][1] + (this.destination[i][1] - this[i][1]) * pos
      ]);
    }

    return new PointArray(array)
  },

  // Parse point string and flat array
  parse (array = [ [ 0, 0 ] ]) {
    var points = [];

    // if it is an array
    if (array instanceof Array) {
      // and it is not flat, there is no need to parse it
      if (array[0] instanceof Array) {
        return array
      }
    } else { // Else, it is considered as a string
      // parse points
      array = array.trim().split(delimiter).map(parseFloat);
    }

    // validate points - https://svgwg.org/svg2-draft/shapes.html#DataTypePoints
    // Odd number of coordinates is an error. In such cases, drop the last odd coordinate.
    if (array.length % 2 !== 0) array.pop();

    // wrap points in two-tuples
    for (var i = 0, len = array.length; i < len; i = i + 2) {
      points.push([ array[i], array[i + 1] ]);
    }

    return points
  },

  // transform points with matrix (similar to Point.transform)
  transform (m) {
    const points = [];

    for (let i = 0; i < this.length; i++) {
      const point = this[i];
      // Perform the matrix multiplication
      points.push([
        m.a * point[0] + m.c * point[1] + m.e,
        m.b * point[0] + m.d * point[1] + m.f
      ]);
    }

    // Return the required point
    return new PointArray(points)
  },

  // Move point string
  move (x, y) {
    var box = this.bbox();

    // get relative offset
    x -= box.x;
    y -= box.y;

    // move every point
    if (!isNaN(x) && !isNaN(y)) {
      for (var i = this.length - 1; i >= 0; i--) {
        this[i] = [ this[i][0] + x, this[i][1] + y ];
      }
    }

    return this
  },

  // Resize poly string
  size (width, height) {
    var i;
    var box = this.bbox();

    // recalculate position of all points according to new size
    for (i = this.length - 1; i >= 0; i--) {
      if (box.width) this[i][0] = ((this[i][0] - box.x) * width) / box.width + box.x;
      if (box.height) this[i][1] = ((this[i][1] - box.y) * height) / box.height + box.y;
    }

    return this
  },

  // Get bounding box of points
  bbox () {
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
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }
});

const MorphArray = PointArray;

// Move by left top corner over x-axis
function x$1 (x) {
  return x == null ? this.bbox().x : this.move(x, this.bbox().y)
}

// Move by left top corner over y-axis
function y$2 (y) {
  return y == null ? this.bbox().y : this.move(this.bbox().x, y)
}

// Set width of element
function width$1 (width) {
  const b = this.bbox();
  return width == null ? b.width : this.size(width, b.height)
}

// Set height of element
function height$1 (height) {
  const b = this.bbox();
  return height == null ? b.height : this.size(b.width, height)
}

var pointed = /*#__PURE__*/Object.freeze({
	__proto__: null,
	MorphArray: MorphArray,
	x: x$1,
	y: y$2,
	width: width$1,
	height: height$1
});

class Line extends Shape {
  // Initialize node
  constructor (node) {
    super(nodeOrNew('line', node), node);
  }

  // Get array
  array () {
    return new PointArray([
      [ this.attr('x1'), this.attr('y1') ],
      [ this.attr('x2'), this.attr('y2') ]
    ])
  }

  // Overwrite native plot() method
  plot (x1, y1, x2, y2) {
    if (x1 == null) {
      return this.array()
    } else if (typeof y1 !== 'undefined') {
      x1 = { x1: x1, y1: y1, x2: x2, y2: y2 };
    } else {
      x1 = new PointArray(x1).toLine();
    }

    return this.attr(x1)
  }

  // Move by left top corner
  move (x, y) {
    return this.attr(this.array().move(x, y).toLine())
  }

  // Set element size to given width and height
  size (width, height) {
    var p = proportionalSize(this, width, height);
    return this.attr(this.array().size(p.width, p.height).toLine())
  }
}

extend(Line, pointed);

registerMethods({
  Container: {
    // Create a line element
    line: wrapWithAttrCheck(function (...args) {
      // make sure plot is called as a setter
      // x1 is not necessarily a number, it can also be an array, a string and a PointArray
      return Line.prototype.plot.apply(
        this.put(new Line())
        , args[0] != null ? args : [ 0, 0, 0, 0 ]
      )
    })
  }
});

register(Line, 'Line');

class Marker extends Container {
  // Initialize node
  constructor (node) {
    super(nodeOrNew('marker', node), node);
  }

  // Set width of element
  width (width) {
    return this.attr('markerWidth', width)
  }

  // Set height of element
  height (height) {
    return this.attr('markerHeight', height)
  }

  // Set marker refX and refY
  ref (x, y) {
    return this.attr('refX', x).attr('refY', y)
  }

  // Update marker
  update (block) {
    // remove all content
    this.clear();

    // invoke passed block
    if (typeof block === 'function') {
      block.call(this, this);
    }

    return this
  }

  // Return the fill id
  toString () {
    return 'url(#' + this.id() + ')'
  }
}

registerMethods({
  Container: {
    marker (...args) {
      // Create marker element in defs
      return this.defs().marker(...args)
    }
  },
  Defs: {
    // Create marker
    marker: wrapWithAttrCheck(function (width, height, block) {
      // Set default viewbox to match the width and height, set ref to cx and cy and set orient to auto
      return this.put(new Marker())
        .size(width, height)
        .ref(width / 2, height / 2)
        .viewbox(0, 0, width, height)
        .attr('orient', 'auto')
        .update(block)
    })
  },
  marker: {
    // Create and attach markers
    marker (marker, width, height, block) {
      var attr = [ 'marker' ];

      // Build attribute name
      if (marker !== 'all') attr.push(marker);
      attr = attr.join('-');

      // Set marker attribute
      marker = arguments[1] instanceof Marker
        ? arguments[1]
        : this.defs().marker(width, height, block);

      return this.attr(attr, marker)
    }
  }
});

register(Marker, 'Marker');

/***
Base Class
==========
The base stepper class that will be
***/

function makeSetterGetter (k, f) {
  return function (v) {
    if (v == null) return this[v]
    this[k] = v;
    if (f) f.call(this);
    return this
  }
}

const easing = {
  '-': function (pos) {
    return pos
  },
  '<>': function (pos) {
    return -Math.cos(pos * Math.PI) / 2 + 0.5
  },
  '>': function (pos) {
    return Math.sin(pos * Math.PI / 2)
  },
  '<': function (pos) {
    return -Math.cos(pos * Math.PI / 2) + 1
  },
  bezier: function (x1, y1, x2, y2) {
    // see https://www.w3.org/TR/css-easing-1/#cubic-bezier-algo
    return function (t) {
      if (t < 0) {
        if (x1 > 0) {
          return y1 / x1 * t
        } else if (x2 > 0) {
          return y2 / x2 * t
        } else {
          return 0
        }
      } else if (t > 1) {
        if (x2 < 1) {
          return (1 - y2) / (1 - x2) * t + (y2 - x2) / (1 - x2)
        } else if (x1 < 1) {
          return (1 - y1) / (1 - x1) * t + (y1 - x1) / (1 - x1)
        } else {
          return 1
        }
      } else {
        return 3 * t * (1 - t) ** 2 * y1 + 3 * t ** 2 * (1 - t) * y2 + t ** 3
      }
    }
  },
  // see https://www.w3.org/TR/css-easing-1/#step-timing-function-algo
  steps: function (steps, stepPosition = 'end') {
    // deal with "jump-" prefix
    stepPosition = stepPosition.split('-').reverse()[0];

    let jumps = steps;
    if (stepPosition === 'none') {
      --jumps;
    } else if (stepPosition === 'both') {
      ++jumps;
    }

    // The beforeFlag is essentially useless
    return (t, beforeFlag = false) => {
      // Step is called currentStep in referenced url
      let step = Math.floor(t * steps);
      const jumping = (t * step) % 1 === 0;

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

      return step / jumps
    }
  }
};

class Stepper {
  done () {
    return false
  }
}

/***
Easing Functions
================
***/

class Ease extends Stepper {
  constructor (fn) {
    super();
    this.ease = easing[fn || timeline.ease] || fn;
  }

  step (from, to, pos) {
    if (typeof from !== 'number') {
      return pos < 1 ? from : to
    }
    return from + (to - from) * this.ease(pos)
  }
}

/***
Controller Types
================
***/

class Controller extends Stepper {
  constructor (fn) {
    super();
    this.stepper = fn;
  }

  step (current, target, dt, c) {
    return this.stepper(current, target, dt, c)
  }

  done (c) {
    return c.done
  }
}

function recalculate () {
  // Apply the default parameters
  var duration = (this._duration || 500) / 1000;
  var overshoot = this._overshoot || 0;

  // Calculate the PID natural response
  var eps = 1e-10;
  var pi = Math.PI;
  var os = Math.log(overshoot / 100 + eps);
  var zeta = -os / Math.sqrt(pi * pi + os * os);
  var wn = 3.9 / (zeta * duration);

  // Calculate the Spring values
  this.d = 2 * zeta * wn;
  this.k = wn * wn;
}

class Spring extends Controller {
  constructor (duration, overshoot) {
    super();
    this.duration(duration || 500)
      .overshoot(overshoot || 0);
  }

  step (current, target, dt, c) {
    if (typeof current === 'string') return current
    c.done = dt === Infinity;
    if (dt === Infinity) return target
    if (dt === 0) return current

    if (dt > 100) dt = 16;

    dt /= 1000;

    // Get the previous velocity
    var velocity = c.velocity || 0;

    // Apply the control to get the new position and store it
    var acceleration = -this.d * velocity - this.k * (current - target);
    var newPosition = current
      + velocity * dt
      + acceleration * dt * dt / 2;

    // Store the velocity
    c.velocity = velocity + acceleration * dt;

    // Figure out if we have converged, and if so, pass the value
    c.done = Math.abs(target - newPosition) + Math.abs(velocity) < 0.002;
    return c.done ? target : newPosition
  }
}

extend(Spring, {
  duration: makeSetterGetter('_duration', recalculate),
  overshoot: makeSetterGetter('_overshoot', recalculate)
});

class PID extends Controller {
  constructor (p, i, d, windup) {
    super();

    p = p == null ? 0.1 : p;
    i = i == null ? 0.01 : i;
    d = d == null ? 0 : d;
    windup = windup == null ? 1000 : windup;
    this.p(p).i(i).d(d).windup(windup);
  }

  step (current, target, dt, c) {
    if (typeof current === 'string') return current
    c.done = dt === Infinity;

    if (dt === Infinity) return target
    if (dt === 0) return current

    var p = target - current;
    var i = (c.integral || 0) + p * dt;
    var d = (p - (c.error || 0)) / dt;
    var windup = this.windup;

    // antiwindup
    if (windup !== false) {
      i = Math.max(-windup, Math.min(i, windup));
    }

    c.error = p;
    c.integral = i;

    c.done = Math.abs(p) < 0.001;

    return c.done ? target : current + (this.P * p + this.I * i + this.D * d)
  }
}

extend(PID, {
  windup: makeSetterGetter('windup'),
  p: makeSetterGetter('P'),
  i: makeSetterGetter('I'),
  d: makeSetterGetter('D')
});

const PathArray = subClassArray('PathArray', SVGArray);

function pathRegReplace (a, b, c, d) {
  return c + d.replace(dots, ' .')
}

function arrayToString (a) {
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

  return s + ' '
}

const pathHandlers = {
  M: function (c, p, p0) {
    p.x = p0.x = c[0];
    p.y = p0.y = c[1];

    return [ 'M', p.x, p.y ]
  },
  L: function (c, p) {
    p.x = c[0];
    p.y = c[1];
    return [ 'L', c[0], c[1] ]
  },
  H: function (c, p) {
    p.x = c[0];
    return [ 'H', c[0] ]
  },
  V: function (c, p) {
    p.y = c[0];
    return [ 'V', c[0] ]
  },
  C: function (c, p) {
    p.x = c[4];
    p.y = c[5];
    return [ 'C', c[0], c[1], c[2], c[3], c[4], c[5] ]
  },
  S: function (c, p) {
    p.x = c[2];
    p.y = c[3];
    return [ 'S', c[0], c[1], c[2], c[3] ]
  },
  Q: function (c, p) {
    p.x = c[2];
    p.y = c[3];
    return [ 'Q', c[0], c[1], c[2], c[3] ]
  },
  T: function (c, p) {
    p.x = c[0];
    p.y = c[1];
    return [ 'T', c[0], c[1] ]
  },
  Z: function (c, p, p0) {
    p.x = p0.x;
    p.y = p0.y;
    return [ 'Z' ]
  },
  A: function (c, p) {
    p.x = c[5];
    p.y = c[6];
    return [ 'A', c[0], c[1], c[2], c[3], c[4], c[5], c[6] ]
  }
};

const mlhvqtcsaz = 'mlhvqtcsaz'.split('');

for (var i$1 = 0, il = mlhvqtcsaz.length; i$1 < il; ++i$1) {
  pathHandlers[mlhvqtcsaz[i$1]] = (function (i) {
    return function (c, p, p0) {
      if (i === 'H') c[0] = c[0] + p.x;
      else if (i === 'V') c[0] = c[0] + p.y;
      else if (i === 'A') {
        c[5] = c[5] + p.x;
        c[6] = c[6] + p.y;
      } else {
        for (var j = 0, jl = c.length; j < jl; ++j) {
          c[j] = c[j] + (j % 2 ? p.y : p.x);
        }
      }

      return pathHandlers[i](c, p, p0)
    }
  })(mlhvqtcsaz[i$1].toUpperCase());
}

extend(PathArray, {
  // Convert array to string
  toString () {
    return arrayToString(this)
  },

  // Move path string
  move (x, y) {
    // get bounding box of current situation
    var box = this.bbox();

    // get relative offset
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

    return this
  },

  // Resize path string
  size (width, height) {
    // get bounding box of current situation
    var box = this.bbox();
    var i, l;

    // If the box width or height is 0 then we ignore
    // transformations on the respective axis
    box.width = box.width === 0 ? 1 : box.width;
    box.height = box.height === 0 ? 1 : box.height;

    // recalculate position of all points according to new size
    for (i = this.length - 1; i >= 0; i--) {
      l = this[i][0];

      if (l === 'M' || l === 'L' || l === 'T') {
        this[i][1] = ((this[i][1] - box.x) * width) / box.width + box.x;
        this[i][2] = ((this[i][2] - box.y) * height) / box.height + box.y;
      } else if (l === 'H') {
        this[i][1] = ((this[i][1] - box.x) * width) / box.width + box.x;
      } else if (l === 'V') {
        this[i][1] = ((this[i][1] - box.y) * height) / box.height + box.y;
      } else if (l === 'C' || l === 'S' || l === 'Q') {
        this[i][1] = ((this[i][1] - box.x) * width) / box.width + box.x;
        this[i][2] = ((this[i][2] - box.y) * height) / box.height + box.y;
        this[i][3] = ((this[i][3] - box.x) * width) / box.width + box.x;
        this[i][4] = ((this[i][4] - box.y) * height) / box.height + box.y;

        if (l === 'C') {
          this[i][5] = ((this[i][5] - box.x) * width) / box.width + box.x;
          this[i][6] = ((this[i][6] - box.y) * height) / box.height + box.y;
        }
      } else if (l === 'A') {
        // resize radii
        this[i][1] = (this[i][1] * width) / box.width;
        this[i][2] = (this[i][2] * height) / box.height;

        // move position values
        this[i][6] = ((this[i][6] - box.x) * width) / box.width + box.x;
        this[i][7] = ((this[i][7] - box.y) * height) / box.height + box.y;
      }
    }

    return this
  },

  // Test if the passed path array use the same path data commands as this path array
  equalCommands (pathArray) {
    var i, il, equalCommands;

    pathArray = new PathArray(pathArray);

    equalCommands = this.length === pathArray.length;
    for (i = 0, il = this.length; equalCommands && i < il; i++) {
      equalCommands = this[i][0] === pathArray[i][0];
    }

    return equalCommands
  },

  // Make path array morphable
  morph (pathArray) {
    pathArray = new PathArray(pathArray);

    if (this.equalCommands(pathArray)) {
      this.destination = pathArray;
    } else {
      this.destination = null;
    }

    return this
  },

  // Get morphed path array at given position
  at (pos) {
    // make sure a destination is defined
    if (!this.destination) return this

    var sourceArray = this;
    var destinationArray = this.destination.value;
    var array = [];
    var pathArray = new PathArray();
    var i, il, j, jl;

    // Animate has specified in the SVG spec
    // See: https://www.w3.org/TR/SVG11/paths.html#PathElement
    for (i = 0, il = sourceArray.length; i < il; i++) {
      array[i] = [ sourceArray[i][0] ];
      for (j = 1, jl = sourceArray[i].length; j < jl; j++) {
        array[i][j] = sourceArray[i][j] + (destinationArray[i][j] - sourceArray[i][j]) * pos;
      }
      // For the two flags of the elliptical arc command, the SVG spec say:
      // Flags and booleans are interpolated as fractions between zero and one, with any non-zero value considered to be a value of one/true
      // Elliptical arc command as an array followed by corresponding indexes:
      // ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
      //   0    1   2        3                 4             5      6  7
      if (array[i][0] === 'A') {
        array[i][4] = +(array[i][4] !== 0);
        array[i][5] = +(array[i][5] !== 0);
      }
    }

    // Directly modify the value of a path array, this is done this way for performance
    pathArray.value = array;
    return pathArray
  },

  // Absolutize and parse path to array
  parse (array = [ [ 'M', 0, 0 ] ]) {
    // if it's already a patharray, no need to parse it
    if (array instanceof PathArray) return array

    // prepare for parsing
    var s;
    var paramCnt = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

    if (typeof array === 'string') {
      array = array
        .replace(numbersWithDots, pathRegReplace) // convert 45.123.123 to 45.123 .123
        .replace(pathLetters, ' $& ') // put some room between letters and numbers
        .replace(hyphen, '$1 -') // add space before hyphen
        .trim() // trim
        .split(delimiter); // split into array
    } else {
      array = array.reduce(function (prev, curr) {
        return [].concat.call(prev, curr)
      }, []);
    }

    // array now is an array containing all parts of a path e.g. ['M', '0', '0', 'L', '30', '30' ...]
    var result = [];
    var p = new Point$1();
    var p0 = new Point$1();
    var index = 0;
    var len = array.length;

    do {
      // Test if we have a path letter
      if (isPathLetter.test(array[index])) {
        s = array[index];
        ++index;
        // If last letter was a move command and we got no new, it defaults to [L]ine
      } else if (s === 'M') {
        s = 'L';
      } else if (s === 'm') {
        s = 'l';
      }

      result.push(pathHandlers[s].call(null,
        array.slice(index, (index = index + paramCnt[s.toUpperCase()])).map(parseFloat),
        p, p0
      )
      );
    } while (len > index)

    return result
  },

  // Get bounding box of path
  bbox () {
    parser().path.setAttribute('d', this.toString());
    return parser.nodes.path.getBBox()
  }
});

class Morphable {
  constructor (stepper) {
    this._stepper = stepper || new Ease('-');

    this._from = null;
    this._to = null;
    this._type = null;
    this._context = null;
    this._morphObj = null;
  }

  from (val) {
    if (val == null) {
      return this._from
    }

    this._from = this._set(val);
    return this
  }

  to (val) {
    if (val == null) {
      return this._to
    }

    this._to = this._set(val);
    return this
  }

  type (type) {
    // getter
    if (type == null) {
      return this._type
    }

    // setter
    this._type = type;
    return this
  }

  _set (value) {
    if (!this._type) {
      var type = typeof value;

      if (type === 'number') {
        this.type(SVGNumber);
      } else if (type === 'string') {
        if (Color.isColor(value)) {
          this.type(Color);
        } else if (delimiter.test(value)) {
          this.type(pathLetters.test(value)
            ? PathArray
            : SVGArray
          );
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

    var result = (new this._type(value));
    if (this._type === Color) {
      result = this._to ? result[this._to[4]]()
        : this._from ? result[this._from[4]]()
        : result;
    }
    result = result.toArray();

    this._morphObj = this._morphObj || new this._type();
    this._context = this._context
      || Array.apply(null, Array(result.length))
        .map(Object)
        .map(function (o) {
          o.done = true;
          return o
        });
    return result
  }

  stepper (stepper) {
    if (stepper == null) return this._stepper
    this._stepper = stepper;
    return this
  }

  done () {
    var complete = this._context
      .map(this._stepper.done)
      .reduce(function (last, curr) {
        return last && curr
      }, true);
    return complete
  }

  at (pos) {
    var _this = this;

    return this._morphObj.fromArray(
      this._from.map(function (i, index) {
        return _this._stepper.step(i, _this._to[index], pos, _this._context[index], _this._context)
      })
    )
  }
}

class NonMorphable {
  constructor (...args) {
    this.init(...args);
  }

  init (val) {
    val = Array.isArray(val) ? val[0] : val;
    this.value = val;
    return this
  }

  valueOf () {
    return this.value
  }

  toArray () {
    return [ this.value ]
  }
}

class TransformBag {
  constructor (...args) {
    this.init(...args);
  }

  init (obj) {
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
    return this
  }

  toArray () {
    var v = this;

    return [
      v.scaleX,
      v.scaleY,
      v.shear,
      v.rotate,
      v.translateX,
      v.translateY,
      v.originX,
      v.originY
    ]
  }
}

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

class ObjectBag {
  constructor (...args) {
    this.init(...args);
  }

  init (objOrArr) {
    this.values = [];

    if (Array.isArray(objOrArr)) {
      this.values = objOrArr;
      return
    }

    objOrArr = objOrArr || {};
    var entries = [];

    for (const i in objOrArr) {
      entries.push([ i, objOrArr[i] ]);
    }

    entries.sort((a, b) => {
      return a[0] - b[0]
    });

    this.values = entries.reduce((last, curr) => last.concat(curr), []);
    return this
  }

  valueOf () {
    var obj = {};
    var arr = this.values;

    for (var i = 0, len = arr.length; i < len; i += 2) {
      obj[arr[i]] = arr[i + 1];
    }

    return obj
  }

  toArray () {
    return this.values
  }
}

const morphableTypes = [
  NonMorphable,
  TransformBag,
  ObjectBag
];

function registerMorphableType (type = []) {
  morphableTypes.push(...[].concat(type));
}

function makeMorphable () {
  extend(morphableTypes, {
    to (val) {
      return new Morphable()
        .type(this.constructor)
        .from(this.valueOf())
        .to(val)
    },
    fromArray (arr) {
      this.init(arr);
      return this
    }
  });
}

class Path extends Shape {
  // Initialize node
  constructor (node) {
    super(nodeOrNew('path', node), node);
  }

  // Get array
  array () {
    return this._array || (this._array = new PathArray(this.attr('d')))
  }

  // Plot new path
  plot (d) {
    return (d == null) ? this.array()
      : this.clear().attr('d', typeof d === 'string' ? d : (this._array = new PathArray(d)))
  }

  // Clear array cache
  clear () {
    delete this._array;
    return this
  }

  // Move by left top corner
  move (x, y) {
    return this.attr('d', this.array().move(x, y))
  }

  // Move by left top corner over x-axis
  x (x) {
    return x == null ? this.bbox().x : this.move(x, this.bbox().y)
  }

  // Move by left top corner over y-axis
  y (y) {
    return y == null ? this.bbox().y : this.move(this.bbox().x, y)
  }

  // Set element size to given width and height
  size (width, height) {
    var p = proportionalSize(this, width, height);
    return this.attr('d', this.array().size(p.width, p.height))
  }

  // Set width of element
  width (width) {
    return width == null ? this.bbox().width : this.size(width, this.bbox().height)
  }

  // Set height of element
  height (height) {
    return height == null ? this.bbox().height : this.size(this.bbox().width, height)
  }

  targets () {
    return baseFind('svg textpath [href*="' + this.id() + '"]')
  }
}

// Define morphable array
Path.prototype.MorphArray = PathArray;

// Add parent method
registerMethods({
  Container: {
    // Create a wrapped path element
    path: wrapWithAttrCheck(function (d) {
      // make sure plot is called as a setter
      return this.put(new Path()).plot(d || new PathArray())
    })
  }
});

register(Path, 'Path');

// Get array
function array () {
  return this._array || (this._array = new PointArray(this.attr('points')))
}

// Plot new path
function plot (p) {
  return (p == null) ? this.array()
    : this.clear().attr('points', typeof p === 'string' ? p
    : (this._array = new PointArray(p)))
}

// Clear array cache
function clear () {
  delete this._array;
  return this
}

// Move by left top corner
function move (x, y) {
  return this.attr('points', this.array().move(x, y))
}

// Set element size to given width and height
function size (width, height) {
  const p = proportionalSize(this, width, height);
  return this.attr('points', this.array().size(p.width, p.height))
}

var poly = /*#__PURE__*/Object.freeze({
	__proto__: null,
	array: array,
	plot: plot,
	clear: clear,
	move: move,
	size: size
});

class Polygon extends Shape {
  // Initialize node
  constructor (node) {
    super(nodeOrNew('polygon', node), node);
  }
}

registerMethods({
  Container: {
    // Create a wrapped polygon element
    polygon: wrapWithAttrCheck(function (p) {
      // make sure plot is called as a setter
      return this.put(new Polygon()).plot(p || new PointArray())
    })
  }
});

extend(Polygon, pointed);
extend(Polygon, poly);
register(Polygon, 'Polygon');

class Polyline extends Shape {
  // Initialize node
  constructor (node) {
    super(nodeOrNew('polyline', node), node);
  }
}

registerMethods({
  Container: {
    // Create a wrapped polygon element
    polyline: wrapWithAttrCheck(function (p) {
      // make sure plot is called as a setter
      return this.put(new Polyline()).plot(p || new PointArray())
    })
  }
});

extend(Polyline, pointed);
extend(Polyline, poly);
register(Polyline, 'Polyline');

class Rect extends Shape {
  // Initialize node
  constructor (node) {
    super(nodeOrNew('rect', node), node);
  }
}

extend(Rect, { rx, ry });

registerMethods({
  Container: {
    // Create a rect element
    rect: wrapWithAttrCheck(function (width, height) {
      return this.put(new Rect()).size(width, height)
    })
  }
});

register(Rect, 'Rect');

class Queue {
  constructor () {
    this._first = null;
    this._last = null;
  }

  push (value) {
    // An item stores an id and the provided value
    var item = value.next ? value : { value: value, next: null, prev: null };

    // Deal with the queue being empty or populated
    if (this._last) {
      item.prev = this._last;
      this._last.next = item;
      this._last = item;
    } else {
      this._last = item;
      this._first = item;
    }

    // Return the current item
    return item
  }

  shift () {
    // Check if we have a value
    var remove = this._first;
    if (!remove) return null

    // If we do, remove it and relink things
    this._first = remove.next;
    if (this._first) this._first.prev = null;
    this._last = this._first ? this._last : null;
    return remove.value
  }

  // Shows us the first item in the list
  first () {
    return this._first && this._first.value
  }

  // Shows us the last item in the list
  last () {
    return this._last && this._last.value
  }

  // Removes the item that was returned from the push
  remove (item) {
    // Relink the previous item
    if (item.prev) item.prev.next = item.next;
    if (item.next) item.next.prev = item.prev;
    if (item === this._last) this._last = item.prev;
    if (item === this._first) this._first = item.next;

    // Invalidate item
    item.prev = null;
    item.next = null;
  }
}

const Animator = {
  nextDraw: null,
  frames: new Queue(),
  timeouts: new Queue(),
  immediates: new Queue(),
  timer: () => globals.window.performance || globals.window.Date,
  transforms: [],

  frame (fn) {
    // Store the node
    var node = Animator.frames.push({ run: fn });

    // Request an animation frame if we don't have one
    if (Animator.nextDraw === null) {
      Animator.nextDraw = globals.window.requestAnimationFrame(Animator._draw);
    }

    // Return the node so we can remove it easily
    return node
  },

  timeout (fn, delay) {
    delay = delay || 0;

    // Work out when the event should fire
    var time = Animator.timer().now() + delay;

    // Add the timeout to the end of the queue
    var node = Animator.timeouts.push({ run: fn, time: time });

    // Request another animation frame if we need one
    if (Animator.nextDraw === null) {
      Animator.nextDraw = globals.window.requestAnimationFrame(Animator._draw);
    }

    return node
  },

  immediate (fn) {
    // Add the immediate fn to the end of the queue
    var node = Animator.immediates.push(fn);
    // Request another animation frame if we need one
    if (Animator.nextDraw === null) {
      Animator.nextDraw = globals.window.requestAnimationFrame(Animator._draw);
    }

    return node
  },

  cancelFrame (node) {
    node != null && Animator.frames.remove(node);
  },

  clearTimeout (node) {
    node != null && Animator.timeouts.remove(node);
  },

  cancelImmediate (node) {
    node != null && Animator.immediates.remove(node);
  },

  _draw (now) {
    // Run all the timeouts we can run, if they are not ready yet, add them
    // to the end of the queue immediately! (bad timeouts!!! [sarcasm])
    var nextTimeout = null;
    var lastTimeout = Animator.timeouts.last();
    while ((nextTimeout = Animator.timeouts.shift())) {
      // Run the timeout if its time, or push it to the end
      if (now >= nextTimeout.time) {
        nextTimeout.run();
      } else {
        Animator.timeouts.push(nextTimeout);
      }

      // If we hit the last item, we should stop shifting out more items
      if (nextTimeout === lastTimeout) break
    }

    // Run all of the animation frames
    var nextFrame = null;
    var lastFrame = Animator.frames.last();
    while ((nextFrame !== lastFrame) && (nextFrame = Animator.frames.shift())) {
      nextFrame.run(now);
    }

    var nextImmediate = null;
    while ((nextImmediate = Animator.immediates.shift())) {
      nextImmediate();
    }

    // If we have remaining timeouts or frames, draw until we don't anymore
    Animator.nextDraw = Animator.timeouts.first() || Animator.frames.first()
      ? globals.window.requestAnimationFrame(Animator._draw)
      : null;
  }
};

var makeSchedule = function (runnerInfo) {
  var start = runnerInfo.start;
  var duration = runnerInfo.runner.duration();
  var end = start + duration;
  return { start: start, duration: duration, end: end, runner: runnerInfo.runner }
};

const defaultSource = function () {
  const w = globals.window;
  return (w.performance || w.Date).now()
};

class Timeline extends EventTarget {
  // Construct a new timeline on the given element
  constructor (timeSource = defaultSource) {
    super();

    this._timeSource = timeSource;

    // Store the timing variables
    this._startTime = 0;
    this._speed = 1.0;

    // Determines how long a runner is hold in memory. Can be a dt or true/false
    this._persist = 0;

    // Keep track of the running animations and their starting parameters
    this._nextFrame = null;
    this._paused = true;
    this._runners = [];
    this._runnerIds = [];
    this._lastRunnerId = -1;
    this._time = 0;
    this._lastSourceTime = 0;
    this._lastStepTime = 0;

    // Make sure that step is always called in class context
    this._step = this._stepFn.bind(this, false);
    this._stepImmediate = this._stepFn.bind(this, true);
  }

  // schedules a runner on the timeline
  schedule (runner, delay, when) {
    if (runner == null) {
      return this._runners.map(makeSchedule)
    }

    // The start time for the next animation can either be given explicitly,
    // derived from the current timeline time or it can be relative to the
    // last start time to chain animations direclty

    var absoluteStartTime = 0;
    var endTime = this.getEndTime();
    delay = delay || 0;

    // Work out when to start the animation
    if (when == null || when === 'last' || when === 'after') {
      // Take the last time and increment
      absoluteStartTime = endTime;
    } else if (when === 'absolute' || when === 'start') {
      absoluteStartTime = delay;
      delay = 0;
    } else if (when === 'now') {
      absoluteStartTime = this._time;
    } else if (when === 'relative') {
      const runnerInfo = this._runners[runner.id];
      if (runnerInfo) {
        absoluteStartTime = runnerInfo.start + delay;
        delay = 0;
      }
    } else {
      throw new Error('Invalid value for the "when" parameter')
    }

    // Manage runner
    runner.unschedule();
    runner.timeline(this);

    const persist = runner.persist();
    const runnerInfo = {
      persist: persist === null ? this._persist : persist,
      start: absoluteStartTime + delay,
      runner
    };

    this._lastRunnerId = runner.id;

    this._runners.push(runnerInfo);
    this._runners.sort((a, b) => a.start - b.start);
    this._runnerIds = this._runners.map(info => info.runner.id);

    this.updateTime()._continue();
    return this
  }

  // Remove the runner from this timeline
  unschedule (runner) {
    var index = this._runnerIds.indexOf(runner.id);
    if (index < 0) return this

    this._runners.splice(index, 1);
    this._runnerIds.splice(index, 1);

    runner.timeline(null);
    return this
  }

  // Calculates the end of the timeline
  getEndTime () {
    var lastRunnerInfo = this._runners[this._runnerIds.indexOf(this._lastRunnerId)];
    var lastDuration = lastRunnerInfo ? lastRunnerInfo.runner.duration() : 0;
    var lastStartTime = lastRunnerInfo ? lastRunnerInfo.start : 0;
    return lastStartTime + lastDuration
  }

  getEndTimeOfTimeline () {
    let lastEndTime = 0;
    for (var i = 0; i < this._runners.length; i++) {
      const runnerInfo = this._runners[i];
      var duration = runnerInfo ? runnerInfo.runner.duration() : 0;
      var startTime = runnerInfo ? runnerInfo.start : 0;
      const endTime = startTime + duration;
      if (endTime > lastEndTime) {
        lastEndTime = endTime;
      }
    }
    return lastEndTime
  }

  // Makes sure, that after pausing the time doesn't jump
  updateTime () {
    if (!this.active()) {
      this._lastSourceTime = this._timeSource();
    }
    return this
  }

  play () {
    // Now make sure we are not paused and continue the animation
    this._paused = false;
    return this.updateTime()._continue()
  }

  pause () {
    this._paused = true;
    return this._continue()
  }

  stop () {
    // Go to start and pause
    this.time(0);
    return this.pause()
  }

  finish () {
    // Go to end and pause
    this.time(this.getEndTimeOfTimeline() + 1);
    return this.pause()
  }

  speed (speed) {
    if (speed == null) return this._speed
    this._speed = speed;
    return this
  }

  reverse (yes) {
    var currentSpeed = this.speed();
    if (yes == null) return this.speed(-currentSpeed)

    var positive = Math.abs(currentSpeed);
    return this.speed(yes ? positive : -positive)
  }

  seek (dt) {
    return this.time(this._time + dt)
  }

  time (time) {
    if (time == null) return this._time
    this._time = time;
    return this._continue(true)
  }

  persist (dtOrForever) {
    if (dtOrForever == null) return this._persist
    this._persist = dtOrForever;
    return this
  }

  source (fn) {
    if (fn == null) return this._timeSource
    this._timeSource = fn;
    return this
  }

  _stepFn (immediateStep = false) {
    // Get the time delta from the last time and update the time
    var time = this._timeSource();
    var dtSource = time - this._lastSourceTime;

    if (immediateStep) dtSource = 0;

    var dtTime = this._speed * dtSource + (this._time - this._lastStepTime);
    this._lastSourceTime = time;

    // Only update the time if we use the timeSource.
    // Otherwise use the current time
    if (!immediateStep) {
      // Update the time
      this._time += dtTime;
      this._time = this._time < 0 ? 0 : this._time;
    }
    this._lastStepTime = this._time;
    this.fire('time', this._time);

    // This is for the case that the timeline was seeked so that the time
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
      const runnerInfo = this._runners[k];
      const runner = runnerInfo.runner;

      // Make sure that we give the actual difference
      // between runner start time and now
      const dtToStart = this._time - runnerInfo.start;

      // Dont run runner if not started yet
      // and try to reset it
      if (dtToStart <= 0) {
        runner.reset();
      }
    }

    // Run all of the runners directly
    var runnersLeft = false;
    for (var i = 0, len = this._runners.length; i < len; i++) {
      // Get and run the current runner and ignore it if its inactive
      const runnerInfo = this._runners[i];
      const runner = runnerInfo.runner;
      let dt = dtTime;

      // Make sure that we give the actual difference
      // between runner start time and now
      const dtToStart = this._time - runnerInfo.start;

      // Dont run runner if not started yet
      if (dtToStart <= 0) {
        runnersLeft = true;
        continue
      } else if (dtToStart < dt) {
        // Adjust dt to make sure that animation is on point
        dt = dtToStart;
      }

      if (!runner.active()) continue

      // If this runner is still going, signal that we need another animation
      // frame, otherwise, remove the completed runner
      var finished = runner.step(dt).done;
      if (!finished) {
        runnersLeft = true;
        // continue
      } else if (runnerInfo.persist !== true) {
        // runner is finished. And runner might get removed
        var endTime = runner.duration() - runner.time() + this._time;

        if (endTime + runnerInfo.persist < this._time) {
          // Delete runner and correct index
          runner.unschedule();
          --i;
          --len;
        }
      }
    }

    // Basically: we continue when there are runners right from us in time
    // when -->, and when runners are left from us when <--
    if ((runnersLeft && !(this._speed < 0 && this._time === 0)) || (this._runnerIds.length && this._speed < 0 && this._time > 0)) {
      this._continue();
    } else {
      this.pause();
      this.fire('finished');
    }

    return this
  }

  // Checks if we are running and continues the animation
  _continue (immediateStep = false) {
    Animator.cancelFrame(this._nextFrame);
    this._nextFrame = null;

    if (immediateStep) return this._stepImmediate()
    if (this._paused) return this

    this._nextFrame = Animator.frame(this._step);
    return this
  }

  active () {
    return !!this._nextFrame
  }
}

registerMethods({
  Element: {
    timeline: function (timeline) {
      if (timeline == null) {
        this._timeline = (this._timeline || new Timeline());
        return this._timeline
      } else {
        this._timeline = timeline;
        return this
      }
    }
  }
});

class Runner extends EventTarget {
  constructor (options) {
    super();

    // Store a unique id on the runner, so that we can identify it later
    this.id = Runner.id++;

    // Ensure a default value
    options = options == null
      ? timeline.duration
      : options;

    // Ensure that we get a controller
    options = typeof options === 'function'
      ? new Controller(options)
      : options;

    // Declare all of the variables
    this._element = null;
    this._timeline = null;
    this.done = false;
    this._queue = [];

    // Work out the stepper and the duration
    this._duration = typeof options === 'number' && options;
    this._isDeclarative = options instanceof Controller;
    this._stepper = this._isDeclarative ? options : new Ease();

    // We copy the current values from the timeline because they can change
    this._history = {};

    // Store the state of the runner
    this.enabled = true;
    this._time = 0;
    this._lastTime = 0;

    // At creation, the runner is in reseted state
    this._reseted = true;

    // Save transforms applied to this runner
    this.transforms = new Matrix();
    this.transformId = 1;

    // Looping variables
    this._haveReversed = false;
    this._reverse = false;
    this._loopsDone = 0;
    this._swing = false;
    this._wait = 0;
    this._times = 1;

    this._frameId = null;

    // Stores how long a runner is stored after beeing done
    this._persist = this._isDeclarative ? true : null;
  }

  /*
  Runner Definitions
  ==================
  These methods help us define the runtime behaviour of the Runner or they
  help us make new runners from the current runner
  */

  element (element) {
    if (element == null) return this._element
    this._element = element;
    element._prepareRunner();
    return this
  }

  timeline (timeline) {
    // check explicitly for undefined so we can set the timeline to null
    if (typeof timeline === 'undefined') return this._timeline
    this._timeline = timeline;
    return this
  }

  animate (duration, delay, when) {
    var o = Runner.sanitise(duration, delay, when);
    var runner = new Runner(o.duration);
    if (this._timeline) runner.timeline(this._timeline);
    if (this._element) runner.element(this._element);
    return runner.loop(o).schedule(o.delay, o.when)
  }

  schedule (timeline, delay, when) {
    // The user doesn't need to pass a timeline if we already have one
    if (!(timeline instanceof Timeline)) {
      when = delay;
      delay = timeline;
      timeline = this.timeline();
    }

    // If there is no timeline, yell at the user...
    if (!timeline) {
      throw Error('Runner cannot be scheduled without timeline')
    }

    // Schedule the runner on the timeline provided
    timeline.schedule(this, delay, when);
    return this
  }

  unschedule () {
    var timeline = this.timeline();
    timeline && timeline.unschedule(this);
    return this
  }

  loop (times, swing, wait) {
    // Deal with the user passing in an object
    if (typeof times === 'object') {
      swing = times.swing;
      wait = times.wait;
      times = times.times;
    }

    // Sanitise the values and store them
    this._times = times || Infinity;
    this._swing = swing || false;
    this._wait = wait || 0;

    // Allow true to be passed
    if (this._times === true) { this._times = Infinity; }

    return this
  }

  delay (delay) {
    return this.animate(0, delay)
  }

  /*
  Basic Functionality
  ===================
  These methods allow us to attach basic functions to the runner directly
  */

  queue (initFn, runFn, retargetFn, isTransform) {
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
    return this
  }

  during (fn) {
    return this.queue(null, fn)
  }

  after (fn) {
    return this.on('finished', fn)
  }

  /*
  Runner animation methods
  ========================
  Control how the animation plays
  */

  time (time) {
    if (time == null) {
      return this._time
    }
    const dt = time - this._time;
    this.step(dt);
    return this
  }

  duration () {
    return this._times * (this._wait + this._duration) - this._wait
  }

  loops (p) {
    var loopDuration = this._duration + this._wait;
    if (p == null) {
      var loopsDone = Math.floor(this._time / loopDuration);
      var relativeTime = (this._time - loopsDone * loopDuration);
      var position = relativeTime / this._duration;
      return Math.min(loopsDone + position, this._times)
    }
    var whole = Math.floor(p);
    var partial = p % 1;
    var time = loopDuration * whole + this._duration * partial;
    return this.time(time)
  }

  persist (dtOrForever) {
    if (dtOrForever == null) return this._persist
    this._persist = dtOrForever;
    return this
  }

  position (p) {
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
      const f = function (x) {
        var swinging = s * Math.floor(x % (2 * (w + d)) / (w + d));
        var backwards = (swinging && !r) || (!swinging && r);
        var uncliped = Math.pow(-1, backwards) * (x % (w + d)) / d + backwards;
        var clipped = Math.max(Math.min(uncliped, 1), 0);
        return clipped
      };

      // Figure out the value by incorporating the start time
      var endTime = t * (w + d) - w;
      position = x <= 0 ? Math.round(f(1e-5))
        : x < endTime ? f(x)
        : Math.round(f(endTime - 1e-5));
      return position
    }

    // Work out the loops done and add the position to the loops done
    var loopsDone = Math.floor(this.loops());
    var swingForward = s && (loopsDone % 2 === 0);
    var forwards = (swingForward && !r) || (r && swingForward);
    position = loopsDone + (forwards ? p : 1 - p);
    return this.loops(position)
  }

  progress (p) {
    if (p == null) {
      return Math.min(1, this._time / this.duration())
    }
    return this.time(p * this.duration())
  }

  step (dt) {
    // If we are inactive, this stepper just gets skipped
    if (!this.enabled) return this

    // Update the time and get the new position
    dt = dt == null ? 16 : dt;
    this._time += dt;
    var position = this.position();

    // Figure out if we need to run the stepper in this frame
    var running = this._lastPosition !== position && this._time >= 0;
    this._lastPosition = position;

    // Figure out if we just started
    var duration = this.duration();
    var justStarted = this._lastTime <= 0 && this._time > 0;
    var justFinished = this._lastTime < duration && this._time >= duration;

    this._lastTime = this._time;
    if (justStarted) {
      this.fire('start', this);
    }

    // Work out if the runner is finished set the done flag here so animations
    // know, that they are running in the last step (this is good for
    // transformations which can be merged)
    var declarative = this._isDeclarative;
    this.done = !declarative && !justFinished && this._time >= duration;

    // Runner is running. So its not in reseted state anymore
    this._reseted = false;

    // Call initialise and the run function
    if (running || declarative) {
      this._initialise(running);

      // clear the transforms on this runner so they dont get added again and again
      this.transforms = new Matrix();
      var converged = this._run(declarative ? dt : position);

      this.fire('step', this);
    }
    // correct the done flag here
    // declaritive animations itself know when they converged
    this.done = this.done || (converged && declarative);
    if (justFinished) {
      this.fire('finished', this);
    }
    return this
  }

  reset () {
    if (this._reseted) return this
    this.time(0);
    this._reseted = true;
    return this
  }

  finish () {
    return this.step(Infinity)
  }

  reverse (reverse) {
    this._reverse = reverse == null ? !this._reverse : reverse;
    return this
  }

  ease (fn) {
    this._stepper = new Ease(fn);
    return this
  }

  active (enabled) {
    if (enabled == null) return this.enabled
    this.enabled = enabled;
    return this
  }

  /*
  Private Methods
  ===============
  Methods that shouldn't be used externally
  */

  // Save a morpher to the morpher list so that we can retarget it later
  _rememberMorpher (method, morpher) {
    this._history[method] = {
      morpher: morpher,
      caller: this._queue[this._queue.length - 1]
    };

    // We have to resume the timeline in case a controller
    // is already done without beeing ever run
    // This can happen when e.g. this is done:
    //    anim = el.animate(new SVG.Spring)
    // and later
    //    anim.move(...)
    if (this._isDeclarative) {
      var timeline = this.timeline();
      timeline && timeline.play();
    }
  }

  // Try to set the target for a morpher if the morpher exists, otherwise
  // do nothing and return false
  _tryRetarget (method, target, extra) {
    if (this._history[method]) {
      // if the last method wasnt even initialised, throw it away
      if (!this._history[method].caller.initialised) {
        const index = this._queue.indexOf(this._history[method].caller);
        this._queue.splice(index, 1);
        return false
      }

      // for the case of transformations, we use the special retarget function
      // which has access to the outer scope
      if (this._history[method].caller.retarget) {
        this._history[method].caller.retarget(target, extra);
        // for everything else a simple morpher change is sufficient
      } else {
        this._history[method].morpher.to(target);
      }

      this._history[method].caller.finished = false;
      var timeline = this.timeline();
      timeline && timeline.play();
      return true
    }
    return false
  }

  // Run each initialise function in the runner if required
  _initialise (running) {
    // If we aren't running, we shouldn't initialise when not declarative
    if (!running && !this._isDeclarative) return

    // Loop through all of the initialisers
    for (var i = 0, len = this._queue.length; i < len; ++i) {
      // Get the current initialiser
      var current = this._queue[i];

      // Determine whether we need to initialise
      var needsIt = this._isDeclarative || (!current.initialised && running);
      running = !current.finished;

      // Call the initialiser if we need to
      if (needsIt && running) {
        current.initialiser.call(this);
        current.initialised = true;
      }
    }
  }

  // Run each run function for the position or dt given
  _run (positionOrDt) {
    // Run all of the _queue directly
    var allfinished = true;
    for (var i = 0, len = this._queue.length; i < len; ++i) {
      // Get the current function to run
      var current = this._queue[i];

      // Run the function if its not finished, we keep track of the finished
      // flag for the sake of declarative _queue
      var converged = current.runner.call(this, positionOrDt);
      current.finished = current.finished || (converged === true);
      allfinished = allfinished && current.finished;
    }

    // We report when all of the constructors are finished
    return allfinished
  }

  addTransform (transform, index) {
    this.transforms.lmultiplyO(transform);
    return this
  }

  clearTransform () {
    this.transforms = new Matrix();
    return this
  }

  // TODO: Keep track of all transformations so that deletion is faster
  clearTransformsFromQueue () {
    if (!this.done || !this._timeline || !this._timeline._runnerIds.includes(this.id)) {
      this._queue = this._queue.filter((item) => {
        return !item.isTransform
      });
    }
  }

  static sanitise (duration, delay, when) {
    // Initialise the default parameters
    var times = 1;
    var swing = false;
    var wait = 0;
    duration = duration || timeline.duration;
    delay = delay || timeline.delay;
    when = when || 'last';

    // If we have an object, unpack the values
    if (typeof duration === 'object' && !(duration instanceof Stepper)) {
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
    }
  }
}

Runner.id = 0;

class FakeRunner {
  constructor (transforms = new Matrix(), id = -1, done = true) {
    this.transforms = transforms;
    this.id = id;
    this.done = done;
  }

  clearTransformsFromQueue () { }
}

extend([ Runner, FakeRunner ], {
  mergeWith (runner) {
    return new FakeRunner(
      runner.transforms.lmultiply(this.transforms),
      runner.id
    )
  }
});

// FakeRunner.emptyRunner = new FakeRunner()

const lmultiply = (last, curr) => last.lmultiplyO(curr);
const getRunnerTransform = (runner) => runner.transforms;

function mergeTransforms () {
  // Find the matrix to apply to the element and apply it
  const runners = this._transformationRunners.runners;
  const netTransform = runners
    .map(getRunnerTransform)
    .reduce(lmultiply, new Matrix());

  this.transform(netTransform);

  this._transformationRunners.merge();

  if (this._transformationRunners.length() === 1) {
    this._frameId = null;
  }
}

class RunnerArray {
  constructor () {
    this.runners = [];
    this.ids = [];
  }

  add (runner) {
    if (this.runners.includes(runner)) return
    const id = runner.id + 1;

    this.runners.push(runner);
    this.ids.push(id);

    return this
  }

  getByID (id) {
    return this.runners[this.ids.indexOf(id + 1)]
  }

  remove (id) {
    const index = this.ids.indexOf(id + 1);
    this.ids.splice(index, 1);
    this.runners.splice(index, 1);
    return this
  }

  merge () {
    let lastRunner = null;
    this.runners.forEach((runner, i) => {

      const condition = lastRunner
        && runner.done && lastRunner.done
        // don't merge runner when persisted on timeline
        && (!runner._timeline || !runner._timeline._runnerIds.includes(runner.id))
        && (!lastRunner._timeline || !lastRunner._timeline._runnerIds.includes(lastRunner.id));

      if (condition) {
        // the +1 happens in the function
        this.remove(runner.id);
        this.edit(lastRunner.id, runner.mergeWith(lastRunner));
      }

      lastRunner = runner;
    });

    return this
  }

  edit (id, newRunner) {
    const index = this.ids.indexOf(id + 1);
    this.ids.splice(index, 1, id + 1);
    this.runners.splice(index, 1, newRunner);
    return this
  }

  length () {
    return this.ids.length
  }

  clearBefore (id) {
    const deleteCnt = this.ids.indexOf(id + 1) || 1;
    this.ids.splice(0, deleteCnt, 0);
    this.runners.splice(0, deleteCnt, new FakeRunner())
      .forEach((r) => r.clearTransformsFromQueue());
    return this
  }
}

registerMethods({
  Element: {
    animate (duration, delay, when) {
      var o = Runner.sanitise(duration, delay, when);
      var timeline = this.timeline();
      return new Runner(o.duration)
        .loop(o)
        .element(this)
        .timeline(timeline.play())
        .schedule(o.delay, o.when)
    },

    delay (by, when) {
      return this.animate(0, by, when)
    },

    // this function searches for all runners on the element and deletes the ones
    // which run before the current one. This is because absolute transformations
    // overwfrite anything anyway so there is no need to waste time computing
    // other runners
    _clearTransformRunnersBefore (currentRunner) {
      this._transformationRunners.clearBefore(currentRunner.id);
    },

    _currentTransform (current) {
      return this._transformationRunners.runners
        // we need the equal sign here to make sure, that also transformations
        // on the same runner which execute before the current transformation are
        // taken into account
        .filter((runner) => runner.id <= current.id)
        .map(getRunnerTransform)
        .reduce(lmultiply, new Matrix())
    },

    _addRunner (runner) {
      this._transformationRunners.add(runner);

      // Make sure that the runner merge is executed at the very end of
      // all Animator functions. Thats why we use immediate here to execute
      // the merge right after all frames are run
      Animator.cancelImmediate(this._frameId);
      this._frameId = Animator.immediate(mergeTransforms.bind(this));
    },

    _prepareRunner () {
      if (this._frameId == null) {
        this._transformationRunners = new RunnerArray()
          .add(new FakeRunner(new Matrix(this)));
      }
    }
  }
});

extend(Runner, {
  attr (a, v) {
    return this.styleAttr('attr', a, v)
  },

  // Add animatable styles
  css (s, v) {
    return this.styleAttr('css', s, v)
  },

  styleAttr (type, name, val) {
    // apply attributes individually
    if (typeof name === 'object') {
      for (var key in name) {
        this.styleAttr(type, key, name[key]);
      }
      return this
    }

    var morpher = new Morphable(this._stepper).to(val);

    this.queue(function () {
      morpher = morpher.from(this.element()[type](name));
    }, function (pos) {
      this.element()[type](name, morpher.at(pos));
      return morpher.done()
    });

    return this
  },

  zoom (level, point) {
    if (this._tryRetarget('zoom', to, point)) return this

    var morpher = new Morphable(this._stepper).to(new SVGNumber(level));

    this.queue(function () {
      morpher = morpher.from(this.element().zoom());
    }, function (pos) {
      this.element().zoom(morpher.at(pos), point);
      return morpher.done()
    }, function (newLevel, newPoint) {
      point = newPoint;
      morpher.to(newLevel);
    });

    this._rememberMorpher('zoom', morpher);
    return this
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

  transform (transforms, relative, affine) {
    // If we have a declarative function, we should retarget it if possible
    relative = transforms.relative || relative;
    if (this._isDeclarative && !relative && this._tryRetarget('transform', transforms)) {
      return this
    }

    // Parse the parameters
    var isMatrix = Matrix.isMatrixLike(transforms);
    affine = transforms.affine != null
      ? transforms.affine
      : (affine != null ? affine : !isMatrix);

    // Create a morepher and set its type
    const morpher = new Morphable(this._stepper)
      .type(affine ? TransformBag : Matrix);

    let origin;
    let element;
    let current;
    let currentAngle;
    let startTransform;

    function setup () {
      // make sure element and origin is defined
      element = element || this.element();
      origin = origin || getOrigin(transforms, element);

      startTransform = new Matrix(relative ? undefined : element);

      // add the runner to the element so it can merge transformations
      element._addRunner(this);

      // Deactivate all transforms that have run so far if we are absolute
      if (!relative) {
        element._clearTransformRunnersBefore(this);
      }
    }

    function run (pos) {
      // clear all other transforms before this in case something is saved
      // on this runner. We are absolute. We dont need these!
      if (!relative) this.clearTransform();

      const { x, y } = new Point$1(origin).transform(element._currentTransform(this));

      let target = new Matrix({ ...transforms, origin: [ x, y ] });
      let start = this._isDeclarative && current
        ? current
        : startTransform;

      if (affine) {
        target = target.decompose(x, y);
        start = start.decompose(x, y);

        // Get the current and target angle as it was set
        const rTarget = target.rotate;
        const rCurrent = start.rotate;

        // Figure out the shortest path to rotate directly
        const possibilities = [ rTarget - 360, rTarget, rTarget + 360 ];
        const distances = possibilities.map(a => Math.abs(a - rCurrent));
        const shortest = Math.min(...distances);
        const index = distances.indexOf(shortest);
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

      const affineParameters = morpher.at(pos);
      currentAngle = affineParameters.rotate;
      current = new Matrix(affineParameters);

      this.addTransform(current);
      element._addRunner(this);
      return morpher.done()
    }

    function retarget (newTransforms) {
      // only get a new origin if it changed since the last call
      if (
        (newTransforms.origin || 'center').toString()
        !== (transforms.origin || 'center').toString()
      ) {
        origin = getOrigin(transforms, element);
      }

      // overwrite the old transformations with the new ones
      transforms = { ...newTransforms, origin };
    }

    this.queue(setup, run, retarget, true);
    this._isDeclarative && this._rememberMorpher('transform', morpher);
    return this
  },

  // Animatable x-axis
  x (x, relative) {
    return this._queueNumber('x', x)
  },

  // Animatable y-axis
  y (y) {
    return this._queueNumber('y', y)
  },

  dx (x = 0) {
    return this._queueNumberDelta('x', x)
  },

  dy (y = 0) {
    return this._queueNumberDelta('y', y)
  },

  dmove (x, y) {
    return this.dx(x).dy(y)
  },

  _queueNumberDelta (method, to) {
    to = new SVGNumber(to);

    // Try to change the target if we have this method already registerd
    if (this._tryRetarget(method, to)) return this

    // Make a morpher and queue the animation
    var morpher = new Morphable(this._stepper).to(to);
    var from = null;
    this.queue(function () {
      from = this.element()[method]();
      morpher.from(from);
      morpher.to(from + to);
    }, function (pos) {
      this.element()[method](morpher.at(pos));
      return morpher.done()
    }, function (newTo) {
      morpher.to(from + new SVGNumber(newTo));
    });

    // Register the morpher so that if it is changed again, we can retarget it
    this._rememberMorpher(method, morpher);
    return this
  },

  _queueObject (method, to) {
    // Try to change the target if we have this method already registerd
    if (this._tryRetarget(method, to)) return this

    // Make a morpher and queue the animation
    var morpher = new Morphable(this._stepper).to(to);
    this.queue(function () {
      morpher.from(this.element()[method]());
    }, function (pos) {
      this.element()[method](morpher.at(pos));
      return morpher.done()
    });

    // Register the morpher so that if it is changed again, we can retarget it
    this._rememberMorpher(method, morpher);
    return this
  },

  _queueNumber (method, value) {
    return this._queueObject(method, new SVGNumber(value))
  },

  // Animatable center x-axis
  cx (x) {
    return this._queueNumber('cx', x)
  },

  // Animatable center y-axis
  cy (y) {
    return this._queueNumber('cy', y)
  },

  // Add animatable move
  move (x, y) {
    return this.x(x).y(y)
  },

  // Add animatable center
  center (x, y) {
    return this.cx(x).cy(y)
  },

  // Add animatable size
  size (width, height) {
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

    return this
      .width(width)
      .height(height)
  },

  // Add animatable width
  width (width) {
    return this._queueNumber('width', width)
  },

  // Add animatable height
  height (height) {
    return this._queueNumber('height', height)
  },

  // Add animatable plot
  plot (a, b, c, d) {
    // Lines can be plotted with 4 arguments
    if (arguments.length === 4) {
      return this.plot([ a, b, c, d ])
    }

    if (this._tryRetarget('plot', a)) return this

    var morpher = new Morphable(this._stepper)
      .type(this._element.MorphArray).to(a);

    this.queue(function () {
      morpher.from(this._element.array());
    }, function (pos) {
      this._element.plot(morpher.at(pos));
      return morpher.done()
    });

    this._rememberMorpher('plot', morpher);
    return this
  },

  // Add leading method
  leading (value) {
    return this._queueNumber('leading', value)
  },

  // Add animatable viewbox
  viewbox (x, y, width, height) {
    return this._queueObject('viewbox', new Box(x, y, width, height))
  },

  update (o) {
    if (typeof o !== 'object') {
      return this.update({
        offset: arguments[0],
        color: arguments[1],
        opacity: arguments[2]
      })
    }

    if (o.opacity != null) this.attr('stop-opacity', o.opacity);
    if (o.color != null) this.attr('stop-color', o.color);
    if (o.offset != null) this.attr('offset', o.offset);

    return this
  }
});

extend(Runner, { rx, ry, from, to });
register(Runner, 'Runner');

class Svg extends Container {
  constructor (node) {
    super(nodeOrNew('svg', node), node);
    this.namespace();
  }

  isRoot () {
    return !this.node.parentNode
      || !(this.node.parentNode instanceof globals.window.SVGElement)
      || this.node.parentNode.nodeName === '#document'
  }

  // Check if this is a root svg
  // If not, call docs from this element
  root () {
    if (this.isRoot()) return this
    return super.root()
  }

  // Add namespaces
  namespace () {
    if (!this.isRoot()) return this.root().namespace()
    return this
      .attr({ xmlns: ns, version: '1.1' })
      .attr('xmlns:xlink', xlink, xmlns)
      .attr('xmlns:svgjs', svgjs, xmlns)
  }

  // Creates and returns defs element
  defs () {
    if (!this.isRoot()) return this.root().defs()

    return adopt(this.node.querySelector('defs'))
      || this.put(new Defs())
  }

  // custom parent method
  parent (type) {
    if (this.isRoot()) {
      return this.node.parentNode.nodeName === '#document'
        ? null
        : adopt(this.node.parentNode)
    }

    return super.parent(type)
  }

  clear () {
    // remove children
    while (this.node.hasChildNodes()) {
      this.node.removeChild(this.node.lastChild);
    }

    // remove defs reference
    delete this._defs;

    return this
  }
}

registerMethods({
  Container: {
    // Create nested svg document
    nested: wrapWithAttrCheck(function () {
      return this.put(new Svg())
    })
  }
});

register(Svg, 'Svg', true);

class Symbol$1 extends Container {
  // Initialize node
  constructor (node) {
    super(nodeOrNew('symbol', node), node);
  }
}

registerMethods({
  Container: {
    symbol: wrapWithAttrCheck(function () {
      return this.put(new Symbol$1())
    })
  }
});

register(Symbol$1, 'Symbol');

// Create plain text node
function plain (text) {
  // clear if build mode is disabled
  if (this._build === false) {
    this.clear();
  }

  // create text node
  this.node.appendChild(globals.document.createTextNode(text));

  return this
}

// Get length of text element
function length () {
  return this.node.getComputedTextLength()
}

var textable = /*#__PURE__*/Object.freeze({
	__proto__: null,
	plain: plain,
	length: length
});

class Text extends Shape {
  // Initialize node
  constructor (node) {
    super(nodeOrNew('text', node), node);

    this.dom.leading = new SVGNumber(1.3); // store leading value for rebuilding
    this._rebuild = true; // enable automatic updating of dy values
    this._build = false; // disable build mode for adding multiple lines
  }

  // Move over x-axis
  // Text is moved its bounding box
  // text-anchor does NOT matter
  x (x, box = this.bbox()) {
    if (x == null) {
      return box.x
    }

    return this.attr('x', this.attr('x') + x - box.x)
  }

  // Move over y-axis
  y (y, box = this.bbox()) {
    if (y == null) {
      return box.y
    }

    return this.attr('y', this.attr('y') + y - box.y)
  }

  move (x, y, box = this.bbox()) {
    return this.x(x, box).y(y, box)
  }

  // Move center over x-axis
  cx (x, box = this.bbox()) {
    if (x == null) {
      return box.cx
    }

    return this.attr('x', this.attr('x') + x - box.cx)
  }

  // Move center over y-axis
  cy (y, box = this.bbox()) {
    if (y == null) {
      return box.cy
    }

    return this.attr('y', this.attr('y') + y - box.cy)
  }

  center (x, y, box = this.bbox()) {
    return this.cx(x, box).cy(y, box)
  }

  // Set the text content
  text (text) {
    // act as getter
    if (text === undefined) {
      var children = this.node.childNodes;
      var firstLine = 0;
      text = '';

      for (var i = 0, len = children.length; i < len; ++i) {
        // skip textPaths - they are no lines
        if (children[i].nodeName === 'textPath') {
          if (i === 0) firstLine = 1;
          continue
        }

        // add newline if its not the first child and newLined is set to true
        if (i !== firstLine && children[i].nodeType !== 3 && adopt(children[i]).dom.newLined === true) {
          text += '\n';
        }

        // add content of this node
        text += children[i].textContent;
      }

      return text
    }

    // remove existing content
    this.clear().build(true);

    if (typeof text === 'function') {
      // call block
      text.call(this, this);
    } else {
      // store text and make sure text is not blank
      text = text.split('\n');

      // build new lines
      for (var j = 0, jl = text.length; j < jl; j++) {
        this.tspan(text[j]).newLine();
      }
    }

    // disable build mode and rebuild lines
    return this.build(false).rebuild()
  }

  // Set / get leading
  leading (value) {
    // act as getter
    if (value == null) {
      return this.dom.leading
    }

    // act as setter
    this.dom.leading = new SVGNumber(value);

    return this.rebuild()
  }

  // Rebuild appearance type
  rebuild (rebuild) {
    // store new rebuild flag if given
    if (typeof rebuild === 'boolean') {
      this._rebuild = rebuild;
    }

    // define position of all lines
    if (this._rebuild) {
      var self = this;
      var blankLineOffset = 0;
      var leading = this.dom.leading;

      this.each(function () {
        var fontSize = globals.window.getComputedStyle(this.node)
          .getPropertyValue('font-size');
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

    return this
  }

  // Enable / disable build mode
  build (build) {
    this._build = !!build;
    return this
  }

  // overwrite method from parent to set data properly
  setData (o) {
    this.dom = o;
    this.dom.leading = new SVGNumber(o.leading || 1.3);
    return this
  }
}

extend(Text, textable);

registerMethods({
  Container: {
    // Create text element
    text: wrapWithAttrCheck(function (text) {
      return this.put(new Text()).text(text)
    }),

    // Create plain text element
    plain: wrapWithAttrCheck(function (text) {
      return this.put(new Text()).plain(text)
    })
  }
});

register(Text, 'Text');

class Tspan extends Text {
  // Initialize node
  constructor (node) {
    super(nodeOrNew('tspan', node), node);
  }

  // Set text content
  text (text) {
    if (text == null) return this.node.textContent + (this.dom.newLined ? '\n' : '')

    typeof text === 'function' ? text.call(this, this) : this.plain(text);

    return this
  }

  // Shortcut dx
  dx (dx) {
    return this.attr('dx', dx)
  }

  // Shortcut dy
  dy (dy) {
    return this.attr('dy', dy)
  }

  x (x) {
    return this.attr('x', x)
  }

  y (y) {
    return this.attr('x', y)
  }

  move (x, y) {
    return this.x(x).y(y)
  }

  // Create new line
  newLine () {
    // fetch text parent
    var t = this.parent(Text);

    // mark new line
    this.dom.newLined = true;

    var fontSize = globals.window.getComputedStyle(this.node)
      .getPropertyValue('font-size');
    var dy = t.dom.leading * new SVGNumber(fontSize);

    // apply new position
    return this.dy(dy).attr('x', t.x())
  }
}

extend(Tspan, textable);

registerMethods({
  Tspan: {
    tspan: wrapWithAttrCheck(function (text) {
      var tspan = new Tspan();

      // clear if build mode is disabled
      if (!this._build) {
        this.clear();
      }

      // add new tspan
      this.node.appendChild(tspan.node);

      return tspan.text(text)
    })
  }
});

register(Tspan, 'Tspan');

class ClipPath extends Container {
  constructor (node) {
    super(nodeOrNew('clipPath', node), node);
  }

  // Unclip all clipped elements and remove itself
  remove () {
    // unclip all targets
    this.targets().forEach(function (el) {
      el.unclip();
    });

    // remove clipPath from parent
    return super.remove()
  }

  targets () {
    return baseFind('svg [clip-path*="' + this.id() + '"]')
  }
}

registerMethods({
  Container: {
    // Create clipping element
    clip: wrapWithAttrCheck(function () {
      return this.defs().put(new ClipPath())
    })
  },
  Element: {
    // Distribute clipPath to svg element
    clipWith (element) {
      // use given clip or create a new one
      const clipper = element instanceof ClipPath
        ? element
        : this.parent().clip().add(element);

      // apply mask
      return this.attr('clip-path', 'url("#' + clipper.id() + '")')
    },

    // Unclip element
    unclip () {
      return this.attr('clip-path', null)
    },

    clipper () {
      return this.reference('clip-path')
    }
  }
});

register(ClipPath, 'ClipPath');

class ForeignObject extends Element {
  constructor (node) {
    super(nodeOrNew('foreignObject', node), node);
  }
}

registerMethods({
  Container: {
    foreignObject: wrapWithAttrCheck(function (width, height) {
      return this.put(new ForeignObject()).size(width, height)
    })
  }
});

register(ForeignObject, 'ForeignObject');

class G extends Container {
  constructor (node) {
    super(nodeOrNew('g', node), node);
  }

  x (x, box = this.bbox()) {
    if (x == null) return box.x
    return this.move(x, box.y, box)
  }

  y (y, box = this.bbox()) {
    if (y == null) return box.y
    return this.move(box.x, y, box)
  }

  move (x = 0, y = 0, box = this.bbox()) {
    const dx = x - box.x;
    const dy = y - box.y;

    return this.dmove(dx, dy)
  }

  dx (dx) {
    return this.dmove(dx, 0)
  }

  dy (dy) {
    return this.dmove(0, dy)
  }

  dmove (dx, dy) {
    this.children().forEach((child, i) => {
      // Get the childs bbox
      const bbox = child.bbox();
      // Get childs matrix
      const m = new Matrix(child);
      // Translate childs matrix by amount and
      // transform it back into parents space
      const matrix = m.translate(dx, dy).transform(m.inverse());
      // Calculate new x and y from old box
      const p = new Point$1(bbox.x, bbox.y).transform(matrix);
      // Move element
      child.move(p.x, p.y);
    });

    return this
  }

  width (width, box = this.bbox()) {
    if (width == null) return box.width
    return this.size(width, box.height, box)
  }

  height (height, box = this.bbox()) {
    if (height == null) return box.height
    return this.size(box.width, height, box)
  }

  size (width, height, box = this.bbox()) {
    const p = proportionalSize(this, width, height, box);
    const scaleX = p.width / box.width;
    const scaleY = p.height / box.height;

    this.children().forEach((child, i) => {
      const o = new Point$1(box).transform(new Matrix(child).inverse());
      child.scale(scaleX, scaleY, o.x, o.y);
    });

    return this
  }
}

registerMethods({
  Container: {
    // Create a group element
    group: wrapWithAttrCheck(function () {
      return this.put(new G())
    })
  }
});

register(G, 'G');

class A extends Container {
  constructor (node) {
    super(nodeOrNew('a', node), node);
  }

  // Link url
  to (url) {
    return this.attr('href', url, xlink)
  }

  // Link target attribute
  target (target) {
    return this.attr('target', target)
  }
}

registerMethods({
  Container: {
    // Create a hyperlink element
    link: wrapWithAttrCheck(function (url) {
      return this.put(new A()).to(url)
    })
  },
  Element: {
    // Create a hyperlink element
    linkTo: function (url) {
      var link = new A();

      if (typeof url === 'function') {
        url.call(link, link);
      } else {
        link.to(url);
      }

      return this.parent().put(link).put(this)
    }
  }
});

register(A, 'A');

class Mask extends Container {
  // Initialize node
  constructor (node) {
    super(nodeOrNew('mask', node), node);
  }

  // Unmask all masked elements and remove itself
  remove () {
    // unmask all targets
    this.targets().forEach(function (el) {
      el.unmask();
    });

    // remove mask from parent
    return super.remove()
  }

  targets () {
    return baseFind('svg [mask*="' + this.id() + '"]')
  }
}

registerMethods({
  Container: {
    mask: wrapWithAttrCheck(function () {
      return this.defs().put(new Mask())
    })
  },
  Element: {
    // Distribute mask to svg element
    maskWith (element) {
      // use given mask or create a new one
      var masker = element instanceof Mask
        ? element
        : this.parent().mask().add(element);

      // apply mask
      return this.attr('mask', 'url("#' + masker.id() + '")')
    },

    // Unmask element
    unmask () {
      return this.attr('mask', null)
    },

    masker () {
      return this.reference('mask')
    }
  }
});

register(Mask, 'Mask');

function cssRule (selector, rule) {
  if (!selector) return ''
  if (!rule) return selector

  var ret = selector + '{';

  for (var i in rule) {
    ret += unCamelCase(i) + ':' + rule[i] + ';';
  }

  ret += '}';

  return ret
}

class Style extends Element {
  constructor (node) {
    super(nodeOrNew('style', node), node);
  }

  addText (w = '') {
    this.node.textContent += w;
    return this
  }

  font (name, src, params = {}) {
    return this.rule('@font-face', {
      fontFamily: name,
      src: src,
      ...params
    })
  }

  rule (selector, obj) {
    return this.addText(cssRule(selector, obj))
  }
}

registerMethods('Dom', {
  style: wrapWithAttrCheck(function (selector, obj) {
    return this.put(new Style()).rule(selector, obj)
  }),
  fontface: wrapWithAttrCheck(function (name, src, params) {
    return this.put(new Style()).font(name, src, params)
  })
});

register(Style, 'Style');

class TextPath extends Text {
  // Initialize node
  constructor (node) {
    super(nodeOrNew('textPath', node), node);
  }

  // return the array of the path track element
  array () {
    var track = this.track();

    return track ? track.array() : null
  }

  // Plot path if any
  plot (d) {
    var track = this.track();
    var pathArray = null;

    if (track) {
      pathArray = track.plot(d);
    }

    return (d == null) ? pathArray : this
  }

  // Get the path element
  track () {
    return this.reference('href')
  }
}

registerMethods({
  Container: {
    textPath: wrapWithAttrCheck(function (text, path) {
      // Convert text to instance if needed
      if (!(text instanceof Text)) {
        text = this.text(text);
      }

      return text.path(path)
    })
  },
  Text: {
    // Create path for text to run on
    path: wrapWithAttrCheck(function (track, importNodes = true) {
      var textPath = new TextPath();

      // if track is a path, reuse it
      if (!(track instanceof Path)) {
        // create path element
        track = this.defs().path(track);
      }

      // link textPath to path and add content
      textPath.attr('href', '#' + track, xlink);

      // Transplant all nodes from text to textPath
      let node;
      if (importNodes) {
        while ((node = this.node.firstChild)) {
          textPath.node.appendChild(node);
        }
      }

      // add textPath element as child node and return textPath
      return this.put(textPath)
    }),

    // Get the textPath children
    textPath () {
      return this.findOne('textPath')
    }
  },
  Path: {
    // creates a textPath from this path
    text: wrapWithAttrCheck(function (text) {
      // Convert text to instance if needed
      if (!(text instanceof Text)) {
        text = new Text().addTo(this.parent()).text(text);
      }

      // Create textPath from text and path and return
      return text.path(this)
    }),

    targets () {
      return baseFind('svg [href*="' + this.id() + '"]')
    }
  }
});

TextPath.prototype.MorphArray = PathArray;
register(TextPath, 'TextPath');

class Use extends Shape {
  constructor (node) {
    super(nodeOrNew('use', node), node);
  }

  // Use element as a reference
  element (element, file) {
    // Set lined element
    return this.attr('href', (file || '') + '#' + element, xlink)
  }
}

registerMethods({
  Container: {
    // Create a use element
    use: wrapWithAttrCheck(function (element, file) {
      return this.put(new Use()).element(element, file)
    })
  }
});

register(Use, 'Use');

/* Optional Modules */
const SVG = makeInstance;

extend([
  Svg,
  Symbol$1,
  Image,
  Pattern,
  Marker
], getMethodsFor('viewbox'));

extend([
  Line,
  Polyline,
  Polygon,
  Path
], getMethodsFor('marker'));

extend(Text, getMethodsFor('Text'));
extend(Path, getMethodsFor('Path'));

extend(Defs, getMethodsFor('Defs'));

extend([
  Text,
  Tspan
], getMethodsFor('Tspan'));

extend([
  Rect,
  Ellipse,
  Circle,
  Gradient
], getMethodsFor('radius'));

extend(EventTarget, getMethodsFor('EventTarget'));
extend(Dom, getMethodsFor('Dom'));
extend(Element, getMethodsFor('Element'));
extend(Shape, getMethodsFor('Shape'));
// extend(Element, getConstructor('Memory'))
extend(Container, getMethodsFor('Container'));

extend(Runner, getMethodsFor('Runner'));

List.extend(getMethodNames());

registerMorphableType([
  SVGNumber,
  Color,
  Box,
  Matrix,
  SVGArray,
  PointArray,
  PathArray
]);

makeMorphable();

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

var replacement = /#|\.prototype\./;

var isForced = function (feature, detection) {
  var value = data$1[normalize(feature)];
  return value == POLYFILL ? true
    : value == NATIVE ? false
    : typeof detection == 'function' ? fails(detection)
    : !!detection;
};

var normalize = isForced.normalize = function (string) {
  return String(string).replace(replacement, '.').toLowerCase();
};

var data$1 = isForced.data = {};
var NATIVE = isForced.NATIVE = 'N';
var POLYFILL = isForced.POLYFILL = 'P';

var isForced_1 = isForced;

var isObject = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
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

var anObject = function (it) {
  if (!isObject(it)) {
    throw TypeError(String(it) + ' is not an object');
  } return it;
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

var nativeDefineProperty = Object.defineProperty;

// `Object.defineProperty` method
// https://tc39.github.io/ecma262/#sec-object.defineproperty
var f = descriptors ? nativeDefineProperty : function defineProperty(O, P, Attributes) {
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

var createNonEnumerableProperty = descriptors ? function (object, key, value) {
  return objectDefineProperty.f(object, key, createPropertyDescriptor(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

var hasOwnProperty = {}.hasOwnProperty;

var has = function (it, key) {
  return hasOwnProperty.call(it, key);
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

var toString = {}.toString;

var classofRaw = function (it) {
  return toString.call(it).slice(8, -1);
};

var aPossiblePrototype = function (it) {
  if (!isObject(it) && it !== null) {
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
    anObject(O);
    aPossiblePrototype(proto);
    if (CORRECT_SETTER) setter.call(O, proto);
    else O.__proto__ = proto;
    return O;
  };
}() : undefined);

// makes subclassing work correct for wrapped built-ins
var inheritIfRequired = function ($this, dummy, Wrapper) {
  var NewTarget, NewTargetPrototype;
  if (
    // it can work only with native `setPrototypeOf`
    objectSetPrototypeOf &&
    // we haven't completely correct pre-ES6 way for getting `new.target`, so use this
    typeof (NewTarget = dummy.constructor) == 'function' &&
    NewTarget !== Wrapper &&
    isObject(NewTargetPrototype = NewTarget.prototype) &&
    NewTargetPrototype !== Wrapper.prototype
  ) objectSetPrototypeOf($this, NewTargetPrototype);
  return $this;
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

// `Object.keys` method
// https://tc39.github.io/ecma262/#sec-object.keys
var objectKeys = Object.keys || function keys(O) {
  return objectKeysInternal(O, enumBugKeys);
};

// `Object.defineProperties` method
// https://tc39.github.io/ecma262/#sec-object.defineproperties
var objectDefineProperties = descriptors ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = objectKeys(Properties);
  var length = keys.length;
  var index = 0;
  var key;
  while (length > index) objectDefineProperty.f(O, key = keys[index++], Properties[key]);
  return O;
};

var path = global_1;

var aFunction = function (variable) {
  return typeof variable == 'function' ? variable : undefined;
};

var getBuiltIn = function (namespace, method) {
  return arguments.length < 2 ? aFunction(path[namespace]) || aFunction(global_1[namespace])
    : path[namespace] && path[namespace][method] || global_1[namespace] && global_1[namespace][method];
};

var html = getBuiltIn('document', 'documentElement');

var GT = '>';
var LT = '<';
var PROTOTYPE = 'prototype';
var SCRIPT = 'script';
var IE_PROTO = sharedKey('IE_PROTO');

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
  html.appendChild(iframe);
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
  while (length--) delete NullProtoObject[PROTOTYPE][enumBugKeys[length]];
  return NullProtoObject();
};

hiddenKeys[IE_PROTO] = true;

// `Object.create` method
// https://tc39.github.io/ecma262/#sec-object.create
var objectCreate = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    EmptyConstructor[PROTOTYPE] = anObject(O);
    result = new EmptyConstructor();
    EmptyConstructor[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = NullProtoObject();
  return Properties === undefined ? result : objectDefineProperties(result, Properties);
};

var hiddenKeys$1 = enumBugKeys.concat('length', 'prototype');

// `Object.getOwnPropertyNames` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertynames
var f$1 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return objectKeysInternal(O, hiddenKeys$1);
};

var objectGetOwnPropertyNames = {
	f: f$1
};

var nativePropertyIsEnumerable = {}.propertyIsEnumerable;
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Nashorn ~ JDK8 bug
var NASHORN_BUG = getOwnPropertyDescriptor && !nativePropertyIsEnumerable.call({ 1: 2 }, 1);

// `Object.prototype.propertyIsEnumerable` method implementation
// https://tc39.github.io/ecma262/#sec-object.prototype.propertyisenumerable
var f$2 = NASHORN_BUG ? function propertyIsEnumerable(V) {
  var descriptor = getOwnPropertyDescriptor(this, V);
  return !!descriptor && descriptor.enumerable;
} : nativePropertyIsEnumerable;

var objectPropertyIsEnumerable = {
	f: f$2
};

var nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
var f$3 = descriptors ? nativeGetOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
  O = toIndexedObject(O);
  P = toPrimitive(P, true);
  if (ie8DomDefine) try {
    return nativeGetOwnPropertyDescriptor(O, P);
  } catch (error) { /* empty */ }
  if (has(O, P)) return createPropertyDescriptor(!objectPropertyIsEnumerable.f.call(O, P), O[P]);
};

var objectGetOwnPropertyDescriptor = {
	f: f$3
};

// a string of all valid unicode whitespaces
// eslint-disable-next-line max-len
var whitespaces = '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';

var whitespace$1 = '[' + whitespaces + ']';
var ltrim = RegExp('^' + whitespace$1 + whitespace$1 + '*');
var rtrim = RegExp(whitespace$1 + whitespace$1 + '*$');

// `String.prototype.{ trim, trimStart, trimEnd, trimLeft, trimRight }` methods implementation
var createMethod$1 = function (TYPE) {
  return function ($this) {
    var string = String(requireObjectCoercible($this));
    if (TYPE & 1) string = string.replace(ltrim, '');
    if (TYPE & 2) string = string.replace(rtrim, '');
    return string;
  };
};

var stringTrim = {
  // `String.prototype.{ trimLeft, trimStart }` methods
  // https://tc39.github.io/ecma262/#sec-string.prototype.trimstart
  start: createMethod$1(1),
  // `String.prototype.{ trimRight, trimEnd }` methods
  // https://tc39.github.io/ecma262/#sec-string.prototype.trimend
  end: createMethod$1(2),
  // `String.prototype.trim` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.trim
  trim: createMethod$1(3)
};

var getOwnPropertyNames = objectGetOwnPropertyNames.f;
var getOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;
var defineProperty = objectDefineProperty.f;
var trim = stringTrim.trim;

var NUMBER = 'Number';
var NativeNumber = global_1[NUMBER];
var NumberPrototype = NativeNumber.prototype;

// Opera ~12 has broken Object#toString
var BROKEN_CLASSOF = classofRaw(objectCreate(NumberPrototype)) == NUMBER;

// `ToNumber` abstract operation
// https://tc39.github.io/ecma262/#sec-tonumber
var toNumber = function (argument) {
  var it = toPrimitive(argument, false);
  var first, third, radix, maxCode, digits, length, index, code;
  if (typeof it == 'string' && it.length > 2) {
    it = trim(it);
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
if (isForced_1(NUMBER, !NativeNumber(' 0o1') || !NativeNumber('0b1') || NativeNumber('+0x1'))) {
  var NumberWrapper = function Number(value) {
    var it = arguments.length < 1 ? 0 : value;
    var dummy = this;
    return dummy instanceof NumberWrapper
      // check on 1..constructor(foo) case
      && (BROKEN_CLASSOF ? fails(function () { NumberPrototype.valueOf.call(dummy); }) : classofRaw(dummy) != NUMBER)
        ? inheritIfRequired(new NativeNumber(toNumber(it)), dummy, NumberWrapper) : toNumber(it);
  };
  for (var keys$1 = descriptors ? getOwnPropertyNames(NativeNumber) : (
    // ES3:
    'MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,' +
    // ES2015 (in case, if modules with ES2015 Number statics required before):
    'EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,' +
    'MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger'
  ).split(','), j = 0, key; keys$1.length > j; j++) {
    if (has(NativeNumber, key = keys$1[j]) && !has(NumberWrapper, key)) {
      defineProperty(NumberWrapper, key, getOwnPropertyDescriptor$1(NativeNumber, key));
    }
  }
  NumberWrapper.prototype = NumberPrototype;
  NumberPrototype.constructor = NumberWrapper;
  redefine(global_1, NUMBER, NumberWrapper);
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

var f$4 = Object.getOwnPropertySymbols;

var objectGetOwnPropertySymbols = {
	f: f$4
};

// all object keys, includes non-enumerable and symbols
var ownKeys$1 = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
  var keys = objectGetOwnPropertyNames.f(anObject(it));
  var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
  return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
};

var copyConstructorProperties = function (target, source) {
  var keys = ownKeys$1(source);
  var defineProperty = objectDefineProperty.f;
  var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!has(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
  }
};

var getOwnPropertyDescriptor$2 = objectGetOwnPropertyDescriptor.f;






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
      descriptor = getOwnPropertyDescriptor$2(target, key);
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

// `IsArray` abstract operation
// https://tc39.github.io/ecma262/#sec-isarray
var isArray = Array.isArray || function isArray(arg) {
  return classofRaw(arg) == 'Array';
};

// `ToObject` abstract operation
// https://tc39.github.io/ecma262/#sec-toobject
var toObject = function (argument) {
  return Object(requireObjectCoercible(argument));
};

var createProperty = function (object, key, value) {
  var propertyKey = toPrimitive(key);
  if (propertyKey in object) objectDefineProperty.f(object, propertyKey, createPropertyDescriptor(0, value));
  else object[propertyKey] = value;
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
var Symbol$2 = global_1.Symbol;
var createWellKnownSymbol = useSymbolAsUid ? Symbol$2 : Symbol$2 && Symbol$2.withoutSetter || uid;

var wellKnownSymbol = function (name) {
  if (!has(WellKnownSymbolsStore, name)) {
    if (nativeSymbol && has(Symbol$2, name)) WellKnownSymbolsStore[name] = Symbol$2[name];
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

var engineUserAgent = getBuiltIn('navigator', 'userAgent') || '';

var process = global_1.process;
var versions = process && process.versions;
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

var IS_CONCAT_SPREADABLE = wellKnownSymbol('isConcatSpreadable');
var MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF;
var MAXIMUM_ALLOWED_INDEX_EXCEEDED = 'Maximum allowed index exceeded';

// We can't use this feature detection in V8 since it causes
// deoptimization and serious performance degradation
// https://github.com/zloirock/core-js/issues/679
var IS_CONCAT_SPREADABLE_SUPPORT = engineV8Version >= 51 || !fails(function () {
  var array = [];
  array[IS_CONCAT_SPREADABLE] = false;
  return array.concat()[0] !== array;
});

var SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('concat');

var isConcatSpreadable = function (O) {
  if (!isObject(O)) return false;
  var spreadable = O[IS_CONCAT_SPREADABLE];
  return spreadable !== undefined ? !!spreadable : isArray(O);
};

var FORCED = !IS_CONCAT_SPREADABLE_SUPPORT || !SPECIES_SUPPORT;

// `Array.prototype.concat` method
// https://tc39.github.io/ecma262/#sec-array.prototype.concat
// with adding support of @@isConcatSpreadable and @@species
_export({ target: 'Array', proto: true, forced: FORCED }, {
  concat: function concat(arg) { // eslint-disable-line no-unused-vars
    var O = toObject(this);
    var A = arraySpeciesCreate(O, 0);
    var n = 0;
    var i, k, length, len, E;
    for (i = -1, length = arguments.length; i < length; i++) {
      E = i === -1 ? O : arguments[i];
      if (isConcatSpreadable(E)) {
        len = toLength(E.length);
        if (n + len > MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
        for (k = 0; k < len; k++, n++) if (k in E) createProperty(A, n, E[k]);
      } else {
        if (n >= MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
        createProperty(A, n++, E);
      }
    }
    A.length = n;
    return A;
  }
});

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

var push = [].push;

// `Array.prototype.{ forEach, map, filter, some, every, find, findIndex }` methods implementation
var createMethod$2 = function (TYPE) {
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
  forEach: createMethod$2(0),
  // `Array.prototype.map` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.map
  map: createMethod$2(1),
  // `Array.prototype.filter` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.filter
  filter: createMethod$2(2),
  // `Array.prototype.some` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.some
  some: createMethod$2(3),
  // `Array.prototype.every` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.every
  every: createMethod$2(4),
  // `Array.prototype.find` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.find
  find: createMethod$2(5),
  // `Array.prototype.findIndex` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
  findIndex: createMethod$2(6)
};

var arrayMethodIsStrict = function (METHOD_NAME, argument) {
  var method = [][METHOD_NAME];
  return !!method && fails(function () {
    // eslint-disable-next-line no-useless-call,no-throw-literal
    method.call(null, argument || function () { throw 1; }, 1);
  });
};

var defineProperty$1 = Object.defineProperty;
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

    if (ACCESSORS) defineProperty$1(O, 1, { enumerable: true, get: thrower });
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

var $filter = arrayIteration.filter;



var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('filter');
// Edge 14- issue
var USES_TO_LENGTH$1 = arrayMethodUsesToLength('filter');

// `Array.prototype.filter` method
// https://tc39.github.io/ecma262/#sec-array.prototype.filter
// with adding support of @@species
_export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT || !USES_TO_LENGTH$1 }, {
  filter: function filter(callbackfn /* , thisArg */) {
    return $filter(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

var UNSCOPABLES = wellKnownSymbol('unscopables');
var ArrayPrototype = Array.prototype;

// Array.prototype[@@unscopables]
// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
if (ArrayPrototype[UNSCOPABLES] == undefined) {
  objectDefineProperty.f(ArrayPrototype, UNSCOPABLES, {
    configurable: true,
    value: objectCreate(null)
  });
}

// add a key to Array.prototype[@@unscopables]
var addToUnscopables = function (key) {
  ArrayPrototype[UNSCOPABLES][key] = true;
};

var $find = arrayIteration.find;



var FIND = 'find';
var SKIPS_HOLES = true;

var USES_TO_LENGTH$2 = arrayMethodUsesToLength(FIND);

// Shouldn't skip holes
if (FIND in []) Array(1)[FIND](function () { SKIPS_HOLES = false; });

// `Array.prototype.find` method
// https://tc39.github.io/ecma262/#sec-array.prototype.find
_export({ target: 'Array', proto: true, forced: SKIPS_HOLES || !USES_TO_LENGTH$2 }, {
  find: function find(callbackfn /* , that = undefined */) {
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables(FIND);

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

var $includes = arrayIncludes.includes;



var USES_TO_LENGTH$3 = arrayMethodUsesToLength('indexOf', { ACCESSORS: true, 1: 0 });

// `Array.prototype.includes` method
// https://tc39.github.io/ecma262/#sec-array.prototype.includes
_export({ target: 'Array', proto: true, forced: !USES_TO_LENGTH$3 }, {
  includes: function includes(el /* , fromIndex = 0 */) {
    return $includes(this, el, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables('includes');

var iterators = {};

var correctPrototypeGetter = !fails(function () {
  function F() { /* empty */ }
  F.prototype.constructor = null;
  return Object.getPrototypeOf(new F()) !== F.prototype;
});

var IE_PROTO$1 = sharedKey('IE_PROTO');
var ObjectPrototype = Object.prototype;

// `Object.getPrototypeOf` method
// https://tc39.github.io/ecma262/#sec-object.getprototypeof
var objectGetPrototypeOf = correctPrototypeGetter ? Object.getPrototypeOf : function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO$1)) return O[IE_PROTO$1];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectPrototype : null;
};

var ITERATOR = wellKnownSymbol('iterator');
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
if ( !has(IteratorPrototype, ITERATOR)) {
  createNonEnumerableProperty(IteratorPrototype, ITERATOR, returnThis);
}

var iteratorsCore = {
  IteratorPrototype: IteratorPrototype,
  BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS
};

var defineProperty$2 = objectDefineProperty.f;



var TO_STRING_TAG = wellKnownSymbol('toStringTag');

var setToStringTag = function (it, TAG, STATIC) {
  if (it && !has(it = STATIC ? it : it.prototype, TO_STRING_TAG)) {
    defineProperty$2(it, TO_STRING_TAG, { configurable: true, value: TAG });
  }
};

var IteratorPrototype$1 = iteratorsCore.IteratorPrototype;





var returnThis$1 = function () { return this; };

var createIteratorConstructor = function (IteratorConstructor, NAME, next) {
  var TO_STRING_TAG = NAME + ' Iterator';
  IteratorConstructor.prototype = objectCreate(IteratorPrototype$1, { next: createPropertyDescriptor(1, next) });
  setToStringTag(IteratorConstructor, TO_STRING_TAG, false);
  iterators[TO_STRING_TAG] = returnThis$1;
  return IteratorConstructor;
};

var IteratorPrototype$2 = iteratorsCore.IteratorPrototype;
var BUGGY_SAFARI_ITERATORS$1 = iteratorsCore.BUGGY_SAFARI_ITERATORS;
var ITERATOR$1 = wellKnownSymbol('iterator');
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
          createNonEnumerableProperty(CurrentIteratorPrototype, ITERATOR$1, returnThis$2);
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
    createNonEnumerableProperty(IterablePrototype, ITERATOR$1, defaultIterator);
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
        redefine(IterablePrototype, KEY, methods[KEY]);
      }
    } else _export({ target: NAME, proto: true, forced: BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME }, methods);
  }

  return methods;
};

var ARRAY_ITERATOR = 'Array Iterator';
var setInternalState = internalState.set;
var getInternalState = internalState.getterFor(ARRAY_ITERATOR);

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
  setInternalState(this, {
    type: ARRAY_ITERATOR,
    target: toIndexedObject(iterated), // target
    index: 0,                          // next index
    kind: kind                         // kind
  });
// `%ArrayIteratorPrototype%.next` method
// https://tc39.github.io/ecma262/#sec-%arrayiteratorprototype%.next
}, function () {
  var state = getInternalState(this);
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

var nativeJoin = [].join;

var ES3_STRINGS = indexedObject != Object;
var STRICT_METHOD$1 = arrayMethodIsStrict('join', ',');

// `Array.prototype.join` method
// https://tc39.github.io/ecma262/#sec-array.prototype.join
_export({ target: 'Array', proto: true, forced: ES3_STRINGS || !STRICT_METHOD$1 }, {
  join: function join(separator) {
    return nativeJoin.call(toIndexedObject(this), separator === undefined ? ',' : separator);
  }
});

var $map = arrayIteration.map;



var HAS_SPECIES_SUPPORT$1 = arrayMethodHasSpeciesSupport('map');
// FF49- issue
var USES_TO_LENGTH$4 = arrayMethodUsesToLength('map');

// `Array.prototype.map` method
// https://tc39.github.io/ecma262/#sec-array.prototype.map
// with adding support of @@species
_export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT$1 || !USES_TO_LENGTH$4 }, {
  map: function map(callbackfn /* , thisArg */) {
    return $map(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

var HAS_SPECIES_SUPPORT$2 = arrayMethodHasSpeciesSupport('slice');
var USES_TO_LENGTH$5 = arrayMethodUsesToLength('slice', { ACCESSORS: true, 0: 0, 1: 2 });

var SPECIES$2 = wellKnownSymbol('species');
var nativeSlice = [].slice;
var max$1 = Math.max;

// `Array.prototype.slice` method
// https://tc39.github.io/ecma262/#sec-array.prototype.slice
// fallback for not array-like ES3 strings and DOM objects
_export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT$2 || !USES_TO_LENGTH$5 }, {
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

// this method was added to unscopables after implementation
// in popular engines, so it's moved to a separate module


addToUnscopables('flat');

var TO_STRING_TAG$1 = wellKnownSymbol('toStringTag');
var test = {};

test[TO_STRING_TAG$1] = 'z';

var toStringTagSupport = String(test) === '[object z]';

var TO_STRING_TAG$2 = wellKnownSymbol('toStringTag');
// ES3 wrong here
var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (error) { /* empty */ }
};

// getting tag from ES6+ `Object.prototype.toString`
var classof = toStringTagSupport ? classofRaw : function (it) {
  var O, tag, result;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (tag = tryGet(O = Object(it), TO_STRING_TAG$2)) == 'string' ? tag
    // builtinTag case
    : CORRECT_ARGUMENTS ? classofRaw(O)
    // ES3 arguments fallback
    : (result = classofRaw(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : result;
};

// `Object.prototype.toString` method implementation
// https://tc39.github.io/ecma262/#sec-object.prototype.tostring
var objectToString = toStringTagSupport ? {}.toString : function toString() {
  return '[object ' + classof(this) + ']';
};

// `Object.prototype.toString` method
// https://tc39.github.io/ecma262/#sec-object.prototype.tostring
if (!toStringTagSupport) {
  redefine(Object.prototype, 'toString', objectToString, { unsafe: true });
}

var nativePromiseConstructor = global_1.Promise;

var redefineAll = function (target, src, options) {
  for (var key in src) redefine(target, key, src[key], options);
  return target;
};

var SPECIES$3 = wellKnownSymbol('species');

var setSpecies = function (CONSTRUCTOR_NAME) {
  var Constructor = getBuiltIn(CONSTRUCTOR_NAME);
  var defineProperty = objectDefineProperty.f;

  if (descriptors && Constructor && !Constructor[SPECIES$3]) {
    defineProperty(Constructor, SPECIES$3, {
      configurable: true,
      get: function () { return this; }
    });
  }
};

var anInstance = function (it, Constructor, name) {
  if (!(it instanceof Constructor)) {
    throw TypeError('Incorrect ' + (name ? name + ' ' : '') + 'invocation');
  } return it;
};

var ITERATOR$2 = wellKnownSymbol('iterator');
var ArrayPrototype$1 = Array.prototype;

// check on default Array iterator
var isArrayIteratorMethod = function (it) {
  return it !== undefined && (iterators.Array === it || ArrayPrototype$1[ITERATOR$2] === it);
};

var ITERATOR$3 = wellKnownSymbol('iterator');

var getIteratorMethod = function (it) {
  if (it != undefined) return it[ITERATOR$3]
    || it['@@iterator']
    || iterators[classof(it)];
};

// call something on iterator step with safe closing on error
var callWithSafeIterationClosing = function (iterator, fn, value, ENTRIES) {
  try {
    return ENTRIES ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch (error) {
    var returnMethod = iterator['return'];
    if (returnMethod !== undefined) anObject(returnMethod.call(iterator));
    throw error;
  }
};

var iterate_1 = createCommonjsModule(function (module) {
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
    iterFn = getIteratorMethod(iterable);
    if (typeof iterFn != 'function') throw TypeError('Target is not iterable');
    // optimisation for array iterators
    if (isArrayIteratorMethod(iterFn)) {
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
    result = callWithSafeIterationClosing(iterator, boundFunction, step.value, AS_ENTRIES);
    if (typeof result == 'object' && result && result instanceof Result) return result;
  } return new Result(false);
};

iterate.stop = function (result) {
  return new Result(true, result);
};
});

var ITERATOR$4 = wellKnownSymbol('iterator');
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

var SPECIES$4 = wellKnownSymbol('species');

// `SpeciesConstructor` abstract operation
// https://tc39.github.io/ecma262/#sec-speciesconstructor
var speciesConstructor = function (O, defaultConstructor) {
  var C = anObject(O).constructor;
  var S;
  return C === undefined || (S = anObject(C)[SPECIES$4]) == undefined ? defaultConstructor : aFunction$1(S);
};

var engineIsIos = /(iphone|ipod|ipad).*applewebkit/i.test(engineUserAgent);

var location = global_1.location;
var set$1 = global_1.setImmediate;
var clear$1 = global_1.clearImmediate;
var process$1 = global_1.process;
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
if (!set$1 || !clear$1) {
  set$1 = function setImmediate(fn) {
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
  if (classofRaw(process$1) == 'process') {
    defer = function (id) {
      process$1.nextTick(runner(id));
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
      html.appendChild(documentCreateElement('script'))[ONREADYSTATECHANGE] = function () {
        html.removeChild(this);
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
  set: set$1,
  clear: clear$1
};

var getOwnPropertyDescriptor$3 = objectGetOwnPropertyDescriptor.f;

var macrotask = task.set;


var MutationObserver = global_1.MutationObserver || global_1.WebKitMutationObserver;
var process$2 = global_1.process;
var Promise$1 = global_1.Promise;
var IS_NODE = classofRaw(process$2) == 'process';
// Node.js 11 shows ExperimentalWarning on getting `queueMicrotask`
var queueMicrotaskDescriptor = getOwnPropertyDescriptor$3(global_1, 'queueMicrotask');
var queueMicrotask = queueMicrotaskDescriptor && queueMicrotaskDescriptor.value;

var flush, head, last, notify, toggle, node, promise, then;

// modern engines have queueMicrotask method
if (!queueMicrotask) {
  flush = function () {
    var parent, fn;
    if (IS_NODE && (parent = process$2.domain)) parent.exit();
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
      process$2.nextTick(flush);
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
var f$5 = function (C) {
  return new PromiseCapability(C);
};

var newPromiseCapability = {
	f: f$5
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










var SPECIES$5 = wellKnownSymbol('species');
var PROMISE = 'Promise';
var getInternalState$1 = internalState.get;
var setInternalState$1 = internalState.set;
var getInternalPromiseState = internalState.getterFor(PROMISE);
var PromiseConstructor = nativePromiseConstructor;
var TypeError$1 = global_1.TypeError;
var document$2 = global_1.document;
var process$3 = global_1.process;
var $fetch = getBuiltIn('fetch');
var newPromiseCapability$1 = newPromiseCapability.f;
var newGenericPromiseCapability = newPromiseCapability$1;
var IS_NODE$1 = classofRaw(process$3) == 'process';
var DISPATCH_EVENT = !!(document$2 && document$2.createEvent && global_1.dispatchEvent);
var UNHANDLED_REJECTION = 'unhandledrejection';
var REJECTION_HANDLED = 'rejectionhandled';
var PENDING = 0;
var FULFILLED = 1;
var REJECTED = 2;
var HANDLED = 1;
var UNHANDLED = 2;
var Internal, OwnPromiseCapability, PromiseWrapper, nativeThen;

var FORCED$1 = isForced_1(PROMISE, function () {
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
  constructor[SPECIES$5] = FakePromise;
  return !(promise.then(function () { /* empty */ }) instanceof FakePromise);
});

var INCORRECT_ITERATION = FORCED$1 || !checkCorrectnessOfIteration(function (iterable) {
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
          process$3.emit('unhandledRejection', value, promise);
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
      process$3.emit('rejectionHandled', promise);
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
if (FORCED$1) {
  // 25.4.3.1 Promise(executor)
  PromiseConstructor = function Promise(executor) {
    anInstance(this, PromiseConstructor, PROMISE);
    aFunction$1(executor);
    Internal.call(this);
    var state = getInternalState$1(this);
    try {
      executor(bind(internalResolve, this, state), bind(internalReject, this, state));
    } catch (error) {
      internalReject(this, state, error);
    }
  };
  // eslint-disable-next-line no-unused-vars
  Internal = function Promise(executor) {
    setInternalState$1(this, {
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
  Internal.prototype = redefineAll(PromiseConstructor.prototype, {
    // `Promise.prototype.then` method
    // https://tc39.github.io/ecma262/#sec-promise.prototype.then
    then: function then(onFulfilled, onRejected) {
      var state = getInternalPromiseState(this);
      var reaction = newPromiseCapability$1(speciesConstructor(this, PromiseConstructor));
      reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;
      reaction.fail = typeof onRejected == 'function' && onRejected;
      reaction.domain = IS_NODE$1 ? process$3.domain : undefined;
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
    var state = getInternalState$1(promise);
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

_export({ global: true, wrap: true, forced: FORCED$1 }, {
  Promise: PromiseConstructor
});

setToStringTag(PromiseConstructor, PROMISE, false);
setSpecies(PROMISE);

PromiseWrapper = getBuiltIn(PROMISE);

// statics
_export({ target: PROMISE, stat: true, forced: FORCED$1 }, {
  // `Promise.reject` method
  // https://tc39.github.io/ecma262/#sec-promise.reject
  reject: function reject(r) {
    var capability = newPromiseCapability$1(this);
    capability.reject.call(undefined, r);
    return capability.promise;
  }
});

_export({ target: PROMISE, stat: true, forced:  FORCED$1 }, {
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
      iterate_1(iterable, function (promise) {
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
      iterate_1(iterable, function (promise) {
        $promiseResolve.call(C, promise).then(capability.resolve, reject);
      });
    });
    if (result.error) reject(result.value);
    return capability.promise;
  }
});

var freezing = !fails(function () {
  return Object.isExtensible(Object.preventExtensions({}));
});

var internalMetadata = createCommonjsModule(function (module) {
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
  if (freezing && meta.REQUIRED && isExtensible(it) && !has(it, METADATA)) setMetadata(it);
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
var internalMetadata_1 = internalMetadata.REQUIRED;
var internalMetadata_2 = internalMetadata.fastKey;
var internalMetadata_3 = internalMetadata.getWeakData;
var internalMetadata_4 = internalMetadata.onFreeze;

var collection = function (CONSTRUCTOR_NAME, wrapper, common) {
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
    internalMetadata.REQUIRED = true;
  } else if (isForced_1(CONSTRUCTOR_NAME, true)) {
    var instance = new Constructor();
    // early implementations not supports chaining
    var HASNT_CHAINING = instance[ADDER](IS_WEAK ? {} : -0, 1) != instance;
    // V8 ~ Chromium 40- weak-collections throws on primitives, but should return false
    var THROWS_ON_PRIMITIVES = fails(function () { instance.has(1); });
    // most early implementations doesn't supports iterables, most modern - not close it correctly
    // eslint-disable-next-line no-new
    var ACCEPT_ITERABLES = checkCorrectnessOfIteration(function (iterable) { new NativeConstructor(iterable); });
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
  _export({ global: true, forced: Constructor != NativeConstructor }, exported);

  setToStringTag(Constructor, CONSTRUCTOR_NAME);

  if (!IS_WEAK) common.setStrong(Constructor, CONSTRUCTOR_NAME, IS_MAP);

  return Constructor;
};

var defineProperty$3 = objectDefineProperty.f;








var fastKey = internalMetadata.fastKey;


var setInternalState$2 = internalState.set;
var internalStateGetterFor = internalState.getterFor;

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
      if (!descriptors) that.size = 0;
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
        if (descriptors) state.size++;
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
    if (descriptors) defineProperty$3(C.prototype, 'size', {
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
var es_set = collection('Set', function (init) {
  return function Set() { return init(this, arguments.length ? arguments[0] : undefined); };
}, collectionStrong);

var MATCH = wellKnownSymbol('match');

// `IsRegExp` abstract operation
// https://tc39.github.io/ecma262/#sec-isregexp
var isRegexp = function (it) {
  var isRegExp;
  return isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : classofRaw(it) == 'RegExp');
};

var notARegexp = function (it) {
  if (isRegexp(it)) {
    throw TypeError("The method doesn't accept regular expressions");
  } return it;
};

var MATCH$1 = wellKnownSymbol('match');

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
_export({ target: 'String', proto: true, forced: !correctIsRegexpLogic('includes') }, {
  includes: function includes(searchString /* , position = 0 */) {
    return !!~String(requireObjectCoercible(this))
      .indexOf(notARegexp(searchString), arguments.length > 1 ? arguments[1] : undefined);
  }
});

// `String.prototype.{ codePointAt, at }` methods implementation
var createMethod$3 = function (CONVERT_TO_STRING) {
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

var stringMultibyte = {
  // `String.prototype.codePointAt` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.codepointat
  codeAt: createMethod$3(false),
  // `String.prototype.at` method
  // https://github.com/mathiasbynens/String.prototype.at
  charAt: createMethod$3(true)
};

var charAt = stringMultibyte.charAt;



var STRING_ITERATOR = 'String Iterator';
var setInternalState$3 = internalState.set;
var getInternalState$2 = internalState.getterFor(STRING_ITERATOR);

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

var ITERATOR$5 = wellKnownSymbol('iterator');
var TO_STRING_TAG$3 = wellKnownSymbol('toStringTag');
var ArrayValues = es_array_iterator.values;

for (var COLLECTION_NAME$1 in domIterables) {
  var Collection$1 = global_1[COLLECTION_NAME$1];
  var CollectionPrototype$1 = Collection$1 && Collection$1.prototype;
  if (CollectionPrototype$1) {
    // some Chrome versions have non-configurable methods on DOMTokenList
    if (CollectionPrototype$1[ITERATOR$5] !== ArrayValues) try {
      createNonEnumerableProperty(CollectionPrototype$1, ITERATOR$5, ArrayValues);
    } catch (error) {
      CollectionPrototype$1[ITERATOR$5] = ArrayValues;
    }
    if (!CollectionPrototype$1[TO_STRING_TAG$3]) {
      createNonEnumerableProperty(CollectionPrototype$1, TO_STRING_TAG$3, COLLECTION_NAME$1);
    }
    if (domIterables[COLLECTION_NAME$1]) for (var METHOD_NAME in es_array_iterator) {
      // some Chrome versions have non-configurable methods on DOMTokenList
      if (CollectionPrototype$1[METHOD_NAME] !== es_array_iterator[METHOD_NAME]) try {
        createNonEnumerableProperty(CollectionPrototype$1, METHOD_NAME, es_array_iterator[METHOD_NAME]);
      } catch (error) {
        CollectionPrototype$1[METHOD_NAME] = es_array_iterator[METHOD_NAME];
      }
    }
  }
}

var nativeGetOwnPropertyNames = objectGetOwnPropertyNames.f;

var toString$1 = {}.toString;

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
var f$6 = function getOwnPropertyNames(it) {
  return windowNames && toString$1.call(it) == '[object Window]'
    ? getWindowNames(it)
    : nativeGetOwnPropertyNames(toIndexedObject(it));
};

var objectGetOwnPropertyNamesExternal = {
	f: f$6
};

var f$7 = wellKnownSymbol;

var wellKnownSymbolWrapped = {
	f: f$7
};

var defineProperty$4 = objectDefineProperty.f;

var defineWellKnownSymbol = function (NAME) {
  var Symbol = path.Symbol || (path.Symbol = {});
  if (!has(Symbol, NAME)) defineProperty$4(Symbol, NAME, {
    value: wellKnownSymbolWrapped.f(NAME)
  });
};

var $forEach$1 = arrayIteration.forEach;

var HIDDEN = sharedKey('hidden');
var SYMBOL = 'Symbol';
var PROTOTYPE$1 = 'prototype';
var TO_PRIMITIVE = wellKnownSymbol('toPrimitive');
var setInternalState$4 = internalState.set;
var getInternalState$3 = internalState.getterFor(SYMBOL);
var ObjectPrototype$1 = Object[PROTOTYPE$1];
var $Symbol = global_1.Symbol;
var $stringify = getBuiltIn('JSON', 'stringify');
var nativeGetOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;
var nativeDefineProperty$1 = objectDefineProperty.f;
var nativeGetOwnPropertyNames$1 = objectGetOwnPropertyNamesExternal.f;
var nativePropertyIsEnumerable$1 = objectPropertyIsEnumerable.f;
var AllSymbols = shared('symbols');
var ObjectPrototypeSymbols = shared('op-symbols');
var StringToSymbolRegistry = shared('string-to-symbol-registry');
var SymbolToStringRegistry = shared('symbol-to-string-registry');
var WellKnownSymbolsStore$1 = shared('wks');
var QObject = global_1.QObject;
// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
var USE_SETTER = !QObject || !QObject[PROTOTYPE$1] || !QObject[PROTOTYPE$1].findChild;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDescriptor = descriptors && fails(function () {
  return objectCreate(nativeDefineProperty$1({}, 'a', {
    get: function () { return nativeDefineProperty$1(this, 'a', { value: 7 }).a; }
  })).a != 7;
}) ? function (O, P, Attributes) {
  var ObjectPrototypeDescriptor = nativeGetOwnPropertyDescriptor$1(ObjectPrototype$1, P);
  if (ObjectPrototypeDescriptor) delete ObjectPrototype$1[P];
  nativeDefineProperty$1(O, P, Attributes);
  if (ObjectPrototypeDescriptor && O !== ObjectPrototype$1) {
    nativeDefineProperty$1(ObjectPrototype$1, P, ObjectPrototypeDescriptor);
  }
} : nativeDefineProperty$1;

var wrap = function (tag, description) {
  var symbol = AllSymbols[tag] = objectCreate($Symbol[PROTOTYPE$1]);
  setInternalState$4(symbol, {
    type: SYMBOL,
    tag: tag,
    description: description
  });
  if (!descriptors) symbol.description = description;
  return symbol;
};

var isSymbol = useSymbolAsUid ? function (it) {
  return typeof it == 'symbol';
} : function (it) {
  return Object(it) instanceof $Symbol;
};

var $defineProperty = function defineProperty(O, P, Attributes) {
  if (O === ObjectPrototype$1) $defineProperty(ObjectPrototypeSymbols, P, Attributes);
  anObject(O);
  var key = toPrimitive(P, true);
  anObject(Attributes);
  if (has(AllSymbols, key)) {
    if (!Attributes.enumerable) {
      if (!has(O, HIDDEN)) nativeDefineProperty$1(O, HIDDEN, createPropertyDescriptor(1, {}));
      O[HIDDEN][key] = true;
    } else {
      if (has(O, HIDDEN) && O[HIDDEN][key]) O[HIDDEN][key] = false;
      Attributes = objectCreate(Attributes, { enumerable: createPropertyDescriptor(0, false) });
    } return setSymbolDescriptor(O, key, Attributes);
  } return nativeDefineProperty$1(O, key, Attributes);
};

var $defineProperties = function defineProperties(O, Properties) {
  anObject(O);
  var properties = toIndexedObject(Properties);
  var keys = objectKeys(properties).concat($getOwnPropertySymbols(properties));
  $forEach$1(keys, function (key) {
    if (!descriptors || $propertyIsEnumerable.call(properties, key)) $defineProperty(O, key, properties[key]);
  });
  return O;
};

var $create = function create(O, Properties) {
  return Properties === undefined ? objectCreate(O) : $defineProperties(objectCreate(O), Properties);
};

var $propertyIsEnumerable = function propertyIsEnumerable(V) {
  var P = toPrimitive(V, true);
  var enumerable = nativePropertyIsEnumerable$1.call(this, P);
  if (this === ObjectPrototype$1 && has(AllSymbols, P) && !has(ObjectPrototypeSymbols, P)) return false;
  return enumerable || !has(this, P) || !has(AllSymbols, P) || has(this, HIDDEN) && this[HIDDEN][P] ? enumerable : true;
};

var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(O, P) {
  var it = toIndexedObject(O);
  var key = toPrimitive(P, true);
  if (it === ObjectPrototype$1 && has(AllSymbols, key) && !has(ObjectPrototypeSymbols, key)) return;
  var descriptor = nativeGetOwnPropertyDescriptor$1(it, key);
  if (descriptor && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key])) {
    descriptor.enumerable = true;
  }
  return descriptor;
};

var $getOwnPropertyNames = function getOwnPropertyNames(O) {
  var names = nativeGetOwnPropertyNames$1(toIndexedObject(O));
  var result = [];
  $forEach$1(names, function (key) {
    if (!has(AllSymbols, key) && !has(hiddenKeys, key)) result.push(key);
  });
  return result;
};

var $getOwnPropertySymbols = function getOwnPropertySymbols(O) {
  var IS_OBJECT_PROTOTYPE = O === ObjectPrototype$1;
  var names = nativeGetOwnPropertyNames$1(IS_OBJECT_PROTOTYPE ? ObjectPrototypeSymbols : toIndexedObject(O));
  var result = [];
  $forEach$1(names, function (key) {
    if (has(AllSymbols, key) && (!IS_OBJECT_PROTOTYPE || has(ObjectPrototype$1, key))) {
      result.push(AllSymbols[key]);
    }
  });
  return result;
};

// `Symbol` constructor
// https://tc39.github.io/ecma262/#sec-symbol-constructor
if (!nativeSymbol) {
  $Symbol = function Symbol() {
    if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor');
    var description = !arguments.length || arguments[0] === undefined ? undefined : String(arguments[0]);
    var tag = uid(description);
    var setter = function (value) {
      if (this === ObjectPrototype$1) setter.call(ObjectPrototypeSymbols, value);
      if (has(this, HIDDEN) && has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
      setSymbolDescriptor(this, tag, createPropertyDescriptor(1, value));
    };
    if (descriptors && USE_SETTER) setSymbolDescriptor(ObjectPrototype$1, tag, { configurable: true, set: setter });
    return wrap(tag, description);
  };

  redefine($Symbol[PROTOTYPE$1], 'toString', function toString() {
    return getInternalState$3(this).tag;
  });

  redefine($Symbol, 'withoutSetter', function (description) {
    return wrap(uid(description), description);
  });

  objectPropertyIsEnumerable.f = $propertyIsEnumerable;
  objectDefineProperty.f = $defineProperty;
  objectGetOwnPropertyDescriptor.f = $getOwnPropertyDescriptor;
  objectGetOwnPropertyNames.f = objectGetOwnPropertyNamesExternal.f = $getOwnPropertyNames;
  objectGetOwnPropertySymbols.f = $getOwnPropertySymbols;

  wellKnownSymbolWrapped.f = function (name) {
    return wrap(wellKnownSymbol(name), name);
  };

  if (descriptors) {
    // https://github.com/tc39/proposal-Symbol-description
    nativeDefineProperty$1($Symbol[PROTOTYPE$1], 'description', {
      configurable: true,
      get: function description() {
        return getInternalState$3(this).description;
      }
    });
    {
      redefine(ObjectPrototype$1, 'propertyIsEnumerable', $propertyIsEnumerable, { unsafe: true });
    }
  }
}

_export({ global: true, wrap: true, forced: !nativeSymbol, sham: !nativeSymbol }, {
  Symbol: $Symbol
});

$forEach$1(objectKeys(WellKnownSymbolsStore$1), function (name) {
  defineWellKnownSymbol(name);
});

_export({ target: SYMBOL, stat: true, forced: !nativeSymbol }, {
  // `Symbol.for` method
  // https://tc39.github.io/ecma262/#sec-symbol.for
  'for': function (key) {
    var string = String(key);
    if (has(StringToSymbolRegistry, string)) return StringToSymbolRegistry[string];
    var symbol = $Symbol(string);
    StringToSymbolRegistry[string] = symbol;
    SymbolToStringRegistry[symbol] = string;
    return symbol;
  },
  // `Symbol.keyFor` method
  // https://tc39.github.io/ecma262/#sec-symbol.keyfor
  keyFor: function keyFor(sym) {
    if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol');
    if (has(SymbolToStringRegistry, sym)) return SymbolToStringRegistry[sym];
  },
  useSetter: function () { USE_SETTER = true; },
  useSimple: function () { USE_SETTER = false; }
});

_export({ target: 'Object', stat: true, forced: !nativeSymbol, sham: !descriptors }, {
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

_export({ target: 'Object', stat: true, forced: !nativeSymbol }, {
  // `Object.getOwnPropertyNames` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertynames
  getOwnPropertyNames: $getOwnPropertyNames,
  // `Object.getOwnPropertySymbols` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertysymbols
  getOwnPropertySymbols: $getOwnPropertySymbols
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
    var symbol = $Symbol();
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
      if (!isObject(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
      if (!isArray(replacer)) replacer = function (key, value) {
        if (typeof $replacer == 'function') value = $replacer.call(this, key, value);
        if (!isSymbol(value)) return value;
      };
      args[1] = replacer;
      return $stringify.apply(null, args);
    }
  });
}

// `Symbol.prototype[@@toPrimitive]` method
// https://tc39.github.io/ecma262/#sec-symbol.prototype-@@toprimitive
if (!$Symbol[PROTOTYPE$1][TO_PRIMITIVE]) {
  createNonEnumerableProperty($Symbol[PROTOTYPE$1], TO_PRIMITIVE, $Symbol[PROTOTYPE$1].valueOf);
}
// `Symbol.prototype[@@toStringTag]` property
// https://tc39.github.io/ecma262/#sec-symbol.prototype-@@tostringtag
setToStringTag($Symbol, SYMBOL);

hiddenKeys[HIDDEN] = true;

var defineProperty$5 = objectDefineProperty.f;


var NativeSymbol = global_1.Symbol;

if (descriptors && typeof NativeSymbol == 'function' && (!('description' in NativeSymbol.prototype) ||
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
  copyConstructorProperties(SymbolWrapper, NativeSymbol);
  var symbolPrototype = SymbolWrapper.prototype = NativeSymbol.prototype;
  symbolPrototype.constructor = SymbolWrapper;

  var symbolToString = symbolPrototype.toString;
  var native = String(NativeSymbol('test')) == 'Symbol(test)';
  var regexp = /^Symbol\((.*)\)[^)]+$/;
  defineProperty$5(symbolPrototype, 'description', {
    configurable: true,
    get: function description() {
      var symbol = isObject(this) ? this.valueOf() : this;
      var string = symbolToString.call(symbol);
      if (has(EmptyStringDescriptionStore, symbol)) return '';
      var desc = native ? string.slice(7, -1) : string.replace(regexp, '$1');
      return desc === '' ? undefined : desc;
    }
  });

  _export({ global: true, forced: true }, {
    Symbol: SymbolWrapper
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
addToUnscopables('fill');

var $findIndex = arrayIteration.findIndex;



var FIND_INDEX = 'findIndex';
var SKIPS_HOLES$1 = true;

var USES_TO_LENGTH$6 = arrayMethodUsesToLength(FIND_INDEX);

// Shouldn't skip holes
if (FIND_INDEX in []) Array(1)[FIND_INDEX](function () { SKIPS_HOLES$1 = false; });

// `Array.prototype.findIndex` method
// https://tc39.github.io/ecma262/#sec-array.prototype.findindex
_export({ target: 'Array', proto: true, forced: SKIPS_HOLES$1 || !USES_TO_LENGTH$6 }, {
  findIndex: function findIndex(callbackfn /* , that = undefined */) {
    return $findIndex(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables(FIND_INDEX);

var $indexOf = arrayIncludes.indexOf;



var nativeIndexOf = [].indexOf;

var NEGATIVE_ZERO = !!nativeIndexOf && 1 / [1].indexOf(1, -0) < 0;
var STRICT_METHOD$2 = arrayMethodIsStrict('indexOf');
var USES_TO_LENGTH$7 = arrayMethodUsesToLength('indexOf', { ACCESSORS: true, 1: 0 });

// `Array.prototype.indexOf` method
// https://tc39.github.io/ecma262/#sec-array.prototype.indexof
_export({ target: 'Array', proto: true, forced: NEGATIVE_ZERO || !STRICT_METHOD$2 || !USES_TO_LENGTH$7 }, {
  indexOf: function indexOf(searchElement /* , fromIndex = 0 */) {
    return NEGATIVE_ZERO
      // convert -0 to +0
      ? nativeIndexOf.apply(this, arguments) || 0
      : $indexOf(this, searchElement, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// `Map` constructor
// https://tc39.github.io/ecma262/#sec-map-objects
var es_map = collection('Map', function (init) {
  return function Map() { return init(this, arguments.length ? arguments[0] : undefined); };
}, collectionStrong);

// `RegExp.prototype.flags` getter implementation
// https://tc39.github.io/ecma262/#sec-get-regexp.prototype.flags
var regexpFlags = function () {
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

var TO_STRING = 'toString';
var RegExpPrototype = RegExp.prototype;
var nativeToString = RegExpPrototype[TO_STRING];

var NOT_GENERIC = fails(function () { return nativeToString.call({ source: 'a', flags: 'b' }) != '/a/b'; });
// FF44- RegExp#toString has a wrong name
var INCORRECT_NAME = nativeToString.name != TO_STRING;

// `RegExp.prototype.toString` method
// https://tc39.github.io/ecma262/#sec-regexp.prototype.tostring
if (NOT_GENERIC || INCORRECT_NAME) {
  redefine(RegExp.prototype, TO_STRING, function toString() {
    var R = anObject(this);
    var p = String(R.source);
    var rf = R.flags;
    var f = String(rf === undefined && R instanceof RegExp && !('flags' in RegExpPrototype) ? regexpFlags.call(R) : rf);
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
    this.attr('href', src, xlink);
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
  const name = capitalize(effect);
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
  const name = capitalize(child);
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
  const _class = Filter[capitalize(c)];
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
  const _class = Filter[capitalize(light)];
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
  }, {
    key: "addEvent",
    value: function addEvent(event, func) {
      // this.svg.on(event, func)
      // console.log(this.svg)
      this.events = [].concat(_toConsumableArray(this.events), [{
        event: event,
        func: func
      }]); // console.log(this.getNodeSize())
    } // TODO: add event listener (mouse events)
    // TODO: maybe before creation: pass config which to override mouse events

    /**
     * Creates the initial SVG element and adds hover effect
     */

  }, {
    key: "createSVGElement",
    value: function createSVGElement() {
      var _this2 = this;

      var svg = this.canvas.group().draggable(); // const svg = this.canvas.group()

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
    /**
     * Creates the actual SVG node
     * @param {Number} width the node width
     * @param {Number} height the node height
     */

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
    /**
     * Creates an icon with a given icon url or uses the default icon
     * @param {Number} size the width and height for the icon
     */

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
    /**
     * Creates the node label text limited to 2 lines
     * @param {Number} width the label width
     * @param {Number} height the label height
     * @param {String} textAlign how to align the label, default is center
     */

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
      fobj.dmove(this.config.borderStrokeWidth, this.config.borderStrokeWidth);
      return fobj;
    }
    /**
     *
     * @param {Object} config adds or overrides existing config data
     */

  }, {
    key: "setConfig",
    value: function setConfig(config) {
      this.config = _objectSpread2({}, this.config, {}, config);
    }
    /**
     * Returns the current config for a node
     */

  }, {
    key: "getConfig",
    value: function getConfig() {
      return this.config;
    }
    /**
     * Returns the current final X position
     */

  }, {
    key: "getFinalX",
    value: function getFinalX() {
      return this.finalX;
    }
    /**
     * Returns the current final Y position
     */

  }, {
    key: "getFinalY",
    value: function getFinalY() {
      return this.finalY;
    }
    /**
     * Sets the final X position
     * @param {Number} finalX the final X position
     */

  }, {
    key: "setFinalX",
    value: function setFinalX(finalX) {
      this.finalX = finalX;
    }
    /**
     * Sets the final Y position
     * @param {Number} finalY the final Y position
     */

  }, {
    key: "setFinalY",
    value: function setFinalY(finalY) {
      this.finalY = finalY;
    }
    /**
     * Sets the final rendering position
     * @param {Number} finalX the final X position
     * @param {Number} finalY the final Y position
     */

  }, {
    key: "setFinalXY",
    value: function setFinalXY(finalX, finalY) {
      this.finalX = finalX;
      this.finalY = finalY;
    }
    /**
     * Returns the current initial X position
     */

  }, {
    key: "getInitialX",
    value: function getInitialX() {
      return this.initialX;
    }
    /**
     * Returns the current final Y position
     */

  }, {
    key: "getInitialY",
    value: function getInitialY() {
      return this.initialY;
    }
    /**
     * Sets the initial X position
     * @param {Number} initialX the initial X position
     */

  }, {
    key: "setInitialX",
    value: function setInitialX(initialX) {
      this.initialX = initialX;
    }
    /**
     * Sets the initial Y position
     * @param {Number} initialY the initial Y position
     */

  }, {
    key: "setInitialY",
    value: function setInitialY(initialY) {
      this.initialY = initialY;
    }
    /**
    * Sets the initial rendering position
    * @param {Number} initialX the initial X position
    * @param {Number} initialY The initial Y position
    */

  }, {
    key: "setInitialXY",
    value: function setInitialXY(initialX, initialY) {
      this.initialX = initialX;
      this.initialY = initialY;
    }
    /**
     * Returns the current node width
     */

  }, {
    key: "getCurrentWidth",
    value: function getCurrentWidth() {
      return this.currentWidth;
    }
    /**
     * Returns the current node height
     */

  }, {
    key: "getCurrentHeight",
    value: function getCurrentHeight() {
      return this.currentHeight;
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
 * @example
 * const risk1 = NodeFactory.create(data.find(d => d.type === "risk"), canvas)
 * risk1.setInitialXY(200, 100)
 * risk1.renderAsMin()
 *
 * const risk2 = NodeFactory.create(data.find(d => d.type === "risk"), canvas)
 * risk2.setInitialXY(200, 400)
 * risk2.renderAsMax()
 *
 * setTimeout(() => risk1.transformToMax(200, 200), 500)
 * setTimeout(() => risk2.transformToMin(200, 350), 500)
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
  /**
   * Creates the risk details description
   * @private
   */


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
    /**
     * Renders a risk node in minimal version
     * @param {Number} [X=initialX] the initial X render position
     * @param {Number} [Y=initialY] the initial Y render position
     */

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
    /**
     * Renders a risk node in maximal version
     * @param {Number} [X=initialX] the initial X render position
     * @param {Number} [Y=initialY] the initial Y render position
     */

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
    /**
     * Transforms a node from minimal version to maximal version
     * @param {Number} [X=finalX] the final X render position
     * @param {Number} [Y=finaY] the final Y render position
     */

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
    /**
     * Transforms a node from maximal version to minimal version
     * @param {Number} [X=finalX] the final X render position
     * @param {Number} [Y=finaY] the final Y render position
     */

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
 * @example
 * const asset1 = NodeFactory.create(data.find(d => d.type === "asset"), canvas)
 * asset1.setInitialXY(200, 450)
 * asset1.renderAsMin()
 *
 * const asset2 = NodeFactory.create(data.find(d => d.type === "asset"), canvas)
 * asset2.setInitialXY(200, 150)
 * asset2.renderAsMax()
 *
 * setTimeout(() => asset1.transformToMax(200, 150), 500)
 * setTimeout(() => asset2.transformToMin(200, 450), 500)
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
  /**
   * Creates the asset details description
   * @private
   */


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
    /**
     * Renders an asset node in minimal version
     * @param {Number} [X=initialX] the initial X render position
     * @param {Number} [Y=initialY] the initial Y render position
     */

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
    /**
     * Renders an asset node in maximal version
     * @param {Number} [X=initialX] the initial X render position
     * @param {Number} [Y=initialY] the initial Y render position
     */

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
    /**
     * Transforms a node from minimal version to maximal version
     * @param {Number} [X=finalX] the final X render position
     * @param {Number} [Y=finaY] the final Y render position
     */

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
    /**
     * Transforms a node from maximal version to minimal version
     * @param {Number} [X=finalX] the final X render position
     * @param {Number} [Y=finaY] the final Y render position
     */

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

var defineProperty$6 = objectDefineProperty.f;

var FunctionPrototype = Function.prototype;
var FunctionPrototypeToString = FunctionPrototype.toString;
var nameRE = /^\s*function ([^ (]*)/;
var NAME = 'name';

// Function instances `.name` property
// https://tc39.github.io/ecma262/#sec-function-instances-name
if (descriptors && !(NAME in FunctionPrototype)) {
  defineProperty$6(FunctionPrototype, NAME, {
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
 * @example
 * const requirement1 = NodeFactory.create(data.find(d => d.type === "requirement"), canvas)
 * requirement1.setInitialXY(200, 100)
 * requirement1.renderAsMin()
 *
 * const requirement2 = NodeFactory.create(data.find(d => d.type === "requirement"), canvas)
 * requirement2.setInitialXY(200, 400)
 * requirement2.renderAsMax()
 *
 * setTimeout(() => requirement1.transformToMax(200, 200), 500)
 * setTimeout(() => requirement2.transformToMin(200, 350), 500)
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
  /**
   * Creates the requirements details description
   * @private
   */


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
    /**
     * Renders a requirement node in minimal version
     * @param {Number} [X=initialX] the initial X render position
     * @param {Number} [Y=initialY] the initial Y render position
     */

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
    /**
     * Renders a requirement node in maximal version
     * @param {Number} [X=initialX] the initial X render position
     * @param {Number} [Y=initialY] the initial Y render position
     */

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
    /**
     * Transforms a node from minimal version to maximal version
     * @param {Number} [X=finalX] the final X render position
     * @param {Number} [Y=finaY] the final Y render position
     */

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
    /**
     * Transforms a node from maximal version to minimal version
     * @param {Number} [X=finalX] the final X render position
     * @param {Number} [Y=finaY] the final Y render position
     */

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
  minWidth: 150,
  minHeight: 80,
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
  /**
   * Creates the custom details description
   * @private
   */


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
    /**
     * Renders a custom node in minimal version
     * @param {Number} X the initial X position
     * @param {Number} Y the initial Y position
     */

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

      if (this.config.nodeType === "path") {
        node.scale(0.001).center(X, Y).animate({
          duration: this.config.animationSpeed
        }).transform({
          scale: 1
        });
      } else {
        node.center(X, Y).animate({
          duration: this.config.animationSpeed
        }).width(this.config.minWidth).height(this.config.minHeight).dmove(-this.config.minWidth / 2, -this.config.minHeight / 2);
      }

      icon.size(0, 0).center(X, Y).attr({
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
    /**
     * Renders a custom node in maximal version
     * @param {Number} X the initial X position
     * @param {Number} Y the initial Y position
     */

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
    /**
     * Transforms a node from minimal version to maximal version
     * @param {Number} X the final X position
     * @param {Number} Y the final Y position
     */

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
    /**
     * Transforms a node from maximal version to minimal version
     * @param {Number} X the final X position
     * @param {Number} Y the final Y position
     */

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
 * @example
 * const control1 = NodeFactory.create(data.find(d => d.type === "control"), canvas)
 * control1.setInitialXY(700, 150)
 * control1.renderAsMin()
 *
 * const control2 = NodeFactory.create(data.find(d => d.type === "control"), canvas)
 * control2.setInitialXY(500, 450)
 * control2.renderAsMax()
 *
 * setTimeout(() => control1.transformToMax(500, 450), 500)
 * setTimeout(() => control2.transformToMin(700, 150), 500)
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
  /**
   * Creates the control details description
   * @private
   */


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
    /**
     * Renders a control node in minimal version
     * @param {Number} [X=initialX] the initial X render position
     * @param {Number} [Y=initialY] the initial Y render position
     */

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
    /**
     * Renders a control node in maximal version
     * @param {Number} [X=initialX] the initial X render position
     * @param {Number} [Y=initialY] the initial Y render position
     */

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
    /**
     * Transforms a node from minimal version to maximal version
     * @param {Number} [X=finalX] the final X render position
     * @param {Number} [Y=finaY] the final Y render position
     */

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
    /**
     * Transforms a node from maximal version to minimal version
     * @param {Number} [X=finalX] the final X render position
     * @param {Number} [Y=finaY] the final Y render position
     */

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

for(var key$1 in bezier) {
    if(bezier.hasOwnProperty(key$1)) {
        intersectionFunctions[key$1] = bezier[key$1];
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
      background.style.minWidth = "100px"; // uncomment this for more than one word

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
  color1: "#555",
  color2: "#555",
  blockarrowLineWidth: 3,
  blockarrowArrowWidth: 10,
  blockarrowArrowLength: 5,
  labelColor: "#222222",
  labelFontFamily: "Montserrat",
  labelFontSize: 16,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#ffffffcc"
};

var BoldEdge = /*#__PURE__*/function (_BaseEdge) {
  _inherits(BoldEdge, _BaseEdge);

  function BoldEdge(canvas, fromNode, toNode) {
    var _this;

    var customBoldEdgeConfig = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    _classCallCheck(this, BoldEdge);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(BoldEdge).call(this, canvas, fromNode, toNode));
    _this.config = _objectSpread2({}, BoldEdgeConfig, {}, customBoldEdgeConfig);

    _this.calculate();

    return _this;
  }
  /**
   * Creates the initial SVG element and adds hover effect
   */


  _createClass(BoldEdge, [{
    key: "createSVGElement",
    value: function createSVGElement() {
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
    key: "transformToFinal",
    value: function transformToFinal() {
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

      var c1 = getColor(this.fromNode);
      var c2 = getColor(this.toNode);
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
    key: "transformToInitial",
    value: function transformToInitial() {
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

var BaseLayout = /*#__PURE__*/function () {
  function BaseLayout() {
    _classCallCheck(this, BaseLayout);

    this.canvas = null;
    this.rawNodes = [];
    this.rawEdges = [];
    this.nodes = [];
    this.edges = [];
    this.currentLayoutWidth = 0;
    this.currentLayoutHeight = 0;
    this.info = {
      currentX: 0,
      currentY: 0,
      currentWidth: 0,
      currentHeight: 0,
      currentState: "expanded"
    };
    this.tree = null;
  }

  _createClass(BaseLayout, [{
    key: "getNodeData",
    value: function getNodeData() {
      return this.nodeData;
    }
  }, {
    key: "getEdgeData",
    value: function getEdgeData() {
      return this.edgeData;
    }
  }, {
    key: "createGridDataAsync",
    value: function () {
      var _createGridDataAsync = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(nodeData, edgeData) {
        var _this = this;

        var mapNodeIdsToUrl, nodeIdsToFetch, nodeFetchUrl, fetchedNodes;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this.nodeData = nodeData;
                this.edgeData = edgeData; // find children ids that we need to fetch

                mapNodeIdsToUrl = function mapNodeIdsToUrl(n) {
                  return "id=".concat(n.id, "&");
                };

                nodeIdsToFetch = nodeData.map(mapNodeIdsToUrl).join("").slice(0, -1);
                nodeFetchUrl = "".concat(this.config.databaseUrl, "/nodes?").concat(nodeIdsToFetch);
                _context.next = 7;
                return fetch(nodeFetchUrl).then(function (data) {
                  return data.json();
                });

              case 7:
                fetchedNodes = _context.sent;
                // create new nodes
                fetchedNodes.forEach(function (rawNode) {
                  var node;
                  if (rawNode.type === "risk") node = new RiskNode(rawNode, _this.canvas);
                  if (rawNode.type === "asset") node = new AssetNode(rawNode, _this.canvas);
                  if (rawNode.type === "custom") node = new CustomNode(rawNode, _this.canvas);
                  if (rawNode.type === "requirement") node = new RequirementNode(rawNode, _this.canvas);
                  if (rawNode.type === "control") node = new ControlNode(rawNode, _this.canvas); // sets the currently used rendering size

                  node.setNodeSize(_this.config.renderingSize); // node.addEvent("dblclick", () => { this.manageDataAsync(node) })

                  _this.nodes.push(node);
                }); // re-calculate and re-render layout

                this.calculateLayout();
                this.renderLayout();

              case 11:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function createGridDataAsync(_x, _x2) {
        return _createGridDataAsync.apply(this, arguments);
      }

      return createGridDataAsync;
    }()
  }, {
    key: "createContextualDataAsync",
    value: function () {
      var _createContextualDataAsync = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(nodeData, edgeData) {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                this.nodeData = nodeData;
                this.edgeData = edgeData; // load focus, children and parents
                // load attached node and attached risks

              case 2:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function createContextualDataAsync(_x3, _x4) {
        return _createContextualDataAsync.apply(this, arguments);
      }

      return createContextualDataAsync;
    }()
  }, {
    key: "createRadialDataAsync",
    value: function () {
      var _createRadialDataAsync = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(nodeData, edgeData) {
        var _this2 = this;

        var mapNodeIdsToUrl, nodeIdsToFetch, nodeFetchUrl, fetchedNodes, constructTree, tree, createEdges, requiredEdges, mapEdgeIdsToUrl, edgeIdsToFetch, edgeFetchUrl, fetchedEdges;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                // FIXME: ask: what if an edge dose not exist?
                this.nodeData = nodeData;
                this.edgeData = edgeData; // find children ids that we need to fetch

                mapNodeIdsToUrl = function mapNodeIdsToUrl(n) {
                  return "id=".concat(n.id, "&");
                };

                nodeIdsToFetch = nodeData.map(mapNodeIdsToUrl).join("").slice(0, -1);
                nodeFetchUrl = "".concat(this.config.databaseUrl, "/nodes?").concat(nodeIdsToFetch);
                _context3.next = 7;
                return fetch(nodeFetchUrl).then(function (data) {
                  return data.json();
                });

              case 7:
                fetchedNodes = _context3.sent;
                // create new nodes
                fetchedNodes.forEach(function (rawNode) {
                  var node;
                  if (rawNode.type === "risk") node = new RiskNode(rawNode, _this2.canvas);
                  if (rawNode.type === "asset") node = new AssetNode(rawNode, _this2.canvas);
                  if (rawNode.type === "custom") node = new CustomNode(rawNode, _this2.canvas);
                  if (rawNode.type === "requirement") node = new RequirementNode(rawNode, _this2.canvas);
                  if (rawNode.type === "control") node = new ControlNode(rawNode, _this2.canvas); // sets the currently used rendering size

                  node.setNodeSize(_this2.config.renderingSize);
                  node.addEvent("dblclick", function () {
                    _this2.manageDataAsync(node);
                  });

                  _this2.nodes.push(node);
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
                _context3.next = 18;
                return fetch(edgeFetchUrl).then(function (data) {
                  return data.json();
                });

              case 18:
                fetchedEdges = _context3.sent;
                // create new edges
                fetchedEdges.forEach(function (rawEdge) {
                  var fromNode = _this2.nodes.find(function (n) {
                    return n.id === rawEdge.startNodeId;
                  });

                  var toNode = _this2.nodes.find(function (n) {
                    return n.id === rawEdge.endNodeId;
                  });

                  var edge = null;
                  if (rawEdge.type === "solid") edge = new ThinEdge(_this2.canvas, fromNode, toNode, {
                    type: "solid"
                  });else if (rawEdge.type === "dashed") edge = new ThinEdge(_this2.canvas, fromNode, toNode, {
                    type: "dashed"
                  });else if (rawEdge.type === "bold") edge = new BoldEdge(_this2.canvas, fromNode, toNode, {
                    type: "bold"
                  });else edge = new ThinEdge(_this2.canvas, fromNode, toNode, {
                    type: "solid"
                  });
                  fromNode.addOutgoingEdge(edge);
                  toNode.addIncomingEdge(edge);
                  edge.setLabel(rawEdge.label);

                  _this2.edges.push(edge);
                }); // re-calculate and re-render layout

                this.calculateLayout();
                this.renderLayout();

              case 22:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function createRadialDataAsync(_x5, _x6) {
        return _createRadialDataAsync.apply(this, arguments);
      }

      return createRadialDataAsync;
    }() // eslint-disable-next-line class-methods-use-this

  }, {
    key: "manageDataAsync",
    value: function () {
      var _manageDataAsync = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(clickedNode) {
        var _this3 = this;

        var BFS, isAddOperation, requestedNodes, existingNodes, mapNodeIdsToUrl, nodeIdsToFetch, nodeFetchUrl, fetchedNodes, requiredEdges, mapEdgeIdsToUrl, edgeIdsToFetch, edgeFetchUrl, fetchedEdges, removedNodes, nodesToRemove, X, Y, edgesToRemove, edgesToBeUpdated;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
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
                  _context4.next = 3;
                  break;
                }

                return _context4.abrupt("return");

              case 3:
                isAddOperation = clickedNode.children.map(function (child) {
                  return child.svg;
                }).length === 0; // add new data

                if (!isAddOperation) {
                  _context4.next = 28;
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
                _context4.next = 15;
                return fetch(nodeFetchUrl).then(function (data) {
                  return data.json();
                });

              case 15:
                fetchedNodes = _context4.sent;
                // create new children nodes
                fetchedNodes.forEach(function (rawNode) {
                  var node;
                  if (rawNode.type === "risk") node = new RiskNode(rawNode, _this3.canvas);
                  if (rawNode.type === "asset") node = new AssetNode(rawNode, _this3.canvas);
                  if (rawNode.type === "custom") node = new CustomNode(rawNode, _this3.canvas);
                  if (rawNode.type === "requirement") node = new RequirementNode(rawNode, _this3.canvas);
                  if (rawNode.type === "control") node = new ControlNode(rawNode, _this3.canvas); // sets the currently used rendering size

                  node.setNodeSize(_this3.config.renderingSize);
                  node.addEvent("dblclick", function () {
                    _this3.manageDataAsync(node);
                  });

                  _this3.nodes.push(node);
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
                _context4.next = 24;
                return fetch(edgeFetchUrl).then(function (data) {
                  return data.json();
                });

              case 24:
                fetchedEdges = _context4.sent;
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
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function manageDataAsync(_x7) {
        return _manageDataAsync.apply(this, arguments);
      }

      return manageDataAsync;
    }()
  }, {
    key: "removeLayout",
    value: function removeLayout() {
      this.nodes.forEach(function (node) {
        node.removeNode();
      });
      this.edges.forEach(function (edge) {
        edge.removeEdge();
      });
      this.leafs.forEach(function (leaf) {
        leaf.removeLeaf();
      });
    }
  }, {
    key: "setConfig",
    value: function setConfig(config) {
      this.config = _objectSpread2({}, this.config, {}, config);
    }
  }, {
    key: "setCanvas",
    value: function setCanvas(canvas) {
      this.canvas = canvas.nested();
    }
  }, {
    key: "setRawNodes",
    value: function setRawNodes(rawNodes) {
      this.rawNodes = _toConsumableArray(rawNodes);
    }
  }, {
    key: "setRawEdges",
    value: function setRawEdges(rawEdges) {
      this.rawEdges = _toConsumableArray(rawEdges);
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
  }]);

  return BaseLayout;
}();

var GridExpanderConfig = {
  // large representation (for calculations)
  maxWidth: 130,
  maxHeight: 40,
  // small representation (for calculations)
  minWidth: 130,
  minHeight: 40,
  // actual text size
  width: 130,
  height: 40,
  // node
  offset: 8,
  animationSpeed: 300,
  borderRadius: 5,
  borderStrokeWidth: 0,
  borderStrokeColor: "#aaa",
  borderStrokeDasharray: "0",
  backgroundColor: "#ffffff",
  // text
  labelColor: "#84a8f2",
  labelFontFamily: "Montserrat",
  labelFontSize: 12,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#fff"
};

var GridExpander = /*#__PURE__*/function () {
  function GridExpander(canvas, renderingSize) {
    _classCallCheck(this, GridExpander);

    this.svg = null;
    this.canvas = canvas;
    this.config = _objectSpread2({}, GridExpanderConfig, {
      renderingSize: renderingSize
    });
    this.isShowLess = false;
    this.expandX = 0;
    this.expandY = 0;
    this.collapseX = 0;
    this.collapseY = 0;
    this.prevNode = null;
  }

  _createClass(GridExpander, [{
    key: "setPrevNode",
    value: function setPrevNode(prevNode) {
      this.prevNode = prevNode;
    }
  }, {
    key: "isRendered",
    value: function isRendered() {
      return this.svg !== null;
    }
  }, {
    key: "renderExpander",
    value: function renderExpander(innerText, funcExp, funcLess) {
      var svg = this.canvas.group();
      svg.css("cursor", "pointer");
      svg.id("gridExpander");
      var X = this.expandX;
      var Y = this.expandY;
      this.innerText = innerText;
      this.funcExp = funcExp;
      this.funcLess = funcLess;
      var w = this.config.width;
      var h = this.config.height;
      var textMore = this.canvas.foreignObject(w, h);
      var background = document.createElement("div");
      var label = document.createElement("p");
      label.innerText = "".concat(innerText);
      label.style.color = this.config.labelColor;
      label.style.textAlign = "center";
      label.style.padding = "".concat(this.config.offset / 2, "px");
      label.style.background = this.config.labelBackground;
      label.style.fontSize = "".concat(this.config.labelFontSize, "px");
      label.style.fontFamily = this.config.labelFontFamily;
      label.style.fontWeight = this.config.labelFontWeight;
      label.style.fontStyle = this.config.labelFontStyle;
      background.appendChild(label);
      textMore.add(background);
      textMore.height(background.clientHeight);
      var textLess = this.canvas.foreignObject(w, h);
      var backgroundLess = document.createElement("div");
      var labelLess = document.createElement("p");
      labelLess.innerText = "Show Less";
      labelLess.style.color = this.config.labelColor;
      labelLess.style.textAlign = "center";
      labelLess.style.padding = "".concat(this.config.offset / 2, "px");
      labelLess.style.background = this.config.labelBackground;
      labelLess.style.fontSize = "".concat(this.config.labelFontSize, "px");
      labelLess.style.fontFamily = this.config.labelFontFamily;
      labelLess.style.fontWeight = this.config.labelFontWeight;
      labelLess.style.fontStyle = this.config.labelFontStyle;
      backgroundLess.appendChild(labelLess);
      textLess.add(backgroundLess);
      textLess.height(backgroundLess.clientHeight);
      svg.add(textMore);
      svg.add(textLess);
      svg.center(X, Y);
      textLess.center(X, Y).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 0
      }).transform({
        scale: 1
      });
      textMore.center(X, Y).scale(0.001).attr({
        opacity: 0
      }).animate({
        duration: this.config.animationSpeed
      }).attr({
        opacity: 1
      }).transform({
        scale: 1
      });
      svg.on("click", this.funcExp);
      this.svg = svg;
      this.isExpanded = false;
    }
  }, {
    key: "transform",
    value: function transform() {
      if (this.isExpanded) {
        // console.log("to col")
        this.isExpanded = false;
        this.svg.on("click", this.funcExp);
        this.svg.off("click", this.funcLess);
        this.svg.get(0).attr({
          opacity: 1
        });
        this.svg.get(1).attr({
          opacity: 0
        });
        this.svg.animate({
          duration: this.config.animationSpeed
        }).transform({
          position: [this.expandX, this.expandY]
        });
      } else {
        // console.log("to exp")
        this.isExpanded = true;
        this.svg.off("click", this.funcExp);
        this.svg.on("click", this.funcLess);
        this.svg.get(0).attr({
          opacity: 0
        });
        this.svg.get(1).attr({
          opacity: 1
        });
        this.svg.animate({
          duration: this.config.animationSpeed
        }).transform({
          position: [this.collapseX, this.collapseY]
        });
      }
    }
  }, {
    key: "removeNode",
    value: function removeNode() {
      var _this = this;

      if (this.svg !== null) {
        this.svg.animate({
          duration: this.config.animationSpeed
        }).transform({
          scale: 0.001
        }).after(function () {
          _this.svg.remove();

          _this.svg = null;
        });
      }
    }
  }, {
    key: "addEvent",
    value: function addEvent(func) {
      this.svg.on("click", func);
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
    key: "getFinalX",
    value: function getFinalX() {
      return this.finalX;
    }
  }, {
    key: "getFinalY",
    value: function getFinalY() {
      return this.finalY;
    }
  }]);

  return GridExpander;
}();

var GridConfig = {
  // limit layout width
  maxLayoutWidth: 600,
  // how many nodes shall be rendered before showing "load more more"
  limitedTo: 1,
  // where to translate a given layout
  translateX: 0,
  translateY: 0,
  // layout animation speed for all nodes and edges
  animationSpeed: 300,
  // hide all other layouts and center selected one
  hideOtherLayouts: false,
  // TODO:
  // node spacing
  spacing: 32,
  // how to render all nodes
  renderingSize: "min" // min max

};

var GridLayout = /*#__PURE__*/function (_BaseLayout) {
  _inherits(GridLayout, _BaseLayout);

  function GridLayout() {
    var _this;

    var customGridConfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, GridLayout);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(GridLayout).call(this));
    _this.config = _objectSpread2({}, GridConfig, {}, customGridConfig);
    _this.gridExpander = null;
    return _this;
  }

  _createClass(GridLayout, [{
    key: "calculateLayout",
    value: function calculateLayout() {
      var _this2 = this;

      // TODO: ask: grid can query all the data at once, but only render a limited amount?
      var currentWidth = 0;
      var currentHeight = 0;
      var rowMaxHeight = 0;

      if (this.gridExpander === null) {
        this.gridExpander = new GridExpander(this.canvas, this.config.renderingSize);
      } // add expander to nodes


      this.nodes = [].concat(_toConsumableArray(this.nodes), [this.gridExpander]);
      this.nodes.forEach(function (node, i) {
        var w = _this2.config.renderingSize === "max" ? node.config.maxWidth : node.config.minWidth;
        var h = _this2.config.renderingSize === "max" ? node.config.maxHeight : node.config.minHeight;
        rowMaxHeight = Math.max(h, rowMaxHeight); // calculate initial position

        var x = w / 2 + _this2.config.spacing + _this2.config.translateX;
        var y = h / 2 + _this2.config.spacing + _this2.config.translateY; // check if new element position is larger than the available space

        if (currentWidth > _this2.config.maxLayoutWidth) {
          currentWidth = 0;
          currentHeight += rowMaxHeight + _this2.config.spacing;
        }

        node.setFinalX(currentWidth + x);
        currentWidth += w + _this2.config.spacing;
        node.setFinalY(currentHeight + y);

        if (i === _this2.config.limitedTo) {
          _this2.gridExpander.expandX = node.getFinalX();
          _this2.gridExpander.expandY = node.getFinalY();

          _this2.gridExpander.setPrevNode(_this2.nodes[i - 1]);
        }

        if (i === _this2.nodes.length - 1) {
          _this2.gridExpander.collapseX = node.getFinalX();
          _this2.gridExpander.collapseY = node.getFinalY();

          _this2.gridExpander.setPrevNode(_this2.nodes[i - 1]);
        }
      });
    }
  }, {
    key: "renderLayout",
    value: function renderLayout() {
      var _this3 = this;

      this.nodes.forEach(function (node, i) {
        // renders a limited amount of nodes
        if (i < _this3.config.limitedTo && !node.isRendered()) {
          if (_this3.config.renderingSize === "max") {
            if (node.svg === null) node.renderAsMax(node.getFinalX(), node.getFinalY());
          } else if (_this3.config.renderingSize === "min") {
            if (node.svg === null) node.renderAsMin(node.getFinalX(), node.getFinalY());
          }
        }

        if (i >= _this3.config.limitedTo && !(node instanceof GridExpander) && node.isRendered()) {
          node.removeNode();
        } // renders the expand button


        if (node instanceof GridExpander && node.svg === null) {
          var funcExp = function funcExp() {
            _this3.gridExpander.transform();

            _this3.config = _objectSpread2({}, _this3.config, {
              limitedTo: _this3.nodes.length,
              prevLimitedTo: _this3.config.limitedTo
            });

            _this3.renderLayout();
          };

          var funcLess = function funcLess() {
            _this3.gridExpander.transform();

            _this3.config = _objectSpread2({}, _this3.config, {
              limitedTo: _this3.config.prevLimitedTo,
              prevLimitedTo: undefined
            });

            _this3.renderLayout();
          };

          node.renderExpander("Show ".concat(_this3.nodes.length - _this3.config.limitedTo, " More"), funcExp, funcLess);
        }
      });
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
      });
      this.nodes.forEach(function (node) {
        node.transformToFinalPosition();
      });
      this.edges.forEach(function (edge) {
        if (edge.svg === null) {
          edge.render(_this3.centerX, _this3.centerY);
        }
      });
      this.edges.forEach(function (edge) {
        edge.transformToFinalPosition();
      });
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

var ContextualConfig = {
  // limit width and size
  maxLayoutWidth: 1000,
  maxLayoutHeight: window.innerHeight - 10,
  // where to translate a given layout
  translateX: 0,
  translateY: 0,
  // layout animation speed for all nodes and edges
  animationSpeed: 300,
  // hide all other layouts and center selected one
  hideOtherLayouts: false,
  // TODO:
  // spacing between nodes
  spacing: 32,
  // how to render all nodes
  renderingSize: "min",
  // min max
  // limit how many nodes are displayed without a container
  containerLimit: 3,
  // container config
  containderBorderRadius: 5,
  containerBorderStrokeColor: "#555555",
  containerBorderStrokeWidth: 2,
  containerBackgroundColor: "#fff"
};

var ContextualLayout = /*#__PURE__*/function (_BaseLayout) {
  _inherits(ContextualLayout, _BaseLayout);

  function ContextualLayout() {
    var _this;

    var customContextualConfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, ContextualLayout);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ContextualLayout).call(this));
    _this.config = _objectSpread2({}, ContextualConfig, {}, customContextualConfig);
    return _this;
  }

  _createClass(ContextualLayout, [{
    key: "calculateLayout",
    value: function calculateLayout() {
      console.log(this.nodes);
    }
  }, {
    key: "renderLayout",
    value: function renderLayout() {}
  }]);

  return ContextualLayout;
}(BaseLayout);

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
 * @example
 * const visualization = new Visualization()
 * const { canvas } = visualization
 */

var Visualization = /*#__PURE__*/function () {
  function Visualization(config) {
    _classCallCheck(this, Visualization);

    // TODO: this constructor should receive custom overrides for all nodes, edges and layouts
    // create the main canvas element dom element
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
    this.config = config;
  }

  _createClass(Visualization, [{
    key: "render",
    value: function render(initialGraphData, layout) {
      layout.setCanvas(this.canvas);
      layout.setConfig({
        databaseUrl: this.config.databaseUrl
      });

      if (layout instanceof RadialLayout) {
        layout.createRadialDataAsync(initialGraphData.nodes, initialGraphData.edges);
      }

      if (layout instanceof GridLayout) {
        layout.createGridDataAsync(initialGraphData.nodes, initialGraphData.edges);
      }

      if (layout instanceof TreeLayout) {
        layout.createRadialDataAsync(initialGraphData.nodes, initialGraphData.edges);
      }

      if (layout instanceof ContextualLayout) {
        layout.createContextualDataAsync(initialGraphData.nodes, initialGraphData.edges);
      }

      return layout;
    }
  }, {
    key: "transform",
    value: function () {
      var _transform = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(currentLayout, newLayout) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
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

                currentLayout.removeLayout(); // calculate and render layout
                // newLayout.calculateLayout() // TODO: root isn't transformed
                // newLayout.renderLayout()
                // console.log(newLayout)

              case 7:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function transform(_x, _x2) {
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
     * @example
     * visualization.setZoom(2, {x: 100, y: 100})
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
 *
 * @example
 * // creates an asset node
 * const asset = NodeFactory.create(data, canvas)
 * asset.renderAsMin()
 * setTimeout(() => asset.transformToMax(), 500)
 *
 */

var NodeFactory = /*#__PURE__*/function () {
  function NodeFactory() {
    _classCallCheck(this, NodeFactory);
  }

  _createClass(NodeFactory, null, [{
    key: "create",
    value: function create(data, canvas) {
      var config = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var node;

      if (data.type === "asset") {
        node = new AssetNode(data, canvas, config);
      } else if (data.type === "control") {
        node = new ControlNode(data, canvas, config);
      } else if (data.type === "risk") {
        node = new RiskNode(data, canvas, config);
      } else if (data.type === "requirement") {
        node = new RequirementNode(data, canvas, config);
      } else {
        node = new CustomNode(data, canvas, config);
      }

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

var Node = /*#__PURE__*/function () {
  function Node(id) {
    _classCallCheck(this, Node);

    this.id = id;
    this.neighbors = [];
    this.edges = [];
  }

  _createClass(Node, [{
    key: "addNeighbor",
    value: function addNeighbor(node) {
      this.neighbors.push(node);
    }
  }, {
    key: "addEdge",
    value: function addEdge(edge) {
      this.edges.push(edge);
    }
  }, {
    key: "getNeighbors",
    value: function getNeighbors() {
      return this.neighbors;
    }
  }]);

  return Node;
}();

var Edge = /*#__PURE__*/function () {
  function Edge(startNodeId, endNodeId, id) {
    _classCallCheck(this, Edge);

    // this.id = id || undefined
    // this.id = `edge#${node1.id}_${node2.id}`
    this.startNodeId = startNodeId;
    this.endNodeId = endNodeId;
  }

  _createClass(Edge, [{
    key: "getKey",
    value: function getKey() {
      return "".concat(this.startNodeId, "_").concat(this.endNodeId);
    }
  }]);

  return Edge;
}();

var Graph = /*#__PURE__*/function () {
  function Graph() {
    _classCallCheck(this, Graph);

    this.nodes = [];
    this.edges = [];
  }

  _createClass(Graph, [{
    key: "addNode",
    value: function addNode(id) {
      this.nodes.push(new Node(id));
    }
  }, {
    key: "addEdge",
    value: function addEdge(startNodeId, endNodeId) {
      var startNode = this.nodes.find(function (n) {
        return n.id === startNodeId;
      });
      var endNode = this.nodes.find(function (n) {
        return n.id === endNodeId;
      });
      startNode.addNeighbor(endNode);
      endNode.addNeighbor(startNode);
      var edge = new Edge(startNodeId, endNodeId);
      startNode.addEdge(edge);
      endNode.addEdge(edge);
      this.edges.push(edge);
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

export { ContextualLayout, EdgeFactory, Graph, GridLayout, NodeFactory, RadialLayout, TreeLayout, Visualization };
//# sourceMappingURL=graphVisualization.js.map
