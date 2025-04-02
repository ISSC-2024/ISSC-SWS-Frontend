/**
 * UnityService - 提供与Unity WebGL通信的服务
 * 
 * 该服务封装了前端与Unity WebGL通信的所有功能，包括：
 * 1. 向Unity发送消息
 * 2. 监听Unity发送的事件
 * 
 * 使用说明：
 * - 该服务依赖于Unity WebGL导出时生成的通信接口
 * - 需要在页面加载Unity后才能正常工作
 * - 所有组件应直接使用此服务与Unity通信，而非通过UnityContainer
 * 
 * @example
 * ```typescript
 * // 导入服务
 * import UnityService from '../services/UnityService';
 * 
 * // 发送消息到Unity
 * UnityService.sendMessageToUnity('GameObjectName', 'MethodName', 'Parameter');
 * 
 * // 监听Unity事件
 * const handleMessage = (data) => console.log('收到消息:', data);
 * UnityService.addUnityEventListener('eventName', handleMessage);
 * 
 * // 组件卸载时移除监听
 * UnityService.removeUnityEventListener('eventName', handleMessage);
 * ```
 */

/**
 * 获取Unity实例
 * 
 * @private 内部使用的工具函数，用于获取全局Unity实例
 * @returns Unity实例对象，如果未初始化则返回null或undefined
 */
const getUnityInstance = (): any => {
  return (window as any).MyGameInstance;
};

/**
 * 向Unity发送消息
 * 
 * 通过Unity WebGL的SendMessage接口向指定游戏对象发送消息
 * 
 * @param gameObject Unity场景中的游戏对象名称
 * @param method 要调用的方法名
 * @param parameter 传递给方法的参数(可选)
 * @returns {boolean} 发送是否成功
 * 
 * @example
 * ```typescript
 * // 发送当前时间到Unity的MessageTest对象
 * UnityService.sendMessageToUnity('MessageTest', 'frontend2unity', new Date().toLocaleString());
 * ```
 */
export const sendMessageToUnity = (gameObject: string, method: string, parameter: any = '') => {
  const unityInstance = getUnityInstance();
  if (unityInstance && typeof unityInstance.SendMessage === 'function') {
    unityInstance.SendMessage(gameObject, method, parameter);
    console.log(`UnityService.ts: 发送消息到Unity: ${gameObject}.${method}(${parameter})`);
    return true;
  } else {
    console.warn('UnityService.ts: Unity实例未初始化，无法发送消息');
    return false;
  }
};

/**
 * 添加Unity事件监听器
 * 
 * 用于接收Unity发出的事件，自动处理事件数据格式
 * 
 * @param eventName 要监听的事件名称
 * @param callback 事件处理回调函数，接收数据参数
 * 
 * @example
 * ```typescript
 * // 监听Unity发送的'frontend_unity'事件
 * const handleUnityMessage = (data) => {
 *   console.log('收到Unity消息:', data);
 *   // 处理接收到的数据...
 * };
 * 
 * UnityService.addUnityEventListener('frontend_unity', handleUnityMessage);
 * ```
 */
export const addUnityEventListener = (eventName: string, callback: (data: any) => void) => {
  window.addEventListener(eventName, (event: any) => {
    if (event.detail && event.detail.arr) {
      callback(event.detail.arr);
    } else {
      callback(event);
    }
  });
};

/**
 * 移除Unity事件监听器
 * 
 * 当组件卸载或不再需要监听事件时，应调用此方法移除监听器，避免内存泄漏
 * 
 * @param eventName 要移除监听的事件名称
 * @param callback 原事件处理回调函数的引用
 * 
 * @example
 * ```typescript
 * // 在组件卸载时移除监听
 * onUnmounted(() => {
 *   UnityService.removeUnityEventListener('frontend_unity', handleUnityMessage);
 * });
 * ```
 */
export const removeUnityEventListener = (eventName: string, callback: (data: any) => void) => {
  window.removeEventListener(eventName, callback as EventListener);
};

/**
 * 检查Unity是否已加载完成
 * 
 * 用于判断Unity实例是否已初始化完成，可在发送消息前检查
 * 
 * @returns {boolean} Unity是否已加载完成
 * 
 * @example
 * ```typescript
 * if (UnityService.isUnityLoaded()) {
 *   UnityService.sendMessageToUnity('GameObject', 'Method', 'Param');
 * } else {
 *   console.warn('Unity尚未加载完成');
 * }
 * ```
 */
export const isUnityLoaded = (): boolean => {
  return getUnityInstance() !== null && getUnityInstance() !== undefined;
};

export default {
  sendMessageToUnity,
  addUnityEventListener,
  removeUnityEventListener,
  isUnityLoaded
}; 