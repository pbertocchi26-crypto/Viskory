# Viskory - Emerging Clothing Brands Marketplace

Viskory is a complete full-stack marketplace application where emerging clothing brands can create professional profiles, upload products, and sell to users. The platform includes a public storefront, brand dashboards, and a hidden admin panel.

## Features

### Public Features
- **Homepage** with hero section, trending brands, horizontal scrollable brand list, and featured products
- **Brand Directory** with search and filtering
- **Brand Profile Pages** with follow functionality, social links, and product listings
- **Product Detail Pages** with size/color selection and add to cart
- **Shopping Cart** with quantity management
- **Checkout Flow** with fake payment processing (test mode)
- **Order Confirmation** pages

### Brand Dashboard
- **Profile Management** - Create and edit brand profiles (name, slug, logo, cover image, bio, location, social links)
- **Product Management** - Add, edit, delete, and publish/unpublish products
- **Statistics Dashboard** - Track followers, products, orders, and revenue
- Product catalog with inventory tracking

### Admin Panel
Hidden admin area (not visible in public navigation) accessible only to ADMIN users:
- **Overview Dashboard** - Platform-wide statistics
- **User Management** - View and modify user roles
- **Brand Management** - Approve/disable brands, feature brands for homepage
- **Product Management** - Publish/unpublish or delete any product
- **Order Management** - View all orders and their details

### Authentication
- Email/password authentication with bcrypt hashing
- Three user roles: **USER**, **BRAND**, **ADMIN**
- Role-based access control for dashboards and admin areas

## Tech Stack

- **Framework**: Next.js 13 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Database**: PostgreSQL via Supabase
- **Authentication**: Custom implementation with bcryptjs
- **Image Handling**: Next.js Image component

## Database Schema

The application uses Supabase with the following tables:

- **users** - User accounts with roles (ADMIN, BRAND, USER)
- **brands** - Brand profiles with owner relationships
- **products** - Product catalog with brand relationships
- **follows** - User-to-brand following relationships
- **orders** - Order records
- **order_items** - Individual items in orders

All tables have Row Level Security (RLS) enabled with appropriate policies.

## Security Features

The application implements enterprise-grade security measures:

### Row Level Security (RLS)
- All database tables have RLS enabled
- Optimized policies using `(select auth.uid())` for better performance at scale
- Separate policies for each operation (SELECT, INSERT, UPDATE, DELETE)
- Brand owners can only access their own products and data
- Users can only view and modify their own orders

### Database Security
- Foreign key constraints on all relationships
- Comprehensive indexes including:
  - `idx_order_items_product` for order items queries
  - `idx_brands_slug` for brand lookups
  - `idx_products_brand` for product filtering
  - Additional indexes on user_id and brand_id foreign keys
- Function security with immutable search paths
- Triggers with SECURITY DEFINER for controlled privilege elevation

### Authentication Security
- Password hashing with bcrypt (10 rounds)
- Role-based access control (RBAC)
- Client-side session management with localStorage
- Protected routes and API endpoints

### Query Optimization
- Single subquery evaluation of auth functions in RLS policies
- Prevents N+1 query problems at the database level
- Indexed foreign keys for optimal JOIN performance

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- A Supabase account (credentials already configured in .env)

### Installation

1. Install dependencies:
```bash
npm install
```

2. The database is already set up with the schema. If you need to reset it, the migration has already been applied.

3. Seed the database with demo data:

The application includes a seed endpoint. You can seed the database by making a POST request:

```bash
curl -X POST http://localhost:3000/api/seed
```

Or visit the endpoint in your browser after starting the dev server.

### Demo Credentials

After seeding, use these credentials:

**Admin Account:**
- Email: admin@viskory.com
- Password: admin123

**Brand Accounts:**
- Email: sarah@urbanthread.com | Password: password123
- Email: marcus@streetluxe.com | Password: password123
- Email: elena@minimalmuse.com | Password: password123
- Email: david@echoapparel.com | Password: password123

**Regular User Accounts:**
- Email: john@example.com | Password: password123
- Email: jane@example.com | Password: password123
- Email: mike@example.com | Password: password123

### Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
npm run start
```

## Application Structure

```
/app
  /admin                 # Admin panel pages
  /api/seed             # Database seeding endpoint
  /auth                 # Login and signup pages
  /brand/[slug]         # Dynamic brand profile pages
  /brands               # Brand directory
  /cart                 # Shopping cart
  /checkout             # Checkout flow
  /dashboard/brand      # Brand dashboard and management
  /order/[id]           # Order confirmation
  /product/[id]         # Product detail pages
  page.tsx              # Homepage

/components
  /auth                 # Authentication forms
  /ui                   # Shadcn UI components
  BrandCard.tsx         # Brand card component
  ProductCard.tsx       # Product card component
  StatCard.tsx          # Statistics card component
  Navbar.tsx            # Main navigation

/contexts
  AuthContext.tsx       # Authentication state management

/lib
  auth.ts              # Authentication utilities
  trending.ts          # Trending brands calculation
  /supabase
    client.ts          # Supabase client configuration
```

## Key Features Explained

### Trending Brands Algorithm
Brands are ranked based on a score combining:
- Number of followers (weight: 2x)
- Number of products (weight: 10x)
- Orders in last 30 days (weight: 5x)

### Shopping Cart
- Stored in localStorage for persistence
- Supports quantity management
- Handles product variants (size, color)

### Checkout Process
- Fake payment processing (test mode)
- Creates orders and order items in database
- Marks orders as "PAID" status
- Clears cart on successful checkout

### Admin Panel Access
- Only accessible to users with ADMIN role
- Direct URL: `/admin`
- Not visible in public navigation
- Automatic redirect for unauthorized users

## Environment Variables

The `.env` file contains:
```
NEXT_PUBLIC_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[key]
```

## Development Notes

- All images use Pexels stock photos with valid URLs
- Database queries use Supabase's `maybeSingle()` for safer null handling
- Authentication is handled client-side with localStorage
- RLS policies ensure data security at the database level
- Product images are optimized with Next.js Image component
- Horizontal scroll uses custom CSS utilities for cross-browser support

## Future Enhancements

Potential improvements for production:
- Real payment integration (Stripe)
- Image upload functionality
- Email notifications
- Advanced search and filters
- User reviews and ratings
- Order tracking
- Analytics dashboard
- Mobile app

## License

This project is for demonstration purposes.
