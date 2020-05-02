import axios from "axios"


/**
 * Makes a single HTTP POST request to an endpoint.
 * @async
 * @param {String} url The server endpoint URL.
 * @param {Array.<Number>} body An array containing ids.
 */
const Request = async (url, body) => {
  return await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json;charset=utf-8" },
    body: JSON.stringify(body),
  })
    .then((response) => Promise.resolve(response.json()))
    .catch((error) => Promise.reject(error))
}

/**
 * Makes multiple HTTP POST requests to an endpoint.
 * @async
 * @param {Array.<Object>} requests An array of objects of URLs and ids.
 */
const RequestMultiple2 = async (requests) => {
  return await Promise.all(requests.map(({ url, body }) => {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify(body),
    })
      .then((response) => Promise.resolve(response.json()))
      .catch((error) => Promise.reject(error))
  }))
}

const RequestMultiple = (requests) => {
  axios.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8"
  const reqs = requests.map((r) => axios.post(r.url, JSON.stringify(r.body)))
  return axios
    .all(reqs)
    .then(axios.spread((...response) => {
      const res1 = response[0]
      const res2 = response[1]
      return [res1, res2]
    }))
    .catch((error) => Promise.reject(error))
}

export { Request, RequestMultiple, RequestMultiple2 }
