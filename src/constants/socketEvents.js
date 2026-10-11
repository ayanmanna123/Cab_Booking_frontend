export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_USER_ROOM: 'join:user',
  JOIN_DRIVER_ROOM: 'join:driver',

  DRIVER_LOCATION_UPDATE: 'driver:location_update',
  DRIVER_STATUS_TOGGLE: 'driver:status_toggle',
  NEARBY_DRIVERS: 'drivers:nearby',

  RIDE_REQUESTED: 'ride:requested',
  RIDE_SEARCHING: 'ride:searching',
  RIDE_NEW_OFFER: 'ride:new_offer',
  RIDE_ACCEPT: 'ride:accept',
  RIDE_ACCEPTED: 'ride:accepted',
  RIDE_DECLINE: 'ride:decline',
  RIDE_DRIVER_ARRIVING: 'ride:driver_arriving',
  RIDE_DRIVER_ARRIVED: 'ride:driver_arrived',
  RIDE_START: 'ride:start',
  RIDE_STARTED: 'ride:started',
  RIDE_COMPLETE: 'ride:complete',
  RIDE_COMPLETED: 'ride:completed',
  RIDE_CANCEL: 'ride:cancel',
  RIDE_CANCELLED: 'ride:cancelled',

  RIDE_TRACK_LOCATION: 'ride:track_location',

  SOS_TRIGGER: 'sos:trigger',
  SOS_ALERT_BROADCAST: 'sos:alert_broadcast'
};
