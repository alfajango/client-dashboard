import { requestData, invalidateData } from '../../src/actions'

export const SELECT_CLIENT = 'SELECT_CLIENT';

export function selectClient(serviceName, serviceId, clientId) {
  return function(dispatch) {
    dispatch(invalidateData(serviceId));
    dispatch(requestData(serviceId, {clientId: clientId}));
    emitters[serviceName + '-' + serviceId]({clientId: clientId});
  };
}
