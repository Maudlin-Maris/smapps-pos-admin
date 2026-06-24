import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const createUrlWithParams = (
  pathname: string,
  params?:
    | Record<string, string | number | boolean | undefined>
    | URLSearchParams,
) => {
  if (Object.keys(params ?? {}).length === 0) return pathname;

  const searchParams = new URLSearchParams(
    Object.fromEntries(
      Object.entries(
        params instanceof URLSearchParams
          ? Object.fromEntries(params.entries())
          : params,
      )
        ?.filter(
          ([, value]) => value !== undefined && value !== null && value !== "",
        )
        ?.map(([key, value]) => [key, (value as string)?.toString()]),
    ),
  );

  return `${pathname}${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;
};
