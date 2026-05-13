import axios from 'axios'

// All requests go through the Vite proxy → FastAPI at localhost:8000
const client = axios.create({ baseURL: '/api' })

// Inject the current user header on every request
// activeUserId is set by the user switcher in the UI
let activeUserId = 'muzammil'

export function setActiveUser(userId) {
  activeUserId = userId
}

client.interceptors.request.use((config) => {
  config.headers['X-User-Id'] = activeUserId
  return config
})

// --- API functions ---

export const api = {
  getUsers: () =>
    client.get('/users').then((r) => r.data),

  getMine: () =>
    client.get('/commitments/mine').then((r) => r.data),

  getIncoming: () =>
    client.get('/commitments/incoming').then((r) => r.data),

  getLedger: () =>
    client.get('/commitments/ledger').then((r) => r.data),

  createCommitment: (payload) =>
    client.post('/commitments', payload).then((r) => r.data),

  updateCommitment: (id, payload) =>
    client.patch(`/commitments/${id}`, payload).then((r) => r.data),
}