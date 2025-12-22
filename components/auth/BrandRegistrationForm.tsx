'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, signInWithOAuth } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Check, ArrowLeft } from 'lucide-react';
import { useLocale } from 'next-intl';

const STEPS = [
  { id: 1, title: 'Account', description: 'Create your account' },
  { id: 2, title: 'Brand Info', description: 'Business details' },
  { id: 3, title: 'Identity', description: 'Visual brand identity' },
  { id: 4, title: 'Social', description: 'Online presence' },
  { id: 5, title: 'Business Model', description: 'Product & target' },
  { id: 6, title: 'Agreement', description: 'Terms & conditions' },
];

const COUNTRIES = [
  'Italy', 'France', 'Germany', 'Spain', 'United Kingdom', 'United States',
  'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Other'
];

const BUSINESS_SECTORS = [
  'Fashion', 'Accessories', 'Footwear', 'Jewelry', 'Cosmetics',
  'Home & Living', 'Art & Crafts', 'Food & Beverage', 'Other'
];

const PRICE_RANGES = [
  { value: 'budget', label: 'Budget (€0-50)' },
  { value: 'mid', label: 'Mid-range (€50-200)' },
  { value: 'premium', label: 'Premium (€200-500)' },
  { value: 'luxury', label: 'Luxury (€500+)' },
];

const PRODUCTION_ORIGINS = [
  { value: 'italy', label: 'Made in Italy' },
  { value: 'europe', label: 'Made in Europe' },
  { value: 'asia', label: 'Made in Asia' },
  { value: 'other', label: 'Other' },
];

const TARGET_AUDIENCES = ['Men', 'Women', 'Unisex', 'Kids'];

const BRAND_VALUES = [
  'Sustainability', 'Craftsmanship', 'Innovation', 'Local Production',
  'Fair Trade', 'Vegan', 'Luxury', 'Minimalism', 'Tradition'
];

