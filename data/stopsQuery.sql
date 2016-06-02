-- Gets the position of each stop, and the routes that use the stop
SELECT stops.stop_name, stops.stop_lat, stops.stop_lon, routes.route_short_name
FROM stops, stop_times, trips, routes
WHERE stops.stop_id=stop_times.stop_id
  AND trips.trip_id=stop_times.trip_id
  AND routes.route_id=trips.route_id;
