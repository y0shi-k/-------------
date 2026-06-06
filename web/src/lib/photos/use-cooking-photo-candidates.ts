"use client";

import { useEffect, useState } from "react";
import { createUserImageSignedUrl, type SignedUrlCapableClient } from "@/lib/photos/user-image";

export type CookingPhotoCandidate = {
  byteSize: number | null;
  contentType: string | null;
  createdAt: string;
  height: number | null;
  id: string;
  signedUrl: string | null;
  storagePath: string;
  width: number | null;
};

type CookingPhotoCandidateRow = {
  byte_size: number | null;
  content_type: string | null;
  created_at: string;
  height: number | null;
  id: string;
  storage_path: string;
  width: number | null;
};

export type CookingPhotoCandidateClient = SignedUrlCapableClient & {
  from: (table: "photos") => {
    select: (columns: string) => {
      eq: (column: "user_id" | "usage_type", value: string) => {
        eq: (column: "user_id" | "usage_type", value: string) => {
          order: (column: "created_at", options: { ascending: boolean }) => PromiseLike<{
            data: CookingPhotoCandidateRow[] | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
};

export async function fetchCookingPhotoCandidateRows(client: CookingPhotoCandidateClient, userId: string) {
  const { data, error } = await client
    .from("photos")
    .select("id,storage_path,content_type,byte_size,width,height,created_at")
    .eq("user_id", userId)
    .eq("usage_type", "cooking_history")
    .order("created_at", { ascending: false });

  if (error) {
    return { ok: false as const, error: "原因: 過去の完成写真を取得できませんでした。影響: 候補一覧を表示できません。修正方法: ログイン状態と通信を確認してください。" };
  }

  return { ok: true as const, rows: data ?? [] };
}

export function useCookingPhotoCandidates(client: CookingPhotoCandidateClient, userId: string) {
  const [candidates, setCandidates] = useState<CookingPhotoCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    async function load() {
      const result = await fetchCookingPhotoCandidateRows(client, userId);
      if (!active) return;
      if (!result.ok) {
        setCandidates([]);
        setError(result.error);
        setLoading(false);
        return;
      }

      const resolved = await Promise.all(
        result.rows.map(async (row) => ({
          byteSize: row.byte_size,
          contentType: row.content_type,
          createdAt: row.created_at,
          height: row.height,
          id: row.id,
          signedUrl: await createUserImageSignedUrl(client, row.storage_path),
          storagePath: row.storage_path,
          width: row.width
        }))
      );
      if (!active) return;
      setCandidates(resolved);
      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [client, userId]);

  return { candidates, error, loading };
}
