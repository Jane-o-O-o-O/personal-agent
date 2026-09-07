import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';

// 定义请求参数的类型，这样调用函数时可以得到类型提示和检查
interface RequestParams {
  url: string;
  method: Method; // 'get', 'post', 'put', 'delete'等
  data?: any; // 请求体数据，get请求通常用不到
  params?: any; // URL查询参数，get请求经常用到
}

/**
 * 封装axios请求，提供一个简化的调用方式
 * @param url 请求的URL
 * @param method 请求类型，如'get', 'post', 'put'等
 * @param data 请求体数据，通常用于POST或PUT请求
 * @param params URL查询参数，通常用于GET请求
 * @returns Promise<T> 返回一个Promise，其解析值为接口返回的数据
 */
export async function request<T>(
  url: string,
  method: Method,
  data?: any,
  params?: any
): Promise<T> {
  if (data) {
    console.error('请求地址：', url, '请求数据:', data);
  }
  if (params) {
    console.error('请求地址：', url, '请求参数:', params);
  }
  // 创建Axios请求配置对象
  const config: AxiosRequestConfig = {
    url,
    method,
    data,
    params,
    // 可以在这里添加一些通用的配置，比如超时时间、headers等
    timeout: 10000,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };

  try {
    // 发起请求并等待响应
    const response: AxiosResponse<T> = await axios(config);
    console.error('接口请求结果:\n', response.data);
    // 返回响应中的数据部分
    return response.data;
  } catch (error) {
    // 捕获并处理错误，例如网络错误、服务器响应错误等
    if (axios.isAxiosError(error)) {
      console.error('Request failed:', error.message);
      if (error.response) {
        // 请求已发出，但服务器响应了状态码
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      } else if (error.request) {
        // 请求已发出但没有收到响应
        console.error('No response received:', error.request);
      } else {
        // 设置请求时发生了一些事情，触发了错误
        console.error('Error setting up request:', error.message);
      }
    } else {
      console.error('Unexpected error:', error);
    }
    // 抛出错误，以便调用者可以进一步处理
    throw error;
  }
}