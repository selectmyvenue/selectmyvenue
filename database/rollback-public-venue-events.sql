CREATE OR REPLACE FUNCTION public.smv_public_venues()
 RETURNS TABLE(venue jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object(
    'id', v.id,
    'venue_name', v.venue_name,
    'venue_type', v.venue_type,
    'description', v.description,
    'city', v.city,
    'area', v.area,
    'capacity_min', v.capacity_min,
    'capacity_max', v.capacity_max,
    'price_min_per_person', v.price_min_per_person,
    'price_max_per_person', v.price_max_per_person,
    'food_veg', v.food_veg,
    'food_non_veg', v.food_non_veg,
    'parking_available', v.parking_available,
    'rooms_available', v.rooms_available,
    'room_count', v.room_count,
    'catering_available', v.catering_available,
    'decoration_available', v.decoration_available,
    'google_maps_url', v.google_maps_url,
    'cover_image_url', v.cover_image_url,
    'featured', v.featured
  ) as venue
  from public.venues v
  where v.venue_status = 'approved'
    and v.verification_status = 'verified'
    and v.public_listing_enabled = true
  order by v.featured desc, v.venue_name asc;
$function$;
