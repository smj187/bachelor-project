

/**
 * Makes a single HTTP POST request to an endpoint.
 * @async
 * @param {String} url The server endpoint URL.
 * @param {Array.<Number>} body An array containing ids.
 */
const singlePostRequest = async (url, body) => {
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
const multiplePostRequests = async (requests) => {
  return await Promise.all(requests.map(({ url, body }) => fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json;charset=utf-8" },
    body: JSON.stringify(body),
  })
    .then((response) => Promise.resolve(response.json()))
    .catch((error) => Promise.reject(error))))
}



export { singlePostRequest, multiplePostRequests }
