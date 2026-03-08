import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "export",
	...(process.env.BASE_PATH && { basePath: process.env.BASE_PATH }),
	images: { unoptimized: true },
};

export default withMDX(nextConfig);
