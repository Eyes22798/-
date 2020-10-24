class Router {
      constructor () {
        this.routes = {}
        this.currentUrl = '' 
      }

      // 初始化
      init () {
        window.addEventListener('load', this.refresh.bind(this))
        window.addEventListener('hashchange', this.refresh.bind(this))
      }

      route (path, callback) {
        this.routes[path] = callback
      }
      // 路由发生变化
      refresh () {
        this.currentUrl = location.hash.slice(1) || '/'
        this.routes[this.currentUrl]()
      }
    }
