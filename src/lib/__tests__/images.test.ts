import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { findPhoto, searchPhotos, wikimediaSized } from "../images";

const pexels = {
  photos: [
    {
      url: "https://www.pexels.com/photo/pizza-123/",
      photographer: "Ana Silva",
      alt: "Pizza in a wood oven",
      src: { large2x: "https://images.pexels.com/photos/123/l2x.jpeg", medium: "https://images.pexels.com/photos/123/m.jpeg" },
    },
  ],
};

const openverse = {
  results: [
    {
      url: "https://live.staticflickr.com/3880/15116779547_c46acfb39d_b.jpg",
      thumbnail: "https://api.openverse.org/v1/images/8bb3/thumb/",
      title: "Pizza Oven 2",
      creator: "daryl_mitchell",
      license: "by",
      license_version: "2.0",
      foreign_landing_url: "https://www.flickr.com/photos/49169223@N00/15116779547",
      width: 1024,
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Pizza-oven.jpg",
      thumbnail: "https://api.openverse.org/v1/images/f58f/thumb/",
      title: null,
      creator: null,
      license: "cc0",
      license_version: "1.0",
      foreign_landing_url: "https://commons.wikimedia.org/w/index.php?curid=358898",
      width: 1600,
    },
  ],
};

describe("photos", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("is off with PHOTOS=off", async () => {
    vi.stubEnv("PHOTOS", "off");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await findPhoto("pizza")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses Openverse without a key: commercial-use licenses, Flickr/Wikimedia only, credited", async () => {
    vi.stubEnv("PEXELS_API_KEY", "");
    const fetchMock = vi.fn(async () => Response.json(openverse));
    vi.stubGlobal("fetch", fetchMock);

    const [flickr, wiki] = await searchPhotos("pizza oven");
    const url = new URL(String((fetchMock.mock.calls[0] as unknown[])[0]));
    expect(url.hostname).toBe("api.openverse.org");
    expect(url.searchParams.get("license")).toBe("by,cc0,pdm");
    expect(url.searchParams.get("source")).toBe("flickr,wikimedia");
    expect(flickr).toMatchObject({ url: openverse.results[0].url, credit: "daryl_mitchell (CC BY 2.0)", creditUrl: openverse.results[0].foreign_landing_url });
    expect(wiki.credit).toBe("CC0");
    expect(wiki.alt).toBe("pizza oven");
    expect(wiki.url).toBe("https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Pizza-oven.jpg/1280px-Pizza-oven.jpg");
  });

  it("uses Pexels when a key is set", async () => {
    vi.stubEnv("PEXELS_API_KEY", "px-key");
    const fetchMock = vi.fn(async () => Response.json(pexels));
    vi.stubGlobal("fetch", fetchMock);
    expect(await findPhoto("pizza")).toEqual({
      url: pexels.photos[0].src.large2x,
      alt: "Pizza in a wood oven",
      credit: "Ana Silva / Pexels",
      creditUrl: pexels.photos[0].url,
    });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("px-key");
  });

  it("returns nothing when the search fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 500 })));
    expect(await findPhoto("pizza")).toBeNull();
  });

  it("only resizes large Wikimedia originals", () => {
    const small = "https://upload.wikimedia.org/wikipedia/commons/b/bc/x.jpg";
    expect(wikimediaSized(small, 800)).toBe(small);
    expect(wikimediaSized("https://live.staticflickr.com/1/2_b.jpg", 4000)).toBe("https://live.staticflickr.com/1/2_b.jpg");
  });
});
