import { Metadata } from "next";
import { getServerSession } from "next-auth";
// import { getSession } from "next-auth/react";
type OpenGraphType = "article" | "website" | "book" | "profile" | "music.song" | "music.album" | "music.playlist" | "music.radio_station" | "video.movie" | "video.episode" | "video.tv_show" | "video.other";

import { PrismaClient } from '@prisma/client'
export const prisma = new PrismaClient()

import LoopsClient from "loops";
export const loops = new LoopsClient(process.env.LOOPS_API_KEY!);

const isDev = process.env.NODE_ENV === "development";
export const baseUrl = isDev ? "http://localhost:3008" : "https://screenlink.io";


export function constructMetadata({
    title = 'ScreenLink - Open Source Loom Alternative',
    description = "ScreenLink is an open-source Loom alternative that allows you to record and share your screen with ease using our desktop app.",
    type = "website",
}: Partial<{
    title: string,
    description: string,
    type: OpenGraphType,
}>): Metadata {

    return {
        title,
        description,
        openGraph: {
            description,
            siteName: "ScreenLink",
            type,
            // TODO: Add images
            // images: [
            //     {
            //         url: "https://screenlink.app/images/og-image.png",
            //         width: 1200,
            //         height: 630,
            //         alt: "ScreenLink",
            //     },
            // ],
        },
        robots: {
            follow: true,
            index: true,
        },
    }

}

import { PostHog } from 'posthog-node';
import { authOptions } from "./api/auth/[...nextauth]/AuthOptions";

export const posthog_serverside = new PostHog(
    process.env.NEXT_PUBLIC_POSTHOG_KEY!,
    { host: process.env.NEXT_PUBLIC_POSTHOG_HOST },
);

export const getSearchParams = (url: string) => {
    // Create a params object
    let params = {} as Record<string, string>;

    new URL(url).searchParams.forEach(function (val, key) {
        params[key] = val;
    });

    return params;
};

export interface Session {
    user: {
        email: string;
        id: string;
        name: string;
        image?: string;
    };
}

interface WithSessionHandler {
    ({
        req,
        params,
        searchParams,
        session,
    }: {
        req: Request;
        params: Record<string, string>;
        searchParams: Record<string, string>;
        session: Session;
    }): Promise<Response>;
}

export const getSession = async () => {
    const session = await getServerSession(authOptions) as Session;
    if(!session?.user) return { user: null } as unknown as Session;
    return session;
};

export const withSession =
    (handler: WithSessionHandler) =>
        async (req: Request, { params }: { params: Record<string, string> }) => {
            const session = await getSession();
            if (!session?.user || !session?.user.id) {
                return new Response("Unauthorized: Login required.", { status: 401 });
            }

            const searchParams = getSearchParams(req.url);
            return handler({ req, params, searchParams, session });
        };

export function getOS(): string {
    if (typeof window === "undefined") return "Unknown";
    const userAgent = window.navigator.userAgent,
        macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"],
        windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"];
    let os = "Unknown";

    if (macosPlatforms.some((platform) => userAgent.includes(platform))) {
        os = "macOS";
    } else if (
        windowsPlatforms.some((platform) => userAgent.includes(platform))
    ) {
        os = "Windows";
    } else if (/Linux/.test(userAgent)) {
        os = "Linux";
    }

    return os;
}

export const TRANSACTIONAL_EMAIL_FIRST_UPLOAD_TEMPLATE_ID = "clqf2tv3800zze3b0y0odpo0b";

export const toUpperCamelCase = (input: string): string => {
    return input.charAt(0).toUpperCase() + input.slice(1);
}

export const getAvatarFallbackInitials = (name: string): string => {
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  }