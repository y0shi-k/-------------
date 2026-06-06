import { describe, expect, it, vi } from "vitest";
import { fetchCookingPhotoCandidateRows, type CookingPhotoCandidateClient } from "@/lib/photos/use-cooking-photo-candidates";

const USER_ID = "11111111-1111-1111-1111-111111111111";

function makeClient() {
  const order = vi.fn(async () => ({
    data: [
      {
        id: "photo-new",
        storage_path: `${USER_ID}/cooking-history/new.jpg`,
        content_type: "image/jpeg",
        byte_size: 200,
        width: 1200,
        height: 900,
        created_at: "2026-06-02T00:00:00.000Z"
      },
      {
        id: "photo-orphan",
        storage_path: `${USER_ID}/cooking-history/orphan.jpg`,
        content_type: "image/jpeg",
        byte_size: 100,
        width: 800,
        height: 600,
        created_at: "2026-06-01T00:00:00.000Z"
      }
    ],
    error: null
  }));
  const usageEq = vi.fn(() => ({ order }));
  const userEq = vi.fn(() => ({ eq: usageEq }));
  const select = vi.fn(() => ({ eq: userEq }));
  const from = vi.fn(() => ({ select }));
  const client = {
    from,
    storage: {
      from: () => ({
        createSignedUrl: async () => ({ data: null })
      })
    }
  } as unknown as CookingPhotoCandidateClient;

  return { client, from, order, select, usageEq, userEq };
}

describe("fetchCookingPhotoCandidateRows", () => {
  it("本人の cooking_history 写真だけを新しい順で取得する", async () => {
    const { client, from, order, select, usageEq, userEq } = makeClient();
    const result = await fetchCookingPhotoCandidateRows(client, USER_ID);

    expect(result.ok).toBe(true);
    expect(from).toHaveBeenCalledWith("photos");
    expect(select).toHaveBeenCalledWith("id,storage_path,content_type,byte_size,width,height,created_at");
    expect(userEq).toHaveBeenCalledWith("user_id", USER_ID);
    expect(usageEq).toHaveBeenCalledWith("usage_type", "cooking_history");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    if (result.ok) {
      expect(result.rows.map((row) => row.id)).toEqual(["photo-new", "photo-orphan"]);
    }
  });
});
