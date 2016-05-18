-- This query gets the min and max trip times for each route by route name
-- It does not filter on trip id, like the route query data does
select routes.route_short_name,
  trips.trip_id,
  MIN(stop_times.arrival_time),
  MAX(stop_times.arrival_time)
from trips, stop_times, routes
where trips.route_id=routes.route_id
 and trips.trip_id=stop_times.trip_id
 /*and routes.route_short_name='1'*/
group by routes.route_short_name, trips.trip_id
order by routes.route_short_name;