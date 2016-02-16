export const INVALIDATE_DATA = 'INVALIDATE_DATA';

export function invalidateInvoices(service) {
  return {
    type: INVALIDATE_DATA,
    service
  }
}

export const REQUEST_DATA = 'REQUEST_DATA';

export function requestData(service) {
  return {
    type: REQUEST_DATA,
    service
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

export function receiveError(data) {
  return {
    type: RECEIVE_ERROR,
    errors: data.errors,
    receivedAt: Date.now()
  }
}
