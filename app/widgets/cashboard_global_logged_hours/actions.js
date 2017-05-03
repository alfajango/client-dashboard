import { requestData, invalidateData } from '../../src/actions'

export const DATE_RANGE_UPDATE = 'DATE_RANGE_UPDATE';

export function updateDateRange(serviceName, serviceId, data) {
  return function(dispatch) {
    dispatch(requestData(serviceId, data));
    emitters[serviceName + '-' + serviceId](data);
  };
}
