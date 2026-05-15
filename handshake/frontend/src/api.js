import axios from 'axios'

const client = axios.create({ baseURL: '/api' })

let activeUserId = 'muzammil'

export function setActiveUser(userId) {
  activeUserId = userId
}

client.interceptors.request.use((config) => {
  config.headers['X-User-Id'] = activeUserId
  return config
})

const unwrap = (request) => request.then((response) => response.data)

export const api = {
  getUsers: () => unwrap(client.get('/users')),
  getMine: () => unwrap(client.get('/commitments/mine')),
  getIncoming: () => unwrap(client.get('/commitments/incoming')),
  getLedger: () => unwrap(client.get('/commitments/ledger')),
  createCommitment: (payload) => unwrap(client.post('/commitments', payload)),
  updateCommitment: (id, payload) => unwrap(client.patch(`/commitments/${id}`, payload)),
}
