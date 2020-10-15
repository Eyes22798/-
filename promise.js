/*
  自定义Promise函数模块
*/

(function (window) {

  const PENDING = 'pending'
  const RESOLVED = 'resolved'
  const REJECTED = 'rejected'

  class Promise {
    constructor (excutor) {
      const self = this
      // 定义 Promise 的状态，并初值为 pending
      self.status = PENDING
      // 定义 data，保存 Promise 返回的结果
      self.data = undefined
      // 定义执行器函数 excutor 元素的结构
      self.callbacks = []

      function resolve (value) {
        // 如果初始 status 不为 pending 不执行函数
        if (self.status !== PENDING) {
          return
        }
        // 改变状态
        self.status = RESOLVED
        // 保存数据
        self.data = value
        // 判断 excutor 中 resolve 有没有回调参数
        // 有立即执行异步回调函数
        console.log(`excutor中的resolve执行了${++resolveTimes}次`)
        if (self.callbacks.length > 0) {
          setTimeout(() => {
            self.callbacks.forEach(callbacksObj => {
              callbacksObj.onResolved(value)
              console.log('已将value值传给了后面的回调函数')
            })
          })
        }
      }
  
      function reject (reason) {
        // 如果初始 status 不为 pending 不执行函数
        if (self.status !== PENDING) {
          return
        }
        // 改变状态
        self.status = REJECTED
        // 保存数据
        self.data = reason
        // 判断 excuto 中 reject 有没有回调参数
        // 有立即执行异步回调函数
        if (self.callbacks.length > 0) {
          console.log(`excutor中的reject执行了${++rejectTimes}次`)
          setTimeout(() => {
            self.callbacks.forEach(callbacksObj => {
              callbacksObj.onRejected(reason)
              console.log('已将reason值传给了后面的回调函数')
            })
          })
        }
  
      }
  
      // 立即执行 excutor 执行器函数
      try {
        excutor (resolve, reject)
      } catch (error) {
        // 如果执行器抛出异常, Promise 对象变为 rejected 状态
        reject(error)
        throw new Error()
      }
    }

    /*
      Promise构造函数 原型方法：then
      指定成功或者失败的回调函数
      返回一个新的 Promise 对象
      */
    then (onResolved, onRejected) {
      // 指定默认失败回调的值，实现错误/异常穿透的关键点
      onResolved = typeof onResolved === 'function' ? onResolved : value => value // 向后传递成功的值value
      onRejected = typeof onRejected === 'function' ? onRejected : reason => {  // 向后传递失败的reason原因
        throw reason
      }

      const self = this
      // 返回一个新的promise
      return new Promise((resolve, reject) => {
        /*
          调用指定的回调函数处理
          根据执行结果改变其promise状态
        */
        function handle (callback) {
          /*
            1.第一种情况，如果抛出异常，return的promise就会失败,reason就是error
            2.第二种情况，如果回调函数返回的不是promise，return的promise就会成功，value就是返回的值
            3.第三种情况，如果回调函数返回的是一个promise,return的promise结果就是这个promise的结果
          */
          try {
           // 第三种情况
           const result = callback(self.data)
           if (result instanceof Promise) {
            console.log('第三种情况，是promise')
            result.then(
              value => resolve(value), // 当result成功时，让return的promise也成功
              reason => reject(reason) // 当result失败时，让return的promise也失败
            )
            // result.then(resolve, reject) 简洁写法
           } else {
            // 第二种情况
            console.log('第二种情况，不是promise')
            resolve(result) // 触发excutor中的resolve函数
           }
          } catch (error) {
            // 第一种情况
            console.log('第一种情况，抛出异常')
            reject(error) // 触发excutor中的reject函数
          }
        }
        if (self.status === PENDING) {
          // 当前状态是pending状态，将回调函数保存起来
          // 实现链式调用
          console.log('我是pinding状态')
          self.callbacks.push({
            onResolved (value) {
              handle(onResolved)
            },
            onRejected (reason) {
              handle(onRejected)
            }
          })
        } else if (self.status === RESOLVED) {
          console.log('我是resolve状态')
          setTimeout(() => { // 当前状态是resolve状态，异步执行onResolved
            handle(onResolved)
          }, 100)
        } else {
          setTimeout(() => {
            console.log('我是rejected状态')
            handle(onRejected)
          }, 100)
        }
      })
    }

    /*
      Promise构造函数 原型方法：catch
      指定失败的回调函数
      返回一个新的 Promise 对象
    */
    catch (onRejected) {
       /*
        catch 相当于只有onReject错误.then原型方法
        return 为了中断promise
      */
      return this.then(undefined, onRejected)
    }

    /*
      Promise函数对象 方法 resolve
      返回一个指定 value 成功的 promise
    */
    static resolve (value) {
      return new Promise((resolve, reject) => {
        // 判断value是不是promsie
        if (value instanceof Promise) { // 如果value是，返回的结果就是这个promise自己的结果
          value.then(resolve, reject)
        } else { // 如果不是，返回一个指定value值的，成功的 promise
          resolve(value)
        }
      })
    }

    /*
      Promise函数对象 方法 reject
      返回一个指定 reason 失败的 promise
    */
    static reject (reason) {
      return new Promise((resolve, reject) => {
        reject(reason)
      })
    }

    /*
      Promise函数对象 方法 all
      iterable promise 数组
      只有所有的 iterable 都成功后，返回一个新的 promise
    */
    static all (iterable) {
      const values = new Array(iterable.length)
      let resolvedCount = 0

      return new Promise((resolve, reject) => {
        iterable.forEach((p, index) => {
         Promise.resolve(p).then(
           value => {
            resolvedCount++
            values[index] = value
            if (resolvedCount === iterable.length) {
              resolve(values)
            }
           },
           reason => {
             reject(reason)
           }
         )
        })
      })
    }

    /*
      Promise函数对象 方法 race
      iterable promise 数组
      只要有一个 iterable 执行成功后，返回结果由第一个执行成功的 promise 决定
    */
    static race (iterable) {
      return new Promise((resolve, reject) => {
        iterable.forEach(p => {
          Promise.resolve(p).then(
            value => {
              resolve(value)
            },
            reason => {
              reject(reason)
            }
          )
        })
      })
    }

    /*
      返回一个promise对象，其在指定的时间后才确定结果
    */
    static resolveDelay (value, time) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (value instanceof Promise) {
            value.then(resolve, reject)
          } else {
            resolve(value)
          }
        }, time)
      })
    }

    /*
      返 回一个promise对象，其在指定的时间后才失败
    */
    static rejectDelay (reason, time) {
      return new Promise ((resolve, reject) => {
        setTimeout(() => {
          reject(reason)
        }, time)
      })
    }
  }

})(window)
