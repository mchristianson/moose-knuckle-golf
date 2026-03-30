import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moose Knuckle Golf League",
    short_name: "MK Golf",
    icons: [
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    theme_color: "#1B4D2E",
    background_color: "#ffffff",
    display: "standalone",
  };
}
