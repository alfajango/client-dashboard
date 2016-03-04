export const INVALIDATE_DATA = 'INVALIDATE_DATA';

export function invalidateData(serviceId) {
  return {
    type: INVALIDATE_DATA,
    serviceId
  }
}

export const REQUEST_DATA = 'REQUEST_DATA';

export function requestData(serviceId, data) {
  return {
    type: REQUEST_DATA,
    serviceId,
    data
  }
}

export const RECEIVE_DATA = 'RECEIVE_DATA';

export function receiveData(response) {
  return {
    type: RECEIVE_DATA,
    serviceId: response.serviceId,
    data: response.data,
    receivedAt: Date.now()
  }
}

export const RECEIVE_ERROR = 'RECEIVE_ERROR';

export function receiveError(response) {
  return {
    type: RECEIVE_ERROR,
    serviceId: response.serviceId,
    errors: response.errors,
    receivedAt: Date.now()
  }
}

export const RECEIVE_STATUS = 'RECEIVE_STATUS';

export function receiveStatus(response) {
  return {
    type: RECEIVE_STATUS,
    serviceId: response.serviceId,
    status: response.status,
    receivedAt: Date.now()
  }
}
