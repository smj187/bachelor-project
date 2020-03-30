import axios from "axios"


export default function fetchDataAsync(url, request) {
  axios.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8"
  return axios.post(url, JSON.stringify(request))
    .then((response) => Promise.resolve(response))
    .catch((error) => Promise.reject(error))
}
