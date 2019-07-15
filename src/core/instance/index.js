import {
  initMixin
} from './init'
import {
  stateMixin
} from './state'
import {
  renderMixin
} from './render'
import {
  eventsMixin
} from './events'
import {
  lifecycleMixin
} from './lifecycle'
import {
  warn
} from '../util/index'
// 原型
function Vue(options) {
  // 用户new Vue操作即是从此处执行的
  console.log('new Vue')
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}
// 因为层层export default 所以此处是最开始的核心文件
// 定义_init原型链函数，_init执行的是各个下面mixin定义的初始化流程
initMixin(Vue)
// 定义数据的get set delete watch等双向绑定操作
stateMixin(Vue)
// 定义组件事件的操作，once off emit等
eventsMixin(Vue)
// 定义组件 更新数据响应之类的东西
lifecycleMixin(Vue)
// 定义渲染 $nextTick之类的
renderMixin(Vue)

export default Vue
