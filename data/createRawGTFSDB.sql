create table trips (
    route_id decimal,
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
create table routes (
    route_id decimal,
    agency_id text,
    route_short_name text,
    route_long_name text,
    route_desc text,
    route_type decimal,
    route_url text,
    route_color text,
    route_text_color text
);

create table shapes (
    shape_id decimal,
    shape_pt_lat decimal,
    shape_pt_lon decimal,
    shape_pt_sequence decimal,
    shape_dist_traveled decimal
);

create table stops (
    stop_id decimal,
    stop_code decimal,
    stop_name text,
    stop_desc text,
    stop_lat decimal,
    stop_lon decimal,
    zone_id decimal,
    stop_url text,
    location_type decimal,
    parent_station decimal,
    stop_timezone text
);

create table stop_times (
    trip_id decimal,
    arrival_time text,
    departure_time text,
    stop_id decimal,
    stop_sequence decimal,
    stop_headsign text,
    pickup_type decimal,
    drop_off_type decimal,
    shape_dist_traveled decimal,
    fare_period_id decimal
);

\copy trips from 'trips_noheader.txt' delimiter ',' csv;
\copy routes from 'routes_noheader.txt' delimiter ',' csv;
\copy shapes from 'shapes_noheader.txt' delimiter ',' csv;
\copy stop_times from 'stop_times_noheader.txt' delimiter ',' csv;
\copy stops from 'stops_noheader.txt' delimiter ',' csv;
