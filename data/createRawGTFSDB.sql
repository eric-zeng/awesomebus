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

\copy trips from 'trips_noheader.txt' delimiter ',' csv;
\copy routes from 'routes_noheader.txt' delimiter ',' csv;
\copy shapes from 'shapes_noheader.txt' delimiter ',' csv;
