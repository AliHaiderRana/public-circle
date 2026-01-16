import axios, { endpoints } from '@/lib/api';
import { toast } from 'sonner';

// ----------------------------------------------------------------------

export async function sendEmailVerification(params: {
  emailAddress: string;
  receiveEmailsFromPublicCircles?: boolean;
  region?: string;
}) {
  try {
    const response = await axios.post('/auth/send-verification-email', params);
    return response;
  } catch (error: any) {
    console.error('Error sending email verification:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to send verification email');
    throw error;
  }
}

export async function resendEmailVerification() {
  try {
    const response = await axios.post('/auth/resend-verification-email');
    return response;
  } catch (error: any) {
    console.error('Error resending email verification:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to resend verification email');
    throw error;
  }
}

export async function verifyEmailCode(params: { verificationCode: string }) {
  try {
    const response = await axios.post('/auth/verify-email-code', params);
    return response;
  } catch (error: any) {
    console.error('Error verifying email code:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Invalid verification code');
    throw error;
  }
}

export async function registerUser(params: { password: string }) {
  try {
    const response = await axios.post(endpoints.auth.signUp, params);
    return response;
  } catch (error: any) {
    console.error('Error registering user:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to register');
    throw error;
  }
}

export async function updateUser(params: any) {
  try {
    const response = await axios.patch('/users/me', params);
    return response;
  } catch (error: any) {
    console.error('Error updating user:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to update user');
    throw error;
  }
}

export async function verifyReferalCode(params: { referralCode: string }) {
  try {
    const response = await axios.post('/auth/verify-referral-code', params);
    return response;
  } catch (error: any) {
    console.error('Error verifying referral code:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Invalid referral code');
    throw error;
  }
}

export async function getSubscriptionPlans() {
  try {
    const response = await axios.get('/subscription/plans');
    return response;
  } catch (error: any) {
    console.error('Error fetching subscription plans:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to fetch plans');
    throw error;
  }
}

export async function createPaymentIntent(params: any) {
  try {
    const response = await axios.post('/subscription/create-payment-intent', params);
    return response;
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to create payment');
    throw error;
  }
}

export async function activateCompany() {
  try {
    const response = await axios.post('/users/activate-company');
    return response;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.errorMessage || error?.message || 'Failed to activate company';
    toast.error(errorMessage);
    console.error('Error activating company:', error);
    throw error;
  }
}

export async function addOrUpdateCompanyLogo(formData: FormData) {
  try {
    const response = await axios.post('/users/company-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error: any) {
    console.error('Error uploading company logo:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to upload company logo');
    throw error;
  }
}

export async function deleteCompanyLogoApi() {
  try {
    const response = await axios.delete('/users/delete-company-logo');
    return response;
  } catch (error: any) {
    console.error('Error deleting company logo:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to delete company logo');
    throw error;
  }
}

export async function changeCompanyStatus(params: { status: string }) {
  try {
    const response = await axios.post('/users/company-status', params);
    return response;
  } catch (error: any) {
    console.error('Error changing company status:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to change company status');
    throw error;
  }
}
