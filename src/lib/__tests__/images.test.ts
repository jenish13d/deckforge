import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { findPhoto, searchPhotos } from "../images";

const pexels = {
  photos: [
    {
      url: "https://www.pexels.com/photo/pizza-123/",
      photographer: "Ana Silva",
      alt: "Pizza in a wood oven",
      src: { large: "https://images.pexels.com/photos/123/l.jpeg", large2x: "https://images.pexels.com/photos/123/l2x.jpeg", medium: "https://images.pexels.com/photos/123/m.jpeg" },
    },
  ],
};

describe("Pexels photos", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("is off without an API key", async () => {
    vi.stubEnv("PEXELS_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await findPhoto("pizza")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("searches landscape photos with the key and maps credits", async () => {
    vi.stubEnv("PEXELS_API_KEY", "px-key");
    const fetchMock = vi.fn(async () => Response.json(pexels));
    vi.stubGlobal("fetch", fetchMock);

    const [photo] = await searchPhotos("pizza oven");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("query=pizza+oven");
    expect(url).toContain("orientation=landscape");
    expect((init.headers as Record<string, string>).Authorization).toBe("px-key");
    expect(photo).toMatchObject({ url: pexels.photos[0].src.large2x, credit: "Ana Silva", creditUrl: pexels.photos[0].url });

    expect(await findPhoto("pizza")).toEqual({
      url: pexels.photos[0].src.large2x,
      alt: "Pizza in a wood oven",
      credit: "Ana Silva",
      creditUrl: pexels.photos[0].url,
    });
  });

  it("returns nothing when Pexels fails", async () => {
    vi.stubEnv("PEXELS_API_KEY", "px-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 500 })));
    expect(await findPhoto("pizza")).toBeNull();
  });
});
