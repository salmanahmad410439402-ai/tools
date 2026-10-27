import { ChevronDown } from "lucide-react";
import type { ToolFaq } from "@/lib/tool-types";

/**
 * Native <details> accordion: the answers are in the HTML for crawlers and the
 * component stays keyboard-operable without JavaScript.
 */
export function Faq({
  items,
  id = "faq",
  heading = "Frequently asked questions",
  headingLevel = 2,
}: {
  items: ToolFaq[];
  id?: string;
  heading?: string;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-14 scroll-mt-24">
      <Heading id={`${id}-title`} className="text-[22px] font-bold tracking-tight text-ink sm:text-2xl">
        {heading}
      </Heading>
      <div className="mt-4 divide-y divide-line overflow-hidden glass-panel">
        {items.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 text-[15.5px] font-semibold text-ink transition-colors hover:bg-surface marker:hidden [&::-webkit-details-marker]:hidden">
              <span>{item.q}</span>
              <ChevronDown
                className="mt-0.5 h-5 w-5 shrink-0 text-subtle transition-transform duration-200 group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="px-5 pb-5 text-[15px] leading-relaxed text-body">{item.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
