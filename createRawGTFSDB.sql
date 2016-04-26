create table trips (route_id decimal,
					service_id decimal,
					trip_id decimal,
					trip_headsign text,
					trip_short_name text,
					direction_id decimal,
					block_id decimal,
					shape_id decimal,
					peak_flag decimal,
					fare_id decimal
					);
create table routes (route_id decimal,
					agency_id text,
					route_short_name text,
					route_long_name text,
					route_desc text,
					route_type decimal,
					route_url text,
					route_color text, /* ?? maybe ??*/
					route_text_color text /*# ?? maybe ??*/
					);
create table shapes (shape_id decimal,
					shape_pt_lat decimal,
					shape_pt_lon decimal,
					shape_pt_sequence decimal,
					shape_dist_traveled decimal
					);

\copy trips from 'data/trips_noheader.txt' delimiter ',' csv;
\copy routes from 'data/routes_noheader.txt' delimiter ',' csv;
\copy shapes from 'data/shapes_noheader.txt' delimiter ',' csv;



create table allData (
					route_id decimal,
					service_id decimal,
					trip_id decimal,
					trip_headsign text,
					trip_short_name text,
					direction_id decimal,
					block_id decimal,
					shape_id decimal,
					peak_flag decimal,
					fare_id decimal,
					agency_id text,
					route_short_name text,
					route_long_name text,
					route_desc text,
					route_type decimal,
					route_url text,
					route_color text, /* ?? maybe ??*/
					route_text_color text, /*# ?? maybe ??*/
					shape_pt_lat decimal,
					shape_pt_lon decimal,
					shape_pt_sequence decimal,
					shape_dist_traveled decimal
					);
/* join trips and routes on route_id
 join trips and shapes on shape_id */

insert into allData (
	select trips.route_id,
			trips.service_id,
			trips.trip_id,
			trips.trip_headsign,
			trips.trip_short_name,
			trips.direction_id,
			trips.block_id,
			trips.shape_id,
			trips.peak_flag,
			trips.fare_id,
			routes.agency_id,
			routes.route_short_name,
			routes.route_long_name,
			routes.route_desc,
			routes.route_type,
			routes.route_url,
			routes.route_color,
			routes.route_text_color,
			shapes.shape_pt_lat,
			shapes.shape_pt_lon,
			shapes.shape_pt_sequence,
			shapes.shape_dist_traveled
	from trips, routes, shapes
	where trips.route_id=routes.route_id
		and trips.shape_id=shapes.shape_id
);


/*\copy allData to 'data/allData.csv' delimiter ',' csv;*/
