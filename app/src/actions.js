export const INVALIDATE_INVOICES = 'INVALIDATE_INVOICES'

export function invalidateInvoices(service) {
  return {
    type: INVALIDATE_INVOICES,
    service
  }
}

export const REQUEST_DATA = 'REQUEST_DATA'

export function requestData(service) {
  return {
    type: REQUEST_DATA,
    service
  }
}

export const RECEIVE_DATA = 'RECEIVE_DATA'

export function receiveData(data) {
  return {
    type: RECEIVE_DATA,
    serviceId: data.meta.serviceId,
    data: data.data,
    receivedAt: Date.now()
  }
}
