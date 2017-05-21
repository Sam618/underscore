/**
 * Underscore.js 1.8.3 研究
 * 参考：
 *     http://www.css88.com/doc/underscore/
 */

( function () {
  // 设置 self 和 window 对象没有任何区别
  // 在浏览器 JavaScript 中，通常 window 是全局对象，self 对象指当前窗口对象，如果在框架中就指向框架的全局对象；而 Node.js 中的全局对象是 global。
  var root = typeof self === 'object' && self.self === self && self ||
            typeof global === 'object' && global.global === global && global ||
            this ||
            {};

  // 保存原先的快捷变量
  var previousUnderscore = root._;

  // 保存基本类型外的三种类型
  var ArrayProto = Array.prototype,
      ObjProto = Object.prototype,
      SymbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

  // 保存常用方法的快捷变量
  var push = ArrayProto.push,
      slice = ArrayProto.slice,
      toString = ObjProto.toString,
      hasOwnProperty = ObjProto.hasOwnProperty;

  // 保存原生方法变量
  var nativeIsArray = Array.isArray,
      nativeKeys = Object.keys,
      nativeCreate = Object.create;

  // 创建一个空的构造函数以便转换时使用
  var Ctor = function () {};

  // _ 构造函数
  var _ = function ( obj ) {
    // obj 在 _ 的原型链上，obj 是通过 new _() 构建出来的实例
    if ( obj instanceof _ ) {
      return obj;
    }

    // 通过 _() 函数调用的方式使用 _ 构造函数，返回通过
    if ( !( this instanceof _ ) ) {
      return new _( obj );
    }

    // 创建一个安全引用的下划线对象以供下面使用
    this._wrapped = obj;
  };

  // 'nodeType' 被检查以确保 'module' 和 'exports' 不是 HTML 元素
  if ( typeof exports !== 'undefined' && !exports.nodeType ) {
    // 导出 Node.js 的 Underscore 对象，其旧模块 API 具有向后兼容性
    if ( typeof module !== 'undefined' && !module.nodeType && module.exports ) {
      exports = module.exports = _;
    }

    exports._ = _;

  // 如果我们在浏览器中，添加 '_' 作为全局对象
  } else {
    root._ = _;
  }

  // Underscore 版本
  _.VERSION = '1.8.3';

  // 内部函数返回一个有效的传入的回调函数，以便在其他 Underscore 函数中重复应用，类似于柯里化
  var optimizeCb = function ( func, context, argCount ) {
    if ( context === void 0 ) {
      return func;
    }

    switch ( argCount ) {
      case 1:
        return function ( value ) {
          return func.call( context, value );
        };

      case null:
      case 3:
        return function ( value, index, collection ) {
          return func.call( context, value, index, collection );
        };

      case 4:
        return function ( accumulator, value, index, collection ) {
          return func.call( context, accumulator, value, index, collection );
        };
    }

    return function () {
      return func.apply( context, arguments );
    };
  };

  var builtinIteratee;

  // 一个重要的内部函数用来生成可应用到集合中每个元素的回调， 返回想要的结果 - 无论是等式，任意回调，属性匹配，或属性访问
  var cb = function ( value, context, argCount ) {
    if ( _.iteratee !== builtinIteratee ) {
      return _.iteratee( value, context );
    }

    // 第一个参数为空，返回管子函数，函数的返回值就是 value
    if ( value == null ) {
      return _.identity;
    }

    // 第一个参数为函数，返回柯里化的回调
    if ( _.isFunction( value ) ) {
      return optimizeCb( value, context, argCount );
    }

    // 第一个参数是对象并且不是数组
    if ( _.isObject( value ) && !_.isArray( value ) ) {
      // 返回一个断言函数，这个函数会给你一个断言可以用来辨别给定的对象是否匹配 value 指定键/值属性
      return _.matcher( value );
    }

    // 返回一个函数，这个函数返回任何传入的对象的 key 属性
    return _.property( value );
  };

  // 隐藏 argCount 的细节
  _.iteratee = builtinIteratee = function ( value, context ) {
    return cb( value, context, Infinity );
  };

  // 类似 ES6 的 rest 参数
  // 参考：
  //     https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/Rest_parameters
  //     http://www.jianshu.com/p/938ba29667c3
  var restArgs = function ( func, startIndex ) {
    // startIndex 代表从第几个参数开始是剩余参数
    // func.length 的值是函数声明时声明的形参个数
    // startIndex 参数不存在就设置最后一个参数保存所有剩余参数
    // 否则再通过 '+' 一元加运算符转换成数字
    startIndex = startIndex == null ? func.length - 1 : +startIndex;

    return function () {
      // 得到剩余参数的长度
      // 运用数学对象的 max 方法保证有一个不为负数的长度
      var length = Math.max( arguments.length - startIndex, 0 ),
          // Array === new Array，猜测进行了优化处理和上文的 '_' 构造器类似
          rest = Array( length ),
          index = 0;

      // 得到剩余参数
      for ( ; index < length; index++ ) {
        // arguments 类数组从 0 开始
        rest[ index ] = arguments[ index + startIndex ];
      }

      // 为了性能把最常用的参数个数先写出
      switch ( startIndex ) {
        case 0:
          return func.call( this, rest );

        case 1:
          return func.call( this, arguments[ 0 ], rest );

        case 2:
          return func.call( this, arguments[ 0 ], arguments[ 1 ], rest );
      }

      // 当 startIndex 更大时
      // 创建一个数组，数组的最后一个保存剩余参数的数组
      var args = Array( startIndex + 1 );

      // 遍历 arguments 数组，把 startIndex 之前的参数赋值给相对应的数组项
      for ( index = 0; index < startIndex; index++ ) {
        args[ index ] = arguments[ index ];
      }

      // 保存剩余参数数组
      args[ startIndex ] = rest;

      // var test = restArgs( function ( a, b, c, d, e ) {}, 3 );
      // test( 1, 2, 3, 4, 5 );
      // args 数组保存值示例：
      // 0: 1
      // 1: 2
      // 2: 3
      // 3: [ 0: 4, 1: 5 ]

      // 通过上面的示例来说明，d 是一个数组保存剩余参数
      return func.apply( this, args );
    };
  };

  // 继承方法
  var baseCreate = function ( prototype ) {
    // 不是对象，就返回一个空对象
    if ( !_.isObject( prototype ) ) {
      return {};
    }

    // 原生继承方法存在，就使用它创建继承对象
    if ( nativeCreate ) {
      return nativeCreate( prototype );
    }

    // 下面是模拟原生继承方法
    Ctor.prototype = prototype;

    var result = new Ctor;

    Ctor.prototype = null;

    return result;
  };

  // 返回取值函数，这是很巧妙的一个函数，比如我要向获取 length 属性，通过使用这个函数，就可以创建一个获取长度的函数，如下面的 getLength 函数一样
  var shallowProperty = function ( key ) {
    return function ( obj ) {
      // void 0 === undefined，underfined 是可以赋值的，为了安全使用 void 0，不会被改写
      return obj == null ? void 0 : obj[ key ];
    };
  };

  // 返回属性的值，适用于 path 为数组的情况
  var deepGet = function ( obj, path ) {
    var length = path.length;

    for ( var i = 0; i < length; i++ ) {
      if ( obj == null ) {
        return void 0;
      }

      obj = obj[ path[ i ] ];
    }

    return length ? obj : void 0;
  };

  // length 属性超过这个最大数，会有 BUG
  var MAX_ARRAY_INDEX = Math.pow( 2, 53 ) - 1,
      getLength = shallowProperty( 'length' );

  // 类数组判断
  var isArrayLike = function ( collection ) {
    // 获取长度
    var length = getLength( collection );

    // 是数字，大于等于 0 并小于最大数
    return typeof length === 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // 集合

  // 迭代器
  // 如果传递了 context，就把 iteratee 绑定到 context 身上
  _.each = _.forEach = function ( obj, iteratee, context ) {
    // 通过是否传入 context，来返回函数
    iteratee = optimizeCb( iteratee, context );

    var i, length;

    // 类数组
    if ( isArrayLike( obj ) ) {
      for ( i = 0, length = obj.length; i < length; i++ ) {
        iteratee( obj[ i ], i, obj );
      }

    // 对象
    } else {
      // 得到对象可枚举属性的数组
      var keys = _.keys( obj );

      for ( i = 0, length = keys.length; i < length; i++ ) {
        iteratee( obj[ key[ i ] ], keys[ i ], obj );
      }
    }
  };

  // 映射列表中的每个值，通过处理返回新的数组
  _.map = _.collect = function ( obj, iteratee, context ) {
    // 通过 cb 函数转换出一个函数
    iteratee = cb( iteratee, context );

    // 当 keys 是对象不是类数组时，执行 _.keys 方法返回对象可枚举属性的数组
    var keys = !isArrayLike( obj ) && _.keys( obj ),
        length = ( keys || obj ).length,
        // 创建将要返回的数组
        results = Array( length );

    for ( var index = 0; index < length; index++ ) {
      // keys 数组存在，说明是对象，取得属性
      var currentKey = keys ? keys[ index ] : index;

      // 数组保存每个处理过的值
      results[ index ] = iteratee( obj[ currentKey ], currentKey, obj );
    }

    return results;
  };

  // 创建左右归结函数，dir 只能是 1 或 -1
  var createReduce = function ( dir ) {
    var reducer = function ( obj, iteratee, memo, initial ) {
      // 当 keys 是对象不是类数组时，执行 _.keys 方法返回对象可枚举属性的数组
      var keys = !isArrayLike( obj ) && _.keys( obj ),
          length = ( keys || obj ).length,
          // dir 为正数 index 等于 0，否则等于数组最后一项的下标
          index = dir > 0 ? 0 : length - 1;

      // 函数传入参数小于 3，也就说 memo 参数没有传
      if ( !initial ) {
        // memo 就等于列表第一个值或者最后一个值
        memo = obj[ keys ? keys[ index ] : index ];
        // index 等于 1 或者列表最后一项的前一个下标
        index += dir;
      }

      // 迭代列表，index 在 0 和 列表长度之间，dir 只能为 1 或 -1
      for ( ; index >= 0 && index < length; index += dir ) {
        // keys 数组存在，说明是对象，取得属性
        var currentKey = keys ? keys[ index ] : index;

        // memo 一直在变化，等于上一个处理的结果
        memo = iteratee( memo, obj[ currentKey ], currentKey, obj );
      }

      return memo;
    };

    return function ( obj, iteratee, memo, context ) {
      var initial = arguments.length >= 3;

      // optimizeCb 函数返回原始函数或参数有四个的函数，这取决于 context 是否传入
      return reducer( obj, optimizeCb( iteratee, context, 4 ), memo, initial );
    };
  };


  // 把列表中的数值归结为一个单一的数值
  _.reduce = _.foldl = _.inject = createReduce( 1 );

  // reduceRight 方法与 reduce 方法相反，从右开始归结
  _.reduceRight = _.folder = createReduce( -1 );

  // 遍历列表中的每个值，返回第一个通过回调函数的值
  _.find = _.detect = function ( obj, predicate, context ) {
    // 类数组就通过 _.findIndex 方法遍历，对象通过 _.findKey 方法遍历
    var keyFinder = isArrayLike( obj ) ? _.findIndex : _.findKey,
        key = keyFinder( obj, predicate, context );

    // 下标存在就返回这个值
    if ( key !== void 0 && key !== -1 ) {
      return obj[ key ];
    }
  };
} )();
