import { PrismaClient, Upload, User } from "@prisma/client";
import Player, { ErrorBanner } from "../Player";
import { Metadata } from "next";
import Mux, { Upload as MuxUpload } from "@mux/mux-node";
import { posthog_serverside } from "@/app/utils";
import { ViewHeader } from "./ViewHeader";
const { Video } = new Mux(
  process.env.MUX_ACCESS_TOKEN!,
  process.env.MUX_SECRET_KEY!
);

export type UserUpload = Upload & {
  User: User | null;
};

export const generateMetadata = async ({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> => {
  const { id } = params;
  const prisma = new PrismaClient();
  const upload = await prisma.upload.findUnique({ where: { id } });

  posthog_serverside.capture({
    // distinctId: upload?.uploadId!,
    distinctId: upload?.userId!,
    event: "Video Metadata Viewed",
    properties: {
      ...upload,
    },
    groups: {
      projectId: upload?.projectId!,
    },
  });

  const title = upload?.sourceTitle ?? "ScreenLink Recording";
  const imageUrl = `https://image.mux.com/${upload?.playbackId}/thumbnail.png?width=1080&height=720&time=0`;
  return {
    title: `Watch ${title} | ScreenLink`,
    description: `Easily capture and share your screen with ScreenLink. Watch "${title}" now for a seamless viewing experience!`,
    openGraph: {
      images: [
        {
          url: imageUrl,
          width: 1080,
          height: 720,
          alt: title,
        },
      ],
      type: "video.movie",
    },
  };
};

const getUpload = async (uploadId: string): Promise<MuxUpload> => {
  try {
    const upload = await Video.Uploads.get(uploadId);
    return upload;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export default async function View({ params }: { params: { id: string } }) {
  const { id } = params;
  let errorMessage;
  const prisma = new PrismaClient();
  let upload = await prisma.upload.findUnique({
    where: { id },
    include: { User: true },
  });

  posthog_serverside.capture({
    distinctId: upload?.userId!,
    event: "Video Viewed",
    properties: {
      ...upload,
    },
    groups: {
      projectId: upload?.projectId!,
    },
  });

  // If there is no Asset ID, but there is an Upload ID, check Mux for the status of the upload
  if (!upload?.assetId && upload?.uploadId) {
    const muxUpload = await getUpload(upload.uploadId);
    if (muxUpload.status === "asset_created") {
      const video = await Video.Assets.get(muxUpload.asset_id!);
      const playbackId = video?.playback_ids?.[0]?.id;

      upload = await prisma.upload.update({
        where: { id },
        data: {
          status: "asset_created",
          assetId: muxUpload.asset_id,
          playbackId,
        },
        include: { User: true },
      });
    }
  }

  // Get the Mux video asset
  let muxVideo = null;
  try {
    muxVideo = upload?.assetId ? await Video.Assets.get(upload?.assetId) : null;
  } catch (error) {
    console.error("Error fetching Mux video asset:", error);
    errorMessage = "Video file not found. It may have been deleted.";
  }
  if (upload?.assetId && !errorMessage && (!upload || !muxVideo)) {
    console.log({ errorMessage, upload, muxVideo });
    errorMessage = "Video not found";
  }

  // Check if the video is ready
  const isReady = muxVideo?.status === "ready" ?? false;

  return (
    <section className="relative">
      <div className="relative max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {upload && <ViewHeader upload={upload} />}
          {errorMessage || !upload ? (
            <ErrorBanner
              message={errorMessage ?? "Video could not be loaded"}
            />
          ) : (
            <Player id={id} video={upload} isUploadReady={isReady} />
          )}
        </div>
      </div>
    </section>
  );
}
