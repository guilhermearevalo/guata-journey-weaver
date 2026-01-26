-- 1. Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('client', 'consultant', 'manager', 'admin', 'partner');

-- 2. Create enum for travel request status
CREATE TYPE public.request_status AS ENUM ('pending', 'in_analysis', 'proposal_sent', 'approved', 'in_operation', 'completed', 'cancelled');

-- 3. Create enum for experience type
CREATE TYPE public.experience_type AS ENUM ('package', 'excursion', 'custom', 'thematic');

-- 4. Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create user_roles table (SECURITY: roles stored separately)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'client',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 6. Create partner_agencies table
CREATE TABLE public.partner_agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cnpj TEXT,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    address TEXT,
    logo_url TEXT,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Create partner_users linking table
CREATE TABLE public.partner_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    agency_id UUID REFERENCES public.partner_agencies(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, agency_id)
);

-- 8. Create experiences table
CREATE TABLE public.experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    short_description TEXT,
    destination TEXT NOT NULL,
    experience_type experience_type NOT NULL DEFAULT 'package',
    price DECIMAL(10,2),
    duration_days INTEGER,
    max_participants INTEGER,
    inclusions TEXT[],
    exclusions TEXT[],
    itinerary JSONB DEFAULT '[]',
    images TEXT[] DEFAULT '{}',
    cover_image TEXT,
    target_audience TEXT,
    departure_dates JSONB DEFAULT '[]',
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    operator_agency_id UUID REFERENCES public.partner_agencies(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Create travel_requests table (demandas)
CREATE TABLE public.travel_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    destination TEXT,
    travel_dates JSONB,
    travelers_count INTEGER DEFAULT 1,
    budget_range TEXT,
    preferences JSONB DEFAULT '{}',
    special_requests TEXT,
    status request_status NOT NULL DEFAULT 'pending',
    assigned_consultant_id UUID REFERENCES auth.users(id),
    assigned_agency_id UUID REFERENCES public.partner_agencies(id),
    internal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. Create proposals table
CREATE TABLE public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.travel_requests(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    agency_id UUID REFERENCES public.partner_agencies(id),
    title TEXT NOT NULL,
    description TEXT,
    total_price DECIMAL(10,2),
    itinerary JSONB DEFAULT '[]',
    inclusions TEXT[],
    documents TEXT[] DEFAULT '{}',
    is_approved BOOLEAN DEFAULT false,
    client_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 11. Create messages table (comunicação interna)
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.travel_requests(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    channel TEXT DEFAULT 'platform',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 12. Create bookings table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    experience_id UUID REFERENCES public.experiences(id) ON DELETE SET NULL,
    request_id UUID REFERENCES public.travel_requests(id) ON DELETE SET NULL,
    proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    travelers_count INTEGER DEFAULT 1,
    travel_date DATE,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'pending',
    vouchers TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 13. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 14. Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- 15. Create function to check if user is staff (consultant, manager, or admin)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('consultant', 'manager', 'admin')
    )
$$;

-- 16. Create function to get user's partner agency
CREATE OR REPLACE FUNCTION public.get_user_agency(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT agency_id
    FROM public.partner_users
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- 17. Profiles policies
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

-- 18. User roles policies (only admins can manage)
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 19. Experiences policies
CREATE POLICY "Anyone can view published experiences"
ON public.experiences FOR SELECT
TO anon, authenticated
USING (is_published = true);

CREATE POLICY "Staff can view all experiences"
ON public.experiences FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage experiences"
ON public.experiences FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()));

-- 20. Travel requests policies
CREATE POLICY "Clients can view own requests"
ON public.travel_requests FOR SELECT
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Clients can create requests"
ON public.travel_requests FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Staff can view all requests"
ON public.travel_requests FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage requests"
ON public.travel_requests FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Partners can view assigned requests"
ON public.travel_requests FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'partner') 
    AND assigned_agency_id = public.get_user_agency(auth.uid())
);

-- 21. Allow anonymous travel request creation
CREATE POLICY "Anyone can create travel request"
ON public.travel_requests FOR INSERT
TO anon
WITH CHECK (true);

-- 22. Proposals policies
CREATE POLICY "Clients can view proposals for their requests"
ON public.proposals FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.travel_requests tr
        WHERE tr.id = request_id AND tr.client_id = auth.uid()
    )
);

CREATE POLICY "Staff can manage all proposals"
ON public.proposals FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Partners can manage their proposals"
ON public.proposals FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'partner') 
    AND agency_id = public.get_user_agency(auth.uid())
);

-- 23. Messages policies
CREATE POLICY "Users can view their messages"
ON public.messages FOR SELECT
TO authenticated
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Staff can view request messages"
ON public.messages FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

-- 24. Bookings policies
CREATE POLICY "Clients can view own bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Staff can manage all bookings"
ON public.bookings FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()));

-- 25. Partner agencies policies
CREATE POLICY "Staff can view all agencies"
ON public.partner_agencies FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can manage agencies"
ON public.partner_agencies FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can view own agency"
ON public.partner_agencies FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'partner') 
    AND id = public.get_user_agency(auth.uid())
);

-- 26. Partner users policies
CREATE POLICY "Admins can manage partner users"
ON public.partner_users FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 27. Create trigger for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email
    );
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'client');
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 28. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 29. Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_agencies_updated_at
BEFORE UPDATE ON public.partner_agencies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_experiences_updated_at
BEFORE UPDATE ON public.experiences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_travel_requests_updated_at
BEFORE UPDATE ON public.travel_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at
BEFORE UPDATE ON public.proposals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();