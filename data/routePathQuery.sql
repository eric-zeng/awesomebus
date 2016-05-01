-- This query gets lat/long points for the path of every route, as well as the
-- sequence they occur in.
-- Since each route can have duplicate points and sequence numbers, the query
-- limits results to a single trip id per route.
select shapes.shape_pt_lon, shapes.shape_pt_lat, routes.route_short_name, shapes.shape_pt_sequence
from trips, routes, shapes, (
  -- This query returns a pairing of a single trip id to route number.
  -- To pick on trip id per route, we query for the minimum trip id. This might
  -- not be a great heuristic for finding the standard weekday route.
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
