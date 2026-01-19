import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateUser } from '@/actions/signup';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { toast } from 'sonner';
import { REGION_KEY } from '@/config/config';
import { Country, State, City } from 'country-state-city';
import { ArrowLeft } from 'lucide-react';
import validatePostalCode from 'postal-codes-js';

const schema = z.object({
  country: z.string().min(1, 'Country is required'),
  province: z.string().min(1, 'Province/State is required'),
  city: z.string().min(1, 'City is required'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  postalCode: z.string().min(1, 'Postal/ZIP code is required'),
});

type FormValues = z.infer<typeof schema>;

interface Step5AdditionalInfoProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  isInvited: boolean;
}

export function Step5AdditionalInfo({ setActiveStep, isInvited }: Step5AdditionalInfoProps) {
  const { signupUser, checkUserSession } = useAuthContext();
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('');
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  const defaultValues = useMemo(
    () => ({
      country: signupUser?.company?.country || '',
      province: signupUser?.company?.province || '',
      city: signupUser?.company?.city || '',
      addressLine1: signupUser?.company?.address?.split(' ')[0] || '',
      addressLine2: '',
      postalCode: signupUser?.company?.postalCode || '',
    }),
    [signupUser]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const values = watch();

  // Initialize country/state/city from user data
  useEffect(() => {
    if (signupUser?.company?.country) {
      setSelectedCountry(signupUser.company.country);
      const country = Country.getAllCountries().find((c) => c.name === signupUser.company.country);
      if (country) {
        setCountryCode(country.isoCode);
        const countryStates = State.getStatesOfCountry(country.isoCode);
        setStates(countryStates);
      }
    }
    if (signupUser?.company?.province) {
      setSelectedState(signupUser.company.province);
    }
    if (signupUser?.company?.city) {
      setSelectedCity(signupUser.company.city);
    }
  }, [signupUser]);

  // Update states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const country = Country.getAllCountries().find((c) => c.name === selectedCountry);
      if (country) {
        setCountryCode(country.isoCode);
        const countryStates = State.getStatesOfCountry(country.isoCode);
        setStates(countryStates);
        setSelectedState('');
        setSelectedCity('');
        setValue('province', '');
        setValue('city', '');
      }
    }
  }, [selectedCountry, setValue]);

  // Update cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const country = Country.getAllCountries().find((c) => c.name === selectedCountry);
      if (country) {
        const countryStates = State.getStatesOfCountry(country.isoCode);
        const state = countryStates.find((s) => s.name === selectedState);
        if (state) {
          const stateCities = City.getCitiesOfState(country.isoCode, state.isoCode);
          setCities(stateCities);
          setSelectedCity('');
          setValue('city', '');
        }
      }
    }
  }, [selectedState, selectedCountry, setValue]);

  const validatePostalCodeField = (postalCode: string, country: string) => {
    if (!countryCode || !postalCode) return true;
    const isValid = validatePostalCode(countryCode, postalCode);
    if (isValid !== true) {
      setError('postalCode', {
        type: 'manual',
        message: `Invalid ${country === 'United States' ? 'ZIP' : 'postal'} code for ${country}`,
      });
      return false;
    }
    clearErrors('postalCode');
    return true;
  };

  const onSubmit = async (data: FormValues) => {
    const region = localStorage.getItem(REGION_KEY);

    // Validate postal code
    if (!validatePostalCodeField(data.postalCode, data.country)) {
      return;
    }

    try {
      const params = {
        address: `${data.addressLine1}${data.addressLine2 ? ` ${data.addressLine2}` : ''}`,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
        country: data.country,
        signUpStepsCompleted: 5,
        ...(region && { currency: region.toUpperCase() === 'CA' ? 'CAD' : 'USD' }),
      };

      const res = await updateUser(params);
      if (res?.status === 200) {
        await checkUserSession?.();
        toast.success(res?.data?.message || 'Address saved');
        setActiveStep(6);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save address');
    }
  };

  const allCountries = Country.getAllCountries();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setActiveStep(4)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">What's your business address?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            To follow anti-spam laws, your address will appear in the footer of every email you send
            with Public Circles. Don't have an official business address?{' '}
            <a
              href="https://publiccircles.com/alternatives"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Learn about alternatives
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select
            value={selectedCountry}
            onValueChange={(value) => {
              setSelectedCountry(value);
              setValue('country', value);
            }}
          >
            <SelectTrigger id="country">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {allCountries.map((country) => (
                <SelectItem key={country.isoCode} value={country.name}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.country && (
            <p className="text-sm text-destructive">{errors.country.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="province">
              {values.country === 'United States' ? 'State' : 'Province/Territory'}
            </Label>
            <Select
              value={selectedState}
              onValueChange={(value) => {
                setSelectedState(value);
                setValue('province', value);
              }}
              disabled={!selectedCountry}
            >
              <SelectTrigger id="province">
                <SelectValue placeholder="Select state/province" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {states.map((state) => (
                  <SelectItem key={state.isoCode} value={state.name}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.province && (
              <p className="text-sm text-destructive">{errors.province.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Select
              value={selectedCity}
              onValueChange={(value) => {
                setSelectedCity(value);
                setValue('city', value);
              }}
              disabled={!selectedState}
            >
              <SelectTrigger id="city">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {cities.map((city) => (
                  <SelectItem key={`${city.name}-${city.stateCode}`} value={city.name}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.city && (
              <p className="text-sm text-destructive">{errors.city.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="addressLine1">
            Address line 1 (Street address or post office box)
          </Label>
          <Input id="addressLine1" {...register('addressLine1')} />
          {errors.addressLine1 && (
            <p className="text-sm text-destructive">{errors.addressLine1.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="addressLine2">Address line 2 (Optional)</Label>
          <Input id="addressLine2" {...register('addressLine2')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">
            {values.country === 'United States' ? 'Zip Code' : 'Postal Code'}
          </Label>
          <Input
            id="postalCode"
            type={values.country === 'United States' ? 'number' : 'text'}
            {...register('postalCode', {
              onChange: (e) => {
                const postalCode = e.target.value.toString();
                setValue('postalCode', postalCode);
                if (countryCode && postalCode) {
                  validatePostalCodeField(postalCode, values.country);
                }
              },
            })}
          />
          {errors.postalCode && (
            <p className="text-sm text-destructive">{errors.postalCode.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Continue'}
      </Button>
    </form>
  );
}
