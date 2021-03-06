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

    // 通过 _() 函数调用的方式使用 _ 构造函数，返回通过 new _() 构造的实例
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

  // 深度返回属性的值，适用于 path 为类数组的情况
  // console.log( deepGet( { name: { test: 2 }, age: 40 }, [ 'name', 'test' ] ) );
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

  // 返回传入数组的值为真的数组
  _.filter = _.select = function ( obj, predicate, context ) {
    var results = [];

    predicate = cb( predicate, context );
    // 通过 _.each 方法遍历数组
    _.each( obj, function ( value, index, list ) {
      // 执行传入的判断条件，为真，就把值放入将要返回的数组中
      if ( predicate( value, index, list ) ) {
        results.push( value );
      }
    } );

    return results; 
  };

  // 返回与 _.filter 相反的数组，也就是返回值为假的数组
  _.reject = function ( obj, predicate, context ) {
    // cb( predicate ) 返回的就是 predicate 函数
    // _.negate 方法逆转 predicate 函数的判断，把假变成真值
    return _.filter( obj, _.negate( cb( predicate ) ), context );
  };

  // 集合全部为真值，返回真
  _.every = _.all = function ( obj, predicate, context ) {
    predicate = cb( predicate, context );

    var keys = !isArrayLike( obj ) && _.keys( obj ),
        length = ( keys || obj ).length,
        index,
        currentKey;

    for ( index = 0; index < length; index++ ) {
      currentKey = keys ? keys[ index ] : index;

      if ( !predicate( obj[ currentKey ], currentKey, obj ) ) {
        return false;
      }
    }

    return true;
  };

  // 集合中有任何一项符合条件，就返回真
  _.some = _.any = function ( obj, predicate, context ) {
    predicate = cb( predicate, context );

    var keys = !isArrayLike( obj ) && _.keys( obj ),
        length = ( keys || obj ).length,
        index,
        currentKey;

    for ( index = 0; index < length; index++ ) {
      currentKey = keys ? keys[ index ] : index;

      if ( predicate( obj[ currentKey ], currentKey, obj ) ) {
        return true;
      }
    }

    return false;
  };

  // 返回集合中是否包含传入选项的布尔值
  _.contains = _.includes = _.include = function ( obj, item, fromIndex, guard ) {
    // 不是类数组
    if ( !isArrayLike( obj ) ) {
      // 返回对象的属性数组
      obj = _.values( obj );
    }

    // fromIndex 不是数字，或者 guard 为真
    if ( typeof fromIndex != 'number' || guard ) {
      fromIndex = 0;
    }

    // 通过 _.indexOf 方法判断是否包含
    return _.indexOf( obj, item, fromIndex ) >= 0;
  };

  // 在 obj 的每个元素上执行 path 方法，args 会在调用 path 方法时传递，restArgs 函数的作用不必多说请看上文代码
  _.invoke = restArgs( function ( obj, path, args ) {
    var contextPath,
        func;
    
    // 第二个参数为自定义函数
    if ( _.isFunction( path ) ) {
      func = path;

    // 第二个参数为数组
  } else if ( _.isArray( path ) ) {
    // contextPath 截取 0 到倒数第二个
    contextPath = path.slice( 0, -1 );
    // path 获取最后一个
    path = path[ path.length - 1 ];
  }

    return _.map( obj, function ( context ) {
      var method = func;

      // 自定义函数不执行下面代码
      if ( !method ) {
        // 第二个参数是数组
        // var obj = { test1: [ 1, 5, 6 ], test2: 2 };
        // var test = _.invoke( [ obj ], [ 'test1', 'join' ] );
        // console.log( test ); ["1,5,6"]
        // 上面代码执行就是正确的使用方法
        if ( contextPath && contextPath.length ) {
          context = deepGet( context, contextPath );
        }

        if ( context == null ) {
          return void 0;
        }

        method = context[ path ];
      }

      // method == null，需要 context 没有这个方法
      return method == null ? method : method.apply( context, args );
    } );
  } );

  // _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error', 'Symbol', 'Map', 'WeakMap', 'Set', 'WeakSet'], function(name) {
  //   _['is' + name] = function(obj) {
  //     return toString.call(obj) === '[object ' + name + ']';
  //   };
  // });
  // _.isArray = nativeIsArray || function(obj) {
  //   return toString.call(obj) === '[object Array]';
  // };
  // _.isObject = function(obj) {
  //   var type = typeof obj;
  //   return type === 'function' || type === 'object' && !!obj;
  // };
  // _.keys = function(obj) {
  //   if (!_.isObject(obj)) return [];
  //   if (nativeKeys) return nativeKeys(obj);
  //   var keys = [];
  //   for (var key in obj) if (_.has(obj, key)) keys.push(key);
  //   // Ahem, IE < 9.
  //   if (hasEnumBug) collectNonEnumProps(obj, keys);
  //   return keys;
  // };

  // 萃取数组的对象中某属性值，返回一个数组
  _.pluck = function ( obj, key ) {
    // _.property 返回一个函数
    // key 为不是数组就使用 shallowProperty 函数
    // key 为类数组使用 deepGet 函数
    return _.map( obj, _.property( key ) );
  };

  // 遍历 obj 的每个值，返回一个包含 attrs 的数组
  // var objList = [ { title: 'sc' }, { title: 'cs' } ];
  // _.where( objList, { title: 'sc' } );
  _.where = function ( obj, attrs ) {
    // _.matcher 方法返回一个辨别给定的对象是否匹配 attrs 指定键/值属性的函数
    return _.filter( obj, _.matcher( attrs ) );
  };
  
  // 返回匹配 attrs 的第一个值
  _.findWhere = function ( obj, attrs ) {
    return _.find( obj, _.matcher( attrs ) );
  };

  // 返回 obj 集合中的最大值
  _.max = function ( obj, iteratee, context ) {
    var result = -Infinity,
        lastComputed = -Infinity,
        value,
        computed,
        i,
        length;
    
    // iteratee 不是函数是一个数字并且 obj 数组的值不是对象
    if ( iteratee == null || ( typeof iteratee === 'number' && typeof obj[ 0 ] != 'object' ) && obj != null ) {
      // 是 obj 是对象就通过 _.values 方法返回 obj 的属性值的数组
      obj = isArrayLike( obj ) ? obj : _.values( obj );

      for ( i = 0, length = obj.length; i < length; i++ ) {
        value = obj[ i ];

        // 判断最大值
        if ( value != null && value > result ) {
          result = value;
        }
      }
    } else {
      iteratee = cb( iteratee, context );

      _.each( obj, function ( value, index, list ) {
        // 这时的 obj 的值应当是对象，下面通过这个函数返回排序依据
        // function ( value ) { return value.age; }
        computed = iteratee( value, index, list );

        // 判断最大值
        if ( computed > lastComputed || computed === -Infinity && result === -Infinity ) {
          result = value;
          lastComputed = computed;
        }
      } );
    }

    return result;
  };

  // 返回 obj 集合中的最小值
  _.min = function ( obj, iteratee, context ) {
    var result = Infinity,
        lastComputed = Infinity,
        value,
        computed,
        i,
        length;
    
    // iteratee 不是函数是一个数字并且 obj 数组的值不是对象
    if ( iteratee == null || ( typeof iteratee === 'number' && typeof obj[ 0 ] != 'object' ) && obj != null ) {
      // 是 obj 是对象就通过 _.values 方法返回 obj 的属性值的数组
      obj = isArrayLike( obj ) ? obj : _.values( obj );

      for ( i = 0, length = obj.length; i < length; i++ ) {
        value = obj[ i ];

        // 判断最大值
        if ( value != null && value < result ) {
          result = value;
        }
      }
    } else {
      iteratee = cb( iteratee, context );

      _.each( obj, function ( value, index, list ) {
        // 这时的 obj 的值应当是对象，下面通过这个函数返回排序依据
        // function ( value ) { return value.age; }
        computed = iteratee( value, index, list );

        // 判断最大值
        if ( computed < lastComputed || computed === Infinity && result === Infinity ) {
          result = value;
          lastComputed = computed;
        }
      } );
    }

    return result;
  };

  // 返回一个随机乱序的 list 副本
  _.shuffle = function ( obj ) {
    return _.sample( obj, Infinity );
  };

  // 返回一个排序后的 list 拷贝副本
  _.sortBy = function ( obj, iteratee, context ) {
    var index = 0;

    // iteratee 可以是很多东西，比如自定义函数，希望数组中的对象根据哪个属性排序等
    iteratee = cb( iteratee, context );

    // 先通过 _.map 遍历设置额外属性，之后在把 _.map 方法处理过的数组排序，最后通过 _.pluck  方法把排序的数组复原为原先的数组格式（只是格式复原，已经排序）
    return _.pluck( _.map( obj, function ( value, key, list ) {
      // 因为可以根据多种来进行排序，所以为每个列表项设置一些额外属性
      return {
        value,
        // 当前后两个比较的列表项相同，就使用下标来排序
        index: index++,
        // 正式比较的值
        criteria: iteratee( value, key, list ),
      };
    } ).sort( function ( left, right ) {
      var a = left.criteria,
          b = right.criteria;

      if ( a !== b ) {
        if ( a > b || a === void 0 ) {
          return 1;
        }

        if ( a < b || b === void 0 ) {
          return -1;
        }
      }

      return left.index - right.index;
    } ), 'value' );
  };

  // 用于聚合 “分组” 操作的内部函数
  var group = function ( behavior, partition ) {
    return function ( obj, iteratee, context ) {
      // partition 为 Boolean 值，为真就使用数组保存
      var result = partition ? [ [], [] ] : {};

      iteratee = cb( iteratee, context );

      // 遍历
      _.each( obj, function ( value, index ) {
        // 得出分组依据
        var key = iteratee( value, index, obj );

        // 根据传入得函数处理
        behavior( result, value, key );
      } );

      return result;
    };
  };

  // 把一个集合分组为多个集合
  _.groupBy = group( function ( result, value, key ) {
    // result 里包含 key
    if ( _.has( result, key ) ) {
      result[ key ].push( value );

    // result 不包含 key 就先进行赋值 
    } else {
      result[ key ] = [ value ];
    }
  } );

  // 把一个集合分组为多个集合，但是一个键只会对应着一个值
  _.indexBy = group( function ( result, value, key ) {
    result[ key ] = value;
  } );

  // 类似 _.groupBy 方法，只是 result 中键对应的是值得数量
  _.countBy = group( function ( result, value, key ) {
    if ( _.has( result, key ) ) {
      result[ key ]++;
    } else {
      result[ key ] = 1;
    }
  } );

  // [\ud800-\udbff][\udc00-\udfff] 代理码点的长度是每个字符为 2
  // 所以才使用了正则
  // 参考 https://linux.cn/article-3759-1.html?page=1
  var reStrSymbol = /[\ud800-\udbff][\udc00-\udfff]|[\s\S]/g;

  // 把可遍历的 obj 转换为数组
  _.toArray = function ( obj ) {
    if ( !obj ) {
      return [];
    }

    // 数组直接转
    if ( _.isArray( obj ) ) {
      return slice.call( obj );
    }

    // 字符串就通过正则
    if ( _.isString( obj ) ) {
      return obj.match( reStrSymbol );
    }

    // 类数组对象，有个疑问，为什么数组和类数组不放在一起直接使用 slice.call( obj ) 转换；实际测试这两个是没有区别的
    if ( isArrayLike( obj ) ) {
      return _.map( obj, _.identity );
    }

    // 返回对象属性值的数组
    return _.values( obj );
  };

  // 返回 obj 的长度
  _.size = function ( obj ) {
    if ( obj == null ) {
      return 0;
    }

    // _.keys 方法返回 obj 值的数组
    return isArrayLike( obj ) ? obj.length : _.keys( obj ).length;
  };

  // 把一个数组拆分为两个
  _.partition = group( function ( result, value, pass ) {
    // pass 为拆分依据，具体看 group 函数。pass 为真就放到第一个下标
    result[ pass ? 0 : 1 ].push( value );
  }, true );

  // 数组
  // 返回数组的第一个元素，如果有停止位置，就调用 _.initial 方法
  _.first = _.head = _.take = function ( array, n, guard ) {
    if ( array == null || array.length < 1 ) {
      return void 0;
    }

    if ( n == null || guard ) {
      return array[ 0 ];
    }

    // 调用 _.initial 方法返回数组中排除从最后一个开始的 array.length - n 个元素的数组
    return _.initial( array, array.length - n );
  };

  // 返回数组中除了最后一个元素外的其他全部元素
  _.initial = function ( array, n, guard ) {
    // Math.max 的主要作用是防止出现负数
    return slice.call( array, 0, Math.max( 0, array.length - ( n == null || guard ? 1 : n ) ) );
  };

  // 返回数组的最后一个元素，对照 _.first 方法
  _.last = function ( array, n, guard ) {
    if ( array == null || array.length < 1 ) {
      return void 0;
    }

    if ( n == null || guard ) {
      return array[ array.length - 1 ];
    }

    return _.rest( array, Math.max( 0, array.length - n ) );
  };

  // 返回数组中除了第一个元素外的其他全部元素，对照 _.initial 方法
  _.rest = _.tail = _.drop = function ( array, n, guard ) {
    return slice.call( array, n == null || guard ? 1 : n );
  };

  // 返回一个除去所有 false值的 array 副本。在 javascript 中, false, null, 0, "", undefined 和 NaN 都是false值.
  _.compact = function ( array ) {
    // Boolean 函数用于转换其他类型的值为 boolean 值
    return _.filter( array, Boolean );
  };

  // 剥离数组嵌套的递归通用函数
  var flatten = function ( input, shallow, strict, output ) {
    output = output || [];

    var idx = output.length,
        i,
        length = getLength( input ),
        value;
    
    // 遍历传入的整个数组
    for ( i = 0; i < length; i++ ) {
      value = input[ i ];

      // 数组内的值是类数组
      if ( isArrayLike( value ) && ( _.isArray( value ) || 
      _.isArguments( value ) ) ) {
        // 只剥离一层
        if ( shallow ) {
          var j = 0,
              len = value.length;

          while ( j < len ) {
            output[ idx++ ] = value[ j++ ];
          }

        // 嵌套全部剥离  
        } else {
          // 递归
          flatten( value, shallow, strict, output );
          // output 的索引为 output.length 的长度
          // 这边写成 idx++ 应当也没事
          idx = output.length;
        }

      // strict 变量的作用：是否需要不是嵌套数组的值  
      } else if ( !strict ) {
        output[ idx++ ] = value;
      }
    }

    return output;
  };

  // 将一个嵌套多层的数组 array（数组）转换为只有一层的数组。 如果你传递 shallow 参数，数组将只减少一维的嵌套。
  _.flatten = function ( array, shallow ) {
    return flatten( array, shallow, false );
  };

  // 返回一个删除所有 otherArrays 值后的 array 副本
  _.without = restArgs( function ( array, otherArrays ) {
    return _.difference( array, otherArrays );
  } );

  // 返回 array 去重后的副本
  _.uniq = _.unique = function ( array, isSorted, iteratee, context ) {
    // isSorted 不是布尔值
    if ( !_.isBoolean( isSorted ) ) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }

    if ( iteratee != null ) {
      iteratee = cb( iteratee, context );
    }

    var result = [],
        seen = [],
        i,
        length = getLength( array );

    for ( i = 0; i < length; i++ ) {
      var value = array[ i ],
          computed = iteratee ? iteratee( value, i, array ) : value;
      
      // isSorted 表明传入的值已经排序
      if ( isSorted ) {
        // i = 0，seen !== computed
        if ( !i || seen !== computed ) {
          result.push( value );
        }

        seen = computed;
      } else if ( iteratee ) {
        if ( !_.contains( seen, computed ) ) {
          seen.push( computed );
          result.push( value );
        }
      } else if ( !_.contains( result, value ) ) {
        result.push( value );
      }
    }

    return result;
  };

  // 返回传入的 arrays（数组）并集；按顺序返回，返回数组的元素是唯一的
  _.union = restArgs( function ( arrays ) {
    // 先调用 flatten 函数把嵌套数组（restArgs 函数把 _.union 方法的多个传入数组整合成嵌套数组）合并之后在通过 _.uniq 方法获取唯一值
    return _.uniq( flatten( arrays, true, true ) );
  } );

  // 返回传入 arrays（数组）交集
  _.intersection = function ( array ) {
    var result = [],
        argsLength = arguments.length,
        i,
        length = getLength( array );

    for ( i = 0; i < length; i++ ) {
      var item = array[ i ];

      // 并集数组中有相同值，直接下一个循环
      if ( _.contains( result, item ) ) {
        continue;
      }

      var j;

      // j 从 1 开始因为整个并集数组是以参数数组的第一个数组为基准的
      for ( j = 1; ju < argsLength; j++ ) {
        // 之后的每个数组都包含相同的值就循环否则退出循环
        if ( !_.contains( arguments[ j ], item ) ) {
          break;
        }
      }

      // 之后的每个数组都包含相同的值，这时 j 的长度就等于参数数组的长度
      if ( j === argsLength ) {
        result.push( item );
      }
    }

    return result;
  };

  // 类似与 _.without 方法，不过排除选项是数组中的值
  _.difference = restArgs( function ( array, rest ) {
    // rest 必须是数组，或者必须包含嵌套数组的数组
    rest = flatten( rest, true, true );

    // 返回 _.filter 过滤后的值
    return _.filter( array, function ( value ) {
      // 通过调用 _.contains 方法来判断 rest 中是否含有 array 数组的值
      return !_.contains( rest, value );
    } );
  } );

  // 把数组中的值打散重组
  _.unzip = function ( array ) {
    // 获取嵌套数组中长度最长的数组
    var length = array && _.max( array, getLength ).length || 0,
        result = Array( length ),
        index;
    
    // 遍历时，如果当前下标没有值，就为 undefined
    for ( index = 0; index < length; index++ ) {
      // 调用 _.pluck 方法来萃取嵌套数组的每个数组当前下标的值，并返回它们组成的数组
      result[ index ] = _.pluck( array, index );
    }

    return result;
  };

  // 将每个 arrays 中相应位置的值合并在一起
  _.zip = restArgs( _.unzip );

  // 将数组转换为对象。传递任何一个单独 [ key, value ] 对的列表，或者一个键的列表和一个值得列表。如果存在重复键，最后一个值将被返回
  _.object = function ( list, values ) {
    var result = {},
        i,
        length = getLength( list );

    for ( i = 0; i < length; i++ ) {
      if ( values ) {
        result[ list[ i ] ] = values[ i ];
      } else {
        result[ list[ i ][ 0 ] ] = list[ i ][ 1 ];
      }
    }

    return result;
  };

  // _.findIndex 和 _.findLastIndex 方法的通用函数
  var createPredicateindexFinder = function ( dir ) {
    return function ( array, predicate, context ) {
      predicate = cb( predicate, context );

      var length = getLength( array ),
          index = dir > 0 ? 0 : length - 1;
      
      // dir 只能是 1 或者 -1
      for ( ; index >= 0 && index < length; index += dir ) {
        if ( predicate( array[ index ], index, array ) ) {
          return index;
        }
      }    

      return -1;
    };
  };

  // 当 predicate 通过真检查时，返回当前索引值；否则返回 -1
  _.findIndex = createPredicateindexFinder( 1 );
  // 反向迭代数组，当 predicate 通过真检查时，返回从末端开始的当前索引值
  _.findLastIndex = createPredicateindexFinder( -1 );

  // 使用二分查找确定 value 在 list 中的位置序号
  _.sortedIndex = function ( array, obj, iteratee, context ) {
    iteratee = cb( iteratee, context, 1 );

    var value = iteratee( obj ),
        low = 0,
        high = getLength( array );

    while ( low < high ) {
      var mid = Math.floor( ( low + high ) / 2 );

      if ( iteratee( array[ mid ] < value ) ) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    return low;
  };

  // _.indexOf 和 _.lastIndexOf 方法的通用函数
  var createIndexFinder = function ( dir, predicateFind, sortedIndex ) {
    // idx 表示从哪个下标开始查找
    return function ( array, item, idx ) {
      var i = 0,
          length = getLength( array );
      
      // 查找下标存在并且是数字
      if ( typeof idx == 'number' ) {
        if ( dir > 0 ) {
          // Math.max( idx + length, i )，idx 是负数
          i = idx >= 0 ? idx : Math.max( idx + length, i );
        } else {
          // idx 为 0 是只有一个长度，为 -1 才是全部的长度，因此 idx + length + 1 才会 + 1
          length = idx >= 0 ? Math.min( idx + 1, length ) : idx + length + 1;
        }

      // 第三个参数不是查找下标而是其它值（boolean等）  
      } else if ( sortedIndex && idx && length ) {
        idx = sortedIndex( array, item );

        return array[ idx ] === item ? idx : -1;
      }

      // item 为 NaN
      if ( item !== item ) {
        idx = predicateFind( slice.call( array, i, length ), _.isNaN );

        return idx >= 0 ? idx + i : -1;
      }

      // 老套路，dir 只能是 1 或者 -1
      for ( idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir ) {
        if ( array[ idx ] === item ) {
          return idx;
        }
      }

      return -1;
    };
  };

  // 返回 value 在该 array 中的索引值，如果 value 不存在 array 中就返回 -1
  _.indexOf = createIndexFinder( 1, _.findIndex, _.sortedIndex );
  // 返回 value 在该 array 中的从最后开始的索引值，如果 value 不存在 array 中就返回 -1
  _.lastIndexOf = createIndexFinder( -1, _.findLastIndex );

  // 一个用来创建整数灵活编号的列表的函数
  _.range = function ( start, stop, step ) {
    if ( stop == null ) {
      stop = start || 0;
      start = 0;
    }

    if ( !step ) {
      step = stop < start ? -1 : 1;
    }

    var length = Math.max( Math.ceil( ( stop - start ) / step ), 0 ),
        range = Array( length ),
        idx;

    for ( idx = 0; idx < length; idx++, start += step ) {
      range[ idx ] = start;
    }

    return range;
  };

  // 将一个数组拆分成多个包含指定 count 数量的数组
  _.chunk = function ( array, count ) {
    if ( count == null || count < 1 ) {
      return [];
    }

    var result = [],
        i = 0,
        length = array.length;

    while ( i < length ) {
      result.push( slice.call( array, i, i += count ) );
    }

    return result;
  };

  // 函数
  var executeBound = function ( sourceFunc, boundFunc, context, callingContext, args ) {
    // 不是构造函数，_.bind 返回的函数没有使用 new 调用
    if ( !( callingContext instanceof boundFunc ) ) {
      return sourceFunc.apply( context, args );
    }

    // 使用 new 构造函数，那么当前 this 就是构造函数的作用域
    var self = baseCreate( sourceFunc.prototype ),
        // self 继承 sourceFunc.prototype，sourceFunc 函数的当前作用域就是 self
        result = sourceFunc.apply( self, args );
    
    // 返回值是对象就返回 result
    if ( _.isObject( result ) ) {
      return result;
    }

    // 否则返回 self
    return self;
  };

  // 绑定函数 function 到对象 object 上
  _.bind = restArgs( function ( func, context, args ) {
    if ( !_.isFunction( func ) ) {
      throw new TypeError( 'Bind must be called on a function' );
    }

    var bound = restArgs( function ( callArgs ) {
      // bound 为 _.bind 返回的函数
      return executeBound( func, bound, context, this, args.concat( callArgs ) );
    } );

    return bound;
  } );

  // 局部应用一个函数填充在任意个数的 arguments，不改变其动态 this 值。和 bind 方法很相近。你可以传递 _ 给arguments 列表来指定一个不预先填充，但在调用时提供的参数。
  _.partial = restArgs( function ( func, boundArgs ) {
    // _.partial.placeholder 在 _.partial 方法下方指定为 _
    var placeholder = _.partial.placeholder;
    var bound = function () {
      var position = 0,
          length = boundArgs.length,
          args = Array( length ),
          i;
    
      for ( i = 0; i < length; i++ ) {
        // boundArgs 是使用 _.partial 方法指定预先填充的数组，如果是 boundArgs[ i ] 是 _ 就使用 _.partial 方法返回函数的参数数组的值，否则使用 _.partial 指定的值
        args[ i ] = boundArgs[ i ] === placeholder ? arguments[ position++ ] : boundArgs[ i ];
      }

      // _.partial 方法指定预先填充的数组中 _ 的数量小于，_.partial 方法返回的函数参数的长度，就把参数数组剩余的值全部压入 args 数组中
      while ( position < arguments.length ) {
        args.push( arguments[ position++ ] );
      }

      return executeBound( func, bound, this, this, args );
    };

    return bound;
  } );

  _.partial.placeholder = _;

  // 把 methodNames 参数指定的一些方法绑定到object上，这些方法就会在对象的上下文环境中执行
  _.bindAll = restArgs( function ( obj, keys ) {
    // 把多个函数名放入一个数组中
    keys = flatten( keys, false, false );

    var index = keys.length;

    // 没有函数名
    if ( index < 1 ) {
      throw new Error( 'bindAll must be passed function names' );
    }

    // 循环绑定
    while ( index-- ) {
      var key = keys[ index ];

      obj[ key ] = _.bind( obj[ key ], obj );
    }
  } );

  // 缓存某函数的计算结果
  // 如果有传入 hasher 数组，就用它的计算结果作为 key
  _.memoize = function ( func, hasher ) {
    var memoize = function ( key ) {
      var cache = memoize.cache,
          // hasher 函数存在使用它的计算结果，否则用 key
          address = '' + ( hasher ? hasher.apply( this, arguments ) : key );
      
      // 缓存对象中没有函数参数就赋值
      if ( !_.has( cache, address ) ) {
        cache[ address ] = func.apply( this, arguments );
      }

      // 返回缓存
      return cache[ address ];
    };

    // 设置缓存对象
    memoize.cache = {};

    return memoize;
  };

  // 类似 setTimeout，等待 wait 毫秒后调用 function
  _.delay = restArgs( function ( func, wait, args ) {
    return setTimeout( function () {
      return func.apply( null, args );
    }, wait );
  } );

  // 延迟调用 function 直到当前调用栈清空为止，类似使用延时为 0 的 setTimeout 方法。
  _.defer = _.partial( _.delay, _, 1 );

  // 创建并返回一个像节流阀一样的函数，当重复调用函数的时候，至少每隔 wait 毫秒调用一次该函数。
  // options 的说明：如果你想禁用第一次首先执行的话，传递 { leading: false }，还有如果你想禁用最后一次执行的话，传递 { trailing: false }。
  _.throttle = function ( func, wait, options ) {
    var timeout,
        context,
        args,
        result,
        previous = 0;
    
    // options 不存在，为了防止 undefined 不能访问重新设置 options
    if ( !options ) {
      options = {};
    }    

    // setTimeout 执行函数
    var later = function () {
      // options.leading 为真，调整上一次执行时间为当前时间戳
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply( context, args );

      if ( !timeout ) {
        context = args = null;
      }
    };

    var throttled = function () {
      var now = _.now();

      // previous 为 0，并且 options.leading 为假，也就是说明会跳过第一次首先执行
      if ( !previous && options.leading === false ) {
        // 调整上一次执行时间为当前时间戳
        previous = now;
      }

      // 计算到下次执行还需等待的时间
      // options.leading 不是 false 为 true，undefined 等值，remaining 第一次为负值
      // ( now - previous ) 是现在的时间戳减去上一次执行延迟函数的时间差，小于 wait 执行 setTimeout 延时函数，否则立即执行。
      var remaining = wait - ( now - previous );

      context = this;
      args = arguments;

      // remaining 小于等于 0，大于 wait，立即执行函数
      if ( remaining <= 0 || remaining > wait ) {
        // 延时调用返回值存在，清除重置
        if ( timeout ) {
          clearTimeout( tiemout );
          timeout = null;
        }

        previous = now;
        result = func.apply( context, args );

        // timeout 不存在，重置上下文和参数数组
        if ( !timeout ) {
          context = args = null;
        }

      // options.trailing === false，并不会执行下面语句，也就是说函数只会在 remaining <= 0 时执行。
      } else if ( !timeout && options.trailing !== false ) {
        timeout = setTimeout( later, remaining );
      }

      return result;
    };

    throttled.cancel = function () {
      clearTimeout( timeout );
      previous = 0;
      timeout = context = args = null;
    };

    return throttled;
  };

  // 返回 function 函数的防反跳版本, 将延迟函数的执行（真正的执行）在函数最后一次调用时刻的 wait 毫秒之后。
  _.debounce = function ( func, wait, immediate ) {
    var timeout,
        result;
    
    // 延时执行函数，会在最后一次调用的 wait 毫秒之后执行
    var later = function ( context, args ) {
      // 执行到这边说明是在最后一次执行的情况下，重置 timeout 来保持下次执行
      timeout = null;

      // 下面代码只有在 immediate 不为真的情况下才会执行
      if ( args ) {
        result = func.apply( context, args );
      }
    };

    var debounced = restArgs( function ( args ) {
      // 这个方法的关键就在这里：通过在 timeout 有值的情况下清除定时器，就可以让最后一个函数执行，前面的所有其它函数都被清除
      if ( timeout ) {
        // 使用 clearTimeout 清除定时器，它的 ID 是不会被清除的
        clearTimeout( timeout );
      }

      // 在运行时首先执行
      if ( immediate ) {
        var callNow = !timeout;

        // later 函数并没有传入任何值
        timeout = setTimeout( later, wait );

        if ( callNow ) {
          result = func.apply( this, args );
        }
      } else {
        // 在最后一次的情况下，这个延时函数才能真正的执行
        timeout = _.delay( later, wait, this, args );
      }

      return result;
    } );

    debonced.cancel = function () {
      clearTimeout( timeout );
      timeout = null;
    };

    return debounced;
  };

  // 将第一个函数 function 封装到函数 wrapper 里面, 并把函数 function 作为第一个参数传给 wrapper。这样就能在这个方法返回的函数中自由执行传入的参数函数了
  _.wrap = function ( func, wrapper ) {
    return _.partial( wrapper, func );
  };

  // 返回一个新的 predicate 函数的否定版本
  _.negate = function ( predicate ) {
    // 方法返回一个函数
    return function () {
      // 函数内执行相反操作
      return !predicate.apply( this, arguments );
    };
  };

  // 返回函数集 functions 组合后的复合函数，也就是一个函数执行完之后把返回的结果再作为参数赋给下一个函数来执行，以此类推。
  _.compose = function () {
    var args = arguments,
        // 从最后一个函数起步
        start = args.length - 1;

    return function () {
      var i = start,
          // 先执行最后一个函数
          result = args[ start ].apply( this, arguments );
      
      // 照此，相当于把数组从右到左，遍历执行
      while ( i-- ) {
        result = args[ i ].call( this, result );
      }

      return result;
    };
  };

  // 创建一个函数，只有在运行了 count 次之后才会执行传入函数
  _.after = function ( times, func ) {
    return function () {
      if ( --times < 1 ) {
        return func.apply( this, arguments );
      }
    };
  };

  // 创建一个函数，调用不超过 count 次
  _.before = function ( times, func ) {
    var memo;

    return function () {
      if ( --times > 0 ) {
        memo = func.apply( this, arguments );
      }

      if ( times <= 1 ) {
        func = null;
      }

      return memo;
    };
  };

  // 创建一个只能调用一次的函数。
  _.once = _.partial( _.before, 2 );

  // 类似于 ES6 的 rest 参数
  _.restArgs = restArgs;

  // 对象
  // IE < 9 的 BUG，与不可枚举属性同名的实例属性也不可枚举
  var hasEnumBug = !{ toString: null }.propertyIsEnumerable( 'toString' ),
      nonEnumerableProps = [ 'valueOf', 'isPrototypeOf', 'toString', 'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString' ];

  var collectNonEnumProps = function ( obj, keys ) {
    var nonEnumIdx = nonEnumerableProps.length,
        constructor = obj.constructor,
        proto = _.isFunction( constructor ) && constructor.prototype || ObjProto,
        prop = 'constructor';

    if ( _.has( obj, prop ) && !_.contains( keys, prop ) ) {
      keys.push( prop );
    }

    while ( nonEnumIdx-- ) {
      prop = nonEnumerableProps[ nonEnumIdx ];

      if ( prop in obj && obj[ prop ] !== protp[ prop ] && !_.contains( keys, prop ) ) {
        keys.push( prop );
      }
    }
  };

  // 检索 object 拥有的所有可枚举属性的名称
  _.keys = function ( obj ) {
    // 不是对象，返回空数组
    if ( !_.isObject( obj ) ) {
      return [];
    }

    // 原生方法 Object.keys 存在就使用
    if ( nativeKeys ) {
      return nativeKeys( obj );
    }

    var keys = [],
        key;

    for ( key in obj ) {
      // key 在 obj 中
      if ( _.has( obj, key ) ) {
        keys.push( key );
      }
    }

    // IE < 9 的 BUG
    if ( hasEnumBug ) {
      collectNonEnumProps( obj, keys );
    }

    return keys;
  };

  // 检索 object 拥有的和继承的所有属性的名称。
  _.allKeys = function ( obj ) {
    if ( !_.isObject( obj ) ) {
      return [];
    }

    var keys = [],
        key;

    for ( key in obj ) {
      // 和 _.keys 最大的区域没有判断 key 是不是 obj 拥有的属性还是继承的属性
      keys.push( key );
    }

    if ( hasEnumBug ) {
      collectNonEnumProps( obj, keys );
    }

    return keys;
  };

  // 返回 object 对象所有的属性值。
  _.values = function ( obj ) {
    var keys = _.keys( obj ),
        length = keys.length,
        values = Array( length ),
        i;

    for ( i = 0; i < length; i++ ) {
      values[ i ] = obj[ keys[ i ] ];
    }

    return values;
  };

  // 它类似于 map，但是这用于对象。转换每个属性的值。
  _.mapObject = function ( obj, iteratee, context ) {
    // 通过 cb 函数得出转换后的 iteratee 函数
    iteratee = cb( iteratee, context );

    var keys = _.keys( obj ),
        length = keys.length,
        results = {},
        index;

    for ( index = 0; index < length; index++ ) {
      // currentKey 是对象的属性
      var currentKey = keys[ index ];

      // 通过 iteratee 函数进行运算赋值给 results 对象的属性
      results[ currentKey ] = iteratee( obj[ currentKey ], currentKey, obj );
    }

    return results;
  };

  // 把一个对象转变为一个 [key, value] 形式的数组。
  _.pairs = function ( obj ) {
    var keys = _.keys( obj ),
        length = keys.length,
        pairs = Array( length ),
        i;

    for ( i = 0; i < length; i++ ) {
      // 下面这行代码从这个方法的用途上就可以明白
      pairs[ i ] = [ keys[ i ], obj[ keys[ i ] ] ];
    }

    return pairs;
  };

  // 返回一个 object 副本，使其键（keys）和值（values）对换。
  _.invert = function ( obj ) {
    var result = {},
        keys = _.keys( obj ),
        i,
        length = keys.length;

    for ( i = 0; i < length; i++ ) {
      // result[ obj[ keys[ i ] ] ] 为传入的 obj 对象的一个值
      result[ obj[ keys[ i ] ] ] = keys[ i ];
    }

    return result;
  };

  // 返回对象的所有方法名称，包括继承的
  _.functions = _.methods = function ( obj ) {
    var names = [],
        key;

    for ( key in obj ) {
      // 对象的属性值是个方法
      if ( _.isFunction( obj[ key ] ) ) {
        names.push( key );
      }
    }

    // 排序后返回
    return names.sort();
  };

  // 复制对象属性的内部方法
  var createAssigner = function ( keysFunc, defaults ) {
    return function ( obj ) {
      var length = arguments.length;

      // defaults 为真
      if ( defaults ) {
        obj = Object( obj );
      }

      // 传入参数的数量小于 2 或者 obj 为 null，直接返回 obj
      if ( length < 2 || obj == null ) {
        return obj;
      }

      var index;

      for ( index = 1; index < length; index++ ) {
        var source = arguemnts[ index ],
            // 获取参数的属性数组，keysFunc 可能为 _.keys 或 _.allKeys 方法
            keys = keysFunc( source ),
            l = keys.length,
            i;

        for ( i = 0; i < l; i++ ) {
          var key = keys[ i ];

          // defaults 不为真或者当前属性的值为 undefined
          if ( !defaults || obj[ key ] === void 0 ) {
            // 扩展传入的第一个参数 arguments[ 0 ]
            obj[ key ] = source[ key ];
          }
        }
      }

      return obj;
    };
  };

  // 复制 source 对象中的所有属性覆盖到 destination 对象上，并且返回  destination 对象。复制是按顺序的，所以后面的对象属性会把前面的对象属性覆盖掉
  _.extend = createAssignerr( _.allKeys );

  // 类似于 extend，但只复制自己的属性覆盖到目标对象，区别在于传入的方法不同，_.allKeys 会把继承的属性也放入返回数组中
  _.extendOwn = _.assign = createAssigner( _.keys );

  // 根据传入函数的运算作为依据返回对象中的值
  _.findKey = function ( obj, predicate, context ) {
    // cb 方法不用多说，返回转换过后的函数
    predicate = cb( predicate, context );

    var keys = _.keys( obj ),
        key,
        i,
        length = keys.length;

    for ( i = 0; i < length; i++ ) {
      key = keys[ i ];

      if ( predicate( obj[ key ], key, obj ) ) {
        return key;
      }
    }    
  };

  // 判断 key 是否在 obj 中
  var keyInObj = function ( value, key, obj ) {
    return key in obj;
  };

  // 返回一个 object 副本，只过滤出 keys（有效的键组成的数组）参数指定的属性值。或者接受一个判断函数，指定挑选哪个 key。
  _.pick = restArgs( function ( obj, keys ) {
    var result = {},
        iteratee = keys[ 0 ],
        i,
        length = keys.length;
    
    // obj 为空，直接返回空对象
    if ( obj == null ) {
      return result;
    }

    // 第一个判断条件为函数（keys 数组的第一个值是函数）
    if ( _.isFunction( iteratee ) ) {
      // keys 数组的长度大于 1，说明 keys[ 1 ] 有可能是上下文
      if ( keys.length > 1 ) {
        iteratee = optimizeCb( iteratee, keys[ 1 ] );
      }

      keys = _.allKeys( obj );
    } else {
      // 当 keys 第一个参数不是数组，那就说明它是对象的键，只要判断键在不在对象中即可
      iteratee = keyInObj;
      // 把数组剥离为一维数组
      keys = flatten( keys, false, false );
      obj = Object( obj );
    }

    for ( i = 0; i < length; i++ ) {
      var key = keys[ i ],
          value = obj[ key ];
      
      // 运行判断条件
      if ( iteratee( value, key, obj ) ) {
        result[ key ] = value;
      }    
    }

    return result;
  } );

  // 与 _.pick 方法相反，返回一个 object 副本，只过滤出除去 keys (有效的键组成的数组)参数指定的属性值。或者接受一个判断函数，指定忽略哪个 key。
  _.omit = restArgs( function ( obj, keys ) {
    var iteratee = keys[ 0 ],
        context;
    
    // 第一个判断条件为函数（keys 数组的第一个值是函数）
    if ( _.isFunction( iteratee ) ) {
      // 返回函数结果的否定值
      iteratee = _.negate( iteratee );

      if ( keys.length > 1 ) {
        context = keys[ 1 ];
      }
    } else {
      // 先通过 flatten 函数转为一维数组，之后遍历数组，在通过 new String 构造器把数组值转化为字符串
      keys = _.map( flatten( keys, false, false ), String );
      iteratee = function ( value, key ) {
        // 返回不包含在 keys 中值的键值对
        return !_.contains( keys, key );
      };
    }

    // 最后再通过 _.pick 方法返回符合上述处理过的判断条件的对象
    return _.pick( obj, iteratee, context );
  } );

  // 用 defaults 对象填充 object 中的 undefined 属性。并且返回这个 object。
  _.defaults = createAssigner( _.allKeys, true );

  // 创建具有给定原型的新对象，可选附加 props 作为 own 的属性。
  _.create = function ( prototype, props ) {
    var result = baseCreate( prototype );

    if ( props ) {
      // 只复制 props 自己的属性，继承的不会复制
      _.extendOwn( result, props );
    }

    return result;
  };

  _.clone = function ( obj ) {
    // 是对象就直接返回
    if ( !_.isObject( obj ) ) {
      return obj;
    }

    // 数组使用 slice 方法，类数组使用 _.extend 方法
    return _.isArray( obj ) ? obj.slice() : _.extend( {}, obj );
  };

  // 用 object 作为参数来调用函数 interceptor，然后返回object。
  _.tap = function ( obj, interceptor ) {
    interceptor( obj );

    return obj;
  };

  // 告诉你 properties 中的键和值是否包含在 object 中
  _.isMatch = function ( object, attrs ) {
    var keys = _.keys( attrs ),
        length = keys.length;
    
    // object 为 null 或者 undefined
    if ( object == null ) {
      // attrs 存在返回 false，不存在返回 true
      return !length;
    }

    var obj = Object( object ),
        i;
    
    // 循环
    for ( i = 0; i < length; i++ ) {
      var key = keys[ i ];

      // 先判断属性值在不在对象中，不在对象中再判断键是否在 obj 中，不在对象中说明键和值都不在对象中
      if ( attrs[ key ] !== obj[ key ] || !( key in obj ) ) {
        return false;
      }
    }

    return true;
  };

  // 内部递归比较函数
  var eq,
      deepEq;

  eq = function ( a, b, aStack, bStack ) {
    // 一般类型比较，不是对象，数组函数之类的引用值
    if ( a === b ) {
      // 一些特殊的值会等于 0，比如 -0 还有 1e - 1000 这种很接近 0 的数
      return a !== 0 || 1 / a === 1 / b;
    }

    // 两个比较值有一个是 null 直接返回假
    if ( a == null || b == null ) {
      return false;
    }

    // a 为 NaN
    if ( a !== a ) {
      // b 也是等于 NaN 那就返回真
      return b !== b;
    }

    var type = typeof a;

    // 不是引用类型，返回 false
    if ( type !== 'function' && type !== 'object' && typeof b !== 'object' ) {
      return false;
    }

    // 更深层次，引用类型的比较
    return deepEq( a, b, aStack, bStack );
  };

  // 内部递归比较函数
  deepEq = function ( a, b, aStack, bStack ) {
    // a，b 在 _ 的原型链上
    if ( a instanceof _ ) {
      a = a._wrapped;
    }

    if ( b instanceof _ ) {
      b = b._wrapped;
    }

    // 返回如 [object Object] 这种形式的字符串
    var className = toString.call( a );

    // 不想等，直接返回 false
    if ( className !== toString.call( b ) ) {
      return false;
    }

    // 在类型相等的前提下，进行更深层次的判断
    switch ( className ) {
      case '[object RegExp]':
      case '[object String]':
        return '' + a === '' + b;

      case '[object Number]':
        a = +a;
        b = +b;

        // NaN
        if ( a !== a ) {
          return b !== b;
        }

        // 接近 0 的数和 0 比较有可能会相等
        return a === 0 ? 1 / a === 1 / b : a === b;

      case '[object Date]':
      case '[object Boolean]':
        return +a === +b;
      
      // ES6 的新类型
      case '[object Symbol]':
        return SymbolProto.valueOf.call( a ) === SymbolProto.valueOf.call( b );    
    }

    // 数组比较
    var areArrays = className === '[object Array]';

    // areArrays 是对象
    if ( !areArrays ) {
      // 不是对象就返回 false
      if ( typeof a != 'object' || typeof b != 'object' ) {
        return false;
      }

      // 构造函数
      var aCtor = a.constructor,
          bCtor = b.constructor;
      
      // a 和 b 的构造函数不相等，比较 aCtor 和 bCtor 是不是构造函数本身，有一个不是构造函数本身，继续比较
      // 通过构造函数来判断 a 和 b 是否相同
      // 但是，如果 a 和 b 的构造函数不同
      // 也并不一定 a 和 b 就是 unequal
      // 比如 a 和 b 在不同的 iframes 中！
      if ( aCtor !== bCtor && !( _.isFunction( aCtor ) && aCtor instanceof aCtor && _.isFunction( bCtor ) && bCtor instanceof bCtor ) && ( 'constructor' in a && 'constructor' in b ) ) {
        return false;
      }
    }
    
    // 第一次执行没有传入，之后递归传入
    aStack = aStack || [];
    bStack = bStack || [];

    var length = aStack.length;

    while ( length-- ) {
      // 历史记录里有自身，就查看另一个比对值是否如此
      if ( aStack[ length ] === a ) {
        return bStack[ length ] === b;
      }
    }

    // 放入历史记录
    aStack.push( a );
    bStack.push( b );

    // 是数组
    if ( areArrays ) {
      length = a.length;

      // a 和 b 长度不等，那肯定不相等
      if ( length !== b.length ) {
        return false;
      } 

      // 一个个递归比较
      while ( length-- ) {
        if ( !eq( a[ length ], b[ length ], aStack, bStack ) ) {
          return false;
        }
      }

    // 是对象  
    } else {
      var keys = _.keys( a ),
          key,
          length = keys.length;

      if ( _.keys( b ).length !== length ) {
        return false;
      }

      while ( length-- ) {
        key = keys[ length ];

        if ( !( _.has( b, key ) && eq( a[ key ], b[ key ], aStack, bStack ) ) ) {
          return false;
        }
      }
    }

    // 递归执行完毕后，一个个从历史记录里删除
    aStack.pop();
    bStack.pop();

    return true;
  };

  // 比较
  _.isEqual = function ( a, b ) {
    return eq( a, b );
  };

  // 是否为空
  _.isEmpty = function ( obj ) {
    if ( obj == null ) {
      return true;
    }

    // 类数组，比较长度
    if ( isArrayLike( obj ) && ( _.isArray( obj ) || _.isString(  obj ) || _.isArguments( obj ) ) ) {
      return obj.length === 0;
    }

    // 对象比较它键数组长度
    return _.keys( obj ).length === 0;
  };

  // 是不是元素节点
  _.isElement = function ( obj ) {
    // nodeType 节点属性为 1 表示为一个元素
    return !!( obj && obj.nodeType === 1 );
  };

  // 判断数组
  _.isArray = nativeIsArray || function ( obj ) {
    return toString.call( obj ) === '[object Array]';
  };

  // 判断对象
  _.isObject = function ( obj ) {
    var type = typeof obj;

    // 类型是函数，或者为对象，并且不是 null
    return type = 'function' || type === 'object' && !!obj;
  };

  // 常用类型判断
  _.each( [ 
    'Arguments',
    'Function',
    'String',
    'Number',
    'Date',
    'RegExp',
    'Error',
    'Symbol',
    'Map',
    'WeakMap',
    'Set',
    'WeakSet',
  ], function ( name ) {
    _[ 'is' + name ] = function ( obj ) {
      return toString.call( obj ) === 'object ' + name + ']';
    };
  } );

  // 函数的 arguments 有个 callee 属性，并且如果用 Object.prototype.toString 去判断 arguments 会返回 [object Arguments]
  if ( !_.isArguments( arguments ) ) {
    _.isArguments = function ( obj ) {
      return _.has( obj, 'callee' );
    };
  }

  var nodelist = root.document && root.document.childNodes;

  // // typeof 检测正则表达式不为 'function'，且 typeof 检测 Int8Array 不为 'object'，且 document 对象存在
  if ( typeof /./ != 'function' && typeof Int8Array != 'object' && typeof nodeList != 'function' ) {
  // || false 是为了解决 IE8 & 11 下的一个诡异问题（有时 typeof dom 元素结果是 'function'，|| false 竟然能解决），见：
  // https://github.com/jashkenas/underscore/issues/1621
    _.isFunction = function ( obj ) {
      return typeof obj == 'function' || false;
    };
  }

  // 判断是否在数字边界内
  _.isFinite = function ( obj ) {
  // 不是 symbol 类型，利用全局函数 isFinite 判断在数字边界中，不是 NaN 的数字，返回真
    return !_.isSymbol( obj ) && isFinite( obj ) && !isNaN( parseFloat( obj ) );
  };

  // 判断 NaN
  _.isNaN = function ( obj ) {
    return _.isNumber( obj ) && isNaN( obj );
  };

   // 判断 Bool 值
  _.isBoolean = function ( obj ) {
  // 只要是布尔类型
    return obj === true || obj === false || toString.call( obj ) === '[object Boolean]';
  };

   // 判断 undefined
  _.isUndefined = function ( obj ) {
  // void 0 返回 undefined，而 undefined 可以被赋值
    return obj === void 0;
  };

  // 
  _.has = function ( obj, path ) {
    // 对象
    if ( !_.isArray( path ) ) {
      return obj != null && hasOwnProperty.call( obj, path );
    }

    // 数组
    var length = path.length,
        i;
    
    // 数组里面为路径
    for ( i = 0; i < length; i++ ) {
      var key = path[ i ];

      if ( obj == null || !hasOwnProperty.call(  obj, key) ) {
        return false;
      }

      // 一层层剥离路径
      obj = obj[ key ];
    }

    return !!length;
  };

  // 实用功能

  // 放弃 Underscore 的控制变量 "_"。返回 Underscore 对象的引用。
  _.noConfilct = function () {
    root._ = previousUnderscore;

    // this 是 _
    return this;
  };

  // 返回与传入参数相等的值
  _.indentity = function ( value ) {
    return value;
  };

  // 创建一个函数，这个函数返回传入参数相等的值
  _.constant = function ( value ) {
    return function () {
      return value;
    };
  };

  // 函数没有明确返回值，就会返回 undefined
  _.noop = function () {};

  
  // _.property 返回一个函数，这个函数返回任何传入的对象的 key 属性
  // key 为不是数组就使用 shallowProperty 函数
  // key 为类数组使用 deepGet 函数
  _.property = function ( path ) {
    if ( !_.isArray( path ) ) {
      return shallowProperty( path );
    }

    return function ( obj ) {
      return deepGet( obj, path );
    };
  };

  // 创建一个函数，函数返回创建时传入的参数的值
  _.propertyOf = function ( obj ) {
    if ( obj == null ) {
      return function () {};
    }

    return function ( path ) {
      return !_.isArray( path ) ? obj[ path ] : deepGet( obj, path );
    };
  };

  // 返回一个断言函数，这个函数会给你一个断言可以用来辨别给定的对象是否匹配 attrs 指定键/值属性
  _.matcher = _.matches = function ( attrs ) {
    // 去掉继承属性
    attrs = _.extendOwn( {}, attrs );

    // 返回一个函数，这个函数会返回 attrs 是不是在传入参数中的 Bool 值
    return function ( obj ) {
      return _.isMatch( obj, attrs );
    };
  };

  // 把一个函数执行 n 次，结束后返回 n 次执行的结果集
  _.times = function ( n, iteratee, context ) {
    var accum = Array( Math.max( 0, n ) ),
        i;

    iteratee = optimizeCb( iteratee, context, 1 );

    for ( i = 0; i < n; i++ ) {
      accum[ i ] = iteratee( i );
    }

    return accum;
  };

  // 返回一个 min 和 max 之间的随机整数。如果你只传递一个参数，那么将返回 0 和这个参数之间的整数。
  _.random = function ( min, max ) {
    if ( max == null ) {
      max = min;
      min = 0;
    }

    // max - min 表示相差值，加 1 是因为有小数，通过 Math.floor 可以变为整数
    return min + Math.floor( Math.random() * ( max - min + 1 ) );
  };

  // 返回当前时间
  _.now = Date.now || function () {
    return new Date().getTime();
  };

  // HTML 实体列表
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;',
  },  
      // 键值对转换
      unescapeMap = _.invert( escapeMap );

  var createEscaper = function ( map ) {
    // 正则替换函数
    var escaper = function ( match ) {
      // 返回对应的 HTML 实体字符或者特殊字符
      return map[ match ];
    };

    // 这种形式：'(?:&amp;|&lt;\&gt;|&quot;|&#x27;|&#x60;)'
    var source = '(?:' + _.keys( map ).join( '|' ) + ')',
        testRegExp = RegExp( source ),
        replaceRegExp = RegExp( source, 'g' );
    
    return function ( string ) {
      string = string == null ? '' : '' + string;

      return testRegExp.test( string ) ? string.replace( replaceRegExp, escaper ) : string;
    };
  };

  // 转义 HTML 字符串，替换 &, <, >, ", ', 和 /字符。
  _.escape = createEscaper( escapeMap );

  // 和 escape 相反。转义 HTML 字符串，替换 &, &lt;, &gt;, &quot;, &#96;, 和 &#x2F; 字符。
  _.unescape = createEscaper( unescapeMap );

  // 如果指定的 property 的值是一个函数，那么将在 object 上下文内调用它；否则，返回它。如果提供默认值，并且属性不存在，那么默认值将被返回。如果设置 defaultValue 是一个函数，它的结果将被返回。
  _.result = function ( obj, path, fallback ) {
    var length = path.length;

    // 长度为 0
    if ( !length ) {
      // 为函数，就执行它；否则返回 fallback
      return _.isFunction( fallback ) ? fallback.call( obj ) : fallback;
    }

    var i;

    // path 是数组
    for ( i = 0; i < length; i++ ) {
      var prop = obj == null ? void 0 : obj[ path[ i ] ];

      // prop 是 undefined，这次循环执行完毕就退出
      if ( prop === void 0 ) {
        prop = fallback;
        i = length;
      }

      // 是函数，直接执行，否则返回值
      obj = _.isFunction( prop ) ? prop.call( obj ) : prop;
    }

    return obj;
  };

  // 为需要的客户端模型或 DOM 元素生成一个全局唯一的 id
  var idCounter = 0;

  _.uniqueId = function ( prefix ) {
    var id = ++idCounter + '';

    return prefix ? prefix + id : id;
  };

  // 默认模板使用 EJS 模板替换符
  _.templateSettings = {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g,
  };
  
  // 下面的正则永远不会匹配
  var noMatch = /(.)^/;

  // 字符转义
  var escapes = {
    "'": "'",
    '\\': '\\',
    '\r': 'r',
    '\n': 'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029',
  },
      escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g;

  var  escapeChar = function ( match ) {
    // new RegExp 创建正则需要把 \ 变成 \\
    return '\\' + escapes[ match ];
  }

  // 将 JavaScript 模板编译为可以用于页面呈现的函数
  _.template = function ( text, settings, oldSettings ) {
    // settings 不存在并且 oldSettings 存在
    if ( !settings && oldSettings ) {
      settings = oldSettings;
    }

    // 扩充空对象
    settings = _.defaults( {}, settings, _.templateSettings );

    // 使用正则构造函数创建，并用 join 连接数组；source 方法可以把正则中的表达式提取出来，比如 /<%([\s\S]+?)%>/g.source 是 "<%([\s\S]+?)%>"
    var matcher = RegExp( [
      ( settings.escape || noMatch ).source,
      ( settins.interpolate || noMatch ).source,
      ( settings.evaluate || noMatch ).source,
    ].join( '|' ) + '|$', 'g' ),
        index = 0,
        source = "__p+='";
    
    text.replace( matcher, function ( match, escape, interpolate, evaluate, offset ) {
      // offset 是匹配位置
      // 匹配字符串（不是模板），并替换实体字符
      source += text.slice( index, offset ).replace( escapeRegExp, escapeChar );
      // 刚刚匹配的位置加上匹配的字符串长度，就是下一次替换的内容位置
      index = offset + match.length;

      // 转义
      if ( escape ) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";

      // 插值
      } else if ( interpolate ) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";

      // 计算  
      } else if ( evaluate ) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      return match;
    } );
    
    source += "';\n";

    // 可以在 with 作用域中直接使用对象的属性
    if ( !settings.variable ) {
      source = 'with(obj||{}){\n' + source + '}\n';
    }

    source = "var __t,__p='',__j=Array.prototype.join," + "print=function(){__p+=__j.call(arguments,'');};\n" + source + 'return __p;\n';

    var render;

    try {
      render = new Function( settings.variable || 'obj', '_', source );
    } catch( e ) {
      e.source = source;
      throw e;
    }

    var template = function ( data ) {
      return render.call( this, data, _ );
    };

    var argument = settings.variable || 'obj';

    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // 返回一个封装的对象。在封装的对象上调用方法会返回封装的对象本身, 直道 value 方法调用为止
  _.chain = function ( obj ) {
    var instance = _( obj );

    instance._chain = true;

    return instance;
  };

  // 帮助链式调用
  var chainResult = function ( instance, obj ) {
    return instance._chain ? _( obj ).chain() : obj;
  };

  _.mixin = function ( obj ) {
    _.each( _.functions( obj ), function ( name ) {
      var objName = obj[ name ],
          func = _[ name ] = objName; 

      _.prototype[ name ] = function () {
        var args = [ this._wrapped ];

        push.apply( args, arguments );

        return chainResult( this, func.apply( _, args ) );
      };
    } );

    return _;
  };

  _.mixin( _ );

  _.each( [
    'pop',
    'push',
    'reverse',
    'shift',
    'sort',
    'splice',
    'unshift'
  ], function ( name ) {
    var method = ArrayProto[ name ];

    _.prototype[ name ] = function () {
      var obj = this._wrapped;

      method.apply( obj, arguments );

      if ( ( name === 'shift' || name === 'splice' ) && obj.length === 0 ) {
        delete obj[ 0 ];
      }

      return chainResult( this, obj );
    };
  } );

  _.each( [ 'concat', 'join', 'slice' ], function ( name ) {
    var method = ArrayProto[ name ];

    _.prototype[ name ] = function () {
      return chainResult( this, method.apply( this._wrapped, arguments ) );
    };
  } );

  _.prototype.value = function () {
    return this._wrapped;
  };

  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function () {
    return String( this._wrapped );
  };

  if ( typeof define == 'function' && define.amd ) {
    define( 'underscore', [], function () {
      return _;
    } )
  }
} )();
