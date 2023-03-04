import axiosPackage from 'axios';

const axiosInstance = axiosPackage.create({
  // axios instance config here
  //   withCredentials: true,
  //   xsrfCookieName: 'csrftoken',
  //   xsrfHeaderName: 'X-Csrftoken',
});

export default axiosInstance;
