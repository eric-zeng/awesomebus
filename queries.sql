# Find a single trip ID for each route.
# Currently finds the minimum id - not sure if this is a great heuristic for
# finding the standard weekday route.
select routes.route_short_name, MIN(trips.trip_id)
from trips, routes
where trips.route_id=routes.route_id
group by routes.route_short_name
order by routes.route_short_name;

# Get lat/long, route name, and sequence number for every route.
# Nest the previous query to limit the results to a single trip.
select shapes.shape_pt_lat, shapes.shape_pt_lon, routes.route_short_name, shapes.shape_pt_sequence
from trips, routes, shapes, (
  select routes.route_short_name, MIN(trips.trip_id) as trip_id
  from trips, routes
  where trips.route_id=routes.route_id
  group by routes.route_short_name
  order by routes.route_short_name
) as trip_per_route
where trips.route_id=routes.route_id
  and trips.shape_id=shapes.shape_id
  and trips.trip_id=trip_per_route.trip_id
order by routes.route_short_name, shapes.shape_pt_sequence;
