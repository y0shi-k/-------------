import { NextResponse } from "next/server";
import { fetchYoutubeThumbnailImage } from "@/lib/photos/recipe-image-upload";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const videoId = url.searchParams.get("videoId") ?? "";
  const result = await fetchYoutubeThumbnailImage(videoId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return new Response(result.blob, {
    headers: {
      "cache-control": "public, max-age=86400",
      "content-length": String(result.blob.size),
      "content-type": result.contentType
    }
  });
}
