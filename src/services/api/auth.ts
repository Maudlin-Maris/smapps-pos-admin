/**
 * Real API Auth Service Hooks
 * Provides SWR mutations for authentication operations.
 */

import { useToast } from "@/hooks/use-toast";
import { LoginResponse, User } from "@/lib/types/login-response";
import { useApiMutation } from "./api-hooks";
import { API_ENDPOINTS } from "./endpoints";

export const useLogin = () => {
  const { toast } = useToast();
  return useApiMutation<{ email: string; password: string }, LoginResponse>(
    API_ENDPOINTS.LOGIN,
    "POST",
    undefined,
    {
      throwOnError: false,
      onError(err) {
        toast({
          title: "Failed to login",
          description: err.response?.data.message ?? "Please try again later",
        });
      },
    },
  );
};

export const useResetPassword = () => {
  const { toast } = useToast();
  return useApiMutation<{ email: string }, { message: string; newPassword?: string }>(
    "/api/auth/reset-password",
    "POST",
    undefined,
    {
      throwOnError: false,
      onError(err) {
        toast({
          title: "Failed to reset password",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
    },
  );
};

export const useChangePassword = () => {
  const { toast } = useToast();
  return useApiMutation<{ userId: string; currentPassword: string; newPassword: string }, void>(
    "/api/auth/change-password",
    "POST",
    undefined,
    {
      throwOnError: false,
      onError(err) {
        toast({
          title: "Failed to change password",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
    },
  );
};

export const useUpdateProfile = (userId: string | undefined) => {
  const { toast } = useToast();
  return useApiMutation<Partial<User>, User>(
    userId ? `/api/users/${userId}/profile` : null,
    "PATCH",
    undefined,
    {
      throwOnError: false,
      onError(err) {
        toast({
          title: "Failed to update profile",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
    },
  );
};
