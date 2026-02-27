// TODO: Axios client — all backend calls go through here
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
})

export default api
