import { requestData, invalidateData } from '../../src/actions'

export const SELECT_CLIENT = 'SELECT_CLIENT';

export function selectClient(serviceName, serviceId, data) {
  return function(dispatch) {
    dispatch(requestData(serviceId, data));
    emitters[serviceName + '-' + serviceId]({clientId: data.clientId});
  };
}
