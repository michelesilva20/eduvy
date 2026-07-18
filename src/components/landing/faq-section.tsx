import { faqItems } from "@/data/landing";
import { SectionHeading } from "@/components/shared/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQSection() {
  return (
    <section
      id="faq"
      className="bg-background-light py-20 md:py-28"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-3xl px-4 md:px-6 lg:px-8">
        <SectionHeading
          id="faq-heading"
          title="Perguntas frequentes"
          description="Respostas diretas sobre a proposta, os módulos e os diferentes contextos de uso."
        />

        <Accordion
          type="single"
          collapsible
          className="mt-12"
        >
          {faqItems.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
