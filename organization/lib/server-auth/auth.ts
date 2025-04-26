import { cookies } from "next/headers";
import { IUser } from "@/types/user";

interface Session {
  user: IUser | null;
  organizationId?: string;
}

export async function auth(organizationId?: string): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("org_token");

    if (!token) {
      return { user: null };
    }

    // Include the organizationId in the fetch URL if provided
    const url = organizationId
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me?organizationId=${organizationId}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`;

    const response = await fetch(url, {
      headers: {
        Cookie: `org_token=${token.value}`,
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      return { user: null };
    }

    const data = await response.json();
    return {
      user: data.data as IUser,
      organizationId,
    };
  } catch (error) {
    console.error("Organization auth error:", error);
    return { user: null };
  }
}

export async function getOrganizationSession(
  organizationId: string
): Promise<Session | null> {
  return auth(organizationId);
}
