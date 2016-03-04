import { requestData } from '../../src/actions'

export const SELECT_CLIENT = 'SELECT_CLIENT';

export function selectClient(serviceName, serviceId, clientId) {
  return function(dispatch) {
    dispatch(requestData(serviceId));
    emitters[serviceName + '-' + serviceId]({clientId: clientId});
  };
}
