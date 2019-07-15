/* @flow */

import config from '../config'
import {
  initProxy
} from './proxy'
import {
  initState
} from './state'
import {
  initRender
} from './render'
import {
  initEvents
} from './events'
import {
  mark,
  measure
} from '../util/perf'
import {
  initLifecycle,
  callHook
} from './lifecycle'
import {
  initProvide,
  initInjections
} from './inject'
import {
  extend,
  mergeOptions,
  formatComponentName
} from '../util/index'

let uid = 0

export function initMixin(Vue: Class<Component> ) {
  // 定义原型链上的函数
  Vue.prototype._init = function (options ?: Object) {
    const vm: Component = this
    // a uid
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    // initLifecycle
    // 判断当前vm是否是子级组件
    // 如果当前不是子级组件，则初始化各种玩意
    // 如果是子组件，则找寻当前parent组件，将该vm挂到parent上去
    initLifecycle(vm)
    // initEvents
    // 对初始化数据进行修改，判断是否有父组件（parentListeners）
    // 如果有，则将父组件事件对象种种关联到当前组件上（updateComponentListeners）
    // 如果无，则啥也不干
    initEvents(vm)
    // initRender
    // 这里主要是定义输出dom的函数，而不是输出dom！
    // 判断当前是否是父节点，是否有slot节点，合并之类的
    // 查看当前是否有定义$attrs、$listeners对象
    // 有的话则dom与该处定义的attrs data进行单向绑定
    // 这也是种父子组件交互方式，是除了prop、vuex以外的方式
    // https://juejin.im/post/5ae4288a5188256712784787
    initRender(vm)
    // callHook(vm, 'beforeCreate')
    // 回调用户定义的“beforeCreate”钩子
    // beforeCreate是还未生成data以及methods等方法的
    callHook(vm, 'beforeCreate')
    // initInjections
    // 主要是provide与inject的判断执行
    // inject只适用于当前是子组件
    // inject用来接收父组件传回provide api的函数，可将其调用
    // https://cn.vuejs.org/v2/guide/components-edge-cases.html#%E4%BE%9D%E8%B5%96%E6%B3%A8%E5%85%A5
    initInjections(vm) // resolve injections before data/props
    // initState
    // 当前有props时，执行
    // 当有methods时，定义
    // data 定义
    // computed 定义
    // watch 定义
    initState(vm)
    // initProvide
    // 主要是provide与inject的判断执行
    // provide只适用当前是父组件，且有子组件需要用到当前组件的方法时所使用的
    // 当前组件使用了provide api的情况下，他则会查找子组件定义inject
    // 映射父节点暴露的api，让层层嵌套组件 方法变得容易使用
    initProvide(vm) // resolve provide after data/props
    // callHook(vm, 'created')
    // 回调用户定义的“created”钩子
    // 当前数据模型已生成，可调用methods、data等操作
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }
    // 开始对template渲染做操作
    // 将之前定义好的render操作挂到当前vm下，执行
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

export function initInternalComponent(vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions(Ctor: Class<Component> ) {
  let options = Ctor.options
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions(Ctor: Class<Component> ): ? Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
