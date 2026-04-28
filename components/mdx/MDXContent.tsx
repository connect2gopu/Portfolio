import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxOptions } from "@/lib/mdx";

interface MDXContentProps {
  source: string;
}

export async function MDXContent({ source }: MDXContentProps) {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <MDXRemote source={source} options={mdxOptions} />
    </div>
  );
}