export function BrandRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const { setUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const locale = useLocale();

  // Step 1: Account
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Step 2: Brand Information
  const [brandName, setBrandName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [phone, setPhone] = useState('');

  // Step 3: Brand Identity
  const [shortBio, setShortBio] = useState('');
  const [description, setDescription] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [businessSector, setBusinessSector] = useState('');

  // Step 4: Social & Web
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [pinterestUrl, setPinterestUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // Step 5: Business Model
  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState('');
  const [productionOrigin, setProductionOrigin] = useState('');
  const [brandValues, setBrandValues] = useState<string[]>([]);

  // Step 6: Agreement
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const progress = (currentStep / STEPS.length) * 100;

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    const { error } = await signInWithOAuth(provider);

    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
      setOauthLoading(null);
    }
  };

  const handleStep1Submit = async () => {
    if (!name || !email || !password) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { user, error } = await signUp(email, password, name, 'BRAND');

    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (user) {
      setUserId(user.id);
      setUser(user);
      setCurrentStep(2);
    }

    setLoading(false);
  };

  const handleFinalSubmit = async () => {
    if (!acceptTerms || !acceptPrivacy) {
      toast({
        title: 'Error',
        description: 'Please accept terms and privacy policy',
        variant: 'destructive',
      });
      return;
    }

    if (!userId) {
      toast({
        title: 'Error',
        description: 'User session not found',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create brand record
      const slug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .insert([
          {
            owner_id: userId,
            brand_name: brandName,
            slug,
            country,
            city,
            address: address || null,
            vat_number: vatNumber || null,
            contact_name: name || null,
            email: email || null,
            phone: phone || null,
            short_bio: shortBio,
            full_description: description,
            founded_year: foundedYear ? parseInt(foundedYear) : null,
            business_sector: businessSector,
            website_url: websiteUrl,
            instagram_url: instagramUrl || null,
            tiktok_handle: tiktokUrl || null,
            facebook_url: facebookUrl || null,
            pinterest_url: pinterestUrl || null,
            linkedin_url: linkedinUrl || null,
            target_audience: targetAudience,
            average_price_range: priceRange,
            production_origin: productionOrigin,
            brand_values: brandValues,
          },
        ])
        .select()
        .single();

      if (brandError) {
        throw new Error(brandError.message);
      }

      // Update user role to BRAND
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (currentUser) {
        const { error: roleUpdateError } = await supabase
          .from('profiles')
          .update({ role: 'BRAND' })
          .eq('id', currentUser.id);

        if (roleUpdateError) {
          console.error('Error updating user role:', roleUpdateError);
        }
      }

      toast({
        title: 'Success',
        description: 'Brand registered successfully!',
      });

      router.push('/dashboard/brand');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedStep2 = brandName && country && city && vatNumber && phone;
  const canProceedStep3 = shortBio && description && foundedYear && businessSector;
  const canProceedStep4 = websiteUrl;
  const canProceedStep5 = targetAudience.length > 0 && priceRange && productionOrigin;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/${locale}`)}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold">Brand Registration</h2>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`text-xs ${
                  currentStep >= step.id ? 'text-blue-600 font-semibold' : 'text-gray-400'
                }`}
              >
                {currentStep > step.id && <Check className="inline h-3 w-3" />}
                {step.title}
              </div>
            ))}
          </div>
        </div>
        <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
        <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Step 1: Account */}
          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={oauthLoading !== null}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {oauthLoading === 'google' ? 'Connecting...' : 'Continue with Google'}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or with email</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Contact Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@brandname.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                />
              </div>

              <Button
                onClick={handleStep1Submit}
                className="w-full"
                disabled={loading || !name || !email || !password}
              >
                {loading ? 'Creating Account...' : 'Continue'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {/* Step 2: Brand Information */}
          {currentStep === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand Name *</Label>
                <Input
                  id="brandName"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Your brand name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full address (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">VAT Number *</Label>
                  <Input
                    id="vatNumber"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    placeholder="IT12345678900"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+39 123 456 7890"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={prevStep} className="flex-1">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={nextStep} className="flex-1" disabled={!canProceedStep2}>
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Brand Identity */}
          {currentStep === 3 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="shortBio">Short Bio * (max 150 characters)</Label>
                <Input
                  id="shortBio"
                  value={shortBio}
                  onChange={(e) => setShortBio(e.target.value.slice(0, 150))}
                  placeholder="Brief description of your brand"
                  required
                  maxLength={150}
                />
                <p className="text-xs text-gray-500">{shortBio.length}/150</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us more about your brand story, values, and what makes you unique..."
                  required
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="foundedYear">Founded Year *</Label>
                  <Input
                    id="foundedYear"
                    type="number"
                    value={foundedYear}
                    onChange={(e) => setFoundedYear(e.target.value)}
                    placeholder="2020"
                    min="1900"
                    max={new Date().getFullYear()}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessSector">Business Sector *</Label>
                  <Select value={businessSector} onValueChange={setBusinessSector}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_SECTORS.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={prevStep} className="flex-1">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={nextStep} className="flex-1" disabled={!canProceedStep3}>
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Step 4: Social & Web */}
          {currentStep === 4 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website URL *</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourbrand.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagramUrl">Instagram Handle</Label>
                <Input
                  id="instagramUrl"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="@yourbrand"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktokUrl">TikTok Handle</Label>
                <Input
                  id="tiktokUrl"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="@yourbrand"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebookUrl">Facebook Page</Label>
                <Input
                  id="facebookUrl"
                  type="url"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com/yourbrand"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pinterestUrl">Pinterest Profile</Label>
                <Input
                  id="pinterestUrl"
                  type="url"
                  value={pinterestUrl}
                  onChange={(e) => setPinterestUrl(e.target.value)}
                  placeholder="https://pinterest.com/yourbrand"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn Company Page</Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/company/yourbrand"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={prevStep} className="flex-1">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={nextStep} className="flex-1" disabled={!canProceedStep4}>
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Step 5: Business Model */}
          {currentStep === 5 && (
            <>
              <div className="space-y-2">
                <Label>Target Audience * (select all that apply)</Label>
                <div className="grid grid-cols-2 gap-4">
                  {TARGET_AUDIENCES.map((audience) => (
                    <div key={audience} className="flex items-center space-x-2">
                      <Checkbox
                        id={audience}
                        checked={targetAudience.includes(audience)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTargetAudience([...targetAudience, audience]);
                          } else {
                            setTargetAudience(targetAudience.filter((a) => a !== audience));
                          }
                        }}
                      />
                      <Label htmlFor={audience} className="font-normal cursor-pointer">
                        {audience}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceRange">Average Price Range *</Label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select price range" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productionOrigin">Production Origin *</Label>
                <Select value={productionOrigin} onValueChange={setProductionOrigin}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select production origin" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCTION_ORIGINS.map((origin) => (
                      <SelectItem key={origin.value} value={origin.value}>
                        {origin.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Brand Values (select all that apply)</Label>
                <div className="grid grid-cols-2 gap-4">
                  {BRAND_VALUES.map((value) => (
                    <div key={value} className="flex items-center space-x-2">
                      <Checkbox
                        id={value}
                        checked={brandValues.includes(value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setBrandValues([...brandValues, value]);
                          } else {
                            setBrandValues(brandValues.filter((v) => v !== value));
                          }
                        }}
                      />
                      <Label htmlFor={value} className="font-normal cursor-pointer">
                        {value}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={prevStep} className="flex-1">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={nextStep} className="flex-1" disabled={!canProceedStep5}>
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Step 6: Agreement */}
          {currentStep === 6 && (
            <>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Platform Summary</h3>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• 100% Free for brands - No subscription fees</li>
                    <li>• No commission on sales</li>
                    <li>• Showcase your products to targeted audience</li>
                    <li>• Track clicks and engagement analytics</li>
                    <li>• Sales happen on your website</li>
                  </ul>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                    I accept the{' '}
                    <a href="/terms" target="_blank" className="text-blue-600 underline">
                      Terms & Conditions
                    </a>
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacy"
                    checked={acceptPrivacy}
                    onCheckedChange={(checked) => setAcceptPrivacy(checked as boolean)}
                  />
                  <Label htmlFor="privacy" className="text-sm font-normal cursor-pointer">
                    I accept the{' '}
                    <a href="/privacy" target="_blank" className="text-blue-600 underline">
                      Privacy Policy
                    </a>
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox id="confirm" defaultChecked disabled />
                  <Label htmlFor="confirm" className="text-sm font-normal text-gray-600">
                    I confirm that all provided information is accurate
                  </Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={prevStep} className="flex-1">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleFinalSubmit}
                  className="flex-1"
                  disabled={loading || !acceptTerms || !acceptPrivacy}
                >
                  {loading ? 'Creating Brand...' : 'Complete Registration'}
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
