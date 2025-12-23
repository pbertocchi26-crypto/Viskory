/*
  # Create RPC Functions for Brand Request Approval

  ## Functions
  
  1. **approve_brand_request(request_id uuid)**
    - Atomically approves a brand request
    - Creates brand record from request data
    - Updates profile role to BRAND
    - Marks request as APPROVED
    - Returns success status
  
  2. **reject_brand_request(request_id uuid, note text)**
    - Marks request as REJECTED
    - Stores admin note with rejection reason
    - Returns success status

  ## Security
  
  - Functions use SECURITY DEFINER to bypass RLS
  - Functions check that caller is ADMIN before executing
  - All operations are transactional (all succeed or all fail)
*/

-- Function to approve brand request
CREATE OR REPLACE FUNCTION approve_brand_request(request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  request_record record;
  brand_data jsonb;
  brand_slug text;
  new_brand_id uuid;
  caller_role text;
BEGIN
  -- Check if caller is admin
  SELECT role INTO caller_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF caller_role != 'ADMIN' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only admins can approve requests'
    );
  END IF;

  -- Get request
  SELECT * INTO request_record
  FROM public.brand_requests
  WHERE id = request_id AND status = 'PENDING';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Request not found or already processed'
    );
  END IF;

  brand_data := request_record.data;

  -- Generate slug from brand name
  brand_slug := lower(regexp_replace(brand_data->>'brandName', '[^a-zA-Z0-9]+', '-', 'g'));
  brand_slug := trim(both '-' from brand_slug);

  -- Check if brand already exists for this user
  IF EXISTS (SELECT 1 FROM public.brands WHERE owner_id = request_record.user_id) THEN
    -- Update existing brand
    UPDATE public.brands
    SET
      brand_name = brand_data->>'brandName',
      slug = brand_slug,
      country = brand_data->>'country',
      city = brand_data->>'city',
      address = brand_data->>'address',
      vat_number = brand_data->>'vatNumber',
      phone = brand_data->>'phone',
      short_bio = brand_data->>'shortBio',
      full_description = brand_data->>'description',
      founded_year = (brand_data->>'foundedYear')::integer,
      business_sector = brand_data->>'businessSector',
      website_url = brand_data->>'websiteUrl',
      instagram_url = brand_data->>'instagramUrl',
      tiktok_handle = brand_data->>'tiktokUrl',
      facebook_url = brand_data->>'facebookUrl',
      pinterest_url = brand_data->>'pinterestUrl',
      linkedin_url = brand_data->>'linkedinUrl',
      target_audience = COALESCE((brand_data->>'targetAudience')::jsonb, '[]'::jsonb),
      average_price_range = brand_data->>'priceRange',
      production_origin = brand_data->>'productionOrigin',
      brand_values = COALESCE((brand_data->>'brandValues')::jsonb, '[]'::jsonb),
      updated_at = now()
    WHERE owner_id = request_record.user_id
    RETURNING id INTO new_brand_id;
  ELSE
    -- Create new brand
    INSERT INTO public.brands (
      owner_id,
      brand_name,
      slug,
      country,
      city,
      address,
      vat_number,
      contact_name,
      email,
      phone,
      short_bio,
      full_description,
      founded_year,
      business_sector,
      website_url,
      instagram_url,
      tiktok_handle,
      facebook_url,
      pinterest_url,
      linkedin_url,
      target_audience,
      average_price_range,
      production_origin,
      brand_values
    ) VALUES (
      request_record.user_id,
      brand_data->>'brandName',
      brand_slug,
      brand_data->>'country',
      brand_data->>'city',
      brand_data->>'address',
      brand_data->>'vatNumber',
      brand_data->>'name',
      brand_data->>'email',
      brand_data->>'phone',
      brand_data->>'shortBio',
      brand_data->>'description',
      (brand_data->>'foundedYear')::integer,
      brand_data->>'businessSector',
      brand_data->>'websiteUrl',
      brand_data->>'instagramUrl',
      brand_data->>'tiktokUrl',
      brand_data->>'facebookUrl',
      brand_data->>'pinterestUrl',
      brand_data->>'linkedinUrl',
      COALESCE((brand_data->>'targetAudience')::jsonb, '[]'::jsonb),
      brand_data->>'priceRange',
      brand_data->>'productionOrigin',
      COALESCE((brand_data->>'brandValues')::jsonb, '[]'::jsonb)
    )
    RETURNING id INTO new_brand_id;
  END IF;

  -- Update profile role to BRAND
  UPDATE public.profiles
  SET role = 'BRAND', updated_at = now()
  WHERE id = request_record.user_id;

  -- Mark request as approved
  UPDATE public.brand_requests
  SET status = 'APPROVED', updated_at = now()
  WHERE id = request_id;

  RETURN jsonb_build_object(
    'success', true,
    'brand_id', new_brand_id,
    'user_id', request_record.user_id
  );
END;
$$;

-- Function to reject brand request
CREATE OR REPLACE FUNCTION reject_brand_request(request_id uuid, note text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_role text;
  request_exists boolean;
BEGIN
  -- Check if caller is admin
  SELECT role INTO caller_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF caller_role != 'ADMIN' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only admins can reject requests'
    );
  END IF;

  -- Check if request exists and is pending
  SELECT EXISTS(
    SELECT 1 FROM public.brand_requests
    WHERE id = request_id AND status = 'PENDING'
  ) INTO request_exists;
  
  IF NOT request_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Request not found or already processed'
    );
  END IF;

  -- Mark request as rejected
  UPDATE public.brand_requests
  SET 
    status = 'REJECTED',
    admin_note = note,
    updated_at = now()
  WHERE id = request_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Request rejected successfully'
  );
END;
$$;

-- Grant execute permissions to authenticated users (functions check role internally)
GRANT EXECUTE ON FUNCTION approve_brand_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_brand_request(uuid, text) TO authenticated;

-- Add comments
COMMENT ON FUNCTION approve_brand_request IS 'Atomically approves a brand request: creates brand, updates profile role to BRAND, marks request as approved. Admin only.';
COMMENT ON FUNCTION reject_brand_request IS 'Marks a brand request as rejected with admin note. Admin only.';
